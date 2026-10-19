import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {lineProfile,clamp} from '../web/observatory/modules/light-physics.mjs';

// Execute the actual disk renderer; the LOS/sign oracle is independent of its
// color implementation. Do not replace this with a replica renderer.
const source=fs.readFileSync(new URL('../web/observatory/modules/light.js',import.meta.url),'utf8');
const start=source.indexOf('function disk(){'),end=source.indexOf('\n function metrics(',start);
assert(start>=0&&end>start,'Production disk renderer must be located');
const renderer=source.slice(start,end);
const cases=[['stationary rotating',0,120,90],['whole disk receding',150,120,90],['whole disk approaching',-150,120,90],['pole-on stationary',0,250,0],['positive UI boundary',250,250,90],['negative UI boundary',-250,250,90]];

for(const[name,vr,veq,inclination]of cases)test(`Observer-frame velocity colors: ${name}`,()=>{
 const state={vr,veq,inclination,epsilon:.6,resolution:40000},result=lineProfile(state),pixels=[],labels=[];
 const ctx={fillStyle:'',strokeStyle:'',fillRect(x,y,w,h){pixels.push({x,y,color:this.fillStyle});},fillText(text){labels.push(text);},beginPath(){},moveTo(){},lineTo(){},stroke(){}};
 vm.runInNewContext(renderer+';disk();',{state,result,P:{clamp},f:(x,n=2)=>Number(x).toFixed(n),auxBase:()=>({ctx,w:600,h:220,style:{text:'#f2f4f4'}})});
 assert(pixels.length>4000,'Exercise the full disk, not one selected pixel');
 const radius=220*.34,projected=veq*Math.sin(inclination*Math.PI/180);
 let negative=0,positive=0;
 for(const p of pixels){
  const [red,,blue]=p.color.match(/\d+/g).map(Number);
  const los=vr+(p.x-300)/radius*projected;
  if(los>1e-10){assert(red>=blue,`Positive ${los} km/s painted blue at ${p.x},${p.y}`);positive++;}
  else if(los< -1e-10){assert(blue>=red,`Negative ${los} km/s painted red at ${p.x},${p.y}`);negative++;}
  else assert.equal(red,blue,'Zero LOS must have neutral color');
 }
 if(vr===150){assert.equal(negative,0);assert(positive>4000);}
 if(vr===-150){assert.equal(positive,0);assert(negative>4000);}
 if(vr===0&&inclination===90){assert(negative>2000);assert(positive>2000);}
 const formatted=v=>`${v>0?'+':''}${v.toFixed(1)} km/s · ${v>0?'远离':v<0?'接近':'静止'}`;
 assert(labels.includes(`左缘 ${formatted(vr-projected)}`));
 assert(labels.includes(`中心 ${formatted(vr)}`));
 assert(labels.includes(`右缘 ${formatted(vr+projected)}`));
});

test('Spectrum center and rotational broadening retain the independent physical relations',()=>{
 const lambda=656.28,cKmS=299792.458,inputs={veq:120,inclination:90,resolution:40000};
 const reference=lineProfile({...inputs,vr:0});
 for(const vr of[0,150,-150]){
  const result=lineProfile({...inputs,vr});
  assert(Math.abs(result.centre-lambda*(1+vr/cKmS))<1e-12);
  assert.equal(result.vmax,120);
  assert.equal(result.equivalentWidthVelocity,reference.equivalentWidthVelocity);
  // 150 km/s is an exact 100-sample translation in the velocity grid.
  const offset=vr/1.5;
  for(let i=100;i<reference.points.length-100;i++)assert(Math.abs(result.points[i+offset][1]-reference.points[i][1])<1e-14);
 }
 const pole=lineProfile({...inputs,vr:0,inclination:0});
 assert.equal(pole.vmax,0);
 const absorptionWidth=r=>{const weight=r.points.map(([,y])=>1-y),sum=weight.reduce((a,b)=>a+b,0);return Math.sqrt(r.points.reduce((s,[x],i)=>s+weight[i]*((x/lambda-1)*cKmS)**2,0)/sum);};
 assert(absorptionWidth(reference)>absorptionWidth(pole)*5,'Projected rotation must still broaden the line');
});
