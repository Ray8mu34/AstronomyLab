import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const arg=(key,fallback)=>process.argv.includes(key)?process.argv[process.argv.indexOf(key)+1]:fallback;
const base=arg('--base','http://127.0.0.1:4392'),out=arg('--out','build/qa/frontend-round2-20261019/galaxy/recording');
const {chromium}=createRequire(import.meta.url)(arg('--playwright',process.env.PLAYWRIGHT_MODULE||'playwright')),executablePath=arg('--browser',process.env.BROWSER_EXECUTABLE);
fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({...(executablePath?{executablePath}:{}),headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const reports=[];const url=base+'/lab/galaxy?mode=cmb-spectrum';
try{for(const [name,width,height] of [['desktop',1440,900],['mobile',390,844]]){
 const context=await browser.newContext({viewport:{width,height},recordVideo:{dir:out,size:{width,height}}}),page=await context.newPage(),video=page.video(),steps=[],errors=[],performanceRuns=[];
 page.on('pageerror',error=>errors.push(error.message));
 await context.addInitScript(()=>{
  window.__firasPerf={inputToPaint:[],events:[],layoutShift:0,longTasks:[]};
  addEventListener('input',event=>{if(!event.target.matches('[data-key=frequency],[data-key=delta]'))return;const start=performance.now();requestAnimationFrame(()=>requestAnimationFrame(()=>window.__firasPerf.inputToPaint.push(performance.now()-start)));},true);
  for(const type of ['event','longtask','layout-shift'])try{new PerformanceObserver(list=>{for(const entry of list.getEntries())if(type==='event')window.__firasPerf.events.push({name:entry.name,duration:entry.duration});else if(type==='longtask')window.__firasPerf.longTasks.push(entry.duration);else if(!entry.hadRecentInput)window.__firasPerf.layoutShift+=entry.value;}).observe({type,buffered:true,...(type==='event'?{durationThreshold:16}:{})});}catch{}
 });
 const wait=()=>page.waitForTimeout(350),ready=()=>page.waitForFunction(()=>window.__lab?.result?.firasData?.status==='ready'&&window.__lab.result.firasPlot&&document.querySelector('#lab-mount').dataset.experimentStateReady==='true');
 const step=async label=>{await wait();steps.push({label,at:new Date().toISOString(),state:await page.evaluate(()=>({...__lab.state})),result:await page.evaluate(()=>({rows:__lab.result.firasRows,blackbody:__lab.result.blackbody,relativeSpectrumPPM:__lab.result.relativeSpectrumPPM,marker:__lab.result.firasPlot?.marker}))});};
 try{
  await page.goto(url);await ready();await page.evaluate(()=>document.fonts.ready);await step('Default 160 GHz, independent teaching temperature 100 µK');
  const canvas=page.locator('#galaxy-spectrum');await canvas.scrollIntoViewIfNeeded();const rect=await canvas.boundingBox();await page.mouse.click(rect.x+rect.width*.65,rect.y+rect.height*.4);await step('Select comparison frequency on main spectrum');
  await canvas.focus();for(let i=0;i<5;i++)await page.keyboard.press('ArrowRight');await page.keyboard.press('Shift+ArrowLeft');await step('Keyboard 1 GHz and 10 GHz movements');
  await canvas.focus();await page.keyboard.press('End');await step('High-frequency tail 640 GHz; actual release row remains 639.46 GHz');assert.equal(await page.locator('[data-firas-row-value]').innerText(),'-432 ± 282');
  const range=page.locator('[data-key=frequency]');await range.scrollIntoViewIfNeeded();const r=await range.boundingBox();await page.mouse.move(r.x+r.width-8,r.y+r.height/2);await page.mouse.down();await page.mouse.move(r.x+8,r.y+r.height/2,{steps:40});await page.mouse.up();await step('Continuous native range movement');
  await page.locator('.firas-teaching>summary').click();const delta=page.locator('[data-key=delta]');await delta.focus();await page.keyboard.press('Home');await step('Independent teaching ΔT −200 µK');await page.keyboard.press('End');await step('Independent teaching ΔT +200 µK');await page.locator('[data-preset=zero]').click();await step('Zero teaching temperature preset');assert.equal(await page.evaluate(()=>__lab.result.relativeSpectrumPPM),0);
  await page.locator('.firas-teaching [data-firas-close]').focus();await page.keyboard.press('Escape');assert.equal(await page.locator('.firas-teaching>summary').evaluate(node=>node===document.activeElement),true);await step('Escape closes teaching and returns focus');
  await page.locator('.firas-info>summary').click();await page.locator('[data-firas-residual-summary]').scrollIntoViewIfNeeded();await step('Read physical units, source and signed high-frequency residual');await page.locator('.firas-info [data-firas-close]').click();
  performanceRuns.push(await page.evaluate(()=>window.__firasPerf));await page.reload();await ready();await step('Reload retains the operated scientific state');
  const pattern='**/firas_monopole_spec_v1.txt';await context.route(pattern,route=>route.fulfill({status:404,body:'unavailable'}));await page.reload();await page.waitForFunction(()=>window.__lab?.result?.firasData?.status==='failed');await page.locator('.firas-data-state').scrollIntoViewIfNeeded();assert(await page.locator('#galaxy-spectrum').isHidden());await step('Real HTTP 404 displays the unavailable state with both measured graphs hidden');
  await context.unroute(pattern);await page.reload();await ready();await step('Real source reload recovers the 43-row measured plate');
  await page.screenshot({path:path.join(out,name+'-recovered.png'),fullPage:true});
  performanceRuns.push(await page.evaluate(()=>window.__firasPerf));const performance={inputToPaint:performanceRuns.flatMap(run=>run.inputToPaint).sort((a,b)=>a-b),events:performanceRuns.flatMap(run=>run.events),layoutShift:performanceRuns.map(run=>run.layoutShift),longTasks:performanceRuns.flatMap(run=>run.longTasks)};performance.p95InputToPaint=performance.inputToPaint[Math.floor(performance.inputToPaint.length*.95)]??null;assert(performance.inputToPaint.length>20);
  assert.deepEqual(errors,[]);reports.push({name,viewport:{width,height},steps,performance,errors,softwareRendering:true});
 }finally{await context.close();await video.saveAs(path.join(out,name+'-complete-uncut.webm'));}
}}finally{await browser.close();fs.writeFileSync(path.join(out,'operations.json'),JSON.stringify({at:new Date().toISOString(),base,reports},null,2));}
