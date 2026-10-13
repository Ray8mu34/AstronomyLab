import {confirmedModes} from './tool-registry.js';
// Frozen modules retain their own controls and model state. Route entry uses
// the same public buttons as a learner; it never assigns scientific state.
const recipes={
 sky:{sky:['[data-tab="sky"]'],stars:['[data-tab="stars"]'],measure:['[data-tab="measure"]','[data-measure-task="shadow"]'],calendar:['[data-tab="measure"]','[data-measure-task="calendar"]'],day:['[data-tab="day"]'],precession:['[data-tab="precession"]']},
 imaging:{real:['[data-dataset="real"]'],teaching:['[data-dataset="teaching"]']},
 galaxy:{galaxy:['[data-topic="galaxy"]'],cmb:['[data-topic="cmb"]','[data-cmb-view="map"]'],'cmb-spectrum':['[data-topic="cmb"]','[data-cmb-view="spectrum"]']},
 orbits:Object.fromEntries(['orbit','transfer','staging','landing'].map(mode=>[mode,[`[data-mode="${mode}"]`]])),
 measure:Object.fromEntries(['shadow','jupiter','s2','distance'].map(mode=>[mode,[`[data-mode="${mode}"]`]])),
 light:Object.fromEntries(['thermal','motion','magnitude','observing'].map(mode=>[mode,[`[data-mode="${mode}"]`]])),
 stars:Object.fromEntries(['hr','evolution','pulsar','collapse','ia'].map(mode=>[mode,[`[data-mode="${mode}"]`]])),
};
export function enterMode(slug,mode,host){
 const steps=recipes[slug]?.[mode];
 if(!steps)return;
 for(const selector of steps){
  const button=host.querySelector(selector);
  if(!button)throw Error('工具模式入口未匹配：'+slug+'/'+mode);
  button.click();
 }
}
export function enterLegacyMode(){
 if(location.pathname!=='/labs/solar-system/')return;
 const mode=new URLSearchParams(location.search).get('mode');
 if(!confirmedModes['solar-system'].includes(mode))return;
 const start=performance.now();let frame;
 const enter=()=>{
  const button=document.querySelector(`[data-mode="${mode}"]`);
  if(window.solarApp?.ready&&button&&!button.disabled){button.click();return;}
  if(performance.now()-start<30000)frame=requestAnimationFrame(enter);
 };
 frame=requestAnimationFrame(enter);
 window.addEventListener('pagehide',()=>cancelAnimationFrame(frame),{once:true});
}
