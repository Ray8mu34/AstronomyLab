import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as P from '../../modules/light-physics.mjs';
import * as I from '../../modules/imaging-physics.mjs';
const near=(actual,expected,relative=1e-8)=>assert.ok(Math.abs(actual-expected)<=relative*Math.max(1,Math.abs(expected)),`${actual} ≠ ${expected}`);
const checks=[];
const check=(name,fn)=>{const details=fn();checks.push({name,state:'passed',details:details??null});};
check('Planck peak and independent wavelength integral agree with Wien and Stefan-Boltzmann',()=>{
 const details=[];
 for(const T of [3000,5800,10000,15000]){
  const peak=P.peakNM(T);assert.ok(P.planck(peak,T)>P.planck(peak*.999,T));assert.ok(P.planck(peak,T)>P.planck(peak*1.001,T));
  const lo=Math.log(1e-9),hi=Math.log(1e-3),N=10000,du=(hi-lo)/N;let area=0;
  for(let i=0;i<N;i++){const u=lo+(i+.5)*du,l=Math.exp(u);area+=Math.PI*P.planck(l*1e9,T)*l*du;}
  near(area/(P.SIGMA*T**4),1,2e-7);details.push({T,peakNM:peak,integralRatio:area/(P.SIGMA*T**4)});
 }return details;
});
check('Geometric flux, star power and magnitude ratios',()=>{
 const L=P.luminosity(1,5800);near(P.luminosity(2,5800)/L,4);near(P.luminosity(1,11600)/L,16);
 near(P.flux(L,100)/P.flux(L,10),.01);near(P.magnitudeDifference(P.flux(L,100),P.flux(L,10)),5);near(P.distanceModulus(10),0);near(P.distanceModulus(100,1),6);
 return {L,fluxAt10Pc:P.flux(L,10),extinctionFactor:P.flux(L,10,1)/P.flux(L,10)};
});
check('Doppler sign and reference test',()=>{near(P.shiftNM(656.28,100)-656.28,656.28*100/299792.458);assert.ok(P.shiftNM(656.28,-100)<656.28);return P.shiftNM(656.28,100);});
check('Rotational kernel normalized; inclination zero is unbroadened; equivalent width conserved',()=>{
 for(const eps of [0,.6,1]){let area=0;const N=100000,dv=200/N;for(let i=0;i<N;i++)area+=P.rotationKernel(-100+(i+.5)*dv,100,eps)*dv;near(area,1,1e-6);}
 for(const opt of [{veq:0},{veq:250,inclination:0},{veq:180,inclination:70,vr:170},{veq:250,vr:-200,resolution:5000}]){
  const profile=P.lineProfile(opt),dl=profile.points[1][0]-profile.points[0][0],area=profile.points.reduce((s,p)=>s+(1-p[1])*dl,0);
  near(area/profile.equivalentWidthVelocity*(299792.458/656.28),1,1e-4);
  if(opt.veq===0||opt.inclination===0)for(let i=0;i<profile.points.length;i++)near(profile.points[i][1],profile.base[i][1]);
 }return {normalization:'three limb coefficients',width:'four cases'};
});
check('Air column and aperture noise independent textbook examples',()=>{
 near(P.airmass(90),1);near(P.airmass(30),2);near(P.throughput(30,.2),10**(-.16));
 const a=P.snr({s:1,b:9,t:100,read:0,darkPerPixel:0}),b=P.snr({s:1,b:9,t:400,read:0,darkPerPixel:0});near(a.snr,100/Math.sqrt(1000));near(b.snr/a.snr,2);
 assert.ok(P.snr({s:1,b:9,t:100,frames:20}).snr<P.snr({s:1,b:9,t:100,frames:1}).snr);return {SNR100:a.snr,SNR400:b.snr};
});
check('Poisson low-count sample mean/variance; fixed seed reproducibility',()=>{
 const random=P.rng(91);let sum=0,sumsq=0;for(let i=0;i<100000;i++){const x=P.poisson(2,random);sum+=x;sumsq+=x*x;}const mean=sum/100000,variance=sumsq/100000-mean*mean;near(mean,2,.02);near(variance,2,.04);
 const a=P.rng(8),b=P.rng(8);for(let i=0;i<100;i++)near(a(),b());return {mean,variance};
});
check('Display stretches are bounded and monotonic; source arrays remain unchanged',()=>{
 for(const method of ['linear','asinh','log']){let previous=-1;for(let i=-20;i<=120;i++){const v=I.stretch(i/100,{method});assert.ok(v>=0&&v<=1&&v>=previous);previous=v;}near(I.stretch(0,{method}),0);near(I.stretch(1,{method}),1);}
 const a=Float32Array.from([0,.1,.2,.3]),old=Array.from(a);I.composite([a,a,a],2,{white:[1,1,1]});assert.deepEqual(Array.from(a),old);
});
check('Teaching exposures preserve linearity and subtract only background; clipping loses information',()=>{
 const rate=Float32Array.from([1,2,3]);const a=I.expose(rate,{exposure:100,background:4,noise:false,subtract:true}),b=I.expose(rate,{exposure:400,background:4,noise:false,subtract:true});
 assert.deepEqual(Array.from(a.values),[100,200,300]);assert.deepEqual(Array.from(b.values),[400,800,1200]);
 const clip=I.expose(rate,{exposure:100,background:0,noise:false,saturation:150});assert.deepEqual(Array.from(clip.values),[100,150,150]);assert.equal(clip.saturated,2);
});
check('Bilinear shift sign and pixel-space zero-offset identity',()=>{const a=Float32Array.from([1,2,3,4]);near(I.bilinear(a,2,.5,.5),2.5);assert.deepEqual(Array.from(I.shifted(a,2,0,0)),Array.from(a));assert.deepEqual(Array.from(I.shifted(a,2,1,0)),[0,1,0,3]);});
const base=new URL('../imaging/',import.meta.url),meta=JSON.parse(fs.readFileSync(new URL('m17-metadata.json',base)));
const sha=b=>createHash('sha256').update(b).digest('hex');
check('Three genuine FITS archives and linear arrays match recorded SHA and instrument headers',()=>{
 for(const ch of meta.channels){assert.equal(sha(fs.readFileSync(new URL(`raw/${ch.code}nmos.zip`,base))),ch.zip_sha256);assert.equal(sha(fs.readFileSync(new URL(`${ch.code}-linear.f32`,base))),ch.derived_sha256);assert.equal(ch.header.TELESCOP,'HST');assert.equal(ch.header.INSTRUME,'WFPC2');assert.equal(ch.header.FILTNAM1,`F${ch.code}N`);near(ch.mean_original,ch.mean_derived,2e-6);}
 return meta.channels.map(x=>({code:x.code,date:x.header['DATE-OBS'],EXPTIME:x.header.EXPTIME}));
});
const code_sha256={};for(const name of ['light.js','light-physics.mjs','imaging.js','imaging-physics.mjs'])code_sha256[name]=sha(fs.readFileSync(new URL('../../modules/'+name,import.meta.url)));
const report={checked_at:new Date().toISOString(),state:'passed',scope:'独立数值与真实输入文件检查；未替代浏览器/模型视觉/真人审校',checks,code_sha256,model_visual_review:'pending',human_review:'pending',classroom_trial:'pending'};
fs.writeFileSync(new URL('model-checks.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(`Light/imaging ${checks.length} independent checks passed`);
