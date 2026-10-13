import fs from'node:fs';import path from'node:path';import{createRequire}from'node:module';import assert from'node:assert/strict';import{moonReveal,moonClick}from'./moon-disclosure.mjs';
const arg=(k,d)=>process.argv.includes(k)?process.argv[process.argv.indexOf(k)+1]:d,base=arg('--base','http://127.0.0.1:4353'),out=arg('--out','output/earth-moon-eclipse/round1');fs.mkdirSync(out,{recursive:true});
const{chromium}=createRequire(import.meta.url)('C:/Users/30674/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),screens=[],steps=[],errors=[];
const ready=async p=>{await p.waitForFunction(()=>window.earthMoon?.state.ready&&document.body.classList.contains('eclipse-observing'));await p.waitForTimeout(350);},shot=async(p,name)=>{await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);const file=out+'/'+name+'.png';await p.screenshot({path:file,fullPage:true});screens.push({name,path:file,viewport:await p.evaluate(()=>({width:innerWidth,height:innerHeight})),state:await p.evaluate(()=>earthMoon.getState())});},preset=async(p,n)=>{await p.click('#eclipse-presets>summary');await p.click(`[data-preset="${n}"]`);await p.waitForTimeout(200);},local=async(p,val)=>{await p.locator('#eclipse-time').fill(String(val));await p.locator('#eclipse-time').dispatchEvent('input');await p.waitForTimeout(200);};
try{
 const ctx=await browser.newContext({viewport:{width:1440,height:900}}),p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'/labs/earth-moon/?mode=eclipse');await ready(p);await shot(p,'solar-default');
 for(const n of['total','annular','partial']){await preset(p,n);await local(p,0);await shot(p,'solar-'+n);}
 await p.click('#eclipse-condition-entry');await shot(p,'solar-conditions');await p.click('#eclipse-section-entry');await shot(p,'solar-conditions-shadow');await p.click('#eclipse-close');await shot(p,'solar-shadow');await p.click('#eclipse-section-entry');
 await preset(p,'lunar');await shot(p,'lunar-default');await local(p,0);await shot(p,'lunar-total');await p.click('#eclipse-condition-entry');await moonClick(p,'#red');await shot(p,'lunar-conditions-red');await p.click('#eclipse-section-entry');await shot(p,'lunar-conditions-shadow');await p.click('#eclipse-close');await p.click('#eclipse-section-entry');await p.click('#observe-toggle');await shot(p,'switched-solar-same-day');await p.click('#observe-toggle');await p.click('#reset');await shot(p,'loaded-lunar-reset');
 for(const[w,h,name]of[[390,844,'mobile'],[320,720,'narrow'],[1366,600,'short']]){await p.setViewportSize({width:w,height:h});await preset(p,'miss');await shot(p,name+'-solar');await p.click('#eclipse-condition-entry');await p.click('#eclipse-section-entry');await shot(p,name+'-solar-conditions-shadow');await p.click('#eclipse-close');await preset(p,'lunar');await local(p,0);await shot(p,name+'-lunar');await p.click('#eclipse-condition-entry');await shot(p,name+'-lunar-conditions');await p.click('#eclipse-close');}
 await ctx.close();
 // A separate uninterrupted native capture: no screenshot latency, fake
 // frames, speed-up or trimming. Every recorded operation uses native UI.
 const rc=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:out+'/raw',size:{width:1440,height:900}}}),r=await rc.newPage();r.on('pageerror',e=>errors.push(e.message));await r.goto(base+'/labs/earth-moon/?mode=eclipse');await ready(r);const start=Date.now(),step=async(name,fn,delay=450)=>{await fn();await r.waitForTimeout(delay);steps.push({name,elapsedMs:Date.now()-start,state:await r.evaluate(()=>earthMoon.getState()),kind:await r.locator('#phase-name').textContent()});};
 await step('默认太阳观察：新月却无食',async()=>{},900);
 await step('载入日全食起点',()=>preset(r,'total'),800);
 await step('拖动原空间月球，改变当前模型状态',async()=>{const pos=await r.evaluate(()=>{const lab=earthMoon,b=lab.renderer.domElement.getBoundingClientRect(),a=lab.moon.position.clone().project(lab.camera),v=lab.moon.position.clone().applyAxisAngle(lab.moon.position.clone().set(0,0,1),.04).project(lab.camera);return{x:b.x+(a.x+1)*b.width/2,y:b.y+(1-a.y)*b.height/2,tx:b.x+(v.x+1)*b.width/2,ty:b.y+(1-v.y)*b.height/2};});await r.mouse.move(pos.x,pos.y);await r.mouse.down();await r.mouse.move(pos.tx,pos.ty,{steps:24});await r.mouse.up();},700);
 await step('复位回已载入日全起点',()=>r.click('#reset'),500);
 await step('原局部小时滑到对齐前0.72小时',()=>local(r,-.72),300);
 await step('播放原模型轨道并观察日偏→日全',()=>r.click('#play'),4500);
 await step('暂停',()=>r.click('#play'),500);
 await step('展开条件',()=>r.click('#eclipse-condition-entry'),350);
 await step('调整距离观察日环条件',async()=>{await moonReveal(r,'#distance');await r.locator('#distance').fill('405000');await r.locator('#distance').dispatchEvent('input');},700);
 await step('展开必要影锥解释',()=>r.click('#eclipse-section-entry'),650);
 await step('关闭条件：主圆面和几何位置不变',()=>r.click('#eclipse-close'),500);
 await step('关闭影锥',()=>r.click('#eclipse-section-entry'),350);
 await step('载入月全食起点：改为地心月面观察',()=>preset(r,'lunar'),600);
 await step('调整到对齐前0.72小时',()=>local(r,-.72),350);
 await step('播放月面入影',()=>r.click('#play'),4500);
 await step('暂停月食',()=>r.click('#play'),400);
 await step('展开月食条件并启用定性红光',async()=>{await r.click('#eclipse-condition-entry');await moonClick(r,'#red');},600);
 await step('月食影锥与同刻月面',()=>r.click('#eclipse-section-entry'),650);
 await step('条件与影锥同时展开时播放月面入影',()=>r.click('#play'),1200);
 await step('组合态暂停，观测与必要几何持续可见',()=>r.click('#play'),350);
 await step('关闭条件和剖面',async()=>{await r.click('#eclipse-close');await r.click('#eclipse-section-entry');},350);
 await step('保留时刻切为地面太阳观察',()=>r.click('#observe-toggle'),600);
 await step('返回地心月面观察',()=>r.click('#observe-toggle'),600);
 await step('复位回月全载入起点并暂停',()=>r.click('#reset'),900);
 assert.equal(errors.length,0,errors.join('\n'));const video=r.video();await rc.close();const raw=await video.path();fs.copyFileSync(raw,out+'/operations.webm');fs.copyFileSync(raw,out+'/raw/uncut.webm');fs.writeFileSync(out+'/recording.json',JSON.stringify({base,steps,errors,raw,uncut:true,syntheticFrames:false,environment:'Native Edge software WebGL'},null,2));
}finally{fs.writeFileSync(out+'/screens.json',JSON.stringify(screens,null,2));await browser.close();}
