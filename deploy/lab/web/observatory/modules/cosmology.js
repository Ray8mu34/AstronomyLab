import {applyPresentation,bindDisclosures,getGraphicStyle} from '../shared/presentation.js';
import {mountWorkspaceNavigation} from '../shared/navigation.js';
import {bindControls,syncControls} from '../shared/core-controls.js';
import {plot} from '../shared/plot.js';
import {COSMOLOGY_DEFAULTS,EMISSION_SCALE,EMISSION_WAVELENGTH_NM,galaxyGrid,stretchedLight,compareDistances} from './cosmology-physics.mjs';

const modes=['expansion','distance'];
const fixed=(v,n=2)=>Number(v).toFixed(n);

function canvasContext(canvas){
 const width=canvas.clientWidth,height=canvas.clientHeight,dpr=Math.min(canvas.ownerDocument.defaultView.devicePixelRatio||1,2);
 canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
 const c=canvas.getContext('2d'),style=getGraphicStyle(canvas);
 c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle=style.background;c.fillRect(0,0,width,height);
 return {c,width,height,style};
}
function arrow(c,x,y,dx,dy){
 const length=Math.hypot(dx,dy);if(length<2)return;
 const angle=Math.atan2(dy,dx),head=Math.min(6,length*.35);
 c.beginPath();c.moveTo(x,y);c.lineTo(x+dx,y+dy);c.stroke();
 c.beginPath();c.moveTo(x+dx,y+dy);c.lineTo(x+dx-head*Math.cos(angle-.45),y+dy-head*Math.sin(angle-.45));c.lineTo(x+dx-head*Math.cos(angle+.45),y+dy-head*Math.sin(angle+.45));c.closePath();c.fill();
}
function drawSpace(canvas,state){
 const {c,width,height,style}=canvasContext(canvas),grid=galaxyGrid(state.scale,state.observer,state.hubble,state.omegaMatter);
 const side=Math.max(1,Math.min(width-66,height-54)),left=(width-side)/2+12,top=22,span=180,unit=side/(span*2),cx=left+side/2,cy=top+side/2;
 c.font=style.tickFont;c.textBaseline='middle';c.strokeStyle=style.grid;c.fillStyle=style.muted;c.lineWidth=1;
 for(const v of [-180,-120,-60,0,60,120,180]){
  const x=cx+v*unit,y=cy-v*unit;
  c.beginPath();c.moveTo(x,top);c.lineTo(x,top+side);c.moveTo(left,y);c.lineTo(left+side,y);c.stroke();
  if(v%120===0){c.textAlign='center';c.fillText(String(v),x,top+side+17);c.textAlign='right';c.fillText(String(v),left-7,y);}
 }
 c.textAlign='left';c.font=style.labelFont;c.fillText('Mpc',left,10);
 c.save();c.beginPath();c.rect(left,top,side,side);c.clip();
 for(const p of grid.points){
  if(Math.abs(p.x)>span||Math.abs(p.y)>span)continue;
  const x=cx+p.x*unit,y=cy-p.y*unit,selected=p.name===state.observer;
  if(p.distance>0){
   c.strokeStyle=style.grid;c.fillStyle=style.muted;c.lineWidth=style.referenceWidth;
   const velocityScale=unit*.002;
   arrow(c,x,y,p.vx*velocityScale,-p.vy*velocityScale);
  }
  c.fillStyle=selected?style.text:style.accent;c.beginPath();c.ellipse(x,y,selected?5:4,selected?5:2.7,-.55,0,Math.PI*2);c.fill();
  if(selected){c.strokeStyle=style.text;c.lineWidth=2;c.beginPath();c.arc(x,y,10,0,Math.PI*2);c.stroke();}
  if(p.name){c.font=style.labelFont;c.fillStyle=style.text;c.textAlign='left';c.fillText(p.name,x+13,y-11);}
 }
 c.restore();
 canvas.setAttribute('aria-label',`共动星系模型。观察者 ${state.observer} 位于原点，尺度因子 ${fixed(state.scale)}，当前膨胀率 ${fixed(grid.rate,1)} 千米每秒每百万秒差距。箭头为相对退行速度。`);
 return grid;
}
function drawWaves(canvas,state){
 const {c,width,height,style}=canvasContext(canvas),light=stretchedLight(state.scale),left=22,right=width-18,unit=(right-left)/1600;
 const rows=[{y:58,wavelength:EMISSION_WAVELENGTH_NM,label:`发射  λ = ${EMISSION_WAVELENGTH_NM} nm`,color:style.muted,dash:[4,3]},{y:160,wavelength:light.wavelength,label:`接收  λ = ${fixed(light.wavelength,0)} nm`,color:style.accent,dash:[]}];
 for(const row of rows){
  c.fillStyle=style.text;c.font=style.labelFont;c.textAlign='left';c.fillText(row.label,left,row.y-34);
  c.strokeStyle=style.grid;c.lineWidth=1;c.beginPath();c.moveTo(left,row.y);c.lineTo(right,row.y);c.stroke();
  c.strokeStyle=row.color;c.lineWidth=style.lineWidth;c.setLineDash(row.dash);c.beginPath();
  for(let x=0;x<=1600;x+=4){const px=left+x*unit,py=row.y-18*Math.sin(2*Math.PI*x/row.wavelength);x===0?c.moveTo(px,py):c.lineTo(px,py);}c.stroke();c.setLineDash([]);
  const end=left+row.wavelength*unit;
  c.lineWidth=1;c.beginPath();c.moveTo(left,row.y+25);c.lineTo(end,row.y+25);c.moveTo(left,row.y+21);c.lineTo(left,row.y+29);c.moveTo(end,row.y+21);c.lineTo(end,row.y+29);c.stroke();
 }
 canvas.setAttribute('aria-label',`发射波长 400 纳米，接收波长 ${fixed(light.wavelength,0)} 纳米，红移 ${fixed(light.redshift)}。两条波形使用相同波长尺度。`);
 return light;
}
function probe(canvas,chart,x,values){
 const c=canvas.getContext('2d'),{toPixel,bounds,style}=chart;
 c.save();c.beginPath();c.rect(bounds.x,bounds.y,bounds.width,bounds.height);c.clip();
 const [px]=toPixel(x,0);c.strokeStyle=style.muted;c.lineWidth=1;c.setLineDash([3,4]);c.beginPath();c.moveTo(px,bounds.y);c.lineTo(px,bounds.y+bounds.height);c.stroke();c.setLineDash([]);
 for(const [value,color]of values){const [,py]=toPixel(x,value);c.fillStyle=style.background;c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.arc(px,py,5,0,Math.PI*2);c.fill();c.stroke();}
 c.restore();
}

