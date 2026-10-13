export const CONSTANTS=Object.freeze({G:6.67430e-11,AU:149597870700,day:86400,year:365.25*86400,muSun:1.32712440041279419e20,c:299792458,arcsec:Math.PI/(180*3600)});
export function shadowHeight(lengthKm,alphaDeg,sigmaLengthKm=0,sigmaAlphaDeg=0){
  const a=alphaDeg*Math.PI/180,h=lengthKm*Math.tan(a),sigma=Math.hypot(Math.tan(a)*sigmaLengthKm,lengthKm/Math.cos(a)**2*sigmaAlphaDeg*Math.PI/180);
  return {height:h,sigma};
}
export function dynamicalMass(aMeters,pSeconds,relativeA=0,relativeP=0){
  const mu=4*Math.PI**2*aMeters**3/pSeconds**2,mass=mu/CONSTANTS.G,relative=Math.hypot(3*relativeA,2*relativeP);
  return {mu,mass,solar:mu/CONSTANTS.muSun,relative,sigma:mass*relative};
}
export function s2Mass(angularMas,distancePc,periodYears,errorAngle=.01,errorDistance=.01,errorPeriod=.01){
  const aAU=angularMas/1000*distancePc,a=aAU*CONSTANTS.AU,q=dynamicalMass(a,periodYears*CONSTANTS.year,Math.hypot(errorAngle,errorDistance),errorPeriod);
  return {...q,aAU};
}
export function distanceModulus(m,M,extinction=0,sigmaM=0){
  const modulus=m-M-extinction,distance=10**((modulus+5)/5);
  return {modulus,distance,relative:Math.log(10)/5*sigmaM,sigma:distance*Math.log(10)/5*sigmaM};
}
export function parallaxDistance(mas,sigmaMas=0){return {distance:1000/mas,sigma:1000*sigmaMas/mas**2,relative:sigmaMas/mas};}
export function scalePropagation(factor){return {radius:factor,luminosity:factor**2,mass:factor**3};}
