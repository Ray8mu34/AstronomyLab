import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {geometry} from './moon-geometry-probe.mjs';
const args=process.argv.slice(2),arg=(k,d)=>args.includes(k)?args[args.indexOf(k)+1]:d,base=arg('--base','http://127.0.0.1:4234'),out=path.resolve(arg('--out','build/qa/frontend-round2-20261019/earth-moon/p0-recovery01'));
if(fs.existsSync(path.join(out,'checks.json')))throw Error('Refusing to overwrite completed evidence');fs.mkdirSync(out,{recursive:true});
const {chromium}=await import(pathToFileURL(arg('--playwright',process.env.PLAYWRIGHT_MODULE||'C:/Users/30674/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')).href);
const browser=await chromium.launch({executablePath:arg('--browser',process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'),headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),checks=[];
const ready=p=>p.waitForFunction(()=>window.earthMoon?.state.ready&&document.body.classList.contains('reduced'));
const context=await browser.newContext({viewport:{width:390,height:844},recordVideo:{dir:out,size:{width:390,height:844}}}),p=await context.newPage();
try{
 await p.goto(base+'/labs/earth-moon/?mode=phase');await ready(p);await p.locator('#day').focus();await p.keyboard.press('ArrowRight');const state=await p.evaluate(()=>earthMoon.getState());
 // Follow the shared workspace return, then use the browser history entry.
 await p.locator('.al-workspace-brand').click();await p.waitForURL(base+'/');await p.goBack();await ready(p);assert.deepEqual(await p.evaluate(()=>earthMoon.getState()),state);assert.equal(await p.locator('.al-workspace-navigation').count(),1);checks.push({name:'directory exit and browser back preserve state and one navigation owner',status:'passed',state});
 const resource=await p.evaluate(()=>performance.getEntriesByType('resource').map(e=>({name:new URL(e.name).pathname,bytes:e.transferSize,duration:e.duration})));checks.push({name:'actual loaded resource observations',status:'passed',resource});
 await p.locator('#play').click();await p.waitForTimeout(400);assert(await p.evaluate(()=>earthMoon.state.playing));
 const available=await p.evaluate(()=>{const canvas=document.querySelector('#space canvas'),gl=canvas.getContext('webgl2')||canvas.getContext('webgl'),extension=gl.getExtension('WEBGL_lose_context');if(!extension)return false;extension.loseContext();return true;});assert(available,'real WebGL context-loss extension available');
 await p.locator('#startup-error:not([hidden])').waitFor();assert.equal(await p.evaluate(()=>earthMoon.state.ready),false);assert.equal(await p.evaluate(()=>earthMoon.state.playing),false);assert(await p.locator('#play').isDisabled());await p.screenshot({path:path.join(out,'context-lost.png')});await p.waitForTimeout(800);
 await p.locator('#retry').click();await ready(p);assert.equal(await p.evaluate(()=>earthMoon.state.playing),false);assert(await p.locator('#play').isEnabled());const g=await geometry(p);assert(g.observedMoon.bottom<g.clock.y);await p.locator('#play').click();const start=await p.evaluate(()=>earthMoon.state.days);await p.waitForTimeout(400);await p.locator('#play').click();assert(await p.evaluate(start=>earthMoon.state.days>start,start));await p.screenshot({path:path.join(out,'context-recovered.png')});await p.waitForTimeout(800);checks.push({name:'real WebGL context loss pauses and retry restores usable playback',status:'passed',geometry:g});
}catch(error){checks.push({name:'failure',status:'failed',error:error.stack});throw error;}finally{fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({executedAt:new Date().toISOString(),base,checks,physicalDevice:'not tested'},null,2));const video=p.video();await context.close();fs.renameSync(await video.path(),path.join(out,'390x844-recovery-operations.webm'));await browser.close();}
