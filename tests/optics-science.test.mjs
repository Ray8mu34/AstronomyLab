import test from 'node:test';
import assert from 'node:assert/strict';
import {psf,detector,parameters,skyImageTransform} from '../web/observatory/modules/optics-physics.mjs';
const base={type:'refractor',aperture:130,focal:1000,eyepiece:20,wavelength:550,seeing:.7,focus:0,pixel:4,sensor:22,separation:1.4,view:'camera'};
const sum=a=>a.reduce((a,b)=>a+b,0);
const close=(a,b,tolerance=1e-12)=>assert(Math.abs(a-b)<=tolerance,`${a} differs from ${b}`);
test('Detector preserves absolute flux, bilinear spatial moments and finite support',()=>{
 // Global bilinear polynomial gives an analytic oracle without importing any
 // production integration primitive; total 4 is deliberately not unit flux.
 const n=5,step=.5,half=1,grid=Float64Array.from({length:n*n},(_,k)=>(1+.2*((k%n)*step-half))*(1+.3*(Math.floor(k/n)*step-half))),p={n,step,half,grid};
 const primitive=(t,c)=>t+c*t*t/2;
 const one=(lo,hi,c)=>{lo=Math.max(-1,lo);hi=Math.min(1,hi);return hi>lo?primitive(hi,c)-primitive(lo,c):0;};
 for(const separation of [0,.7,3])for(const scale of [.3,.8,2.3]){
  const d=detector(p,separation,scale);let expectedTotal=0;
  for(let y=0;y<d.count;y++)for(let x=0;x<d.count;x++){
   const lo=x*scale-d.extent,hi=lo+scale,bottom=y*scale-d.extent,top=bottom+scale,expected=.5*(one(lo-separation/2,hi-separation/2,.2)+one(lo+separation/2,hi+separation/2,.2))*one(bottom,top,.3);
   close(d.values[y*d.count+x],expected);expectedTotal+=expected;
  }
  close(d.totalFlux,expectedTotal);assert.equal(d.integration,'exact-bilinear');
  if(d.extent>=half+separation/2)close(d.totalFlux,4);
 }
});
// Independent nodal-basis antiderivatives, rather than production row-prefix
// primitives. This oracle sees every cell and preserves each star's 1/2 flux.
function weights(p,lo,hi){const out=new Float64Array(p.n);for(let k=0;k<p.n-1;k++){const left=-p.half+k*p.step,a=Math.max(lo,left),b=Math.min(hi,left+p.step);if(b<=a)continue;const right=((b-left)**2-(a-left)**2)/(2*p.step);out[k]+=b-a-right;out[k+1]+=right;}return out;}
function oracle(p,d,separation){
 const out=new Float64Array(d.count*d.count);
 const wy=Array.from({length:d.count},(_,y)=>weights(p,y*d.pixelScale-d.extent,(y+1)*d.pixelScale-d.extent));
 for(const shift of [-separation/2,separation/2]){
  const wx=Array.from({length:d.count},(_,x)=>weights(p,x*d.pixelScale-d.extent-shift,(x+1)*d.pixelScale-d.extent-shift));
  for(let y=0;y<d.count;y++)for(let x=0;x<d.count;x++)for(let j=0;j<p.n;j++)if(wy[y][j])for(let i=0;i<p.n;i++)if(wx[x][i])out[y*d.count+x]+=.5*p.grid[j*p.n+i]*wx[x][i]*wy[y][j];
 }return out;
}
test('Nine scientific regression cases meet same-window total and spatial-distribution budgets',()=>{
 const changes=[{}, {seeing:.5,focus:0,focal:400,pixel:10}, {seeing:.5,focus:0,focal:400,pixel:10,aperture:350}, {seeing:0,focal:800,pixel:10,aperture:200}, {seeing:0,focal:1000,pixel:10,aperture:200}, {seeing:0,focal:800,pixel:6,aperture:200}, {seeing:0,focal:1000,pixel:6,aperture:200}, {seeing:0,focal:400,pixel:6,aperture:350,separation:2}, {seeing:0,focal:400,pixel:12,aperture:350}];
 for(const c of changes){const state={...base,...c},p=psf(state),d=detector(p,state.separation,p.parameters.pixelScale),expected=oracle(p,d,state.separation),a=sum(d.values),e=sum(expected),l1=sum(d.values.map((v,i)=>Math.abs(v/a-expected[i]/e)));
  assert(Math.abs(a/e-1)<=1e-3,JSON.stringify(c));assert(l1<=1e-2,`${JSON.stringify(c)} L1=${l1}`);
  assert(d.values.every(v=>v>=-1e-14&&Number.isFinite(v)));
 }
});
test('Fixed sky mapping keeps stars fixed while angular pixel width halves with focal length',()=>{
 let previous;
 for(const focal of [400,800,1600]){const state={...base,focal,pixel:10},p=psf(state),g=skyImageTransform(p.half,260,25,520,state.separation),pixelWidth=parameters(state).pixelScale*g.pixelsPerArcsec;
  const expectedAngularPixel=(180*3600/Math.PI)*(.010/focal);close(pixelWidth,expectedAngularPixel*520/(2*p.half));
  if(previous){assert.deepEqual(g,previous.g);close(pixelWidth,previous.pixelWidth/2);}
  previous={g,pixelWidth};
 }
});
