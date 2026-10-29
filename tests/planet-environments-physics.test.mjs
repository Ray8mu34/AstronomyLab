import test from 'node:test';
import assert from 'node:assert/strict';
import {radiationBalance,greyAtmosphere,escapeSpeed,maxwellDensity,maxwellTailFromLambda,escapeDistribution} from '../web/observatory/modules/planet-environments-physics.mjs';

const near=(actual,expected,tolerance=1e-10)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} versus ${expected}`);
test('solar dilution, sphere averaging and independent terrestrial energy budget',()=>{
 const earth=radiationBalance(1,.3),far=radiationBalance(2,.3);
 near(earth.incoming,340.25);near(earth.absorbed,238.175);near(earth.equilibriumTemperature,254.5781401165717,1e-7);
 near(earth.irradiance/far.irradiance,4);near(earth.equilibriumTemperature/far.equilibriumTemperature,Math.sqrt(2));
 near(radiationBalance(1,1).equilibriumTemperature,0);near(radiationBalance(1,0).reflected,0);
});
test('grey layer conserves flux at surface, layer and top across independent inputs',()=>{
 for(const r of [.5,.723,1,1.524,2.5])for(const a of [0,.3,.77,1])for(const e of [0,.01,.5,1]){
  const m=greyAtmosphere(r,a,e);
  near(m.absorbed+m.atmosphereDown,m.surfaceFlux,1e-10);
  near(m.atmosphereAbsorbed,m.atmosphereUp+m.atmosphereDown,1e-10);
  near(m.outgoing,m.absorbed,1e-10);
  near(m.reflected+m.outgoing,m.incoming,1e-10);
 }
 const clear=greyAtmosphere(1,.3,0),opaque=greyAtmosphere(1,.3,1);
 assert.equal(clear.atmosphereTemperature,null);near(clear.surfaceTemperature,clear.equilibriumTemperature);
 near(opaque.surfaceTemperature/clear.surfaceTemperature,2**.25);near(opaque.atmosphereTemperature,clear.surfaceTemperature);
});
test('escape speed uses the actual radius including altitude and inverse-square-root scaling',()=>{
 near(escapeSpeed(1,1),11.186165197346224,1e-8);
 near(escapeSpeed(4,1)/escapeSpeed(1,1),2);near(escapeSpeed(1,4)/escapeSpeed(1,1),.5);
 near(escapeSpeed(1,1,6371),escapeSpeed(1,2));
});
test('Maxwell density normalizes and high-speed tail matches independent quadrature',()=>{
 const temperature=1000,mass=1,steps=40000,upper=50,h=upper/steps;
 let integral=0;for(let i=0;i<=steps;i++)integral+=(i===0||i===steps?1:i%2?4:2)*maxwellDensity(i*h,temperature,mass);
 near(integral*h/3,1,2e-12);
 for(const speed of [1,4,8,12,20]){
  const m=escapeDistribution({temperature,gas:'H',mass:1,radius:1,altitude:0}),lambda=(speed/m.peak)**2;
  const step=(upper-speed)/steps;let sum=0;
  for(let i=0;i<=steps;i++)sum+=(i===0||i===steps?1:i%2?4:2)*maxwellDensity(speed+i*step,temperature,mass);
  near(maxwellTailFromLambda(lambda),sum*step/3,2e-12);
 }
 near(maxwellTailFromLambda(0),1);near(maxwellTailFromLambda(1),.5724067044708798,2e-14);
 assert.ok(maxwellTailFromLambda(100)>0);assert.ok(maxwellTailFromLambda(100)<1e-40);
});
test('temperature, molecular mass and gravity move the tail in the physical direction',()=>{
 const state={temperature:1000,gas:'H',mass:1,radius:1,altitude:500},base=escapeDistribution(state);
 assert.ok(escapeDistribution({...state,temperature:2000}).tail>base.tail);
 assert.ok(escapeDistribution({...state,gas:'N2'}).tail<base.tail);
 assert.ok(escapeDistribution({...state,mass:.5}).tail>base.tail);
 assert.ok(escapeDistribution({...state,altitude:1500}).tail>base.tail);
 assert.throws(()=>radiationBalance(0,.3),RangeError);assert.throws(()=>greyAtmosphere(1,.3,1.1),RangeError);assert.throws(()=>escapeDistribution({...state,gas:'unknown'}),RangeError);
});
