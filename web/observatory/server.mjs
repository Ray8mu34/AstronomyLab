import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {handleLectures} from './compat/lectures-server.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),workspace=path.resolve(root,'../..');
const option=(key,fallback)=>{const i=process.argv.indexOf(key);return i<0?fallback:process.argv[i+1];};
const port=Number(option('--port',4180)),lecturesOption=option('--lectures',null),lecturesRoot=lecturesOption?path.resolve(lecturesOption):null;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.gif':'image/gif','.webp':'image/webp','.md':'text/plain; charset=utf-8','.csv':'text/plain; charset=utf-8','.tsv':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8','.f32':'application/octet-stream','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf'};
const manifest=JSON.parse(fs.readFileSync(path.join(root,'runtime-assets.json'),'utf8'));
const allowed=new Map(manifest.files.map(f=>[f.url,f.source]));
function send(res,file,method){if(!file||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end('Not found');return;}const type=types[path.extname(file).toLowerCase()]||(path.basename(file)==='LICENSE'?'text/plain; charset=utf-8':null);if(!type){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});if(method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);}
const server=http.createServer((req,res)=>{if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '');}catch{res.writeHead(400);res.end();return;}if(name.includes('\\')||name.split('/').some(p=>p==='..'||p.startsWith('.'))){res.writeHead(404);res.end('Not found');return;}
 if(handleLectures(req,res,name,{lecturesRoot,send}))return;
 const url=!name||name==='sources'||/^lab\/[a-z-]+$/.test(name)?'/index.html':'/'+name.replace(/^(labs\/(?:solar-system|earth-moon)\/)$/, '$1index.html');
 const source=allowed.get(url);if(!source){res.writeHead(404);res.end('Not found');return;}const file=path.resolve(workspace,source);
 if(!file.startsWith(workspace+path.sep)||!fs.existsSync(file)||!fs.realpathSync(file).startsWith(fs.realpathSync(workspace)+path.sep)){res.writeHead(404);res.end('Not found');return;}send(res,file,req.method);
});server.on('error',e=>{console.error(e.message);process.exitCode=1;});server.listen(port,'127.0.0.1',()=>console.log(`AstronomyLab R1: http://127.0.0.1:${port}/ (exact tool-resource whitelist; external readings optional)`));
