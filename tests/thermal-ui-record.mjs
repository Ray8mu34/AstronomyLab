import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const arg=(n,d)=>process.argv.includes(n)?process.argv[process.argv.indexOf(n)+1]:d;
const base=arg('--base','http://127.0.0.1:4210'),out=path.resolve(arg('--out','output/thermal-ui-round1-candidate'));
fs.mkdirSync(out,{recursive:true});
const {chromium}=createRequire(import.meta.url)(arg('--playwright','C:/Users/30674/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const browser=await chromium.launch({executablePath:arg('--browser','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'),headless:true});
const ctx=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:path.join(out,'raw'),size:{width:1440,height:900}}}),page=await ctx.newPage(),steps=[];
const evidence={base,state:'in-progress',screenshots:[],steps};let started;
const wait=ms=>page.waitForTimeout(ms),step=name=>steps.push({name,time_ms:Date.now()-started});
const shot=async(name,fullPage=false)=>{const file=path.join(out,name+'.png');await page.screenshot({path:file,fullPage});evidence.screenshots.push(file);};
async function dragTemperature(target){const input=page.locator('[data-key=temperature]');await input.scrollIntoViewIfNeeded();const r=await input.boundingBox(),values=await input.evaluate(e=>({min:+e.min,max:+e.max,value:+e.value})),x=v=>r.x+8+(r.width-16)*(v-values.min)/(values.max-values.min),y=r.y+r.height/2;await page.mouse.move(x(values.value),y);await page.mouse.down();await page.mouse.move(x(target),y,{steps:35});await page.mouse.up();}
try{
 await page.goto(base+'/lab/light?mode=thermal');await page.locator('.thermal-shell:visible').waitFor();await wait(250);started=Date.now();await shot('desktop-default');step('默认：单位表面 Bλ、温度与峰位，R/L 是不同的科学量');await wait(1400);
 await dragTemperature(10000);step('直接拖动原温度滑杆；峰位向短波移动，纵轴绝对 Bλ 自动变化');assert(Math.abs((await page.evaluate(()=>window.__lab.state.temperature))-10000)<=100);await wait(1800);await shot('desktop-temperature');
 await page.locator('.thermal-conditions>summary').click();step('展开半径与光度条件；保持曲线位置/尺寸');const before=await page.evaluate(()=>window.__lab.result.luminosity);await page.locator('[data-key=radius]').press('Home');for(let i=0;i<19;i++)await page.locator('[data-key=radius]').press('ArrowRight');assert.equal(await page.evaluate(()=>window.__lab.state.radius),2);const after=await page.evaluate(()=>window.__lab.result.luminosity);assert(Math.abs(after/before-4)<1e-9);step('键盘把半径从1调到2，L变为4倍，单位表面曲线不变');await wait(1600);await shot('desktop-conditions',true);await page.locator('.thermal-conditions [data-thermal-close]').click();await wait(700);
 await page.locator('.light-advanced>summary').click();await wait(700);await page.locator('[data-key=normalize]').check();step('归一显示：只消去曲线幅度，R/L 保持');await wait(1400);await shot('desktop-normalized',true);await page.locator('.thermal-baseline>summary').click();await page.locator('[data-save]').click();step('主动保存当前参数作为基线');await wait(600);
 await dragTemperature(3000);step('再次拖温度，查看当前冷谱与已保存热谱；双方身份明确');await wait(2000);await shot('desktop-baseline',true);await page.locator('.thermal-baseline [data-thermal-close]').click();step('结束查看基线，当前条件保持');await wait(700);await page.locator('.light-advanced>summary').click();
 await page.locator('.thermal-presets>summary').click();await wait(500);await page.locator('[data-preset=solar]').click();step('使用原温度预设，保留半径/基线');await wait(900);await page.locator('.thermal-presets>summary').click();
 await page.locator('.thermal-baseline>summary').click();await page.locator('[data-reset]').click();step('原复位本模式：5800 K、1 R☉、绝对显示及原默认基线');await page.locator('.thermal-baseline [data-thermal-close]').click();assert.equal(await page.evaluate(()=>window.__lab.state.temperature),5800);await wait(1200);
 const elapsed=Date.now()-started;if(elapsed<24000)await wait(24000-elapsed);evidence.operationDurationMs=Date.now()-started;assert(evidence.operationDurationMs>=15000&&evidence.operationDurationMs<=30000);
 const video=page.video();await page.close();await ctx.close();evidence.video=path.join(out,'thermal-operations.webm');await video.saveAs(evidence.video);
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),phone=await mobile.newPage();await phone.goto(base+'/lab/light?mode=thermal');await phone.locator('.thermal-shell:visible').waitFor();await phone.waitForTimeout(200);const mobileFile=path.join(out,'mobile-default.png');await phone.screenshot({path:mobileFile,fullPage:true});evidence.screenshots.push(mobileFile);await mobile.close();evidence.state='passed';console.log(JSON.stringify({video:evidence.video,durationMs:evidence.operationDurationMs,screenshots:evidence.screenshots}));
}finally{await browser.close();fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify(evidence,null,2));}
