import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=process.cwd(),temp=fs.mkdtempSync(path.join(os.tmpdir(),'AstronomyLab-R1-no-course-')),source=path.join(temp,'source'),output=path.join(temp,'lab');
const manifest=JSON.parse(fs.readFileSync('web/observatory/runtime-assets.json','utf8'));
for(const relative of new Set([...manifest.files.map(f=>f.source),'web/observatory/runtime-assets.json','web/observatory/server.mjs','web/observatory/compat/lectures-server.mjs','tools/build-lab.mjs','tools/zip-store.mjs'])){const target=path.join(source,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,relative),target);}
const command=[path.join(source,'tools/build-lab.mjs'),'--source',source,'--out',output];
const result=spawnSync(process.execPath,command,{cwd:source,encoding:'utf8'});
const checks={checkedAt:new Date().toISOString(),outsideWorkspace:!temp.startsWith(root+path.sep),source,output,command:[process.execPath,...command],nodeVersion:process.version,exitCode:result.status,stdout:result.stdout,stderr:result.stderr,absent:['course','build/articles','web/observatory/data/catalog.json','web/observatory/data/catalog-manifest.json','web/observatory/shared/course-map.js','web/observatory/shared/learning-paths.js','web/observatory/shared/reading-state.js','tools/vendor/pandoc-3.12/pandoc.exe','assets/ARTICLE_ASSETS.csv'].map(p=>({path:p,absent:!fs.existsSync(path.join(source,p))})),outputManifestHash:fs.existsSync(path.join(output,'distribution-manifest.json'))?crypto.createHash('sha256').update(fs.readFileSync(path.join(output,'distribution-manifest.json'))).digest('hex'):null};
fs.mkdirSync('build/qa/lab-refactor/build',{recursive:true});fs.writeFileSync('build/qa/lab-refactor/build/no-course-check.json',JSON.stringify(checks,null,2));console.log(JSON.stringify({exitCode:result.status,absent:checks.absent.every(c=>c.absent),outsideWorkspace:checks.outsideWorkspace,output}));if(result.status||!checks.absent.every(c=>c.absent))process.exitCode=1;
