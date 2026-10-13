import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const option=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
const base=option('--base','http://127.0.0.1:4183'),out=path.resolve(option('--out','build/qa/lab-refactor/standalone/compat'));
const {chromium}=createRequire(import.meta.url)(option('--playwright','C:/Users/30674/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:option('--browser','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'),headless:true});
const checks=[],requests=[],errors=[];
try{
 const context=await browser.newContext({viewport:{width:1366,height:768}}),page=await context.newPage();
 page.on('request',request=>requests.push({url:request.url(),kind:request.resourceType()}));page.on('pageerror',error=>errors.push(error.message));
 for(const anchor of ['一个月为什么会有两种长度','两个半球的交叠形成一个月的形状']){
  const requested=base+'/read/03?returnTo=https%3A%2F%2Fevil.example#'+encodeURIComponent(anchor);
  await page.goto(requested);await page.waitForLoadState('networkidle');
  assert.equal(new URL(page.url()).origin,new URL(base).origin);assert.equal(new URL(page.url()).pathname,'/lecture-assets/reading/L03.html');assert.equal(decodeURIComponent(new URL(page.url()).hash.slice(1)),anchor);
  const initialPosition=await page.evaluate(id=>{const node=document.getElementById(id);return node?{y:node.getBoundingClientRect().y,scrollY}:null;},anchor);
  await page.waitForFunction(id=>{const node=document.getElementById(id);return node&&node.getBoundingClientRect().y>=-1&&node.getBoundingClientRect().y<100;},anchor,{timeout:5000});await page.waitForTimeout(220);
  const position=await page.evaluate(id=>{const node=document.getElementById(id);if(!node)return null;const rect=node.getBoundingClientRect();return{text:node.querySelector('h2')?.textContent||node.textContent,y:rect.y,height:rect.height,scrollY};},anchor);
  const file=path.join(out,'L03-'+checks.length+'-anchor.png');await page.screenshot({path:file});const item={name:'External lecture Chinese fragment '+anchor,state:'in-progress',requested,actual:page.url(),initialPosition,position,screenshot:file};checks.push(item);
  assert(position,'Chinese anchor exists in actual exported lecture');assert(position.y>=-1&&position.y<768,'Browser actually scrolled to the Chinese target '+JSON.stringify(position));item.state='passed';
 }
 assert.deepEqual(errors,[]);assert(!requests.some(r=>/\/shared\/(?:course-map|learning-paths|reading-state)\.js/.test(new URL(r.url).pathname)));await context.close();
}catch(error){checks.push({name:'Actual sidecar reading compatibility',state:'failed',error:error.stack});process.exitCode=1;}
finally{await browser.close();fs.writeFileSync(path.join(out,'reading-compat-checks.json'),JSON.stringify({checked_at:new Date().toISOString(),base,state:checks.some(c=>c.state==='failed')?'failed':'passed',checks,requests,errors,scope:'External optional lecture sidecar, separate from the course-free Lab dependency graph'},null,2));}
console.log(checks.map(c=>c.state.toUpperCase()+' '+c.name).join('\n'));
