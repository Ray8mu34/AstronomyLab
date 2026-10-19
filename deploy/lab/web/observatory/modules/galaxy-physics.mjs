// 解析教学模型，距离 kpc；与真实星表、旋臂拟合和像素温度测量分开。
export const PC=3.085677581491367e16;
export const C=299792458, H=6.62607015e-34, K=1.380649e-23;
export const R0=8, T0=2.725;
export const rad=x=>x*Math.PI/180;
export function direction(l,b){l=rad(l);b=rad(b);return[-Math.cos(b)*Math.cos(l),Math.sin(b),Math.cos(b)*Math.sin(l)];}
export function stellarDensity(x,y,z){const r=Math.hypot(x,z);return Math.exp(-r/3.2)*Math.exp(-Math.abs(y)/.32)+2.5*Math.exp(-(x*x+z*z)/3.5-y*y/1.2);}
export function dustDensity(x,y,z){return Math.exp(-Math.hypot(x,z)/4)*Math.exp(-Math.abs(y)/.1);}
export function sightline(l,b,{height=.025,dust=1,infrared=false,steps=180,max=40}={}){
 const d=direction(l,b),ds=max/steps;let tau=0,total=0,unobscured=0;
 for(let i=0;i<steps;i++){const s=(i+.5)*ds,x=R0+d[0]*s,y=height+d[1]*s,z=d[2]*s,j=stellarDensity(x,y,z);const dt=dust*dustDensity(x,y,z)*ds*(infrared?.12:1);total+=j*Math.exp(-(tau+dt/2))*ds;unobscured+=j*ds;tau+=dt;}
 return {intensity:total,unobscured,tau,transmission:Math.exp(-tau),direction:d};
}
export function blackbodyGHz(nuGHz,T=T0){if(T<=0||nuGHz<=0)return 0;const n=nuGHz*1e9;return 2*H*n*n*n/(C*C*Math.expm1(H*n/(K*T)))/1e-20;}// MJy/sr
export function relativeSpectrum(nuGHz,deltaMicroK){return (blackbodyGHz(nuGHz,T0+deltaMicroK*1e-6)/blackbodyGHz(nuGHz,T0)-1)*1e6;}
export function orbitPeriodMyr(rKpc=R0,vKmS=220){return 2*Math.PI*rKpc*1000*PC/(vKmS*1000)/(365.25*86400*1e6);}
export function enclosedSolarMass(rKpc=R0,vKmS=220){return (vKmS*1000)**2*rKpc*1000*PC/6.67430e-11/1.98847e30;}
// Mollweide 投影：l 向左增加，原图中心银心，b 向上；返回 [0,1]。
export function mollweideUV(l,b){const lat=rad(b);let theta=lat; if(Math.abs(lat)>=Math.PI/2-1e-12)theta=Math.sign(lat)*Math.PI/2;else for(let i=0;i<20;i++){const f=2*theta+Math.sin(2*theta)-Math.PI*Math.sin(lat);const den=2+2*Math.cos(2*theta);const d=f/den;theta-=d;if(Math.abs(d)<1e-12)break;}return[.5-rad(l)*Math.cos(theta)/(2*Math.PI),.5-Math.sin(theta)/2];}
export function inverseMollweide(u,v){const sy=1-2*v;if(Math.abs(sy)>1)return null;const theta=Math.asin(sy),ct=Math.cos(theta),x=1-2*u;if(x*x+sy*sy>1+1e-10)return null;const b=Math.asin(Math.max(-1,Math.min(1,(2*theta+Math.sin(2*theta))/Math.PI)));const l=ct>1e-10?Math.PI*x/ct:0;return {l:l*180/Math.PI,b:b*180/Math.PI};}
export function equirectangularUV(l,b){return[.5-l/360,.5-b/180];}
export function inverseEquirectangular(u,v){if(u<0||u>1||v<0||v>1)return null;return{l:(.5-u)*360,b:(.5-v)*180};}
// This parser validates the five-column spectral schema, independent of release identity.
export class FirasValidationError extends Error {
 constructor(code,message){super(message);this.name='FirasValidationError';this.code=code;}
}
const firasError=(code,message)=>{throw new FirasValidationError(code,message);};
function firasColumns(txt){
 if(typeof txt!=='string')firasError('format','FIRAS 内容必须为文本');
 const lines=txt.split(/\r?\n/).map(s=>s.trim()).filter(s=>s&&!s.startsWith('#'));
 if(!lines.length)firasError('empty','FIRAS 表没有数据行');
 let previous=0;
 return lines.map((line,index)=>{
  const fields=line.split(/\s+/);
  if(fields.length!==5)firasError('columns',`FIRAS 第 ${index+1} 行应有五列`);
  // Number() also accepts hex and blank values; the product uses decimal numbers only.
  if(fields.some(value=>!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?$/.test(value)))firasError('number',`FIRAS 第 ${index+1} 行含无效数字`);
  const values=fields.map(Number);
  if(!values.every(Number.isFinite))firasError('number',`FIRAS 第 ${index+1} 行含非有限数字`);
  if(values[0]<=previous)firasError('frequency',`FIRAS 第 ${index+1} 行频率须为正且严格递增`);
  if(values[1]<0)firasError('intensity',`FIRAS 第 ${index+1} 行总谱强度无效`);
  if(values[3]<=0)firasError('sigma',`FIRAS 第 ${index+1} 行一倍标准差须大于零`);
  previous=values[0];return values;
 });
}
const firasRows=columns=>columns.map(a=>({frequencyGHz:a[0]*C/1e7,intensity:a[1],residual:a[2],sigma:a[3],galaxy:a[4]}));
export function parseFiras(txt){return firasRows(firasColumns(txt));}
// 43 rows and this digest identify ONLY the NASA LAMBDA v1 product below.
// To update: verify the official release/column units, review its numeric rows,
// then update this descriptor + digest and the product tests together. Hash the
// JSON array of decimal numeric rows (not file bytes); whitespace is immaterial.
export const FIRAS_MONOPOLE_V1=Object.freeze({
 id:'COBE/FIRAS CMB monopole spectrum v1',version:'v1',rows:43,
 url:'https://lambda.gsfc.nasa.gov/data/cobe/firas/monopole_spec/firas_monopole_spec_v1.txt',
 units:Object.freeze(['cm^-1','MJy/sr','kJy/sr','kJy/sr','kJy/sr']),
 numericSHA256:'5cbb74c254db294cc07403e91ea770ff7d543f17e53eb9c6a7ad76be124659c2'
});
// Local HTTP previews on a classroom LAN may lack WebCrypto. Keep the same
// SHA-256 identity check in that context; never turn unavailable crypto into a bypass.
export async function firasTextSHA256(text){
 const bytes=new TextEncoder().encode(text);
 if(globalThis.crypto?.subtle){const digest=await globalThis.crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');}
 const constants=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
 const state=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
 const padded=new Uint8Array(Math.ceil((bytes.length+9)/64)*64);padded.set(bytes);padded[bytes.length]=0x80;
 const view=new DataView(padded.buffer),bitLength=bytes.length*8;view.setUint32(padded.length-8,Math.floor(bitLength/2**32));view.setUint32(padded.length-4,bitLength>>>0);
 const rotate=(value,count)=>(value>>>count)|(value<<(32-count)),words=new Uint32Array(64);
 for(let offset=0;offset<padded.length;offset+=64){
  for(let i=0;i<16;i++)words[i]=view.getUint32(offset+i*4);
  for(let i=16;i<64;i++){const x=words[i-15],y=words[i-2],s0=rotate(x,7)^rotate(x,18)^(x>>>3),s1=rotate(y,17)^rotate(y,19)^(y>>>10);words[i]=(words[i-16]+s0+words[i-7]+s1)>>>0;}
  let [a,b,c,d,e,f,g,h]=state;
  for(let i=0;i<64;i++){const t1=(h+(rotate(e,6)^rotate(e,11)^rotate(e,25))+((e&f)^(~e&g))+constants[i]+words[i])>>>0,t2=((rotate(a,2)^rotate(a,13)^rotate(a,22))+((a&b)^(a&c)^(b&c)))>>>0;h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;}
  for(const [i,value] of [a,b,c,d,e,f,g,h].entries())state[i]=(state[i]+value)>>>0;
 }
 return state.map(value=>value.toString(16).padStart(8,'0')).join('');
}
export async function validateFirasProduct(txt){
 const columns=firasColumns(txt),product=FIRAS_MONOPOLE_V1;
 if(columns.length!==product.rows)firasError('completeness',`FIRAS ${product.version} 应有 ${product.rows} 行，收到 ${columns.length} 行`);
 // Units are explicit release metadata, not inferred from plausible magnitudes.
 const header=txt.split(/\r?\n/).filter(s=>s.trim().startsWith('#')).map(s=>s.replace(/^\s*#\s?/,'')).join(' ').replace(/\s+/g,' ');
 if(!header.includes('COBE/FIRAS CMB monopole spectrum')||!/v1\s*:\s*initial release, May 2005/.test(header))firasError('product','FIRAS 产品名称或版本不符');
 for(let i=1;i<=5;i++){
  const section=header.match(new RegExp(`Column ${i} = (.*?)(?= Column [1-5] =| Revision History:|$)`))?.[1];
  if(!section||section.match(/units = (\S+)/)?.[1]!==product.units[i-1])firasError('units',`FIRAS 第 ${i} 列单位不符`);
 }
 const numericSHA256=await firasTextSHA256(JSON.stringify(columns));
 if(numericSHA256!==product.numericSHA256)firasError('identity','FIRAS 数值内容与指定 v1 发布产品不符');
 return {rows:firasRows(columns),product:{...product,units:[...product.units]},numericSHA256};
}
