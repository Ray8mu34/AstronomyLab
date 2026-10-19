import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const option=(name,fallback)=>{const i=process.argv.indexOf('--'+name);return i<0?fallback:process.argv[i+1];};
const base=option('base','http://127.0.0.1:4392'),out=option('out','build/qa/frontend-round2-20261019/sky/initial-mount-final');
const {chromium}=createRequire(import.meta.url)('C:/Users/30674/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const checks=[];fs.mkdirSync(out,{recursive:true});
async function check(name,run){try{checks.push({name,passed:true,result:await run()});console.log('PASS '+name);}catch(error){checks.push({name,passed:false,error:error.stack});console.error('FAIL '+name+' '+error.message);process.exitCode=1;}}
const ready=page=>page.waitForFunction(()=>window.__lab?.module==='sky'&&document.querySelector('#lab-mount')?.dataset.experimentStateReady==='true');
async function observe(page){await page.addInitScript(()=>{window.mountObservations=[];const frame=()=>{const h=document.querySelector('.sky-guide');if(h)mountObservations.push({question:h.querySelector('#sky-question').textContent,compact:!!document.querySelector('.al-workspace-navigation')});requestAnimationFrame(frame);};requestAnimationFrame(frame);});}
try{
 for(const mode of ['sky','stars','measure','day','precession'])await check(mode+' mounts a complete shell after its real scene dependency',async()=>{
  const context=await browser.newContext(),page=await context.newPage();await observe(page);let release,requested;const held=new Promise(r=>release=r),request=new Promise(r=>requested=r);
  await page.route('**/shared/scene.js',async route=>{requested();await held;await route.continue();});
  try{await page.goto(base+'/lab/sky?mode='+mode);await request;assert.equal(await page.locator('.sky-guide').count(),0);assert.equal(await page.locator('#app').getAttribute('aria-busy'),'true');assert.equal(await page.locator('#app .loading').isVisible(),true);release();await ready(page);await page.evaluate(()=>new Promise(requestAnimationFrame));const observations=await page.evaluate(()=>mountObservations);assert.ok(observations.length);assert.ok(observations.every(x=>x.question&&x.compact));assert.equal(await page.locator('.al-workspace-navigation').count(),1);return{observations};}finally{release();await context.close();}
 });
 await check('native back during scene loading cannot mount a stale scene',async()=>{
  const context=await browser.newContext(),page=await context.newPage();await page.addInitScript(()=>{window.webglAllocations=0;const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){if(/webgl/i.test(kind))webglAllocations++;return original.call(this,kind,...args);};});let release,requested,settled;const held=new Promise(r=>release=r),request=new Promise(r=>requested=r),done=new Promise(r=>settled=r);
  await page.route('**/shared/scene.js',async route=>{requested();await held;await route.continue();settled();});
  try{await page.goto(base+'/');await page.locator('.home-tool[href="/lab/sky"]').click();await request;await page.goBack();await page.waitForURL(base+'/');release();await done;await page.waitForFunction(()=>!document.querySelector('#app[aria-busy="true"]'));assert.equal(await page.locator('.sky-atlas').count(),0);assert.equal(await page.locator('#lab-mount canvas').count(),0);assert.equal(await page.evaluate(()=>window.__lab?.module==='sky'),false);assert.equal(await page.evaluate(()=>webglAllocations),0);return{url:page.url(),sceneMounted:false,webglAllocations:0};}finally{release();await context.close();}
 });
 await check('scene module failure reaches existing error and native retry recovers',async()=>{
  const context=await browser.newContext(),page=await context.newPage();await page.route('**/shared/scene.js',route=>route.abort('failed'));
  try{await page.goto(base+'/lab/sky?mode=day');await page.locator('[data-retry]').waitFor();assert.equal(await page.locator('#app').getAttribute('aria-busy'),null);assert.equal(await page.locator('.sky-guide').count(),0);await page.unroute('**/shared/scene.js');await page.locator('[data-retry]').click();await ready(page);return{mode:await page.evaluate(()=>__lab.state.tab)};}finally{await context.close();}
 });
 await check('calendar direct entry remains two dimensional with no Three dependency',async()=>{
  const context=await browser.newContext(),page=await context.newPage(),requests=[];page.on('request',r=>{if(/\/shared\/scene\.js|\/sky-motion-renderer\.js|three/i.test(r.url()))requests.push(r.url());});
  try{await page.goto(base+'/lab/sky?mode=calendar');await ready(page);assert.deepEqual(requests,[]);assert.equal(await page.evaluate(()=>__lab.scene),null);assert.equal(await page.evaluate(()=>__lab.state.measureTask),'calendar');return{requests,scene:null};}finally{await context.close();}
 });
}finally{await browser.close();fs.writeFileSync(out+'/checks.json',JSON.stringify({base,checks},null,2)+'\n');}
