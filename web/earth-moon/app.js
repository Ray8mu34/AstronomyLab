import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import * as P from './physics.mjs';
import {lessons} from './content.js';
const $=id=>document.getElementById(id);
const state={mode:'phase',days:P.SYNODIC/8,inclination:P.C.inclination,node:0,distance:384400,spin:'sync',libration:false,east:0,north:0,red:false,playing:false,speed:2,trueScale:false,observe:'moon',ready:false,guidePreset:null};
const guides={
 phase:{name:'月相实验',question:'月亮为什么会改变形状？',operation:'点一种月相，或拖动空间图中的月球；底部可播放。',observe:'对照太阳照亮的一半与地球所见的月面。',buttons:[['phase:0','新月'],['phase:90','上弦'],['phase:180','满月'],['phase:270','下弦']]},
 spin:{name:'自转实验',question:'总以同一面朝向地球，是否等于没有自转？',operation:'选自转方式，再跳到公转半圈，重复比较。',observe:'金点固定在月面；看它是否仍然朝向地球。',buttons:[['spin:sync','同步自转'],['spin:fixed','完全不自转'],['day:0','公转起点'],['day:half','公转半圈'],['day:orbit','公转一圈']]},
 period:{name:'两种周期实验',question:'绕地球一圈，为什么还没有恢复同样月相？',operation:'从新月起点，分别走到27.32天和29.53天。',observe:'对照日心小图、月相与两条周期进度。',buttons:[['day:0','新月起点'],['day:sidereal','恒星月 · 27.32天'],['day:synodic','朔望月 · 29.53天']]},
 eclipse:{name:'日月食实验',question:'新月与满月，为什么不总发生食？',operation:'选一种食，拖动底部局部时间；参数可展开。',observe:'对照指定点圆面与影锥，改变距离或对齐条件。',buttons:[['eclipse:total','日全食'],['eclipse:annular','日环食'],['eclipse:partial','日偏食'],['eclipse:miss','新月却无食'],['eclipse:lunar','月全食']]}
};
const vec=a=>new THREE.Vector3(...a),zAxis=new THREE.Vector3(0,0,1),origin=new THREE.Vector3();
const space=$('space'),moonArea=$('moon-render'),solarCanvas=$('solar-disc'),ctx=solarCanvas.getContext('2d');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x080d15,0);space.appendChild(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.03,900);camera.up.copy(zAxis);camera.position.set(10,-13,13);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=3;controls.maxDistance=180;controls.target.set(0,0,0);controls.update();
const viewer=new THREE.WebGLRenderer({antialias:true,alpha:true});viewer.setPixelRatio(Math.min(devicePixelRatio,2));viewer.setClearColor(0x080d15,0);moonArea.appendChild(viewer.domElement);
const observerScene=new THREE.Scene(),observerCamera=new THREE.OrthographicCamera(-1.65,1.65,1.35,-1.35,.01,20);observerCamera.up.copy(zAxis);
const textureLoader=new THREE.TextureLoader();
const vertex=`varying vec3 vNormal;varying vec2 vUv;void main(){vUv=uv;vNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const fragment=`precision highp float;
uniform sampler2D surface;uniform vec3 centre;uniform vec3 source;uniform vec3 occultor;uniform float physicalRadius;uniform float occultorRadius;uniform float eclipses;uniform float red;varying vec3 vNormal;varying vec2 vUv;
float overlap(float R,float r,float d){if(d>=R+r)return 0.0;if(d<=abs(R-r))return min(1.0,r*r/(R*R));float a=acos(clamp((d*d+R*R-r*r)/(2.0*d*R),-1.0,1.0));float b=acos(clamp((d*d+r*r-R*R)/(2.0*d*r),-1.0,1.0));float q=max(0.0,(-d+R+r)*(d+R-r)*(d-R+r)*(d+R+r));return clamp((R*R*a+r*r*b-0.5*sqrt(q))/(3.14159265359*R*R),0.0,1.0);}
void main(){vec3 n=normalize(vNormal);vec3 p=centre+n*physicalRadius;vec3 s=source-p;vec3 o=occultor-p;float diff=max(dot(n,normalize(s)),0.0);float shade=0.0;
if(eclipses>0.5 && length(o)>occultorRadius && length(o)<length(s) && dot(s,o)>0.0){float R=asin(695700.0/length(s));float r=asin(occultorRadius/length(o));float d=atan(length(cross(normalize(s),normalize(o))),dot(normalize(s),normalize(o)));shade=overlap(R,r,d);}
vec3 albedo=texture2D(surface,vUv).rgb;vec3 color=albedo*(0.009+diff*(1.0-shade)*1.12)+albedo*vec3(0.10,0.016,0.004)*shade*red;gl_FragColor=vec4(color,1.0);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
function material(texture,radius,occluderRadius){return new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:{surface:{value:texture},centre:{value:new THREE.Vector3()},source:{value:new THREE.Vector3(P.C.au,0,0)},occultor:{value:new THREE.Vector3()},physicalRadius:{value:radius},occultorRadius:{value:occluderRadius},eclipses:{value:0},red:{value:0}}});}
let earth,moon,observedMoon,marker,observerMarker,siteMarker,orbitLine,nodeLine,plane,solarGroup,earthMaterial,moonMaterial,observerMaterial;
const lineMat=new THREE.LineBasicMaterial({color:0x649997,transparent:true,opacity:.7});
function line(points,mat){return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),mat);}
function seededStars(){let seed=4351;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};const positions=[],colors=[];for(let j=0;j<850;j++){const u=random()*2-1,a=random()*P.TAU,r=200;positions.push(r*Math.sqrt(1-u*u)*Math.cos(a),r*Math.sqrt(1-u*u)*Math.sin(a),r*u);const c=.22+random()*.4;colors.push(c,c*.98,c*.96);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));scene.add(new THREE.Points(g,new THREE.PointsMaterial({size:.32,sizeAttenuation:true,vertexColors:true,transparent:true,opacity:.65})));}
seededStars();
function orientation(o){const rotation=state.spin==='fixed'?-o.node:o.M;return new THREE.Quaternion().setFromAxisAngle(zAxis,o.node).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),o.i)).multiply(new THREE.Quaternion().setFromAxisAngle(zAxis,rotation+Math.PI)).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI/2));}
function buildOrbit(){
 if(orbitLine){scene.remove(orbitLine);orbitLine.geometry.dispose();scene.remove(nodeLine);nodeLine.geometry.dispose();nodeLine.material.dispose();scene.remove(plane);plane.geometry.dispose();plane.material.dispose();}
 const radius=state.trueScale?state.distance/P.C.earthRadius:6*state.distance/384400;
 const pts=[];for(let j=0;j<=256;j++){const a=j/256*P.TAU;const e=state.libration?P.C.eccentricity:0,r=radius*(1-e*e)/(1+e*Math.cos(a));pts.push(vec(P.rotateZ(P.rotateX([r*Math.cos(a),r*Math.sin(a),0],state.inclination*P.RAD),state.node*P.RAD)));}
 orbitLine=line(pts,lineMat);scene.add(orbitLine);
 nodeLine=line([vec(P.rotateZ([-radius*1.15,0,0],state.node*P.RAD)),vec(P.rotateZ([radius*1.15,0,0],state.node*P.RAD))],new THREE.LineDashedMaterial({color:0x7290bc,dashSize:radius*.045,gapSize:radius*.035,transparent:true,opacity:.6}));nodeLine.computeLineDistances();scene.add(nodeLine);
 nodeLine.visible=state.inclination>1e-7;
 const positions=[0,0,0];for(let j=0;j<=128;j++){const a=j/128*P.TAU;positions.push(radius*Math.cos(a),radius*Math.sin(a),0);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));const indices=[];for(let j=1;j<=128;j++)indices.push(0,j,j+1);g.setIndex(indices);
 plane=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0x3d7990,transparent:true,opacity:.055,side:THREE.DoubleSide,depthWrite:false}));scene.add(plane);
}
function home(top=false){controls.target.set(0,0,0);const s=state.trueScale?10:1;camera.position.set(top?.0001:10*s,top?.0001:-13*s,top?23*s:13*s);controls.update();camera.updateMatrixWorld(true);}
function makeSolarGroup(){solarGroup=new THREE.Group();const sun=new THREE.Mesh(new THREE.SphereGeometry(.65,48,24),new THREE.MeshBasicMaterial({color:0xf9cc6e}));sun.position.set(9.5,0,0);solarGroup.add(sun);const glowCanvas=document.createElement('canvas');glowCanvas.width=128;glowCanvas.height=128;const c=glowCanvas.getContext('2d'),gradient=c.createRadialGradient(64,64,8,64,64,64);gradient.addColorStop(0,'rgba(255,205,107,.7)');gradient.addColorStop(.25,'rgba(255,174,54,.3)');gradient.addColorStop(1,'rgba(255,164,45,0)');c.fillStyle=gradient;c.fillRect(0,0,128,128);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(glowCanvas),transparent:true,depthWrite:false}));sprite.position.copy(sun.position);sprite.scale.set(2.8,2.8,1);solarGroup.add(sprite);
 for(const y of [-3.8,-1.7,1.7,3.8]){const arrow=new THREE.ArrowHelper(new THREE.Vector3(-1,0,0),new THREE.Vector3(8,y,.01),3.1,0x9d8050,.38,.16);solarGroup.add(arrow);}scene.add(solarGroup);}
