import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
const arg=(n,d)=>process.argv.includes(n)?process.argv[process.argv.indexOf(n)+1]:d,base=arg('--base','http://127.0.0.1:4390'),out=path.resolve(arg('--out','build/qa/frontend-round2-20261019/stars/siblings-before'));
const {chromium}=createRequire(import.meta.url)(arg('--playwright','C:/Users/30674/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({executablePath:arg('--browser','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'),headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),evidence=[];
for(const viewport of [{width:1440,height:900},{width:1280,height:600},{width:768,height:1024},{width:390,height:844},{width:320,height:720}]){
 const context=await browser.newContext({viewport}),page=await context.newPage();
 for(const[tool,mode]of [['stars','evolution'],['stars','pulsar'],['stars','collapse'],['stars','ia'],['measure','shadow'],['measure','jupiter'],['measure','s2'],['measure','distance']].filter(([tool,mode])=>!arg('--only','')||arg('--only','')===`${tool}/${mode}`)){
  await page.goto(`${base}/lab/${tool}?mode=${mode}`);await page.waitForFunction(m=>window.__lab?.state.mode===m,mode);await page.waitForTimeout(500);const file=`${tool}-${mode}-${viewport.width}.png`;await page.screenshot({path:path.join(out,file),fullPage:true});evidence.push({file,tool,mode,requested:viewport,actual:await page.evaluate(()=>({width:innerWidth,height:innerHeight,dpr:devicePixelRatio})),state:await page.evaluate(()=>structuredClone(window.__lab.state)),result:await page.evaluate(()=>structuredClone(window.__lab.result))});
 }await context.close();
}await browser.close();fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify({base,evidence},null,2));console.log(JSON.stringify({screenshots:evidence.length,out}));
