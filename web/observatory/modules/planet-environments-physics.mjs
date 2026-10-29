// Solar heating, a grey radiative layer, and a local Maxwell speed distribution.
// Units and model assumptions are recorded in sources/planet-environments.md.
export const SIGMA = 5.670374419e-8;
export const SOLAR_FLUX = 1361;
export const G = 6.67430e-11;
export const EARTH_MASS = 5.9722e24;
export const EARTH_RADIUS_KM = 6371;
export const BOLTZMANN = 1.380649e-23;
export const ATOMIC_MASS = 1.66053906660e-27;
export const GAS_MASSES = Object.freeze({H:1,H2:2,He:4,N2:28,CO2:44});

function finite(value,min,max,name){
 if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw new RangeError(name);
 return value;
}

export function radiationBalance(distance,albedo){
 finite(distance,Number.MIN_VALUE,Infinity,'distance');finite(albedo,0,1,'albedo');
 const irradiance=SOLAR_FLUX/distance**2,incoming=irradiance/4,reflected=incoming*albedo,absorbed=incoming-reflected;
 return {irradiance,incoming,reflected,absorbed,equilibriumTemperature:(absorbed/SIGMA)**.25};
}

export function greyAtmosphere(distance,albedo,emissivity){
 finite(emissivity,0,1,'emissivity');
 const balance=radiationBalance(distance,albedo),surfaceFlux=balance.absorbed/(1-emissivity/2);
 const surfaceTemperature=(surfaceFlux/SIGMA)**.25,atmosphereUp=emissivity*surfaceFlux/2;
 return {...balance,emissivity,surfaceFlux,surfaceTemperature,atmosphereAbsorbed:emissivity*surfaceFlux,
  atmosphereUp,atmosphereDown:atmosphereUp,transmitted:(1-emissivity)*surfaceFlux,
  outgoing:(1-emissivity)*surfaceFlux+atmosphereUp,
  // At epsilon = 0 radiation does not determine a layer temperature.
  atmosphereTemperature:emissivity===0?null:surfaceTemperature/2**.25};
}

export function escapeSpeed(massEarth,radiusEarth,altitudeKm=0){
 finite(massEarth,Number.MIN_VALUE,Infinity,'mass');finite(radiusEarth,Number.MIN_VALUE,Infinity,'radius');finite(altitudeKm,0,Infinity,'altitude');
 return Math.sqrt(2*G*EARTH_MASS*massEarth/((EARTH_RADIUS_KM*radiusEarth+altitudeKm)*1000))/1000;
}

export function mostProbableSpeed(temperature,molecularMass){
 finite(temperature,Number.MIN_VALUE,Infinity,'temperature');finite(molecularMass,Number.MIN_VALUE,Infinity,'molecular mass');
 return Math.sqrt(2*BOLTZMANN*temperature/(ATOMIC_MASS*molecularMass))/1000;
}

// Density per km/s; the independent variable is also km/s.
export function maxwellDensity(speed,temperature,molecularMass){
 finite(speed,0,Infinity,'speed');
 const vp=mostProbableSpeed(temperature,molecularMass),x=speed/vp;
 return 4/Math.sqrt(Math.PI)/vp*x*x*Math.exp(-x*x);
}

// Q(3/2,lambda). The series below lambda=2.5 and continued fraction above it
// avoid subtractive cancellation in the high-speed tail.
export function maxwellTailFromLambda(lambda){
 finite(lambda,0,Infinity,'lambda');if(lambda===0)return 1;if(lambda>750)return 0;
 const a=1.5,factor=Math.exp(-lambda+a*Math.log(lambda)-Math.log(Math.sqrt(Math.PI)/2)),tiny=1e-300;
 if(lambda<a+1){
  let term=1/a,sum=term;
  for(let i=1;i<10000;i++){term*=lambda/(a+i);sum+=term;if(Math.abs(term)<Math.abs(sum)*2e-15)break;}
  return Math.max(0,Math.min(1,1-factor*sum));
 }
 let b=lambda+1-a,c=1/tiny,d=1/b,h=d;
 for(let i=1;i<10000;i++){
  const an=-i*(i-a);b+=2;d=an*d+b;if(Math.abs(d)<tiny)d=tiny;c=b+an/c;if(Math.abs(c)<tiny)c=tiny;d=1/d;
  const step=d*c;h*=step;if(Math.abs(step-1)<2e-15)break;
 }
 return Math.max(0,Math.min(1,factor*h));
}

export function escapeDistribution({temperature,gas,mass,radius,altitude}){
 if(!Object.hasOwn(GAS_MASSES,gas))throw new RangeError('gas');
 const molecularMass=GAS_MASSES[gas],escape=escapeSpeed(mass,radius,altitude),peak=mostProbableSpeed(temperature,molecularMass),lambda=(escape/peak)**2;
 return {molecularMass,escape,peak,lambda,tail:maxwellTailFromLambda(lambda)};
}
