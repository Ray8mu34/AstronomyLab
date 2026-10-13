// 专用合成教学样本；不是Ia观测、SALT拟合或经验标定系数。
export const syntheticIa=Object.freeze([
 {id:1,stretch:.75,color:-.05,residual:.06},
 {id:2,stretch:.85,color:.08,residual:-.04},
 {id:3,stretch:.95,color:-.08,residual:.02},
 {id:4,stretch:1,color:.02,residual:-.07},
 {id:5,stretch:1.1,color:.10,residual:.04},
 {id:6,stretch:1.2,color:-.02,residual:-.03},
 {id:7,stretch:1.3,color:.05,residual:.02}
]);
export const iaReference=-19.3;
export function teachingIaPeak(sample,correction=0){
 // 斜率0.8与2.0和参考-19.3均是手选教学值，不代表真实样本回归。
 const widthTerm=-.8*(sample.stretch-1),colorTerm=2*sample.color;
 return iaReference+widthTerm+colorTerm+sample.residual-correction*(widthTerm+colorTerm);
}
export function teachingIaCurve(sample,correction=0){
 const peak=teachingIaPeak(sample,correction);
 return Array.from({length:131},(_,i)=>{const day=-20+i*.5;
  // 非对称人工模板；仅提示时间宽度，未求解辐射输运。
  const phase=day/sample.stretch;
  return [day,peak+(phase<0?.006*phase**2:.045*phase+.00045*phase**2)];
 });
}
export function teachingIaScatter(correction=0){
 const values=syntheticIa.map(s=>teachingIaPeak(s,correction));
 const mean=values.reduce((a,v)=>a+v,0)/values.length;
 return {values,mean,rms:Math.sqrt(values.reduce((a,v)=>a+(v-mean)**2,0)/values.length)};
}
