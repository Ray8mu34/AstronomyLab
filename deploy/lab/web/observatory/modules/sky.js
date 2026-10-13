let THREE;
import {assetURL,bindControls,startVisibleLoop} from '../shared/core-controls.js';
import {plot} from '../shared/plot.js';
import {DEG, wrap, solarEquatorial, horizontal, equatorialVector, equatorialToLocal, dayLength, circumpolar, gnomon, parallaxDistance, starPosition, airMass, calendarDrift} from './sky-physics.mjs';
import {DAY_YEAR, SIDEREAL_HOURS, PRECESSION_PERIOD, PRECESSION_TILT, dayGeometry, precessionGeometry} from './sky-demo-geometry.mjs';
import {ERA,dateAtDay,dayAtDate,solarLongitudeAtDate,distanceSequence,epochPrecession} from './sky-motion-physics.mjs';
import {attachCalendarUI} from './sky-calendar-ui.js';
import {attachDayUI} from './sky-day-ui.js';
import {attachPathUI} from './sky-sky-ui.js';
import {attachPrecessionUI} from './sky-precession-ui.js';
import {attachGnomonUI} from './sky-measure-ui.js';


const C={teal:0x71c8c7,gold:0xebc77e,blue:0x8aaedd,purple:0xa796d0,grey:0x4b5b6a};
const range=(key,label,min,max,step=1)=>`<label class="control">${label} <span data-value="${key}"></span><input data-key="${key}" type="range" min="${min}" max="${max}" step="${step}"></label>`;
const select=(key,label,options)=>`<label class="control">${label}<select data-key="${key}">${options.map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select></label>`;
const check=(key,label)=>`<label class="control-row"><input data-key="${key}" type="checkbox"> ${label}</label>`;
function label(text,color='#cbd5dd',scale=1){
  const c=document.createElement('canvas');const measure=c.getContext('2d');measure.font='44px sans-serif';c.width=Math.ceil(measure.measureText(text).width+28);c.height=72;const x=c.getContext('2d');x.font='44px sans-serif';x.fillStyle=color;x.textAlign='center';x.fillText(text,c.width/2,51);
  const texture=new THREE.CanvasTexture(c);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));s.scale.set(c.width/72*.75*scale,.75*scale,1);return s;
}
function line(points,color,opacity=1){return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity}));}
function release(group){if(!group)return;group.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of [].concat(o.material)){m.map?.dispose();m.dispose();}}});group.clear();}
const vec=(a)=>new THREE.Vector3(...a);
const world=(v)=>new THREE.Vector3(v[0],v[2],-v[1]);
const circle=(fn)=>Array.from({length:181},(_,i)=>fn(i*2*Math.PI/180));
const decimal=(v,d=2)=>v===null?'—':Number(v).toFixed(d);

