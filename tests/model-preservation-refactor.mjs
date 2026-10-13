import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';

// Execute existing numerical checks, keeping historical evidence untouched.
// Only report destinations are redirected; scientific calculations and inputs
// run from their existing source modules, with no rewritten test thresholds.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'build/qa/lab-refactor/standalone/model-preservation');
fs.mkdirSync(out,{recursive:true});
const originalWrite=fs.writeFileSync;
const writes=[],runs=[];
fs.writeFileSync=(target,data,...args)=>{
 const original=target instanceof URL?fileURLToPath(target):path.resolve(String(target));
 const destination=path.join(out,path.relative(root,original));
 assert(destination.startsWith(out+path.sep),'Numerical check tried to write outside its evidence directory');
 fs.mkdirSync(path.dirname(destination),{recursive:true});writes.push({original:path.relative(root,original),destination:path.relative(root,destination)});
 return originalWrite(destination,data,...args);
};
try{
 for(const file of ['web/observatory/data/sky/check-math.mjs','web/observatory/sources/stars-checks.mjs','web/observatory/sources/orbits-measure-checks.mjs','web/observatory/data/light/check-models.mjs']){
  const source=fs.readFileSync(path.join(root,file));const start=Date.now();let state='passed',error=null;
  try{await import(pathToFileURL(path.join(root,file)).href);}catch(caught){state='failed';error=caught.stack||String(caught);process.exitCode=1;}
  runs.push({file,source_sha256:createHash('sha256').update(source).digest('hex'),state,error,duration_ms:Date.now()-start});
 }
}finally{
 fs.writeFileSync=originalWrite;
 originalWrite(path.join(out,'checks.json'),JSON.stringify({checked_at:new Date().toISOString(),runs,writes,scope:'Existing model calculations and scientific inputs only; historical report destinations redirected, no physical device or human scientific review',human_scientific_review:'pending',classroom_trial:'pending',textbook_comparison:'pending'},null,2));
}
