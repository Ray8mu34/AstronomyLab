import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {hrExamples,hrPosition} from '../web/observatory/modules/stars-hr.mjs';
const arg=(n,d)=>process.argv.includes(n)?process.argv[process.argv.indexOf(n)+1]:d;
const base=arg('--base','http://127.0.0.1:4203'),out=path.resolve(arg('--out','output/hr-ui-round1'));
fs.mkdirSync(out,{recursive:true});
const {chromium}=createRequire(import.meta.url)(arg('--playwright','C:/Users/30674/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const browser=await chromium.launch({executablePath:arg('--browser','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'),headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:path.join(out,'raw'),size:{width:1440,height:900}}}),page=await context.newPage(),steps=[];
const evidence={base,state:'in-progress',screenshots:[],steps};let started;
const wait=ms=>page.waitForTimeout(ms),step=name=>steps.push({name,time_ms:Date.now()-started});
const shot=async name=>{const file=path.join(out,name+'.png');await page.screenshot({path:file});evidence.screenshots.push(file);};
async function pick(id){const s=hrExamples.find(s=>s.id===id),p=hrPosition(s.temperature,s.luminosity),r=await page.locator('[data-plot]').boundingBox();await page.mouse.move(r.x+72+p.x*(r.width-102),r.y+45+p.y*(r.height-111),{steps:20});await page.mouse.click(r.x+72+p.x*(r.width-102),r.y+45+p.y*(r.height-111));assert.equal(await page.evaluate(()=>window.__lab.state.hrExample),id);}
try{
 await page.goto(base+'/lab/stars?mode=hr');await page.locator('.hr-shell:visible').waitFor();await wait(200);started=Date.now();await shot('desktop-default');step('默认：太阳参照与完整赫罗图');await wait(1600);
 await pick('giant');step('直接点选红巨星；虚线回读坐标，近点读数同步');await wait(1500);await page.locator('.hr-relation>summary').click();step('展开红巨星半径解释');await wait(1400);await shot('desktop-selected-giant');await wait(1000);await page.locator('.hr-relation>summary').click();
 await page.locator('.hr-compare-menu>summary').click();await wait(900);await page.locator('[data-hr-compare="temperature"]').click();step('进入同温度比较：A 为太阳参照，B 为构造示例');await wait(1400);await page.locator('.hr-relation>summary').click();step('查看同温度100倍光度与10倍半径的关系');await wait(1300);await shot('desktop-comparison');await wait(1000);await page.locator('.hr-relation>summary').click();
 await page.locator('.hr-compare-menu>summary').click();await wait(600);await page.locator('[data-hr-compare="luminosity"]').click();step('更换关系示例：同光度，温度2倍，半径1/4');await wait(1600);await page.locator('.hr-relation>summary').click();await wait(1000);await page.locator('.hr-relation>summary').click();
 await page.locator('.hr-info>summary').click();step('比较时打开图外来源说明，A/B及完整坐标继续可见');await wait(1000);await shot('desktop-comparison-sources');await wait(700);await page.locator('[data-hr-close-info]').click();step('关闭来源，恢复完整主体空间');await wait(600);
 await page.locator('[data-hr-compare="none"]').click();step('退出比较，恢复红巨星身份');assert.equal(await page.locator('[data-key="hrExample"]').inputValue(),'giant');await wait(1200);
 await pick('dwarf');step('直接点选白矮星，更换当前观察对象');await page.locator('.hr-relation>summary').click();await wait(1800);await page.locator('.hr-relation>summary').click();await wait(800);
 const elapsed=Date.now()-started;if(elapsed<23000)await wait(23000-elapsed);evidence.operationDurationMs=Date.now()-started;assert(evidence.operationDurationMs>=15000&&evidence.operationDurationMs<=30000);
 const video=page.video();await page.close();await context.close();const file=path.join(out,'hr-operations.webm');await video.saveAs(file);evidence.video=file;
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),phone=await mobile.newPage();await phone.goto(base+'/lab/stars?mode=hr');await phone.locator('.hr-shell:visible').waitFor();await phone.locator('[data-key="hrExample"]').selectOption('giant');await phone.waitForTimeout(160);const mobileFile=path.join(out,'mobile-selected-giant.png');await phone.screenshot({path:mobileFile,fullPage:true});evidence.screenshots.push(mobileFile);await mobile.close();evidence.state='passed';console.log(JSON.stringify({video:file,duration_ms:evidence.operationDurationMs,screenshots:evidence.screenshots}));
}finally{await browser.close();fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify(evidence,null,2));}
