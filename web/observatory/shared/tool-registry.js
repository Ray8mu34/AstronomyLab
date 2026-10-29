// Stable tool entry points. Content packages may refer to these IDs; tools do
// not depend on a course, article catalogue, or paragraph mapping.
export const topics=Object.freeze([
 {key:'space',name:'空间与运动',description:'比较空间关系、观察方向与连续运动。'},
 {key:'light',name:'光与观测',description:'探索光谱、仪器、计数与图像显示。'},
 {key:'stars',name:'恒星与银河',description:'浏览恒星模型、银河结构与宇宙背景资料。'},
 {key:'measure',name:'航天与测量',description:'改变轨道条件，或从观测量推算尺度。'},
].map(Object.freeze));

export const confirmedModes=Object.freeze(Object.fromEntries(Object.entries({
 'solar-system':['explore','distance','sizes','compare','axes'],
 'earth-moon':['phase','spin','period','eclipse'],
 alignments:['venus','mars','transit'],
 sky:['sky','stars','measure','calendar','day','precession'],
 optics:['imaging','resolution','sampling'],
 light:['thermal','motion','magnitude','observing'],
 imaging:['real','teaching'],
 stars:['hr','evolution','pulsar','collapse','ia'],
 galaxy:['galaxy','cmb','cmb-spectrum'],
 orbits:['orbit','transfer','staging','landing'],
 measure:['shadow','jupiter','s2','distance'],
 'galaxy-measurements':['distance','rotation','mass'],
 cosmology:['expansion','distance'],
 tides:['locking','earth-moon'],
 'planet-environments':['balance','atmosphere','escape'],
 lunisolar:['calendar','intercalation'],
 'image-calibration':['calibration','photometry'],
 'stellar-interior':['equilibrium','thermostat','transport'],
 'supernova-light':['diffusion','radioactivity'],
}).map(([id,modes])=>[id,Object.freeze(modes)])));

export const labs=Object.freeze([
 {slug:'solar-system',title:'太阳系沙盘',url:'/labs/solar-system/',topic:'space',question:'太阳系有多空，行星有多不同？',summary:'选中天体，比较轨道距离、尺寸、共同指标与自转轴。'},
 {slug:'earth-moon',title:'日地月',url:'/labs/earth-moon/',topic:'space',question:'受光、观察与对齐，怎样改变所见？',summary:'对照月相、同步自转、两种月周期与日月食几何。'},
 {slug:'tides',title:'地月潮汐',topic:'space',question:'形变与力矩怎样改变自转和轨道？',summary:'联动潮汐形变、同步自转与地月角动量交换。'},
 {slug:'planet-environments',title:'行星环境',topic:'space',question:'能量收支和分子运动怎样塑造行星环境？',summary:'比较辐射平衡、大气红外吸收与热运动速率。'},
 {slug:'alignments',title:'行星相位与视运动',topic:'space',question:'空间中同向运动，为什么会出现不同相位和视逆行？',summary:'联动轨道与观察方向，改变均匀圆盘的凌星条件。'},
 {slug:'sky',title:'天球与时间',topic:'space',question:'换一个纬度、方向或参照，一天和天空怎样改变？',summary:'实验太阳路径、星表距离、圭表、历法与地轴方向。'},
 {slug:'optics',title:'望远镜光学',topic:'light',question:'放大星点，一定能看清更多细节吗？',summary:'比较光路、离焦、口径、大气视宁与像素采样。'},
 {slug:'light',title:'星光与观测',topic:'light',question:'颜色、谱线和亮度，分别响应什么条件？',summary:'对照黑体谱、速度、传播损失与观测噪声。'},
 {slug:'imaging',title:'天文图像',topic:'light',question:'同一份数据，为什么能呈现不同颜色？',summary:'分开真实窄带源值、合成计数与显示处理。'},
 {slug:'stars',title:'恒星模型与极端现象',topic:'stars',question:'模型轨迹与几何示意，各能解释什么？',summary:'浏览赫罗图与演化轨道，实验灯塔、坍缩和合成光变。'},
 {slug:'galaxy',title:'银河与宇宙背景',topic:'stars',question:'空间结构、天空方向和平均频谱，有什么区别？',summary:'切换银河视角，探索背景图版与FIRAS平均谱。'},
 {slug:'galaxy-measurements',title:'M33：距离与质量',topic:'stars',question:'周期、角尺度与速度怎样给出星系的距离和质量？',summary:'联动造父变星、倾斜速度场、旋转曲线与质量模型。'},
 {slug:'cosmology',title:'宇宙膨胀',topic:'stars',question:'尺度因子怎样连接距离、波长与光度距离？',summary:'改变尺度、观察位置和宇宙参数，比较距离与红移。'},
 {slug:'orbits',title:'轨道与航天',topic:'measure',question:'同样的高度，速度和预算怎样决定下一步？',summary:'比较解析轨道、两次点火、分级与教学着陆过程。'},
 {slug:'measure',title:'天文测量',topic:'measure',question:'一道影子、一条轨道，怎样变成高度和质量？',summary:'从输入尺度与不确定度，追踪几何和动力学推断。'},
 {slug:'lunisolar',title:'月序与置闰',topic:'space',question:'月相与季节怎样安排在同一部日历中？',summary:'比较月年漂移，在实历时间轴上联动朔日、中气与闰月。'},
 {slug:'image-calibration',title:'图像校准与测光',topic:'light',question:'原始计数怎样成为可比较的星光？',summary:'追踪偏置、暗场和平场校准，再测量孔径内的净信号。'},
 {slug:'stellar-interior',title:'恒星的力与能量',topic:'stars',question:'力平衡与能量收支怎样连接恒星结构？',summary:'比较压力与引力，观察温度反馈和气团的浮力。'},
 {slug:'supernova-light',title:'超新星的能量与光变',topic:'stars',question:'内部供能怎样经过膨胀和扩散成为光变曲线？',summary:'联动镍钴衰变、沉积能量、辐射暂存和逸出。'},
].map(tool=>Object.freeze({...tool,id:tool.slug,entry:tool.url||'/lab/'+tool.slug,url:tool.url||'/lab/'+tool.slug,text:tool.summary,modes:confirmedModes[tool.slug],defaultMode:confirmedModes[tool.slug][0]})));

export const labURL=slug=>labs.find(tool=>tool.slug===slug)?.entry||'/lab/'+slug;
export function experimentURL(slug,mode){
 const base=labURL(slug),modes=Object.hasOwn(confirmedModes,slug)?confirmedModes[slug]:null;
 return mode&&Array.isArray(modes)&&modes.includes(mode)?base+'?mode='+encodeURIComponent(mode):base;
}
