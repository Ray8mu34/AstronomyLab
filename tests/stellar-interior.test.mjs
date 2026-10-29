import test from 'node:test';
import assert from 'node:assert/strict';
import {uniformStar,thermostatRate,thermostatTrajectory,transportLayer,STELLAR_CONSTANTS as C} from '../web/observatory/modules/stellar-interior-physics.mjs';
const close=(a,b,tol=1e-8)=>assert(Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),`${a} versus ${b}`);
test('uniform sphere integrates to its mass, hydrostatic pressure and virial energy',()=>{
 for(const mass of [.5,1,3])for(const radius of [.5,1,3]){
  const star=uniformStar(mass,radius),n=10000,dr=star.radius/n;let m=0,u=0,omega=0;
  for(let i=0;i<n;i++){const r=(i+.5)*dr,volume=4*Math.PI*r*r*dr,dm=star.density*volume;m+=dm;u+=1.5*star.at(r/star.radius).pressure*volume;omega-=C.G*star.at(r/star.radius).mass*dm/r;}
  close(m,star.mass,1e-8);close(u,star.internal,2e-8);close(omega,star.potential,2e-8);assert(Math.abs((2*u+omega)/omega)<3e-8);
  for(const x of [.1,.4,.8]){const dx=1e-6,dp=(star.at(x+dx).pressure-star.at(x-dx).pressure)/(2*dx*star.radius);close(dp,-C.G*star.at(x).mass*star.density/(x*star.radius)**2,1e-9);}
 }
});
test('same-mass contraction increases internal energy while reducing total energy',()=>{
 const a=uniformStar(1,1),b=uniformStar(1,.5);close(b.centralTemperature,2*a.centralTemperature);close(b.centralPressure,16*a.centralPressure);close(b.density,8*a.density);close(b.internal-a.internal,a.total-b.total);assert(b.total<a.total);
});
test('pressure perturbations give the expected signed local acceleration',()=>{
 for(const support of [.5,1,1.5]){const s=uniformStar(1,1,support).at(.6);close(s.pressureAcceleration-s.gravity,s.netAcceleration);assert.equal(Math.sign(s.netAcceleration),Math.sign(support-1));}
});
test('single-zone feedback approaches equilibrium from either side and exact equilibrium stays fixed',()=>{
 for(const reaction of ['pp','cno'])for(const q0 of [.85,1,1.15]){const t=thermostatTrajectory(q0,reaction);assert(Math.abs(t.at(1).radius-1)<=Math.abs(q0-1));for(const row of t.samples){assert(row.radius>=Math.min(q0,1)-1e-13&&row.radius<=Math.max(q0,1)+1e-13);close(row.internalEnergy+row.potentialEnergy,row.totalEnergy);close(row.temperature*row.radius,1);}if(q0===1)assert(t.samples.every(r=>r.radius===1&&r.nuclear===1));}
});
test('thermal evolution obeys the first-law budget and converges under halved RK4 step',()=>{
 for(const reaction of ['pp','cno'])for(const q0 of [.85,1.15]){
  const a=thermostatTrajectory(q0,reaction),b=thermostatTrajectory(q0,reaction,{step:.000125});
  for(const time of [.01,.07,.3,.8]){close(a.at(time).radius,b.at(time).radius,2e-9);const dt=1e-6,dE=(a.at(time+dt).totalEnergy-a.at(time-dt).totalEnergy)/(2*dt);close(dE,a.at(time).nuclear-1,1e-6);}
 }
});
test('radiative transport gradient follows opacity times flux and parcel buoyancy follows density contrast',()=>{
 for(const opacity of [.5,1,2])for(const flux of [.5,1,2])for(const s of [0,.2,.8]){
  const layer=transportLayer(opacity,flux,s);close(layer.gradient,.25*opacity*flux);close(layer.buoyancy,layer.environmentDensity/layer.parcelDensity-1);if(s>0)assert.equal(Math.sign(layer.buoyancy),Math.sign(layer.gradient-.4));else close(layer.buoyancy,0);
 }
 const neutral=transportLayer(1.6,1,.7);close(neutral.parcelTemperature,neutral.environmentTemperature);close(neutral.buoyancy,0);
 const l=transportLayer(1,1,.4),p=5e12,T=3e6,g=1000;close(l.gradient,3*l.opacity*p*l.flux/(16*C.sigma*g*T**4));
});
test('invalid scientific inputs are rejected',()=>{
 for(const fn of [()=>uniformStar(0),()=>uniformStar(1,Infinity),()=>uniformStar().at(-1),()=>thermostatTrajectory(.8),()=>thermostatRate(1,'fake'),()=>transportLayer(1,1,NaN)])assert.throws(fn,RangeError);
});
