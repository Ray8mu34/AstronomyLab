import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
const root=process.cwd(), out=path.join(root,'build/qa/lab-refactor/baseline');
await fs.mkdir(out,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const files=[];
async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name),rel=path.relative(root,p).replaceAll('\\','/');if(e.isSymbolicLink()){files.push({path:rel,type:'symlink',target:await fs.readlink(p)});continue;}if(e.isDirectory()){if(['.git','node_modules','__pycache__'].includes(e.name))continue;await walk(p);}else{const b=await fs.readFile(p);files.push({path:rel,bytes:b.length,sha256:hash(b)});}}}
for(const d of ['web','assets','course','tools','tests','docs'])await walk(path.join(root,d));
for(const f of ['AGENTS.md','README.md','THIRD_PARTY.md']){const b=await fs.readFile(path.join(root,f));files.push({path:f,bytes:b.length,sha256:hash(b)});}
const workspaceIsGit=fs.existsSync(path.join(root,'.git'));
const gitRoot=workspaceIsGit?root:path.join(root,'deployment/AstronomyLab');
const git=(...args)=>execFileSync('git',['-C',gitRoot,...args],{encoding:'utf8'}).trim();
const tracked=git('ls-files').split('\n'); const differences=[];
for(const f of tracked){try{const a=await fs.readFile(path.join(root,f)),b=await fs.readFile(path.join(gitRoot,f));if(hash(a)!==hash(b))differences.push({path:f,workspace:hash(a),gitCheckout:hash(b)});}catch{differences.push({path:f,status:'absent-in-workspace-or-checkout'});}}
const protectedFiles=files.filter(f=>/^course\/.+\/lesson\.md$/.test(f.path)||f.path.startsWith('assets/')||/\/(data|textures|vendor|media)\//.test(f.path)||/physics\.(m?js)$/.test(f.path));
const code=files.filter(f=>/\.(m?js|css|html|md|json|py|ps1|cmd)$/.test(f.path)&&!f.path.startsWith('assets/')&&!f.path.startsWith('course/'));
for(const f of code){const target=path.join(out,'working-copy',f.path);await fs.mkdir(path.dirname(target),{recursive:true});await fs.copyFile(path.join(root,f.path),target);}
const result={createdAt:new Date().toISOString(),gitRoot:path.relative(root,gitRoot).replaceAll('\\','/')||'.',head:git('rev-parse','HEAD'),gitStatus:git('status','--porcelain=v1','--untracked-files=all'),workspaceIsGit,workingCopyDifferences:differences,files,protectedFiles,videos:files.filter(f=>/\.(mp4|webm|mov|vtt|srt)$/i.test(f.path)),notes:['Source baseline is actual workspace bytes, not remote checkout.','Code copies retained locally; scientific assets protected by byte hashes.','No reset, clean, stash, pull, server or remote mutation performed.']};
await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({head:result.head,gitStatus:result.gitStatus,fileCount:files.length,protectedCount:protectedFiles.length,workingCopyDifferences:differences,videos:result.videos},null,2));
