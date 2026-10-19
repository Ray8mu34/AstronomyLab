import {applyPresentation,bindDisclosures} from '../shared/presentation.js';
import {mountWorkspaceNavigation} from '../shared/navigation.js';
// Thermal-only presentation. Inputs, baselines and calculations stay in light.js.
export function attachThermalUI(root,{redraw}){
 const q=s=>root.querySelector(s),slots=new Map();let disposeSurface=null,disposeNavigation=null,disposeDisclosures=null;let ready=false,active=false,disposed=false;
 const style=document.createElement('link');style.rel='stylesheet';style.href='/modules/light-thermal-ui.css';root.append(style);
 const shell=document.createElement('section');shell.className='thermal-shell light-surface';shell.hidden=true;shell.setAttribute('aria-label','连续谱观察工作区');
 shell.innerHTML=`<header class="thermal-header"><h2>温度升高，谱峰移向哪里？</h2><span>理想黑体 · 单位表面 Bλ</span><details class="thermal-modes"><summary>连续谱 ⌄</summary><div class="thermal-mode-body" data-thermal-modes></div></details></header><div class="thermal-body"></div><details class="thermal-info"><summary>读图与来源</summary><div class="thermal-info-body"><button type="button" data-thermal-close>关闭说明 ×</button><div data-thermal-info></div><a href="/sources/light.md" target="_blank" rel="noopener">原模型与来源 ↗</a></div></details>`;
 root.append(shell);const s=x=>shell.querySelector(x);
 const chartHead=document.createElement('div');chartHead.className='thermal-chart-head';chartHead.innerHTML='<span class="thermal-peak-identity"><span class="thermal-peak" role="status" aria-live="off"></span><span data-thermal-identity></span></span><span data-thermal-scale></span>';
 const plotArea=document.createElement('div');plotArea.className='thermal-plot-area';plotArea.innerHTML='<svg class="thermal-peak-guide" aria-hidden="true"><path></path><circle r="4"></circle></svg>';
 const dock=document.createElement('div');dock.className='thermal-dock';dock.innerHTML=`<div class="thermal-primary"></div><div class="thermal-physical"><span data-thermal-total></span><span class="thermal-surface-note">半径改变整星光度，不改变此处 Bλ。</span></div><div class="thermal-tools"><details class="thermal-conditions"><summary>半径与光度</summary><div class="thermal-disclosure-body" data-thermal-conditions><button type="button" data-thermal-close>关闭条件 ×</button><p>L = 4πR²σT⁴ · 半径两倍，整星光度四倍。</p></div></details><details class="thermal-presets"><summary>温度预设</summary><div class="thermal-disclosure-body" data-thermal-presets></div></details><div data-thermal-display></div><details class="thermal-baseline"><summary>基线对照</summary><div class="thermal-disclosure-body" data-thermal-baseline><button type="button" data-thermal-close>结束查看 ×</button><p data-thermal-base-identity></p><p>基线保存的是本模式参数；归一显示只消去幅度，不改变整星光度。</p></div></details></div><p class="thermal-window-note">图窗：100–2000 nm；纵轴按可见曲线自动缩放。</p></div>`;
 let advancedSummary=null,advancedText='',advancedNote=null,advancedNoteText='';
 function move(node,target){if(!node||slots.has(node))return;const slot=document.createComment('thermal return');node.before(slot);slots.set(node,slot);target.append(node);}
 function suspend(){if(!active)return;active=false;disposeNavigation?.();disposeNavigation=null;disposeDisclosures?.();disposeDisclosures=null;disposeSurface?.();disposeSurface=null;if(advancedSummary)advancedSummary.textContent=advancedText;if(advancedNote)advancedNote.textContent=advancedNoteText;advancedSummary=null;advancedNote=null;for(const[node,slot]of [...slots].reverse())slot.replaceWith(node);slots.clear();chartHead.remove();plotArea.remove();dock.remove();root.classList.remove('thermal-active');document.body.classList.remove('thermal-observing');shell.hidden=true;}
 function setMode(mode){if(disposed||!ready)return;if(mode!=='thermal'){suspend();return;}if(active)return;active=true;root.classList.add('thermal-active');document.body.classList.add('thermal-observing');shell.hidden=false;
  move(q('.light-workbench'),s('.thermal-body'));const visual=q('.light-visual'),controls=q('.light-controls');visual.prepend(chartHead,plotArea);move(q('#light-plot'),plotArea);controls.prepend(dock);
  move(q('[data-key="temperature"]')?.closest('label'),dock.querySelector('.thermal-primary'));move(q('[data-key="radius"]')?.closest('label'),dock.querySelector('[data-thermal-conditions]'));move(q('#light-metrics'),dock.querySelector('[data-thermal-conditions]'));
  move(q('.light-presets'),dock.querySelector('[data-thermal-presets]'));move(q('.light-advanced'),dock.querySelector('[data-thermal-display]'));advancedSummary=q('.light-advanced>summary');if(advancedSummary){advancedText=advancedSummary.textContent;advancedSummary.textContent='显示条件';}
  advancedNote=q('.light-advanced .note');if(advancedNote){advancedNoteText=advancedNote.textContent;advancedNote.textContent='打开“基线对照”后，当前与保存基线同轴比较。Bλ 是单位表面辐射，半径改变整星光度。';}
  move(q('.light-actions'),dock.querySelector('[data-thermal-baseline]'));move(q('[data-comparison]'),dock.querySelector('[data-thermal-baseline]'));
  move(q('.lab-tabs'),s('[data-thermal-modes]'));disposeDisclosures=bindDisclosures(shell);disposeSurface=applyPresentation(shell,{surface:'paper',redraw});disposeNavigation=mountWorkspaceNavigation(shell,{modeNav:s('.thermal-modes')});for(const node of shell.querySelectorAll('details'))node.classList.add('al-disclosure');for(const row of shell.querySelectorAll('.lab-tabs,.light-presets,.light-actions'))row.classList.add('al-mode-nav');
  for(const node of [q('.light-question'),q('#light-legend'),q('.light-auxiliary'),q('.light-explanation'),q('[data-mode-boundary]'),q('[data-focus-open]')?.parentElement])move(node,s('[data-thermal-info]'));
 }
 function render({state,result,base,drawing,series,peakValue}){if(!active)return;
  const normalized=state.normalize;chartHead.querySelector('[data-thermal-scale]').textContent=normalized?'峰值归一 · 幅度已消去':'绝对 Bλ · 纵轴自动范围';
  chartHead.querySelector('[data-thermal-identity]').textContent=[dock.querySelector('.thermal-baseline').open?`实线：当前 ${state.temperature} K · 虚线：基线 ${base.temperature} K`:'',state.references?'点虚线：3000 K · 长虚线：10000 K':''].filter(Boolean).join('；');
  dock.querySelector('[data-thermal-total]').textContent=`R = ${state.radius} R☉　→　整星 L = ${result.luminosity.toExponential(2)} W`;
  dock.querySelector('[data-thermal-base-identity]').textContent=`基线：${base.temperature} K · ${base.radius} R☉　／　当前：${state.temperature} K · ${state.radius} R☉`;
  const input=q('[data-key="temperature"]');input.setAttribute('aria-label','有效温度，改变连续谱峰位与形状');q('[data-key="radius"]')?.setAttribute('aria-label','恒星半径，仅改变整星光度');
  if(!drawing)return;const [x,y]=drawing.toPixel(result.peak,peakValue),peak=chartHead.querySelector('.thermal-peak'),svg=plotArea.querySelector('svg');
  svg.setAttribute('viewBox',`0 0 ${drawing.width} ${drawing.height}`);svg.querySelector('circle').setAttribute('cx',x);svg.querySelector('circle').setAttribute('cy',y);svg.querySelector('path').setAttribute('d',`M ${x} ${y+7} V ${drawing.height-48}`);
  peak.textContent=`λmax ${result.peak.toFixed(1)} nm · ${state.temperature} K`;
  // The numeric annotation stays outside every curve; the actual peak and its
  // wavelength guide still use the unchanged renderer's pixel transform.
 }
 function close(details){if(details?.open){details.open=false;details.querySelector('summary')?.focus({preventScroll:true});if(details!==s('.thermal-modes')&&chartHead.getBoundingClientRect().top<0)chartHead.scrollIntoView({block:'start'});}}
 const click=e=>{const b=e.target.closest('[data-thermal-close]');if(b)close(b.closest('details'));if(e.target.closest('[data-mode]'))close(s('.thermal-modes'));};
 root.addEventListener('click',click);
 let frame=0;const activate=()=>{if(disposed||ready||frame)return;frame=requestAnimationFrame(()=>{frame=0;if(disposed)return;ready=true;redraw();});};style.addEventListener('load',activate,{once:true});if(style.sheet)activate();
 return{setMode,beforeControls:suspend,get comparing(){return !ready||dock.querySelector('.thermal-baseline').open;},render,dispose(){disposed=true;style.removeEventListener('load',activate);cancelAnimationFrame(frame);suspend();root.removeEventListener('click',click);shell.remove();style.remove();}};
}
