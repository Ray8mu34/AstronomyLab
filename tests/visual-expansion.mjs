import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/30674/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const arg=(name,fallback)=>process.argv.includes(name)?process.argv[process.argv.indexOf(name)+1]:fallback;
const base=arg('--base','http://127.0.0.1:4412'),out=path.resolve(arg('--out','build/qa/visual-expansion-20261028/integration'));
fs.mkdirSync(out,{recursive:true});
const groups={'galaxy-measurements':['distance','rotation','mass'],cosmology:['expansion','distance'],tides:['locking','earth-moon'],'planet-environments':['balance','atmosphere','escape'],lunisolar:['calendar','intercalation'],'image-calibration':['calibration','photometry'],'stellar-interior':['equilibrium','thermostat','transport'],'supernova-light':['diffusion','radioactivity']};
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const checks=[],errors=[];
async function check(name,fn){try{checks.push({name,state:'passed',evidence:await fn()});}catch(error){checks.push({name,state:'failed',error:String(error.stack)});}}
const ready=page=>page.waitForFunction(()=>document.querySelector('#lab-mount')?.dataset.experimentStateReady==='true'&&!document.querySelector('#app[aria-busy="true"]'));
const inspect=page=>page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,headings:[...document.querySelectorAll('h1')].filter(e=>e.getClientRects().length).map(e=>e.textContent),navigation:document.querySelectorAll('.al-workspace-navigation').length,canvases:[...document.querySelectorAll('#lab-mount canvas')].filter(e=>e.getClientRects().length).map(e=>({width:e.width,height:e.height,label:e.getAttribute('aria-label')})),unlabelled:[...document.querySelectorAll('#lab-mount input,#lab-mount select,#lab-mount button')].filter(e=>e.getClientRects().length&&!e.getAttribute('aria-label')&&!e.labels?.length&&!e.textContent.trim()).map(e=>e.outerHTML),brokenLabels:[...document.querySelectorAll('#lab-mount label')].filter(label=>{const input=label.querySelector('input,select');return input&&input.getClientRects().length&&label.control!==input;}).map(e=>e.outerHTML)}));
const snap=(page,slug)=>page.evaluate(async slug=>{const {captureExperiment}=await import('/shared/experiment-state.js');return captureExperiment(slug,document.querySelector('#lab-mount'));},slug);
try{
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:width===1440?960:844},hasTouch:width!==1440,reducedMotion:'reduce'}),page=await context.newPage();
  page.on('pageerror',error=>errors.push({width,url:page.url(),error:String(error)}));
  for(const [slug,modes]of Object.entries(groups))for(const mode of modes){
   await check(`${slug}/${mode} ${width}px layout`,async()=>{
    await page.goto(`${base}/lab/${slug}?mode=${mode}`);await ready(page);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(80);
    const record=await inspect(page);assert(record.scrollWidth<=width+1,JSON.stringify(record));assert.equal(record.navigation,1);assert.equal(record.headings.length,1);assert.equal(record.unlabelled.length,0,JSON.stringify(record.unlabelled));assert.equal(record.brokenLabels.length,0,JSON.stringify(record.brokenLabels));assert(record.canvases.length>0);assert(record.canvases.every(c=>c.width>0&&c.height>0&&c.label));
    assert.equal(await page.locator(`[data-mode="${mode}"]`).getAttribute('aria-pressed'),'true');
    await page.screenshot({path:path.join(out,`${slug}-${mode}-${width}.png`),fullPage:true});
    const details=page.locator('[data-learning-guide]');await details.locator(':scope > summary').focus();await page.keyboard.press('Enter');assert(await details.evaluate(e=>e.open));
    assert((await inspect(page)).scrollWidth<=width+1,'Expanded source overflow');
    await page.keyboard.press('Escape');assert.equal(await details.evaluate(e=>e.open),false);assert(await details.locator(':scope > summary').evaluate(e=>e===document.activeElement));
    return record;
   });
  }
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:1366,height:900}}),page=await context.newPage();page.on('pageerror',error=>errors.push({url:page.url(),error:String(error)}));
 for(const [slug,modes]of Object.entries(groups))for(const mode of modes){
  await check(`${slug}/${mode} keyboard, reload and history`,async()=>{
   await page.goto(base+'/');await page.goto(`${base}/lab/${slug}?mode=${mode}`);await ready(page);
   const control=page.locator('input[type="range"]:visible,select[data-key]:visible').first();await control.focus();const initial=await control.inputValue();
   const nextKey=await control.evaluate(e=>e.tagName==='SELECT'?(e.selectedIndex<e.options.length-1?'ArrowDown':'ArrowUp'):(Number(e.value)<Number(e.max)?'ArrowRight':'ArrowLeft'));
   await page.keyboard.press(nextKey);if(await control.evaluate(e=>e.tagName==='SELECT'))await page.keyboard.press('Enter');assert.notEqual(await control.inputValue(),initial);
   const before=await snap(page,slug);assert.equal(before.mode,mode);
   await page.reload();await ready(page);assert.deepEqual(await snap(page,slug),before,'Refresh changed scientific state');
   await page.locator('.al-workspace-brand').click();await page.waitForSelector('.home-catalogue');await page.goBack();await ready(page);assert.deepEqual(await snap(page,slug),before,'Back changed scientific state');
   await page.goForward();await page.waitForSelector('.home-catalogue');await page.goBack();await ready(page);assert.deepEqual(await snap(page,slug),before,'Forward/Back changed state');
   for(const sibling of modes){await page.locator(`[data-mode="${sibling}"]`).click();assert.equal(await page.locator(`[data-mode="${sibling}"]`).getAttribute('aria-pressed'),'true');assert.equal((await inspect(page)).navigation,1);}
   return before;
  });
 }
 await context.close();
}finally{
 await browser.close();fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({checks,errors,graphics:'Edge headless / SwiftShader; simulated viewports'},null,2));
 console.log(JSON.stringify({checks:checks.length,passed:checks.filter(c=>c.state==='passed').length,failures:checks.filter(c=>c.state==='failed'),errors}));
 if(checks.some(c=>c.state==='failed')||errors.length)process.exitCode=1;
}