export async function mount(el,{mode:requestedMode}={}){
  const response=await fetch('/data/sky/stars.json');if(!response.ok)throw Error('真实恒星子目录无法读取');const catalogue=await response.json();
  const defaults={tab:'sky',latitude:30,longitude:90,hour:12,obliquity:23.44,view:'local',look:180,lookAltitude:30,equator:true,ecliptic:true,lunar:false,galactic:false,starDec:70,extinction:.2,group:'dipper',blend:0,offset:0,selected:54061,errors:true,motion:false,baseline:2,height:1,calendar:'gregorian',years:400,playing:false,measureTask:'shadow',dayHours:0,precessionYears:0,starsProgress:0,speed:1,shadowCycle:'day',shadowDay:171,shadowDate:'2026-06-21',spinMode:'both'};
  const initial=requestedMode||new URLSearchParams(location.search).get('mode');
  const state={...defaults,motionView:'oblique',tab:initial==='calendar'?'measure':['sky','stars','measure','day','precession'].includes(initial)?initial:defaults.tab,measureTask:initial==='calendar'?'calendar':'shadow'};
  const tabNames={sky:'天空与四季',stars:'方向与距离',measure:'测影与历法',day:'两种一天',precession:'地轴岁差'};
  el.innerHTML=`<link rel="stylesheet" href="/modules/sky-pilot.css"><div class="sky-pilot">
  <nav class="sky-tabs" aria-label="天空实验现象">${Object.entries(tabNames).map(([key,name])=>`<button data-tab="${key}" aria-pressed="${key===state.tab}">${name}</button>`).join('')}</nav>
  <header class="sky-guide"><h2 id="sky-question"></h2><div id="sky-instruction"></div><button data-action="guide" aria-expanded="true" aria-controls="sky-instruction">收起观察提示</button></header>
  <div class="sky-workspace"><section class="sky-observation" aria-label="当前现象与读数">
  <section class="sky-stage"><div class="sky-view-head"><h3 id="sky-scene-title"></h3><div id="sky-views" role="group" aria-label="空间观察方式">${[['local','地面'],['earth','地球外部'],['inside','抬头']].map(([v,t])=>`<button data-view="${v}">${t}</button>`).join('')}</div></div>
  <div id="sky-motion-views" class="button-row" hidden><button data-motion-view="oblique">空间全景</button><button data-motion-view="pole">从北极看</button><button data-motion-view="close">近看地球</button></div>
  <div class="scene-host" id="sky-scene" aria-label="可用鼠标或触摸转动的三维天空几何"></div><div id="sky-day-diagram" role="img" aria-label="差角辅助放大，实际场景角度不变" hidden></div><canvas class="plot-canvas" id="sky-main-plot" aria-label="整数历日与季节参照的累计差" hidden></canvas>
  <div id="sky-transport" class="sky-transport" aria-label="演示播放与时间"><div class="sky-transport-buttons"><button data-action="play">播放演示</button><button data-action="restart-demo">重置演示</button><label>速度<select data-key="speed" aria-label="演示速度"><option value="0.5">½×</option><option value="1">1×</option><option value="2">2×</option></select></label></div><div id="sky-timeline"></div><p id="sky-motion-status" role="status"></p></div>
  <div class="legend" id="sky-legend"></div></section>
  <div id="sky-metrics"></div><div id="sky-comparison" hidden></div>
  <details class="sky-chart" id="sky-chart"><summary id="sky-chart-summary">展开联动曲线</summary><h3 id="sky-plot-title"></h3><canvas class="plot-canvas" id="sky-plot"></canvas></details></section>
  <aside class="sky-controls" id="sky-controls" aria-label="当前现象主控"></aside></div>
  <p class="sky-feedback" id="sky-feedback" role="status" aria-live="polite"></p>
  <details class="sky-explanation"><summary>读图、公式与完整解释</summary><article class="lab-copy" id="sky-copy"></article></details>
  <details class="sky-catalogue" id="sky-catalogue" hidden><summary>查阅当前目录子集与误差</summary><section class="lab-copy" id="sky-data" hidden></section></details>
  <div class="sky-reading button-row"><a href="/sources/sky.md">既有模型、目录与来源</a></div></div>`;
  const by=(id)=>el.querySelector('#'+id),host=by('sky-scene'),canvas=by('sky-plot');
  let lab=null,group=null,motionRenderer=null,sceneTask=null,modeRequest=0;
  let unbind=()=>{},unbindTransport=()=>{},disposed=false,drawToken=0,timer=0,comparison=null,metricItems=[],spin=0,calendarUI,dayUI,pathUI,precessionUI,gnomonUI;
  by('sky-scene').before(by('sky-transport'));
  const isFlat=()=>state.tab==='measure'&&state.measureTask==='calendar';
  async function ensureScene(){
    if(lab)return;if(sceneTask)return sceneTask;
    sceneTask=(async()=>{const [sceneModule,motionModule]=await Promise.all([import('../shared/scene.js'),import('./sky-motion-renderer.js')]);if(disposed)return;THREE=sceneModule.THREE;const makeScene=sceneModule.makeScene,makeSkyMotionRenderer=motionModule.makeSkyMotionRenderer;
  lab=makeScene(host,{position:[7,6,8],target:[0,0,0],fov:42});lab.camera.near=.005;lab.camera.updateProjectionMatrix();
  group=new THREE.Group();lab.scene.add(group);lab.scene.background=new THREE.Color('#090f19');
  motionRenderer=makeSkyMotionRenderer(lab,catalogue);

      lab.controls.addEventListener('start',freeCamera);
    })();try{await sceneTask;}finally{sceneTask=null;}
  }
  const f=(s)=>{const solar=solarEquatorial(s.longitude,s.obliquity),lst=wrap(solar.ra+(s.hour-12)*15),sun=horizontal(solar.ra,solar.dec,s.latitude,lst);return{solar,lst,sun,day:dayLength(s.latitude,solar.dec),shadow:gnomon(s.height,sun)};};
  function metric(items){metricItems=items;const rows=items.map(([a,b])=>`<div><small>${a}</small><strong>${b}</strong></div>`);by('sky-metrics').innerHTML=`<div class="sky-readings">${rows.slice(0,3).join('')}</div>${rows.length>3?`<details class="sky-extra-readings"><summary>其余读数与模型参照</summary><div class="sky-readings">${rows.slice(3).join('')}</div></details>`:''}`;drawComparison();}
  function sync(){for(const e of el.querySelectorAll('[data-key]')){if(e.type==='checkbox')e.checked=state[e.dataset.key];else e.value=state[e.dataset.key];const out=el.querySelector(`[data-value="${e.dataset.key}"]`);if(out)out.textContent=e.dataset.key==='dayHours'?decimal(state.dayHours,3):e.type==='range'?e.value:state[e.dataset.key];}
    for(const b of el.querySelectorAll('[data-tab],[data-season],[data-blend],[data-view],[data-measure-task],[data-day-end],[data-precession],[data-shadow-cycle],[data-shadow-date]')){const d=b.dataset,active=d.tab?state.tab===d.tab:d.season!==undefined?Math.abs(state.longitude-Number(d.season))<.001:d.blend!==undefined?state.blend===Number(d.blend):d.view?state.view===d.view:d.shadowCycle?state.measureTask==='shadow'&&state.shadowCycle===d.shadowCycle:d.measureTask?state.measureTask===d.measureTask:d.dayEnd!==undefined?Math.abs(state.dayHours-Number(d.dayEnd))<1e-7:d.shadowDate?state.shadowDate===d.shadowDate:Math.abs(state.precessionYears-Number(d.precession))<1e-7;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));}
    const play=el.querySelector('[data-action="play"]');if(play){play.textContent=state.playing?'暂停':state.tab==='day'?(state.dayHours===SIDEREAL_HOURS?'继续到太阳日':'播放一天'):state.tab==='stars'?'播放两步演示':state.tab==='precession'?'播放演示':state.tab==='measure'?(state.measureTask==='calendar'?'播放年长累计':state.shadowCycle==='year'?'播放一年正午':'播放一天影子'):'播放一天';play.setAttribute('aria-pressed',String(state.playing));}
    for(const box of el.querySelectorAll('[data-inside]'))box.hidden=state.view!=='inside';
  }
  function feedback(text){by('sky-feedback').textContent=text;}
  function condition(){if(state.tab==='sky'||state.tab==='measure'&&state.measureTask==='shadow')return`φ=${decimal(state.latitude,1)}°，λ=${decimal(state.longitude,1)}°，地方真太阳时${decimal(state.hour,2)}h${state.tab==='measure'?`，表高${decimal(state.height,1)}m`:''}`;if(state.tab==='stars')return`${state.group==='dipper'?'北斗':'毕宿'}，距离恢复${decimal(state.blend*100,0)}%，观察者横移${decimal(state.offset,1)}pc`;if(state.tab==='measure')return`${state.calendar==='365'?'365日年':state.calendar==='julian'?'四年一闰':'公历'}，${state.years}年`;if(state.tab==='day')return`从共同起点经过${decimal(state.dayHours,3)}小时`;return`${ERA+Math.round(state.precessionYears)}年示意（从2026近当前方向）`;}
  function drawComparison(){const box=by('sky-comparison');box.hidden=!comparison;if(!comparison)return;box.innerHTML=`<div class="sky-compare-head"><strong>保留一组读数对照</strong><button data-action="clear-compare">清除对照</button></div><p>保留：${comparison.condition}<br>当前：${condition()}</p><table><thead><tr><th>读数</th><th>保留</th><th>当前</th></tr></thead><tbody>${metricItems.slice(0,3).map(([name,value],i)=>`<tr><th>${name}</th><td>${comparison.items[i]?.[1]||'—'}</td><td>${value}</td></tr>`).join('')}</tbody></table>`;}
  function motionViewButtons(){for(const b of el.querySelectorAll('[data-motion-view]')){const active=state.motionView===b.dataset.motionView;b.setAttribute('aria-pressed',String(active));b.classList.toggle('active',active);}by('sky-motion-views').setAttribute('aria-label',`空间观察方式，当前${state.motionView==='free'?'自由视角':state.motionView==='pole'?'北极俯视':state.motionView==='close'?'细看参照':'空间全景'}`);precessionUI?.view(state);}
  const freeCamera=()=>{if(['day','precession'].includes(state.tab)){state.motionView='free';motionViewButtons();}};
  
  function change(){if(disposed)return;sync();motionViewButtons();render();}
  function camera(preset='oblique'){if(!lab)return;if(['day','precession'].includes(state.tab)){state.motionView=preset;motionRenderer.camera(state.tab,preset);motionViewButtons();return;}lab.camera.fov=42;lab.camera.updateProjectionMatrix();lab.controls.minDistance=0;lab.controls.maxDistance=Infinity;lab.controls.enabled=!(state.tab==='sky'&&state.view==='inside');if(state.tab==='measure'){lab.camera.position.set(9,7.5,10);lab.controls.target.set(0,1,0);}else if(state.tab==='stars'){const stars=catalogue.stars.filter(s=>s.group===state.group),center=stars.map(s=>starPosition(s,1)).reduce((a,v)=>a.map((x,i)=>x+v[i]/stars.length),[0,0,0]),map=p=>world(p.map((v,i)=>(v-center[i])*.25));const box=new THREE.Box3().setFromPoints([...stars.flatMap(s=>[map(starPosition(s,0)),map(starPosition(s,1))]),map([0,0,0]),map([0,15,0])]);const target=box.getCenter(new THREE.Vector3()),extent=box.getBoundingSphere(new THREE.Sphere()).radius;const dist=(extent+1)/Math.sin(21*DEG);lab.controls.target.copy(target);lab.camera.position.copy(target).add(new THREE.Vector3(.55,.35,.76).normalize().multiplyScalar(dist));}
    else if(state.view==='inside'&&state.tab==='sky'){lab.camera.position.set(0,.015,0);const a=state.look*DEG,h=state.lookAltitude*DEG;lab.controls.target.set(Math.sin(a)*Math.cos(h)*4,Math.sin(h)*4,-Math.cos(a)*Math.cos(h)*4);lab.camera.lookAt(lab.controls.target);}
    else{lab.camera.position.set(...(state.view==='earth'&&state.tab==='sky'?[8,7,10]:[7,6,8]));lab.controls.target.set(0,0,0);}lab.camera.updateMatrixWorld(true);lab.controls.update();}
  function shadowDate(){state.shadowDate=dateAtDay(state.shadowDay);state.longitude=solarLongitudeAtDate(state.shadowDate);if(state.shadowCycle==='year')state.hour=12;}
  function transport(){unbindTransport();const timeline=state.tab==='stars'?range('starsProgress','演示进度：距离 → 观察点',0,1,.001):state.tab==='day'?range('dayHours','从共同正午经过 / h',0,24,.00001):state.tab==='precession'?range('precessionYears',`从${ERA}年示意方向经过 / 年`,0,PRECESSION_PERIOD,10):state.tab==='measure'?(state.measureTask==='calendar'?range('years','从2000年累计 / 年',0,800,1):state.shadowCycle==='year'?range('shadowDay','2026年日期进度 / 日序',0,364,1):range('hour','地方真太阳时 / h',0,24,.01)):range('hour','地方真太阳时 / h',0,24,.01);
    by('sky-timeline').innerHTML=timeline;
    unbindTransport=bindControls(by('sky-transport'),state,key=>{if(key==='speed'){state.speed=Number(state.speed);return;}state.playing=false;if(key==='starsProgress'){Object.assign(state,distanceSequence(state.starsProgress));state.motion=false;}if(key==='shadowDay')shadowDate();change();});
  }
  function controls(){gnomonUI?.beforeControls();precessionUI?.beforeControls();pathUI?.beforeControls();dayUI?.beforeControls();calendarUI?.beforeControls();unbind();
    const seasons=`<div class="sky-control-caption">北半球分至 <span id="sky-season-reading">λ=${decimal(state.longitude,1)}°</span></div><div class="button-row sky-seasons">${[[0,'春分'],[90,'夏至'],[180,'秋分'],[270,'冬至']].map(([l,t])=>`<button data-season="${l}">${t}</button>`).join('')}</div>`;
    const latitude=range('latitude','纬度 φ / °（南为负）',-90,90,.1),hour=range('hour','地方真太阳时 / h',0,24,.05),longitude=range('longitude','太阳黄经 λ / °',0,359,.1);
    const advanced=body=>`<details class="sky-parameters"><summary>详细参数与参照</summary>${body}</details>`;
    const content={
      sky:`<h3>换地点，或换季节</h3>${latitude}${seasons}${advanced(longitude+range('obliquity','地轴倾角 ε / °（反事实可调）',0,45,.1)+select('view','空间视角',[['local','地面骨架'],['earth','地球外部'],['inside','天球内部']])+`<div data-inside>${range('look','抬头：方位角 / °',0,360)}${range('lookAltitude','抬头：仰角 / °',-20,90)}</div>`+`<fieldset><legend>参照圈：逐条加入</legend>${check('equator','天赤道 · 自转参照')}${check('ecliptic','黄道 · 公转参照')}${check('lunar','白道 · 固定交点的5.145°示意')}${check('galactic','银道 · FK5 J2000近似')}</fieldset>`+range('starDec','示例恒星赤纬 δ / °',-90,90)+range('extinction','消光系数 k / mag·气团⁻¹',0,.6,.01))}`,
      stars:`<h3>先把方向还原成距离</h3>${select('group','目录子集',[['dipper','北斗七星 · 7颗'],['hyades','毕宿方向 · 6颗']])}${range('blend','目录距离恢复比例',0,1,.01)}<div class="button-row"><button data-blend="0">同一壳层</button><button data-blend="1">目录距离</button></div>${range('offset','观察者横移 / pc',-30,30,.1)}<button data-action="origin">返回太阳系位置</button>${advanced(select('selected','选中恒星',catalogue.stars.filter(s=>s.group===state.group).map(s=>[s.hip,s.label]))+check('errors','径向 ±1σ 形式误差')+check('motion','方向图上的实测自行箭头')+range('baseline','两端视差基线 / AU',0,2,.1)+`<p class="note">自行箭头属于太阳系观测；开启会恢复目录距离并返回原点，横移观察者后关闭。数十pc横移是思想实验。</p>`)}`,
      measure:`<div class="button-row sky-subtasks" role="group" aria-label="测影与历法任务"><button data-shadow-cycle="day" data-measure-task="shadow">一天影子</button><button data-shadow-cycle="year">一年正午</button><button data-measure-task="calendar">年长累计</button></div>${state.measureTask==='shadow'?`<h3>${state.shadowCycle==='year'?'固定正午，看一年影长':'固定日期，看一天影向'}</h3><label class="control">日期（2026年）<input data-key="shadowDate" type="date" min="2026-01-01" max="2026-12-31"></label><div class="button-row">${[['2026-03-20','3月20日'],['2026-06-21','6月21日'],['2026-09-23','9月23日'],['2026-12-21','12月21日']].map(([d,t])=>`<button data-shadow-date="${d}">${t}</button>`).join('')}</div>${latitude}<button data-action="noon">太阳正午</button>${advanced(range('height','竖表高度 / m',.2,3,.1)+`<p>日期取UTC正午的近似太阳黄经；日内固定赤纬，时间为地方真太阳时。水平地面、竖直表、平行光；无时区、均时差、折射或地形预报。</p>`)}`:`<h3>整数日追逐季节年</h3>${select('calendar','整数日期规则',[['365','每年365天'],['julian','四年一闰'],['gregorian','公历：四百年97闰']])}<div class="button-row"><button data-calendar-years="100">100年</button><button data-calendar-years="400">400年</button></div><p class="note">季节年取固定365.2422日；逐年累计，不预报春分时刻或编制农历。</p>`}`,
      day:`<h3>一整圈之后，还差一点</h3><div class="button-row sky-day-endpoints"><button data-day-end="0">共同正午</button><button data-day-end="${SIDEREAL_HOURS}">恒星日终点</button><button data-day-end="24">平均太阳日终点</button></div><p class="note">橙色经线随地球自转；地球沿轨道顺行，蓝色远星方向固定。播放先停在恒星日，再继续到正午。</p>${advanced(`<p>圆轨道、匀速顺行、轴垂直轨道；一年${DAY_YEAR}个平均太阳日。球体与轨道距离不同比例；轨道角保持原值，辅助差角×40。真实地球有轴倾和偏心，地方真太阳日不恒定。</p>`)}`,
      precession:`<h3>自转快，轴向变化慢</h3><div class="button-row"><button data-precession="0">2026 · 当前时代</button><button data-precession="6500">6500年后</button><button data-precession="13000">半周后</button><button data-precession="26000">一周后</button></div>${select('spinMode','观察哪种运动',[['both','岁差与自转'],['spin','只看快速自转'],['axis','只看轴向变化']])}<p class="note">蓝轴扫过绿色天极轨迹；黄道北极与白色目录方向固定。拖动画布可绕到侧面看圆锥。</p>${advanced(`<p>从2026年近当前方向起算，固定倾角${PRECESSION_TILT}°、匀速周期约26,000年；不是精密年代定向。两种时间尺度各自压缩，自转约4秒一圈，不按真实时间比同步。目录历元1991.25固定，无长期自行、章动、倾角或黄道运动预测。</p>`)}`
    };
    by('sky-controls').innerHTML=content[state.tab]+`<div class="sky-reset-row"><button data-action="reset">回到本页起点</button>${state.tab!=='day'&&!(state.tab==='measure'&&state.measureTask==='calendar')?'<button data-action="home">视角回正</button>':''}<button data-action="capture">保留读数对照</button></div>`;
    transport();sync();unbind=bindControls(by('sky-controls'),state,(key)=>{if(['view','look','lookAltitude'].includes(key))camera();state.playing=false;if(key==='shadowDate'){if(!/^2026-\d{2}-\d{2}$/.test(state.shadowDate))state.shadowDate=dateAtDay(state.shadowDay);state.shadowDay=dayAtDate(state.shadowDate);shadowDate();}if(state.tab==='stars'){if(key==='motion'&&state.motion){state.offset=0;state.blend=1;}if(['offset','blend'].includes(key)){state.motion=false;state.starsProgress=state.offset===0?state.blend*.55:Math.min(1,.55+.45*Math.max(0,state.offset)/15);}if(key==='group'){state.selected=catalogue.stars.find(s=>s.group===state.group).hip;state.starsProgress=0;Object.assign(state,distanceSequence(0));controls();camera();}}change();});
  }
  function materialSphere(position,r,color){const m=new THREE.Mesh(new THREE.SphereGeometry(r,24,16),new THREE.MeshBasicMaterial({color}));m.position.copy(position);group.add(m);return m;}
  function textAt(t,p,color,scale=1){const s=label(t,color,scale);s.position.copy(p);pathUI?.label(s,t,color);gnomonUI?.label(s,t,color);group.add(s);return s;}
  function addCircle(points,color,alpha=1){group.add(line(points,color,alpha));}
  function skyScene(result){
    const {solar,lst,sun}=result,isEarth=state.view==='earth';
    const map=(v,r=4)=>isEarth?world(v).multiplyScalar(r):world(equatorialToLocal(v,state.latitude,lst)).multiplyScalar(r);
    const eq=(ra,dec,r=4)=>map(equatorialVector(ra,dec),r);
    if(isEarth){const earth=new THREE.Mesh(new THREE.SphereGeometry(1,36,24),new THREE.ShaderMaterial({uniforms:{sunDirection:{value:world(equatorialVector(solar.ra,solar.dec))}},vertexShader:'varying vec3 n; void main(){n=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform vec3 sunDirection; varying vec3 n; void main(){float d=max(0.0,dot(normalize(n),sunDirection));gl_FragColor=vec4(vec3(.035,.07,.09)+d*vec3(.08,.20,.25),1.0);}'}));group.add(earth);
      for(let d=-60;d<=60;d+=30)addCircle(circle(a=>world(equatorialVector(a/DEG,d,1.008))),C.grey);
      const up=world(equatorialVector(lst,state.latitude)),east=world([-Math.sin(lst*DEG),Math.cos(lst*DEG),0]),north=up.clone().cross(east).normalize();
      materialSphere(up.clone().multiplyScalar(1.05),.075,C.gold);textAt('观察者',up.clone().multiplyScalar(1.3),'#ebc77e',.6);
      addCircle(circle(a=>up.clone().multiplyScalar(1.02).add(east.clone().multiplyScalar(2.2*Math.cos(a))).add(north.clone().multiplyScalar(2.2*Math.sin(a)))),C.teal,.65);
      group.add(line([up.clone(),up.clone().multiplyScalar(3)],C.teal));textAt('当地铅直',up.clone().multiplyScalar(3.15),'#71c8c7',.65);
      group.add(line([new THREE.Vector3(0,-4.5,0),new THREE.Vector3(0,4.5,0)],C.blue));textAt('北天极',new THREE.Vector3(0,4.7,0),'#8aaedd',.7);
    }else{addCircle(circle(a=>new THREE.Vector3(4*Math.sin(a),0,-4*Math.cos(a))),C.teal);
      const ground=new THREE.Mesh(new THREE.CircleGeometry(3.9,64),new THREE.MeshBasicMaterial({color:0x173333,transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false}));ground.rotation.x=-Math.PI/2;group.add(ground);
      [['北',0],['东',90],['南',180],['西',270]].forEach(([t,a])=>textAt(t,new THREE.Vector3(4.3*Math.sin(a*DEG),.08,-4.3*Math.cos(a*DEG)),'#71c8c7',.5));
      const pole=eq(0,90,4.1);group.add(line([pole.clone().negate(),pole],C.blue,.6));textAt('北天极',pole.clone().multiplyScalar(1.05),'#8aaedd',.75);textAt('天顶',new THREE.Vector3(0,4.35,0),'#cbd5dd',.6);
    }
    if(state.equator)addCircle(circle(a=>eq(a/DEG,0)),C.blue);
    if(state.ecliptic)addCircle(circle(a=>map([Math.cos(a),Math.sin(a)*Math.cos(state.obliquity*DEG),Math.sin(a)*Math.sin(state.obliquity*DEG)])),C.gold);
    if(state.lunar){const e=(state.obliquity+5.145)*DEG;addCircle(circle(a=>map([Math.cos(a),Math.sin(a)*Math.cos(e),Math.sin(a)*Math.sin(e)])),C.purple,.8);}
    if(state.galactic){const n=vec(equatorialVector(192.8594812065348,27.12825118085622)),u=new THREE.Vector3(0,0,1).cross(n).normalize(),v=n.clone().cross(u).normalize();addCircle(circle(a=>map(u.clone().multiplyScalar(Math.cos(a)).add(v.clone().multiplyScalar(Math.sin(a))).toArray())),0xc99da0,.8);}
    addCircle(circle(a=>eq(solar.ra+a/DEG,solar.dec,4.03)),C.gold,.45);
    const sp=eq(solar.ra,solar.dec,4.03);materialSphere(sp,.13,C.gold);textAt('太阳',sp.clone().add(new THREE.Vector3(0,-.32,0)),'#ebc77e',.65);
    addCircle(circle(a=>eq(lst+a/DEG,state.starDec,3.8)),0xd1d7df,.5);materialSphere(eq(lst,state.starDec,3.8),.06,0xffffff);
    if(isEarth){const observer=world(equatorialVector(lst,state.latitude));group.add(line([observer,observer.clone().add(world(equatorialVector(solar.ra,solar.dec)).multiplyScalar(3))],C.gold,.6));}
    // 目录点只表示13颗取得的数据；不能用背景随机点充当星表。
    for(const star of catalogue.stars){const p=eq(star.raDeg,star.decDeg,4.08);materialSphere(p,.025+(4-star.hpMag)*.011,star.hip===21421?0xf0a36a:0xbbc9d8);}
    by('sky-legend').textContent=isEarth?'地球球体和方向球不同比例；绿色圈是观察点的当地切平面。太阳光线近似平行。':'绿：地平线 · 蓝：天赤道/天极 · 金：太阳/黄道 · 白：选定赤纬的日周圆。下半球保留以说明不可见部分。';
    if(state.view==='inside'){const a=state.look*DEG,h=state.lookAltitude*DEG;lab.camera.position.set(0,.015,0);lab.controls.target.set(Math.sin(a)*Math.cos(h)*4,Math.sin(h)*4,-Math.cos(a)*Math.cos(h)*4);lab.camera.lookAt(lab.controls.target);}
    metric([['此刻几何高度',decimal(sun.altitude)+'°'],['几何白昼',result.day.hours===null?result.day.kind:decimal(result.day.hours)+' h · '+result.day.kind],['北天极带符号高度',decimal(state.latitude,1)+'°'],['太阳赤纬',decimal(solar.dec)+'°'],['太阳方位（北→东）',sun.azimuth===null?'天顶处无定义':decimal(sun.azimuth)+'°'],['水平面直射几何因子',decimal(Math.max(0,sun.up),3)]]);
  }
  function skyPlot(result){
    const curves=[[0,'分','#8aaedd'],[state.obliquity,'夏至','#ebc77e'],[-state.obliquity,'冬至','#a796d0'],[result.solar.dec,'当前','#71c8c7']];
    plot(canvas,{series:[...curves.map(([dec,label,color])=>({points:Array.from({length:145},(_,i)=>{const h=i/6;return[h,horizontal(0,dec,state.latitude,(h-12)*15).altitude];}),label,color})),{points:[[state.hour,result.sun.altitude]],dots:true,color:'#71c8c7'}],xDomain:[0,24],yDomain:[-90,90],xLabel:'地方真太阳时 / h',yLabel:'太阳中心几何高度 / °'});
  }
  function starsScene(){
    const stars=catalogue.stars.filter(s=>s.group===state.group),center=stars.map(s=>starPosition(s,1)).reduce((a,v)=>a.map((x,i)=>x+v[i]/stars.length),[0,0,0]);
    const toScene=(p)=>world(p.map((v,i)=>(v-center[i])*.25)),observer=[0,state.offset,0],op=toScene(observer);
    materialSphere(op,.1,C.gold);textAt('观察者',op.clone().add(new THREE.Vector3(0,.35,0)),'#ebc77e',.8);
    const positions=stars.map(s=>starPosition(s,state.blend));
    stars.forEach((s,i)=>{const p=toScene(positions[i]),d=parallaxDistance(s.parallaxMas,s.parallaxErrorMas),selected=s.hip===Number(state.selected);materialSphere(p,selected?.14:.1,selected?C.gold:s.hip===21421?0xeea266:C.blue);if(selected||state.group==='dipper')textAt(s.label.split(' · ')[0],p.clone().add(new THREE.Vector3(0,.3,0)),selected?'#ebc77e':'#afc3d6',selected?.9:.64);group.add(line([op,p],C.grey,.25));
      if(state.errors&&state.blend>0){const u=equatorialVector(s.raDeg,s.decDeg);group.add(line([-1,1].map(sign=>toScene(u.map((v,j)=>v*(Math.hypot(...positions[i])+sign*d.sigma*state.blend)))),C.gold));}});
    const order=state.group==='dipper'?[54061,53910,58001,59774,54061,59774,62956,65378,67301]:[20889,20455,20205,20885,20894,21421];
    addCircle(order.map(id=>toScene(positions[stars.findIndex(s=>s.hip===id)])),C.teal,.65);
    const grid=new THREE.GridHelper(24,24,0x284351,0x1c2a36);grid.position.y=-3;group.add(grid);
    by('sky-legend').textContent='空间坐标线性缩放：1pc = 0.25画面单位。金线为径向±1σ；点与连线是识别符号，不是真实星径或实体连接。';
    const selected=stars.find(s=>s.hip===Number(state.selected))||stars[0],d=parallaxDistance(selected.parallaxMas,selected.parallaxErrorMas),vt=4.74047*Math.hypot(selected.pmRaMasYear,selected.pmDecMasYear)*d.pc/1000;
    metric([['选中星距离',decimal(d.pc)+' ± '+decimal(d.sigma)+' pc'],['目录距离恢复',decimal(state.blend*100,0)+'%'],['观察者横移',decimal(state.offset,1)+' pc'],['目录位置历元','1991.25 · ICRS'],['实测视差',decimal(selected.parallaxMas)+' ± '+decimal(selected.parallaxErrorMas)+' mas'],['最大两端角移（基线⊥视线）',decimal(selected.parallaxMas*state.baseline)+' mas'],['横向速度估计',decimal(vt)+' km/s']]);
    drawStars(stars,positions,observer);
    by('sky-data').innerHTML=`<h3>可以追溯的13条记录</h3><p>van Leeuwen (2007), Hipparcos New Reduction，CDS VizieR I/311/hip2。下面是当前子集，距离误差只包含目录视差的一阶传播，不含系统误差或双星模型。Hp不是Johnson V星等。</p><div style="overflow:auto"><table class="source-table" style="white-space:nowrap"><thead><tr><th>恒星</th><th>赤经/°</th><th>赤纬/°</th><th>视差±误差/mas</th><th>距离±误差/pc</th><th>μRA*, μDec / mas·yr⁻¹</th></tr></thead><tbody>${stars.map(s=>{const q=parallaxDistance(s.parallaxMas,s.parallaxErrorMas);return`<tr><td>${s.label}</td><td>${decimal(s.raDeg,4)}</td><td>${decimal(s.decDeg,4)}</td><td>${decimal(s.parallaxMas)} ± ${decimal(s.parallaxErrorMas)}</td><td>${decimal(q.pc)} ± ${decimal(q.sigma)}</td><td>${decimal(s.pmRaMasYear)}, ${decimal(s.pmDecMasYear)}</td></tr>`;}).join('')}</tbody></table></div>`;
  }
  function drawStars(stars,positions,observer){
    const central=vec(stars.reduce((a,s)=>{const v=equatorialVector(s.raDeg,s.decDeg);return a.map((x,i)=>x+v[i]/stars.length);},[0,0,0])).normalize();
    const east=new THREE.Vector3(0,0,1).cross(central).normalize(),north=central.clone().cross(east).normalize();
    const points=positions.map(p=>vec(p.map((x,i)=>x-observer[i])).normalize()).map(v=>[Math.atan2(v.dot(east),v.dot(central))/DEG,Math.atan2(v.dot(north),v.dot(central))/DEG]);
    const xmax=Math.max(6,...points.map(p=>Math.abs(p[0])))+2,ymax=Math.max(5,...points.map(p=>Math.abs(p[1])))+2;
    const result=plot(canvas,{series:[],xDomain:[xmax,-xmax],yDomain:[-ymax,ymax],xLabel:'视场切平面：东在左 / °',yLabel:'北向角度 / °'}),ctx=canvas.getContext('2d');
    // shared plot公开toPixel，沿用其DPR与坐标变换。
    const pixel=(p)=>result.toPixel(p[0],p[1]);
    const boxes=[];const ordered=stars.map((s,i)=>({s,i})).sort((a,b)=>(b.s.hip===Number(state.selected))-(a.s.hip===Number(state.selected)));
    ordered.forEach(({s,i})=>{const p=pixel(points[i]);ctx.fillStyle=s.hip===Number(state.selected)?'#ebc77e':s.hip===21421?'#eea266':'#adc9e3';ctx.beginPath();ctx.arc(p[0],p[1],Math.max(3,7-s.hpMag),0,Math.PI*2);ctx.fill();ctx.font='11px sans-serif';const text=s.label.split(' · ')[0],w=ctx.measureText(text).width;
      let placement=null;for(const [dx,dy] of [[8,-7],[8,17],[-w-8,-7],[-w-8,17],[8,-25],[-w-8,-25],[8,32],[-w-8,32]]){const x=p[0]+dx,y=p[1]+dy,box=[x-2,y-12,x+w+2,y+3];if(x<58||x+w>result.width-23||y<41||y>result.height-45)continue;if(boxes.some(b=>box[0]<b[2]&&box[2]>b[0]&&box[1]<b[3]&&box[3]>b[1]))continue;placement={x,y,box};break;}if(placement){boxes.push(placement.box);ctx.fillText(text,placement.x,placement.y);}
      if(state.motion){const a=s.raDeg*DEG,d=s.decDeg*DEG,u=vec(equatorialVector(s.raDeg,s.decDeg)),mu=new THREE.Vector3(-Math.sin(a),Math.cos(a),0).multiplyScalar(s.pmRaMasYear).add(new THREE.Vector3(-Math.sin(d)*Math.cos(a),-Math.sin(d)*Math.sin(a),Math.cos(d)).multiplyScalar(s.pmDecMasYear));
        const cc=u.dot(central),ee=u.dot(east),nn=u.dot(north),dx=-.2*(cc*mu.dot(east)-ee*mu.dot(central))/(cc*cc+ee*ee),dy=-.2*(cc*mu.dot(north)-nn*mu.dot(central))/(cc*cc+nn*nn);ctx.strokeStyle='#ebc77e';ctx.beginPath();ctx.moveTo(...p);ctx.lineTo(p[0]+dx,p[1]+dy);ctx.stroke();}});
    by('sky-plot-title').textContent=state.motion?'恒星方向 · 自行箭头100mas/yr = 20px（非未来预报）':'同一批恒星从观察者看去的方向';
  }
  function measureScene(result){
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(10,10),new THREE.MeshBasicMaterial({color:0x12323a,side:THREE.DoubleSide}));ground.rotation.x=-Math.PI/2;group.add(ground);
    const grid=new THREE.GridHelper(10,20,0x426271,0x28404b);grid.position.y=.01;group.add(grid);
    const trace=[];for(let i=0;i<=72;i++){const s=state.shadowCycle==='year'?{...state,hour:12,longitude:solarLongitudeAtDate(dateAtDay(i*364/72))}:{...state,hour:i/3};const p=f(s).shadow;if(p.length===null||p.length>4.8){if(trace.length>1)addCircle(trace.splice(0),C.grey,.7);else trace.length=0;continue;}trace.push(new THREE.Vector3(p.east,.018,-p.north));}if(trace.length>1)addCircle(trace,C.grey,.7);
    group.add(line([new THREE.Vector3(0,0,0),new THREE.Vector3(0,state.height,0)],C.gold));textAt('竖表 '+decimal(state.height,1)+' m',new THREE.Vector3(0,state.height+.3,0),'#ebc77e',.6);
    const shadow=result.shadow;
    if(shadow.length!==null){const raw=new THREE.Vector3(shadow.east,.025,-shadow.north),clipped=raw.length()>4.8;const end=raw.clone();if(clipped)end.multiplyScalar(4.8/end.length());group.add(line([new THREE.Vector3(0,.025,0),end],0xc4d9dc));
      group.add(line([end,new THREE.Vector3(0,state.height,0)],C.gold,.5));textAt(clipped?'影长超出画面':'影端',end.clone().add(new THREE.Vector3(0,.3,0)),'#c4d9dc',.6);}
    const s=new THREE.Vector3(result.sun.east,result.sun.up,-result.sun.north);materialSphere(s.clone().multiplyScalar(4.5),.12,C.gold);textAt('太阳方向',s.clone().multiplyScalar(4.6),'#ebc77e',.6);
    [['北',0],['东',90],['南',180],['西',270]].forEach(([t,a])=>textAt(t,new THREE.Vector3(4.5*Math.sin(a*DEG),.06,-4.5*Math.cos(a*DEG)),'#71c8c7',.55));
    by('sky-legend').textContent='方格0.5m。表与地面按同一线性尺度；太阳只有方向含义。影端超出4.8m时图中截断，数值保留计算结果。';
    shadowPlot();
    metric([['日期 · 地方真太阳时',state.shadowDate+' · '+clockTime(state.hour)],['太阳几何高度',decimal(result.sun.altitude)+'°'],['此刻影长',shadow.length===null?'无直接日照':decimal(shadow.length)+' m'],['正午影长',decimal(gnomon(state.height,horizontal(0,result.solar.dec,state.latitude,0)).length)+' m'],['几何白昼',decimal(result.day.hours)+' h'],['近似太阳黄经',decimal(state.longitude)+'°']]);
  }
  function precessionPlot(demo=epochPrecession(state.precessionYears)){
    const p=a=>[PRECESSION_TILT*Math.cos(a*DEG),PRECESSION_TILT*Math.sin(a*DEG)];
    plot(canvas,{series:[{points:Array.from({length:181},(_,i)=>p(-i*2)),color:'#71c8c7',label:'天极轨迹'},{points:[p(90)],color:'#7c8f9c',dots:true,label:'2026示意方向'},{points:[p(demo.azimuthDegrees)],color:'#8aaedd',dots:true,label:'当前'}],xDomain:[-30,30],yDomain:[-30,30],xLabel:'黄道北极方位投影：离极角 / °',yLabel:'径向=离黄道北极角；不是赤经赤纬'});
  }
  function calendarScene(){
    const points=calendarDrift(state.years,state.calendar),average=state.calendar==='365'?365:state.calendar==='julian'?365.25:365.2425;
    by('sky-legend').textContent='从2000年起累加整数历日，再减去年数 × 365.2422日。闰日形成锯齿；固定近似不能预报真实春分或编制农历。';
    plot(by('sky-main-plot'),{series:[{points,color:'#71c8c7',label:calendarUI?.active?'历日 − 季节参照':'整数历日 − 固定季节周期'}],xDomain:[0,Math.max(1,state.years)],yDomain:state.calendar==='365'?[-state.years*.25,2]:state.calendar==='julian'?[-1,Math.max(2,state.years*.009)]:[-1.2,1.8],xLabel:'从2000年开始的历年数',yLabel:'累计差 / 日'});
    metric([['累计历日差',decimal(points.at(-1)[1],3)+' d'],['当前规则长期平均',decimal(average,4)+' d / 年'],['季节参照近似','365.2422 d · 不恒定']]);
  }
  function guide(){
    el.querySelector('.sky-pilot').dataset.mode=state.tab;
    const content={sky:['旅行者换了纬度，天空哪里变了？','拖动纬度，看蓝色北天极相对绿色地平线的高度；再点冬至，比较太阳路径。'],stars:['看上去相邻的星，真的靠在一起吗？','点“目录距离”，看空间前后分开而方向图保持；再横移观察者，比较毕宿五与远处星点。'],measure:state.measureTask==='shadow'?['同一根竖表，为什么影长随季节改变？','固定北纬30°与正午，在夏至、冬至间切换；读影长，并看影端方向。']:['整数日，怎样跟上一个有小数的年？','在365日年、四年一闰、公历间切换，比较400年的累计差和闰日锯齿。'],day:['同一地面标记，为什么有两个“一天”的终点？','依次点两个终点：橙色标记先对齐固定远星，再多转约0.98°追上太阳。'],precession:['地轴慢慢转向，天极与天赤道怎样一起动？','点“四分之一周”，看蓝色地轴与天赤道一起转，金色黄道及白色背景方向保持固定。']};
    by('sky-question').textContent=content[state.tab][0];by('sky-instruction').textContent=content[state.tab][1];
    by('sky-views').hidden=state.tab!=='sky';const flat=state.tab==='measure'&&state.measureTask==='calendar';host.hidden=flat;by('sky-day-diagram').hidden=state.tab!=='day';by('sky-main-plot').hidden=!flat;by('sky-chart').hidden=state.tab==='day'||flat;by('sky-motion-views').hidden=!['day','precession'].includes(state.tab);el.querySelector('[data-motion-view=close]').textContent=state.tab==='precession'?'轴与圆锥':'近看地球';
    by('sky-catalogue').hidden=state.tab!=='stars';by('sky-chart-summary').textContent=state.tab==='stars'?'展开同一星区的方向图':state.tab==='precession'?'展开天极的方位投影':state.tab==='measure'?'展开当前测影时间曲线':'展开太阳高度曲线';
  }
  function copy(result){
    const sunAir=airMass(result.sun.altitude),loss=sunAir===null?null:10**(-.4*state.extinction*sunAir);
    const texts={sky:`<h3>地平线切开的，不是“另一半宇宙”</h3><p>把纬度从30°拖到赤道，再拖到北极。北天极的高度随纬度改变，地轴却没有跟旅行者一起转向；改变的是脚下的水平面。白色日周圆取赤纬${state.starDec}°，在当前纬度属于“${circumpolar(state.latitude,state.starDec)}”。它由地球自转扫出，恒星没有真的绕地球一天公转一圈。</p><p>再固定纬度并点击四个分至。轴倾把太阳周年黄经变成赤纬变化，同一天中太阳露在地平线上方的弧长也随之改变。更高的太阳让同一束光分布在更小地面面积，更长的白昼增加积分时间。正午高度和昼长都能计算，实际气温还要经过大气、海洋和地面的热响应。</p><div class="formula">sin δ = sin ε sin λ<br>sin h = sin φ sin δ + cos φ cos δ cos H<br>cos H₀ = −tan φ tan δ；昼长 = 2H₀ / 15° · h</div><p>上图控制的是太阳黄经与地方真太阳时，而不是手机日期与钟表时间。春分=0°、夏至=90°；一年内黄经并不真正匀速。当天太阳赤经加时角给出模型恒星时；恒星每个平均太阳日提前约四分钟回到子午圈，来自自转与公转参照的差别。极点的分日太阳恰在几何地平线上时，不能强行把切线状态归入12小时白昼。</p><h3>天空很低，光也要走得更远</h3><p>平面平行大气中，气团X≈1/sin h；当前太阳高度${decimal(result.sun.altitude)}°，${sunAir===null?'低于15°，这里停止使用sec(z)近似，不能把无限值当真实大气。':`气团约${decimal(sunAir)}，取k=${state.extinction}mag/气团时，透过率10<sup>−0.4kX</sup>≈${decimal(loss*100,1)}%。`}这只描述示例直接光消光，不包含云、天空散射、光污染或视宁度；消光系数可以随波段与天气改变。</p><p class="note">折射、地形、太阳半径、均时差、岁差章动和真实日期历表未纳入。球壳只存方向，星点只含已取得的13颗目录点。白道交点是选定示意；银道的FK5 J2000方向用于概念对照，不提供精密ICRS转换。平面开关不是移动天体。</p><figure><img loading="lazy" src="${assetURL('assets/05/v02/solstice-earth.png')}" alt="两次至日前后的地球观测影像" style="max-width:100%;max-height:260px"><figcaption>NASA/DSCOVR EPIC观测合成，2018/2019两次至日；原观测图及署名记录保留。</figcaption></figure>`,
    stars:`<h3>让一张星图重新长出深度</h3><p>开始时，把每颗星都放到50pc的同一方向壳层，便是一张可以转动的星图。向“恢复真实距离”拖动，赤经、赤纬保持，径向距离逐渐换成Hipparcos视差得到的值。留在太阳系位置时，二维方向图几乎不变；空间视图却暴露出前景和背景。这个滑块是在还原信息，没有模拟恒星运动。</p><p>北斗的天枢比斗身其他几颗星更远；毕宿五约20pc，而所选毕宿区域的其他亮星约45—50pc。V字相邻并不证明物理相邻。把观察者横向搬动，近星的视线改得更快，原来的图案就改变了。这样的大位移是思想实验；不是暗示航天器已经能够在数十秒差距间巡航。</p><div class="formula">d(pc) = 1000 / p(mas)<br>σd ≈ 1000 σp / p²<br>v⊥(km/s) = 4.74047 μ(arcsec/yr) d(pc)</div><p>距离和运动要一起读。自行箭头表现实测角速度，不能只凭类似的箭头判定共同起源；还需径向速度、年龄、成分与完整的空间运动。这里没有径向速度，也没有双星轨道或长期动力学，不外推数万年星座形状。按位置历元1991.25存放目录点，没有冒充2026年的当日精密指向。</p><p>基线滑块给出当基线与视线垂直时的最大两端角移。半年两个观测位置相距约2AU，完整角移约2p；传统周年视差p对应1AU，所以两端角移不能直接当p。milliarcsecond的测量尺度与上图的数度视场相差数百万倍，数值比一条夸张动画更诚实。</p><p class="note">只取13颗高视差信噪比恒星，并非完整全天星表或星团成员目录。距离±1σ为形式误差的一阶近似；不能覆盖目录系统误差或复杂多星系统。星径、颜色与连线仅为辨认符号，点大小没有直接编码实际半径。</p><figure><img loading="lazy" src="${assetURL('assets/06/oae-taurus.png')}" alt="IAU金牛座方向星图" style="max-width:100%;max-height:330px"><figcaption>IAU OAE / IAU / Sky & Telescope，CC BY 4.0，原观测图及署名记录保留。星座方向区域、图案和真实星团属于不同层次。</figcaption></figure>`,
    measure:`<h3>一根竖表把方向变成长度</h3><p>地面水平、表竖直、阳光平行时，表顶到影端形成直角三角形。“一天影子”固定所选日期，变化的是地方真太阳时；“一年正午”固定真太阳时12:00，变化的是2026年的日期。日期用USNO近似太阳黄经公式取UTC正午太阳方向，日内固定赤纬，不提供城市钟表时间预报。改变纬度和日期，再回到太阳正午，便能把地轴倾斜读成地面刻度。北纬30°的一米表，春分正午影长约0.58m，夏至约0.12m，冬至约1.35m。这些差别来自太阳方向，并非太阳的光线变长。</p><div class="formula">L = H cot h；h = arctan(H/L)<br>太阳正午 h = 90° − |φ − δ|</div><p>热带太阳可以中天于天顶北侧，正午影子于是朝南；正午影子不能一律向北。一天最短的影子也不总在钟表12:00出现；控制条使用地方真太阳时，不含时区与均时差。太阳低于地平线时没有直接日照，模型不会继续给出“负影长”。真实测影还受太阳有限角直径、折射、半影、表倾斜与地面坡度影响。</p><h3>整数日怎样追逐一个有小数的年</h3><p>“年长累计”页从2000年开始逐年累计整数历日，并减去同样年数乘365.2422日的教学参照。平年积欠约0.2422日，闰年补入一整天，因而出现锯齿。四年一闰使平均365.25日；公历再跳过不能被400整除的整百年，400年中留下97个闰日，平均365.2425日。</p><p>这条曲线只比较年长与累计量，不预报某年春分时刻，也没有把回归年当永恒常数。季节与月相是不同周期：19个这样的季节年约6939.60日，235个29.5306日的平均朔望月约6939.69日。近整数比解释闰月的目的，现代农历仍需要真实朔时、中气、时区和日界，不能从这条平均线直接编历。</p><p class="note">空间图是现代测影几何，不是特定朝代圭表的工程复原。本模式不复原浑仪形制与历史实物；方向球环圈展示参照平面，没有冒充一台已校准的古代测量仪。</p>`};
    texts.day=`<h3>一圈的终点，要先说相对谁</h3><p>从同一地面标记正对太阳、也正对一个固定远星方向开始。地球相对远星转一整周，橙色标记回到原来的空间方向；同时地球已沿轨道顺行，太阳方向也转过约0.98°。标记还须多转一点，才再正对太阳。</p><p>上方3D地球沿轨道公转，橙色经线和标记随自转转动。蓝虚线保持固定远星方向，金线连接地球和太阳。拖动可以改变视角。播放先在恒星日终点暂停，此时标记回到远星方向；再继续约236秒，地球相对远星多转约0.986°，才追上仍在变化的太阳方向。辅助图只把这个小角度放大40倍，主场景角度保持原值。</p><div class="formula">1 / T<sub>太阳</sub> = 1 / T<sub>恒星方向</sub> − 1 / P<sub>公转</sub><br>P = ${DAY_YEAR} × 24 h；T<sub>恒星方向</sub> ≈ 23 h 56 min 4.1 s</div><p>这里采用圆轨道、匀速顺行、地轴垂直轨道的几何教学模型，并把平均太阳日定为24h。真实地方真太阳日还受轨道偏心、轴倾与均时差影响。严格恒星时以春分点为参考，春分点的岁差会使恒星日与固定恒星方向的一周存在微小差别；本示意忽略该区别，不把读数当精密时间标准。</p><p class="note">空间视角可拖动，也可切到北极俯视。球体大小与地日距离不同比例；轨道角未放大。没有真实日期、UT1或精密星历。</p><p>参考：<a href="https://aa.usno.navy.mil/faq/GAST" target="_blank" rel="noopener">USNO · 恒星时与固定恒星／春分点</a>；<a href="https://aa.usno.navy.mil/faq/eqtime" target="_blank" rel="noopener">USNO · 均时差与真／平太阳时</a>。另据<a href="https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html" target="_blank" rel="noopener">NASA Earth Fact Sheet</a>的公转365.256日、自转23.9345h与平均日长24h作数量基准。本轮实际查阅；公式是上述圆轨道模型的几何推导。</p>`;
    texts.precession=`<h3>地轴、天极、天赤道是同一个几何约束</h3><p>地轴指向方向球的交点就是天极；垂直地轴并通过中心的平面与方向球相交，得到天赤道。所以改变地轴方向时，天极与天赤道必须一起改变，不能只移动“北极星”的标签。</p><p>本示意把黄道平面、黄道北极和背景方向固定，地轴以${PRECESSION_TILT}°半角缓慢画圆锥。蓝色天赤道的法向始终与蓝色地轴同向，细灰线保留2026年近当前方向。点半周时，倾角仍为${PRECESSION_TILT}°，但轴向已走到圆锥另一侧；走满约26,000年才回到本示意的初始方向。</p><div class="formula">ψ = −360° × Δt / 26,000 年<br>n = (−sin ε sin ψ, sin ε cos ψ, cos ε)<br>天赤道：n · r = 0；ε = ${PRECESSION_TILT}°</div><p>负号表示在从黄道北极看去的右手坐标中，岁差方向与顺行公转相反。自转经线快速绕蓝轴旋转，而蓝轴缓慢绕金色黄道极改变方向。演示把约一天和约26,000年的时间尺度分别压缩，两个动画不按真实时间比例同步。联动图以黄道北极为中心，径向坐标是离极角、方位坐标是圆锥相位；它不是赤经赤纬星图，图内单位为度。</p><p>太阳、月球对地球赤道隆起的引力作用使地轴缓慢进动。NASA资料给出轴向岁差约25,771.5年的尺度和当前倾角约23.4°；这里取约26,000年并保持23.44°固定，只解释圆锥几何。真实倾角、进动速率、黄道和背景星方向都会变化，章动也未纳入。</p><p class="note">2026年标签只锚定近当前地轴方向，黄赤交角和参考架被冻结，未求解精密地球定向参数。13颗目录点只作固定方向参照，不外推自行，也不预测某历史年代或未来的极星身份。球面方向与地球尺寸不同比例。季节页的太阳模型仍是原有固定地轴模型；两者不拼成精密星历。</p><p>参考：<a href="https://science.nasa.gov/science-research/earth-science/milankovitch-orbital-cycles-and-their-role-in-earths-climate/" target="_blank" rel="noopener">NASA · Obliquity / Precession</a>，本轮实际查阅倾角、岁差机制与周期尺度。机构页面的历史极星概述没有作为精确天极身份依据。</p>`;
    by('sky-copy').innerHTML=texts[state.tab]+`<p><a href="/sources/sky-motion.md">本次连续演示的来源、坐标与模型边界</a></p>`;
  }
  function clockTime(h){const s=Math.round(h*3600);return `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor(s/60)%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
  function shadowPlot(){const annual=state.shadowCycle==='year',limit=annual?364:24;
    const sample=x=>{const s=annual?{...state,hour:12,longitude:solarLongitudeAtDate(dateAtDay(x))}:{...state,hour:x};return f(s).shadow.length;};
    plot(canvas,{series:[{points:Array.from({length:145},(_,i)=>{const x=i*limit/144,l=sample(x);return[x,l===null||l>5?NaN:l];}),color:'#71c8c7',label:annual?'全年正午影长':'本日影长'},{points:[[annual?state.shadowDay:state.hour,sample(annual?state.shadowDay:state.hour)??NaN]],dots:true,color:'#ebc77e'}],xDomain:[0,limit],yDomain:[0,5],xLabel:annual?'2026年日序（0=1月1日）':'地方真太阳时 / h',yLabel:'影长 / m · 大于5m不绘入曲线'});
    by('sky-plot-title').textContent=annual?'固定地方真太阳时12:00，日期改变':'固定日期，地方真太阳时改变';
  }
  function dayMotion(){const d=motionRenderer.updateDay(state.dayHours),end=dayGeometry(SIDEREAL_HOURS),width=by('sky-day-diagram').clientWidth||640,nearEnd=state.dayHours>=SIDEREAL_HOURS-.12;
    const extra=(360*24/SIDEREAL_HOURS-360),gap=Math.abs(d.spinDegrees-d.orbitDegrees-360),x=width<500?42:65,y=70,r=40,a=d.orbitDegrees*40*DEG,m=(nearEnd?d.spinDegrees-360:0)*40*DEG;
    by('sky-day-diagram').innerHTML=`<svg viewBox="0 0 ${width} 115" width="100%" height="100%" aria-hidden="true"><text x="12" y="22" fill="#aabccc" font-size="12">差角辅助 ×40 · 上方3D保持实际角度</text><line x1="${x}" y1="${y}" x2="${x+r}" y2="${y}" stroke="#8aaedd" stroke-dasharray="4 3"/><line x1="${x}" y1="${y}" x2="${x+r*Math.cos(a)}" y2="${y-r*Math.sin(a)}" stroke="#ebc77e" stroke-width="2"/>${nearEnd?`<line x1="${x}" y1="${y}" x2="${x+r*Math.cos(m)}" y2="${y-r*Math.sin(m)}" stroke="#f0a36a" stroke-width="2"/>`:''}<text x="${x+55}" y="${y-9}" fill="#ebc77e" font-size="12">太阳方向已移 ${decimal(d.orbitDegrees,3)}°</text><text x="${x+55}" y="${y+12}" fill="#f0a36a" font-size="12">${nearEnd?`标记距再次正午 ${decimal(gap,3)}°`:'接近终点时显示橙色标记'}</text><text x="12" y="105" fill="#adbed0" font-size="11">恒星日后再转 ${decimal(extra,3)}°，用时 ${decimal(d.extraSeconds,1)}秒</text></svg>`;
    by('sky-day-diagram').setAttribute('aria-label',`差角放大40倍。恒星日终点太阳方向已移${decimal(end.orbitDegrees,3)}度，地面标记此后还转${decimal(extra,3)}度，${decimal(d.extraSeconds,1)}秒后再对齐太阳。`);
    by('sky-legend').textContent='橙：固定地面经线 · 蓝虚线：固定远星方向 · 金线：地日连线。球体放大，轨道角未放大；拖动可转视角。';
    metric([['经过时间',clockTime(state.dayHours)],['相对远星自转',decimal(d.spinDegrees,3)+'°'],['沿轨道公转',decimal(d.orbitDegrees,3)+'°'],['恒星方向的一周','23 h 56 min 4.1 s'],['平均太阳方向的一周','24 h · 圆轨道近似'],['恒星日后再转',decimal(extra,3)+'° · '+decimal(d.extraSeconds,1)+' s']]);return d;
  }
  function precessionMotion(){const d=motionRenderer.updatePrecession(state.precessionYears,spin);precessionPlot(d);
    by('sky-legend').textContent='蓝轴绕固定黄道极扫圆锥；绿线是天极轨迹，灰线保留2026近当前方向。自转约4秒/圈与岁差分别压缩时间；白点固定。';
    metric([['示意年代',Math.round(d.year).toLocaleString('zh-CN')+' 年'],['保持轴倾',decimal(d.tiltDegrees)+'°'],['岁差方位变化',decimal(d.phaseDegrees,1)+'°'],['进动周期','约26,000年 · 匀速模型'],['背景位置历元','1991.25 · 未外推'],['时代参考','2026近当前方向 · 非精密定向']]);return d;
  }
  function motionStatus(){let t;if(state.tab==='stars')t=`${distanceSequence(state.starsProgress).phase} · 参数还原与视点变化，非恒星真实运动`;else if(state.tab==='day')t=state.dayHours===SIDEREAL_HOURS?'已对齐远星，尚未再对齐太阳；继续播放看最后约236秒。':state.dayHours>=24?'平均太阳日终点：同一经线再次对齐太阳。':'从共同正午开始，自转一圈时地球也沿轨道前进。';else if(state.tab==='precession')t=`${Math.round(ERA+state.precessionYears)}年示意 · ${state.spinMode==='spin'?'轴向固定，只看自转':state.spinMode==='axis'?'自转标记固定，只看慢轴向':'快速自转与慢轴向，各自压缩时间'}`;else if(state.tab==='measure')t=state.measureTask==='calendar'?`从2000年至${2000+Math.floor(state.years)}年的累计差`:state.shadowCycle==='year'?`${state.shadowDate} · 正午12:00固定；日期变化`: `${state.shadowDate} · ${clockTime(state.hour)}地方真太阳时；日期固定`;else t=clockTime(state.hour)+'地方真太阳时';by('sky-motion-status').textContent=t;}
  function render(){gnomonUI?.beforeMode(state);precessionUI?.beforeMode(state);pathUI?.beforeMode(state);dayUI?.beforeMode(state);calendarUI?.setMode(state);dayUI?.setMode(state);pathUI?.setMode(state);precessionUI?.setMode(state);gnomonUI?.setMode(state);release(group);motionRenderer?.hide();guide();const result=f(state);let demo=null;by('sky-data').hidden=state.tab!=='stars';by('sky-scene-title').textContent=state.tab==='stars'?'把目录距离放回星图':state.tab==='measure'?state.measureTask==='shadow'?'太阳方向、竖表与影端':'整数历日，追逐季节年':state.tab==='day'?'太阳、地球自转与公转 · 可转动视角':state.tab==='precession'?'快自转，慢轴向 · 倾斜地轴扫圆锥':'地平线、天轴与太阳路径';by('sky-plot-title').textContent=state.tab==='stars'?'同一批恒星从观察者看去的方向':state.tab==='precession'?'从黄道北极看天极轨迹':'同一纬度，一天中不同季节的太阳高度';
    const seasonReading=by('sky-season-reading');if(seasonReading)seasonReading.textContent=`λ=${decimal(state.longitude,1)}°`;
    if(state.tab==='stars')starsScene();else if(state.tab==='day')demo=dayMotion();else if(state.tab==='precession')demo=precessionMotion();else if(state.tab==='measure'){state.measureTask==='shadow'?measureScene(result):calendarScene();}else{skyScene(result);skyPlot(result);}copy(result);motionStatus();
    window.__lab={module:'sky',state,result,catalogue,physics:{solarEquatorial,horizontal,dayLength,gnomon,parallaxDistance},scene:lab,demo,motionRenderer,teachingGeometry:{dayGeometry,precessionGeometry,epochPrecession,solarLongitudeAtDate,distanceSequence}};
    calendarUI?.render(state);dayUI?.render(state);pathUI?.render(state);precessionUI?.render(state);gnomonUI?.render(state);drawToken++;motionRenderer?.updateLabels();lab?.render();
  }
  const click=async e=>{const t=e.target.closest('button');if(!t)return;
    if(t.dataset.tab||t.dataset.measureTask||t.dataset.shadowCycle){const request=++modeRequest,needsScene=t.dataset.tab?!(t.dataset.tab==='measure'&&state.measureTask==='calendar'):t.dataset.measureTask==='shadow'||Boolean(t.dataset.shadowCycle);
      if(needsScene&&!lab){const desired=t.dataset.tab==='measure'?'measure':t.dataset.tab||'measure';el.dataset.modeLoading=desired;try{await ensureScene();}catch(error){feedback('三维视图无法初始化：'+error.message+'。年长累计二维图仍可独立使用。');return;}finally{if(el.dataset.modeLoading===desired)delete el.dataset.modeLoading;}}if(disposed||request!==modeRequest)return;
    }
    if(t.dataset.tab){state.tab=t.dataset.tab;state.playing=false;timer=0;comparison=null;if(state.tab==='measure'&&state.measureTask==='shadow')shadowDate();controls();camera();change();feedback(`已切换到${tabNames[state.tab]}。`);if(innerWidth<=700)requestAnimationFrame(()=>el.querySelector('.sky-tabs').scrollIntoView({block:'start'}));}
    if(t.dataset.measureTask){state.measureTask=t.dataset.measureTask;state.playing=false;comparison=null;controls();camera();change();feedback(`已切换到${state.measureTask==='shadow'?'一根竖表':'年长累计'}。`);}
    if(t.dataset.shadowCycle){state.measureTask='shadow';state.shadowCycle=t.dataset.shadowCycle;state.playing=false;if(state.shadowCycle==='year')state.shadowDay=0;shadowDate();controls();camera();change();}
    if(t.dataset.shadowDate){state.shadowDay=dayAtDate(t.dataset.shadowDate);state.playing=false;shadowDate();change();}
    if(t.dataset.calendarYears){state.years=Number(t.dataset.calendarYears);state.playing=false;change();}
    if(t.dataset.motionView){camera(t.dataset.motionView);lab.render();}
    if(t.dataset.view){state.view=t.dataset.view;camera();change();feedback(`已切换观察方式：${t.textContent}。`);}
    if(t.dataset.season!==undefined){state.longitude=Number(t.dataset.season);state.playing=false;change();feedback(`已选择${t.textContent}；${condition()}。`);}
    if(t.dataset.blend!==undefined){state.blend=Number(t.dataset.blend);state.motion=false;state.offset=0;state.starsProgress=state.blend*.55;state.playing=false;change();feedback(`已切换到${t.textContent}，方向和距离读数同步更新。`);}
    if(t.dataset.dayEnd!==undefined){state.dayHours=Number(t.dataset.dayEnd);state.playing=false;change();feedback(`已到${t.textContent}：${condition()}。`);}
    if(t.dataset.precession!==undefined){state.precessionYears=Number(t.dataset.precession);state.playing=false;change();feedback(`已选择${t.textContent}，地轴、天极与天赤道同步更新。`);}
    if(t.dataset.action==='play'){if(!state.playing){if(state.tab==='day'&&state.dayHours>=24)state.dayHours=0;if(state.tab==='precession'&&state.precessionYears>=PRECESSION_PERIOD&&state.spinMode!=='spin')state.precessionYears=0;if(state.tab==='stars'&&state.starsProgress>=1){state.starsProgress=0;Object.assign(state,distanceSequence(0));}if(state.tab==='measure'){if(state.measureTask==='calendar'&&state.years>=800)state.years=0;else if(state.measureTask==='shadow'){if(state.shadowCycle==='year'&&state.shadowDay>=364){state.shadowDay=0;shadowDate();}if(state.shadowCycle==='day'&&state.hour>=24)state.hour=0;}}}state.playing=!state.playing;timer=0;change();feedback(state.playing?'正在播放；可以随时暂停或拖动进度。':'已暂停，保留当前构型。');}
    if(t.dataset.action==='restart-demo'){resetMotion();change();feedback('演示已重置并暂停。');}
    if(t.dataset.action==='reset'){const tab=state.tab,measureTask=state.measureTask,shadowCycle=state.shadowCycle;Object.assign(state,defaults,{tab,measureTask,shadowCycle});resetMotion();comparison=null;controls();camera();change();feedback(`已回到${tabNames[tab]}起点。`);}
    if(t.dataset.action==='home'){camera();lab.render();feedback('视角已回正，当前参数与读数保留。');}
    if(t.dataset.action==='origin'){state.offset=0;state.starsProgress=state.blend*.55;state.playing=false;change();feedback('观察者已返回太阳系位置，目录参数保留。');}
    if(t.dataset.action==='noon'){state.hour=12;state.playing=false;change();feedback('已回到地方真太阳时12:00，影长与影端同步更新。');}
    if(t.dataset.action==='guide'){const shown=by('sky-instruction').hidden;by('sky-instruction').hidden=!shown;t.textContent=shown?'收起观察提示':'显示观察提示';t.setAttribute('aria-expanded',String(shown));}
    if(t.dataset.action==='capture'){comparison={condition:condition(),items:metricItems.slice(0,3).map(row=>[...row])};drawComparison();feedback('已保留当前前三项读数；改变参数即可与当前值对照。');}
    if(t.dataset.action==='clear-compare'){comparison=null;drawComparison();feedback('已清除对照，当前构型保留。');}
    if(t.dataset.tab||t.dataset.measureTask||t.dataset.shadowCycle)el.dispatchEvent(new Event('change',{bubbles:true}));
  };
  function resetMotion(){state.playing=false;timer=0;if(state.tab==='stars'){state.starsProgress=0;Object.assign(state,distanceSequence(0));state.motion=false;}else if(state.tab==='day')state.dayHours=0;else if(state.tab==='precession'){state.precessionYears=0;spin=0;}else if(state.tab==='measure'){if(state.measureTask==='calendar')state.years=0;else if(state.shadowCycle==='year'){state.shadowDay=0;shadowDate();}else {state.hour=0;shadowDate();}}else state.hour=0;}
  if(!isFlat())await ensureScene();
  el.addEventListener('click',click);controls();camera();render();
  const stopClock=startVisibleLoop(dt=>{motionRenderer?.updateLabels();if(!state.playing)return;if(state.tab==='precession'&&state.spinMode!=='axis'){spin+=dt*Math.PI/2*state.speed;motionRenderer.updatePrecession(state.precessionYears,spin);}timer+=dt;if(timer<.06)return;const step=timer*state.speed;timer=0;
    if(state.tab==='sky')state.hour=wrap(state.hour+step*.8,24);
    else if(state.tab==='stars'){state.starsProgress=Math.min(1,state.starsProgress+step/16);Object.assign(state,distanceSequence(state.starsProgress));state.motion=false;if(state.starsProgress===1)state.playing=false;}
    else if(state.tab==='measure'){if(state.measureTask==='calendar'){state.years=Math.min(800,state.years+Math.max(1,Math.round(step*32)));if(state.years===800)state.playing=false;}else if(state.shadowCycle==='year'){state.shadowDay=Math.min(364,state.shadowDay+step*18);shadowDate();if(state.shadowDay===364)state.playing=false;}else{state.hour=Math.min(24,state.hour+step*1.2);if(state.hour===24)state.playing=false;}}
    else if(state.tab==='day'){const before=state.dayHours;state.dayHours=Math.min(24,before+step*(before<SIDEREAL_HOURS?2:.013));if(before<SIDEREAL_HOURS&&state.dayHours>=SIDEREAL_HOURS){state.dayHours=SIDEREAL_HOURS;state.playing=false;}if(state.dayHours===24)state.playing=false;}
    else if(state.tab==='precession'&&state.spinMode!=='spin'){state.precessionYears=Math.min(PRECESSION_PERIOD,state.precessionYears+step*650);if(state.precessionYears===PRECESSION_PERIOD)state.playing=false;}
    sync();render();});
  // canvas尺寸变化时，重新使用真实参数绘图；Observer仅属于本模块。
  const observer=new ResizeObserver(()=>{if(!disposed){if(state.tab==='stars')starsScenePlotOnly();else if(state.tab==='day')dayMotion();else if(state.tab==='precession')precessionPlot(epochPrecession(state.precessionYears));else if(state.tab==='measure'){state.measureTask==='calendar'?calendarScene():shadowPlot();}else if(state.tab==='sky')skyPlot(f(state));}});observer.observe(canvas);observer.observe(by('sky-day-diagram'));observer.observe(by('sky-main-plot'));
  function starsScenePlotOnly(){const stars=catalogue.stars.filter(s=>s.group===state.group);drawStars(stars,stars.map(s=>starPosition(s,state.blend)),[0,state.offset,0]);}
  calendarUI=attachCalendarUI(el,{redraw:change});
  dayUI=attachDayUI(el,{redraw:change});
  pathUI=attachPathUI(el,{redraw:change,defaults});
  precessionUI=attachPrecessionUI(el,{redraw:change});
  gnomonUI=attachGnomonUI(el,{redraw:change});
  return()=>{disposed=true;modeRequest++;gnomonUI.dispose();precessionUI.dispose();pathUI.dispose();dayUI.dispose();calendarUI.dispose();stopClock();unbind();unbindTransport();observer.disconnect();el.removeEventListener('click',click);lab?.controls.removeEventListener('start',freeCamera);release(group);motionRenderer?.dispose();lab?.dispose();if(window.__lab?.module==='sky')delete window.__lab;};
}