async function init(){try{
 const [earthTexture,moonTexture]=await Promise.all(['textures/earth_daymap.jpg','textures/moon.jpg'].map(url=>textureLoader.loadAsync(url)));
 for(const t of [earthTexture,moonTexture]){t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}
 earthMaterial=material(earthTexture,P.C.earthRadius,P.C.moonRadius);moonMaterial=material(moonTexture,P.C.moonRadius,P.C.earthRadius);observerMaterial=material(moonTexture,P.C.moonRadius,P.C.earthRadius);
 earth=new THREE.Mesh(new THREE.SphereGeometry(1,96,64),earthMaterial);earth.rotation.x=Math.PI/2;scene.add(earth);
 moon=new THREE.Mesh(new THREE.SphereGeometry(1,96,64),moonMaterial);scene.add(moon);
 const markerMat=new THREE.MeshBasicMaterial({color:0xf8d590});marker=new THREE.Mesh(new THREE.SphereGeometry(.05,16,12),markerMat);marker.position.set(1.025,0,0);moon.add(marker);
 observedMoon=new THREE.Mesh(new THREE.SphereGeometry(1,128,96),observerMaterial);observerScene.add(observedMoon);observerMarker=new THREE.Mesh(new THREE.SphereGeometry(.026,16,12),markerMat);observerMarker.position.set(1.015,0,0);observedMoon.add(observerMarker);
 siteMarker=new THREE.Mesh(new THREE.SphereGeometry(.055,16,12),new THREE.MeshBasicMaterial({color:0xf4c67c}));scene.add(siteMarker);
 makeSolarGroup();buildOrbit();state.ready=true;$('loading').hidden=true;resize();refresh();
}catch(error){$('loading').textContent='WebGL或本地贴图载入失败。请通过本机HTTP服务打开，查看浏览器错误。';console.error(error);}}
function label(id,position,dy=0){
 const p=position.clone().project(camera),w=space.clientWidth,h=space.clientHeight,el=$(id);
 let x=(p.x+1)*w/2,y=(1-p.y)*h/2+dy;
 if(state.mode==='period'&&id==='sun-label'){
  const edge=el.offsetWidth/2+2;x=P.clamp(x,edge,w-edge);
  const moonLabel=$('moon-label'),moonX=parseFloat(moonLabel.style.left),moonY=parseFloat(moonLabel.style.top);
  if(Math.abs(x-moonX)<(el.offsetWidth+moonLabel.offsetWidth)/2+6&&Math.abs(y-moonY)<20)y=moonY-21;
 }
 el.style.left=`${x}px`;el.style.top=`${y}px`;el.hidden=p.z>1||Math.abs(p.x)>1.05||Math.abs(p.y)>1.05;
}
function refresh(){
 if(!state.ready)return;const o=P.orbit(state.days,state),obs=P.observerPosition(o,state.east,state.north),solar=P.solarObservation(o,obs),lunar=P.lunarObservation(o);
 const displayScale=state.trueScale?1/P.C.earthRadius:6/384400;moon.position.copy(vec(P.scale(o.moon,displayScale)));moon.scale.setScalar(state.trueScale?P.C.moonRadius/P.C.earthRadius:.57);
 const q=orientation(o);moon.quaternion.copy(q);observedMoon.quaternion.copy(q);observerCamera.position.copy(vec(P.unit(P.scale(o.moon,-1))).multiplyScalar(4));observerCamera.lookAt(origin);
 solarGroup.rotation.z=o.solarLongitude;solarGroup.scale.setScalar(state.trueScale?7:1);
 siteMarker.position.copy(vec(P.scale(obs,1/P.C.earthRadius))).multiplyScalar(1.01);siteMarker.visible=state.mode==='eclipse';
 for(const [mat,centre,occ] of [[earthMaterial,[0,0,0],o.moon],[moonMaterial,o.moon,[0,0,0]],[observerMaterial,o.moon,[0,0,0]]]){mat.uniforms.centre.value.copy(vec(centre));mat.uniforms.source.value.copy(vec(o.sun));mat.uniforms.occultor.value.copy(vec(occ));mat.uniforms.eclipses.value=state.mode==='eclipse'?1:0;mat.uniforms.red.value=state.red&&mat!==earthMaterial?1:0;}
 $('day').value=state.days;$('day-value').textContent=state.days.toFixed(3);for(const output of document.querySelectorAll('[data-current-day]'))output.textContent=state.days.toFixed(3);
 for(const button of $('guide-actions').querySelectorAll('[data-guide-action]')){const action=button.dataset.guideAction,[type,value]=action.split(':'),dayTargets={0:0,half:P.C.sidereal/2,orbit:P.C.sidereal,sidereal:P.C.sidereal,synodic:P.SYNODIC},active=type==='spin'?value===state.spin:type==='phase'?Math.abs(state.days-Number(value)/360*P.SYNODIC)<.001:type==='day'?Math.abs(state.days-dayTargets[value])<.001:type==='eclipse'?state.guidePreset===value:false;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));}
 for(const button of document.querySelectorAll('[data-preset]')){const active=button.dataset.preset===state.guidePreset;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));}
 for(const key of ['inclination','node','distance','east','north'])$(key).value=state[key];
 $('inclination-value').textContent=`${state.inclination.toFixed(3)}°`;$('node-value').textContent=`${state.node.toFixed(1)}°`;$('distance-value').textContent=`${(state.distance/10000).toFixed(2)}万 km`;$('east-value').textContent=`${state.east.toFixed(1)}°`;$('north-value').textContent=`${state.north.toFixed(1)}°`;
 $('libration').checked=state.libration;$('red').checked=state.red;$('scale').classList.toggle('active',state.trueScale);$('scale').setAttribute('aria-pressed',String(state.trueScale));$('scale').textContent=state.trueScale?'展示比例':'真实比例';
 $('scene-caption').textContent=state.trueScale?'地球、月球、地月距离同一比例 · 太阳只示方向':'地月距离约压缩10倍，月球另放大约2倍 · 金球只示太阳方向';
 $('plane-note').textContent=state.inclination>1e-7?'淡蓝面：黄道 · 虚线：交点线':'倾角0°：月轨面与黄道面重合';
 $('moon-render').hidden=state.mode==='eclipse'&&state.observe==='sun';solarCanvas.hidden=!(state.mode==='eclipse'&&state.observe==='sun');$('north-label').hidden=state.mode==='eclipse'&&state.observe==='sun';
 marker.visible=state.mode==='spin';observerMarker.visible=state.mode==='spin';
 $('observer-title').textContent=state.mode==='eclipse'&&state.observe==='sun'?'指定地面点的太阳圆面':'地心方向所见';
 $('observe-toggle').textContent=state.observe==='sun'?'看月面':'看太阳';$('observe-toggle').hidden=state.mode!=='eclipse';$('red-control').hidden=!(state.mode==='eclipse'&&state.observe==='moon');$('observer-settings').hidden=!(state.mode==='eclipse'&&state.observe==='sun');
 let labels=['几何受光比例','相位角 α','地月距离'],values=[`${(o.k*100).toFixed(1)}%`,`${(o.phaseAngle/P.RAD).toFixed(1)}°`,`${(o.r/10000).toFixed(2)}万 km`];
 $('phase-name').textContent=P.phaseName(o.progress);$('observer-note').textContent='固定黄道北向上 · 月面按视场放大';
 if(state.mode==='spin'){labels=['标记偏离地心方向','经度天平动','公转 / 自转'];values=[`${(o.markerAngle/P.RAD).toFixed(1)}°`,`${o.longitudeLibration.toFixed(2)}°`,state.spin==='sync'?'1 : 1':'1 : 0'];}
 if(state.mode==='period'){labels=['恒星方向转过','太阳方向移动','几何受光比例'];values=[`${(state.days/P.C.sidereal*360).toFixed(1)}°`,`${(o.solarLongitude/P.RAD).toFixed(1)}°`,`${(o.k*100).toFixed(1)}%`];}
 if(state.mode==='eclipse'){
  if(state.observe==='sun'){labels=['太阳视直径','月球视直径','太阳遮挡率'];values=[`${(solar.sunRadius*2/P.RAD).toFixed(3)}°`,`${(solar.moonRadius*2/P.RAD).toFixed(3)}°`,`${(solar.covered*100).toFixed(1)}%`];$('phase-name').textContent=solar.kind;$('observer-note').textContent='圆面共用角尺度 · 均匀光源近似';drawSolar(solar);}
  else {labels=['影轴偏离月心','本影截面半径','月心直射光'];values=[`${Math.round(lunar.rho)} km`,lunar.x>0?`${Math.round(lunar.umbra)} km`:'不在背光侧',`${(P.sunlightAt(o.moon,o)*100).toFixed(1)}%`];$('phase-name').textContent=lunar.kind;$('observer-note').textContent=state.red?'红光为定性示意 · 非亮度预测':'不含大气折射 · 月面按视场放大';}
  const epoch=eclipseEpoch(),hours=(state.days-epoch)*24;$('eclipse-time').value=P.clamp(hours,-6,6);$('eclipse-time-value').textContent=Math.abs(hours)<=6?`${hours>=0?'+':''}${hours.toFixed(2)}小时`:'已离开±6小时局部时窗';
  drawShadow(o,obs);
 }
 for(let j=0;j<3;j++){$(`metric-label${j+1}`).textContent=labels[j];$(`metric${j+1}`).textContent=values[j];}
 $('star-progress').style.width=`${Math.min(100,state.days/P.C.sidereal*100)}%`;$('sun-progress').style.width=`${Math.min(100,state.days/P.SYNODIC*100)}%`;$('star-turns').textContent=`${(state.days/P.C.sidereal).toFixed(3)}圈`;$('sun-turns').textContent=`${(state.days/P.SYNODIC).toFixed(3)}圈`;
 drawAnnual(o);window.earthMoon.snapshot={orbit:o,observer:obs,solar,lunar};
}
function drawAnnual(o){const c=$('year-orbit').getContext('2d');c.clearRect(0,0,190,135);c.strokeStyle='#416379';c.lineWidth=1;c.beginPath();c.arc(96,66,42,0,P.TAU);c.stroke();c.fillStyle='#e7bc70';c.beginPath();c.arc(96,66,5,0,P.TAU);c.fill();const a=o.solarLongitude+Math.PI,x=96+42*Math.cos(a),y=66-42*Math.sin(a);c.fillStyle='#9ed6e6';c.beginPath();c.arc(x,y,4,0,P.TAU);c.fill();c.strokeStyle='#d4ba7b';c.beginPath();c.moveTo(x,y);c.lineTo(96,66);c.stroke();c.setLineDash([3,4]);c.strokeStyle='#446675';c.beginPath();c.moveTo(54,66);c.lineTo(96,66);c.stroke();c.setLineDash([]);$('annual-angle').textContent=`地球前进 ${(o.solarLongitude/P.RAD).toFixed(1)}°`;$('annual-inset').hidden=state.mode!=='period';}
function drawSolar(s){
 const dpr=Math.min(devicePixelRatio,2),w=solarCanvas.clientWidth,h=solarCanvas.clientHeight;if(solarCanvas.width!==Math.round(w*dpr)||solarCanvas.height!==Math.round(h*dpr)){solarCanvas.width=Math.round(w*dpr);solarCanvas.height=Math.round(h*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 const r=Math.min(h*.31,w*.23),factor=r/s.sunRadius,cx=w/2,cy=h*.45;
 const g=ctx.createRadialGradient(cx-r*.15,cy-r*.15,0,cx,cy,r);g.addColorStop(0,'#ffebb6');g.addColorStop(1,'#edbd6a');ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,r,0,P.TAU);ctx.fill();
 if(s.horizon<=0){ctx.fillStyle='#080d15e8';ctx.fillRect(0,0,w,h);ctx.fillStyle='#93a5b8';ctx.font='12px Microsoft YaHei';ctx.textAlign='center';ctx.fillText('太阳位于几何地平线下',cx,cy);return;}
 // East is displayed left when looking along the Sun direction, north stays up.
 const mx=cx-s.x*factor,my=cy-s.y*factor,mr=s.moonRadius*factor;
 if(Math.abs(mx-cx)<w/2+mr&&Math.abs(my-cy)<h/2+mr){ctx.fillStyle='#070b12';ctx.beginPath();ctx.arc(mx,my,mr,0,P.TAU);ctx.fill();ctx.strokeStyle='#5b697d66';ctx.lineWidth=.8;ctx.stroke();}else{ctx.fillStyle='#a7b7c9';ctx.font='10px Microsoft YaHei';ctx.textAlign='center';ctx.fillText(`月球圆面在视场外，角距 ${(s.separation/P.RAD).toFixed(2)}°`,cx,h*.82);}
 ctx.strokeStyle='#5f7186';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx-r,cy+r+19);ctx.lineTo(cx+r,cy+r+19);ctx.stroke();ctx.fillStyle='#93a5b8';ctx.font='9px Microsoft YaHei';ctx.textAlign='center';ctx.fillText(`${(s.sunRadius*2/P.RAD).toFixed(3)}°`,cx,cy+r+32);
}
function drawShadow(o,observer){
 const type=state.observe==='sun'?'solar':'lunar',s=P.shadowSection(o,type);
 if(s.x<=0){$('shadow-svg').innerHTML='<text x="500" y="100" text-anchor="middle" fill="#93a5b8" font-size="15">目标在遮挡体的向阳侧，不在背光影锥中。</text>';$('shadow-info').textContent='切换太阳/月面视角，或回到相应的新月/满月附近。';return;}
 const maxX=Math.max(200000,s.x+2*s.Rtarget),includeApex=s.apex<maxX*1.35,xEnd=includeApex?Math.max(maxX,s.apex*1.06):maxX;
 const extent=Math.max(10000,s.rho+1.5*s.Rtarget,P.shadow(P.C.sunRadius,s.Rblock,s.d,xEnd).penumbra*1.15),x=t=>75+t/xEnd*830,y=t=>95-t/extent*72;
 const a=P.shadow(P.C.sunRadius,s.Rblock,s.d,0),b=P.shadow(P.C.sunRadius,s.Rblock,s.d,xEnd),cap=Math.min(xEnd,s.apex),uc=P.shadow(P.C.sunRadius,s.Rblock,s.d,cap),path=points=>points.map((p,i)=>`${i?'L':'M'}${x(p[0]).toFixed(2)},${y(p[1]).toFixed(2)}`).join(' ')+' Z';
 let html=`<defs><linearGradient id="pen-grad"><stop stop-color="#cfb775" stop-opacity=".08"/><stop offset="1" stop-color="#cfb775" stop-opacity=".21"/></linearGradient></defs><path d="${path([[0,a.penumbra],[xEnd,b.penumbra],[xEnd,-b.penumbra],[0,-a.penumbra]])}" fill="url(#pen-grad)"/><path d="${path([[0,a.umbra],[cap,uc.umbra],[cap,-uc.umbra],[0,-a.umbra]])}" fill="#748bb6" fill-opacity=".25"/>`;
 if(s.apex<xEnd)html+=`<path d="${path([[s.apex,0],[xEnd,-b.umbra],[xEnd,b.umbra]])}" fill="#71c8c7" fill-opacity=".19"/>`;
 const boundaries=[[a.penumbra,b.penumbra,'#c9b97a'],[-a.penumbra,-b.penumbra,'#c9b97a'],[a.umbra,b.umbra,'#7393b9'],[-a.umbra,-b.umbra,'#7393b9']];for(const [y1,y2,color]of boundaries)html+=`<path d="M ${x(0)},${y(y1)} L ${x(xEnd)},${y(y2)}" stroke="${color}" stroke-opacity=".65" stroke-width=".8"/>`;
 html+=`<path d="M 25,95 H 950" stroke="#6d8196" stroke-opacity=".35" stroke-dasharray="3 5"/><text x="22" y="185" fill="#ebc77e" font-size="10">太阳在左侧画外 →</text>`;
 html+=`<ellipse cx="${x(0)}" cy="${y(0)}" rx="${Math.max(2,s.Rblock/xEnd*830)}" ry="${s.Rblock/extent*72}" fill="${type==='solar'?'#b7bdc7':'#548eb1'}"/><ellipse cx="${x(s.x)}" cy="${y(s.rho)}" rx="${Math.max(2,s.Rtarget/xEnd*830)}" ry="${s.Rtarget/extent*72}" fill="${type==='solar'?'#548eb1':'#b7bdc7'}" stroke="#b3c9dc" stroke-opacity=".6"/>`;
 html+=`<text x="${x(0)}" y="${Math.min(171,y(-s.Rblock)-0+17)}" text-anchor="middle" fill="#d5dfea" font-size="11">${type==='solar'?'月球':'地球'}</text><text x="${x(s.x)}" y="${Math.max(15,y(s.rho+s.Rtarget)-12)}" text-anchor="middle" fill="#d5dfea" font-size="11">${type==='solar'?'地球':'月球'}</text>`;
 if(s.apex<xEnd){html+=`<circle cx="${x(s.apex)}" cy="95" r="2" fill="#ebc77e"/><text x="${x(s.apex)}" y="135" text-anchor="middle" fill="#a7b7c9" font-size="9">本影顶点</text>`;}
 if(type==='solar'){const v=P.sub(observer,s.blocker),siteX=P.dot(v,s.axis),sitePerp=P.sub(v,P.scale(s.axis,siteX)),side=s.rho>1e-5?P.unit(s.perp):P.length(sitePerp)>1e-5?P.unit(sitePerp):[0,0,1],siteY=P.dot(v,side),offPlane=P.length(P.sub(sitePerp,P.scale(side,siteY)));html+=`<circle id="section-observer" data-radial-km="${siteY}" data-off-plane-km="${offPlane}" cx="${x(siteX)}" cy="${y(siteY)}" r="3.2" fill="#ebc77e"/><text x="${x(siteX)+8}" y="${y(siteY)+4}" fill="#ebc77e" font-size="9">观测点${offPlane>.01?'投影':''}</text>`;}
 $('shadow-svg').innerHTML=html;$('shadow-info').textContent=`本影顶点距${type==='solar'?'月':'地'}心 ${(s.apex/10000).toFixed(1)}万 km${s.apex>xEnd?'（画外）':''} · 目标偏离影轴 ${Math.round(s.rho)} km`;
}
function mode(mode){pause();state.mode=mode;state.guidePreset=mode==='eclipse'?'total':null;Object.assign(state,{inclination:P.C.inclination,node:0,distance:384400,spin:'sync',libration:false,east:0,north:0,red:false});
 if(mode==='phase')state.days=P.SYNODIC/8;if(mode==='spin'){state.days=P.SYNODIC/2;state.inclination=0;}if(mode==='period'){state.days=0;state.inclination=0;}if(mode==='eclipse'){Object.assign(state,{days:0,inclination:0,distance:360000,observe:'sun'});}
 state.speed=mode==='eclipse'?.01:2;syncPlayback();
 for(const b of document.querySelectorAll('[data-mode]')){const active=b.dataset.mode===mode;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));}
  const guide=guides[mode];$('guide-mode').textContent=guide.name;$('guide-question').textContent=guide.question;$('guide-operation').textContent=guide.operation;$('guide-observe').textContent=guide.observe;$('guide-actions').innerHTML=guide.buttons.map(([action,label])=>{const [type,value]=action.split(':'),attribute={phase:'data-phase',spin:'data-spin',eclipse:'data-preset'}[type],id=type==='day'?({0:'epoch',sidereal:'sidereal',synodic:'synodic'}[value]):null;return `<button data-guide-action="${action}"${attribute?` ${attribute}="${value}"`:''}${id?` id="${id}"`:''} aria-pressed="false">${label.replace(/(\d+(?:\.\d+)?)\s*天/g,'<span class="quantity">$&</span>')}</button>`;}).join('');
 for(const name of ['phase','spin','period','eclipse'])$(`${name}-controls`).hidden=mode!==name;
 $('phase-controls').hidden=true;$('shadow-panel').hidden=mode!=='eclipse';$('geometry-settings').hidden=mode==='period';$('geometry-settings').open=false;$('node-label').hidden=mode!=='eclipse';$('distance-label').hidden=mode==='spin'||mode==='period';$('observer-settings').hidden=mode!=='eclipse';$('libration-note').hidden=mode!=='spin';$('inclination').disabled=mode==='period';$('local-time').hidden=mode!=='eclipse';$('day').hidden=mode==='eclipse';document.body.dataset.experimentMode=mode;
 const l=lessons[mode];$('explanation').innerHTML=`<p class="eyebrow">${{phase:'光照 / 视角',spin:'参照系 / 同步',period:'角速度 / 相对周期',eclipse:'角尺度 / 遮挡'}[mode]}</p><h2>${l.title}</h2>${l.paragraphs.map(p=>`<p>${p}</p>`).join('')}<p class="equation">${l.equation}</p><p class="experiment-tip">${l.tip}</p><button id="context-read">继续读：对应正文 →</button>`;$('observation-text').textContent=l.observation;
 for(const b of document.querySelectorAll('[data-spin]'))b.classList.toggle('active',b.dataset.spin===state.spin);buildOrbit();refresh();
}
function syncPlayback(){for(const button of [$('play'),...document.querySelectorAll('[data-play-toggle]')]){button.textContent=state.playing?'Ⅱ 暂停':'▶ 播放';button.setAttribute('aria-label',state.playing?'暂停轨道':'播放轨道');button.setAttribute('aria-pressed',String(state.playing));}$('speed').value=state.speed;for(const select of document.querySelectorAll('[data-play-speed]'))select.value=state.speed;}
function pause(){state.playing=false;syncPlayback();}
function togglePlay(){state.playing=!state.playing;syncPlayback();}
function setDays(days){pause();state.guidePreset=null;state.days=P.clamp(days,-1,60);refresh();}
function eclipseEpoch(){const shift=state.observe==='sun'?0:P.SYNODIC/2;return Math.round((state.days-shift)/P.SYNODIC)*P.SYNODIC+shift;}
function preset(name){pause();state.guidePreset=name;Object.assign(state,{inclination:0,node:0,libration:false,east:0,north:0,red:false,days:0,observe:'sun',distance:360000});
 if(name==='annular')state.distance=405000;if(name==='partial')state.east=25;if(name==='miss'){state.inclination=P.C.inclination;state.node=90;}if(name==='lunar'){state.days=P.SYNODIC/2;state.distance=384400;state.observe='moon';}buildOrbit();refresh();
}
for(const b of document.querySelectorAll('[data-mode]'))b.onclick=()=>mode(b.dataset.mode);
for(const b of document.querySelectorAll('[data-phase]'))b.onclick=()=>setDays(Number(b.dataset.phase)/360*P.SYNODIC);
for(const b of document.querySelectorAll('[data-spin]'))b.onclick=()=>{state.spin=b.dataset.spin;for(const other of document.querySelectorAll('[data-spin]'))other.classList.toggle('active',other===b);refresh();};
for(const b of document.querySelectorAll('[data-preset]'))b.onclick=()=>preset(b.dataset.preset);
$('guide-actions').onclick=e=>{const button=e.target.closest('[data-guide-action]');if(!button)return;const [action,value]=button.dataset.guideAction.split(':');if(action==='phase')setDays(Number(value)/360*P.SYNODIC);if(action==='spin'){pause();state.spin=value;for(const other of document.querySelectorAll('[data-spin]'))other.classList.toggle('active',other.dataset.spin===value);refresh();}if(action==='day')setDays({0:0,half:P.C.sidereal/2,orbit:P.C.sidereal,sidereal:P.C.sidereal,synodic:P.SYNODIC}[value]);if(action==='eclipse')preset(value);};
for(const name of ['inclination','node','distance','east','north'])$(name).oninput=e=>{pause();state.guidePreset=null;state[name]=Number(e.target.value);if(['inclination','node','distance'].includes(name))buildOrbit();refresh();};
$('day').oninput=e=>setDays(Number(e.target.value));$('play').onclick=togglePlay;for(const button of document.querySelectorAll('[data-play-toggle]'))button.onclick=togglePlay;for(const select of [$('speed'),...document.querySelectorAll('[data-play-speed]')])select.onchange=e=>{state.speed=Number(e.target.value);syncPlayback();};
$('eclipse-time').oninput=e=>setDays(eclipseEpoch()+Number(e.target.value)/24);
$('libration').onchange=e=>{pause();state.libration=e.target.checked;buildOrbit();refresh();};$('red').onchange=e=>{state.red=e.target.checked;refresh();};

