import {applyPresentation,bindDisclosures,getGraphicStyle} from '../shared/presentation.js';
import {mountWorkspaceNavigation} from '../shared/navigation.js';
import {bindControls,syncControls,startVisibleLoop} from '../shared/core-controls.js';
import {registerExperimentModel} from '../shared/experiment-state.js';
import {plot} from '../shared/plot.js';
import {TIDE_MODES,TIDE_CONTROL_KEYS,defaultTideState,validateTideState,createTideTrajectory} from './tides-physics.mjs';

const names={locking:'月球锁定','earth-moon':'地月演化'};
const number=(value,digits=3)=>Number(Math.abs(value)<1e-12?0:value).toFixed(digits);
const signed=value=>(value>1e-8?'+':'')+number(value,2);
const cut=rows=>rows.filter((_,i)=>i%Math.max(1,Math.ceil(rows.length/400))===0||i===rows.length-1);

function panel(mode){
 const spec=TIDE_MODES[mode],p=spec.prefix,moon=mode==='locking';
 return `<section class="tides-panel" data-tide-panel="${mode}" ${moon?'':'hidden'} aria-label="${names[mode]}">
  <header class="tides-heading"><div><p class="tides-identity">圆轨道平均模型</p><h1>${moon?'月球的同步自转':'地月角动量交换'}</h1></div><details class="al-info-tip"><summary aria-label="${names[mode]}图形比例与参考系" aria-describedby="${p}-geometry-tip"><span aria-hidden="true">i</span></summary><p id="${p}-geometry-tip" role="tooltip">地月连线共转视角；天体尺寸、形变和滞后角放大显示。${moon?'圆点标记同一处月面。':'月球位置随轨道尺度变化。'}</p></details></header>
  <div class="tides-initial">
   <label class="al-parameter" for="${p}-spin"><span>${moon?'月球':'地球'}初始转速 Ω₀ / n₀ <output data-value="${p}Spin" for="${p}-spin"></output></span><input id="${p}-spin" data-key="${p}Spin" type="range" min="${spec.spinMin}" max="${spec.spinMax}" step="0.1"></label>
   <div class="tides-presets" role="group" aria-label="${names[mode]}初始条件"><button class="al-button" data-preset="${mode}:fast">${moon?'快速自转':'当前转速比'}</button><button class="al-button" data-preset="${mode}:sync">同步</button><button class="al-button" data-preset="${mode}:slow">慢速自转</button></div>
  </div>
  <div class="tides-observation">
   <figure class="tides-geometry"><canvas data-scene role="img" aria-label="形变与潮汐力矩"></canvas><figcaption><span>${moon?'月球':'地球'} Ω / n <output data-ratio></output></span><span>a / a₀ <output data-radius></output></span></figcaption><div class="tides-timeline"><label class="al-parameter" for="${p}-time"><span>演示时间 τ <output data-value="${p}Time" for="${p}-time"></output></span><input id="${p}-time" data-key="${p}Time" type="range" min="0" max="${spec.horizon}" step="0.1"></label></div></figure>
   <div class="tides-relations"><figure><canvas data-motion-chart role="img" aria-label="${moon?'自转与公转角速度比随模型时间的变化':'自转、轨道及总角动量随模型时间的变化'}"></canvas></figure><figure><canvas data-energy-chart role="img" aria-label="自转能、轨道能与热的变化"></canvas></figure></div>
  </div>
  <div class="tides-current" aria-live="off"><span>自转 ΔE <output data-spin-energy></output></span><span>轨道 ΔE <output data-orbit-energy></output></span><span>热 Q <output data-heat></output><span class="tides-unit">I n₀²</span></span></div>
 </section>`;
}

