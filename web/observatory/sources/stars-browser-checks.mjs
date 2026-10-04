import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const {chromium}=await import('file:///C:/Users/30674/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const qa=new URL('../data/stars/qa/',import.meta.url);fs.mkdirSync(qa,{recursive:true});
const errors=[],requests=[],checks=[];
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1080}});
 page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>requests.push(r.url()));
 await page.goto('http://127.0.0.1:4180/lab/stars');await page.waitForFunction(()=>window.__lab?.module==='stars');
 const record=(name)=>checks.push({name,status:'passed'});
 assert.equal(await page.locator('.scene-host canvas').count(),1);record('统一站点实际WebGL挂载');
 await page.screenshot({path:fileURLToPath(new URL('01-evolution.png',qa)),fullPage:true});
 await page.locator('[data-stage="454"]').click();let p=await page.evaluate(()=>window.__lab.result.point);assert(p.center_h1<.001);assert(p.star_age>1e10);record('主序终点读取真实年龄与燃料');
 await page.locator('[data-key="mass"]').selectOption('15');await page.locator('[data-stage="end"]').click();p=await page.evaluate(()=>window.__lab.result.point);assert.equal(p.eep,808);assert(p.radius>900);assert(p.star_age<1.5e7);record('大质量轨迹与碳燃烧终点');
 await page.screenshot({path:fileURLToPath(new URL('02-massive-end.png',qa)),fullPage:true});
 await page.locator('[data-mode="pulsar"]').click();await page.locator('[data-preset="miss"]').click();let r=await page.evaluate(()=>window.__lab.result);assert.equal(r.duty,0);assert.equal(r.intensity,0);record('实际控件错过视线后严格零');
 await page.screenshot({path:fileURLToPath(new URL('03-pulsar-miss.png',qa)),fullPage:true});
 await page.locator('[data-preset="double"]').click();r=await page.evaluate(()=>window.__lab.result);assert.equal(r.intensity,1);assert(r.duty>0&&r.duty<.3);record('双脉冲预设与对应瞬时信号');
 await page.screenshot({path:fileURLToPath(new URL('04-pulsar-double.png',qa)),fullPage:true});
 await page.locator('[data-preset="steady"]').click();assert.equal(await page.evaluate(()=>window.__lab.result.duty),1);record('轴对齐预设恒定信号');
 await page.locator('[data-mode="collapse"]').click();await page.locator('[data-key="progress"]').fill('1');await page.locator('[data-key="progress"]').dispatchEvent('input');r=await page.evaluate(()=>window.__lab.result);assert.equal(r.shellRadiusDisplay,4.7);assert(Math.abs(r.coreRadiusDisplay-.07)<1e-10);await page.locator('[data-key="successful"]').uncheck();assert.equal(await page.evaluate(()=>window.__lab.result.shellRadiusDisplay),2);record('核心坍缩与外壳分支实际联动');
 await page.locator('[data-key="bhMass"]').selectOption('4000000');r=await page.evaluate(()=>window.__lab.result);assert(r.rsM>1e10);assert(r.radialTidalAcceleration<.001);record('超大质量潮汐尺度实际更新');
 await page.screenshot({path:fileURLToPath(new URL('05-collapse.png',qa)),fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.locator('[data-mode="evolution"]').click();await page.waitForTimeout(250);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));record('390px视口无横向溢出');
 await page.screenshot({path:fileURLToPath(new URL('06-mobile.png',qa)),fullPage:true});
 assert.equal(errors.length,0);assert.equal(requests.length,0);record('全流程无页面错误或失败请求');
 const hashFiles=['../modules/stars.js','../modules/stars-physics.mjs','../data/stars/tracks.json'];
 const result={checked_at:new Date().toISOString(),checks,state:'passed',browser:'Edge headless',screenshots:fs.readdirSync(qa).filter(p=>p.endsWith('.png')),hashes:Object.fromEntries(hashFiles.map(p=>[p,createHash('sha256').update(fs.readFileSync(new URL(p,import.meta.url))).digest('hex')])),model_visual_review:'pending',human_review:'pending',classroom_trial:'pending'};
 fs.writeFileSync(new URL('browser-checks.json',qa),JSON.stringify(result,null,2));console.log(JSON.stringify({count:checks.length,errors,requests,state:'passed'}));
}finally{await browser.close();}

