import test from 'node:test';
import assert from 'node:assert/strict';
import {confirmedModes} from '../web/observatory/shared/course-map.js';
import {experimentAdapters,EXPERIMENT_STATE_VERSION,ensureExperimentEntry,validateControlValue,validateExperimentSnapshot,currentExperimentMode,captureExperiment,restoreExperiment,bindExperimentState,readExperimentSnapshot,initializeLegacyExperiment,waitForLegacyControls} from '../web/observatory/shared/experiment-state.js';

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
function rootForMode(slug,mode,win=new MockWindow()){
 const root=new MockRoot(win),attribute=experimentAdapters[slug].mode.attribute;
 const modes=slug==='sky'?confirmedModes.sky.filter(mode=>mode!=='calendar'):slug==='galaxy'?['galaxy','cmb']:confirmedModes[slug];
 const base=slug==='sky'&&mode==='calendar'?'measure':slug==='galaxy'&&mode.startsWith('cmb')?'cmb':mode;
 modes.forEach(value=>root.button(attribute,value,value===base));
 if(slug==='sky'){root.button('data-measure-task','shadow',mode==='measure');root.button('data-measure-task','calendar',mode==='calendar');}
 if(slug==='galaxy'){root.button('data-cmb-view','map',mode==='cmb');root.button('data-cmb-view','spectrum',mode==='cmb-spectrum');}
 return root;
}

test('all eleven experiments and 43 modes have explicit public-control adapters',()=>{
 assert.deepEqual(Object.keys(experimentAdapters).sort(),Object.keys(confirmedModes).sort());
 let count=0;for(const [slug,modes]of Object.entries(confirmedModes)){for(const mode of modes){assert.equal(currentExperimentMode(slug,rootForMode(slug,mode)),mode);count++;}const names=experimentAdapters[slug].controls.map(c=>c.name);assert.equal(new Set(names).size,names.length,slug);}
 assert.equal(count,43);
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
  const {experimentReadingPaths,navigationURL}=await import('../web/observatory/shared/navigation.js');
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
  const {updateExperimentReadingLinks}=await import('../web/observatory/shared/navigation.js');
  const host={children:[],querySelector(selector){const key=selector==='[data-segment-links]'?'segmentLinks':'fullArticleLinks';return this.children.find(node=>Object.hasOwn(node.dataset,key))??null;},prepend(node){this.children.unshift(node);},append(node){this.children.push(node);}};
  let created=0;globalThis.document={body:{classList:{contains:name=>name==='integrated-legacy'}},querySelector:()=>host,createElement(){created++;return{dataset:{},setAttribute(){},remove(){host.children.splice(host.children.indexOf(this),1);}};}};
  globalThis.location={href:'http://localhost/labs/earth-moon/?mode=period',pathname:'/labs/earth-moon/',search:'?mode=period'};
  updateExperimentReadingLinks('earth-moon','period');const original=host.querySelector('[data-segment-links]'),markup=original.innerHTML;assert.equal(created,2);
  updateExperimentReadingLinks('earth-moon','period');assert.equal(host.querySelector('[data-segment-links]'),original);assert.equal(original.innerHTML,markup);assert.equal(created,2);
  updateExperimentReadingLinks('earth-moon','spin');assert.notEqual(host.querySelector('[data-segment-links]'),original);assert.equal(created,3);
 }finally{if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;if(previousLocation===undefined)delete globalThis.location;else globalThis.location=previousLocation;}
});
