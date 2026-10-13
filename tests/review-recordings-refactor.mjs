import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const option=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
const input=path.resolve(option('--input','build/qa/lab-refactor/moon'));
const output=path.resolve(option('--out','build/qa/lab-refactor/standalone/recording-review'));
const prefix=option('--prefix','moon');
const filter=option('--files',null);
const files=fs.readdirSync(input).filter(name=>/-operations?\.webm$/.test(name)&&(!filter||filter.split(',').includes(name)));
assert(files.length>0,'No real operation recordings exist');fs.mkdirSync(output,{recursive:true});
const videoBytes=new Map(files.map(name=>[name,fs.readFileSync(path.join(input,name))]));
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://local').pathname.slice(1));
 if(!files.includes(name)){res.writeHead(404);return res.end('Not found');}
 const data=videoBytes.get(name);res.writeHead(200,{'content-type':'video/webm','content-length':data.length});res.end(data);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const {chromium}=createRequire(import.meta.url)(option('--playwright','C:/Users/30674/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const browser=await chromium.launch({executablePath:option('--browser','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'),headless:true});
const records=[];
try{
 for(const name of files){
  const page=await browser.newPage({viewport:{width:1366,height:768}});await page.setContent('<style>body{margin:0;background:#fff}video{display:block;width:100%;height:100%;object-fit:contain}</style><video muted></video>');
  await page.evaluate(src=>{document.querySelector('video').src=src;},'http://127.0.0.1:'+server.address().port+'/'+encodeURIComponent(name));
  await page.waitForFunction(()=>document.querySelector('video').readyState>=2);
  const meta=await page.evaluate(()=>{const v=document.querySelector('video');return{duration:v.duration,width:v.videoWidth,height:v.videoHeight};});
  assert(meta.duration>=15&&meta.duration<=35,'Recording is not the required short complete operation '+name);
  const begin=Date.now(),frames=[];await page.evaluate(()=>{const v=document.querySelector('video');v.playbackRate=1;return v.play();});
  while(!await page.evaluate(()=>document.querySelector('video').ended)){
   const time=await page.evaluate(()=>document.querySelector('video').currentTime),file=path.join(output,prefix+'-'+name.slice(0,-5)+'-'+String(frames.length).padStart(2,'0')+'.png');await page.screenshot({path:file});frames.push({time,file});await page.waitForTimeout(950);
  }
  const elapsed=Date.now()-begin;assert(elapsed>=meta.duration*1000-500,'Full playback was skipped');
  const sheet=await browser.newPage({viewport:{width:1366,height:768}});await sheet.setContent(`<style>body{margin:0;background:white;color:#222;font:16px sans-serif}main{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}figure{margin:0}img{width:100%;display:block}figcaption{padding:3px}</style><h1>${prefix} ${name} · 1×完整播放采样</h1><main>${frames.map(f=>`<figure><img src="data:image/png;base64,${fs.readFileSync(f.file).toString('base64')}"><figcaption>${f.time.toFixed(2)} s</figcaption></figure>`).join('')}</main>`);
  const contact=path.join(output,prefix+'-'+name.slice(0,-5)+'-contact.png');await sheet.screenshot({path:contact,fullPage:true});await sheet.close();await page.close();
  records.push({file:path.join(input,name),sha256:createHash('sha256').update(videoBytes.get(name)).digest('hex'),...meta,playback_rate:1,wall_duration_ms:elapsed,ended:true,frames,contact_sheet:contact,visual_review:'pending — actual frame/contact review required',scope:'Complete native playback at normal speed; second-spaced visual samples, not hardware frame timing'});console.log('PLAYED '+name+' '+meta.duration.toFixed(2)+'s');
 }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));fs.writeFileSync(path.join(output,prefix+'-recording-playback.json'),JSON.stringify({checked_at:new Date().toISOString(),records,physical_device:false,human_scientific_review:'pending'},null,2));}
