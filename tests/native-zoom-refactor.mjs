import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const hashFile=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const option=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
const base=option('--base','http://127.0.0.1:4182'),packageRoot=option('--package','dist/lab');
const zipFile=packageRoot+'.zip',manifestFile=path.join(packageRoot,'web/observatory/runtime-assets.json');
const startedAt=new Date().toISOString(),packageSHA256=fs.existsSync(zipFile)?hashFile(zipFile):null,runtimeManifestSHA256=hashFile(manifestFile);
const out=path.resolve(option('--out','build/qa/lab-refactor/native-zoom')),extension=path.join(out,'extension'),profile=path.join(out,'profile');fs.mkdirSync(extension,{recursive:true});
fs.writeFileSync(path.join(extension,'manifest.json'),JSON.stringify({manifest_version:3,name:'Local R1 zoom verification',version:'1.0',permissions:['tabs'],background:{service_worker:'worker.js'}}));
fs.writeFileSync(path.join(extension,'worker.js'),`chrome.tabs.onUpdated.addListener((id,change,tab)=>{if(change.status==='complete'&&tab.url?.startsWith(${JSON.stringify(base+'/')}))chrome.tabs.setZoom(id,2);});`);
const {chromium}=createRequire(import.meta.url)(option('--playwright',process.env.PLAYWRIGHT_MODULE||'playwright'));
const executablePath=option('--browser',process.env.BROWSER_EXECUTABLE);
const ctx=await chromium.launchPersistentContext(profile,{...(executablePath?{executablePath}:{}),headless:true,viewport:null,ignoreDefaultArgs:['--disable-extensions'],args:['--window-size=1366,768',`--disable-extensions-except=${extension}`,`--load-extension=${extension}`,'--use-angle=swiftshader','--enable-unsafe-swiftshader']});
// Await the isolated extension worker before the first navigation. Otherwise
// its startup can miss that tab's first complete event under browser load.
const zoomWorker=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');
await zoomWorker.evaluate(()=>chrome.tabs.query({}));
const page=await ctx.newPage(),checks=[],pageErrors=[],httpErrors=[];let failed;
page.on('pageerror',error=>pageErrors.push({url:page.url(),message:error.message}));
page.on('response',response=>{if(response.status()>=400)httpErrors.push({url:response.url(),status:response.status()});});
await page.addInitScript(()=>{window.__nativeZoomPerformance={events:[],longTasks:[]};for(const[type,key]of[['event','events'],['longtask','longTasks']])try{new PerformanceObserver(list=>{for(const e of list.getEntries())window.__nativeZoomPerformance[key].push({name:e.name,startTime:e.startTime,duration:e.duration,interactionId:e.interactionId,processingStart:e.processingStart,processingEnd:e.processingEnd});}).observe({type,buffered:true,...(type==='event'?{durationThreshold:16}:{})});}catch{}});
const routesFile=option('--routes-file',null),observeOnly=process.argv.includes('--observe-only');
const routes=routesFile?JSON.parse(fs.readFileSync(routesFile,'utf8')):[['home','/'],['moon','/labs/earth-moon/?mode=period'],['imaging','/lab/imaging?mode=real'],['solar','/labs/solar-system/?mode=compare'],['optics','/lab/optics?mode=resolution'],['measure','/lab/measure?mode=shadow']];
async function round2Actions(slug){
 const actions=[];
 const record=async name=>actions.push({name,state:await page.evaluate(()=>({orbit:window.earthMoon?.getState?.(),solar:window.solarApp?.state,state:window.__lab?.state,result:window.__lab?.result?.firasPlot,selection:window.__opticsUI?.imageGeometry?.selection})),focus:await page.evaluate(()=>{const e=document.activeElement,r=e?.getBoundingClientRect();return{id:e?.id,tag:e?.tagName,text:e?.textContent?.trim().slice(0,100),inViewport:!!r&&r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1};})});
 const arrow=async selector=>{const input=page.locator(selector).first();await input.scrollIntoViewIfNeeded();await input.focus();const before=await input.inputValue(),start=await page.evaluate(()=>performance.now());await page.keyboard.press('ArrowRight');const after=await input.inputValue();const afterPaint=await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(performance.now())))));assert.notEqual(after,before,selector+' native keyboard did not change value');await record(selector+' ArrowRight');actions.at(-1).inputToTwoFramesMs=afterPaint-start;assert(actions.at(-1).focus.inViewport,selector+' focused input outside zoomed viewport');};
 const disclosure=async(selector,close)=>{const summary=page.locator(selector).first();await summary.scrollIntoViewIfNeeded();await summary.click();if(close)await page.locator(close).first().click();else await page.keyboard.press('Escape');assert(await summary.evaluate(e=>!e.parentElement.open),'Disclosure did not close: '+selector);assert(await summary.evaluate(e=>document.activeElement===e),'Focus did not return: '+selector);await record(selector+' open/close/focus');};
 if(slug==='home'){await page.locator('.home-directory-jump').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'tools');await record('directory anchor');await page.locator('.home-invitation .al-action').click();await page.waitForSelector('#day');await page.goBack();await page.waitForSelector('.home-invitation');await record('primary entry and back');}
 if(slug==='phase'){
  await page.waitForSelector('#compare-entry');if(await page.evaluate(()=>window.earthMoon?.getState?.().playing))await page.locator('#play').click();
  await page.locator('#compare-entry').click();assert.equal(await page.locator('#compare-entry').getAttribute('aria-pressed'),'true');await record('geometry comparison');
  await page.locator('#condition-entry').click();await page.keyboard.press('Escape');assert(await page.locator('#condition-entry').evaluate(e=>document.activeElement===e));await record('conditions Escape focus');await arrow('#day');
 }
 if(slug==='sampling'){
  await page.waitForSelector('.sampling-shell');await arrow('[data-key="focal"]');
  for(const mode of ['detector','continuous','comparison']){const b=page.locator('[data-sampling-view="'+mode+'"]');if(await b.isVisible()){await b.click();await record('sampling view '+mode);}}
  const inspect=page.locator('[data-sampling-inspect]');if(await inspect.isVisible())await inspect.click();const image=page.locator('canvas[data-image]');await image.scrollIntoViewIfNeeded();await image.focus();const before=await page.evaluate(()=>JSON.stringify(window.__opticsUI.imageGeometry.selection));await page.keyboard.press('ArrowRight');assert.notEqual(await page.evaluate(()=>JSON.stringify(window.__opticsUI.imageGeometry.selection)),before,'Native zoom image inspection keyboard did not move selection');await record('sampling inspection ArrowRight');
  await disclosure('[data-parameters]>summary');
 }
 if(slug==='firas'){await page.waitForSelector('[data-key="frequency"]');await arrow('[data-key="frequency"]');await page.locator('details.firas-teaching > summary').click();await arrow('[data-key="delta"]');await page.locator('details.firas-teaching > summary').focus();await page.keyboard.press('Escape');assert(await page.locator('details.firas-teaching > summary').evaluate(e=>document.activeElement===e));await record('teaching Escape focus');await disclosure('details.firas-info > summary');}
 if(slug==='hr'){await page.waitForSelector('.hr-shell');await page.locator('[data-key="hrExample"]').focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');assert.equal(await page.evaluate(()=>window.__lab.state.hrExample),'cool');await record('cool HR object via native select keyboard');await page.locator('.hr-compare-menu>summary').click();await page.locator('[data-hr-compare="temperature"]').click();assert.equal(await page.evaluate(()=>window.__lab.state.hrCompare),'temperature');await record('fixed temperature A/B');await disclosure('.hr-info>summary');}
 if(slug.startsWith('solar-system-')&&slug!=='solar-system-compare'){
  // These modes primarily select planets; they do not require a range input.
  const earth=page.locator('#planet-buttons button[data-body="earth"]');await earth.scrollIntoViewIfNeeded();await earth.focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>window.solarApp.state.selected),'earth');await record('select Earth with native Enter');assert(actions.at(-1).focus.inViewport,'Planet control outside zoom viewport');
  const source=page.locator('#sources-open');await source.scrollIntoViewIfNeeded();await source.click();await page.locator('dialog[open]:visible').waitFor();await page.keyboard.press('Escape');assert(await source.evaluate(e=>document.activeElement===e));await record('actual source dialog Escape focus');
 }
 if(slug==='galaxy-galaxy'){
  await page.locator('.galaxy-space-views>summary').click();await page.locator('[data-view="inside"]:visible').click();assert.equal(await page.evaluate(()=>window.__lab.state.view),'inside');await record('actual inside view entry');await arrow('[data-key="longitude"]');await disclosure('.galaxy-space-info>summary');
 }
 if(slug==='galaxy-cmb'){
  const summary=page.locator('.cmb-map-conditions>summary');await summary.click();await arrow('[data-key="latitude"]');await page.keyboard.press('Escape');assert(await summary.evaluate(e=>!e.parentElement.open&&document.activeElement===e));await record('actual coordinate conditions/native range/Escape focus');await disclosure('.cmb-map-info>summary');
 }
 if(!actions.length){
  // Other migrated routes retain their authored controls. Verify one actual
  // native edit and one reachable disclosure at tab zoom; the owner task suites
  // separately exercise every scientific workflow and compare exact results.
  const controls=page.locator('input[type="range"]:visible,input[type="number"]:visible,select:visible');let edited=false;
  for(const control of await controls.all()){
   if(await control.isDisabled())continue;await control.scrollIntoViewIfNeeded();await control.focus();
   if(await control.evaluate(e=>e.tagName==='SELECT')){if(await control.locator('option').count()<2)continue;await page.keyboard.press('Home');const before=await control.inputValue();await page.keyboard.press('ArrowDown');assert.notEqual(await control.inputValue(),before);}
   else{await page.keyboard.press('Home');const before=await control.inputValue();await page.keyboard.press('ArrowRight');if(await control.inputValue()===before)await page.keyboard.press('ArrowUp');assert.notEqual(await control.inputValue(),before);}
   await record('authored native primary control keyboard edit');assert(actions.at(-1).focus.inViewport,'Edited control is outside native zoom viewport');edited=true;break;
  }
  assert(edited,'No reachable native scientific control in '+slug);
  for(const summary of await page.locator('details>summary:visible').all()){
   if(!/条件|来源|说明|读图|资料|关系/.test(await summary.innerText()))continue;
   await summary.scrollIntoViewIfNeeded();if(!await summary.evaluate(e=>e.parentElement.open))await summary.click();await summary.focus();await page.keyboard.press('Escape');
   assert(await summary.evaluate(e=>!e.parentElement.open&&document.activeElement===e),'Authored disclosure close/focus failed');await record('authored disclosure Escape focus');break;
  }
 }
 return actions;
}
try{for(const [slug,url]of routes){
 try{
 await page.goto(base+url,{waitUntil:'networkidle'});await page.waitForFunction(()=>devicePixelRatio===2);await page.waitForTimeout(300);
 const metrics=await page.evaluate(()=>({innerWidth,outerWidth,innerHeight,devicePixelRatio,scrollWidth:document.documentElement.scrollWidth,cssZoom:getComputedStyle(document.body).zoom}));assert.equal(metrics.cssZoom,'1');assert.equal(metrics.devicePixelRatio,2);
 const session=await ctx.newCDPSession(page),layout=await session.send('Page.getLayoutMetrics');
 const capture=await session.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:true,clip:{x:0,y:0,width:layout.contentSize.width,height:layout.contentSize.height,scale:1}});
 fs.writeFileSync(path.join(out,slug+'-200.png'),Buffer.from(capture.data,'base64'));
 const viewport=await session.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});fs.writeFileSync(path.join(out,slug+'-200-viewport.png'),Buffer.from(viewport.data,'base64'));
 await session.detach();
 const focus=[];for(let i=0;i<8;i++){await page.keyboard.press('Tab');focus.push(await page.evaluate(()=>{const e=document.activeElement,r=e?.getBoundingClientRect();return{tag:e?.tagName,name:e?.getAttribute('aria-label')||e?.textContent?.trim().slice(0,80),insideViewport:!!r&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight};}));}
 const actions=process.argv.includes('--round2-actions')?await round2Actions(slug):[];
 if(actions.length){const afterSession=await ctx.newCDPSession(page),afterLayout=await afterSession.send('Page.getLayoutMetrics');const afterCapture=await afterSession.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:true,clip:{x:0,y:0,width:afterLayout.contentSize.width,height:afterLayout.contentSize.height,scale:1}});fs.writeFileSync(path.join(out,slug+'-200-after-actions.png'),Buffer.from(afterCapture.data,'base64'));await afterSession.detach();}
 const afterMetrics=await page.evaluate(()=>({innerWidth,innerHeight,scrollWidth:document.documentElement.scrollWidth}));
 const overflow=metrics.scrollWidth>metrics.innerWidth+1||afterMetrics.scrollWidth>afterMetrics.innerWidth+1;if(overflow&&!observeOnly)failed='Native zoom overflow in '+slug;
 const interactionPerformance=await page.evaluate(()=>window.__nativeZoomPerformance);
 checks.push({slug,url,metrics,afterMetrics,focus,actions,interactionPerformance,performanceScope:'Event Timing samples and input-to-two-RAF observations; not field INP',state:overflow?'overflow-observed':'passed',visualReview:'pending',capture:{method:'CDP paint-coordinate contentSize; Playwright CSS-sized fullPage clips at native tab zoom',width:layout.contentSize.width,height:layout.contentSize.height,cssWidth:layout.cssContentSize.width,cssHeight:layout.cssContentSize.height}});
 }catch(e){const diagnostics=await page.evaluate(()=>{const n=document.activeElement,r=n?.getBoundingClientRect();return{focus:{tag:n?.tagName,id:n?.id,key:n?.dataset.key,rect:r?.toJSON(),outline:n?getComputedStyle(n).outline:null},scroll:{x:scrollX,y:scrollY},viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},state:window.__lab?.state};}).catch(()=>null);const session=await ctx.newCDPSession(page);const image=await session.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false}).catch(()=>null);if(image)fs.writeFileSync(path.join(out,slug+'-FAIL-viewport.png'),Buffer.from(image.data,'base64'));await session.detach();checks.push({slug,url,state:'failed',error:e.stack,diagnostics});failed=e.stack;}
 }}catch(e){failed=e.stack;}finally{await ctx.close();if((packageSHA256!==null&&hashFile(zipFile)!==packageSHA256)||hashFile(manifestFile)!==runtimeManifestSHA256)failed='Package changed during verification';if(pageErrors.length||httpErrors.length)failed||='Browser exceptions or HTTP errors during native zoom';fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({startedAt,checkedAt:new Date().toISOString(),packageRoot:path.resolve(packageRoot),packageSHA256,runtimeManifestSHA256,state:failed?'failed':'passed',observeOnly,method:'Isolated Edge extension chrome.tabs.setZoom(2), native DPR and CSS zoom checked separately; eight trusted Tab presses per route',checks,pageErrors,httpErrors,error:failed,realDevice:false,projection:false,humanAssistiveTechnology:false},null,2));}console.log(JSON.stringify({checks:checks.length,error:failed||null}));if(failed)process.exitCode=1;
