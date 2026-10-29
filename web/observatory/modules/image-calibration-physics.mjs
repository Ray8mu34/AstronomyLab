// Synthetic CCD measurements in ADU; gain is electrons per ADU.
export const CCD=Object.freeze({size:64,gain:2,readNoise:5,bias:600,darkExposure:120,flatElectrons:20000});
export const CALIBRATION_DEFAULTS=Object.freeze({exposure:60,sky:8,darkRate:.5,flatStrength:.55,masterFrames:16,noise:true,seed:4729,subtractBias:true,subtractDark:true,divideFlat:true,star:'a',aperture:4,pixelX:32,pixelY:32,white:2400});
export const SYNTHETIC_STARS=Object.freeze({a:Object.freeze({x:22.5,y:36.5,sigma:1.8,rate:700}),b:Object.freeze({x:46.5,y:20.5,sigma:2.2,rate:420})});
export function randomStream(seed){let s=seed>>>0;return()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return(s+.5)/4294967296;};}
function normal(rng){return Math.sqrt(-2*Math.log(rng()))*Math.cos(2*Math.PI*rng());}
const logFactorials=[0];for(let k=1;k<256;k++)logFactorials[k]=logFactorials[k-1]+Math.log(k);
function logFactorial(k){if(k<256)return logFactorials[k];return(k+.5)*Math.log(k)-k+.5*Math.log(2*Math.PI)+1/(12*k)-1/(360*k**3)+1/(1260*k**5);}
// Inversion for small means; transformed rejection (PTRS) for large means.
export function poisson(mean,rng){
 if(!Number.isFinite(mean)||mean<0)throw new RangeError('Invalid Poisson mean');
 if(mean===0)return 0;
 if(mean<30){const limit=Math.exp(-mean);let p=1,k=0;do{k++;p*=rng();}while(p>limit);return k-1;}
 const root=Math.sqrt(mean),b=.931+2.53*root,a=-.059+.02483*b,alpha=1.1239+1.1328/(b-3.4),vr=.9277-3.6224/(b-2);
 for(;;){const u=rng()-.5,v=rng(),us=.5-Math.abs(u),k=Math.floor((2*a/us+b)*u+mean+.43);if(us>=.07&&v<=vr)return k;if(k<0||(us<.013&&v>us))continue;if(Math.log(v*alpha/(a/(us*us)+b))<=-mean+k*Math.log(mean)-logFactorial(k))return k;}
}
function erf(x){const sign=x<0?-1:1,v=Math.abs(x),t=1/(1+.3275911*v);return sign*(1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-v*v));}
function gaussianPixel(x,y,star){const a=Math.SQRT2*star.sigma;return star.rate*.25*(erf((x+.5-star.x)/a)-erf((x-.5-star.x)/a))*(erf((y+.5-star.y)/a)-erf((y-.5-star.y)/a));}
export function makeCalibrationFrame(values={}){
 const s={...CALIBRATION_DEFAULTS,...values},bounds={exposure:[10,240],sky:[0,30],darkRate:[0,2],flatStrength:[0,.8],masterFrames:[1,64],seed:[1,2147483647]};
 for(const [k,[lo,hi]]of Object.entries(bounds))if(!Number.isFinite(s[k])||s[k]<lo||s[k]>hi)throw new RangeError('Invalid CCD parameter '+k);
 if(!Number.isInteger(s.seed)||!Number.isInteger(s.masterFrames))throw new RangeError('Integer seed and frame count required');
 if(typeof s.noise!=='boolean')throw new TypeError('Noise must be boolean');
 const {size,gain,readNoise,darkExposure,flatElectrons}=CCD,n=size*size;
 const source=new Float64Array(n),response=new Float64Array(n),bias=new Float64Array(n),dark=new Float64Array(n),raw=new Float64Array(n),masterBias=new Float64Array(n),masterDark=new Float64Array(n),masterFlat=new Float64Array(n),ideal=new Float64Array(n);
 const rawRng=randomStream(s.seed),biasRng=randomStream(s.seed^0x4a12f03b),darkRng=randomStream(s.seed^0x07c93da1),flatRng=randomStream(s.seed^0x66bf1b79);
 let responseSum=0;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=y*size+x,r2=((x-31.5)**2+(y-31.5)**2)/(2*31.5**2),dust=Math.exp(-((x-17)**2+(y-17)**2)/36);
  response[i]=(1-s.flatStrength*r2)*(1-.65*s.flatStrength*dust);responseSum+=response[i];
  source[i]=Object.values(SYNTHETIC_STARS).reduce((sum,star)=>sum+gaussianPixel(x,y,star),0);
  bias[i]=CCD.bias+14*Math.sin(y*.48)+.18*(x-31.5);
  dark[i]=s.darkRate*(1+((x===11&&y===28)||(x===41&&y===46)?70:0));
 }
 for(let i=0;i<n;i++)response[i]/=responseSum/n;
 let flatSum=0;
 for(let i=0;i<n;i++){
  const mean=(response[i]*(source[i]+s.sky)+dark[i])*s.exposure;
  raw[i]=bias[i]+(s.noise?poisson(mean,rawRng)+readNoise*normal(rawRng):mean)/gain;
  masterBias[i]=bias[i]+(s.noise?readNoise*normal(biasRng)/(gain*Math.sqrt(s.masterFrames)):0);
  // Dark is already bias-subtracted; these independent calibration products
  // treat upstream additive correction as exact, as specified in the source.
  masterDark[i]=s.noise?(poisson(s.masterFrames*darkExposure*dark[i],darkRng)+readNoise*Math.sqrt(s.masterFrames)*normal(darkRng))/(s.masterFrames*darkExposure):dark[i];
  masterFlat[i]=s.noise?(poisson(s.masterFrames*flatElectrons*response[i],flatRng)+readNoise*Math.sqrt(s.masterFrames)*normal(flatRng))/s.masterFrames:flatElectrons*response[i];
  flatSum+=masterFlat[i];ideal[i]=(source[i]+s.sky)*s.exposure/gain;
 }
 for(let i=0;i<n;i++)masterFlat[i]/=flatSum/n;
 return {size,exposure:s.exposure,gain,source,response,bias,dark,raw,masterBias,masterDark,masterFlat,ideal};
}
export function calibrateFrame(frame,{subtractBias=true,subtractDark=true,divideFlat=true}={}){
 const result=new Float64Array(frame.raw.length);
 for(let i=0;i<result.length;i++){
  let value=frame.raw[i];if(subtractBias)value-=frame.masterBias[i];if(subtractDark)value-=frame.masterDark[i]*frame.exposure/frame.gain;
  if(divideFlat){if(!(frame.masterFlat[i]>0))throw new RangeError('Nonpositive relative flat');value/=frame.masterFlat[i];}result[i]=value;
 }
 return result;
}
function circleWeight(x,y,cx,cy,r){
 const d=Math.hypot(x-cx,y-cy),corner=Math.SQRT1_2;if(d+corner<=r)return 1;if(d-corner>=r)return 0;
 let count=0;const sub=8;for(let j=0;j<sub;j++)for(let i=0;i<sub;i++)if((x-.5+(i+.5)/sub-cx)**2+(y-.5+(j+.5)/sub-cy)**2<r*r)count++;
 return count/(sub*sub);
}
export function aperturePhotometry(data,size,{x,y,radius,inner=10,outer=14}={}){
 if(!Number.isInteger(size)||size<1||data.length!==size*size||![x,y,radius,inner,outer].every(Number.isFinite)||radius<=0||inner<=radius||outer<=inner)throw new RangeError('Invalid aperture geometry');
 let sum=0,area=0,skySum=0,skyArea=0;
 for(let py=0;py<size;py++)for(let px=0;px<size;px++){
  const value=data[py*size+px];if(!Number.isFinite(value))throw new RangeError('Nonfinite image value');
  const weight=circleWeight(px,py,x,y,radius),skyWeight=circleWeight(px,py,x,y,outer)-circleWeight(px,py,x,y,inner);
  sum+=weight*value;area+=weight;skySum+=skyWeight*value;skyArea+=skyWeight;
 }
 if(!(area>0&&skyArea>0))throw new RangeError('Aperture or annulus outside image');
 const background=skySum/skyArea;return {sum,area,background,skyArea,skyTotal:area*background,net:sum-area*background};
}
export function curveOfGrowth(frame,data,starKey){
 const star=SYNTHETIC_STARS[starKey];if(!star)throw new RangeError('Unknown synthetic star');
 return Array.from({length:29},(_,i)=>{const radius=1+i*.25,m=aperturePhotometry(data,frame.size,{...star,radius});return[radius,m.net*frame.gain/frame.exposure];});
}
