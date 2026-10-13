// SI 常数；波长参数用 nm，速度用 km/s。
export const H=6.62607015e-34, C=299792458, K=1.380649e-23, SIGMA=5.670374419e-8;
export const WIEN=2.897771955e6, RSUN=6.957e8, PC=3.085677581491367e16;
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function planck(nm,T){const l=nm*1e-9,x=H*C/(l*K*T);return x>700?0:2*H*C*C/(l**5*Math.expm1(x));}
export function peakNM(T){return WIEN/T;}
export function luminosity(radiusSolar,T){return 4*Math.PI*(radiusSolar*RSUN)**2*SIGMA*T**4;}
export function flux(L,dPc,A=0){return L/(4*Math.PI*(dPc*PC)**2)*10**(-.4*A);}
export function magnitudeDifference(f1,f2){return -2.5*Math.log10(f1/f2);}
export function distanceModulus(dPc,A=0){return 5*Math.log10(dPc/10)+A;}
export function shiftNM(lambda,vr){return lambda*(1+vr/(C/1000));}
export function airmass(height){return height>0?1/Math.sin(height*Math.PI/180):Infinity;}
export function throughput(height,k){return 10**(-.4*k*airmass(height));}
// s、b 是同一测量孔径的 e-/s；darkPerPixel 与 read 是每像素值。
export function snr({s,b,t,npix=9,frames=1,darkPerPixel=.02,read=3}){
  const signal=s*t, sourceVariance=signal, backgroundVariance=b*t,
    darkVariance=npix*darkPerPixel*t, readVariance=npix*frames*read**2;
  const variance=sourceVariance+backgroundVariance+darkVariance+readVariance;
  return {signal,sourceVariance,backgroundVariance,darkVariance,readVariance,variance,snr:variance>0?signal/Math.sqrt(variance):0};
}
export function rotationKernel(v,vmax,epsilon=.6){
  if(vmax<=0||Math.abs(v)>=vmax)return 0;
  const q=1-(v/vmax)**2;
  return (2*(1-epsilon)*Math.sqrt(q)+Math.PI*epsilon*q/2)/(Math.PI*vmax*(1-epsilon/3));
}
// 在局部速度坐标卷积。非旋转内禀线为高斯；固定积分核归一，等效宽度守恒。
export function lineProfile({vr=0,veq=60,inclination=90,epsilon=.6,resolution=40000,depth=.7,sigmaIntrinsic=4,lambda=656.28}={}){
  const vmax=veq*Math.sin(inclination*Math.PI/180), sigmaInstrument=(C/1000)/resolution/2.354820045,
    sigma=Math.hypot(sigmaIntrinsic,sigmaInstrument), N=161,
    kernel=Array.from({length:N},(_,j)=>{const v=-vmax+2*vmax*(j+.5)/N;return [v,rotationKernel(v,vmax,epsilon)];});
  const norm=kernel.reduce((a,p)=>a+p[1],0), span=600, step=1.5;
  const points=[],base=[];
  for(let v=-span;v<=span;v+=step){
    const intrinsic=depth*sigmaIntrinsic/sigma*Math.exp(-.5*((v-vr)/sigma)**2);
    const absorption=vmax<.01?intrinsic:kernel.reduce((s,[u,w])=>s+w*depth*sigmaIntrinsic/sigma*Math.exp(-.5*((v-vr-u)/sigma)**2),0)/norm;
    points.push([lambda*(1+v/(C/1000)),1-absorption]);
    base.push([lambda*(1+v/(C/1000)),1-intrinsic]);
  }
  return {points,base,vmax,centre:shiftNM(lambda,vr),sigmaInstrument,
    equivalentWidthVelocity:depth*sigmaIntrinsic*Math.sqrt(2*Math.PI)};
}
export function rng(seed=1){let a=seed>>>0;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function normal(random){return Math.sqrt(-2*Math.log(Math.max(1e-12,random())))*Math.cos(2*Math.PI*random());}
export function poisson(mean,random){
  if(mean<=0)return 0;
  if(mean<35){const end=Math.exp(-mean);let p=1,n=0;do{p*=random();n++;}while(p>end);return n-1;}
  // 大计数下高斯近似；页面和来源中明确这一限制。
  return Math.max(0,Math.round(mean+Math.sqrt(mean)*normal(random)));
}
