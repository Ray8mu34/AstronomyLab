import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const arg=(n,d)=>process.argv.includes(n)?process.argv[process.argv.indexOf(n)+1]:d;
const base=arg('--base','http://127.0.0.1:4392'),out=arg('--out','build/qa/frontend-round2-20261019/optics-imaging/p0/performance');fs.mkdirSync(out,{recursive:true});
const {chromium}=createRequire(import.meta.url)(arg('--playwright',process.env.PLAYWRIGHT_MODULE||'playwright'));
const browser=await chromium.launch({executablePath:arg('--browser',process.env.BROWSER_EXECUTABLE),headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:out+'/raw',size:{width:1440,height:900}}}),page=await context.newPage(),errors=[],report={base,errors,steps:[],trimmed:false};
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(...a){if(this.canvas.matches('[data-image]')&&window.__dragFrames){if(a[0].width===257)this.canvas.__continuousDraw=a.slice(1);else window.__dragFrames.push({at:performance.now(),focal:window.__lab.state.focal,pixel:+document.querySelector('[data-key=pixel]').value,sky:+this.canvas.dataset.continuousWidth,continuous:this.canvas.__continuousDraw,detector:a.slice(1),count:a[0].width});}return draw.apply(this,a);};});
const q=s=>page.locator(s),wait=ms=>page.waitForTimeout(ms),ready=()=>page.waitForFunction(()=>window.__opticsUI?.imageGeometry&&document.querySelector('#lab-mount')?.dataset.experimentStateReady==='true');
const step=async name=>{report.steps.push({name,atMs:Date.now()-start,state:await page.evaluate(()=>({...window.__lab.state}))});};let start;
try{
 await page.goto(base+'/lab/optics?mode=sampling');await ready();await page.evaluate(()=>document.fonts.ready);start=Date.now();await wait(1200);await step('Default simultaneous view');
 report.raster=await page.evaluate(async()=>{
  const {doubleIntensity}=await import('/modules/optics-physics.mjs'),{psf:p,detector:d}=window.__opticsUI.imageData,c=document.querySelector('[data-image]'),g=window.__opticsUI.imageGeometry,span=g.continuous.half,peak=+c.dataset.intensityReference;
  const draw=CanvasRenderingContext2D.prototype.drawImage;let raster;
  CanvasRenderingContext2D.prototype.drawImage=function(...a){if(this.canvas===c&&a[0].width===257)raster={bytes:a[0].getContext('2d').getImageData(0,0,257,257).data,destination:a.slice(1)};return draw.apply(this,a);};
  c.dispatchEvent(new PointerEvent('pointerdown',{clientX:c.getBoundingClientRect().left+g.continuous.left+g.continuous.side/2,clientY:c.getBoundingClientRect().top+g.continuous.top+g.continuous.side/2,bubbles:true}));
  CanvasRenderingContext2D.prototype.drawImage=draw;let maxByteError=0,maxCoordinateError=0;
  for(let y=0;y<257;y++)for(let x=0;x<257;x++){const sx=-span+(x+.5)*2*span/257,sy=-span+(y+.5)*2*span/257,b=Math.round(255*Math.sqrt(Math.min(1,doubleIntensity(p,sx,sy,window.__lab.state.separation)/peak)));for(let k=0;k<3;k++)maxByteError=Math.max(maxByteError,Math.abs(raster.bytes[4*(y*257+x)+k]-b));maxCoordinateError=Math.max(maxCoordinateError,Math.abs(raster.destination[0]+(x+.5)/257*raster.destination[2]-(g.continuous.left+(sx+span)*g.continuous.pixelsPerArcsec)));}
  return{maxByteError,maxCoordinateError,samples:257**2,destination:raster.destination};
 });assert.equal(report.raster.maxByteError,0);assert(report.raster.maxCoordinateError<1e-10);
 await q('.sampling-presets>summary').click();await q('[data-preset=undersample]').click();await q('.sampling-presets>summary').click();await wait(1500);await step('Undersampled preset F400');
 await q('[data-key=focal]').focus();for(let i=0;i<8;i++){await page.keyboard.press('ArrowRight');await wait(180);}await wait(1200);assert.equal(await page.evaluate(()=>window.__lab.state.focal),800);await step('Focal doubled using native range keys');
 const slider=q('[data-key=focal]');await slider.scrollIntoViewIfNeeded();const box=await slider.boundingBox();await slider.evaluate(e=>{window.__dragEvents=[];window.__dragFrames=[];e.addEventListener('input',()=>window.__dragEvents.push({at:performance.now(),value:+e.value}));});
 await page.mouse.move(box.x+box.width*.08,box.y+box.height/2);await page.mouse.down();for(let i=1;i<=32;i++){await page.mouse.move(box.x+box.width*(.08+.8*i/32),box.y+box.height/2);await wait(16);}await page.mouse.up();await wait(300);
 report.drag=await page.evaluate(()=>({events:window.__dragEvents,frames:window.__dragFrames,model:window.__lab.state.focal,control:+document.querySelector('[data-key=focal]').value}));assert.equal(report.drag.model,report.drag.control);assert(report.drag.events.length>=15);assert(report.drag.frames.length>=15);
 for(const frame of report.drag.frames){const expected=(180*3600/Math.PI)*frame.pixel/1000/frame.focal*frame.continuous[2]/frame.sky,actual=frame.detector[2]/frame.count;assert(Math.abs(expected-actual)<1e-9);const event=report.drag.events.filter(e=>e.at<=frame.at&&e.value===frame.focal).at(-1);assert(event);frame.inputToDrawMs=frame.at-event.at;}
 const sorted=report.drag.frames.map(f=>f.inputToDrawMs).sort((a,b)=>a-b);report.drag.timing={median:sorted[Math.floor(sorted.length/2)],p95:sorted[Math.floor(sorted.length*.95)],max:sorted.at(-1)};await step('Continuous native pointer drag');
 await q('[data-sampling-inspect]').click();await q('[data-image]').press('ArrowRight');await wait(1000);await page.setViewportSize({width:390,height:844});await q('[data-sampling-view=continuous]').click();await wait(1000);await q('[data-sampling-view=detector]').click();await wait(1000);await q('[data-sampling-view=comparison]').click();await wait(1600);await step('Mobile same-point switching and simultaneous comparison');
 assert.deepEqual(errors,[]);report.status='passed';
}catch(e){report.status='failed';report.error=e.stack;process.exitCode=1;}finally{const video=page.video();await context.close();if(video)await video.saveAs(out+'/operations-uncut.webm');await browser.close();fs.writeFileSync(out+'/checks.json',JSON.stringify(report,null,2));}
console.log(JSON.stringify({status:report.status,raster:report.raster,drag:report.drag?.timing,errors,error:report.error},null,2));
