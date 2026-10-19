// Schematic composition and energy-source boundaries, never a radial MESA profile.
import {getGraphicStyle} from '../shared/presentation.js';
export function structureLayers(p,mass){
 if(p.eep<202)return {title:'主序前 · 引力收缩',core:'收缩中的内部',source:'尚未稳定核心氢聚变',shell:null,fraction:.38};
 if(p.eep<454)return {title:'主序 · 核心氢聚变',core:'富氢核心 → 氦增加',source:'能量主要来自核心氢聚变',shell:null,fraction:.38};
 if(p.eep<631)return {title:'离开主序 · 核心与包层分化',core:p.eep<605?'富氦核心 · 收缩':'氦点火 · 结构调整',source:p.eep<605?'核心氢耗尽后，氢壳层供能':'氦点火过渡，非稳定径向模型',shell:'氢聚变壳层',fraction:.17};
 if(p.eep<707)return {title:'核心氦聚变',core:'氦聚变 → 碳氧增加',source:'核心氦聚变，外有氢聚变壳层',shell:'氢聚变壳层',fraction:.24};
 if(mass>=8)return {title:'高级燃烧 · 模型止于碳燃烧末',core:'核心后续燃烧',source:'此处不绘制未读取的洋葱壳细节',shell:'外部燃烧壳层 · 概念',fraction:.2};
 if(p.eep<1409)return {title:'渐近巨星支 · 核心与双壳层',core:'碳氧核心',source:'氦、氢壳层供能；晚期失质量',shell:'内氦壳 / 外氢壳',fraction:.17};
 return {title:'后 AGB · 热核心与稀薄包层',core:'暴露的热核心',source:'所绘轨迹止于后 AGB，未接冷却轨道',shell:null,fraction:.65};
}
export function drawStructure(canvas,p,mass){
 const w=canvas.clientWidth||430,h=canvas.clientHeight||440,dpr=Math.min(devicePixelRatio||1,2),c=canvas.getContext('2d'),s=structureLayers(p,mass),style=getGraphicStyle(canvas);canvas.width=w*dpr;canvas.height=h*dpr;c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle=style.background;c.fillRect(0,0,w,h);
 const r=Math.min(w*.34,(h-175)/2),cx=w*.46,cy=r+35,cr=r*s.fraction;
 const disk=(radius,fill)=>{c.beginPath();c.arc(cx,cy,radius,0,Math.PI*2);c.fillStyle=fill;c.fill();};
 const g=c.createRadialGradient(cx-r*.4,cy-r*.4,r*.05,cx,cy,r);g.addColorStop(0,'#e4bd91');g.addColorStop(.6,'#b98962');g.addColorStop(1,'#4a3028');disk(r,g);
 // The right half is a flat section; the left shows the surface of the envelope.
 c.save();c.beginPath();c.rect(cx,cy-r,r,r*2);c.clip();disk(r,'#795e4b');
 c.strokeStyle='#b99471';c.lineWidth=1;c.beginPath();c.arc(cx,cy,r*.94,-Math.PI/2,Math.PI/2);c.stroke();
 c.strokeStyle='#e6b994';c.lineWidth=2;c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.stroke();
 if(s.shell){for(const rr of s.shell.startsWith('内氦')?[cr*1.15,cr*1.38]:[cr*1.2]){c.beginPath();c.arc(cx,cy,rr,0,Math.PI*2);c.strokeStyle='#ebc77e';c.lineWidth=4;c.stroke();}}
 disk(cr,'#ece0c0');c.strokeStyle='#fff3d1';c.lineWidth=1;c.beginPath();c.arc(cx,cy,cr,0,Math.PI*2);c.stroke();c.restore();
 c.strokeStyle='#dbb18a';c.beginPath();c.moveTo(cx,cy-r);c.lineTo(cx,cy+r);c.stroke();
 // Qualitative energy flow, separate from composition and from real radial scales.
 const sourceRadius=s.shell?cr*1.5:cr*.5;
 if(p.eep>=202&&p.eep<1409){for(const a of [-.55,.55]){const start=[cx+sourceRadius*Math.cos(a),cy+sourceRadius*Math.sin(a)],end=[cx+r*.8*Math.cos(a),cy+r*.8*Math.sin(a)];c.strokeStyle='#ebc77e';c.lineWidth=1.5;c.beginPath();c.moveTo(...start);c.lineTo(...end);c.stroke();c.beginPath();c.moveTo(...end);c.lineTo(end[0]-9*Math.cos(a-.5),end[1]-9*Math.sin(a-.5));c.moveTo(...end);c.lineTo(end[0]-9*Math.cos(a+.5),end[1]-9*Math.sin(a+.5));c.stroke();}}
 const txt=(str,y,col=style.text,size=style.tickSize)=>{c.font=`400 ${Math.max(13,size)}px ${style.fontFamily}`;c.textAlign='center';c.fillStyle=col;c.fillText(str,w/2,y);};
 txt('包层 · 外部气体',cy-r-20,'#e6b994');
 // Leader lines make the drawn boundaries explicit without inventing internal granulation.
 c.strokeStyle='#b9c7d0';c.lineWidth=1;c.beginPath();c.moveTo(cx+cr*.5,cy);c.lineTo(cx+cr*.5,cy+r+15);c.stroke();txt(s.core,cy+r+34,'#fff0ce',w<340?12:14);
 if(s.shell)txt(s.shell,cy+r+56,'#ebc77e',w<340?12:14);
 txt('左：表面　右：切面　箭头：能量外传',h-58,'#9bb0c2',w<340?10:12);
 txt('层的位置与厚度均为示意',h-36,'#9bb0c2',12);txt('圆大小不表示模型半径；无径向数据',h-16,'#9bb0c2',w<340?10:12);
 return s;
}
