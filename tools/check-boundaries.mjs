import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=process.cwd(),qa=path.join(root,'build/qa/lab-refactor/boundaries');fs.mkdirSync(qa,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const baselinePath=fs.existsSync('build/qa/lab-refactor/baseline/manifest.json')?'build/qa/lab-refactor/baseline/manifest.json':'source-protection.json';
const baseline=JSON.parse(fs.readFileSync(baselinePath,'utf8'));
// Explicit scientific repairs can supersede an exact protected hash. Keep the
// old digest and require both endpoints, a named task, and an individual reason.
// Any later edit fails again; this is never a wildcard/path-only exemption.
const amendmentPath=path.join(root,'source-protection-amendments.json');
const amendments=fs.existsSync(amendmentPath)?JSON.parse(fs.readFileSync(amendmentPath,'utf8')):{version:1,changes:[]};
const amendmentErrors=[];
if(amendments.version!==1||!Array.isArray(amendments.changes))throw Error('Invalid source protection amendment schema');
const amendmentMap=new Map();
for(const c of amendments.changes){const original=baseline.protectedFiles.find(f=>f.path===c?.path);if(!original||amendmentMap.has(c.path)||c.before!==original.sha256||!/^[a-f0-9]{64}$/.test(c.after)||typeof c.task!=='string'||!c.task.trim()||typeof c.reason!=='string'||!c.reason.trim()){amendmentErrors.push(c?.path||'invalid entry');continue;}amendmentMap.set(c.path,c);}
const protection=baseline.protectedFiles.map(f=>{const exists=fs.existsSync(f.path),actual=exists?hash(fs.readFileSync(f.path)):null,amendment=amendmentMap.get(f.path),unchanged=exists&&actual===f.sha256,authorized=exists&&amendment&&actual===amendment.after;return{path:f.path,expected:f.sha256,actual,state:unchanged?'passed':authorized?'authorized-scientific-change':'failed',...(authorized?{amendment}:{} )};});
const defaultOutput=fs.existsSync('deploy/lab/distribution-manifest.json')?'deploy/lab':'dist/lab';
const output=path.resolve(process.argv.includes('--package')?process.argv[process.argv.indexOf('--package')+1]:defaultOutput);
const distribution=JSON.parse(fs.readFileSync(path.join(output,'distribution-manifest.json'),'utf8'));
const fileChecks=distribution.files.map(f=>{const file=path.join(output,f.path);return{path:f.path,state:fs.existsSync(file)&&hash(fs.readFileSync(file))===f.sha256?'passed':'failed'};});
const runtime=JSON.parse(fs.readFileSync(path.join(output,'web/observatory/runtime-assets.json'),'utf8'));
const sourceDrift=runtime.files.filter(f=>!fs.existsSync(f.source)||hash(fs.readFileSync(f.source))!==f.sha256).map(f=>f.source);
const forbidden=distribution.files.filter(f=>/(?:^|\/)(?:course|_teacher|raw|qa|tools|studio|reading)(?:\/|$)|(?:catalog(?:-manifest)?\.json|course-map\.(?:js|css)|learning-paths\.js|reading-state\.js|\.env|\.pem)$/.test(f.path));
const unit=spawnSync(process.execPath,['--test','tests/boundaries-refactor.test.mjs'],{encoding:'utf8'});
fs.writeFileSync(path.join(qa,'unit-output.txt'),unit.stdout+unit.stderr);
const result={checkedAt:new Date().toISOString(),package:output,protected:{count:protection.length,unchanged:protection.filter(f=>f.state==='passed').length,authorizedChanges:protection.filter(f=>f.state==='authorized-scientific-change'),amendmentErrors,failures:protection.filter(f=>f.state==='failed'),checks:protection},packageFiles:{count:fileChecks.length,failures:fileChecks.filter(f=>f.state==='failed')},sourceDrift,forbidden,staticBoundaryExit:unit.status,scientificReview:'not_inferred_from_hashes',humanReview:'pending',publicDistribution:'blocked_pending_licenses'};
fs.writeFileSync(path.join(qa,'checks.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({protected:protection.length,unchanged:result.protected.unchanged,authorizedScientificChanges:result.protected.authorizedChanges.length,amendmentErrors:amendmentErrors.length,protectedFailures:result.protected.failures.length,packageFiles:fileChecks.length,packageFailures:result.packageFiles.failures.length,sourceDrift:sourceDrift.length,forbidden:forbidden.length,staticBoundaryExit:unit.status}));if(amendmentErrors.length||result.protected.failures.length||result.packageFiles.failures.length||sourceDrift.length||forbidden.length||unit.status)process.exitCode=1;
