import assert from 'node:assert/strict';
import fs from 'node:fs';
import {trackPoint,stefanLuminosity,magneticDirection,pulsarSignal,pulseProfile,pulseDuty,collapseState,compactScales,bindingEnergyScale} from '../modules/stars-physics.mjs';
const checks=[];
const check=(name,fn)=>{fn();checks.push({name,status:'passed'});};
check('官方模型1420/1420/808行，EEP有序、年龄有序且R/T/L一致',()=>{
 const d=JSON.parse(fs.readFileSync(new URL('../data/stars/tracks.json',import.meta.url),'utf8'));
 assert.deepEqual(d.tracks.map(t=>t.rows.length),[1420,1420,808]);
 for(const tr of d.tracks){let age=-1,eep=0;
  for(let i=0;i<tr.rows.length;i++){const p=trackPoint(tr,d.columns,i);assert(p.eep>eep);assert(p.star_age>=age);eep=p.eep;age=p.star_age;
   assert(p.center_h1>=0&&p.center_h1<=1);assert(p.star_mass>0);assert(Math.abs(stefanLuminosity(p.radius,p.temperature)/p.luminosity-1)<.003);}
 }
 const first=d.tracks[0],zams=trackPoint(first,d.columns,201),tams=trackPoint(first,d.columns,453);
 assert(zams.center_h1>.5&&tams.center_h1<.001);
 assert(Math.abs(tams.star_age-10343242226.338652)<1);
});
check('磁轴单位向量；独立点积与夹角公式相同',()=>{
 for(const alpha of [0,20,45,90])for(const zeta of [0,30,90,150,180])for(const phase of [0,.17,.5,.92]){
  const b=magneticDirection(alpha,phase);assert(Math.abs(b.reduce((s,x)=>s+x*x,0)-1)<1e-14);
  const r=Math.PI/180,cos=Math.cos(alpha*r)*Math.cos(zeta*r)+Math.sin(alpha*r)*Math.sin(zeta*r)*Math.cos(phase*2*Math.PI);
  assert(Math.abs(pulsarSignal(alpha,zeta,12,phase).angleDeg-Math.acos(Math.min(1,Math.abs(cos)))/r)<1e-10);
 }
});
check('不交束时整个周期严格无假脉冲',()=>{assert(pulseProfile(30,90,10).every(p=>p[1]===0));assert.equal(pulseDuty(30,90,10),0);});
check('双束半周交替；轴对齐恒定信号',()=>{assert.equal(pulsarSignal(90,90,12,0).intensity,1);assert.equal(pulsarSignal(90,90,12,.5).intensity,1);assert.equal(pulsarSignal(90,90,12,.25).intensity,0);assert(pulseProfile(0,0,10).every(p=>p[1]===1));assert.equal(pulseDuty(0,0,10),1);});
check('核心向内与外层向外独立，未成功分支无抛射',()=>{const a=collapseState(0),b=collapseState(1);assert(b.coreRadiusDisplay<a.coreRadiusDisplay);assert(b.shellRadiusDisplay>a.shellRadiusDisplay);assert.equal(collapseState(1,false).shellRadiusDisplay,2);assert.equal(collapseState(1,false).shockRadiusDisplay,0);});
check('太阳质量视界约2.953km，质量100倍视界100倍同r/rs潮汐1/10000',()=>{const a=compactScales(1),b=compactScales(100);assert(Math.abs(a.rsM/1000-2.95334)<.001);assert(Math.abs(b.rsM/a.rsM-100)<1e-12);assert(Math.abs(b.radialTidalAcceleration/a.radialTidalAcceleration-1e-4)<1e-15);});
check('弱场小物体差分与导数，核心引力能量量级',()=>{const s=compactScales(10,2,20);assert(Math.abs(s.exactNewtonianDifference/s.radialTidalAcceleration-1)<1e-8);const e=bindingEnergyScale(1.4,12);assert(e>4e46&&e<5e46);});
console.log(JSON.stringify({checks,status:'passed',model_visual_review:'pending',human_review:'pending',classroom_trial:'pending'},null,2));
