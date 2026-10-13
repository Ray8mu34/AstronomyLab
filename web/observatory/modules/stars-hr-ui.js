// HR-only presentation. Scientific state, picking and comparison stay in stars.js.
// Coordinates and radii are consumed from the unchanged shared drawHR renderer.
export function attachHRUI(root,{redraw}){
 const q=s=>root.querySelector(s),slots=new Map();let ready=false,active=false,disposed=false,lastComparison=null,layoutFrame=0,layoutModel=null;
 const style=document.createElement('link');style.rel='stylesheet';style.href='/modules/stars-hr-ui.css';root.append(style);
 const shell=document.createElement('section');shell.className='hr-shell';shell.hidden=true;shell.setAttribute('aria-label','赫罗图观察工作区');
 shell.innerHTML=`<header class="hr-header"><a href="/" aria-label="返回 Lab 工具目录">← Lab</a><h1>赫罗图</h1><span class="hr-axis-key">左热右冷 · 向上更亮 · 两轴对数刻度</span><details class="hr-mode-menu"><summary>恒星模式</summary><div class="hr-menu-body" data-hr-modes></div></details></header><div class="hr-toolbar"><div data-hr-controls></div><details class="hr-info"><summary>读图与来源</summary><div class="hr-menu-body" data-hr-info><button type="button" data-hr-close-info>关闭说明 ×</button></div></details></div><div class="hr-stage"><div class="hr-canvas-area"><div class="hr-point-labels" aria-label="赫罗图教学示例"></div><svg class="hr-leader" aria-hidden="true"><path></path></svg></div><aside class="hr-context" aria-label="当前对象与半径关系"><div class="hr-context-head"><h2></h2><span class="hr-context-kind"></span></div><div class="hr-values"></div><details class="hr-relation"><summary>查看半径关系</summary><div data-hr-relation></div><p class="hr-formula">R/R☉ = √(L/L☉) × (5772 K / T)²</p></details></aside></div><footer class="hr-footer"><span>点选示例，观察温度、光度与半径的关系。</span></footer>`;
 root.append(shell);
 const s=x=>shell.querySelector(x),area=s('.hr-canvas-area'),context=s('.hr-context'),labels=s('.hr-point-labels'),leader=s('.hr-leader path');
 function move(node,target){if(!node||slots.has(node))return;const slot=document.createComment('HR return');node.before(slot);slots.set(node,slot);target.append(node);}
 function suspend(){if(!active)return;active=false;cancelAnimationFrame(layoutFrame);layoutFrame=0;layoutModel=null;for(const[node,slot]of slots){slot.replaceWith(node);}slots.clear();root.classList.remove('hr-active');document.body.classList.remove('hr-observing');shell.hidden=true;}
 function setMode(mode){if(!ready||disposed)return;if(mode!=='hr'){suspend();return;}if(active)return;active=true;root.classList.add('hr-active');document.body.classList.add('hr-observing');shell.hidden=false;
  move(q('[data-mode-boundary]'),s('.hr-footer'));move(q('[data-feedback]'),s('[data-hr-info]'));move(q('.stars-chart-panel'),area);move(q('[data-controls]'),s('[data-hr-controls]'));move(q('.lab-tabs'),s('[data-hr-modes]'));move(q('[data-selection]'),s('[data-hr-relation]'));
  for(const node of [q('.stars-question'),q('.stars-management'),q('.stars-detailed'),q('.stars-explanation'),q('.stars-start')?.closest('.experiment-explanation')])move(node,s('[data-hr-info]'));
 }
 const format=n=>Math.abs(n)>=1e5||Math.abs(n)>0&&Math.abs(n)<.01?n.toExponential(3):n.toLocaleString('zh-CN',{maximumFractionDigits:3});
 const measure=document.createElement('canvas').getContext('2d');
 const overlap=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
 const rectangle=(left,top,width,height)=>({left,top,right:left+width,bottom:top+height});
 const edge=(r,x,y)=>[Math.max(r.left,Math.min(r.right,x)),Math.max(r.top,Math.min(r.bottom,y))];
 // Annotation obstacles mirror the existing renderer's labels, in CSS pixels.
 // No model coordinates, scientific data, plot scales or renderer are changed.
 function placeContext(){if(!active||disposed||!layoutModel)return;
  const {drawing,comparing}=layoutModel,narrow=matchMedia('(max-width:1000px)').matches;
  if(narrow){context.style.removeProperty('left');context.style.removeProperty('top');leader.setAttribute('d','');return;}
  const p=drawing.points.at(-1),[x,y]=drawing.pixel(p.temperature,p.luminosity),w=context.offsetWidth,h=context.offsetHeight,box=drawing.box;
  const bounds={left:box.left+8,top:box.top+8,right:box.right-8,bottom:box.bottom-8},hard=[],guides=[];
  for(const point of comparing?drawing.points:drawing.hits){const [px,py]=point.x===undefined?drawing.pixel(point.temperature,point.luminosity):[point.x,point.y];hard.push(rectangle(px-14,py-28,48,54));}
  const origin=area.getBoundingClientRect();for(const b of labels.children){if(b.hidden)continue;const r=b.getBoundingClientRect();hard.push(rectangle(r.left-origin.left-5,r.top-origin.top-4,r.width+10,r.height+8));}
  const small=area.clientWidth<500,size=small?12:16;measure.font=`${size}px "Microsoft YaHei",sans-serif`;
  const regionLabels=small?[[8500,1.5,'①主序'],[3700,200,'②巨星'],[6500,1e5,'③超巨星'],[15000,.001,'④白矮星']]:[[10000,4,'① 主序带'],[3700,200,'② 巨星'],[10000,1e5,'③ 超巨星 · 有冷有热'],[15000,.001,'④ 白矮星']];
  for(const[t,l,text]of regionLabels){const[px,py]=drawing.pixel(t,l),width=measure.measureText(text).width;hard.push(rectangle(px-width/2-20,py-size-7,width+40,size+16));}
  const positions=drawing.points.map(p=>drawing.pixel(p.temperature,p.luminosity));
  for(const[px,py]of positions){guides.push(rectangle(box.left,py-4,px-box.left,8),rectangle(px-4,py,8,box.bottom-py));}
  if(comparing){const[a,b]=positions;hard.push(rectangle(Math.min(a[0],b[0])-12,Math.min(a[1],b[1])-12,Math.abs(a[0]-b[0])+24,Math.abs(a[1]-b[1])+24));}
  const maxLeft=Math.max(bounds.left,bounds.right-w),maxTop=Math.max(bounds.top,bounds.bottom-h),candidates=[];
  const add=(left,top)=>candidates.push(rectangle(Math.max(bounds.left,Math.min(maxLeft,left)),Math.max(bounds.top,Math.min(maxTop,top)),w,h));
  for(const left of [x+24,x-w-24,x-w/2])for(const top of [y+24,y-h-24,y-h/2])add(left,top);
  for(let left=bounds.left;left<=maxLeft;left+=24)for(let top=bounds.top;top<=maxTop;top+=24)add(left,top);
  for(const left of [bounds.left,maxLeft])for(const top of [bounds.top,maxTop])add(left,top);
  let best,score=Infinity;
  for(const r of candidates){const[ex,ey]=edge(r,x,y),distance=(x-ex)**2+(y-ey)**2,blocked=hard.reduce((n,b)=>n+overlap(r,b),0),guide=guides.reduce((n,b)=>n+overlap(r,b),0),cost=blocked*1e7+guide*30+distance+((r.left+w/2-x)**2+(r.top+h/2-y)**2)*.02;if(cost<score){score=cost;best=r;}}
  if(!best)return;context.style.left=best.left+'px';context.style.top=best.top+'px';const[ex,ey]=edge(best,x,y);s('.hr-leader').setAttribute('viewBox',`0 0 ${area.clientWidth} ${area.clientHeight}`);leader.style.stroke=comparing?'var(--hr-b)':'var(--hr-a)';leader.setAttribute('d',`M ${x} ${y} L ${ex} ${ey}`);
 }
 // Native details can finish their content layout after toggle dispatch. Measure
 // on the next frame, and again when the actual annotation size settles.
 function scheduleLayout(){if(!active||disposed||layoutFrame)return;layoutFrame=requestAnimationFrame(()=>{layoutFrame=0;placeContext();});}
 function render({state,drawing,example}){if(!active||!drawing)return;
  const comparing=state.hrCompare!=='none',controls=q('[data-controls]'),menu=controls.querySelector('.hr-compare-menu');
  controls.querySelector('.hr-choice').hidden=comparing;controls.querySelector('[data-hr-subject]').hidden=!comparing;controls.querySelector('.hr-exit').hidden=!comparing;
  if(lastComparison!==state.hrCompare&&lastComparison!==null){if(menu.open){menu.open=false;menu.querySelector('summary').focus({preventScroll:true});}s('.hr-relation').open=false;}
  lastComparison=state.hrCompare;
  menu.querySelector('summary').textContent=comparing?(state.hrCompare==='temperature'?'同温度 · 比光度':'同光度 · 比温度'):'关系比较';
  s('.hr-context-head h2').textContent=comparing?'A / B · 半径关系':example.name;
  s('.hr-context-kind').textContent=comparing?'固定太阳参照与构造示例':example.kind;
  const values=s('.hr-values');values.replaceChildren();
  for(const [i,p]of drawing.points.entries()){const row=document.createElement('p');row.className=i?'hr-value-b':'hr-value-a';const identity=document.createElement('span');identity.className='hr-value-name';identity.textContent=comparing?(i?(state.hrCompare==='temperature'?'B · 同温度':'B · 同光度'):'A · 太阳参照'):'';
   const numbers=document.createElement('span');numbers.textContent=`${format(p.temperature)} K · ${format(p.luminosity)} L☉`;
   const radius=document.createElement('strong');radius.textContent=`R = ${format(p.radius)} R☉`;row.append(identity,numbers,radius);values.append(row);
  }
  const names={sun:'太阳',hot:'热主序星',cool:'冷主序星',giant:'红巨星',supergiant:'红超巨星',dwarf:'白矮星'};
  if(labels.children.length!==drawing.hits.length){labels.replaceChildren();for(const p of drawing.hits){const b=document.createElement('button');b.type='button';b.dataset.hrObject=p.id;b.textContent=names[p.id];b.setAttribute('aria-label','选择'+names[p.id]+'，查看温度、光度和半径');labels.append(b);}}
  for(const p of drawing.hits){const b=labels.querySelector(`[data-hr-object="${p.id}"]`);b.hidden=comparing;b.setAttribute('aria-pressed',String(!comparing&&p.id===state.hrExample));const width=b.offsetWidth||75;b.style.left=Math.max(drawing.box.left,Math.min(drawing.box.right-width,p.x+14))+'px';b.style.top=Math.max(drawing.box.top,p.y+(p.id==='giant'?8:-25))+'px';}
  context.dataset.comparing=String(comparing);layoutModel={drawing,comparing};scheduleLayout();
  s('.hr-relation summary').textContent=comparing?'为什么半径不同？':'查看半径关系';
 }
 function closeDetails(details){if(details?.open){details.open=false;details.querySelector('summary')?.focus({preventScroll:true});}}
 const click=e=>{const b=e.target.closest('button[data-hr-object]');if(b){const input=q('[data-key="hrExample"]');input.value=b.dataset.hrObject;input.dispatchEvent(new Event('input',{bubbles:true}));}
  if(e.target.closest('[data-hr-close-info]'))closeDetails(s('.hr-info'));
  if(e.target.closest('[data-mode]'))closeDetails(s('.hr-mode-menu'));
 };
 const keydown=e=>{if(e.key!=='Escape')return;const opened=shell.querySelectorAll('details[open]');if(opened.length){e.preventDefault();closeDetails(opened[opened.length-1]);}};
 const toggle=e=>{if(!active)return;if(e.target===s('.hr-info')&&e.target.open)s('.hr-relation').open=false;if(e.target===s('.hr-relation')&&e.target.open)s('.hr-info').open=false;scheduleLayout();};
 const annotationObserver=new ResizeObserver(scheduleLayout);annotationObserver.observe(context);annotationObserver.observe(area);
 shell.addEventListener('click',click);shell.addEventListener('keydown',keydown);shell.addEventListener('toggle',toggle,true);
 // Wait for the existing editorial adapter and history restoration, then retain
 // their exact node locations so the four sibling modes return unchanged.
 const frame=requestAnimationFrame(()=>{if(disposed)return;ready=true;redraw();});
 return{setMode,render,suspend,dispose(){disposed=true;cancelAnimationFrame(frame);cancelAnimationFrame(layoutFrame);annotationObserver.disconnect();suspend();shell.removeEventListener('click',click);shell.removeEventListener('keydown',keydown);shell.removeEventListener('toggle',toggle,true);shell.remove();style.remove();}};
}
