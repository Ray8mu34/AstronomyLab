import { EARTH } from './orbits-physics.mjs';
// km, s, km/s. Tangential release; fixed spherical Earth, massless satellite.
const TAU = 2 * Math.PI;
export function conicState(height, speed) {
  const r = EARTH.radius + height, mu = EARTH.mu;
  const vc = Math.sqrt(mu / r), escape = Math.SQRT2 * vc;
  let q = r * speed * speed / mu;
  // Only roundoff at the exact parabolic preset is absorbed; nearby speeds retain their sign.
  if (Math.abs(q - 2) <= 32 * Number.EPSILON * Math.max(2, q)) q = 2;
  const alpha = (2 - q) / r, energy = (q - 2) * mu / (2 * r);
  const e = Math.abs(q - 1), h = r * speed, p = h * h / mu;
  const a = alpha === 0 ? Infinity : 1 / alpha, peri = p / (1 + e);
  const apo = alpha > 0 ? a * (1 + e) : Infinity;
  const period = alpha > 0 ? TAU * Math.sqrt(a ** 3 / mu) : Infinity;
  const kind = q === 2 ? '临界抛物线' : q > 2 ? '双曲线' : e < 1e-12 ? '圆（椭圆特例）' : speed === 0 ? '径向下落（退化椭圆）' : '束缚椭圆';
  let impactTime = Infinity;
  if (q < 1 && peri < EARTH.radius) {
    // Starting at apoapsis. Solve the FIRST inbound surface crossing analytically.
    const E = TAU - Math.acos(Math.max(-1, Math.min(1, (1 - EARTH.radius / a) / e)));
    impactTime = Math.sqrt(a ** 3 / mu) * (E - e * Math.sin(E) - Math.PI);
  }
  return { height, speed, r, vc, escape, q, alpha, energy, e, h, p, a, peri, apo, period, kind, impactTime };
}
export function stumpff(z) {
  if (Math.abs(z) < .1) {
    let C = .5, S = 1 / 6, c = C, s = S;
    for (let k = 1; k < 12; k++) { c *= -z / ((2*k+1)*(2*k+2)); s *= -z / ((2*k+2)*(2*k+3)); C += c; S += s; }
    return [C, S];
  }
  if (z > 0) { const u = Math.sqrt(z); return [2 * Math.sin(u/2)**2 / z, (u - Math.sin(u)) / u**3]; }
  const u = Math.sqrt(-z); return [2 * Math.sinh(u/2)**2 / -z, (Math.sinh(u) - u) / u**3];
}
export function propagateConic(info, seconds, stopAtSurface = true) {
  const t = Math.max(0, stopAtSurface ? Math.min(seconds, info.impactTime) : seconds);
  const { r: r0, alpha, speed } = info, sqrtMu = Math.sqrt(EARTH.mu);
  // Remove complete periods BEFORE solving, so decades of play never accumulate integration drift.
  const dt = Number.isFinite(info.period) ? t % info.period : t;
  if (dt === 0) return { t, x:r0, y:0, vx:0, vy:speed, r:r0, v:speed, impact:t >= info.impactTime };
  const target = sqrtMu * dt;
  const evaluate = chi => {
    const [C,S] = stumpff(alpha * chi * chi);
    return { C, S, F:(1-alpha*r0)*chi**3*S + r0*chi - target, derivative:(1-alpha*r0)*chi*chi*C + r0 };
  };
  let lo = 0, hi = Math.max(1, Math.min(target / r0, Math.cbrt(6 * target)));
  while (evaluate(hi).F < 0) hi *= 2;
  let chi = (lo + hi) / 2;
  for (let i = 0; i < 100; i++) {
    const q = evaluate(chi);
    if (Math.abs(q.F) < 2e-14 * Math.max(1,target)) break;
    if (q.F > 0) hi = chi; else lo = chi;
    const next = chi - q.F / q.derivative;
    // Guarantee bracket contraction: on a huge hyperbolic bracket pure Newton
    // can reduce sqrt(-alpha)*chi only by ~1 each iteration and stall for centuries.
    const margin = .05 * (hi - lo);
    chi = Number.isFinite(next) && next > lo + margin && next < hi - margin ? next : (lo + hi) / 2;
  }
  const { C, S } = evaluate(chi);
  const f = 1 - chi*chi*C / r0;
  // Stable form for zero initial radial speed; avoids cancellation in t - chi^3 S / sqrt(mu).
  const g = (r0*chi - alpha*r0*chi**3*S) / sqrtMu;
  const x = f*r0, y = g*speed, r = Math.hypot(x,y);
  const fdot = sqrtMu * (alpha*chi**3*S - chi) / (r*r0), gdot = 1 - chi*chi*C/r;
  const vx = fdot*r0, vy = gdot*speed;
  return { t, x, y, vx, vy, r, v:Math.hypot(vx,vy), impact:t >= info.impactTime };
}
export function conicPoint(info, anomaly) {
  if (info.alpha > 0) {
    // Eccentric anomaly, complete closed ellipse. +x release is periapsis for q>=1.
    const sign = info.q >= 1 ? 1 : -1;
    return { x:sign*(info.peri-2*info.a*Math.sin(anomaly/2)**2), y:sign*Math.sqrt(info.a*info.p)*Math.sin(anomaly) };
  }
  const r = info.p / (1 + info.e * Math.cos(anomaly));
  return { x:r*Math.cos(anomaly), y:r*Math.sin(anomaly) };
}
export function traceConic(info, seconds, count = 480) {
  const end = Math.min(seconds, info.impactTime);
  const points = [];
  // Quadratic time sampling resolves the rapid turn near periapsis, even for long escape demos.
  for (let i=0;i<=count;i++) points.push(propagateConic(info,end*(i/count)**2));
  return points;
}
