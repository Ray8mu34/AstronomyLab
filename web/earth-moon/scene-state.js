// Input recipes, not a texture/data archive. Physics is the protected R1 model.
import * as P from './physics.mjs';
export const MODEL_VERSION='earth-moon-geometry-2026-10-03';
export const MODEL_HASH='ef55855f6dab85125f3b347c91ede8eca6a7a32f2ce692a3b4e0ba46cbfe6a13';
export const MODES=['phase','spin','period','eclipse'];
const ranges={days:[-1,60],inclination:[0,10],node:[0,180],distance:[356400,406700],east:[-75,75],north:[-75,75],speed:[.001,5]};
const choices={mode:MODES,spin:['sync','fixed'],observe:['moon','sun'],view:['paired','space','observer','reference','shadow'],reference:['ecliptic-inertial']};
const keys=[...Object.keys(ranges),...Object.keys(choices),'libration','red','trueScale','camera','guidePreset'];
const record=o=>o&&typeof o==='object'&&!Array.isArray(o);
export function validateState(input){
 if(!record(input)||Object.keys(input).some(k=>!keys.includes(k)))throw new Error('场景包含未知字段。');
 const out={};
 for(const [k,[min,max]]of Object.entries(ranges)){if(typeof input[k]!=='number'||!Number.isFinite(input[k])||input[k]<min||input[k]>max)throw new Error(`${k} 必须在 ${min}—${max} 范围内。`);out[k]=input[k];}
 for(const [k,values]of Object.entries(choices)){if(!values.includes(input[k]))throw new Error(`${k} 选项无效。`);out[k]=input[k];}
 for(const k of ['libration','red','trueScale']){if(typeof input[k]!=='boolean')throw new Error(`${k} 必须为布尔值。`);out[k]=input[k];}
 if(!record(input.camera)||Object.keys(input.camera).some(k=>!['position','target'].includes(k)))throw new Error('相机格式无效。');
 out.camera={};for(const k of ['position','target']){const v=input.camera[k];if(!Array.isArray(v)||v.length!==3||v.some(x=>typeof x!=='number'||!Number.isFinite(x)||Math.abs(x)>500))throw new Error('相机坐标无效。');out.camera[k]=[...v];}
 const distance=Math.hypot(...out.camera.position.map((x,i)=>x-out.camera.target[i]));if(distance<3||distance>180)throw new Error('相机距离必须在3—180展示单位内。');
 if(input.guidePreset!==null&&!['total','annular','partial','miss','lunar'].includes(input.guidePreset))throw new Error('预设身份无效。');out.guidePreset=input.guidePreset;
 if(out.view==='reference'&&out.mode!=='period'||out.view==='shadow'&&out.mode!=='eclipse')throw new Error('此模式没有该视图。');
 return out;
}
export function defaultState(mode='phase'){
 if(!MODES.includes(mode))throw new Error('未知模式。');
 const out={mode,days:P.SYNODIC/4,inclination:P.C.inclination,node:0,distance:384400,spin:'sync',libration:false,east:0,north:0,red:false,speed:2,trueScale:false,observe:'moon',view:'paired',reference:'ecliptic-inertial',camera:{position:[.0001,.0001,23],target:[0,0,0]},guidePreset:null};
 if(mode==='spin')Object.assign(out,{days:0,inclination:0});
 if(mode==='period')Object.assign(out,{days:0,inclination:0,view:'reference'});
 if(mode==='eclipse')Object.assign(out,{days:-.12,inclination:P.C.inclination,node:90,distance:360000,observe:'sun',speed:.01,guidePreset:'miss'});
 return out;
}
export function encodeRecipe(state){return {format:'astronomy-lab-scene',version:1,tool:'earth-moon',modelVersion:MODEL_VERSION,modelHash:MODEL_HASH,state:validateState(state)};}
export function decodeRecipe(value){
 if(!record(value)||Object.keys(value).some(k=>!['format','version','tool','modelVersion','modelHash','state'].includes(k))||value.format!=='astronomy-lab-scene'||value.version!==1||value.tool!=='earth-moon'||value.modelVersion!==MODEL_VERSION||value.modelHash!==MODEL_HASH)throw new Error('工具、格式或模型版本不匹配；当前场景未改变。');
 return validateState(value.state);
}
