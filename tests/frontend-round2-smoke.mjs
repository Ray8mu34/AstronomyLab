// A short integration sweep for presentation-owner handoff. This is not a
// scientific oracle, an acceptance-task run or the final standalone regression.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {confirmedModes,experimentURL} from '../web/observatory/shared/tool-registry.js';
const option=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
const base=option('--base','http://127.0.0.1:4392'),out=path.resolve(option('--out','build/qa/frontend-round2-20261019/smoke'));
const modeFilter=option('--modes',null)?.split(',');
const {chromium}=createRequire(import.meta.url)(option('--playwright',process.env.PLAYWRIGHT_MODULE||'playwright')),executablePath=option('--browser',process.env.BROWSER_EXECUTABLE);
fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage(),checks=[],errors=[],responses=[],startedAt=new Date().toISOString();
page.on('pageerror',e=>errors.push({url:page.url(),message:e.message}));page.on('response',r=>{if(r.status()>=400)responses.push({url:r.url(),status:r.status()});});
const modeOf=slug=>page.evaluate(async slug=>(await import('/shared/experiment-state.js')).currentExperimentMode(slug,document),slug);
const ready=async slug=>{if(slug==='earth-moon')await page.waitForFunction(()=>window.earthMoon?.state?.ready,{timeout:30000});else await page.locator('[data-experiment-state-ready="true"]').first().waitFor({state:'attached',timeout:30000});};
const save=()=>fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({startedAt,updatedAt:new Date().toISOString(),base,command:process.argv,browser:browser.version(),viewport:{width:1280,height:800},scope:'43 current routes, same-module canonical mode-entry button clicks and exit cleanup. Mode entry uses programmatic existing button.click(); trusted user tasks and scientific/state budgets are separate.',state:checks.some(c=>c.state==='failed')||errors.length||responses.length?'failed':'observed',checks,errors,responses,finalAcceptance:false},null,2));
try{
 for(const[slug,allModes]of Object.entries(confirmedModes)){
  const modes=allModes.filter(mode=>!modeFilter||modeFilter.includes(slug+'/'+mode));if(!modes.length)continue;
  try{await page.goto(base+experimentURL(slug,modes[0]),{waitUntil:'networkidle'});await ready(slug);}catch(e){checks.push({slug,state:'failed',stage:'entry',error:e.stack});save();continue;}
  for(const mode of process.argv.includes('--exits-only')?[]:modes){
   try{
    if(await modeOf(slug)!==mode)await page.evaluate(async({slug,mode})=>{if(['earth-moon','solar-system','alignments'].includes(slug)){const b=document.querySelector(`[data-mode="${mode}"]`);if(!b)throw Error('Missing existing public mode button '+mode);b.click();}else(await import('/shared/mode-entry.js')).enterMode(slug,mode,document);},{slug,mode});
    await page.waitForTimeout(180);assert.equal(await modeOf(slug),mode);
    const observed=await page.evaluate(()=>{const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};return{url:location.href,title:document.title,layout:document.documentElement.dataset.alRouteLayout,surface:document.body.dataset.alSurface,visibleWorkspaceNavigations:[...document.querySelectorAll('.al-workspace-navigation')].filter(visible).length,presentationOwners:[...document.querySelectorAll('[data-presentation-owner]')].filter(visible).map(e=>({tag:e.tagName,owner:e.dataset.presentationOwner,surface:e.dataset.alSurface})),visuals:[...document.querySelectorAll('canvas,svg,#comparison-view,#axes-view')].filter(visible).map(c=>({tag:c.tagName,id:c.id,width:c.getBoundingClientRect().width,height:c.getBoundingClientRect().height})),scrollWidth:document.documentElement.scrollWidth,innerWidth};});
    assert(observed.visibleWorkspaceNavigations<=1,'Duplicate compact navigation');assert(observed.visuals.some(v=>v.width>=180&&v.height>=120),'No visible scientific canvas/SVG');assert(observed.scrollWidth<=observed.innerWidth+1,'Horizontal overflow');
    checks.push({slug,mode,state:'passed',...observed});console.log('PASS '+slug+'/'+mode);
   }catch(e){const screenshot=slug+'-'+mode+'-FAIL.png';await page.screenshot({path:path.join(out,screenshot),fullPage:true}).catch(()=>{});checks.push({slug,mode,state:'failed',error:e.stack,screenshot});console.error('FAIL '+slug+'/'+mode+' '+e.message);}
   save();
  }
  try{const timeOrigin=await page.evaluate(()=>performance.timeOrigin);await page.locator('a[href="/"]:visible').first().click();await page.waitForSelector('.home-opening');const cleanup=await page.evaluate(()=>({timeOrigin:performance.timeOrigin,workspace:document.querySelectorAll('.al-workspace-navigation').length,owners:document.querySelectorAll('[data-presentation-owner]').length,layout:document.documentElement.dataset.alRouteLayout,canvases:document.querySelectorAll('#app canvas').length}));if(!['solar-system','earth-moon'].includes(slug))assert.equal(cleanup.timeOrigin,timeOrigin,'Public module exit unexpectedly reloaded rather than disposing the SPA workspace');assert.equal(cleanup.workspace,0);assert.equal(cleanup.owners,0);assert.equal(cleanup.layout,'standard');assert.equal(cleanup.canvases,0);checks.push({slug,stage:'exit-home',state:'passed',method:'visible home anchor click; same-document timeOrigin checked for nine SPA tools',cleanup});}catch(e){checks.push({slug,stage:'exit-home',state:'failed',error:e.stack});}save();
 }
}finally{await browser.close();save();}
console.log(JSON.stringify({checks:checks.length,failed:checks.filter(c=>c.state==='failed').length,errors:errors.length,responses:responses.length}));if(checks.some(c=>c.state==='failed')||errors.length||responses.length)process.exitCode=1;
