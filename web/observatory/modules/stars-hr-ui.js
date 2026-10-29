import {applyPresentation,bindDisclosures} from '../shared/presentation.js';
import {mountWorkspaceNavigation} from '../shared/navigation.js';

export function attachHRUI(root,{redraw}){
 const q=s=>root.querySelector(s),slots=new Map();let ready=false,active=false,disposed=false,lastComparison=null,frame=0,model=null,release=()=>{},releaseNav=()=>{},releaseDisclosures=()=>{};
 const style=document.createElement('link');style.rel='stylesheet';style.href='/modules/stars-hr-ui.css';root.append(style);
 const shell=document.createElement('section');shell.className='hr-shell al-surface';shell.dataset.alSurface='hr';shell.hidden=true;shell.setAttribute('aria-label','赫罗图观察工作区');
 shell.innerHTML=`<details class="hr-mode-menu"><summary>赫罗图</summary><div class="hr-menu-body" data-hr-modes></div></details><div class="hr-heading"><div><p class="hr-eyebrow">温度 · 光度 · 半径</p><h1>为什么有些恒星又冷又亮？</h1></div><p class="hr-axis-key">赫罗图 · 左热右冷 · 向上更亮 · 两轴对数</p></div><div class="hr-toolbar"><div data-hr-controls></div><details class="hr-info"><summary>读图与来源</summary><div class="hr-menu-body" data-hr-info><button type="button" class="al-button" data-hr-close-info>关闭说明</button></div></details></div><div class="hr-stage"><div class="hr-canvas-area" data-al-theme-fixed="dark"><div class="hr-point-labels" aria-label="赫罗图教学示例"></div><svg class="hr-leader" aria-hidden="true"><path></path></svg><aside class="hr-context" aria-label="当前对象与半径关系"><div class="hr-context-head"><h2></h2><span class="hr-context-kind"></span></div><div class="hr-values"></div></aside></div></div><div class="hr-reading"><p class="hr-chart-key">点选星点或区域，比较温度、光度与半径。</p><details class="hr-relation al-disclosure"><summary>查看半径关系</summary><div data-hr-relation></div><p class="hr-formula al-number">R/R☉ = √(L/L☉) × (5772 K / T)²</p></details></div><footer class="hr-footer"></footer>`;
 root.append(shell);const s=x=>shell.querySelector(x),area=s('.hr-canvas-area'),context=s('.hr-context'),labels=s('.hr-point-labels'),leader=s('.hr-leader path');
 function move(node,target){if(!node||slots.has(node))return;const slot=document.createComment('HR return');node.before(slot);slots.set(node,slot);target.append(node);}
 function suspend(){if(!active)return;active=false;releaseDisclosures();releaseDisclosures=()=>{};releaseNav();releaseNav=()=>{};release();release=()=>{};cancelAnimationFrame(frame);frame=0;model=null;for(const[node,slot]of slots)slot.replaceWith(node);slots.clear();root.classList.remove('hr-active');document.body.classList.remove('hr-observing');shell.hidden=true;}
 function setMode(mode){if(!ready||disposed)return;if(mode!=='hr'){suspend();return;}if(active)return;active=true;root.classList.add('hr-active');document.body.classList.add('hr-observing');shell.hidden=false;release=applyPresentation(shell,{surface:'hr',redraw});
  move(q('[data-mode-boundary]'),s('.hr-footer'));move(q('[data-feedback]'),s('[data-hr-info]'));move(q('.stars-chart-panel'),area);area.append(context);move(q('[data-controls]'),s('[data-hr-controls]'));move(q('.lab-tabs'),s('[data-hr-modes]'));move(q('[data-selection]'),s('[data-hr-relation]'));
  for(const node of [q('.stars-question'),q('.stars-management'),q('.stars-detailed'),q('.stars-explanation'),q('.stars-start')?.closest('.experiment-explanation')])move(node,s('[data-hr-info]'));
  const modeNav=s('.hr-mode-menu');releaseNav=mountWorkspaceNavigation(shell,{modeNav,label:'恒星实验导航'});releaseDisclosures=bindDisclosures(shell);
 }
 const format=n=>Math.abs(n)>=1e5||Math.abs(n)>0&&Math.abs(n)<.01?n.toExponential(3):n.toLocaleString('zh-CN',{maximumFractionDigits:3});
 const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
 const overlap=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
 const pad=(r,p=6)=>rect(r.left-p,r.top-p,r.width+p*2,r.height+p*2);
 const edge=(r,x,y)=>[Math.max(r.left,Math.min(r.right,x)),Math.max(r.top,Math.min(r.bottom,y))];
 function placeLabels(drawing,comparing){const occupied=drawing.labels.map(r=>pad(r)),box=drawing.box;
  for(const p of drawing.hits){const b=labels.querySelector(`[data-hr-object="${p.id}"]`);b.hidden=comparing;if(comparing)continue;const w=b.offsetWidth,h=b.offsetHeight,candidates=[];
   for(const[dx,dy]of [[14,-h/2],[-w-14,-h/2],[12,12],[-w-12,12],[12,-h-12],[-w-12,-h-12]]){const r=rect(Math.max(box.left,Math.min(box.right-w,p.x+dx)),Math.max(box.top,Math.min(box.bottom-h,p.y+dy)),w,h),collision=occupied.reduce((n,o)=>n+overlap(pad(r,3),o),0)+drawing.hits.reduce((n,o)=>n+overlap(pad(r,3),rect(o.x-9,o.y-9,18,18)),0);candidates.push({r,score:collision*10000+Math.hypot(r.left-p.x,r.top-p.y)});}
   candidates.sort((a,b)=>a.score-b.score);const r=candidates[0].r;b.style.left=r.left+'px';b.style.top=r.top+'px';occupied.push(pad(r,4));
  }return occupied;
 }
 function placeContext(){if(!active||disposed||!model)return;const{drawing,comparing}=model,occupied=placeLabels(drawing,comparing);
  if(matchMedia('(max-width:1000px)').matches){context.style.removeProperty('left');context.style.removeProperty('top');leader.setAttribute('d','');return;}
  const p=drawing.points.at(-1),[x,y]=drawing.pixel(p.temperature,p.luminosity),w=context.offsetWidth,h=context.offsetHeight,b=drawing.box;
  const hard=[...occupied,...(comparing?drawing.points:drawing.hits).map(p=>{const[px,py]=p.x===undefined?drawing.pixel(p.temperature,p.luminosity):[p.x,p.y];return rect(px-14,py-14,28,28);})];
  if(comparing){const[a,z]=drawing.points.map(p=>drawing.pixel(p.temperature,p.luminosity));hard.push(rect(Math.min(a[0],z[0])-10,Math.min(a[1],z[1])-10,Math.abs(a[0]-z[0])+20,Math.abs(a[1]-z[1])+20));}
  let best=null,cost=Infinity;for(let left=b.left+8;left<=b.right-w-8;left+=20)for(let top=b.top+8;top<=b.bottom-h-8;top+=20){const r=rect(left,top,w,h),[ex,ey]=edge(r,x,y),score=hard.reduce((n,o)=>n+overlap(pad(r),o),0)*1e7+(x-ex)**2+(y-ey)**2;if(score<cost){cost=score;best=r;}}
  if(!best)return;context.style.left=best.left+'px';context.style.top=best.top+'px';const[ex,ey]=edge(best,x,y);s('.hr-leader').setAttribute('viewBox',`0 0 ${area.clientWidth} ${area.clientHeight}`);leader.style.stroke=comparing?'var(--hr-b)':'var(--hr-a)';leader.setAttribute('d',`M ${x} ${y} L ${ex} ${ey}`);
 }
 function schedule(){if(!active||disposed||frame)return;frame=requestAnimationFrame(()=>{frame=0;placeContext();});}
 function render({state,drawing,example}){if(!active||!drawing)return;const comparing=state.hrCompare!=='none',controls=q('[data-controls]'),menu=controls.querySelector('.hr-compare-menu');
  controls.querySelector('.hr-choice').hidden=comparing;controls.querySelector('[data-hr-subject]').hidden=!comparing;controls.querySelector('.hr-exit').hidden=!comparing;for(const b of controls.querySelectorAll('button'))b.classList.add('al-button');
  if(lastComparison!==state.hrCompare&&lastComparison!==null){if(menu.open){menu.open=false;menu.querySelector('summary').focus({preventScroll:true});}s('.hr-relation').open=false;}
  lastComparison=state.hrCompare;menu.querySelector('summary').textContent=comparing?(state.hrCompare==='temperature'?'同温度 · 比光度':'同光度 · 比温度'):'比较半径关系';
  s('.hr-context-head h2').textContent=comparing?'太阳 A 与示例 B':example.name;s('.hr-context-kind').textContent=comparing?'A · 太阳名义参照　B · 构造示例':example.kind;
  const values=s('.hr-values');values.replaceChildren();for(const[i,p]of drawing.points.entries()){const row=document.createElement('div');row.className='hr-value '+(i?'hr-value-b':'hr-value-a');if(comparing){const name=document.createElement('p');name.className='hr-value-name';name.textContent=i?(state.hrCompare==='temperature'?'B · 同温度':'B · 同光度'):'A · 太阳参照';row.append(name);}
   for(const[label,value,unit]of [['有效温度',p.temperature,'K'],['光度',p.luminosity,'L☉'],['辐射半径',p.radius,'R☉']]){const item=document.createElement('p');item.className='hr-value-item';const name=document.createElement('span');name.textContent=label;const number=document.createElement('strong');number.className='al-number';number.textContent=format(value);const suffix=document.createElement('span');suffix.className='hr-unit';suffix.textContent=unit;item.append(name,number,suffix);row.append(item);}values.append(row);}
  const names={sun:'太阳',hot:'热主序星',cool:'冷主序星',giant:'红巨星',supergiant:'红超巨星',dwarf:'白矮星'};if(labels.children.length!==drawing.hits.length){labels.replaceChildren();for(const p of drawing.hits){const b=document.createElement('button');b.type='button';b.dataset.hrObject=p.id;b.textContent=names[p.id];b.setAttribute('aria-label','选择'+names[p.id]+'，查看温度、光度和半径');labels.append(b);}}
  for(const p of drawing.hits)labels.querySelector(`[data-hr-object="${p.id}"]`).setAttribute('aria-pressed',String(!comparing&&p.id===state.hrExample));context.dataset.comparing=String(comparing);model={drawing,comparing};schedule();s('.hr-relation summary').textContent=comparing?'为什么半径不同？':'查看半径关系';
 }
 function close(details){if(details?.open){details.open=false;details.querySelector('summary')?.focus({preventScroll:true});}}
 const click=e=>{const b=e.target.closest('button[data-hr-object]');if(b){const input=q('[data-key="hrExample"]');input.value=b.dataset.hrObject;input.dispatchEvent(new Event('input',{bubbles:true}));}if(e.target.closest('[data-hr-close-info]'))close(s('.hr-info'));if(e.target.closest('[data-mode]'))close(s('.hr-mode-menu'));};
 const toggle=()=>schedule();
 const observer=new ResizeObserver(schedule);observer.observe(context);observer.observe(area);shell.addEventListener('click',click);shell.addEventListener('toggle',toggle,true);
 const first=requestAnimationFrame(()=>{if(disposed)return;ready=true;redraw();});return{setMode,render,suspend,dispose(){disposed=true;cancelAnimationFrame(first);cancelAnimationFrame(frame);observer.disconnect();suspend();shell.removeEventListener('click',click);shell.removeEventListener('toggle',toggle,true);shell.remove();style.remove();}};
}
