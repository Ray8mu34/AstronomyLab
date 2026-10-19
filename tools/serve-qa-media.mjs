import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const option=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
const root=fs.realpathSync(path.resolve(option('--root','build/qa/frontend-round2-20261019'))),port=Number(option('--port','4398'));
const types={'.webm':'video/webm','.mp4':'video/mp4','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.json':'application/json; charset=utf-8'};
const server=http.createServer((req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1');
  if(url.pathname==='/'){
   const file=url.searchParams.get('file')||'';
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
   res.end('<!doctype html><html lang="zh"><meta charset="utf-8"><title>本机原片播放</title><style>body{margin:1rem;background:#171a1c;color:#fff;font:16px system-ui}video{display:block;max-width:100%;max-height:85vh}output{display:block;margin:1rem 0}</style><h1>本机原片</h1><video controls playsinline></video><output></output><script>const file='+JSON.stringify(file).replaceAll('<','\\u003c')+';const v=document.querySelector("video"),o=document.querySelector("output");v.src="/media/"+file.split("/").map(encodeURIComponent).join("/");const report=()=>o.textContent=JSON.stringify({file,time:v.currentTime,duration:Number.isFinite(v.duration)?v.duration:null,playbackRate:v.playbackRate,ended:v.ended,error:v.error?.message||null});for(const event of ["timeupdate","ratechange","ended","loadedmetadata","error"])v.addEventListener(event,report);window.qaPlayback=()=>({file,time:v.currentTime,duration:v.duration,playbackRate:v.playbackRate,ended:v.ended});</script></html>');return;
  }
  if(!url.pathname.startsWith('/media/')){res.writeHead(404);res.end();return;}
  const relative=decodeURIComponent(url.pathname.slice(7)),target=path.resolve(root,relative);
  if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  const real=fs.realpathSync(target);
  if(!real.startsWith(root+path.sep)||!fs.statSync(real).isFile()||!types[path.extname(real)]){res.writeHead(403);res.end();return;}
  const size=fs.statSync(real).size,headers={'Content-Type':types[path.extname(real)],'Accept-Ranges':'bytes','Cache-Control':'no-store'};
  if(req.headers.range){const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!match){res.writeHead(416,{'Content-Range':`bytes */${size}`});res.end();return;}const start=Number(match[1]),end=match[2]?Math.min(Number(match[2]),size-1):size-1;if(start>end||start>=size){res.writeHead(416,{'Content-Range':`bytes */${size}`});res.end();return;}res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});fs.createReadStream(real,{start,end}).pipe(res);}
  else{res.writeHead(200,{...headers,'Content-Length':size});fs.createReadStream(real).pipe(res);}
 }catch{res.writeHead(404);res.end();}
});
server.listen(port,'127.0.0.1',()=>console.log(JSON.stringify({root,url:`http://127.0.0.1:${port}/?file=<relative-webm>`,pid:process.pid,readOnly:true})));
