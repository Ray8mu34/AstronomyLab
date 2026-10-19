import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import * as P from './physics.mjs';
import {lessons} from './content.js';
import {defaultState,validateState,encodeRecipe,decodeRecipe,MODES} from './scene-state.js';
const $=id=>document.getElementById(id);
const state={...defaultState('phase'),playing:false,ready:false};
let resetOrigin=defaultState('phase'),playUntil=null,disposed=false,dirty=true,frameId=0,sceneMemory=new Map();
const guides={
 phase:{name:'月相实验',question:'月亮为什么会改变形状？',operation:'点一种月相，或拖动空间图中的月球；底部可播放。',observe:'对照太阳照亮的一半与地球所见的月面。',buttons:[['phase:0','新月'],['phase:90','上弦'],['phase:180','满月'],['phase:270','下弦']]},
 spin:{name:'自转实验',question:'总以同一面朝向地球，是否等于没有自转？',operation:'选自转方式，再跳到公转半圈，重复比较。',observe:'金点固定在月面；看它是否仍然朝向地球。',buttons:[['spin:sync','同步自转'],['spin:fixed','完全不自转'],['day:0','公转起点'],['day:half','公转半圈'],['day:orbit','公转一圈']]},
 period:{name:'两种周期实验',question:'绕地球一圈，为什么还没有恢复同样月相？',operation:'从新月起点连续播放，先停在恒星月，再继续至朔望月。',observe:'虚线是起点恒星方向；金线是当前太阳方向，青线是月球方向。',buttons:[['day:0','新月起点'],['day:sidereal','恒星月 · 27.32天'],['day:synodic','朔望月 · 29.53天']]},
 eclipse:{name:'日月食实验',question:'新月与满月，为什么不总发生食？',operation:'先播放新月却无食；选日全食重放，或把倾角改为0°。',observe:'对照指定点圆面与影锥，改变距离或对齐条件。',buttons:[['eclipse:total','日全食'],['eclipse:annular','日环食'],['eclipse:partial','日偏食'],['eclipse:miss','新月却无食'],['eclipse:lunar','月全食']]}
};
const vec=a=>new THREE.Vector3(...a),zAxis=new THREE.Vector3(0,0,1),origin=new THREE.Vector3();
const space=$('space'),moonArea=$('moon-render'),solarCanvas=$('solar-disc'),ctx=solarCanvas.getContext('2d');
const ownedRenderers=[];function createRenderer(){try{const value=new THREE.WebGLRenderer({antialias:true,alpha:true});ownedRenderers.push(value);return value;}catch(error){for(const previous of ownedRenderers)previous.dispose();throw error;}}
const renderer=createRenderer();renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x080d15,0);space.appendChild(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.03,900);camera.up.copy(zAxis);camera.position.set(10,-13,13);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=3;controls.maxDistance=180;controls.target.set(0,0,0);controls.update();
const viewer=createRenderer();viewer.setPixelRatio(Math.min(devicePixelRatio,2));viewer.setClearColor(0x080d15,0);moonArea.appendChild(viewer.domElement);
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
let earth,moon,observedMoon,marker,observerMarker,siteMarker,orbitLine,nodeLine,plane,solarGroup,earthMaterial,moonMaterial,observerMaterial,markerRay,earthRay;
const lineMat=new THREE.LineBasicMaterial({color:0x649997,transparent:true,opacity:.7});
function line(points,mat){return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),mat);}
function seededStars(){let seed=4351;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};const positions=[],colors=[];for(let j=0;j<850;j++){const u=random()*2-1,a=random()*P.TAU,r=200;positions.push(r*Math.sqrt(1-u*u)*Math.cos(a),r*Math.sqrt(1-u*u)*Math.sin(a),r*u);const c=.22+random()*.4;colors.push(c,c*.98,c*.96);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));scene.add(new THREE.Points(g,new THREE.PointsMaterial({size:.32,sizeAttenuation:true,vertexColors:true,transparent:true,opacity:.65})));}
// The stage has no decorative star field.
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
 if(disposed){earthTexture.dispose();moonTexture.dispose();return;}
 for(const t of [earthTexture,moonTexture]){t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}
 earthMaterial=material(earthTexture,P.C.earthRadius,P.C.moonRadius);moonMaterial=material(moonTexture,P.C.moonRadius,P.C.earthRadius);observerMaterial=material(moonTexture,P.C.moonRadius,P.C.earthRadius);
 earth=new THREE.Mesh(new THREE.SphereGeometry(1,96,64),earthMaterial);earth.rotation.x=Math.PI/2;scene.add(earth);
 moon=new THREE.Mesh(new THREE.SphereGeometry(1,96,64),moonMaterial);scene.add(moon);
 const markerMat=new THREE.MeshBasicMaterial({color:0xf8d590});marker=new THREE.Mesh(new THREE.SphereGeometry(.05,16,12),markerMat);marker.position.set(1.025,0,0);moon.add(marker);
 markerRay=line([new THREE.Vector3(),new THREE.Vector3(1.25,0,0)],new THREE.LineBasicMaterial({color:0xf8d590}));moon.add(markerRay);earthRay=line([origin,origin],new THREE.LineDashedMaterial({color:0x71c8c7,dashSize:.2,gapSize:.12}));scene.add(earthRay);
 observedMoon=new THREE.Mesh(new THREE.SphereGeometry(1,128,96),observerMaterial);observerScene.add(observedMoon);observerMarker=new THREE.Mesh(new THREE.SphereGeometry(.026,16,12),markerMat);observerMarker.position.set(1.015,0,0);observedMoon.add(observerMarker);
 siteMarker=new THREE.Mesh(new THREE.SphereGeometry(.055,16,12),new THREE.MeshBasicMaterial({color:0xf4c67c}));scene.add(siteMarker);
 makeSolarGroup();buildOrbit();state.ready=true;$('loading').hidden=true;resize();refresh();
}catch(error){pause();$('loading').hidden=true;$('startup-error').hidden=false;$('startup-message').textContent='地球与月球图像未能加载，请重试。';$('play').disabled=true;$('retry').onclick=()=>location.reload();console.error(error);}}
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
 dirty=true;if(!state.ready)return;const o=P.orbit(state.days,state),obs=P.observerPosition(o,state.east,state.north),solar=P.solarObservation(o,obs),lunar=P.lunarObservation(o);
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
 $('libration').checked=state.libration;$('red').checked=state.red;$('scale').classList.toggle('active',state.trueScale);$('scale').setAttribute('aria-pressed',String(state.trueScale));$('scale').textContent=state.trueScale?'返回展示比例':'统一地月比例';
 $('scene-caption').textContent=state.trueScale?'地球、月球、地月距离同一比例 · 太阳只示方向':'地月距离约压缩10倍，月球另放大约2倍 · 金球只示太阳方向';
 $('plane-note').textContent=state.inclination>1e-7?'淡蓝面：黄道 · 虚线：交点线':'倾角0°：月轨面与黄道面重合';
 $('moon-render').hidden=state.mode==='eclipse'&&state.observe==='sun';solarCanvas.hidden=!(state.mode==='eclipse'&&state.observe==='sun');$('north-label').hidden=state.mode==='eclipse'&&state.observe==='sun';
 marker.visible=state.mode==='spin';observerMarker.visible=state.mode==='spin';markerRay.visible=state.mode==='spin';earthRay.visible=state.mode==='spin';earthRay.geometry.setFromPoints([moon.position,origin]);earthRay.computeLineDistances();
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
function drawAnnual(o){
 const canvas=$('year-orbit'),w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
 const dpr=Math.min(devicePixelRatio,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
 const narrow=w<440,font=narrow?13:17;c.font=font+'px Microsoft YaHei';c.lineWidth=2;c.textAlign='center';
 const drawLine=(x,y,dx,dy,color,dash=false)=>{c.strokeStyle=color;c.setLineDash(dash?[7,6]:[]);c.beginPath();c.moveTo(x,y);c.lineTo(x+dx,y+dy);c.stroke();c.setLineDash([]);};
 const circle=(x,y,r,color)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,P.TAU);c.fill();};
 const cy=h*.33,r=Math.min(w*.23,h*.2),cx=w*.5,ang=o.solarLongitude+Math.PI;
 c.strokeStyle='#405b71';c.beginPath();c.arc(cx,cy,r,0,P.TAU);c.stroke();circle(cx,cy,10,'#ebc77e');c.fillStyle='#ebc77e';c.fillText('太阳',cx,cy+font+13);
 const ex=cx+r*Math.cos(ang),ey=cy-r*Math.sin(ang);circle(cx-r,cy,4,'#657b91');drawLine(cx,cy,-r,0,'#657b91',true);circle(ex,ey,9,'#71c8c7');c.fillStyle='#71c8c7';c.fillText('地球',ex,ey-font-9);drawLine(ex,ey,cx-ex,cy-ey,'#ebc77e');c.fillStyle='#a7b7c9';c.fillText('日心：地球沿轨道前进',cx,28);
 const lx=w*.5,ly=h*.77,rr=Math.min(w*.31,h*.17);c.strokeStyle='#3e5568';c.beginPath();c.arc(lx,ly,rr,0,P.TAU);c.stroke();circle(lx,ly,8,'#71c8c7');
 const moonAngle=Math.atan2(o.moon[1],o.moon[0]),sx=Math.cos(o.solarLongitude)*rr,sy=-Math.sin(o.solarLongitude)*rr,mx=Math.cos(moonAngle)*rr,my=-Math.sin(moonAngle)*rr;
 drawLine(lx,ly,rr,0,'#8b9db2',true);
 // Concentric strokes keep both direction identities at conjunction. The
 // gold endpoint is a direction marker, not a heliocentric distance sample.
 c.lineWidth=4;drawLine(lx,ly,sx*1.1,sy*1.1,'#ebc77e');c.lineWidth=2;drawLine(lx,ly,mx,my,'#71c8c7');circle(lx+sx*1.1,ly+sy*1.1,4,'#ebc77e');circle(lx+mx,ly+my,8,'#d3dce7');
 c.fillStyle='#a7b7c9';c.fillText('地心：参照原点是地球',lx,h*.54);c.fillText('虚线 恒星起点',lx-rr*.2,ly+font+15);
 const callout=(text,endX,endY,y,color)=>{const x=w*.82,left=x-c.measureText(text).width/2-7;c.strokeStyle=color;c.lineWidth=1;c.setLineDash([2,3]);c.beginPath();c.moveTo(endX,endY);c.lineTo(left-12,y-6);c.lineTo(left,y-6);c.stroke();c.setLineDash([]);c.fillStyle='#080e16';c.fillRect(left+2,y-font-2,c.measureText(text).width+10,font+6);c.fillStyle=color;c.fillText(text,x,y);c.lineWidth=2;};
 callout('太阳方向',lx+sx*1.1,ly+sy*1.1,ly-rr+font,'#ebc77e');callout('月球方向',lx+mx,ly+my,h-14,'#71c8c7');
 $('annual-angle').textContent='地球前进 '+(o.solarLongitude/P.RAD).toFixed(1)+'°';
 $('period-event').textContent=Math.abs(state.days-P.C.sidereal)<.005?'恒星方向已回到起点；太阳方向仍差约27°':Math.abs(state.days-P.SYNODIC)<.005?'太阳相对方向也回到起点：再次新月':state.days<P.C.sidereal?'先追踪月球回到恒星起点':'继续追上已移动的太阳方向';
}
function drawSolar(s){
 const dpr=Math.min(devicePixelRatio,2),w=solarCanvas.clientWidth,h=solarCanvas.clientHeight;if(solarCanvas.width!==Math.round(w*dpr)||solarCanvas.height!==Math.round(h*dpr)){solarCanvas.width=Math.round(w*dpr);solarCanvas.height=Math.round(h*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 const r=Math.min(h*.32,w*.33),factor=r/s.sunRadius,cx=w/2,cy=h*.45;
 const g=ctx.createRadialGradient(cx-r*.15,cy-r*.15,0,cx,cy,r);g.addColorStop(0,'#ffebb6');g.addColorStop(1,'#edbd6a');ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,r,0,P.TAU);ctx.fill();
 if(s.horizon<=0){ctx.fillStyle='#080d15e8';ctx.fillRect(0,0,w,h);ctx.fillStyle='#93a5b8';ctx.font='12px Microsoft YaHei';ctx.textAlign='center';ctx.fillText('太阳位于几何地平线下',cx,cy);return;}
 // East is displayed left when looking along the Sun direction, north stays up.
 const mx=cx-s.x*factor,my=cy-s.y*factor,mr=s.moonRadius*factor;
 if(Math.abs(mx-cx)<w/2+mr&&Math.abs(my-cy)<h/2+mr){ctx.fillStyle='#070b12';ctx.beginPath();ctx.arc(mx,my,mr,0,P.TAU);ctx.fill();ctx.strokeStyle='#5b697d66';ctx.lineWidth=.8;ctx.stroke();}else if(!document.body.classList.contains('eclipse-observing')){ctx.fillStyle='#a7b7c9';ctx.font='15px Microsoft YaHei';ctx.textAlign='center';ctx.fillText(`月球圆面在视场外，角距 ${(s.separation/P.RAD).toFixed(2)}°`,cx,h*.82);}
 ctx.strokeStyle='#5f7186';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx-r,cy+r+19);ctx.lineTo(cx+r,cy+r+19);ctx.stroke();ctx.fillStyle='#93a5b8';ctx.font='15px Microsoft YaHei';ctx.textAlign='center';ctx.fillText(`${(s.sunRadius*2/P.RAD).toFixed(3)}°`,cx,cy+r+32);
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
function renderMode(){
 document.dispatchEvent(new CustomEvent('moon-ui-before-mode',{detail:{mode:state.mode}}));
 const mode=state.mode,guide=guides[mode];
 for(const b of document.querySelectorAll('[data-mode]')){const active=b.dataset.mode===mode;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));}
 $('guide-mode').textContent=guide.name;$('guide-question').textContent=guide.question;$('guide-operation').textContent=guide.operation;$('guide-observe').textContent=guide.observe;
 $('guide-actions').innerHTML=guide.buttons.map(([action,label])=>{const [type,value]=action.split(':'),attribute={phase:'data-phase',spin:'data-spin',eclipse:'data-preset'}[type],id=type==='day'?({0:'epoch',sidereal:'sidereal',synodic:'synodic'}[value]):null;return '<button data-guide-action="'+action+'"'+(attribute?' '+attribute+'="'+value+'"':'')+(id?' id="'+id+'"':'')+' aria-pressed="false">'+label+'</button>';}).join('');
 for(const name of MODES)$(name+'-controls').hidden=mode!==name;
 $('phase-controls').hidden=true;$('geometry-settings').hidden=mode==='period';$('geometry-settings').open=false;$('node-label').hidden=mode!=='eclipse';$('distance-label').hidden=mode==='spin'||mode==='period';$('libration-control').hidden=mode!=='spin';$('libration-note').hidden=mode!=='spin';$('inclination').disabled=mode==='period';$('local-time').hidden=mode!=='eclipse';$('day').hidden=mode==='eclipse';document.body.dataset.experimentMode=mode;
 const l=lessons[mode];$('explanation').innerHTML='<h2>'+l.title+'</h2>'+l.paragraphs.map(p=>'<p>'+p+'</p>').join('')+'<p class="equation">'+l.equation+'</p><p>'+l.tip+'</p>';
 $('mode-boundary').textContent={phase:'月相由照明与观察方向决定；百分比表示几何受光面积。',spin:'金点标记固定月面位置，用于追踪自转。',period:'共面匀速模型；调整距离时保持平均周期固定。',eclipse:'采用理想几何与均匀太阳圆面。实际观测太阳须使用合格防护。'}[mode];
 $('preset-summary').textContent=mode==='eclipse'?({total:'日全：倾角0°，距离36万km；从对齐前2.88小时播放。',annular:'日环：同样对齐，距离改为40.5万km；从2.88小时前播放。',partial:'日偏：中央食条件，观测点东偏25°；从2.88小时前播放。',miss:'无食：倾角5.145°，交点90°；相位相近但错开影轴。',lunar:'月全：倾角0°，从理想满月前4.32小时播放；红光仅定性。'}[state.guidePreset]||'手动条件：比较指定点圆面与影轴。'):'';
 renderView();syncPlayback();
}
function getState(){const coordinates=v=>v.toArray().map(x=>Number(x.toFixed(9)));return validateState({...Object.fromEntries(Object.keys(defaultState()).filter(k=>k!=='camera').map(k=>[k,state[k]])),camera:{position:coordinates(camera.position),target:coordinates(controls.target)}});}
function applyState(candidate){if(disposed)throw new Error('当前工具实例已释放，请重新打开。');const clean=validateState(candidate);pause();Object.assign(state,clean);camera.position.fromArray(clean.camera.position);controls.target.fromArray(clean.camera.target);controls.update();camera.updateMatrixWorld(true);renderMode();if(state.ready)buildOrbit();resize();refresh();persist();return getState();}
function mode(mode){applyState(defaultState(mode));resetOrigin=getState();updateURL();$('status').textContent='模式默认起点；切模式重新开始并暂停。';}
function reset(){applyState(resetOrigin);$('status').textContent='已返回当前载入起点并暂停。';}
function renderView(){const v=state.view,period=state.mode==='period',eclipse=state.mode==='eclipse';
 document.body.dataset.stageView=v;document.querySelector('.space-view').hidden=v==='observer'||v==='shadow'||v==='reference';document.querySelector('.observer-view').hidden=v==='space'||v==='shadow';$('annual-inset').hidden=v!=='reference';$('shadow-panel').hidden=v!=='shadow';
 for(const b of document.querySelectorAll('[data-view]')){b.hidden=b.dataset.view==='reference'&&!period||b.dataset.view==='shadow'&&!eclipse;b.setAttribute('aria-pressed',String(b.dataset.view===v));b.classList.toggle('active',b.dataset.view===v);}
}
function setView(v){const candidate=getState();candidate.view=v;applyState(candidate);}
function updateURL(){const url=new URL(location.href);url.searchParams.set('mode',state.mode);history.replaceState(history.state,'',url);}
function syncPlayback(){for(const button of [$('play'),...document.querySelectorAll('[data-play-toggle]')]){button.textContent=state.playing?'Ⅱ 暂停':'▶ 播放';button.setAttribute('aria-label',state.playing?'暂停轨道':'播放轨道');button.setAttribute('aria-pressed',String(state.playing));}$('speed').value=state.speed;for(const select of document.querySelectorAll('[data-play-speed]'))select.value=state.speed;}
function pause(){state.playing=false;playUntil=null;syncPlayback();dirty=true;}
function togglePlay(){if(!state.ready||disposed)return;state.playing=!state.playing;playUntil=null;syncPlayback();dirty=true;}
function setDays(days){if(typeof days!=='number'||!Number.isFinite(days))throw new Error('实验时间必须为有限数。');pause();state.guidePreset=null;state.days=P.clamp(days,-1,60);refresh();}
function eclipseEpoch(){const shift=state.observe==='sun'?0:P.SYNODIC/2;return Math.round((state.days-shift)/P.SYNODIC)*P.SYNODIC+shift;}
function preset(name){const out=defaultState('eclipse');Object.assign(out,{guidePreset:name,inclination:0,node:0,days:-.12});
 if(name==='annular')out.distance=405000;if(name==='partial')out.east=25;if(name==='miss'){out.inclination=P.C.inclination;out.node=90;}if(name==='lunar'){out.days=P.SYNODIC/2-.18;out.distance=384400;out.observe='moon';}
 applyState(out);resetOrigin=getState();$('preset-summary').textContent={total:'日全：倾角0°，距离36万km；从对齐前2.88小时播放。',annular:'日环：同样对齐，距离改为40.5万km；从2.88小时前播放。',partial:'日偏：中央食条件，观测点东偏25°；从2.88小时前播放。',miss:'无食：倾角5.145°，交点90°；相位相近但错开影轴。',lunar:'月全：倾角0°，从理想满月前4.32小时播放；红光仅定性。'}[name];$('status').textContent='预设已载入；复位将回到此起点。';}
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
$('top').onclick=()=>home(true);$('oblique').onclick=()=>home(false);$('reset').onclick=reset;$('scale').onclick=()=>{state.trueScale=!state.trueScale;buildOrbit();home(false);refresh();};
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let dragging=false,dragPlane;
renderer.domElement.addEventListener('pointerdown',e=>{if(!state.ready)return;const box=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-box.left)/box.width*2-1,-(e.clientY-box.top)/box.height*2+1);raycaster.setFromCamera(pointer,camera);const projected=moon.position.clone().project(camera),px=(projected.x+1)*box.width/2,py=(1-projected.y)*box.height/2,nearMarker=Math.hypot(e.clientX-box.left-px,e.clientY-box.top-py)<20&&projected.z<1;if(raycaster.intersectObject(moon,false).length||nearMarker){pause();dragging=true;controls.enabled=false;renderer.domElement.setPointerCapture(e.pointerId);const normal=vec(P.rotateZ(P.rotateX([0,0,1],state.inclination*P.RAD),state.node*P.RAD));dragPlane=new THREE.Plane().setFromNormalAndCoplanarPoint(normal,origin);}});
renderer.domElement.addEventListener('pointermove',e=>{if(!dragging)return;const box=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-box.left)/box.width*2-1,-(e.clientY-box.top)/box.height*2+1);raycaster.setFromCamera(pointer,camera);const p=raycaster.ray.intersectPlane(dragPlane,new THREE.Vector3());if(!p||p.length()<.1)return;const local=P.rotateX(P.rotateZ(p.toArray(),-state.node*P.RAD),-state.inclination*P.RAD),f=Math.atan2(local[1],local[0]),e0=state.libration?P.C.eccentricity:0,E=2*Math.atan2(Math.sqrt(1-e0)*Math.sin(f/2),Math.sqrt(1+e0)*Math.cos(f/2)),M=E-e0*Math.sin(E)+state.node*P.RAD;
 const t=P.wrap(M)/P.TAU*P.C.sidereal,cycle=Math.round((state.days-t)/P.C.sidereal);state.guidePreset=null;state.days=P.clamp(t+cycle*P.C.sidereal,-1,60);refresh();});
