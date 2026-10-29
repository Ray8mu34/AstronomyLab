import test from 'node:test';
import assert from 'node:assert/strict';
import {confirmedModes} from '../web/observatory/shared/tool-registry.js';
import {experimentAdapters,EXPERIMENT_STATE_VERSION,ensureExperimentEntry,validateControlValue,validateExperimentSnapshot,currentExperimentMode,captureExperiment,restoreExperiment,bindExperimentState,readExperimentSnapshot,initializeLegacyExperiment,waitForLegacyControls} from '../web/observatory/shared/experiment-state.js';
import {registerExperimentModel,validateExperimentModel} from '../web/observatory/shared/experiment-state.js';
import {conicState} from '../web/observatory/modules/orbit-conics-physics.mjs';
import {EARTH} from '../web/observatory/modules/orbits-physics.mjs';
import {dynamicalMass} from '../web/observatory/modules/measure-physics.mjs';
import {rng} from '../web/observatory/modules/light-physics.mjs';

class CustomEvent extends Event{constructor(type,options={}){super(type,options);this.detail=options.detail;}}
class MockWindow extends EventTarget{
 constructor(id='entry-a'){
  super();this.Event=Event;this.CustomEvent=CustomEvent;this.setTimeout=setTimeout;this.crypto={randomUUID:()=> 'generated-entry'};this.location={href:'http://localhost/lab/optics'};
  this.history={state:{astronomy:{entryId:id}},replaceState:(state)=>{this.history.state=state;}};
  const data=new Map();this.sessionStorage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};
 }
}
class MockElement extends EventTarget{
 constructor(root,selector,{type='range',value='0',min='0',max='100',step='1',options=[],attrs={},onApply}={}){
  super();Object.assign(this,{root,selector,type,value,min,max,step,options:options.map(value=>({value,disabled:false})),disabled:false,checked:false,tagName:type==='select'?'SELECT':'INPUT',textContent:'',onApply,clickCount:0});this.attrs={...attrs};this.classList={contains:key=>key==='active'&&this.active};
 }
 getAttribute(name){return this.attrs[name]??null;}
 setAttribute(name,value){this.attrs[name]=String(value);}
 click(){this.clickCount++;this.onApply?.('click',this);this.root.dispatchEvent(new Event('click'));}
 dispatchEvent(event){const result=super.dispatchEvent(event);this.onApply?.(event.type,this);if(event.bubbles)this.root.dispatchEvent(new Event(event.type));return result;}
}
class MockRoot extends EventTarget{
 constructor(win){super();this.ownerDocument={defaultView:win};this.controls=new Map();this.buttons=[];this.dataset={};}
 add(selector,spec={}){const node=new MockElement(this,selector,spec);this.controls.set(selector,node);return node;}
 button(attribute,value,selected=false,onApply){
  const node=this.add(`button[${attribute}="${value}"]`,{type:'button',attrs:{[attribute]:value,'aria-pressed':String(selected)}});node.tagName='BUTTON';this.buttons.push(node);
  node.onApply=(event)=>{if(event==='click'){for(const other of this.buttons.filter(b=>b.getAttribute(attribute)!==null))other.setAttribute('aria-pressed',other===node);onApply?.(node);}};return node;
 }
 querySelector(selector){return this.controls.get(selector)||this.buttons.find(button=>button.selector===selector)||(selector==='button[data-mode]'?this.buttons.find(button=>button.getAttribute('data-mode')!==null):null);}
 querySelectorAll(selector){const attribute=/^button\[([^\]]+)\]$/.exec(selector)?.[1];return attribute?this.buttons.filter(button=>button.getAttribute(attribute)!==null):[];}
}
const range=(root,key,value='0',min='0',max='100',step='1',onApply)=>root.add(`[data-key="${key}"]`,{value,min,max,step,onApply});
const conicRecipe=(height,speed)=>({version:1,kind:'orbit-conics',height,speed,totalHours:24,rateHours:1.2,elapsed:123.456789,view:'whole'});
function rootForMode(slug,mode,win=new MockWindow()){
 const root=new MockRoot(win),attribute=experimentAdapters[slug].mode.attribute;
 const modes=slug==='sky'?confirmedModes.sky.filter(mode=>mode!=='calendar'):slug==='galaxy'?['galaxy','cmb']:confirmedModes[slug];
 const base=slug==='sky'&&mode==='calendar'?'measure':slug==='galaxy'&&mode.startsWith('cmb')?'cmb':mode;
 modes.forEach(value=>root.button(attribute,value,value===base));
 if(slug==='sky'){root.button('data-measure-task','shadow',mode==='measure');root.button('data-measure-task','calendar',mode==='calendar');}
 if(slug==='galaxy'){root.button('data-cmb-view','map',mode==='cmb');root.button('data-cmb-view','spectrum',mode==='cmb-spectrum');}
 return root;
}

test('all nineteen experiments and 62 modes have explicit public-control adapters',()=>{
 assert.deepEqual(Object.keys(experimentAdapters).sort(),Object.keys(confirmedModes).sort());
 let count=0;for(const [slug,modes]of Object.entries(confirmedModes)){for(const mode of modes){assert.equal(currentExperimentMode(slug,rootForMode(slug,mode)),mode);count++;}const names=experimentAdapters[slug].controls.map(c=>c.name);assert.equal(new Set(names).size,names.length,slug);}
 assert.equal(count,62);
});

