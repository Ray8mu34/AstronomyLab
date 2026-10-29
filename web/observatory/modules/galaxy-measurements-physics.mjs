// M33 reference scales and analytic teaching models. No observational rows
// are synthesized here: all generated samples are identified as models in UI.
export const REFERENCE_MODULUS = 24.622;
export const G_KPC = 4.30091e-6; // kpc (km/s)^2 / solar mass
export const KPC_METRES = 3.085677581491367e19;
export const ARCMIN_RAD = Math.PI / 10800;
export const PL_SLOPE = -3.26;
// LMC Wesenheit intercept + CRNL - LMC modulus - metallicity correction.
// Breuval et al. (2023), section IV.5; these are rounded published terms.
export const PL_ABSOLUTE_INTERCEPT = 15.898 + .015 - 18.477 - .011;
export const REFERENCE_DISTANCE = distanceFromModulus(REFERENCE_MODULUS);
export const MAX_THETA = 90;

export function distanceFromModulus(mu) {
  return 10 ** ((mu - 10) / 5); // kpc
}
export function modulusFromDistance(distanceKpc) {
  return 5 * Math.log10(distanceKpc) + 10;
}
export function angularLength(distanceKpc, thetaArcmin) {
  return distanceKpc * thetaArcmin * ARCMIN_RAD; // kpc, small-angle projection
}
export function lineLuminosity(distanceKpc, flux = 1e-15) {
  return 4 * Math.PI * (distanceKpc * KPC_METRES) ** 2 * flux;
}
export function plMagnitude(periodDays, mu) {
  return PL_SLOPE * Math.log10(periodDays) + PL_ABSOLUTE_INTERCEPT + mu;
}

const periods = [3.2, 4.1, 5.7, 7.3, 9.1, 11.6, 14.4, 18.5, 24.8, 32.1, 42.2, 57.3];
const residuals = [-.12, .05, .09, -.08, .03, .14, -.05, -.11, .06, -.02, .10, -.09];
// Residual mean is explicitly removed, so fitting the full illustrative
// sample recovers the adopted reference modulus rather than a random seed.
const residualMean = residuals.reduce((a, b) => a + b, 0) / residuals.length;
export const CEPHEIDS = Object.freeze(periods.map((period, index) => Object.freeze({
  id: `C${String(index + 1).padStart(2, '0')}`,
  period,
  magnitude: plMagnitude(period, REFERENCE_MODULUS) + residuals[index] - residualMean,
})));
export function fitModulus(sample = CEPHEIDS) {
  if (!sample.length) return NaN;
  return sample.reduce((sum, star) => sum + star.magnitude - PL_SLOPE * Math.log10(star.period) - PL_ABSOLUTE_INTERCEPT, 0) / sample.length;
}
export function plResidual(mu, sample = CEPHEIDS) {
  return Math.sqrt(sample.reduce((sum, star) => sum + (star.magnitude - plMagnitude(star.period, mu)) ** 2, 0) / sample.length);
}
// A periodic flux model, normalized to its analytic intensity mean. Converting
// each phase to magnitudes leaves the intensity-averaged magnitude unchanged.
export function lightCurveMagnitude(star, day) {
  const phase = 2 * Math.PI * day / star.period;
  const relativeFlux = 1 + .20 * Math.cos(phase) + .06 * Math.cos(2 * phase + .7);
  return star.magnitude - 2.5 * Math.log10(relativeFlux);
}

export function kuzminSpeedSquared(radiusKpc, massSolar, scaleKpc) {
  return G_KPC * massSolar * radiusKpc ** 2 / (radiusKpc ** 2 + scaleKpc ** 2) ** 1.5;
}
export function haloSpeedSquared(radiusKpc, speed = 120, coreKpc = 5) {
  return speed ** 2 * radiusKpc ** 2 / (radiusKpc ** 2 + coreKpc ** 2);
}
export function referenceComponents(radiusKpc) {
  const stars2 = kuzminSpeedSquared(radiusKpc, 4e9, 1.6);
  const gas2 = kuzminSpeedSquared(radiusKpc, 3e9, 5);
  const halo2 = haloSpeedSquared(radiusKpc);
  return {stars2, gas2, halo2, total2: stars2 + gas2 + halo2};
}
export function referenceSpeed(radiusKpc) {
  return Math.sqrt(referenceComponents(radiusKpc).total2);
}
export function projectedPosition(thetaArcmin, azimuthDeg, inclinationDeg) {
  const phi = azimuthDeg * Math.PI / 180;
  const i = inclinationDeg * Math.PI / 180;
  return [thetaArcmin * Math.cos(phi), thetaArcmin * Math.sin(phi) * Math.cos(i)];
}
export function lineOfSightVelocity(speed, inclinationDeg, azimuthDeg) {
  return speed * Math.sin(inclinationDeg * Math.PI / 180) * Math.cos(azimuthDeg * Math.PI / 180);
}
export function equivalentMass(radiusKpc, speedSquared) {
  return speedSquared * radiusKpc / G_KPC;
}
// The independent coordinate is angular radius. Spectral velocities stay
// fixed as an adopted distance changes. Photometric mass and disk radii scale
// as d^2 and d respectively, giving baryonic v^2 proportional to d.
export function inferAtAngle(thetaArcmin, distanceKpc, stellarScale = 1, haloScale = 1) {
  const factor = distanceKpc / REFERENCE_DISTANCE;
  const referenceRadius = angularLength(REFERENCE_DISTANCE, thetaArcmin);
  const radius = angularLength(distanceKpc, thetaArcmin);
  const base = referenceComponents(referenceRadius);
  const stars2 = base.stars2 * factor * stellarScale;
  const gas2 = base.gas2 * factor;
  const halo2 = base.halo2 * haloScale;
  const baryons2 = stars2 + gas2;
  const total2 = baryons2 + halo2;
  return {
    radius, referenceRadius, factor, stars2, gas2, halo2, baryons2, total2,
    observedSpeed: Math.sqrt(base.total2), modelSpeed: Math.sqrt(total2),
    dynamicalMass: equivalentMass(radius, base.total2),
    baryonicEquivalentMass: equivalentMass(radius, baryons2),
    modelEquivalentMass: equivalentMass(radius, total2),
  };
}
export function rotationResidual(distanceKpc, stellarScale, haloScale) {
  const angles = [5, 10, 18, 28, 40, 55, 70, 85];
  return Math.sqrt(angles.reduce((sum, theta) => {
    const result = inferAtAngle(theta, distanceKpc, stellarScale, haloScale);
    return sum + (result.modelSpeed - result.observedSpeed) ** 2;
  }, 0) / angles.length);
}
