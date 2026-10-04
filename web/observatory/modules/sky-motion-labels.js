// Screen-size labels with leaders to actual 3D reference points.
// No change to the scene's positions, angles or physical scale.
import {THREE} from '../shared/lab.js';
export function makeMotionLabels(host,camera,specs){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
 svg.classList.add('sky-motion-labels');svg.setAttribute('aria-hidden','true');host.append(svg);
 const nodes=Array.from({length:4},()=>{const g=document.createElementNS(ns,'g'),line=document.createElementNS(ns,'line'),text=document.createElementNS(ns,'text');g.append(line,text);svg.append(g);return {g,line,text};});
 return {hide(){svg.style.display='none';},update(){
  const w=host.clientWidth,h=host.clientHeight,list=specs(w);
  svg.style.display=list.length?'block':'none';if(!list.length||!w||!h)return;
  svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
  list.forEach((s,i)=>{const {g,line,text}=nodes[i],p=new THREE.Vector3().copy(s.point).project(camera);
   g.style.display='';g.dataset.reference=s.key;text.textContent=s.text;text.setAttribute('fill',s.color);line.setAttribute('stroke',s.color);
   const tw=s.text.length*13,x=s.side==='right'?Math.max(8,w-tw-8):8,y=s.row==='top'?18:s.row==='upper'?41:s.row==='lower'?h-31:h-10;
   text.setAttribute('x',x);text.setAttribute('y',y);
   const ax=Math.max(3,Math.min(w-3,(p.x+1)*w/2)),ay=Math.max(3,Math.min(h-3,(1-p.y)*h/2));
   line.setAttribute('x1',ax);line.setAttribute('y1',ay);line.setAttribute('x2',s.side==='right'?x:x+tw);line.setAttribute('y2',y-4);
   g.dataset.targetX=String((p.x+1)*w/2);g.dataset.targetY=String((1-p.y)*h/2);
  });
  for(let i=list.length;i<nodes.length;i++)nodes[i].g.style.display='none';
 },dispose(){svg.remove();}};
}
