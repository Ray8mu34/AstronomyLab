import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {firasText,invalidFiras} from './firas-fixtures.mjs';
const arg=(key,fallback)=>process.argv.includes(key)?process.argv[process.argv.indexOf(key)+1]:fallback;
const base=arg('--base','http://127.0.0.1:4237'),out=arg('--out','build/qa/science-round1-20261019/F/browser');
const playwright=arg('--playwright',process.env.PLAYWRIGHT_MODULE||'playwright');
const executablePath=arg('--browser',process.env.BROWSER_EXECUTABLE);
const {chromium}=createRequire(import.meta.url)(playwright);fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({...(executablePath?{executablePath}:{}),headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const checks=[],browserErrors=[],url=base+'/lab/galaxy?mode=cmb-spectrum',routePattern='**/firas_monopole_spec_v1.txt';
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
async function create(){const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();page.on('pageerror',error=>browserErrors.push(error.message));return{context,page};}
async function ready(page){await page.waitForFunction(()=>window.__lab?.result?.firasData?.status==='ready'&&document.querySelector('.firas-active'));assert.equal(await page.locator('#galaxy-spectrum').isVisible(),true);assert.equal(await page.locator('#galaxy-residual').isVisible(),true);}
async function plotHashes(page){return page.evaluate(()=>['#galaxy-spectrum','#galaxy-residual'].map(selector=>document.querySelector(selector).toDataURL())).then(values=>values.map(hash));}
async function record(name,fn){try{const evidence=await fn();checks.push({name,passed:true,evidence});console.log('PASS '+name);}catch(error){checks.push({name,passed:false,error:error.stack});process.exitCode=1;console.error('FAIL '+name+' '+error.message);}}
try{
 await record('Official full v1 has 43 verified rows, measured residuals/uncertainties and model curve independence',async()=>{
  const {context,page}=await create();try{await page.goto(url);await ready(page);const result=await page.evaluate(()=>window.__lab.result);
   assert.equal(result.firasRows,43);assert.equal(result.firasData.rows,43);assert.equal(result.firasData.product.version,'v1');
   assert.match(await page.locator('[data-firas-identity]').innerText(),/43 个观测点/);assert.match(await page.locator('.firas-spectrum-figure figcaption').innerText(),/MJy sr/);
   assert.match(await page.locator('[data-firas-residual-summary]').textContent(),/-432 ± 282 kJy\/sr/);
   const before=await plotHashes(page);await page.locator('.firas-teaching>summary').click();await page.locator('[data-preset=zero]').click();
   assert.equal(await page.evaluate(()=>window.__lab.result.relativeSpectrumPPM),0);assert.deepEqual(await plotHashes(page),before);
   await page.screenshot({path:path.join(out,'official.png'),fullPage:true});return{firasRows:result.firasRows,product:result.firasData.product,measuredPlotHashes:before};
  }finally{await context.close();}
 });
 for(const [name,fault] of Object.entries(invalidFiras))await record('200 '+name+' fails before ready and original response reload recovers',async()=>{
  const {context,page}=await create();try{
   await context.route(routePattern,route=>route.fulfill({status:200,contentType:'text/plain',body:fault.text}));await page.goto(url);
   await page.waitForFunction(()=>window.__lab?.result?.firasData?.status==='failed'&&document.querySelector('.firas-active'));
   const result=await page.evaluate(()=>window.__lab.result);assert.equal(result.firasRows,0);assert.equal(result.firasData.product,null);assert.equal(result.firasData.error.code,fault.code);
   assert.equal(await page.locator('.firas-data-state').getAttribute('role'),'alert');assert.match(await page.locator('.firas-data-state').innerText(),/重新加载页面/);
   assert.equal(await page.locator('#galaxy-spectrum').isVisible(),false);assert.equal(await page.locator('#galaxy-residual').isVisible(),false);
   assert.doesNotMatch(await page.locator('[data-firas-identity]').innerText(),/43 行/);
   const blank=await page.locator('#galaxy-spectrum').evaluate(canvas=>!canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data.some(value=>value!==0));assert.equal(blank,true);
   await page.screenshot({path:path.join(out,name+'-failed.png'),fullPage:true});await context.unroute(routePattern);await page.reload();await ready(page);
   assert.equal(await page.evaluate(()=>window.__lab.result.firasRows),43);assert.equal(await page.locator('.firas-data-state').isVisible(),false);
   return{error:result.firasData.error,recoveredRows:43,blankWhileFailed:blank,recoveredPlotHashes:await plotHashes(page)};
  }finally{await context.close();}
 });
 await record('Pending stays blank, then real table completes; late verified response cannot repaint a departed module',async()=>{
  const {context,page}=await create();let release;const gate=new Promise(resolve=>release=resolve);
  try{await context.route(routePattern,async route=>{await gate;await route.fulfill({status:200,body:firasText});});await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector('.firas-active'));assert.equal(await page.locator('#galaxy-spectrum').isVisible(),false);
   assert.match(await page.locator('.firas-data-state').innerText(),/正在加载/);release();await ready(page);
   await page.locator('.al-workspace-brand').click();await page.waitForFunction(()=>!document.querySelector('.firas-shell'));
   let releaseLate;const lateGate=new Promise(resolve=>releaseLate=resolve);await context.unroute(routePattern);
   await context.route(routePattern,async route=>{await lateGate;await route.fulfill({status:200,body:firasText});});
   await page.goto(url,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('.firas-active'));
   await page.locator('.al-workspace-brand').click();await page.waitForFunction(()=>!document.querySelector('.firas-shell'));releaseLate();
   await page.waitForTimeout(250);assert.equal(await page.locator('.firas-shell').count(),0);assert.equal(await page.evaluate(()=>document.body.classList.contains('firas-observing')),false);
   return{pendingBlank:true,normalLoad:true,lateResponseClean:true};
  }finally{release();await context.close();}
 });
 await record('HTTP context without crypto.subtle still requires exact v1 identity',async()=>{
  const {context,page}=await create();try{await context.addInitScript(()=>Object.defineProperty(window.crypto,'subtle',{value:undefined}));
   await page.goto(url);await ready(page);assert.equal(await page.evaluate(()=>Boolean(window.crypto.subtle)),false);
   await context.route(routePattern,route=>route.fulfill({status:200,body:invalidFiras.differentNumbers.text}));await page.reload();
   await page.waitForFunction(()=>window.__lab?.result?.firasData?.status==='failed');assert.equal(await page.evaluate(()=>window.__lab.result.firasData.error.code),'identity');
   return{validRows:43,tamperedProductRejected:true};
  }finally{await context.close();}
 });
 await record('No uncaught browser errors',async()=>{assert.deepEqual(browserErrors,[]);return browserErrors;});
}finally{await browser.close();fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({at:new Date().toISOString(),base,passed:checks.filter(x=>x.passed).length,total:checks.length,checks,browserErrors},null,2));}