function canvasContext(canvas){
 const width=Math.max(1,canvas.clientWidth),height=Math.max(1,canvas.clientHeight),win=canvas.ownerDocument.defaultView,dpr=Math.min(win.devicePixelRatio||1,2);
 canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
 const c=canvas.getContext('2d'),style=getGraphicStyle(canvas);c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle=style.background;c.fillRect(0,0,width,height);
 c.font=style.labelFont;c.lineCap='round';c.lineJoin='round';c.textBaseline='middle';return{c,width,height,style};
}
function arrow(c,x1,y1,x2,y2,color,width=2){
 const angle=Math.atan2(y2-y1,x2-x1),head=8;c.strokeStyle=color;c.fillStyle=color;c.lineWidth=width;
 c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.beginPath();c.moveTo(x2,y2);c.lineTo(x2-head*Math.cos(angle-.5),y2-head*Math.sin(angle-.5));c.lineTo(x2-head*Math.cos(angle+.5),y2-head*Math.sin(angle+.5));c.closePath();c.fill();
}
function arcArrow(c,cx,cy,r,start,end,color,width=2){
 const points=Array.from({length:35},(_,i)=>{const a=start+(end-start)*i/34;return[cx+r*Math.cos(a),cy-r*Math.sin(a)];});
 c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();arrow(c,...points.at(-2),...points.at(-1),color,width);
}
function label(c,text,x,y,style,align='center'){
 c.textAlign=align;c.fillStyle=style.text;c.font=style.labelFont;c.fillText(text,x,y);
}
function drawScene(canvas,mode,s,path){
 const {c,width:w,height:h,style}=canvasContext(canvas),moon=mode==='locking';
 const radius=Math.min(88,w*.18),cx=w*(moon?.29:.25),cy=h*.48;
 const separation=moon?w*.55:w*.44*s.x/1.5,otherX=cx+separation,otherR=moon?Math.min(29,w*.07):Math.min(19,w*.045);
 const slip=s.u-s.n,sign=Math.abs(slip)<1e-7?0:Math.sign(slip),lag=.42*Math.tanh(slip/(moon?1:8)),elongation=.14/(s.x**3);
 c.strokeStyle=style.grid;c.lineWidth=1;c.setLineDash([5,6]);c.beginPath();c.moveTo(Math.max(12,cx-radius*1.4),cy);c.lineTo(w-12,cy);c.stroke();c.setLineDash([]);
 if(!moon){
  const initialX=cx+w*.44/1.5;c.strokeStyle=style.grid;c.setLineDash([2,5]);c.beginPath();c.moveTo(initialX,cy-52);c.lineTo(initialX,cy+52);c.stroke();c.setLineDash([]);
  label(c,'a₀',initialX,cy+70,style);
 }
 // The shape responds to the tide; the marked material rotates through it.
 c.save();c.translate(cx,cy);c.rotate(-lag);c.fillStyle=moon?style.grid:style.accent;c.globalAlpha=moon?.42:.16;
 c.beginPath();c.ellipse(0,0,radius*(1+elongation),radius*(1-elongation),0,0,Math.PI*2);c.fill();c.globalAlpha=1;c.lineWidth=2;c.strokeStyle=moon?style.muted:style.accent;c.stroke();
 c.strokeStyle=style.accent;c.lineWidth=1.5;c.beginPath();c.moveTo(-radius*(1+elongation)-10,0);c.lineTo(radius*(1+elongation)+10,0);c.stroke();c.restore();
 if(moon){
  const theta=s.relativeAngle;c.fillStyle=style.text;c.beginPath();c.arc(cx+radius*.65*Math.cos(theta),cy-radius*.65*Math.sin(theta),7,0,Math.PI*2);c.fill();
  // Two unequal, body-fixed patches make a full rotation perceptible.
  c.save();c.translate(cx,cy);c.rotate(-theta);c.strokeStyle=style.muted;c.lineWidth=1.1;c.beginPath();c.ellipse(-radius*.3,-radius*.25,radius*.18,radius*.11,.5,0,Math.PI*2);c.stroke();c.beginPath();c.arc(radius*.1,radius*.4,radius*.1,0,Math.PI*2);c.stroke();c.restore();
 }else{
  c.strokeStyle=style.accent;c.globalAlpha=.5;c.lineWidth=1;c.beginPath();c.ellipse(cx,cy,radius*.33,radius*.78,0,0,Math.PI*2);c.stroke();c.beginPath();c.ellipse(cx,cy,radius*.78,radius*.28,0,0,Math.PI*2);c.stroke();c.globalAlpha=1;
 }
 c.fillStyle=moon?style.accent:style.grid;c.beginPath();c.arc(otherX,cy,otherR,0,Math.PI*2);c.fill();c.strokeStyle=moon?style.accent:style.muted;c.lineWidth=1.2;c.stroke();
 label(c,moon?'月球':'地球',cx,cy+radius+29,style);label(c,moon?'地球':'月球',otherX,cy+otherR+27,style);
 if(sign){
  const start=sign>0?Math.PI*.72:Math.PI*.24,end=sign>0?Math.PI*.24:Math.PI*.72;
  arcArrow(c,cx,cy,radius*1.35,start,end,style.text,2.3);
  label(c,'τ自转',cx,cy-radius*1.35-22,style);
  const orbitX=moon?cx:otherX,dir=moon?sign:-sign;
  arrow(c,orbitX+radius*(moon?-1.45:.45),cy-dir*27,orbitX+radius*(moon?-1.45:.45),cy+dir*27,style.accent,2.3);
  label(c,'τ轨道',moon?14:orbitX+radius*.45,cy+dir*43,style,moon?'left':'center');
 }else label(c,'力矩 = 0',cx,cy-radius*1.4-15,style);
 if(Math.abs(lag)>.015){
  c.strokeStyle=style.accent;c.lineWidth=1;c.beginPath();c.arc(cx,cy,radius*.48,0,-lag,lag>0);c.stroke();label(c,'δ',cx+radius*.61,cy-radius*.61*Math.sin(lag/2)-9,style);
 }
 // A shared orientation reference makes arrow direction explicit.
 arcArrow(c,w-43,37,13,-Math.PI*.6,Math.PI*.8,style.muted,1.3);label(c,'公转',w-43,68,style);
 label(c,'地月连线共转视角',14,24,style,'left');
 if(!moon){
  const y=h-30;c.strokeStyle=style.muted;c.lineWidth=1;c.beginPath();c.moveTo(cx,y-5);c.lineTo(cx,y+5);c.moveTo(cx,y);c.lineTo(otherX,y);c.moveTo(otherX,y-5);c.lineTo(otherX,y+5);c.stroke();label(c,'a',cx+separation/2,y-13,style);
 }
 const description=`${moon?'月球':'地球'}自转角速度为公转的${number(s.ratio)}倍，轨道半径为初始的${number(s.x,5)}倍。${sign>0?'自转力矩顺时针，轨道获得角动量。':sign<0?'自转力矩逆时针，轨道交出角动量。':'自转与公转同步，力矩为零。'}`;
 canvas.setAttribute('aria-label',description);
}
function cursor(canvas,chart,time,values,colors){
 const c=canvas.getContext('2d'),{bounds,toPixel,style}=chart,[x]=toPixel(time,0);c.strokeStyle=style.muted;c.lineWidth=1;c.setLineDash([3,4]);c.beginPath();c.moveTo(x,bounds.y);c.lineTo(x,bounds.y+bounds.height);c.stroke();c.setLineDash([]);
 values.forEach((y,i)=>{const [,py]=toPixel(time,y);if(py<bounds.y-1||py>bounds.y+bounds.height+1)return;c.fillStyle=colors[i];c.beginPath();c.arc(x,py,4.2,0,Math.PI*2);c.fill();});
}
function drawCharts(panel,mode,s,path){
 const motion=panel.querySelector('[data-motion-chart]'),energy=panel.querySelector('[data-energy-chart]'),style=getGraphicStyle(motion),rows=cut(path.samples),moon=mode==='locking';
 let series,ys,domain;
 if(moon){
  series=[{points:rows.map(v=>[v.time,v.ratio]),color:style.text,label:'Ω / n'},{points:[[0,1],[path.horizon,1]],color:style.accent,label:'同步',dash:[5,5]}];ys=[s.ratio,1];domain=[0,Math.max(1.3,path.spin*1.08)];
 }else{
  series=[{points:rows.map(v=>[v.time,v.spinJ/v.totalJ]),color:style.text,label:'自转'},{points:rows.map(v=>[v.time,v.orbitJ/v.totalJ]),color:style.accent,label:'轨道'},{points:[[0,1],[path.horizon,1]],color:style.muted,label:'合计',dash:[5,5]}];ys=[s.spinJ/s.totalJ,s.orbitJ/s.totalJ,1];domain=[0,1.08];
 }
 const xTicks=[0,path.horizon/2,path.horizon],yTicks=moon?(path.spin<=1?[0,.5,1]:[0,1,2,3,4]):[0,.5,1];
 const chart=plot(motion,{series,xDomain:[0,path.horizon],yDomain:domain,xTicks,yTicks,xLabel:'演示时间 τ',yLabel:moon?'角速度比':'角动量 / L总',margins:{left:60,right:20,bottom:60},onFontReady:false});cursor(motion,chart,s.time,ys,moon?[style.text,style.accent]:[style.text,style.accent,style.muted]);
 const evalues=rows.flatMap(v=>[v.spinChange/path.lambda,v.orbitChange/path.lambda,v.heat/path.lambda]),extent=Math.max(.01,...evalues.map(Math.abs)),power=10**Math.floor(Math.log10(extent)),limit=Math.ceil(extent/power)*power;
 const eSeries=[{label:'自转',color:style.text,points:rows.map(v=>[v.time,v.spinChange/path.lambda])},{label:'轨道',color:style.accent,points:rows.map(v=>[v.time,v.orbitChange/path.lambda])},{label:'热',color:style.muted,dash:[5,4],points:rows.map(v=>[v.time,v.heat/path.lambda])}];
 const ec=plot(energy,{series:eSeries,xDomain:[0,path.horizon],yDomain:[-limit*1.1,limit*1.1],xTicks,yTicks:[-limit,-limit/2,0,limit/2,limit],xLabel:'演示时间 τ',yLabel:'能量变化 / I n₀²',margins:{left:60,right:20,bottom:60},onFontReady:false});cursor(energy,ec,s.time,[s.spinChange/path.lambda,s.orbitChange/path.lambda,s.heat/path.lambda],[style.text,style.accent,style.muted]);
}

