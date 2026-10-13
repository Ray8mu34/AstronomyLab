// 角度对外用度；本实验是固定黄赤交角的几何模型，不是日期历表。
export const DEG = Math.PI / 180;
export const OBLIQUITY = 23.44;
export const clamp = (x, a = -1, b = 1) => Math.max(a, Math.min(b, x));
export const wrap = (x, period = 360) => ((x % period) + period) % period;
export function solarEquatorial(longitude, obliquity = OBLIQUITY) {
  const l = longitude * DEG, e = obliquity * DEG;
  return {ra: wrap(Math.atan2(Math.cos(e) * Math.sin(l), Math.cos(l)) / DEG), dec: Math.asin(Math.sin(e) * Math.sin(l)) / DEG};
}
export function equatorialVector(ra, dec, radius = 1) {
  const a = ra * DEG, d = dec * DEG;
  return [radius * Math.cos(d) * Math.cos(a), radius * Math.cos(d) * Math.sin(a), radius * Math.sin(d)];
}
export function horizontal(ra, dec, latitude, siderealAngle) {
  const p = latitude * DEG, d = dec * DEG, h = (siderealAngle - ra) * DEG;
  const east = -Math.cos(d) * Math.sin(h);
  const north = Math.cos(p) * Math.sin(d) - Math.sin(p) * Math.cos(d) * Math.cos(h);
  const up = Math.sin(p) * Math.sin(d) + Math.cos(p) * Math.cos(d) * Math.cos(h);
  return {east, north, up, altitude: Math.asin(clamp(up)) / DEG,
    azimuth: Math.hypot(east, north) < 1e-12 ? null : wrap(Math.atan2(east, north) / DEG)};
}
export function equatorialToLocal(v, latitude, siderealAngle) {
  const p = latitude * DEG, a = siderealAngle * DEG;
  return [-Math.sin(a) * v[0] + Math.cos(a) * v[1],
    -Math.sin(p) * Math.cos(a) * v[0] - Math.sin(p) * Math.sin(a) * v[1] + Math.cos(p) * v[2],
    Math.cos(p) * Math.cos(a) * v[0] + Math.cos(p) * Math.sin(a) * v[1] + Math.sin(p) * v[2]];
}
export function dayLength(latitude, dec) {
  const p = latitude * DEG, d = dec * DEG;
  const a = Math.sin(p) * Math.sin(d), b = Math.cos(p) * Math.cos(d);
  if (Math.abs(b) < 1e-12) return Math.abs(a) < 1e-12 ? {hours: null, kind: '全天贴地平线', h0: null} : {hours: a > 0 ? 24 : 0, kind: a > 0 ? '极昼' : '极夜', h0: a > 0 ? 180 : 0};
  const x = -a / b;
  if (x <= -1) return {hours: 24, kind: '极昼', h0: 180};
  if (x >= 1) return {hours: 0, kind: '极夜', h0: 0};
  const h0 = Math.acos(x) / DEG;
  return {hours: 2 * h0 / 15, kind: '有升有落', h0};
}
export function circumpolar(latitude, dec) {
  const a = Math.sin(latitude * DEG) * Math.sin(dec * DEG), b = Math.abs(Math.cos(latitude * DEG) * Math.cos(dec * DEG));
  if (a - b > 1e-12) return '拱极：始终在地平线上方';
  if (a + b < -1e-12) return '永不升起';
  if (Math.abs(b) < 1e-12) return '高度不变（地平切线需另分）';
  return '有升有落';
}
export function gnomon(height, sun) {
  if (sun.up <= 1e-10) return {length: null, east: null, north: null};
  return {length: height * Math.hypot(sun.east, sun.north) / sun.up, east: -height * sun.east / sun.up, north: -height * sun.north / sun.up};
}
// 与短距高信噪比目录样本相适应的视差倒数；不用于低信噪比或负视差。
export function parallaxDistance(plx, error) {
  if (!(plx > 0) || error / plx >= 0.2) return null;
  return {pc: 1000 / plx, sigma: 1000 * error / plx ** 2};
}
export function starPosition(star, radialBlend = 1, shell = 50) {
  const d = parallaxDistance(star.parallaxMas, star.parallaxErrorMas);
  return equatorialVector(star.raDeg, star.decDeg, shell * (1 - radialBlend) + d.pc * radialBlend);
}
export function angularSeparation(a, b) {
  const dot = a.reduce((s, x, i) => s + x * b[i], 0);
  const norm = Math.hypot(...a) * Math.hypot(...b);
  return Math.acos(clamp(dot / norm)) / DEG;
}
// sec(z)=1/sin(h)仅作平面平行近似，低于15度主动不外推。
export function airMass(altitude) {return altitude >= 15 ? 1 / Math.sin(altitude * DEG) : null;}
export function solarDay(siderealDays, yearDays) {return 1 / (1 / siderealDays - 1 / yearDays);}
export function calendarDrift(years, mode) {
  const target = 365.2422;
  let days = 0;
  return Array.from({length: Math.floor(years) + 1}, (_, k) => {
    if (k) {const y = 2000 + k - 1; days += mode === '365' ? 365 : 365 + (mode === 'julian' ? +(y % 4 === 0) : +(y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)));}
    return [k, days - k * target];
  });
}
