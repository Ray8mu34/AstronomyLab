// Pure DOM helpers. No scene, WebGL, content catalogue, or course dependency.
export const assetURL=p=>'/'+p.replace(/^\/+/, '');
// Programmatic actions use the same visible values as the native controls.
// The physical state remains unrounded; range values follow their input step.
export function syncControls(el,state){for(const input of el.querySelectorAll('[data-key]')){const key=input.dataset.key;if(!(key in state))continue;if(input.type==='checkbox')input.checked=Boolean(state[key]);else input.value=state[key];for(const out of el.querySelectorAll(`[data-value="${key}"]`))out.textContent=input.type==='checkbox'?String(state[key]):input.value;}}
export function bindControls(el,state,onChange){const handlers=[];for(const input of el.querySelectorAll('[data-key]')){const key=input.dataset.key;input.type==='checkbox'?input.checked=Boolean(state[key]):input.value=state[key];const handle=()=>{state[key]=input.type==='checkbox'?input.checked:input.type==='range'||input.type==='number'?Number(input.value):input.value;for(const out of el.querySelectorAll(`[data-value="${key}"]`))out.textContent=state[key];onChange(key,state[key]);};input.addEventListener('input',handle);handlers.push(()=>input.removeEventListener('input',handle));}return()=>handlers.forEach(f=>f());}
// Existing mixed tools also animate genuine 2D branches. Their clock must not
// be owned by a hidden WebGL renderer. The same bounded visible-time delta is
// retained; visibility changes do not advance the scientific state.
export function startVisibleLoop(callback,{window=globalThis.window,document=window?.document}={}){
 let active=true,last=0,total=0,frame;
 const visibility=()=>{last=0;};document.addEventListener('visibilitychange',visibility);
 const step=time=>{if(!active)return;if(!document.hidden){const dt=last?Math.min(.08,(time-last)/1000):0;last=time;total+=dt;callback(dt,total);}else last=0;frame=window.requestAnimationFrame(step);};
 frame=window.requestAnimationFrame(step);
 return()=>{active=false;window.cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',visibility);};
}
