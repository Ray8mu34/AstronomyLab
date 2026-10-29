import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createZip} from './zip-store.mjs';
const defaultRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const option=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
const root=path.resolve(option('--source',defaultRoot)),out=path.resolve(option('--out',path.join(root,'dist/lab'))),qa=path.join(defaultRoot,'build/qa/lab-refactor/build');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),entries=new Map();
function add(source,url,role='runtime'){const file=path.join(root,source);if(!fs.existsSync(file))throw Error('Required runtime dependency is absent: '+source);if(!fs.statSync(file).isFile())throw Error('Not a file: '+source);const real=fs.realpathSync(file);if(!real.startsWith(fs.realpathSync(root)+path.sep))throw Error('Dependency escapes source root: '+source);const b=fs.readFileSync(file);if(entries.has(url)&&entries.get(url).source!==source)throw Error('URL collision: '+url);entries.set(url,{url,source,bytes:b.length,sha256:hash(b),role});}
function directory(dir,url,{recursive=true,filter=()=>true}={}){for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){if(e.isDirectory()&&recursive)directory(dir+'/'+e.name,url+'/'+e.name,{recursive,filter});else if(e.isFile()&&filter(e.name,dir))add(dir+'/'+e.name,url+'/'+e.name);}}
for(const file of ['index.html','app.js','site.css','navigation.css','tool-layout.css'])add('web/observatory/'+file,'/'+file);
const excluded=new Set(['course-map.js','course-map.css','learning-paths.js','reading-state.js','load-content.js','lab.js']);
directory('web/observatory/shared','/shared',{filter:(f,dir)=>/\.(m?js|css)$/.test(f)&&!excluded.has(f)||dir.startsWith('web/observatory/shared/fonts')&&/\.(woff2?|ttf|txt|json)$/.test(f)});
// Retained historical source adapters have no active importer after the single
// sky-presentation owner migration. Keep their source files, omit their URLs.
const retiredModules=new Set([
 'sky-sky-ui.js','sky-sky-ui.css','sky-day-ui.js','sky-day-ui.css',
 'sky-measure-ui.js','sky-measure-ui.css','sky-calendar-ui.js','sky-calendar-ui.css',
 'sky-precession-ui.js','sky-precession-ui.css','sky-pilot.css',
]);
directory('web/observatory/modules','/modules',{filter:f=>/\.(m?js|css)$/.test(f)&&!retiredModules.has(f)});
for(const slug of ['alignments','sky','optics','light','imaging','stars','galaxy','orbits','measure','galaxy-measurements','cosmology','tides','planet-environments','lunisolar','image-calibration','stellar-interior','supernova-light','sky-motion','orbit-conics','landing-staging-sources'])add('web/observatory/sources/'+slug+'.md','/sources/'+slug+'.md','source-record');
for(const d of ['sky/stars.json','sky/hip2-subset.tsv','sky/hip2-ReadMe.txt','sky/hip1-ReadMe.txt','sky/vizier-license.html','stars/tracks.json','stars/interpolator-source.html','stars/interpolator-result.html','galaxy/planck-equirectangular.jpg','galaxy/2mass-allsky.jpg','galaxy/firas_monopole_spec_v1.txt','galaxy/manifest.json','imaging/502-linear.f32','imaging/656-linear.f32','imaging/673-linear.f32','imaging/m17-metadata.json','orbits/parameters.json','measure/parameters.json'])add('web/observatory/data/'+d,'/data/'+d,'science-data-or-record');
for(const file of ['moon-first-quarter-640.webp','moon-first-quarter-1024.webp','pillars-640.webp','assets.json'])add('web/observatory/data/home/'+file,'/data/home/'+file,'entry-image-or-attribution');
for(const slug of ['solar-system','earth-moon']){
 const base='web/'+slug;directory(base,'/labs/'+slug,{recursive:false,filter:f=>/^(index\.html|app\.js|phase-ui\.js|phase-ui\.css|style\.css|content\.js|physics\.mjs|scene-state\.js|references\.html|SOURCES\.md)$/.test(f)||(slug==='earth-moon'&&/^(spin|period|eclipse)-ui\.(js|css)$/.test(f))});
 directory(base+'/vendor','/labs/'+slug+'/vendor');directory(base+'/textures','/labs/'+slug+'/textures');
 if(slug==='solar-system'){directory(base+'/media','/labs/'+slug+'/media');for(const d of ['orbits.json','physical.json','resources.json','source-texture-license.html','source-jpl-physical.html','source-jpl-orbits.html'])add(base+'/data/'+d,'/labs/'+slug+'/data/'+d,'science-data-or-record');}
}
directory('web/solar-system/vendor','/vendor');directory('web/solar-system/textures','/textures');
// Scientific figures are shared assets, but only literal tool dependencies are admitted.
for(const item of [...entries.values()].filter(e=>/\.(m?js|css|html)$/.test(e.source))){const text=fs.readFileSync(path.join(root,item.source),'utf8');for(const match of text.matchAll(/(?:\/?)(assets\/[A-Za-z0-9_./-]+\.(?:png|jpe?g|svg|webp|gif))/g))add(match[1],'/'+match[1],'tool-figure');}
add('web/observatory/sources/release-status.md','/sources/release-status.md','license-record');
// Carry the existing per-figure attributions without making the course ledger a
// runtime dependency. The maintainer ledger is read only during local builds.
function csv(text){const rows=[];let row=[],field='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(!quoted&&(c===','||c==='\n')){row.push(field.replace(/\r$/,''));field='';if(c==='\n'){rows.push(row);row=[];}}else field+=c;}if(field||row.length){row.push(field);rows.push(row);}return rows;}
const figurePaths=new Set([...entries.values()].filter(f=>f.role==='tool-figure').map(f=>f.source));
const creditsFile=path.join(root,'web/observatory/tool-credits.json');
const ledger=path.join(root,'assets/ARTICLE_ASSETS.csv');
if(fs.existsSync(ledger)){const [header,...rows]=csv(fs.readFileSync(ledger,'utf8'));const records=rows.map(r=>Object.fromEntries(header.map((k,i)=>[k,r[i]||'']))).filter(r=>figurePaths.has(r.local_path));fs.writeFileSync(creditsFile,JSON.stringify({kind:'existing-asset-attributions',permissionStatus:'unchanged',records},null,2));}
else if(!fs.existsSync(creditsFile))throw Error('Tool figure attribution records are absent');
add('web/observatory/tool-credits.json','/sources/tool-credits.json','license-record');
const files=[...entries.values()].sort((a,b)=>a.url.localeCompare(b.url));
const buildId='r1-20261005-'+hash(Buffer.from(JSON.stringify(files.map(f=>[f.url,f.sha256])))).slice(0,12);
const manifest={version:1,createdAt:new Date().toISOString(),buildId,baselineHead:'1e8a77642b489c990e917a4791c0eb83851fadd1',product:'AstronomyLab R1',publicDistribution:'blocked_pending_licenses',requires:['Node >=22','HTTP localhost','WebGL2 for spatial tools'],files};
fs.writeFileSync(path.join(root,'web/observatory/runtime-assets.json'),JSON.stringify(manifest,null,2));
// Source servers read this allowlist at startup. During coordinated development,
// refreshing it need not copy/zip another complete, non-frozen candidate package.
if(process.argv.includes('--manifest-only')){console.log(JSON.stringify({manifestOnly:true,source:root,resources:manifest.files.length,buildId:manifest.buildId,publicDistribution:manifest.publicDistribution}));process.exit(0);}
fs.mkdirSync(out,{recursive:true});
// Existing output is never recursively deleted. Unexpected stale files fail a build.
const expected=new Set(manifest.files.map(f=>f.source));for(const f of ['web/observatory/server.mjs','web/observatory/compat/lectures-server.mjs','web/observatory/runtime-assets.json','README.md','package.json','distribution-manifest.json'])expected.add(f);
function walk(dir,prefix=''){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name),prefix+e.name+'/'):[prefix+e.name]);}
const stale=walk(out).filter(f=>!expected.has(f));if(stale.length)throw Error('Output contains unexpected stale files; choose a fresh --out: '+stale.join(', '));
for(const f of expected){if(['README.md','package.json','distribution-manifest.json'].includes(f))continue;const target=path.join(out,f);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,f),target);}
fs.writeFileSync(path.join(out,'package.json'),JSON.stringify({name:'astronomy-lab-r1',private:true,type:'module',engines:{node:'>=22'},scripts:{start:'node web/observatory/server.mjs'}},null,2));
fs.writeFileSync(path.join(out,'README.md'),'# AstronomyLab R1 本地运行包\n\n需要已有 Node.js >=22，无 npm 依赖。解压后在本目录运行 `node web/observatory/server.mjs --port 4182`，打开 http://127.0.0.1:4182/ 。首次运行不需要外网，不通过 file:// 双击。三维工具需要 WebGL2；图像与星光采用二维绘制。\n\n不包含 course、文章 HTML、课程目录或段落映射。可选外置阅读包：追加 `--lectures "<lectures-web绝对目录>"`；无外置包的旧阅读路径显示开发期资料说明。兼容说明不代表正式部署迁移已完成。\n\n这是本地工程候选版；MIST/M17 衍生数据再分发待核，不能直接公开分发。原图署名与模型来源随资源保留。没有账号、云端存档或视频频道。场景配方是输入配方，图像临时对照不随配方保存。\n\n部署需另行授权；仅支持站点根路径。实体手机、现场投影、真人科学审校与试讲待进行。\n');
const packageFiles=walk(out).filter(f=>f!=='distribution-manifest.json').map(f=>{const b=fs.readFileSync(path.join(out,f));return{path:f,bytes:b.length,sha256:hash(b)};});
fs.writeFileSync(path.join(out,'distribution-manifest.json'),JSON.stringify({version:1,publicDistribution:manifest.publicDistribution,files:packageFiles},null,2));
createZip(out,out+'.zip');fs.mkdirSync(qa,{recursive:true});fs.writeFileSync(path.join(qa,'manifest.json'),JSON.stringify({builtAt:new Date().toISOString(),output:out,files:packageFiles,zip:{path:out+'.zip',sha256:hash(fs.readFileSync(out+'.zip'))}},null,2));console.log(JSON.stringify({output:out,resources:manifest.files.length,files:packageFiles.length,zip:out+'.zip'}));