function endDrag(){dragging=false;controls.enabled=true;}renderer.domElement.addEventListener('pointerup',endDrag);renderer.domElement.addEventListener('pointercancel',endDrag);
$('sources').onclick=()=>{pause();$('source-dialog').showModal();};
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>b.closest('dialog').close();
for(const [id,label]of [['space','空间中的日地月关系，空格播放或暂停'],['observed','地心方向所见，空格播放或暂停']]){$(id).tabIndex=0;$(id).setAttribute('role','region');$(id).setAttribute('aria-label',label);}
function onSpace(e){if(e.code!=='Space'||e.repeat||document.querySelector('dialog[open]')||e.target.isContentEditable||e.target.closest('input,select,button,textarea,summary,a[href],[role="button"],[role="textbox"],[role="slider"]'))return;if(e.target!==document.body&&!e.target.closest('#space,#observed'))return;e.preventDefault();togglePlay();}document.addEventListener('keydown',onSpace);
function resize(){const w=space.clientWidth,h=space.clientHeight;if(w&&h){renderer.setSize(w,h);camera.aspect=w/h;camera.zoom=Math.min(1,camera.aspect/1.2);camera.updateProjectionMatrix();}const ow=$('observed').clientWidth,oh=$('observed').clientHeight;if(ow&&oh){viewer.setSize(ow,oh);const a=ow/oh;const extent=Math.max(1.25,1.15/a);observerCamera.left=-extent*a;observerCamera.right=extent*a;observerCamera.top=extent;observerCamera.bottom=-extent;observerCamera.updateProjectionMatrix();}if(state.ready)refresh();}

