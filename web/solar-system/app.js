import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {bodies,topics,modelNotes,sourceNotes,viewGuides,comparisonFields} from './content.js';
import {positionAt,orbitPoints,mapPosition,displayRadius,lightSeconds,DAY_MS,rad} from './physics.mjs';

const $=id=>document.getElementById(id);
// Keep the literal <body> entry used by the unified server's navigation injection.
document.body.classList.add('solar-module');
const stage=$('stage'), labels=$('labels');
const state={mode:'explore',selected:null,topic:'system',tab:'overview',readingExpanded:false,ms:Date.parse('2026-10-03T00:00:00Z'),playing:!matchMedia('(prefers-reduced-motion: reduce)').matches,speed:10,orbits:true,belts:true,comparisonMetric:'radius',comparisonScale:'linear',preset:null};
const metricsNumber=(v,d=2)=>v.toLocaleString('zh-CN',{maximumFractionDigits:d});
const fmtLight=seconds=>seconds<60?`${metricsNumber(seconds,0)}秒`:seconds<3600?`${metricsNumber(seconds/60,1)}分钟`:`${metricsNumber(seconds/3600,2)}小时`;
const dateString=()=>new Date(state.ms).toISOString().slice(0,10);
const minTime=Date.parse('2000-01-01T00:00:00Z'),maxTime=Date.parse('2049-12-31T00:00:00Z');
let renderer,scene,camera,perspectiveCamera,sizeCamera,controls,textureLoader,orbitGroup,beltGroup,stars,selectionRing;
let objects=new Map(),planetRows=[],clock=new THREE.Clock(),lastDate='',fly=null,hover=null,lastOrbitMonth='',homeFraming=null;
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),tmp=new THREE.Vector3();
let renderCounter=0;
const staticModes=new Set(['sizes','compare','axes']);
let sizeBounds={width:160,height:32};
const earth=()=>objects.get('earth').body;
const planets=()=>[...objects.values()].filter(o=>o.row).map(o=>o.body);

