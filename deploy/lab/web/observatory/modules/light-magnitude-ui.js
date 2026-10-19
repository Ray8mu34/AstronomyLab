import {applyPresentation,bindDisclosures} from '../shared/presentation.js';
import {mountWorkspaceNavigation} from '../shared/navigation.js';
// Presentation of the existing two teaching bands; all science remains in light.js.
export function attachMagnitudeUI(root,{redraw}){
 const q=s=>root.querySelector(s),slots=new Map();let disposeSurface=null,disposeNavigation=null,disposeDisclosures=null;let active=false,ready=false,disposed=false;
 const link=document.createElement('link');link.rel='stylesheet';link.href='/modules/light-magnitude-ui.css';root.append(link);
 const shell=document.createElement('section');shell.className='magnitude-shell light-surface';shell.hidden=true;
 shell.innerHTML='<header class="magnitude-header"><h2>变远与被尘埃遮挡，一样吗？</h2><details class="magnitude-modes"><summary>双通带与距离 ⌄</summary><div data-magnitude-modes></div></details></header><div data-magnitude-body></div><details class="magnitude-info"><summary>读图、完整积分与来源</summary><div data-magnitude-info><button type="button" data-magnitude-close>关闭说明 ×</button></div></details>';root.append(shell);
 const s=x=>shell.querySelector(x),head=document.createElement('div');head.className='magnitude-head';head.innerHTML='<p class="magnitude-bands">S · 400–500 nm　／　L · 600–700 nm <span>矩形能量通带 · C 为通量比的对数指标</span></p><p data-magnitude-result></p><p class="magnitude-scale">绝对接收谱 · 自动纵轴</p>';
 const dock=document.createElement('div');dock.className='magnitude-dock';dock.innerHTML='<div data-magnitude-primary></div><p data-magnitude-identity></p><div class="magnitude-tools"><details class="magnitude-conditions"><summary>源与尘埃条件</summary><div data-magnitude-conditions><button type="button" data-magnitude-close>关闭条件 ×</button><p>温度与半径改变发出；消光改变传播。距离主控只改变几何稀释。</p></div></details><details class="magnitude-presets"><summary>单项变化预设</summary><div data-magnitude-presets></div></details><details class="magnitude-baseline"><summary>保存基线 · 对照</summary><div data-magnitude-baseline><button type="button" data-magnitude-close>结束对照 ×</button><p data-magnitude-base></p></div></details></div><p class="magnitude-boundary">青：当前；灰：主动开启的基线。消光为人工幂律，原灰消光总辐射是独立简化模型。</p></div>';
 function move(n,h){if(!n||slots.has(n))return;const slot=document.createComment('magnitude return');n.before(slot);slots.set(n,slot);h.append(n);}
 const conditionNote=dock.querySelector('[data-magnitude-conditions]>p');
 function suspend(){if(!active)return;active=false;disposeNavigation?.();disposeNavigation=null;disposeDisclosures?.();disposeDisclosures=null;disposeSurface?.();disposeSurface=null;dock.querySelector('[data-magnitude-conditions]').append(conditionNote);for(const[n,p]of[...slots].reverse())p.replaceWith(n);slots.clear();head.remove();dock.remove();shell.hidden=true;root.classList.remove('magnitude-active');document.body.classList.remove('magnitude-observing');}
 function setMode(mode){if(!ready||disposed)return;if(mode!=='magnitude'){suspend();return;}if(active)return;active=true;shell.hidden=false;root.classList.add('magnitude-active');document.body.classList.add('magnitude-observing');
  move(q('.light-workbench'),s('[data-magnitude-body]'));q('.light-visual').prepend(head);q('.light-controls').prepend(dock);
  move(q('[data-key=distance]')?.closest('label'),dock.querySelector('[data-magnitude-primary]'));
  for(const k of['temperature','extinction'])move(q(`[data-key=${k}]`)?.closest('label'),dock.querySelector('[data-magnitude-conditions]'));
  move(q('.light-advanced'),dock.querySelector('[data-magnitude-conditions]'));move(q('.light-presets'),dock.querySelector('[data-magnitude-presets]'));move(q('.light-actions'),dock.querySelector('[data-magnitude-baseline]'));move(q('[data-comparison]'),dock.querySelector('[data-magnitude-baseline]'));move(q('.lab-tabs'),s('[data-magnitude-modes]'));disposeDisclosures=bindDisclosures(shell);disposeSurface=applyPresentation(shell,{surface:'paper',redraw});disposeNavigation=mountWorkspaceNavigation(shell,{modeNav:s('.magnitude-modes')});for(const node of shell.querySelectorAll('details'))node.classList.add('al-disclosure');for(const row of shell.querySelectorAll('.lab-tabs,.light-presets,.light-actions'))row.classList.add('al-mode-nav');
  dock.querySelector('.light-advanced')?.append(conditionNote);
  for(const n of[q('.light-question'),q('#light-metrics'),q('#light-legend'),q('[data-band-note]'),q('.light-auxiliary'),q('.light-explanation'),q('[data-mode-boundary]'),q('.light-links'),q('[data-focus-open]')?.parentElement])move(n,s('[data-magnitude-info]'));
 }
 function render({state,result,base}){if(!active)return;const bands=result.photometry,fmt=x=>x.toExponential(2);
  head.querySelector('[data-magnitude-result]').textContent=`S ${fmt(bands.bands[0].flux)} W/m²　　L ${fmt(bands.bands[1].flux)} W/m²　　FS/FL ${bands.ratio.toFixed(3)}`;
  dock.querySelector('[data-magnitude-identity]').textContent=`当前源 ${state.temperature} K · ${state.radius} R☉　／　传播 ${state.distance} pc · A₅₅₀ ${state.extinction.toFixed(1)} mag · p ${state.dustPower.toFixed(1)}`;
  dock.querySelector('[data-magnitude-base]').textContent=`保存基线：${base.temperature} K · ${base.radius} R☉ · ${base.distance} pc · A₅₅₀ ${base.extinction} · p ${base.dustPower}`;
 }
 function close(d){if(!d?.open)return;d.open=false;d.querySelector('summary')?.focus({preventScroll:true});if(head.getBoundingClientRect().top<0)head.scrollIntoView({block:'start'});}
 const click=e=>{if(e.target.closest('[data-magnitude-close]'))close(e.target.closest('details'));if(e.target.closest('[data-mode]'))close(s('.magnitude-modes'));};
 const focus=e=>{if(active&&innerWidth>700&&!q('.c-focus[open]')&&['distance','temperature','extinction'].includes(e.target.dataset.key)&&head.getBoundingClientRect().top<0)head.scrollIntoView({block:'start'});};
 root.addEventListener('click',click);root.addEventListener('focusin',focus);let frame=0;const activate=()=>{if(disposed||ready||frame)return;frame=requestAnimationFrame(()=>{frame=0;if(disposed)return;ready=true;redraw();});};link.addEventListener('load',activate,{once:true});if(link.sheet)activate();
 return{setMode,beforeControls:suspend,get comparing(){return!ready||dock.querySelector('.magnitude-baseline').open;},render,dispose(){disposed=true;link.removeEventListener('load',activate);cancelAnimationFrame(frame);suspend();root.removeEventListener('click',click);root.removeEventListener('focusin',focus);shell.remove();link.remove();}};
}
