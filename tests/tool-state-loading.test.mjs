import test from 'node:test';
import assert from 'node:assert/strict';
import {captureExperiment,restoreExperiment,currentExperimentMode} from '../web/observatory/shared/experiment-state.js';

function setup(){
 const data=new Map(),win={setTimeout,Event,history:{state:{astronomy:{entryId:'lazy-entry'}}},sessionStorage:{getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)}};
 class Custom extends Event{constructor(type,options){super(type,options);this.detail=options.detail;}}
 win.CustomEvent=Custom;
 const root=new EventTarget();root.ownerDocument={defaultView:win};root.dataset={};root.mode='pulsar';root.controls=new Map();
 const button=mode=>({getAttribute:key=>key==='data-mode'?mode:key==='aria-pressed'?String(root.mode===mode):null,classList:{contains:()=>false},click(){root.mode=mode;}});
 const buttons=['hr','evolution','pulsar','collapse','ia'].map(button);
 root.querySelectorAll=selector=>selector==='button[data-mode]'?buttons:[];
 root.querySelector=selector=>buttons.find(b=>selector===`button[data-mode="${b.getAttribute('data-mode')}"]`)||root.controls.get(selector)||null;
 const control=new EventTarget();Object.assign(control,{type:'range',tagName:'INPUT',min:'0',max:'90',step:'1',value:'70',disabled:false});root.controls.set('[data-key="alpha"]',control);
 captureExperiment('stars',root,{window:win});root.mode='hr';root.controls.clear();
 return {root,win,control,buttons};
}
test('history replay waits for the requested real mode before applying its controls',async()=>{
 const {root,win,control,buttons}=setup();let writes=0;control.addEventListener('input',()=>writes++);
 buttons.find(b=>b.getAttribute('data-mode')==='pulsar').click=()=>{root.dataset.modeLoading='pulsar';win.setTimeout(()=>{root.mode='pulsar';control.value='45';root.controls.set('[data-key="alpha"]',control);delete root.dataset.modeLoading;},10);};
 assert.equal(await restoreExperiment('stars',root,{window:win}),true);
 assert.equal(currentExperimentMode('stars',root),'pulsar');assert.equal(control.value,'70');assert.equal(writes,1);
});
test('a failed lazy branch does not replay its saved inputs into the previous mode',async()=>{
 const {root,win,control,buttons}=setup();let writes=0;control.addEventListener('input',()=>writes++);root.controls.set('[data-key="alpha"]',control);
 buttons.find(b=>b.getAttribute('data-mode')==='pulsar').click=()=>{root.dataset.modeLoading='pulsar';win.setTimeout(()=>delete root.dataset.modeLoading,10);};
 assert.equal(await restoreExperiment('stars',root,{window:win}),false);assert.equal(root.mode,'hr');assert.equal(writes,0);
});
test('cancelling a pending mode restore leaves current controls alone',async()=>{
 const {root,win,buttons}=setup(),abort=new AbortController();
 buttons.find(b=>b.getAttribute('data-mode')==='pulsar').click=()=>{root.dataset.modeLoading='pulsar';abort.abort();};
 assert.equal(await restoreExperiment('stars',root,{window:win,signal:abort.signal}),false);assert.equal(root.mode,'hr');
});
