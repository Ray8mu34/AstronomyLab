import {startStarsPresentation} from './stars-atlas-ui.js';
import {getGraphicStyle} from '../shared/presentation.js';
// Local presentation only. Native controls, pulsarSignal, clock and baseline remain owned by stars.js.
export function attachPulsarUI(root,{redraw,getScene}){
 const q=s=>root.querySelector(s),slots=new Map(),texts=new Map(),sprites=new Map();let active=false,ready=false,disposed=false,drawing=null,frame=0,releasePresentation=()=>{};
 const style=document.createElement('link');style.rel='stylesheet';style.href='/modules/stars-pulsar-ui.css';root.append(style);
 const shell=document.createElement('section');shell.className='pulsar-shell';shell.hidden=true;
 shell.innerHTML=`<details class="pulsar-modes"><summary>脉冲星灯塔</summary><div data-pulsar-modes></div></details><div class="stars-atlas-heading"><p>脉冲星 · 同一相位的空间与信号</p><h1>什么时候，旋转的星会向你闪一下？</h1></div><div class="pulsar-stage"></div>`;
 root.append(shell);
 const extras=document.createElement('div');extras.className='pulsar-bottom';extras.innerHTML=`<div class="pulsar-clock"><div data-pulsar-phase></div><div class="pulsar-clock-actions"></div><p>相位 φ：一周 = 1。教学慢放：每 4 秒一周；不按物理周期播放。复位回到单束扫过、φ = 0，并重置基线与视角。</p></div><div class="pulsar-tools"><details class="pulsar-presets"><summary>扫过方式</summary><div data-pulsar-presets><button type="button" data-pulsar-close>关闭预设 ×</button></div></details><details class="pulsar-conditions"><summary>几何与真实周期</summary><div class="pulsar-condition-inputs"></div><p>α：磁轴与自转轴；ζ：固定视线与自转轴；ρ：束半角。物理周期决定真实频率，不改变这一周的几何形状，也不改变慢放速率。</p><button type="button" data-pulsar-close>关闭条件 ×</button></details><details class="pulsar-compare"><summary>比较基线</summary><p data-pulsar-baseline></p><div class="pulsar-baseline-actions"></div><div data-pulsar-comparison></div><p>两条曲线使用同一个 φ 坐标；当前点只标当前几何。保存基线保留原参数；回到基线恢复参数与相位并暂停。</p><button type="button" data-pulsar-close>结束比较 ×</button></details><details class="pulsar-info"><summary>模型、读数与来源</summary><div data-pulsar-info></div><button type="button" data-pulsar-close>关闭说明 ×</button></details></div>`;
 const primary=document.createElement('div');primary.className='pulsar-primary';const context=document.createElement('p');context.className='pulsar-context';context.setAttribute('data-pulsar-current','');
 const caption=document.createElement('p');caption.className='pulsar-curve-caption';
 const boundary=document.createElement('div');boundary.className='pulsar-boundary';
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('pulsar-labels');svg.setAttribute('aria-hidden','true');svg.innerHTML=['自转轴','磁轴与两束','固定观察者'].map((name,i)=>`<g class="pulsar-label-${i}"><path/><text>${name}</text></g>`).join('');
 const s=x=>shell.querySelector(x),b=x=>extras.querySelector(x);
 function move(node,target){if(!node||slots.has(node))return;const slot=document.createComment('Pulsar return');node.before(slot);slots.set(node,slot);target.append(node);}
 function text(node,value){if(node&&!texts.has(node))texts.set(node,node.textContent);if(node)node.textContent=value;}
 function suspend(){if(!active)return;active=false;releasePresentation();releasePresentation=()=>{};drawing=null;cancelAnimationFrame(frame);frame=0;for(const[node,visible]of sprites)node.visible=visible;sprites.clear();svg.remove();for(const[node,old]of texts)node.textContent=old;texts.clear();for(const[node,slot]of [...slots].reverse())slot.replaceWith(node);slots.clear();primary.remove();extras.remove();context.remove();caption.remove();boundary.remove();root.classList.remove('pulsar-active');document.body.classList.remove('pulsar-observing');shell.hidden=true;}
 function setMode(mode){if(!ready||disposed)return;if(mode!=='pulsar'){suspend();return;}if(active)return;active=true;root.classList.add('pulsar-active');document.body.classList.add('pulsar-observing');shell.hidden=false;
  move(q('.lab-tabs'),s('[data-pulsar-modes]'));releasePresentation=startStarsPresentation(root,shell,{surface:'scene',modeNav:s('.pulsar-modes'),redraw});move(q('.stars-workbench'),s('.pulsar-stage'));q('.stars-visuals').append(extras);
  q('.stars-scene-panel').append(boundary);q('.stars-chart-panel').append(caption);
  q('[data-scene]').append(svg,context);getScene().pulseGroup.traverse(node=>{if(node.isSprite){sprites.set(node,node.visible);node.visible=false;}});frame=requestAnimationFrame(annotate);
  q('.stars-views').before(primary);const host=q('[data-controls]');move(host.querySelector('[data-key=phase]')?.closest('label'),b('[data-pulsar-phase]'));for(const key of ['alpha','zeta','width','period'])move(host.querySelector(`[data-key=${key}]`)?.closest('label'),['alpha','zeta'].includes(key)?primary:b('.pulsar-condition-inputs'));
  text(b('[data-key=period]')?.closest('label').querySelector('small'),'s · 实际自转周期；慢放速率不变');
  move(q('[data-play]'),b('.pulsar-clock-actions'));move(q('[data-reset]'),b('.pulsar-clock-actions'));move(host.querySelector('.stars-presets'),b('[data-pulsar-presets]'));
  for(const key of ['save','restore'])move(q(`[data-${key}]`),b('.pulsar-baseline-actions'));move(q('[data-comparison]'),b('[data-pulsar-comparison]'));
  for(const node of[q('[data-metrics]'),q('.stars-detailed'),host.querySelector('.stars-advanced'),q('.stars-question'),q('.stars-explanation'),q('.stars-links'),q('.stars-start')?.closest('.experiment-explanation'),q('[data-focus-open]'),q('[data-camera-reset]'),q('[data-legend]'),q('[data-plot-legend]'),q('[data-feedback]')])move(node,b('[data-pulsar-info]'));
 }
 function annotate(){if(!active||disposed)return;const {view,pulseGroup}=getScene(),host=q('[data-scene]'),w=host.clientWidth,h=host.clientHeight,placed=[];pulseGroup.updateMatrixWorld(true);view.camera.updateMatrixWorld();svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
  [...sprites.keys()].forEach((node,i)=>{const p=node.getWorldPosition(node.position.clone()).project(view.camera),x=(p.x+1)*w/2,y=(1-p.y)*h/2,g=svg.children[i],t=g.querySelector('text'),labelWidth=i===2?84:70,candidates=[];
   for(const dx of[14,-labelWidth-14])for(const dy of[-22,14,40]){const left=Math.max(8,Math.min(w-labelWidth-8,x+dx)),top=Math.max(18,Math.min(h-28,y+dy));let score=(left-x)**2+(top-y)**2;for(const old of placed)if(left<old.x+old.w+8&&left+labelWidth+8>old.x&&top-14<old.y+8&&top+8>old.y-14)score+=1e6;candidates.push({x:left,y:top,w:labelWidth,score});}const pos=candidates.sort((a,b)=>a.score-b.score)[0];placed.push(pos);t.setAttribute('x',pos.x);t.setAttribute('y',pos.y);g.querySelector('path').setAttribute('d',`M ${Math.max(4,Math.min(w-4,x))} ${Math.max(4,Math.min(h-4,y))} L ${pos.x+labelWidth/2} ${pos.y-5}`);
  });frame=requestAnimationFrame(annotate);
 }
 function render({state,result,baseline,plotDrawing}){if(!active)return;drawing=plotDrawing;
  const nativeBoundary=q('[data-mode-boundary]');if(nativeBoundary&&!slots.has(nativeBoundary)){boundary.textContent='球体与束长非同比例。';move(nativeBoundary,boundary);}
  context.textContent=`${result.visible?'束内可见':'束外 · 零信号'}　·　φ ${Number(state.phase).toFixed(3)} 周`;
  q('[data-scene-title]').textContent='双束扫过固定观察者';q('[data-plot-title]').textContent='同一相位下收到什么？';
  caption.textContent=`金：当前几何 α ${state.alpha}° / ζ ${state.zeta}° / ρ ${state.width}°${b('.pulsar-compare').open?'　蓝灰：保存的基线':''}　·　青：当前相位与信号　｜　真实周期 ${Number(state.period).toFixed(3)} s · ${(1/Number(state.period)).toFixed(2)} Hz`;
  b('[data-pulsar-baseline]').textContent=`保存的基线：α ${baseline.alpha}° / ζ ${baseline.zeta}° / ρ ${baseline.width}°；P ${Number(baseline.period).toFixed(3)} s，φ ${Number(baseline.phase).toFixed(3)} 周。`;
  q('[data-plot]').setAttribute('aria-label','一周几何相对强度，横轴为相位零到一周；点击或拖动曲线设置相位，也可使用下方相位滑块');
  if(drawing){const [x,y]=drawing.toPixel(state.phase,result.intensity),c=q('[data-plot]').getContext('2d');const graphic=getGraphicStyle(q('[data-plot]'));c.save();c.fillStyle=graphic.teal;c.strokeStyle=graphic.background;c.lineWidth=2;c.beginPath();c.arc(x,y,5,0,Math.PI*2);c.fill();c.stroke();c.restore();}
 }
 const close=detail=>{if(detail?.open){detail.open=false;detail.querySelector('summary')?.focus({preventScroll:true});}};
 const click=e=>{if(e.target.closest('[data-pulsar-close]'))close(e.target.closest('details'));if(e.target.closest('[data-mode]'))close(s('.pulsar-modes'));};
 const canvas=q('[data-plot]');let dragging=false;
 const scrub=e=>{if(!active||!drawing)return;const r=canvas.getBoundingClientRect(),[left]=drawing.toPixel(0,0),[right]=drawing.toPixel(1,0),phase=Math.max(0,Math.min(1,(e.clientX-r.left-left)/(right-left))),input=q('[data-key=phase]');input.value=String(phase);input.dispatchEvent(new Event('input',{bubbles:true}));};
 const down=e=>{if(!active||e.button!==0)return;dragging=true;canvas.setPointerCapture(e.pointerId);scrub(e);};const motion=e=>{if(dragging)scrub(e);};const up=()=>{dragging=false;};
 root.addEventListener('click',click);canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',motion);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
 const init=requestAnimationFrame(()=>{ready=true;if(!disposed)redraw();});
 return{setMode,suspend,render,get comparing(){return active&&b('.pulsar-compare').open;},dispose(){disposed=true;cancelAnimationFrame(init);suspend();root.removeEventListener('click',click);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',motion);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);extras.remove();shell.remove();style.remove();}};
}
