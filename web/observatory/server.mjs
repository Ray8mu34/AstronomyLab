import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),workspace=path.resolve(root,'../..'),portIndex=process.argv.indexOf('--port'),port=portIndex<0?4180:Number(process.argv[portIndex+1]);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.gif':'image/gif','.webp':'image/webp','.md':'text/plain; charset=utf-8','.csv':'text/plain; charset=utf-8','.tsv':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8','.fits':'application/fits','.fit':'application/fits','.eep':'text/plain; charset=utf-8','.f32':'application/octet-stream'};
const mainFiles=new Set(['index.html','app.js','site.css','navigation.css']);
const legacyFiles=new Set(['index.html','style.css','app.js','content.js','physics.mjs','references.html','SOURCES.md']);
const legacyDirs=new Set(['textures','vendor','media','reading','data']);
function inside(base,name){const f=path.resolve(base,name);return f.startsWith(base+path.sep)?f:null;}
function send(res,file,method,transform){if(!file||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end('Not found');return;}const ext=path.extname(file).toLowerCase();if(!types[ext]&&path.basename(file)!=='LICENSE'){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':types[ext]||'text/plain; charset=utf-8','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});if(method==='HEAD'){res.end();return;}if(transform)res.end(transform(fs.readFileSync(file,'utf8')));else fs.createReadStream(file).pipe(res);}
function integrateLegacy(html){return html.replace('</head>','<link rel="icon" href="data:,"><link rel="stylesheet" href="/navigation.css"></head>').replace('<body>','<body class="integrated-legacy"><div id="site-navigation"></div><script type="module" src="/shared/navigation.js"></script>');}
function readingHTML(html){return html.replaceAll('../../assets/','/assets/').replaceAll('linked/assets/','/reading/linked/assets/').replaceAll('linked/build/qa/','/reading/linked/build/qa/').replaceAll('href="article-reading.css"','href="/reading/article-reading.css"').replaceAll('href="index.html"','href="/courses"').replace(/href="L(\d{2})\.html/g,'href="/read/$1').replace('</head>','<link rel="stylesheet" href="/site.css"></head>').replace('<body>','<body><div id="site-navigation"></div><script type="module" src="/shared/navigation.js"></script>').replace(/<nav class="reading-nav"[\s\S]*?<\/nav>/,'');}
const server=http.createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
 let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '');}catch{res.writeHead(400);res.end();return;}
 const parts=name.split('/');if(name.includes('\\')||parts.some(p=>p==='..'||p.startsWith('.'))){res.writeHead(404);res.end('Not found');return;}
 if(!name||['courses','materials','sources'].includes(name)||/^read\/\d{2}$/.test(name)||/^lab\/[a-z-]+$/.test(name)){send(res,path.join(root,'index.html'),req.method);return;}
 const legacy=/^labs\/(solar-system|earth-moon)\/(.*)$/.exec(name);if(legacy){const base=path.join(workspace,'web',legacy[1]),local=legacy[2]||'index.html';if(!legacyFiles.has(local)&&!legacyDirs.has(local.split('/')[0])){res.writeHead(404);res.end();return;}send(res,inside(base,local),req.method,local==='index.html'?integrateLegacy:null);return;}
 if(name.startsWith('vendor/')||name.startsWith('textures/')){const base=path.join(workspace,'web/solar-system');send(res,inside(base,name),req.method);return;}
 if(name.startsWith('assets/')){const base=path.join(workspace,'assets'),local=name.slice(7);let allowed=false;try{const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/catalog.json'),'utf8'));allowed=catalog.public_assets.includes(name)||(path.extname(local)==='.svg'&&catalog.assets.some(a=>a.local_path.replace(/\.[^.]+$/,'.svg')===name));}catch{}if(!allowed){res.writeHead(404);res.end('Not found');return;}if(path.extname(local)==='.py'){res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8','X-Content-Type-Options':'nosniff'});res.end(fs.readFileSync(inside(base,local)));return;}send(res,inside(base,local),req.method);return;}
 if(/^reading\/L\d{2}\.html$/.test(name)){send(res,path.join(workspace,'build/articles',name.slice(8)),req.method,readingHTML);return;}
 if(name==='reading/article-reading.css'){send(res,path.join(workspace,'build/articles/article-reading.css'),req.method);return;}
 if(name.startsWith('reading/linked/assets/')){const base=path.join(workspace,'build/articles/linked/assets');send(res,inside(base,name.slice('reading/linked/assets/'.length)),req.method,readingHTML);return;}
 if(name==='sources/release-status.md'){send(res,path.join(workspace,'THIRD_PARTY.md'),req.method);return;}
 if(name==='sources/experience-review.md'){send(res,path.join(workspace,'docs/IMPROVEMENT-2026-10-04.md'),req.method);return;}
 if(name==='status.json'){let report;try{report=JSON.parse(fs.readFileSync(path.join(root,'data/verification-summary.json'),'utf8'));}catch{}res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-cache'});res.end(JSON.stringify({state:report?.state||'in_progress',checked_at:report?.checked_at||null,count:report?.checks?.length||0,visual_review:report?.model_visual_review||'pending',human_review:'pending',classroom_trial:'pending',textbook_comparison:'pending'}));return;}
 if(mainFiles.has(name)||['shared','modules','data','sources'].includes(parts[0])){send(res,inside(root,name),req.method);return;}
 res.writeHead(404);res.end('Not found');
});
server.on('error',e=>{console.error(e.message);process.exitCode=1;});server.listen(port,'127.0.0.1',()=>console.log(`Unified astronomy website: http://127.0.0.1:${port}/ (workspace inputs/teacher/tools excluded)`));
