import {moonClick,moonReveal} from './moon-disclosure.mjs';
import {imagingClick,imagingReveal} from './imaging-disclosure.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {confirmedModes,experimentURL} from '../web/observatory/shared/tool-registry.js';
import {experimentAdapters} from '../web/observatory/shared/experiment-state.js';
import {getModeContext} from '../web/observatory/shared/mode-context.js';

const option=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base=option('--base','http://127.0.0.1:4182');
const output=path.resolve(option('--out','build/qa/lab-refactor/standalone'));
const packageRoot=path.resolve(option('--package','dist/lab'));
const part=option('--part','all');
const checkFilter=option('--check-filter','');
const modulePath=option('--playwright',process.env.PLAYWRIGHT_MODULE||'playwright');
const browserPath=option('--browser',process.env.BROWSER_EXECUTABLE);
const minutes=Number(option('--stability-minutes','30'));
const {chromium}=createRequire(import.meta.url)(modulePath);
fs.mkdirSync(output,{recursive:true});
const started=new Date(),checks=[],coverage=[],screenshots=[],requests=[],pageErrors=[],blocked=[];
const environment={browser:'Headless Chromium / Edge',executable:browserPath||'Playwright default',graphics:'SwiftShader software WebGL',real_device:false,real_projection:false,human_scientific_review:'pending',classroom_trial:'pending',textbook_comparison:'pending'};
const browser=await chromium.launch({...(browserPath?{executablePath:browserPath}:{}),headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const coursePath=/\/(?:course|reading)(?:\/|$)|\/data\/catalog\.json$|\/shared\/(?:course-map|learning-paths|reading-state)\.js$/;
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const initialManifestHash=fs.existsSync(path.join(packageRoot,'web/observatory/runtime-assets.json'))?hash(fs.readFileSync(path.join(packageRoot,'web/observatory/runtime-assets.json'))):null;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const enabled=name=>part==='all'||part.split(',').includes(name);
async function context(viewport={width:1366,height:768},{storageFault=false,webglFault=false,lifecycle=false}={}){
 const ctx=await browser.newContext({viewport});
 await ctx.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(coursePath.test(url.pathname)){blocked.push({url:url.pathname,at:new Date().toISOString()});return route.abort('blockedbyclient');}
  if(url.origin!==new URL(base).origin&&!url.protocol.startsWith('data')){requests.push({url:url.href,external:true});return route.abort('blockedbyclient');}
  return route.continue();
 });
 if(storageFault)await ctx.addInitScript(()=>{Object.defineProperty(window,'sessionStorage',{configurable:true,get(){throw new DOMException('Session storage blocked','SecurityError');}});});
 if(webglFault)await ctx.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(/^webgl/.test(type))return null;return original.call(this,type,...args);};});
 if(lifecycle)await ctx.addInitScript(()=>{
  const frames=new Set(),intervals=new Set(),raf=requestAnimationFrame.bind(window),cancel=cancelAnimationFrame.bind(window),interval=setInterval.bind(window),clear=clearInterval.bind(window);
  window.requestAnimationFrame=callback=>{let id;id=raf(time=>{frames.delete(id);callback(time);});frames.add(id);return id;};
  window.cancelAnimationFrame=id=>{frames.delete(id);return cancel(id);};
  window.setInterval=(...args)=>{const id=interval(...args);intervals.add(id);return id;};
  window.clearInterval=id=>{intervals.delete(id);return clear(id);};
  window.__standaloneLifecycle={snapshot:()=>({pending_animation_frames:frames.size,active_intervals:intervals.size})};
 });
 ctx.on('page',p=>{
  p.on('pageerror',error=>pageErrors.push({part,message:error.message,url:p.url(),at:new Date().toISOString()}));
  p.on('request',request=>requests.push({url:request.url(),event:'request',kind:request.resourceType(),at:new Date().toISOString()}));
  p.on('requestfailed',request=>requests.push({url:request.url(),event:'failed',kind:request.resourceType(),failure:request.failure()?.errorText,at:new Date().toISOString()}));
  p.on('response',response=>requests.push({url:response.url(),status:response.status(),kind:response.request().resourceType(),at:new Date().toISOString()}));
 });
 return ctx;
}
async function check(name,fn,page=null){
 if(checkFilter&&!name.includes(checkFilter))return null;
 const begin=Date.now();
 try{const detail=await fn();checks.push({name,state:'passed',duration_ms:Date.now()-begin,...detail});console.log('PASS '+name);return true;}
 catch(error){const item={name,state:'failed',duration_ms:Date.now()-begin,error:error.stack||String(error)};if(page&&!page.isClosed())try{const file=path.join(output,'FAIL-'+name.replace(/[^A-Za-z0-9_-]/g,'_').slice(0,100)+'.png');await page.screenshot({path:file,fullPage:true});item.screenshot=file;}catch{}checks.push(item);console.error('FAIL '+name+': '+error.message);return false;}
 finally{save();}
}
function save(){
 fs.writeFileSync(path.join(output,part+'-checks.json'),JSON.stringify({checked_at:new Date().toISOString(),started_at:started.toISOString(),base,package_root:packageRoot,package_runtime_manifest_sha256:initialManifestHash,part,check_filter:checkFilter||null,node_version:process.version,state:checks.some(c=>c.state==='failed')?'failed':'in-progress',checks,coverage,screenshots,blocked_course_requests:blocked,page_errors:pageErrors,requests,environment,visual_review:'pending — images and recordings must be actually viewed separately'},null,2));
}
async function ready(page){
 if(new URL(page.url()).pathname.includes('/earth-moon/'))await page.waitForFunction(()=>window.earthMoon?.state?.ready,{timeout:30000});
 else await page.locator('[data-experiment-state-ready="true"]').first().waitFor({state:'attached',timeout:30000});
 await page.waitForTimeout(180);
}
async function modeOf(page,slug){return page.evaluate(async slug=>{const{currentExperimentMode}=await import('/shared/experiment-state.js');return currentExperimentMode(slug,document);},slug);}
async function shot(page,name,fullPage=false){const file=path.join(output,name+'.png');await page.screenshot({path:file,fullPage});screenshots.push({name,path:file,visual_review:'pending'});return file;}
async function disclose(locator){const page=locator.page();if(new URL(page.url()).pathname.includes('/earth-moon/')){const selector=await locator.evaluate(e=>e.id?'#'+e.id:null);if(selector){await moonReveal(page,selector);if(await locator.isVisible())return;}}if(new URL(page.url()).pathname==='/lab/imaging'){const selector=await locator.evaluate(e=>e.id?'#'+e.id:e.hasAttribute('data-key')?'[data-key="'+e.dataset.key+'"]':null);if(selector){await imagingReveal(page,selector);return;}}if(await page.locator('#mode-entry').isVisible()&&await locator.evaluate(el=>!!el.closest('#condition-menu'))&&!await page.locator('#condition-menu').isVisible())await page.locator('#condition-entry').click();for(const item of await locator.locator('xpath=ancestor::details').all())if(!await item.evaluate(node=>node.open))await item.locator(':scope > summary').click();}
async function executeStep(page,step){
 const prerequisites=[];
 // Use the public view switch when a responsive or topic-specific control is intentionally hidden.
 if(step.selector==='#scale'&&!await page.locator('#scale').isVisible()){if(new URL(page.url()).pathname.includes('/earth-moon/'))await moonClick(page,'[data-view="space"]');else await page.locator('[data-view="space"]').click();prerequisites.push({selector:'[data-view="space"]',action:'click'});}
 if(step.selector==='[data-key="delta"]'&&!await page.locator(step.selector).first().isVisible()&&await page.locator('[data-cmb-view="spectrum"]').count()){await disclose(page.locator('[data-cmb-view="spectrum"]'));await page.locator('[data-cmb-view="spectrum"]').click();prerequisites.push({selector:'[data-cmb-view="spectrum"]',action:'click'});}
 const staticBody=step.selector.startsWith('[data-body=')?page.locator('#planet-buttons '+step.selector):null;
 if(new URL(page.url()).pathname.includes('/earth-moon/'))await moonReveal(page,step.selector);
 const control=staticBody&&await staticBody.count()?staticBody.first():page.locator(step.selector).first();await control.waitFor({state:'attached',timeout:5000});await disclose(control);await control.waitFor({timeout:5000});assert(!await control.isDisabled(),step.selector+' disabled');
 if(step.action==='click')await control.click();
 else if(await control.evaluate(node=>node.tagName==='SELECT'))await control.selectOption(String(step.value));
 else if(await control.evaluate(node=>node.type==='checkbox'))await control.setChecked(Boolean(step.value));
 else await control.evaluate((node,spec)=>{node.value=String(spec.value);node.dispatchEvent(new Event(spec.action,{bubbles:true}));},step);
 await page.waitForTimeout(220);
 const observed=await control.evaluate(node=>({value:node.value??null,checked:node.type==='checkbox'?node.checked:null,pressed:node.getAttribute('aria-pressed'),selected:node.getAttribute('aria-selected'),active:node.classList.contains('active')}));
 return{...step,prerequisites,observed,scope:'Public operation exercised; expectation is a model-based description, not an independent scientific judgment'};
}
async function changeControl(page,slug,selector=null,{edge=false}={}){
 const choices=selector?[{selector}]:experimentAdapters[slug].controls;
 for(const spec of choices){
  const control=page.locator(spec.selector).first();if(!await control.count())continue;
  await disclose(control);if(!await control.isVisible()||await control.isDisabled())continue;
  const prior=await control.evaluate(node=>({tag:node.tagName,type:node.type,value:node.value,checked:node.checked,min:node.min,max:node.max,step:node.step,options:node.options?Array.from(node.options).filter(o=>!o.disabled).map(o=>o.value):[]}));
  if(prior.tag==='SELECT'){const other=prior.options.find(v=>v!==prior.value);if(other===undefined)continue;await control.selectOption(other);}
  else if(prior.type==='checkbox')await control.setChecked(!prior.checked);
  else if(prior.type==='range'){
   const low=Number(prior.min||0),high=Number(prior.max||100),now=Number(prior.value),step=Number(prior.step)||1;
   let next=edge?(now===high?low:high):Math.min(high,now+Math.max(step,(high-low)/5));
   if(next===now)next=Math.max(low,now-Math.max(step,(high-low)/5));
   await control.evaluate((node,value)=>{node.value=String(value);node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));},next);
  }
  else if(prior.type==='number'){
   const low=prior.min===''?0:Number(prior.min),high=prior.max===''?Number(prior.value)+10:Number(prior.max),now=Number(prior.value),step=Number(prior.step)||1;
   const next=edge?(now===high?low:high):Math.min(high,now+step)===now?Math.max(low,now-step):Math.min(high,now+step);
   await control.fill(String(next));await control.dispatchEvent('input');await control.dispatchEvent('change');
  }else continue;
  await page.waitForTimeout(220);
  const after=await control.evaluate(node=>node.type==='checkbox'?node.checked:node.value);
  assert.notEqual(after,prior.type==='checkbox'?prior.checked:prior.value,'Public control failed to change: '+spec.selector);
  return{selector:spec.selector,before:prior.type==='checkbox'?prior.checked:prior.value,after,event:'ordinary public input/change',edge};
 }
 throw Error('No visible usable public control for '+slug);
}
async function pause(page,slug){
 const scroll=await page.evaluate(()=>({x:scrollX,y:scrollY}));
 for(const spec of experimentAdapters[slug].pause){const button=page.locator(spec.selector).first();if(!await button.count()||!await button.isVisible())continue;const running=await button.evaluate((node,inverted)=>{const pressed=node.getAttribute('aria-pressed');return inverted?pressed==='false':pressed!==null?pressed==='true':/^(?:Ⅱ|暂停)/.test(node.textContent.trim());},!!spec.inverted);if(running)await button.click();}
 // A transport button below the fold may scroll into view; retain the entry viewport for default-layout evidence.
 await page.evaluate(({x,y})=>scrollTo({left:x,top:y,behavior:'instant'}),scroll);
}
async function openFromDirectory(page,slug,mode){
 const url=new URL(experimentURL(slug,mode),base),link=page.locator(`#app a[href="${url.pathname}"]`).first();
 if(!await link.count())throw Error('Directory has no ordinary '+slug+' entry');
 await link.click();await ready(page);
 if(await modeOf(page,slug)!==mode){
  const attribute=experimentAdapters[slug].mode.attribute,button=page.locator(`button[${attribute}="${mode}"]`).first();if(slug==='earth-moon')await moonClick(page,`button[${attribute}="${mode}"]`);else if(slug==='imaging')await imagingClick(page,`button[${attribute}="${mode}"]`);else{await disclose(button);await button.click();}await page.waitForTimeout(220);
 }
 assert.equal(await modeOf(page,slug),mode);
}

