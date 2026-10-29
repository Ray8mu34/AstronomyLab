import {applyPresentation,bindDisclosures,getGraphicStyle} from '../shared/presentation.js';
import {mountWorkspaceNavigation} from '../shared/navigation.js';
import {bindControls,syncControls} from '../shared/core-controls.js';
import {plot} from '../shared/plot.js';
import {CCD,CALIBRATION_DEFAULTS,SYNTHETIC_STARS,makeCalibrationFrame,calibrateFrame,aperturePhotometry,curveOfGrowth} from './image-calibration-physics.mjs';

const modes=['calibration','photometry'];
const fixed=(v,n=1)=>Number(v).toFixed(n);
const range=(key,label,min,max,step)=>`<label class="al-parameter" for="ic-${key}"><span>${label}</span><output data-value="${key}"></output><input id="ic-${key}" type="range" data-key="${key}" min="${min}" max="${max}" step="${step}"></label>`;
const checkbox=(key,label)=>`<label class="ic-checkbox" for="ic-${key}"><input id="ic-${key}" type="checkbox" data-key="${key}"><span>${label}</span></label>`;
export async function mount(el,{mode='calibration',signal}={}){
 if(signal?.aborted)return()=>{};
 const state={...CALIBRATION_DEFAULTS},doc=el.ownerDocument,win=doc.defaultView;
 let current=modes.includes(mode)?mode:'calibration',disposed=false,scheduled=0,cache=null,growthCache=null;
 el.innerHTML=`<section class="ic-lab">
 <div class="al-mode-nav ic-mode-nav" role="group" aria-label="图像校准与测光模式"><button type="button" data-mode="calibration">校准</button><button type="button" data-mode="photometry">孔径测光</button></div>
 <button type="button" class="al-button" data-ic-reset>复位</button>
 <header class="ic-heading"><h1>图像校准与测光</h1><span>合成 CCD 视场 · 64 × 64 px · g = 2 e⁻/ADU</span></header>
 <div class="ic-acquisition">${range('exposure','曝光 / s',10,240,10)}<button type="button" class="al-button" data-ic-new>换一次曝光</button></div>
 <section data-ic-panel="calibration">
  <div class="ic-steps" role="group" aria-label="应用校准步骤">${checkbox('subtractBias','减偏置')}<span aria-hidden="true">→</span>${checkbox('subtractDark','减暗场')}<span aria-hidden="true">→</span>${checkbox('divideFlat','除平场')}</div>
  <div class="ic-calibration-images"><figure><figcaption><span>原始计数</span><span>ADU</span></figcaption><canvas data-ic-image="raw" role="img" tabindex="0" aria-label="原始 CCD 计数，点击或用方向键选择像素"></canvas></figure><figure><figcaption><span>处理结果</span><span>ADU</span></figcaption><canvas data-ic-image="processed" role="img" tabindex="0" aria-label="当前校准步骤处理后的 CCD 计数，点击或用方向键选择像素"></canvas></figure></div>
  <div class="ic-pixel-readout"><span data-ic-pixel></span><output data-ic-equation></output></div>
  <div class="ic-master-images"><figure><figcaption>主偏置 <span>ADU</span></figcaption><canvas data-ic-image="bias" role="img" aria-label="主偏置的固定条纹与估计噪声"></canvas><span class="ic-scale">560 — 640</span></figure><figure><figcaption>主暗场 × t <span>ADU</span></figcaption><canvas data-ic-image="dark" role="img" aria-label="主暗电流率乘当前曝光时间后的暗场"></canvas><span class="ic-scale" data-ic-dark-scale></span></figure><figure><figcaption>归一化主平场 <span>相对响应</span></figcaption><canvas data-ic-image="flat" role="img" aria-label="均值归一为一的主平场"></canvas><span class="ic-scale">0.3 — 1.5</span></figure></div>
 </section>
 <section data-ic-panel="photometry" hidden>
  <div class="ic-photometry-controls"><label class="al-parameter" for="ic-star">目标<select id="ic-star" data-key="star"><option value="a">恒星 A</option><option value="b">恒星 B</option></select></label>${range('aperture','孔径半径 / px',1,8,.25)}</div>
  <div class="ic-photometry-figures"><figure><figcaption><span>全校准图</span><span>ADU</span></figcaption><canvas data-ic-image="photometry" role="img" tabindex="0" aria-label="全校准图中的恒星孔径和天空环，点击选择恒星"></canvas><div class="ic-aperture-legend"><span>实线：恒星孔径</span><span>虚线：天空环 10–14 px</span></div></figure><figure class="ic-growth"><canvas data-ic-growth role="img" aria-label="孔径半径与背景扣除后的恒星计数率"></canvas><dl class="ic-photometry-results"><div><dt>孔径总计数</dt><dd><output data-ic-aperture-sum></output> e⁻</dd></div><div><dt>孔径内天空估计</dt><dd><output data-ic-sky-sum></output> e⁻</dd></div><div><dt>净计数率</dt><dd><output data-ic-net></output> <span class="ic-unit">e⁻ s⁻¹</span></dd></div><div><dt>设定恒星总计数率</dt><dd><output data-ic-true></output> <span class="ic-unit">e⁻ s⁻¹</span></dd></div></dl></figure></div>
 </section>
 <details class="al-disclosure ic-conditions"><summary>曝光、校准与显示条件</summary><div class="ic-condition-grid">${range('sky','天空 / e⁻ s⁻¹ px⁻¹',0,30,1)}${range('darkRate','暗电流 / e⁻ s⁻¹ px⁻¹',0,2,.1)}${range('flatStrength','响应不均匀程度',0,.8,.05)}${range('masterFrames','每种主校准帧的张数',1,64,1)}${range('white','图像显示白点 / ADU',100,6000,100)}${checkbox('noise','加入计数与校准噪声')}<label class="al-parameter" for="ic-seed">曝光样本编号<input id="ic-seed" type="number" data-key="seed" min="1" max="2147483647" step="1"></label></div><div class="ic-pixel-controls" data-ic-pixel-controls>${range('pixelX','像素 x',0,63,1)}${range('pixelY','像素 y',0,63,1)}</div></details>
 <details class="al-disclosure ic-method" data-learning-guide><summary>模型与来源</summary><p data-mode-boundary></p><p>两颗恒星具有像素积分的高斯点扩散函数，天空均匀。原始读数由相对响应、光子与暗电流计数、偏置和读出噪声构成。两幅主图共用 asinh 灰度映射与显示白点；图中数值单位为 ADU，增益为 2 e⁻/ADU。</p><p class="ic-formula">R = B + [Poisson(t · (F(S + b) + d)) + 读出噪声] / g<br>C = (R − B̂ − t d̂ / g) / F̂</p><p>主暗电流率与主平场已经完成加性校准；上游偏置与暗场校正取精确值，三个主校准量的估计噪声独立。主暗曝光为 120 s，平场每张平均 20000 e⁻/px，单张读出噪声为 5 e⁻。主平场除以全图均值。选择不同校准步骤只改变同一份原始数据；样本编号保留随机曝光。</p><p>孔径测光使用全校准数组。天空估计取 10–14 px 环内的加权均值，按孔径实际面积扣除。像素边缘使用 8 × 8 子像素面积权重；曲线给出各孔径的净计数率，虚线为生成恒星的总计数率。较小孔径只收集部分点扩散函数；当前合成视场的天空环远离另一颗恒星。</p><p class="ic-formula">N净 = g (Σ wᵢ Cᵢ − A孔径 · C̄天空)<br>计数率 = N净 / t</p><p><a href="/sources/image-calibration.md" target="_blank" rel="noopener">计算参数与来源记录 ↗</a></p></details>
 </section>`;
 const shell=el.querySelector('.ic-lab'),q=s=>shell.querySelector(s),qa=s=>[...shell.querySelectorAll(s)];
 for(const canvas of qa('canvas[data-ic-image]')){canvas.dataset.alSurface='image';canvas.dataset.alThemeFixed='dark';}
 function image(canvas,data,{low=0,high=state.white,linear=false,cursor=false,aperture=false}={}){
  const width=canvas.clientWidth,height=canvas.clientHeight,dpr=Math.min(win.devicePixelRatio||1,2),style=getGraphicStyle(canvas);
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);
  const buffer=doc.createElement('canvas');buffer.width=buffer.height=CCD.size;const bc=buffer.getContext('2d'),pixels=bc.createImageData(CCD.size,CCD.size);
  for(let i=0;i<data.length;i++){const v=Math.max(0,Math.min(1,(data[i]-low)/(high-low))),gray=Math.round(255*(linear?v:Math.asinh(v*6)/Math.asinh(6)));pixels.data.set([gray,gray,gray,255],4*i);}
  bc.putImageData(pixels,0,0);c.imageSmoothingEnabled=false;c.drawImage(buffer,0,0,width,height);
  if(cursor){const x=(state.pixelX+.5)*width/CCD.size,y=(state.pixelY+.5)*height/CCD.size;c.beginPath();c.moveTo(x-9,y);c.lineTo(x+9,y);c.moveTo(x,y-9);c.lineTo(x,y+9);c.strokeStyle=style.background;c.lineWidth=4;c.stroke();c.strokeStyle=style.accent;c.lineWidth=2;c.stroke();}
  if(aperture){const star=SYNTHETIC_STARS[state.star],x=(star.x+.5)*width/CCD.size,y=(star.y+.5)*height/CCD.size,unit=width/CCD.size;
   for(const radius of [state.aperture,10,14]){c.setLineDash(radius===state.aperture?[]:[5,4]);c.beginPath();c.arc(x,y,radius*unit,0,2*Math.PI);c.strokeStyle=style.background;c.lineWidth=3.6;c.stroke();c.strokeStyle=radius===state.aperture?style.text:style.accent;c.lineWidth=1.6;c.stroke();}c.setLineDash([]);
   c.font=style.labelFont;c.strokeStyle=style.background;c.lineWidth=3;c.lineJoin='round';c.fillStyle=style.text;for(const [key,item]of Object.entries(SYNTHETIC_STARS)){const tx=(item.x+.5)*unit+12,ty=(item.y+.5)*unit-10;c.strokeText(key.toUpperCase(),tx,ty);c.fillText(key.toUpperCase(),tx,ty);}
  }
 }
 function data(){const key=['exposure','sky','darkRate','flatStrength','masterFrames','noise','seed'].map(k=>state[k]).join('/');if(cache?.key!==key){const frame=makeCalibrationFrame(state);cache={key,frame,calibrated:calibrateFrame(frame)};growthCache=null;}return cache;}
 function draw(){
  if(disposed||!shell.isConnected)return;
  const {key,frame,calibrated}=data();
  if(current==='calibration'){
   const processed=calibrateFrame(frame,state),i=state.pixelY*CCD.size+state.pixelX;
   image(q('[data-ic-image="raw"]'),frame.raw,{cursor:true});image(q('[data-ic-image="processed"]'),processed,{cursor:true});
   q('[data-ic-pixel]').textContent=`像素 (${state.pixelX}, ${state.pixelY})`;
   q('[data-ic-equation]').textContent=`${fixed(frame.raw[i])}${state.subtractBias?' − '+fixed(frame.masterBias[i]):''}${state.subtractDark?' − '+fixed(frame.masterDark[i]*state.exposure/CCD.gain):''}${state.divideFlat?'，再 ÷ '+fixed(frame.masterFlat[i],3):''} → ${fixed(processed[i])} ADU`;
   image(q('[data-ic-image="bias"]'),frame.masterBias,{low:560,high:640,linear:true});
   const dark=frame.masterDark.map(v=>v*state.exposure/CCD.gain),darkTop=Math.max(10,...dark);image(q('[data-ic-image="dark"]'),dark,{high:darkTop,linear:true});q('[data-ic-dark-scale]').textContent=`0 — ${fixed(darkTop)}`;
   image(q('[data-ic-image="flat"]'),frame.masterFlat,{low:.3,high:1.5,linear:true});
   q('[data-ic-image="processed"]').setAttribute('aria-label',`处理图，像素 ${state.pixelX},${state.pixelY} 的结果 ${fixed(processed[i])} ADU。减偏置${state.subtractBias?'开启':'关闭'}，减暗场${state.subtractDark?'开启':'关闭'}，除平场${state.divideFlat?'开启':'关闭'}。`);
  }else{
   image(q('[data-ic-image="photometry"]'),calibrated,{aperture:true});
   const star=SYNTHETIC_STARS[state.star],m=aperturePhotometry(calibrated,CCD.size,{...star,radius:state.aperture}),style=getGraphicStyle(shell),growthKey=key+'/'+state.star;
   if(growthCache?.key!==growthKey)growthCache={key:growthKey,points:curveOfGrowth(frame,calibrated,state.star)};
   const values=growthCache.points.map(p=>p[1]),lo=Math.min(0,...values),hi=Math.max(star.rate,...values)*1.15;
   const chart=plot(q('[data-ic-growth]'),{series:[{points:growthCache.points,label:'孔径净计数率',color:style.accent},{points:[[1,star.rate],[8,star.rate]],label:'设定总计数率',color:style.muted,dash:[5,4]}],xDomain:[1,8],xTicks:[1,2,4,6,8],yDomain:[lo,hi],xLabel:'孔径半径 / px',yLabel:'计数率 / e⁻ s⁻¹',margins:{left:60,right:18,bottom:55},onFontReady:false});
   const c=q('[data-ic-growth]').getContext('2d'),[x,y]=chart.toPixel(state.aperture,m.net*CCD.gain/state.exposure);c.strokeStyle=style.accent;c.fillStyle=style.background;c.lineWidth=2;c.beginPath();c.arc(x,y,5,0,2*Math.PI);c.fill();c.stroke();
   q('[data-ic-aperture-sum]').textContent=fixed(m.sum*CCD.gain,0);q('[data-ic-sky-sum]').textContent=fixed(m.skyTotal*CCD.gain,0);q('[data-ic-net]').textContent=fixed(m.net*CCD.gain/state.exposure);q('[data-ic-true]').textContent=star.rate;
   q('[data-ic-growth]').setAttribute('aria-label',`恒星 ${state.star.toUpperCase()}，孔径半径 ${state.aperture} 像素，扣除天空后 ${fixed(m.net*CCD.gain/state.exposure)} 电子每秒；生成模型总计数率 ${star.rate} 电子每秒。`);
  }
 }
 function queue(){if(!disposed&&!scheduled)scheduled=win.requestAnimationFrame(()=>{scheduled=0;draw();});}
 function changeMode(next){if(!modes.includes(next))return;current=next;for(const b of qa('button[data-mode]'))b.setAttribute('aria-pressed',String(b.dataset.mode===next));for(const p of qa('[data-ic-panel]'))p.hidden=p.dataset.icPanel!==next;q('[data-ic-pixel-controls]').hidden=next!=='calibration';draw();}
 const presentation=applyPresentation(shell,{surface:'paper',redraw:queue}),navigation=mountWorkspaceNavigation(shell,{modeNav:q('.ic-mode-nav'),actions:[q('[data-ic-reset]')],label:'图像校准与测光导航'}),disclosures=bindDisclosures(shell),controls=bindControls(shell,state,()=>{
  if(!Number.isInteger(state.seed)||state.seed<1||state.seed>2147483647)state.seed=CALIBRATION_DEFAULTS.seed;
  syncControls(shell,state);queue();
 });
 function update(keys){Object.assign(state,keys);syncControls(shell,state);queue();shell.dispatchEvent(new win.Event('input',{bubbles:true}));}
 const click=e=>{
  const button=e.target.closest('button');if(button?.dataset.mode)changeMode(button.dataset.mode);
  else if(button?.hasAttribute('data-ic-reset')){Object.assign(state,CALIBRATION_DEFAULTS);syncControls(shell,state);queue();}
  else if(button?.hasAttribute('data-ic-new'))update({seed:state.seed===2147483647?1:state.seed+1});
  const canvas=e.target.closest('canvas[data-ic-image]');if(!canvas||!['raw','processed','photometry'].includes(canvas.dataset.icImage))return;
  const r=canvas.getBoundingClientRect(),x=Math.max(0,Math.min(63,(e.clientX-r.left)/r.width*64-.5)),y=Math.max(0,Math.min(63,(e.clientY-r.top)/r.height*64-.5));
  if(canvas.dataset.icImage==='photometry')update({star:Object.entries(SYNTHETIC_STARS).sort((a,b)=>Math.hypot(a[1].x-x,a[1].y-y)-Math.hypot(b[1].x-x,b[1].y-y))[0][0]});else update({pixelX:Math.round(x),pixelY:Math.round(y)});
 };
 const keydown=e=>{const canvas=e.target.closest('canvas[data-ic-image]');if(!canvas||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();if(canvas.dataset.icImage==='photometry')update({star:state.star==='a'?'b':'a'});else update({pixelX:Math.max(0,Math.min(63,state.pixelX+(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0))),pixelY:Math.max(0,Math.min(63,state.pixelY+(e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0)))});};
 shell.addEventListener('click',click);shell.addEventListener('keydown',keydown);const resize=new win.ResizeObserver(queue);resize.observe(shell);syncControls(shell,state);changeMode(current);
 const dispose=()=>{if(disposed)return;disposed=true;win.cancelAnimationFrame(scheduled);resize.disconnect();shell.removeEventListener('click',click);shell.removeEventListener('keydown',keydown);controls();disclosures();navigation();presentation();signal?.removeEventListener('abort',dispose);};signal?.addEventListener('abort',dispose,{once:true});return dispose;
}
