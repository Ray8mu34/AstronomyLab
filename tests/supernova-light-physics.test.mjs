import test from 'node:test';
import assert from 'node:assert/strict';
import {SN_CONSTANTS as C,SN_DEFAULTS as defaults,decayChain,radioactiveHeating,diffusionTime,integrateDiffusion,supernovaModel,validateSupernovaParameters} from '../web/observatory/modules/supernova-light-physics.mjs';
const close=(a,b,tol=1e-8)=>assert(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('decay chain conserves nuclei and matches independent Bateman solutions',()=>{
 assert.deepEqual(decayChain(0),{nickel:1,cobalt:0,iron:0});
 for(const t of [1e-8,.1,6.0799,20,70,120,1000]){const p=decayChain(t);close(p.nickel+p.cobalt+p.iron,1,1e-14);close(p.cobalt,C.tauCo/(C.tauCo-C.tauNi)*(Math.exp(-t/C.tauCo)-Math.exp(-t/C.tauNi)),1e-13);assert(Object.values(p).every(x=>x>=0&&x<=1));}
 close(decayChain(C.tauNi*Math.log(2)).nickel,.5,1e-14);close(decayChain(1e5).iron,1,1e-14);
});
test('heating integral differentiates to the supplied power and stays finite at zero',()=>{
 assert.equal(radioactiveHeating(0,.6).cobalt,0);assert.equal(radioactiveHeating(0,.6).deposited,0);
 for(const t of [.1,1,20,120]){const h=1e-4,d=(radioactiveHeating(t+h,.6).deposited-radioactiveHeating(t-h,.6).deposited)/(2*h)*1e6/C.day;close(d,radioactiveHeating(t,.6).total,1e-8);}
});
test('constant heating has the independent analytic diffusion solution',()=>{
 const tau=14,Q=3,model=integrateDiffusion(()=>Q,tau);
 for(const t of [.1,2,14,30,120])close(model.at(t).luminosity,Q*(-Math.expm1(-((t/tau)**2))),1e-9);
});
test('mass, opacity and velocity set the square-root timescale',()=>{
 const t=diffusionTime(defaults);close(diffusionTime({...defaults,ejectaMass:2.8})/t,Math.SQRT2,1e-14);close(diffusionTime({...defaults,opacity:.2})/t,Math.SQRT2,1e-14);close(diffusionTime({...defaults,velocity:20000})/t,1/Math.SQRT2,1e-14);
});
test('stored, radiated and expansion energies agree with independent work quadrature',()=>{
 const m=supernovaModel(defaults);let work=0;
 for(let i=1;i<m.samples.length;i++){const a=m.samples[i-1],b=m.samples[i];work+=(a.workPower+b.workPower)*(b.time-a.time)*C.day/2e6;assert(b.expansion>=a.expansion-1e-9);}
 const last=m.at(120);close(work,last.expansion,3e-6);close(last.deposited,last.stored+last.escaped+last.expansion,1e-12);
 const t=18,h=.002,a=m.at(t-h),b=m.at(t+h),r=m.at(t);close((b.stored-a.stored)/(2*h)*1e6/C.day,r.heating-r.luminosity-r.workPower,1e-6);
});
test('diffusion delays the peak, while nickel mass rescales luminosity',()=>{
 const a=supernovaModel(defaults),b=supernovaModel({...defaults,opacity:.2}),half=supernovaModel({...defaults,nickelMass:.3});assert(a.peak.time>5);assert(b.peak.time>a.peak.time);assert(b.peak.luminosity<a.peak.luminosity);close(a.peak.luminosity,a.peak.heating,.002);
 for(const t of [1,18,80,120]){close(half.at(t).luminosity/a.at(t).luminosity,.5,1e-12);close(half.at(t).stored/a.at(t).stored,.5,1e-12);}
});
test('allowed parameter extremes converge and reject corrupt inputs',()=>{
 for(const s of [{...defaults,nickelMass:1,ejectaMass:1,opacity:.03,velocity:20000},{...defaults,ejectaMass:5,opacity:.2,velocity:5000}]){const a=supernovaModel(s),b=supernovaModel(s,{step:.0125});for(const t of [.1,1,18,90,120]){close(a.at(t).luminosity,b.at(t).luminosity,1e-7);assert(a.at(t).stored>=0);assert(a.at(t).expansion>=0);}}
 for(const bad of [{day:121},{opacity:0},{velocity:Infinity},{nickelMass:NaN},{ejectaMass:.5}])assert.throws(()=>validateSupernovaParameters({...defaults,...bad}),RangeError);
});
