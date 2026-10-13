import {confirmedModes} from './tool-registry.js';

// Short, self-contained mode contexts. Existing presets, controls, comparison
// views and model explanations remain the interaction; these are not a second
// tutorial system. Test paths describe ordinary public controls for R1 evidence.
const step=(selector,value,expected,action='input')=>Object.freeze({selector,action,value,expected});
const click=(selector,expected)=>step(selector,null,expected,'click');
const context=(title,question,action,observe,boundary,testPath,boundaryStep)=>Object.freeze({
 title,question,action,observe,boundary,testPath:Object.freeze(testPath),boundaryStep,
 depth:'基础适配',
});
export const modeContexts=Object.freeze({
 'solar-system':Object.freeze({
  explore:context('太阳系沙盘','从一颗行星到整个系统，距离与尺寸为何需要分别看？','点选地球，再点木星；拖动相机并回到整体视角。','天体选择、相机目标与参数对应同一对象，轨道仍保持原来的运动方向。','沙盘压缩距离、放大球体；表面同速慢放不能读取真实自转周期，近似轨道不是精密星历。',[click('[data-body="earth"]','地球被选中'),click('[data-body="jupiter"]','切到木星且参数同步'),click('#home-view','回到整体视角')],click('[data-mode="distance"]','统一距离展示与沙盘差别可见')),
  distance:context('轨道距离','统一距离比例下，内外行星占据怎样的空间？','选择地球与海王星，比较日心距离及太阳光单程时间。','轨道间距与AU读数一起改变；所选远方对象可通过定位靠近查看。','此模式比较距离，球体仍作标记放大；沙盘的压缩间距不能当作实际距离。',[click('[data-body="earth"]','显示地球距离'),click('[data-body="neptune"]','显示海王星距离和光行时')],click('[data-mode="explore"]','压缩展示不会改写物理距离')),
  sizes:context('尺寸比较','同一半径标尺下，行星大小相差多少？','选择地球，再选择木星，读取“地球=1”的半径比。','正交排列与半径参数使用共同参照；选择只改变当前对象说明。','排列位置是比较布局，并非真实太阳系位置；太阳不在这列行星中。',[click('[data-body="earth"]','地球半径作为参照'),click('[data-body="jupiter"]','木星半径比明显较大')],click('[data-body="mercury"]','小球仍可通过列表选中读取')),
  compare:context('共同指标','半径、质量与密度，为什么给出不同排序？','将共同指标从平均半径改为质量，再切换线性与对数刻度。','同一行星的数值、单位和参照更新；对数轴突出比值而非线性差值。','指标不同不能共用同一单位；画面编码是数值比较，非空间距离或观测亮度。',[step('#comparison-metric','mass','质量单位与排序更新','change'),step('#comparison-scale','log','轴改用对数刻度','change')],step('#comparison-metric','density','质量大不等于密度大','change')),
  axes:context('自转轴','逆行自转取决于轴方向，还是屏幕上的顺逆时针？','点选金星和天王星，对照金色轴与轨道正向法线。','倾角超过90°的轴向对应逆行；每颗行星都按自身轨道北侧观察。','各轨道法线对齐作比较；球体等大、旋转慢放，未显示真实极轴方位和周期比例。',[click('[data-body="venus"]','金星轴倾角和逆行说明'),click('[data-body="uranus"]','天王星接近横躺的轴向')],click('[data-body="earth"]','不能凭屏幕顺时针判定所有对象逆行')),
 }),
 'earth-moon':Object.freeze({
  phase:context('月相','太阳照亮的一半，怎样成为地球所见的月相？','从上弦起点连续播放，或点满月与新月位置作比较。','空间中的月球位置、太阳方向与放大的月面亮区同步变化。','普通月相不是地影；几何受光面积不等于总亮度，比例开关不改变照明计算。',[click('[data-phase="180"]','满月附近'),click('#reset','回到上弦起点'),click('[data-phase="0"]','新月附近')],click('#scale','只改显示比例，受光比例不变')),
  spin:context('同步自转','总是同一面朝向地球，是否说明月球不自转？','比较“同步”与“完全不自转”，用半圈位置追踪同一月面金点。','固定月面金点在同步时持续朝地球，在固定方向时轮流转向别处。','金点是教学标记，纹理未测绘标定；偏心开关只解释经度天平动。',[click('[data-guide-action="day:half"]','半圈位置仍朝地球'),click('[data-spin="fixed"]','同位置固定方向时金点背向地球'),click('#reset','回到同步起点'),click('#libration','开启偏心公转示意')],step('#day',6.83,'偏心公转与均匀自转产生可见经度差')),
  period:context('两种月周期','回到恒星方向与回到新月，为什么不是同一天？','从共同新月起点连续推进，先看恒星月端点，再继续到朔望月端点。','月球已转回恒星参照时太阳方向仍有偏移；继续运动才重新对齐。','共面匀速平均周期不是单次真实朔望月；显示比例与相机变化不重算天体周期。',[click('#reset','共同新月起点'),click('#sidereal','27.32166天回到恒星方向，仍约5.4%受光'),click('#synodic','29.530589天回到新月')],click('#sidereal','同一恒星参照重复不代表同一月相')),
  eclipse:context('日月食','同样是新月，为什么有时没有遮挡？','把局部时间拖到0小时观察无食新月，再将倾角改为0°比较；载入环食起点并推进到0小时。','角圆面重叠与影锥对应同一物理构型；远近月球会改变全食和环食条件。','观测点偏移相对月下点，不是城市坐标；均匀太阳圆盘与定性红光不预测真实食时或颜色。',[step('#eclipse-time',0,'倾斜且偏离交点的新月仍无食'),step('#inclination',0,'理想共面时出现全食'),click('#reset','回到无食示例'),click('[data-preset="annular"]','载入较远月球的环食构型')],step('#eclipse-time',0,'较远月球不能完全盖住太阳，出现太阳亮环')),
 }),
 alignments:Object.freeze({
  venus:context('金星相位','轨道位置、距角与所见受光面如何对应？','依次点下合、最大距角与上合，比较月牙及曲线当前点。','受光比例与地金距离、地心距角响应同一轨道构型。','匀速圆轨道、球体放大；几何k/d²不是实测亮度，不用于真实日期可见性预报。',[click('[data-preset="inferior"]','下合附近背光面朝地球'),click('[data-preset="maximum"]','最大距角接近半相'),click('[data-preset="superior"]','上合接近满相')],step('[data-key="inclination"]',8,'下合并不保证凌日')),
  mars:context('火星视逆行','两颗行星同向公转，投影方向为何会折回？','从冲日前90天播放经过冲日，再看冲日后90天。','空间行星持续同向运动；黄经速度在逆行段变为负，方向图当前点同步。','零天是人为冲日起点；圆轨道、局部展开黄经不代表真实日期或实际空间轨迹。',[click('[data-preset="before"]','冲日前90天'),click('#alignment-play','连续时间推进'),click('[data-preset="opposition"]','冲日附近视黄经速度为负')],step('[data-key="inclination"]',0,'纬度回环退化，不取消逆行机制')),
  transit:context('凌星圆盘','圆面交叠面积怎样成为总光通量的下降？','保持半径比，拖动投影横向位置；再增大半径比比较曲线。','黑圆与当前通量点对应；完全进入均匀圆面时深度为半径比平方。','横轴为位置而非小时；未加入临边昏暗、噪声与曝光积分，轨道示意不是该行星的实测系统。',[step('[data-key="position"]',-1.6,'圆面之外通量为1'),step('[data-key="position"]',0,'进入圆面通量降低'),step('[data-key="radius"]',.2,'半径比增大使下降变深')],step('[data-key="impact"]',1.4,'大于1+r时全程无交叠')),
 }),
 sky:Object.freeze({
  sky:context('纬度与季节','同一太阳路径，换地点或季节会怎样变化？','保持纬度30°，比较夏至与冬至，再将纬度调到70°。','太阳路径、正午高度与昼长同步变化，参照圈说明方向。','理想化坐标几何，无折射、地形和精密星历；地方真太阳时不等于钟表时间。',[click('[data-season="90"]','北半球夏至太阳路径'),click('[data-season="270"]','冬至太阳路径较低'),step('[data-key="latitude"]',70,'高纬昼长变化')],step('[data-key="obliquity"]',0,'反事实轴倾角0°消除季节赤纬变化')),
  stars:context('方向与距离','星图中相邻的点，恢复距离后仍然靠近吗？','点同一壳层，再恢复目录距离；横移观察者并回到太阳系位置。','同一颗带标签的星从方向壳层进入三维距离，观察方向随位置改变。','仅13颗Hipparcos样本，数十pc横移是思想实验；自行箭头是目录测量，不是长期精密预报。',[click('[data-blend="0"]','距离被统一到壳层'),click('[data-blend="1"]','恢复各星目录距离'),step('[data-key="offset"]',15,'思想实验观察点改变')],step('[data-key="baseline"]',0,'零基线不给出周年视差摆幅')),
  measure:context('圭表测影','太阳方向变化时，竖表影子为何改变长度和方向？','点太阳正午，比较夏至和冬至日期，再拖动一天时间。','表、光线与影长同步；一年正午与一天影子保留各自参照。','水平地面、竖表、平行光；日期黄经近似，未模拟折射、均时差或真实地点地形。',[click('[data-action="noon"]','地方真太阳时正午'),click('[data-shadow-date="2026-06-21"]','夏至影长'),click('[data-shadow-date="2026-12-21"]','冬至影长')],step('[data-key="hour"]',0,'太阳在地平下时不将影长当可测白昼影子')),
  calendar:context('年长累计','整数日的历年怎样积累相对季节年的偏差？','比较每年365天、四年一闰与公历，读取400年累计差。','同一固定季节年参照下，规则不同使累计偏差不同。','季节年固定365.2422日；图表不预报春分时刻，也不编制农历。',[step('[data-key="calendar"]','365','365日年累计明显偏差'),click('[data-calendar-years="400"]','400年累计'),step('[data-key="calendar"]','gregorian','公历误差更小')],step('[data-key="years"]',0,'共同起点各规则累计差为零')),
  day:context('两种一天','地球转回远星方向后，为什么还没到下一次正午？','从共同正午播放到恒星日终点，再继续到平均太阳日终点。','固定远星方向、太阳方向与地球上的经线给出两个不同终点。','圆轨道、轴垂直轨道、匀速模型；差角放大仅辅助说明，真实太阳日会变化。',[click('[data-day-end="0"]','共同正午起点'),click('[data-action="play"]','连续推进到恒星日终点'),click('[data-day-end="24"]','太阳参照终点')],step('[data-key="dayHours"]',24,'同一时刻两个参照不会完全重合')),
  precession:context('地轴岁差','快速自转和缓慢轴向变化，可以怎样分开看？','比较只看轴向与只看快速自转，再拖到半个岁差周期。','蓝轴沿天极轨迹改变指向，黄道北极和目录方向保持固定参照。','约26000年匀速示意、两个速度分别慢放；无章动或长期自行，不能当精密历元星图。',[step('[data-key="spinMode"]','axis','只看轴向变化'),click('[data-precession="13000"]','半周后指向不同方向'),step('[data-key="spinMode"]','spin','只看自转')],click('[data-precession="26000"]','示意一周回到起始轴向，不保证真实26000年复原')),
 }),
 optics:Object.freeze({
  imaging:context('光路与成像','接收面偏离最佳像面，星点会怎样改变？','保持折射式结构，拖动像面偏移，再回到起点。','金色接收面偏离青色最佳面，波动像实际离焦；光路说明传播顺序。','单色近轴/瞳面模型；三维长度示意，SCT仅显示结构顺序，不是加工设计或完整像差计算。',[step('[data-key="focus"]',.04,'接收面移动且像点展宽'),step('[data-key="focus"]',0,'回到最佳像面')],click('[data-type="sct"]','结构示意不等于具体曲面追迹')),
  resolution:context('收光与分辨','口径增大后，收光与双星可分性是否总同时改善？','点只看衍射，比较100和200毫米；再点大气主导。','瑞利尺度、波动像与面积读数同步，视宁限制不会因口径扩大消失。','等亮双星、单色PSF与高斯视宁近似；灰度归一只比形状，不比绝对通量。',[click('[data-preset="diffraction"]','视宁与离焦归零'),step('[data-key="aperture"]',100,'100mm基准'),step('[data-key="aperture"]',200,'理想收光面积增为4倍')],click('[data-preset="atmosphere"]','2角秒视宁仍在，口径不能消除大气')),
  sampling:context('放大与采样','像素网格更细，是否等于天空分辨率提高？','点采样不足，再缩小像元或增加焦距，比较连续像和积分像。','每像素角尺度改变，积分网格更细；连续PSF的天空分辨尺度由口径和视宁决定。','4×4子像素均匀响应求积；显示放大、插值和灰度归一不能恢复缺失的信息。',[click('[data-preset="undersample"]','粗像素采样'),step('[data-key="pixel"]',2,'像元变小细化采样')],step('[data-key="view"]','eyepiece','目镜只改显示角尺度，不缩小天空PSF')),
 }),
 light:Object.freeze({
  thermal:context('黑体连续谱','温度变化会移动峰位，还是改变整条谱的幅度？','比较3000K和10000K；保留基线后切换峰值归一。','Bλ峰位向短波移动；归一前后的曲线分别保留或移除幅度差。','理想黑体每单位波长表示；Bν峰不能简单取倒数，半径改变总光度而非单位表面Bλ。',[click('[data-preset="cold"]','3000K连续谱'),click('[data-save]','保存低温基线'),click('[data-preset="hot"]','10000K与基线比较')],step('[data-key="normalize"]',true,'峰值归一消除了单位面积发光能力差别')),
  motion:context('谱线位移与展宽','整条谱线移动和自转展宽，怎样分别识别？','先选远离，再选快速自转；将观察倾角降到0°。','中心波长响应径向速度，线宽响应v sin i；静止参考线保持656.28nm。','低速多普勒、固定内禀线与仪器高斯卷积；不是真实天体光谱或地球运动校正。',[click('[data-preset="recede"]','线中心红移'),click('[data-preset="spin"]','中心回零而轮廓展宽')],click('[data-preset="pole"]','自转仍在，投影自转为零')),
  magnitude:context('通量与传播','变远、变冷和增加消光，都变暗但有什么不同？','分别点只变远、只变冷、只加尘埃，观察两通带比值。','距离只改幅度；温度与波长相关消光会改变短波/长波比。','400–500nm与600–700nm为矩形教学能量通带；指标C不是B−V，消光幂律非实测定律。',[click('[data-preset="near"]','近处无尘基准'),click('[data-save]','保存基线'),click('[data-preset="far"]','两通量变成基线百分之一，比值不变')],step('[data-key="dustPower"]',0,'灰消光改变幅度但不改谱形')),
  observing:context('观测与噪声','减掉背景均值，为什么随机涨落还在？','固定噪声样本，比较100s与400s，再增加读出次数。','SNR曲线与期望信号响应曝光；更多读出增加读出方差。','平行大气近似高度≥10°，孔径计数模型无真实天气、追踪和平场，不代表人眼可见阈值。',[click('[data-preset="short"]','100s'),click('[data-save]','固定比较基线'),click('[data-preset="long"]','400s信噪比改善')],step('[data-key="frames"]',100,'同一总时间分更多帧增加读出方差')),
 }),
 imaging:Object.freeze({
  real:context('真实M17通道','改变赋色或拉伸，三通道源值会改变吗？','选择同一像素，将SHO改为HSO，再保留对照并调拉伸。','当前颜色响应显示设置，源线性值不变；对照冻结为保存时的显示结果。','校准拼接教育FITS的5×5均值衍生数组；零值边界不是暗云，单位及绝对光度未独立标定。',[step('[data-pixel-axis="x"]',160,'固定源网格像素'),step('[data-key="mapping"]','HSO','显示颜色改变，源值保持'),click('[data-reference]','冻结显示对照')],step('[data-key="registered"]',false,'彩边来自人工偏移，非自动天测校正')),
  teaching:context('合成计数','曝光改变测量，拉伸改变显示，两者如何区分？','固定种子比较100s与400s，再只改变显示拉伸。','曝光响应累计值和统计噪声；显示处理不重新生成随机源数据。','假想通道和简化累计封顶，非真实相机；减背景均值不去除涨落，拉伸不恢复饱和信息。',[step('[data-key="exposure"]',100,'100s合成计数'),click('[data-reference]','保留初始显示'),step('[data-key="exposure"]',400,'测量源值和噪声改变')],step('[data-key="saturation"]',200,'触及封顶的源信息无法用拉伸恢复')),
 }),
 stars:Object.freeze({
  hr:context('赫罗图','相同温度或相同光度时，半径应该怎样改变？','选同温度比光度，再选同光度比温度，追踪A/B点。','温度向右递减、光度向上增加；半径关系读数与比较点同步。','类别点是构造教学示例，太阳为名义参照；区域轮廓不是精确分类或观测星数密度。',[click('[data-hr-compare="temperature"]','同温度100倍光度对应10倍半径'),click('[data-hr-compare="luminosity"]','同光度2倍温度对应1/4半径')],click('[data-hr-compare="none"]','图中类别并非一颗星必经的成长路线')),
  evolution:context('演化模型','同一颗模型星的表面变化和核心变化怎样对应？','固定初始质量，沿EEP移动；再选择3太阳质量比较氢耗尽年龄。','当前点、年龄、温度、光度与中央成分来自同一轨道；内部剖面是组成示意。','仅1/3/15太阳质量非旋转MIST轨道；EEP不等时间，无质量间插值，末端后没有冷却或爆发续算。',[step('[data-key="mass"]','1','固定1太阳质量模型'),click('[data-stage="454"]','核心氢耗尽附近'),step('[data-key="mass"]','3','读取另一条实际模型')],click('[data-stage="end"]','到实际轨道末端，不生成未覆盖后续')),
  pulsar:context('脉冲星灯塔','恒星一直转，观察者一定会收到脉冲吗？','比较单束扫过与完全错过，再播放固定视线下的慢放。','磁轴与锥束旋转，光变当前点只在束扫过视线时非零。','有限实心双锥几何、人工强度轮廓；非实测曲线或全波段辐射预测，动画与物理周期分开。',[click('[data-preset="pulse"]','单束扫过'),click('[data-play]','连续慢放并同步曲线')],click('[data-preset="miss"]','旋转仍在而信号全为零')),
  collapse:context('坍缩与潮汐','核心收缩、外层推出与潮汐尺度，是同一种计算吗？','先拖动坍缩过程，关掉成功推出外层；再切视界与潮汐比较质量。','核心与外层走向不同；固定r/rs时质量增大会降低径向潮汐尺度。','过程条无时间单位、不求解流体；潮汐是径向尺度估计，非完整黑洞轨迹或材料破坏计算。',[step('[data-key="progress"]',.8,'核心收缩与外层示意'),step('[data-key="successful"]',false,'未成功推出外层'),click('[data-collapse-task="tidal"]','进入独立潮汐子任务')],step('[data-key="bhMass"]','4000000','大视界半径不等于同r/rs处更强潮汐')),
  ia:context('Ia合成光变','移除宽度与颜色项后，峰值为什么仍不会完全重合？','对同一7个样本比较校正前后，选择一个样本观察光变宽度。','右图合成峰值散布缩小，左图原人工光变始终保持不变。','人工模板与自选系数，非真实滤镜、SALT拟合或观测精度；残差ε被保留。',[click('[data-ia-preset="before"]','校正前散布'),click('[data-ia-preset="after"]','移除指定宽度颜色项')],step('[data-key="iaCorrection"]',1,'完全校正仍留非零合成残差')),
 }),
 galaxy:Object.freeze({
  galaxy:context('银河内外','盘内的亮带和盘外的结构，怎样来自不同视线？','点太阳位置，比较沿盘面和银北；再切近红外与无尘埃。','模型视线积分与透过率响应方向和尘埃；真实Gaia/2MASS图版保持各自身份。','点云是解析示意，图层开关不改变固定积分模型；两份调查颜色与样本不同，不能逐像素相减。',[click('[data-view="inside"]','太阳位置'),click('[data-preset="plane"]','沿盘面'),click('[data-preset="pole"]','银北方向')],click('[data-preset="clear"]','无尘埃时透过率100%，不是真实银河无尘')),
  cmb:context('CMB全天方向','方向地图上的颜色能直接当作精密温度读数吗？','点选平面方向，或用方向键移动，对照球面与l/b标记。','两个图中的金色标记指向同一天空方向；球半径不表示测得的距离。','Planck2013发布JPEG仅定性颜色，无数值温标；独立ΔT控件不是所选像素温度。',[step('[data-key="longitude"]',45,'方向标记同步'),step('[data-key="latitude"]',30,'球面与平面方向相同')],step('[data-key="delta"]',0,'独立教学温差不改发布图像素')),
  'cmb-spectrum':context('FIRAS平均谱','平均黑体谱与不同天空方向的起伏，回答什么问题？','改变比较频率，再将独立教学ΔT设为零，展开残差。','43行真实发布谱与2.725K黑体同轴；教学谱差响应ΔT，真实点保持不变。','Bν按每单位频率表达；平均谱不是当前方向的测量，发布总谱是黑体加残差而非原仪器读数。',[step('[data-key="frequency"]',160,'接近Bν峰'),step('[data-key="frequency"]',400,'读取另一频率')],click('[data-preset="zero"]','教学相对谱差为零，FIRAS真实点不变')),
 }),
 orbits:Object.freeze({
  orbit:context('解析轨道','固定释放高度，横向速度怎样区分下落、闭合与逃逸？','比较圆、椭圆与临界抛物线预设，播放或拖动经过时间。','虚线给完整解析轨道，亮线记录已走部分；同一初始状态决定能量和终态。','球形地球、无大气的理想二体解析模型；远达月球尺度只作数学示意，视窗不是轨道终点。',[click('[data-conic-preset="circle"]','闭合圆轨道'),click('[data-conic-preset="ellipse"]','椭圆与时间推进'),click('[data-conic-preset="parabola"]','零能量临界开放轨道')],click('[data-conic-preset="drop"]','零横速径向下落到首次触地')),
  transfer:context('两次点火升轨','到同样远地点，为什么还需要第二次点火？','点到达远地点，再看后续轨迹；切换第二次点火开关。','实心与空心点处于同一经过时间，点火后高圆轨道与未点火返回椭圆分开。','共面同向圆轨道间瞬时霍曼升轨，无有限推力或气动；目标高度量级不等于完整静止轨道条件。',[click('[data-preset="apo"]','到远地点'),click('[data-preset="after"]','同时间比较后续轨迹')],step('[data-key="secondBurn"]',false,'不点火则沿转移椭圆回落')),
  staging:context('分级质量与速度','丢弃空一级，收益为什么在下一段燃烧时显现？','播放相同初始条件的两条过程，定位分离和二级燃烧事件。','分离使仍连接质量跳降，速度保持连续；随后丢弃方案累计Δv增长更快。','理想火箭方程，无引力、阻力和分离推力；示意箭体间距不是真实发射轨迹，Δv不是实际入轨速度。',[click('.ls-transport [data-action="play"]','两方案同步燃烧'),step('[data-param="payload"]',4,'同一有效载荷重新计算过程')],step('[data-param="dry1"]',2,'空一级质量较小，分级收益也较小')),
  landing:context('着陆点火时机','速度降到零时，火箭正好到地面了吗？','比较过早、临界和过晚点火，播放并追踪高度、速度与剩余推进剂。','同一时钟下，关机下落后点火减速；质量消耗使固定推力的加速度变化。','变质量一维教学模型、固定g和瞬时建立推力；低速触地≤2m/s只属模型分类，未验证真实结构或制导。',[click('[data-action="early"]','过早点火'),click('.ls-transport [data-action="play"]','观察停在空中后上升'),click('[data-action="critical"]','临界点火起点')],click('[data-action="late"]','过晚带剩余下降速度触地')),
 }),
 measure:Object.freeze({
  shadow:context('月面影长','同一影长，太阳高度角怎样进入推算峰高？','拖动金色端点量影，或用影长滑杆；再改变太阳高度角。','h=l tanα读数与几何三角形、敏感度曲线同步，误差假设分项显示。','主图固定10km影尖是合成几何，非旁边LRO照片实测；未含坡度曲率，误差独立且较小。',[step('[data-key="length"]',10,'量到固定合成影尖'),step('[data-key="alpha"]',10,'推算约1.763km'),step('[data-key="alpha"]',20,'固定影长推得更高山峰')],step('[data-key="alpha"]',2,'小角下相对角误差可能主导')),
  jupiter:context('用轨道称木星','周期相同，轨道尺度增加10%会怎样改变质量推断？','点半长轴增加10%，保留读数对照，再改变周期。','质量按a³/P²响应；近圆卫星动画、参数与当前曲线点对应。','默认来自NASA参数表，但误差滑块是自选假设；未拟合观测序列、纳入卫星质量与木星非球形场。',[click('[data-preset="io10"]','同周期质量增为约1.331倍'),step('[data-key="period"]',2,'周期增加降低推断质量')],step('[data-key="errorA"]',5,'误差带是假设输入，非原表真实测量误差')),
  s2:context('S2与银心质量','角轨道相同，采用距离改变怎样进入中心质量？','点距离增加10%，比较线性半长轴和质量，再改变角半长轴。','距离把角尺度转为AU，三次方依赖把质量推断改变为约1.331倍。','125mas/8000pc/16年是圆整教学参数，e固定0.88；牛顿椭圆不含相对论或最新实测拟合。',[click('[data-preset="s2distance"]','距离增加10%'),step('[data-key="theta"]',150,'角半长轴改变对应质量')],step('[data-key="errorDistance"]',5,'假设距离误差进入质量，不当最新精密结果')),
  distance:context('距离标尺','同一距离变化，半径、光度和动力学质量为何响应不同？','先改变正视差，再点距离标尺增加10%，比较三个尺度因子。','视差倒数改变几何距离；共同标尺分别产生1.10/1.21/1.331倍关系。','正高信噪比视差的一阶误差，无负视差推断；测光样例同波段，未纳入联合拟合协方差。',[step('[data-key="p"]',20,'几何距离50pc'),click('[data-preset="scale10"]','共同标尺增加10%')],step('[data-key="p"]',2,'仍限制正高信噪比范围，不外推零视差')),
 }),
});

export function getModeContext(slug,mode){
 if(!Object.hasOwn(confirmedModes,slug)||!confirmedModes[slug].includes(mode))return null;
 return modeContexts[slug]?.[mode]||null;
}
export function modeCoverage(){
 return Object.entries(confirmedModes).flatMap(([slug,modes])=>modes.map(mode=>({slug,mode,...getModeContext(slug,mode)})));
}
