import {confirmedModes} from './tool-registry.js';

// Tab-session snapshots belong to a history entry, never to a lab-wide last value.
// Only the controls listed here are replayed, using the same events as the UI.
export const EXPERIMENT_STATE_VERSION=1;
const prefix='astronomy:experiment:v1:';
const contexts=new WeakMap(), memory=new WeakMap();
const models=new WeakMap();
// Modules own scientific values; native controls only own user step rounding.
// This registry shares the existing history lifecycle, with no second store.
export function registerExperimentModel(root,api){
 models.set(root,api);return()=>{if(models.get(root)===api)models.delete(root);};
}
const keys=(names)=>names.split(' ').filter(Boolean).map(name=>({name,selector:`[data-key="${name}"]`,event:'input'}));
const extra=(name,selector,event='input')=>({name,selector,event});
const choice=(name,attribute,values,stage='after')=>({name,attribute,values:values.split(' '),stage});
const modeChoice=attribute=>({attribute});
export const experimentAdapters={
 'solar-system':{mode:modeChoice('data-mode'),controls:[extra('date','#date','change'),extra('speed','#speed','change'),extra('metric','#comparison-metric','change'),extra('scale','#comparison-scale','change'),extra('orbits','#orbits-toggle','change'),extra('belts','#belts-toggle','change')],choices:[choice('body','data-body','sun mercury venus earth mars jupiter saturn uranus neptune'),choice('topic','data-topic','asteroids kuiper'),choice('tab','data-tab','overview deep data')],pause:[{selector:'#play'}]},
 'earth-moon':{mode:modeChoice('data-mode'),controls:[extra('inclination','#inclination'),extra('node','#node'),extra('distance','#distance'),extra('east','#east'),extra('north','#north'),extra('libration','#libration','change'),extra('red','#red','change'),extra('speed','#speed','change'),extra('day','#day')],choices:[choice('spin','data-spin','sync fixed'),{name:'trueScale',selector:'#scale',toggle:true},{name:'observe',selector:'#observe-toggle',values:['moon','sun'],read:root=>root.querySelector('#solar-disc')?.hidden===false?'sun':'moon',toggle:true}],pause:[{selector:'#play'}]},
 alignments:{mode:modeChoice('data-mode'),controls:keys('inclination node day radius impact position'),choices:[],pause:[{selector:'#alignment-play'}]},
 sky:{mode:modeChoice('data-tab'),controls:keys('group selected starsProgress shadowDay shadowDate latitude longitude obliquity view look lookAltitude equator ecliptic lunar galactic starDec extinction blend offset errors baseline motion height calendar spinMode speed years dayHours hour precessionYears'),choices:[choice('shadowCycle','data-shadow-cycle','day year','before'),choice('motionView','data-motion-view','oblique pole close')],pause:[{selector:'[data-action="play"]'}]},
 optics:{mode:modeChoice('data-task'),controls:keys('aperture focal eyepiece focus wavelength seeing pixel sensor separation view'),choices:[choice('type','data-type','refractor newtonian sct','before')],pause:[{selector:'[data-ray-pause]',inverted:true}]},
 light:{mode:modeChoice('data-mode'),controls:keys('temperature radius normalize references vr veq inclination epsilon resolution distance extinction dustPower exposure background height k signal frames read'),choices:[],pause:[]},
 imaging:{mode:modeChoice('data-dataset'),controls:[...keys('channel mapping method white exposure strength black gainS gainH gainO dx dy registered background read frames saturation noise subtract plate seed'),extra('pixelX','[data-pixel-axis="x"]'),extra('pixelY','[data-pixel-axis="y"]')],choices:[],pause:[]},
 stars:{mode:modeChoice('data-mode'),controls:keys('mass index hrExample alpha zeta width period bhMass rsMultiple successful iaSample iaCorrection phase progress'),choices:[choice('collapseTask','data-collapse-task','collapse tidal','before'),choice('hrCompare','data-hr-compare','none temperature luminosity'),choice('view','data-view','scene chart')],pause:[{selector:'[data-play]'}]},
 galaxy:{mode:modeChoice('data-topic'),controls:keys('longitude latitude dust height disk bar bulge halo darkhalo delta frequency'),choices:[choice('view','data-view','outside edge inside rise','before'),choice('wave','data-wave','visible infrared','before')],pause:[]},
 orbits:{mode:modeChoice('data-mode'),controls:[...keys('height speed target secondBurn reserve payload prop1 dry1 prop2 ve twr landingHeight fallSpeed progress'),...['height','speed','totalHours','rateHours','progress'].map(name=>extra('conic:'+name,`[data-conic-key="${name}"]`)),...['payload','isp','dry1','thrust','fuel','fallSpeed','ignitionHeight'].map(name=>extra('param:'+name,`[data-param="${name}"]`)),extra('processSpeed','[data-speed]','change'),extra('processTime','[data-time-input]')],choices:[choice('conicView','data-conic-view','whole near')],pause:[{selector:'#orbit-play'},{selector:'[data-conic-action="play"]'},{selector:'.ls-transport [data-action="play"]'}]},
 measure:{mode:modeChoice('data-mode'),controls:keys('length alpha sigmaLength sigmaAlpha a period errorA errorP theta distance s2Period errorTheta errorDistance errorS2P p factor errorParallax apparent absolute extinction errorModulus'),choices:[],pause:[{selector:'#measure-play'}]},
};

