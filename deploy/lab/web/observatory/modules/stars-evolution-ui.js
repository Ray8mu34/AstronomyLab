// Evolution presentation only. MIST rows, stages, clock, baseline and HR/structure renderers stay in stars.js.
export function attachEvolutionUI(root,{redraw}){
 const q=s=>root.querySelector(s),slots=new Map();let ready=false,active=false,disposed=false;
 const style=document.createElement('link');style.rel='stylesheet';style.href='/modules/stars-evolution-ui.css';root.append(style);
 const shell=document.createElement('section');shell.className='evolution-shell';shell.hidden=true;
 shell.innerHTML=`<header class="evolution-header"><a href="/" aria-label="返回 Lab 工具目录">← Lab</a><h1>一颗星的演化</h1><span>MIST 单星模型 · HR 轨迹</span><details class="evolution-modes"><summary>恒星模式</summary><div data-evolution-modes></div></details></header><div class="evolution-stage"></div>`;root.append(shell);
 const identity=document.createElement('div');identity.className='evolution-identity';identity.innerHTML=`<div data-evolution-mass></div><p data-evolution-current></p>`;
 const reads=document.createElement('p');reads.className='evolution-surface';reads.setAttribute('data-evolution-surface','');
 const internal=document.createElement('div');internal.className='evolution-internal';internal.innerHTML=`<p data-evolution-core></p><p>组成与供能位置示意。无径向网格；层厚与圆大小不表示模型半径，颜色不表示温度。</p>`;
 const bottom=document.createElement('div');bottom.className='evolution-bottom';bottom.innerHTML=`<div class="evolution-clock"><div class="evolution-scrub"><div data-evolution-index></div><div class="evolution-clock-actions"></div></div><p data-evolution-age></p><p class="evolution-clock-note">浏览演化点：32 点/秒；EEP 非等时间，模型年龄另读。复位回到 1 M☉ / EEP 353，暂停并重置基线。</p></div><div class="evolution-tools"><details class="evolution-presets"><summary>跳到阶段</summary><div data-evolution-presets></div><button type="button" data-evolution-close>关闭阶段 ×</button></details><details class="evolution-compare"><summary>对照保存的模型点</summary><p data-evolution-baseline></p><div class="evolution-baseline-actions"></div><div data-evolution-comparison></div><p>蓝方块是保存的模型点；灰轨迹始终只属于当前初始质量。跨质量对照不连成同一颗星的历史。</p><button type="button" data-evolution-close>结束对照 ×</button></details><details class="evolution-info"><summary>模型、完整读数与来源</summary><div data-evolution-info></div><button type="button" data-evolution-close>关闭说明 ×</button></details></div>`;
 const caption=document.createElement('p');caption.className='evolution-curve-caption';const boundary=document.createElement('div');boundary.className='evolution-boundary';
 const s=x=>shell.querySelector(x),b=x=>bottom.querySelector(x),fmt=x=>x>=1e5||x>0&&x<.01?x.toExponential(3):x.toLocaleString('zh-CN',{maximumFractionDigits:3});
 function move(node,target){if(!node||slots.has(node))return;const slot=document.createComment('Evolution return');node.before(slot);slots.set(node,slot);target.append(node);}
 function suspend(){if(!active)return;active=false;for(const[node,slot]of [...slots].reverse())slot.replaceWith(node);slots.clear();identity.remove();reads.remove();internal.remove();caption.remove();bottom.remove();boundary.remove();root.classList.remove('evolution-active');document.body.classList.remove('evolution-observing');shell.hidden=true;}
 function setMode(mode){if(!ready||disposed)return;if(mode!=='evolution'){suspend();return;}if(active)return;active=true;root.classList.add('evolution-active');document.body.classList.add('evolution-observing');shell.hidden=false;
  move(q('.lab-tabs'),s('[data-evolution-modes]'));move(q('.stars-workbench'),s('.evolution-stage'));q('.stars-views').before(identity);q('.stars-chart-panel').append(reads,caption);q('.stars-scene-panel').append(internal);q('.stars-visuals').append(bottom,boundary);
  const host=q('[data-controls]');move(host.querySelector('[data-key=mass]')?.closest('label'),identity.querySelector('[data-evolution-mass]'));move(host.querySelector('[data-key=index]')?.closest('label'),b('[data-evolution-index]'));
  move(q('[data-play]'),b('.evolution-clock-actions'));move(q('[data-reset]'),b('.evolution-clock-actions'));move(host.querySelector('.stars-presets'),b('[data-evolution-presets]'));
  for(const key of ['save','restore'])move(q(`[data-${key}]`),b('.evolution-baseline-actions'));move(q('[data-comparison]'),b('[data-evolution-comparison]'));
  for(const node of[q('[data-metrics]'),q('.stars-detailed'),host.querySelector('.stars-advanced'),q('.stars-question'),q('.stars-explanation'),q('.stars-links'),q('.stars-start')?.closest('.experiment-explanation'),q('[data-focus-open]'),q('[data-camera-reset]'),q('[data-legend]'),q('[data-plot-legend]')])move(node,b('[data-evolution-info]'));
  move(q('[data-feedback]'),bottom);
 }
 function render({state,result,baseline,prior,structure}){if(!active)return;const p=result.point;
  const nativeBoundary=q('[data-mode-boundary]');if(nativeBoundary&&!slots.has(nativeBoundary))move(nativeBoundary,boundary);
  identity.querySelector('[data-evolution-current]').textContent=`金环 · EEP ${p.eep} · ${result.stage}`;
  q('[data-plot-title]').textContent=`${state.mass} M☉ 初始质量的单星轨迹 · 两轴对数`;
  q('[data-scene-title]').textContent='同一模型点的内部示意';
  reads.textContent=`表面 ${fmt(p.temperature)} K　·　总光度 ${fmt(p.luminosity)} L☉　·　半径 ${fmt(p.radius)} R☉`;
  internal.querySelector('[data-evolution-core]').textContent=`中央温度 ${fmt(p.centerTemperature)} K · 模型读数`;
  caption.textContent=`灰：当前质量的轨迹　金环：当前模型点${b('.evolution-compare').open?'　蓝方块：保存的模型点':''}。${Number(state.mass)>=8?'本轨迹止于碳燃烧末，不接坍缩。':'本轨迹止于后 AGB，不接白矮星冷却。'}`;
  b('[data-evolution-age]').textContent=`模型年龄 ${fmt(p.star_age/1e6)} 百万年　·　当前质量 ${fmt(p.star_mass)} M☉`;
  b('[data-evolution-baseline]').textContent=`蓝方块 · 初始 ${baseline.mass} M☉ / EEP ${prior.eep}；表面 ${fmt(prior.temperature)} K，光度 ${fmt(prior.luminosity)} L☉。当前金环 · 初始 ${state.mass} M☉ / EEP ${p.eep}。`;
  q('[data-plot]').setAttribute('aria-label',`MIST ${state.mass}倍太阳初始质量模型的HR轨迹，两轴对数，温度向右递减，光度向上增加；金环EEP ${p.eep}，通过下方演化点滑块浏览`);
 }
 const close=d=>{if(d?.open){d.open=false;d.querySelector('summary')?.focus({preventScroll:true});}};
 const click=e=>{if(e.target.closest('[data-evolution-close]'))close(e.target.closest('details'));if(e.target.closest('[data-mode]'))close(s('.evolution-modes'));};
 const key=e=>{if(e.key!=='Escape'||q('.c-focus')?.open)return;const open=[...root.querySelectorAll('.evolution-shell details[open]')].filter(d=>{for(let a=d.parentElement?.closest('details');a;a=a.parentElement?.closest('details'))if(!a.open)return false;return d.getClientRects().length>0;});if(open.length){e.preventDefault();close(open.at(-1));}};
 root.addEventListener('click',click);root.addEventListener('keydown',key);const init=requestAnimationFrame(()=>{ready=true;if(!disposed)redraw();});
 return{setMode,suspend,render,get comparing(){return active&&b('.evolution-compare').open;},dispose(){disposed=true;cancelAnimationFrame(init);suspend();root.removeEventListener('click',click);root.removeEventListener('keydown',key);shell.remove();style.remove();}};
}
