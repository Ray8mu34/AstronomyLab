// 解析教学模型，距离 kpc；与真实星表、旋臂拟合和像素温度测量分开。
export const PC=3.085677581491367e16;
export const C=299792458, H=6.62607015e-34, K=1.380649e-23;
export const R0=8, T0=2.725;
export const rad=x=>x*Math.PI/180;
export function direction(l,b){l=rad(l);b=rad(b);return[-Math.cos(b)*Math.cos(l),Math.sin(b),Math.cos(b)*Math.sin(l)];}
export function stellarDensity(x,y,z){const r=Math.hypot(x,z);return Math.exp(-r/3.2)*Math.exp(-Math.abs(y)/.32)+2.5*Math.exp(-(x*x+z*z)/3.5-y*y/1.2);}
export function dustDensity(x,y,z){return Math.exp(-Math.hypot(x,z)/4)*Math.exp(-Math.abs(y)/.1);}
export function sightline(l,b,{height=.025,dust=1,infrared=false,steps=180,max=40}={}){
 const d=direction(l,b),ds=max/steps;let tau=0,total=0,unobscured=0;
 for(let i=0;i<steps;i++){const s=(i+.5)*ds,x=R0+d[0]*s,y=height+d[1]*s,z=d[2]*s,j=stellarDensity(x,y,z);const dt=dust*dustDensity(x,y,z)*ds*(infrared?.12:1);total+=j*Math.exp(-(tau+dt/2))*ds;unobscured+=j*ds;tau+=dt;}
 return {intensity:total,unobscured,tau,transmission:Math.exp(-tau),direction:d};
}
export function blackbodyGHz(nuGHz,T=T0){if(T<=0||nuGHz<=0)return 0;const n=nuGHz*1e9;return 2*H*n*n*n/(C*C*Math.expm1(H*n/(K*T)))/1e-20;}// MJy/sr
export function relativeSpectrum(nuGHz,deltaMicroK){return (blackbodyGHz(nuGHz,T0+deltaMicroK*1e-6)/blackbodyGHz(nuGHz,T0)-1)*1e6;}
export function orbitPeriodMyr(rKpc=R0,vKmS=220){return 2*Math.PI*rKpc*1000*PC/(vKmS*1000)/(365.25*86400*1e6);}
export function enclosedSolarMass(rKpc=R0,vKmS=220){return (vKmS*1000)**2*rKpc*1000*PC/6.67430e-11/1.98847e30;}
// Mollweide 投影：l 向左增加，原图中心银心，b 向上；返回 [0,1]。
export function mollweideUV(l,b){const lat=rad(b);let theta=lat; if(Math.abs(lat)>=Math.PI/2-1e-12)theta=Math.sign(lat)*Math.PI/2;else for(let i=0;i<20;i++){const f=2*theta+Math.sin(2*theta)-Math.PI*Math.sin(lat);const den=2+2*Math.cos(2*theta);const d=f/den;theta-=d;if(Math.abs(d)<1e-12)break;}return[.5-rad(l)*Math.cos(theta)/(2*Math.PI),.5-Math.sin(theta)/2];}
export function inverseMollweide(u,v){const sy=1-2*v;if(Math.abs(sy)>1)return null;const theta=Math.asin(sy),ct=Math.cos(theta),x=1-2*u;if(x*x+sy*sy>1+1e-10)return null;const b=Math.asin(Math.max(-1,Math.min(1,(2*theta+Math.sin(2*theta))/Math.PI)));const l=ct>1e-10?Math.PI*x/ct:0;return {l:l*180/Math.PI,b:b*180/Math.PI};}
export function equirectangularUV(l,b){return[.5-l/360,.5-b/180];}
export function inverseEquirectangular(u,v){if(u<0||u>1||v<0||v>1)return null;return{l:(.5-u)*360,b:(.5-v)*180};}
export function parseFiras(txt){return txt.split(/\r?\n/).filter(s=>s.trim()&&!s.trim().startsWith('#')).map(s=>{const a=s.trim().split(/\s+/).map(Number);return{frequencyGHz:a[0]*C/1e7,intensity:a[1],residual:a[2],sigma:a[3],galaxy:a[4]};});}
