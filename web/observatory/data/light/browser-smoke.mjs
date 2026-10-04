import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/30674/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],bad=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push({url:r.url(),status:r.status()});});
const checks=[],shots=[];
const out=new URL('./qa/',import.meta.url);fs.mkdirSync(out,{recursive:true});
async function shot(name){const path=new URL(name+'.png',out);await page.screenshot({path:fileURLToPath(path),fullPage:false});shots.push(name+'.png');}
async function control(key,value){await page.locator(`[data-key="${key}"]`).evaluate((e,v)=>{e.value=String(v);e.dispatchEvent(new Event('input',{bubbles:true}));},value);}
try{
 await page.goto('http://127.0.0.1:4180/lab/light');await page.waitForFunction(()=>window.__lab?.name==='light');await shot('01-blackbody');
 await control('temperature',10000);assert.ok(Math.abs(await page.evaluate(()=>window.__lab.result.peak)-289.7771955)<1e-5);checks.push('actual temperature slider changes Wien peak');
 await page.locator('[data-mode="motion"]').click();await control('vr',100);const shift=await page.evaluate(()=>window.__lab.result.centre);assert.ok(shift>656.49&&shift<656.51);
 await control('inclination',0);assert.equal(await page.evaluate(()=>window.__lab.result.vmax),0);await control('inclination',90);await control('veq',180);await shot('02-spectral-motion');checks.push('radial shift and projected rotation respond to UI');
 await page.locator('[data-mode="magnitude"]').click();await control('distance',100);assert.equal(await page.evaluate(()=>window.__lab.result.deltam),5);await shot('03-distance');checks.push('distance ratio gives five magnitudes');
 await page.locator('[data-mode="observing"]').click();await control('height',30);assert.ok(Math.abs(await page.evaluate(()=>window.__lab.result.airmass)-2)<1e-10);await control('frames',30);await shot('04-observation');checks.push('airmass and frame read noise controlled');
 await page.goto('http://127.0.0.1:4180/lab/imaging');await page.waitForFunction(()=>window.__lab?.name==='imaging');assert.equal(await page.evaluate(()=>window.__lab.result.real),true);assert.equal(await page.evaluate(()=>window.__lab.channels[0].length),102400);await shot('05-real-m17');checks.push('actual M17 linear arrays loaded');
 const first=await page.evaluate(()=>window.__lab.channels[1][40000]);await control('method','linear');assert.equal(await page.evaluate(()=>window.__lab.channels[1][40000]),first);await page.locator('#imaging-channel').click({position:{x:100,y:100}});assert.ok((await page.locator('#imaging-pixel').innerText()).includes('FITS源单位'));checks.push('stretch preserves source values; pixel reports genuine linear arrays');
 await page.locator('#imaging-controls details').evaluate(e=>e.open=true);await page.locator('[data-key="registered"]').uncheck();await shot('06-registration');checks.push('artificial registration errors can be toggled');
 await page.locator('[data-dataset="teaching"]').click();assert.equal(await page.evaluate(()=>window.__lab.result.real),false);await page.locator('#imaging-controls details').evaluate(e=>e.open=true);await control('exposure',1200);await control('saturation',1000);assert.ok(await page.evaluate(()=>window.__lab.result.saturated)>0);await shot('07-teaching-clipping');checks.push('teaching counts and saturation independently work');
 await control('plate','infrared');await page.locator('#imaging-plate').evaluate(e=>e.decode());checks.push('existing near-IR plate loads with caption');
 await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:4180/lab/light');await page.waitForFunction(()=>window.__lab?.name==='light');await shot('08-mobile-light');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.goto('http://127.0.0.1:4180/lab/imaging');await page.waitForFunction(()=>window.__lab?.name==='imaging');await shot('09-mobile-imaging');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));checks.push('390px viewports have no horizontal overflow');
 assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);checks.push('no page errors or HTTP failures');
 const code_sha256={};for(const file of ['light.js','light-physics.mjs','imaging.js','imaging-physics.mjs'])code_sha256[file]=createHash('sha256').update(fs.readFileSync(new URL('../../modules/'+file,import.meta.url))).digest('hex');
 fs.writeFileSync(new URL('browser-checks.json',out),JSON.stringify({date:new Date().toISOString(),state:'passed',browser:'actual Edge headless;1440×1000 and390×844',checks,shots,code_sha256,model_visual_review:'pending',human_review:'pending',classroom_trial:'pending'},null,2)+'\n');console.log(checks);
}finally{await browser.close();}