function syncExperiment(){
 const guide=viewGuides[state.mode];
 document.body.dataset.view=state.mode;
 $('experiment-question').textContent=guide.question;$('observation-hint').textContent=guide.hint;
 $('comparison-controls').hidden=state.mode!=='compare';
 $('comparison-metric').value=state.comparisonMetric;$('comparison-scale').value=state.comparisonScale;
 $('presets').innerHTML=guide.presets.map(([key,label])=>`<button data-preset="${key}" aria-pressed="${state.preset===key}">${label}</button>`).join('');
 $('presets').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>applyPreset(b.dataset.preset)));
 $('comparison-view').hidden=state.mode!=='compare';$('axes-view').hidden=state.mode!=='axes';
 $('stage').hidden=state.mode==='compare'||state.mode==='axes';labels.hidden=$('stage').hidden;
 $('stage').setAttribute('aria-label',state.mode==='sizes'?'固定正交尺寸对照，八行星同一尺寸标尺；用行星按钮选中查看读数。':'拖动旋转，滚轮缩放，点击天体查看；也可用行星按钮选择。');
 document.querySelector('.timebar').hidden=staticModes.has(state.mode);
 $('home-view').hidden=state.mode==='compare'||state.mode==='axes';$('top-view').hidden=staticModes.has(state.mode);
 document.querySelector('.beyond').hidden=staticModes.has(state.mode);
 document.querySelector('[data-body="sun"]').hidden=staticModes.has(state.mode);
 document.querySelector('.rail-intro').innerHTML=state.mode==='axes'?'固定参照<br><strong>轨道正向 ↑</strong>':staticModes.has(state.mode)?'固定参照<br><strong>地球 = 1</strong>':'太阳系成员<br><strong>选择一个世界</strong>';
 $('date').value=dateString();$('speed').value=String(state.speed);$('orbits-toggle').checked=state.orbits;$('belts-toggle').checked=state.belts;
 document.querySelector('.layer-controls>span').textContent=state.mode==='distance'?'时间流速只改变公转演示，不改变距离比例。':'自转同速慢放，不表示真实周期。';
 renderReference();
 if(state.mode==='compare')renderComparison();if(state.mode==='axes')renderAxes();
}
function applyPreset(key){
 if(state.mode==='compare'){
  state.comparisonMetric=key;state.comparisonScale=key==='mass'?'log':'linear';selectBody(key==='mass'?'jupiter':'earth');
 }else selectBody(key);
 state.preset=key;syncExperiment();notice(`已应用：${viewGuides[state.mode].presets.find(p=>p[0]===key)[1]}`);
}
function renderReference(){
 if(!objects.size)return;
 const p=state.selected&&state.selected!=='sun'?objects.get(state.selected).body:null;
 const reference=earth();
 let text;
 if(state.mode==='sizes')text=p?`${p.name}半径 ${metricsNumber(p.radius,1)} km = 地球的 ${metricsNumber(p.radius/reference.radius,3)} 倍`:`地球半径 = 1 · ${metricsNumber(reference.radius,4)} km · 太阳不在本列`;
 else if(state.mode==='compare')text=`固定参照：地球${comparisonFields[state.comparisonMetric].label} ${metricsNumber(reference[state.comparisonMetric],comparisonFields[state.comparisonMetric].digits)} ${comparisonFields[state.comparisonMetric].unit}`;
 else if(state.mode==='axes')text='倾角 = 自转角动量轴与公转正向法线夹角（0–180°）；不是公转轨道倾角。';
 else text=p?`${p.name} · 日心距离 ${metricsNumber(Math.hypot(...objects.get(p.id).actual),3)} AU · 太阳光单程 ${fmtLight(lightSeconds(Math.hypot(...objects.get(p.id).actual)))}`:state.mode==='distance'?'固定参照：1 AU · 太阳光单程约 8 分 19 秒':'固定参照：1 AU 光行时约 8 分 19 秒 · 球面同速慢放，不代表自转周期';
 $('reference-readout').textContent=text;
}
function renderComparison(){
 const field=state.comparisonMetric,meta=comparisonFields[field],ref=earth()[field];
 const rows=planets(),ratios=rows.map(p=>p[field]/ref),log=state.comparisonScale==='log';
 const max=Math.max(...ratios),lo=log?Math.floor(Math.log10(Math.min(...ratios))):0,hi=log?Math.ceil(Math.log10(max)):Math.ceil(max/(max>100?100:max>5?2:1))*(max>100?100:max>5?2:1);
 const map=v=>log?(Math.log10(v)-lo)/(hi-lo):v/hi;
 const ticks=log?Array.from({length:hi-lo+1},(_,i)=>10**(lo+i)):Array.from({length:5},(_,i)=>hi*i/4);
 $('comparison-title').textContent=`八行星 · ${meta.label}`;
 $('comparison-unit').textContent=`读数：${meta.unit} · 横轴：相对地球倍数`;
 $('comparison-axis').innerHTML=ticks.map(v=>`<span style="left:${map(v)*100}%">${metricsNumber(v,3)}</span>`).join('');
 const referenceX=map(1)*100;
 $('comparison-rows').innerHTML=rows.map(p=>`<button class="comparison-row${p.id==='earth'?' is-reference':''}" data-comparison-body="${p.id}" aria-pressed="${state.selected===p.id}"><span class="comparison-name">${p.name}${p.id==='earth'?'<small>参照</small>':''}</span><span class="comparison-track" aria-hidden="true"><i class="earth-marker" style="left:${referenceX}%"></i><i class="comparison-bar" style="width:${map(p[field]/ref)*100}%;--planet-color:${p.color}"></i></span><span class="comparison-value"><strong>${metricsNumber(p[field]/ref,3)}<small> 倍</small></strong><span>${metricsNumber(p[field],meta.digits)} ${meta.unit}</span></span></button>`).join('');
 $('comparison-rows').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>selectBody(b.dataset.comparisonBody)));
 $('comparison-caption').textContent=`${log?'对数轴：相同距离代表相同比值；条形从最左刻度起，长度不与物理量成正比。':'线性轴从零开始，条长与数值成正比。'}虚线固定为地球 = 1。${field==='radius'?'半径采用体积等效平均半径；体积比须取半径比的三次方。':field==='density'?'平均密度是总体质量除以总体积，不能直接读为金属含量。':'质量采用原 JPL 表，读数单位为 10²⁴ kg。'}`;
}
function renderAxes(){
 // Independent teaching projection, not a modification of the orbit model.
 // Each orbital normal is aligned upward; real spin-axis azimuth is omitted.
 $('axis-grid').innerHTML=planets().map(p=>{
  const angle=rad(p.tilt),x=58-42*Math.sin(angle),y=62-42*Math.cos(angle),retro=p.tilt>90;
  const endX=58-25*Math.sin(angle),endY=62-25*Math.cos(angle);
  return `<button class="axis-planet${p.id==='earth'?' is-reference':''}" data-axis-body="${p.id}" aria-pressed="${state.selected===p.id}" aria-label="${p.name}，轴倾角${p.tilt}度，${retro?'逆行':'顺行'}自转，恒星自转周期约${p.rotation}地球日"><span class="axis-name">${p.name}<small>${metricsNumber(p.tilt,2)}°</small></span><svg viewBox="0 0 116 124" aria-hidden="true"><defs><marker id="spin-${p.id}" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5" fill="#e7b775"/></marker></defs><path class="orbit-plane" d="M7 62 H109"/><path class="orbit-normal" d="M58 110 V10 M54 17 L58 10 L62 17"/><circle cx="58" cy="62" r="19" fill="${p.color}" fill-opacity=".55"/><path class="axis-equator" d="M38 62 H78" transform="rotate(${-p.tilt} 58 62)"/><path class="axis-angle" d="M58 37 A25 25 0 0 0 ${endX} ${endY}"/><path class="spin-axis" d="M${116-x} ${124-y} L${x} ${y}" marker-end="url(#spin-${p.id})"/></svg><span class="axis-direction">${retro?'↻ 逆行':'↺ 顺行'}</span><span class="axis-period">${metricsNumber(p.rotation,3)} 地球日</span></button>`;
 }).join('');
 $('axis-grid').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>selectBody(b.dataset.axisBody)));
}
function resetExperiment(){
 state.ms=Date.parse('2026-10-03T00:00:00Z');state.speed=10;state.orbits=true;state.belts=true;state.preset=null;state.comparisonMetric='radius';state.comparisonScale='linear';state.tab='overview';
 setPlaying(false);setMode(state.mode);setTab('overview');syncExperiment();notice('已重置：默认参数与全景，演示暂停。');
}

