// 独立数学：所有三角角度输入为度，自转相位为周；质量/半径单位在函数中列明。
export const G=6.67430e-11, C=299792458, MSUN=1.98847e30, RSUN=6.957e8, TSUN=5772;
const rad=Math.PI/180;
export const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export function trackPoint(track,columns,index){
  const row=track.rows[clamp(Math.round(index),0,track.rows.length-1)];
  const p=Object.fromEntries(columns.map((name,i)=>[name,row[i]]));
  return {...p,temperature:10**p.log_Teff,radius:10**p.log_R,luminosity:10**p.log_L,
    centerTemperature:10**p.log_center_T};
}
export function phaseDescription(p,mass){
  if(p.eep<202)return '主序前：引力收缩';
  if(p.eep<454)return '主序：核心氢聚变';
  if(p.eep<605)return mass>=8?'离开主序／超巨星演化':'次巨星与红巨星：氢壳层供能';
  if(p.eep<631)return '氦点火与结构调整';
  if(p.eep<707)return '稳定核心氦聚变';
  if(mass>=8)return '核心氦耗尽后的高级燃烧（截至碳燃烧末）';
  if(p.eep<808)return '早期渐近巨星支：双壳层';
  if(p.eep<1409)return '热脉冲渐近巨星支：失质量';
  return '后AGB：热核心与稀薄包层';
}
export function stefanLuminosity(radiusSolar,temperatureK){return radiusSolar**2*(temperatureK/TSUN)**4;}
export function magneticDirection(alphaDeg,phase){
  const a=alphaDeg*rad,f=phase*2*Math.PI;return [Math.sin(a)*Math.cos(f),Math.cos(a),Math.sin(a)*Math.sin(f)];
}
export function pulsarSignal(alphaDeg,zetaDeg,halfWidthDeg,phase){
  const b=magneticDirection(alphaDeg,phase),z=zetaDeg*rad, n=[Math.sin(z),Math.cos(z),0];
  const dot=b.reduce((s,v,i)=>s+v*n[i],0),angle=Math.acos(clamp(Math.abs(dot),-1,1))/rad;
  // 有限实心束，边界外严格为零；相对强度为人为选择的余弦剖面，不是实测。
  return {angleDeg:angle,intensity:angle>=halfWidthDeg?0:Math.cos(Math.PI*angle/(2*halfWidthDeg))**2,
    visible:angle<halfWidthDeg, direction:b,observer:n};
}
export function pulseProfile(alpha,zeta,width,samples=720){
  return Array.from({length:samples+1},(_,i)=>[i/samples,pulsarSignal(alpha,zeta,width,i/samples).intensity]);
}
export function pulseDuty(alpha,zeta,width,samples=3600){
  let hits=0;for(let i=0;i<samples;i++)if(pulsarSignal(alpha,zeta,width,i/samples).visible)hits++;
  return hits/samples;
}
export function collapseState(progress,successful=true){
  const t=clamp(progress,0,1),fall=Math.min(t/.42,1),core=.7*(1-fall)+.07*fall;
  const outbound=successful?clamp((t-.42)/.58,0,1):0;
  return {coreRadiusDisplay:core,shellRadiusDisplay:2.0+outbound*2.7,
    shockRadiusDisplay:successful&&t>.42?.7+outbound*4.0:0,
    phase:t<.42?'核心坍缩':successful?'示意：成功推出外层':'示意：冲击未成功推出外层'};
}
export function compactScales(massSolar,objectLengthM=2,distanceInRs=1){
  const mass=massSolar*MSUN,rs=2*G*mass/C**2,r=rs*distanceInRs;
  return {rsM:rs,radialTidalAcceleration:2*G*mass*objectLengthM/r**3,
    exactNewtonianDifference:2*G*mass*r*objectLengthM/(r*r-objectLengthM*objectLengthM/4)**2};
}
export function bindingEnergyScale(massSolar,radiusKm){return G*(massSolar*MSUN)**2/(radiusKm*1000);}