test('tidal history preserves both exact clocks and restores a paused model without range rounding',async()=>{
 const {defaultTideState,validateTideState,createTideTrajectory}=await import('../web/observatory/modules/tides-physics.mjs');
 for(const mode of confirmedModes.tides){
  const model={...defaultTideState(mode),lockTime:83.123456789,earthTime:473.987654321};
  assert.deepEqual(validateExperimentModel('tides',mode,model),validateTideState(mode,model));
  const win=new MockWindow(),source=rootForMode('tides',mode,win);
  range(source,'lockTime','83.1','0','240','.1');range(source,'earthTime','474','0','1200','.1');
  registerExperimentModel(source,{getState:()=>model});captureExperiment('tides',source);
  const target=rootForMode('tides',mode,win);let restored;
  range(target,'lockTime','0','0','240','.1',()=>assert.fail('model clock must remain exact'));
  range(target,'earthTime','0','0','1200','.1',()=>assert.fail('inactive model clock must remain exact'));
  const play=target.add('[data-play]',{type:'button',attrs:{'aria-pressed':'true'},onApply:(_,node)=>node.setAttribute('aria-pressed','false')});
  registerExperimentModel(target,{applyState:value=>{restored=value;return true;}});
  assert.equal(await restoreExperiment('tides',target),true);assert.deepEqual(restored,model);assert.equal(play.getAttribute('aria-pressed'),'false');
  const prefix=mode==='locking'?'lock':'earth';
  const trajectory=createTideTrajectory(mode,model[prefix+'Spin'],model[prefix+'Coupling']);
  assert.deepEqual(trajectory.at(restored[prefix+'Time']),trajectory.at(model[prefix+'Time']));
  for(const bad of [{mode:mode==='locking'?'earth-moon':'locking'},{earthTime:1201},{lockTime:NaN},{lockCoupling:0},{earthSpin:'27.3'},{kind:'other'}]){
   const value={...model,...bad};assert.equal(validateExperimentModel('tides',mode,value),null);assert.equal(validateTideState(mode,value),null);
  }
 }
});
test('scientific snapshots retain circular/escape inputs at all four heights independently of rounded native values',async()=>{
 for(const height of [100,200,1200,5000])for(const preset of ['vc','escape']){
  const win=new MockWindow(),source=rootForMode('orbits','orbit',win),speed=conicState(height,0)[preset],model=conicRecipe(height,speed);
  source.add('[data-conic-key="speed"]',{value:String(Number(speed.toFixed(3))),min:'0',max:'16',step:'.001'});
  registerExperimentModel(source,{getState:()=>model});const snapshot=captureExperiment('orbits',source);
  assert.equal(snapshot.model.speed,speed);assert.equal(snapshot.values['conic:speed'],Number(speed.toFixed(3)));
  // Mutating a caller's object after capture cannot change the stored recipe.
  model.speed=0;assert.equal(readExperimentSnapshot('orbits','entry-a',win).model.speed,speed);
  const target=rootForMode('orbits','orbit',win);let applied=null,controlEvents=0;
  target.add('[data-conic-key="speed"]',{value:'7',min:'0',max:'16',step:'.001',onApply:()=>controlEvents++});
  registerExperimentModel(target,{applyState:saved=>{applied=saved;return true;}});
  assert.equal(await restoreExperiment('orbits',target),true);assert.equal(controlEvents,0);assert.equal(applied.speed,speed);
  const actual=conicState(applied.height,applied.speed),expected=conicState(height,speed);
  assert.deepEqual(actual,expected);assert.equal(actual.kind,preset==='escape'?'临界抛物线':'圆（椭圆特例）');
  const independentEnergy=speed*speed/2-EARTH.mu/(EARTH.radius+height);
  assert.ok(Math.abs(actual.energy-independentEnergy)<=64*Number.EPSILON*EARTH.mu/actual.r);
 }
});
test('Jupiter authority retains +10% semi-major axis and dynamical mass without range replay',async()=>{
 const win=new MockWindow(),source=rootForMode('measure','jupiter',win),recipe={version:1,kind:'jupiter-mass',a:421800*1.1,period:1.769138,errorA:1,errorP:.1,phase:.56789};
 range(source,'a','464000','300000','550000','100');registerExperimentModel(source,{getState:()=>recipe});
 const saved=captureExperiment('measure',source);assert.equal(saved.model.a,463980.00000000006);assert.equal(saved.values.a,464000);
 const target=rootForMode('measure','jupiter',win);let result=null;range(target,'a','421800','300000','550000','100',()=>assert.fail('native a must not overwrite the model'));
 registerExperimentModel(target,{applyState:value=>{result=dynamicalMass(value.a*1000,value.period*86400,value.errorA/100,value.errorP/100);return true;}});
 await restoreExperiment('measure',target);assert.deepEqual(result,dynamicalMass(recipe.a*1000,recipe.period*86400,.01,.001));
});
test('galactic direction authority retains point selection across all shared galaxy modes without range replay',async()=>{
 for(const mode of confirmedModes.galaxy){
  const win=new MockWindow(),source=rootForMode('galaxy',mode,win),model={version:1,kind:'galactic-direction',longitude:85.15845070422536,latitude:45.25253080985916};
  range(source,'longitude','85','-180','180');range(source,'latitude','45','-90','90');
  registerExperimentModel(source,{getState:()=>model});const saved=captureExperiment('galaxy',source);
  assert.equal(saved.values.longitude,85);assert.equal(saved.values.latitude,45);assert.deepEqual(saved.model,model);
  const expected={...model};model.longitude=0;
  const target=rootForMode('galaxy',mode,win);let restored;
  range(target,'longitude','0','-180','180','1',()=>assert.fail('native longitude must not quantize point selection'));
  range(target,'latitude','0','-90','90','1',()=>assert.fail('native latitude must not quantize point selection'));
  registerExperimentModel(target,{applyState:value=>{restored=value;return true;}});
  assert.equal(await restoreExperiment('galaxy',target),true);assert.deepEqual(restored,expected);
 }
});
test('planet alignment day preserves exact preset precision while other controls retain native replay',async()=>{
 for(const mode of ['venus','transit','mars']){
  const win=new MockWindow(),source=rootForMode('alignments',mode,win),day=mode==='mars'?-90.123456789:291.96182439614387,model={version:1,kind:'planet-alignments',mode,day};
  range(source,'day',String(Number(day.toFixed(1))),mode==='mars'?'-190':'0',mode==='mars'?'190':'583.9236487922877','.1');range(source,'inclination','2.3','0','8','.1');registerExperimentModel(source,{getState:()=>model});
  const saved=captureExperiment('alignments',source);assert.equal(saved.model.day,day);assert.equal(saved.values.day,Number(day.toFixed(1)));assert.deepEqual(Object.keys(saved.model).sort(),['day','kind','mode','version']);
  const target=rootForMode('alignments',mode,win);let applied,ordinaryEvents=0;range(target,'day','0',mode==='mars'?'-190':'0',mode==='mars'?'190':'583.9236487922877','.1',()=>assert.fail('native day must not round an exact preset'));range(target,'inclination','0','0','8','.1',()=>ordinaryEvents++);registerExperimentModel(target,{applyState:value=>{applied=value;return true;}});
  assert.equal(await restoreExperiment('alignments',target),true);assert.equal(applied.day,day);assert.equal(applied.mode,mode);assert.equal(ordinaryEvents,1);
 }
});
test('planet alignment model refuses mismatched modes and corrupt snapshots before touching current state',async()=>{
 const good={version:1,kind:'planet-alignments',mode:'venus',day:291.96182439614387};
 for(const day of[0,583.9236487922877])assert.equal(validateExperimentModel('alignments','venus',{...good,day}).day,day);
 for(const day of[-190,190])assert.equal(validateExperimentModel('alignments','mars',{...good,mode:'mars',day}).day,day);
 for(const change of[{version:2},{kind:'orbit-conics'},{mode:'mars'},{day:-.01},{day:583.924},{day:NaN},{day:Infinity},{day:'291.9'},{day:null}]){
  const win=new MockWindow(),root=rootForMode('alignments','mars',win),history=structuredClone(win.history.state),input=range(root,'day','-90','-190','190','.1');let applied=0;registerExperimentModel(root,{applyState:()=>applied++});
  win.sessionStorage.setItem('astronomy:experiment:v1:entry-a:alignments',JSON.stringify({version:1,slug:'alignments',mode:'venus',values:{day:292},choices:{},model:{...good,...change}}));
  assert.equal(await restoreExperiment('alignments',root),false);assert.equal(currentExperimentMode('alignments',root),'mars');assert.equal(input.value,'-90');assert.equal(applied,0);assert.deepEqual(win.history.state,history);
 }
 const incomplete={...good};delete incomplete.day;assert.equal(validateExperimentModel('alignments','venus',incomplete),null);assert.equal(validateExperimentModel('alignments','unknown',good),null);assert.equal(validateExperimentModel('sky','sky',good),null);
});
test('legacy alignment snapshots honestly restore their quantized day without guessing a preset',async()=>{
 const win=new MockWindow(),root=rootForMode('alignments','venus',win),input=range(root,'day','72','0','583.9236487922877','.1');let applied=0;registerExperimentModel(root,{applyState:()=>applied++});
 win.sessionStorage.setItem('astronomy:experiment:v1:entry-a:alignments',JSON.stringify({version:1,slug:'alignments',mode:'venus',values:{day:292},choices:{}}));
 assert.equal(await restoreExperiment('alignments',root),true);assert.equal(Number(input.value),292);assert.equal(applied,0);
});
test('sky condition authority preserves exact obliquity across each original mode without changing native step',async()=>{
 for(const mode of confirmedModes.sky){const win=new MockWindow(),source=rootForMode('sky',mode,win),model={version:1,kind:'sky-conditions',mode,obliquity:23.44};range(source,'obliquity','23.4','0','45','.1');registerExperimentModel(source,{getState:()=>model});const saved=captureExperiment('sky',source);assert.equal(saved.values.obliquity,23.4);assert.equal(saved.model.obliquity,23.44);
  const target=rootForMode('sky',mode,win);let applied;range(target,'obliquity','0','0','45','.1',()=>assert.fail('range step must not round scientific obliquity'));registerExperimentModel(target,{applyState:value=>{applied=value;return true;}});assert.equal(await restoreExperiment('sky',target),true);assert.deepEqual(applied,model);assert.equal(target.querySelector('[data-key="obliquity"]').step,'.1');}
});
test('sky obliquity rejects invalid or mismatched models before any current state/history mutation',async()=>{
 const good={version:1,kind:'sky-conditions',mode:'sky',obliquity:23.44};for(const obliquity of[0,45])assert.equal(validateExperimentModel('sky','sky',{...good,obliquity}).obliquity,obliquity);
 for(const change of[{version:2},{kind:'galactic-direction'},{mode:'day'},{obliquity:-.01},{obliquity:45.01},{obliquity:NaN},{obliquity:Infinity},{obliquity:'23.44'},{obliquity:null}]){const win=new MockWindow(),root=rootForMode('sky','day',win),history=structuredClone(win.history.state),input=range(root,'obliquity','12','0','45','.1');let applied=0;registerExperimentModel(root,{applyState:()=>applied++});win.sessionStorage.setItem('astronomy:experiment:v1:entry-a:sky',JSON.stringify({version:1,slug:'sky',mode:'sky',values:{obliquity:23.4},choices:{},model:{...good,...change}}));assert.equal(await restoreExperiment('sky',root),false);assert.equal(currentExperimentMode('sky',root),'day');assert.equal(input.value,'12');assert.equal(applied,0);assert.deepEqual(win.history.state,history);}
 const missing={...good};delete missing.obliquity;assert.equal(validateExperimentModel('sky','sky',missing),null);assert.equal(validateExperimentModel('sky','unknown',good),null);assert.equal(validateExperimentModel('alignments','venus',good),null);
});
test('old sky control-only snapshots retain rounded obliquity instead of inferring the old default',async()=>{
 const win=new MockWindow(),root=rootForMode('sky','sky',win),input=range(root,'obliquity','0','0','45','.1');let applied=0;registerExperimentModel(root,{applyState:()=>applied++});win.sessionStorage.setItem('astronomy:experiment:v1:entry-a:sky',JSON.stringify({version:1,slug:'sky',mode:'sky',values:{obliquity:23.4},choices:{}}));assert.equal(await restoreExperiment('sky',root),true);assert.equal(Number(input.value),23.4);assert.equal(applied,0);
});
test('galactic direction validates endpoints and refuses bad models before changing valid state or history',async()=>{
 const good={version:1,kind:'galactic-direction',longitude:85.15845070422536,latitude:45.25253080985916};
 for(const longitude of [-180,180])for(const latitude of [-90,90])assert.deepEqual(validateExperimentModel('galaxy','cmb',{...good,longitude,latitude}),{...good,longitude,latitude});
 const bad=[{version:2},{kind:'orbit-conics'},{longitude:180.01},{longitude:-180.01},{latitude:90.01},{latitude:-90.01},{longitude:NaN},{latitude:Infinity},{longitude:'85'},{latitude:null}];
 for(const change of bad){
  const win=new MockWindow(),root=rootForMode('galaxy','galaxy',win),before=structuredClone(win.history.state);
  const input=range(root,'longitude','12','-180','180'),model={...good,...change};let applied=0;
  registerExperimentModel(root,{applyState:()=>{applied++;}});
  assert.equal(validateExperimentModel('galaxy','cmb',model),null);
  win.sessionStorage.setItem('astronomy:experiment:v1:entry-a:galaxy',JSON.stringify({version:1,slug:'galaxy',mode:'cmb',values:{longitude:85},choices:{},model}));
  assert.equal(await restoreExperiment('galaxy',root),false);assert.equal(currentExperimentMode('galaxy',root),'galaxy');assert.equal(input.value,'12');assert.equal(applied,0);assert.deepEqual(win.history.state,before);
 }
 const incomplete={...good};delete incomplete.latitude;assert.equal(validateExperimentModel('galaxy','cmb',incomplete),null);
 assert.equal(validateExperimentModel('galaxy','unknown',good),null);assert.equal(validateExperimentModel('stars','hr',good),null);
});
test('legacy galactic direction snapshots restore their actual rounded values and invalid captures preserve latest valid model',async()=>{
 const win=new MockWindow(),root=rootForMode('galaxy','cmb',win);let longitude=0,latitude=0;
 range(root,'longitude','0','-180','180','1',(_,input)=>longitude=Number(input.value));range(root,'latitude','0','-90','90','1',(_,input)=>latitude=Number(input.value));
 let model={version:1,kind:'galactic-direction',longitude:85.15845070422536,latitude:45.25253080985916};
 registerExperimentModel(root,{getState:()=>model,applyState:()=>assert.fail('old snapshots have no precise model')});
 win.sessionStorage.setItem('astronomy:experiment:v1:entry-a:galaxy',JSON.stringify({version:1,slug:'galaxy',mode:'cmb',values:{longitude:85,latitude:45},choices:{}}));
 assert.equal(await restoreExperiment('galaxy',root),true);assert.equal(longitude,85);assert.equal(latitude,45);
 const valid=captureExperiment('galaxy',root);model={...model,latitude:NaN};assert.equal(captureExperiment('galaxy',root),null);assert.deepEqual(readExperimentSnapshot('galaxy','entry-a',win),valid);
});
test('observing snapshots preserve the fixed uint32 noise sample seed and repeat its generated sequence',async()=>{
 const win=new MockWindow(),source=rootForMode('light','observing',win),recipe={version:1,kind:'light-sample',seed:5};
 registerExperimentModel(source,{getState:()=>recipe});const saved=captureExperiment('light',source);assert.deepEqual(saved.model,recipe);
 let seed=4;const target=rootForMode('light','observing',win);registerExperimentModel(target,{applyState:model=>{seed=model.seed;return true;}});
 assert.equal(await restoreExperiment('light',target),true);assert.equal(seed,5);
 const before=rng(recipe.seed),after=rng(seed);assert.deepEqual(Array.from({length:81},()=>before()),Array.from({length:81},()=>after()));
 for(const edge of [0,0xffffffff])assert.deepEqual(validateExperimentModel('light','observing',{...recipe,seed:edge}),{...recipe,seed:edge});
});
test('bad observing sample seeds reject the whole snapshot and old snapshots retain the original default seed',async()=>{
 const valid={version:1,kind:'light-sample',seed:5};
 for(const seed of [-1,0x100000000,.5,NaN,Infinity,'5',null]){
  const win=new MockWindow(),root=rootForMode('light','thermal',win),before=structuredClone(win.history.state),control=range(root,'exposure','100','10','2000');let applications=0;
  registerExperimentModel(root,{applyState:()=>{applications++;}});
  assert.equal(validateExperimentModel('light','observing',{...valid,seed}),null);
  win.sessionStorage.setItem('astronomy:experiment:v1:entry-a:light',JSON.stringify({version:1,slug:'light',mode:'observing',values:{exposure:400},choices:{},model:{...valid,seed}}));
  assert.equal(await restoreExperiment('light',root),false);assert.equal(currentExperimentMode('light',root),'thermal');assert.equal(control.value,'100');assert.equal(applications,0);assert.deepEqual(win.history.state,before);
 }
 assert.equal(validateExperimentModel('light','thermal',valid),null);assert.equal(validateExperimentModel('light','observing',{kind:'light-sample',version:2,seed:5}),null);assert.equal(validateExperimentModel('light','observing',{kind:'light-sample',version:1}),null);
 const win=new MockWindow(),root=rootForMode('light','observing',win);let seed=4,exposure=100;
 range(root,'exposure','100','10','2000','1',(_,control)=>exposure=Number(control.value));registerExperimentModel(root,{applyState:model=>{seed=model.seed;return true;}});
 win.sessionStorage.setItem('astronomy:experiment:v1:entry-a:light',JSON.stringify({version:1,slug:'light',mode:'observing',values:{exposure:400},choices:{}}));
 assert.equal(await restoreExperiment('light',root),true);assert.equal(exposure,400);assert.equal(seed,4);
});
test('versioned model validation rejects incomplete, mismatched and nonfinite scientific problems',()=>{
 const good=conicRecipe(200,11.014585251781234),base={version:1,slug:'orbits',mode:'orbit',values:{'conic:speed':11.015},choices:{},model:good};
 assert.deepEqual(validateExperimentSnapshot(base,'orbits').model,good);
 for(const change of [{version:2},{kind:'jupiter-mass'},{speed:NaN},{speed:Infinity},{speed:'11'},{speed:17},{height:99},{totalHours:0},{elapsed:-1},{elapsed:86401},{view:'fake'}])assert.equal(validateExperimentSnapshot({...base,model:{...good,...change}},'orbits'),null,JSON.stringify(change));
 const incomplete={...good};delete incomplete.rateHours;assert.equal(validateExperimentSnapshot({...base,model:incomplete},'orbits'),null);
 assert.equal(validateExperimentSnapshot({...base,mode:'transfer'},'orbits'),null);
 const jupiter={version:1,kind:'jupiter-mass',a:463980,period:1.769138,errorA:1,errorP:.1,phase:0};
 for(const change of [{a:0},{period:Infinity},{errorA:-1},{phase:7}])assert.equal(validateExperimentModel('measure','jupiter',{...jupiter,...change}),null);
});
test('invalid scientific records and unavailable owners leave current controls, choices and history intact',async()=>{
 for(const bad of [true,false]){
  const win=new MockWindow(),target=rootForMode('orbits','transfer',win),input=target.add('[data-conic-key="speed"]',{value:'7.79',min:'0',max:'16',step:'.001'}),history=structuredClone(win.history.state);
  const recipe=conicRecipe(200,11.014585251781234);if(bad)recipe.version=999;
  win.sessionStorage.setItem('astronomy:experiment:v1:entry-a:orbits',JSON.stringify({version:1,slug:'orbits',mode:'orbit',values:{'conic:speed':11.015},choices:{},model:recipe}));
  let applications=0;if(bad)registerExperimentModel(target,{applyState:()=>{applications++;}});
  assert.equal(await restoreExperiment('orbits',target),false);assert.equal(input.value,'7.79');assert.equal(currentExperimentMode('orbits',target),'transfer');assert.equal(applications,0);assert.deepEqual(win.history.state,history);
 }
});
test('legacy control-only snapshots retain their rounded physical inputs without inferring presets',async()=>{
 const win=new MockWindow(),target=rootForMode('orbits','orbit',win);let speed=0;
 target.add('[data-conic-key="speed"]',{value:'7.79',min:'0',max:'16',step:'.001',onApply:(_,input)=>speed=Number(input.value)});
 registerExperimentModel(target,{applyState:()=>assert.fail('legacy snapshot has no precise model')});
 win.sessionStorage.setItem('astronomy:experiment:v1:entry-a:orbits',JSON.stringify({version:1,slug:'orbits',mode:'orbit',values:{'conic:speed':11.015},choices:{}}));
 assert.equal(await restoreExperiment('orbits',target),true);assert.equal(speed,11.015);assert.equal(conicState(200,speed).kind,'双曲线');
});
test('model provider disposal and invalid captures cannot overwrite the latest valid history record',()=>{
 const win=new MockWindow(),root=rootForMode('orbits','orbit',win);let model=conicRecipe(200,11.014585251781234);
 const unregister=registerExperimentModel(root,{getState:()=>model});const good=captureExperiment('orbits',root);
 model={...model,speed:NaN};assert.equal(captureExperiment('orbits',root),null);assert.deepEqual(readExperimentSnapshot('orbits','entry-a',win),good);
 unregister();assert.equal(Object.hasOwn(captureExperiment('orbits',root),'model'),false);
});
test('entry creation preserves reading and unrelated history fields',()=>{
 const win=new MockWindow(null);win.history.state={outside:3,astronomy:{reading:{y:42}}};
 assert.equal(ensureExperimentEntry(win),'generated-entry');assert.equal(win.history.state.outside,3);assert.deepEqual(win.history.state.astronomy.reading,{y:42});
 assert.equal(ensureExperimentEntry(win),'generated-entry');
});
test('native values validate options, numeric bounds and real dates',()=>{
 const root=new MockRoot(new MockWindow()),input=range(root,'aperture','130','60','350','10');
 assert.equal(validateControlValue(input,200),200);for(const value of [59,351,NaN,Infinity,'200',{},null])assert.equal(validateControlValue(input,value),undefined);
 const select=root.add('#select',{type:'select',options:['a','b']});assert.equal(validateControlValue(select,'b'),'b');assert.equal(validateControlValue(select,'c'),undefined);
 const check=root.add('#check',{type:'checkbox'});assert.equal(validateControlValue(check,false),false);assert.equal(validateControlValue(check,'false'),undefined);
 const date=root.add('#date',{type:'date',min:'2026-01-01',max:'2026-12-31'});assert.equal(validateControlValue(date,'2026-02-28'),'2026-02-28');for(const value of ['2026-02-30','2025-12-31','2026-99-01','2026-2-28'])assert.equal(validateControlValue(date,value),undefined);
 const number=root.add('#number',{type:'number',min:'0',max:'10',step:'1'});assert.equal(validateControlValue(number,2.5),undefined);number.step='any';assert.equal(validateControlValue(number,2.5),2.5);
});
test('snapshot envelope rejects old structures and prunes unknown controls and actions',()=>{
 const raw={version:EXPERIMENT_STATE_VERSION,slug:'optics',mode:'resolution',values:{aperture:200,play:true,unknown:'x'},choices:{type:'newtonian',delete:'all'}};
 assert.deepEqual(validateExperimentSnapshot(raw,'optics'),{version:1,slug:'optics',mode:'resolution',values:{aperture:200},choices:{type:'newtonian'}});
 for(const change of [{version:0},{slug:'stars'},{mode:'bad'},{values:[]},{choices:null}])assert.equal(validateExperimentSnapshot({...raw,...change},'optics'),null);
 for(const slug of ['unknown','__proto__','constructor','toString']){assert.equal(validateExperimentSnapshot({...raw,slug},slug),null);assert.equal(currentExperimentMode(slug,new MockRoot(new MockWindow())),null);}
});
test('history entries of the same lab remain isolated, including popstate disposal',async()=>{
 const win=new MockWindow('entry-a'),a=rootForMode('optics','resolution',win);range(a,'aperture','200','60','350','10');
 const unbindA=bindExperimentState('optics',a);win.history.state={astronomy:{entryId:'entry-b'}};
 const b=rootForMode('optics','resolution',win);range(b,'aperture','300','60','350','10');bindExperimentState('optics',b);
 // popstate has already moved the global state before the old page disposes.
 win.history.state={astronomy:{entryId:'entry-a'}};unbindA();assert.equal(readExperimentSnapshot('optics','entry-b',win).values.aperture,300);
 const restoredA=rootForMode('optics','imaging',win);range(restoredA,'aperture','130','60','350','10');assert.equal(await restoreExperiment('optics',restoredA),true);assert.equal(currentExperimentMode('optics',restoredA),'resolution');assert.equal(restoredA.querySelector('[data-key="aperture"]').value,'200');
 win.history.state={astronomy:{entryId:'entry-b'}};const restoredB=rootForMode('optics','imaging',win);range(restoredB,'aperture','130','60','350','10');await restoreExperiment('optics',restoredB);assert.equal(restoredB.querySelector('[data-key="aperture"]').value,'300');
});
test('replay uses ordinary control events, correct ordering and the replaced DOM input',async()=>{
 const win=new MockWindow(),original=rootForMode('stars','evolution',win);original.add('[data-key="mass"]',{type:'select',value:'15',options:['1','3','15']});range(original,'index','320','0','500');captureExperiment('stars',original);
 const target=rootForMode('stars','evolution',win),events=[];
 target.add('[data-key="mass"]',{type:'select',value:'1',options:['1','3','15'],onApply:(type,input)=>{events.push([type,'mass',input.value]);range(target,'index','0','0','500','1',(type,input)=>events.push([type,'index',input.value]));}});const detached=range(target,'index','0','0','100');
 await restoreExperiment('stars',target);assert.deepEqual(events,[['input','mass','15'],['input','index','320']]);assert.equal(detached.value,'0');
});
test('mode subchoices restore through explicit buttons without firing every preset',async()=>{
 const win=new MockWindow(),source=rootForMode('sky','calendar',win);source.add('[data-key="calendar"]',{type:'select',value:'gregorian',options:['365','julian','gregorian']});range(source,'years','400','0','800');captureExperiment('sky',source);
 const target=rootForMode('sky','sky',win);target.add('[data-key="calendar"]',{type:'select',value:'365',options:['365','julian','gregorian']});range(target,'years','0','0','800');const preset=target.button('data-calendar-years','100');
 await restoreExperiment('sky',target);assert.equal(currentExperimentMode('sky',target),'calendar');assert.equal(target.querySelector('[data-key="years"]').value,'400');assert.equal(preset.clickCount,0);
});
test('invalid persisted parameters cannot pass native min/max or select options',async()=>{
 const win=new MockWindow(),target=rootForMode('optics','resolution',win);const aperture=range(target,'aperture','130','60','350','10');target.add('[data-key="view"]',{type:'select',value:'camera',options:['camera','eyepiece']});
 win.sessionStorage.setItem('astronomy:experiment:v1:entry-a:optics',JSON.stringify({version:1,slug:'optics',mode:'resolution',values:{aperture:999999,view:'<script>',play:true},choices:{type:'<script>'}}));
 await restoreExperiment('optics',target);assert.equal(aperture.value,'130');assert.equal(target.querySelector('[data-key="view"]').value,'camera');
 win.sessionStorage.setItem('astronomy:experiment:v1:entry-a:optics','broken json');assert.equal(await restoreExperiment('optics',target),false);
});
test('a saved animation restores paused and reset remains an ordinary fresh snapshot',async()=>{
 const win=new MockWindow(),source=rootForMode('alignments','mars',win);range(source,'day','90','-190','190','.1');captureExperiment('alignments',source);
 const target=rootForMode('alignments','mars',win);const day=range(target,'day','0','-190','190','.1');const play=target.add('#alignment-play',{type:'button',attrs:{'aria-pressed':'true'},onApply:(type,input)=>input.setAttribute('aria-pressed','false')});play.textContent='暂停';
 await restoreExperiment('alignments',target);assert.equal(play.getAttribute('aria-pressed'),'false');assert.equal(play.clickCount,1);assert.equal(day.value,'90');
 const dispose=bindExperimentState('alignments',target);day.value='0';target.dispatchEvent(new Event('click'));await Promise.resolve();assert.equal(readExperimentSnapshot('alignments','entry-a',win).values.day,0);dispose();
});
test('航天的解析轨道和分级着陆使用各自的公共控件，不混用旧data-key',async()=>{
 const win=new MockWindow(),source=rootForMode('orbits','orbit',win);source.add('[data-conic-key="height"]',{value:'500',min:'100',max:'5000',step:'10'});source.add('[data-conic-key="speed"]',{value:'8.2',min:'0',max:'16',step:'.001'});source.add('[data-conic-key="totalHours"]',{type:'number',value:'24',min:'.01',max:'876000',step:'any'});source.add('[data-conic-key="progress"]',{value:'.4',min:'0',max:'1',step:'.0001'});captureExperiment('orbits',source);
 const target=rootForMode('orbits','orbit',win),events=[];for(const spec of experimentAdapters.orbits.controls.filter(c=>c.name.startsWith('conic:'))){const previous=source.querySelector(spec.selector);if(previous)target.add(spec.selector,{type:previous.type,value:'0',min:previous.min,max:previous.max,step:previous.step,onApply:(type,input)=>events.push([spec.name,type,input.value])});}
 await restoreExperiment('orbits',target);assert.deepEqual(events,[['conic:height','input','500'],['conic:speed','input','8.2'],['conic:totalHours','input','24'],['conic:progress','input','0.4']]);
 win.history.state={astronomy:{entryId:'entry-landing'}};const landing=rootForMode('orbits','landing',win);landing.add('[data-param="thrust"]',{value:'40',min:'10',max:'55'});landing.add('[data-param="ignitionHeight"]',{value:'80',min:'0',max:'300',step:'.1'});landing.add('[data-time-input]',{value:'3.2',min:'0',max:'10',step:'.001'});captureExperiment('orbits',landing);
 const landed=rootForMode('orbits','orbit',win);for(const selector of ['[data-param="thrust"]','[data-param="ignitionHeight"]','[data-time-input]']){const previous=landing.querySelector(selector);landed.add(selector,{value:'0',min:previous.min,max:previous.max,step:previous.step});}await restoreExperiment('orbits',landed);assert.equal(currentExperimentMode('orbits',landed),'landing');assert.equal(landed.querySelector('[data-time-input]').value,'3.2');
});
test('blocked sessionStorage falls back to current tab memory',async()=>{
 const win=new MockWindow();Object.defineProperty(win,'sessionStorage',{get(){throw Error('blocked');}});const source=rootForMode('optics','resolution',win);range(source,'aperture','250','60','350','10');captureExperiment('optics',source);
 const target=rootForMode('optics','resolution',win);range(target,'aperture','130','60','350','10');assert.equal(await restoreExperiment('optics',target),true);assert.equal(target.querySelector('[data-key="aperture"]').value,'250');
});
test('a quota-failed newer write wins over a readable older storage snapshot',async()=>{
 const win=new MockWindow(),source=rootForMode('optics','resolution',win),aperture=range(source,'aperture','130','60','350','10');captureExperiment('optics',source);
 win.sessionStorage.setItem=()=>{throw Error('QuotaExceededError');};aperture.value='250';captureExperiment('optics',source);
 const target=rootForMode('optics','resolution',win);range(target,'aperture','130','60','350','10');await restoreExperiment('optics',target);assert.equal(target.querySelector('[data-key="aperture"]').value,'250');
});
test('legacy initialization uses public ready state and ordinary ID controls',async()=>{
 const win=new MockWindow();win.location.href='http://localhost/labs/solar-system/?mode=compare';Object.defineProperty(win,'solarApp',{get(){throw Error('debug access is forbidden');}});
 const source=rootForMode('solar-system','compare',win);source.add('#comparison-metric',{type:'select',value:'mass',options:['radius','mass','density']});source.add('#comparison-scale',{type:'select',value:'log',options:['linear','log']});source.add('#planet-buttons button',{type:'button'});captureExperiment('solar-system',source);
 const target=rootForMode('solar-system','explore',win);target.add('#planet-buttons button',{type:'button'});target.add('#comparison-metric',{type:'select',value:'radius',options:['radius','mass','density']});const events=[];target.add('#comparison-scale',{type:'select',value:'linear',options:['linear','log'],onApply:type=>events.push(type)});
 const dispose=await initializeLegacyExperiment('solar-system',target);assert.equal(currentExperimentMode('solar-system',target),'compare');assert.equal(target.querySelector('#comparison-scale').value,'log');assert.deepEqual(events,['change']);assert.equal(target.dataset.experimentStateReady,'true');dispose();
});
test('legacy loading wait cancels cleanly',async()=>{
 const win=new MockWindow(),root=rootForMode('earth-moon','phase',win);root.add('#loading',{type:'button'}).hidden=false;const abort=new AbortController();const pending=waitForLegacyControls('earth-moon',root,{window:win,signal:abort.signal});abort.abort();assert.equal(await pending,false);
});
test('segment navigation prefers the actual article origin and preserves classic UI',async()=>{
 const previousDocument=globalThis.document,previousLocation=globalThis.location;
 globalThis.document={addEventListener(){},body:{classList:{contains:()=>false}},getElementById:()=>({})};globalThis.location={href:'http://localhost/lab/sky',pathname:'/lab/sky',search:''};
 try{
  const {experimentReadingPaths,navigationURL}=await import('../web/observatory/compat/reading-navigation.js');
  const {pathsForExperiment,readingURL}=await import('../web/observatory/shared/learning-paths.js');
  const origin=pathsForExperiment('sky','stars')[0];const paths=experimentReadingPaths('sky','day','http://localhost/lab/sky?mode=day&from='+origin.id);assert.equal(paths[0].id,origin.id);assert.equal(paths[1].mode,'day');
  const classic=navigationURL(readingURL(origin),'http://localhost/labs/earth-moon/?ui=classic');assert.ok(classic.includes('?ui=classic#'));assert.equal(navigationURL('/read/03#section','http://localhost/labs/earth-moon/'),'/read/03#section');
  assert.equal(navigationURL('https://example.com/path','http://localhost/labs/earth-moon/?ui=classic'),'https://example.com/path');
 }finally{if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;if(previousLocation===undefined)delete globalThis.location;else globalThis.location=previousLocation;}
});
test('repeated legacy state announcements preserve the current return anchor DOM',async()=>{
 const previousDocument=globalThis.document,previousLocation=globalThis.location;
 globalThis.document={addEventListener(){},body:{classList:{contains:()=>false}},getElementById:()=>({})};globalThis.location={href:'http://localhost/lab/sky',pathname:'/lab/sky',search:''};
 try{
  const {updateExperimentReadingLinks}=await import('../web/observatory/compat/reading-navigation.js');
  const host={children:[],querySelector(selector){const key=selector==='[data-segment-links]'?'segmentLinks':'fullArticleLinks';return this.children.find(node=>Object.hasOwn(node.dataset,key))??null;},prepend(node){this.children.unshift(node);},append(node){this.children.push(node);}};
  let created=0;globalThis.document={body:{classList:{contains:name=>name==='integrated-legacy'}},querySelector:()=>host,createElement(){created++;return{dataset:{},setAttribute(){},remove(){host.children.splice(host.children.indexOf(this),1);}};}};
  globalThis.location={href:'http://localhost/labs/earth-moon/?mode=period',pathname:'/labs/earth-moon/',search:'?mode=period'};
  updateExperimentReadingLinks('earth-moon','period');const original=host.querySelector('[data-segment-links]'),markup=original.innerHTML;assert.equal(created,2);
  updateExperimentReadingLinks('earth-moon','period');assert.equal(host.querySelector('[data-segment-links]'),original);assert.equal(original.innerHTML,markup);assert.equal(created,2);
  updateExperimentReadingLinks('earth-moon','spin');assert.notEqual(host.querySelector('[data-segment-links]'),original);assert.equal(created,3);
 }finally{if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;if(previousLocation===undefined)delete globalThis.location;else globalThis.location=previousLocation;}
});
