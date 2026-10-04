// Teaching coordinates, not a stellar catalogue. Solar values are nominal references.
export const HR_SOLAR_T=5772;
export const hrDomain={temperature:[40000,2500],logLuminosity:[-4,6]};
export function hrPosition(temperature,luminosity,domain=hrDomain){
 if(!(temperature>0&&luminosity>0))throw new RangeError('Positive temperature and luminosity required');
 const [hot,cool]=domain.temperature,[low,high]=domain.logLuminosity;
 return {x:(Math.log10(hot)-Math.log10(temperature))/(Math.log10(hot)-Math.log10(cool)),y:(high-Math.log10(luminosity))/(high-low)};
}
export function hrRadius(temperature,luminosity){if(!(temperature>0&&luminosity>0))throw new RangeError('Positive temperature and luminosity required');return Math.sqrt(luminosity)*(HR_SOLAR_T/temperature)**2;}
export const hrExamples=Object.freeze([
 {id:'sun',name:'太阳位置',region:'主序',temperature:5772,luminosity:1,kind:'太阳名义参照',description:'太阳位于主序带。这里采用有效温度 5772 K、光度 1 L☉ 的名义参照；不是本次新测量。'},
 {id:'hot',name:'热主序星',region:'主序',temperature:12000,luminosity:100,kind:'教学示例',description:'主序带左上端较热、较亮，右下端较冷、较暗。带上不同点可以是不同质量的恒星，不是一颗星的成长顺序。'},
 {id:'cool',name:'冷主序星',region:'主序',temperature:3200,luminosity:.015,kind:'教学示例',description:'冷而暗的主序星在右下方。纵轴比较恒星自身的总辐射功率，不是从地球看见的亮度。'},
 {id:'giant',name:'红巨星',region:'巨星',temperature:4500,luminosity:100,kind:'教学示例',description:'巨星在主序带上方。表面较冷仍能发出很大的总功率，因为辐射表面积大。区域没有精确的统一边界。'},
 {id:'supergiant',name:'红超巨星',region:'超巨星',temperature:3600,luminosity:100000,kind:'教学示例',description:'超巨星在图的上部，既有冷的红超巨星，也有热的蓝超巨星。图上横跨冷热端的区域表示这一范围。'},
 {id:'dwarf',name:'白矮星',region:'白矮星',temperature:16000,luminosity:.01,kind:'教学示例',description:'白矮星常在左下方：表面热而总光度低，因此辐射半径小。它是致密遗迹，不是主序带右下方的红矮星。'}
]);
export function hrComparison(id='none',example=hrExamples[0]){
 if(id==='temperature')return [{...hrExamples[0],name:'A · 太阳参照'},{id:'compare',name:'B · 同温度',temperature:5772,luminosity:100,kind:'关系示例'}];
 if(id==='luminosity')return [{...hrExamples[0],name:'A · 太阳参照'},{id:'compare',name:'B · 同光度',temperature:11544,luminosity:1,kind:'关系示例'}];
 return [example];
}
