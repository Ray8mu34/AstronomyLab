// Flat FLRW matter + cosmological constant model; distances in Mpc.
// Hogg (1999/2000), sections 3, 4 and 7; see sources/cosmology.md.
export const C_KM_S=299792.458;
export const EMISSION_SCALE=.5;
export const EMISSION_WAVELENGTH_NM=400;
export const COSMOLOGY_DEFAULTS=Object.freeze({scale:1,observer:'A',redshift:.5,hubble:70,omegaMatter:.3});
export const OBSERVERS=Object.freeze({A:Object.freeze([0,0]),B:Object.freeze([-1,1]),C:Object.freeze([1,0])});

function bounded(value,min,max,name){
 if(!Number.isFinite(value)||value<min||value>max)throw new RangeError(`${name} is outside the model domain`);
 return value;
}
export function expansionRate(scale,hubble=70,omegaMatter=.3){
 bounded(scale,.01,100,'scale');bounded(hubble,1,1000,'H0');bounded(omegaMatter,0,1,'Omega_m');
 return hubble*Math.sqrt(omegaMatter/scale**3+1-omegaMatter);
}
export function stretchedLight(scale,emissionScale=EMISSION_SCALE,wavelength=EMISSION_WAVELENGTH_NM){
 bounded(scale,.01,100,'scale');bounded(emissionScale,.01,100,'emission scale');bounded(wavelength,1,1e9,'wavelength');
 const ratio=scale/emissionScale;
 return {ratio,redshift:ratio-1,wavelength:wavelength*ratio,energyRatio:1/ratio,arrivalRateRatio:1/ratio};
}
export function galaxyGrid(scale,observer='A',hubble=70,omegaMatter=.3){
 const origin=OBSERVERS[observer];if(!origin)throw new RangeError('Unknown observer');
 const rate=expansionRate(scale,hubble,omegaMatter),points=[];
 for(let y=-5;y<=5;y++)for(let x=-5;x<=5;x++){
  const dx=(x-origin[0])*60*scale,dy=(y-origin[1])*60*scale,distance=Math.hypot(dx,dy);
  const name=Object.entries(OBSERVERS).find(([,p])=>p[0]===x&&p[1]===y)?.[0]||'';
  points.push({name,x:dx,y:dy,distance,velocity:rate*distance,vx:rate*dx,vy:rate*dy});
 }
 return {rate,points};
}
export function comovingDistance(redshift,hubble=70,omegaMatter=.3){
 bounded(redshift,0,5,'redshift');bounded(hubble,1,1000,'H0');bounded(omegaMatter,0,1,'Omega_m');
 if(redshift===0)return 0;
 // Composite Simpson integration. 1024 equal intervals provide ample accuracy
 // over this teaching tool's z <= 1.2; the exported model accepts z <= 5.
 const n=1024,step=redshift/n;
 const inverseE=z=>1/Math.sqrt(omegaMatter*(1+z)**3+1-omegaMatter);
 let sum=inverseE(0)+inverseE(redshift);
 for(let i=1;i<n;i++)sum+=(i%2?4:2)*inverseE(i*step);
 return C_KM_S/hubble*step*sum/3;
}
export function distanceAt(redshift,hubble=70,omegaMatter=.3){
 const comoving=comovingDistance(redshift,hubble,omegaMatter),luminosity=(1+redshift)*comoving;
 return {comoving,luminosity,modulus:luminosity>0?5*Math.log10(luminosity)+25:null};
}
export function compareDistances(redshift,hubble=70,omegaMatter=.3){
 const current=distanceAt(redshift,hubble,omegaMatter),matter=distanceAt(redshift,hubble,1);
 return {current,matter,deltaModulus:redshift===0?0:current.modulus-matter.modulus,fluxRatio:redshift===0?1:(matter.luminosity/current.luminosity)**2};
}
