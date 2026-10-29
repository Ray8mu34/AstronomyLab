import {applyPresentation,bindDisclosures,getGraphicStyle} from '../shared/presentation.js';
import {mountWorkspaceNavigation} from '../shared/navigation.js';
import {bindControls,syncControls} from '../shared/core-controls.js';
import {plot} from '../shared/plot.js';
import {SN_DEFAULTS,supernovaModel} from './supernova-light-physics.mjs';

const modes=['diffusion','radioactivity'],fixed=(value,digits=2)=>value.toFixed(digits);
const parameter=(key,label,min,max,step)=>`<label class="al-parameter" for="sn-${key}"><span>${label}<output data-value="${key}"></output></span><input id="sn-${key}" data-key="${key}" type="range" min="${min}" max="${max}" step="${step}"></label>`;
const sparse=rows=>rows.filter((_,i)=>i%20===0||i===rows.length-1);
function marker(canvas,chart,time,values){
 const c=canvas.getContext('2d'),{bounds,toPixel,style}=chart,[x]=toPixel(time,0);
 c.save();c.beginPath();c.rect(bounds.x,bounds.y,bounds.width,bounds.height);c.clip();c.strokeStyle=style.muted;c.lineWidth=1;c.setLineDash([3,4]);c.beginPath();c.moveTo(x,bounds.y);c.lineTo(x,bounds.y+bounds.height);c.stroke();c.setLineDash([]);
 for(const [value,color]of values){const [,y]=toPixel(time,value);c.fillStyle=style.background;c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.arc(x,y,4.5,0,Math.PI*2);c.fill();c.stroke();}c.restore();
}
function energyFlow(canvas,row,maxStored){
 const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
 const c=canvas.getContext('2d'),s=getGraphicStyle(canvas);c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle=s.background;c.fillRect(0,0,w,h);
 const cx=w/2,boxY=118,boxH=93,boxW=Math.min(180,w*.65),left=cx-boxW/2,right=cx+boxW/2;
 function text(label,x,y,color=s.text,numeric=false){c.fillStyle=color;c.font=numeric?s.tickFont:s.labelFont;c.textAlign='center';c.fillText(label,x,y);}
 function arrow(x,y1,y2,power,color){if(power<=0)return;const thickness=power*7;c.fillStyle=color;c.fillRect(x-thickness/2,y1,thickness,Math.max(0,y2-y1-8));c.beginPath();c.moveTo(x,y2);c.lineTo(x-Math.max(4,thickness),y2-9);c.lineTo(x+Math.max(4,thickness),y2-9);c.closePath();c.fill();}
 text('放射性沉积 Q̇',cx,23,s.muted);text(`${fixed(row.heating)} ×10³⁶ W`,cx,47,s.muted,true);arrow(cx,59,boxY-6,row.heating,s.muted);
 const fill=Math.max(0,Math.min(1,row.stored/maxStored));c.fillStyle=s.grid;c.fillRect(left+1,boxY+boxH*(1-fill),boxW-2,boxH*fill);c.strokeStyle=s.text;c.lineWidth=1.4;c.strokeRect(left,boxY,boxW,boxH);
 text('内部辐射能 E',cx,boxY+34);text(`${fixed(row.stored,3)} ×10⁴² J`,cx,boxY+61,s.text,true);
 const a=cx-boxW*.35,b=cx+boxW*.35;arrow(a,boxY+boxH+3,h-67,row.workPower,s.text);arrow(b,boxY+boxH+3,h-67,row.luminosity,s.accent);
 text('膨胀做功',a,h-43);text('逸出光度 L',b,h-43,s.accent);text(`${fixed(row.workPower)} ×10³⁶ W`,a,h-19,s.text,true);text(`${fixed(row.luminosity)} ×10³⁶ W`,b,h-19,s.accent,true);
 canvas.setAttribute('aria-label',`能量流。沉积功率 ${fixed(row.heating)}、逸出光度 ${fixed(row.luminosity)}、膨胀做功功率 ${fixed(row.workPower)}，单位10的36次方瓦。内部辐射能 ${fixed(row.stored,3)}，单位10的42次方焦。`);
}