export async function mount(el,{mode='expansion',signal}={}){
 if(signal?.aborted)return()=>{};
 const state={...COSMOLOGY_DEFAULTS,mode:modes.includes(mode)?mode:'expansion'};
 el.innerHTML=`<section class="cosmology-lab">
  <div class="al-mode-nav cosmology-modes" aria-label="宇宙膨胀模式"><button type="button" data-mode="expansion">空间与光波</button><button type="button" data-mode="distance">距离与膨胀历史</button></div>
  <button type="button" class="al-button" data-reset>复位</button>
  <header class="cosmology-heading"><h1>宇宙膨胀</h1><span class="cosmology-identity">平直 FLRW 模型</span></header>
  <section data-panel="expansion" aria-label="空间与光波">
   <div class="cosmology-primary-controls">
    <label class="al-parameter cosmology-scale" for="cosmology-scale">尺度因子 a <output data-value="scale">1</output><input id="cosmology-scale" type="range" data-key="scale" min="0.5" max="1.5" step="0.01" value="1"></label>
    <label class="al-parameter">观察者<select data-key="observer"><option value="A">星系 A</option><option value="B">星系 B</option><option value="C">星系 C</option></select></label>
   </div>
   <div class="cosmology-expansion-figures">
    <figure class="cosmology-space"><figcaption>星系间距 <span>箭头：退行速度</span></figcaption><canvas data-space role="img"></canvas></figure>
    <div class="cosmology-expansion-relations">
     <figure class="cosmology-wave"><figcaption>光波 <output data-redshift-readout></output></figcaption><canvas data-wave role="img"></canvas></figure>
     <figure class="cosmology-hubble"><figcaption>同一时刻 <output data-rate-readout></output></figcaption><canvas data-hubble role="img"></canvas></figure>
    </div>
   </div>
  </section>
  <section data-panel="distance" aria-label="距离与膨胀历史" hidden>
   <div class="cosmology-distance-controls">
    <label class="al-parameter cosmology-redshift" for="cosmology-redshift">红移 z <output data-value="redshift">0.5</output><input id="cosmology-redshift" type="range" data-key="redshift" min="0.01" max="1.2" step="0.01" value="0.5"></label>
    <label class="al-parameter" for="cosmology-omega">物质密度 Ωm <output data-value="omegaMatter">0.3</output><input id="cosmology-omega" type="range" data-key="omegaMatter" min="0" max="1" step="0.01" value="0.3"></label>
    <label class="al-parameter" for="cosmology-hubble">H₀ / km s⁻¹ Mpc⁻¹ <output data-value="hubble">70</output><input id="cosmology-hubble" type="range" data-key="hubble" min="50" max="90" step="1" value="70"></label>
   </div>
   <div class="cosmology-distance-figures">
    <div class="cosmology-distance-plots"><figure><canvas data-distance-plot role="img" aria-label="光度距离随红移的模型曲线"></canvas></figure><figure><canvas data-residual-plot role="img" aria-label="相对纯物质宇宙的距离模数差"></canvas></figure></div>
    <div class="cosmology-readings">
     <p class="cosmology-probe">z = <output data-probe-z></output></p>
     <table><caption>同一红移的模型预测</caption><thead><tr><th scope="col">模型</th><th scope="col">dL / Gpc</th></tr></thead><tbody><tr><th scope="row" data-current-label></th><td><output data-distance-current></output></td></tr><tr><th scope="row">Ωm = 1</th><td><output data-distance-matter></output></td></tr></tbody></table>
     <dl class="cosmology-deltas"><div><dt>距离模数差 Δμ</dt><dd><output data-delta></output><span> mag</span></dd></div><div><dt>同光度通量比 F / F物质</dt><dd><output data-flux></output></dd></div></dl>
     <p class="cosmology-model-equation" data-omega-lambda></p>
    </div>
   </div>
  </section>
  <details class="al-disclosure cosmology-details" data-learning-guide><summary>模型与来源</summary>
   <div class="cosmology-model-details">
    <p data-mode-boundary></p>
    <p data-expansion-condition>星系标记的共动间距为 60 Mpc，字母表示可选择的观察者。a = 1 为今天；图示星系随均匀膨胀运动，标记大小固定。箭头与相对退行速度成正比。</p>
    <p data-wave-condition>光波发射时 a = 0.5，波长为 400 nm。两条波形共用水平长度尺度，振幅为示意。接收波长 λ = 400 × a / 0.5 nm，1 + z = a / 0.5。</p>
    <p data-parameter-condition></p>
    <p>物质与宇宙常数构成空间平直模型，ΩΛ = 1 − Ωm，忽略辐射密度。光度距离曲线为模型计算，红移范围 0 ≤ z ≤ 1.2。虚线为相同 H₀、Ωm = 1 的纯物质模型；Δμ 为实线减虚线，同光度通量比为 (dL物质 / dL)²。</p>
    <p class="cosmology-formula">dL = (1 + z) c / H₀ ∫₀ᶻ dz′ / √[Ωm(1 + z′)³ + ΩΛ]<br>μ = 5 log₁₀(dL / Mpc) + 25</p>
    <p><a href="https://ned.ipac.caltech.edu/level5/Hogg/Hogg_contents.html" target="_blank" rel="noopener">Hogg：Distance measures in cosmology</a> · <a href="/sources/cosmology.md" target="_blank" rel="noopener">计算方法与来源记录</a></p>
   </div>
  </details>
 </section>`;
 const shell=el.querySelector('.cosmology-lab'),q=selector=>shell.querySelector(selector);
 let disposed=false,frame=0,cache=null;
 function draw(){
  if(disposed||!shell.isConnected)return;
  q('[data-parameter-condition]').textContent=`当前 H₀ = ${state.hubble} km s⁻¹ Mpc⁻¹，Ωm = ${fixed(state.omegaMatter)}，ΩΛ = ${fixed(1-state.omegaMatter)}。瞬时膨胀率 H(a) = H₀ √(Ωm / a³ + ΩΛ)。`;
  if(state.mode==='expansion'){
   const grid=drawSpace(q('[data-space]'),state),light=drawWaves(q('[data-wave]'),state),style=getGraphicStyle(shell);
   q('[data-redshift-readout]').textContent=`z = ${fixed(light.redshift)}`;q('[data-rate-readout]').textContent=`H(a) = ${fixed(grid.rate,1)} km s⁻¹ Mpc⁻¹`;
   const points=grid.points.filter(p=>Math.abs(p.x)<=180&&Math.abs(p.y)<=180&&p.distance>0).map(p=>[p.distance,p.velocity/1000]);
   const velocityTop=Math.max(20,Math.ceil(grid.rate*260/1000/10)*10);
   plot(q('[data-hubble]'),{series:[{points:[[0,0],[260,grid.rate*260/1000]],color:style.accent},{points,connect:false,dots:true,radius:2.5,color:style.text}],xDomain:[0,260],xTicks:[0,100,200],yDomain:[0,velocityTop],xLabel:'距离 / Mpc',yLabel:'退行速度 / 千 km s⁻¹',showLegend:false,margins:{left:57,right:14,top:28,bottom:49},onFontReady:false});
   q('[data-hubble]').setAttribute('aria-label',`同一时刻距离与退行速度成正比，斜率 H(a) 为 ${fixed(grid.rate,1)} 千米每秒每百万秒差距。`);
  }else{
   const style=getGraphicStyle(shell),key=`${state.hubble}/${state.omegaMatter}`;
   if(cache?.key!==key){
    const current=[],matter=[],delta=[];
    for(let i=0;i<=120;i++){const z=i/100,r=compareDistances(z,state.hubble,state.omegaMatter);current.push([z,r.current.luminosity/1000]);matter.push([z,r.matter.luminosity/1000]);delta.push([z,r.deltaModulus]);}
    cache={key,current,matter,delta};
   }
   const r=compareDistances(state.redshift,state.hubble,state.omegaMatter),common={xDomain:[0,1.2],xTicks:[0,.3,.6,.9,1.2],xLabel:'红移 z',margins:{left:shell.clientWidth<600?54:72,right:20,top:q('[data-distance-plot]').clientWidth<350?70:46,bottom:48},onFontReady:false};
   const chart=plot(q('[data-distance-plot]'),{...common,series:[{points:cache.current,label:`Ωm = ${fixed(state.omegaMatter)}`,color:style.accent},{points:cache.matter,label:'Ωm = 1',color:style.muted,dash:[6,4]}],yDomain:[0,16],yTicks:[0,4,8,12,16],yLabel:'光度距离 dL / Gpc'});
   probe(q('[data-distance-plot]'),chart,state.redshift,[[r.current.luminosity/1000,style.accent],[r.matter.luminosity/1000,style.muted]]);
   const residual=plot(q('[data-residual-plot]'),{...common,margins:{...common.margins,top:28},series:[{points:cache.delta,color:style.accent}],yDomain:[0,1.4],yTicks:[0,.4,.8,1.2],yLabel:'Δμ / mag',showLegend:false});
   probe(q('[data-residual-plot]'),residual,state.redshift,[[r.deltaModulus,style.accent]]);
   q('[data-probe-z]').textContent=fixed(state.redshift);q('[data-current-label]').textContent=`Ωm = ${fixed(state.omegaMatter)}`;
   q('[data-distance-current]').textContent=fixed(r.current.luminosity/1000,3);q('[data-distance-matter]').textContent=fixed(r.matter.luminosity/1000,3);
   q('[data-delta]').textContent=fixed(r.deltaModulus,3);q('[data-flux]').textContent=fixed(r.fluxRatio,3);q('[data-omega-lambda]').textContent=`ΩΛ = ${fixed(1-state.omegaMatter)}`;
   q('[data-distance-plot]').setAttribute('aria-label',`模型光度距离曲线。红移 ${fixed(state.redshift)} 时，当前模型 ${fixed(r.current.luminosity/1000,3)} Gpc，纯物质模型 ${fixed(r.matter.luminosity/1000,3)} Gpc。`);
   q('[data-residual-plot]').setAttribute('aria-label',`相对纯物质模型的距离模数差，红移 ${fixed(state.redshift)} 时为 ${fixed(r.deltaModulus,3)} 等。`);
  }
 }
 function queueDraw(){if(disposed||frame)return;frame=requestAnimationFrame(()=>{frame=0;draw();});}
 function setMode(next){
  if(!modes.includes(next))return;
  state.mode=next;shell.dataset.cosmologyMode=next;
  for(const button of shell.querySelectorAll('[data-mode]'))button.setAttribute('aria-pressed',String(button.dataset.mode===next));
  for(const panel of shell.querySelectorAll('[data-panel]'))panel.hidden=panel.dataset.panel!==next;
  q('[data-expansion-condition]').hidden=next!=='expansion';q('[data-wave-condition]').hidden=next!=='expansion';
  draw();
 }
 const presentation=applyPresentation(shell,{surface:'paper',redraw:queueDraw});
 const navigation=mountWorkspaceNavigation(shell,{modeNav:q('.cosmology-modes'),actions:[q('[data-reset]')],label:'宇宙膨胀实验导航'});
 const disclosures=bindDisclosures(shell),controls=bindControls(shell,state,queueDraw);
 const click=event=>{
  const button=event.target.closest('button');if(!button||!shell.contains(button))return;
  if(button.dataset.mode)setMode(button.dataset.mode);
  if(button.hasAttribute('data-reset')){Object.assign(state,COSMOLOGY_DEFAULTS);syncControls(shell,state);draw();}
 };
 shell.addEventListener('click',click);
 const resize=new ResizeObserver(queueDraw);resize.observe(shell);setMode(state.mode);
 const dispose=()=>{if(disposed)return;disposed=true;cancelAnimationFrame(frame);resize.disconnect();shell.removeEventListener('click',click);controls();disclosures();navigation();presentation();signal?.removeEventListener('abort',dispose);};
 signal?.addEventListener('abort',dispose,{once:true});
 return dispose;
}
