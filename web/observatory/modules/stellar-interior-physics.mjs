// Original analytic teaching models; source, assumptions and derivations:
// /sources/stellar-interior.md. SI constants; displayed ratios are dimensionless.
export const STELLAR_CONSTANTS=Object.freeze({G:6.67430e-11,k:1.380649e-23,mH:1.6735575e-27,mu:.61,solarMass:1.98847e30,solarRadius:6.957e8,sigma:5.670374419e-8});
export const STELLAR_DEFAULTS=Object.freeze({mass:1,radius:1,shell:.55,support:1,initialRadius:.9,reaction:'pp',thermalTime:0,opacity:1,flux:1,displacement:.4});
const bounded=(value,low,high,name)=>{if(!Number.isFinite(value)||value<low||value>high)throw new RangeError(name);return value;};

export function uniformStar(mass=1,radius=1,support=1){
 bounded(mass,.5,3,'mass');bounded(radius,.5,3,'radius');bounded(support,.5,1.5,'support');
 const {G,k,mH,mu,solarMass,solarRadius}=STELLAR_CONSTANTS,M=mass*solarMass,R=radius*solarRadius;
 const density=3*M/(4*Math.PI*R**3),centralPressure=3*G*M*M/(8*Math.PI*R**4),surfaceGravity=G*M/R**2;
 const potential=-3*G*M*M/(5*R),internal=-support*potential/2,centralTemperature=support*mu*mH*G*M/(2*k*R);
 return {mass:M,radius:R,density,centralPressure:centralPressure*support,surfaceGravity,centralTemperature,potential,internal,total:potential+internal,
  at(x){bounded(x,0,1,'fractional radius');return {x,r:x*R,mass:M*x**3,pressure:support*centralPressure*(1-x*x),temperature:centralTemperature*(1-x*x),gravity:surfaceGravity*x,pressureAcceleration:support*surfaceGravity*x,netAcceleration:(support-1)*surfaceGravity*x,pressureGradient:-support*density*surfaceGravity*x};},
 };
}

export function reactionExponent(reaction){if(reaction==='pp')return 4;if(reaction==='cno')return 17;throw new RangeError('reaction');}
export function thermostatRate(q,reaction='pp'){
 if(!Number.isFinite(q)||q<=0)throw new RangeError('radius ratio');
 const exponent=3+reactionExponent(reaction),nuclear=q**(-exponent);
 return {dq:q*q*(nuclear-1),nuclear,temperature:1/q,density:1/q**3,totalEnergy:-1/q,internalEnergy:1/q,potentialEnergy:-2/q};
}
export function thermostatTrajectory(initialRadius=.9,reaction='pp',{step=.00025}={}){
 bounded(initialRadius,.85,1.15,'initial radius');reactionExponent(reaction);bounded(step,.00001,.002,'integration step');
 const count=Math.ceil(1/step),h=1/count,values=[initialRadius];
 function advance(q,dt){const f=x=>thermostatRate(x,reaction).dq,a=f(q),b=f(q+dt*a/2),c=f(q+dt*b/2),d=f(q+dt*c);return q+dt*(a+2*b+2*c+d)/6;}
 for(let i=1;i<=count;i++)values.push(advance(values[i-1],h));
 const at=time=>{bounded(time,0,1,'thermal time');const index=Math.min(count,Math.floor(time/h)),rest=time-index*h,q=rest>1e-13?advance(values[index],rest):values[index];return {time,radius:q,...thermostatRate(q,reaction)};};
 const samples=Array.from({length:201},(_,i)=>at(i/200));
 return {initialRadius,reaction,at,samples};
}

// Local reference layer. Opacity and flux factors change the radiative trial
// gradient; other base properties remain fixed. The gas parcel is adiabatic.
export const TRANSPORT_REFERENCE=Object.freeze({pressure:5e12,temperature:3e6,gravity:1000,opacity:.2,adiabaticGradient:.4});
export function transportLayer(opacity=1,flux=1,displacement=.4){
 bounded(opacity,.5,2,'opacity factor');bounded(flux,.5,2,'flux factor');bounded(displacement,0,.8,'pressure displacement');
 const p=TRANSPORT_REFERENCE,{sigma}=STELLAR_CONSTANTS;
 const referenceFlux=.25*16*sigma*p.gravity*p.temperature**4/(3*p.opacity*p.pressure);
 const gradient=.25*opacity*flux,pressureRatio=Math.exp(-displacement),environmentTemperature=Math.exp(-gradient*displacement),parcelTemperature=Math.exp(-p.adiabaticGradient*displacement);
 const environmentDensity=pressureRatio/environmentTemperature,parcelDensity=pressureRatio/parcelTemperature;
 const buoyancy=parcelTemperature/environmentTemperature-1;
 return {gradient,adiabaticGradient:p.adiabaticGradient,opacity:p.opacity*opacity,flux:referenceFlux*flux,referenceFlux,pressureRatio,environmentTemperature,parcelTemperature,environmentDensity,parcelDensity,buoyancy,heightScale:-Math.expm1(-gradient*displacement)/gradient,unstable:gradient>p.adiabaticGradient+1e-12};
}
