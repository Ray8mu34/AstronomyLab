import {THREE,makeScene,plot,lessonLinks,assetURL,bindControls,syncControls} from '../shared/lab.js';
import {CONSTANTS,shadowHeight,dynamicalMass,s2Mass,distanceModulus,parallaxDistance,scalePropagation} from './measure-physics.mjs';
const F=(v,n=2)=>Number.isFinite(v)?v.toFixed(n):'无效';
const input=(key,label,value,min,max,step)=>`<label class="control"><span>${label} <output data-value="${key}">${value}</output></span><input aria-label="${label}" type="range" data-key="${key}" value="${value}" min="${min}" max="${max}" step="${step}"></label>`;
const m=(label,value)=>`<div><small>${label}</small><strong>${value}</strong></div>`;
const content={
 shadow:`<h3>从图上的暗线，到月面的一段高度</h3><p>低角度阳光让一座山投出长影，明暗交界便成为放大地形起伏的天然仪器。先把地面近似为水平，把山峰近似为直立高度h，太阳高度角为α，影长为l。由直角三角形得到h=l tanα。主图是带地面标尺的合成几何示意，固定合成阴影长10 km。把金色测量端点拖到影尖，或用影长滑杆与方向键读数。展开几何与曲线后，直角三角形按当前推断绘制；青色竖线代表高度，金色底边代表量得的影长，两个方向同比例。真实月面曲率、坡度和视线投影尚未加入。</p><div class="formula">h = l tanα<br>σ<sub>h</sub>² ≈ (tanα σ<sub>l</sub>)² + (l sec²α σ<sub>α</sub>)²<br>σ<sub>α</sub>用弧度；默认两个输入误差独立且较小。</div><p class="note">传播规则：<a href="https://www.nist.gov/pml/nist-technical-note-1297/nist-tn-1297-appendix-law-propagation-uncertainty" target="_blank" rel="noopener">NIST TN1297附录A</a>。此处将其一阶规则应用到直角三角形的h=l tanα；不包含协方差或系统误差。</p><p>距离测量也隐在其中。照片最先给出像素或角长度，转换为千米需要相机标尺与月球距离。小角近似l≈dθ要求θ用弧度，1角秒在384400 km处约对应1.86 km。只输入“照片上的10格”而不说明每格代表什么，便无法推出物理高度。下面的第谷峰照片是轨道探测器斜视影像，本实验的10 km影长、10°太阳高度及误差都是教学输入，没有从那张照片读取峰高。</p><p>右图比较同一个输入影长，在不同太阳高度下推出的h与一阶误差带。太阳接近地平时阴影长而易辨，但小角度误差可能相对于结果很大；太阳高时阴影短，地形位置与投影又更难辨认。测量精度不是“阴影越长越好”一个因素决定。改变误差滑块，观察哪一项正在主导，随后回到日地月模型追踪太阳方向如何形成这些阴影。</p>`,
 jupiter:`<h3>把木星旁的小点，变成一把引力秤</h3><p>从一次照片只能得到木卫一的投影位置。连续观测得到周期，结合距离和轨道投影才得到真实半长轴。这里默认a=421800 km、P=1.769138日，实际查阅NASA木星卫星参数表；动画按近圆、忽略倾角的理想轨道绘制，不是某日星历。木卫一被放大为标记，木星采用同长度比例的赤道半径71492 km。</p><div class="formula">μ = G(M+m) = 4π²a³/P²<br>M ≈ 4π²a³/(GP²)　(m ≪ M)<br>(σ<sub>M</sub>/M)² ≈ 9(σ<sub>a</sub>/a)² + 4(σ<sub>P</sub>/P)²</div><p>质量不像照片上的颜色那样直接进入眼睛，它通过使轨道弯曲而被测量。保持周期不变，a增加10%，质量估计变为原来的1.1³≈1.331倍；保持半长轴不变，周期越短，所需质量越大。右侧的曲线把这种强依赖展开，曲线上当前点所在位置对应输入值；两条细线使用自行设定的一阶相对误差。滑块误差没有来自NASA参数表的测量误差支持，它们只是让你研究误差传播的假设。</p><p>精密研究通常优先给出GM，因为轨道直接约束它；再除以G换算千克，还要承担G本身的误差。当前误差带只传播a、P，不纳入G、卫星质量、互相扰动、非球形木星引力场等系统误差。这一步能给出约1.90×10²⁷ kg的量级，并不能复制正式木星引力场解。返回太阳系比较密度时，还需要另一个独立的半径测量。</p>`,
 s2:`<h3>让同一把秤，延伸到银河中心</h3><p>S2在银河中心运行的轨道把同一个引力关系带到约四百万太阳质量的尺度。这里使用圆整教学参数：角半长轴125 mas、距离8000 pc、周期16年，得到a≈1000 AU。椭圆偏心率固定0.88，使近心距离约120 AU，与ESO2018年介绍的量级相符。三维图为牛顿椭圆模型，标记的中心位置是引力焦点，黑洞视界没有按尺寸显示，图中也不渲染黑洞阴影。</p><div class="formula">a / AU ≈ (θ / arcsec)(d / pc)<br>μ = 4π²a³/P²　 M/M<sub>☉</sub> = μ/(GM<sub>☉</sub>)<br>σ<sub>a</sub>/a ≈ √[(σ<sub>θ</sub>/θ)²+(σ<sub>d</sub>/d)²]</div><p>通过半长轴的三次方，距离误差进入质量估计。只用角位置拟合一个投影椭圆，还没有唯一得到真正的三维轨道；正式研究联合多年代位置、视向速度、仪器校准与相对论修正。下面的ESO图记录了1992—2002年的历史位置与拟合，当前输入并不是从这幅低分辨率图重新提取的数据，也不是最新精密轨道解。125 mas和8000 pc仅服务于本文的量级演算。</p><p>右侧扫描的是采用不同银河中心距离、其他输入固定时推出的质量，曲线不表示新的观测。用任意模型画出椭圆，不足以证明真实星已经走在那条路上；证据来自带时间和误差的测量，以及多种观测量的一致性。ESO2018年的结果研究了光谱中的相对论红移，本页牛顿轨道只能解释动力学质量量级，不能承担精密相对论检验。</p>`,
 distance:`<h3>距离不是孤立的一栏，而是整张知识地图的标尺</h3><p>先改变视差p，几何距离d=1/p立即响应；本页输入使用毫角秒，所以d(pc)=1000/p(mas)。若半年观测选择到最大摆幅，约2 AU基线对应的是2p，而不是p。右图显示距离估计对视差的非线性响应；它提醒我们，视差接近零时简单倒数及对称一阶误差会失效。滑块始终保持正且较高信噪比，模型没有处理低信噪比、负视差、零点偏差或贝叶斯距离推断。</p><div class="formula">μ<sub>d</sub> = m − M − A = 5 log₁₀(d/10 pc)<br>d(pc) = 10<sup>(μ<sub>d</sub>+5)/5</sup><br>σ<sub>d</sub>/d ≈ (ln10/5) σ<sub>μ</sub></div><p>第二组输入把视亮度m、已校准绝对星等M和消光A连接起来，使用同一波段的星等。它们是可调整的教学样例，不是一颗指定星的测量。给定m与M，增大A意味着更多光在途中被遮挡，因此未经消光校正会把源估计得更远。造父变星的周期—光度关系需要先用几何距离等校准，再用它测宿主星系；具有校准距离的Ia宿主又可校准标准化后的超新星。左侧阶梯保留这种依赖方向，不把每一级说成独立绝对尺。</p><p>最后一个滑块专门改变共同采用的距离标尺，保持角直径、角轨道、周期和通量不变。线性半径按d变，光度按d²变，轨道质量按d³变。增加10%距离分别得到1.10、1.21、1.331倍。星表更新一个距离值，可能连带改写尺度、能量与演化判断。真实联合拟合会有协方差，本页仅研究其他量固定的依赖。将独立测距、动力学与光谱重新接起来，就是第16讲综合测量的主线。</p>`
};
export function mount(el){
 const state={mode:'shadow',length:10,alpha:10,sigmaLength:.5,sigmaAlpha:.5,a:421800,period:1.769138,errorA:1,errorP:.1,theta:125,distance:8000,s2Period:16,errorTheta:1,errorDistance:1,errorS2P:1,p:10,errorParallax:.1,apparent:18,absolute:-5,extinction:.2,errorModulus:.1,factor:1,phase:0,play:false};
 el.innerHTML=`<link rel="stylesheet" href="/modules/measure-pilot.css"><div class="measure-pilot"><div class="lab-tabs" aria-label="测量实验选择"><button data-mode="shadow">月面影长</button><button data-mode="jupiter">Io与木星</button><button data-mode="s2">S2与银心</button><button data-mode="distance">距离标尺</button></div>
 <div class="measure-guide"><h2 id="measure-question"></h2><p id="measure-instruction"></p></div>
 <div class="lab-grid measure-workspace"><section class="viz-panel"><div class="panel-title" id="measure-title"></div><div id="measure-shadow" class="measure-shadow"></div><div class="scene-host" id="measure-scene" aria-label="可旋转的教学轨道模型"></div><div id="measure-ladder" hidden></div><div id="measure-outcomes" class="measure-outcomes"></div></section>
 <aside class="measure-desk"><section class="lab-controls" id="measure-controls" aria-label="本项测量主控"></section><div class="button-row"><button id="measure-play">播放轨道动画</button><button id="measure-defaults">恢复本项默认值</button><button id="measure-compare">记下当前读数</button><button id="measure-clear" hidden>清除对照</button></div><p id="measure-feedback" class="measure-feedback" role="status"></p><div id="measure-comparison" class="measure-comparison" hidden></div></aside></div>
 <div class="legend" id="measure-legend"></div>
 <details class="measure-analysis"><summary>展开几何、敏感度曲线与完整读数</summary><div id="measure-geometry"></div><div class="panel-title" id="measure-plot-title"></div><canvas class="plot-canvas" id="measure-plot" aria-label="当前输入的敏感度曲线和假设一阶误差"></canvas><div class="metrics" id="measure-metrics"></div></details><article class="lab-copy" id="measure-copy"></article><div class="lab-copy"><h3>沿着测量链返回全文与实验</h3>${lessonLinks([3,6,13,15,16])}<p><a href="/labs/earth-moon/">日地月：照明几何</a> · <a href="/lab/sky">天空坐标：视差与真实空间</a> · <a href="/lab/galaxy">银河内外：从太阳位置到银心</a> · <a href="/lab/orbits">航天：给定质量预测轨道</a> · <a href="/sources/measure.md">本页数据、计算方法和核验记录</a></p><figure id="measure-figure"></figure></div></div>`;
 const defaults={...state};const view=makeScene(el.querySelector('#measure-scene'),{position:[10,8,12],target:[0,0,0]});const group=new THREE.Group();view.scene.add(group);
 view.scene.add(new THREE.AmbientLight(0xd9e6f0,.9));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(-8,9,4);view.scene.add(light);
 const jupiterTexture=new THREE.TextureLoader().load('/textures/jupiter.jpg');jupiterTexture.colorSpace=THREE.SRGBColorSpace;
 let unBind=()=>{},current=null,lastPlot=null,orbiter=null,comparison=null,dragPointer=null;const api={module:'measure',state,get result(){return current;}};window.__lab=api;
 function clear(){for(const o of [...group.children]){group.remove(o);o.traverse(n=>{n.geometry?.dispose();if(n.material)for(const material of Array.isArray(n.material)?n.material:[n.material])material.dispose();});}orbiter=null;}
 function line(points,color){const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p))),new THREE.LineBasicMaterial({color}));group.add(l);return l;}
 function mesh(geometry,color){const m=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness:.7}));group.add(m);return m;}
 function controls(){unBind();const s=state;let html='';
  if(s.mode==='shadow')html=input('length','标尺读得影长 km',s.length,1,20,.1)+input('alpha','太阳高度 °',s.alpha,2,60,.1)+'<details><summary>误差假设</summary>'+input('sigmaLength','假设影长 1σ误差 km',s.sigmaLength,0,2,.05)+input('sigmaAlpha','假设太阳高度 1σ误差 °',s.sigmaAlpha,0,1,.05)+'<p id="measure-error-factors" class="measure-error-parts"></p></details><div class="button-row"><button data-preset="remeasure">重新量影长</button><button data-preset="angle">角度误差主导</button></div>';
  if(s.mode==='jupiter')html=input('a','真实轨道半长轴 km',s.a,300000,550000,100)+input('period','周期 日',s.period,1.3,2.5,.000001)+'<details><summary>误差假设</summary>'+input('errorA','假设半长轴相对 1σ误差 %',s.errorA,0,5,.1)+input('errorP','假设周期相对 1σ误差 %',s.errorP,0,2,.05)+'</details><div class="button-row"><button data-preset="io10">半长轴增加10%</button></div>';
  if(s.mode==='s2')html=input('theta','圆整角半长轴 mas',s.theta,80,180,.1)+input('distance','采用银心距离 pc',s.distance,6000,10000,10)+input('s2Period','轨道周期 年',s.s2Period,12,20,.1)+'<details><summary>误差假设</summary>'+input('errorTheta','假设角半长轴相对 1σ误差 %',s.errorTheta,0,5,.1)+input('errorDistance','假设距离相对 1σ误差 %',s.errorDistance,0,5,.1)+input('errorS2P','假设周期相对 1σ误差 %',s.errorS2P,0,3,.1)+'</details><div class="button-row"><button data-preset="s2distance">距离增加10%</button></div>';
  if(s.mode==='distance')html=input('p','周年视差 p / mas',s.p,2,50,.1)+input('factor','共同距离标尺 / 原距离',s.factor,.8,1.2,.005)+'<details><summary>亮度测距样例与误差假设</summary>'+input('errorParallax','假设视差 1σ误差 / mas',s.errorParallax,0,.2,.01)+input('apparent','同波段视星等 m',s.apparent,10,28,.1)+input('absolute','校准绝对星等 M',s.absolute,-8,3,.1)+input('extinction','该波段消光 A / mag',s.extinction,0,3,.05)+input('errorModulus','假设距离模数 1σ误差 / mag',s.errorModulus,0,.3,.01)+'</details><div class="button-row"><button data-preset="scale10">距离标尺增加10%</button></div>';
  el.querySelector('#measure-controls').innerHTML=html;unBind=bindControls(el.querySelector('#measure-controls'),state,()=>{refresh();feedback('输入已更新；读数和图形同步。');});
 }
 function camera(extent,target=[0,0,0]){extent*=Math.max(1,1.35/view.camera.aspect);view.controls.target.set(...target);view.camera.position.set(target[0]+extent*.7,target[1]+extent*.7,target[2]+extent*1.1);view.controls.update();}
 function band(curve,sigma){return [{points:curve,color:'#71c8c7',label:'推算值'},{points:curve.map(([x,y])=>[x,y+sigma(x,y)]),color:'#6c819c',label:'+1σ（假设）'},{points:curve.map(([x,y])=>[x,Math.max(0,y-sigma(x,y))]),color:'#6c819c',label:'−1σ（假设）'}];}
 function refresh(){clear();const s=state,sceneHost=el.querySelector('#measure-scene'),ladder=el.querySelector('#measure-ladder');sceneHost.hidden=['distance','shadow'].includes(s.mode);ladder.hidden=s.mode!=='distance';el.querySelector('#measure-shadow').hidden=s.mode!=='shadow';
  for(const b of el.querySelectorAll('[data-mode]')){b.classList.toggle('active',b.dataset.mode===s.mode);b.setAttribute('aria-pressed',String(b.dataset.mode===s.mode));}el.querySelector('#measure-copy').innerHTML=content[s.mode];el.querySelector('#measure-play').hidden=!['jupiter','s2'].includes(s.mode);
  let metrics='',legend='',title='',chartTitle='',plotOptions,figure='';
  if(s.mode==='shadow'){
   current=shadowHeight(s.length,s.alpha,s.sigmaLength,s.sigmaAlpha);const h=current.height,extent=Math.max(s.length,h)*1.3;const ground=mesh(new THREE.PlaneGeometry(extent*2,extent*1.4),0x353c47);ground.rotation.x=-Math.PI/2;ground.position.x=s.length/2;
   const peak=mesh(new THREE.ConeGeometry(Math.min(.5,h*.3),h,4),0x7b8c9e);peak.position.set(0,h/2,0);
   const shadow=mesh(new THREE.PlaneGeometry(s.length,.25),0x080d15);shadow.rotation.x=-Math.PI/2;shadow.position.set(s.length/2,.015,0);
   line([[0,0,0],[0,h,0]],0x71c8c7);line([[0,h,0],[s.length,.02,0]],0xebc77e);line([[0,h,0],[-s.length*.6,h+s.length*.6*Math.tan(s.alpha*Math.PI/180),0]],0xebc77e);camera(extent);
   metrics=m('推算高度 h',F(h,3)+' km')+m('假设 1σ随机误差',F(current.sigma,3)+' km')+m('相对 1σ误差',F(100*current.sigma/h,1)+' %')+m('384400 km处 1角秒',F(384400*CONSTANTS.arcsec,2)+' km');title='亲手量影长 → 用太阳高度推算峰高';legend='合成几何示意，非真实照片：固定影尖在10 km。标尺为地面长度，不是相机像素。平地、平行太阳光；不含月面坡度、曲率和视线投影。';chartTitle='固定输入影长，照明角怎样影响高度与误差';
   const curve=Array.from({length:121},(_,i)=>{const a=2+i*58/120;return[a,shadowHeight(s.length,a).height];});plotOptions={series:band(curve,x=>shadowHeight(s.length,x,s.sigmaLength,s.sigmaAlpha).sigma),xDomain:[2,60],yDomain:[0,s.length*Math.tan(Math.PI/3)*1.15+2],xLabel:'太阳高度 / °',yLabel:'由同一影长推得高度 / km'};
   figure=`<img loading="lazy" style="width:100%;max-width:900px" src="${assetURL('assets/16/v02/tycho-peak.jpg')}" alt="LRO第谷中央峰与山影"><figcaption>LRO轨道探测器第谷中央峰斜视影像，2011-06-10。Credit: NASA Goddard/Arizona State University。输入影长没有由该图测出。</figcaption>`;
  }else if(s.mode==='jupiter'){
   current=dynamicalMass(s.a*1000,s.period*CONSTANTS.day,s.errorA/100,s.errorP/100);const central=mesh(new THREE.SphereGeometry(71492/s.a*4,40,24),0xffffff);central.material.map=jupiterTexture;orbiter=mesh(new THREE.SphereGeometry(.09,16,12),0xebc77e);line(Array.from({length:241},(_,i)=>[4*Math.cos(i*Math.PI/120),0,4*Math.sin(i*Math.PI/120)]),0x71c8c7);camera(6.2);
   metrics=m('GM',current.mu.toExponential(4)+' m³/s²')+m('质量估计',current.mass.toExponential(4)+' kg')+m('假设相对 1σ误差',F(current.relative*100,2)+' %')+m('假设 1σ质量误差',current.sigma.toExponential(2)+' kg');title='近圆木卫一模型，周期给出质量';legend='NASA表参数为默认基准；动画不是某日星历。木卫一标记放大。误差滑块为假设输入，不是原表测量误差。';chartTitle='保持周期不变，半长轴如何改变质量';
   const curve=Array.from({length:121},(_,i)=>{const a=300000+i*250000/120;return[a/1000,dynamicalMass(a*1000,s.period*86400).mass/1e27];});plotOptions={series:band(curve,(_,y)=>y*current.relative),xDomain:[300,550],yDomain:[0,curve.at(-1)[1]*(1+current.relative)*1.1],xLabel:'真实半长轴 / 千km',yLabel:'质量 / 10²⁷ kg'};
  }else if(s.mode==='s2'){
   current=s2Mass(s.theta,s.distance,s.s2Period,s.errorTheta/100,s.errorDistance/100,s.errorS2P/100);mesh(new THREE.SphereGeometry(.09,16,12),0x63788a);orbiter=mesh(new THREE.SphereGeometry(.08,16,12),0xebc77e);const e=.88;
   line(Array.from({length:241},(_,i)=>{const E=i*Math.PI/120;return[3*(Math.cos(E)-e),0,3*Math.sqrt(1-e*e)*Math.sin(E)];}),0x71c8c7);camera(5.4,[-2.64,0,0]);
   metrics=m('真实半长轴量级',F(current.aAU,1)+' AU')+m('中心质量估计',F(current.solar/1e6,3)+' 百万M☉')+m('假设相对 1σ误差',F(current.relative*100,2)+' %')+m('近心距离量级',F(current.aAU*.12,1)+' AU');title='S2：同一条开普勒关系，更强的中心引力';legend='125 mas、8000 pc、16年是圆整教学输入。e=0.88固定；视界未绘、中心标记放大；无相对论进动与真实测量散点。';chartTitle='保持角轨道与周期不变，距离怎样进入质量';
   const curve=Array.from({length:121},(_,i)=>{const d=6000+i*4000/120;return[d,s2Mass(s.theta,d,s.s2Period).solar/1e6];});plotOptions={series:band(curve,(_,y)=>y*current.relative),xDomain:[6000,10000],yDomain:[0,curve.at(-1)[1]*(1+current.relative)*1.1],xLabel:'采用银心距离 / pc',yLabel:'质量 / 百万太阳质量'};
   figure=`<img loading="lazy" style="width:100%;max-width:900px" src="${assetURL('assets/16/v02/s2-orbit.png')}" alt="ESO历史S2位置测量和轨道拟合"><figcaption>ESO2002年历史图，记录1992—2002年位置；Credit: ESO，CC BY 4.0。未从图中提取本页输入。</figcaption>`;
  }else{
   const p=parallaxDistance(s.p,s.errorParallax),d=distanceModulus(s.apparent,s.absolute,s.extinction,s.errorModulus),scale=scalePropagation(s.factor);current={parallax:p,modulus:d,scale};
   ladder.innerHTML=`<ol class="measure-chain"><li><strong>几何基准：视差 / 激光 / 食双星</strong><span>位置与光行时 → 距离 → 绝对亮度</span></li><li><strong>造父变星：周期与光度</strong><span>周期与平均亮度 → 星系与Ia宿主标尺</span></li><li><strong>Ia超新星：标准化烛光</strong><span>标准化峰值与亮度 → 更远距离</span></li></ol><p class="note">校准与系统误差可传递；本页样例各自独立。</p>`;
   metrics=m('几何距离',F(p.distance,1)+' ± '+F(p.sigma,1)+' pc')+m('扣除消光的距离模数',F(d.modulus,2)+' mag')+m('亮度推算距离',F(d.distance/1000,2)+' kpc')+m('模数假设相对 1σ误差',F(d.relative*100,2)+' %')+m('半径 / 光度 / 质量倍率',F(scale.radius,3)+' / '+F(scale.luminosity,3)+' / '+F(scale.mass,3));title='每一级都要说明它继承了谁的标尺';legend='公式输入为教学样例，未绑定特定天体。误差带为独立小误差的一阶传播；不包含消光、校准等系统误差。';chartTitle='视差倒数与一阶误差：接近零时很敏感';
   const curve=Array.from({length:121},(_,i)=>{const p=2+i*48/120;return[p,1000/p];});plotOptions={series:band(curve,x=>parallaxDistance(x,s.errorParallax).sigma),xDomain:[2,50],yDomain:[0,600],xLabel:'周年视差 / mas',yLabel:'几何距离 / pc'};
   figure=`<img loading="lazy" style="width:100%;max-width:900px" src="${assetURL('assets/16/v02/distance-ladder.png')}" alt="NASA距离阶梯示意"><figcaption>NASA/ESA2018年距离阶梯示意；Credit: NASA, ESA, A. Feild (STScI), A. Riess (STScI/JHU)，图像许可见素材库。本页不将其2018年精度数字作为当前纪录。</figcaption>`;
  }
  el.querySelector('#measure-title').textContent=title;el.querySelector('#measure-plot-title').textContent=chartTitle;el.querySelector('#measure-metrics').innerHTML=metrics;el.querySelector('#measure-legend').textContent=legend;el.querySelector('#measure-figure').innerHTML=figure;
  // 当前输入以金点接回扫描曲线；曲线是敏感度实验，不冒充观测。
  const selected={shadow:[s.alpha,current.height],jupiter:[s.a/1000,current.mass/1e27],s2:[s.distance,current.solar/1e6],distance:[s.p,current.parallax?.distance]}[s.mode];
  plotOptions.series.push({points:[selected],color:'#ebc77e',dots:true,label:'当前输入'});
  lastPlot=plotOptions;plot(el.querySelector('#measure-plot'),plotOptions);position();renderUI();
 }
 function feedback(text){el.querySelector('#measure-feedback').textContent=text;}
 function headline(){const s=state,q=current;if(s.mode==='shadow')return `影长 ${F(s.length,1)} km · 高度 ${F(q.height,3)} ± ${F(q.sigma,3)} km`;
  if(s.mode==='jupiter')return `a ${F(s.a,0)} km · P ${s.period} 日 · 质量 ${q.mass.toExponential(4)} kg`;
  if(s.mode==='s2')return `距离 ${s.distance} pc · 中心质量 ${F(q.solar/1e6,3)} 百万M☉`;
  return `视差 ${F(s.p,1)} mas → ${F(q.parallax.distance,1)} pc · 半径/光度/质量 ${F(q.scale.radius,3)} / ${F(q.scale.luminosity,3)} / ${F(q.scale.mass,3)}`;
 }
 function renderUI(){syncControls(el,state);const s=state;
  const guides={shadow:['一段阴影，能告诉我们多高的山？','可试：把金色端点拖到影尖；看影长如何进入高度。误差假设可展开。'],jupiter:['木星的质量，怎样藏在卫星轨道里？','可试：记下当前读数，再把半长轴增大10%；看质量为何增加约33.1%。'],s2:['银心距离改变，黑洞质量会跟着变多少？','可试：保持角半长轴与周期，增加10%距离；看同一角轨道需要多大的中心质量。'],distance:['改动一把距离标尺，会连动哪些结论？','可试：将共同距离标尺增加10%，对照半径、光度与轨道质量的不同倍率。']};
  el.querySelector('#measure-question').textContent=guides[s.mode][0];el.querySelector('#measure-instruction').textContent=guides[s.mode][1];
  el.querySelector('#measure-play').textContent=s.play?'暂停轨道动画':'播放轨道动画';el.querySelector('#measure-play').setAttribute('aria-pressed',String(s.play));
  let outcomes='';if(s.mode==='shadow'){
   const a=s.alpha*Math.PI/180,ul=Math.tan(a)*s.sigmaLength,ua=s.length/Math.cos(a)**2*s.sigmaAlpha*Math.PI/180;
   outcomes=m('量得影长 → 推算高度',`${F(s.length,1)} km → ${F(current.height,3)} km`)+m('合成样例的假设 1σ',`± ${F(current.sigma,3)} km`);
   el.querySelector('#measure-shadow').innerHTML=shadowSVG();
   el.querySelector('#measure-error-factors').textContent=`高度误差分量：影长 ${F(ul,3)} km；角度 ${F(ua,3)} km。平方相加后开方；${ul===0&&ua===0?'未设随机误差':ul>=ua?'影长项较大':'角度项较大'}。假设独立、小误差，不含系统项。`;
  }else if(s.mode==='jupiter')outcomes=m('轨道推得木星质量',current.mass.toExponential(4)+' kg')+m('假设相对 1σ',F(current.relative*100,2)+' %');
  else if(s.mode==='s2')outcomes=m('角轨道 → 实际半长轴',F(current.aAU,1)+' AU')+m('中心质量量级',F(current.solar/1e6,3)+' 百万M☉');
  else outcomes=m('视差 → 几何距离',F(current.parallax.distance,1)+' pc')+m('半径 / 光度 / 质量倍率',F(current.scale.radius,3)+' / '+F(current.scale.luminosity,3)+' / '+F(current.scale.mass,3));
  el.querySelector('#measure-outcomes').innerHTML=outcomes;const geometry=el.querySelector('#measure-geometry');geometry.hidden=s.mode!=='shadow';if(s.mode==='shadow')geometry.innerHTML=geometrySVG();
  const box=el.querySelector('#measure-comparison');box.hidden=!comparison;el.querySelector('#measure-clear').hidden=!comparison;
  if(comparison){box.replaceChildren();for(const text of ['已记下：'+comparison,'现在：'+headline()]){const p=document.createElement('p');p.textContent=text;box.append(p);}}
 }
 // Original teaching geometry. The ruler represents ground km; no photograph calibration is implied.
 function shadowSVG(){const x=60+state.length*28;
  return `<svg viewBox="0 0 680 275" aria-label="合成阴影与公里标尺。固定影尖10公里。当前量得${F(state.length,1)}公里。">
   <text x="24" y="27" class="measure-svg-note">合成几何示意 · 非真实照片</text><text x="24" y="59">俯视：从山脚量到影尖</text>
   <path d="M60 120 L340 137 L340 147 L60 165 Z" fill="#030508" stroke="#7a8895"/><circle cx="60" cy="142" r="18" fill="#798b98"/><text x="28" y="105">山脚</text><text x="318" y="105">影尖</text>
   <line x1="60" y1="180" x2="620" y2="180" stroke="#7f93a5"/>${Array.from({length:21},(_,i)=>`<line x1="${60+i*28}" y1="180" x2="${60+i*28}" y2="${i%5?188:194}" stroke="#7f93a5"/>${i%5?'':`<text x="${60+i*28}" y="215" text-anchor="middle">${i} km</text>`}`).join('')}
   <line x1="60" y1="235" x2="${x}" y2="235" stroke="#ebc77e" stroke-width="3"/><text x="340" y="265" text-anchor="middle">量得 l = ${F(state.length,1)} km</text>
   <g data-shadow-handle tabindex="0" role="slider" aria-label="影长测量端点（公里）" aria-valuemin="1" aria-valuemax="20" aria-valuenow="${state.length}"><rect x="${x-44}" y="111" width="88" height="143" fill="transparent"/><line x1="${x}" y1="116" x2="${x}" y2="246" stroke="#ebc77e" stroke-width="3"/><circle cx="${x}" cy="235" r="12" fill="#ebc77e"/><path d="M${x-5} 230 L${x+5} 235 L${x-5} 240" fill="none" stroke="#080d15" stroke-width="2"/></g>

  </svg>`;
 }
 function geometrySVG(){const h=current.height,scale=Math.min(250/state.length,60/Math.max(h,.001)),x=60+state.length*scale,y=105-h*scale;
  return `<svg viewBox="0 0 680 140" role="img" aria-label="当前影长、太阳高度角与推算高度的同尺度直角三角形"><text x="24" y="28">侧视推断 · 同比例直角三角形</text><path d="M60 105 L60 ${y} L${x} 105 Z" fill="#172b38" stroke="#71c8c7" stroke-width="2"/><line x1="60" y1="105" x2="${x}" y2="105" stroke="#ebc77e" stroke-width="3"/><text x="365" y="62">α = ${F(state.alpha,1)}°</text><text x="365" y="92">h = l tanα = ${F(h,3)} km</text><text x="365" y="123">α是独立输入，非图上测角</text></svg>`;
 }

 function setShadowLength(value){state.length=Math.round(Math.max(1,Math.min(20,value))*10)/10;refresh();}
 // Pointer listeners live on the stable container so rebuilding SVG during drag does not lose the drag.
 const shadowHost=el.querySelector('#measure-shadow');
 const pointerDown=e=>{if(!e.target.closest('[data-shadow-handle]'))return;dragPointer=e.pointerId;shadowHost.setPointerCapture(e.pointerId);e.preventDefault();};
 const pointerMove=e=>{if(e.pointerId!==dragPointer)return;const svg=shadowHost.querySelector('svg'),point=svg.createSVGPoint();point.x=e.clientX;point.y=e.clientY;setShadowLength((point.matrixTransform(svg.getScreenCTM().inverse()).x-60)/28);};
 const pointerUp=e=>{if(e.pointerId!==dragPointer)return;dragPointer=null;if(shadowHost.hasPointerCapture(e.pointerId))shadowHost.releasePointerCapture(e.pointerId);shadowHost.querySelector('[data-shadow-handle]')?.focus({preventScroll:true});feedback('标尺读数已进入高度与误差计算。');};
 const keydown=e=>{if(!e.target.closest('[data-shadow-handle]'))return;const keys={ArrowRight:.1,ArrowUp:.1,ArrowLeft:-.1,ArrowDown:-.1};if(e.key in keys||['Home','End'].includes(e.key)){e.preventDefault();setShadowLength(e.key==='Home'?1:e.key==='End'?20:state.length+keys[e.key]);shadowHost.querySelector('[data-shadow-handle]').focus({preventScroll:true});}};
 shadowHost.addEventListener('pointerdown',pointerDown);shadowHost.addEventListener('pointermove',pointerMove);shadowHost.addEventListener('pointerup',pointerUp);shadowHost.addEventListener('pointercancel',pointerUp);shadowHost.addEventListener('keydown',keydown);

 function position(){if(!orbiter)return;let E=state.phase;
  if(state.mode==='jupiter')orbiter.position.set(4*Math.cos(E),0,4*Math.sin(E));
  if(state.mode==='s2'){const M=state.phase%(Math.PI*2);for(let i=0;i<12;i++)E-=(E-.88*Math.sin(E)-M)/(1-.88*Math.cos(E));orbiter.position.set(3*(Math.cos(E)-.88),0,3*Math.sqrt(1-.88**2)*Math.sin(E));}
 }
 const click=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.mode){state.mode=b.dataset.mode;state.phase=0;state.play=false;comparison=null;controls();refresh();feedback('已切换实验；可直接操作主控。');}
  if(b.id==='measure-play'){state.play=!state.play;renderUI();}
  if(b.id==='measure-compare'){comparison=headline();renderUI();feedback('已保存此刻读数；改变参数可在这里对照。');}
  if(b.id==='measure-clear'){comparison=null;renderUI();feedback('已清除对照。');}
  if(b.id==='measure-defaults'){for(const i of el.querySelectorAll('[data-key]'))state[i.dataset.key]=defaults[i.dataset.key];state.phase=0;state.play=false;comparison=null;controls();refresh();feedback('已恢复本项默认参数，动画停在起点；对照已清除。');}
  if(b.dataset.preset){const p=b.dataset.preset;if(p==='remeasure')state.length=7;if(p==='angle')Object.assign(state,{sigmaLength:.1,sigmaAlpha:1});if(p==='io10')state.a=defaults.a*1.1;if(p==='s2distance')state.distance=defaults.distance*1.1;if(p==='scale10')state.factor=1.1;state.play=false;state.phase=0;controls();refresh();el.querySelector(`[data-preset="${p}"]`)?.focus({preventScroll:true});feedback(p==='remeasure'?'测量端点移至7 km；可拖到固定影尖，也可用方向键微调。':'预设已应用；参数、读数与图形同步。');}
 };
 el.addEventListener('click',click);controls();refresh();view.loop(dt=>{if(state.play&&orbiter){state.phase=(state.phase+dt*Math.PI*2/(state.mode==='jupiter'?8:16))%(Math.PI*2);position();}});
 const observer=new ResizeObserver(()=>{if(lastPlot)plot(el.querySelector('#measure-plot'),lastPlot);});observer.observe(el.querySelector('#measure-plot'));
 return ()=>{unBind();shadowHost.removeEventListener('pointerdown',pointerDown);shadowHost.removeEventListener('pointermove',pointerMove);shadowHost.removeEventListener('pointerup',pointerUp);shadowHost.removeEventListener('pointercancel',pointerUp);shadowHost.removeEventListener('keydown',keydown);el.removeEventListener('click',click);observer.disconnect();clear();jupiterTexture.dispose();view.dispose();if(window.__lab===api)delete window.__lab;};
}
