import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REFERENCE_DISTANCE, REFERENCE_MODULUS, G_KPC, CEPHEIDS, distanceFromModulus,
  modulusFromDistance, angularLength, lineLuminosity, fitModulus,
  lightCurveMagnitude, lineOfSightVelocity, projectedPosition,
  kuzminSpeedSquared, haloSpeedSquared, inferAtAngle, rotationResidual,
} from '../web/observatory/modules/galaxy-measurements-physics.mjs';

const close = (actual, expected, relative = 1e-11) => assert.ok(Math.abs(actual - expected) <= relative * Math.max(1, Math.abs(expected)), `${actual} ≠ ${expected}`);

test('M33 modulus, angular ruler and line flux use physical units', () => {
  close(REFERENCE_DISTANCE, 840.2335139076916);
  close(modulusFromDistance(REFERENCE_DISTANCE), REFERENCE_MODULUS);
  assert.ok(angularLength(REFERENCE_DISTANCE, 1 / 60) * 1000 > 4.07);
  assert.ok(angularLength(REFERENCE_DISTANCE, 1 / 60) * 1000 < 4.08);
  assert.ok(lineLuminosity(840) > 8.4e30 && lineLuminosity(840) < 8.5e30);
  close(distanceFromModulus(10), 1);
});

test('synthetic Cepheid sample fits its known calibration and preserves intensity means', () => {
  close(fitModulus(), REFERENCE_MODULUS);
  const shift = .3;
  close(fitModulus(CEPHEIDS.map(star => ({...star, magnitude: star.magnitude + shift}))), REFERENCE_MODULUS + shift);
  for (const star of [CEPHEIDS[0], CEPHEIDS.at(-1)]) {
    const n = 4096;
    const meanFlux = Array.from({length: n}, (_, i) => 10 ** (-.4 * (lightCurveMagnitude(star, i * star.period / n) - star.magnitude))).reduce((a, b) => a + b) / n;
    close(meanFlux, 1);
    close(lightCurveMagnitude(star, star.period * .37), lightCurveMagnitude(star, star.period * 1.37));
  }
});

test('velocity projection has face-on, major-axis and minor-axis limits', () => {
  for (const phi of [0, 41, 90, 180, 270]) close(lineOfSightVelocity(120, 0, phi), 0);
  close(lineOfSightVelocity(120, 90, 0), 120);
  close(lineOfSightVelocity(120, 55, 180), -lineOfSightVelocity(120, 55, 0));
  close(lineOfSightVelocity(120, 55, 90), 0);
  close(projectedPosition(10, 90, 60)[1], 5);
  close(projectedPosition(10, 0, 60)[0], 10);
});

test('analytic component gravity has correct disk and halo limits', () => {
  const mass = 4e9, a = 1.6;
  close(kuzminSpeedSquared(a, mass, a), G_KPC * mass / (2 * Math.sqrt(2) * a));
  close(kuzminSpeedSquared(0, mass, a), 0);
  close(kuzminSpeedSquared(1e6, mass, a) * 1e6 / G_KPC, mass, 1e-10);
  close(haloSpeedSquared(0), 0);
  close(haloSpeedSquared(1e8), 120 ** 2, 1e-12);
});

test('changing adopted distance preserves spectra and applies d versus d squared scaling', () => {
  const first = inferAtAngle(40, REFERENCE_DISTANCE);
  const farther = inferAtAngle(40, REFERENCE_DISTANCE * 1.1);
  close(farther.radius / first.radius, 1.1);
  close(farther.observedSpeed, first.observedSpeed);
  close(farther.dynamicalMass / first.dynamicalMass, 1.1);
  close(farther.baryonicEquivalentMass / first.baryonicEquivalentMass, 1.21);
  close(lineLuminosity(REFERENCE_DISTANCE * 1.1) / lineLuminosity(REFERENCE_DISTANCE), 1.21);
  close(farther.stars2 / first.stars2, 1.1);
});

test('component contributions add in squared speed and reference model matches synthetic targets', () => {
  const r = inferAtAngle(60, REFERENCE_DISTANCE, .7, 1.2);
  close(r.total2, r.stars2 + r.gas2 + r.halo2);
  close(r.modelEquivalentMass, r.total2 * r.radius / G_KPC);
  close(rotationResidual(REFERENCE_DISTANCE, 1, 1), 0);
  assert.ok(rotationResidual(REFERENCE_DISTANCE, 1, 0) > 40);
  assert.ok(inferAtAngle(85, REFERENCE_DISTANCE).dynamicalMass > inferAtAngle(40, REFERENCE_DISTANCE).dynamicalMass);
});