$('observe-toggle').onclick=()=>{state.observe=state.observe==='sun'?'moon':'sun';refresh();};
$('top').onclick=()=>home(true);$('oblique').onclick=()=>home(false);$('reset').onclick=()=>{state.trueScale=false;mode(state.mode);home(false);};$('scale').onclick=()=>{state.trueScale=!state.trueScale;buildOrbit();home(false);refresh();};
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let dragging=false,dragPlane;
renderer.domElement.addEventListener('pointerdown',e=>{if(!state.ready)return;const box=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-box.left)/box.width*2-1,-(e.clientY-box.top)/box.height*2+1);raycaster.setFromCamera(pointer,camera);const projected=moon.position.clone().project(camera),px=(projected.x+1)*box.width/2,py=(1-projected.y)*box.height/2,nearMarker=Math.hypot(e.clientX-box.left-px,e.clientY-box.top-py)<20&&projected.z<1;if(raycaster.intersectObject(moon,false).length||nearMarker){pause();dragging=true;controls.enabled=false;renderer.domElement.setPointerCapture(e.pointerId);const normal=vec(P.rotateZ(P.rotateX([0,0,1],state.inclination*P.RAD),state.node*P.RAD));dragPlane=new THREE.Plane().setFromNormalAndCoplanarPoint(normal,origin);}});
renderer.domElement.addEventListener('pointermove',e=>{if(!dragging)return;const box=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-box.left)/box.width*2-1,-(e.clientY-box.top)/box.height*2+1);raycaster.setFromCamera(pointer,camera);const p=raycaster.ray.intersectPlane(dragPlane,new THREE.Vector3());if(!p||p.length()<.1)return;const local=P.rotateX(P.rotateZ(p.toArray(),-state.node*P.RAD),-state.inclination*P.RAD),f=Math.atan2(local[1],local[0]),e0=state.libration?P.C.eccentricity:0,E=2*Math.atan2(Math.sqrt(1-e0)*Math.sin(f/2),Math.sqrt(1+e0)*Math.cos(f/2)),M=E-e0*Math.sin(E)+state.node*P.RAD;
 const t=P.wrap(M)/P.TAU*P.C.sidereal,cycle=Math.round((state.days-t)/P.C.sidereal);state.guidePreset=null;state.days=P.clamp(t+cycle*P.C.sidereal,-1,60);refresh();});
