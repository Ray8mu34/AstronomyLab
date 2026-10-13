// Local artifact rendering, using the bundled browser runtime and installed Edge.
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/30674/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=process.cwd(),out=path.join(root,'build/qa/v02-article-render');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const records=[];
const requested=process.argv.find(a=>a.startsWith('--lessons='))?.split('=')[1].split(',').map(Number);
try{
 for(let n=1;n<=16;n++){
  if(requested&&!requested.includes(n))continue;
  const id=`L${String(n).padStart(2,'0')}`,html=path.join(root,`build/articles/${id}.html`);
  if(!fs.existsSync(html)){records.push({id,state:'missing-html'});continue;}
  const page=await browser.newPage({viewport:{width:1200,height:900},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(pathToFileURL(html).href,{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);
  const layout=await page.evaluate(()=>({title:document.querySelector('h1')?.textContent,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,mathCount:document.querySelectorAll('math').length,brokenImages:[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src),images:[...document.images].map(i=>({src:i.getAttribute('src'),natural:[i.naturalWidth,i.naturalHeight],display:[i.clientWidth,i.clientHeight]}))}));
  const shots=[];
  async function shot(name,clip){const file=path.join(out,`${id}-${name}.png`);await page.screenshot({path:file,...(clip?{clip,fullPage:true}: {})});shots.push(path.relative(root,file).replaceAll('\\','/'));}
  await shot('opening');
  const math=page.locator('math').first();
  if(await math.count()){const box=await math.boundingBox();await page.evaluate(y=>scrollTo(0,Math.max(0,y-150)),box.y);await shot('formula');}
  await page.evaluate(()=>scrollTo(0,0));
  const imgs=page.locator('article img,main img,body img');
  for(let k=0;k<await imgs.count();k++){
   await page.evaluate(()=>scrollTo(0,0));const box=await imgs.nth(k).boundingBox();if(!box)continue;
   const y=Math.max(0,box.y-75),h=Math.min(1400,layout.height-y,box.height+330);
   await shot(`figure-${k+1}`,{x:0,y,width:1200,height:Math.max(1,h)});
  }
  const lesson=fs.readdirSync(path.join(root,'course')).find(d=>d.startsWith(String(n).padStart(2,'0')+'-'));
  const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  records.push({id,state:layout.brokenImages.length||layout.scrollWidth>layout.width||errors.length?'issues':'rendered',html_sha256:hash(html),source_sha256:hash(path.join(root,'course',lesson,'lesson.md')),renderer:'installed Microsoft Edge / bundled Playwright, headless',layout,errors,screenshots:shots,model_visual_review:'pending',human_review:'pending'});
  await page.close();
 }
}finally{await browser.close();}
fs.writeFileSync(path.join(root,'build/qa/v02-article-render.json'),JSON.stringify({checked_at:new Date().toISOString(),records},null,2));
console.log(JSON.stringify(records.map(({id,state,layout,errors,screenshots})=>({id,state,math:layout?.mathCount,images:layout?.images.length,errors,screenshots:screenshots?.length})),null,2));