function notice(message){$('notice').textContent=message;$('notice').hidden=false;clearTimeout(notice.timer);notice.timer=setTimeout(()=>$('notice').hidden=true,4500);}
function setPlaying(value){state.playing=value;$('play').textContent=value?'Ⅱ':'▶';$('play').setAttribute('aria-pressed',String(value));$('play').setAttribute('aria-label',value?'暂停公转演示':'播放公转演示');}
function paragraphList(arr){return arr.map(s=>`<p>${s}</p>`).join('');}
function current(){return state.selected?bodies.find(x=>x.id===state.selected):topics[state.topic];}
function sourceLinks(item){return `<div class="source-links">进一步阅读：${(item.sources||[]).map((s,i)=>`<a href="${s}" target="_blank" rel="noopener">${s.includes('ssd.jpl')?'JPL':'NASA / 原图资料'} ${i+1} ↗</a>`).join(' · ')}</div>`;}
function row(k,v){return `<tr><th scope="row">${k}</th><td>${v}</td></tr>`;}
function renderContent(){
 const item=current();
 document.querySelector('.universe').classList.toggle('has-selection',Boolean(state.selected));
 $('object-type').textContent=item.type;
 $('object-header').innerHTML=`<h2>${item.name.replaceAll('\n','<br>')}</h2><p class="lead">${item.lead}</p>`;
 $('clear-selection').hidden=!state.selected&&state.topic==='system';
 renderMetrics();
 let html='';
 if(state.tab==='overview'){
  html=`<h3>${item.question}</h3>${paragraphList(item.overview)}`;
  if(state.selected){html+=`<button class="question-link" id="go-deep">${item.deepTitle}<span>↓</span></button>`;}
  else if(state.topic==='system'){html+=`<button class="question-link" data-pick="earth">一张纸，为什么装不下真实太阳系？<span>↗</span></button><button class="question-link" data-pick="jupiter">“大”可以是三种不同的含义<span>↗</span></button><button class="question-link" data-pick="uranus">轨道面与自转轴，是同一回事吗？<span>↗</span></button>`;}
 }else if(state.tab==='deep'){
  html=`<h3>${item.deepTitle}</h3>${paragraphList(item.deep)}`;
  if(item.image)html+=`<img src="${item.image}" alt="${item.caption}"><p class="caption">${item.caption}</p>`;
 }else if(state.selected&&state.selected!=='sun'){
  const p=objects.get(state.selected).body;
  const ratio=p.radius/6371.0084,mass=p.mass/5.97217,volume=ratio**3;
  html=`<h3>三个量，不是一张排行榜</h3><table class="fact-table">${row('平均半径',`${metricsNumber(p.radius,1)} km`)}${row('相对地球半径',`${metricsNumber(ratio,3)} 倍`)}${row('相对地球体积',`${metricsNumber(volume,1)} 倍`)}${row('相对地球质量',`${metricsNumber(mass,3)} 倍`)}${row('平均密度',`${metricsNumber(p.density,3)} g/cm³`)}${row('轨道半长轴（近似）',`${metricsNumber(p.a,3)} AU`)}${row('公转周期（近似）',`${metricsNumber(p.period,2)} 地球日`)}${row('恒星自转时长（绝对值）',`${metricsNumber(p.rotation,4)} 地球日`)}${row('轴倾角（0–180°）',`${metricsNumber(p.tilt,2)}°`)}</table><p class="caption">半径采用体积等效平均半径；体积比为半径比的三次方。巨行星不同纬度存在差异自转，单一周期不是整个天体的刚体周期。金星约243日是恒星自转周期，不是太阳日。时长报告绝对值；倾角取自转角动量正向与公转正向法线的0–180°夹角，顺逆行对照见自转轴视图。</p><div class="equation">ρ̄ = M / (⁴⁄₃ πR³)</div><p>平均密度涉及组成，也涉及内部压力引起的压缩；不能只用密度直接排列各行星的金属比例。</p>`;
 }else{
  html=`<h3>地球只有1厘米时</h3><table class="fact-table">${row('太阳的直径','约1.09 m')}${row('日地平均距离','约117 m')}${row('月球的直径','约2.7 mm')}${row('地月平均距离','约30 cm')}${row('海王星轨道尺度','约3.5 km')}</table><p>同一把尺缩放尺寸与距离，才会显出太阳系的空旷。行星海报清晰易认，是因为通常对两者采用不同的比例。</p><button class="question-link" id="try-distance">切换到轨道距离视图<span>↗</span></button><button class="question-link" id="try-sizes">切换到行星尺寸比较<span>↗</span></button>`;
 }
 html+=sourceLinks(item);
 $('object-content').innerHTML=html;$('object-content').scrollTop=0;
 $('current-reading-title').textContent=`${item.name.replaceAll('\n','')} · ${{overview:'概览',deep:'深入一层',data:'参数与尺度'}[state.tab]}`;
 document.querySelectorAll('[data-tab]').forEach(b=>{const selected=b.dataset.tab===state.tab;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;});
 $('go-deep')?.addEventListener('click',()=>setTab('deep',{reveal:true,scroll:true}));
 $('try-distance')?.addEventListener('click',()=>setMode('distance'));
 $('try-sizes')?.addEventListener('click',()=>setMode('sizes'));
 $('object-content').querySelectorAll('[data-pick]').forEach(el=>el.addEventListener('click',()=>selectBody(el.dataset.pick)));
 document.querySelectorAll('.planet-button').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.body===state.selected)));
 labels.querySelectorAll('.body-label').forEach(el=>el.classList.toggle('is-selected',el.dataset.body===state.selected));
 syncExperiment();
}
function renderMetrics(){
 const item=current();let entries;
 if(state.selected&&state.selected!=='sun'){
  const obj=objects.get(state.selected);const r=Math.hypot(...obj.actual);
  if(state.mode==='sizes')entries=[['相对地球半径',metricsNumber(obj.body.radius/earth().radius,3),'倍'],['相对地球体积',metricsNumber((obj.body.radius/earth().radius)**3,1),'倍']];
  else if(state.mode==='compare'){const f=state.comparisonMetric;entries=[[comparisonFields[f].label,metricsNumber(obj.body[f],comparisonFields[f].digits),comparisonFields[f].unit],['地球 = 1',metricsNumber(obj.body[f]/earth()[f],3),'倍']];}
  else if(state.mode==='axes')entries=[['轴倾角（0–180°）',metricsNumber(obj.body.tilt,2),'°'],['恒星自转时长',metricsNumber(obj.body.rotation,3),'地球日']];
  else entries=[['当前日心距离',metricsNumber(r,2),'AU'],['单程太阳光行时',fmtLight(lightSeconds(r)),'']];
 }else if(state.selected==='sun'){entries=[['太阳系质量占比','约99.8','%'],['约为地球直径','109','倍']];}
 else if(state.topic==='asteroids'){entries=[['多数成员轨道','约2—3.3','AU'],['所在分区','火星—木星','之间']];}
 else if(state.topic==='kuiper'){entries=[['主要柯伊伯带','约30—50','AU'],['行星之外','仍有世界','']];}
 else if(state.mode==='sizes')entries=[['固定尺寸参照','地球 = 1',''],['木星 / 地球半径',metricsNumber(objects.get('jupiter').body.radius/earth().radius,3),'倍']];
 else if(state.mode==='compare')entries=[['比较指标',comparisonFields[state.comparisonMetric].label,''],['固定参照','地球 = 1','']];
 else if(state.mode==='axes')entries=[['公转正向','↑ 向上',''],['逆行自转','金星、天王星','']];
 else{entries=[['行星','8','颗'],['至海王星轨道','约30','AU']];}
 $('object-metrics').innerHTML=entries.map(([name,value,unit])=>`<div class="metric"><small>${name}</small><strong>${value}<span>${unit}</span></strong></div>`).join('');
}
function setReadingExpanded(expanded,{scroll=false}={}){
 state.readingExpanded=expanded;$('solar-reading').hidden=!expanded;
 $('reading-toggle').setAttribute('aria-expanded',String(expanded));$('reading-toggle').textContent=expanded?'收起说明 ↑':'展开阅读 ↓';
 if(scroll&&expanded){$('solar-reading').scrollIntoView({block:'start'});$('current-reading-title').focus({preventScroll:true});}
 if(!expanded&&$('solar-reading').contains(document.activeElement)){$('reading-toggle').focus({preventScroll:true});$('reading-toggle').scrollIntoView({block:'center'});}
}
function setTab(tab,{reveal=false,scroll=false}={}){state.tab=tab;$('object-content').setAttribute('aria-labelledby',`tab-${tab}`);renderContent();if(reveal)setReadingExpanded(true,{scroll});}
function showDialog(kicker,html){$('dialog-kicker').textContent=kicker;$('dialog-content').innerHTML=html;$('info-dialog').showModal();$('dialog-content').scrollTop=0;$('info-dialog').scrollTop=0;}

