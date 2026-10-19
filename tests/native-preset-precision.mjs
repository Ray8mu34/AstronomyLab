import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {conicState} from '../web/observatory/modules/orbit-conics-physics.mjs';
import {dynamicalMass} from '../web/observatory/modules/measure-physics.mjs';
const option=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
const positional=process.argv[2]&&!process.argv[2].startsWith('--')?process.argv[2]:null;
const mode=option('--mode',positional||'all'),base=option('--base',positional?process.argv[3]:'http://127.0.0.1:4182');
const out=path.resolve(option('--out',positional?process.argv[4]||'build/qa/native-preset-precision':'build/qa/native-preset-precision'));
const modulePath=option('--playwright',process.env.PLAYWRIGHT_MODULE||'playwright'),browserPath=option('--browser',process.env.BROWSER_EXECUTABLE);
const {chromium}=createRequire(import.meta.url)(modulePath);fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({...(browserPath?{executablePath:browserPath}:{}),headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const checks=[],errors=[],started=new Date().toISOString();
const save=()=>fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({started,completed:new Date().toISOString(),base,mode,node:process.version,browser:browserPath||'Playwright default',graphics:'SwiftShader software WebGL',checks,errors},null,2));
async function check(name,fn,page){try{const evidence=await fn();checks.push({name,pass:true,evidence});console.log('PASS '+name);}catch(e){const file=path.join(out,'FAIL-'+checks.length+'.png');await page.screenshot({path:file,fullPage:true}).catch(()=>{});checks.push({name,pass:false,error:e.stack,screenshot:file});console.error('FAIL '+name+': '+e.message);}save();}
const ready=p=>p.waitForFunction(()=>document.querySelector('#lab-mount')?.dataset.experimentStateReady==='true');
async function reveal(p,s){for(const d of await p.locator(s).locator('xpath=ancestor::details').all())if(!await d.evaluate(n=>n.open))await d.locator(':scope>summary').click();}
async function click(p,s){await reveal(p,s);await p.locator(s).click();await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>resolve())));}
async function get(p,slug,input){return p.evaluate(async({slug,input})=>{const{readExperimentSnapshot}=await import('/shared/experiment-state.js');return{state:{...__lab.state},result:__lab.result,snapshot:readExperimentSnapshot(slug,history.state.astronomy.entryId),native:Number(document.querySelector(input).value),step:document.querySelector(input).step,label:document.querySelector(slug==='orbits'?'[data-conic-value=speed]':'[data-value=a]')?.textContent};},{slug,input});}
const same=(after,before)=>{assert.deepEqual(after.state,before.state);assert.deepEqual(after.result,before.result);assert.deepEqual(after.snapshot.model,before.snapshot.model);assert.equal(after.label,before.label);};
async function routes(p,before,slug,input){await p.reload();await ready(p);same(await get(p,slug,input),before);await p.locator('a[href="/"]:visible').first().click();await p.waitForURL(base+'/');await p.goBack();await ready(p);same(await get(p,slug,input),before);await p.goForward();await p.waitForURL(base+'/');await p.goBack();await ready(p);same(await get(p,slug,input),before);return ['capture','reload','directory click + Back','Forward + Back'];}
try{
 for(const current of mode==='all'?['orbits/orbit','measure/jupiter']:[mode]){
  assert(['orbits/orbit','measure/jupiter'].includes(current),'--mode must be all, orbits/orbit or measure/jupiter');
  const orbit=current==='orbits/orbit',slug=orbit?'orbits':'measure',input=orbit?'[data-conic-key=speed]':'[data-key=a]';
  const ctx=await browser.newContext(),p=await ctx.newPage();p.on('pageerror',e=>errors.push({mode:current,message:e.message}));
  await p.goto(base+'/lab/'+slug+'?mode='+(orbit?'orbit':'jupiter'));await ready(p);
  const presets=orbit?[100,200,1200,5000].flatMap(height=>['circle','parabola'].map(preset=>({height,preset}))):[{preset:'io10'}];
  if(orbit)presets.push(...['ellipse','hyperbola','drop'].map(preset=>({height:200,preset})));
  for(const {height,preset}of presets)await check(current+' precise '+preset+' '+(height||'')+' survives native capture/reload/Back/Forward',async()=>{
   if(orbit){await reveal(p,'[data-conic-key=height]');await p.locator('[data-conic-key=height]').evaluate((n,v)=>{n.value=v;n.dispatchEvent(new Event('input',{bubbles:true}));},height);}
   await click(p,orbit?'[data-conic-preset='+preset+']':'[data-preset='+preset+']');const before=await get(p,slug,input),model=before.snapshot.model;
   assert(model,'The exact model must be persisted, separate from native range rounding');assert.equal(before.snapshot.values[orbit?'conic:speed':'a'],before.native);
   if(orbit){const ref=conicState(height,0),expected={circle:ref.vc,ellipse:ref.vc*1.3,parabola:ref.escape,hyperbola:ref.escape*1.12,drop:0}[preset];assert.equal(before.state.speed,expected);assert.equal(model.speed,expected);assert.deepEqual(before.result.info,conicState(height,expected));assert.equal(model.height,height);assert.equal(before.step,'0.001');if(preset==='circle')assert(Math.abs(before.result.info.e)<1e-10);if(preset==='parabola'){assert(Math.abs(before.result.info.e-1)<1e-10);assert(Math.abs(expected**2/2-ref.vc**2)<1e-10,'Independent zero-energy identity');}}
   else{assert.equal(before.state.a,421800*1.1);assert.equal(model.a,before.state.a);assert.equal(before.step,'100');assert.deepEqual(before.result,dynamicalMass(before.state.a*1000,before.state.period*86400,before.state.errorA/100,before.state.errorP/100));}
   const label=Number(before.label?.replaceAll(',',''));assert.equal(label,orbit?Number(before.state.speed.toFixed(6)):Number(before.state.a.toPrecision(15)),'Visible scientific label must describe the authoritative model');
   const paths=await routes(p,before,slug,input);if(height===200&&preset==='parabola'||!orbit)await p.screenshot({path:path.join(out,orbit?'orbit-200-parabola.png':'jupiter-io10.png'),fullPage:true});return {height,preset,exact:orbit?before.state.speed:before.state.a,native:before.native,label:before.label,model,result:before.result,paths};
  },p);
  await check(current+' keyboard step, modifiers, bounds and event sequence match an unmodified native range',async()=>{
   await reveal(p,input);const spec=await p.locator(input).evaluate(n=>({min:n.min,max:n.max,step:n.step,type:n.type})),reference=await ctx.newPage();await reference.setContent('<input id="reference" type="range">');await reference.locator('input').evaluate((n,s)=>{for(const[k,v]of Object.entries(s))n[k]=v;},spec);
   const evidence=[];for(const key of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','PageUp','PageDown','Shift+ArrowRight','Control+ArrowRight','Home','End']){
    const start=orbit?'7.5':'421800';for(const[page,selector]of [[p,input],[reference,'input']]){await page.locator(selector).evaluate((n,v)=>{n.value=v;n.dispatchEvent(new Event('input',{bubbles:true}));window.__rangeEvents=[];if(!n.__eventTest){n.__eventTest=true;for(const type of ['input','change'])n.addEventListener(type,()=>window.__rangeEvents.push({type,value:n.value}));}},start);await page.locator(selector).focus();await page.keyboard.press(key);}
    const actual=await p.locator(input).inputValue(),expected=await reference.locator('input').inputValue(),events=await p.evaluate(()=>__rangeEvents),expectedEvents=await reference.evaluate(()=>__rangeEvents);assert.equal(actual,expected,key);assert.deepEqual(events,expectedEvents,key);const live=await get(p,slug,input);assert.equal(orbit?live.state.speed:live.state.a,Number(actual));evidence.push({key,actual,events});
   }for(const[key,limit]of [['End','ArrowRight'],['Home','ArrowLeft']]){await p.keyboard.press(key);await p.evaluate(()=>__rangeEvents=[]);await p.keyboard.press(limit);assert.deepEqual(await p.evaluate(()=>__rangeEvents),[]);}await reference.close();return{spec,evidence};
  },p);
  await check(current+' trusted pointer drag follows native grid, mathematical preset remains exact',async()=>{
   await reveal(p,input);const n=p.locator(input);await n.scrollIntoViewIfNeeded();await n.evaluate(n=>{window.__trusted=[];n.addEventListener('input',e=>{if(e.isTrusted)__trusted.push(Number(n.value));});});const r=await n.boundingBox();await p.mouse.move(r.x+r.width*.25,r.y+r.height/2);await p.mouse.down();await p.mouse.move(r.x+r.width*.75,r.y+r.height/2,{steps:16});await p.mouse.up();const values=await p.evaluate(()=>__trusted);assert(values.length>3);for(const v of values)assert.equal(v,orbit?Number(v.toFixed(3)):Math.round(v/100)*100);const dragged=await get(p,slug,input);assert.equal(dragged.native,orbit?dragged.state.speed:dragged.state.a);assert.equal(dragged.snapshot.model[orbit?'speed':'a'],dragged.native);await click(p,orbit?'[data-conic-preset=parabola]':'[data-preset=io10]');const exact=await get(p,slug,input);assert.equal(exact.snapshot.model[orbit?'speed':'a'],orbit?conicState(exact.state.height,0).escape:421800*1.1);return{values,exact:exact.snapshot.model};
  },p);
  await ctx.close();
 }
}finally{await browser.close();save();}
if(checks.some(c=>!c.pass)||errors.length)process.exitCode=1;
