// Presentation of the existing two teaching bands; all science remains in light.js.
export function attachMagnitudeUI(root,{redraw}){
 const q=s=>root.querySelector(s),slots=new Map();let active=false,ready=false,disposed=false;
 const link=document.createElement('link');link.rel='stylesheet';link.href='/modules/light-magnitude-ui.css';root.append(link);
 const shell=document.createElement('section');shell.className='magnitude-shell';shell.hidden=true;
 shell.innerHTML='<header class="magnitude-header"><a href="/">← Lab</a><h1>双通带与距离</h1><details class="magnitude-modes"><summary>双通带与距离 ⌄</summary><div data-magnitude-modes></div></details></header><div data-magnitude-body></div><details class="magnitude-info"><summary>读图、完整积分与来源</summary><div data-magnitude-info><button type="button" data-magnitude-close>关闭说明 ×</button></div></details>';root.append(shell);
 const s=x=>shell.querySelector(x),head=document.createElement('div');head.className='magnitude-head';head.innerHTML='<p class="magnitude-bands">S · 400–500 nm　／　L · 600–700 nm <span>矩形教学能量通带 · 不是 B−V</span></p><p data-magnitude-result></p><p class="magnitude-scale">绝对接收谱 · 未归一；自动纵轴同时覆盖当前与保存基线。</p>';
 const dock=document.createElement('div');dock.className='magnitude-dock';dock.innerHTML='<div data-magnitude-primary></div><p data-magnitude-identity></p><div class="magnitude-tools"><details class="magnitude-conditions"><summary>源与尘埃条件</summary><div data-magnitude-conditions><button type="button" data-magnitude-close>关闭条件 ×</button><p>温度与半径改变发出；消光改变传播。距离主控只改变几何稀释。</p></div></details><details class="magnitude-presets"><summary>单项变化预设</summary><div data-magnitude-presets></div></details><details class="magnitude-baseline"><summary>保存基线 · 对照</summary><div data-magnitude-baseline><button type="button" data-magnitude-close>结束对照 ×</button><p data-magnitude-base></p></div></details></div><p class="magnitude-boundary">青：当前；灰：主动开启的基线。消光为人工幂律，原灰消光总辐射是独立简化模型。</p></div>';
 function move(n,h){if(!n||slots.has(n))return;const slot=document.createComment('magnitude return');n.before(slot);slots.set(n,slot);h.append(n);}
 const conditionNote=dock.querySelector('[data-magnitude-conditions]>p');
 function suspend(){if(!active)return;active=false;dock.querySelector('[data-magnitude-conditions]').append(conditionNote);for(const[n,p]of[...slots].reverse())p.replaceWith(n);slots.clear();head.remove();dock.remove();shell.hidden=true;root.classList.remove('magnitude-active');document.body.classList.remove('magnitude-observing');}
 function setMode(mode){if(!ready||disposed)return;if(mode!=='magnitude'){suspend();return;}if(active)return;active=true;shell.hidden=false;root.classList.add('magnitude-active');document.body.classList.add('magnitude-observing');
  move(q('.light-workbench'),s('[data-magnitude-body]'));q('.light-visual').prepend(head);q('.light-controls').prepend(dock);
  move(q('[data-key=distance]')?.closest('label'),dock.querySelector('[data-magnitude-primary]'));
  for(const k of['temperature','extinction'])move(q(`[data-key=${k}]`)?.closest('label'),dock.querySelector('[data-magnitude-conditions]'));
  move(q('.light-advanced'),dock.querySelector('[data-magnitude-conditions]'));move(q('.light-presets'),dock.querySelector('[data-magnitude-presets]'));move(q('.light-actions'),dock.querySelector('[data-magnitude-baseline]'));move(q('[data-comparison]'),dock.querySelector('[data-magnitude-baseline]'));move(q('.lab-tabs'),s('[data-magnitude-modes]'));
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
 const key=e=>{if(e.key!=='Escape'||!active||q('.c-focus[open]'))return;const open=root.querySelectorAll('.magnitude-shell details[open],.magnitude-dock details[open]');if(open.length){e.preventDefault();close(open[open.length-1]);}};
 const focus=e=>{if(active&&innerWidth>700&&!q('.c-focus[open]')&&['distance','temperature','extinction'].includes(e.target.dataset.key)&&head.getBoundingClientRect().top<0)head.scrollIntoView({block:'start'});};
 root.addEventListener('click',click);root.addEventListener('keydown',key);root.addEventListener('focusin',focus);const frame=requestAnimationFrame(()=>{ready=true;if(!disposed)redraw();});
 return{setMode,beforeControls:suspend,get comparing(){return!ready||dock.querySelector('.magnitude-baseline').open;},render,dispose(){disposed=true;cancelAnimationFrame(frame);suspend();root.removeEventListener('click',click);root.removeEventListener('keydown',key);root.removeEventListener('focusin',focus);shell.remove();link.remove();}};
}
