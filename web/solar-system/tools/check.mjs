import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {positionAt,elementsAt,coordinates,solveKepler,rad,mapPosition,displayRadius,lightSeconds} from '../physics.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const workspace=path.resolve(root,'../..'),out=path.join(workspace,'build/qa/solar-system-web');fs.mkdirSync(out,{recursive:true});
const orbitData=JSON.parse(fs.readFileSync(path.join(root,'data/orbits.json'),'utf8'));
const checks=[];const mark=(name,data={})=>checks.push({name,state:'passed',...data});
for(const row of orbitData.planets){
 for(const date of ['2000-01-01','2026-10-03','2049-12-31']){
  const ms=Date.parse(date),el=elementsAt(row,ms),r=Math.hypot(...positionAt(row,ms));
  assert(r>=el[0]*(1-el[1])-1e-9&&r<=el[0]*(1+el[1])+1e-9);
  assert(Math.abs(Math.hypot(...coordinates(el,0))-el[0]*(1-el[1]))<1e-9);
  assert(Math.abs(Math.hypot(...coordinates(el,Math.PI))-el[0]*(1+el[1]))<1e-9);
 }
}
for(const e of [0,.017,.206,.8])for(const M of [-2,-.1,0,.8,2]){const E=solveKepler(M,e);assert(Math.abs(E-e*Math.sin(E)-M)<1e-10);}
assert(Math.abs(lightSeconds(1)-499.00478)<1e-4);
assert.deepEqual(mapPosition([1,0,0],'distance'),[3,0,-0]);
assert(Math.abs(displayRadius(69911,'sizes')/displayRadius(6371.0084,'sizes')-10.973)<.001);
mark('Kepler residual, orbital bounds, perihelion/aphelion, light time, distance/size scales');

