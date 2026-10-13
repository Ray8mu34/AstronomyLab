import fs from 'node:fs';
import path from 'node:path';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function readingPackageFiles(root){
 try{const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));if(manifest.kind!=='derived-static-reading'||!Array.isArray(manifest.files))return null;return new Set(manifest.files.map(f=>f.path));}catch{return null;}
}
export function handleLectures(req,res,name,{lecturesRoot,send}){
 const readingFiles=lecturesRoot?readingPackageFiles(lecturesRoot):null;
 const old=/^(?:read\/(\d{2})|reading\/L(\d{2})\.html)$/.exec(name);
 if(old||['courses','materials','lectures'].includes(name)){
  if(readingFiles?.has('index.html')&&fs.existsSync(path.join(lecturesRoot,'index.html'))){const target=old?`reading/L${old[1]||old[2]}.html`:'index.html';res.writeHead(307,{Location:'/lecture-assets/'+target,'Cache-Control':'no-cache'});res.end();}
  else{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff'});res.end(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>独立讲义资料</title><body style="max-width:760px;margin:40px auto;padding:0 20px;font:16px/1.9 sans-serif"><h1>讲义已独立保存</h1><p>16篇原始 Markdown 与图片、来源文件在 lectures-source 资料包中。派生阅读副本为 lectures-web，可单独打开其 index.html。</p><p>当前工具服务未接入外置阅读包。开发期可通过 <code>--lectures &lt;lectures-web目录&gt;</code> 接入；此说明是本地兼容回退，正式旧链接迁移地址尚未确定。</p><p>旧地址：${escape(name)}</p><a href="/">返回演示工具 →</a></body></html>`);}return true;
 }
 if(!name.startsWith('lecture-assets/'))return false;
 if(!lecturesRoot||!readingFiles){res.writeHead(404);res.end('Reading package is not configured');return true;}
 const local=name.slice('lecture-assets/'.length),file=path.resolve(lecturesRoot,local),base=fs.realpathSync(lecturesRoot);
 if(!readingFiles.has(local)||!file.startsWith(path.resolve(lecturesRoot)+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()||!fs.realpathSync(file).startsWith(base+path.sep)||! /\.(html|css|png|jpe?g|svg|webp|gif|md|csv|txt)$/i.test(file)||/(?:^|\/)(?:_teacher|qa|raw|tools|\.env)(?:\/|$)/i.test(local)){res.writeHead(404);res.end('Not found');return true;}
 send(res,file,req.method);return true;
}
