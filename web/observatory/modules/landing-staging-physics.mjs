// Teaching models; SI for landing, tonnes + km/s for staging. No real vehicle data.
export const G0 = 9.80665;
export const LANDING_DEFAULTS = Object.freeze({height:300,velocity:-40,dry:1800,fuel:200,thrust:36000,isp:280,g:G0});
export const STAGING_DEFAULTS = Object.freeze({dry1:10,prop1:80,dry2:3,prop2:25,payload:2,isp:300,flow1:.5,flow2:.15});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function positive(p,keys){for(const k of keys)if(!Number.isFinite(p[k])||p[k]<=0)throw new RangeError(`${k} must be positive`);}
function root(f,lo,hi){
 const a=f(lo),b=f(hi);
 if(!Number.isFinite(a)||!Number.isFinite(b))throw new RangeError('Nonfinite root bracket');
 if(a===0)return lo;if(b===0)return hi;
 if((a>0)===(b>0))throw new RangeError('Root must be bracketed');
 for(let i=0;i<65;i++){const mid=(lo+hi)/2,value=f(mid);if(value===0)return mid;if((value>0)===(a>0))lo=mid;else hi=mid;}
 return (lo+hi)/2;
}
// Exact constant-thrust, constant-Isp, variable-mass segment, with constant local gravity.
export function poweredState({h,v,m,thrust,isp,g=G0},t){
 const ve=isp*G0,q=thrust/ve,remaining=m-q*t;
 if(remaining<=0||t<0)throw new RangeError('Invalid burn time');
 const z=q*t/m,L=-Math.log1p(-z);
 // z+(1-z)log(1-z) loses precision for very short burns; series is stable.
 const integral=z<1e-4?m/q*(z*z/2+z**3/6+z**4/12+z**5/20):t-remaining/q*L;
 return {h:h+v*t+ve*integral-g*t*t/2,v:v+ve*L-g*t,m:remaining};
}
function landingPlan(params,ignitionHeight){
 const p={...LANDING_DEFAULTS,...params};positive(p,['height','dry','fuel','thrust','isp']);
 if(!Number.isFinite(p.g)||p.g<0||!Number.isFinite(p.velocity)||p.velocity>=0)throw new RangeError('Require downward initial velocity and nonnegative gravity');
 if(!Number.isFinite(ignitionHeight))throw new RangeError('Require finite ignition height');
 const hi=clamp(ignitionHeight,0,p.height),tIgn=p.g?2*(p.height-hi)/(Math.sqrt(p.velocity*p.velocity+2*p.g*(p.height-hi))-p.velocity):(p.height-hi)/-p.velocity;
 const vIgn=p.velocity-p.g*tIgn,m=p.dry+p.fuel,burnTime=p.fuel*p.isp*G0/p.thrust;
 const seed={h:hi,v:vIgn,m,thrust:p.thrust,isp:p.isp,g:p.g},burn=t=>poweredState(seed,t);
 const last=burn(burnTime),velocityTolerance=128*Number.EPSILON*Math.max(1,Math.abs(vIgn),p.g*burnTime,p.isp*G0*Math.log(m/p.dry));
 // Equality at burnout is also a zero-speed event; allow only floating-point roundoff.
 const stop=last.v>=-velocityTolerance?(last.v<=0?burnTime:root(t=>burn(t).v,0,burnTime)):null;
 return {p,hi,tIgn,vIgn,burnTime,seed,burn,stop,minHeight:stop===null?burn(burnTime).h:burn(stop).h};
}
export function idealIgnitionHeight(params={}){
 const p={...LANDING_DEFAULTS,...params},high=landingPlan(p,p.height);
 const tolerance=128*Number.EPSILON*Math.max(1,p.height,Math.abs(high.vIgn*(high.stop??high.burnTime)),p.g*(high.stop??high.burnTime)**2,p.isp*G0*(high.stop??high.burnTime));
 if(high.stop===null||high.minHeight< -tolerance)return null;
 if(Math.abs(high.minHeight)<=tolerance)return p.height;
 return root(h=>landingPlan(p,h).minHeight,0,p.height);
}
export function landingSimulation(params={}){
 const settings={...LANDING_DEFAULTS,...params},critical=idealIgnitionHeight(settings);
 const ignitionHeight=params.ignitionHeight??critical??settings.height/2,plan=landingPlan(settings,ignitionHeight);
 const {p,hi,tIgn,burnTime,burn,stop}=plan,events=[],burnEnd=tIgn+burnTime;
 let end,kind,contact=null,turn=null,endReason='contact';
 const heightTolerance=128*Number.EPSILON*Math.max(1,p.height,Math.abs(plan.vIgn*(stop??burnTime)),p.g*(stop??burnTime)**2,p.isp*G0*(stop??burnTime));
 // A tangent touchdown has no sign change in h. Test the velocity root explicitly.
 // Ground contact has priority over an ignition scheduled at the same instant.
 if(hi===0){contact={t:tIgn,h:0,v:plan.vIgn,m:p.dry+p.fuel};end=tIgn;kind=Math.abs(contact.v)<=2?'gentle':'hard';}
 else if(stop!==null&&Math.abs(plan.minHeight)<=heightTolerance){contact={t:tIgn+stop,...burn(stop),h:0};end=contact.t;kind='soft';}
 else if(stop!==null&&plan.minHeight>0){
  turn={t:tIgn+stop,...burn(stop)};events.push({t:turn.t,type:'turn',label:'下降速度为零'});
  end=Math.min(burnEnd,turn.t+2.5);kind='early';endReason=end===burnEnd?'burnout':'observation';
 }else{
  const bound=stop??burnTime;
  if(burn(bound).h<=0){const bt=root(t=>burn(t).h,0,bound);contact={t:tIgn+bt,...burn(bt),h:0};end=contact.t;kind=Math.abs(contact.v)<=2?'gentle':'hard';}
  else{
   const last=burn(burnTime),coast=p.g?(last.v+Math.sqrt(last.v*last.v+2*p.g*last.h))/p.g:Infinity;
   if(Number.isFinite(coast)){end=tIgn+burnTime+coast;contact={t:end,h:0,v:last.v-p.g*coast,m:p.dry};kind=Math.abs(contact.v)<=2?'gentle':'hard';}
   else{end=tIgn+burnTime+10;kind='unfinished';endReason='time-limit';}
  }
 }
 const timeTolerance=128*Number.EPSILON*Math.max(1,end,burnEnd);
 // Normalize coincident burnout/contact/turn only within machine-roundoff time.
 if(hi>0&&Math.abs(end-burnEnd)<=timeTolerance){
  end=burnEnd;
  if(contact)contact={t:end,...burn(burnTime),h:0};
  if(turn&&Math.abs(turn.t-end)<=timeTolerance){turn={t:end,...burn(burnTime)};const event=events.find(e=>e.type==='turn');event.t=end;}
 }
 if(tIgn<end)events.push({t:tIgn,type:'ignition',label:'点火'});
 if(hi>0&&burnEnd<=end)events.push({t:burnEnd,type:'burnout',label:'推进剂耗尽'});
 if(contact)events.push({t:end,type:'contact',label:Math.abs(contact.v)<=2?'低速触地':'触地',zeroSpeed:Math.abs(contact.v)<1e-8});
 else if(endReason!=='burnout')events.push({t:end,type:'end',label:'观察结束'});
 // At coincident times, contact is the terminal state; no later ignition is applied.
 const priority={contact:0,burnout:1,turn:2,ignition:3,end:4};events.sort((a,b)=>a.t-b.t||priority[a.type]-priority[b.type]);
 function at(time){
  const t=clamp(time,0,end);let s,thrust=0;
  if(t<tIgn)s={h:p.height+p.velocity*t-p.g*t*t/2,v:p.velocity-p.g*t,m:p.dry+p.fuel};
  else if(t<tIgn+burnTime){s=burn(t-tIgn);thrust=p.thrust;}
  else{const last=burn(burnTime),tau=t-tIgn-burnTime;s={h:last.h+last.v*tau-p.g*tau*tau/2,v:last.v-p.g*tau,m:p.dry};}
  if(contact&&t===end){s={h:0,v:contact.v,m:contact.m};thrust=0;}
  const fuel=Math.max(0,s.m-p.dry),phase=contact&&t===end?'contact':t<tIgn?'coast':fuel<=1e-8?'empty':s.v>1e-7?'ascent':'braking';
  return {t,...s,fuel,thrust,acceleration:thrust/s.m-p.g,phase};
 }
 const points=Array.from({length:401},(_,i)=>at(end*i/400));
 for(const event of events)points.push(at(event.t));points.sort((a,b)=>a.t-b.t);
 return {params:p,ignitionHeight:hi,critical,seconds:end,kind,contact,turn,endReason,observationAfterTurn:turn?end-turn.t:null,events,points,at};
}
export function stagingSimulation(params={}){
 const p={...STAGING_DEFAULTS,...params};positive(p,['dry1','prop1','dry2','prop2','payload','isp','flow1','flow2']);
 const ve=p.isp*G0/1000,upper=p.dry2+p.prop2+p.payload,initial=p.dry1+p.prop1+upper;
 const t1=p.prop1/p.flow1,t2=p.prop2/p.flow2,seconds=t1+t2;
 const dv1=ve*Math.log(initial/(p.dry1+upper)),dv2=ve*Math.log(upper/(p.dry2+p.payload)),carriedDv2=ve*Math.log((p.dry1+upper)/(p.dry1+p.dry2+p.payload));
 function at(time,{beforeSeparation=false}={}){
  const t=clamp(time,0,seconds),f1=Math.max(0,p.prop1-p.flow1*Math.min(t,t1)),f2=Math.max(0,p.prop2-p.flow2*Math.max(0,t-t1));
  const separated=t>t1||(t===t1&&!beforeSeparation),tau=Math.max(0,t-t1);
  const firstDv=ve*Math.log(initial/(p.dry1+f1+upper)),secondDv=ve*Math.log(upper/(p.dry2+f2+p.payload)),carrySecondDv=ve*Math.log((p.dry1+upper)/(p.dry1+p.dry2+f2+p.payload));
  // Relative displacement to the discarded first stage, coasting at v(t1), in km.
  const ratio=p.flow2*tau/upper,L=-Math.log1p(-ratio),gap=ve*(tau-(upper-p.flow2*tau)/p.flow2*L);
  return {t,fuel1:f1,fuel2:f2,expelled:p.prop1+p.prop2-f1-f2,separated,phase:t<t1?'first':t<seconds?'second':'done',discarded:separated?p.dry1:0,
   dropped:{mass:(separated?0:p.dry1)+f1+p.dry2+f2+p.payload,dv:firstDv+secondDv,dv1:firstDv,dv2:secondDv},
   carried:{mass:p.dry1+f1+p.dry2+f2+p.payload,dv:firstDv+carrySecondDv,dv1:firstDv,dv2:carrySecondDv},gap};
 }
 const points=Array.from({length:401},(_,i)=>at(seconds*i/400));points.push(at(t1,{beforeSeparation:true}),at(t1));points.sort((a,b)=>a.t-b.t);
 return {params:p,ve,initial,upper,t1,t2,seconds,dv1,dv2,carriedDv2,total:dv1+dv2,carriedTotal:dv1+carriedDv2,gain:dv2-carriedDv2,
  events:[{t:0,type:'ignition',label:'一级点火'},{t:t1,type:'separation',label:'一级耗尽 · 分离 / 保留'},{t:seconds,type:'end',label:'二级耗尽'}],points,at};
}
