import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {trackPoint,pulsarSignal,collapseState} from '../web/observatory/modules/stars-physics.mjs';
import {syntheticIa,teachingIaPeak,teachingIaScatter} from '../web/observatory/modules/stars-teaching.mjs';
import {shadowHeight,dynamicalMass,CONSTANTS,s2Mass,scalePropagation} from '../web/observatory/modules/measure-physics.mjs';
const arg=(n,d)=>process.argv.includes(n)?process.argv[process.argv.indexOf(n)+1]:d,base=arg('--base','http://127.0.0.1:4392'),out=path.resolve(arg('--out','build/qa/frontend-round2-20261019/stars/tasks'));
const {chromium}=createRequire(import.meta.url)(arg('--playwright','C:/Users/30674/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const modes=[['stars','evolution'],['stars','pulsar'],['stars','collapse'],['stars','ia'],['measure','shadow'],['measure','jupiter'],['measure','s2'],['measure','distance']].filter(([tool,mode])=>!arg('--only','')||arg('--only','')===`${tool}/${mode}`),tracks=JSON.parse(fs.readFileSync('web/observatory/data/stars/tracks.json','utf8'));
fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({executablePath:arg('--browser','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'),headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),checks=[],errors=[];
const snapshot=p=>p.evaluate(()=>({state:structuredClone(window.__lab.state),result:structuredClone(window.__lab.result),viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},font:getComputedStyle(document.querySelector('h1')).fontFamily}));
const near=(x,y,tolerance=1e-10)=>assert(Math.abs(x-y)<=Math.max(1,Math.abs(y))*tolerance,`${x} != ${y}`);
const range=async(p,key,position)=>{const input=p.locator(`[data-key="${key}"]`);await input.focus();await input.press(position);await p.waitForTimeout(100);};
const disclose=async(p,selector)=>{const d=p.locator(selector);if(!await d.evaluate(e=>e.open))await d.locator(':scope>summary').click();};
const shot=async(p,name)=>p.screenshot({path:path.join(out,name+'.png'),fullPage:true});
async function run(name,fn,p){try{const detail=await fn();checks.push({name,status:'passed',...detail});console.log('PASS '+name);}catch(error){checks.push({name,status:'failed',message:error.stack});console.error('FAIL '+name+': '+error.message);if(p)await shot(p,'FAIL-'+checks.length);process.exitCode=1;}}
try{
 for(const[tool,mode]of modes){
  const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:out,size:{width:1440,height:900}}}),page=await context.newPage(),video=page.video(),steps=[];let start=Date.now();page.on('pageerror',e=>errors.push({mode,error:e.message}));
  const mark=async(action)=>{steps.push({action,elapsedMs:Date.now()-start,...await snapshot(page)});await page.waitForTimeout(500);};
  await page.goto(`${base}/lab/${tool}?mode=${mode}`);await page.waitForFunction(m=>window.__lab?.state.mode===m,mode);await page.locator('.al-workspace-navigation:visible').waitFor();await page.locator('[data-experiment-state-ready=true]').waitFor();await page.evaluate(()=>document.fonts.ready);await mark('default');
  await run(`${tool}/${mode} acceptance_task`,async()=>{
   if(mode==='evolution'){
    await disclose(page,'.evolution-presets');const ages=[];
    for(const eep of ['353','454','605','660','end']){if(!await page.locator('.evolution-presets').evaluate(e=>e.open))await disclose(page,'.evolution-presets');await page.locator(`[data-stage="${eep}"]`).click();const actual=await snapshot(page),track=tracks.tracks.find(t=>t.initial_mass_solar===Number(actual.state.mass));assert.deepEqual(actual.result.point,trackPoint(track,tracks.columns,actual.state.index));ages.push({eep:actual.result.point.eep,age:actual.result.point.star_age});assert(await page.locator('[data-structure-plot]').isVisible());await mark('same-row EEP '+eep);}
    assert(ages[1].age>ages[0].age);await page.locator('[data-key=mass]').selectOption('3');await mark('existing 3 solar-mass model');await shot(page,'evolution-task');
    return{ages,conclusion:'HR point, surface values and internal schematic use the exact selected MIST row. EEP is not elapsed time; initial/current mass and model age remain distinct.'};
   }
   if(mode==='pulsar'){
    await page.locator('[data-play]').click();await page.waitForTimeout(4400);await page.locator('[data-play]').click();const played=await snapshot(page);near(played.result.intensity,pulsarSignal(played.state.alpha,played.state.zeta,played.state.width,played.state.phase).intensity);await mark('one full slow-play revolution');
    await disclose(page,'.pulsar-presets');await page.locator('[data-preset=miss]').click();let v=await snapshot(page);assert.equal(v.result.intensity,0);await mark('fixed observer misses both beams');
    await disclose(page,'.pulsar-presets');await page.locator('[data-preset=double]').click();await range(page,'phase','Home');v=await snapshot(page);near(v.result.intensity,1);await mark('double-beam peak phase zero');
    await range(page,'zeta','Home');v=await snapshot(page);assert.equal(v.result.intensity,0);await mark('change observer, peak disappears');await shot(page,'pulsar-task');
    return{played,conclusion:'Signal follows the same geometric phase; changing the fixed observer can remove peaks. Four-second playback remains distinct from physical period.'};
   }
   if(mode==='collapse'){
    await range(page,'progress','End');let v=await snapshot(page);near(v.result.shellRadiusDisplay,collapseState(1,true).shellRadiusDisplay);const expelled=v.result.shellRadiusDisplay;await mark('successful outer envelope at process end');
    await page.locator('[data-key=successful]').uncheck();v=await snapshot(page);near(v.result.shellRadiusDisplay,collapseState(1,false).shellRadiusDisplay);assert(v.result.shellRadiusDisplay<expelled);await mark('same core process, envelope not expelled');
    await disclose(page,'.collapse-task-menu');await page.locator('[data-collapse-task=tidal]').click();await range(page,'bhMass','End');v=await snapshot(page);assert.equal(v.state.collapseTask,'tidal');assert.equal(v.state.successful,false);assert.equal(v.state.progress,1);await mark('independent tidal task, mass changed');await shot(page,'collapse-task');
    return{expelled,notExpelled:collapseState(1,false).shellRadiusDisplay,conclusion:'Envelope outcome is a chosen condition. The tidal task independently varies black-hole mass, without a continuous formation simulation.'};
   }
   if(mode==='ia'){
    await page.locator('[data-key=iaSample]').selectOption('7');await page.locator('[data-view=scene]').click();await mark('sample 7 original synthetic light curve');await page.locator('[data-view=chart]').click();await range(page,'iaCorrection','End');const v=await snapshot(page),sample=syntheticIa.find(s=>s.id===7);near(v.result.peak,teachingIaPeak(sample,1));near(v.result.afterScatter,teachingIaScatter(1).rms);assert(v.result.afterScatter>0&&v.result.afterScatter<v.result.beforeScatter);await mark('same sample, full correction with residual');await shot(page,'ia-task');
    return{conclusion:'Width/color correction reduces seven-sample scatter while preserving the preset residual; original light curves are not rewritten.'};
   }
   if(mode==='shadow'){
    const point=async length=>page.locator('#measure-shadow svg').evaluate((svg,l)=>{const p=svg.createSVGPoint();p.x=60+l*28;p.y=235;const screen=p.matrixTransform(svg.getScreenCTM());return{x:screen.x,y:screen.y};},length);
    for(const length of[7,10]){const v=await snapshot(page),from=await point(v.state.length),to=await point(length);await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:10});await page.mouse.up();near((await snapshot(page)).state.length,length);await mark('drag measurement endpoint to '+length+' km');}
    const prior=await snapshot(page);await range(page,'alpha','End');const v=await snapshot(page),expected=shadowHeight(10,60,v.state.sigmaLength,v.state.sigmaAlpha);assert.equal(v.state.length,prior.state.length);near(v.result.height,expected.height);near(v.result.sigma,expected.sigma);await mark('only solar altitude changes');await shot(page,'shadow-task');return{conclusion:'At fixed 10 km shadow, higher solar altitude gives a larger height; the stated independent first-order uncertainty follows both inputs.'};
   }
   if(mode==='jupiter'){
    const initial=await snapshot(page);await page.locator('#measure-compare').click();await page.locator('[data-preset=io10]').click();const v=await snapshot(page);assert.equal(v.state.a,421800*1.1);near(v.result.mass/initial.result.mass,1.331);near(v.result.mass,dynamicalMass(v.state.a*1000,v.state.period*CONSTANTS.day,v.state.errorA/100,v.state.errorP/100).mass);const exact=await page.evaluate(()=>window.__lab.getState());await mark('fixed period, exact off-grid +10% semimajor axis');
    await page.locator('.al-workspace-brand').click();await page.waitForURL(base+'/');await page.goBack();await page.locator('[data-experiment-state-ready=true]').waitFor();assert.deepEqual(await page.evaluate(()=>window.__lab.getState()),exact);await page.reload();await page.locator('[data-experiment-state-ready=true]').waitFor();assert.deepEqual(await page.evaluate(()=>window.__lab.getState()),exact);near((await snapshot(page)).result.mass,v.result.mass);await mark('leave/back/reload preserves exact model');await shot(page,'jupiter-task');return{exact,massRatio:v.result.mass/initial.result.mass,conclusion:'Mass scales as a cubed at fixed period. Restored model parameters retain the precise off-grid preset.'};
   }
   if(mode==='s2'){
    const before=await snapshot(page);await page.locator('[data-preset=s2distance]').click();const v=await snapshot(page);assert.equal(v.state.theta,before.state.theta);assert.equal(v.state.s2Period,before.state.s2Period);near(v.result.aAU/before.result.aAU,1.1);near(v.result.mass/before.result.mass,1.331);near(v.result.mass,s2Mass(v.state.theta,v.state.distance,v.state.s2Period,v.state.errorTheta/100,v.state.errorDistance/100,v.state.errorS2P/100).mass);await mark('same angular ellipse and period, distance +10%');await shot(page,'s2-task');return{conclusion:'Angular orbit stays fixed; actual semimajor axis grows 1.1 times and mass 1.331 times. Newtonian schematic does not test precision relativity.'};
   }
   if(mode==='distance'){
    await range(page,'p','Home');near((await snapshot(page)).result.parallax.distance,500);await mark('p 2 mas, d 500 pc');await range(page,'p','End');near((await snapshot(page)).result.parallax.distance,20);await mark('p 50 mas, d 20 pc');await disclose(page,'.measure-scale');const prior=await snapshot(page);await page.locator('[data-preset=scale10]').click();const v=await snapshot(page);assert.equal(v.state.p,prior.state.p);assert.deepEqual(v.result.scale,scalePropagation(1.1));await mark('independent common scale +10%');await shot(page,'distance-task');return{conclusion:'Distance varies inversely with parallax; the independent scale experiment gives radius/light/mass factors 1.1/1.21/1.331.'};
   }
  },page);
  await run(`${tool}/${mode} source disclosure Escape and focus`,async()=>{const selector=tool==='measure'?'.measure-atlas-info':`.${mode}-info`;await disclose(page,selector);await page.locator(selector+'>summary').press('Escape');assert.equal(await page.locator(selector).evaluate(e=>e.open),false);assert(await page.locator(selector+'>summary').evaluate(e=>e===document.activeElement));return{};},page);
  const durationMs=Date.now()-start;await context.close();await video.saveAs(path.join(out,`${tool}-${mode}-operations.webm`));fs.writeFileSync(path.join(out,`${tool}-${mode}-operations.json`),JSON.stringify({tool,mode,viewport:{width:1440,height:900},durationMs,steps},null,2));
 }
 for(const viewport of[{width:1440,height:900},{width:1280,height:600},{width:768,height:1024},{width:390,height:844},{width:320,height:720}]){
  const context=await browser.newContext({viewport}),page=await context.newPage();
  for(const[tool,mode]of modes)await run(`${tool}/${mode} geometry ${viewport.width}`,async()=>{await page.goto(`${base}/lab/${tool}?mode=${mode}`);await page.waitForFunction(m=>window.__lab?.state.mode===m,mode);await page.locator('.al-workspace-navigation:visible').waitFor();await page.waitForTimeout(150);const v=await snapshot(page),layout=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,headings:[...document.querySelectorAll('h1')].filter(e=>e.getClientRects().length).length}));assert(layout.scrollWidth<=layout.width+1,'horizontal overflow');assert.equal(layout.headings,1);assert(await page.locator('[data-key]:visible').count()>0);return{...v,layout};},page);
  await context.close();
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();const files=fs.readdirSync('web/observatory/modules').filter(n=>/^(stars|measure)(-|\.)/.test(n)).map(n=>'web/observatory/modules/'+n);fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({base,status:checks.some(c=>c.status==='failed')||errors.length?'failed':'passed',checks,errors,hashes:files.map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')})),limitation:'Software viewports and raw browser video. Native 200% belongs to integration QA; no physical-device claim.'},null,2));}