const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
export function validateExperimentModel(slug,mode,value){
 if(!record(value)||value.version!==1)return null;
 let bounds;
 if(slug==='orbits'&&mode==='orbit'&&value.kind==='orbit-conics'){
  bounds={height:[100,5000],speed:[0,16],totalHours:[.01,876000],rateHours:[.00001,1000000],elapsed:[0,876000*3600]};
  if(!['whole','near'].includes(value.view)||value.elapsed>value.totalHours*3600)return null;
 }else if(slug==='measure'&&mode==='jupiter'&&value.kind==='jupiter-mass')bounds={a:[300000,550000],period:[1.3,2.5],errorA:[0,5],errorP:[0,2],phase:[0,2*Math.PI]};
 else if(slug==='galaxy'&&confirmedModes.galaxy.includes(mode)&&value.kind==='galactic-direction')bounds={longitude:[-180,180],latitude:[-90,90]};
 else if(slug==='light'&&mode==='observing'&&value.kind==='light-sample'){
  if(!Number.isInteger(value.seed))return null;
  bounds={seed:[0,0xffffffff]};
 }
 else if(slug==='alignments'&&confirmedModes.alignments.includes(mode)&&value.kind==='planet-alignments'){
  if(value.mode!==mode)return null;
  bounds={day:mode==='mars'?[-190,190]:[0,583.9236487922877]};
 }
 else if(slug==='sky'&&confirmedModes.sky.includes(mode)&&value.kind==='sky-conditions'){
  if(value.mode!==mode)return null;
  bounds={obliquity:[0,45]};
 }
 else return null;
 const result={version:1,kind:value.kind};
 for(const [key,[min,max]]of Object.entries(bounds)){
  if(typeof value[key]!=='number'||!Number.isFinite(value[key])||value[key]<min||value[key]>max)return null;
  result[key]=value[key];
 }
 if(value.kind==='orbit-conics')result.view=value.view;
 if(['planet-alignments','sky-conditions'].includes(value.kind))result.mode=mode;
 return result;
}
const modelControls={
 'orbit-conics':new Set(['conic:height','conic:speed','conic:totalHours','conic:rateHours','conic:progress']),
 'jupiter-mass':new Set(['a','period','errorA','errorP']),
 'galactic-direction':new Set(['longitude','latitude']),
 'light-sample':new Set(),
 'planet-alignments':new Set(['day']),
 'sky-conditions':new Set(['obliquity']),
};
const adapterFor=slug=>own(experimentAdapters,slug)?experimentAdapters[slug]:null;
const entryValid=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(value);
const windowOf=(root,options={})=>options.window||root?.ownerDocument?.defaultView||globalThis.window;
const storageOf=win=>{try{return win.sessionStorage;}catch{return null;}};
function memoryOf(win){if(!memory.has(win))memory.set(win,new Map());return memory.get(win);}
export function ensureExperimentEntry(win=globalThis.window){
 if(!win?.history)return null;
 const old=record(win.history.state)?win.history.state:{},astronomy=record(old.astronomy)?old.astronomy:{};
 if(entryValid(astronomy.entryId))return astronomy.entryId;
 const entryId=win.crypto?.randomUUID?.()||`e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
 win.history.replaceState({...old,astronomy:{...astronomy,entryId}},'',win.location.href);
 return entryId;
}
function snapshotKey(slug,entryId){return entryValid(entryId)&&adapterFor(slug)?prefix+entryId+':'+slug:null;}

// Runtime bounds/options come from the native control after its mode has mounted.
// Selects with dependent options (star catalogue, track length) are checked then.
export function validateControlValue(control,value){
 if(!control||control.disabled)return undefined;
 if(control.type==='checkbox')return typeof value==='boolean'?value:undefined;
 if(control.tagName==='SELECT')return typeof value==='string'&&[...control.options].some(option=>!option.disabled&&option.value===value)?value:undefined;
 if(control.type==='date'){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return undefined;
  const parsed=new Date(value+'T00:00:00Z');
  if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==value)return undefined;
  return (!control.min||value>=control.min)&&(!control.max||value<=control.max)?value:undefined;
 }
 if(!['range','number'].includes(control.type)||typeof value!=='number'||!Number.isFinite(value))return undefined;
 const min=control.min===''?-Infinity:Number(control.min),max=control.max===''?Infinity:Number(control.max);
 if(!Number.isFinite(min)&&min!==-Infinity||!Number.isFinite(max)&&max!==Infinity||value<min||value>max)return undefined;
 // Number fields accept any only where their existing controls explicitly do.
 // Range controls may display a rounded mathematical preset; the browser owns
 // their step rounding, and the replay always reads its resulting value back.
 if(control.type==='number'&&control.step!=='any'){
  const step=Number(control.step||1),base=Number.isFinite(min)?min:0;
  if(!Number.isFinite(step)||step<=0||Math.abs((value-base)/step-Math.round((value-base)/step))>1e-7)return undefined;
 }
 return value;
}
export function validateExperimentSnapshot(value,slug){
 if(!record(value)||value.version!==EXPERIMENT_STATE_VERSION||value.slug!==slug||!adapterFor(slug)||!confirmedModes[slug].includes(value.mode)||!record(value.values)||!record(value.choices))return null;
 const adapter=adapterFor(slug),values={},choices={};
 for(const spec of adapter.controls){if(own(value.values,spec.name)){const item=value.values[spec.name];if(typeof item==='boolean'||typeof item==='string'&&item.length<=128||typeof item==='number'&&Number.isFinite(item))values[spec.name]=item;}}
 for(const spec of adapter.choices){const item=value.choices[spec.name];if(spec.toggle&&!spec.values?typeof item==='boolean':spec.values.includes(item))choices[spec.name]=item;}
 const snapshot={version:EXPERIMENT_STATE_VERSION,slug,mode:value.mode,values,choices};
 // Old snapshots contain only quantized control values. Replay those values
 // honestly; never infer which mathematical preset might have produced them.
 if(own(value,'model')){const model=validateExperimentModel(slug,value.mode,value.model);if(!model)return null;snapshot.model=model;}
 return snapshot;
}
export function readExperimentSnapshot(slug,entryId,win=globalThis.window){
 const key=snapshotKey(slug,entryId);if(!key||!win)return null;
 // A failed write can leave an older storage record readable. The current
 // document's latest capture must win even when quota/privacy blocks writes.
 const current=memoryOf(win);if(current.has(key))return validateExperimentSnapshot(current.get(key),slug);
 let raw;try{raw=storageOf(win)?.getItem(key);}catch{}
 if(raw!==null&&raw!==undefined){if(raw.length>65536)return null;try{return validateExperimentSnapshot(JSON.parse(raw),slug);}catch{return null;}}
 return null;
}
function writeSnapshot(snapshot,entryId,win){
 const key=snapshotKey(snapshot.slug,entryId);if(!key)return;
 memoryOf(win).set(key,snapshot);try{storageOf(win)?.setItem(key,JSON.stringify(snapshot));}catch{}
}
function selected(root,attribute){return [...root.querySelectorAll(`button[${attribute}]`)].find(button=>button.getAttribute('aria-pressed')==='true'||button.getAttribute('aria-selected')==='true'||button.classList.contains('active'));}
export function currentExperimentMode(slug,root){
 const adapter=adapterFor(slug);if(!adapter)return null;
 let mode=selected(root,adapter.mode.attribute)?.getAttribute(adapter.mode.attribute);
 if(slug==='sky'&&mode==='measure'&&selected(root,'data-measure-task')?.getAttribute('data-measure-task')==='calendar')mode='calendar';
 if(slug==='galaxy'&&mode==='cmb'&&selected(root,'data-cmb-view')?.getAttribute('data-cmb-view')==='spectrum')mode='cmb-spectrum';
 return confirmedModes[slug].includes(mode)?mode:null;
}
function readChoice(spec,root){
 if(spec.read)return spec.read(root);
 if(spec.toggle)return root.querySelector(spec.selector)?.getAttribute('aria-pressed')==='true';
 return selected(root,spec.attribute)?.getAttribute(spec.attribute);
}
export function captureExperiment(slug,root,options={}){
 const adapter=adapterFor(slug),win=windowOf(root,options);if(!adapter||!root||!win)return null;
 const context=contexts.get(root),entryId=options.entryId||context?.entryId||ensureExperimentEntry(win),mode=currentExperimentMode(slug,root);
 if(!entryId||!mode)return null;
 const values={},choices={};
 for(const spec of adapter.controls){const input=root.querySelector(spec.selector);if(!input)continue;const value=input.type==='checkbox'?input.checked:input.tagName==='SELECT'||input.type==='date'?input.value:input.value===''?undefined:Number(input.value);const valid=validateControlValue(input,value);if(valid!==undefined)values[spec.name]=valid;}
 for(const spec of adapter.choices){const value=readChoice(spec,root);if(spec.toggle&&!spec.values?typeof value==='boolean':spec.values.includes(value))choices[spec.name]=value;}
 const snapshot={version:EXPERIMENT_STATE_VERSION,slug,mode,values,choices};
 const candidate=models.get(root)?.getState(mode);
 if(candidate!==null&&candidate!==undefined){const model=validateExperimentModel(slug,mode,candidate);if(!model)return null;snapshot.model=model;}
 writeSnapshot(snapshot,entryId,win);return snapshot;
}
function clickChoice(spec,value,root){
 if(spec.toggle){const button=root.querySelector(spec.selector);if(button&&!button.disabled&&readChoice(spec,root)!==value)button.click();return;}
 if(!spec.values.includes(value))return;
 const button=root.querySelector(`button[${spec.attribute}="${value}"]`);if(button&&!button.disabled&&selected(root,spec.attribute)!==button)button.click();
}
function clickMode(slug,mode,root){
 if(!adapterFor(slug)||!confirmedModes[slug].includes(mode)||currentExperimentMode(slug,root)===mode)return;
 const click=(attribute,value)=>{const button=root.querySelector(`button[${attribute}="${value}"]`);if(button&&!button.disabled)button.click();};
 if(slug==='sky'){click('data-tab',mode==='calendar'?'measure':mode);if(['calendar','measure'].includes(mode))click('data-measure-task',mode==='calendar'?'calendar':'shadow');}
 else if(slug==='galaxy'){click('data-topic',mode.startsWith('cmb')?'cmb':mode);if(mode.startsWith('cmb'))click('data-cmb-view',mode==='cmb-spectrum'?'spectrum':'map');}
 else click(experimentAdapters[slug].mode.attribute,mode);
}
function pauseExperiment(slug,root){
 for(const spec of experimentAdapters[slug].pause){const button=root.querySelector(spec.selector);if(!button||button.disabled)continue;const pressed=button.getAttribute('aria-pressed'),isRunning=spec.inverted?pressed==='false':pressed!==null?pressed==='true':/^(?:Ⅱ|暂停)/.test(button.textContent.trim());if(isRunning)button.click();}
}
function announce(slug,root,win){const detail={slug,mode:currentExperimentMode(slug,root)};const EventClass=win.CustomEvent||globalThis.CustomEvent;if(EventClass)root.dispatchEvent(new EventClass('experimentstatechange',{bubbles:true,detail}));}
export async function restoreExperiment(slug,root,options={}){
 const adapter=adapterFor(slug),win=windowOf(root,options);if(!adapter||!root||!win)return false;
 const entryId=options.entryId||ensureExperimentEntry(win);contexts.set(root,{entryId,win});
 const snapshot=readExperimentSnapshot(slug,entryId,win);
 if(!snapshot){announce(slug,root,win);return false;}
 // Refuse a scientific snapshot before changing the current experiment when
 // its owning module is unavailable; a DOM fallback would change its problem.
 const model=models.get(root);if(snapshot.model&&!model?.applyState)return false;
 // The saved mode wins only within this exact history entry. A fresh route has
 // a new ID and therefore starts in the mode requested by its ordinary URL.
 clickMode(slug,snapshot.mode,root);
 // Real spatial branches may be loaded only when first selected. Wait for
 // their public mode selection before replaying controls; never write saved
 // parameters into the previous mode's DOM. A failure removes modeLoading.
 if(root.dataset.modeLoading===snapshot.mode){
  const started=Date.now();
  while(root.dataset.modeLoading===snapshot.mode&&currentExperimentMode(slug,root)!==snapshot.mode){
   if(options.signal?.aborted||Date.now()-started>30000)return false;
   await new Promise(resolve=>win.setTimeout(resolve,25));
  }
 }
 pauseExperiment(slug,root);
 if(currentExperimentMode(slug,root)!==snapshot.mode)return false;
 for(const spec of adapter.choices.filter(spec=>spec.stage==='before'))if(own(snapshot.choices,spec.name))clickChoice(spec,snapshot.choices[spec.name],root);
 for(const spec of adapter.controls){
  if(snapshot.model&&modelControls[snapshot.model.kind].has(spec.name))continue;
  if(!own(snapshot.values,spec.name))continue;
  // Query again after every event: mass/catalogue/parameter changes can rebuild
  // controls and their ranges; no detached input receives a later replay.
  const input=root.querySelector(spec.selector),value=validateControlValue(input,snapshot.values[spec.name]);if(value===undefined)continue;
  if(input.type==='checkbox')input.checked=value;else input.value=String(value);
  const EventClass=win.Event||globalThis.Event;input.dispatchEvent(new EventClass(spec.event,{bubbles:true}));
 }
 for(const spec of adapter.choices.filter(spec=>spec.stage!=='before'))if(own(snapshot.choices,spec.name))clickChoice(spec,snapshot.choices[spec.name],root);
 if(snapshot.model&&model.applyState(snapshot.model)===false)return false;
 pauseExperiment(slug,root);announce(slug,root,win);return true;
}
export function bindExperimentState(slug,root,options={}){
 const win=windowOf(root,options);if(!adapterFor(slug)||!root||!win)return()=>{};
 const entryId=options.entryId||contexts.get(root)?.entryId||ensureExperimentEntry(win);contexts.set(root,{entryId,win});
 let active=true,queued=false;
 const capture=()=>{queued=false;if(!active)return;captureExperiment(slug,root,{window:win,entryId});options.onModeChange?.(currentExperimentMode(slug,root));announce(slug,root,win);};
 const schedule=()=>{if(!queued){queued=true;queueMicrotask(capture);}};
 const pagehide=()=>{if(active)captureExperiment(slug,root,{window:win,entryId});};
 for(const type of ['input','change','click','pointerup','keydown'])root.addEventListener(type,schedule);
 win.addEventListener('pagehide',pagehide);root.dataset.experimentStateReady='true';capture();
 return()=>{pagehide();active=false;delete root.dataset.experimentStateReady;for(const type of ['input','change','click','pointerup','keydown'])root.removeEventListener(type,schedule);win.removeEventListener('pagehide',pagehide);};
}

// Legacy pages initialize asynchronously. Read public loading/disabled state,
// never model/debug globals, before replaying their ordinary controls.
export function waitForLegacyControls(slug,root,{window:win=globalThis.window,signal,timeout=30000}={}){
 return new Promise(resolve=>{const started=Date.now();let timer;
  const finish=value=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);resolve(value);};
  const abort=()=>finish(false);
  const check=()=>{if(signal?.aborted){finish(false);return;}const button=root.querySelector('button[data-mode]'),ready=slug==='solar-system'?button&&!button.disabled&&root.querySelector('#planet-buttons button'):button&&root.querySelector('#loading')?.hidden;
   if(ready){finish(true);return;}if(Date.now()-started>=timeout){finish(false);return;}timer=win.setTimeout(check,100);};
  signal?.addEventListener('abort',abort,{once:true});check();
 });
}
export async function initializeLegacyExperiment(slug,root,options={}){
 if(!['solar-system','earth-moon'].includes(slug))return()=>{};
 const win=windowOf(root,options),entryId=ensureExperimentEntry(win);
 if(!await waitForLegacyControls(slug,root,{...options,window:win})||options.signal?.aborted)return()=>{};
 const requested=new URL(win.location.href).searchParams.get('mode');
 if(!readExperimentSnapshot(slug,entryId,win)&&confirmedModes[slug]?.includes(requested))clickMode(slug,requested,root);
 await restoreExperiment(slug,root,{...options,window:win,entryId});
 return bindExperimentState(slug,root,{...options,window:win,entryId});
}
