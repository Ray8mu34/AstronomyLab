import {applyPresentation,bindDisclosures,getGraphicStyle} from '../shared/presentation.js';
import {mountWorkspaceNavigation} from '../shared/navigation.js';
import {bindControls,syncControls} from '../shared/core-controls.js';
import {plot} from '../shared/plot.js';
import {STELLAR_DEFAULTS,uniformStar,thermostatTrajectory,transportLayer} from './stellar-interior-physics.mjs';

const modes={equilibrium:'压力与引力',thermostat:'核反应反馈',transport:'辐射与对流'};
const fixed=(v,n=2)=>Number(v).toFixed(n);
const parameter=(key,label,min,max,step)=>`<label class="al-parameter si-parameter" for="si-${key}"><span>${label}<output data-value="${key}"></output></span><input id="si-${key}" type="range" data-key="${key}" min="${min}" max="${max}" step="${step}"></label>`;
function setup(canvas){const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,2),s=getGraphicStyle(canvas);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle=s.background;c.fillRect(0,0,w,h);return {c,w,h,s};}
function text(c,s,value,x,y,align='left',number=false){c.font=number?s.tickFont:s.labelFont;c.fillStyle=s.text;c.textAlign=align;c.textBaseline='middle';c.fillText(value,x,y);}
function arrow(c,x,y,endX,endY,color){const a=Math.atan2(endY-y,endX-x),length=Math.hypot(endX-x,endY-y),head=Math.min(7,length*.45);if(length<1)return;c.strokeStyle=color;c.fillStyle=color;c.lineWidth=2.3;c.beginPath();c.moveTo(x,y);c.lineTo(endX,endY);c.stroke();c.beginPath();c.moveTo(endX,endY);c.lineTo(endX-head*Math.cos(a-.4),endY-head*Math.sin(a-.4));c.lineTo(endX-head*Math.cos(a+.4),endY-head*Math.sin(a+.4));c.closePath();c.fill();}
function dot(canvas,chart,x,ys,colors){const c=canvas.getContext('2d'),{bounds,toPixel,style}=chart,[px]=toPixel(x,0);c.save();c.beginPath();c.rect(bounds.x,bounds.y,bounds.width,bounds.height);c.clip();c.strokeStyle=style.muted;c.lineWidth=1;c.setLineDash([3,4]);c.beginPath();c.moveTo(px,bounds.y);c.lineTo(px,bounds.y+bounds.height);c.stroke();c.setLineDash([]);ys.forEach((y,i)=>{const [,py]=toPixel(x,y);c.fillStyle=style.background;c.strokeStyle=colors[i];c.lineWidth=2;c.beginPath();c.arc(px,py,4.5,0,Math.PI*2);c.fill();c.stroke();});c.restore();}

