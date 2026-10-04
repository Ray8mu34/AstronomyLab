import {clamp,rng,normal,poisson} from './light-physics.mjs';
export function stretch(value,{black=0,white=1,method='asinh',strength=10}={}){
 const x=clamp((value-black)/Math.max(1e-9,white-black),0,1);
 if(method==='log')return Math.log1p(strength*x)/Math.log1p(strength);
 if(method==='asinh')return Math.asinh(strength*x)/Math.asinh(strength);
 return x;
}
export function bilinear(array,n,x,y){
 if(x<0||y<0||x>n-1||y>n-1)return 0;
 const a=Math.floor(x),b=Math.floor(y),dx=x-a,dy=y-b,c=Math.min(a+1,n-1),d=Math.min(b+1,n-1);
 return array[b*n+a]*(1-dx)*(1-dy)+array[b*n+c]*dx*(1-dy)+array[d*n+a]*(1-dx)*dy+array[d*n+c]*dx*dy;
}
export function shifted(array,n,dx,dy){const out=new Float32Array(n*n);for(let y=0;y<n;y++)for(let x=0;x<n;x++)out[y*n+x]=bilinear(array,n,x-dx,y-dy);return out;}
export function teachingChannels(n=160){
 const arrays=[new Float32Array(n*n),new Float32Array(n*n),new Float32Array(n*n)];
 const stars=[[.23,.32,15],[.74,.28,20],[.60,.66,14],[.34,.74,8],[.83,.61,7],[.46,.18,9]];
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const u=x/(n-1),v=y/(n-1),r=Math.hypot((u-.48)*1.1,v-.51),a=Math.atan2(v-.51,u-.48),
   ring=Math.exp(-(((r-.23)/.038)**2)),core=Math.exp(-r*r/.024),wisps=.3+.7*Math.sin(a*5+r*31)**2,
   knot=Math.exp(-((u-.61)**2+(v-.36)**2)/.0035),dust=1-.8*Math.exp(-(((v-.62+.18*Math.sin(u*6))/.035)**2));
  let st=0;for(const [sx,sy,amp]of stars)st+=amp*Math.exp(-((u-sx)**2+(v-sy)**2)/.00007);
  arrays[0][y*n+x]=Math.max(0,(.9*ring*wisps+.5*core+.2*knot)*dust+st*.8); // [S II] 教学假想
  arrays[1][y*n+x]=Math.max(0,(1.1*ring+.9*core+.8*knot)*dust+st); // Hα 教学假想
  arrays[2][y*n+x]=Math.max(0,(1.6*core+.4*ring*(1+Math.cos(a))+.2*knot)*dust+st*.9); // [O III] 教学假想
 }
 return arrays;
}
// 所有像素在本示例中用e-/s。每通道同一曝光，不模拟真实M17噪声。
export function expose(rate,{exposure=100,background=.8,read=3,frames=1,seed=1,noise=true,subtract=true,saturation=10000}={}){
 const random=rng(seed),out=new Float32Array(rate.length);let saturated=0;
 for(let i=0;i<rate.length;i++){
  const source=rate[i]*exposure,bg=background*exposure;
  let value=noise?poisson(source+bg,random)+read*Math.sqrt(frames)*normal(random):source+bg;
  // 总计数封顶模拟丢失线性；这不是分帧真实满阱的详细实现。
  if(value>=saturation){saturated++;value=saturation;}
  out[i]=value-(subtract?bg:0);
 }
 return {values:out,saturated};
}
export const mappings={SHO:[0,1,2],HSO:[1,0,2],HOO:[1,2,2]};
export function composite(channels,n,{mapping='SHO',gains=[1,1,1],white=[1,1,1],method='asinh',strength=10,black=0,displayWhite=1,dx=0,dy=0,registered=true}={}){
 const map=mappings[mapping]||mappings.SHO,out=new Uint8ClampedArray(n*n*4);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const i=y*n+x;
  for(let c=0;c<3;c++){
   const channel=map[c],offX=channel===1&&!registered?dx:0,offY=channel===2&&!registered?dy:0,
    value=bilinear(channels[channel],n,x-offX,y-offY)/white[channel]*gains[channel];
   out[i*4+c]=Math.round(255*stretch(value,{black,white:displayWhite,method,strength}));
  }out[i*4+3]=255;
 }
 return out;
}
export function percentile(array,p=.995){const values=Array.from(array).filter(x=>Number.isFinite(x)&&x>0).sort((a,b)=>a-b);return values.length?values[Math.min(values.length-1,Math.floor(values.length*p))]:1;}