function makeGlow(){const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d'),g=ctx.createRadialGradient(64,64,1,64,64,64);g.addColorStop(0,'rgba(255,243,200,1)');g.addColorStop(.12,'rgba(255,186,87,.7)');g.addColorStop(.32,'rgba(226,116,40,.22)');g.addColorStop(1,'rgba(160,64,12,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;return tex;}
function makeStars(){const arr=[],colors=[];const rnd=seeded(62);for(let i=0;i<3200;i++){const theta=rnd()*Math.PI*2,u=rnd()*2-1,r=800+rnd()*300,v=Math.sqrt(1-u*u);arr.push(r*v*Math.cos(theta),r*u,r*v*Math.sin(theta));const c=.23+rnd()*.35;colors.push(c*.92,c*.96,c);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(arr,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));return new THREE.Points(g,new THREE.PointsMaterial({size:.75,vertexColors:true,sizeAttenuation:false,transparent:true,opacity:.65,depthWrite:false}));}
function seeded(s){return ()=>{s=(Math.imul(s,1664525)+1013904223)|0;return(s>>>0)/4294967296;};}
function createBelts(){disposeGroup(beltGroup);const rnd=seeded(132);for(const [lo,hi,count,color]of [[2.1,3.3,1200,0x958b79],[30,50,1900,0x637c8d]]){const positions=[];for(let i=0;i<count;i++){const r=lo+rnd()*(hi-lo),a=rnd()*Math.PI*2,z=(rnd()-.5)*r*.08;positions.push(...mapPosition([r*Math.cos(a),r*Math.sin(a),z],state.mode));}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));beltGroup.add(new THREE.Points(g,new THREE.PointsMaterial({color,size:1.15,sizeAttenuation:false,transparent:true,opacity:.45,depthWrite:false})));}beltGroup.visible=state.belts&&state.mode!=='sizes';}
function disposeGroup(group){for(const o of [...group.children]){o.geometry?.dispose();o.material?.dispose();group.remove(o);}}
function rebuildOrbits(){disposeGroup(orbitGroup);for(const obj of objects.values()){if(!obj.row)continue;const pts=orbitPoints(obj.row,state.ms).map(p=>new THREE.Vector3(...mapPosition(p,state.mode)));const line=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:obj.body.id===state.selected?0xe7b775:0x8d949e,transparent:true,opacity:obj.body.id===state.selected?.7:.23}));line.userData.body=obj.body.id;orbitGroup.add(line);}orbitGroup.visible=state.orbits&&state.mode!=='sizes';lastOrbitMonth=dateString().slice(0,7);}

