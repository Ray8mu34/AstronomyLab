// 本模块专用教学近似；未修改共享物理。能量响应矩形通带，无标准滤镜/星等零点。
import {planck,RSUN,PC} from './light-physics.mjs';
export const teachingBands=[{name:'S · 短波',lo:400,hi:500},{name:'L · 长波',lo:600,hi:700}];
// 人工选择的光学消光幂律，仅在本演示350—850 nm使用，非实测银河消光定律。
export const teachingExtinction=(nm,A550,power=1.3)=>A550*(nm/550)**(-power);
export function energyDensity(nm,{temperature=5800,radius=1,distance=10,extinction=0,dustPower=1.3}={}){
 return Math.PI*planck(nm,temperature)*(radius*RSUN/(distance*PC))**2*1e-9*10**(-.4*teachingExtinction(nm,extinction,dustPower));
}
export function bandEnergy(state,lo,hi,step=.5){
 const n=Math.ceil((hi-lo)/step),dx=(hi-lo)/n;let sum=0;
 for(let i=0;i<=n;i++)sum+=(i===0||i===n?.5:1)*energyDensity(lo+i*dx,state);
 return sum*dx;
}
export function teachingPhotometry(state){
 const bands=teachingBands.map(b=>({...b,flux:bandEnergy(state,b.lo,b.hi)}));
 const ratio=bands[0].flux/bands[1].flux;
 return {bands,ratio,index:-2.5*Math.log10(ratio),definition:'C=-2.5 log10(FS/FL); equal energy reference; not calibrated B−V'};
}
