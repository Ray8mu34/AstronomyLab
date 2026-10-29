// Circular, coplanar, orbit-averaged tidal coupling. See /sources/tides.md.
// q = sqrt(a/a0); u = Omega/n0; lambda = I/(mu*a0^2).
// q + lambda*u is conserved algebraically, while mechanical energy falls.
export const TIDAL_REFERENCE=Object.freeze({
 earthMass:5.9722e24,moonMass:7.346e22,earthRadius:6371000,moonRadius:1737400,
 earthInertiaFactor:.3308,moonInertiaFactor:.394,separation:384400000,
});
const reducedMass=TIDAL_REFERENCE.earthMass*TIDAL_REFERENCE.moonMass/(TIDAL_REFERENCE.earthMass+TIDAL_REFERENCE.moonMass);
const inertia=(mass,radius,factor)=>factor*mass*radius**2/(reducedMass*TIDAL_REFERENCE.separation**2);
export const TIDE_MODES=Object.freeze({
 locking:Object.freeze({prefix:'lock',horizon:240,spinMin:0,spinMax:4,spinDefault:3,lambda:inertia(TIDAL_REFERENCE.moonMass,TIDAL_REFERENCE.moonRadius,TIDAL_REFERENCE.moonInertiaFactor)}),
 'earth-moon':Object.freeze({prefix:'earth',horizon:1200,spinMin:.2,spinMax:40,spinDefault:27.3,lambda:inertia(TIDAL_REFERENCE.earthMass,TIDAL_REFERENCE.earthRadius,TIDAL_REFERENCE.earthInertiaFactor)}),
});
export const TIDE_CONTROL_KEYS=Object.freeze(['lockSpin','lockCoupling','lockTime','earthSpin','earthCoupling','earthTime']);
export function defaultTideState(mode='locking'){
 return {version:1,kind:'tidal-evolution',mode:Object.hasOwn(TIDE_MODES,mode)?mode:'locking',lockSpin:3,lockCoupling:.04,lockTime:0,earthSpin:27.3,earthCoupling:.04,earthTime:0};
}
export function validateTideState(mode,value){
 if(!Object.hasOwn(TIDE_MODES,mode)||!value||typeof value!=='object'||Array.isArray(value)||value.version!==1||value.kind!=='tidal-evolution'||value.mode!==mode)return null;
 const bounds={lockSpin:[0,4],lockCoupling:[.01,.08],lockTime:[0,240],earthSpin:[.2,40],earthCoupling:[.01,.08],earthTime:[0,1200]};
 const clean={version:1,kind:'tidal-evolution',mode};
 for(const [key,[lo,hi]] of Object.entries(bounds)){
  if(typeof value[key]!=='number'||!Number.isFinite(value[key])||value[key]<lo||value[key]>hi)return null;
  clean[key]=value[key];
 }
 return clean;
}
function parameters(mode,spin,coupling){
 const spec=Object.hasOwn(TIDE_MODES,mode)?TIDE_MODES[mode]:null;
 if(!spec||!Number.isFinite(spin)||spin<spec.spinMin||spin>spec.spinMax||!Number.isFinite(coupling)||coupling<0||coupling>.08)throw new RangeError('Invalid tidal conditions');
 return {...spec,mode,spin,coupling,totalJ:1+spec.lambda*spin};
}
function rates(p,u){
 const q=1+p.lambda*(p.spin-u),x=q*q,n=1/(q*q*q),slip=u-n;
 return {du:-p.coupling*slip/x**6,n,u,slip,q,x};
}
function advance(p,row,h){
 const [u,orbit,spin]=row;
 const a=rates(p,u),b=rates(p,u+h*a.du/2),c=rates(p,u+h*b.du/2),d=rates(p,u+h*c.du);
 return [u+h*(a.du+2*b.du+2*c.du+d.du)/6,orbit+h*(a.n+2*b.n+2*c.n+d.n)/6,spin+h*(a.u+2*b.u+2*c.u+d.u)/6];
}
function observables(p,time,row){
 const [u,orbitAngle,spinAngle]=row,{n,q,x,slip}=rates(p,u),lambda=p.lambda;
 const spinEnergy=.5*lambda*u*u,orbitEnergy=-.5/x;
 const spinChange=.5*lambda*(u*u-p.spin*p.spin),orbitChange=.5*(1-1/x),heat=-(spinChange+orbitChange)||0;
 return {time,u,n,ratio:u/n,q,x,orbitAngle,spinAngle,relativeAngle:spinAngle-orbitAngle,
  spinJ:lambda*u,orbitJ:q,totalJ:p.totalJ,spinEnergy,orbitEnergy,energy:spinEnergy+orbitEnergy,
  spinChange,orbitChange,heat,spinTorque:-p.coupling*lambda*slip/x**6||0,orbitTorque:p.coupling*lambda*slip/x**6,
  heatRate:p.coupling*lambda*slip*slip/x**6};
}
export function createTideTrajectory(mode,spin,coupling,{step=.25}={}){
 const p=parameters(mode,spin,coupling);
 if(!Number.isFinite(step)||step<=0||step>1)throw new RangeError('Invalid integration step');
 const count=Math.ceil(p.horizon/step),h=p.horizon/count,rows=[[spin,0,0]],samples=[observables(p,0,rows[0])];
 for(let i=1;i<=count;i++){
  rows.push(advance(p,rows[i-1],h));samples.push(observables(p,i*h,rows[i]));
 }
 return {mode,spin,coupling,lambda:p.lambda,horizon:p.horizon,samples,
  at(time){
   if(!Number.isFinite(time)||time<0||time>p.horizon)throw new RangeError('Invalid tidal time');
   const index=Math.min(count,Math.floor(time/h)),remainder=time-index*h;
   // An RK4 remainder preserves the exact scrubbed time instead of quantizing it.
   const row=remainder>1e-12?advance(p,rows[index],remainder):rows[index];
   return observables(p,time,row);
  },
 };
}
