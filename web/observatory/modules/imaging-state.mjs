// A recipe names inputs and display choices. It never contains image arrays,
// arbitrary URLs, or the temporary frozen comparison.
export const IMAGING_SCHEMA='astronomy-imaging-scene';
export const IMAGING_MODEL_VERSION='imaging-counts-and-display-v1';
export const IMAGING_MODEL_HASHES=Object.freeze({imaging:'ec09fa4f6b40e8ab2f9f802d127fb75d82af5395c1772dbec9ef6cdaf0dc2295',light:'b387214038b3f6ac6c2f4f4f88882fc45db107e2afeaba46b466e98cb8d32d10'});
export const M17_HASHES=Object.freeze({'673':'782cafb154161b80d438bec7e795b9b56e5cf7265821831dca48d4635c7a3f55','656':'cf5130bb2ad97c179feaf3191c2db51e1bf35249e6063c6fbb73628f8aa5d1d2','502':'18ec42a1b2a0d7afd4702d82dae2a9c3f01e1d58b389562d500861a5605800bc'});
export const M17_METADATA_HASH='a266890caab1e5389dcccb4dde7832e663bd0906fa8e8b3ced271219c9969486';
export const IMAGING_DEFAULTS=Object.freeze({dataset:'real',channel:1,mapping:'SHO',method:'asinh',strength:10,white:1,black:0,gainS:1,gainH:1,gainO:1,dx:5,dy:-4,registered:true,exposure:100,background:.8,read:3,frames:1,noise:true,subtract:true,saturation:10000,seed:7,plate:'m17'});
const inputKeys=['exposure','background','read','frames','noise','subtract','saturation','seed'];
const displayKeys=['channel','mapping','method','strength','white','black','gainS','gainH','gainO','dx','dy','registered','plate'];
const ranges={channel:[0,2,1],strength:[1,40,1],white:[.1,3,.05],black:[0,.15,.005],gainS:[.1,3,.1],gainH:[.1,3,.1],gainO:[.1,3,.1],dx:[-12,12,1],dy:[-12,12,1],exposure:[10,1200,10],background:[0,8,.1],read:[0,10,.5],frames:[1,30,1],saturation:[200,30000,200],seed:[0,2147483647,1]};
const enums={mapping:['SHO','HSO','HOO'],method:['linear','asinh','log'],plate:['m17','crab','optical','infrared','m33']};
const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const exact=(value,keys,name)=>{if(!record(value)||Object.keys(value).some(k=>!keys.includes(k))||keys.some(k=>!Object.hasOwn(value,k)))throw Error(`${name} 字段不完整或包含未知字段`);};
export function validateImagingValue(key,value){
 if(ranges[key]){const [min,max,step]=ranges[key];if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max||Math.abs((value-min)/step-Math.round((value-min)/step))>1e-6)throw Error(`${key} 超出范围或不是有效步长`);return value;}
 if(enums[key]){if(typeof value!=='string'||!enums[key].includes(value))throw Error(`${key} 选项无效`);return value;}
 if(['noise','subtract','registered'].includes(key)){if(typeof value!=='boolean')throw Error(`${key} 必须为布尔值`);return value;}
 throw Error(`未知设置 ${key}`);
}
export function imagingDataIdentity(mode){return mode==='real'?{id:'m17-education-5x5-v1',gridSize:320,hashes:{...M17_HASHES,metadata:M17_METADATA_HASH},normalization:'positive-p995-per-channel'}:{id:'synthetic-counts-160-v1',gridSize:160,hashes:{...IMAGING_MODEL_HASHES},normalization:'input-rates-p995-times-exposure'};}
export function imagingRecipe(state,pixel){return {schema:IMAGING_SCHEMA,formatVersion:1,tool:'imaging',mode:state.dataset,modelVersion:IMAGING_MODEL_VERSION,modelHashes:{...IMAGING_MODEL_HASHES},data:imagingDataIdentity(state.dataset),inputs:Object.fromEntries(inputKeys.map(k=>[k,state[k]])),display:Object.fromEntries(displayKeys.map(k=>[k,state[k]])),pixel:{...pixel},comparison:{saved:false}};}
export function validateImagingRecipe(candidate){
 exact(candidate,['schema','formatVersion','tool','mode','modelVersion','modelHashes','data','inputs','display','pixel','comparison'],'配方');
 if(candidate.schema!==IMAGING_SCHEMA||candidate.formatVersion!==1||candidate.tool!=='imaging'||!['real','teaching'].includes(candidate.mode)||candidate.modelVersion!==IMAGING_MODEL_VERSION)throw Error('未知配方格式、版本、工具或模式');
 exact(candidate.modelHashes,['imaging','light'],'模型身份');
 if(Object.entries(IMAGING_MODEL_HASHES).some(([k,v])=>candidate.modelHashes[k]!==v))throw Error('模型版本哈希不匹配');
 const expected=imagingDataIdentity(candidate.mode);exact(candidate.data,['id','gridSize','hashes','normalization'],'数据身份');exact(candidate.data.hashes,Object.keys(expected.hashes),'数据哈希');
 if(['id','gridSize','normalization'].some(k=>candidate.data[k]!==expected[k])||Object.entries(expected.hashes).some(([k,v])=>candidate.data.hashes[k]!==v))throw Error('数据集、网格或数据版本哈希不匹配');
 exact(candidate.inputs,inputKeys,'测量输入');exact(candidate.display,displayKeys,'显示设置');exact(candidate.pixel,['x','y'],'检查像素');exact(candidate.comparison,['saved'],'对照状态');
 if(candidate.comparison.saved!==false)throw Error('此版本不导入临时对照图');
 const state={dataset:candidate.mode};for(const k of inputKeys)state[k]=validateImagingValue(k,candidate.inputs[k]);for(const k of displayKeys)state[k]=validateImagingValue(k,candidate.display[k]);
 if(state.white<=state.black)throw Error('显示白点必须高于黑点');
 for(const axis of ['x','y'])if(!Number.isInteger(candidate.pixel[axis])||candidate.pixel[axis]<0||candidate.pixel[axis]>=expected.gridSize)throw Error('检查像素超出当前源网格');
 return imagingRecipe(state,candidate.pixel);
}
export function stateFromRecipe(recipe){return {dataset:recipe.mode,...recipe.inputs,...recipe.display};}
export function parseImagingRecipe(text){
 if(typeof text!=='string'||text.length>65536)throw Error('场景配方必须是小于 64 KiB 的 JSON');
 let candidate;try{candidate=JSON.parse(text);}catch{throw Error('文件不是有效 JSON');}
 if(candidate?.schema==='astronomy-imaging-display-v1'){
  // Legacy processing exports report settings and a sampled pixel; they do not
  // contain a saved comparison. Convert only their known, fully valid fields.
  const s=candidate.state;if(!record(s)||Object.keys(s).some(k=>!Object.hasOwn(IMAGING_DEFAULTS,k)))throw Error('旧处理信息的设置字段无效');
  const state={...IMAGING_DEFAULTS,...s};if(!['real','teaching'].includes(state.dataset))throw Error('旧处理信息的数据模式无效');
  const p=candidate.sourceGridPixel;if(!record(p)||!Number.isInteger(p.x)||!Number.isInteger(p.y))throw Error('旧处理信息缺少有效检查像素');
  candidate=imagingRecipe(state,{x:p.x,y:p.y});
 }
 return validateImagingRecipe(candidate);
}
