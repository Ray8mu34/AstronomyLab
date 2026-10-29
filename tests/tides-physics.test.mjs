import test from 'node:test';
import assert from 'node:assert/strict';
import {TIDE_MODES,createTideTrajectory,defaultTideState,validateTideState} from '../web/observatory/modules/tides-physics.mjs';

test('tidal coupling conserves total angular momentum for fast and slow spins',()=>{
 for(const [mode,spins] of Object.entries({locking:[0,1,4],'earth-moon':[.2,1,27.3,40]}))for(const spin of spins){
  const path=createTideTrajectory(mode,spin,.08),initial=1+path.lambda*spin;
  for(const s of path.samples){
   assert.ok(Math.abs(s.spinJ+s.orbitJ-initial)<5e-16);
   assert.ok(Math.abs(s.spinTorque+s.orbitTorque)<1e-18);
  }
 }
});
test('mechanical energy becomes heat monotonically, with closed total energy',()=>{
 for(const mode of ['locking','earth-moon'])for(const spin of [TIDE_MODES[mode].spinMin,TIDE_MODES[mode].spinMax]){
  const path=createTideTrajectory(mode,spin,.08),first=path.samples[0];let previous=first.energy;
  for(const s of path.samples){
   assert.ok(s.energy<=previous+2e-14);
   assert.ok(s.heat>=-2e-14&&s.heatRate>=0);
   assert.ok(Math.abs(s.energy+s.heat-first.energy)<2e-14);previous=s.energy;
  }
 }
});
test('a spin faster than the orbit expands the orbit, and the reverse transfers momentum inward',()=>{
 for(const mode of ['locking','earth-moon']){
  const fast=createTideTrajectory(mode,3,.04).at(40),slow=createTideTrajectory(mode,.5,.04).at(40);
  assert.ok(fast.u<3&&fast.x>1&&fast.orbitTorque>0&&fast.spinChange<0&&fast.orbitChange>0);
  assert.ok(slow.u>.5&&slow.x<1&&slow.orbitTorque<0&&slow.spinChange>0&&slow.orbitChange<0);
 }
});
test('synchronous circular rotation has zero torque and dissipation at every epoch',()=>{
 for(const mode of ['locking','earth-moon']){
  const path=createTideTrajectory(mode,1,.08);
  for(const s of [path.at(0),path.at(13.123456789),path.at(path.horizon)]){
   assert.equal(s.u,1);assert.equal(s.x,1);assert.equal(s.heat,0);assert.equal(s.spinTorque,0);assert.equal(s.relativeAngle,0);
  }
 }
});
test('zero coupling preserves both rotations and the initial circular orbit',()=>{
 const s=createTideTrajectory('locking',3,0).at(20.125);
 assert.equal(s.u,3);assert.equal(s.x,1);assert.equal(s.heat,0);
 assert.ok(Math.abs(s.relativeAngle-40.25)<1e-12);
});
test('torque work equals orbital gain plus heat, checked independently by finite differences',()=>{
 const path=createTideTrajectory('earth-moon',27.3,.04),t=83.217,h=.001,s=path.at(t),a=path.at(t-h),b=path.at(t+h);
 const dSpin=(b.spinEnergy-a.spinEnergy)/(2*h),dOrbit=(b.orbitEnergy-a.orbitEnergy)/(2*h),dHeat=(b.heat-a.heat)/(2*h);
 assert.ok(Math.abs(dSpin-s.spinTorque*s.u)<1e-9);
 assert.ok(Math.abs(dOrbit-s.orbitTorque*s.n)<1e-10);
 assert.ok(Math.abs(dHeat-s.heatRate)<1e-9);
});
test('integration converges while exact time survives sub-step evaluation',()=>{
 const fine=createTideTrajectory('earth-moon',40,.08,{step:.125}),coarse=createTideTrajectory('earth-moon',40,.08),t=117.123456789;
 const a=coarse.at(t),b=fine.at(t);
 assert.equal(a.time,t);assert.ok(Math.abs(a.u-b.u)<2e-8);assert.ok(Math.abs(a.x-b.x)<1e-9);
 const locked=createTideTrajectory('locking',4,.08).at(240);
 assert.ok(Math.abs(locked.ratio-1)<2e-8);
});
test('state validation retains both modes and rejects mismatched or invalid scientific conditions',()=>{
 const state=defaultTideState('earth-moon');state.lockTime=19.123456789;state.earthTime=78.987654321;
 assert.deepEqual(validateTideState('earth-moon',state),state);
 for(const bad of [{...state,mode:'locking'},{...state,earthSpin:41},{...state,earthCoupling:0},{...state,lockTime:NaN},{...state,earthTime:1200.1},{...state,version:2}])assert.equal(validateTideState('earth-moon',bad),null);
 assert.throws(()=>createTideTrajectory('earth-moon',Infinity,.04),RangeError);
 assert.throws(()=>createTideTrajectory('locking',3,.04).at(-1),RangeError);
});
