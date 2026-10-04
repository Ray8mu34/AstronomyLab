// JPL Table 1 model; distances in AU, angles internally in radians.
export const AU_KM=149597870.7, LIGHT_KM_S=299792.458, DAY_MS=86400000;
export const rad=x=>x*Math.PI/180;
export function julianDate(ms){return ms/DAY_MS+2440587.5;}
export function elementsAt(row,ms){const t=(julianDate(ms)-2451545)/36525;return row.elements.map((x,i)=>x+row.rates[i]*t);}
export function solveKepler(M,e){M=((M+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;let E=M;for(let i=0;i<20;i++){const step=(E-e*Math.sin(E)-M)/(1-e*Math.cos(E));E-=step;if(Math.abs(step)<1e-12)break;}return E;}
export function coordinates(elements,E){const [a,e,I,,peri,node]=elements;const xp=a*(Math.cos(E)-e),yp=a*Math.sqrt(1-e*e)*Math.sin(E);const w=rad(peri-node),o=rad(node),inc=rad(I);return [
 (Math.cos(w)*Math.cos(o)-Math.sin(w)*Math.sin(o)*Math.cos(inc))*xp+(-Math.sin(w)*Math.cos(o)-Math.cos(w)*Math.sin(o)*Math.cos(inc))*yp,
 (Math.cos(w)*Math.sin(o)+Math.sin(w)*Math.cos(o)*Math.cos(inc))*xp+(-Math.sin(w)*Math.sin(o)+Math.cos(w)*Math.cos(o)*Math.cos(inc))*yp,
 Math.sin(w)*Math.sin(inc)*xp+Math.cos(w)*Math.sin(inc)*yp];}
export function positionAt(row,ms){const el=elementsAt(row,ms);return coordinates(el,solveKepler(rad(el[3]-el[4]),el[1]));}
export function orbitPoints(row,ms,count=360){const el=elementsAt(row,ms);return Array.from({length:count},(_,i)=>coordinates(el,i/count*2*Math.PI));}
// Right-handed display: ecliptic (x,y,z) -> three (x,z,-y).
// Radial compression preserves directions, but deliberately distorts ellipses.
export function mapPosition(p,mode){const r=Math.hypot(...p);const display=mode==='distance'?r*3.0:9+10*Math.sqrt(r);const f=r?display/r:0;return [p[0]*f,p[2]*f,-p[1]*f];}
export function displayRadius(radiusKm,mode){return mode==='sizes'?radiusKm/6371.0084:.70+2.7*Math.sqrt(radiusKm/69911);}
export function lightSeconds(distanceAu){return distanceAu*AU_KM/LIGHT_KM_S;}
