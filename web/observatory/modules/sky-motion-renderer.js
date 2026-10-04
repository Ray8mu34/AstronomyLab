import {THREE} from '../shared/lab.js';
import {makeMotionLabels} from './sky-motion-labels.js';
import {DEG,equatorialVector} from './sky-physics.mjs';
import {dayGeometry} from './sky-demo-geometry.mjs';
import {epochPrecession,catalogueToEcliptic,PRECESSION_TILT} from './sky-motion-physics.mjs';
const blue=0x8aaedd,gold=0xebc77e,orange=0xf0a36a,teal=0x71c8c7;
const W=v=>new THREE.Vector3(v[0],v[2],-v[1]);
const points=fn=>Array.from({length:145},(_,i)=>fn(i*Math.PI*2/144));
function line(parent,p,color,alpha=1,dashed=false){const mat=dashed?new THREE.LineDashedMaterial({color,dashSize:.13,gapSize:.09,transparent:true,opacity:alpha}):new THREE.LineBasicMaterial({color,transparent:true,opacity:alpha});const o=new THREE.Line(new THREE.BufferGeometry().setFromPoints(p),mat);if(dashed)o.computeLineDistances();parent.add(o);return o;}
function sphere(parent,r,color){const m=new THREE.Mesh(new THREE.SphereGeometry(r,40,28),new THREE.MeshBasicMaterial({color}));parent.add(m);return m;}
function text(parent,t,p,color='#bfced9',size=.3){const c=document.createElement('canvas'),x=c.getContext('2d');x.font='36px "Microsoft YaHei",sans-serif';c.width=Math.ceil(x.measureText(t).width+24);c.height=56;x.font='36px "Microsoft YaHei",sans-serif';x.fillStyle=color;x.fillText(t,12,40);const m=new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthTest:false});const o=new THREE.Sprite(m);o.scale.set(c.width/56*size,size,1);o.position.copy(p);parent.add(o);return o;}
function earth(parent,r){const frame=new THREE.Group(),body=new THREE.Group();parent.add(frame);frame.add(body);const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,48,32),new THREE.ShaderMaterial({uniforms:{sunDirection:{value:new THREE.Vector3(-1,0,0)}},vertexShader:'varying vec3 n;void main(){n=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec3 n;uniform vec3 sunDirection;void main(){float d=max(0.,dot(normalize(n),normalize(sunDirection)));gl_FragColor=vec4(vec3(.024,.07,.10)+d*vec3(.08,.24,.29),1.);}'}));body.add(mesh);
 for(let k=0;k<12;k++)line(body,Array.from({length:73},(_,i)=>{const a=i*Math.PI/72,b=k*Math.PI/6;return new THREE.Vector3(r*1.008*Math.sin(a)*Math.cos(b),r*1.008*Math.cos(a),r*1.008*Math.sin(a)*Math.sin(b));}),0x46717c,.55);
 for(let lat=-60;lat<=60;lat+=30)line(body,points(a=>new THREE.Vector3(r*1.009*Math.cos(lat*DEG)*Math.cos(a),r*1.009*Math.sin(lat*DEG),r*1.009*Math.cos(lat*DEG)*Math.sin(a))),lat===0?blue:0x46717c,.7);
 line(body,Array.from({length:73},(_,i)=>{const a=i*Math.PI/72;return new THREE.Vector3(-r*1.016*Math.sin(a),r*1.016*Math.cos(a),0);}),orange);
 const marker=sphere(body,.075,orange);marker.position.set(-r*1.025,0,0);
 return {frame,body,mesh,marker};}
