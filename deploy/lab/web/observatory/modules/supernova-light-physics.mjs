// Homologous, radiation-dominated one-zone diffusion with complete local
// deposition. Units of samples: day, 1e36 W and 1e42 J. See source record.
export const SN_CONSTANTS=Object.freeze({day:86400,solarMass:1.98847e30,c:299792458,beta:13.8,tauNi:8.77,tauCo:111.3,epsilonNi:3.90e6,epsilonCo:6.78e5});
export const SN_DEFAULTS=Object.freeze({nickelMass:.6,ejectaMass:1.4,opacity:.1,velocity:10000,day:18});
export const SN_LIMITS=Object.freeze({nickelMass:[.05,1],ejectaMass:[1,5],opacity:[.03,.2],velocity:[5000,20000],day:[0,120]});
const finite=(v,lo,hi,name)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<lo||v>hi)throw new RangeError('Invalid '+name);return v;};
export function validateSupernovaParameters(input){
 const state={...SN_DEFAULTS,...input};
 for(const [key,[lo,hi]]of Object.entries(SN_LIMITS))finite(state[key],lo,hi,key);
 if(state.nickelMass>state.ejectaMass)throw new RangeError('Nickel mass exceeds ejecta mass');
 return state;
}
export function decayChain(day){
 finite(day,0,1e6,'time');const {tauNi,tauCo}=SN_CONSTANTS;
 const nickel=Math.exp(-day/tauNi),cobalt=Math.exp(-day/tauCo)*(-Math.expm1(-day*(1/tauNi-1/tauCo)))/(1-tauNi/tauCo);
 return {nickel,cobalt,iron:Math.max(0,1-nickel-cobalt)};
}
export function radioactiveHeating(day,nickelMass){
 finite(day,0,1e6,'time');finite(nickelMass,0,100,'nickel mass');
 const {tauNi,tauCo,epsilonNi,epsilonCo,solarMass,day:seconds}=SN_CONSTANTS;
 const niExp=Math.exp(-day/tauNi),coDifference=Math.exp(-day/tauCo)*(-Math.expm1(-day*(1/tauNi-1/tauCo))),mass=nickelMass*solarMass;
 const nickel=mass*epsilonNi*niExp/1e36,cobalt=mass*epsilonCo*coDifference/1e36;
 const deposited=mass*seconds*((epsilonNi-epsilonCo)*tauNi*(-Math.expm1(-day/tauNi))+epsilonCo*tauCo*(-Math.expm1(-day/tauCo)))/1e42;
 return {nickel,cobalt,total:nickel+cobalt,deposited};
}
export function diffusionTime({ejectaMass,opacity,velocity}){
 finite(ejectaMass,1,5,'ejecta mass');finite(opacity,.03,.2,'opacity');finite(velocity,5000,20000,'velocity');
 const {solarMass,c,beta,day}=SN_CONSTANTS;
 return Math.sqrt(2*(opacity*.1)*(ejectaMass*solarMass)/(beta*c*(velocity*1000)))/day;
}
// Integrate luminosity rather than the singular E/t equation. Its regular
// initial value L(0)=0 is equivalent to zero initial stored radiation energy.
export function integrateDiffusion(heating,tau,{horizon=120,step=.025}={}){
 finite(tau,4,1000,'diffusion time');finite(horizon,.001,120,'horizon');finite(step,.0001,.1,'step');
 const count=Math.ceil(horizon/step),h=horizon/count,f=(t,l)=>2*t/(tau*tau)*(heating(t)-l),energyUnit=SN_CONSTANTS.day/1e6;
 function advance(t,l,r,h){
  const a=f(t,l),b=f(t+h/2,l+h*a/2),c=f(t+h/2,l+h*b/2),d=f(t+h,l+h*c);
  return [l+h*(a+2*b+2*c+d)/6,r+energyUnit*h*(l+2*(l+h*a/2)+2*(l+h*b/2)+(l+h*c))/6];
 }
 const rows=[{time:0,luminosity:0,escaped:0,stored:0}];
 const row=(time,l,escaped)=>({time,luminosity:l,escaped,stored:time>0?l*tau*tau/(2*time)*energyUnit:0});
 for(let i=1;i<=count;i++){const previous=rows[i-1],[l,r]=advance(previous.time,previous.luminosity,previous.escaped,h);rows.push(row(i*h,l,r));}
 return {rows,at(time){finite(time,0,horizon,'time');const i=Math.min(count,Math.floor(time/h)),base=rows[i],dt=time-base.time;if(dt<1e-12)return {...base};const [l,r]=advance(base.time,base.luminosity,base.escaped,dt);return row(time,l,r);}};
}
export function supernovaModel(input,{step=.025}={}){
 const state=validateSupernovaParameters(input),tau=diffusionTime(state),trajectory=integrateDiffusion(t=>radioactiveHeating(t,state.nickelMass).total,tau,{step});
 const enrich=row=>{const heating=radioactiveHeating(row.time,state.nickelMass),expansion=heating.deposited-row.escaped-row.stored;return {...row,heating:heating.total,nickelHeating:heating.nickel,cobaltHeating:heating.cobalt,deposited:heating.deposited,expansion:Math.max(0,expansion),workPower:row.time>0?row.stored/row.time*1e6/SN_CONSTANTS.day:heating.total/2,...decayChain(row.time)};};
 const samples=trajectory.rows.map(enrich);let peak=samples[0];for(const row of samples)if(row.luminosity>peak.luminosity)peak=row;
 return {state,tau,samples,peak,at:time=>enrich(trajectory.at(time))};
}
