// Integration checks for the presentation surface owner. No scientific state is assigned.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const arg=(n,d)=>process.argv.includes(n)?process.argv[process.argv.indexOf(n)+1]:d;
const base=arg('--base','http://127.0.0.1:4392'),out=path.resolve(arg('--out','build/qa/frontend-round2-20261019/surface-handoff'));
const {chromium}=createRequire(import.meta.url)(arg('--playwright',process.env.PLAYWRIGHT_MODULE||'playwright'));
fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[],responses=[],hashes=Object.fromEntries(['web/observatory/shared/presentation.js','web/observatory/shared/route-presentation.js','web/observatory/app.js'].map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
const browser=await chromium.launch({headless:true,executablePath:arg('--browser',process.env.BROWSER_EXECUTABLE),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)responses.push({url:r.url(),status:r.status()});});
const ready=()=>page.locator('[data-experiment-state-ready=true]').waitFor({timeout:30000});
const observe=()=>page.evaluate(()=>{const visible=e=>e.getClientRects().length&&!e.closest('[hidden]')&&getComputedStyle(e).visibility!=='hidden';return{html:document.documentElement.dataset.alSurface,body:document.body.dataset.alSurface,host:document.querySelector('#lab-mount')?.dataset.alSurface,layout:document.documentElement.dataset.alRouteLayout,navigation:[...document.querySelectorAll('.al-workspace-navigation')].filter(visible).length,owners:[...document.querySelectorAll('[data-presentation-owner]')].filter(visible).map(e=>({tag:e.tagName,surface:e.dataset.alSurface})),mode:window.__lab?.state.mode,timeOrigin:performance.timeOrigin};});
const expect=async(name,surface)=>{const observed=await observe();assert.equal(observed.html,surface,name+' html');assert.equal(observed.body,surface,name+' body');assert.equal(observed.host,surface,name+' host');assert.equal(observed.navigation,1);checks.push({name,state:'passed',observed});};
const mode=async(tool,value,surface)=>{await page.locator('details:has(.lab-tabs)>summary:visible').click();await page.locator(`button[data-mode="${value}"]`).click();await page.waitForFunction(value=>window.__lab.state.mode===value,value);await expect(tool+'/'+value,surface);};
try{
 await page.goto(base+'/lab/stars?mode=hr');await ready();await expect('stars/hr entry','hr');
 await mode('stars','ia','paper');await mode('stars','hr','hr');
 const nested=await page.evaluate(async()=>{
  const {applyPresentation}=await import('/shared/presentation.js');const host=document.querySelector('#lab-mount');
  const a=document.createElement('section'),b=document.createElement('section'),hidden=document.createElement('section');a.textContent='surface QA A';b.textContent='surface QA B';hidden.hidden=true;host.append(a,b,hidden);
  const read=()=>({html:document.documentElement.dataset.alSurface,body:document.body.dataset.alSurface,host:host.dataset.alSurface,a:a.dataset.alSurface,b:b.dataset.alSurface});const observations=[];
  const old=applyPresentation(a,{surface:'scene'});observations.push({step:'old scene',...read()});
  const current=applyPresentation(b,{surface:'paper'});observations.push({step:'new paper',...read()});
  const inactive=applyPresentation(hidden,{surface:'image'});observations.push({step:'hidden ignored globally',...read()});
  old();observations.push({step:'stale old dispose',...read()});
  const replace=applyPresentation(b,{surface:'image'});observations.push({step:'same root newer layer',...read()});
  current();observations.push({step:'same root stale dispose',...read()});replace();inactive();
  a.remove();b.remove();hidden.remove();observations.push({step:'all synthetic disposed',...read()});return observations;
 });
 for(const [i,surface]of ['scene','paper','paper','paper','image','image','hr'].entries()){assert.equal(nested[i].html,surface,nested[i].step);assert.equal(nested[i].body,surface,nested[i].step);}
 // The hidden owner is allowed its own host scope while mounted; it must not choose the document palette.
 assert.equal(nested.at(-1).host,'hr');checks.push({name:'nested/hidden/stale-dispose',state:'passed',observations:nested});
 const origin=await page.evaluate(()=>performance.timeOrigin);await page.locator('a[href="/"]:visible').first().click();await page.waitForSelector('.home-opening');
 assert.equal(await page.evaluate(()=>performance.timeOrigin),origin);assert.equal((await observe()).body,'paper');
 await page.goBack();await ready();await expect('Home/back restores HR','hr');
 await page.locator('a[href="/"]:visible').first().click();await page.waitForSelector('.home-opening');await page.locator('a[href="/lab/galaxy"]:visible').first().click();await ready();await expect('galaxy entry','scene');
 // Public tool menu buttons, rather than synthetic URL changes.
 await page.locator('.galaxy-space-modes>summary:visible').click();await page.locator('[data-topic="cmb"]:visible').click();
 await page.locator('.cmb-map-modes>summary:visible').click();await page.locator('[data-cmb-view="spectrum"]:visible').click();await page.locator('.firas-shell:visible').waitFor();await expect('galaxy/FIRAS','paper');
 await page.locator('.firas-modes>summary:visible').click();await page.locator('[data-cmb-view="map"]:visible').click();await page.locator('.cmb-map-shell:visible').waitFor();await expect('FIRAS/CMB','image');
 await page.locator('a[href="/"]:visible').first().click();await page.waitForSelector('.home-opening');const home=await observe();assert.equal(home.body,'paper');assert.equal(home.html,'paper');assert.equal(home.navigation,0);assert.equal(home.owners.length,0);checks.push({name:'CMB/Home cleanup',state:'passed',observed:home});
 assert.deepEqual(errors,[]);assert.deepEqual(responses,[]);
}catch(error){checks.push({name:'failure',state:'failed',error:error.stack,url:page.url(),observed:await observe()});await page.screenshot({path:path.join(out,'FAIL.png'),fullPage:true});process.exitCode=1;}
finally{await browser.close();fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({at:new Date().toISOString(),base,command:process.argv,hashes,checks,errors,responses,scope:'390 CSS px Edge software WebGL; real menu/home/back navigation plus isolated synthetic presentation-owner lifecycle probes',state:checks.some(c=>c.state==='failed')||errors.length||responses.length?'failed':'passed'},null,2));console.log(JSON.stringify({checks:checks.length,failed:checks.filter(c=>c.state==='failed').length,errors,responses}));}
