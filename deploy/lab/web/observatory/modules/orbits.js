import {attachTransferUI} from './orbits-transfer-ui.js';
import {applyPresentation,bindDisclosures} from '../shared/presentation.js';
import {mountWorkspaceNavigation} from '../shared/navigation.js';
let THREE;
import {assetURL,bindControls,syncControls} from '../shared/core-controls.js';
import {plot} from '../shared/plot.js';
import {getModeContext} from '../shared/mode-context.js';
import {EARTH,orbitState,trajectory,hohmann,transferPoint,staging,landing} from './orbits-physics.mjs';
import {mountConics} from './orbit-conics.js';
import {registerExperimentModel} from '../shared/experiment-state.js';
import {mountLandingStaging} from './landing-staging-lab.js';
const N=(v,n=2)=>Number.isFinite(v)?v.toFixed(n):'∞';
const control=(key,label,value,min,max,step=1)=>`<label class="control"><span>${label} <output data-value="${key}">${value}</output></span><input aria-label="${label}" type="range" data-key="${key}" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;
const metric=(label,value)=>`<div><small>${label}</small><strong>${value}</strong></div>`;
// Local teaching extension: same elapsed time after the existing Hohmann half ellipse.
// With no second impulse, symmetry completes the ellipse; with impulse, circular angular rate.
export function transferDemoPoint(h1,h2,progress,secondBurn=true){
 const q=hohmann(h1,h2),f=Math.max(0,Math.min(2,progress));
 if(f<=1)return transferPoint(h1,h2,f);
 if(!secondBurn){const p=transferPoint(h1,h2,2-f);return[p[0],-p[1]];}
 const angle=Math.PI+(f-1)*q.seconds*Math.sqrt(EARTH.mu/q.r2**3);
 return[q.r2*Math.cos(angle),q.r2*Math.sin(angle)];
}
const copy={
 orbit:`<h3>不是爬过一堵高墙，而是改变运动状态</h3><p>把释放高度固定在200 km，先将横向速度设为零。飞行器已经位于稀薄大气之外，却会向地面下落。增加横向速度，落点沿地球向前移动；接近圆轨道速度时，飞行器下落的曲率才与地球表面相配合。所谓绕地球飞行，是在有引力的环境中持续自由下落。空间站中的失重来自共同下落，200 km高度的引力仍约为地表的94%。</p><p>右侧把高度与速率作为真实初始条件，在球对称地球的真空引力场中积分。蓝色地球与轨道使用相同长度比例，金色飞行器被放大以便看见。低于圆轨道速度并不必然立即撞地：在较高释放点，仍可能形成近地点高于地表的椭圆。但轨道的近地点一旦穿入地球，本实验便在首次触地处结束。现实中穿入稠密大气会更早破坏轨道。</p><div class="formula">v<sub>c</sub> = √(μ/r)　 v<sub>esc</sub> = √(2μ/r)<br>ε = v²/2 − μ/r　 r = R<sub>⊕</sub> + h</div><p>单位质量机械能ε控制轨道是否束缚：负值对应椭圆，零值是逃逸的临界抛物线，正值对应双曲线。逃逸是逐渐远离地球的动力学状态，既不是瞬间摆脱引力，也不意味着离开太阳系。调到约1.1倍圆轨道速度时，近地点仍在出发处，远地点会升高；调到逃逸速度时，轨道不再闭合。把“到达太空”“进入地球轨道”“逃离地球”依次区分，才能读懂发射通报。</p>`,
 transfer:`<h3>两次点火，把一个圆接到另一个圆</h3><p>升轨不必在全程持续推着飞行器。理想霍曼转移在低圆轨道顺行点火，增大速度，使出发点成为转移椭圆的近地点；飞行器沿椭圆自由飞到远地点，再次顺行点火进入高圆轨道。蓝色为原轨道，金色为完整转移椭圆，青色为目标圆轨道。实心金点代表当前第二次点火开关，空心青点代表相反开关；两点使用同一经过时间。拖动进度看飞行器怎样在上升过程中减速；这里的进度按时间定义，近地点附近的角运动自然更快。</p><div class="formula">a<sub>t</sub> = (r₁+r₂)/2　 v² = μ(2/r − 1/a)<br>Δv₁ = √(μ/r₁)[√(2r₂/(r₁+r₂)) − 1]<br>Δv₂ = √(μ/r₂)[1 − √(2r₁/(r₁+r₂))]<br>t<sub>transfer</sub> = π√(a<sub>t</sub>³/μ)</div><p>第二次点火尤其值得观察：转移轨道到达同样远地点的速度低于该处圆轨道速度，必须补上速度，否则飞行器还会沿椭圆返回近地点。高度不唯一决定轨道，一定的位置要与一定的速度共同使用。速度增量Δv描述两次瞬时点火需改变多少速度，并非发动机喷流速率，也不是任务推进剂质量；将它连接到火箭方程，才进入质量预算。</p><p>模型限定为共面、同向、圆轨道之间的两次瞬时升轨，忽略大气、地球扁率、有限推力、倾角变化与其他天体。目标35 786 km仅借用地球同步轨道的高度量级，未加入赤道面与恒星日匹配，因此不能把画面中任意倾角的高圆轨道直接称作地球静止轨道。真实任务的转移方案也可能采用不同远地点或多次点火。</p><p class="note">补充依据：<a href="https://science.nasa.gov/learn/basics-of-space-flight/chapter4-1/" target="_blank" rel="noopener">NASA轨迹机制</a>。本页后半程是相同经过时间的教学延伸：关闭点火用椭圆后半周，开启点火用ω=√(μ/r₂³)的高圆轨道；没有引擎有限点火或其他天体。</p>`,
 staging:`<h3>抛掉空箱，改变后一段点火的质量比</h3><p>火箭通过喷出质量改变自己的动量，真空不会阻止发动机工作。理想火箭方程把排气速度与质量预算联系起来：即使等效排气速度相同，更大的满空质量比也能提供更多速度增量，不过增长是对数形式。末质量必须包含结构、载荷和保留推进剂，不能把“没有烧掉”的东西从预算里抹去。</p><div class="formula">Δv = v<sub>e</sub> ln(m₀/m<sub>f</sub>)<br>Δv<sub>total</sub> = Δv<sub>1</sub> + Δv<sub>2</sub></div><p>图中的两段箭体与分离距离为结构示意，质量数值则进入逐级计算。一级工作时要带着全部二级和载荷；一级结束并分离后，二级不再加速一级干质量。右图对比的是相同初始质量与可消耗推进剂，在相同排气速度下，将一级干质量与回收储备一直保留到第二段结束的情况。两种方案采用相同预算，用于比较丢弃空一级带来的速度增量。</p><p>增加一级回收储备，会减少本轮上升可消耗的推进剂，使一级末质量变大，从而降低上升Δv。回收硬件、备用燃料、制导与结构各有代价；能落下来与能再次可靠飞行又是不同证据。分离本身不把二级免费送入轨道，一级返回与载荷继续上升也应分别评价。</p>`,
 landing:`<h3>推力等于重量，不会把下降速度变成零</h3><p>把竖直向上取为正，恒定质量、恒定重力下的净加速度为T/m−g。下降中的飞行器要减小下降速率，向上推力必须超过重量。推力恰好等于重量时，已有下降速度仍会保持；这与静止时的悬停不同。调节推重比，看相同高度和下降速率下，停住位置如何变化。</p><div class="formula">a<sub>up</sub> = g(T/mg − 1)<br>s<sub>stop</sub> = v₀²/(2a<sub>up</sub>)　(a<sub>up</sub> &gt; 0)</div><p>黄色曲线给出从现在点火开始的下降过程，到触地或第一次速率降为零处结束。若停距大于当前高度，触地时仍有速度；若停距小于当前高度，则在地面上方停住。固定推力继续作用还会使飞行器向上加速，本图在第一次停住时截断，不能把那个点理解为自动悬停。安全着陆必须让位置、速度、推力调节和剩余质量共同满足要求。</p><p>这是一维匀加速度教学模型，不是着陆控制器。未加入质量消耗、发动机启动延迟、节流限制、水平速度、姿态、风与空气阻力；数值不能直接用于真实飞行。轨道再入的高速气动热也不由本模型计算。低空试验可以验证特定终端环节，却不能凭一次低速落地宣布整个高速回收与复用链已经验证。</p>`
};
export async function mount(el,{mode:requestedMode}={}){
 const state={mode:'orbit',height:200,speed:7.79,target:35786,progress:0,secondBurn:true,prop1:80,dry1:10,prop2:25,dry2:3,payload:2,ve:3,reserve:0,landingHeight:125,fallSpeed:50,twr:2,play:false};
 el.innerHTML=`<link rel="stylesheet" href="/modules/orbits-pilot.css"><div class="orbits-pilot"><div class="lab-tabs" aria-label="航天实验选择"><button data-mode="orbit">横速入轨</button><button data-mode="transfer">点火升轨</button><button data-mode="staging">分级预算</button><button data-mode="landing">着陆减速</button></div>
 <div class="orbits-guide"><h2 id="orbit-question"></h2><p id="orbit-instruction"></p></div>
 <div class="lab-grid orbits-workspace"><section class="viz-panel"><div class="panel-title" id="orbit-title">真空中的持续下落</div><div class="scene-host" id="orbit-scene" aria-label="可旋转的轨道或火箭教学模型"></div><div class="button-row orbits-transport"><button id="orbit-play">播放</button><button id="orbit-reset">重置</button></div><div class="orbits-outcomes" id="orbit-outcomes"></div></section>
 <aside class="orbits-desk"><section class="lab-controls" id="orbit-controls" aria-label="当前实验主控"></section><div class="button-row"><button id="orbit-compare">记下当前读数</button><button id="orbit-clear" hidden>清除对照</button></div><p id="orbit-feedback" class="orbits-feedback" role="status"></p><div id="orbit-comparison" class="orbits-comparison" hidden></div></aside></div>
 <div class="legend" id="orbit-legend"></div><details class="orbits-analysis"><summary>展开关系曲线与完整读数</summary><div class="panel-title" id="orbit-plot-title"></div><canvas class="plot-canvas" id="orbit-plot" aria-label="当前实验的速度或预算关系曲线"></canvas><div class="metrics" id="orbit-metrics"></div></details><article class="lab-copy" id="orbit-copy"></article><div class="lab-copy"><h3>模型资料与观测证据</h3><p><a href="/sources/orbits.md">计算方法与来源</a> · <a href="/lab/measure">用轨道反过来称量天体</a></p><figure><img loading="lazy" style="width:100%;max-width:850px" src="${assetURL('assets/15/v02/orbit-energy.png')}" alt="200 km圆轨道速度与能量量级"><figcaption>200 km 圆轨道的速度与能量计算。</figcaption></figure></div></div>`;
 const pilot=el.querySelector('.orbits-pilot');
 const stopDisclosures=bindDisclosures(pilot);pilot.classList.add('orbits-atlas','al-surface');let stopPresentation=null,presentationSurface=null;
 const navigation=document.createElement('div');pilot.prepend(navigation);pilot.querySelector('.lab-tabs').classList.add('al-mode-nav');const stopNavigation=mountWorkspaceNavigation(navigation,{modeNav:pilot.querySelector('.lab-tabs'),label:'轨道与航天导航'});
 const modeError=document.createElement('p');modeError.dataset.modeError='';modeError.className='al-error';modeError.setAttribute('role','alert');modeError.hidden=true;navigation.after(modeError);
 const conicSlot=document.createElement('div');conicSlot.id='orbit-conics-slot';navigation.after(conicSlot);
 const conics=mountConics(conicSlot);
 const landingStagingSlot=document.createElement('div');landingStagingSlot.id='orbit-landing-staging-slot';landingStagingSlot.hidden=true;conicSlot.after(landingStagingSlot);
 let landingStaging=null;
 let view=null,group=null,earthTexture,earth,marker,grid,sceneTask=null,disposed=false,modeRequest=0;
 async function ensureScene(){
  if(view)return;if(sceneTask)return sceneTask;
  sceneTask=(async()=>{const sceneModule=await import('../shared/scene.js');if(disposed)return;THREE=sceneModule.THREE;const makeScene=sceneModule.makeScene;
 view=makeScene(el.querySelector('#orbit-scene'),{position:[7,9,12],target:[0,0,0]});
 const renderLegacy=view.renderer.render.bind(view.renderer);
 view.renderer.render=(...args)=>{if(state.mode==='transfer')renderLegacy(...args);};
 view.scene.add(new THREE.AmbientLight(0xd9e6f0,1.1));const light=new THREE.DirectionalLight(0xffffff,2.1);light.position.set(4,7,5);view.scene.add(light);
 group=new THREE.Group();view.scene.add(group);
 earthTexture=new THREE.TextureLoader().load('/textures/earth_daymap.jpg');earthTexture.colorSpace=THREE.SRGBColorSpace;
 earth=new THREE.Mesh(new THREE.SphereGeometry(1,48,32),new THREE.MeshStandardMaterial({map:earthTexture,roughness:.75}));
 marker=new THREE.Mesh(new THREE.SphereGeometry(.075,18,12),new THREE.MeshBasicMaterial({color:0xf6d384}));
 grid=new THREE.GridHelper(20,20,0x334755,0x1d2a38);grid.position.y=-1.01;view.scene.add(grid);

   view.loop(dt=>{if(state.mode==='transfer'&&state.play){const limit=2;state.progress=Math.min(limit,state.progress+dt/12);position();if(state.progress===limit)state.play=false;renderUI();}});
  })();try{await sceneTask;}finally{sceneTask=null;}
 }
 const defaults={...state};let current=null,unBind=()=>{},lastPlot=0,comparison=null,ghost=null,transferUI;
 const api={module:'orbits',get conics(){return conics;},get landingStaging(){return landingStaging;},get state(){if(state.mode==='orbit')return conics.state;if(landingStaging){const s=landingStaging.snapshot;return {...s,play:s.playing,progress:s.time/s.model.seconds};}return state;},get result(){return state.mode==='orbit'?conics.result:landingStaging?landingStaging.snapshot:current;}};window.__lab=api;
 function clear(){if(!group)return;for(const o of [...group.children]){group.remove(o);if(o!==earth&&o!==marker)o.traverse(n=>{n.geometry?.dispose();if(n.material)for(const m of Array.isArray(n.material)?n.material:[n.material])m.dispose();});}}
 function line(points,color){const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p))),new THREE.LineBasicMaterial({color}));group.add(l);return l;}
 function circle(radius,color){line(Array.from({length:241},(_,i)=>[radius*Math.cos(i*Math.PI/120),0,radius*Math.sin(i*Math.PI/120)]),color);}
 function controls(){transferUI?.beforeControls();
  unBind();const s=state;
  if(s.mode==='orbit'||s.mode==='landing'||s.mode==='staging')return;
  let html='';
  if(s.mode==='orbit')html=control('speed','初始横向速度 km/s',s.speed,0,14,.01)+control('progress','轨迹时间进度',s.progress,0,1,.001)+`<div class="button-row"><button data-preset="drop">只抬高</button><button data-preset="circle">精确圆轨道</button><button data-preset="ellipse">1.1倍圆速</button><button data-preset="escape">临界逃逸</button></div><details><summary>释放高度</summary>${control('height','释放高度 km',s.height,100,5000,50)}</details>`;
  if(s.mode==='transfer')html=control('progress','经过时间 / 单程转移时间',s.progress,0,2,.001)+`<label class="orbits-switch"><input type="checkbox" data-key="secondBurn" ${s.secondBurn?'checked':''}> 远地点执行第二次点火</label><div class="button-row"><button data-preset="apo">到达远地点</button><button data-preset="after">看后续轨迹</button></div><details class="orbits-transfer-parameters"><summary>起始与目标轨道高度</summary>`+control('target','目标高度 km（升轨）',s.target,3100,50000,1)+control('height','起始高度 km',s.height,100,3000,50)+`</details>`;
  if(s.mode==='staging')html=control('reserve','一级保留回收推进剂 t',s.reserve,0,15,.5)+control('payload','载荷 t',s.payload,.5,10,.5)+`<div class="button-row"><button data-preset="reserve">保留10 t回收储备</button></div><details><summary>各级质量与排气速度</summary>`+control('prop1','一级推进剂 t',s.prop1,20,150,1)+control('dry1','一级干质量 t',s.dry1,2,20,.5)+control('prop2','二级推进剂 t',s.prop2,5,50,1)+control('ve','等效排气速度 km/s',s.ve,2,4.5,.1)+control('progress','分离示意进度',s.progress,0,1,.01)+`<p class="note">二级干质量固定3 t。保留量属于一级推进剂；仅作上升质量预算，不计算实际返航消耗。</p></details>`;
  if(s.mode==='landing')html=control('twr','推力 / 重量',s.twr,.5,3,.01)+control('progress','演示进度',s.progress,0,1,.001)+`<div class="button-row"><button data-preset="hover">推力等于重量</button><button data-preset="stop">恰好在地面停住</button></div><details><summary>点火高度与下降速度</summary>`+control('landingHeight','点火高度 m',s.landingHeight,20,500,5)+control('fallSpeed','初始下降速率 m/s',s.fallSpeed,10,100,1)+'</details>';
  el.querySelector('#orbit-controls').innerHTML=html;unBind=bindControls(el.querySelector('#orbit-controls'),state,key=>{state.play=false;if(key!=='progress'&&key!=='secondBurn')state.progress=0;refresh();feedback(key==='secondBurn'?'第二次点火已切换；保持相同经过时间，对照实心与空心标记。':'输入已更新；轨迹与读数同步。');});
 }
 function camera(extent,target=[0,0,0]){extent*=Math.max(1,1.6/view.camera.aspect);view.controls.target.set(...target);view.camera.position.set(target[0]+extent*.65,target[1]+extent*.8,target[2]+extent*1.2);view.controls.update();}
 function rocket(radius,length,color){const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,length,24),new THREE.MeshStandardMaterial({color,roughness:.4}));group.add(m);return m;}
 function refresh(){
  const surface=['landing','staging'].includes(state.mode)?'paper':'scene';if(surface!==presentationSurface){stopPresentation?.();presentationSurface=surface;stopPresentation=applyPresentation(pilot,{surface,redraw:()=>{if(lastPlot&&state.mode==='transfer')plot(el.querySelector('#orbit-plot'),lastPlot);}});}
  // Return shared navigation before the incoming presentation acquires it.
  if(landingStaging&&state.mode!=='landing'&&state.mode!=='staging'){landingStaging.destroy();landingStaging=null;}
  transferUI?.beforeMode(state.mode);transferUI?.setMode(state.mode);
  // Short mode guidance must also update before the current conic and
  // landing/staging interfaces take their early-return rendering paths.
  const guide=getModeContext('orbits',state.mode);el.querySelector('#orbit-question').textContent=guide.question;el.querySelector('#orbit-instruction').textContent=guide.action+' '+guide.observe;
  pilot.dataset.mode=state.mode;conics.setActive(state.mode==='orbit');
  const useLandingStaging=state.mode==='landing'||state.mode==='staging';
  landingStagingSlot.hidden=!useLandingStaging;
  if(useLandingStaging){
   state.play=false;clear();el.querySelector('#orbit-copy').innerHTML='';
   if(landingStaging)landingStaging.setMode(state.mode);else landingStaging=mountLandingStaging(landingStagingSlot,{mode:state.mode});
   for(const b of pilot.querySelectorAll('.lab-tabs [data-mode]')){b.classList.toggle('active',b.dataset.mode===state.mode);b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode));}
   return;
  }
  if(state.mode==='orbit'){
   clear();el.querySelector('#orbit-copy').innerHTML='';
   for(const b of pilot.querySelectorAll('.lab-tabs [data-mode]')){b.classList.toggle('active',b.dataset.mode===state.mode);b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode));}
   return;
  }
  clear();el.querySelector('#orbit-copy').innerHTML=copy[state.mode];el.querySelector('#orbit-play').textContent=state.play?'暂停':'播放';
  for(const b of pilot.querySelectorAll('.lab-tabs [data-mode]')){b.classList.toggle('active',b.dataset.mode===state.mode);b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode));}
  grid.visible=false;marker.scale.setScalar(state.mode==='transfer'?5:1.5);let metrics='',legend='',plotOptions;
  const canvas=el.querySelector('#orbit-plot');
  if(state.mode==='orbit'){
   current=trajectory(state.height,state.speed);group.add(earth,marker);const pts=current.points,extent=Math.max(2.4,Math.min(17,Math.max(...pts.map(p=>p.r))/EARTH.radius));camera(extent*1.35);
   line(pts.map(p=>[p.x/EARTH.radius,0,p.y/EARTH.radius]),0xe8c677);circle((EARTH.radius+state.height)/EARTH.radius,0x405569);
   const q=current.info;metrics=metric('轨道判断',q.kind)+metric('圆轨道速度',N(q.vc,3)+' km/s')+metric('逃逸速度',N(q.escape,3)+' km/s')+metric('初始比机械能',N(q.energy)+' MJ/kg')+metric('近地点距地表',N(q.peri-EARTH.radius,0)+' km')+metric('已绘时间',N(current.seconds/60,1)+' min');
   legend=`地球与轨道同尺度；飞行器为放大标记。${current.impact?'轨迹止于首次触地。':current.truncated?'轨迹到视域18个地球半径或时间上限截断，仍会继续。':'显示一周或最多6.7小时。'} 真空模型不计算大气阻力。`;
   plotOptions={series:[{points:pts.filter((_,i)=>i%8===0||i===pts.length-1).map(p=>[p.t/60,p.v]),color:'#ebc77e',label:'速率'}],xDomain:[0,Math.max(1,current.seconds/60)],yDomain:[0,Math.max(1,...pts.map(p=>p.v))*1.1],xLabel:'经过时间 / min',yLabel:'速率 / km·s⁻¹'};
  } else if(state.mode==='transfer'){
   current=hohmann(state.height,state.target);group.add(earth,marker);ghost=new THREE.Mesh(new THREE.SphereGeometry(.33,14,10),new THREE.MeshBasicMaterial({color:0x71c8c7,wireframe:true}));group.add(ghost);const q=current,scale=EARTH.radius;circle(q.r1/scale,0x628aad);circle(q.r2/scale,0x71c8c7);
   line(Array.from({length:401},(_,i)=>{const p=transferDemoPoint(state.height,state.target,i/200,false);return[p[0]/scale,0,p[1]/scale];}),0xebc77e);
   camera(Math.max(3,q.r2/scale)*1.5);
   for(const [r,sign]of(state.secondBurn?[[q.r1,1],[q.r2,-1]]:[[q.r1,1]])){const origin=new THREE.Vector3(sign*r/scale,0,0),dir=new THREE.Vector3(0,0,sign);group.add(new THREE.ArrowHelper(dir,origin,.65,0xe89963,.16,.1));}
   metrics=metric('第一次点火 Δv',N(q.dv1,3)+' km/s')+metric('第二次点火 Δv',N(state.secondBurn?q.dv2:0,3)+' km/s')+metric('实际采用总 Δv',N(state.secondBurn?q.dv:q.dv1,3)+' km/s')+metric('自由飞行时间',N(q.seconds/3600,2)+' h')+metric('转移近地点速率',N(q.vp,3)+' km/s')+metric('转移远地点速率',N(q.va,3)+' km/s');
   legend='蓝：原圆轨道 · 金：完整转移椭圆 · 青：目标圆轨道。实心金点：当前开关；空心青点：相反开关，同一经过时间。标记放大，不代表飞行器尺寸。100%到远地点，200%为两倍单程转移时间；圆化后尚未必绕完高轨一周。共面瞬时点火，真空两体。';
   const returning=Array.from({length:201},(_,i)=>{const f=i/100,p=transferDemoPoint(state.height,state.target,f,false),r=Math.hypot(...p);return[f*q.seconds/3600,Math.sqrt(EARTH.mu*(2/r-1/q.a))];});
   const circular=[...returning.slice(0,101),[q.seconds/3600,q.v2],[q.seconds*2/3600,q.v2]];
   plotOptions={series:[{points:returning,color:'#ebc77e',label:'关闭：椭圆返回'},{points:circular,color:'#71c8c7',label:'开启：远地点圆化'}],xDomain:[0,2*q.seconds/3600],yDomain:[0,q.vp*1.12],xLabel:'第一次点火后时间 / h',yLabel:'速率 / km·s⁻¹'};
  } else if(state.mode==='staging'){
   current=staging(state);const first=rocket(.24,1.7,0x6688a3),second=rocket(.18,.9,0x71c8c7),tip=new THREE.Mesh(new THREE.ConeGeometry(.18,.35,24),new THREE.MeshStandardMaterial({color:0xebc77e}));first.name='stage-first';second.name='stage-second';tip.name='stage-tip';group.add(tip);grid.visible=true;camera(3.8,[0,1.1,0]);
   metrics=metric('一级上升 Δv',N(current.dv1,3)+' km/s')+metric('二级 Δv',N(current.dv2,3)+' km/s')+metric('分级总 Δv',N(current.total,3)+' km/s')+metric('始终不分离对照',N(current.unseparated,3)+' km/s')+metric('分级收益',N(current.gain,3)+' km/s')+metric('初始总质量',N(current.initial,1)+' t');legend='箭体示意各级结构；干质量包括空贮箱、发动机等。';
   plotOptions={series:[{points:Array.from({length:41},(_,i)=>[i*.375,staging({...state,reserve:i*.375}).total]),color:'#71c8c7',label:'保留一级回收储备后的总Δv'}],xDomain:[0,15],yDomain:[0,staging({...state,reserve:0}).total*1.15],xLabel:'一级保留推进剂 / t',yLabel:'理想总 Δv / km·s⁻¹'};
  } else {
   current=landing(state.landingHeight,state.fallSpeed,state.twr);const q=current;
   const tEnd=q.acceleration>0&&q.stopDistance<=state.landingHeight?state.fallSpeed/q.acceleration:(q.acceleration===0?state.landingHeight/state.fallSpeed:2*state.landingHeight/(state.fallSpeed+q.impactSpeed));current.seconds=tEnd;
   const ground=new THREE.Mesh(new THREE.BoxGeometry(4,.08,3),new THREE.MeshStandardMaterial({color:0x31424c}));ground.position.y=-1.1;group.add(ground);
   const body=rocket(.1,.5,0xebc77e);body.name='landing-body';grid.visible=false;camera(3.2);
   metrics=metric('模型结果',q.status)+metric('向上净加速度',N(q.acceleration)+' m/s²')+metric('所需停止距离',N(q.stopDistance,1)+' m')+metric('触地速率',q.stopDistance<=state.landingHeight?'尚未触地':N(q.impactSpeed,1)+' m/s')+metric('首次停住高度',q.stopDistance<=state.landingHeight?N(q.stopHeight,1)+' m':'不能在地面前停住')+metric('演示持续时间',N(tEnd,2)+' s');
   legend='竖直一维、质量恒定、推力恒定；高度按当前点火高度归一化。止于第一次停住或触地。';
   plotOptions={series:[{points:Array.from({length:101},(_,i)=>{const t=i/100*tEnd;return[t,Math.max(0,state.landingHeight-state.fallSpeed*t+.5*q.acceleration*t*t)];}),color:'#ebc77e',label:'距地表高度'}],xDomain:[0,Math.max(1,tEnd)],yDomain:[0,state.landingHeight*1.1],xLabel:'点火后时间 / s',yLabel:'高度 / m'};
  }
  el.querySelector('#orbit-metrics').innerHTML=metrics;el.querySelector('#orbit-legend').textContent=legend;
  el.querySelector('#orbit-title').textContent={orbit:'同高度，不同横向速度',transfer:'原轨道 → 转移椭圆 → 目标轨道',staging:'两段箭体，各有自己的质量预算',landing:'停止位置由高度、速度与净加速度共同决定'}[state.mode];
  el.querySelector('#orbit-plot-title').textContent={orbit:'轨道速率随时间',transfer:'自由升高时为什么会减速',staging:'回收储备如何占用上升性能',landing:'停得太晚与停得太早'}[state.mode];
  plot(canvas,plotOptions);lastPlot=plotOptions;position();renderUI();
 }
 function position(){if(!current)return;const f=state.progress;
  if(state.mode==='orbit'){const p=current.points[Math.round(f*(current.points.length-1))];marker.position.set(p.x/EARTH.radius,0,p.y/EARTH.radius);}
  if(state.mode==='transfer'){const p=transferDemoPoint(state.height,state.target,f,state.secondBurn),other=transferDemoPoint(state.height,state.target,f,!state.secondBurn);marker.position.set(p[0]/EARTH.radius,0,p[1]/EARTH.radius);ghost.position.set(other[0]/EARTH.radius,0,other[1]/EARTH.radius);}
  if(state.mode==='landing'){const t=f*current.seconds,h=Math.max(0,state.landingHeight-state.fallSpeed*t+.5*current.acceleration*t*t);group.getObjectByName('landing-body').position.set(0,-.81+2.4*h/state.landingHeight,0);}
  if(state.mode==='staging'){const first=group.getObjectByName('stage-first'),second=group.getObjectByName('stage-second'),tip=group.getObjectByName('stage-tip');first.position.set(-f,0,0);second.position.set(f,1.45+f,0);tip.position.copy(second.position).y+=.62;}
 }
 function feedback(text){el.querySelector('#orbit-feedback').textContent=text;}
 function headline(){const s=state,q=current;if(s.mode==='orbit')return `${N(s.speed,3)} km/s → ${q.info.kind}`;
  if(s.mode==='transfer')return `第二次点火${s.secondBurn?'开启':'关闭'} · 高度 ${s.target} km · Δv ${N(s.secondBurn?q.dv:q.dv1,3)} km/s`;
  if(s.mode==='staging')return `储备 ${s.reserve} t · 理想总 Δv ${N(q.total,3)} km/s`;
  return `推重比 ${N(s.twr,3)} · ${q.status} · 停距 ${N(q.stopDistance,1)} m`;
 }
 function renderUI(){syncControls(el,state);const s=state,q=current;
  const progress=el.querySelector('[data-value="progress"]');if(progress)progress.textContent=N(s.progress*100,1)+'%';
  el.querySelector('#orbit-play').textContent=s.play?'暂停':'播放';el.querySelector('#orbit-play').setAttribute('aria-pressed',String(s.play));
  let output='';if(s.mode==='orbit')output=metric('当前轨道',q.info.kind)+metric('本高度圆速 / 逃逸速度',N(q.info.vc,3)+' / '+N(q.info.escape,3)+' km/s');
  if(s.mode==='transfer'){const p=transferDemoPoint(s.height,s.target,s.progress,s.secondBurn),r=Math.hypot(...p),v=s.progress>=1&&s.secondBurn?q.v2:Math.sqrt(EARTH.mu*(2/r-1/q.a));output=metric('当前高度 / 速率',N(r-EARTH.radius,0)+' km / '+N(v,3)+' km/s')+metric('远地点第二次点火',s.secondBurn?'开启 · 圆化高轨':'关闭 · 沿椭圆返回');output+=`<p>经过 ${N(s.progress*q.seconds/3600,2)} h · ${s.progress<1?'正沿转移椭圆上升':s.progress===1?'到达远地点（瞬时点火前/后）':s.secondBurn?'已进入目标圆轨道':'正沿椭圆返回'}</p>`;}
  if(s.mode==='staging')output=metric('分级总 Δv',N(q.total,3)+' km/s')+metric('始终不分离 / 分级收益',N(q.unseparated,3)+' / +'+N(q.gain,3)+' km/s');
  if(s.mode==='landing')output=metric('当前预算结果',q.status)+metric('停止距离 / 点火高度',N(q.stopDistance,1)+' / '+N(s.landingHeight,0)+' m');
  el.querySelector('#orbit-outcomes').innerHTML=output;
  const box=el.querySelector('#orbit-comparison');box.hidden=!comparison;el.querySelector('#orbit-clear').hidden=!comparison;if(comparison){box.replaceChildren();for(const text of ['已记下：'+comparison,'现在：'+headline()]){const p=document.createElement('p');p.textContent=text;box.append(p);}}
 transferUI?.render();
 }

 const click=async e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.mode){const request=++modeRequest;if(b.dataset.mode==='transfer'&&!view){el.dataset.modeLoading='transfer';try{await ensureScene();}catch(error){modeError.textContent='三维转移视图无法初始化：'+error.message+'。其余二维航天工具仍可使用。';modeError.hidden=false;feedback(modeError.textContent);return;}finally{delete el.dataset.modeLoading;}}if(disposed||request!==modeRequest)return;modeError.hidden=true;state.mode=b.dataset.mode;if(state.mode==='transfer')state.height=Math.min(3000,state.height);state.progress=0;state.play=false;comparison=null;controls();refresh();feedback('已切换实验，动画停在起点。');el.dispatchEvent(new Event('change',{bubbles:true}));}
  if(b.dataset.preset){const key=b.dataset.preset,q=orbitState(state.height,state.speed);if(['drop','circle','ellipse','escape'].includes(key))state.speed={drop:0,circle:q.vc,ellipse:q.vc*1.1,escape:q.escape}[key];state.progress=key==='apo'?1:key==='after'?1.5:0;if(key==='reserve')state.reserve=10;if(key==='hover')state.twr=1;if(key==='stop')state.twr=1+state.fallSpeed**2/(2*EARTH.g0*state.landingHeight);state.play=false;controls();refresh();el.querySelector(`[data-preset="${key}"]`)?.focus({preventScroll:true});feedback('预设已应用；参数、图形与读数同步。');}
  if(b.id==='orbit-play'){state.play=!state.play;if(state.progress>=(state.mode==='transfer'?2:1))state.progress=0;position();renderUI();}
  if(b.id==='orbit-compare'){comparison=headline();renderUI();feedback('已记下当前读数；调节参数可对照变化。');}
  if(b.id==='orbit-clear'){comparison=null;renderUI();feedback('已清除对照。');}
  if(b.id==='orbit-reset'){for(const input of el.querySelectorAll('[data-key]'))state[input.dataset.key]=defaults[input.dataset.key];state.progress=0;state.play=false;comparison=null;controls();refresh();feedback('已恢复本项默认参数，动画停在起点；对照已清除。');}
 };
 if(['orbit','transfer','staging','landing'].includes(requestedMode))state.mode=requestedMode;
 if(state.mode==='transfer'){try{await ensureScene();}catch(error){conics.dispose();view?.dispose();if(window.__lab===api)delete window.__lab;throw error;}}
 el.addEventListener('click',click);controls();refresh();
 transferUI=attachTransferUI(el,{redraw:()=>{if(state.mode==='transfer')refresh();},read:()=>state});
 const unregisterModel=registerExperimentModel(el,{getState:mode=>mode==='orbit'?conics.getState():null,applyState:saved=>state.mode==='orbit'&&conics.applyState(saved)});
 const resize=new ResizeObserver(()=>{if(lastPlot)plot(el.querySelector('#orbit-plot'),lastPlot);});resize.observe(el.querySelector('#orbit-plot'));
 return ()=>{unregisterModel();stopDisclosures();stopNavigation();stopPresentation?.();transferUI.dispose();disposed=true;modeRequest++;landingStaging?.destroy();conics.dispose();unBind();el.removeEventListener('click',click);resize.disconnect();clear();if(view){earth.geometry.dispose();earth.material.dispose();earthTexture.dispose();marker.geometry.dispose();marker.material.dispose();view.dispose();}if(window.__lab===api)delete window.__lab;};
}



