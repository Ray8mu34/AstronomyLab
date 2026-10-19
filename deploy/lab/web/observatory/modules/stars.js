let THREE;
import {assetURL,bindControls,syncControls,startVisibleLoop} from '../shared/core-controls.js';
import {plot} from '../shared/plot.js';
import {trackPoint,phaseDescription,stefanLuminosity,magneticDirection,pulsarSignal,pulseProfile,pulseDuty,collapseState,compactScales,bindingEnergyScale,clamp} from './stars-physics.mjs';

import {syntheticIa,iaReference,teachingIaPeak,teachingIaCurve,teachingIaScatter} from './stars-teaching.mjs';
import {attachFocus} from './stars-light-focus.mjs';
import {hrExamples,hrRadius,hrComparison} from './stars-hr.mjs';
import {drawHR} from './stars-hr-renderer.js';
import {drawStructure} from './stars-structure.js';
import {attachHRUI} from './stars-hr-ui.js';
import {attachIAUI} from './stars-ia-ui.js';
import {attachPulsarUI} from './stars-pulsar-ui.js';
import {attachEvolutionUI} from './stars-evolution-ui.js';
import {attachCollapseUI} from './stars-collapse-ui.js';

const gold='#ebc77e',teal='#71c8c7',blue='#8aa9ef';
const copies={
 hr:`<h3>先把恒星放在同一张图上</h3><p>赫罗图比较恒星的表面有效温度与光度。温度向右递减，光度向上增加；两轴使用对数刻度。光度是恒星向所有方向发出的总辐射功率，与距离造成的视亮度不同。主序带、巨星、超巨星与白矮星占据不同区域；轮廓标出各类恒星的大致分布区域。</p><p>主序表示核心氢聚变阶段，不同质量的主序星分布在带上不同位置。红巨星较冷却很亮，需要很大的表面积；白矮星热而暗，意味着半径很小。超巨星横跨冷热端。不能把横穿所有区域的一条路线当作每颗恒星的命运。</p><div class="formula">R/R☉ = √(L/L☉) × (5772 K / T_eff)²</div><p>同温度时光度增加100倍，半径增加10倍；同光度时温度增加2倍，半径变为1/4。比较点用于展示温度、光度与半径的关系；类别数值为教学示例，太阳采用名义参照值。</p><p>分类与半径关系依据 <a href="https://openstax.org/books/astronomy-2e/pages/18-4-the-h-r-diagram" target="_blank" rel="noopener">OpenStax Astronomy 2e §18.4</a>。进入下一模式，曲线才表示指定质量、成分与旋转假设下的一颗 MIST 单星模型随时间改变的位置。</p>`,
 evolution:`<h3>赫罗图上的一个点，背后有整颗星</h3><p>改变质量后，先固定模型，再沿这颗星的 EEP（等效演化点）移动。灰色轨迹是同一质量、同一初始成分的模型历史；金色点是此刻。横轴向左更热，纵轴向上更亮。每条轨迹对应一颗给定初始质量的模型星。切到三倍太阳质量，比较核心氢耗尽的模型年龄，就能看到燃料更多为什么反而更短命。</p><p>核心与表面回答不同的问题。中央氢质量分数降低，表明燃料已经改变；中央温度与表面有效温度却可朝不同方向变化。离开主序后，氦核心收缩，氢壳层继续供能，包层可以膨胀而变冷。屏幕上的核心大小与壳层厚度是为了展示关系的示意；表面半径、光度、温度、中央成分和核心质量才是直接读取的模型量。</p><div class="formula">L/L☉ = (R/R☉)² (T<sub>eff</sub>/5772 K)⁴</div><p>有效温度通过总辐射定义，因此半径、温度和光度必须相容。红巨星每平方米的输出下降，但表面积增加得更多，仍然可以更亮。剖面用颜色区分组成与能量来源。初始质量与当前质量分开显示，可追踪晚期失质量。</p><p>1、3 M☉ 的这份演示止于后 AGB 的热核心入口；15 M☉ 止于核心碳燃烧末。这些非旋转单星模型采用固定初始成分；各质量的可浏览范围止于上述阶段。</p>`,
 pulsar:`<h3>脉冲来自扫过视线，而不是整颗星消失</h3><p>蓝线是自转轴，金线是倾斜的磁轴，两个透明锥体是理想化的对向射电束。青线通向观察者。自转改变磁轴方位，却不改变观察者位置；只有某个锥体真的扫过青线，右侧才出现非零信号。试把磁轴倾角设为 30°、观察者夹角设为 90°、束半角设为 10°：恒星一直转，曲线一直是零。</p><div class="formula">cos θ = cos α cos ζ + sin α sin ζ cos(2πφ)<br>对向两束：min(θ, π−θ) &lt; 束半角 ρ 时可见</div><p>自转相位 φ 以一周为单位。相同周期可以只扫过一个束，也可能产生主脉冲与另一束的副脉冲；α=ζ=90° 时，两束每半周先后对准。反过来，磁轴完全沿自转轴且观察者在束内，光就稳定出现，不能用“所有快速自转中子星都会一闪一闪”概括。</p><p>这里选用边界外严格为零的实心锥和余弦强度剖面，曲线由射电束与视线的夹角计算得到。真实射电束可呈空心锥或斑块，γ 射线的发射区域又与低空射电束不同。因而“不见射电脉冲”并不等于“不存在中子星”，其他波段还需考虑各自的发射区域。动画放慢为一周约四秒；物理周期决定实际频率与光变时间刻度。</p>`,
 collapse:`<h3>核心向内，成功爆发中的外层向外</h3><p>拖动过程条，白色核心向内收缩；若选择成功推出外层，橙色物质随后向外展开。金色波前只是冲击位置示意。核心坍缩中，核心与外层的运动方向可以不同。白矮星的热核失控则属于另一类超新星机制。</p><p>核心失去支撑后，引力能释放巨大。冲击波却可能因拆解重核和辐射损耗停滞；中微子加热及多维流动会影响它能否重新推进。切换“未成功推出外层”，外壳不会自动飞散。开关用于比较两种结果；爆发能否成功取决于加热、输运与多维流动。</p><div class="formula">引力能量尺度 ≈ GM²/R<br>1.4 M☉、12 km → <span data-energy></span> J</div><p>这个能量尺度大部分与中微子通道相关，不能全算成可见光。动画的核心、外壳与过程坐标分别压缩了尺度；过程条不是秒表。真实核心坍缩常在亚秒尺度完成，冲击穿过广阔包层并形成明亮光信号要更久，取决于前身星。画面不求解流体、输运、核反应或相对论。</p><h3>视界与潮汐：两条不同的刻度</h3><p>下方调节非旋转黑洞质量及距离，以相同身体长度比较径向差异加速度。r<sub>s</sub> 随质量正比增大；在相同 r/r<sub>s</sub> 处，潮汐尺度反而随 M⁻² 减小。因果边界与物体是否被拉坏不是同一个问题。曲线展示给定质量与距离下的径向潮汐尺度。</p><div class="formula">r<sub>s</sub> = 2GM/c²； Δa ≈ 2GMℓ/r³</div><p>弱场公式只作尺度估计；在视界附近的值与 Schwarzschild 自由落体系中的径向潮汐本征尺度相符，却不能凭它计算全部强场轨迹。物体是否解体，还取决于自身引力、密度、强度和尺寸。黑洞阴影、视界和吸积盘的观测图像必须另用光线传播模型解释。</p>`
};

