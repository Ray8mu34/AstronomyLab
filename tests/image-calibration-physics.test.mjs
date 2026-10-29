import test from 'node:test';
import assert from 'node:assert/strict';
import {CCD,SYNTHETIC_STARS,makeCalibrationFrame,calibrateFrame,aperturePhotometry,curveOfGrowth,poisson,randomStream} from '../web/observatory/modules/image-calibration-physics.mjs';
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
const rms=(a,b)=>Math.sqrt(mean(a.map((v,i)=>(v-b[i])**2)));
test('complete noiseless calibration recovers integrated scene plus sky at every pixel',()=>{
 for(const exposure of [10,60,240])for(const flatStrength of [0,.8]){
  const frame=makeCalibrationFrame({noise:false,exposure,flatStrength}),corrected=calibrateFrame(frame);
  for(let i=0;i<corrected.length;i++)assert(Math.abs(corrected[i]-(frame.source[i]+8)*exposure/2)<1e-9);
  assert(Math.abs(mean(frame.masterFlat)-1)<1e-13);
  assert(Math.abs(frame.source.reduce((s,v)=>s+v,0)-1120)<.001,'pixel integrals preserve total source rate');
 }
});
test('disabled correction steps expose the corresponding additive or multiplicative term',()=>{
 const f=makeCalibrationFrame({noise:false}),raw=calibrateFrame(f,{subtractBias:false,subtractDark:false,divideFlat:false});assert.deepEqual(raw,f.raw);
 const noBias=calibrateFrame(f,{subtractBias:false}),noDark=calibrateFrame(f,{subtractDark:false}),noFlat=calibrateFrame(f,{divideFlat:false});
 for(const i of [0,400,1803,2700]){
  assert(Math.abs(noBias[i]-f.ideal[i]-f.bias[i]/f.response[i])<1e-9);
  assert(Math.abs(noDark[i]-f.ideal[i]-f.dark[i]*f.exposure/(f.gain*f.response[i]))<1e-9);
  assert(Math.abs(noFlat[i]-f.ideal[i]*f.response[i])<1e-9);
 }
});
test('image sampling is deterministic and independent of display, aperture and master count',()=>{
 const a=makeCalibrationFrame(),b=makeCalibrationFrame({white:500,aperture:7,star:'b',masterFrames:64}),c=makeCalibrationFrame({seed:4730});
 assert.deepEqual(a.raw,b.raw);assert.notDeepEqual(a.raw,c.raw);assert.notDeepEqual(a.masterBias,b.masterBias);
 const one=makeCalibrationFrame({masterFrames:1}),many=makeCalibrationFrame({masterFrames:64});
 assert(Math.abs(rms(many.masterBias,many.bias)/rms(one.masterBias,one.bias)-1/8)<1e-12);
 assert(rms(many.masterFlat,many.response)<rms(one.masterFlat,one.response)/5);
});
test('Poisson samples reproduce mean and variance at small and high count rates',()=>{
 for(const lambda of [.2,12,30,1000]){const rng=randomStream(579),samples=Array.from({length:40000},()=>poisson(lambda,rng)),m=mean(samples),variance=mean(samples.map(x=>(x-m)**2));assert(Math.abs(m-lambda)<.04*Math.max(1,Math.sqrt(lambda)));assert(Math.abs(variance/lambda-1)<.05);assert(samples.every(n=>Number.isInteger(n)&&n>=0));}
});
test('area-weighted sky subtraction removes a uniform field for all apertures',()=>{
 const constant=new Float64Array(64*64).fill(713.25);
 for(const radius of [1,2.75,4,8]){const m=aperturePhotometry(constant,64,{x:23.5,y:31.5,radius});assert(Math.abs(m.net)<1e-9);assert(Math.abs(m.background-713.25)<1e-11);assert(Math.abs(m.area-Math.PI*radius**2)<.7);assert(Math.abs(m.skyArea-Math.PI*(14**2-10**2))<1.2);}
});
test('curve of growth approaches the source rate and is invariant under noiseless exposure scaling',()=>{
 for(const starKey of ['a','b']){
  const f=makeCalibrationFrame({noise:false,exposure:60}),g=makeCalibrationFrame({noise:false,exposure:240}),a=curveOfGrowth(f,calibrateFrame(f),starKey),b=curveOfGrowth(g,calibrateFrame(g),starKey);
  assert(a[0][1]<SYNTHETIC_STARS[starKey].rate*.2);assert(Math.abs(a.at(-1)[1]/SYNTHETIC_STARS[starKey].rate-1)<.002);
  for(let i=0;i<a.length;i++){assert(Math.abs(a[i][1]-b[i][1])<1e-8);if(i)assert(a[i][1]>=a[i-1][1]);}
 }
});
test('invalid physical inputs and invalid image geometry are rejected',()=>{
 for(const params of [{exposure:0},{sky:-1},{flatStrength:1},{masterFrames:1.5},{seed:NaN},{seed:0},{noise:'true'}])assert.throws(()=>makeCalibrationFrame(params));
 assert.throws(()=>aperturePhotometry(new Float64Array(4),64,{x:1,y:1,radius:2}));
 assert.throws(()=>aperturePhotometry(new Float64Array(4096),64,{x:10,y:10,radius:12}));
 const f=makeCalibrationFrame();f.masterFlat[2]=0;assert.throws(()=>calibrateFrame(f));
 assert.equal(CCD.gain,2);
});
