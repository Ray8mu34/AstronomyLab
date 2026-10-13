import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const shared=path.join(root,'web/observatory/shared');
const scripts=['web/observatory/server.mjs','web/observatory/app.js',...['shared','modules','compat'].flatMap(dir=>fs.readdirSync(path.join(root,'web/observatory',dir)).filter(x=>/\.(js|mjs)$/.test(x)).map(x=>'web/observatory/'+dir+'/'+x)),...['web/earth-moon','web/solar-system'].flatMap(dir=>fs.readdirSync(path.join(root,dir)).filter(x=>/\.(js|mjs)$/.test(x)).map(x=>dir+'/'+x))];
if(!process.argv.includes('--tests-only')) {
  for(const file of scripts){const result=spawnSync(process.execPath,['--check',file],{cwd:root,stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
  console.log(`Syntax checked: ${scripts.length} runtime files`);
}
if(!process.argv.includes('--syntax-only')) {
  const tests=fs.existsSync(path.join(root,'tests'))?fs.readdirSync(path.join(root,'tests')).filter(x=>x.endsWith('.test.mjs')).map(x=>'tests/'+x):[];
  if(!tests.length)throw Error('No unit tests found; check cannot claim a successful test run');
  const result=spawnSync(process.execPath,['--test',...tests],{cwd:root,stdio:'inherit'});
  process.exitCode=result.status||0;
}