try{
 await check('Final package omits course source, full articles and reading-state dependencies',async()=>{
  assert(fs.existsSync(packageRoot),'Build the real dist/lab package before running this test');
  const all=[];const walk=dir=>{for(const item of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())walk(file);else all.push(path.relative(packageRoot,file).replaceAll('\\','/'));}};walk(packageRoot);
  const rejected=all.filter(file=>/(?:^|\/)course\/|(?:^|\/)build\/articles\/|(?:^|\/)catalog\.json$|(?:^|\/)(?:course-map|learning-paths|reading-state)\.js$|(?:^|\/)L\d{2}\.html$|(?:^|\/)lesson\.md$/.test(file));
  assert.deepEqual(rejected,[]);return{files:all.length,package_root:packageRoot};
 });
 await check('Every runtime asset is present and byte-matched inside the independent package',async()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(packageRoot,'web/observatory/runtime-assets.json'),'utf8'));
  assert.equal(manifest.version,1);assert(Array.isArray(manifest.files)&&manifest.files.length>20);
  const urls=new Set();for(const item of manifest.files){assert(!urls.has(item.url),'Duplicate whitelist URL '+item.url);urls.add(item.url);assert(!coursePath.test(item.url),item.url);const file=path.resolve(packageRoot,item.source);assert(file.startsWith(packageRoot+path.sep),'Asset escapes package '+item.source);const data=fs.readFileSync(file);assert.equal(data.length,item.bytes,item.source+' size');assert.equal(hash(data),item.sha256,item.source+' SHA256');}
  assert.equal(manifest.publicDistribution,'blocked_pending_licenses','Do not upgrade pending redistribution licenses');return{files:manifest.files.length,public_distribution:manifest.publicDistribution};
 });
 if(enabled('assets')){
  const ctx=await context();await check('All exact runtime URLs return manifest-matched bytes from the unpacked service',async()=>{
   const manifest=JSON.parse(fs.readFileSync(path.join(packageRoot,'web/observatory/runtime-assets.json'),'utf8'));
   for(const item of manifest.files){const response=await ctx.request.get(base+item.url);assert.equal(response.status(),200,item.url);const bytes=await response.body();assert.equal(bytes.length,item.bytes,item.url+' response bytes');assert.equal(hash(bytes),item.sha256,item.url+' response SHA256');}return{urls:manifest.files.length};
  });await ctx.close();
 }
 if(enabled('coverage')){
  const ctx=await context(),page=await ctx.newPage();
  await check('Home and source directory work without any course endpoints',async()=>{
   await page.goto(base+'/');await page.locator('#app').waitFor();await page.waitForTimeout(350);
   const links=await page.locator('a').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
   for(const slug of Object.keys(confirmedModes))assert(links.some(href=>href?.includes('/'+slug)),slug+' absent from tool directory');
   assert(!/从试卷讲起|先读本讲|按十六讲阅读/.test(await page.locator('body').innerText()));
   await shot(page,'home-1366');await page.goto(base+'/sources');await page.locator('#app').waitFor();await page.waitForTimeout(350);assert(/来源|模型/.test(await page.locator('#app').innerText()));
  },page);
  for(const viewport of [{width:1366,height:768},{width:390,height:844}]){
   await page.setViewportSize(viewport);
   for(const[slug,modes]of Object.entries(confirmedModes))for(const mode of modes){
    const item={slug,mode,viewport,level:['earth-moon','imaging'].includes(slug)?'deep-pilot-candidate':'basic-adaptation',visual_review:'pending'};coverage.push(item);
    const passed=await check('Direct '+slug+'/'+mode+' at '+viewport.width,async()=>{
     await page.goto(base+experimentURL(slug,mode));await ready(page);await pause(page,slug);
     await page.evaluate(()=>scrollTo({top:0,left:0,behavior:'instant'}));
     assert.equal(await modeOf(page,slug),mode,'URL mode must select the requested public mode');
     const reducedPhase=slug==='earth-moon'&&mode==='phase';if(reducedPhase){await moonClick(page,'#condition-entry');await page.locator('.interpretation summary').click();}
     if(slug==='earth-moon'&&mode==='spin'){await page.locator('#spin-information-entry').click();await disclose(page.locator('.experiment-guide'));}
     if(slug==='earth-moon'&&mode==='period'){await page.locator('#period-info-entry').click();await disclose(page.locator('.experiment-guide'));}
     if(slug==='earth-moon'&&mode==='eclipse'){await moonReveal(page,'.experiment-guide');await disclose(page.locator('.experiment-guide'));}
     if(slug==='imaging')await imagingReveal(page,'.imaging-head');
     if(slug==='stars'&&['hr','ia','pulsar','evolution','collapse'].includes(mode))await disclose(page.locator('.stars-question'));
     if(slug==='light'&&['thermal','motion','magnitude','observing'].includes(mode))await disclose(page.locator('.light-question'));
     if(slug==='optics'&&['imaging','sampling','resolution'].includes(mode))await disclose(page.locator('.optics-guide'));
     if(slug==='alignments'&&mode==='venus')await disclose(page.locator('#alignment-guide'));
     if(slug==='alignments'&&mode==='mars')await disclose(page.locator('#alignment-guide'));
     if(slug==='alignments'&&mode==='transit')await disclose(page.locator('#alignment-guide'));
      if(slug==='measure'&&['shadow','distance'].includes(mode))await disclose(page.locator('.measure-guide'));
      if(slug==='sky')await disclose(page.locator('.sky-guide'));
      if(slug==='orbits'&&mode==='transfer')await disclose(page.locator('.orbits-guide'));
     if(slug==='galaxy'&&['galaxy','cmb','cmb-spectrum'].includes(mode))await disclose(page.locator('.galaxy-head'));
     const guide=page.locator('[data-learning-guide]:visible,.experiment-guide:visible,.imaging-head:visible').first();await guide.waitFor();
     assert((await page.locator('[data-learning-question]:visible,#guide-question:visible,#imaging-question:visible').first().innerText()).trim().length>2,'Independent question');
     assert((await page.locator('[data-learning-instruction]:visible,#guide-operation:visible,#imaging-guide:visible').first().innerText()).trim().length>5,'First operation');
     assert((await guide.innerText()).trim().length>30,'Independent context and model boundary');
     assert(await page.locator('[data-mode-boundary]:visible,#mode-boundary:visible,#imaging-nearby-limit:visible').count()>0,'Visible model boundary missing');
     assert((await page.locator('[data-mode-boundary]:visible,#mode-boundary:visible,#imaging-nearby-limit:visible').first().innerText()).trim().length>15,'Visible model boundary');
     assert.equal(await page.locator('[data-reading-return]:visible').count(),0,'Lab must not require an article-return chain');
     if(reducedPhase)await moonClick(page,'#condition-entry');
     if(slug==='earth-moon'&&mode==='spin')await page.locator('#spin-close').click();
     if(slug==='earth-moon'&&mode==='period')await page.locator('#period-info-close').click();
     if(slug==='earth-moon'&&mode==='eclipse')await page.locator('#eclipse-close').click();
     if(slug==='imaging')await imagingClick(page,'[data-close-conditions]');
      if(slug==='stars'&&mode==='hr')await page.locator('[data-hr-close-info]').click();
      if(slug==='stars'&&mode==='ia')await page.locator('.ia-info [data-ia-close]').click();
     if(slug==='light'&&mode==='thermal')await page.locator('.thermal-info [data-thermal-close]').click();
     if(slug==='light'&&mode==='motion')await page.locator('.motion-info [data-motion-close]').click();
     if(slug==='light'&&mode==='magnitude')await page.locator('.magnitude-info [data-magnitude-close]').click();
     if(slug==='light'&&mode==='observing')await page.locator('.observing-info [data-observing-close]').click();
      if(slug==='measure'&&mode==='shadow')await page.locator('.shadow-info [data-shadow-close]').click();
      if(slug==='measure'&&mode==='distance')await page.locator('.distance-info [data-distance-close]').click();
      if(slug==='sky'&&mode==='calendar')await page.locator('.calendar-info [data-calendar-close]').click();
      if(slug==='sky'&&mode==='day')await page.locator('.day-info [data-day-close]').click();
      if(slug==='sky'&&mode==='sky')await page.locator('.path-info [data-path-close]').click();
      if(slug==='sky'&&mode==='precession')await page.locator('.precession-info [data-precession-close]').click();
      if(slug==='orbits'&&mode==='transfer')await page.locator('.transfer-info [data-transfer-close]').click();
     if(slug==='optics'&&mode==='sampling')await page.locator('.sampling-info [data-sampling-close]').click();
     if(slug==='optics'&&mode==='resolution')await page.locator('.resolution-info [data-resolution-close]').click();
     if(slug==='optics'&&mode==='imaging')await page.locator('.oi-info [data-oi-close]').click();
     if(slug==='alignments'&&mode==='mars')await page.locator('.mars-info [data-mars-close]').click();
     if(slug==='alignments'&&mode==='transit')await page.locator('.transit-info [data-transit-close]').click();
     if(slug==='alignments'&&mode==='venus')await page.locator('.venus-info [data-venus-close]').click();
     const extent=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert(extent.scroll<=extent.width+1,JSON.stringify(extent));
      const visualSelector=slug==='solar-system'&&mode==='compare'?'#comparison-view:visible':slug==='solar-system'&&mode==='axes'?'#axes-view:visible':slug==='alignments'?'.alignment-workspace':slug==='orbits'&&['staging','landing'].includes(mode)?'#orbit-landing-staging-slot':slug==='measure'&&mode==='distance'?'#measure-plot:visible':'canvas:visible,svg:visible';
     assert(await page.locator(visualSelector).count()>0,'Tool main visual is present');
     const stage=await page.locator(visualSelector).evaluateAll(nodes=>nodes.map(node=>{const b=node.getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height,area:b.width*b.height};}).sort((a,b)=>b.area-a.area)[0]||null);
     assert(stage&&stage.width>=Math.min(250,viewport.width*.7)&&stage.height>=180,'Scientific stage must remain meaningfully sized');
     assert(stage.y<viewport.height-120,'Scientific stage must begin inside the first viewport');item.stage=stage;
     item.screenshot=await shot(page,slug+'-'+mode+'-'+viewport.width);
     const definition=getModeContext(slug,mode);assert(definition?.testPath?.length,'Every mode must have an actual reproducible independent path');
     item.operations=[];for(const step of definition.testPath)item.operations.push(await executeStep(page,step));
     item.boundary_operation=await executeStep(page,definition.boundaryStep);
     await pause(page,slug);
     return{operations:item.operations,boundary_operation:item.boundary_operation,screenshot:item.screenshot};
    },page);item.state=passed?'passed':'failed';
   }
  }
  await check('No background course requests and no uncaught errors in complete mode sweep',async()=>{assert.deepEqual(blocked,[]);assert.deepEqual(pageErrors,[]);});await ctx.close();
  const csv=value=>'"'+String(value??'').replaceAll('"','""')+'"';
  const columns=['tool','mode','desktop_1366','narrow_390','scope','desktop_screenshot','narrow_screenshot','operation_count','boundary_expected'];
  const rows=Object.entries(confirmedModes).flatMap(([slug,modes])=>modes.map(mode=>{const desktop=coverage.find(row=>row.slug===slug&&row.mode===mode&&row.viewport.width===1366),narrow=coverage.find(row=>row.slug===slug&&row.mode===mode&&row.viewport.width===390);return[slug,mode,desktop?.state||'not_run',narrow?.state||'not_run',desktop?.level||'basic-adaptation',desktop?.screenshot,narrow?.screenshot,desktop?.operations?.length,desktop?.boundary_operation?.expected];}));
  fs.writeFileSync(path.join(output,'mode-coverage.csv'),'\uFEFF'+[columns,...rows].map(row=>row.map(csv).join(',')).join('\n')+'\n');
 }
 if(enabled('state')){
  const ctx=await context(),page=await ctx.newPage();
  const representatives=[['solar-system','compare','#comparison-metric'],['earth-moon','period','#day'],['alignments','venus','[data-key="inclination"]'],['sky','sky','[data-key="latitude"]'],['optics','resolution','[data-key="aperture"]'],['light','thermal','[data-key="temperature"]'],['stars','pulsar','[data-key="alpha"]'],['galaxy','galaxy','[data-key="longitude"]'],['imaging','real','[data-key="channel"]'],['orbits','orbit','[data-conic-key="speed"]'],['measure','shadow','[data-key="length"]']];
  for(const[slug,mode,selector]of representatives)await check('History refresh and fresh-link isolation '+slug,async()=>{
   await page.goto(base+experimentURL(slug,mode));await ready(page);await pause(page,slug);const changed=await changeControl(page,slug,selector);
   const directory=page.locator('a[href="/"]:visible').first();await directory.click();await page.waitForURL(base+'/');await page.goBack();await ready(page);
   assert.equal(await page.locator(selector).first().inputValue(),String(changed.after));await page.reload();await ready(page);assert.equal(await page.locator(selector).first().inputValue(),String(changed.after));
   await page.goForward();await page.waitForURL(base+'/');await page.goBack();await ready(page);assert.equal(await modeOf(page,slug),mode);
   await page.goto(base+experimentURL(slug,confirmedModes[slug][0]));await ready(page);assert.equal(await modeOf(page,slug),confirmedModes[slug][0]);return{selector,restored:changed.after};
  },page);await ctx.close();
  for(const storageFault of [true,false]){
   const ctx=await context(undefined,{storageFault}),p=await ctx.newPage();
   await check(storageFault?'Session storage completely unavailable: current tool remains usable':'Session storage quota failure: latest in-memory write remains authoritative',async()=>{
    await p.goto(base+'/lab/optics?mode=resolution');await ready(p);
    if(!storageFault)await p.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Storage full','QuotaExceededError');};});
    const changed=await changeControl(p,'optics','[data-key="aperture"]');await p.locator('a[href="/"]:visible').first().click();await p.goBack();await ready(p);assert.equal(await p.locator('[data-key="aperture"]').inputValue(),String(changed.after));return{changed};
   },p);await ctx.close();
  }
 }
 if(enabled('history-all')){
  const ctx=await context(),page=await ctx.newPage();
  const snapshot=slug=>page.evaluate(async slug=>{const{experimentAdapters}=await import('/shared/experiment-state.js');const adapter=experimentAdapters[slug],values={},choices={};for(const spec of adapter.controls){const node=document.querySelector(spec.selector);if(node)values[spec.name]=node.type==='checkbox'?node.checked:node.value;}for(const spec of adapter.choices){if(spec.read){choices[spec.name]=spec.read(document);continue;}if(spec.toggle){const node=document.querySelector(spec.selector);if(node)choices[spec.name]=node.getAttribute('aria-pressed');continue;}const nodes=Array.from(document.querySelectorAll(`button[${spec.attribute}]`));const active=nodes.find(node=>node.getAttribute('aria-pressed')==='true'||node.getAttribute('aria-selected')==='true'||node.classList.contains('active'));if(active)choices[spec.name]=active.getAttribute(spec.attribute);}return{values,choices};},slug);
  for(const[slug,modes]of Object.entries(confirmedModes))for(const mode of modes)await check('Every mode refresh back forward '+slug+'/'+mode,async()=>{
   await page.goto(base+experimentURL(slug,mode));await ready(page);await pause(page,slug);const initial=await snapshot(slug);
   const operations=[];for(const step of getModeContext(slug,mode).testPath)operations.push(await executeStep(page,step));await pause(page,slug);await page.waitForTimeout(300);const changed=await snapshot(slug);assert.equal(await modeOf(page,slug),mode);
   await page.locator('a[href="/"]:visible').first().click();await page.waitForURL(base+'/');await page.goBack();await ready(page);assert.equal(await modeOf(page,slug),mode);assert.deepEqual(await snapshot(slug),changed,'Back restores all mounted public controls and selected choices');
   await page.reload();await ready(page);assert.equal(await modeOf(page,slug),mode);assert.deepEqual(await snapshot(slug),changed,'Refresh restores the same history-entry parameters');
   await page.goForward();await page.waitForURL(base+'/');await page.goBack();await ready(page);assert.deepEqual(await snapshot(slug),changed,'Forward/back keeps the same isolated entry');
   await page.locator('a[href="/"]:visible').first().click();await page.waitForURL(base+'/');await page.goto(base+experimentURL(slug,mode));await ready(page);await pause(page,slug);const fresh=await snapshot(slug),defaultClock=slug==='solar-system'?{initial:initial.values.date,fresh:fresh.values.date,scope:'The original sandpit starts its clock automatically; startup timing changes the fresh date. Saved entry date is still compared exactly for Back/Forward/refresh.'}:null;if(defaultClock){delete initial.values.date;delete fresh.values.date;}assert.deepEqual(fresh,initial,'A fresh explicit mode link from the directory starts at that mode default, not another history item');return{mode,operations,changed,defaultClock,scope:'Ordinary public path; native DOM read only, no forced state capture or persistence'};
  },page);await ctx.close();
 }
 if(enabled('layout')){
  const ctx=await context(),page=await ctx.newPage();
  for(const viewport of [{width:1920,height:1080},{width:320,height:720}])for(const[slug,modes]of Object.entries(confirmedModes))await check('Representative layout '+slug+' '+viewport.width,async()=>{
   await page.setViewportSize(viewport);await page.goto(base+experimentURL(slug,modes[0]));await ready(page);await pause(page,slug);const dimensions=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));assert(dimensions.document<=dimensions.viewport+1,JSON.stringify(dimensions));await shot(page,slug+'-representative-'+viewport.width,true);return{dimensions,scope:'Emulated CSS viewport; no physical phone/projector'};
  },page);
  for(const[slug,mode]of [['earth-moon','period'],['imaging','real'],['optics','resolution'],['measure','shadow']])await check('200 percent CSS zoom '+slug,async()=>{
   await page.setViewportSize({width:1366,height:768});await page.goto(base+experimentURL(slug,mode));await ready(page);await page.evaluate(()=>document.documentElement.style.zoom='2');await page.waitForTimeout(180);const dimensions=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));assert(dimensions.document<=dimensions.viewport+1,JSON.stringify(dimensions));await shot(page,slug+'-zoom-200',true);return{dimensions,scope:'CSS zoom=2 layout check; physical browser zoom still requires device/manual check'};
  },page);await ctx.close();
 }
 if(enabled('pilots')){
  const ctx=await context(),page=await ctx.newPage();
  const fingerprint=()=>page.evaluate(async()=>{const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');const a=window.__lab;return{state:a.api.getState(),source:await Promise.all(a.channels.map(values=>digest(values.buffer))),pixel:[...a.result.pixel.values],reference:a.reference?{image:await digest(a.reference.image.data),source:await Promise.all(a.reference.channels.map(values=>digest(values.buffer))),state:a.reference.state}:null};});
  for(const mode of ['real','teaching'])await check('Independent imaging recipe and source identity '+mode,async()=>{
   await page.goto(base+'/lab/imaging?mode='+mode);await ready(page);const start=await fingerprint();
   await page.locator('[data-reference]').click();const retained=await fingerprint();
   await page.locator('[data-key="mapping"]').selectOption('HSO');await page.locator('[data-key="method"]').selectOption('log');await page.waitForTimeout(250);const display=await fingerprint();
   assert.deepEqual(display.source,start.source,'Display operation mutated source arrays');assert.deepEqual(display.pixel,start.pixel,'Display changed the selected source value');assert.deepEqual(display.reference,retained.reference,'Frozen reference changed with the live display');
   if(mode==='teaching'){
    await page.locator('[data-key="exposure"]').evaluate(node=>{node.value='400';node.dispatchEvent(new Event('input',{bubbles:true}));});await page.waitForTimeout(200);const measured=await fingerprint();assert.notDeepEqual(measured.source,start.source,'Exposure must change simulated measurement');assert.equal(measured.state.inputs.seed,start.state.inputs.seed);assert.deepEqual(measured.reference,retained.reference,'Frozen comparison source updated silently');
   }
   await imagingClick(page,'[data-preset="'+(mode==='real'?'mapping':'exposure')+'"]');const origin=await page.evaluate(()=>window.__lab.api.getState());
   await page.locator('[data-key="mapping"]').selectOption('HOO');await page.locator('[data-reset]').click();assert.deepEqual(await page.evaluate(()=>window.__lab.api.getState()),origin,'Reset must return to the loaded preset');
   const recipePanel=page.locator('.imaging-recipe');await imagingReveal(page,'.imaging-recipe');if(!await recipePanel.evaluate(node=>node.open))await recipePanel.locator('summary').click();
   const download=page.waitForEvent('download');await page.locator('[data-save-scene]').click();const file=path.join(output,'imaging-'+mode+'-scene.json');await(await download).saveAs(file);const exported=JSON.parse(fs.readFileSync(file,'utf8'));assert.deepEqual(exported,origin);assert.equal(exported.comparison.saved,false);
   await page.goto(base+'/lab/imaging?mode='+mode);await ready(page);await page.locator('[data-scene-file]').setInputFiles(file);await page.waitForTimeout(250);assert.deepEqual(await page.evaluate(()=>window.__lab.api.getState()),origin,'Fresh document imported scene differs');
   for(const patch of [{formatVersion:999},{mode:'not-a-dataset'},{modelVersion:'unverified-future-model'},{data:{...origin.data,metadataHash:'0'.repeat(64)}},{resourceURL:'javascript:alert(1)'},{inputs:{...origin.inputs,seed:-1}},{inputs:{...origin.inputs,exposure:null}}]){
    const bad={...origin,...patch};await page.locator('[data-scene-file]').setInputFiles({name:'invalid-scene.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))});await page.waitForTimeout(120);assert.deepEqual(await page.evaluate(()=>window.__lab.api.getState()),origin,'Invalid import partially changed the scene');assert(/导入失败/.test(await page.locator('#imaging-feedback').innerText()));
   }
   await imagingClick(page,'[data-enlarge]');assert(await page.locator('.imaging-focus').evaluate(node=>node.open));await page.locator('#imaging-rgb').focus();await page.keyboard.press('ArrowRight');const moved=await page.evaluate(()=>window.__lab.api.getState());assert.equal(moved.pixel.x,origin.pixel.x+1);await page.keyboard.press('Escape');assert(!await page.locator('.imaging-focus').evaluate(node=>node.open));assert(await page.locator('[data-enlarge]').evaluate(node=>node===document.activeElement));assert.deepEqual(await page.evaluate(()=>window.__lab.api.getState()),moved);
   if(mode==='teaching'){
    await page.locator('[data-reset]').click();const fixed=await fingerprint();await page.locator('[data-resample]').evaluate(node=>{for(const details of node.parentElement.closest('details')?[node.parentElement.closest('details')]:[])details.open=true;});await page.locator('[data-resample]').click();const resampled=await fingerprint();assert.equal(resampled.state.inputs.seed,fixed.state.inputs.seed+1);assert.notDeepEqual(resampled.source,fixed.source);await page.locator('[data-reset]').click();assert.deepEqual((await fingerprint()).source,fixed.source,'Reset must regenerate the same teaching source seed');
   }
   await shot(page,'pilot-imaging-'+mode+'-review',true);return{exported_recipe:file,source_before:start.source,display_source:display.source,comparison_frozen:true};
  },page);
  for(const mode of ['phase','spin','period','eclipse'])await check('Independent Moon preset recipe and atomic import '+mode,async()=>{
   await page.goto(base+'/labs/earth-moon/?mode='+mode);await ready(page);const origin=await page.evaluate(()=>window.earthMoon.getState());
   await page.evaluate(()=>window.earthMoon.setDays(window.earthMoon.state.days+.05));await page.locator('#reset').click();assert.deepEqual(await page.evaluate(()=>window.earthMoon.getState()),origin);
   const download=page.waitForEvent('download');await disclose(page.locator('#export-scene'));await page.locator('#export-scene').click();const file=path.join(output,'moon-'+mode+'-scene.json');await(await download).saveAs(file);const exported=JSON.parse(fs.readFileSync(file,'utf8'));
   await page.goto(base+'/labs/earth-moon/?mode='+mode);await ready(page);await page.locator('#import-scene').setInputFiles(file);await page.waitForTimeout(150);assert.deepEqual(await page.evaluate(()=>window.earthMoon.getState()),origin);
   for(const patch of [{version:999},{tool:'imaging'},{modelHash:'0'.repeat(64)},{state:{...exported.state,days:1e6}}]){await page.locator('#import-scene').setInputFiles({name:'invalid-scene.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...exported,...patch}))});await page.waitForTimeout(100);assert.deepEqual(await page.evaluate(()=>window.earthMoon.getState()),origin);assert(/失败/.test(await page.locator('#status').innerText()));}
   if(mode==='phase'){
    const science=await page.evaluate(()=>({k:window.earthMoon.snapshot.orbit.k,days:window.earthMoon.state.days}));await moonClick(page,'#scale');await moonClick(page,'#oblique');assert.deepEqual(await page.evaluate(()=>({k:window.earthMoon.snapshot.orbit.k,days:window.earthMoon.state.days})),science,'Display scale/camera altered physical state');
   }
   if(mode==='eclipse'){
    await page.locator('[data-preset="total"]').click();const preset=await page.evaluate(()=>window.earthMoon.getState());await page.evaluate(()=>window.earthMoon.setDays(0));assert((await page.evaluate(()=>window.earthMoon.snapshot.solar.covered))>.999);await page.locator('#reset').click();assert.deepEqual(await page.evaluate(()=>window.earthMoon.getState()),preset,'Eclipse reset must keep current preset, rather than mode default');
   }
   await shot(page,'pilot-moon-'+mode+'-review',true);return{exported_recipe:file};
  },page);await ctx.close();
 }
 if(enabled('faults')){
  const ctx=await context(),p=await ctx.newPage();
  await check('Private and maintenance paths stay outside final service root',async()=>{
   for(const url of ['/raw/2026面试试题.pdf','/course/_teacher/progress.md','/.env','/AGENTS.md','/tools/check.mjs','/server.mjs','/tests/browser-review.mjs','/build/qa/lab-refactor/','/../course/_teacher/progress.md','/assets/../course/_teacher/progress.md'])assert.equal((await ctx.request.get(base+url)).status(),404,url);
  });
  await check('Old source query and classic URL keep their tool mode',async()=>{
   for(const url of ['/labs/solar-system/?mode=compare&from=l02-compare&ui=classic','/labs/earth-moon/?mode=period&from=l03-months&ui=classic','/lab/imaging?mode=teaching&from=https%3A%2F%2Fevil.example']){await p.goto(base+url);await ready(p);const u=new URL(url,base),slug=u.pathname.includes('/labs/')?u.pathname.split('/')[2]:u.pathname.split('/')[2];assert.equal(await modeOf(p,slug),u.searchParams.get('mode'));}
  },p);
  await check('Old Chinese reading anchor stays in isolated compatibility without an open redirect',async()=>{
   const anchor='一个月为什么会有两种长度';await p.goto(base+'/read/03?returnTo=https%3A%2F%2Fevil.example#'+encodeURIComponent(anchor));assert.equal(new URL(p.url()).origin,new URL(base).origin);assert.equal(decodeURIComponent(new URL(p.url()).hash.slice(1)),anchor);assert(/讲义|资料/.test(await p.locator('body').innerText()));assert(await p.locator('a[href="/"]:visible').count()>0);return{anchor,scope:'Unconnected reader fallback; external sidecar reading is checked by separate compatibility-service evidence'};
  },p);
  await check('Unknown tool has recoverable explicit failure and valid navigation',async()=>{
   await p.goto(base+'/lab/not-a-tool');await p.getByRole('button',{name:/重试/}).first().waitFor();assert(/没有|不存在|无法/.test(await p.locator('#app').innerText()));await p.locator('a[href="/"]:visible').first().click();await p.waitForURL(base+'/');assert(await p.locator('a[href*="imaging"]').count());
  },p);
  await check('Module load failure remains isolated and retry recovers',async()=>{
   await ctx.route('**/modules/light.js',route=>route.abort('failed'));await p.goto(base+'/lab/light?mode=thermal');await p.getByRole('button',{name:/重试/}).first().waitFor();await ctx.unroute('**/modules/light.js');await p.getByRole('button',{name:/重试/}).first().click();await ready(p);assert.equal(await modeOf(p,'light'),'thermal');
  },p);
  await check('Slow earlier data cannot replace a later route',async()=>{
   await ctx.route('**/modules/stars.js',async route=>{await delay(1500);try{await route.continue();}catch{}});await p.goto(base+'/lab/stars?mode=evolution');await p.locator('a[href="/"]:visible').first().click();await p.waitForURL(base+'/');await delay(1800);assert.equal(new URL(p.url()).pathname,'/');assert(await p.locator('a[href*="earth-moon"]').count());await ctx.unroute('**/modules/stars.js');
  },p);await ctx.close();
  for(const [name,body,status]of [['404','missing',404],['invalid-array','not a Float32 array',200]]){
   const damaged=await context(),dp=await damaged.newPage();await damaged.route('**/data/imaging/673-linear.f32',route=>route.fulfill({status,body,contentType:'application/octet-stream'}));
   await check('Real imaging '+name+' is explicit, not silently replaced with synthetic data',async()=>{
    await dp.goto(base+'/lab/imaging?mode=real');await ready(dp);await dp.locator('.imaging-load-error:visible').waitFor();assert.equal(await modeOf(dp,'imaging'),'real');assert(/未用合成|未载入|不可用/.test(await dp.locator('.imaging-load-error').innerText()));await damaged.unroute('**/data/imaging/673-linear.f32');await dp.locator('[data-retry-real]').click();await dp.waitForFunction(()=>window.__lab?.channels?.length===3);assert.equal(await modeOf(dp,'imaging'),'real');
   },dp);await damaged.close();
  }
  const rapid=await context(),rp=await rapid.newPage();
  await check('Rapid 2D to 3D switch cannot overwrite the later 2D star mode',async()=>{
   let release;const held=new Promise(resolve=>{release=resolve;});
   await rapid.route('**/shared/scene.js',async route=>{await held;try{await route.continue();}catch{}});
   try{
    await rp.goto(base+'/lab/stars?mode=hr');await ready(rp);await disclose(rp.locator('[data-mode="pulsar"]'));await rp.locator('[data-mode="pulsar"]').click();
    await rp.waitForFunction(()=>document.querySelector('#lab-mount').dataset.modeLoading==='pulsar');
    // Reopen the existing mode entry. Hold the import until the later 2D choice actually wins.
    await disclose(rp.locator('[data-mode="ia"]'));await rp.locator('[data-mode="ia"]').click();assert.equal(await modeOf(rp,'stars'),'ia');
    release();await delay(1500);assert.equal(await modeOf(rp,'stars'),'ia');assert.equal(await rp.locator('#lab-mount').getAttribute('data-view'),'chart');assert(await rp.locator('[data-plot]:visible').count()>0);assert.equal(new URL(rp.url()).pathname,'/lab/stars');
   }finally{release();}
  },rp);await rapid.close();
  const noGL=await context(undefined,{webglFault:true}),ng=await noGL.newPage();
  await check('Pure two-dimensional imaging works when all WebGL contexts are denied',async()=>{for(const mode of ['real','teaching']){await ng.goto(base+'/lab/imaging?mode='+mode);await ready(ng);assert(await ng.locator('canvas:visible').count()>0);await changeControl(ng,'imaging');assert.equal(await modeOf(ng,'imaging'),mode);}},ng);
  for(const [slug,mode]of [['stars','hr'],['stars','evolution'],['stars','ia'],['sky','calendar'],['orbits','orbit'],['orbits','staging'],['orbits','landing'],['measure','shadow'],['measure','distance']])await check('Existing 2D mode without WebGL '+slug+'/'+mode,async()=>{const start=requests.length;await ng.goto(base+experimentURL(slug,mode));await ready(ng);assert.equal(await modeOf(ng,slug),mode);assert(await ng.locator('canvas:visible,svg:visible,#measure-ladder:visible').count()>0);assert(!requests.slice(start).some(r=>/\/shared\/scene\.js|three(?:\.module)?(?:\.min)?\.js|OrbitControls\.js/.test(r.url)),'Direct 2D mode downloaded 3D runtime');},ng);
  await check('Three-dimensional Moon explicitly explains unavailable WebGL',async()=>{await ng.goto(base+'/labs/earth-moon/?mode=phase');await ng.waitForTimeout(1000);assert(/WebGL|图形|三维|渲染/.test(await ng.locator('body').innerText()));assert(await ng.locator('[role="alert"]:visible,.load-error:visible,#loading:visible').count()>0);},ng);await noGL.close();
  const moonFailures=await context(),mf=await moonFailures.newPage();
  await check('Moon missing texture reports failure and ordinary retry loads the real resource',async()=>{
   await moonFailures.route('**/textures/moon.jpg',route=>route.fulfill({status:404,body:'missing texture'}));await mf.goto(base+'/labs/earth-moon/?mode=spin');await mf.locator('#startup-error:visible').waitFor();assert(/贴图|载入失败/.test(await mf.locator('#startup-message').innerText()));assert(await mf.locator('#play').isDisabled());assert(await mf.locator('a[href="/"]:visible').count()>0);await moonFailures.unroute('**/textures/moon.jpg');await mf.locator('#retry').click();await ready(mf);assert.equal(await modeOf(mf,'earth-moon'),'spin');await shot(mf,'moon-texture-retry');
  },mf);
  await check('Moon actual WebGL context loss pauses and reload retry recovers',async()=>{
   await mf.goto(base+'/labs/earth-moon/?mode=phase');await ready(mf);await mf.locator('#play').click();const lost=await mf.locator('canvas').first().evaluate(canvas=>{const gl=canvas.getContext('webgl2')||canvas.getContext('webgl');const extension=gl?.getExtension('WEBGL_lose_context');if(!extension)return false;extension.loseContext();return true;});assert(lost,'Software WebGL exposes real loss extension');await mf.locator('#startup-error:visible').waitFor();assert(/上下文已丢失/.test(await mf.locator('#startup-message').innerText()));assert(await mf.locator('#play').isDisabled());assert.equal(await mf.evaluate(()=>window.earthMoon.state.ready),false);await mf.locator('#retry').click();await ready(mf);assert.equal(await modeOf(mf,'earth-moon'),'phase');await shot(mf,'moon-context-loss-retry');
  },mf);await moonFailures.close();
 }
 if(enabled('stability')){
  const ctx=await context({width:1366,height:768},{lifecycle:true}),page=await ctx.newPage();const begin=Date.now(),finish=begin+minutes*60000,rounds=[],errorsAtStart=pageErrors.length;
  assert(Number.isFinite(minutes)&&minutes>0,'Use a real positive elapsed duration');
  await page.goto(base+'/');await page.locator('#app a[href*="earth-moon"]').first().waitFor();
  while(Date.now()<finish){
   for(const[slug,mode]of [['earth-moon','phase'],['alignments','mars'],['imaging','teaching'],['orbits','orbit'],['sky','day'],['stars','pulsar']]){
    if(Date.now()>=finish)break;
    await check('Timed stability round '+rounds.length+' '+slug+'/'+mode,async()=>{
     await openFromDirectory(page,slug,mode);
     const playSelectors=experimentAdapters[slug].pause.map(s=>s.selector);if(playSelectors.length){const play=page.locator(playSelectors.join(',')).first();if(await play.count()&&await play.isVisible()&&!await play.isDisabled())await play.click();}
     await delay(7000);await pause(page,slug);await changeControl(page,slug);await page.locator('a[href="/"]:visible').first().click();await page.waitForURL(base+'/');await delay(350);
     const lifecycle=await page.evaluate(()=>window.__standaloneLifecycle.snapshot());assert.equal(lifecycle.pending_animation_frames,0,'Unmounted module still owns an animation callback');assert.equal(lifecycle.active_intervals,0,'Unmounted module still owns an interval');
     rounds.push({slug,mode,elapsed_ms:Date.now()-begin,lifecycle});return{elapsed_ms:Date.now()-begin,lifecycle};
    },page);
   }
  }
  await check('Actual timed stability duration and error record',async()=>{assert(Date.now()-begin>=minutes*60000);assert.deepEqual(pageErrors.slice(errorsAtStart),[]);return{requested_minutes:minutes,actual_duration_ms:Date.now()-begin,cycles:rounds.length,scope:'Representative continuous play/pause and tool navigation; not a universal leak or hardware certification'};});
  await ctx.close();
 }
}catch(error){
 checks.push({name:'Unhandled acceptance harness or environment error',state:'failed',error:error.stack||String(error)});process.exitCode=1;
}finally{
 if(!checks.length)checks.push({name:'Acceptance executed real checks',state:'failed',error:'No checks ran; this cannot be reported as passed'});
 if(initialManifestHash&&fs.existsSync(path.join(packageRoot,'web/observatory/runtime-assets.json'))&&hash(fs.readFileSync(path.join(packageRoot,'web/observatory/runtime-assets.json')))!==initialManifestHash)checks.push({name:'Package remains unchanged throughout the acceptance run',state:'failed',error:'The runtime manifest changed during this run; repeat on one locked package'});
 await browser.close();save();const file=path.join(output,part+'-checks.json'),data=JSON.parse(fs.readFileSync(file,'utf8'));data.finished_at=new Date().toISOString();data.state=checks.some(c=>c.state==='failed')?'failed':'passed';fs.writeFileSync(file,JSON.stringify(data,null,2));
 if(data.state==='failed')process.exitCode=1;
}



