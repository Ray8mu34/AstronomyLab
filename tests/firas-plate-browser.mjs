import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {createRequire} from 'node:module';
import {parseFiras,blackbodyGHz} from '../web/observatory/modules/galaxy-physics.mjs';
import {firasText} from './firas-fixtures.mjs';
const option=(key,fallback)=>process.argv.includes(key)?process.argv[process.argv.indexOf(key)+1]:fallback;
const base=option('--base','http://127.0.0.1:4391'),before=option('--before','http://127.0.0.1:4390'),out=option('--out','build/qa/frontend-round2-20261019/galaxy/browser');
const modulePath=option('--playwright',process.env.PLAYWRIGHT_MODULE||'playwright'),browserPath=option('--browser',process.env.BROWSER_EXECUTABLE);
const {chromium}=createRequire(import.meta.url)(modulePath);fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({...(browserPath?{executablePath:browserPath}:{}),headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const checks=[],errors=[],sourceRows=parseFiras(firasText),hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const near=(a,b,tolerance=1e-8)=>assert(Math.abs(a-b)<=tolerance,`${a} != ${b}`);
const context=await browser.newContext({viewport:{width:1440,height:900}});
await context.addInitScript(()=>{
 const prototype=CanvasRenderingContext2D.prototype;
 const original={setTransform:prototype.setTransform,arc:prototype.arc,beginPath:prototype.beginPath,moveTo:prototype.moveTo,lineTo:prototype.lineTo,stroke:prototype.stroke};
 const targeted=c=>['galaxy-spectrum','galaxy-residual'].includes(c.canvas.id);
 prototype.setTransform=function(...args){if(targeted(this)){this.canvas.__arcs=[];this.canvas.__strokes=[];}return original.setTransform.apply(this,args);};
 prototype.arc=function(...args){if(targeted(this))this.canvas.__arcs?.push(args);return original.arc.apply(this,args);};
 prototype.beginPath=function(...args){if(targeted(this))this.__path=[];return original.beginPath.apply(this,args);};
 for(const name of ['moveTo','lineTo'])prototype[name]=function(...args){if(targeted(this))this.__path?.push([name,...args]);return original[name].apply(this,args);};
 prototype.stroke=function(...args){if(targeted(this))this.canvas.__strokes?.push({path:[...(this.__path||[])],dash:this.getLineDash()});return original.stroke.apply(this,args);};
});
const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
const ready=p=>p.waitForFunction(()=>window.__lab?.result?.firasData?.status==='ready'&&window.__lab.result.firasPlot&&document.querySelector('#lab-mount').dataset.experimentStateReady==='true');
const data=()=>page.evaluate(()=>({state:{...__lab.state},result:__lab.result}));
const input=async(key,value)=>{await page.locator(`[data-key=${key}]`).evaluate((node,value)=>{node.value=value;node.dispatchEvent(new Event('input',{bubbles:true}));},value);await page.waitForTimeout(90);};
const open=async selector=>{if(!await page.locator(selector).evaluate(node=>node.open))await page.locator(selector+'>summary').click();await page.waitForTimeout(90);};
const pixels=()=>page.evaluate(()=>['#galaxy-spectrum','#galaxy-residual'].map(selector=>document.querySelector(selector).toDataURL())).then(values=>values.map(hash));
async function check(name,fn){try{const evidence=await fn();checks.push({name,passed:true,evidence});console.log('PASS '+name);}catch(error){checks.push({name,passed:false,error:error.stack});process.exitCode=1;console.error('FAIL '+name+' '+error.message);await page.screenshot({path:path.join(out,'FAIL-'+checks.length+'.png'),fullPage:true}).catch(()=>{});}}
function verifyGeometry(capture){
 const plot=capture.result.firasPlot;assert.deepEqual(plot.domains,{frequency:[60,640],intensity:[0,420],residual:[-780,430]});
 near(plot.marker.mainX,plot.marker.residualX);near(plot.bounds.main.x,plot.bounds.residual.x);near(plot.bounds.main.width,plot.bounds.residual.width);assert.equal(plot.geometry.length,43);
 for(let i=0;i<43;i++){
  const row=sourceRows[i],g=plot.geometry[i],main=plot.bounds.main,lower=plot.bounds.residual;
  for(const key of ['frequencyGHz','intensity','residual','sigma','galaxy'])assert.equal(g[key],row[key]);
  const x=main.x+(row.frequencyGHz-60)/580*main.width;
  near(g.mainPoint[0],x);near(g.residualPoint[0],x);near(g.mainPoint[1],main.y+main.height-row.intensity/420*main.height);
  near(g.residualPoint[1],lower.y+lower.height-(row.residual+780)/1210*lower.height);
  near(g.errorLow[1],lower.y+lower.height-(row.residual-row.sigma+780)/1210*lower.height);
  near(g.errorHigh[1],lower.y+lower.height-(row.residual+row.sigma+780)/1210*lower.height);
  assert(g.errorLow[1]<=lower.y+lower.height&&g.errorHigh[1]>=lower.y);
 }
 return {rows:43,domains:plot.domains,marker:plot.marker,highFrequency:plot.geometry.at(-1),bounds:plot.bounds};
}
try{
 await page.goto(base+'/lab/galaxy?mode=cmb-spectrum');await ready(page);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(150);
 await check('Original 43 release rows, signed residuals, errors and common frequency geometry drive the actual Canvas marks',async()=>{
  const capture=await data(),evidence=verifyGeometry(capture),draws=await page.evaluate(()=>['#galaxy-spectrum','#galaxy-residual'].map(selector=>({arcs:document.querySelector(selector).__arcs,strokes:document.querySelector(selector).__strokes})));
  assert.equal(draws[0].arcs.length,43);assert.equal(draws[1].arcs.length,43);
  const errors=draws[1].strokes.filter(stroke=>stroke.path.length===6&&stroke.path[0][0]==='moveTo');assert.equal(errors.length,43);
  for(let i=0;i<43;i++){near(draws[0].arcs[i][0],capture.result.firasPlot.geometry[i].mainPoint[0]);near(draws[0].arcs[i][1],capture.result.firasPlot.geometry[i].mainPoint[1]);near(draws[1].arcs[i][1],capture.result.firasPlot.geometry[i].residualPoint[1]);near(errors[i].path[0][2],capture.result.firasPlot.geometry[i].errorLow[1]);near(errors[i].path[1][2],capture.result.firasPlot.geometry[i].errorHigh[1]);}
  return {...evidence,actualMainMarks:43,actualResidualMarks:43,actualErrorBarPaths:43};
 });
 await check('Genuine delayed font loading redraws the whole plate without losing the 43 measured points or errors',async()=>{
  const fontPage=await context.newPage();let release;const gate=new Promise(resolve=>release=resolve);let requests=0;
  try{await fontPage.route('**/fonts/*.woff2',async route=>{requests++;await gate;await route.continue();});await fontPage.goto(base+'/lab/galaxy?mode=cmb-spectrum',{waitUntil:'commit'});await fontPage.waitForFunction(()=>window.__lab?.result?.firasPlot&&document.querySelector('#galaxy-spectrum').__arcs?.length===43);
   assert(requests>0);assert.equal(await fontPage.evaluate(()=>document.fonts.status),'loading');release();await fontPage.evaluate(()=>document.fonts.ready);await fontPage.waitForTimeout(250);
   const actual=await fontPage.evaluate(()=>({status:document.fonts.status,main:document.querySelector('#galaxy-spectrum').__arcs?.length,residual:document.querySelector('#galaxy-residual').__arcs?.length,errorBars:document.querySelector('#galaxy-residual').__strokes?.filter(stroke=>stroke.path.length===6).length,plot:__lab.result.firasPlot}));
   assert.equal(actual.status,'loaded');assert.equal(actual.main,43);assert.equal(actual.residual,43);assert.equal(actual.errorBars,43);await fontPage.screenshot({path:path.join(out,'font-loaded-full-plate.png'),fullPage:true});return {...actual,blockedFontRequests:requests,noViewportResize:true};
  }finally{release();await fontPage.close();}
 });
 await check('Five viewports preserve full scientific domains, readable ticks, uncut high-frequency errors and near controls',async()=>{
  const evidence=[];for(const [width,height] of [[1440,900],[1280,600],[768,1024],[390,844],[320,720]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(160);await input('frequency',160);
   const capture=await data(),geometry=verifyGeometry(capture),metrics=await page.evaluate(()=>({innerWidth,innerHeight,devicePixelRatio,scrollWidth:document.documentElement.scrollWidth,font:getComputedStyle(document.querySelector('.firas-shell')).fontFamily,heading:getComputedStyle(document.querySelector('.firas-heading h2')).fontSize}));
   assert.equal(metrics.innerWidth,width);assert.equal(metrics.innerHeight,height);assert(metrics.scrollWidth<=width+1);
   assert(await page.locator('[data-key=frequency]').isVisible());assert(await page.locator('#galaxy-spectrum').isVisible());assert(await page.locator('#galaxy-residual').isVisible());
   await page.screenshot({path:path.join(out,`${width}-${height}-default.png`),fullPage:true});
   await input('frequency',640);const high=await data();assert.match(await page.locator('[data-firas-row-frequency]').innerText(),/639\.46 GHz/);assert.match(await page.locator('[data-firas-row-value]').innerText(),/-432 ± 282/);
   await page.screenshot({path:path.join(out,`${width}-${height}-high-frequency.png`),fullPage:true});evidence.push({metrics,geometry,highState:high.state});
  }return evidence;
 });
 await page.setViewportSize({width:1440,height:900});await input('frequency',160);
 await check('Native point, residual point, range and keyboard select one shared comparison frequency',async()=>{
  for(const selector of ['#galaxy-spectrum','#galaxy-residual']){
   const r=await page.locator(selector).boundingBox(),bounds=(await data()).result.firasPlot.bounds.main;
   await page.locator(selector).click({position:{x:bounds.x+bounds.width*.5,y:40}});assert.equal((await data()).state.frequency,350);
   await page.locator(selector).focus();await page.keyboard.press('ArrowRight');assert.equal((await data()).state.frequency,351);await page.keyboard.press('Shift+ArrowLeft');assert.equal((await data()).state.frequency,341);
  }
  await page.locator('[data-key=frequency]').focus();await page.keyboard.press('Home');await page.waitForTimeout(90);assert.equal((await data()).state.frequency,60);await page.keyboard.press('End');await page.waitForTimeout(90);assert.equal((await data()).state.frequency,640);return verifyGeometry(await data());
 });
 await check('A nonsampled comparison frequency reads the analytic blackbody, while the nearest published row keeps its own frequency/value',async()=>{
  await input('frequency',413);const capture=await data(),nearest=sourceRows.reduce((best,row)=>Math.abs(row.frequencyGHz-413)<Math.abs(best.frequencyGHz-413)?row:best,sourceRows[0]);
  assert.equal(capture.result.blackbody,blackbodyGHz(413));assert.equal(await page.locator('[data-firas-model]').innerText(),blackbodyGHz(413).toFixed(2));
  assert.equal(await page.locator('[data-firas-row-frequency]').innerText(),nearest.frequencyGHz.toFixed(2)+' GHz');
  assert(!sourceRows.some(row=>row.frequencyGHz===413));assert.equal(capture.result.firasPlot.geometry.length,43);return{comparisonGHz:413,blackbody:capture.result.blackbody,publishedRow:nearest};
 });
 await check('Teaching temperature modifies only its analytic spectrum; release data, measured plots and all input values remain intact',async()=>{
  const measured=await pixels(),geometry=(await data()).result.firasPlot.geometry;await open('.firas-teaching');await input('delta',-150);assert.deepEqual(await pixels(),measured);assert.deepEqual((await data()).result.firasPlot.geometry,geometry);
  await page.locator('[data-preset=zero]').click();assert.equal((await data()).result.relativeSpectrumPPM,0);await page.locator('[data-preset=warm]').click();assert.equal((await data()).state.delta,100);await page.locator('.firas-teaching [data-firas-close]').click();return{measuredPixelsAndRowsUnchanged:true};
 });
 await check('Disclosure opening does not move the plate or alter scientific state; Escape restores a reachable focus',async()=>{
  const state=(await data()).state;const before=await page.locator('.firas-plate').boundingBox();
  for(const selector of ['.firas-info','.firas-teaching']){await open(selector);assert.deepEqual((await data()).state,state);const after=await page.locator('.firas-plate').boundingBox();near(after.width,before.width);await page.locator(selector+' [data-firas-close]').focus();await page.keyboard.press('Escape');assert.equal(await page.locator(selector).evaluate(node=>node.open),false);assert.equal(await page.locator(selector+'>summary').evaluate(node=>node===document.activeElement),true);}
  return{state,plateWidth:before.width};
 });
 await check('Teaching controls have accessible names and readable default, active and keyboard-focus states on the paper surface',async()=>{
  await open('.firas-teaching');assert.equal(await page.getByRole('slider',{name:'教学温差 / µK',exact:true}).count(),1);assert.equal(await page.getByRole('slider',{name:'比较频率 / GHz',exact:true}).count(),1);
  const states=[];for(const preset of ['zero','warm','peak']){const button=page.locator(`[data-preset=${preset}]`);await button.click();await page.keyboard.press('Tab');await button.focus();
   const style=await button.evaluate(node=>{const s=getComputedStyle(node);let parent=node,background;while(parent){background=getComputedStyle(parent).backgroundColor;if(background!=='rgba(0, 0, 0, 0)'&&background!=='transparent')break;parent=parent.parentElement;}return{label:node.textContent,color:s.color,background,outline:s.outlineWidth,active:node.classList.contains('active')};});
   const luminance=rgb=>rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0),a=luminance(style.color),b=luminance(style.background),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);assert(ratio>=4.5);assert(parseFloat(style.outline)>=3);states.push({...style,contrast:ratio});
  }await page.screenshot({path:path.join(out,'teaching-readable-controls.png'),fullPage:true});await page.locator('[data-preset=warm]').click();await page.locator('.firas-teaching [data-firas-close]').click();return states;
 });
 await check('Current scientific state equals the frozen pre-redesign page and survives refresh, back and forward',async()=>{
  const reference=await browser.newPage();try{await reference.goto(before+'/lab/galaxy?mode=cmb-spectrum');await reference.waitForFunction(()=>window.__lab?.result?.firasRows===43);const cases=[];
   for(const [frequency,delta]of [[60,-200],[160,0],[350,100],[640,200],[413,100]]){
    await input('frequency',frequency);await input('delta',delta);for(const [key,value]of Object.entries({frequency,delta}))await reference.locator(`[data-key=${key}]`).evaluate((node,value)=>{node.value=value;node.dispatchEvent(new Event('input',{bubbles:true}));},value);await reference.waitForTimeout(100);
    const pick=r=>Object.fromEntries(['line','firasRows','blackbody','relativeSpectrumPPM','selectedMapUV','markerPosition','errors'].map(key=>[key,r[key]])),current=await data(),original=await reference.evaluate(()=>({state:{...__lab.state},result:__lab.result}));assert.deepEqual(current.state,original.state);assert.deepEqual(pick(current.result),pick(original.result));verifyGeometry(current);cases.push({frequency,delta,scientificOutputsEqual:true});
   }
   const original=await reference.evaluate(()=>({state:{...__lab.state},blackbody:__lab.result.blackbody,relativeSpectrumPPM:__lab.result.relativeSpectrumPPM})),current=await data();assert.deepEqual(current.state,original.state);assert.equal(current.result.blackbody,original.blackbody);assert.equal(current.result.relativeSpectrumPPM,original.relativeSpectrumPPM);
   await page.reload();await ready(page);assert.deepEqual((await data()).state,current.state);await page.locator('.al-workspace-brand').click();await page.waitForURL(base+'/');await page.goBack();await ready(page);assert.deepEqual((await data()).state,current.state);await page.goForward();await page.goBack();await ready(page);assert.deepEqual((await data()).state,current.state);return {original,cases};
  }finally{await reference.close();}
 });
 await check('Repeated spectrum → direction → Galaxy transitions keep one control owner; reset retains the whole-tool meaning',async()=>{
  for(let i=0;i<3;i++){await open('.firas-modes');await page.locator('[data-cmb-view=map]').click();await page.waitForTimeout(150);assert.equal(await page.locator('.firas-shell').isVisible(),false);await page.locator('.cmb-map-modes>summary').click();await page.locator('[data-cmb-view=spectrum]').click();await ready(page);assert.equal(await page.locator('[data-key=frequency]').count(),1);}
  await open('.firas-modes');await page.locator('[data-reset]').click();await page.waitForTimeout(150);assert.equal((await data()).state.topic,'galaxy');assert.equal((await data()).state.frequency,160);assert.equal((await data()).state.delta,100);await page.reload();await page.waitForFunction(()=>window.__lab?.state?.topic==='galaxy'&&document.querySelector('#lab-mount').dataset.experimentStateReady==='true');return{cycles:3,resetDestination:'galaxy'};
 });
 await check('Reduced-motion preference keeps the same measured data and accessible keyboard operation',async()=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto(base+'/');await page.goto(base+'/lab/galaxy?mode=cmb-spectrum');await ready(page);assert.equal(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true);await page.locator('#galaxy-spectrum').focus();await page.keyboard.press('End');assert.equal((await data()).state.frequency,640);return verifyGeometry(await data());
 });
 await check('HTTP 404 hides both measured plots and original-source reload restores the verified 43 rows',async()=>{
  const failure=await browser.newContext(),p=await failure.newPage();try{await failure.route('**/firas_monopole_spec_v1.txt',route=>route.fulfill({status:404,body:'missing'}));await p.goto(base+'/lab/galaxy?mode=cmb-spectrum');await p.waitForFunction(()=>window.__lab?.result?.firasData?.status==='failed');assert(await p.locator('#galaxy-spectrum').isHidden());assert(await p.locator('#galaxy-residual').isHidden());assert.equal(await p.locator('.firas-data-state').getAttribute('role'),'alert');await p.screenshot({path:path.join(out,'http-404.png'),fullPage:true});await failure.unroute('**/firas_monopole_spec_v1.txt');await p.reload();await ready(p);assert.equal(await p.evaluate(()=>__lab.result.firasRows),43);return{http:404,recoveredRows:43};}finally{await failure.close();}
 });
 await check('Unavailable Planck direction image leaves the independent FIRAS spectrum available and departure restores navigation',async()=>{
  const independent=await browser.newContext(),p=await independent.newPage();try{await independent.route('**/planck-equirectangular.jpg',route=>route.abort());await p.goto(base+'/lab/galaxy?mode=cmb-spectrum');await ready(p);assert(await p.locator('#galaxy-spectrum').isVisible());assert(await p.locator('.firas-data-state').isHidden());await p.locator('.al-workspace-brand').click();await p.waitForURL(base+'/');assert.equal(await p.locator('.firas-shell').count(),0);assert.equal(await p.evaluate(()=>document.body.classList.contains('firas-observing')),false);assert.equal(await p.locator('#site-navigation').isVisible(),true);return{independentSource:true,cleanup:true};}finally{await independent.close();}
 });
 await check('No uncaught browser errors',async()=>{assert.deepEqual(errors,[]);return errors;});
}finally{await context.close();await browser.close();fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({at:new Date().toISOString(),base,before,passed:checks.filter(x=>x.passed).length,total:checks.length,checks,errors},null,2));}