copies.ia=`<h3>标准化烛光：形状帮助校正亮度</h3><p>左图使用七个手选样本的人工光变模板；宽度参数 s 增大，曲线在时间上变宽。右图把同一组绝对峰值放在一起：灰点为校正前，金点为移除宽度与颜色项后的结果。移动校正滑杆时只调整右图峰值，左图保留原始合成光变，便于比较宽度。</p><p>每个样本按 M峰=−19.3−0.8(s−1)+2c+ε 生成；校正时移除宽度与颜色项。参考值、斜率、颜色参数和残差均为教学设定。标准差用七个合成峰值相对其均值计算；它只表示此例的散布，不能当作真实距离误差。</p><div class="formula">M合成=−19.3−0.8(s−1)+2c+ε<br>M校正=M合成+q[0.8(s−1)−2c]，0≤q≤1</div><p>校正后保留 ε，因此峰值不会完全重合。真实 Ia 的测距需要实际多波段光变、颜色和消光处理、独立距离标定以及模型不确定性；也不能把一种形成通道说成全部 Ia 的唯一机制。机制依据可参阅 <a href="https://arxiv.org/abs/astro-ph/9604143" target="_blank" rel="noopener">Riess、Press、Kirshner（1996）摘要</a>：该研究以真实训练样本建立多色光变形状与光度关系。本实验用简化公式展示宽度与颜色校正的作用。</p>`;

function metric(label,value){return `<div><small>${label}</small><strong>${value}</strong></div>`;}
function number(x,unit=''){return (Math.abs(x)>=1e5||Math.abs(x)>0&&Math.abs(x)<.01?x.toExponential(3):x.toLocaleString('zh-CN',{maximumFractionDigits:3}))+unit;}
function labelSprite(text,color='#d5e1ea'){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const c=canvas.getContext('2d');c.font='50px Microsoft YaHei';c.fillStyle=color;c.strokeStyle='#080d15';c.lineWidth=6;c.textAlign='center';c.strokeText(text,256,64,490);c.fillText(text,256,64,490);
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),transparent:true,depthTest:false}));s.scale.set(4,.75,1);return s;
}
function line(points,color){return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p))),new THREE.LineBasicMaterial({color}));}

