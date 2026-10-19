// Presentation only. Original process owner retains all equations, clocks, events and inputs.
export function attachProcessUI(root){
 const pilot=root.closest('.orbits-pilot'),slots=new Map();let active=false,disposed=false,openState={};
 const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('./landing-staging-ui.css',import.meta.url).href;document.head.append(style);
 const q=s=>root.querySelector(s);
 function move(node,target){if(!node||!target)return;if(!slots.has(node)){const marker=document.createComment('process presentation return');node.before(marker);slots.set(node,marker);}if(node.parentNode!==target)target.append(node);}
 function release(){for(const[node,marker]of[...slots].reverse()){if(marker.isConnected)marker.replaceWith(node);}slots.clear();}
 function preserveGuide(){const guide=pilot?.querySelector('.orbits-guide');if(guide&&root.contains(guide))pilot.append(guide);}
 function beforeBuild(partial){
  openState=Object.fromEntries([...root.querySelectorAll('details')].map(d=>[d.dataset.processDisclosure||d.className,d.open]));
  // Native partial rebuild replaces process/timeline only. Return its budget, keep dragging inputs in place.
  if(partial){for(const s of['.ls-budget','.ls-series-key']){const n=q(s),m=slots.get(n);if(m?.isConnected){m.replaceWith(n);slots.delete(n);}}return;}
  // The legacy editorial pass places the original guide after tabs. Keep it outside this rebuilt owner.
  preserveGuide();
  release();active=false;root.classList.remove('ls-reduced');pilot?.classList.remove('process-active');document.body.classList.remove('process-observing');
 }
 function sync(mode){
  if(disposed||!['staging','landing'].includes(mode))return;
  active=true;root.classList.add('ls-reduced');pilot?.classList.add('process-active');document.body.classList.add('process-observing');
  if(!q('.process-header')){
   const land=mode==='landing',header=document.createElement('header');header.className='process-header';header.innerHTML=`<a href="/">← Lab</a><h1>${land?'点火与着陆':'分级火箭'}</h1><details class="process-modes" data-process-disclosure="modes"><summary>${land?'着陆过程':'分级预算'} ⌄</summary><div data-process-modes></div></details>`;root.prepend(header);move(pilot?.querySelector('.lab-tabs'),q('[data-process-modes]'));
   const clock=document.createElement('div');clock.className='process-clock';q('.ls-process').before(clock);for(const s of['.ls-transport','.ls-scrubber','.ls-timeline'])move(q(s),clock);
   const note=document.createElement('p');note.className='process-time-note';note.textContent='模型经过时间 · 倍率为模型秒/实秒。重置返回默认参数与 0 s，并暂停。';clock.append(note);
   const advanced=q('.ls-details:not(.ls-explanation)');advanced.dataset.processDisclosure='conditions';
   let budget;
   if(land){
    const presets=document.createElement('details');presets.className='process-presets';presets.dataset.processDisclosure='presets';presets.innerHTML='<summary>点火时机 ⌄</summary>';clock.before(presets);move(q('.ls-presets'),presets);move(q('.ls-main-control'),clock);
    const semantic=document.createElement('p');semantic.className='process-landing-note';semantic.textContent='向上为正 · 同时观察速度与离地高度，判断点火时机。';q('.ls-process').before(semantic);
   }else{
    move(q('.ls-main-control'),advanced);budget=document.createElement('details');budget.className='process-budget';budget.dataset.processDisclosure='budget';budget.innerHTML='<summary>各级 Δv 分解 · 同时刻预算</summary>';advanced.before(budget);
   }
   for(const d of[advanced,q('.ls-explanation'),budget].filter(Boolean)){const b=document.createElement('button');b.type='button';b.dataset.processClose='';b.textContent='关闭 ×';d.append(b);}
   q('.ls-explanation').dataset.processDisclosure='explanation';
   for(const d of root.querySelectorAll('details'))if(openState[d.dataset.processDisclosure||d.className])d.open=true;
  }
  move(q('.ls-budget'),q('.process-budget'));move(q('.ls-series-key'),q('.ls-charts'));
  if(mode==='landing'){const selected=q('.ls-presets [aria-pressed=true]');q('.process-presets>summary').textContent=`${selected?selected.textContent+'预设':'手调点火高度'} · 点火时机 ⌄`;}
 }
 function close(d){if(!d?.open)return;d.open=false;d.querySelector('summary')?.focus({preventScroll:true});}
 const click=e=>{if(!active)return;if(e.target.closest('[data-process-close]'))close(e.target.closest('details'));if(e.target.closest('[data-mode]'))close(q('.process-modes'));if(e.target.closest('[data-action=early],[data-action=critical],[data-action=late]')){close(q('.process-presets'));requestAnimationFrame(()=>{if(!disposed)q('.process-presets>summary')?.focus({preventScroll:true});});}};
 const key=e=>{if(!active||e.key!=='Escape')return;const ds=[...root.querySelectorAll('details[open]')].filter(d=>d.checkVisibility());const nearest=e.target.closest?.('details[open]');const d=ds.includes(nearest)?nearest:ds.at(-1);if(d){e.preventDefault();close(d);}};
 root.addEventListener('click',click);root.addEventListener('keydown',key);
 return{beforeBuild,sync,dispose(){disposed=true;preserveGuide();release();active=false;document.body.classList.remove('process-observing');pilot?.classList.remove('process-active');root.removeEventListener('click',click);root.removeEventListener('keydown',key);style.remove();}};
}
