// Venus-only presentation; no physical geometry, camera or clock is changed.
export function attachVenusUI(root,{redraw,space,earth,planet,sun}){
 const q=s=>root.querySelector(s),slots=new Map();let active=false,ready=false,disposed=false;
 const style=document.createElement('link');style.rel='stylesheet';style.href='/modules/alignments-venus-ui.css';root.append(style);
 const shell=document.createElement('section');shell.className='venus-shell';shell.hidden=true;
 shell.innerHTML='<header class="venus-header"><a href="/">← Lab</a><h1>金星的相位</h1><span>地球视线 · 几何受光</span><details class="venus-modes"><summary>金星相位 ⌄</summary><div data-venus-modes></div></details></header><div class="venus-body"></div><details class="venus-info"><summary>读图、模型与来源</summary><div><button type="button" data-venus-close>关闭说明 ×</button><div data-venus-info></div><a href="/sources/alignments.md" target="_blank" rel="noopener">原模型与来源 ↗</a></div></details>';
 q('.alignments-pilot').append(shell);const s=x=>shell.querySelector(x);
 const views=document.createElement('div');views.className='venus-views';
 const tools=document.createElement('div');tools.className='venus-tools';tools.innerHTML='<details class="venus-presets"><summary>构型预设</summary><div data-venus-presets></div></details><details class="venus-curve"><summary>展开受光比例关系</summary><div data-venus-curve><button type="button" data-venus-close>收起关系图 ×</button></div></details>';
 const presets=tools.querySelector('.venus-presets'),curve=tools.querySelector('.venus-curve');
 const clock=document.createElement('div');clock.className='venus-clock';clock.innerHTML='<div class="venus-time-actions"></div><p>理想圆轨道日数，无真实日期含义 · 播放 18 天/秒 · 复位至 72 天并暂停</p>';
 const boundary=document.createElement('p');boundary.className='venus-nearby';boundary.textContent='金星亮区表示几何受光；图像随距离缩放，最大显示尺寸设有上限。';
 const labels=document.createElementNS('http://www.w3.org/2000/svg','svg');labels.classList.add('venus-orbit-labels');labels.setAttribute('aria-hidden','true');
 for(const[name,color]of[['太阳','#ebc77e'],['地球','#89b7dd'],['金星','#71c8c7']]){const g=document.createElementNS(labels.namespaceURI,'g');g.innerHTML=`<path stroke="${color}"/><text fill="${color}">${name}</text>`;labels.append(g);}
 const closeButton=document.createElement('button');closeButton.type='button';closeButton.dataset.venusClose='';closeButton.textContent='关闭几何条件 ×';
 function move(node,host){if(!node||slots.has(node))return;const slot=document.createComment('venus return');node.before(slot);slots.set(node,slot);host.append(node);}
 function suspend(){if(!active)return;active=false;for(const[node,slot]of[...slots].reverse())slot.replaceWith(node);slots.clear();for(const n of[views,tools,clock,boundary,labels,closeButton,curve,presets])n.remove();tools.append(presets,curve);root.classList.remove('venus-active');q('.alignments-pilot')?.classList.remove('venus-active');document.body.classList.remove('venus-observing');shell.hidden=true;}
 function setMode(mode){if(!ready||disposed)return;if(mode!=='venus'){suspend();return;}if(active)return;active=true;root.classList.add('venus-active');q('.alignments-pilot').classList.add('venus-active');document.body.classList.add('venus-observing');shell.hidden=false;
  move(q('.alignment-workspace'),s('.venus-body'));q('.alignment-workspace').prepend(views);move(q('.alignment-observer-view'),views);move(q('.alignment-orbit-view'),views);
  move(q('#alignment-metrics'),q('.alignment-observer-view'));q('#alignment-observed').before(q('#alignment-metrics'));q('.alignment-observer-view').append(boundary);q('#alignment-space').append(labels);move(q('#alignment-legend'),q('.alignment-orbit-view'));
  move(q('.lab-tabs'),s('[data-venus-modes]'));for(const n of[q('#alignment-guide')?.closest('[data-learning-guide]')||q('#alignment-guide'),q('#alignment-reading-details'),q('[data-mode-boundary]')])move(n,s('[data-venus-info]'));
  q('.alignment-observer-view').append(clock);move(q('#alignment-day-control'),clock);clock.prepend(q('#alignment-day-control'));
  for(const id of['alignment-play','alignment-reset'])move(q('#'+id),clock.querySelector('.venus-time-actions'));
  q('.alignment-primary-controls').append(tools);move(q('#alignment-presets'),tools.querySelector('[data-venus-presets]'));move(q('.alignment-plot-view'),tools.querySelector('[data-venus-curve]'));move(q('#alignment-orbit-details'),q('.alignment-orbit-view'));q('#alignment-orbit-details').append(closeButton);q('.alignment-orbit-view').append(curve);clock.append(presets);
 }
 function labelGeometry(){if(!active)return;const host=q('#alignment-space'),w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;labels.setAttribute('viewBox',`0 0 ${w} ${h}`);const taken=[];
  for(const[obj,index]of[[sun,0],[earth,1],[planet,2]]){const p=obj.position.clone().project(space.camera),x=(p.x+1)*w/2,y=(1-p.y)*h/2,g=labels.children[index];g.style.display=p.z<-1||p.z>1?'none':'';
   const candidates=index===0?[[12,22],[-48,22],[12,-18]]:index===1?[[8,-24],[-48,-24],[8,35]]:[[8,30],[-48,30],[8,-42]],clamp=(n,a,b)=>Math.max(a,Math.min(b,n));let bx,by;
   for(const[dx,dy]of candidates){bx=clamp(x+dx,5,w-49);by=clamp(y+dy,18,h-8);if(!taken.some(r=>Math.abs(r.x-bx)<52&&Math.abs(r.y-by)<22))break;}taken.push({x:bx,y:by});g.querySelector('text').setAttribute('x',bx);g.querySelector('text').setAttribute('y',by);g.querySelector('path').setAttribute('d',`M ${x} ${y} L ${bx+16} ${by-10}`);
  }
 }
 function close(d){if(d?.open){d.open=false;d.querySelector('summary')?.focus({preventScroll:true});const view=q('#alignment-observed');if(view.getBoundingClientRect().top<0)view.scrollIntoView({block:'start'});}}
 const click=e=>{if(e.target.closest('[data-venus-close]'))close(e.target.closest('details'));if(e.target.closest('[data-mode]'))close(s('.venus-modes'));};
 const keydown=e=>{if(e.key!=='Escape'||!active||q('dialog[open]'))return;const list=root.querySelectorAll('.venus-shell details[open]');if(list.length){e.preventDefault();close(list[list.length-1]);}};
 root.addEventListener('click',click);root.addEventListener('keydown',keydown);const frame=requestAnimationFrame(()=>{if(!disposed){ready=true;redraw();}});
 return{setMode,beforeMode:suspend,labelGeometry,dispose(){disposed=true;cancelAnimationFrame(frame);suspend();root.removeEventListener('click',click);root.removeEventListener('keydown',keydown);shell.remove();style.remove();}};
}