const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(space);resizeObserver.observe($('observed'));resizeObserver.observe($('year-orbit'));
let last=performance.now(),settling=0;
controls.addEventListener('change',()=>{dirty=true;settling=40;persist();});
function frame(now){if(disposed)return;frameId=requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.08);last=now;if(document.hidden)return;
 if(state.playing&&state.ready){state.guidePreset=null;state.days+=dt*state.speed;if(playUntil!==null&&state.days>=playUntil){state.days=playUntil;pause();$('status').textContent='已到参照终点并暂停，可继续。';}if(state.days>60){state.days=60;pause();}refresh();}
 if(!state.playing&&!dirty&&settling<=0)return;controls.update();settling--;dirty=false;
 if(state.ready){if(!document.querySelector('.space-view').hidden){renderer.render(scene,camera);label('earth-label',earth.position,-35);label('moon-label',moon.position,-24);label('sun-label',new THREE.Vector3(state.trueScale?66.5:9.5,0,0).applyAxisAngle(zAxis,P.orbit(state.days,state).solarLongitude),-26);label('observer-label',siteMarker.position,17);$('observer-label').hidden=state.mode!=='eclipse'||$('observer-label').hidden;}if(!document.querySelector('.observer-view').hidden&&!moonArea.hidden)viewer.render(observerScene,observerCamera);}
}
function exportRecipe(){return encodeRecipe(getState());}
function importRecipe(value){const clean=decodeRecipe(value);applyState(clean);resetOrigin=getState();updateURL();$('status').textContent='已导入配方并暂停；复位返回此起点。';return getState();}
let entryId;function entry(){if(entryId)return entryId;const old=history.state||{},astro=old.astronomy||{};entryId=astro.entryId||crypto.randomUUID();history.replaceState({...old,astronomy:{...astro,entryId}},'',location.href);return entryId;}
function persist(){if(!state.ready||disposed)return;const key='astronomy:moon-scene:v1:'+entry();try{const value={scene:exportRecipe(),origin:encodeRecipe(resetOrigin)};sceneMemory.set(key,value);sessionStorage.setItem(key,JSON.stringify(value));}catch{}}
function restore(){const key='astronomy:moon-scene:v1:'+entry();let saved=sceneMemory.get(key);try{if(!saved){const raw=sessionStorage.getItem(key);if(raw&&raw.length<=65536)saved=JSON.parse(raw);}}catch{}if(saved){try{const scene=decodeRecipe(saved.scene),origin=decodeRecipe(saved.origin);applyState(scene);resetOrigin=origin;$('status').textContent='已恢复上次场景并暂停。';}catch{$('status').textContent='无法恢复上次场景，已载入默认场景。';}}}
function dispose(){if(disposed)return;persist();pause();disposed=true;cancelAnimationFrame(frameId);resizeObserver.disconnect();controls.dispose();const geometries=new Set(),materials=new Set(),textures=new Set();for(const tree of [scene,observerScene])tree.traverse(obj=>{if(obj.geometry)geometries.add(obj.geometry);for(const mat of [].concat(obj.material||[])){materials.add(mat);for(const uniform of Object.values(mat.uniforms||{}))if(uniform.value?.isTexture)textures.add(uniform.value);if(mat.map)textures.add(mat.map);}});for(const resource of [...geometries,...materials,...textures])resource.dispose();renderer.dispose();viewer.dispose();renderer.domElement.remove();viewer.domElement.remove();state.ready=false;$('guide-actions').onclick=null;$('sources').onclick=null;$('presentation').onclick=null;window.removeEventListener('pagehide',onHide);window.removeEventListener('pageshow',onShow);document.removeEventListener('visibilitychange',onVisibility);document.removeEventListener('keydown',onSpace);document.removeEventListener('keydown',onEscape);for(const type of ['input','change','click'])document.removeEventListener(type,onStateInput);for(const el of document.querySelectorAll('main button,main input,main select,.timeline button,.timeline input,.timeline select')){el.onclick=null;el.oninput=null;el.onchange=null;}$('play').disabled=true;}
function onVisibility(){if(document.hidden){persist();pause();}last=performance.now();dirty=true;}
function onHide(event){persist();pause();cancelAnimationFrame(frameId);if(!event.persisted)dispose();}
function onShow(event){if(event.persisted&&!disposed){restore();last=performance.now();dirty=true;frameId=requestAnimationFrame(frame);}}
document.addEventListener('visibilitychange',onVisibility);window.addEventListener('pagehide',onHide);window.addEventListener('pageshow',onShow);
window.earthMoon={state,physics:P,mode,preset,setDays,refresh,scene,camera,renderer,controls,getState,applyState,reset,pause,resize,dispose,exportRecipe,importRecipe,get moon(){return moon;},get observedMoon(){return observedMoon;},get observerCamera(){return observerCamera;},snapshot:null};
$('default-reset').onclick=()=>mode(state.mode);for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>setView(b.dataset.view);
$('play-sidereal').onclick=()=>{if(state.days>=P.C.sidereal)setDays(0);playUntil=P.C.sidereal;state.playing=true;syncPlayback();};$('play-synodic').onclick=()=>{if(state.days>=P.SYNODIC)setDays(0);playUntil=P.SYNODIC;state.playing=true;syncPlayback();};
$('export-scene').onclick=()=>{pause();persist();const blob=new Blob([JSON.stringify(exportRecipe(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='earth-moon-'+state.mode+'-scene.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('status').textContent='已导出输入、相机与参照方向。';};
$('import-scene').onchange=async e=>{const file=e.target.files[0];try{if(!file||file.size>65536)throw new Error('场景文件须小于64KiB。');importRecipe(JSON.parse(await file.text()));}catch(error){$('status').textContent='导入失败：'+error.message;}finally{e.target.value='';}};
$('presentation').onclick=()=>{const on=document.body.classList.toggle('presenting');$('presentation').textContent=on?'退出演示':'演示布局';$('presentation').setAttribute('aria-pressed',String(on));resize();};
function onEscape(e){if(e.key==='Escape'&&document.body.classList.contains('presenting')&&!document.querySelector('dialog[open]')){$('presentation').click();$('presentation').focus();}}document.addEventListener('keydown',onEscape);
for(const el of [renderer.domElement,viewer.domElement])el.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();state.ready=false;$('play').disabled=true;$('startup-error').hidden=false;$('startup-message').textContent='三维画面已中断，请重试。';$('retry').onclick=()=>location.reload();});
function onStateInput(){dirty=true;persist();}for(const type of ['input','change','click'])document.addEventListener(type,onStateInput);
const requestedMode=new URLSearchParams(location.search).get('mode');mode(MODES.includes(requestedMode)?requestedMode:'phase');
await init();if(state.ready){restore();persist();requestAnimationFrame(frame);}