export async function mount(el,{mode='equilibrium',signal}={}){
 if(signal?.aborted)return()=>{};
 const state={...STELLAR_DEFAULTS};let current=Object.hasOwn(modes,mode)?mode:'equilibrium',disposed=false,frame=0,trajectory=null,trajectoryKey='';
 el.innerHTML=`<section class="si-shell">
  <div class="si-modes al-mode-nav" role="group" aria-label="恒星内部模式">${Object.entries(modes).map(([id,label])=>`<button type="button" data-mode="${id}" aria-pressed="${id===current}">${label}</button>`).join('')}</div><button type="button" class="al-button" data-reset>复位</button>
  <header class="si-heading"><h1 data-si-title></h1><span data-si-identity></span></header>
  <section data-si-panel="equilibrium" aria-label="静力平衡与收缩">
   <div class="si-two"><figure><figcaption>薄层受力 <span>每单位质量</span></figcaption><canvas data-si-sphere role="img" aria-label="均匀密度气体球中的压力梯度与引力"></canvas><div class="si-local-read" data-si-forces></div></figure><figure><canvas data-si-pressure role="img" aria-label="气体球内的压力分布"></canvas><div class="si-local-read" data-si-central></div></figure></div>
   <div class="si-controls si-controls-four">${parameter('mass','质量 / M☉',.5,3,.1)}${parameter('radius','半径 / R☉',.5,3,.05)}${parameter('shell','薄层位置 r / R',.1,.9,.05)}${parameter('support','压力 / 平衡压力',.5,1.5,.05)}</div>
   <div class="si-presets" role="group" aria-label="压力倍率"><button type="button" data-support="0.8">压力减弱</button><button type="button" data-support="1">静力平衡</button><button type="button" data-support="1.2">压力增强</button></div>
   <figure class="si-energy"><figcaption>内能与引力能 <span>当前质量、压力倍率的半径序列</span></figcaption><canvas data-si-energy role="img" aria-label="气体球的内能、引力能和总能量随半径变化"></canvas><div class="si-local-read" data-si-energy-read></div></figure>
  </section>
  <section data-si-panel="thermostat" aria-label="核反应与热反馈" hidden>
   <div class="si-controls si-thermal-controls">${parameter('initialRadius','初始半径 R初 / R₀',.85,1.15,.01)}<label class="al-parameter si-parameter" for="si-reaction">反应温度幂率<select id="si-reaction" data-key="reaction"><option value="pp">pp 链 · ν = 4</option><option value="cno">CNO 循环 · ν = 17</option></select></label></div>
   <div class="si-two"><figure><figcaption>同源气体球 <span>R₀、T₀ 为平衡参照</span></figcaption><canvas data-si-feedback role="img" aria-label="单区模型的半径、温度与净产能"></canvas></figure><div class="si-thermal-plots"><figure><canvas data-si-response role="img" aria-label="半径与温度对扰动的响应"></canvas></figure><figure><canvas data-si-luminosity role="img" aria-label="核产能与固定表面光度"></canvas></figure></div></div>
   <div class="si-time">${parameter('thermalTime','热时间 t / (E₀ / L₀)',0,1,.005)}</div>
   <div class="si-presets" role="group" aria-label="初始半径"><button type="button" data-thermal="0.9">初始压缩</button><button type="button" data-thermal="1">平衡初态</button><button type="button" data-thermal="1.1">初始膨胀</button></div>
  </section>
  <section data-si-panel="transport" aria-label="局部能量输运与对流稳定性" hidden>
   <div class="si-two"><figure><figcaption>绝热移动的气团 <span>与环境同压</span></figcaption><canvas data-si-parcel role="img" aria-label="辐射试探分层中的气团温度和浮力"></canvas><div class="si-local-read" data-si-buoyancy></div></figure><figure><canvas data-si-gradient role="img" aria-label="环境和绝热气团的温度随压强变化"></canvas><div class="si-local-read" data-si-gradient-read></div></figure></div>
   <div class="si-controls si-controls-three">${parameter('opacity','不透明度 κ / κ₀',.5,2,.05)}${parameter('flux','能流 F / F₀',.5,2,.05)}${parameter('displacement','上移量 ln(P₀ / P)',0,.8,.02)}</div>
   <div class="si-presets" role="group" aria-label="局部分层"><button type="button" data-transport="1">稳定分层</button><button type="button" data-transport="1.6">临界梯度</button><button type="button" data-transport="2">对流不稳定</button></div>
  </section>
  <details class="al-disclosure si-source" data-learning-guide><summary>条件、方程与来源</summary><div class="si-method"><p data-mode-boundary></p>
   <div data-si-method="equilibrium"><p>均匀密度、球对称、单原子理想气体，表面压力取零。M 与 R 独立改变；图中的圆使用 r/R 坐标。压力倍率 b = 1 时满足静力平衡，b ≠ 1 时显示同一密度下的瞬时受力。密度为 3M/(4πR³)，平均粒子质量取 0.61mH。</p><p class="si-equation">P(r) = b · 3GM²/(8πR⁴) · [1 − (r/R)²]<br>−(1/ρ)dP/dr = b · GMr/R³<br>Ω = −3GM²/(5R)，U = −bΩ/2，E = U + Ω</p><p>b = 1 的收缩序列满足 2U + Ω = 0。气体向外散失能量后，到达半径较小、温度较高的新平衡态。</p></div>
   <div data-si-method="thermostat"><p>固定质量、成分与密度分布形状，令 q = R/R₀；近静力的理想气体维里序列给出 T/T₀ = 1/q、ρ/ρ₀ = 1/q³、E/E₀ = −1/q，E₀ 为平衡总能量的绝对值。局部反应幂率 ε ∝ ρTν 归一为 L核/L₀ = q⁻⁽³⁺ν⁾，两种幂率分别演示 pp 链与 CNO 循环的温度敏感度。表面光度固定为 L₀，成分不随时间消耗。</p><p class="si-equation">dE/dt = L核 − L₀<br>dq/dτ = q²[q⁻⁽³⁺ν⁾ − 1]，τ = tL₀/E₀</p><p>曲线由这组单区方程积分得到；时间按 E₀/L₀ 归一。半径和温度图共用比值尺度，产能图采用对数纵轴。</p></div>
   <div data-si-method="transport"><p>同成分、单原子理想气体的局部薄层，气团维持压力平衡并作绝热移动。基底 P₀ = 5×10¹² Pa，T₀ = 3×10⁶ K，g = 1000 m/s²，κ₀ = 0.2 m²/kg；选择 F₀ 使基底辐射梯度为 0.25。环境使用基底梯度固定的辐射试探分层，竖直图以 ln(P₀/P) 定位。</p><p class="si-equation">∇辐射,₀ = 3κP₀F/(16σgT₀⁴) = 0.25(κ/κ₀)(F/F₀)<br>∇绝热 = 2/5，T环境/T₀ = (P/P₀)^∇辐射,₀<br>T气团/T₀ = (P/P₀)^0.4<br>a浮/g = ρ环境/ρ气团 − 1</p><p>当 ∇辐射,₀ &gt; 0.4，上移气团比环境温暖、密度更小，浮力继续向外。图展示辐射试探分层的稳定性；实际对流层的温度梯度和能流需结合对流输运模型计算。</p></div>
   <p><a href="/sources/stellar-interior.md" target="_blank" rel="noopener">推导与来源记录 ↗</a> · <a href="/lab/stars?mode=evolution">恒星演化轨迹 ↗</a></p>
  </div></details>
 </section>`;
 const shell=el.querySelector('.si-shell'),q=selector=>shell.querySelector(selector),qa=selector=>[...shell.querySelectorAll(selector)];
 function drawEquilibrium(){
  const star=uniformStar(state.mass,state.radius,state.support),layer=star.at(state.shell),{c,w,h,s}=setup(q('[data-si-sphere]')),cx=w/2,cy=h*.51,r=Math.min(w*.34,125);
  c.fillStyle=s.grid;c.globalAlpha=.45;c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.fill();c.globalAlpha=1;c.strokeStyle=s.text;c.lineWidth=1.4;c.stroke();
  for(const fraction of [.25,.5,.75]){c.strokeStyle=s.grid;c.beginPath();c.arc(cx,cy,r*fraction,0,Math.PI*2);c.stroke();}
  c.strokeStyle=s.accent;c.lineWidth=3;c.beginPath();c.arc(cx,cy,r*state.shell,0,Math.PI*2);c.stroke();
  const x=cx+r*state.shell;c.fillStyle=s.text;c.beginPath();c.arc(x,cy,4,0,Math.PI*2);c.fill();
  const base=Math.min(65*state.shell,(w-18-x)/Math.max(1,state.support));
  arrow(c,x,cy-22,x+base*state.support,cy-22,s.accent);arrow(c,x,cy+22,x-base,cy+22,s.text);
  text(c,s,'压力差',Math.min(w-26,x+base*state.support/2),cy-42,'center');text(c,s,'引力',x-base/2,cy+44,'center');
  text(c,s,`r / R = ${fixed(state.shell)}`,cx,h-20,'center',true);
  q('[data-si-forces]').innerHTML=`<span>压力差 ${fixed(layer.pressureAcceleration,1)}</span><span>引力 ${fixed(layer.gravity,1)} m s⁻²</span>`;
  q('[data-si-sphere]').setAttribute('aria-label',`薄层位于半径的${fixed(state.shell)}处，向外压力加速度${fixed(layer.pressureAcceleration,1)}，向内引力${fixed(layer.gravity,1)}，净向外加速度${fixed(layer.netAcceleration,1)}米每二次方秒。`);
  const canvas=q('[data-si-pressure]'),style=getGraphicStyle(canvas),eq=uniformStar(state.mass,state.radius),scale=10**Math.floor(Math.log10(Math.max(star.centralPressure,eq.centralPressure)));
  const points=Array.from({length:101},(_,i)=>[i/100,star.at(i/100).pressure/scale]),reference=points.map(([x])=>[x,eq.at(x).pressure/scale]);
  const chart=plot(canvas,{series:[{points,label:'当前压力',color:style.accent},{points:reference,label:'平衡压力',color:style.muted,dash:[5,4]}],xDomain:[0,1],yDomain:[0,Math.max(star.centralPressure,eq.centralPressure)/scale*1.08],xTicks:[0,.5,1],xLabel:'半径 r / R',yLabel:`压力 / 10^${Math.log10(scale)} Pa`,margins:{left:54,right:20,top:canvas.clientWidth<350?82:54,bottom:53},onFontReady:false});dot(canvas,chart,state.shell,[layer.pressure/scale],[style.accent]);
  q('[data-si-central]').innerHTML=`<span>中心温度 ${fixed(star.centralTemperature/1e6)} MK</span><span>净向外 a = ${fixed(layer.netAcceleration,1)} m s⁻²</span>`;
  const energy=q('[data-si-energy]'),energyStyle=getGraphicStyle(energy),unit=1e41,sequence=Array.from({length:126},(_,i)=>({r:.5+i*.02,star:uniformStar(state.mass,.5+i*.02,state.support)}));
  const energyChart=plot(energy,{series:[{points:sequence.map(v=>[v.r,v.star.internal/unit]),label:'内能 U',color:energyStyle.accent},{points:sequence.map(v=>[v.r,v.star.potential/unit]),label:'引力能 Ω',color:energyStyle.text},{points:sequence.map(v=>[v.r,v.star.total/unit]),label:'总能量 E',color:energyStyle.muted,dash:[5,3]}],xDomain:[.5,3],yDomain:[sequence[0].star.potential/unit*1.1,sequence[0].star.internal/unit*1.2],xTicks:[.5,1,2,3],yTicks:[sequence[0].star.potential/unit,sequence[0].star.potential/unit/2,0,sequence[0].star.internal/unit],yFormat:value=>Number(value.toPrecision(3)).toString(),xLabel:'半径 R / R☉',yLabel:'能量 / 10⁴¹ J',margins:{left:54,right:18,top:energy.clientWidth<400?104:54,bottom:53},onFontReady:false});
  dot(energy,energyChart,state.radius,[star.internal/unit,star.potential/unit,star.total/unit],[energyStyle.accent,energyStyle.text,energyStyle.muted]);
  q('[data-si-energy-read]').innerHTML=`<span>U ${fixed(star.internal/unit)} × 10⁴¹ J</span><span>Ω ${fixed(star.potential/unit)} × 10⁴¹ J</span><span>E ${fixed(star.total/unit)} × 10⁴¹ J</span>`;
  energy.setAttribute('aria-label',`当前半径为${state.radius}太阳半径，内能${star.internal.toExponential(3)}焦耳，引力能${star.potential.toExponential(3)}焦耳，总能量${star.total.toExponential(3)}焦耳；曲线显示当前质量和压力倍率下各能量随半径的变化。`);
 }
 function drawThermostat(){
  const key=`${state.initialRadius}/${state.reaction}`;if(key!==trajectoryKey){trajectory=thermostatTrajectory(state.initialRadius,state.reaction);trajectoryKey=key;}
  const row=trajectory.at(state.thermalTime),{c,w,h,s}=setup(q('[data-si-feedback]')),cx=w*.5,cy=h*.43,base=Math.min(w*.27,(h-144)/(2*1.15),112),r=base*row.radius;
  c.strokeStyle=s.muted;c.lineWidth=1;c.setLineDash([5,4]);c.beginPath();c.arc(cx,cy,base,0,Math.PI*2);c.stroke();c.setLineDash([]);c.fillStyle=s.grid;c.globalAlpha=.5;c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.fill();c.globalAlpha=1;c.strokeStyle=s.accent;c.lineWidth=2;c.stroke();
  text(c,s,`R / R₀  ${fixed(row.radius,3)}`,cx,cy-16,'center',true);text(c,s,`T / T₀  ${fixed(row.temperature,3)}`,cx,cy+15,'center',true);
  const sign=Math.sign(row.dq),len=16+Math.min(35,Math.abs(row.dq)*8);
  if(Math.abs(row.dq)>.00005){for(const direction of [-1,1]){const start=cx+direction*(r+8);arrow(c,start,cy,start+direction*sign*len,cy,s.text);}}
  text(c,s,`L核 / L₀  ${fixed(row.nuclear,3)}`,cx,h-71,'center',true);text(c,s,`L表面 / L₀  1.000`,cx,h-42,'center',true);
  q('[data-si-feedback]').setAttribute('aria-label',`单区模型时刻${state.thermalTime}，半径比${fixed(row.radius,4)}，温度比${fixed(row.temperature,4)}，核产能与固定表面光度比${fixed(row.nuclear,3)}。`);
  const response=q('[data-si-response]'),light=q('[data-si-luminosity]'),style=getGraphicStyle(response),common={xDomain:[0,1],xTicks:[0,.5,1],xLabel:'热时间 τ',margins:{left:54,right:18,top:54,bottom:52},onFontReady:false};
  const a=plot(response,{...common,series:[{points:trajectory.samples.map(v=>[v.time,v.radius]),label:'R / R₀',color:style.text},{points:trajectory.samples.map(v=>[v.time,v.temperature]),label:'T / T₀',color:style.accent,dash:[5,3]}],yDomain:[.8,1.25],yTicks:[.8,1,1.2],yLabel:'相对平衡值'});dot(response,a,state.thermalTime,[row.radius,row.temperature],[style.text,style.accent]);
  const b=plot(light,{...common,series:[{points:trajectory.samples.map(v=>[v.time,v.nuclear]),label:'核产能',color:style.accent},{points:[[0,1],[1,1]],label:'表面辐射',color:style.muted,dash:[5,3]}],yDomain:[.03,40],yTicks:[.1,1,10],logY:true,yLabel:'光度 / L₀'});dot(light,b,state.thermalTime,[row.nuclear],[style.accent]);
 }
 function drawTransport(){
  const l=transportLayer(state.opacity,state.flux,state.displacement),{c,w,h,s}=setup(q('[data-si-parcel]')),left=35,right=w-38,bottom=h-57,top=110,x=w*.49,y=bottom-(bottom-top)*state.displacement/.8;
  for(let i=0;i<=4;i++){const ss=i*.2,yy=bottom-(bottom-top)*ss/.8;c.strokeStyle=s.grid;c.lineWidth=1;c.beginPath();c.moveTo(left,yy);c.lineTo(right,yy);c.stroke();text(c,s,fixed(ss,1),left-8,yy,'right',true);}
  text(c,s,'ln(P₀ / P)',8,24);text(c,s,'向外 ↑',right,24,'right');
  c.strokeStyle=s.muted;c.setLineDash([4,4]);c.beginPath();c.arc(x,bottom,17,0,Math.PI*2);c.stroke();c.setLineDash([]);
  const r=17*Math.exp(.2*state.displacement);c.fillStyle=s.background;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.strokeStyle=s.accent;c.lineWidth=2.5;c.stroke();
  const len=Math.abs(l.buoyancy)*100;if(len>1)arrow(c,x,y-Math.sign(l.buoyancy)*(r+3),x,y-Math.sign(l.buoyancy)*(r+3+len),s.accent);
  q('[data-si-buoyancy]').innerHTML=`<span>T气团 / T₀ ${fixed(l.parcelTemperature,3)}</span><span>T环境 / T₀ ${fixed(l.environmentTemperature,3)}</span><span>ρ气团 / ρ环境 ${fixed(l.parcelDensity/l.environmentDensity,3)}</span><span>a浮 / g ${l.buoyancy>=0?'+':''}${fixed(l.buoyancy,3)}</span>`;
  q('[data-si-parcel]').setAttribute('aria-label',`上移至压强比${fixed(l.pressureRatio,3)}，气团温度比${fixed(l.parcelTemperature,3)}，环境温度比${fixed(l.environmentTemperature,3)}，向外浮力加速度与重力之比${fixed(l.buoyancy,3)}。`);
  const canvas=q('[data-si-gradient]'),style=getGraphicStyle(canvas),rows=Array.from({length:81},(_,i)=>transportLayer(state.opacity,state.flux,i/100));
  const chart=plot(canvas,{series:[{points:rows.map(v=>[v.pressureRatio,v.environmentTemperature]),label:'辐射试探环境',color:style.text},{points:rows.map(v=>[v.pressureRatio,v.parcelTemperature]),label:'绝热气团',color:style.accent,dash:[5,3]}],xDomain:[1,Math.exp(-.8)],xTicks:[1,.8,.6,.45],yDomain:[.4,1.05],yTicks:[.4,.6,.8,1],xLabel:'压强 P / P₀ → 向外',yLabel:'温度 T / T₀',margins:{left:54,right:18,top:canvas.clientWidth<430?82:54,bottom:53},onFontReady:false});dot(canvas,chart,l.pressureRatio,[l.environmentTemperature,l.parcelTemperature],[style.text,style.accent]);
  q('[data-si-gradient-read]').innerHTML=`<span>∇辐射 ${fixed(l.gradient,3)}</span><span>∇绝热 0.400</span><span>${l.unstable?'对流不稳定':Math.abs(l.gradient-.4)<1e-10?'临界':'稳定'}</span>`;
 }
 function draw(){if(disposed||!shell.isConnected)return;for(const input of qa('[data-key]'))for(const out of qa(`[data-value="${input.dataset.key}"]`))out.textContent=input.value;
  if(current==='equilibrium')drawEquilibrium();else if(current==='thermostat')drawThermostat();else drawTransport();
 }
 function queueDraw(){if(disposed||frame)return;frame=requestAnimationFrame(()=>{frame=0;draw();});}
 function setMode(next){if(!Object.hasOwn(modes,next))return;current=next;for(const b of qa('button[data-mode]'))b.setAttribute('aria-pressed',String(b.dataset.mode===next));for(const panel of qa('[data-si-panel]'))panel.hidden=panel.dataset.siPanel!==next;for(const p of qa('[data-si-method]'))p.hidden=p.dataset.siMethod!==next;
  q('[data-si-title]').textContent={equilibrium:'一层气体怎样被支撑',thermostat:'收缩、升温与核反应',transport:'温度梯度与浮力'}[next];q('[data-si-identity]').textContent={equilibrium:'均匀密度理想气体球',thermostat:'单区维里模型 · 固定表面光度',transport:'局部辐射试探分层 · 同成分理想气体'}[next];draw();}
 const presentation=applyPresentation(shell,{surface:'paper',redraw:queueDraw}),navigation=mountWorkspaceNavigation(shell,{modeNav:q('.si-modes'),actions:[q('[data-reset]')],label:'恒星内部实验导航'}),disclosures=bindDisclosures(shell),controls=bindControls(shell,state,queueDraw);
 function click(event){const button=event.target.closest('button');if(!button||!shell.contains(button))return;
  if(button.hasAttribute('data-mode'))setMode(button.dataset.mode);
  else if(button.hasAttribute('data-reset')){Object.assign(state,STELLAR_DEFAULTS);syncControls(shell,state);draw();}
  else if(button.hasAttribute('data-support')){state.support=Number(button.dataset.support);syncControls(shell,state);draw();}
  else if(button.hasAttribute('data-thermal')){state.initialRadius=Number(button.dataset.thermal);state.thermalTime=0;syncControls(shell,state);draw();}
  else if(button.hasAttribute('data-transport')){state.opacity=Number(button.dataset.transport);state.flux=1;syncControls(shell,state);draw();}
 }
 shell.addEventListener('click',click);const resize=new ResizeObserver(queueDraw);resize.observe(shell);setMode(current);
 const dispose=()=>{if(disposed)return;disposed=true;cancelAnimationFrame(frame);resize.disconnect();shell.removeEventListener('click',click);controls();disclosures();navigation();presentation();signal?.removeEventListener('abort',dispose);};signal?.addEventListener('abort',dispose,{once:true});return dispose;
}
