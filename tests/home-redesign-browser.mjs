import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {labs,topics,confirmedModes,labURL} from '../web/observatory/shared/tool-registry.js';
const arg=(k,d)=>process.argv.includes(k)?process.argv[process.argv.indexOf(k)+1]:d,base=arg('--base','http://127.0.0.1:4391'),before=arg('--before','http://127.0.0.1:4390'),out=path.resolve(arg('--out','build/qa/frontend-round2-20261019/home/browser'));
const {chromium}=createRequire(import.meta.url)(arg('--playwright',process.env.PLAYWRIGHT_MODULE||'playwright')),executablePath=arg('--browser',process.env.BROWSER_EXECUTABLE);
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),checks=[],errors=[];
const luminance=color=>{const rgb=color.match(/[\d.]+/g).slice(0,3).map(Number).map(c=>c/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
const contrast=(foreground,background)=>{const a=luminance(foreground),b=luminance(background);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);};
async function check(name,fn){try{const evidence=await fn();checks.push({name,passed:true,evidence});console.log('PASS '+name);}catch(e){checks.push({name,passed:false,error:e.stack});process.exitCode=1;console.error('FAIL '+name+' '+e.message);}}
async function home(page,url=base){await page.goto(url+'/');await page.waitForSelector('.tool-row');await page.evaluate(()=>document.fonts.ready);}
const evidence=page=>page.evaluate(()=>({viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},documentWidth:document.documentElement.scrollWidth,title:document.querySelector('h1')?.textContent,font:getComputedStyle(document.querySelector('h1')).fontFamily,titleSize:getComputedStyle(document.querySelector('h1')).fontSize,images:[...document.querySelectorAll('#app img')].map(e=>({src:e.currentSrc,width:e.clientWidth,height:e.clientHeight,loaded:e.complete&&e.naturalWidth>0})),links:[...document.querySelectorAll('.tool-row')].map(e=>({href:e.getAttribute('href'),text:e.textContent,hidden:e.hidden})),canvases:document.querySelectorAll('#app canvas').length}));
try{
 for(const[width,height]of[[1440,900],[1280,600],[768,1024],[390,844],[320,720]])await check(`Homepage baseline/current ${width}x${height}`,async()=>{
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
  try{await home(page,before);await page.screenshot({path:path.join(out,`before-${width}x${height}.png`),fullPage:true});const original=await evidence(page);
   await home(page);await page.waitForFunction(()=>document.querySelector('.home-moon-image')?.complete);const current=await evidence(page);
   const action=page.locator('.home-invitation .al-action'),primary=await action.evaluate(e=>{const s=getComputedStyle(e);return{foreground:s.color,background:s.backgroundColor};});primary.contrast=contrast(primary.foreground,primary.background);assert(primary.contrast>=4.5);current.primary=primary;
   await action.hover();const hover=await action.evaluate(e=>{const s=getComputedStyle(e);return{foreground:s.color,background:s.backgroundColor};});assert(contrast(hover.foreground,hover.background)>=4.5);await action.focus();assert(parseFloat(await action.evaluate(e=>getComputedStyle(e).outlineWidth))>=2);await page.locator('h1').click();
   assert.equal(current.viewport.width,width);assert(current.documentWidth<=width);assert.equal(current.links.length,11);assert.equal(current.canvases,0);assert(current.images[0].loaded);
   assert.deepEqual(current.links.map(x=>x.href),labs.map(l=>labURL(l.slug)));for(const l of labs)assert(current.links.find(x=>x.href===labURL(l.slug)).text.includes(l.question));
   assert.equal(await page.locator('.home-invitation .al-action').getAttribute('href'),'/labs/earth-moon/?mode=phase');
   await page.screenshot({path:path.join(out,`after-${width}x${height}.png`),fullPage:true});await page.screenshot({path:path.join(out,`after-${width}x${height}-viewport.png`)});
   fs.writeFileSync(path.join(out,`layout-${width}x${height}.json`),JSON.stringify({original,current},null,2));return current;
  }finally{await page.close();}
 });
 await check('Directory anchor, keyboard filter, registry identity and return history',async()=>{
  const page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',e=>errors.push(e.message));
  try{await home(page);await page.locator('.home-directory-jump').click();assert.equal(await page.evaluate(()=>location.hash),'#tools');assert.equal(await page.evaluate(()=>document.activeElement.id),'tools');const states=[];
   for(const topic of topics){await page.locator(`[data-filter=${topic.key}]`).focus();await page.keyboard.press('Enter');const count=await page.locator('.tool-row:visible').count();assert.equal(count,labs.filter(l=>l.topic===topic.key).length);states.push({topic:topic.key,count});}
   await page.locator('[data-filter=all]').click();assert.equal(await page.locator('.tool-row:visible').count(),11);
   await page.locator('.tool-row[href="/lab/light"]').click();await page.waitForFunction(()=>window.__lab?.name==='light');await page.goBack();await page.waitForSelector('.home-opening');assert.equal(await page.locator('.tool-row').count(),11);assert.equal(await page.evaluate(()=>location.hash),'#tools');
   await page.reload();await page.waitForSelector('.home-opening');assert.equal(await page.locator('.tool-row').count(),11);return{states,modeCount:Object.values(confirmedModes).flat().length,anchorAndHistory:true};
  }finally{await page.close();}
 });
 await check('Moon preview failure preserves dimensions, question and working primary entry',async()=>{
  const page=await browser.newPage({viewport:{width:390,height:844}});await page.route('**/data/home/moon-*.webp',r=>r.abort());
  try{await home(page);await page.waitForSelector('.home-image-error:not([hidden])');const data=await evidence(page);assert(data.documentWidth<=390);assert(await page.locator('.home-invitation .al-action').isVisible());assert((await page.locator('.home-moon-frame').boundingBox()).height>300);await page.screenshot({path:path.join(out,'image-failure-390.png'),fullPage:true});
   await page.locator('.home-invitation .al-action').click();await page.waitForURL('**/labs/earth-moon/?mode=phase');await page.waitForSelector('#phase-ui:not([hidden])');return{entry:'earth-moon/phase',previewFailure:'explicit text, reserved frame, primary action remains available'};
  }finally{await page.close();}
 });
 await check('Font failure keeps Chinese question, native controls and directory readable',async()=>{
  const page=await browser.newPage({viewport:{width:320,height:720}});await page.route(/\.(woff2?|ttf)(?:\?|$)/,r=>r.abort());
  try{await home(page);const data=await evidence(page);assert(data.documentWidth<=320);assert((await page.locator('h1').innerText()).includes('月亮'));await page.locator('.home-directory-jump').click();await page.locator('[data-filter=light]').click();assert.equal(await page.locator('.tool-row:visible').count(),3);await page.screenshot({path:path.join(out,'font-failure-320.png'),fullPage:true});return data;}finally{await page.close();}
 });
 await check('Sources directory keeps eleven method links, image credits, keyboard return and native URLs',async()=>{
  const data=[];for(const width of[1440,390]){const page=await browser.newPage({viewport:{width,height:900}});try{await home(page);await page.locator('.home-reading a[href="/sources"]').click();await page.waitForSelector('.entry-sources');assert.equal(await page.locator('.entry-source-link').count(),11);assert.equal(await page.locator('.entry-source-topic').count(),4);const layout=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));assert(layout.scrollWidth<=layout.width);
   for(const link of await page.locator('.entry-source-link').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href'))))assert.equal((await page.request.get(base+link)).status(),200);
   assert((await page.locator('.entry-source-images').innerText()).includes('A. M. Koekemoer (STScI)'));await page.screenshot({path:path.join(out,`sources-${width}.png`),fullPage:true});await page.locator('.entry-back').focus();await page.keyboard.press('Enter');await page.waitForSelector('.home-opening');data.push(layout);
  }finally{await page.close();}}return data;
 });
 await check('Failed module loading offers real retry and returns to the functioning catalogue',async()=>{
  const page=await browser.newPage({viewport:{width:390,height:844}});await page.route('**/modules/light.js',r=>r.abort());try{await home(page);await page.locator('.home-directory-jump').click();await page.locator('.tool-row[href="/lab/light"]').click();await page.waitForSelector('.load-error');assert(await page.locator('[data-retry]').isVisible());await page.screenshot({path:path.join(out,'tool-load-failure-390.png'),fullPage:true});await page.locator('.load-error a[href="/"]').click();await page.waitForSelector('.home-opening');assert.equal(await page.locator('.tool-row').count(),11);return{failure:'module network failure',recovery:'return to live catalogue'};}finally{await page.close();}
 });
 await check('Continuous native homepage exploration recording',async()=>{
  const context=await browser.newContext({viewport:{width:1280,height:800},recordVideo:{dir:path.join(out,'recordings'),size:{width:1280,height:800}}}),page=await context.newPage();
  try{await home(page);await page.waitForTimeout(1200);await page.locator('.home-directory-jump').click();await page.waitForTimeout(800);await page.locator('[data-filter=light]').click();await page.waitForTimeout(900);await page.locator('[data-filter=stars]').click();await page.waitForTimeout(900);await page.locator('[data-filter=all]').click();await page.waitForTimeout(800);await page.locator('.tool-row[href="/lab/light"]').click();await page.waitForFunction(()=>window.__lab?.name==='light');await page.waitForTimeout(900);await page.goBack();await page.waitForSelector('.home-opening');await page.waitForTimeout(800);await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(1100);return{actions:['directory anchor','light filter','stars filter','all tools','enter actual light tool','browser back','return to Moon opening'],video:await page.video().path()};}finally{await context.close();}
 });
 assert.deepEqual(errors,[]);
}catch(e){process.exitCode=1;errors.push(e.stack);}
finally{fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({base,before,executedAtUTC:new Date().toISOString(),browser:browser.version(),scope:'Five simulated viewports; actual mouse/keyboard/native links and recorded browser actions. Native 200% and performance owned by integration QA.',passed:checks.filter(c=>c.passed).length,total:checks.length,checks,errors},null,2)+'\n');await browser.close();}
