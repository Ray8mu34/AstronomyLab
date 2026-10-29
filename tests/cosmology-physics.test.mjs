import test from 'node:test';
import assert from 'node:assert/strict';
import {C_KM_S,expansionRate,stretchedLight,galaxyGrid,distanceAt,compareDistances} from '../web/observatory/modules/cosmology-physics.mjs';

const near=(actual,expected,tolerance)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} differs from ${expected}`);
test('flat matter-only distances match the analytic Einstein-de Sitter solution',()=>{
 for(const z of [0,.001,.1,.5,1.2,5]){
  const exact=2*C_KM_S/70*((1+z)-Math.sqrt(1+z));
  near(distanceAt(z,70,1).luminosity,exact,1e-5);
 }
});
test('pure cosmological constant distance and low-redshift Hubble limit',()=>{
 near(distanceAt(1.2,70,0).luminosity,C_KM_S/70*1.2*2.2,1e-8);
 for(const matter of [0,.3,1])near(distanceAt(1e-7,70,matter).luminosity/(C_KM_S/70*1e-7),1,1.1e-7);
 assert.equal(distanceAt(0).modulus,null);
});
test('lecture z=0.5 comparison and common H0 scaling',()=>{
 const result=compareDistances(.5,70,.3);
 near(result.current.luminosity,2832.9380939,1e-6);
 near(result.matter.luminosity,2357.6974738,1e-6);
 near(result.deltaModulus,.398745030750074,1e-10);
 const alternate=compareDistances(.5,84,.3);
 near(alternate.current.luminosity/result.current.luminosity,70/84,1e-12);
 near(alternate.deltaModulus,result.deltaModulus,1e-12);
 near(result.fluxRatio,10**(-.4*result.deltaModulus),1e-12);
});
test('equal cosmologies coincide across the redshift range',()=>{
 for(const z of [.01,.5,1.2]){
  const result=compareDistances(z,70,1);
  assert.equal(result.deltaModulus,0);assert.equal(result.fluxRatio,1);
 }
});
test('wavelength, photon energy and arrival rate follow the same scale ratio',()=>{
 const light=stretchedLight(1,.5,400);
 assert.deepEqual(light,{ratio:2,redshift:1,wavelength:800,energyRatio:.5,arrivalRateRatio:.5});
 assert.equal(stretchedLight(.5,.5,400).redshift,0);
});
test('observer change preserves pair distances and the Hubble slope',()=>{
 const a=galaxyGrid(1,'A'),b=galaxyGrid(1,'B');
 near(a.points.find(p=>p.name==='B').distance,b.points.find(p=>p.name==='A').distance,1e-12);
 for(const grid of [a,b,galaxyGrid(.5,'C')])for(const p of grid.points){
  near(p.velocity,grid.rate*p.distance,1e-9);
  if(p.distance===0)assert.equal(p.velocity,0);
 }
 near(expansionRate(1,70,.3),70,1e-12);
 near(galaxyGrid(1.2).points.find(p=>p.name==='C').distance/galaxyGrid(.6).points.find(p=>p.name==='C').distance,2,1e-12);
});
test('invalid scientific inputs are rejected instead of producing a plausible curve',()=>{
 for(const args of [[-1,70,.3],[.5,0,.3],[.5,70,1.1],[NaN,70,.3]])assert.throws(()=>distanceAt(...args),RangeError);
 assert.throws(()=>galaxyGrid(1,'missing'),RangeError);
 assert.throws(()=>stretchedLight(0),RangeError);
});
