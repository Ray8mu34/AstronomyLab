import {getGraphicStyle} from '../shared/presentation.js';
import {registerExperimentModel,validateExperimentModel} from '../shared/experiment-state.js';
import {plot} from '../shared/plot.js';
import * as P from './light-physics.mjs';
import {teachingBands,energyDensity,teachingPhotometry} from './light-teaching.mjs';
import {attachThermalUI} from './light-thermal-ui.js';
import {attachMotionUI} from './light-motion-ui.js';
import {attachMagnitudeUI} from './light-magnitude-ui.js';
import {attachObservingUI} from './light-observing-ui.js';

const range=(key,label,min,max,step,unit='')=>`<label class="control">${label}<output data-value="${key}"></output><input type="range" aria-label="${label}${unit?' / '+unit:''}" data-key="${key}" min="${min}" max="${max}" step="${step}"><small>${unit}</small></label>`;
const copies={
 thermal:`<h3>一条连续谱，连接面积与温度</h3><p>把温度从3000 K增加到10000 K，峰向短波移动，但红光并没有消失。在每单位波长的表示中， 温度更高的黑体在所有波长都辐射得更多。请先保留绝对纵轴，再勾选各自峰值归一：第二种画法保留形状，却消去了单位面积发光能力的差别。</p><p>维恩峰属于一个分布密度。把横轴改成频率时，每个区间的宽度也改变，所以Bν的峰不能由Bλ峰简单取倒数得到。太阳的近似波长峰靠近可见区，不意味着太阳只发绿色光；综合色觉还依赖整段光谱与感光响应。这里不把单一谱峰涂成“恒星真实颜色”。</p><p>光谱的面积给出单位表面的能量通量，而恒星还有半径。半径扩大两倍，面积扩大四倍；温度扩大两倍，单位面积功率扩大十六倍。把两者联合起来，就能理解一颗偏冷的大星为何可能比热而小的恒星更有光度。真正恒星还需要大气模型、消光与缺失波段校正，本实验用理想黑体建立量的关系。</p><div class="formula">Bλ=2hc²/[λ⁵(exp(hc/λkT)−1)]<br>λmaxT=2.89777×10⁶ nm·K；L=4πR²σT⁴</div>`,
 motion:`<h3>让线中心移动，让线的两翼展开</h3><p>先把旋转速度设为零，仅改变径向速度。整条吸收线移动：远离为正，波长增加；靠近则减少。蓝灰参考线始终停在静止的656.28 nm。本模型以这条参考线展示低速多普勒位移、旋转与仪器展宽。</p><p>现在把径向速度设回零，增大赤道自转速度。圆面两侧呈现相反的视线速度，只有它们合起来才形成一条展宽的线。再把自转轴转到正对观察者：自转仍然存在，v sin i却接近零。单凭展宽通常只能限制投影自转速度，不能分别测定v与i。图中红蓝表示运动符号，与温度或元素颜色无关。</p><p>加宽还可能来自热运动、压力与仪器。这里以固定内禀高斯线、可调仪器高斯响应及线性临边昏暗旋转核做卷积，保持吸收等效宽度；旋转不是把整条线平移。降低分辨本领后细节混合，也不说明高信噪比时线中心只能按c/ℛ整数跳动。实际精密测量仍须模板、参考光源与稳定标定。</p><div class="formula">Δλ/λ₀≈vᵣ/c；v投影=v赤道 sin i<br>仪器FWHM速度=c/ℛ；归一旋转核与高斯线卷积</div>`,
 magnitude:`<h3>把明亮分成发出、传播与接收</h3><p>把同一颗星从10 pc移到100 pc，单位面积收到的能量变成百分之一，星等增加五。恒星本身没有因此减少光度；距离只是把相同能量铺到更大的球面。本图同时显示实际总辐射通量、相对10 pc的星等差与距离模数，所有比较采用同一个总辐射定义。</p><p>改变消光，亮度也会下降，距离却没有移动。若把一等消光全误认成距离，推断距离将高估约1.585倍。再改变半径或温度，恒星本身的光度又变化，所以同样亮的两个点可以来自不同面积、不同温度、不同距离与不同传播损失。</p><p>这里给出的星等是相对于当前模型在10 pc、无消光的同一恒星的差值，不是带绝对零点的V星等。真实滤镜有通带和零点，B−V也不等于两个没有校准的像素计数之差。请用本实验理解比值与退化，不同波段仍须采用各自的计量规则。</p><div class="formula">F=L/(4πd²)·10⁻⁰·⁴ᴬ<br>Δm=−2.5 log₁₀(F/F₁₀pc)=5 log₁₀(d/10 pc)+A</div>`,
 observing:`<h3>减掉背景均值，留下了什么</h3><p>目标在较低天空时，光穿过更多空气。这里将高度限制在10°以上，用X≈1/sin h建立平行大气近似；接近地平线时它失效，不能把曲线外推成精确地平线消光。消光系数由当前参数设定，表示指定波段的大气衰减。</p><p>天空背景在相机里不是遮住星光的黑帘，而是叠加的光子。减去平均背景以后，目标仍在，但此次到达的光子的随机涨落无法一并减去。下图用固定种子的计数样本显示减均值后的剖面，避免每次滑动同时换一幅噪声而难以比较；“换一次噪声”才改变样本。</p><p>总曝光增加四倍，光子噪声占主导时信噪比约增加两倍。把同一总时间拆成更多帧，则重复支付读出方差；短帧可以帮助避免饱和与剔除异常，这些工程收益没有被简化SNR公式全部计入。背景、透明度、视宁度与暗适应是不同限制，本实验计算的是相机孔径计数，不把结果直接当成人眼可见性阈值。</p><div class="formula">X≈1/sin h；T大气=10⁻⁰·⁴ᵏˣ<br>SNR=st/√(st+bt+n像素 d t+n像素 n帧 r²)</div>`
};
export function mount(el){
 const state={mode:'thermal',temperature:5800,radius:1,distance:10,extinction:0,dustPower:1.3,normalize:false,references:false,vr:0,veq:60,inclination:90,epsilon:.6,resolution:40000,height:60,k:.2,signal:1,background:9,exposure:100,frames:1,npix:9,read:3,seed:4};
 const defaults={...state},keys={thermal:['temperature','radius','normalize','references'],motion:['vr','veq','inclination','epsilon','resolution'],magnitude:['temperature','radius','distance','extinction','dustPower'],observing:['height','k','signal','background','exposure','frames','npix','read','seed']};
 const baselines=Object.fromEntries(Object.keys(keys).map(mode=>[mode,{...defaults,mode}]));
 const questions={thermal:['温度改变的是形状，还是整条谱的能量？','试试 3000 K 与 10000 K，再展开“按峰值归一”。看峰的位置与光度，半径只改变总光度，不改变单位表面 Bλ。'],motion:['移动谱线与加宽谱线，能分开看吗？','先改径向速度，再改自转速度；将倾角降为 0°。看中心波长与 v sin i，圆面颜色只编码运动。'],magnitude:['变远、变冷、隔着尘埃：都变暗，但一样吗？','三个预设每次只改变一项。看两个通带的通量，以及短波／长波的比值；距离只改幅度，温度和消光也会改谱形。'],observing:['背景减掉了，噪声为什么还留着？','固定同一噪声样本，比较曝光 100 s 与 400 s。看 SNR；展开分帧设置，可比较更多读出带来的方差。']};
 const presets={thermal:{cold:{temperature:3000},solar:{temperature:5800},hot:{temperature:10000}},motion:{rest:{vr:0,veq:0,inclination:90},recede:{vr:150,veq:0,inclination:90},spin:{vr:0,veq:120,inclination:90},pole:{vr:0,veq:120,inclination:0}},magnitude:{near:{temperature:5800,radius:1,distance:10,extinction:0,dustPower:1.3},far:{temperature:5800,radius:1,distance:100,extinction:0,dustPower:1.3},cool:{temperature:3500,radius:1,distance:10,extinction:0,dustPower:1.3},dust:{temperature:5800,radius:1,distance:10,extinction:1,dustPower:1.3}},observing:{short:{exposure:100},long:{exposure:400},bright:{background:30},dark:{background:2}}};
 const presetLabels={cold:'3000 K',solar:'5800 K',hot:'10000 K',rest:'静止',recede:'远离',spin:'快速自转',pole:'轴朝视线',near:'近 · 无尘',far:'只变远',cool:'只变冷',dust:'只加尘埃',short:'100 s',long:'400 s',bright:'亮背景',dark:'暗背景'};
 let disposed=false,result={},observer,thermalUI,motionUI,magnitudeUI,observingUI;
 el.classList.add('light-pilot');
 el.innerHTML=`<div class="lab-tabs" aria-label="星光实验模式">${[['thermal','连续谱'],['motion','谱线与运动'],['magnitude','双通带与距离'],['observing','观测与噪声']].map(([k,n])=>`<button data-mode="${k}" aria-pressed="false">${n}</button>`).join('')}</div><div class="light-question"><h2 data-question></h2><details><summary>观察建议（可跳过）</summary><p data-hint></p></details></div><div class="light-workbench"><section class="light-visual"><h3 class="panel-title" id="light-title"></h3><canvas class="plot-canvas" id="light-plot" role="img" aria-label="当前星光模型曲线，数值见下方读数"></canvas><div class="metrics" id="light-metrics"></div><div class="light-compare" data-comparison></div><div class="legend" id="light-legend"></div><div class="light-band-note" data-band-note hidden>S：400–500 nm；L：600–700 nm。矩形能量通带；C 以两通带等能量为零参照。</div></section><aside class="light-controls"><div id="light-controls"></div><div class="light-actions"><button data-save>保存基线</button><button data-restore>回到基线</button><button data-reset>复位本模式</button></div><p class="light-feedback" data-feedback role="status" aria-live="polite"></p></aside></div><details class="light-auxiliary"><summary data-aux-label>展开球面传播示意</summary><canvas class="plot-canvas" id="light-aux" role="img" aria-label="辅助示意图，非实测数据"></canvas></details><details class="light-explanation"><summary>原理与公式</summary><article class="lab-copy" id="light-copy"></article></details><div class="light-links"><a href="/sources/light.md" target="_blank" rel="noopener">原模型与来源 ↗</a><a href="/lab/imaging">进入图像实验 →</a></div>`;
 const q=s=>el.querySelector(s),f=(x,d=2)=>Number(x).toFixed(d),scientific=x=>x.toExponential(2),say=s=>q('[data-feedback]').textContent=s;
 function controls(){
  thermalUI?.beforeControls();
  motionUI?.beforeControls();
  magnitudeUI?.beforeControls();
  observingUI?.beforeControls();
  const advance=body=>`<details class="light-advanced"><summary>更多参数与细节</summary><div>${body}</div></details>`;
  const common=range('temperature','有效温度',2500,15000,100,'K');
  q('#light-controls').innerHTML=state.mode==='thermal'?common+range('radius','半径',.1,20,.1,'R☉')+advance(`<label class="light-check"><input type="checkbox" data-key="normalize">按各自峰值归一（消去幅度）</label><label class="light-check"><input type="checkbox" data-key="references">显示 3000 K／10000 K 固定对照</label><p class="note">当前与保存基线默认同轴比较。Bλ 是单位表面辐射，半径改变下方总光度。</p>`):
  state.mode==='motion'?range('vr','径向速度 · 远离为正',-250,250,1,'km/s')+range('veq','赤道自转速度',0,250,1,'km/s')+range('inclination','轴与视线夹角 i',0,90,1,'°')+advance(range('epsilon','临边昏暗系数',0,1,.05)+`<label class="control">光谱分辨本领 ℛ<select data-key="resolution"><option value="5000">5000</option><option value="10000">10000</option><option value="40000">40000</option><option value="100000">100000</option></select></label><p class="note">长虚线：同速度、不旋转；灰色：保存基线；点虚线：静止参考。</p>`):
  state.mode==='magnitude'?common+range('distance','距离',1,500,1,'pc')+range('extinction','550 nm 消光 A₅₅₀',0,5,.1,'mag · 人工幂律教学近似')+advance(range('radius','半径',.1,20,.1,'R☉')+range('dustPower','消光幂指数 p',0,2,.1,'Aλ = A₅₅₀ (λ/550 nm)⁻ᵖ；p=0 为灰消光')+`<div data-band-details></div><p class="note">谱形为理想黑体，积分步长 0.5 nm。矩形通带内能量响应为 1，外为 0；没有探测器光子响应、标准零点、真实大气谱线或滤镜标定。幂指数为人工选择。</p><div data-grey-details></div>`):
  range('exposure','总曝光',10,2000,10,'s')+range('background','孔径总背景率',0,40,.5,'e⁻/s')+range('height','天体几何高度',10,90,1,'° · 平行大气近似')+advance(range('k','假定消光系数',0,.8,.01,'mag/airmass')+range('signal','大气外孔径总信号率',.1,10,.1,'e⁻/s')+range('frames','读出次数',1,100,1)+range('read','每像素每次读出噪声',0,10,.5,'e⁻；固定9像素、暗电流0.02 e⁻/s/像素')+`<button data-noise>换一次噪声</button><p class="note">随机剖面为独立逐像素示意，不用来拟合孔径 SNR。</p>`);
  q('#light-controls').insertAdjacentHTML('beforeend',`<div class="light-presets" aria-label="当前模式预设">${Object.keys(presets[state.mode]).map(k=>`<button data-preset="${k}" aria-pressed="false">${presetLabels[k]}</button>`).join('')}</div>`);
  for(const input of q('#light-controls').querySelectorAll('[data-key]')){const k=input.dataset.key;input.type==='checkbox'?input.checked=state[k]:input.value=state[k];}
  q('#light-copy').innerHTML=copies[state.mode].replace('hotter 的','温度较高的').replace('colder 的','温度较低的');
  if(state.mode==='magnitude')q('#light-copy').insertAdjacentHTML('afterbegin',`<h3>两段能量：把谱形变化与距离分开</h3><p>主图以理想黑体计算每纳米接收通量，两条矩形教学通带分别积分 400–500 nm 与 600–700 nm。距离增大十倍，两段通量都变为百分之一，所以比值和教学指数 C 不变；冷却通常降低短波／长波比。人工消光律 Aλ=A₅₅₀(λ/550 nm)⁻ᵖ 在 p&gt;0 时更强地损失短波，制造变红与变暗的退化。p=0 可单独对照灰消光。</p><div class="formula">Fλ=πBλ(T)(R/d)²10⁻⁰·⁴ᴬλ<br>F<sub>S,L</sub>=∫通带 Fλdλ；C=−2.5 log₁₀(FS/FL)</div><p>C 以两段等能量为零参照，用于比较当前模型的谱形；消光采用可调幂律。下面的总辐射灰消光说明保留为独立简化模型，不能将 A₅₅₀ 当作真实总辐射消光校正。波长相关消光机制可参阅 <a href="https://ned.ipac.caltech.edu/level5/Sept07/Li1/Li2.html" target="_blank" rel="noopener">Li：散射与吸收的定义</a>；长波较少受遮蔽的观测实例见 <a href="https://www.eso.org/public/news/eso9856/" target="_blank" rel="noopener">ESO ISAAC 的 RCW38 说明</a>。本演示的幂律与通带均为自选教学参数。</p>`);
  const [question,hint]=questions[state.mode];q('[data-question]').textContent=question;q('[data-hint]').textContent=hint;
  q('[data-aux-label]').textContent=({thermal:'展开球面传播示意',motion:'展开迎向／离开视线的圆面',magnitude:'展开球面传播示意',observing:'展开固定样本的噪声剖面'})[state.mode];
  q('[data-band-note]').hidden=state.mode!=='magnitude';
  const velocityLegend=q('[data-motion-velocity]');if(velocityLegend)velocityLegend.hidden=state.mode!=='motion';
  if(state.mode!=='motion')q('#light-aux').setAttribute('aria-label','辅助示意图，非实测数据');
  for(const b of el.querySelectorAll('[data-mode]')){const active=b.dataset.mode===state.mode;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));}
 }
 function drawPlot(canvas,options){const frame=plot(canvas,options);if(canvas.id==='light-plot'&&window.__lab?.name==='light')window.__lab.plot={xDomain:[...options.xDomain],yDomain:[...options.yDomain],xTicks:frame.xTicks,yTicks:frame.yTicks,bounds:frame.bounds};return frame;}
 function auxBase(){const c=q('#light-aux'),dpr=Math.min(devicePixelRatio,2),w=c.clientWidth||600,h=c.clientHeight||220;c.width=w*dpr;c.height=h*dpr;const ctx=c.getContext('2d'),style=getGraphicStyle(c);ctx.scale(dpr,dpr);ctx.fillStyle=style.background;ctx.fillRect(0,0,w,h);ctx.font=style.labelFont;return {ctx,w,h,style};}
 function sphereDiagram(){const{ctx,w,h,style}=auxBase(),cx=w*.28,cy=h*.53;for(let i=1;i<=3;i++){ctx.strokeStyle=['',style.focus,style.accent,style.muted][i];ctx.beginPath();ctx.ellipse(cx,cy,22*i,19*i,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle=ctx.strokeStyle;ctx.fillText(`${i}d：${i*i}倍面积`,cx+77,cy+(i-2)*31);}ctx.fillStyle=style.focus;ctx.beginPath();ctx.arc(cx,cy,6,0,Math.PI*2);ctx.fill();ctx.fillStyle=style.text;ctx.fillText('同一份能量穿过更大的球面',12,22);ctx.fillText('圆环：球面剖面，非恒星轨道',12,h-16);}
 function disk(){
  const{ctx,w,h,style}=auxBase(),cx=w*.5,cy=h*.5,r=Math.min(h*.34,w*.24),vmax=result.vmax;
  // The UI permits |vr| <= 250 and 0 <= vmax <= 250 km/s. Keep one
  // observer-frame scale across parameter changes, including limb darkening.
  for(let y=-r;y<=r;y+=2)for(let x=-r;x<=r;x+=2)if(x*x+y*y<=r*r){
   const mu=Math.sqrt(Math.max(0,1-(x*x+y*y)/r/r)),intensity=1-state.epsilon*(1-mu),v=state.vr+x/r*vmax,ratio=P.clamp(v/500,-1,1);
   ctx.fillStyle=`rgb(${Math.round((155+100*ratio)*intensity)},${Math.round(155*intensity)},${Math.round((155-100*ratio)*intensity)})`;ctx.fillRect(cx+x,cy+y,2.2,2.2);
  }
  ctx.strokeStyle=style.text;ctx.beginPath();ctx.moveTo(cx,cy-r-10);ctx.lineTo(cx,cy+r+10);ctx.stroke();ctx.fillStyle=style.text;
  const label=v=>`${v>0?'+':''}${f(v,1)} km/s · ${v>0?'远离':v<0?'接近':'静止'}`;
  ctx.fillText(`左缘 ${label(state.vr-vmax)}`,12,22);
  ctx.fillText(`中心 ${label(state.vr)}`,12,42);
  ctx.fillText(`右缘 ${label(state.vr+vmax)}`,12,h-12);
 }
 function metrics(items){q('#light-metrics').innerHTML=items.map(([a,b])=>`<div><small>${a}</small><strong>${b}</strong></div>`).join('');}
 function update(){if(disposed)return;let observationSample=null;
  thermalUI?.setMode(state.mode);
  motionUI?.setMode(state.mode);
  magnitudeUI?.setMode(state.mode);
  observingUI?.setMode(state.mode);
  for(const out of el.querySelectorAll('[data-value]'))out.textContent=String(state[out.dataset.value]);
  for(const b of el.querySelectorAll('[data-preset]')){const active=Object.entries(presets[state.mode][b.dataset.preset]).every(([k,v])=>state[k]===v);b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));}
  const main=q('#light-plot'),style=getGraphicStyle(main),base=baselines[state.mode],plotOptions={onFontReady:false,margins:{left:innerWidth<600?78:98,right:24,top:22,bottom:62},showLegend:false};let compare='';
  if(state.mode==='thermal'){
   const make=(T,color,label)=>({label,color,points:Array.from({length:501},(_,i)=>{const nm=100+i*3.8;return[nm,P.planck(nm,T)/(state.normalize?P.planck(P.peakNM(T),T):1e13)];})});
   const series=[...((thermalUI?.comparing??true)?[{...make(base.temperature,style.muted,'基线'),dash:[5,4]}]:[]),make(state.temperature,style.accent,'当前')];
   if(state.references)series.push({...make(3000,style.text,'3000 K'),dash:[2,3]},{...make(10000,style.focus,'10000 K'),dash:[7,3]});
   const drawing=drawPlot(main,{...plotOptions,series,xDomain:[100,2000],xTicks:main.clientWidth<600?[100,500,1000,2000]:[100,500,1000,1500,2000],yDomain:[0,Math.max(...series.flatMap(s=>s.points.map(p=>p[1])))*1.08],xLabel:'波长 / nm',yLabel:state.normalize?'各自峰值=1':'Bλ / 10¹³ W·m⁻³·sr⁻¹'});
   result={peak:P.peakNM(state.temperature),luminosity:P.luminosity(state.radius,state.temperature),surfaceFlux:P.SIGMA*state.temperature**4};sphereDiagram();
   q('#light-title').textContent='单位表面连续谱 · 当前与基线同轴';q('#light-legend').textContent='青：当前；灰：保存基线。理想黑体 · 图窗 100–2000 nm。';
   metrics([['波长谱峰',`${f(result.peak,1)} nm`],['总光度',`${scientific(result.luminosity)} W`],['表面功率',`${scientific(result.surfaceFlux)} W/m²`]]);
   compare=`基线 ${base.temperature} K / ${base.radius} R☉ → 谱峰变化 ${f(result.peak-P.peakNM(base.temperature),1)} nm；总光度 ${f(result.luminosity/P.luminosity(base.radius,base.temperature))} 倍`;
   thermalUI?.render({state,result,base,drawing,series,peakValue:P.planck(result.peak,state.temperature)/(state.normalize?P.planck(result.peak,state.temperature):1e13)});
  }else if(state.mode==='motion'){
   result=P.lineProfile(state);const previous=P.lineProfile(base);
   const drawing=drawPlot(main,{...plotOptions,series:[...((motionUI?.comparing??true)?[{points:previous.points,color:style.muted,dash:[5,4]}]:[]),{points:result.base,color:style.focus,dash:[7,3]},{points:result.points,color:style.accent},{points:[[656.28,0],[656.28,1.05]],color:style.muted,dash:[2,4]}],xDomain:[654.96,657.60],xTicks:main.clientWidth<600?[655,656.28,657.5]:[655,655.5,656,656.5,657,657.5],yDomain:[0,1.07],yTicks:[0,.5,1],xLabel:'波长 / nm',yLabel:'连续谱归一通量',xFormat:x=>x.toFixed(2)});disk();
   const velocityLabel=v=>`${v>0?'+':''}${f(v,1)}`;
   q('#light-aux').setAttribute('aria-label',`相对观测者的总视向速度圆面：左缘 ${velocityLabel(state.vr-result.vmax)}，中心 ${velocityLabel(state.vr)}，右缘 ${velocityLabel(state.vr+result.vmax)} km/s；负为接近，零为静止，正为远离。`);
   let velocityLegend=q('[data-motion-velocity]');if(!velocityLegend){velocityLegend=document.createElement('p');velocityLegend.dataset.motionVelocity='';q('#light-aux').after(velocityLegend);}
   velocityLegend.textContent='相对观测者：v_los = vᵣ + (x/R) v sin i。蓝 < 0 接近；灰 = 0 静止；红 > 0 远离。固定色阶 −500 至 +500 km/s；亮度含临边昏暗。';
   q('#light-title').textContent='线中心与线宽 · 两种运动信号';q('#light-legend').textContent='实线：当前卷积；长虚线：同速度无自转；点虚线：656.28 nm。保存基线按需对照；内禀 σ=4 km/s，低速多普勒。';
   metrics([['线中心',`${f(result.centre,3)} nm`],['v sin i',`${f(result.vmax,1)} km/s`],['仪器 FWHM',`${f(P.C/1000/state.resolution,1)} km/s`]]);
   compare=`对比基线：中心变化 ${f(result.centre-previous.centre,3)} nm；投影自转变化 ${f(result.vmax-previous.vmax,1)} km/s`;
   motionUI?.render({state,result,base,drawing});
  }else if(state.mode==='magnitude'){
   const L=P.luminosity(state.radius,state.temperature),F=P.flux(L,state.distance,state.extinction),deltam=P.distanceModulus(state.distance,state.extinction),bands=teachingPhotometry(state),previous=teachingPhotometry(base);
   result={luminosity:L,flux:F,deltam,ratio:F/P.flux(L,10),photometry:bands};
   const spectrum=s=>Array.from({length:251},(_,i)=>{const nm=350+i*2;return[nm,energyDensity(nm,s)/1e-12];});
   const current=spectrum(state),prior=spectrum(base),comparing=magnitudeUI?.comparing??true,ymax=Math.max(...current.map(p=>p[1]),...(comparing?prior.map(p=>p[1]):[]))*1.12;
   const dims=drawPlot(main,{...plotOptions,series:[...((magnitudeUI?.comparing??true)?[{points:prior,color:style.muted,label:'基线'}]:[]),{points:current,color:style.accent,label:'当前'}],xDomain:[350,850],xTicks:main.clientWidth<600?[350,500,700,850]:[350,400,500,600,700,800,850],yDomain:[0,ymax],xLabel:'波长 / nm',yLabel:'Fλ / 10⁻¹² W m⁻² nm⁻¹'});
   const ctx=main.getContext('2d');for(const [i,b] of teachingBands.entries()){const [x0,y0]=dims.toPixel(b.lo,0),[x1,y1]=dims.toPixel(b.hi,ymax);ctx.fillStyle=i?style.accent:style.focus;ctx.globalAlpha=.12;ctx.fillRect(x0,y1,x1-x0,y0-y1);ctx.globalAlpha=1;ctx.fillStyle=style.text;ctx.font=style.labelFont;ctx.textAlign='center';ctx.fillText(main.clientWidth<600?(i?'L':'S'):(i?'L 600–700':'S 400–500'),(x0+x1)/2,y1+35);}
   sphereDiagram();q('#light-title').textContent='双通带能量 · 谱形与幅度一起比较';q('#light-legend').textContent='青线：当前接收谱；灰线：保存基线；阴影：两段积分区间。自动纵轴；基线开启后同轴对照。';
   metrics([['短波／长波 FS/FL',f(bands.ratio,3)],['短波 S 通量',`${scientific(bands.bands[0].flux)} W/m²`],['长波 L 通量',`${scientific(bands.bands[1].flux)} W/m²`]]);
   compare=`相对基线：S ${f(bands.bands[0].flux/previous.bands[0].flux,3)} 倍；L ${f(bands.bands[1].flux/previous.bands[1].flux,3)} 倍；ΔC ${f(bands.index-previous.index,3)} mag`;
   const details=q('[data-band-details]');if(details)details.innerHTML=`<table class="light-table"><caption>能量积分与教学指数</caption><tr><th>量</th><th>基线</th><th>当前</th></tr><tr><td>FS/FL</td><td>${f(previous.ratio,4)}</td><td>${f(bands.ratio,4)}</td></tr><tr><td>C / mag</td><td>${f(previous.index,4)}</td><td>${f(bands.index,4)}</td></tr></table>`;
   const grey=q('[data-grey-details]');if(grey)grey.textContent=`独立灰消光总辐射近似：F=${scientific(F)} W/m²；相对当前模型 10 pc / 无消光：Δm=${f(deltam,3)} mag。此处数值沿用原灰模型，不作为双通带校正。`;
   magnitudeUI?.render({state,result,base,drawing:dims});
  }else{
   const transmission=P.throughput(state.height,state.k),s=state.signal*transmission,args={s,b:state.background,t:state.exposure,npix:state.npix,frames:state.frames,read:state.read},priorArgs={s:base.signal*P.throughput(base.height,base.k),b:base.background,t:base.exposure,npix:base.npix,frames:base.frames,read:base.read};
   result={...P.snr(args),transmission,airmass:P.airmass(state.height)};
   drawPlot(main,{...plotOptions,series:[...((observingUI?.comparing??true)?[{points:Array.from({length:201},(_,i)=>{const t=10+i*10;return[t,P.snr({...priorArgs,t}).snr];}),color:style.muted,label:'基线'}]:[]),{points:Array.from({length:201},(_,i)=>{const t=10+i*10;return[t,P.snr({...args,t}).snr];}),color:style.accent,label:'当前'},{points:[[state.exposure,0],[state.exposure,result.snr]],color:style.focus,label:'当前曝光'}],xDomain:[10,2000],xTicks:main.clientWidth<600?[10,500,1000,2000]:[10,500,1000,1500,2000],yDomain:[0,Math.max(1,P.snr({...args,t:2010}).snr,(observingUI?.comparing??true)?P.snr({...priorArgs,t:2010}).snr:0)*1.1],xLabel:'总曝光 / s',yLabel:'孔径 SNR'});
   const random=P.rng(state.seed),expected=[],sample=[];for(let i=0;i<81;i++){const x=(i-40)/5,source=s*Math.exp(-x*x/2)*state.exposure/9,bg=state.background*state.exposure/9,dk=.02*state.exposure;expected.push([x,source]);sample.push([x,P.poisson(source+bg+dk,random)-bg-dk+P.normal(random)*state.read*Math.sqrt(state.frames)]);}
   const lows=sample.map(p=>p[1]),hi=Math.max(...lows,...expected.map(p=>p[1]));
   observationSample={seed:state.seed,expected,sample};
   const sampleMin=Math.min(0,...lows)*1.1,sampleMax=Math.max(1,hi)*1.1;
   drawPlot(q('#light-aux'),{...plotOptions,series:[{points:sample,color:style.muted,label:'统计样本'},{points:expected,color:style.focus,label:'期望'}],xDomain:[-8,8],yDomain:[sampleMin,sampleMax],yTicks:[sampleMin,0,sampleMax],xLabel:'假想像素位置',yLabel:'减均值后 / e⁻'});
   q('#light-title').textContent='曝光、背景和读出 · 孔径信噪比';q('#light-legend').textContent='实线：当前条件；灰色：保存基线；竖线：当前曝光。相机孔径计数模型。';
   metrics([['孔径 SNR',f(result.snr,2)],['保留信号',`${f(transmission*100,1)}%`],['读出方差占比',`${f(result.readVariance/result.variance*100,1)}%`]]);
   compare=`基线 SNR ${f(P.snr(priorArgs).snr,2)} → 当前 ${f(result.snr,2)}；${state.frames} 次读出；空气柱 ${f(result.airmass,2)} X`;
   observingUI?.render({state,result,base});
  }
  q('[data-comparison]').textContent=compare;
  if(window.__lab?.name==='light'){window.__lab.result=result;window.__lab.results=result;window.__lab.baseline=base;window.__lab.observationSample=observationSample;}
 }
 function input(e){const k=e.target.dataset.key;if(!k)return;state[k]=e.target.type==='checkbox'?e.target.checked:Number(e.target.value);update();}
 function apply(snapshot){for(const k of keys[state.mode])state[k]=snapshot[k];controls();update();}
 function click(e){const b=e.target.closest('button');if(!b)return;
  if(b.dataset.mode){state.mode=b.dataset.mode;q('.light-auxiliary').open=false;controls();update();say('已切换模式；比较基线按模式保留。');}
  else if(b.dataset.preset){Object.assign(state,presets[state.mode][b.dataset.preset]);controls();update();say(`已载入“${presetLabels[b.dataset.preset]}”；保留比较基线。`);}
  else if(b.hasAttribute('data-noise')){state.seed++;update();say(`已更换噪声样本，种子 ${state.seed}。`);}
  else if(b.hasAttribute('data-save')){baselines[state.mode]={...state};update();say('已把当前参数保存为本模式基线；后续操作与此比较。');}
  else if(b.hasAttribute('data-restore')){apply(baselines[state.mode]);say('已回到保存基线；参数、图形与读数已同步。');}
  else if(b.hasAttribute('data-reset')){baselines[state.mode]={...defaults,mode:state.mode};apply(defaults);say('已复位本模式的参数和基线；温度与半径仍为共用参数。');}
 }
 const toggle=()=>update();el.addEventListener('input',input);el.addEventListener('change',input);el.addEventListener('click',click);el.addEventListener('toggle',toggle,true);
 observer=new ResizeObserver(update);observer.observe(q('#light-plot'));window.__lab={name:'light',state,result,results:result,update,baseline:baselines[state.mode]};controls();update();
 thermalUI=attachThermalUI(el,{redraw:update});
 motionUI=attachMotionUI(el,{redraw:update});
 magnitudeUI=attachMagnitudeUI(el,{redraw:update});
 observingUI=attachObservingUI(el,{redraw:update});
 const disposeModel=registerExperimentModel(el,{getState(mode){return mode==='observing'?{version:1,kind:'light-sample',seed:state.seed}:null;},applyState(candidate){const model=validateExperimentModel('light',state.mode,candidate);if(!model)return false;state.seed=model.seed;update();return true;}});
 return()=>{disposed=true;disposeModel();thermalUI.dispose();motionUI.dispose();magnitudeUI.dispose();observingUI.dispose();observer.disconnect();el.removeEventListener('input',input);el.removeEventListener('change',input);el.removeEventListener('click',click);el.removeEventListener('toggle',toggle,true);el.classList.remove('light-pilot');if(window.__lab?.name==='light')delete window.__lab;};
}
