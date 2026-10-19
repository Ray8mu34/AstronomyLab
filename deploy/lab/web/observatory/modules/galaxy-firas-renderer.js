import {plot} from '../shared/plot.js';
import {getGraphicStyle} from '../shared/presentation.js';
import {blackbodyGHz,relativeSpectrum} from './galaxy-physics.mjs';

// One aligned pair: only the analytic reference is sampled between release rows.
export function drawFirasPlate({spectrum,residual,differential,rows,frequency,delta}){
 const style=getGraphicStyle(spectrum),narrow=spectrum.clientWidth<520;
 const margins={left:narrow?58:72,right:narrow?18:24,top:18,bottom:42};
 const xTicks=narrow?[100,300,500,640]:[100,200,300,400,500,600];
 const common={xDomain:[60,640],margins,xTicks,showLegend:false,onFontReady:false};
 const reference=[];for(let n=60;n<=640;n+=2)reference.push([n,blackbodyGHz(n)]);
 const main=plot(spectrum,{...common,yDomain:[0,420],yTicks:narrow?[0,200,400]:[0,100,200,300,400],series:[{points:reference,color:style.accent,width:style.referenceWidth}]});
 const lower=plot(residual,{...common,margins:{...margins,bottom:56},yDomain:[-780,430],yTicks:[-700,-400,0,400],xLabel:'频率 / GHz',series:[{points:[[60,0],[640,0]],color:style.muted,width:style.lineWidth,dash:[5,4]}]});
 const selected=rows.reduce((best,row)=>Math.abs(row.frequencyGHz-frequency)<Math.abs(best.frequencyGHz-frequency)?row:best,rows[0]);
 const geometry=[];
 for(const row of rows){
  const mainPoint=main.toPixel(row.frequencyGHz,row.intensity),point=lower.toPixel(row.frequencyGHz,row.residual);
  const errorLow=lower.toPixel(row.frequencyGHz,row.residual-row.sigma),errorHigh=lower.toPixel(row.frequencyGHz,row.residual+row.sigma);
  const context=residual.getContext('2d');context.strokeStyle=style.text;context.lineWidth=style.lineWidth;
  context.beginPath();context.moveTo(...errorLow);context.lineTo(...errorHigh);context.moveTo(errorLow[0]-3,errorLow[1]);context.lineTo(errorLow[0]+3,errorLow[1]);context.moveTo(errorHigh[0]-3,errorHigh[1]);context.lineTo(errorHigh[0]+3,errorHigh[1]);context.stroke();
  // Draw complete circular marks after the shared frame so the high-frequency
  // endpoint and its caps remain visible even beside the right domain edge.
  for(const [canvas,position] of [[spectrum,mainPoint],[residual,point]]){
   const c=canvas.getContext('2d');c.fillStyle=style.text;c.beginPath();c.arc(...position,style.pointRadius,0,Math.PI*2);c.fill();
  }
  geometry.push({...row,mainPoint,residualPoint:point,errorLow,errorHigh});
 }
 for(const [canvas,frame] of [[spectrum,main],[residual,lower]]){
  const c=canvas.getContext('2d'),[x]=frame.toPixel(frequency,0),bounds=frame.bounds;
  c.save();c.strokeStyle=style.focus;c.lineWidth=style.lineWidth;c.setLineDash([4,4]);c.beginPath();c.moveTo(x,bounds.y);c.lineTo(x,bounds.y+bounds.height);c.stroke();c.restore();
 }
 if(differential.clientWidth&&differential.clientHeight){
  const points=[];for(let n=60;n<=640;n+=2)points.push([n,relativeSpectrum(n,delta)]);
  plot(differential,{...common,margins:{...margins,bottom:56},yDomain:[-900,900],yTicks:[-800,0,800],xLabel:'频率 / GHz',yLabel:'ΔBν / Bν · ppm',series:[{points,color:style.accent,width:style.referenceWidth},{points:[[frequency,-900],[frequency,900]],color:style.focus,width:style.lineWidth,dash:[4,4]}]});
 }
 return {main,lower,selected,geometry,domains:{frequency:[60,640],intensity:[0,420],residual:[-780,430]},marker:{frequency,mainX:main.toPixel(frequency,0)[0],residualX:lower.toPixel(frequency,0)[0]}};
}
