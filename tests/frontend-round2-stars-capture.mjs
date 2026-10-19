import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const arg=(n,d)=>process.argv.includes(n)?process.argv[process.argv.indexOf(n)+1]:d;
const base=arg('--base','http://127.0.0.1:4390'),out=path.resolve(arg('--out','build/qa/frontend-round2-20261019/stars/before'));
const {chromium}=createRequire(import.meta.url)(arg('--playwright','C:/Users/30674/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:arg('--browser','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'),headless:true});
const evidence=[];
for(const viewport of [{width:1440,height:900},{width:1280,height:600},{width:768,height:1024},{width:390,height:844},{width:320,height:720}]){
 const context=await browser.newContext({viewport}),page=await context.newPage();
 await page.goto(base+'/lab/stars?mode=hr');await page.locator('.hr-shell:visible').waitFor();await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(250);
 for(const subject of ['sun','giant','temperature']){
  if(subject==='temperature'){await page.locator('.hr-compare-menu>summary').click();await page.locator('[data-hr-compare="temperature"]').click();}
  else await page.locator('[data-key="hrExample"]').selectOption(subject);
  await page.waitForTimeout(150);const file=`${viewport.width}-${subject}.png`;await page.screenshot({path:path.join(out,file),fullPage:true});
  evidence.push({file,requested:viewport,actual:await page.evaluate(()=>({width:innerWidth,height:innerHeight,dpr:devicePixelRatio})),state:await page.evaluate(()=>({mode:window.__lab.state.mode,example:window.__lab.state.hrExample,comparison:window.__lab.state.hrCompare,points:window.__lab.result.points}))});
 }
 await context.close();
}
await browser.close();fs.writeFileSync(path.join(out,'screenshots.json'),JSON.stringify({base,evidence},null,2));
