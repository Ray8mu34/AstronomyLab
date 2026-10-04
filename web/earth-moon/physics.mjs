// Independent physical coordinates in kilometres; ecliptic north is +z.
export const C = Object.freeze({earthRadius:6371, moonRadius:1737.4, sunRadius:695700, au:149597870.7, sidereal:27.32166, year:365.256, inclination:5.145, eccentricity:.0549});
export const TAU=2*Math.PI, RAD=Math.PI/180, SYNODIC=1/(1/C.sidereal-1/C.year);
export const add=(a,b)=>a.map((v,i)=>v+b[i]);
export const sub=(a,b)=>a.map((v,i)=>v-b[i]);
export const scale=(a,s)=>a.map(v=>v*s);
export const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const length=a=>Math.hypot(...a);
export const unit=a=>scale(a,1/length(a));
export const clamp=(x,a=-1,b=1)=>Math.max(a,Math.min(b,x));
export const angle=(a,b)=>Math.atan2(length(cross(a,b)),dot(a,b));
export const wrap=x=>((x%TAU)+TAU)%TAU;
export const rotateZ=(v,a)=>[v[0]*Math.cos(a)-v[1]*Math.sin(a),v[0]*Math.sin(a)+v[1]*Math.cos(a),v[2]];
export const rotateX=(v,a)=>[v[0],v[1]*Math.cos(a)-v[2]*Math.sin(a),v[1]*Math.sin(a)+v[2]*Math.cos(a)];
export function kepler(M,e){let E=M;for(let j=0;j<12;j++){const d=(E-e*Math.sin(E)-M)/(1-e*Math.cos(E));E-=d;if(Math.abs(d)<1e-13)break;}return E;}
export function orbit(days, settings={}){
 const a=settings.distance??384400, i=(settings.inclination??C.inclination)*RAD, node=(settings.node??0)*RAD;
 const M=TAU*days/C.sidereal-node, e=settings.libration?C.eccentricity:0, E=kepler(M,e);
 const f=2*Math.atan2(Math.sqrt(1+e)*Math.sin(E/2),Math.sqrt(1-e)*Math.cos(E/2));
 const r=a*(1-e*Math.cos(E)), moon=rotateZ(rotateX([r*Math.cos(f),r*Math.sin(f),0],i),node);
 const solarLongitude=TAU*days/C.year, sun=[C.au*Math.cos(solarLongitude),C.au*Math.sin(solarLongitude),0];
 const marker=rotateZ(rotateX([Math.cos((settings.spin==='fixed'?-node:M)+Math.PI),Math.sin((settings.spin==='fixed'?-node:M)+Math.PI),0],i),node);
 // Sun-relative circular progress is a navigation coordinate, not an exact phase event.
 const progress=wrap(TAU*days/SYNODIC), phaseAngle=angle(sub(sun,moon),scale(moon,-1));
 const k=(1+Math.cos(phaseAngle))/2, markerAngle=angle(marker,scale(moon,-1));
 const longitudeLibration=Math.atan2(Math.sin(f-M),Math.cos(f-M))/RAD;
 return {moon,sun,r,M,E,f,i,node,marker,solarLongitude,progress,phaseAngle,k,markerAngle,longitudeLibration};
}
export function observerPosition(o,eastDegrees=0,northDegrees=0){
 const centre=unit(o.moon), east=unit(cross([0,0,1],centre)), north=unit(cross(centre,east));
 const lon=eastDegrees*RAD, lat=northDegrees*RAD;
 return scale(add(scale(add(scale(centre,Math.cos(lon)),scale(east,Math.sin(lon))),Math.cos(lat)),scale(north,Math.sin(lat))),C.earthRadius);
}
// Small-angle planar overlap of apparent disks; exact inverse-sine angular radii.
// Fraction of the uniformly bright source disk covered by the occulting disk.
export function coveredFraction(R,r,d){
 if(d>=R+r)return 0;
 if(d<=Math.abs(R-r))return Math.min(1,r*r/(R*R));
 const a=Math.acos(clamp((d*d+R*R-r*r)/(2*d*R))),b=Math.acos(clamp((d*d+r*r-R*R)/(2*d*r)));
 const rad=Math.max(0,(-d+R+r)*(d+R-r)*(d-R+r)*(d+R+r));
 return clamp((R*R*a+r*r*b-.5*Math.sqrt(rad))/(Math.PI*R*R),0,1);
}
export function solarObservation(o,observer){
 const s=sub(o.sun,observer),m=sub(o.moon,observer), sunRadius=Math.asin(C.sunRadius/length(s)),moonRadius=Math.asin(C.moonRadius/length(m)),separation=angle(s,m);
 const horizon=dot(unit(observer),unit(s));
 let kind='无日食';
 if(horizon<=0)kind='太阳在几何地平线下';
 else if(separation<sunRadius+moonRadius){
  kind=separation+sunRadius<=moonRadius?'日全食':separation+moonRadius<=sunRadius?'日环食':'日偏食';
 }
 const east=unit(cross([0,0,1],unit(s))), north=unit(cross(unit(s),east)), u=unit(m);
 return {sunRadius,moonRadius,separation,covered:coveredFraction(sunRadius,moonRadius,separation),kind,horizon,x:Math.atan2(dot(u,east),dot(u,unit(s))),y:Math.atan2(dot(u,north),dot(u,unit(s)))};
}
// True tangent-cone geometry of two opaque/emitting spheres. x is behind blocker.
export function shadow(Rsource,Rblock,D,x){
 const q=(Rsource-Rblock)/D,p=(Rsource+Rblock)/D;
 return {umbra:(Rblock-q*x)/Math.sqrt(1-q*q),penumbra:(Rblock+p*x)/Math.sqrt(1-p*p),apex:Rblock/q};
}
export function shadowSection(o,type='solar'){
 const blocker=type==='solar'?o.moon:[0,0,0],target=type==='solar'?[0,0,0]:o.moon,Rblock=type==='solar'?C.moonRadius:C.earthRadius,Rtarget=type==='solar'?C.earthRadius:C.moonRadius;
 const axis=unit(sub(blocker,o.sun)),d=length(sub(blocker,o.sun)),delta=sub(target,blocker),x=dot(delta,axis),perp=sub(delta,scale(axis,x)),rho=length(perp);
 return {blocker,target,Rblock,Rtarget,axis,perp,x,rho,d,...shadow(C.sunRadius,Rblock,d,x)};
}
export function lunarObservation(o){
 const s=shadowSection(o,'lunar');let kind='无月食';
 const q=(C.sunRadius-C.earthRadius)/s.d,p=(C.sunRadius+C.earthRadius)/s.d;
 const ru=C.moonRadius/Math.sqrt(1-q*q),rp=C.moonRadius/Math.sqrt(1-p*p);
 if(s.x>0){if(s.rho+ru<=s.umbra)kind='月全食';else if(s.rho-ru<s.umbra)kind='月偏食';else if(s.rho-rp<s.penumbra)kind='半影月食';}
 return {...s,kind};
}
export function sunlightAt(point,o,blocker='earth'){
 const source=sub(o.sun,point),occ=blocker==='earth'?scale(point,-1):sub(o.moon,point),R=blocker==='earth'?C.earthRadius:C.moonRadius;
 if(length(occ)<=R)return 0;
 if(length(occ)>length(source)||dot(source,occ)<=0)return 1;
 return 1-coveredFraction(Math.asin(C.sunRadius/length(source)),Math.asin(R/length(occ)),angle(source,occ));
}
export function phaseName(progress){const names=['新月附近','盈蛾眉月','上弦附近','盈凸月','满月附近','亏凸月','下弦附近','亏蛾眉月'];return names[Math.round(wrap(progress)/TAU*8)%8];}
