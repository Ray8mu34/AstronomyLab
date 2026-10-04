// Sky-only teaching geometry. No ephemeris, UT1, nutation or date conversion.
// USNO https://aa.usno.navy.mil/faq/GAST (read 2026-10-03): fixed-star
// reference and ~1.0027379 sidereal hours per mean-solar hour.
// Circular coplanar model: a 365.256 mean-solar-day year, 24 h mean solar day.
// NASA Earth Fact Sheet, Orbital parameters (read 2026-10-03): 365.256 d,
// 23.9345 h, 24.0000 h and 23.44 degrees.
// https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html
// Fixed-star rotation is used here; the ~0.008 s stellar/sidereal distinction
// and precession of the equinox are below this demonstration's precision.
export const DAY_YEAR = 365.256;
export const SOLAR_HOURS = 24;
export const SIDEREAL_HOURS = SOLAR_HOURS * DAY_YEAR / (DAY_YEAR + 1);
export const PRECESSION_PERIOD = 26000;
export const PRECESSION_TILT = 23.44;
const rad = Math.PI / 180;
export function dayGeometry(hours) {
  const orbitDegrees = 360 * hours / (SOLAR_HOURS * DAY_YEAR);
  const spinDegrees = 360 * hours / SIDEREAL_HOURS;
  const direction = degrees => [-Math.cos(degrees * rad), -Math.sin(degrees * rad), 0];
  return {hours,orbitDegrees,spinDegrees,solarDegrees:spinDegrees-orbitDegrees,
    marker:direction(spinDegrees),star:[-1,0,0],sun:direction(orbitDegrees),
    siderealHours:SIDEREAL_HOURS,solarHours:SOLAR_HOURS,
    extraSeconds:(SOLAR_HOURS-SIDEREAL_HOURS)*3600};
}
// NASA: axial precession ~25,771.5 y; current tilt ~23.4 degrees.
// https://science.nasa.gov/science-research/earth-science/milankovitch-orbital-cycles-and-their-role-in-earths-climate/
// The rounded 26,000 y period and constant 23.44 degree cone are a geometry
// demonstration, not a long-term precession model or a historic pole forecast.
// Right-handed ecliptic frame, arbitrary phase zero; retrograde precession.
export function precessionGeometry(years) {
  const phaseDegrees = -360 * years / PRECESSION_PERIOD;
  const a=phaseDegrees*rad,e=PRECESSION_TILT*rad,c=Math.cos(a),s=Math.sin(a);
  return {years,phaseDegrees,tiltDegrees:PRECESSION_TILT,period:PRECESSION_PERIOD,
    pole:[Math.sin(e)*c,Math.sin(e)*s,Math.cos(e)],
    equatorU:[Math.cos(e)*c,Math.cos(e)*s,-Math.sin(e)],
    equatorV:[-s,c,0]};
}
