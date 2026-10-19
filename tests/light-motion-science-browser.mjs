import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';

const arg=(k,d)=>process.argv.includes(k)?process.argv[process.argv.indexOf(k)+1]:d;
const base=arg('--base','http://127.0.0.1:4419'),out=path.resolve(arg('--out','build/qa/science-round1-20261019/E/browser'));
const modulePath=arg('--playwright',process.env.PLAYWRIGHT_MODULE_PATH||'playwright'),executablePath=arg('--browser',process.env.PLAYWRIGHT_BROWSER_PATH);
const beforeSource=arg('--before-source',null),sourceFile='web/observatory/modules/light.js';
const {chromium}=createRequire(import.meta.url)(modulePath);
fs.mkdirSync(out,{recursive:true});
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const browser=await chromium.launch({...(executablePath?{executablePath}:{}),headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const cases=[['stationary',0],['receding',150],['approaching',-150]],records=[],errors=[];
async function capture(stage,vr,width=1440){
 const context=await browser.newContext({viewport:{width,height:width===1440?900:844},reducedMotion:'reduce'});
 if(stage==='before')await context.route('**/modules/light.js',r=>r.fulfill({status:200,contentType:'text/javascript',body:fs.readFileSync(beforeSource,'utf8')}));
 await context.addInitScript(()=>{
  const proto=CanvasRenderingContext2D.prototype,fillRect=proto.fillRect,fillText=proto.fillText;
  window.__motionRecording={rects:[],labels:[]};
  proto.fillRect=function(x,y,w,h){if(this.canvas.id==='light-aux'){if(w>5&&h>5)window.__motionRecording={rects:[],labels:[]};else window.__motionRecording.rects.push({x,y,w,h,color:this.fillStyle});}return fillRect.call(this,x,y,w,h);};
  proto.fillText=function(text,x,y,...rest){if(this.canvas.id==='light-aux')window.__motionRecording.labels.push({text,x,y});return fillText.call(this,text,x,y,...rest);};
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'/lab/light?mode=motion');
  await page.waitForFunction(()=>window.__lab?.state?.mode==='motion'&&document.querySelector('#lab-mount')?.classList.contains('motion-active'));
  // Enter through visible disclosures and real native controls.
  await page.locator('.motion-info>summary').click();await page.locator('.light-auxiliary>summary').click();
  for(const[k,v]of Object.entries({veq:120,vr}))await page.locator(`[data-key=${k}]`).evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},v);
  await page.locator('[data-key=vr]').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(160);
  const observation=await page.evaluate(()=>{
   const c=document.querySelector('#light-aux'),w=c.clientWidth,h=c.clientHeight,r=Math.min(h*.34,w*.24),cx=w*.5,cy=h*.5,ctx=c.getContext('2d');
   const rects=window.__motionRecording.rects,targets=[-.5,.02,.5];
   const samples=targets.map(xOverR=>{const p=rects.reduce((a,b)=>Math.hypot(b.x-(cx+xOverR*r),b.y-cy)<Math.hypot(a.x-(cx+xOverR*r),a.y-cy)?b:a);const rgba=[...ctx.getImageData(Math.floor((p.x+1)*c.width/w),Math.floor((p.y+1)*c.height/h),1,1).data];return{...p,xOverR:(p.x-cx)/r,rgba};});
   return{state:{...window.__lab.state},profile:window.__lab.result,canvas:{w,h,r,cx,cy,width:c.width,height:c.height},recording:window.__motionRecording,samples,ariaLabel:c.getAttribute('aria-label'),legend:document.querySelector('[data-motion-velocity]')?.textContent||null,overflow:document.documentElement.scrollWidth>innerWidth};
  });
  const projected=120*Math.sin(observation.state.inclination*Math.PI/180);
  // Native Canvas canonicalizes integer rgb() styles to #rrggbb in Edge.
  const decodeColor=color=>color.startsWith('#')?[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)):color.match(/\d+/g).map(Number);
  const wrong=observation.recording.rects.filter(p=>{const[red,,blue]=decodeColor(p.color),los=vr+(p.x-observation.canvas.cx)/observation.canvas.r*projected;return los>1e-10?blue>red:los< -1e-10?red>blue:red!==blue;});
  observation.samples=observation.samples.map(p=>({...p,expectedLOSKmS:vr+p.xOverR*projected}));
  const evidence={stage,vr,width,range:[vr-projected,vr+projected],wrongColorCount:wrong.length,coloredBlocks:observation.recording.rects.length,profileSHA256:hash(JSON.stringify(observation.profile)),...observation};
  fs.writeFileSync(path.join(out,`${stage}-${width}-vr${vr}.json`),JSON.stringify(evidence,null,2)+'\n');
  if(stage==='after'){
   assert.equal(wrong.length,0);assert(observation.recording.rects.length>1000);
   assert(Math.abs(observation.profile.centre-656.28*(1+vr/299792.458))<1e-12);
   assert.equal(observation.profile.vmax,120);assert.equal(observation.overflow,false);
   assert(observation.legend.includes('相对观测者'));assert(observation.legend.includes('−500 至 +500 km/s'));
   assert(observation.ariaLabel.includes('总视向速度'));assert(observation.ariaLabel.includes('负为接近'));
   for(const sample of observation.samples){const[red,,blue]=sample.rgba;assert(sample.expectedLOSKmS>0?red>=blue:blue>=red,'Actual Canvas pixel must agree with independent LOS sign');}
   const labels=observation.recording.labels.map(p=>p.text).join(' ');for(const v of[vr-projected,vr,vr+projected])assert(labels.includes(`${v>0?'+':''}${v.toFixed(1)} km/s`));
  }
  await page.locator('#light-aux').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(out,`${stage}-${width}-vr${vr}.png`),fullPage:true});
  await page.locator('#light-aux').screenshot({path:path.join(out,`${stage}-${width}-vr${vr}-canvas.png`)});
  fs.writeFileSync(path.join(out,`${stage}-${width}-vr${vr}.json`),JSON.stringify(evidence,null,2)+'\n');
  records.push({stage,vr,width,range:evidence.range,wrongColorCount:wrong.length,coloredBlocks:evidence.coloredBlocks,profileSHA256:evidence.profileSHA256,samples:evidence.samples,labels:evidence.recording.labels});
  return evidence;
 }finally{await context.close();}
}
async function siblings(stage){
 const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();
 if(stage==='before')await context.route('**/modules/light.js',r=>r.fulfill({status:200,contentType:'text/javascript',body:fs.readFileSync(beforeSource,'utf8')}));
 const evidence=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'/lab/light?mode=motion');await page.waitForFunction(()=>window.__lab?.state?.mode==='motion'&&document.querySelector('#lab-mount')?.classList.contains('motion-active'));
  for(const[from,to]of[['motion','thermal'],['thermal','magnitude'],['magnitude','observing'],['observing','motion']]){
   await page.locator(`.${from}-modes>summary`).click();await page.locator(`[data-mode=${to}]`).click();await page.waitForTimeout(120);
   assert.equal(await page.evaluate(()=>window.__lab.state.mode),to);assert.equal(await page.locator('[data-key=vr]').count(),to==='motion'?1:0);
   if(stage==='after'){assert.equal(await page.locator('[data-motion-velocity]').count(),1);assert.equal(await page.locator('[data-motion-velocity]').evaluate(e=>e.hidden),to!=='motion');}
   if(to!=='motion')evidence.push(await page.evaluate(()=>({mode:window.__lab.state.mode,state:{...window.__lab.state},result:window.__lab.result,plots:['#light-plot','#light-aux'].map(s=>{const c=document.querySelector(s);return{id:c.id,w:c.width,h:c.height,image:c.toDataURL()};}),auxLabel:document.querySelector('#light-aux').getAttribute('aria-label')})));
  }
  return evidence;
 }finally{await context.close();}
}
try{
 for(const[,vr]of cases){const before=beforeSource?await capture('before',vr):null,after=await capture('after',vr);if(before)assert.deepEqual(after.profile,before.profile,'Correct main spectrum must remain exactly unchanged');}
 await capture('after',150,390);
 const siblingAfter=await siblings('after'),siblingBefore=beforeSource?await siblings('before'):null;
 if(siblingBefore)assert.deepEqual(siblingAfter,siblingBefore,'Sibling model state, dimensions, Canvas pixels and accessible name must remain exact after visible mode round trips');
 fs.writeFileSync(path.join(out,'mode-round-trips.json'),JSON.stringify({comparedWithBefore:!!siblingBefore,exact:!!siblingBefore,modes:siblingAfter.map(s=>({mode:s.mode,plots:s.plots.map(p=>({id:p.id,w:p.w,h:p.h,imageSHA256:hash(p.image)}))})),uniqueLegendAndNativeControls:true},null,2)+'\n');
 assert.deepEqual(errors,[]);
}catch(e){process.exitCode=1;errors.push(e.stack);console.error(e.stack);}
finally{
 fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({base,executedCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),executedAtUTC:new Date().toISOString(),nodeVersion:process.version,sourceSHA256:hash(fs.readFileSync(sourceFile)),physicsSHA256:hash(fs.readFileSync('web/observatory/modules/light-physics.mjs')),browserVersion:browser.version(),environment:'Headless Edge; software SwiftShader; desktop and simulated 390px viewport, not physical hardware',beforeSource,records,errors,passed:errors.length===0},null,2)+'\n');
 await browser.close();
}