function resize(){if(!renderer)return;const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();if(state.mode==='sizes'){updatePositions();sizeHome();}else if(homeFraming!==null&&objects.size&&!staticModes.has(state.mode)){const frame=homeFrame(homeFraming);flyCamera(frame.target,frame.offset);}}
function viewExtent(){if(state.mode==='sizes')return 112;return state.mode==='distance'?162:139;}
function flyCamera(target,offset){fly={fromTarget:controls.target.clone(),fromPos:camera.position.clone(),toTarget:target.clone(),toPos:target.clone().add(offset),t:0};}
function sizeHome(){
 // Orthographic projection is essential: equal world radii must share one
 // screen scale, even for the large giants away from the image centre.
 const aspect=stage.clientWidth/stage.clientHeight,h=Math.max(sizeBounds.height,sizeBounds.width/aspect)*1.15,w=h*aspect;
 camera.left=-w/2;camera.right=w/2;camera.top=h/2;camera.bottom=-h/2;camera.zoom=1;camera.updateProjectionMatrix();
 fly=null;controls.target.set(0,0,0);camera.position.set(0,0,180);controls.update();
}
function homeFrame(top){
 const offset=top?new THREE.Vector3(0,viewExtent()*1.4,.001):new THREE.Vector3(viewExtent()*.63,viewExtent()*.62,viewExtent()),target=new THREE.Vector3();
 const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h||staticModes.has(state.mode))return {target,offset};
 const rect=stage.getBoundingClientRect(),bottom=document.querySelector('.scene-bottom').getBoundingClientRect().top-rect.top-18,margin=18;
 const preview=perspectiveCamera.clone();preview.aspect=w/h;preview.updateProjectionMatrix();preview.position.copy(offset);preview.lookAt(target);
 const up=new THREE.Vector3(0,1,0).applyQuaternion(preview.quaternion),shift=(margin+bottom)/2-h/2,tangent=Math.tan(rad(preview.fov)/2);
 const paths=[...objects.values()].filter(o=>o.row).flatMap(o=>orbitPoints(o.row,state.ms).map(p=>new THREE.Vector3(...mapPosition(p,state.mode))));
 for(let attempt=0;attempt<32;attempt++){
  target.copy(up).multiplyScalar(shift*2*offset.length()*tangent/h);preview.position.copy(target).add(offset);preview.lookAt(target);preview.updateMatrixWorld();
  const projected=p=>{const v=p.clone().project(preview);return {x:(v.x*.5+.5)*w,y:(-v.y*.5+.5)*h,z:v.z};};
  let fits=paths.every(p=>{const v=projected(p);return v.z>=-1&&v.z<=1&&v.x>=margin&&v.x<=w-margin&&v.y>=margin&&v.y<=bottom;});
  for(const obj of objects.values()){
   const v=projected(obj.group.position),depth=-obj.group.position.clone().applyMatrix4(preview.matrixWorldInverse).z,pixels=obj.visualRadius*h/(2*depth*tangent),ring=obj.body.id==='saturn'?pixels*2.3:pixels;
   const labelWidth=obj.label.offsetWidth||64,labelHeight=obj.label.offsetHeight||32,ly=v.y+Math.max(pixels,7)+8;
   if(depth<=0||v.x-Math.max(ring,labelWidth/2)<margin||v.x+Math.max(ring,labelWidth/2)>w-margin||v.y-ring<margin||Math.max(v.y+ring,ly+labelHeight/2)>bottom)fits=false;
  }
  if(fits)break;offset.multiplyScalar(1.08);
 }
 return {target,offset};
}
function homeView(top=false){state.selected=null;state.topic='system';state.preset=null;selectionRing.visible=false;homeFraming=top;if(state.mode==='sizes')sizeHome();else{const frame=homeFrame(top);flyCamera(frame.target,frame.offset);}renderContent();rebuildOrbits();}
function selectBody(id){
 if(!objects.has(id))return;
 if(staticModes.has(state.mode)&&id==='sun'){notice('本视图只比较八颗行星。太阳直径约是地球的109倍。');return;}
  homeFraming=null;state.selected=id;state.topic='system';state.preset=null;state.tab='overview';document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab==='overview')));$('object-content').setAttribute('aria-labelledby','tab-overview');
 setPlaying(false);const obj=objects.get(id);const r=obj.visualRadius;const offset=new THREE.Vector3(.75,1.35,1.6).normalize().multiplyScalar(Math.max(r*(id==='saturn'?7.2:5.8),6));
  if(!staticModes.has(state.mode))flyCamera(obj.group.position,offset);selectionRing.visible=!['distance','compare','axes'].includes(state.mode);renderContent();rebuildOrbits();
}
function selectTopic(topic){homeFraming=null;state.topic=topic;state.selected=null;state.tab='overview';setPlaying(false);selectionRing.visible=false;setTab('overview');const r=topic==='asteroids'?(state.mode==='distance'?22:48):viewExtent();flyCamera(new THREE.Vector3(),new THREE.Vector3(r*.6,r*.65,r));rebuildOrbits();}
function setMode(mode){
 if(!viewGuides[mode])return;
  homeFraming=null;state.mode=mode;state.preset=null;hover=null;$('notice').hidden=true;$('notice').textContent='';
 document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
 const scale={explore:'距离压缩 · 天体放大',distance:'距离同比例 · 点只标位置',sizes:'行星半径同比例 · 排列位置为示意',compare:'相同指标 · 相同横轴 · JPL原参数',axes:'共同轨道法线 · 角动量正向 · 教学投影'};
 $('scale-label').textContent=scale[mode];$('scene-hint').textContent=mode==='sizes'?'固定正交视角 · 球面同速慢放 · 土星环不计入行星半径':mode==='axes'?'顺逆行标签：各自轨道北侧俯视；自转周期为实际时长近似':mode==='compare'?'点选任一行星，将比较读数与介绍联动':'拖动旋转 · 滚轮缩放 · 点选行星靠近观察';
 if(mode==='distance')$('scene-hint').textContent='旋转、缩放 · 点选定位点或下方行星';
 const fixed=staticModes.has(mode);for(const id of ['date','speed','play','orbits-toggle','belts-toggle'])$(id).disabled=fixed;
 if(fixed)setPlaying(false);camera=mode==='sizes'?sizeCamera:perspectiveCamera;controls.object=camera;fly=null;controls.enableRotate=mode!=='sizes';controls.enablePan=mode!=='sizes';controls.enableZoom=mode!=='sizes';controls.minDistance=2.8;controls.maxDistance=500;
 syncExperiment();resize();updatePositions();createBelts();homeView();
}
function updatePositions(){
 let x=-61;
 for(const obj of objects.values()){
   obj.visualRadius=state.mode==='distance'?0:obj.body.id==='sun'?3.6:displayRadius(obj.body.radius,state.mode);
   obj.root.scale.setScalar(obj.visualRadius);obj.group.visible=state.mode!=='sizes'||obj.body.id!=='sun';
   obj.root.visible=state.mode!=='distance';obj.marker.visible=state.mode==='distance';obj.marker.material.color.set(state.selected===obj.body.id?'#e7b775':obj.body.color||'#dce6ee');
  if(obj.row){obj.actual=positionAt(obj.row,state.ms);if(state.mode==='sizes'){x+=obj.visualRadius;obj.group.position.set(x,0,0);x+=obj.visualRadius+4.3;}else obj.group.position.set(...mapPosition(obj.actual,state.mode));}
 }
 if(state.mode==='sizes'){
  // Layout only. Every sphere keeps the radius returned by protected physics.
  const items=[...objects.values()].filter(o=>o.row),mobile=matchMedia('(max-width:760px)').matches;
  const layout=row=>{
   const widths=row.map(o=>Math.max(mobile?10:4,o.visualRadius*(o.body.id==='saturn'?2.3:1))),total=widths.reduce((s,r)=>s+2*r,0)+(row.length-1)*7;
   let cursor=-total/2;row.forEach((o,i)=>{cursor+=widths[i];o.group.position.x=cursor;cursor+=widths[i]+7;});return total;
  };
  if(mobile){const outer=items.slice(4),width=layout(outer);outer.forEach(o=>o.group.position.y=-13);items.slice(0,4).forEach((o,i)=>o.group.position.set(-width/2+width*(i+.5)/4,17,0));sizeBounds={width:width+8,height:67};}
  else{sizeBounds={width:layout(items)+8,height:38};items.forEach(o=>o.group.position.y=4);}
 }
 if(state.selected){const obj=objects.get(state.selected);selectionRing.position.copy(obj.group.position);selectionRing.scale.setScalar(obj.visualRadius*1.35);selectionRing.lookAt(camera.position);}
}
function updateLabels(){
 const w=stage.clientWidth,h=stage.clientHeight;
 for(const obj of objects.values()){
   const el=obj.label;if(!obj.group.visible){el.style.display='none';continue;}
   if(state.mode==='distance'&&obj.body.id!==state.selected&&obj.body.id!==hover){el.style.display='none';continue;}
  // Anchor every label to its own sphere. Per-frame collision relocation caused
  // 35px jumps when neighbouring labels entered or left the exclusion zone.
  tmp.copy(obj.group.position).applyMatrix4(camera.matrixWorldInverse);const depth=-tmp.z;
  tmp.copy(obj.group.position).project(camera);
  const x=(tmp.x*.5+.5)*w,y=(-tmp.y*.5+.5)*h;
  const rPix=camera.isOrthographicCamera?obj.visualRadius*h/(camera.top-camera.bottom)*camera.zoom:obj.visualRadius/(depth||1)*h/(2*Math.tan(rad(camera.fov)/2));
  const ly=y+Math.max(rPix,7)+8;
  if(depth<=0||tmp.z<-1||tmp.z>1||x<0||x>w||ly<0||ly>h){el.style.display='none';continue;}
  el.style.display='block';el.style.left=`${x}px`;el.style.top=`${ly}px`;
  if(state.mode==='sizes')el.querySelector('span').textContent=`${metricsNumber(obj.body.radius/earth().radius,3)} R⊕`;
  else el.querySelector('span').textContent=obj.body.id==='sun'?'恒星':`${metricsNumber(obj.body.a,2)} AU`;
 }
}
function pick(e){const rect=stage.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const visible=[...objects.values()].filter(o=>o.group.visible);if(state.mode!=='distance'){const hit=raycaster.intersectObjects(visible.map(o=>o.root),true).find(h=>h.object.userData.pick);if(hit)return hit.object.userData.pick;}let best=null,bestD=state.mode==='distance'?9:19;for(const o of visible){tmp.copy(o.group.position).project(camera);if(tmp.z>1||tmp.z<-1)continue;const d=Math.hypot((tmp.x*.5+.5)*rect.width-(e.clientX-rect.left),(-tmp.y*.5+.5)*rect.height-(e.clientY-rect.top));if(d<bestD){bestD=d;best=o.body.id;}}return best;}

