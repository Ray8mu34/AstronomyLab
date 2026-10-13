import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),portIndex=process.argv.indexOf('--port'),port=portIndex<0?4174:Number(process.argv[portIndex+1]);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.md':'text/plain; charset=utf-8'};
const files=new Set(['index.html','style.css','app.js','content.js','physics.mjs','references.html','SOURCES.md']),dirs=new Set(['textures','vendor','media','reading','data']);
const server=http.createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
 let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '')||'index.html';}catch{res.writeHead(400);res.end();return;}
 const parts=name.split('/'),filename=path.resolve(root,name);
 if(name.includes('\\')||parts.some(p=>p==='..'||p.startsWith('.'))||(!files.has(name)&&!dirs.has(parts[0]))||!filename.startsWith(root+path.sep)){res.writeHead(404);res.end('Not found');return;}
 const ext=path.extname(filename);if(!types[ext]&&!(parts[0]==='vendor'&&path.basename(filename)==='LICENSE')){res.writeHead(404);res.end('Not found');return;}
 if(!fs.existsSync(filename)||!fs.statSync(filename).isFile()){res.writeHead(404);res.end('Not found');return;}
 res.writeHead(200,{'Content-Type':types[ext]||'text/plain; charset=utf-8','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});if(req.method==='HEAD')res.end();else fs.createReadStream(filename).pipe(res);
});
server.on('error',error=>{console.error(error.message);process.exitCode=1;});server.listen(port,'127.0.0.1',()=>console.log(`Earth Moon laboratory: http://127.0.0.1:${port}/ (public site files only)`));