export async function mount(el,{mode='locking',signal}={}){
 if(signal?.aborted)return()=>{};
 const state=defaultTideState(mode),cache=new Map(),root=el.ownerDocument.createElement('section');root.className='tides-lab';
 root.innerHTML=`<div class="al-mode-nav" aria-label="潮汐模式">${Object.entries(names).map(([id,label])=>`<button type="button" data-mode="${id}" aria-pressed="false">${label}</button>`).join('')}</div><button class="al-action tides-play" type="button" data-play aria-pressed="false">播放演化</button><button class="al-button" type="button" data-reset>回到起点</button>${panel('locking')}${panel('earth-moon')}
 <details class="al-disclosure tides-method" data-learning-guide><summary>条件、方程与来源</summary><div class="tides-condition-controls">${Object.entries(TIDE_MODES).map(([id,spec])=>`<label class="al-parameter" data-condition-mode="${id}" for="${spec.prefix}-coupling"><span>演示耗散系数 κ <output data-value="${spec.prefix}Coupling" for="${spec.prefix}-coupling"></output></span><input id="${spec.prefix}-coupling" data-key="${spec.prefix}Coupling" type="range" min="0.01" max="0.08" step="0.01"></label>`).join('')}</div><p data-mode-boundary></p><p>近圆、共面轨道，转动惯量固定。地月质量、半径与转动惯量系数采用 NASA 参数；每种模式只包含其中一个天体的耗散自转与地月相对轨道。</p><p>令 x = a / a₀，u = Ω / n₀，λ = I / (μ a₀²)。μ 为约化质量，n₀ 为初始公转角速度，τ = n₀t。</p><div class="tides-equations">n / n₀ = x<sup>−3/2</sup><br>du / dτ = −κ (u − x<sup>−3/2</sup>) x<sup>−6</sup><br>√x + λu = 1 + λu₀<br>dE / dt = −τ轨道 (Ω − n)</div><p>κ 设定演示中的耗散强度；图中时间轴描述这组固定参数下的模型演化。形变与滞后角按符号和相对大小放大呈现，月面标记按积分所得的相对转角移动。轨道半径由角动量守恒求出；三条能量曲线满足 ΔE自转 + ΔE轨道 + Q = 0。</p><p><a href="/sources/tides.md" target="_blank" rel="noopener">完整推导、数值参数与来源 ↗</a></p></details>`;
 el.append(root);let disposed=false,playing=false,stopClock=null;
 const q=selector=>root.querySelector(selector),panels=new Map([...root.querySelectorAll('[data-tide-panel]')].map(p=>[p.dataset.tidePanel,p]));
 function trajectory(id){const p=TIDE_MODES[id].prefix,spin=state[p+'Spin'],coupling=state[p+'Coupling'],old=cache.get(id);if(old?.spin===spin&&old?.coupling===coupling)return old;const path=createTideTrajectory(id,spin,coupling);cache.set(id,path);return path;}
 function render(){
  if(disposed||!root.isConnected)return;const id=state.mode,spec=TIDE_MODES[id],p=spec.prefix,area=panels.get(id),path=trajectory(id),s=path.at(state[p+'Time']);
  syncControls(root,state);for(const key of TIDE_CONTROL_KEYS){const out=q(`[data-value="${key}"]`);if(out)out.textContent=number(state[key],key.endsWith('Time')?1:2);}
  q('[data-play]').textContent=playing?'暂停演化':'播放演化';q('[data-play]').setAttribute('aria-pressed',String(playing));
  for(const button of root.querySelectorAll('[data-preset]')){const [m,preset]=button.dataset.preset.split(':'),value=preset==='fast'?TIDE_MODES[m].spinDefault:preset==='sync'?1:.5;button.setAttribute('aria-pressed',String(state[TIDE_MODES[m].prefix+'Spin']===value));}
  area.querySelector('[data-ratio]').textContent=number(s.ratio);area.querySelector('[data-radius]').textContent=number(s.x,5);
  area.querySelector('[data-spin-energy]').textContent=signed(s.spinChange/path.lambda);area.querySelector('[data-orbit-energy]').textContent=signed(s.orbitChange/path.lambda);area.querySelector('[data-heat]').textContent=number(s.heat/path.lambda,2);
  drawScene(area.querySelector('[data-scene]'),id,s,path);drawCharts(area,id,s,path);
 }
 function pause(){playing=false;stopClock?.();stopClock=null;}
 function selectMode(id){if(!TIDE_MODES[id])return;pause();state.mode=id;for(const [key,p]of panels)p.hidden=key!==id;for(const label of root.querySelectorAll('[data-condition-mode]'))label.hidden=label.dataset.conditionMode!==id;for(const button of root.querySelectorAll('[data-mode]'))button.setAttribute('aria-pressed',String(button.dataset.mode===id));render();}
 const unbind=bindControls(root,state,key=>{pause();if(!key.endsWith('Time')){const prefix=key.startsWith('lock')?'lock':'earth';state[prefix+'Time']=0;}render();});
 const click=event=>{
  const button=event.target.closest('button');if(!button||!root.contains(button))return;
  if(button.dataset.mode){selectMode(button.dataset.mode);return;}
  const p=TIDE_MODES[state.mode].prefix;
  if(button.hasAttribute('data-reset')){pause();state[p+'Time']=0;render();return;}
  if(button.dataset.preset){const [id,preset]=button.dataset.preset.split(':'),spec=TIDE_MODES[id];pause();state[spec.prefix+'Spin']=preset==='fast'?spec.spinDefault:preset==='sync'?1:.5;state[spec.prefix+'Time']=0;render();return;}
  if(button.hasAttribute('data-play')){
   if(playing){pause();render();return;}const spec=TIDE_MODES[state.mode];if(state[p+'Time']>=spec.horizon)state[p+'Time']=0;playing=true;
   stopClock=startVisibleLoop(dt=>{if(disposed||!playing)return;state[p+'Time']=Math.min(spec.horizon,state[p+'Time']+dt*(state.mode==='locking'?2:10));if(state[p+'Time']>=spec.horizon)pause();render();},{window:el.ownerDocument.defaultView});render();
  }
 };
 root.addEventListener('click',click);
 const presentation=applyPresentation(root,{surface:'paper',redraw:render}),navigation=mountWorkspaceNavigation(root,{modeNav:q('.al-mode-nav'),actions:[q('[data-play]'),q('[data-reset]')],label:'潮汐实验导航'}),disclosures=bindDisclosures(root);
 const model=registerExperimentModel(el,{getState:()=>({...state}),applyState(value){const clean=validateTideState(value?.mode,value);if(!clean)return false;pause();Object.assign(state,clean);selectMode(clean.mode);return true;}});
 const observer=new ResizeObserver(()=>render());observer.observe(root);selectMode(state.mode);
 const dispose=()=>{if(disposed)return;disposed=true;pause();observer.disconnect();model();disclosures();navigation();presentation();unbind();root.removeEventListener('click',click);root.remove();signal?.removeEventListener('abort',dispose);};
 signal?.addEventListener('abort',dispose,{once:true});return dispose;
}
