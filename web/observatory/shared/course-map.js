// Isolated legacy reading compatibility. Tool runtime imports tool-registry.js.
export {topics,labs,confirmedModes,labURL,experimentURL} from './tool-registry.js';
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
