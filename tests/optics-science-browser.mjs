import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import os from 'node:os';
const arg=(name,fallback)=>process.argv.includes(name)?process.argv[process.argv.indexOf(name)+1]:fallback;
const out=arg('--out','build/qa/science-round1-20261019/BC/browser'),base=arg('--base','http://127.0.0.1:4273'),baseline=process.argv.includes('--baseline');
fs.mkdirSync(out,{recursive:true});
const {chromium}=createRequire(import.meta.url)(arg('--playwright',process.env.PLAYWRIGHT_MODULE||'playwright'));
const browser=await chromium.launch({executablePath:arg('--browser',process.env.BROWSER_EXECUTABLE),headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:1000},recordVideo:{dir:out+'/video-raw',size:{width:1440,height:1000}}}),errors=[],report={baseline,base,device:{platform:os.platform(),cpu:os.cpus()[0]?.model,logicalCpus:os.cpus().length,browser:browser.version(),graphics:'Headless Edge / SwiftShader; not hardware acceptance'},cases:[],checks:[]};
if(arg('--physics-source'))await page.route('**/modules/optics-physics.mjs',r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync(arg('--physics-source'),'utf8')}));
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{
  const fill=CanvasRenderingContext2D.prototype.fillRect,draw=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.fillRect=function(...a){if(this.canvas.matches('[data-image]')&&a[0]===0&&a[1]===0)this.canvas.__draws=[];return fill.apply(this,a);};
  CanvasRenderingContext2D.prototype.drawImage=function(...a){if(this.canvas.matches('[data-image]')){
   this.canvas.__draws.push({source:[a[0].width,a[0].height],destination:a.slice(1),rgba:Array.from(a[0].getContext('2d').getImageData(0,0,a[0].width,a[0].height).data)});
   if(this.canvas.__draws.length===2&&window.__dragRenders){const geometry=window.__opticsUI?.imageGeometry?.detector;window.__dragRenders.push({at:performance.now(),focal:window.__lab.state.focal,pixelWidth:geometry?.pixelWidth,pixelsPerArcsec:geometry?.pixelsPerArcsec});}
  }return draw.apply(this,a);};
});
const ready=()=>page.waitForFunction(()=>window.__opticsUI&&document.querySelector('#lab-mount')?.dataset.experimentStateReady==='true');
const input=async(key,value)=>{await page.locator(`[data-key=${key}]`).evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},value);await page.waitForTimeout(80);};
try{
 await page.goto(base+'/lab/optics?mode=sampling');await ready();await page.waitForTimeout(200);
 for(const [k,v] of Object.entries({aperture:130,wavelength:550,seeing:.5,pixel:10,separation:1.4,focus:0}))await input(k,v);
 for(const focal of [400,800,1600]){
  await input('focal',focal);
  const c=await page.evaluate(async()=>{
   const state={...window.__lab.state},canvas=document.querySelector('[data-image]'),draws=canvas.__draws;
   const {psf,doubleIntensity}=await import('/modules/optics-physics.mjs'),p=psf(state),span=+canvas.dataset.continuousWidth/2,[raster]=draws;
   let peak=0,maxByteError=0;for(let i=0;i<=128;i++)peak=Math.max(peak,doubleIntensity(p,-span+i*2*span/128,0,state.separation));
   // ImageData samples represent the centres of destination texels, not their
   // outer edges. Compare the rendered source bytes with physical sky samples.
   for(let y=0;y<129;y++)for(let x=0;x<129;x++){
    const skyX=-span+(x+.5)*2*span/129,skyY=-span+(y+.5)*2*span/129,v=doubleIntensity(p,skyX,skyY,state.separation),b=Math.round(255*Math.sqrt(Math.min(1,v/(peak||1)))),expected=new Uint8ClampedArray([b*.82,b*.91,b,255]);
    for(let channel=0;channel<4;channel++)maxByteError=Math.max(maxByteError,Math.abs(raster.rgba[(y*129+x)*4+channel]-expected[channel]));
   }
   return {state,results:window.__lab.results,dataset:{...canvas.dataset},geometry:window.__opticsUI.imageGeometry,draws:draws.map(({rgba,...d})=>d),continuousRasterSampling:{maxByteError,firstCenterArcsec:-span+span/129,lastCenterArcsec:span-span/129,sourceSamples:129*129}};
  });
  report.cases.push(c);await page.locator('[data-image]').screenshot({path:`${out}/sampling-F${focal}.png`});
  if(!baseline){
   const g=c.geometry;assert.equal(+c.dataset.continuousWidth,+c.dataset.detectorWidth);
   assert.equal(c.continuousRasterSampling.maxByteError,0,'Continuous raster samples must lie at the physical destination pixel centres');
   assert.equal(g.continuous.half,g.detector.half);assert.equal(g.continuous.pixelsPerArcsec,g.detector.pixelsPerArcsec);
   const [continuous,detector]=c.draws;assert(Math.abs(continuous.destination[2]-g.continuous.side)<1e-10);
   assert(Math.abs(detector.destination[0]-g.detector.arrayLeft)<1e-10);
   assert(Math.abs(detector.destination[2]-g.detector.arraySide)<1e-10);
   assert(Math.abs(g.detector.pixelWidth-c.results.pixelScale*g.detector.pixelsPerArcsec)<1e-10);
   assert.equal(g.detector.pixelCount,c.results.pixelCount);
   assert(g.detector.arrayLeft<g.detector.left,'Boundary pixels extend beyond, then clip to the common sky window');
  }
 }
 if(!baseline){
  const first=report.cases[0].geometry;
  for(const c of report.cases){assert.deepEqual(c.geometry.continuous,first.continuous);assert.deepEqual(c.geometry.detector.starCenters,first.detector.starCenters);}
  assert.equal(report.cases[0].geometry.detector.pixelWidth/2,report.cases[1].geometry.detector.pixelWidth);
  assert.equal(report.cases[1].geometry.detector.pixelWidth/2,report.cases[2].geometry.detector.pixelWidth);
  report.checks.push('F400/800/1600: actual canvas draw rectangles use one sky transform, stars fixed, angular pixels halve');
 }
 report.modelTiming=await page.evaluate(async()=>{
  const {psf,detector}=await import('/modules/optics-physics.mjs'),base={type:'refractor',aperture:130,focal:1000,eyepiece:20,wavelength:550,seeing:.7,focus:0,pixel:4,sensor:22,separation:1.4,view:'camera'},all=[];
  for(const [id,changes] of [['default',{}],['narrow',{aperture:350,focal:400,seeing:0,pixel:6,separation:2}]]){
   const state={...base,...changes},samples=[];
   for(let k=0;k<55;k++){const t=performance.now(),p=psf(state),d=detector(p,state.separation,p.parameters.pixelScale),elapsed=performance.now()-t;if(k>=5)samples.push(elapsed);if(!Number.isFinite(d.totalFlux??d.values[0]))throw Error('Nonfinite flux');}
   samples.sort((a,b)=>a-b);all.push({id,method:'50 synchronous psf+detector runs after 5 warmups, browser performance.now',medianMs:samples[25],p95Ms:samples[47],maxMs:samples[49]});
  }return all;
 });
 // Native range pointer movement: no model assignment or synthetic input.
 await input('focal',400);const slider=page.locator('[data-key=focal]');await slider.scrollIntoViewIfNeeded();
 const box=await slider.boundingBox();await slider.evaluate(e=>{window.__dragEvents=[];window.__dragRenders=[];e.addEventListener('input',()=>{const event={at:performance.now(),value:+e.value};window.__dragEvents.push(event);requestAnimationFrame(()=>{event.nextFrameMs=performance.now()-event.at;});});});
 await page.mouse.move(box.x+box.width*.08,box.y+box.height/2);await page.mouse.down();
 const dragStart=Date.now();for(let k=1;k<=32;k++){await page.mouse.move(box.x+box.width*(.08+.8*k/32),box.y+box.height/2);await page.waitForTimeout(16);}
 await page.mouse.up();await page.waitForTimeout(150);
 report.drag={elapsedMs:Date.now()-dragStart,...await page.evaluate(()=>({events:window.__dragEvents,renders:window.__dragRenders,modelFocal:window.__lab.state.focal,controlFocal:+document.querySelector('[data-key=focal]').value,geometry:window.__opticsUI.imageGeometry}))};
 assert(report.drag.events.length>=15);assert.equal(report.drag.modelFocal,report.drag.controlFocal);assert(!errors.length);report.checks.push('Continuous native pointer drag updates model and canvas; no uncaught page errors');
 if(!baseline){assert(report.drag.renders.length>=15);for(const frame of report.drag.renders){
  const expected=(180*3600/Math.PI)*.010/frame.focal*frame.pixelsPerArcsec;
  assert(Math.abs(frame.pixelWidth-expected)<1e-9,'Every real draw frame must draw the angular pixel width for the focal length used in that draw');
  const event=report.drag.events.filter(e=>e.at<=frame.at&&e.value===frame.focal).at(-1);assert(event);frame.inputToDrawMs=frame.at-event.at;
 }
 report.checks.push('Every native-drag draw frame matches its model focal length and physical angular pixel width');
 }
 await page.screenshot({path:out+'/desktop-after-drag.png',fullPage:true});
 if(!baseline){
  for(const [width,height] of [[390,844],[320,720]]){await page.setViewportSize({width,height});await page.waitForTimeout(200);const g=await page.evaluate(()=>({geometry:window.__opticsUI.imageGeometry,overflow:document.documentElement.scrollWidth>innerWidth}));assert(!g.overflow);assert.equal(g.geometry.continuous.pixelsPerArcsec,g.geometry.detector.pixelsPerArcsec);await page.locator('[data-image]').screenshot({path:`${out}/sampling-${width}.png`});}
  report.checks.push('390px and 320px: stacked canvas keeps same angular scale, no horizontal overflow');
 }
}catch(e){report.failure=e.stack;process.exitCode=1;}finally{report.errors=errors;fs.writeFileSync(out+'/checks.json',JSON.stringify(report,null,2)+'\n');const video=page.video();await page.close();if(video)await video.saveAs(out+'/interaction.webm');await browser.close();}
console.log(JSON.stringify({out,checks:report.checks,timing:report.modelTiming,failure:report.failure},null,2));