function endDrag(){dragging=false;controls.enabled=true;}renderer.domElement.addEventListener('pointerup',endDrag);renderer.domElement.addEventListener('pointercancel',endDrag);
async function reading(number,anchor=null){pause();const dialog=$('reading-dialog');$('reading-title').textContent=`第${number}讲 · 完整文章`;$('reading-body').textContent='正在载入本地全文…';dialog.showModal();try{const r=await fetch(`reading/${number}.html`);if(!r.ok)throw new Error('Article unavailable');$('reading-body').innerHTML=await r.text();dialog.scrollTo(0,0);if(anchor){const target=document.getElementById(anchor);if(target)requestAnimationFrame(()=>dialog.scrollTo(0,target.getBoundingClientRect().top-dialog.getBoundingClientRect().top+dialog.scrollTop-82));}}catch(error){$('reading-body').textContent='全文载入失败；原文章保留在工作区。';console.error(error);}}
$('read03').onclick=()=>reading('03');$('read04').onclick=()=>reading('04');$('sources').onclick=()=>{pause();$('source-dialog').showModal();};
$('explanation').onclick=e=>{if(e.target.closest('#context-read')){const anchor={phase:'L03-C01',spin:'L03-C02',period:'L03-C03',eclipse:state.observe==='moon'?'L04-C02':'L04-C01'}[state.mode];reading(state.mode==='eclipse'?'04':'03',anchor);}};
$('figure').onclick=()=>{pause();const l=lessons[state.mode];$('reading-title').textContent='课程观测图版';$('reading-body').replaceChildren();const title=document.createElement('h2');title.textContent='模型之外，真实资料怎样说？';const image=document.createElement('img');image.src=l.image;image.alt=l.credit;const caption=document.createElement('p');caption.textContent=l.credit;const p=document.createElement('p');p.textContent='完整科学说明、图注与外部来源入口保留在对应课程文章中。';$('reading-body').append(title,image,caption,p);$('reading-dialog').showModal();$('reading-dialog').scrollTo(0,0);};
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>b.closest('dialog').close();
for(const [id,label]of [['space','空间中的日地月关系，空格播放或暂停'],['observed','地心方向所见，空格播放或暂停']]){$(id).tabIndex=0;$(id).setAttribute('role','region');$(id).setAttribute('aria-label',label);}
document.addEventListener('keydown',e=>{if(e.code!=='Space'||e.repeat||document.querySelector('dialog[open]')||e.target.isContentEditable||e.target.closest('input,select,button,textarea,summary,a[href],[role="button"],[role="textbox"],[role="slider"]'))return;if(e.target!==document.body&&!e.target.closest('#space,#observed'))return;e.preventDefault();togglePlay();});
function resize(){const w=space.clientWidth,h=space.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.zoom=Math.min(1,camera.aspect/1.65);camera.updateProjectionMatrix();const ow=$('observed').clientWidth,oh=$('observed').clientHeight;if(ow&&oh){viewer.setSize(ow,oh);const a=ow/oh;observerCamera.left=-1.35*a;observerCamera.right=1.35*a;observerCamera.top=1.35;observerCamera.bottom=-1.35;observerCamera.updateProjectionMatrix();}if(state.ready)refresh();}
new ResizeObserver(resize).observe(space);new ResizeObserver(resize).observe($('observed'));
let last=performance.now();function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.08);last=now;if(document.hidden)return;if(state.playing&&state.ready){state.guidePreset=null;state.days+=dt*state.speed;if(state.days>60){state.days=60;pause();}refresh();}controls.update();if(state.ready){renderer.render(scene,camera);if(!moonArea.hidden)viewer.render(observerScene,observerCamera);label('earth-label',earth.position,-35);label('moon-label',moon.position,-24);label('sun-label',new THREE.Vector3(state.trueScale?66.5:9.5,0,0).applyAxisAngle(zAxis,P.orbit(state.days,state).solarLongitude),-26);label('observer-label',siteMarker.position,17);$('observer-label').hidden=state.mode!=='eclipse'||$('observer-label').hidden;}}
window.earthMoon={state,physics:P,mode,preset,setDays,refresh,scene,camera,renderer,controls,get moon(){return moon;},get observedMoon(){return observedMoon;},get observerCamera(){return observerCamera;},snapshot:null};
const requestedMode=new URLSearchParams(location.search).get('mode');mode(['phase','spin','period','eclipse'].includes(requestedMode)?requestedMode:'phase');init();requestAnimationFrame(frame);
