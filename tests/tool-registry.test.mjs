import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {topics,labs,confirmedModes,labURL,experimentURL} from '../web/observatory/shared/tool-registry.js';
import {modeContexts,getModeContext,modeCoverage} from '../web/observatory/shared/mode-context.js';
import {lessonEntries} from '../web/observatory/shared/course-map.js';
import {learningPaths} from '../web/observatory/shared/learning-paths.js';
import {experimentAdapters} from '../web/observatory/shared/experiment-state.js';
import {bindControls,syncControls,assetURL,startVisibleLoop} from '../web/observatory/shared/core-controls.js';

test('independent registry preserves eleven tools, 43 stable modes and direct URLs',()=>{
 assert.equal(labs.length,11);assert.equal(Object.values(confirmedModes).flat().length,43);
 assert.equal(new Set(labs.map(tool=>tool.id)).size,11);
 for(const tool of labs){
  assert.equal(tool.id,tool.slug);assert.ok(topics.some(topic=>topic.key===tool.topic));
  assert.equal(tool.entry,labURL(tool.id));assert.deepEqual(tool.modes,confirmedModes[tool.id]);
  assert.equal(tool.defaultMode,tool.modes[0]);
  for(const field of ['lessons','tag','range','lesson','anchor'])assert.ok(!Object.hasOwn(tool,field));
  for(const mode of tool.modes)assert.equal(new URL(experimentURL(tool.id,mode),'http://localhost').searchParams.get('mode'),mode);
  assert.equal(experimentURL(tool.id,'not-a-mode'),labURL(tool.id));
 }
 assert.equal(labURL('solar-system'),'/labs/solar-system/');assert.equal(labURL('earth-moon'),'/labs/earth-moon/');
 assert.equal(experimentURL('galaxy','cmb-spectrum'),'/lab/galaxy?mode=cmb-spectrum');
 assert.ok(topics.every(topic=>!Object.hasOwn(topic,'range')));
});
test('legacy content remains isolated and keeps sixteen entries and 45 paragraph mappings',()=>{
 assert.equal(Object.keys(lessonEntries).length,16);assert.equal(learningPaths.length,45);
 for(const path of learningPaths)assert.ok(confirmedModes[path.slug].includes(path.mode));
});
test('each mode has concrete independent context, operation and boundary evidence recipe',()=>{
 const coverage=modeCoverage();assert.equal(coverage.length,43);assert.equal(new Set(coverage.map(row=>row.slug+'/'+row.mode)).size,43);
 for(const row of coverage){
  assert.equal(row.depth,'基础适配');
  for(const field of ['title','question','action','observe','boundary'])assert.ok(typeof row[field]==='string'&&row[field].length>=(field==='title'?2:6),row.slug+'/'+row.mode+':'+field);
  assert.ok(!/第\d+讲|先读|读完|课程目录/.test(row.question+row.action+row.observe+row.boundary));
  assert.ok(row.testPath.length>0);assert.ok(row.boundaryStep.expected);
  for(const step of [...row.testPath,row.boundaryStep]){
   assert.ok(step.selector.length>0);assert.ok(['click','input','change'].includes(step.action));assert.ok(step.expected.length>0);
   if(step.action!=='click')assert.ok(['boolean','number','string'].includes(typeof step.value));
  }
 }
 assert.equal(getModeContext('__proto__','constructor'),null);assert.equal(getModeContext('light','unknown'),null);
 assert.equal(Object.values(modeContexts).flatMap(Object.values).length,43);
});
test('state adapters use the neutral registry and preserve a teaching image noise seed',async()=>{
 assert.deepEqual(Object.keys(experimentAdapters).sort(),Object.keys(confirmedModes).sort());
 assert.ok(experimentAdapters.imaging.controls.some(control=>control.name==='seed'&&control.selector==='[data-key="seed"]'));
 for(const name of ['experiment-state.js','mode-entry.js']){
  const text=await readFile(new URL('../web/observatory/shared/'+name,import.meta.url),'utf8');
  assert.ok(text.includes("from './tool-registry.js'"));assert.ok(!text.includes('course-map.js'));assert.ok(!text.includes('learning-paths.js'));
 }
});
test('pure DOM and Canvas helpers do not import scenes, Three or content registries',async()=>{
 for(const name of ['core-controls.js','plot.js']){
  const text=await readFile(new URL('../web/observatory/shared/'+name,import.meta.url),'utf8');
  const dependencies=source=>[...source.matchAll(/(?:\b(?:import|export)\s+(?:[^;\n]*?\s+from\s*)?|\bimport\s*\(\s*)['"]([^'"]+)['"]/g)].map(m=>m[1]);
  const direct=dependencies(text);
  assert.deepEqual(direct,name==='plot.js'?['./presentation.js']:[],name+' may only consume the canonical DOM presentation helper');
  const shared=new URL('../web/observatory/shared/',import.meta.url),visited=new Set();
  const checkDependency=async url=>{if(visited.has(url.href))return;visited.add(url.href);assert(url.href.startsWith(shared.href),'2D helper dependency leaves shared presentation layer: '+url.href);assert(!/(?:^|\/)(?:scene|lab|three|.*catalog.*|course-map|learning-paths|tool-registry)(?:[./-]|$)/i.test(url.pathname),'Forbidden scene/Three/content dependency: '+url.href);const source=await readFile(url,'utf8');assert(!/lessonLinks|course-map|learning-paths|THREE\.|WebGLRenderer/.test(source),url.href);for(const specifier of dependencies(source)){assert(specifier.startsWith('./')||specifier.startsWith('../'),'External 2D helper dependency: '+specifier);await checkDependency(new URL(specifier,url));}};
  await checkDependency(new URL('../web/observatory/shared/'+name,import.meta.url));
 }
 const light=await readFile(new URL('../web/observatory/modules/light.js',import.meta.url),'utf8');
 assert.ok(light.includes("from '../shared/plot.js'"));assert.ok(!/shared\/(?:lab|scene)\.js|lessonLinks|\/read\//.test(light));
});
test('split controls retain input event semantics, unbind and display-step rounding',()=>{
 const listeners=new Map(),outputs=[{textContent:''}];
 const input={dataset:{key:'height'},type:'range',value:'',addEventListener(type,fn){listeners.set(type,fn);},removeEventListener(type,fn){assert.equal(listeners.get(type),fn);listeners.delete(type);}};
 const host={querySelectorAll(selector){return selector==='[data-key]'?[input]:outputs;}};
 const state={height:1.25},changes=[];const unbind=bindControls(host,state,(key,value)=>changes.push([key,value]));
 assert.equal(input.value,1.25);input.value='1.3';listeners.get('input')();assert.equal(state.height,1.3);assert.deepEqual(changes,[['height',1.3]]);
 syncControls(host,state);assert.equal(outputs[0].textContent,1.3);unbind();assert.equal(listeners.size,0);
 assert.equal(assetURL('/assets/example.png'),'/assets/example.png');
});
test('2D visible clock pauses hidden time, bounds deltas and releases its frame/listener',()=>{
 const doc=new EventTarget();doc.hidden=false;const frames=new Map();let id=0;
 const win={document:doc,requestAnimationFrame(fn){frames.set(++id,fn);return id;},cancelAnimationFrame(frame){frames.delete(frame);}};
 const values=[],stop=startVisibleLoop((dt,total)=>values.push([dt,total]),{window:win});
 const run=time=>{const [key,fn]=[...frames][0];frames.delete(key);fn(time);};
 run(100);run(200);assert.deepEqual(values,[[0,0],[.08,.08]]);
 doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));run(20000);assert.equal(values.length,2);
 doc.hidden=false;doc.dispatchEvent(new Event('visibilitychange'));run(30000);assert.deepEqual(values.at(-1),[0,.08]);
 stop();assert.equal(frames.size,0);
});
