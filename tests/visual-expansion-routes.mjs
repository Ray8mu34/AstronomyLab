import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/30674/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const arg=(name,fallback)=>process.argv.includes(name)?process.argv[process.argv.indexOf(name)+1]:fallback;
const base=arg('--base','http://127.0.0.1:4412'),out=path.resolve(arg('--out','build/qa/visual-expansion-20261028/route-checks'));fs.mkdirSync(out,{recursive:true});
const groups={'galaxy-measurements':['distance','rotation','mass'],cosmology:['expansion','distance'],tides:['locking','earth-moon'],'planet-environments':['balance','atmosphere','escape'],lunisolar:['calendar','intercalation'],'image-calibration':['calibration','photometry'],'stellar-interior':['equilibrium','thermostat','transport'],'supernova-light':['diffusion','radioactivity']};
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const checks=[];
async function check(name,fn){try{checks.push({name,state:'passed',evidence:await fn()});}catch(e){checks.push({name,state:'failed',error:String(e.stack)});}}
const ready=page=>page.waitForFunction(()=>document.querySelector('#lab-mount')?.dataset.experimentStateReady==='true');
try{
 for(const [slug,modes]of Object.entries(groups))for(const mode of modes){
  await check(`${slug}/${mode} inherited classic URL`,async()=>{
   const context=await browser.newContext({viewport:{width:320,height:720}}),page=await context.newPage();
   try{
    await page.goto(`${base}/lab/${slug}?mode=${mode}&ui=classic`);await ready(page);
    const result=await page.evaluate(slug=>({layout:document.documentElement.dataset.alRouteLayout,style:[...document.styleSheets].some(s=>s.href?.endsWith('/modules/'+slug+'.css')),overflow:document.documentElement.scrollWidth-innerWidth,nav:document.querySelectorAll('.al-workspace-navigation').length}),slug);
    assert.equal(result.layout,'workspace');assert(result.style);assert(result.overflow<=1);assert.equal(result.nav,1);
    await page.locator('.al-workspace-brand').click();await page.waitForSelector('.home-catalogue');assert(new URL(page.url()).searchParams.get('ui')==='classic');return result;
   }finally{await context.close();}
  });
  await check(`${slug}/${mode} 683x384 reflow`,async()=>{
   const context=await browser.newContext({viewport:{width:683,height:384}}),page=await context.newPage();
   try{
    await page.goto(`${base}/lab/${slug}?mode=${mode}`);await ready(page);await page.evaluate(()=>document.fonts.ready);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    const labels=page.locator('label:has(input[type=range]):visible');
    for(let i=0;i<await labels.count();i++){
     const label=labels.nth(i);await label.click({position:{x:8,y:8}});assert(await label.evaluate(e=>e.control===document.activeElement),'Label activation must focus its input');
    }
    if(mode===modes[0])await page.screenshot({path:path.join(out,slug+'-683.png'),fullPage:true});
    return {labels:await labels.count()};
   }finally{await context.close();}
  });
 }
 for(const slug of Object.keys(groups))await check(`${slug} module failure and retry`,async()=>{
  const context=await browser.newContext(),page=await context.newPage(),pattern=`**/modules/${slug}.js`;
  try{
   await page.route(pattern,route=>route.abort());await page.goto(base+'/lab/'+slug);await page.waitForSelector('[data-retry]');assert(await page.locator('[role=alert]').isVisible());
   await page.unroute(pattern);await page.locator('[data-retry]').click();await ready(page);assert.equal(await page.locator('.al-workspace-navigation').count(),1);
   assert.equal((await page.request.get(base+'/sources/'+slug+'.md')).status(),200);return {recovered:true};
  }finally{await context.close();}
 });
 await check('leaving a slow new route never mounts its late response over the directory',async()=>{
  const context=await browser.newContext(),page=await context.newPage();
  try{
   await page.route('**/modules/cosmology.css',async route=>{await new Promise(resolve=>setTimeout(resolve,800));await route.continue();});
   await page.goto(base+'/');await page.locator('.home-tool[href="/lab/cosmology"]').click();await page.waitForSelector('.loading');await page.goBack();await page.waitForSelector('.home-catalogue');await page.waitForTimeout(1000);
   assert.equal(await page.locator('.cosmology-lab').count(),0);assert(await page.locator('.home-catalogue').isVisible());return {lateMount:false};
  }finally{await context.close();}
 });
}finally{await browser.close();fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({checks},null,2));console.log(JSON.stringify({checks:checks.length,passed:checks.filter(c=>c.state==='passed').length,failures:checks.filter(c=>c.state==='failed')}));if(checks.some(c=>c.state==='failed'))process.exitCode=1;}