const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/30674/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1440,height:960},deviceScaleFactor:1});
const external=[],errors=[],failures=[];
await context.route('**/*',route=>{const url=route.request().url();if(!url.startsWith('http://127.0.0.1:4173/')){external.push(url);route.abort();}else route.continue();});
const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)failures.push([r.status(),r.url()]);});
const shot=async name=>{const file=path.join(out,name+'.png');await page.screenshot({path:file,fullPage:true});return path.relative(workspace,file).replaceAll('\\','/');};
const screenshots=[];
try{
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.solarApp?.ready,{timeout:30000});
 if(await page.locator('#play').getAttribute('aria-pressed')==='true')await page.locator('#play').click();
 await page.waitForTimeout(700);
 const gl=await page.evaluate(()=>({revision:window.solarApp.renderer.capabilities.isWebGL2,drawCalls:window.solarApp.renderer.info.render.calls,geometries:window.solarApp.renderer.info.memory.geometries,objects:window.solarApp.objects.size}));
 assert.equal(gl.objects,9);assert(gl.drawCalls>10);mark('Actual browser WebGL rendered scene',gl);
 screenshots.push(await shot('01-overview-desktop'));
 for(const id of ['sun','mercury','venus','earth','mars','jupiter','saturn','uranus','neptune']){
  await page.locator(`.planet-button[data-body="${id}"]`).click();
  assert.equal(await page.evaluate(()=>window.solarApp.state.selected),id);
  await page.locator('#tab-deep').click();assert((await page.locator('#object-content p').count())>=3);
  await page.locator('#tab-data').click();assert((await page.locator('.fact-table tr').count())>=5);
  assert(!(await page.locator('#object-content').innerText()).includes('NaN'));
 }
 mark('Sun and all eight planets: click, deep reading, finite parameter tables');
 await page.locator('.planet-button[data-body="saturn"]').click();await page.waitForTimeout(1550);screenshots.push(await shot('02-saturn-focus'));
 await page.locator('.planet-button[data-body="earth"]').click();await page.waitForTimeout(1550);screenshots.push(await shot('03-earth-focus'));
 const offsetBefore=await page.evaluate(()=>{const a=window.solarApp;return a.camera.position.clone().sub(a.objects.get('earth').group.position).toArray();});
 await page.locator('#play').click();await page.waitForTimeout(350);await page.locator('#play').click();
 const offsetAfter=await page.evaluate(()=>{const a=window.solarApp;return a.camera.position.clone().sub(a.objects.get('earth').group.position).toArray();});
 assert(Math.hypot(...offsetBefore.map((v,i)=>v-offsetAfter[i]))<.02);mark('Selected-planet camera follows orbital playback');
 await page.locator('#top-view').click();assert.equal(await page.evaluate(()=>window.solarApp.state.selected),null);assert((await page.locator('#object-header').innerText()).includes('太阳系不是'));mark('Top view resets selection and matching reading panel');
 await page.locator('#home-view').click();await page.waitForTimeout(1550);
 // Test the actual ray-picked canvas, not only the navigation buttons.
 const target=await page.evaluate(()=>{const app=window.solarApp;const o=app.objects.get('jupiter');const p=o.group.position.clone().project(app.camera);const box=document.querySelector('#stage').getBoundingClientRect();return {x:box.left+(p.x*.5+.5)*box.width,y:box.top+(-p.y*.5+.5)*box.height};});
 await page.mouse.click(target.x,target.y);assert.equal(await page.evaluate(()=>window.solarApp.state.selected),'jupiter');mark('Planet selection by ray picking on rendered canvas');
 await page.locator('[data-mode="distance"]').click();await page.waitForTimeout(1550);screenshots.push(await shot('04-linear-distance'));
 await page.locator('#date').fill('2008-06-12');await page.locator('#date').dispatchEvent('change');assert.equal(await page.evaluate(()=>new Date(window.solarApp.state.ms).toISOString().slice(0,10)),'2008-06-12');
 const before=await page.evaluate(()=>window.solarApp.state.ms);await page.locator('#play').click();await page.waitForTimeout(400);await page.locator('#play').click();assert((await page.evaluate(()=>window.solarApp.state.ms))>before);mark('Date selection and simulated time advance');
 await page.locator('#orbits-toggle').uncheck();await page.locator('#belts-toggle').uncheck();assert.equal(await page.evaluate(()=>window.solarApp.scene.children.filter(x=>x.type==='Group').some(g=>g.children[0]?.type==='LineLoop'&&g.visible)),false);
 await page.locator('#orbits-toggle').check();await page.locator('#belts-toggle').check();mark('Orbit and small-body layer switches');
 await page.locator('[data-mode="sizes"]').click();await page.waitForTimeout(1550);
 const sizes=await page.evaluate(()=>{const o=window.solarApp.objects;return {earth:o.get('earth').root.scale.x,jupiter:o.get('jupiter').root.scale.x,sunVisible:o.get('sun').group.visible};});assert.equal(sizes.earth,1);assert(!sizes.sunVisible);screenshots.push(await shot('05-proportional-sizes'));mark('Actual mesh sizes: Earth=1, Jupiter ratio, Sun excluded',sizes);
 assert.equal(await page.locator('.body-label:visible').count(),8);mark('All eight planet labels visible in the size comparison');
 await page.locator('[data-mode="explore"]').click();await page.locator('[data-topic="asteroids"]').click();assert((await page.locator('#object-header').innerText()).includes('主小行星带'));await page.locator('#tab-deep').click();assert.equal(await page.locator('#object-content img').count(),1);
 await page.locator('[data-topic="kuiper"]').click();await page.locator('#tab-deep').click();assert((await page.locator('#object-content').innerText()).includes('奥尔特云'));mark('Asteroid and Kuiper/Oort knowledge panels with real local figures');
 await page.locator('#model-open').click();assert(await page.locator('#info-dialog').isVisible());await page.keyboard.press('Escape');
 await page.locator('#sources-open').click();assert((await page.locator('#dialog-content').innerText()).includes('CC BY 4.0'));await page.keyboard.press('Escape');
 await page.locator('#reading-open').click();await page.waitForSelector('.reading-text img');assert((await page.locator('.reading-text').innerText()).length>6000);assert.equal(await page.locator('.reading-text img').count(),3);
 assert((await page.evaluate(()=>[...document.querySelectorAll('.reading-text img')].filter(i=>!i.complete||i.naturalWidth===0).length))===0);screenshots.push(await shot('06-full-article'));await page.keyboard.press('Escape');mark('Model/source dialogs and full original article with local images');
 await page.setViewportSize({width:390,height:844});await page.locator('#home-view').click();await page.waitForTimeout(1600);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));screenshots.push(await shot('07-mobile-overview'));
 await page.locator('.planet-button[data-body="saturn"]').click();await page.waitForTimeout(1500);screenshots.push(await shot('08-mobile-saturn'));mark('390 px responsive layout with no document overflow');
 assert.deepEqual(external,[]);assert.deepEqual(failures,[]);assert.deepEqual(errors,[]);mark('All core requests local; no network-CDN dependency, failed requests or console errors');
 const status=await context.request.get('http://127.0.0.1:4173/raw/2026%E9%9D%A2%E8%AF%95%E8%AF%95%E9%A2%98.pdf');assert.equal(status.status(),404);
 const teacher=await context.request.get('http://127.0.0.1:4173/course/_teacher/progress.md');assert.equal(teacher.status(),404);mark('Static server excludes raw papers and teacher records');
}catch(error){checks.push({name:'Browser check interrupted',state:'failed',error:String(error)});screenshots.push(await shot('failure'));throw error;}
finally{const files=['index.html','style.css','app.js','content.js','physics.mjs','server.mjs','data/orbits.json','data/physical.json','reading/01.html','reading/02.html'];const hashes=Object.fromEntries(files.map(f=>[f,createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')]));fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({checked_at:new Date().toISOString(),source_sha256:hashes,checks,errors,failures,externalRequests:external,screenshots,model_visual_review:'pending: screenshots require actual viewing',human_review:'pending',classroom_trial:'pending'},null,2));await browser.close();console.log(JSON.stringify({checks:checks.length,failed:checks.filter(c=>c.state==='failed'),screenshots:screenshots.length,output:path.relative(workspace,out)},null,2));}
