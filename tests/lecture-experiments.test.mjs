import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readExperimentMap,experimentMapHTML} from '../tools/export-experiment-map.mjs';
import {confirmedModes,experimentURL} from '../web/observatory/shared/tool-registry.js';

test('current 18 chapters map exact source sections to every registered mode',()=>{
 const map=readExperimentMap(),keys=new Set(map.chapters.flatMap(c=>c.experiments.map(e=>e.slug+'/'+e.mode)));
 assert.equal(map.chapters.length,18);assert.equal(keys.size,62);
 for(const [slug,modes]of Object.entries(confirmedModes))for(const mode of modes)assert(keys.has(slug+'/'+mode));
});
test('reading companion preserves actual URLs, independent navigation, and expandable gaps',()=>{
 const map=readExperimentMap(),html=experimentMapHTML(map);
 assert.equal((html.match(/class="chapter-experiments"/g)||[]).length,18);
 for(const chapter of map.chapters)for(const entry of chapter.experiments)assert(html.includes(`data-lab-path="${experimentURL(entry.slug,entry.mode)}"`));
 assert(html.includes('novalidate'));assert(html.includes('setHost(location.origin)'));assert(!html.includes('sessionStorage'));
 const registry=fs.readFileSync(new URL('../web/observatory/shared/tool-registry.js',import.meta.url),'utf8');assert(!registry.includes('course/experiments'));
});