async function init(){
 const [orbitData,physical]=await Promise.all([fetch('data/orbits.json').then(r=>r.json()),fetch('data/physical.json').then(r=>r.json())]);
 planetRows=orbitData.planets;
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
 stage.appendChild(renderer.domElement);scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(46,1,.05,2400);perspectiveCamera=camera;sizeCamera=new THREE.OrthographicCamera(-80,80,40,-40,.05,2400);camera.position.set(87,86,139);controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.075;controls.minDistance=2.8;controls.maxDistance=500;controls.maxPolarAngle=Math.PI*.98;controls.addEventListener('start',()=>{fly=null;homeFraming=null;});
 scene.add(new THREE.AmbientLight(0xb4c4dd,.48));const sunlight=new THREE.PointLight(0xfff3de,2.9,0,0);scene.add(sunlight);const fill=new THREE.DirectionalLight(0x8cadd7,.18);fill.position.set(-70,100,90);scene.add(fill);stars=makeStars();scene.add(stars);
 orbitGroup=new THREE.Group();beltGroup=new THREE.Group();scene.add(orbitGroup,beltGroup);
 const manager=new THREE.LoadingManager();manager.onProgress=(url,loaded,total)=>{$('loading-status').textContent=`本地资源 ${loaded} / ${total}`;};textureLoader=new THREE.TextureLoader(manager);
 const textures={};await Promise.all([...new Set(bodies.map(b=>b.texture).concat(['earth_clouds']))].map(async name=>{textures[name]=await textureLoader.loadAsync(`textures/${name}.jpg`);textures[name].colorSpace=THREE.SRGBColorSpace;textures[name].anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}));
 const ringTex=await textureLoader.loadAsync('textures/saturn_ring_alpha.png');ringTex.colorSpace=THREE.SRGBColorSpace;
 for(const [i,body]of bodies.entries()){
  if(i){const p=physical[i-1];body.radius=Number(p.volume_equivalent_mean_radius_km);body.mass=Number(p.mass_10_24_kg||p['mass_10^24_kg']);body.density=Number(p.bulk_density_g_cm3);}
   const group=new THREE.Group(),root=new THREE.Group();group.add(root);scene.add(group);
   const marker=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute([0,0,0],3)),new THREE.PointsMaterial({color:body.color||'#dce6ee',size:4,sizeAttenuation:false,depthTest:false}));marker.visible=false;group.add(marker);
  const tilt=new THREE.Group();tilt.rotation.z=rad(body.tilt);root.add(tilt);
  const material=body.id==='sun'?new THREE.MeshBasicMaterial({map:textures[body.texture],color:0xffe3b5}):new THREE.MeshStandardMaterial({map:textures[body.texture],roughness:1,metalness:0});
  const sphere=new THREE.Mesh(new THREE.SphereGeometry(1,64,40),material);sphere.userData.pick=body.id;tilt.add(sphere);
  if(body.id==='earth'){
   const clouds=new THREE.Mesh(new THREE.SphereGeometry(1.009,64,32),new THREE.MeshStandardMaterial({map:textures.earth_clouds,transparent:true,opacity:.42,blending:THREE.AdditiveBlending,depthWrite:false}));tilt.add(clouds);
   // Subtle limb glow is a display effect, not a physical atmosphere model.
   const atm=new THREE.Mesh(new THREE.SphereGeometry(1.04,48,32),new THREE.ShaderMaterial({uniforms:{color:{value:new THREE.Color(0x5e9dbb)}},vertexShader:'varying vec3 n; varying vec3 v; void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',fragmentShader:'uniform vec3 color; varying vec3 n; varying vec3 v; void main(){float g=pow(1.-abs(dot(normalize(n),normalize(v))),3.);gl_FragColor=vec4(color,g*.4);}',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));root.add(atm);
  }
  if(body.id==='saturn'){
   const g=new THREE.RingGeometry(1.25,2.3,192);const pos=g.attributes.position,uv=g.attributes.uv;for(let n=0;n<pos.count;n++){const r=Math.hypot(pos.getX(n),pos.getY(n));uv.setXY(n,(r-1.25)/(2.3-1.25),.5);}
   const ring=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:ringTex,side:THREE.DoubleSide,transparent:true,opacity:.87,roughness:1,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.userData.pick=body.id;tilt.add(ring);
  }
  if(body.id==='sun'){const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:makeGlow(),color:0xffbc72,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));glow.scale.set(11,11,1);root.add(glow);}
  const el=document.createElement('button');el.className='body-label';el.dataset.body=body.id;el.setAttribute('aria-label',`查看${body.name}`);el.innerHTML=`${body.name}<span>${body.id==='sun'?'恒星':`${metricsNumber(body.a,2)} AU`}</span>`;el.addEventListener('click',()=>selectBody(body.id));labels.appendChild(el);
   objects.set(body.id,{body,group,root,marker,sphere,tilt,label:el,actual:[0,0,0],visualRadius:1,row:i?planetRows[i-1]:null});
 }
 selectionRing=new THREE.Mesh(new THREE.RingGeometry(1,1.013,96),new THREE.MeshBasicMaterial({color:0xe7b775,transparent:true,opacity:.45,side:THREE.DoubleSide,depthWrite:false}));selectionRing.visible=false;scene.add(selectionRing);
 $('planet-buttons').innerHTML=bodies.map((b,i)=>`<button class="planet-button" data-body="${b.id}" aria-pressed="false"><span class="mini-planet ${b.id}" style="background-image:url('textures/${b.texture}.jpg')"></span><span>${b.name}</span><span class="ordinal">${i?String(i).padStart(2,'0'):'中心恒星'}</span></button>`).join('');
 document.querySelectorAll('[data-body].planet-button').forEach(b=>b.addEventListener('click',()=>selectBody(b.dataset.body)));
 updatePositions();createBelts();rebuildOrbits();resize();renderContent();setPlaying(state.playing);
 new ResizeObserver(resize).observe(stage);
  let down=null;stage.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});stage.addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<6){const id=pick(e);if(id)selectBody(id);}down=null;});stage.addEventListener('pointermove',e=>{const id=pick(e);if(id!==hover){hover=id;stage.style.cursor=id?'pointer':'grab';}});
  stage.addEventListener('pointerleave',()=>{hover=null;stage.style.cursor='grab';});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();notice('图形上下文中断，请刷新网页重新载入。文章仍可阅读。');});
 $('loading').style.opacity='0';setTimeout(()=>$('loading').hidden=true,520);
 window.solarApp={selectBody,setMode,selectTopic,state,objects,scene,get camera(){return camera;},renderer,physics:{positionAt,mapPosition},get ready(){return objects.size===9;}};
 animate();
}

