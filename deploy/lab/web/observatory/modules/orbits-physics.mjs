// km、s、km/s；球对称中心引力。地表交点结束轨迹，不穿地续画。
export const EARTH = Object.freeze({radius:6371,mu:398600.435507,g0:9.80665});
export function orbitState(height,speed){
  const r=EARTH.radius+height,mu=EARTH.mu,vc=Math.sqrt(mu/r),escape=vc*Math.SQRT2;
  const energy=speed*speed/2-mu/r,h=r*speed,e=Math.abs(r*speed*speed/mu-1);
  const a=Math.abs(energy)<1e-10?Infinity:-mu/(2*energy);
  const peri=h===0?0:h*h/(mu*(1+e)),apo=energy<0?a*(1+e):Infinity;
  const kind=peri<EARTH.radius-1e-5?'落回地表':energy>=-1e-8?'逃逸轨道':Math.abs(speed-vc)<.001?'圆轨道':'束缚椭圆';
  return {r,vc,escape,energy,h,e,a,peri,apo,kind,period:energy<0?2*Math.PI*Math.sqrt(a**3/mu):Infinity};
}
function derivative(s){const r=Math.hypot(s[0],s[1]),q=-EARTH.mu/r**3;return [s[2],s[3],q*s[0],q*s[1]];}
export function rk4(s,dt){
  const k1=derivative(s),k2=derivative(s.map((v,i)=>v+dt*k1[i]/2)),k3=derivative(s.map((v,i)=>v+dt*k2[i]/2)),k4=derivative(s.map((v,i)=>v+dt*k3[i]));
  return s.map((v,i)=>v+dt*(k1[i]+2*k2[i]+2*k3[i]+k4[i])/6);
}
export function trajectory(height,speed,{dt=4,maxSeconds=24000,maxRadius=18*EARTH.radius}={}){
  const info=orbitState(height,speed),duration=Math.min(maxSeconds,Number.isFinite(info.period)?info.period: maxSeconds);
  let s=[info.r,0,0,speed],t=0,points=[{t,x:s[0],y:s[1],v:speed,r:info.r}],impact=false;
  while(t<duration){
    const step=Math.min(dt,duration-t),next=rk4(s,step),rn=Math.hypot(next[0],next[1]);
    if(rn<=EARTH.radius){
      // 线性截取一步内的地表交点，dt小于4 s；截点误差独立说明。
      let lo=0,hi=step;
      for(let j=0;j<32;j++){const m=(lo+hi)/2,q=rk4(s,m);if(Math.hypot(q[0],q[1])>EARTH.radius)lo=m;else hi=m;}
      s=rk4(s,(lo+hi)/2);t+=(lo+hi)/2;impact=true;
      points.push({t,x:s[0],y:s[1],r:Math.hypot(s[0],s[1]),v:Math.hypot(s[2],s[3])});break;
    }
    s=next;t+=step;
    points.push({t,x:s[0],y:s[1],r:rn,v:Math.hypot(s[2],s[3])});if(rn>maxRadius)break;
  }
  return {info,points,impact,truncated:!impact&&t<duration,seconds:t};
}
export function hohmann(h1,h2){
  const r1=EARTH.radius+h1,r2=EARTH.radius+h2,a=(r1+r2)/2,mu=EARTH.mu;
  const v1=Math.sqrt(mu/r1),v2=Math.sqrt(mu/r2),vp=Math.sqrt(mu*(2/r1-1/a)),va=Math.sqrt(mu*(2/r2-1/a));
  return {r1,r2,a,e:Math.abs(r2-r1)/(r2+r1),v1,v2,vp,va,dv1:vp-v1,dv2:v2-va,dv:Math.abs(vp-v1)+Math.abs(v2-va),seconds:Math.PI*Math.sqrt(a**3/mu)};
}
export function transferPoint(h1,h2,fraction){
  const q=hohmann(h1,h2),M=Math.PI*Math.max(0,Math.min(1,fraction));let E=M;
  for(let i=0;i<14;i++)E-=(E-q.e*Math.sin(E)-M)/(1-q.e*Math.cos(E));
  // UI只开放升轨：出发点为近地点。
  return [q.a*(Math.cos(E)-q.e),q.a*Math.sqrt(1-q.e*q.e)*Math.sin(E)];
}
export function staging({dry1=10,prop1=80,dry2=3,prop2=25,payload=2,ve=3,reserve=0}={}){
  const upper=dry2+prop2+payload,initial=dry1+prop1+upper;
  const firstEnd=dry1+reserve+upper;
  const dv1=ve*Math.log(initial/firstEnd),dv2=ve*Math.log(upper/(dry2+payload));
  // 比较对象：相同推进剂，若一级干质量与储备一直留在系统上。
  const unseparated=dv1+ve*Math.log(firstEnd/(dry1+reserve+dry2+payload));
  return {initial,firstEnd,upper,dv1,dv2,total:dv1+dv2,unseparated,gain:dv1+dv2-unseparated};
}
export function landing(height,speed,thrustWeight){
  const acceleration=EARTH.g0*(thrustWeight-1),stopDistance=acceleration>0?speed**2/(2*acceleration):Infinity;
  const impactSpeed=Math.sqrt(Math.max(0,speed**2-2*acceleration*height));
  return {acceleration,stopDistance,stopHeight:height-stopDistance,impactSpeed,status:acceleration<=0?'不能减小下降速度':stopDistance>height?'触地前停不住':stopDistance<height-.1?'会在地面上方停住':'恰在地面停住'};
}