export async function mount(el,{mode:requestedMode}={}){
 el.classList.add('stars-pilot');
 el.innerHTML=`<link rel="stylesheet" href="/modules/stars-pilot.css"><div class="lab-tabs" aria-label="恒星实验模式"><button data-mode="hr" aria-pressed="true">1 · 赫罗图</button><button data-mode="evolution" aria-pressed="false">2 · 演化与内部</button><button data-mode="pulsar" aria-pressed="false">脉冲星灯塔</button><button data-mode="collapse" aria-pressed="false">坍缩与潮汐</button><button data-mode="ia" aria-pressed="false">Ia 标准化</button></div>
 <div class="stars-start"><h2 data-intro-title></h2><p data-intro></p></div>
 <div class="stars-question"><h2 data-question></h2><details><summary>观察建议（可跳过）</summary><p data-hint></p></details></div>
 <div class="stars-workbench"><div class="stars-visuals"><div class="stars-view-tools"><button class="stars-mobile-view" data-view="scene" aria-pressed="true">空间／光变</button><button class="stars-mobile-view" data-view="chart" aria-pressed="false">关系图</button><button data-camera-reset>复位视角</button></div><div class="stars-views"><section class="viz-panel stars-scene-panel"><h3 class="panel-title" data-scene-title></h3><div class="scene-host" data-scene></div><canvas class="plot-canvas" data-structure-plot hidden aria-label="恒星内部组成与能量来源示意，非真实比例" role="img"></canvas><canvas class="plot-canvas" data-ia-plot hidden aria-label="人工合成Ia光变曲线" role="img"></canvas><div class="legend" data-legend></div></section><section class="viz-panel stars-chart-panel"><h3 class="panel-title" data-plot-title></h3><canvas class="plot-canvas" data-plot aria-label="赫罗图：温度向右递减，光度向上增加；可在图下方选择示例" role="img"></canvas><div class="legend" data-plot-legend></div></section></div><p class="stars-selection" data-selection></p><div class="metrics" data-metrics></div><p class="stars-compare" data-comparison></p><details class="stars-detailed"><summary>详细模型读数</summary><div class="metrics" data-secondary-metrics></div></details></div><aside class="stars-controls"><div data-controls></div><details class="stars-management"><summary>复位与比较基线</summary><div class="stars-actions"><button data-save>保存基线</button><button data-restore>回到基线</button><button data-reset>复位本模式</button></div></details><p class="stars-feedback" data-feedback role="status" aria-live="polite"></p></aside></div>
 <details class="stars-explanation"><summary>原理与公式</summary><section class="lab-copy" data-copy></section></details>
 <div class="stars-links"><a href="/sources/stars.md" target="_blank" rel="noopener">原模型、来源与限定 ↗</a></div>`;
 let disposed=false;
 const response=await fetch('/data/stars/tracks.json');if(!response.ok)throw new Error('MIST本地轨迹未载入');const data=await response.json();if(disposed)return;
 const state={mode:'hr',hrExample:'sun',hrCompare:'none',mass:'1',index:352,play:false,alpha:45,zeta:45,width:12,period:.1,phase:0,
   progress:0,successful:true,bhMass:10,rsMultiple:3,collapseTask:'collapse',iaSample:4,iaCorrection:0};
 let view=null,evoGroup,pulseGroup,collapseGroup,beams,b1,b2,obsLine,observer,observerLabel,stellarCore,envelope,shock,inArrow,outArrow,sceneTask=null,modeRequest=0;
 async function ensureScene(){
  if(view)return; if(sceneTask)return sceneTask;
  sceneTask=(async()=>{const sceneModule=await import('../shared/scene.js');if(disposed)return;THREE=sceneModule.THREE;const makeScene=sceneModule.makeScene;
 view=makeScene(el.querySelector('[data-scene]'),{position:[0,1.1,8],target:[-.5,0,0],fov:36});
 evoGroup=new THREE.Group();pulseGroup=new THREE.Group();collapseGroup=new THREE.Group();view.scene.add(evoGroup,pulseGroup,collapseGroup);
 const ns=new THREE.Mesh(new THREE.SphereGeometry(.55,48,24),new THREE.MeshBasicMaterial({color:'#c8d8eb',wireframe:true}));pulseGroup.add(ns);
 pulseGroup.add(line([[0,-4.2,0],[0,4.2,0]],blue));const spinLabel=labelSprite('自转轴',blue);spinLabel.position.set(0,4.2,0);pulseGroup.add(spinLabel);
 beams=new THREE.Group();pulseGroup.add(beams);
 const beamGeometry=new THREE.ConeGeometry(1,3.8,64,1,true);
 b1=new THREE.Mesh(beamGeometry,new THREE.MeshBasicMaterial({color:gold,transparent:true,opacity:.19,side:THREE.DoubleSide,depthWrite:false}));
 // ConeGeometry尖端在+y，翻转后尖端落在原点；锥体沿磁轴向外。
 b1.rotation.z=Math.PI;b1.position.y=1.9;
 b2=new THREE.Mesh(beamGeometry,b1.material);b2.position.y=-1.9;
 const magnetic=line([[0,-4.1,0],[0,4.1,0]],gold);beams.add(b1,b2,magnetic);
 obsLine=line([[0,0,0],[5,0,0]],teal);pulseGroup.add(obsLine);
 observer=new THREE.Mesh(new THREE.SphereGeometry(.15,20,12),new THREE.MeshBasicMaterial({color:teal}));pulseGroup.add(observer);
 observerLabel=labelSprite('固定观察者',teal);pulseGroup.add(observerLabel);
 const axisLabel=labelSprite('磁轴与两束',gold);beams.add(axisLabel);axisLabel.position.set(0,-4.2,0);
 stellarCore=new THREE.Mesh(new THREE.SphereGeometry(1,40,24),new THREE.MeshBasicMaterial({color:'#f0e9d0'}));collapseGroup.add(stellarCore);
 envelope=new THREE.Mesh(new THREE.SphereGeometry(1,40,24),new THREE.MeshBasicMaterial({color:'#e99663',transparent:true,opacity:.20,wireframe:true}));collapseGroup.add(envelope);
 shock=new THREE.Mesh(new THREE.SphereGeometry(1,40,24),new THREE.MeshBasicMaterial({color:gold,transparent:true,opacity:.12,wireframe:true}));collapseGroup.add(shock);
 inArrow=new THREE.ArrowHelper(new THREE.Vector3(-1,0,0),new THREE.Vector3(1.3,0,0),.8,'#f0e9d0',.18,.12);
 outArrow=new THREE.ArrowHelper(new THREE.Vector3(1,0,0),new THREE.Vector3(2.0,0,0),1.0,'#e99663',.18,.12);collapseGroup.add(inArrow,outArrow);
 const collapseLabel=labelSprite('核心向内 · 外层向外');collapseLabel.position.set(0,-4.2,0);collapseGroup.add(collapseLabel);

  })();try{await sceneTask;}finally{sceneTask=null;}
 }
 const canvas=el.querySelector('[data-plot]');let hrDrawing=null,hrUI=null,iaUI=null,pulsarUI=null,pulsarDrawing=null,evolutionUI=null,collapseUI=null,collapseDrawing=null;let unbind=()=>{},lastPlot=0;
 const defaults={...state},modeKeys={hr:['hrExample','hrCompare'],evolution:['mass','index'],pulsar:['alpha','zeta','width','period','phase'],collapse:['progress','successful','bhMass','rsMultiple','collapseTask'],ia:['iaSample','iaCorrection']};
 const baselines=Object.fromEntries(Object.keys(modeKeys).map(mode=>[mode,{...defaults,mode}]));
 const q=s=>el.querySelector(s),trackFor=mass=>data.tracks.find(t=>t.initial_mass_solar===Number(mass)),track=()=>trackFor(state.mass),say=text=>q('[data-feedback]').textContent=text;
 const slider=(key,label,min,max,step,unit='')=>`<label class="control">${label}<output data-value="${key}"></output><input data-key="${key}" type="range" min="${min}" max="${max}" step="${step}">${unit?`<small>${unit}</small>`:''}</label>`;
 const advanced=body=>`<details class="stars-advanced"><summary>更多参数与细节</summary><div>${body}</div></details>`;
 function setView(next){el.dataset.view=next;for(const b of el.querySelectorAll('[data-view]')){const active=b.dataset.view===next;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));}view?.render();update();}
 function resetCamera(){
  if(!view)return;
  if(state.mode==='evolution'){const p=trackPoint(track(),data.columns,state.index),r=.6+.58*Math.log10(1+p.radius);view.camera.position.set(0,1.1,Math.max(7.2,(r+1.5)*3.2));view.controls.target.set(-.5,0,0);}
  else if(state.mode==='pulsar'){view.camera.position.set(8,4,13);view.controls.target.set(1,0,0);}
  else{view.camera.position.set(7,4,14);view.controls.target.set(0,0,0);}
  view.controls.update();view.render();
 }
 function controls(){
  collapseUI?.suspend();
  evolutionUI?.suspend();
  pulsarUI?.suspend();
  hrUI?.suspend();
  iaUI?.suspend();
  unbind();const host=q('[data-controls]');
  if(state.mode==='hr')host.innerHTML=`<label class="control hr-choice">选中对象<select data-key="hrExample" aria-label="选择恒星或区域">${hrExamples.map(e=>`<option value="${e.id}">${e.name} · ${e.kind}</option>`).join('')}</select></label><span class="hr-comparing" data-hr-subject hidden>关系示例 · A / B</span><details class="hr-compare-menu"><summary>关系比较</summary><div class="hr-menu-body"><p>A 固定为太阳名义参照。B 是专门构造的关系示例。</p><div class="stars-presets stars-hr-comparisons" role="group" aria-label="半径关系比较"><button data-hr-compare="temperature">同温度 · 比光度</button><button data-hr-compare="luminosity">同光度 · 比温度</button></div></div></details><button class="hr-exit" data-hr-compare="none" hidden>退出比较</button>`;
  else if(state.mode==='evolution')host.innerHTML=`<label class="control">初始质量<select data-key="mass"><option value="1">1 M☉</option><option value="3">3 M☉</option><option value="15">15 M☉</option></select></label>${slider('index','EEP 演化点',0,track().rows.length-1,1)}<span data-index-label class="stars-model-note"></span><div class="stars-presets"><button data-stage="202">零龄主序</button><button data-stage="353">主序中段</button><button data-stage="454">氢耗尽</button><button data-stage="605">巨星／氦点火</button><button data-stage="660">氦聚变</button><button data-stage="end">轨迹末端</button><button data-play aria-pressed="false">播放演化点</button></div>${advanced(`<p class="note">MIST 2.5 / MESA 11701；Y=${data.initial_Y}、Z=${data.initial_Z}，[Fe/H]=0，[α/Fe]=0，v/vcrit=0。EEP 非等时间间隔，模型年龄另读。剖面固定显示大小，以组成边界、壳层和箭头表示内部关系；实际半径见读数。</p>`)}`;
  else if(state.mode==='pulsar')host.innerHTML=slider('alpha','磁轴倾角 α',0,90,1,'°')+slider('zeta','观察者夹角 ζ',0,180,1,'°')+slider('phase','自转相位',0,1,.001,'周 · 动画每4秒一周')+`<div class="stars-presets"><button data-preset="pulse">单束扫过</button><button data-preset="double">双脉冲</button><button data-preset="miss">完全错过</button><button data-preset="steady">恒定信号</button><button data-play aria-pressed="false">播放慢放</button></div>`+advanced(slider('width','束半角 ρ',2,35,1,'°')+slider('period','物理周期',.005,2,.005,'s · 只改变光变时间刻度')+`<p class="note">采用有限实心射电锥；球体与束长分别缩放，以便观察扫束。</p>`);
  else if(state.mode==='collapse'){
   const switches=`<div class="stars-presets"><button data-collapse-task="collapse">坍缩过程</button><button data-collapse-task="tidal">视界与潮汐</button></div>`;
   const tidal=`<label class="control">黑洞质量<select data-key="bhMass"><option value="10">10 M☉ · 恒星质量</option><option value="1000">1000 M☉ · 中等质量</option><option value="4000000">4百万 M☉ · 超大质量</option></select></label>${slider('rsMultiple','距中心 / rₛ',1,20,.1)}<p class="stars-model-note">ℓ=2 m 的径向差异尺度；弱场公式只作尺度估计，未计算材料强度。</p>`;
   const collapse=slider('progress','过程坐标',0,1,.005,'无时间单位')+`<label class="stars-check"><input data-key="successful" type="checkbox">选择成功推出外层的示意</label><div class="stars-presets"><button data-collapse-preset="start">初态</button><button data-collapse-preset="out">成功推出</button><button data-collapse-preset="fail">未推出</button><button data-play aria-pressed="false">播放过程</button></div><p class="stars-model-note">核心与包层分别压缩尺度；过程条按无量纲坐标展示先后关系。</p>`;
   host.innerHTML=switches+(state.collapseTask==='tidal'?tidal+advanced(collapse):collapse+advanced(tidal));
  }else host.innerHTML=`<label class="control">当前合成样本<select data-key="iaSample">${syntheticIa.map(s=>`<option value="${s.id}">样本${s.id} · 宽度 s=${s.stretch.toFixed(2)}</option>`).join('')}</select></label>${slider('iaCorrection','移除宽度与颜色项',0,1,.05,'0=校正前；1=校正后')}<div class="stars-presets"><button data-ia-preset="before">校正前</button><button data-ia-preset="after">校正后</button></div>${advanced(`<p class="note">7个手选合成样本，统一比较绝对峰值。M峰=−19.3−0.8(s−1)+2c+ε；M校正=M峰+0.8(s−1)−2c。系数、颜色参数 c 与残差 ε 均为教学设定。</p><div data-ia-details></div>`)}`;
  if(state.mode==='evolution')host.querySelector('[data-key="index"]').closest('label').append(host.querySelector('[data-index-label]'));
  unbind=bindControls(host,state,key=>{state.play=false;if(key==='hrExample')state.hrCompare='none';if(key==='mass'){state.index=clamp(state.index,0,track().rows.length-1);controls();resetCamera();}else if(key==='index')resetCamera();update();});
 }
 function update(){if(disposed)return;
  hrUI?.setMode(state.mode);
  iaUI?.setMode(state.mode);
  pulsarUI?.setMode(state.mode);
  evolutionUI?.setMode(state.mode);
  collapseUI?.setMode(state.mode,state.collapseTask);
  syncControls(['pulsar','evolution','collapse'].includes(state.mode)?el:q('[data-controls]'),state);
  if(view){evoGroup.visible=false;pulseGroup.visible=state.mode==='pulsar';collapseGroup.visible=state.mode==='collapse';}q('[data-scene]').hidden=['hr','ia','evolution'].includes(state.mode);q('[data-structure-plot]').hidden=state.mode!=='evolution';q('[data-ia-plot]').hidden=state.mode!=='ia';q('[data-camera-reset]').hidden=['hr','ia','evolution'].includes(state.mode);
  const baseline=baselines[state.mode];let result,comparison='',primary='',secondary='';
  el.dataset.mode=state.mode;q('[data-selection]').hidden=state.mode!=='hr';
  q('[data-view="scene"]').textContent=state.mode==='evolution'?'内部结构':state.mode==='ia'?'光变形状':'空间示意';q('[data-view="chart"]').textContent=state.mode==='evolution'?'赫罗轨迹':state.mode==='ia'?'峰值校正':'关系图';
  q('[data-plot]').setAttribute('aria-label',state.mode==='hr'||state.mode==='evolution'?'赫罗图：表面温度向右递减，光度向上增加':'恒星关系图，读数见下方');
  if(state.mode==='hr'){
   const example=hrExamples.find(e=>e.id===state.hrExample),points=hrComparison(state.hrCompare,example);
   hrDrawing=drawHR(canvas,{example:state.hrExample,comparison:state.hrCompare});
   q('[data-plot-title]').textContent='赫罗图 · 一张温度与光度的地图';
   q('[data-plot-legend]').textContent='① 主序带　② 巨星　③ 超巨星　④ 白矮星。轮廓为示意；圆点为类别示例，☉ 为太阳名义参照。';
   const descriptions={none:example.description,temperature:'A 与 B 在同一条竖线上：都是 5772 K。B 的光度是 A 的100倍，半径是10倍；更亮来自更大的辐射表面积。',luminosity:'A 与 B 在同一条横线上：都是 1 L☉。B 位于更热的左侧，温度为 A 的2倍，半径只有1/4；小表面也能给出相同总功率。'};
   q('[data-selection]').textContent=(state.hrCompare==='none'?example.name+' · '+example.kind+'。':'关系示例 · ')+descriptions[state.hrCompare];
   primary=points.map((e,i)=>metric(points.length>1?(i?'B · 半径':'A · 半径'):'推得辐射半径',number(hrRadius(e.temperature,e.luminosity),' R☉'))+metric(points.length>1?(i?'B · 温度 / 光度':'A · 温度 / 光度'):'温度 / 光度',number(e.temperature)+' K / '+number(e.luminosity)+' L☉')).join('');
   secondary=metric('坐标刻度','两轴为对数刻度')+metric('表示类别','太阳：名义参照；其余：教学示例');
   comparison='先认识区域，再进入“演化与内部”追踪一颗指定模型恒星。';
   result={teaching:true,example,comparison:state.hrCompare,points:hrDrawing.points};
  }else if(state.mode==='evolution'){
   const tr=track(),p=trackPoint(tr,data.columns,state.index),prior=trackPoint(trackFor(baseline.mass),data.columns,baseline.index),radius=.6+.58*Math.log10(1+p.radius);
   const structure=drawStructure(q('[data-structure-plot]'),p,tr.initial_mass_solar);q('[data-scene-title]').textContent='此刻的内部 · 组成与供能位置';
   q('[data-legend]').textContent=structure.title+'。'+structure.source+'。层的位置、厚度与圆大小均为示意；数值半径来自模型。';
   q('[data-plot-title]').textContent='MIST 单星演化轨迹 · 左热右冷';q('[data-plot-legend]').textContent='灰：指定初始质量的单星模型；金点：当前；蓝方块：基线。温度范围扩至20万K以容纳后AGB；轨迹未接白矮星冷却。';
   hrDrawing=drawHR(canvas,{tracks:[{points:tr.rows.map(r=>[10**r[data.columns.indexOf('log_Teff')],10**r[data.columns.indexOf('log_L')]])}],current:{temperature:p.temperature,luminosity:p.luminosity},baseline:evolutionUI?.comparing?{temperature:prior.temperature,luminosity:prior.luminosity}:null});
   const age=p.star_age>=1e9?`${(p.star_age/1e9).toFixed(2)} 十亿年`:`${(p.star_age/1e6).toFixed(2)} 百万年`;
   primary=metric('当前半径',`${p.radius>=1000?p.radius.toExponential(2):p.radius.toFixed(2)} R☉`)+metric('表面温度',`${Math.round(p.temperature).toLocaleString()} K`)+metric('光度',`${p.luminosity>=1e4?p.luminosity.toExponential(2):p.luminosity.toFixed(2)} L☉`)+metric('模型年龄',age);
   secondary=metric('中央温度',number(p.centerTemperature,' K'))+metric('当前质量',number(p.star_mass,' M☉'))+metric('中央氢 / 氦质量分数',`${p.center_h1.toFixed(3)} / ${p.center_he4.toFixed(3)}`)+metric('He-rich / C-rich 核心质量',`${number(p.he_core_mass)} / ${number(p.c_core_mass)} M☉`);
   q('[data-index-label]').textContent=`EEP ${p.eep} / ${tr.rows.at(-1)[0]}；非等时间间隔`;
   q('output[data-value="index"]').textContent=p.eep;
   comparison=`基线 ${baseline.mass} M☉ / EEP ${prior.eep} → 半径 ${(p.radius/prior.radius).toFixed(2)} 倍；光度 ${(p.luminosity/prior.luminosity).toFixed(2)} 倍`;
   result={point:p,stage:phaseDescription(p,tr.initial_mass_solar),stefanLuminosity:stefanLuminosity(p.radius,p.temperature)};
   evolutionUI?.render({state,result,baseline,prior,structure});
  }else if(state.mode==='pulsar'){
   result=pulsarSignal(Number(state.alpha),Number(state.zeta),Number(state.width),state.phase);
   beams.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(...result.direction));
   const actualRadius=3.8*Math.tan(Number(state.width)*Math.PI/180);b1.scale.set(actualRadius,1,actualRadius);b2.scale.copy(b1.scale);
   obsLine.geometry.setFromPoints([new THREE.Vector3(),new THREE.Vector3(...result.observer).multiplyScalar(5)]);observer.position.copy(new THREE.Vector3(...result.observer).multiplyScalar(5));observer.material.color.set(result.visible?'#ffffff':teal);observerLabel.position.copy(observer.position).add(new THREE.Vector3(0,-.5,0));
   q('[data-scene-title]').textContent='双束辐射与固定视线 · 慢放';q('[data-legend]').textContent='蓝：自转轴；金：磁轴与双束；青：固定视线。球体与束长非同比例。';
   q('[data-plot-title]').textContent='一周几何光变 · 非实测';q('[data-plot-legend]').textContent='金：当前；蓝灰：基线；青竖线：当前相位。比较使用共同相位坐标。';
   pulsarDrawing=plot(canvas,{series:[...(pulsarUI?.comparing?[{points:pulseProfile(Number(baseline.alpha),Number(baseline.zeta),Number(baseline.width)),color:'#718496'}]:[]),{points:pulseProfile(Number(state.alpha),Number(state.zeta),Number(state.width)),color:gold},{points:[[state.phase,0],[state.phase,1.05]],color:teal}],xDomain:[0,1],yDomain:[0,1.08],xLabel:`相位 / 周 · 当前周期 ${Number(state.period).toFixed(3)} s`,yLabel:'几何相对强度'});
   const duty=pulseDuty(Number(state.alpha),Number(state.zeta),Number(state.width),720);result.duty=duty;
   primary=metric('当前信号',result.visible?'束内可见':'束外 · 零')+metric('可见占空比',`${(duty*100).toFixed(1)}%`)+metric('物理频率',`${(1/Number(state.period)).toFixed(2)} Hz`);
   secondary=metric('视线—最近束轴夹角',number(result.angleDeg,'°'))+metric('当前几何强度',result.intensity.toFixed(4))+metric('自转相位',Number(state.phase).toFixed(3)+' 周');
   comparison=`基线占空比 ${(pulseDuty(Number(baseline.alpha),Number(baseline.zeta),Number(baseline.width),720)*100).toFixed(1)}% → 当前 ${(duty*100).toFixed(1)}%；动画每4秒一周`;
  }else if(state.mode==='collapse'){
   const s=collapseState(state.progress,state.successful);stellarCore.scale.setScalar(s.coreRadiusDisplay);envelope.scale.setScalar(s.shellRadiusDisplay);shock.scale.setScalar(Math.max(.001,s.shockRadiusDisplay));shock.visible=s.shockRadiusDisplay>0;outArrow.visible=state.successful&&state.progress>.42;inArrow.visible=state.progress<.42;
   q('[data-scene-title]').textContent=s.phase;q('[data-legend]').textContent='白：核心；橙：包层；金：冲击。分别压缩显示，过程坐标无时间单位。';
   q('[data-plot-title]').textContent='视界与潮汐 · ℓ=2 m 的径向尺度';q('[data-plot-legend]').textContent='青：当前质量；蓝灰：基线质量；金点：当前位置。两条曲线同一纵轴。';
   result={...s,...compactScales(Number(state.bhMass),2,state.rsMultiple)};
   const pointsFor=mass=>Array.from({length:100},(_,i)=>{const r=1+i*19/99;return [r,compactScales(Number(mass),2,r).radialTidalAcceleration];}),points=pointsFor(state.bhMass),prior=pointsFor(baseline.bhMass),all=[...points,...prior].map(p=>p[1]);
   const displayValues=collapseUI?.comparing?all:points.map(p=>p[1]);
   collapseDrawing=plot(canvas,{series:[...(collapseUI?.comparing?[{points:prior,color:'#718496'}]:[]),{points,color:teal},{points:[[state.rsMultiple,result.radialTidalAcceleration]],color:gold,dots:true}],xDomain:[1,20],yDomain:[Math.min(...displayValues)/1.5,Math.max(...displayValues)*1.5],logY:true,xLabel:'距中心 / rₛ · 视界=1',yLabel:'径向 Δa / m s⁻²'});
   primary=state.collapseTask==='tidal'?metric('径向差异加速度尺度',`${result.radialTidalAcceleration.toExponential(2)} m/s²`)+metric('非旋转视界半径',`${(result.rsM/1000).toExponential(2)} km`)+metric('距中心',`${state.rsMultiple.toFixed(1)} rₛ`):metric('包层结果',state.successful?'选择成功推出':'选择未推出')+metric('过程坐标',state.progress.toFixed(2))+metric('核心显示半径',s.coreRadiusDisplay.toFixed(2)+' · 示意单位');
   secondary=metric('非旋转视界半径',number(result.rsM/1000,' km'))+metric('距中心',number(result.rsM*state.rsMultiple/1000,' km'))+metric('径向差异加速度尺度',number(result.radialTidalAcceleration,' m/s²'))+metric('包层结果',state.successful?'选择：成功推出':'选择：未推出');
   comparison=`基线 ${Number(baseline.bhMass).toLocaleString()} M☉ / ${baseline.rsMultiple} rₛ → 潮汐尺度 ${(result.radialTidalAcceleration/compactScales(Number(baseline.bhMass),2,baseline.rsMultiple).radialTidalAcceleration).toExponential(2)} 倍`;
  }else{
   const sample=syntheticIa.find(s=>s.id===Number(state.iaSample)),before=teachingIaScatter(0),after=teachingIaScatter(state.iaCorrection),prior=teachingIaScatter(baseline.iaCorrection);
   q('[data-scene-title]').textContent='合成 Ia 光变 · 时间宽度不同';q('[data-legend]').textContent='灰：7 个合成样本；金：当前样本原始光变。纵轴向上更亮。';
   plot(q('[data-ia-plot]'),{series:[...syntheticIa.map(s=>({points:teachingIaCurve(s),color:'#42566c'})),{points:teachingIaCurve(sample),color:gold}],xDomain:[-20,45],yDomain:[-14.5,-20.2],xLabel:'相对峰值时间 / 日 · 合成',yLabel:'合成绝对星等 · 上亮'});
   q('[data-plot-title]').textContent='同一组合成样本 · 峰值校正前后';q('[data-plot-legend]').textContent='灰圆：校正前；金圆：当前校正；细线：同一样本的变化。编号标识合成样本。';
   const iaDrawing=plot(canvas,{series:[...syntheticIa.map((s,i)=>({points:[[s.id,before.values[i]],[s.id,after.values[i]]],color:'#42566c'})),...syntheticIa.map((s,i)=>({points:[[s.id,before.values[i]]],color:'#99adc4',dots:true})),...syntheticIa.map((s,i)=>({points:[[s.id,after.values[i]]],color:gold,dots:true})),{points:[[.5,iaReference],[7.5,iaReference]],color:teal}],xDomain:[.5,7.5],yDomain:[-18.6,-19.9],xLabel:'合成样本编号',yLabel:'合成峰值 / mag · 上亮'});
   primary=metric('峰值样本散布 σ',after.rms.toFixed(3)+' mag')+metric('校正前散布 σ',before.rms.toFixed(3)+' mag')+metric('当前样本峰值',teachingIaPeak(sample,state.iaCorrection).toFixed(3)+' mag');
   secondary=metric('宽度参数 s',sample.stretch.toFixed(2))+metric('人工颜色参数 c',sample.color.toFixed(2))+metric('人工残差 ε',sample.residual.toFixed(2)+' mag');
   comparison=`基线 σ ${prior.rms.toFixed(3)} → 当前 ${after.rms.toFixed(3)} mag；保留人工残差，校正后不会完全重合`;
   q('[data-ia-details]').textContent=`当前样本：s=${sample.stretch.toFixed(2)}，c=${sample.color.toFixed(2)}，ε=${sample.residual.toFixed(2)} mag。散布为 7 个合成峰值相对其均值的总体标准差。`;
   result={synthetic:true,sample,correction:state.iaCorrection,beforeScatter:before.rms,afterScatter:after.rms,peak:teachingIaPeak(sample,state.iaCorrection)};
   iaUI?.render({state,result,drawing:iaDrawing,before,after});
  }
  q('[data-metrics]').innerHTML=primary;q('[data-secondary-metrics]').innerHTML=secondary;q('[data-comparison]').textContent=comparison;
  for(const b of el.querySelectorAll('[data-play]')){b.textContent=state.play?'暂停':state.mode==='evolution'?'播放演化点':state.mode==='pulsar'?'播放慢放':'播放过程';b.setAttribute('aria-pressed',String(state.play));}
  for(const b of el.querySelectorAll('[data-stage]')){const index=b.dataset.stage==='end'?track().rows.length-1:Math.min(Number(b.dataset.stage)-1,track().rows.length-1),active=state.mode==='evolution'&&Math.round(state.index)===index;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));}
  const pulsePresets={pulse:[45,45,12],double:[90,90,12],miss:[30,90,10],steady:[0,0,10]};for(const b of el.querySelectorAll('[data-preset]')){const p=pulsePresets[b.dataset.preset],active=[state.alpha,state.zeta,state.width].every((v,i)=>Number(v)===p[i]);b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));}
  for(const b of el.querySelectorAll('[data-collapse-task]')){const active=state.collapseTask===b.dataset.collapseTask;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));}
  for(const b of el.querySelectorAll('[data-collapse-preset]')){const active=state.progress===(b.dataset.collapsePreset==='start'?0:1)&&(b.dataset.collapsePreset==='start'||state.successful===(b.dataset.collapsePreset!=='fail'));b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));}
  for(const b of el.querySelectorAll('[data-hr-compare]')){const active=b.dataset.hrCompare===state.hrCompare;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));}
  for(const b of el.querySelectorAll('[data-ia-preset]')){const active=Number(state.iaCorrection)===(b.dataset.iaPreset==='after'?1:0);b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));}
  window.__lab={module:'stars',state,result,baseline,data:{model:data.model,masses:data.tracks.map(t=>t.initial_mass_solar)}};
  if(state.mode==='hr')hrUI?.render({state,drawing:hrDrawing,example:result.example});
  if(state.mode==='pulsar')pulsarUI?.render({state,result,baseline,plotDrawing:pulsarDrawing});
  if(state.mode==='collapse')collapseUI?.render({state,result,baseline,plotDrawing:collapseDrawing});
 }
 async function changeMode(mode,{initial=false}={}){const request=++modeRequest;
  if(['pulsar','collapse'].includes(mode)&&!view){el.dataset.modeLoading=mode;try{await ensureScene();}catch(error){if(initial)throw error;say('三维视图无法初始化：'+error.message+'。可继续使用赫罗图、演化与Ia二维模式。');return;}finally{if(el.dataset.modeLoading===mode)delete el.dataset.modeLoading;}}
  if(disposed||request!==modeRequest)return;state.mode=mode;state.play=false;for(const b of el.querySelectorAll('[data-mode]')){const active=b.dataset.mode===mode;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));}q('[data-copy]').innerHTML=copies[mode];const energy=q('[data-energy]');if(energy)energy.textContent=bindingEnergyScale(1.4,12).toExponential(2);
  const prompts={hr:['恒星的温度与光度，怎样组成一张地图？','先认轴方向与四个区域，再选示例；用同温度和同光度比较半径，最后进入演化。'],evolution:['变成红巨星时，表面与核心一起变冷吗？','选择“氢耗尽”再到“巨星／氦点火”。看半径、表面温度和赫罗图；中央温度与成分在详细读数中。保存一个阶段，可对照另一质量。'],pulsar:['恒星一直存在，为什么视线有时收不到光？','比较“单束扫过”“双脉冲”“完全错过”。拖动相位，看射电束与固定视线是否相交；动画为慢放。'],collapse:['核心向内与外层向外，是同一个过程吗？','对比成功推出与未推出。切到“视界与潮汐”，保持相同 r/rₛ 比较黑洞质量；大黑洞的视界更大，潮汐尺度却可能更小。'],ia:['Ia 要经过校正，才能用来比较距离吗？','将校正从 0 拉到 1。看7个合成峰值的散布怎样缩小，残差仍然保留；比较校正前后的峰值散布。']};
  const intros={hr:['先认识恒星的位置','向左更热，向上更亮。主序、巨星、超巨星与白矮星分布在不同区域；选一个点，看温度、光度与半径怎样联系。'],evolution:['从地图走向一颗星的历史','先选初始质量，再选择阶段。灰线为同一颗 MIST 单星模型的轨迹；金点对应右侧的内部组成示意。'],ia:['先看形状，再看峰值校正','七个合成教学样本的光变宽度不同。把校正从0移到1，比较右图的峰值散布；这是标准化概念演示。'],pulsar:['旋转的星，扫过固定的视线','选择单束、双脉冲或完全错过，观察辐射束与光变同步。空间图为理想几何模型。'],collapse:['比较核心坍缩与外层的去向','选择过程示意，或切到视界与潮汐比较黑洞质量。两个任务有不同的物理问题与尺度。']};
  q('[data-intro-title]').textContent=intros[mode][0];q('[data-intro]').textContent=intros[mode][1];
  q('[data-question]').textContent=prompts[mode][0];q('[data-hint]').textContent=prompts[mode][1];controls();resetCamera();setView(['hr','evolution','ia'].includes(mode)?'chart':'scene');say('');el.dispatchEvent(new Event('change',{bubbles:true}));
 }
 function apply(snapshot){for(const k of modeKeys[state.mode])state[k]=snapshot[k];state.play=false;controls();resetCamera();setView(['hr','evolution','ia'].includes(state.mode)||state.mode==='collapse'&&state.collapseTask==='tidal'?'chart':'scene');}
 const click=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.mode)changeMode(b.dataset.mode);
  else if(b.dataset.hrCompare){state.hrCompare=b.dataset.hrCompare;update();}
  else if(b.dataset.hrContinue)changeMode('evolution');
  else if(b.dataset.view)setView(b.dataset.view);
  else if(b.hasAttribute('data-camera-reset')){resetCamera();say('已回到适合当前模式的视角；物理参数保留。');}
  else if(b.hasAttribute('data-play')){state.play=!state.play;update();say(state.play?'已开始播放；显示速度为教学慢放。':'已暂停，参数与读数同步。');}
  else if(b.dataset.stage){state.index=b.dataset.stage==='end'?track().rows.length-1:clamp(Number(b.dataset.stage)-1,0,track().rows.length-1);state.play=false;resetCamera();update();say('已切换 MIST 演化点，模型年龄另读。');}
  else if(b.dataset.preset){const p={pulse:[45,45,12],double:[90,90,12],miss:[30,90,10],steady:[0,0,10]}[b.dataset.preset];[state.alpha,state.zeta,state.width]=p;state.phase=0;state.play=false;update();say('已载入灯塔预设并暂停；基线保留。');}
  else if(b.dataset.collapseTask){state.collapseTask=b.dataset.collapseTask;state.play=false;controls();setView(state.collapseTask==='tidal'?'chart':'scene');say('已切换坍缩／潮汐主控，另一个任务可在更多参数中查看。');}
  else if(b.dataset.collapsePreset){state.progress=b.dataset.collapsePreset==='start'?0:1;state.successful=b.dataset.collapsePreset!=='fail';state.play=false;update();say('已载入所选状态并暂停。');}
  else if(b.dataset.iaPreset){state.iaCorrection=b.dataset.iaPreset==='after'?1:0;update();say('已切换合成样本校正，图形与读数同步。');}
  else if(b.hasAttribute('data-save')){baselines[state.mode]={...state,play:false};update();say('当前参数已保存为本模式基线。');}
  else if(b.hasAttribute('data-restore')){apply(baselines[state.mode]);say('已回到基线并暂停；参数、图形与读数同步。');}
  else if(b.hasAttribute('data-reset')){baselines[state.mode]={...defaults,mode:state.mode};apply(defaults);say('已复位本模式、基线与视角，播放暂停。');}
 };
 const pickHR=e=>{if(state.mode!=='hr'||!hrDrawing)return;const r=canvas.getBoundingClientRect(),id=hrDrawing.pick(e.clientX-r.left,e.clientY-r.top);if(id){state.hrExample=id;state.hrCompare='none';update();}};
 const requested=requestedMode||new URLSearchParams(location.search).get('mode');await changeMode(Object.hasOwn(modeKeys,requested)?requested:'hr',{initial:true});
 canvas.addEventListener('click',pickHR);
 el.addEventListener('click',click);const toggle=()=>update();el.addEventListener('toggle',toggle,true);
 const ro=new ResizeObserver(()=>{if(!disposed)update();});ro.observe(canvas);ro.observe(q('[data-ia-plot]'));ro.observe(q('[data-structure-plot]'));
 const stopClock=startVisibleLoop((dt,t)=>{if(!state.play)return;if(state.mode==='evolution'){state.index+=dt*32;if(state.index>=track().rows.length-1){state.index=track().rows.length-1;state.play=false;}}
  else if(state.mode==='pulsar')state.phase=(state.phase+dt/4)%1;
  else if(state.mode==='collapse'){state.progress=clamp(state.progress+dt/8,0,1);if(state.progress===1)state.play=false;}
  if(!state.play||t-lastPlot>.05){lastPlot=t;update();}
 });
 q('.lab-tabs').insertAdjacentHTML('afterend','<div class="stars-focus-bar"><button class="stars-focus-button" data-focus-open>专注实验 ↗</button></div><link rel="stylesheet" href="/modules/stars-light-focus.css">');
 q('.stars-actions').append(q('[data-camera-reset]'));
 q('.stars-views').after(q('.stars-controls'));
 const disposeFocus=attachFocus(el,{workbench:q('.stars-workbench'),title:()=>q('[data-question]').textContent,redraw:()=>{update();view?.render();}});
 hrUI=attachHRUI(el,{redraw:update});
 iaUI=attachIAUI(el,{redraw:update});
 pulsarUI=attachPulsarUI(el,{redraw:update,getScene:()=>({view,pulseGroup})});
 evolutionUI=attachEvolutionUI(el,{redraw:update});
 collapseUI=attachCollapseUI(el,{redraw:update,getScene:()=>({view,collapseGroup,stellarCore,envelope,shock,inArrow,outArrow})});
 return()=>{disposed=true;modeRequest++;stopClock();canvas.removeEventListener('click',pickHR);hrUI.dispose();iaUI.dispose();pulsarUI.dispose();evolutionUI.dispose();collapseUI.dispose();disposeFocus();ro.disconnect();unbind();el.removeEventListener('click',click);el.removeEventListener('toggle',toggle,true);view?.dispose();el.classList.remove('stars-pilot');delete el.dataset.view;delete el.dataset.mode;if(window.__lab?.module==='stars')delete window.__lab;};
}
