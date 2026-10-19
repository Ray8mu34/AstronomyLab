import {getGraphicStyle,observeGraphicFonts} from './presentation.js';
// Canvas presentation only. Data, domains, logarithms and axis direction belong to callers.
const lastOptions=new WeakMap();
function ticks(domain,logarithmic,count){
 const lo=Math.min(...domain),hi=Math.max(...domain);if(!(hi>lo))return [lo];
 if(logarithmic){
  const values=[];for(let decade=Math.floor(Math.log10(lo));decade<=Math.ceil(Math.log10(hi));decade++)for(const m of [1,2,5]){const value=m*10**decade;if(value>=lo&&value<=hi)values.push(value);}
  const powers=values.filter(v=>Math.abs(Math.log10(v)-Math.round(Math.log10(v)))<1e-10);
  return values.length>count*1.8&&powers.length>=2?powers:values;
 }
 const rough=(hi-lo)/Math.max(1,count-1),power=10**Math.floor(Math.log10(rough)),multiple=rough/power;
 const step=([1,2,5,10].find(value=>value>=multiple)||10)*power,values=[];
 for(let i=Math.ceil(lo/step-1e-12);i*step<=hi+step*1e-10;i++){const value=Number((i*step).toPrecision(12));if(value>=lo&&value<=hi)values.push(value);if(values.length>100)break;}
 return values.length?values:[lo,hi];
}
const number=value=>Math.abs(value)>=1e5||Math.abs(value)<.001&&value!==0?value.toExponential(1):Number(value.toPrecision(4)).toString();
export function plot(canvas,options={}){
 // A plot may be only the first layer of a complete scientific figure. Never
 // replay it alone after fonts load: that would erase caller-owned marks.
 if(!lastOptions.has(canvas))observeGraphicFonts(canvas,()=>{const latest=lastOptions.get(canvas);if(typeof latest?.onFontReady==='function')latest.onFontReady();});
 lastOptions.set(canvas,options);
 const {series=[],xDomain=[0,1],yDomain=[0,1],xLabel='',yLabel='',logX=false,logY=false,xFormat=number,yFormat=number,xTicks,yTicks,showLegend=true,margins={}}=options;
 const width=canvas.clientWidth||600,height=canvas.clientHeight||260,win=canvas.ownerDocument.defaultView,dpr=Math.min(win.devicePixelRatio||1,2);
 canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
 const c=canvas.getContext('2d'),style=getGraphicStyle(canvas);c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle=style.background;c.fillRect(0,0,width,height);
 c.font=style.tickFont;
 const labels=showLegend?series.filter(s=>s.label):[],legendRows=[];let row=[],rowWidth=0;
 for(const s of labels){const itemWidth=c.measureText(s.label).width+40;if(row.length&&rowWidth+itemWidth>width-95){legendRows.push(row);row=[];rowWidth=0;}row.push(s);rowWidth+=itemWidth;}if(row.length)legendRows.push(row);
 const left=margins.left??(width<400?64:78),right=margins.right??22,top=margins.top??(30+legendRows.length*(style.tickSize+8)),bottom=margins.bottom??58;
 const bounds={x:left,y:top,width:Math.max(1,width-left-right),height:Math.max(1,height-top-bottom)};
 const tx=v=>logX?Math.log10(v):v,ty=v=>logY?Math.log10(v):v,xd=xDomain.map(tx),yd=yDomain.map(ty);
 const toPixel=(x,y)=>[left+(tx(x)-xd[0])/(xd[1]-xd[0])*bounds.width,height-bottom-(ty(y)-yd[0])/(yd[1]-yd[0])*bounds.height];
 const valid=(v,domain,log)=>Number.isFinite(v)&&(!log||v>0)&&v>=Math.min(...domain)&&v<=Math.max(...domain);
 const xs=(xTicks||ticks(xDomain,logX,Math.max(3,Math.floor(bounds.width/95)))).filter(v=>valid(v,xDomain,logX));
 const ys=(yTicks||ticks(yDomain,logY,Math.max(3,Math.floor(bounds.height/55)))).filter(v=>valid(v,yDomain,logY));
 c.lineWidth=1;c.strokeStyle=style.grid;c.fillStyle=style.muted;c.textBaseline='middle';
 for(const value of xs){const [x]=toPixel(value,yDomain[0]);c.beginPath();c.moveTo(x,top);c.lineTo(x,height-bottom);c.stroke();c.textAlign='center';c.fillText(xFormat(value),x,height-bottom+21);}
 for(const value of ys){const [,y]=toPixel(xDomain[0],value);c.beginPath();c.moveTo(left,y);c.lineTo(width-right,y);c.stroke();c.textAlign='right';c.fillText(yFormat(value),left-10,y);}
 c.save();c.beginPath();c.rect(bounds.x,bounds.y,bounds.width,bounds.height);c.clip();
 for(const s of series){
  c.strokeStyle=s.color||style.accent;c.lineWidth=s.width??style.lineWidth;c.setLineDash(s.dash||[]);
  if(s.connect!==false){c.beginPath();let active=false;for(const p of s.points||[]){if(!Number.isFinite(p[0])||!Number.isFinite(p[1])||logX&&p[0]<=0||logY&&p[1]<=0){active=false;continue;}const [x,y]=toPixel(...p);active?c.lineTo(x,y):c.moveTo(x,y);active=true;}c.stroke();}
  if(s.dots||s.connect===false){c.fillStyle=s.color||style.accent;for(const p of s.points||[]){if(!Number.isFinite(p[0])||!Number.isFinite(p[1])||logX&&p[0]<=0||logY&&p[1]<=0)continue;const [x,y]=toPixel(...p);c.beginPath();c.arc(x,y,s.radius??style.pointRadius,0,Math.PI*2);c.fill();}}
 }
 c.restore();c.setLineDash([]);c.fillStyle=style.text;c.font=style.labelFont;c.textBaseline='alphabetic';c.textAlign='center';c.fillText(xLabel,left+bounds.width/2,height-10);c.textAlign='left';c.fillText(yLabel,left,18);
 c.font=style.tickFont;let ly=39;for(const items of legendRows){let lx=left;for(const s of items){c.strokeStyle=s.color||style.accent;c.fillStyle=s.color||style.accent;c.lineWidth=s.width??style.lineWidth;c.setLineDash(s.dash||[]);c.beginPath();c.moveTo(lx,ly-5);c.lineTo(lx+17,ly-5);c.stroke();c.fillText(s.label,lx+23,ly);lx+=c.measureText(s.label).width+40;}ly+=style.tickSize+8;}c.setLineDash([]);
 return {width,height,toPixel,bounds,style,xTicks:xs,yTicks:ys};
}