function animate(){requestAnimationFrame(animate);let dt=Math.min(clock.getDelta(),.06);if(document.hidden)dt=0;
 if(state.playing&&state.mode!=='sizes'){state.ms+=dt*state.speed*DAY_MS;if(state.ms>maxTime){state.ms=maxTime;setPlaying(false);notice('已到达模型演示日期上限：2049年12月31日。');}}
 const previousFocus=state.selected&&!fly?objects.get(state.selected).group.position.clone():null;
 updatePositions();
 if(previousFocus){const shift=objects.get(state.selected).group.position.clone().sub(previousFocus);camera.position.add(shift);controls.target.add(shift);}
 for(const obj of objects.values())obj.sphere.rotation.y+=dt*(obj.body.id==='sun'?.025:.08);
 // Tilting the positive spin axis beyond 90° already makes the rotation
 // retrograde in the external frame; do not reverse its local rotation too.
 if(fly){fly.t+=dt;const t=Math.min(1,fly.t/1.25),u=t*t*(3-2*t);camera.position.lerpVectors(fly.fromPos,fly.toPos,u);controls.target.lerpVectors(fly.fromTarget,fly.toTarget,u);if(t===1)fly=null;}
 controls.update();
 if(selectionRing.visible&&state.selected){selectionRing.position.copy(objects.get(state.selected).group.position);selectionRing.lookAt(camera.position);}
 renderer.render(scene,camera);updateLabels();renderCounter++;
 if(dateString()!==lastDate){$('date').value=dateString();lastDate=dateString();if(state.selected)renderMetrics();renderReference();}
 if(dateString().slice(0,7)!==lastOrbitMonth)rebuildOrbits();
}