export async function mount(el,{mode='diffusion',signal}={}){
 if(signal?.aborted)return()=>{};
 const state={...SN_DEFAULTS},doc=el.ownerDocument,win=doc.defaultView;let current=modes.includes(mode)?mode:'diffusion',disposed=false,frame=0,cache=null;
 el.innerHTML=`<section class="sn-light-shell">
 <div class="al-mode-nav" role="group" aria-label="超新星光变模式"><button type="button" data-mode="diffusion">储能与光变</button><button type="button" data-mode="radioactivity">镍、钴与铁</button></div><button type="button" class="al-button" data-reset>复位</button>
 <div class="sn-light-content"><header class="sn-light-heading"><div><h1>超新星的能量与光变</h1><span>单区辐射扩散模型 · 热源完全沉积</span></div><p class="sn-light-scale" data-diffusion-scale>τm <output data-sn-tau></output> d</p></header>
 <div class="sn-light-controls">
 ${parameter('nickelMass','初始镍质量 / M☉',.05,1,.01)}
 <div data-sn-diffusion-controls>${parameter('ejectaMass','抛出物质量 / M☉',1,5,.1)}${parameter('opacity','不透明度 κ / cm² g⁻¹',.03,.2,.01)}${parameter('velocity','膨胀速度 / km s⁻¹',5000,20000,500)}</div>
 </div>
 <section data-sn-panel="diffusion" aria-label="能量储存与辐射逸出">
  <div class="sn-light-main"><figure class="sn-light-power"><canvas data-sn-power role="img" aria-label="沉积功率与逸出光度随爆发后时间变化"></canvas><figcaption><button type="button" class="al-button" data-sn-peak>定位光度峰值</button><output data-sn-peak-read></output></figcaption></figure><figure class="sn-light-flow"><canvas data-sn-flow role="img"></canvas></figure></div>
 </section>
 <section data-sn-panel="radioactivity" aria-label="放射性核素与能量沉积" hidden>
  <div class="sn-light-chain" aria-label="镍56衰变为钴56，再衰变为铁56"><div><span>⁵⁶Ni</span><output data-sn-ni></output></div><span class="sn-chain-arrow" aria-hidden="true">→</span><div><span>⁵⁶Co</span><output data-sn-co></output></div><span class="sn-chain-arrow" aria-hidden="true">→</span><div><span>⁵⁶Fe</span><output data-sn-fe></output></div></div>
  <div class="sn-chain-bar" aria-label="核数占比"><span data-sn-ni-bar></span><span data-sn-co-bar></span><span data-sn-fe-bar></span></div>
  <div class="sn-light-decay-plots"><figure><canvas data-sn-population role="img" aria-label="镍56、钴56与铁56的核数占比随时间变化"></canvas></figure><figure><canvas data-sn-heating role="img" aria-label="镍和钴的沉积功率随时间变化"></canvas></figure></div>
 </section>
 <div class="sn-light-time">${parameter('day','爆发后时间 / d',0,120,.1)}</div>
 <section data-sn-panel="diffusion" aria-label="累计能量收支"><figure class="sn-light-budget"><canvas data-sn-budget role="img" aria-label="累计沉积、逸出、膨胀做功与当前存储的能量"></canvas></figure><dl class="sn-light-budget-read"><div><dt>累计沉积</dt><dd data-sn-deposited></dd></div><div><dt>内部储存</dt><dd data-sn-stored></dd></div><div><dt>累计逸出</dt><dd data-sn-escaped></dd></div><div><dt>膨胀做功</dt><dd data-sn-work></dd></div></dl></section>
 <details class="al-disclosure sn-light-details" data-learning-guide><summary>条件、方程与来源</summary><p data-mode-boundary></p><p>球对称同源膨胀，R = vt；辐射压占主导，不透明度固定。热源取 ⁵⁶Ni → ⁵⁶Co → ⁵⁶Fe，全部局地沉积，初始储存的冲击热为零。曲线表示总辐射光度；能量图与曲线由同一组参数计算。</p>
 <p>平均寿命 τNi = 8.77 d，τCo = 111.3 d；对应半衰期约 6.08 d、77.15 d。衰变图的百分数以初始镍核数为基准。β = 13.8 是固定的扩散结构系数；τm 是本模型的有效扩散尺度。</p>
 <p class="sn-light-equations">τm² = 2κMej / (βcv)<br>dE/dt = Q̇ − L − E/t<br>L = 2tE / τm²<br>dL/dt = (2t/τm²)(Q̇ − L)</p>
 <p>图中 120 天范围使用相同的完全沉积与固定不透明度条件。储能框的填充比例以当前参数下整个图窗的最大内部能量为基准，箭杆宽度与功率成正比。光度峰值由计算曲线定位。</p>
 <p><a href="https://articles.adsabs.harvard.edu/pdf/1982ApJ...253..785A" target="_blank" rel="noopener">Arnett：辐射扩散与超新星光变 ↗</a> · <a href="/sources/supernova-light.md" target="_blank" rel="noopener">完整计算与来源记录 ↗</a></p></details>
 </div></section>`;
 const shell=el.querySelector('.sn-light-shell'),q=s=>shell.querySelector(s),qa=s=>[...shell.querySelectorAll(s)];
 function model(){const key=[state.nickelMass,state.ejectaMass,state.opacity,state.velocity].join('/');if(cache?.key!==key){cache={key,value:supernovaModel(state)};}return cache.value;}
 function draw(){
  if(disposed||!shell.isConnected)return;
  const m=model(),row=m.at(state.day),rows=sparse(m.samples),style=getGraphicStyle(shell),xTicks=[0,30,60,90,120],common={xDomain:[0,120],xTicks,xLabel:'爆发后时间 / d',onFontReady:false};
  const colors=[style.text,style.accent,style.muted];
  for(const key of Object.keys(SN_DEFAULTS))q(`[data-value="${key}"]`).textContent=key==='velocity'?String(state[key]):fixed(state[key],key==='day'||key==='ejectaMass'?1:2);
  q('[data-sn-tau]').textContent=fixed(m.tau,1);
  if(current==='diffusion'){
   const power=q('[data-sn-power]'),powerTop=Math.max(1,Math.ceil(rows[0].heating)),p=plot(power,{...common,series:[{points:rows.map(r=>[r.time,r.heating]),label:'沉积 Q̇',color:style.muted,dash:[5,4]},{points:rows.map(r=>[r.time,r.luminosity]),label:'光度 L',color:style.accent}],yDomain:[0,powerTop],yLabel:'功率 / 10³⁶ W',margins:{left:60,right:20,bottom:58}});
   marker(power,p,state.day,[[row.heating,style.muted],[row.luminosity,style.accent]]);
   power.setAttribute('aria-label',`${fixed(state.day,1)}天：沉积功率${fixed(row.heating)}，逸出光度${fixed(row.luminosity)}，单位10的36次方瓦。光度峰值在${fixed(m.peak.time,1)}天。`);
   q('[data-sn-peak-read]').textContent=`${fixed(m.peak.time,1)} d · ${fixed(m.peak.luminosity)} ×10³⁶ W`;
   energyFlow(q('[data-sn-flow]'),row,Math.max(...rows.map(r=>r.stored),1e-8));
   const limit=Math.max(.2,Math.ceil(rows.at(-1).deposited*5)/5),budget=q('[data-sn-budget]');
   const b=plot(budget,{...common,series:[{points:rows.map(r=>[r.time,r.deposited]),label:'沉积',color:style.muted,dash:[6,4]},{points:rows.map(r=>[r.time,r.stored]),label:'储存',color:style.text},{points:rows.map(r=>[r.time,r.escaped]),label:'逸出',color:style.accent},{points:rows.map(r=>[r.time,r.expansion]),label:'做功',color:style.muted,dash:[2,3]}],yDomain:[0,limit],yLabel:'能量 / 10⁴² J',margins:{left:60,right:20,bottom:58}});
   marker(budget,b,state.day,[[row.stored,style.text],[row.escaped,style.accent],[row.expansion,style.muted]]);
   for(const [key,value]of Object.entries({deposited:row.deposited,stored:row.stored,escaped:row.escaped,work:row.expansion}))q(`[data-sn-${key}]`).textContent=`${fixed(value,3)} ×10⁴² J`;
  }else{
   for(const [key,value]of Object.entries({ni:row.nickel,co:row.cobalt,fe:row.iron})){q(`[data-sn-${key}]`).textContent=`${fixed(value*100,1)}%`;q(`[data-sn-${key}-bar]`).style.flexGrow=String(value);}
   const population=q('[data-sn-population]'),a=plot(population,{...common,series:[{points:rows.map(r=>[r.time,r.nickel]),label:'⁵⁶Ni',color:colors[0]},{points:rows.map(r=>[r.time,r.cobalt]),label:'⁵⁶Co',color:colors[1]},{points:rows.map(r=>[r.time,r.iron]),label:'⁵⁶Fe',color:colors[2],dash:[5,4]}],yDomain:[0,1],yTicks:[0,.5,1],yLabel:'核数 / 初始镍核数',margins:{left:60,right:20,bottom:58}});marker(population,a,state.day,[[row.nickel,colors[0]],[row.cobalt,colors[1]],[row.iron,colors[2]]]);
   const heating=q('[data-sn-heating]'),b=plot(heating,{...common,series:[{points:rows.map(r=>[r.time,r.nickelHeating]),label:'镍',color:colors[0]},{points:rows.map(r=>[r.time,r.cobaltHeating]),label:'钴',color:colors[1]},{points:rows.map(r=>[r.time,r.heating]),label:'合计',color:colors[2],dash:[5,4]}],yDomain:[0,Math.max(1,Math.ceil(rows[0].heating))],yLabel:'沉积功率 / 10³⁶ W',margins:{left:60,right:20,bottom:58}});marker(heating,b,state.day,[[row.nickelHeating,colors[0]],[row.cobaltHeating,colors[1]]]);
   population.setAttribute('aria-label',`${fixed(state.day,1)}天：镍${fixed(row.nickel*100,1)}%，钴${fixed(row.cobalt*100,1)}%，铁${fixed(row.iron*100,1)}%。`);
  }
 }
 function schedule(){if(disposed||frame)return;frame=win.requestAnimationFrame(()=>{frame=0;draw();});}
 function setMode(next){if(!modes.includes(next))return;current=next;for(const b of qa('button[data-mode]'))b.setAttribute('aria-pressed',String(b.dataset.mode===next));for(const p of qa('[data-sn-panel]'))p.hidden=p.dataset.snPanel!==next;q('[data-sn-diffusion-controls]').hidden=next!=='diffusion';q('[data-diffusion-scale]').hidden=next!=='diffusion';draw();}
 const presentation=applyPresentation(shell,{surface:'paper',redraw:schedule}),navigation=mountWorkspaceNavigation(shell,{modeNav:q('.al-mode-nav'),actions:[q('[data-reset]')],label:'超新星光变导航'}),disclosures=bindDisclosures(shell),controls=bindControls(shell,state,schedule);
 const click=e=>{const b=e.target.closest('button');if(!b||!shell.contains(b))return;if(b.hasAttribute('data-mode'))setMode(b.dataset.mode);else if(b.hasAttribute('data-reset')){Object.assign(state,SN_DEFAULTS);syncControls(shell,state);draw();}else if(b.hasAttribute('data-sn-peak')){state.day=Math.round(model().peak.time*10)/10;syncControls(shell,state);draw();}};
 shell.addEventListener('click',click);const observer=new win.ResizeObserver(schedule);observer.observe(shell);setMode(current);
 const dispose=()=>{if(disposed)return;disposed=true;win.cancelAnimationFrame(frame);observer.disconnect();shell.removeEventListener('click',click);controls();disclosures();navigation();presentation();signal?.removeEventListener('abort',dispose);};signal?.addEventListener('abort',dispose,{once:true});return dispose;
}
