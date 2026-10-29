import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {confirmedModes} from '../web/observatory/shared/tool-registry.js';

const context=vm.createContext({URL});
vm.runInContext(fs.readFileSync(new URL('../web/observatory/shared/route-presentation.js',import.meta.url),'utf8'),context);
const api=context.AstronomyLabPresentationRoutes;

test('synchronous presentation declarations match the scientific registry and its default modes',()=>{
 for(const[slug,declaration]of Object.entries(api.declarations)){
  assert(confirmedModes[slug],`Unknown declaration tool ${slug}`);
  assert.deepEqual(Array.from(declaration.knownModes),confirmedModes[slug],`${slug}: route mode IDs/order drift`);
  assert.equal(declaration.defaultMode,confirmedModes[slug][0],`${slug}: default mode drift`);
  for(const[mode,surface]of Object.entries(declaration.surfaces)){
   assert(confirmedModes[slug].includes(mode),`${slug}: unknown workspace mode ${mode}`);
   assert(['paper','scene','image','hr'].includes(surface));
   const route=api.resolve(`http://local.invalid/lab/${slug}?mode=${mode}`);
   assert.equal(route.layout,'workspace');assert.equal(route.surface,surface);assert.equal(route.mode,mode);
  }
 }
});

test('invalid, default, classic and non-tool routes resolve without inventing scientific modes',()=>{
 for(const[slug,declaration]of Object.entries(api.declarations)){
  for(const suffix of ['', '?mode=not-a-mode'])assert.equal(api.resolve('http://local.invalid/lab/'+slug+suffix).mode,declaration.defaultMode);
  for(const mode of declaration.knownModes){const classic=api.resolve(`http://local.invalid/lab/${slug}?mode=${mode}&ui=classic`);assert.equal(classic.layout,declaration.classicAvailable?'standard':'workspace');assert.equal(classic.mode,mode);}
 }
 for(const url of ['/','/sources','/lab/unknown','/labs/earth-moon/?mode=phase'])assert.equal(api.resolve('http://local.invalid'+url).layout,'standard');
});

test('clearing a failed route restores standard document presentation',()=>{
 const doc={documentElement:{dataset:{}},body:{dataset:{}}};
 api.apply('http://local.invalid/lab/optics?mode=sampling',doc);
 assert.equal(doc.documentElement.dataset.alRouteLayout,'workspace');
 api.clear(doc);assert.equal(doc.documentElement.dataset.alRouteLayout,'standard');assert.equal(doc.documentElement.dataset.alSurface,'paper');assert.equal(doc.body.dataset.alSurface,'paper');
});

test('declared presentation styles are unique CSS URLs present in the exact runtime allowlist',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../web/observatory/runtime-assets.json',import.meta.url),'utf8'));
 for(const[slug,declaration]of Object.entries(api.declarations)){
  assert(Array.isArray(declaration.styles)&&declaration.styles.length>0,slug+' has no declared style dependency');
  assert.equal(new Set(declaration.styles).size,declaration.styles.length,slug+' repeats a stylesheet');
  for(const url of declaration.styles){assert(/^\/modules\/[a-z0-9-]+\.css$/.test(url),'Unexpected style URL '+url);assert(manifest.files.some(f=>f.url===url),'Style not admitted to runtime allowlist: '+url);}
 }
});
