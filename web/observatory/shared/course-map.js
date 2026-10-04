// One public course/experiment registry. Scientific text and models live in their original files.
export const topics=[
 {key:'space',name:'空间与运动',range:'01—07',description:'从太阳系的尺度，走到地球上所见的天空。'},
 {key:'light',name:'光与观测',range:'08—10 · 14',description:'从接收到的星光，分辨仪器、天体与图像处理。'},
 {key:'stars',name:'恒星与银河',range:'11—13',description:'把一颗恒星的内部，接到银河与宇宙的尺度。'},
 {key:'measure',name:'航天与测量',range:'15—16',description:'改变速度，或从一个可测量量反推天体。'},
];
export const labs=[
 {slug:'solar-system',title:'太阳系，一张空间地图',tag:'01—02',url:'/labs/solar-system/',lessons:[1,2],topic:'space',question:'太阳系到底有多空，行星又有多不同？',text:'从轨道与尺度进入八颗行星，比较不同环境造就的世界。'},
 {slug:'earth-moon',title:'同一轮月亮，两种视角',tag:'03—04',url:'/labs/earth-moon/',lessons:[3,4],topic:'space',question:'月相、两种月和日月食，是怎样连起来的？',text:'把受光与可见半球分开，从月相走进同步自转、两种月与日月食。'},
 {slug:'alignments',title:'行星怎样在天空转弯',tag:'04',lessons:[4],topic:'space',question:'火星没有掉头，为什么会在星空中逆行？',text:'空间轨道与观测投影联动：金星相位、火星逆行、凌星光变。'},
 {slug:'sky',title:'给天空建立骨架',tag:'05—07',lessons:[5,6,7],topic:'space',question:'换一个纬度或季节，太阳会怎样走？',text:'改变纬度与季节，看天极、太阳路径和坐标；从星图走进恒星的真实空间。'},
 {slug:'optics',title:'从镜筒走到焦平面',tag:'09',lessons:[9],topic:'light',question:'放大星点，就一定能看清更多细节吗？',text:'沿光路认识望远镜，用双星图像区分收光、放大与分辨。'},
 {slug:'light',title:'读懂一束星光',tag:'08、10',lessons:[8,10],topic:'light',question:'颜色和亮度，分别能告诉我们什么？',text:'黑体谱、吸收线、径向速度和观测噪声：由曲线推回天体和观测条件。'},
 {slug:'imaging',title:'一张照片是怎样做出来的',tag:'14',lessons:[14],topic:'light',question:'同一份观测，为什么可以呈现不同颜色？',text:'比较原始通道、曝光、配准与拉伸，让颜色和结构保留各自的含义。'},
 {slug:'stars',title:'一颗恒星的内部与一生',tag:'11—12',lessons:[11,12],topic:'stars',question:'恒星为什么能稳定，又为什么终会改变？',text:'结构剖面联动真实模型赫罗图；进入脉冲星灯塔、坍缩和潮汐的几何。'},
 {slug:'galaxy',title:'在银河内，也在银河外',tag:'13',lessons:[13],topic:'stars',question:'身在银河里面，怎样认识它的形状？',text:'从太阳位置看亮带，再离开盘面看结构；把方向图与宇宙背景光分开。'},
 {slug:'orbits',title:'到达太空，还没有入轨',tag:'15',lessons:[15],topic:'measure',question:'同样的高度，为什么有的落回、有的入轨？',text:'同样高度改变横向速度，看落回、束缚与逃逸，算一次转移轨道。'},
 {slug:'measure',title:'从观测量走到宇宙尺度',tag:'16',lessons:[16],topic:'measure',question:'一道影子、一条轨道，怎样变成高度和质量？',text:'用月面阴影、木卫一、S2与距离阶梯，把知识地图串成测量链。'},
];
// Groups confirm their keys before these are enabled in the shared links.
export const confirmedModes={
 'solar-system':['explore','distance','sizes','compare','axes'],
 'earth-moon':['phase','spin','period','eclipse'],
 alignments:['venus','mars','transit'],
 optics:['imaging','resolution','sampling'],
 light:['thermal','motion','magnitude','observing'],
 stars:['hr','evolution','pulsar','collapse','ia'],
 sky:['sky','stars','measure','calendar','day','precession'],
 imaging:['real','teaching'],
 galaxy:['galaxy','cmb','cmb-spectrum'],
 orbits:['orbit','transfer','staging','landing'],
 measure:['shadow','jupiter','s2','distance'],
};
const target=(slug,mode,label)=>({slug,mode,label});
export const lessonEntries={
 1:{question:'把行星放回空间里，太阳系会是什么样？',targets:[target('solar-system','explore','太阳系沙盘'),target('solar-system','distance','比较轨道距离')]},
 2:{question:'行星的大小、环境和命运为什么不同？',targets:[target('solar-system','sizes','比较行星尺寸'),target('solar-system','compare','共同指标与地球参照'),target('solar-system','axes','自转轴与逆行')]},
 3:{question:'一轮月相、一次自转与两种月，各在数什么？',targets:[target('earth-moon','phase','月相双视角'),target('earth-moon','spin','比较自转'),target('earth-moon','period','两种周期')]},
 4:{question:'相位与遮挡，怎样从空间构型变成观测？',targets:[target('earth-moon','eclipse','日月食'),target('alignments','venus','金星相位'),target('alignments','mars','火星逆行'),target('alignments','transit','凌星光变')]},
 5:{question:'季节与历法，怎样从天体运动中产生？',targets:[target('sky','sky','纬度与季节'),target('sky','calendar','年长与历法'),target('sky','day','两种一天')]},
 6:{question:'星图上的邻居，真的在空间中相邻吗？',targets:[target('sky','stars','从方向到距离')]},
 7:{question:'用什么参照与测量，给天空建立骨架？',targets:[target('sky','sky','参照平面与视角'),target('sky','measure','圭表与太阳影子'),target('sky','precession','地轴岁差示意')]},
 8:{question:'同一束星光，为什么有时容易看、有时难看？',targets:[target('light','observing','观测与噪声')]},
 9:{question:'收光、成像、放大与分辨，各改变了什么？',targets:[target('optics','imaging','光路与像面'),target('optics','resolution','口径与分辨'),target('optics','sampling','倍率与采样')]},
 10:{question:'怎样从颜色、亮度和谱线读出天体的物理？',targets:[target('light','thermal','连续谱与温度'),target('light','motion','谱线与运动'),target('light','magnitude','温度、距离与消光')]},
 11:{question:'恒星内部的平衡，怎样连接到它的一生？',targets:[target('stars','hr','温度与光度的赫罗图'),target('stars','evolution','演化与内部剖面')]},
 12:{question:'引力、坍缩与几何，怎样产生极端现象？',targets:[target('stars','collapse','坍缩与潮汐'),target('stars','pulsar','脉冲星灯塔'),target('stars','ia','Ia 光变校正示意')]},
 13:{question:'银河的亮带与宇宙的背景光，分别是什么证据？',targets:[target('galaxy','galaxy','银河内外'),target('galaxy','cmb','CMB 全天方向'),target('galaxy','cmb-spectrum','FIRAS 平均谱')]},
 14:{question:'天文图像里的颜色与结构，是怎样得到的？',targets:[target('imaging','real','真实窄带通道'),target('imaging','teaching','教学计数与配准')]},
 15:{question:'如何用速度、能量与预算读懂一次航天任务？',targets:[target('orbits','orbit','横向速度与轨道'),target('orbits','transfer','两次点火升轨'),target('orbits','staging','分级与预算'),target('orbits','landing','着陆减速')]},
 16:{question:'从实际测量量，怎样一步步推向宇宙尺度？',targets:[target('measure','shadow','月面阴影测高'),target('measure','jupiter','木卫一称木星'),target('measure','s2','S2称银心'),target('measure','distance','距离阶梯与误差')]},
};
export const labURL=slug=>labs.find(l=>l.slug===slug)?.url||'/lab/'+slug;
export function experimentURL(slug,mode){const base=labURL(slug),modes=Object.hasOwn(confirmedModes,slug)?confirmedModes[slug]:null;return mode&&Array.isArray(modes)&&modes.includes(mode)?base+'?mode='+encodeURIComponent(mode):base;}
