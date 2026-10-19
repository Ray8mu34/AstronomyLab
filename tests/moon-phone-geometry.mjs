import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {moonClick} from './moon-disclosure.mjs';

const args=process.argv.slice(2),arg=(key,fallback)=>args.includes(key)?args[args.indexOf(key)+1]:fallback;
const base=arg('--base',process.env.MOON_BASE||'http://127.0.0.1:4234/labs/earth-moon/');
const out=path.resolve(arg('--out','build/qa/science-round1-20261019/D/round1'));
const before=arg('--before-source',null),record=args.includes('--record');
const {chromium}=await import(pathToFileURL(arg('--playwright',process.env.PLAYWRIGHT_MODULE||'C:/Users/30674/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')).href);
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:arg('--browser',process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'),headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[],observations=[],errors=[];

// Measure rendered science in CSS pixels. Sphere silhouettes, orbit vertices,
// the Sun-direction overlay and labels must all stay outside the clock.
async function geometry(page){
 return page.evaluate(()=>{
  const lab=window.earthMoon,V=lab.moon.position.constructor;
  const rect=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
  const s=rect(document.querySelector('#space')),o=rect(document.querySelector('#observed')),clock=rect(document.querySelector('.reduced-transport'));
  const project=(v,camera,box)=>{const q=v.clone().project(camera);return{x:box.x+(q.x+1)*box.width/2,y:box.y+(1-q.y)*box.height/2};};
  const bounds=points=>{const xs=points.map(p=>p.x),ys=points.map(p=>p.y);return{x:Math.min(...xs),y:Math.min(...ys),right:Math.max(...xs),bottom:Math.max(...ys)};};
  const silhouette=(mesh,camera,box)=>{const pts=[];for(let i=0;i<96;i++){const a=i/96*Math.PI*2;for(const xyz of [[Math.cos(a),Math.sin(a),0],[Math.cos(a),0,Math.sin(a)],[0,Math.cos(a),Math.sin(a)]])pts.push(project(new V(...xyz).multiplyScalar(mesh.scale.x).add(mesh.position),camera,box));}return bounds(pts);};
  const earth=lab.scene.children.find(n=>n.isMesh&&n.material?.uniforms?.physicalRadius?.value===lab.physics.C.earthRadius);
  const orbit=lab.scene.children.find(n=>n.isLine&&n.geometry.attributes.position.count===257),pos=orbit.geometry.attributes.position;
  const objects={earth:silhouette(earth,lab.camera,s),moon:silhouette(lab.moon,lab.camera,s),orbit:bounds(Array.from({length:pos.count},(_,i)=>project(new V().fromBufferAttribute(pos,i),lab.camera,s)))};
  for(const id of ['solar-ray','solar-arrow','solar-dot','solar-word','earth-label','moon-label'])objects[id]=rect(document.getElementById(id));
  const centres={earth:project(new V(),lab.camera,s),moon:project(lab.moon.position,lab.camera,s)};
  return{objects,centres,clock,space:s,observed:o,observedMoon:silhouette(lab.observedMoon,lab.observerCamera,o),caption:rect(document.querySelector('.subject-caption')),scrollY,viewport:{width:innerWidth,height:innerHeight},state:lab.getState(),documentWidth:document.documentElement.scrollWidth};
 });
}
function assertScience(g,label,{moonFeedback=false}={}){
 assert(g.documentWidth<=g.viewport.width,`${label}: horizontal overflow`);
 for(const [name,r]of Object.entries(g.objects)){
  assert(r.y>=0&&r.bottom<=g.clock.y+.5,`${label}: ${name} outside unobstructed viewport: ${JSON.stringify(r)}; clock y=${g.clock.y}`);
  assert(r.x>=-.5&&r.right<=g.viewport.width+.5,`${label}: ${name} outside horizontal viewport`);
 }
 if(moonFeedback){assert(g.observedMoon.y>=0&&g.observedMoon.bottom<=g.clock.y,`${label}: moon feedback offscreen`);assert(g.caption.y>=0&&g.caption.bottom<=g.clock.y,`${label}: phase feedback offscreen`);}
}
async function sample(page,label,options){await page.waitForTimeout(80);const g=await geometry(page);observations.push({label,...g});assertScience(g,label,options);return g;}
async function screenshot(page,name){await page.screenshot({path:path.join(out,name+'.png')});if(record)await page.waitForTimeout(650);}
try{
 for(const viewport of [{width:374,height:860},{width:374,height:667},{width:320,height:568}]){
  const name=`${viewport.width}x${viewport.height}`,context=await browser.newContext({viewport,hasTouch:true,...(record?{recordVideo:{dir:out,size:viewport}}:{})}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  if(before)for(const name of ['phase-ui.css','phase-ui.js'])await page.route('**/'+name,route=>route.fulfill({path:path.resolve(before,name),contentType:name.endsWith('css')?'text/css':'text/javascript'}));
  await page.goto(base+'?mode=phase');await page.waitForFunction(()=>window.earthMoon?.state.ready&&document.body.classList.contains('reduced'));
  const opening=await page.evaluate(()=>window.earthMoon.getState());await screenshot(page,name+'-large-moon');
  const largeMoon=await page.locator('#observed').boundingBox();assert(largeMoon.height>=320,'default large lunar view retained');
  await page.locator('#space').scrollIntoViewIfNeeded();await sample(page,name+' default geometry');await screenshot(page,name+'-default-geometry');
  await page.locator('#compare-entry').click();await page.waitForTimeout(100);
  assert.deepEqual(await page.evaluate(()=>window.earthMoon.getState()),opening,'comparison must not change scientific inputs/camera');
  await sample(page,name+' comparison',{moonFeedback:true});await screenshot(page,name+'-comparison');
  for(const phase of [0,90,180,270]){
   await page.locator('#phase-entry').click();await page.locator(`[data-guide-action="phase:${phase}"]`).click();
   await sample(page,name+' phase '+phase,{moonFeedback:true});
   if(record)await page.waitForTimeout(700);
  }
  const oldDay=await page.evaluate(()=>window.earthMoon.state.days);await page.locator('#day').focus();await page.keyboard.press('ArrowRight');
  assert(Math.abs((await page.evaluate(()=>window.earthMoon.state.days))-oldDay-.001)<.0011,'native keyboard step must update time');await sample(page,name+' native time key',{moonFeedback:true});
  await page.locator('#day').click({position:{x:Math.round(viewport.width*.43),y:8}});await sample(page,name+' pointer time',{moonFeedback:true});
  await page.locator('#play').click();const playingStart=await page.evaluate(()=>window.earthMoon.state.days);
  for(let i=0;i<6;i++){await page.waitForTimeout(120);await sample(page,name+' playing '+i,{moonFeedback:true});}
  assert((await page.evaluate(()=>window.earthMoon.state.days))>playingStart,'real playback must advance');await page.locator('#play').click();await screenshot(page,name+'-playing-paused');
  const g=await geometry(page),oldDrag=await page.evaluate(()=>window.earthMoon.state.days);
  await page.mouse.move(g.centres.moon.x,g.centres.moon.y);await page.mouse.down();await page.mouse.move(g.centres.moon.x-28,g.centres.moon.y-25,{steps:12});await page.mouse.up();
  assert(Math.abs((await page.evaluate(()=>window.earthMoon.state.days))-oldDrag)>.01,'dragging actual projected moon must update model');await sample(page,name+' drag moon',{moonFeedback:true});await screenshot(page,name+'-dragged');
  await page.locator('#condition-entry').click();await page.keyboard.press('Escape');assert.equal(await page.locator('#condition-menu').isVisible(),false);assert.equal(await page.locator('#condition-entry').evaluate(el=>el===document.activeElement),true);
  await page.locator('#reset').click();assert.deepEqual(await page.evaluate(()=>window.earthMoon.getState()),opening,'loaded-origin reset unchanged');
  await page.locator('#compare-entry').click();assert((await page.locator('#observed').boundingBox()).height>=320,'collapse restores large moon');
  await moonClick(page,'[data-mode="spin"]');assert.equal(await page.locator('body.reduced').count(),0);assert.equal(await page.locator('#phase-ui .subject-caption').count(),1,'phase caption returned to its owner');
  await moonClick(page,'[data-mode="phase"]');assert.equal(await page.locator('.views>.subject-caption').count(),1);assert.equal(await page.locator('.reduced-transport #day').count(),1);
  results.push({name,pass:true});const video=page.video();await context.close();if(video)fs.renameSync(await video.path(),path.join(out,name+'-operations.webm'));
 }
 // Desktop layout/controls retain their existing placement and state contract.
 const context=await browser.newContext({viewport:{width:1280,height:720}}),page=await context.newPage();await page.goto(base+'?mode=phase');await page.waitForFunction(()=>window.earthMoon?.state.ready&&document.body.classList.contains('reduced'));
 const desktopState=await page.evaluate(()=>window.earthMoon.getState()),beforeMoon=await page.locator('#observed').boundingBox();await page.locator('#condition-entry').click();assert.deepEqual(await page.locator('#observed').boundingBox(),beforeMoon);
 await page.locator('#compare-entry').click();assert.deepEqual(await page.evaluate(()=>window.earthMoon.getState()),desktopState);const menu=await page.locator('#condition-menu').boundingBox(),space=await page.locator('#space').boundingBox();assert(menu.y+menu.height<space.y,'desktop conditions must remain above geometry');await screenshot(page,'desktop-comparison-conditions');await context.close();results.push({name:'desktop state and layout contract',pass:true});
 assert.deepEqual(errors,[]);console.log('Moon phone geometry: 3 phone sizes, 4 presets each, native time, playback, drag, reset, owner return and desktop passed.');
}catch(error){results.push({name:'failure',pass:false,error:error.stack});throw error;}
finally{const files=['web/earth-moon/phase-ui.css','web/earth-moon/phase-ui.js','tests/moon-phone-geometry.mjs'],sourceHashes=Object.fromEntries(files.map(file=>[file,createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({base,executedAt:new Date().toISOString(),head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceHashes,beforeSource:before,environment:'Headless Edge; software WebGL; touch-capable browser viewports. No physical phone.',results,observations,errors},null,2));await browser.close();}
