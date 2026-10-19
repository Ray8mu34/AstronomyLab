// SNR observation surface. The original module owns counts, samples and recovery.
export function attachObservingUI(root,{redraw}){
 const q=s=>root.querySelector(s),slots=new Map();let ready=false,active=false,disposed=false;
 const link=document.createElement('link');link.rel='stylesheet';link.href='/modules/light-observing-ui.css';root.append(link);
 const shell=document.createElement('section');shell.className='observing-shell';shell.hidden=true;
 shell.innerHTML='<header class="observing-header"><a href="/">← Lab</a><h1>观测与噪声</h1><details class="observing-modes"><summary>模式 ⌄</summary><div data-observing-modes></div></details></header><div data-observing-work></div><div data-observing-sample></div><details class="observing-info"><summary>读图、计数模型与来源</summary><div data-observing-info><button type="button" data-observing-close>关闭说明 ×</button></div></details>';root.append(shell);
 const s=x=>shell.querySelector(x),head=document.createElement('div');head.className='observing-head';head.innerHTML='<p>曝光增加，信号和随机涨落一起积累。</p><p class="observing-current" data-observing-current></p><p class="observing-key">青：当前孔径 SNR；金：当前总曝光；灰：按需开启的保存基线。</p>';
 const dock=document.createElement('div');dock.className='observing-dock';dock.innerHTML='<div class="observing-primary" data-observing-primary></div><p class="observing-identity" data-observing-identity></p><div class="observing-tasks"><details class="observing-conditions"><summary>大气、信号与分帧条件</summary><div data-observing-conditions><button type="button" data-observing-close>关闭条件 ×</button></div></details><details class="observing-presets"><summary>曝光 / 背景预设</summary><div data-observing-presets></div></details><details class="observing-baseline"><summary>保存基线 · 对照</summary><div data-observing-baseline><button type="button" data-observing-close>结束对照 ×</button><p data-observing-base></p><p>自动纵轴仍覆盖当前和保存基线；关闭对照不重置条件。</p></div></details></div><p class="observing-boundary">相机孔径计数 · 大气条件由当前参数设定。</p></div>';
 const sampleNote=document.createElement('div');sampleNote.className='observing-sample-note';sampleNote.innerHTML='<p data-observing-seed></p><p>固定种子；“换一次噪声”更换种子。计数剖面随参数更新；孔径 SNR 由总计数计算。</p>';
 function move(n,h){if(!n||slots.has(n))return;const p=document.createComment('observing return');n.before(p);slots.set(n,p);h.append(n);}
 function suspend(){if(!active)return;active=false;for(const[n,p]of[...slots].reverse())p.replaceWith(n);slots.clear();head.remove();dock.remove();sampleNote.remove();shell.hidden=true;root.classList.remove('observing-active');document.body.classList.remove('noise-observing');}
 function setMode(mode){if(!ready||disposed)return;if(mode!=='observing'){suspend();return;}if(active)return;active=true;shell.hidden=false;root.classList.add('observing-active');document.body.classList.add('noise-observing');
  move(q('.light-workbench'),s('[data-observing-work]'));q('.light-visual').prepend(head);q('.light-controls').prepend(dock);
  for(const k of['exposure','background'])move(q(`[data-key=${k}]`)?.closest('label'),dock.querySelector('[data-observing-primary]'));
  move(q('[data-key=height]')?.closest('label'),dock.querySelector('[data-observing-conditions]'));move(q('.light-advanced'),dock.querySelector('[data-observing-conditions]'));move(q('.light-presets'),dock.querySelector('[data-observing-presets]'));move(q('.light-actions'),dock.querySelector('[data-observing-baseline]'));move(q('[data-comparison]'),dock.querySelector('[data-observing-baseline]'));move(q('.lab-tabs'),s('[data-observing-modes]'));
  move(q('.light-auxiliary'),s('[data-observing-sample]'));q('.light-auxiliary').insertBefore(sampleNote,q('#light-aux'));move(q('[data-noise]'),sampleNote);
  for(const n of[q('.light-question'),q('#light-metrics'),q('#light-legend'),q('.light-explanation'),q('[data-mode-boundary]'),q('.light-links'),q('[data-focus-open]')?.parentElement])move(n,s('[data-observing-info]'));
 }
 function render({state,result,base}){if(!active)return;
  head.querySelector('[data-observing-current]').textContent=`当前 ${state.exposure} s → 孔径 SNR ${result.snr.toFixed(2)}`;
  dock.querySelector('[data-observing-identity]').textContent=`大气保留 ${(result.transmission*100).toFixed(1)}% · 高度 ${state.height}° · ${state.frames} 次读出 · 读出方差 ${(result.readVariance/result.variance*100).toFixed(1)}%`;
  dock.querySelector('[data-observing-base]').textContent=`基线：${base.exposure} s · 背景 ${base.background} e⁻/s · 高度 ${base.height}° · ${base.frames} 次读出 · 每像素 ${base.read} e⁻`;
  sampleNote.querySelector('[data-observing-seed]').textContent=`当前固定样本 · 种子 ${state.seed} · ${state.exposure} s · ${state.frames} 次读出`;
 }
 function close(d){if(!d?.open)return;d.open=false;d.querySelector('summary')?.focus({preventScroll:true});if(head.getBoundingClientRect().top<0)head.scrollIntoView({block:'start'});}
 const click=e=>{if(e.target.closest('[data-observing-close]'))close(e.target.closest('details'));if(e.target.closest('[data-mode]'))close(s('.observing-modes'));};
 const key=e=>{if(e.key!=='Escape'||!active||q('.c-focus[open]'))return;const open=shell.querySelectorAll('details[open]');if(open.length){e.preventDefault();close(open[open.length-1]);}};
 const focus=e=>{if(active&&!q('.c-focus[open]')&&['exposure','background'].includes(e.target.dataset.key)&&head.getBoundingClientRect().top<0)head.scrollIntoView({block:'start'});};
 root.addEventListener('click',click);root.addEventListener('keydown',key);root.addEventListener('focusin',focus);const frame=requestAnimationFrame(()=>{ready=true;if(!disposed)redraw();});
 return{setMode,beforeControls:suspend,get comparing(){return!ready||dock.querySelector('.observing-baseline').open;},render,dispose(){disposed=true;cancelAnimationFrame(frame);suspend();root.removeEventListener('click',click);root.removeEventListener('keydown',key);root.removeEventListener('focusin',focus);shell.remove();link.remove();}};
}
