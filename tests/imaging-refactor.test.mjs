import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {IMAGING_DEFAULTS,IMAGING_MODEL_HASHES,M17_HASHES,M17_METADATA_HASH,imagingRecipe,validateImagingRecipe,parseImagingRecipe} from '../web/observatory/modules/imaging-state.mjs';
import {teachingChannels,expose,composite,percentile} from '../web/observatory/modules/imaging-physics.mjs';
const checks=[],pass=(name,detail={})=>checks.push({name,state:'passed',...detail});
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
for(const [file,expected]of Object.entries(IMAGING_MODEL_HASHES)){assert.equal(hash(fs.readFileSync(`web/observatory/modules/${file}-physics.mjs`)),expected);pass(`${file} scientific implementation bytes protected`);}
for(const [code,expected]of Object.entries(M17_HASHES)){assert.equal(hash(fs.readFileSync(`web/observatory/data/imaging/${code}-linear.f32`)),expected);pass(`M17 ${code} source bytes protected`);}
assert.equal(hash(fs.readFileSync('web/observatory/data/imaging/m17-metadata.json')),M17_METADATA_HASH);pass('M17 metadata and normalization-reference bytes protected');
for(const mode of ['real','teaching']){const recipe=imagingRecipe({...IMAGING_DEFAULTS,dataset:mode},{x:80,y:80});assert.deepEqual(validateImagingRecipe(recipe),recipe);assert.deepEqual(parseImagingRecipe(JSON.stringify(recipe)),recipe);pass(`${mode} complete recipe roundtrip`);
 for(const [name,mutate]of [['unknown version',r=>r.formatVersion=2],['unknown dataset',r=>r.data.id='other'],['hash mismatch',r=>r.modelHashes.imaging='0'.repeat(64)],['unknown field',r=>r.display.path='file:///private'],['NaN',r=>r.inputs.exposure=NaN],['out of range',r=>r.inputs.seed=-1],['fractional seed',r=>r.inputs.seed=7.5],['pixel bound',r=>r.pixel.x=r.data.gridSize],['bad display interval',r=>{r.display.black=.15;r.display.white=.1;}],['saved comparison claimed',r=>r.comparison.saved=true]]){const r=structuredClone(recipe);mutate(r);assert.throws(()=>validateImagingRecipe(r));pass(`${mode} rejects ${name}`);}}
assert.throws(()=>parseImagingRecipe('x'.repeat(65537)));pass('oversized recipe rejected');
const legacy={schema:'astronomy-imaging-display-v1',state:{...IMAGING_DEFAULTS},sourceGridPixel:{x:160,y:160,values:[1,2,3]},reference:{state:{...IMAGING_DEFAULTS},n:320}};
const adapted=parseImagingRecipe(JSON.stringify(legacy));assert.deepEqual(adapted,imagingRecipe(IMAGING_DEFAULTS,{x:160,y:160}));assert.equal(adapted.comparison.saved,false);pass('legacy processing information imports only validated settings and pixel, never claims saved comparison');
const rates=teachingChannels(160),counts=seed=>rates.map((rate,i)=>expose(rate,{...IMAGING_DEFAULTS,seed:seed+i*113}).values),first=counts(7),repeat=counts(7),different=counts(8);
const arrayHashes=arrays=>arrays.map(a=>hash(Buffer.from(a.buffer,a.byteOffset,a.byteLength)));
assert.deepEqual(arrayHashes(first),arrayHashes(repeat));assert.notDeepEqual(arrayHashes(first),arrayHashes(different));pass('teaching counts repeat for fixed seed and differ for explicit resample');
const original=arrayHashes(first),white=rates.map(a=>percentile(a)*IMAGING_DEFAULTS.exposure),out=[];
for(const mapping of ['SHO','HSO','HOO'])for(const method of ['linear','asinh','log'])out.push(hash(composite(first,160,{mapping,method,white})));
assert.deepEqual(arrayHashes(first),original);assert(new Set(out).size>3);pass('mapping and stretch alter display and preserve all source-array bytes');
const noNoise=rates.map(a=>expose(a,{...IMAGING_DEFAULTS,noise:false,exposure:100}).values),longer=rates.map(a=>expose(a,{...IMAGING_DEFAULTS,noise:false,exposure:600}).values);const index=80*160+80;
for(let c=0;c<3;c++)assert(Math.abs(longer[c][index]-6*noNoise[c][index])<.001);pass('unsaturated no-noise source count scales with exposure at fixed pixel');
const capped=expose(rates[1],{...IMAGING_DEFAULTS,noise:false,exposure:1200,saturation:200});assert(capped.saturated>0);pass('teaching boundary has original accumulated-cap saturation');
fs.mkdirSync('build/qa/lab-refactor/imaging',{recursive:true});fs.writeFileSync('build/qa/lab-refactor/imaging/node-evidence.json',JSON.stringify({state:'passed',scope:'retention and scoped scene recipe; no new physical model',checks},null,2));console.log(JSON.stringify({state:'passed',checks:checks.length}));
