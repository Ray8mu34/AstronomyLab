import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {confirmedModes, experimentURL} from '../web/observatory/shared/course-map.js';
import {pathsForExperiment, readingURL} from '../web/observatory/shared/learning-paths.js';

const option=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
const base=option('--base','http://127.0.0.1:4181');
const output=path.resolve(option('--out','build/qa/review-improvements'));
const modulePath=option('--playwright',process.env.PLAYWRIGHT_MODULE||'playwright');
const browserPath=option('--browser',process.env.BROWSER_EXECUTABLE);
const part=option('--part','all');
const {chromium}=createRequire(import.meta.url)(modulePath);
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({...(browserPath?{executablePath:browserPath}:{}),headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const checks=[],screenshots=[],errors=[];
const mark=(name,detail={})=>{checks.push({name,state:'passed',...detail});console.log('PASS '+name);};
const shot=async(page,name)=>{const file=path.join(output,name+'.png');await page.screenshot({path:file});screenshots.push({name,path:file,visual_review:'pending'});};
const ready=async(page)=>{await page.locator('[data-learning-guide]:visible').first().waitFor();await page.locator('[data-experiment-state-ready="true"]').waitFor();};
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let completed=false;
try {
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  for(const width of (part==='flows'?[]:[1440,390])) {
    await page.setViewportSize({width,height:width===390?844:1000});
    for(const [slug,modes] of Object.entries(confirmedModes))for(const mode of modes) {
      await page.goto(base+experimentURL(slug,mode));
      await ready(page);
      assert((await page.locator('[data-learning-question]:visible').first().innerText()).trim().length>2,slug+'/'+mode+' question');
      assert((await page.locator('[data-learning-instruction]:visible').first().innerText()).trim().length>5,slug+'/'+mode+' instruction');
      const size=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
      assert(size.scroll<=size.width+1,`${slug}/${mode} overflows at ${width}: ${size.scroll}`);
      assert(await page.locator('[data-reading-return]:visible').count()>0,slug+'/'+mode+' reading return');
      const hrefs=await page.locator('[data-reading-return]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href')));
      assert(pathsForExperiment(slug,mode).some(record=>hrefs.includes(readingURL(record))),slug+'/'+mode+' current mode paragraph');
      mark(`Guidance and paragraph return ${slug}/${mode} at ${width}`);
      if((width===390&&['earth-moon/period','optics/resolution','imaging/real','orbits/landing','sky/day'].includes(slug+'/'+mode))||(width===1440&&['stars/hr','measure/shadow','imaging/teaching'].includes(slug+'/'+mode)))await shot(page,slug+'-'+mode+'-'+width);
    }
  }
  await page.setViewportSize({width:1440,height:1000});
  const monthsAnchor='一个月为什么会有两种长度';
  const monthsSection=page.locator(`.article-body [id="${monthsAnchor}"]`);
  await page.goto(base+'/read/03#'+encodeURIComponent(monthsAnchor));
  await monthsSection.waitFor();
  await page.locator('.paragraph-experiments a[href*="earth-moon"][href*="mode=period"]').first().click();
  await ready(page);
  await page.locator('[data-reading-return]').first().click();
  await monthsSection.waitFor();
  assert.equal(decodeURIComponent(new URL(page.url()).hash.slice(1)),monthsAnchor);
  mark('Moon months paragraph opens period mode and returns to its anchor');
  await shot(page,'reading-moon-months-return');

  await page.goto(base+'/read/09');
  await page.locator('.article-body').waitFor();
  const labLink=page.locator('.paragraph-experiments a[href*="/lab/optics"][href*="mode=resolution"]').first();
  await labLink.scrollIntoViewIfNeeded();
  const before=await page.evaluate(()=>scrollY);
  await labLink.click();await ready(page);
  const aperture=page.locator('[data-key="aperture"]');
  await aperture.focus();await aperture.press('End');
  const value=await aperture.inputValue();
  await page.goBack();await page.locator('.article-body').waitFor();
  await page.waitForFunction(y=>Math.abs(scrollY-y)<100,before);
  await page.goForward();await ready(page);
  assert.equal(await page.locator('[data-key="aperture"]').inputValue(),value);
  await page.reload();await ready(page);
  assert.equal(await page.locator('[data-key="aperture"]').inputValue(),value);
  mark('SPA back/forward and refresh restore reading position and aperture');

  await page.goto(base+'/labs/earth-moon/?mode=period');await ready(page);
  const time=page.locator('#day');
  if(await time.count()) {
    await time.focus();await time.press('End');const expected=await time.inputValue();
    await page.locator('[data-reading-return]').first().click();await page.locator('.article-body').waitFor();
    await page.goBack();await ready(page);
    assert.equal(await page.locator('#day').inputValue(),expected);
    mark('Legacy document navigation restores Moon time and selected mode');
  } else throw Error('Moon time control must be explicitly tested');

  await page.goto(base+'/lab/optics?mode=resolution&ui=classic');await page.locator('.optics-guide').waitFor();await page.locator('[data-experiment-state-ready="true"]').waitFor();
  assert(!await page.locator('body').evaluate(el=>el.classList.contains('editorial')));
  await page.locator('[data-reading-return]').first().click();await page.locator('.article-body').waitFor();
  assert.equal(new URL(page.url()).searchParams.get('ui'),'classic');
  mark('Classic guidance and paragraph-return compatibility');
  await page.goto(base+'/labs/earth-moon/?mode=period&ui=classic');
  await page.locator('[data-experiment-state-ready="true"]').waitFor();
  await page.locator('[data-reading-return]').first().click();await page.locator('.article-body').waitFor();
  assert.equal(new URL(page.url()).searchParams.get('ui'),'classic');
  mark('Legacy classic paragraph-return compatibility');

  const representatives=[
    ['solar-system','compare','#comparison-metric'],['earth-moon','period','#day'],
    ['alignments','venus','[data-key="inclination"]'],['sky','sky','[data-key="latitude"]'],
    ['optics','resolution','[data-key="aperture"]'],['light','thermal','[data-key="temperature"]'],
    ['stars','pulsar','[data-key="alpha"]'],['galaxy','galaxy','[data-key="longitude"]'],
    ['imaging','real','[data-key="channel"]'],['orbits','orbit','[data-conic-key="speed"]'],
    ['measure','shadow','[data-key="length"]'],
  ];
  for(const [slug,mode,selector] of representatives) {
    await page.goto(base+experimentURL(slug,mode));await ready(page);
    const control=page.locator(selector).first();await control.waitFor({state:'attached'});
    for(const disclosure of await control.locator('xpath=ancestor::details').all())if(!await disclosure.evaluate(node=>node.open))await disclosure.locator(':scope > summary').click();
    await control.waitFor();
    const prior=await control.inputValue();
    if(await control.evaluate(node=>node.tagName==='SELECT')) {
      const other=await control.evaluate(node=>Array.from(node.options).find(option=>!option.disabled&&option.value!==node.value)?.value);
      assert(other!==undefined,slug+' alternative option');await control.selectOption(other);
    } else {await control.focus();await control.press('End');if(await control.inputValue()===prior)await control.press('Home');}
    const expected=await control.inputValue();assert.notEqual(expected,prior,slug+' changed control');
    await page.locator('[data-reading-return]').first().click();await page.locator('.article-body').waitFor();
    await page.goBack();await ready(page);assert.equal(await page.locator(selector).first().inputValue(),expected,slug+' history restore');
    await page.reload();await ready(page);assert.equal(await page.locator(selector).first().inputValue(),expected,slug+' refresh restore');
    mark('Key input restored by history and refresh: '+slug+'/'+mode);
  }
  await page.setViewportSize({width:320,height:720});
  for(const [slug,mode] of [['solar-system','compare'],['earth-moon','eclipse'],['optics','resolution'],['imaging','real'],['orbits','landing']]) {
    await page.goto(base+experimentURL(slug,mode));await ready(page);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),slug+' 320px overflow');
    mark('320px representative layout: '+slug+'/'+mode);
  }
  await shot(page,'orbits-landing-320');
  const menu=page.locator('.nav-dropdown summary');await menu.focus();await menu.press('Enter');
  assert(await page.locator('.nav-dropdown').evaluate(node=>node.open));
  await menu.press('Escape');assert(!await page.locator('.nav-dropdown').evaluate(node=>node.open));
  assert(await menu.evaluate(node=>node===document.activeElement));mark('Keyboard opens navigation; Escape closes it and retains focus');
  assert.equal(errors.length,0,JSON.stringify(errors));
  await context.close();

  const failures=[
    {name:'catalog HTTP 500',url:'**/data/catalog.json',body:'server unavailable',status:500,path:'/'},
    {name:'catalog invalid JSON',url:'**/data/catalog.json',body:'broken json',status:200,path:'/'},
    {name:'article HTTP 404',url:'**/reading/L03.html',body:'not found',status:404,path:'/read/03'},
    {name:'article HTTP 500',url:'**/reading/L03.html',body:'failure',status:500,path:'/read/03'},
    {name:'article invalid HTML',url:'**/reading/L03.html',body:'<html><body>unexpected page</body></html>',status:200,path:'/read/03'},
    {name:'sources HTTP 500',url:'**/status.json',body:'failure',status:500,path:'/sources'}
  ];
  for(const fault of failures) {
    const ctx=await browser.newContext();const p=await ctx.newPage();const faultErrors=[];
    p.on('pageerror',error=>faultErrors.push(error.message));
    await ctx.route(fault.url,route=>route.fulfill({status:fault.status,body:fault.body,contentType:fault.url.includes('catalog')?'application/json':'text/html'}));
    await p.goto(base+fault.path);
    const retry=p.getByRole('button',{name:/重试/}).first();await retry.waitFor();
    assert(await p.locator('#app').innerText());
    if(fault.name==='article HTTP 500')await shot(p,'article-load-error');
    await ctx.unroute(fault.url);await retry.click();
    await p.locator(fault.path.startsWith('/read/')?'.article-body':fault.path==='/sources'?'.sources-grid':'.editorial-intro').waitFor();
    assert.equal(faultErrors.length,0,JSON.stringify(faultErrors));
    mark('Failure explained and retry succeeds: '+fault.name);
    await ctx.close();
  }
  const startup=await browser.newContext();const sp=await startup.newPage();
  await startup.route('**/app.js',route=>route.abort('failed'));await sp.goto(base+'/');
  await sp.getByRole('heading',{name:'网站暂时无法启动'}).waitFor();
  assert(await sp.locator('a[href="/reading/L01.html"]').isVisible());
  await startup.unroute('**/app.js');await sp.getByRole('button',{name:'重试',exact:true}).click();
  await sp.locator('.editorial-intro').waitFor();mark('Startup module failure has direct reading and reload recovery');await startup.close();
  const race=await browser.newContext();const p=await race.newPage();const raceErrors=[];
  p.on('pageerror',e=>raceErrors.push(e.message));
  await race.route('**/reading/L03.html',async route=>{await delay(900);try{await route.continue();}catch{}});
  await p.goto(base+'/courses');await p.locator('.course-card[href="/read/03"]').click();
  await p.locator('.global-links>a[href="/courses"]').click();await p.locator('.course-card[href="/read/04"]').click();
  await p.locator('.article-body #L04-C01').waitFor({state:'attached'});await delay(1100);
  assert.equal(new URL(p.url()).pathname,'/read/04');assert(await p.locator('.article-body #L04-C01').count());
  assert.equal(raceErrors.length,0,JSON.stringify(raceErrors));mark('Slow earlier article cannot overwrite the later route');
  await race.close();

  const responseContext=await browser.newContext();
  for(const url of ['/sources/release-status.md','/sources/experience-review.md'])assert.equal((await responseContext.request.get(base+url)).status(),200,url);
  mark('Public release status and this review are accessible through exact aliases');
  for(const url of ['/raw/2026面试试题.pdf','/course/_teacher/progress.md','/AGENTS.md','/tools/check.mjs','/server.mjs','/tests/browser-review.mjs'])assert.equal((await responseContext.request.get(base+url)).status(),404,url);
  mark('Private and development paths remain excluded');await responseContext.close();
  completed=true;
} finally {
  await browser.close();
  fs.writeFileSync(path.join(output,'checks.json'),JSON.stringify({checked_at:new Date().toISOString(),base,part,state:completed?'passed':'failed',checks,screenshots,page_errors:errors,environment:'Headless Edge with software WebGL; viewport simulation, no physical phone or projection',human_review:'pending',classroom_trial:'pending',textbook_comparison:'pending'},null,2));
}
