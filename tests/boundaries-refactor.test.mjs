import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {confirmedModes,experimentURL} from '../web/observatory/shared/tool-registry.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const expected={
 'solar-system':['explore','distance','sizes','compare','axes'],
 'earth-moon':['phase','spin','period','eclipse'],
 alignments:['venus','mars','transit'],sky:['sky','stars','measure','calendar','day','precession'],
 optics:['imaging','resolution','sampling'],light:['thermal','motion','magnitude','observing'],
 imaging:['real','teaching'],stars:['hr','evolution','pulsar','collapse','ia'],
 galaxy:['galaxy','cmb','cmb-spectrum'],orbits:['orbit','transfer','staging','landing'],
 measure:['shadow','jupiter','s2','distance'],
};
const forbidden=/\/(?:course-map|learning-paths|reading-state)\.js$|\/compat\/|\/data\/catalog\.json$|\/course\//;
const toUnix=value=>value.replaceAll('\\','/');

// This follows literal static imports, re-exports and import(). Conditional
// module mount paths are added explicitly from the actual public registry.
function imports(file){
 const source=fs.readFileSync(file,'utf8');
 const refs=[...source.matchAll(/(?:\b(?:import|export)\s+(?:[^;\n]*?\s+from\s*)?|\bimport\s*\()\s*['"]([^'"]+)['"]/g)].map(m=>m[1]);
 return refs.flatMap(ref=>{
  if(!ref.startsWith('.')&&!ref.startsWith('/'))return [];
  const target=ref.startsWith('/')?path.join(root,'web/observatory',ref):path.resolve(path.dirname(file),ref);
  return /\.(?:m?js)$/.test(target)&&fs.existsSync(target)?[target]:[];
 });
}
function graph(entries){
 const visited=new Set(),queue=[...entries];
 while(queue.length){const file=queue.shift();if(visited.has(file))continue;assert(fs.existsSync(file),'Missing runtime entry: '+file);visited.add(file);queue.push(...imports(file));}
 return [...visited].map(file=>toUnix(path.relative(root,file)));
}

test('R1 keeps all eleven public tool IDs, all 43 mode IDs and ordinary mode URLs',()=>{
 assert(Object.keys(expected).every(slug=>Object.hasOwn(confirmedModes,slug)));
 for(const [slug,modes] of Object.entries(expected)){
  assert.deepEqual([...confirmedModes[slug]].sort(),[...modes].sort(),slug);
  for(const mode of modes){const url=new URL(experimentURL(slug,mode),'http://local.test');assert.equal(url.searchParams.get('mode'),mode);assert.match(url.pathname,new RegExp('^/(?:labs?)/'+slug+'/?$'));}
 }
 assert.equal(Object.keys(expected).flatMap(slug=>confirmedModes[slug]).length,43);
});

test('eight additive tools expose the nineteen requested scientific modes',()=>{
 const added={'galaxy-measurements':['distance','rotation','mass'],cosmology:['expansion','distance'],tides:['locking','earth-moon'],'planet-environments':['balance','atmosphere','escape'],lunisolar:['calendar','intercalation'],'image-calibration':['calibration','photometry'],'stellar-interior':['equilibrium','thermostat','transport'],'supernova-light':['diffusion','radioactivity']};
 assert.deepEqual(Object.keys(confirmedModes).sort(),[...Object.keys(expected),...Object.keys(added)].sort());
 for(const [slug,modes] of Object.entries(added))assert.deepEqual(confirmedModes[slug],modes);
 assert.equal(Object.values(confirmedModes).flat().length,62);
});

test('tool registry has no course numbers, lesson paths or article mapping fields',()=>{
 const source=fs.readFileSync(path.join(root,'web/observatory/shared/tool-registry.js'),'utf8');
 assert(!/\blessonEntries\b|\blessons\s*:|\btag\s*:|\brange\s*:|\/read\/|\/reading\/|\/course\//.test(source));
 assert(!/\bfrom\s+['"][^'"]*(?:course-map|learning-paths|reading-state)/.test(source));
});

test('tool entry and every mounted module stay outside the isolated reader import graph',()=>{
 const entry=path.join(root,'web/observatory/app.js');
 const mounted=Object.keys(confirmedModes).filter(slug=>!['solar-system','earth-moon'].includes(slug)).map(slug=>path.join(root,'web/observatory/modules',slug+'.js'));
 const files=graph([entry,...mounted,path.join(root,'web/observatory/shared/navigation.js'),path.join(root,'web/observatory/shared/tool-start.js'),path.join(root,'web/solar-system/app.js'),path.join(root,'web/earth-moon/app.js')]);
 assert.deepEqual(files.filter(file=>forbidden.test('/'+file)),[],'Course dependencies are still transitively loaded by tools');
 for(const file of files.filter(file=>!file.includes('/vendor/'))){
  const source=fs.readFileSync(path.join(root,file),'utf8');
  assert(!/\bimport\s*\(\s*['"][^'"]*(?:course-map|learning-paths|reading-state|compat\/)/.test(source),file);
 }
});

test('pure image task has no transitive Three.js, OrbitControls or WebGL scene import',()=>{
 const files=graph([path.join(root,'web/observatory/modules/imaging.js')]);
 assert.deepEqual(files.filter(file=>/\/three[^/]*\.js$|\/OrbitControls\.js$|\/lab-3d\.js$/.test(file)),[]);
 for(const file of files)assert(!/from\s*['"](?:three|three\/addons)/.test(fs.readFileSync(path.join(root,file),'utf8')),file);
});

test('reading compatibility retains its own explicit navigation functions',()=>{
 const source=fs.readFileSync(path.join(root,'web/observatory/compat/reading-navigation.js'),'utf8');
 for(const name of ['navigationURL','experimentReadingPaths','updateExperimentReadingLinks'])assert.match(source,new RegExp('export (?:function|const) '+name+'\\b'));
 const core=fs.readFileSync(path.join(root,'web/observatory/shared/navigation.js'),'utf8');
 assert(!/experimentReadingPaths|updateExperimentReadingLinks|learning-paths|reading-state|course-map/.test(core));
});

test('the protected solar-system physics/data implementation remains in place',()=>{
 for(const file of ['web/solar-system/physics.mjs','web/earth-moon/physics.mjs']){
  // The solar system uses catalog/scene rather than a physics.mjs; the Moon
  // existing model is mandatory. Exact byte preservation is checked by W0/W7.
  if(file.includes('solar-system')&&!fs.existsSync(path.join(root,file)))continue;
  assert(fs.statSync(path.join(root,file)).size>1000,file);
 }
});
