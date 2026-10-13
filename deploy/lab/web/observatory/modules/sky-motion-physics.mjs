// Sky-only additions: dates for shadow geometry and an epoch-labelled cone.
// USNO, Computing Approximate Solar Coordinates, read 2026-10-04.
// https://aa.usno.navy.mil/faq/sun_approx
// A date supplies the Sun at 12:00 UTC. Its direction is held fixed during
// the separate apparent-solar-time daily sweep; this is not a city ephemeris.
import {DEG, wrap} from './sky-physics.mjs';
import {PRECESSION_PERIOD, PRECESSION_TILT, precessionGeometry} from './sky-demo-geometry.mjs';
export const ERA = 2026;
export const DATE_ORIGIN = Date.UTC(ERA,0,1);
export function dateAtDay(day) {
  return new Date(DATE_ORIGIN + Math.round(day)*86400000).toISOString().slice(0,10);
}
export function dayAtDate(date) {
  return Math.max(0,Math.min(364,Math.round((Date.parse(date+'T00:00:00Z')-DATE_ORIGIN)/86400000)));
}
export function solarLongitudeAtDate(date) {
  const jd = Date.parse(date+'T12:00:00Z')/86400000 + 2440587.5;
  const d = jd - 2451545;
  const g = wrap(357.529 + .98560028*d)*DEG;
  return wrap(280.459 + .98564736*d + 1.915*Math.sin(g) + .020*Math.sin(2*g));
}
export function distanceSequence(progress) {
  const p=Math.max(0,Math.min(1,progress));
  // First reveal catalogue radii, then move the observer. No star velocities.
  return {blend:Math.min(1,p/.55),offset:p<=.55?0:15*(p-.55)/.45,
    phase:p<.55?'恢复目录距离':p<1?'移动观察点':'演示完成'};
}
export function epochPrecession(years) {
  const g=precessionGeometry(years),rot=v=>[-v[1],v[0],v[2]];
  // Zero approximates the present equatorial pole in an ecliptic frame:
  // (0,sin epsilon,cos epsilon). Catalogue epochs remain 1991.25.
  // The label 2026 is an era anchor, not a precision Earth-orientation solution.
  return {...g,pole:rot(g.pole),equatorU:rot(g.equatorU),equatorV:rot(g.equatorV),
    era:ERA,year:ERA+years,azimuthDegrees:90+g.phaseDegrees};
}
export function catalogueToEcliptic(v) {
  const e=PRECESSION_TILT*DEG;
  return [v[0],Math.cos(e)*v[1]+Math.sin(e)*v[2],-Math.sin(e)*v[1]+Math.cos(e)*v[2]];
}
export {PRECESSION_PERIOD,PRECESSION_TILT};
