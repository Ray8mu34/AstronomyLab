import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
export {THREE};
export function makeScene(host,{position=[9,7,10],target=[0,0,0],fov=45}={}){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#080d15');const camera=new THREE.PerspectiveCamera(fov,1,.005,100000);camera.position.set(...position);const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;host.append(renderer.domElement);const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(...target);controls.enableDamping=true;controls.update();let frame=0,stopped=false,callback=null,last=0,total=0;
 const resize=()=>{const w=host.clientWidth||600,h=host.clientHeight||420;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};const ro=new ResizeObserver(resize);ro.observe(host);resize();
 // A hidden document must not accrue invisible simulation time. On return,
 // restart the frame delta at zero rather than catching up in the background.
 const document=host.ownerDocument,visibility=()=>{last=0;};document.addEventListener('visibilitychange',visibility);
 const render=()=>{if(host.checkVisibility?.()===false)return;controls.update();renderer.render(scene,camera);};const step=t=>{if(stopped)return;if(!document.hidden){const dt=last?Math.min(.08,(t-last)/1000):0;last=t;total+=dt;callback?.(dt,total);render();}else last=0;frame=requestAnimationFrame(step);};frame=requestAnimationFrame(step);
 return{scene,camera,controls,renderer,render,loop(fn){callback=fn;},dispose(){stopped=true;cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',visibility);ro.disconnect();controls.dispose();const seen=new Set();scene.traverse(o=>{if(o.geometry&&!seen.has(o.geometry)){o.geometry.dispose();seen.add(o.geometry);}for(const m of (Array.isArray(o.material)?o.material:[o.material]).filter(Boolean)){if(seen.has(m))continue;for(const v of Object.values(m))if(v?.isTexture&&!seen.has(v)){v.dispose();seen.add(v);}m.dispose();seen.add(m);}});renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}};
}