function setLine(o,p){const g=o.geometry;if(g.getAttribute('position')?.count!==p.length)g.setAttribute('position',new THREE.Float32BufferAttribute(p.flatMap(v=>v.toArray()),3));else g.setFromPoints(p);g.computeBoundingSphere();o.computeLineDistances?.();}
export function makeSkyMotionRenderer(lab,catalogue){
 const root=new THREE.Group(),day=new THREE.Group(),prec=new THREE.Group();root.add(day,prec);lab.scene.add(root);root.visible=false;
 const R=5.4,planet=earth(day,1.05);sphere(day,.46,gold);const sunLabel=text(day,'太阳',new THREE.Vector3(0,-.85,0),'#ebc77e',.4);
 line(day,points(a=>new THREE.Vector3(R*Math.cos(a),0,-R*Math.sin(a))),0x425e70,.6);
 const initial=sphere(day,.06,0x7e949f);initial.position.set(R,0,0);text(day,'轨道起点',new THREE.Vector3(R,-1.7,0),'#8499a7',.28);
 const sunLine=line(day,[new THREE.Vector3(),new THREE.Vector3()],gold,.8),starLine=line(day,[new THREE.Vector3(),new THREE.Vector3()],blue,.85,true),markerLine=line(day,[new THREE.Vector3(),new THREE.Vector3()],orange);
 const starLabel=text(day,'固定远星方向',new THREE.Vector3(),'#8aaedd',.32),earthLabel=text(day,'同一地面标记',new THREE.Vector3(),'#f0a36a',.35);
 const poleArrow=new THREE.ArrowHelper(new THREE.Vector3(0,1,0),new THREE.Vector3(),1.7,blue,.18,.09);day.add(poleArrow);
 // Inertial direction and orbital arrow use the same right-handed frame.
 const orbitArrow=new THREE.ArrowHelper(new THREE.Vector3(0,0,-1),new THREE.Vector3(R,0,0),.7,teal,.2,.1);day.add(orbitArrow);
 const globe=earth(prec,1.15),axis=line(prec,[new THREE.Vector3(),new THREE.Vector3()],blue),equator=line(prec,[],blue,.8),tip=sphere(prec,.10,blue),poleLabel=text(prec,'北天极',new THREE.Vector3(),'#8aaedd',.36);
 const skyR=4.1,e=PRECESSION_TILT*DEG;
 const coneVertices=[];for(let i=0;i<96;i++){const a=i*2*Math.PI/96,b=(i+1)*2*Math.PI/96;coneVertices.push(0,0,0,skyR*Math.sin(e)*Math.cos(a),skyR*Math.cos(e),skyR*Math.sin(e)*Math.sin(a),skyR*Math.sin(e)*Math.cos(b),skyR*Math.cos(e),skyR*Math.sin(e)*Math.sin(b));}
 const coneG=new THREE.BufferGeometry();coneG.setAttribute('position',new THREE.Float32BufferAttribute(coneVertices,3));prec.add(new THREE.Mesh(coneG,new THREE.MeshBasicMaterial({color:blue,transparent:true,opacity:.065,side:THREE.DoubleSide,depthWrite:false})));
 line(prec,points(a=>new THREE.Vector3(skyR*Math.sin(e)*Math.cos(a),skyR*Math.cos(e),skyR*Math.sin(e)*Math.sin(a))),teal);
 line(prec,points(a=>new THREE.Vector3(skyR*Math.cos(a),0,skyR*Math.sin(a))),gold,.75);
 line(prec,points(a=>new THREE.Vector3(0,skyR*Math.sin(a),skyR*Math.cos(a))),0x41566a,.4);
 line(prec,points(a=>new THREE.Vector3(skyR*Math.cos(a),skyR*Math.sin(a),0)),0x41566a,.4);
 const start=W(epochPrecession(0).pole).multiplyScalar(skyR);line(prec,[new THREE.Vector3(),start],0x7a8e9d,.7,true);sphere(prec,.055,0x7a8e9d).position.copy(start);
 prec.add(new THREE.ArrowHelper(new THREE.Vector3(0,1,0),new THREE.Vector3(),4.7,gold,.2,.1));
 text(prec,'黄道北极 · 固定',new THREE.Vector3(0,5,0),'#ebc77e',.35);text(prec,'黄道平面',new THREE.Vector3(-3.5,0,2.1),'#ebc77e',.34);text(prec,'天极轨迹',new THREE.Vector3(-2.2,3.8,0),'#71c8c7',.33);
 const fixed=new THREE.Group();fixed.name='sky-fixed-star-background';prec.add(fixed);for(const s of catalogue.stars){const m=sphere(fixed,.025,0xcbd5df);m.position.copy(W(catalogueToEcliptic(equatorialVector(s.raDeg,s.decDeg))).multiplyScalar(skyR));m.name='sky-precession-fixed-'+s.hip;}
 const q=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0);
 const daySprites=[];day.traverse(o=>{if(o.isSprite)daySprites.push(o);});prec.traverse(o=>{if(o.isSprite)o.visible=false;});
 const labels=makeMotionLabels(lab.renderer.domElement.parentElement,lab.camera,w=>{
  if(!root.visible)return[];
  if(prec.visible){const a=equator.geometry.getAttribute('position');let edge=new THREE.Vector3(),score=-Infinity;for(let i=0;i<(a?.count||0);i++){const v=new THREE.Vector3().fromBufferAttribute(a,i),p=v.clone().project(lab.camera),s=p.x-.2*p.y;if(s>score){score=s;edge=v;}}
   return [{key:'ecliptic-pole',text:'黄道北极 · 固定',point:new THREE.Vector3(0,4.7,0),color:'#ebc77e',side:'left',row:'top'},
    {key:'north-pole',text:'北天极 · 随轴',point:tip.position,color:'#8aaedd',side:'right',row:'upper'},
    {key:'ecliptic',text:'黄道 · 固定',point:new THREE.Vector3(-3.5,0,2.1),color:'#ebc77e',side:'left',row:'lower'},
    {key:'equator',text:'天赤道 · 随轴',point:edge,color:'#8aaedd',side:'right',row:'bottom'}];}
  if(w>700)return[];const pos=planet.frame.position;
  return [{key:'sun',text:'太阳',point:new THREE.Vector3(),color:'#ebc77e',side:'left',row:'lower'},
   {key:'star',text:'固定远星方向',point:pos.clone().add(new THREE.Vector3(-2.4,0,0)),color:'#8aaedd',side:'left',row:'top'},
   {key:'marker',text:'同一地面标记',point:planet.marker.getWorldPosition(new THREE.Vector3()),color:'#f0a36a',side:'right',row:'bottom'}];
 });
 return {root,day,prec,planet,globe,axis,equator,fixed,
  hide(){root.visible=false;labels.hide();},
  updateLabels(){const narrow=lab.renderer.domElement.parentElement.clientWidth<=700;daySprites.forEach(s=>s.visible=!narrow);labels.update();},
  updateDay(hours){root.visible=true;day.visible=true;prec.visible=false;const d=dayGeometry(hours),pos=new THREE.Vector3(R*Math.cos(d.orbitDegrees*DEG),0,-R*Math.sin(d.orbitDegrees*DEG));planet.frame.position.copy(pos);planet.body.rotation.y=d.spinDegrees*DEG;planet.mesh.material.uniforms.sunDirection.value.copy(pos).negate().normalize();
   const sun=W(d.sun),mark=W(d.marker);setLine(sunLine,[pos,new THREE.Vector3()]);setLine(starLine,[pos,pos.clone().add(new THREE.Vector3(-3,0,0))]);setLine(markerLine,[pos,pos.clone().add(mark.multiplyScalar(1.9))]);poleArrow.position.copy(pos);starLabel.position.copy(pos).add(new THREE.Vector3(-2.4,.38,0));earthLabel.position.copy(pos).add(new THREE.Vector3(0,-1.35,0));return {...d,earthPosition:pos.toArray(),sunPosition:[0,0,0],markerWorld:W(d.marker).toArray()};},
  updatePrecession(years,spin){root.visible=true;day.visible=false;prec.visible=true;const d=epochPrecession(years),pole=W(d.pole);globe.frame.quaternion.copy(q.setFromUnitVectors(up,pole));globe.body.rotation.y=spin;setLine(axis,[pole.clone().multiplyScalar(-2),pole.clone().multiplyScalar(skyR)]);tip.position.copy(pole).multiplyScalar(skyR);poleLabel.position.copy(pole).multiplyScalar(skyR+.35);setLine(equator,points(a=>W(d.equatorU).multiplyScalar(skyR*Math.cos(a)).add(W(d.equatorV).multiplyScalar(skyR*Math.sin(a)))));return d;},
  camera(mode,preset='oblique'){const damping=lab.controls.enableDamping;lab.controls.enableDamping=false;lab.controls.update();lab.controls.enableDamping=damping;lab.controls.enabled=true;lab.controls.minDistance=3;lab.controls.maxDistance=40;
   if(mode==='day'){lab.camera.fov=preset==='close'?42:26;if(preset==='pole'){lab.camera.position.set(2.7,15,.01);lab.controls.target.set(2.7,0,0);}else if(preset==='close'){lab.camera.position.set(7,3.3,6.5);lab.controls.target.copy(planet.frame.position);}else{lab.camera.position.set(7.7,6,13);lab.controls.target.set(2.7,0,0);}}
   else {lab.camera.fov=42;if(preset==='pole'){lab.camera.position.set(0,13,.01);lab.controls.target.set(0,1,0);}else if(preset==='close'){lab.camera.position.set(4,5,9);lab.controls.target.set(0,1,0);}else{lab.camera.position.set(7,6,9);lab.controls.target.set(0,.65,0);}const direction=lab.camera.position.clone().sub(lab.controls.target),half=Math.min(21*DEG,Math.atan(Math.tan(21*DEG)*lab.camera.aspect)),distance=4.9/Math.sin(half)*1.04;lab.camera.position.copy(lab.controls.target).add(direction.normalize().multiplyScalar(distance));}lab.camera.updateProjectionMatrix();lab.camera.updateMatrixWorld(true);lab.controls.update();
  },
  dispose(){labels.dispose();root.traverse(o=>{o.geometry?.dispose();for(const m of [].concat(o.material||[])){m.map?.dispose();m.dispose();}});lab.scene.remove(root);}
 };
}