document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab,{reveal:true,scroll:true})));
document.querySelector('.article-tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=[...document.querySelectorAll('[data-tab]')],i=tabs.indexOf(document.activeElement),next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;setTab(tabs[next].dataset.tab,{reveal:true});tabs[next].focus();});
$('reading-toggle').addEventListener('click',()=>setReadingExpanded(!state.readingExpanded,{scroll:!state.readingExpanded}));$('reading-collapse').addEventListener('click',()=>setReadingExpanded(false));
document.querySelectorAll('[data-topic]').forEach(b=>b.addEventListener('click',()=>selectTopic(b.dataset.topic)));
$('play').addEventListener('click',()=>setPlaying(!state.playing));$('speed').addEventListener('change',e=>state.speed=Number(e.target.value));
$('comparison-metric').addEventListener('change',e=>{state.comparisonMetric=e.target.value;state.preset=null;renderMetrics();syncExperiment();});
$('comparison-scale').addEventListener('change',e=>{state.comparisonScale=e.target.value;state.preset=null;syncExperiment();});
$('reset-experiment').addEventListener('click',resetExperiment);
$('hint-toggle').addEventListener('click',()=>{const hide=!$('observation-hint').hidden;$('observation-hint').hidden=hide;$('hint-toggle').setAttribute('aria-expanded',String(!hide));$('hint-toggle').textContent=hide?'观察提示':'收起提示';});
$('date').addEventListener('change',e=>{const ms=Date.parse(`${e.target.value}T00:00:00Z`);if(!Number.isFinite(ms)||ms<minTime||ms>maxTime){e.target.value=dateString();notice('请选择2000至2049年之间的日期。');return;}state.ms=ms;setPlaying(false);updatePositions();rebuildOrbits();if(state.selected)selectBody(state.selected);renderMetrics();});
$('orbits-toggle').addEventListener('change',e=>{state.orbits=e.target.checked;orbitGroup.visible=state.orbits&&state.mode!=='sizes';});$('belts-toggle').addEventListener('change',e=>{state.belts=e.target.checked;beltGroup.visible=state.belts&&state.mode!=='sizes';});
$('home-view').addEventListener('click',()=>homeView());$('top-view').addEventListener('click',()=>homeView(true));$('clear-selection').addEventListener('click',()=>homeView());
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{notice('当前浏览器容器未允许全屏。可在独立浏览器中打开。');}});
$('model-open').addEventListener('click',()=>showDialog('如何读这张地图',modelNotes));$('sources-open').addEventListener('click',()=>showDialog('资料与图注',sourceNotes));
document.querySelector('.dialog-close').addEventListener('click',()=>$('info-dialog').close());$('info-dialog').addEventListener('click',e=>{if(e.target===$('info-dialog')){const r=$('info-dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('info-dialog').close();}});
$('reading-open').addEventListener('click',async()=>{const n=current().reading||1;try{const response=await fetch(`reading/0${n}.html`);if(!response.ok)throw new Error(response.status);const html=await response.text();showDialog(n===1?'第01讲 · 完整文章':'第02讲 · 完整文章',`<article class="reading-text">${html}</article>`);}catch{notice('完整文章未载入，请运行 tools/prepare-reading.py 生成本地阅读页。');}});
document.addEventListener('keydown',e=>{if($('solar-reading').contains(e.target))return;if(e.key==='Escape'&&!$('info-dialog').open&&objects.size)homeView();if(e.code==='Space'&&!e.repeat&&!e.target.isContentEditable&&!e.target.closest('input,select,button,textarea,summary,a[href],[role="button"],[role="textbox"],[role="slider"]')&&!$('info-dialog').open){e.preventDefault();if(state.mode!=='sizes')setPlaying(!state.playing);}});

const sceneControls=[...document.querySelectorAll('[data-mode],[data-topic]'),...['play','speed','date','orbits-toggle','belts-toggle','home-view','top-view','clear-selection','reset-experiment','comparison-metric','comparison-scale'].map($)];
sceneControls.forEach(el=>el.disabled=true);
init().then(()=>sceneControls.forEach(el=>el.disabled=false)).catch(error=>{console.error(error);$('loading').querySelector('p').textContent='沙盘暂时无法载入';$('loading-status').textContent='请从本地HTTP地址打开，并确认浏览器支持WebGL 2。文章按钮仍可使用。';$('loading').style.pointerEvents='none';notice(`载入问题：${error.message}`);});
