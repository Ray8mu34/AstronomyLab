// Compatibility entry for the original FIRAS browser suite. The paper plate
// deliberately changes colors, dimensions and DOM. Scientific outputs, domains,
// all 43 release rows/errors and restoration are independently asserted by the
// replacement suites. Original source is retained in the round-2 QA evidence.
import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
const option=(key,fallback)=>process.argv.includes(key)?process.argv[process.argv.indexOf(key)+1]:fallback;
const base=option('--base','http://127.0.0.1:4392'),before=option('--before','http://127.0.0.1:4390'),out=option('--out','build/qa/frontend-round2-20261019/galaxy/legacy-entry');
const common=['--base',base];for(const flag of ['--playwright','--browser'])if(process.argv.includes(flag))common.push(flag,option(flag));
fs.mkdirSync(out,{recursive:true});const suites=[];
for(const [file,name,args]of [['firas-plate-browser.mjs','plate',['--before',before]],['firas-validation-browser.mjs','data-validation',[]]]){
 const result=spawnSync(process.execPath,[path.join(import.meta.dirname,file),...common,...args,'--out',path.join(out,name)],{stdio:'inherit'});suites.push({file,exitCode:result.status,error:result.error?.message??null});if(result.status!==0)process.exitCode=1;
}
fs.writeFileSync(path.join(out,'suites.json'),JSON.stringify({base,before,suites},null,2));
