import {confirmedModes} from './course-map.js';

// Public reading links only. These are existing article section IDs; source
// articles, figures and scientific models are not rewritten by this registry.
const path=(lesson,anchor,slug,mode,label,suffix='')=>Object.freeze({
 id:`l${String(lesson).padStart(2,'0')}-${slug}-${mode}${suffix?'-'+suffix:''}`,
 lesson,anchor,slug,mode,label,
});
export const learningPaths=Object.freeze([
 path(1,'从夜空中的亮点到不同种类的世界','solar-system','explore','在太阳系沙盘中辨认世界'),
 path(1,'一张纸装不下的距离','solar-system','distance','比较太阳系的轨道距离'),
 path(2,'一颗行星究竟有多大','solar-system','sizes','用同一比例比较行星尺寸'),
 path(2,'地球为什么比水星更密却未必更富铁','solar-system','compare','比较半径、质量与密度'),
 path(2,'旋转方向需要一根带方向的轴','solar-system','axes','比较自转轴与旋转方向'),
 path(3,'两个半球的交叠形成一个月的形状','earth-moon','phase','对照照明半球与可见月相'),
 path(3,'一个月为什么会有两种长度','earth-moon','period','分别走到恒星月与朔望月'),
 path(3,'同一张脸恰恰说明它在转动','earth-moon','spin','比较同步自转与完全不自转'),
 path(4,'每月都有朔望为什么不是每月都有食','earth-moon','eclipse','改变日月食的对齐条件'),
 path(4,'晨星昏星与金星的另一种月相','alignments','venus','对照金星轨道与所见相位'),
 path(4,'逆行的是天空中的位置不是轨道突然反转','alignments','mars','看火星空间运动与视逆行'),
 path(4,'从太阳表面的小黑点到遥远恒星的一次变暗','alignments','transit','改变遮挡几何，比较光变'),
 path(5,'L05-C01','sky','sky','改变纬度与季节，看太阳路径'),
 path(5,'一天是相对于谁转一圈','sky','day','比较恒星日与太阳日的终点'),
 path(5,'L05-C03','sky','calendar','比较历法累计误差'),
 path(6,'方向地图怎样获得第三个维度','sky','stars','把目录距离放回方向星图'),
 path(7,'L07-C01','sky','sky','切换天球的参照平面'),
 path(7,'L07-C05','sky','precession','观察地轴与天赤道的岁差'),
 path(7,'L07-C06','sky','measure','改变太阳方向，读取竖表影长'),
 path(8,'没有城市灯天空仍然会发光','light','observing','比较背景、曝光与观测噪声'),
 path(9,'L09-C01','optics','imaging','移动接收面，比较成像'),
 path(9,'L09-C03','optics','resolution','比较口径、大气与分辨'),
 path(9,'相机像素怎样接住这些信息','optics','sampling','比较连续像与像素采样'),
 path(10,'恒星的颜色是一项比值测量','light','thermal','改变温度，读取连续谱'),
 path(10,'一条谱线怎样告诉我们运动','light','motion','分开谱线位移与展宽'),
 path(10,'L10-C02','light','magnitude','分别改变温度、距离与消光'),
 path(11,'把几百万颗恒星放到同一张图上','stars','hr','读赫罗图上的温度与光度'),
 path(11,'L11-C02','stars','evolution','对照表面、核心与演化轨迹'),
 path(12,'L12-C03','stars','collapse','比较核心坍缩与外层的去向'),
 path(12,'L12-C02','stars','collapse','比较视界附近的潮汐尺度','tides'),
 path(12,'L12-C05','stars','pulsar','看旋转辐射束与固定视线'),
 path(12,'L12-C04','stars','ia','比较Ia合成样本的峰值校正'),
 path(13,'L13-C01','galaxy','galaxy','从银河内部与外部比较亮带'),
 path(13,'几乎均匀的背景里为什么还要找十万分之一','galaxy','cmb','在CMB全天图上选择方向'),
 path(13,'L13-C03','galaxy','cmb-spectrum','比较FIRAS平均谱与教学温差'),
 path(14,'L14-C03','imaging','real','改变真实窄带通道的显示赋色'),
 path(14,'为什么多拍几分钟会有用却不会无限有用','imaging','teaching','改变教学曝光，比较计数与噪声'),
 path(15,'L15-C01','orbits','orbit','改变横向速度，比较轨道形状'),
 path(15,'L15-C01','orbits','transfer','比较升轨时的两次点火'),
 path(15,'分级把已经用完的东西留在身后','orbits','staging','同步比较丢弃与携带空一级'),
 path(15,'返回时必须把速度和能量交给谁','orbits','landing','比较点火时机与触地速度'),
 path(16,'L16-C01','measure','shadow','从月面阴影反推山高'),
 path(16,'木星旁边的小点让时间变成质量','measure','jupiter','从卫星轨道称量木星'),
 path(16,'L16-C02','measure','s2','从S2轨道称量银河中心'),
 path(16,'L16-C03','measure','distance','改变距离标尺，比较误差传播'),
]);

export function pathsForLesson(number){
 const lesson=Number(number);
 return Number.isInteger(lesson)?learningPaths.filter(p=>p.lesson===lesson):[];
}
export function pathsForExperiment(slug,mode){
 const modes=Object.hasOwn(confirmedModes,slug)?confirmedModes[slug]:null;
 if(!Array.isArray(modes)||!modes.includes(mode))return [];
 return learningPaths.filter(p=>p.slug===slug&&p.mode===mode);
}
export function readingURL(record){
 const known=record&&learningPaths.find(p=>p.id===record.id);
 return known?`/read/${String(known.lesson).padStart(2,'0')}#${encodeURIComponent(known.anchor)}`:'/courses';
}
