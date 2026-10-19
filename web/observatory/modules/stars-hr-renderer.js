import {hrPosition,hrRadius,hrExamples,hrComparison,hrDomain} from './stars-hr.mjs';
import {getGraphicStyle} from '../shared/presentation.js';
const ink='#d5e1ea',muted='#9bb0c2',gold='#ebc77e',teal='#71c8c7';
export function drawHR(canvas,{example='sun',comparison='none',tracks=[],current=null,baseline=null,presentation=false}={}){
 const style=presentation?getGraphicStyle(canvas):null,labels=[];
 const w=canvas.clientWidth||900,h=canvas.clientHeight||500,dpr=Math.min(devicePixelRatio||1,2),small=w<500;
 canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle=style?.background||'#0b1420';c.fillRect(0,0,w,h);
 const box={left:presentation?(small?52:76):(small?48:72),right:w-(small?24:30),top:presentation?48:45,bottom:h-(presentation?70:66)},pw=box.right-box.left,ph=box.bottom-box.top;
 const domain=tracks.length?{...hrDomain,temperature:[200000,2500]}:hrDomain;
 const pixel=(t,l)=>{const p=hrPosition(t,l,domain);return [box.left+p.x*pw,box.top+p.y*ph];};
 const text=(s,x,y,color=style?.muted||muted,align='left',size=style?.tickSize||(small?12:14),numeric=false)=>{c.fillStyle=color;c.textAlign=align;c.font=style?`400 ${size}px ${numeric?style.numericFamily:style.fontFamily}`:`${size}px "Microsoft YaHei",sans-serif`;c.fillText(s,x,y);return c.measureText(s).width;};
 text('光度 / L☉ · 向上更亮',box.left,22,ink);text('表面有效温度 / K · 向右更冷 →',w/2,h-14,ink,'center',style?.tickSize||(small?12:14));
 c.strokeStyle=style?.grid||'#263747';c.lineWidth=style?.referenceWidth||1;
 for(let log=-4;log<=6;log+=2){const [,y]=pixel(5772,10**log);c.beginPath();c.moveTo(box.left,y);c.lineTo(box.right,y);c.stroke();text(({'-4':presentation?'10⁻⁴':'0.0001','-2':presentation?'10⁻²':'0.01','0':'1','2':'100','4':'10⁴','6':'10⁶'})[log],box.left-8,y+4,muted,'right',style?.tickSize||(small?12:14),presentation);}
 const ticks=tracks.length?(small?[200000,20000,2500]:[200000,40000,10000,5772,2500]):small?[40000,10000,2500]:[40000,20000,10000,5772,2500];
 for(const t of ticks){const [x]=pixel(t,1);c.beginPath();c.moveTo(x,box.top);c.lineTo(x,box.bottom);c.stroke();text(t.toLocaleString('en-US'),x,box.bottom+22,muted,'center',style?.tickSize||(small?12:14),presentation);}
 c.save();c.beginPath();c.rect(box.left,box.top,pw,ph);c.clip();
 const regions=[];
 const polygon=(id,points,color)=>{const vertices=points.map(([t,l])=>pixel(t,l));regions.push({id,vertices});c.beginPath();vertices.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color+'1d';c.fill();c.strokeStyle=color+'75';c.stroke();};
 polygon('hot',[[38000,1e6],[25000,20000],[12000,200],[5772,2],[3200,.04],[2600,.0006],[2900,.00015],[3200,.005],[5772,.5],[12000,50],[25000,5000]],teal);
 polygon('giant',[[6500,25],[5200,15],[2800,60],[2800,1500],[4500,700],[6500,100]],'#eaa47a');
 polygon('supergiant',[[37000,8000],[2500,15000],[2500,600000],[37000,800000]],gold);
 polygon('dwarf',[[35000,.15],[8000,.0002],[6500,.00012],[10000,.001],[35000,1]],'#8aa9ef');
 const label=(s,t,l,color)=>{const [x,y]=pixel(t,l),size=style?.labelSize||(small?12:16),width=text(s,x,y,color,'center',size);labels.push({text:s,left:x-width/2,top:y-size,width,height:size+5,right:x+width/2,bottom:y+5});};
 label(small?'①主序':'① 主序带',small?8500:10000,small?1.5:4,teal);label(small?'②巨星':'② 巨星',3700,200,'#efb28e');label(small?'③超巨星':'③ 超巨星 · 有冷有热',small?6500:10000,1e5,gold);label(small?'④白矮星':'④ 白矮星',15000,.001,'#a9bef5');
 for(const tr of tracks){c.beginPath();c.strokeStyle=tr.color||'#8fa2b5';c.lineWidth=2;tr.points.forEach(([t,l],i)=>{const [x,y]=pixel(t,l);i?c.lineTo(x,y):c.moveTo(x,y);});c.stroke();}
 c.restore();
 const chosen=hrExamples.find(x=>x.id===example)||hrExamples[0],points=current?[current]:hrComparison(comparison,chosen),hits=[];
 // Only selected illustrative points are plotted. Region density is not fabricated.
 for(const e of hrExamples){const [x,y]=pixel(e.temperature,e.luminosity);hits.push({id:e.id,x,y});if(!current&&comparison==='none'){c.beginPath();c.arc(x,y,e.id==='sun'?4:3,0,Math.PI*2);c.fillStyle=e.id==='sun'?gold:'#b6c4d0';c.fill();}}
 const [sx,sy]=pixel(5772,1);if(!current){text('☉',sx+10,sy+17,gold,'left',16);}
 if(baseline){const [x,y]=pixel(baseline.temperature,baseline.luminosity);c.strokeStyle='#8aa9ef';c.strokeRect(x-5,y-5,10,10);}
 for(const [i,p] of points.entries()){const [x,y]=pixel(p.temperature,p.luminosity),color=i?teal:gold;
  c.save();c.beginPath();c.rect(box.left,box.top,pw,ph);c.clip();c.setLineDash([4,5]);c.strokeStyle=color+'70';c.beginPath();c.moveTo(x,box.bottom);c.lineTo(x,y);c.lineTo(box.left,y);c.stroke();c.restore();
  c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.arc(x,y,8,0,Math.PI*2);c.stroke();c.beginPath();c.arc(x,y,4,0,Math.PI*2);c.fillStyle=color;c.fill();
  if(comparison!=='none'&&!current){let dx=12,dy=-10;if(presentation){const size=style.tickSize,candidates=[[12,-12],[-22,-12],[12,26],[-22,26]];let best=Infinity;for(const[a,b]of candidates){const r={left:x+a-3,right:x+a+size+3,top:y+b-size-3,bottom:y+b+5},score=labels.reduce((n,l)=>n+Math.max(0,Math.min(r.right,l.right)-Math.max(r.left,l.left))*Math.max(0,Math.min(r.bottom,l.bottom)-Math.max(r.top,l.top)),0);if(score<best){best=score;dx=a;dy=b;}}}text(i?'B':'A',x+dx,y+dy,color);}
 }
 canvas.dataset.axisTemperature='decreasing';canvas.dataset.axisLuminosity='increasing-up';
 canvas.dataset.hrPlotBox=JSON.stringify(box);
 const pick=(x,y)=>{const near=hits.map(p=>({...p,d:(p.x-x)**2+(p.y-y)**2})).sort((a,b)=>a.d-b.d)[0];if(near.d<1600)return near.id;
  for(const region of [...regions].reverse()){let inside=false;const vs=region.vertices;for(let i=0,j=vs.length-1;i<vs.length;j=i++){const [a,b]=vs[i],[u,v]=vs[j];if((b>y)!==(v>y)&&x<(u-a)*(y-b)/(v-b)+a)inside=!inside;}if(inside)return region.id;}return null;};
 return {pixel,hits,box,pick,labels,points:points.map(p=>({...p,radius:hrRadius(p.temperature,p.luminosity)}))};
}
