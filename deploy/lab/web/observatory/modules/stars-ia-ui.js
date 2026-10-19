import {startStarsPresentation} from './stars-atlas-ui.js';
import {getGraphicStyle} from '../shared/presentation.js';
// IA presentation only: the existing mode/view/controls and scientific results remain owned by stars.js.
export function attachIAUI(root,{redraw}){
 const q=s=>root.querySelector(s),slots=new Map();let active=false,ready=false,disposed=false,frame=0,primary=null,releasePresentation=()=>{};
 const style=document.createElement('link');style.rel='stylesheet';style.href='/modules/stars-ia-ui.css';root.append(style);
 const shell=document.createElement('section');shell.className='ia-shell';shell.hidden=true;
 shell.innerHTML=`<details class="ia-modes"><summary>Ia 标准化</summary><div data-ia-modes></div></details><div class="stars-atlas-heading"><p>Ia 标准化 · 七个合成教学样本</p><h1>光变形状，怎样帮助比较恒星爆发？</h1></div><div class="ia-taskbar" data-ia-views></div><div class="ia-stage"></div><p class="ia-result" data-ia-current></p><div class="ia-tools"><details class="ia-presets"><summary>校正预设</summary><div data-ia-presets></div></details><div data-ia-baseline></div><details class="ia-info"><summary>样本与来源</summary><div data-ia-info><button type="button" data-ia-close>关闭说明 ×</button></div></details></div><p class="ia-boundary">合成光变样本 · 校正后保留预设残差。</p>`;
 root.append(shell);const s=x=>shell.querySelector(x),current=s('[data-ia-current]');
 const context=document.createElement('aside');context.className='ia-point-context';context.hidden=true;context.setAttribute('aria-label','当前合成样本');
 function move(node,target){if(!node||slots.has(node))return;const slot=document.createComment('IA return');node.before(slot);slots.set(node,slot);target.append(node);}
 function suspend(){if(!active)return;active=false;releasePresentation();releasePresentation=()=>{};cancelAnimationFrame(frame);frame=0;context.hidden=true;for(const[node,slot]of [...slots].reverse())slot.replaceWith(node);slots.clear();primary?.remove();primary=null;root.classList.remove('ia-active');document.body.classList.remove('ia-observing');shell.hidden=true;}
 function setMode(mode){if(!ready||disposed)return;if(mode!=='ia'){suspend();return;}if(active)return;active=true;root.classList.add('ia-active');document.body.classList.add('ia-observing');shell.hidden=false;
  move(q('.lab-tabs'),s('[data-ia-modes]'));releasePresentation=startStarsPresentation(root,shell,{surface:'paper',modeNav:s('.ia-modes'),redraw});move(q('.stars-workbench'),s('.ia-stage'));move(s('[data-ia-current]'),q('.stars-visuals'));move(q('.stars-management'),s('[data-ia-baseline]'));
  const host=q('[data-controls]');primary=document.createElement('div');primary.className='ia-primary';q('.stars-views').before(primary);
  move(host.querySelector('[data-key=iaCorrection]')?.closest('label'),primary);move(host.querySelector('[data-key=iaSample]')?.closest('label'),primary);move(host.querySelector('.stars-presets'),s('[data-ia-presets]'));
  for(const node of[q('[data-metrics]'),q('.stars-detailed'),host.querySelector('.stars-advanced'),q('.stars-question'),q('.stars-explanation'),q('.stars-links'),q('.stars-start')?.closest('.experiment-explanation'),q('[data-focus-open]'),q('[data-feedback]')])move(node,s('[data-ia-info]'));
  move(q('[data-comparison]'),s('[data-ia-baseline]'));q('.stars-chart-panel').append(context);
  const boundary=q('[data-mode-boundary]');if(boundary){s('.ia-boundary').replaceChildren();move(boundary,s('.ia-boundary'));}
 }
 function render({state,result,drawing,before,after}){if(!active)return;const isCurve=root.dataset.view==='scene';context.hidden=isCurve;
  current.textContent=`样本 ${result.sample.id} · 当前峰值 ${result.peak.toFixed(3)} mag　｜　七样本散布 σ ${result.beforeScatter.toFixed(3)} → ${result.afterScatter.toFixed(3)} mag`;
  let note=primary.querySelector('.ia-correction-note');if(!note){note=document.createElement('p');note.className='ia-correction-note';primary.append(note);}note.textContent=isCurve?'当前查看原始合成光变；校正只改变峰值图，原始光变不随校正改变。':'灰：校正前　深色：当前校正　青：自选参考 −19.3 mag。框选标记为当前样本。';
  q('[data-plot]').setAttribute('aria-label','七个人工合成样本的峰值校正：绝对星等向上更亮，框选标记为当前样本');
  context.textContent=`样本 ${result.sample.id} · ${result.peak.toFixed(3)} mag`;
  if(!drawing||isCurve)return;const canvas=q('[data-plot]'),[x,y]=drawing.toPixel(result.sample.id,result.peak),c=canvas.getContext('2d');c.save();c.strokeStyle=getGraphicStyle(canvas).text;c.lineWidth=2;c.strokeRect(x-7,y-7,14,14);c.restore();
  cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{frame=0;if(!active||disposed||root.dataset.view==='scene')return;const w=context.offsetWidth,h=context.offsetHeight,points=before.values.flatMap((v,i)=>[drawing.toPixel(i+1,v),drawing.toPixel(i+1,after.values[i])]),candidates=[];
   for(const dx of[18,-w-18])for(const dy of[18,-h-18]){const left=Math.max(70,Math.min(drawing.width-28-w,x+dx)),top=Math.max(32,Math.min(drawing.height-53-h,y+dy));let score=0;for(const[px,py]of points)if(px>left-12&&px<left+w+12&&py>top-12&&py<top+h+12)score+=1e6;score+=(left-x)**2+(top-y)**2;candidates.push({left,top,score});}const p=candidates.sort((a,b)=>a.score-b.score)[0];context.style.left=p.left+'px';context.style.top=(canvas.offsetTop+p.top)+'px';
  });
 }
 const close=detail=>{if(detail?.open){detail.open=false;detail.querySelector('summary')?.focus({preventScroll:true});}};
 const click=e=>{if(e.target.closest('[data-ia-close]'))close(s('.ia-info'));if(e.target.closest('[data-mode]'))close(s('.ia-modes'));};
 shell.addEventListener('click',click);
 const init=requestAnimationFrame(()=>{ready=true;if(!disposed)redraw();});
 return{setMode,render,suspend,get active(){return active;},dispose(){disposed=true;cancelAnimationFrame(init);suspend();shell.removeEventListener('click',click);context.remove();shell.remove();style.remove();}};
}
