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
 lunisolar:Object.freeze({
  calendar:context('月年与季节','由朔望月组成的年怎样移动到不同季节？','改变经过年数，比较十二个月与回归年的端点。','月年与季节的间隔逐年积累，十九年的月数比较显示另一种近似配合。','此页使用平均朔望月和回归年；十九年二百三十五个月用于周期比较。',[step('[data-key="years"]',8,'八年月年累计偏离同一季节')],step('[data-key="years"]',19,'比较235朔望月与19回归年')),
  intercalation:context('朔日、中气与闰月','两个冬至月之间怎样安排月序？','选择实历年份和月份，对照朔日、中气与月名。','选中月份的边界与中气位置对应，闰月延续前一月的月名。','实历例子采用香港天文台日期，按 UTC+8 民用日划分月份。',[step('[data-key="cycle"]','2025','显示含闰六月的冬至月区间'),step('[data-key="leapMonth"]','8','选中闰六月及其无中气区间')],step('[data-key="cycle"]','2026','切换到无闰月的区间')),
 }),
 'image-calibration':Object.freeze({
  calibration:context('计数校准','偏置、暗信号和响应差异怎样进入原始计数？','对同一幅合成原图切换校准步骤，读取同一像素。','加性信号通过相减校正，像素响应通过平场归一校正。','原图与校准帧为固定种子的合成计数；各校准步骤采用各自的曝光与单位。',[step('[data-key="subtractBias"]',false,'保留偏置时校准结果改变'),step('[data-key="divideFlat"]',false,'响应差异保留在图像中')],step('[data-key="noise"]',false,'关闭随机噪声以比较确定的校准关系')),
  photometry:context('孔径测光','目标孔径和周围天空怎样给出净星光？','改变孔径半径，比较图中覆盖范围和增长曲线。','净信号由孔径计数减去按面积折算的局地背景得到。','在合成校准图上测量孔径与天空环；净信号随孔径大小和背景估计共同变化。',[step('[data-key="aperture"]',4,'孔径与当前测量点同步改变'),step('[data-key="star"]','b','切换到另一颗合成星')],step('[data-key="sky"]',20,'天空背景改变，局地背景扣除同步更新')),
 }),
 'stellar-interior':Object.freeze({
  equilibrium:context('压力与引力','压力梯度怎样平衡向内的引力？','选择球壳位置，改变压力支撑倍率并比较两种力。','相同位置的向外压力作用与向内引力在平衡时相等。','采用均匀密度的理想气体球；压力倍率表示瞬时扰动，等于1时为静力平衡。',[step('[data-key="shell"]',.6,'读取另一球壳的压力与引力'),step('[data-key="support"]',1.2,'压力作用大于引力')],step('[data-key="support"]',1,'恢复静力平衡')),
  thermostat:context('收缩与温度反馈','收缩增温怎样改变核反应供能？','改变初始半径和反应温度敏感度，再推进模型时间。','半径、温度和供能沿同一能量方程变化并趋向平衡。','采用固定质量的同源单区模型与固定表面光度；时间按热时间归一。',[step('[data-key="initialRadius"]',.9,'较小初态具有更高温度和供能'),step('[data-key="thermalTime"]',.5,'推进后比较反馈过程')],step('[data-key="initialRadius"]',1,'平衡初态保持不变')),
  transport:context('辐射梯度与浮力','辐射需要的温度梯度何时使气团产生浮力？','改变不透明度和通量，再抬升气团。','气团沿绝热线变化，与环境的温度和密度差决定浮力方向。','局部同成分单原子理想气体；比较辐射试探分层与绝热气团的稳定性。',[step('[data-key="opacity"]',2,'辐射所需温度梯度增大'),step('[data-key="displacement"]',.4,'抬升气团并读取密度差')],step('[data-key="opacity"]',.5,'较小辐射梯度下浮力恢复稳定')),
 }),
 'supernova-light':Object.freeze({
  diffusion:context('供能、暂存与逸出','内部沉积的能量怎样成为光变曲线？','改变抛射物质量或不透明度，比较供能与出射光度。','扩散时间改变能量暂存和光变峰的位置，膨胀做功进入能量收支。','采用同源膨胀、灰不透明度和全局部沉积的单区模型；初始激波热能取零。',[step('[data-key="opacity"]',.2,'较慢扩散改变光变峰'),step('[data-key="day"]',40,'追踪同一时刻的能量收支')],step('[data-key="nickelMass"]',.3,'镍质量改变供能与光度尺度')),
  radioactivity:context('镍、钴与衰变供能','两级衰变怎样接续为超新星供能？','沿时间轴比较镍、钴、铁的数量和两种衰变功率。','镍减少、钴先增后减，铁逐渐积累，功率的主导来源随时间改变。','采用 ⁵⁶Ni→⁵⁶Co→⁵⁶Fe 链，初始放射性物质为纯镍；可沉积能量不计中微子。',[step('[data-key="day"]',18,'比较镍与钴的数量和供能'),step('[data-key="day"]',80,'钴衰变主导较晚供能')],step('[data-key="day"]',0,'初始钴与铁的数量为零')),
 }),
 'galaxy-measurements':Object.freeze({
  distance:context('M33 距离','变星周期与亮度怎样给出距离？','改变距离模数，选择另一颗合成变星。','周光关系与样本位置、线性尺度和光度同时响应距离。','周光图采用合成样本与固定标定；角尺度和通量保持不变。',[step('[data-key="mu"]',24.8,'样本与周光关系的间隔改变'),step('[data-key="cepheid"]','3','选中变星在关系图中标出')],step('[data-key="mu"]',24.622,'回到 M33 参考距离附近')),
  rotation:context('倾斜速度场','视向速度怎样投影出星系旋转？','改变倾角和盘面方位，比较速度场与曲线选点。','选点的视向速度随 sin i cos φ 改变，圆周速度由同一解析模型给出。','采用圆周运动的薄盘模型；颜色表示扣除系统速度后的视向速度。',[step('[data-key="inclination"]',70,'视向速度振幅增加'),step('[data-key="azimuth"]',90,'短轴方向的视向分量为零')],step('[data-key="inclination"]',0,'正面朝向时视向旋转分量为零')),
  mass:context('旋转与质量','固定速度与角半径，距离怎样进入质量估计？','改变距离模数，再调节发光物质和暗晕的模型分量。','球对称等效质量随距离一次方变化；固定通量的光度随距离平方变化。','质量采用 M=v²R/G 的球对称等效量；各速度分量来自解析教学模型。',[step('[data-key="mu"]',24.829,'距离约增10%，动力学质量约增10%'),step('[data-key="stellarScale"]',1.5,'发光物质分量增大')],step('[data-key="haloScale"]',0,'移除暗晕模型分量后的曲线可比较')),
 }),
 cosmology:Object.freeze({
  expansion:context('尺度与红移','尺度因子怎样改变距离和光波？','调节尺度因子，切换参考星系。','星系间距与波长同步伸长，换参考点保持各对星系的相对距离。','星系位于固定共动坐标；光波满足 1+z=a观测/a发射。',[step('[data-key="scale"]',1,'距离与波长共同改变')],step('[data-key="scale"]',.5,'半尺度时距离与波长同时缩短')),
  distance:context('膨胀史与距离','同一红移怎样对应不同光度距离？','改变红移与物质密度，比较两条距离曲线。','选点的光度距离和距离模数差由同一个膨胀模型计算。','采用空间平直、物质与宇宙学常数的 FLRW 模型；两模型共用 H₀。',[step('[data-key="redshift"]',.5,'显示 z=0.5 的光度距离比较'),step('[data-key="omegaMatter"]',.3,'物质占比0.3对应较大的光度距离')],step('[data-key="omegaMatter"]',1,'物质模型与对照曲线重合')),
 }),
 tides:Object.freeze({
  locking:context('潮汐同步','形变滞后怎样把自转推向同步？','推进模型时间，追踪表面标记、潮汐形变和自转速率。','潮汐力矩减小自转与公转的速率差，能量耗散与角动量转移同步。','采用圆轨道与线性耗散模型；时间为无量纲 τ，形变放大显示。',[step('[data-key="lockTime"]',120,'自转逐渐靠近公转'),step('[data-key="lockSpin"]',3,'回到快速初始自转条件')],step('[data-key="lockSpin"]',1,'同步初态的力矩为零')),
  'earth-moon':context('地月角动量','地球自转怎样连接月球轨道的变化？','推进模型时间，比较地球自转与月球轨道的角动量。','角动量在两部分之间转移，轨道半径与机械能一起更新。','采用封闭的圆轨道—自转耦合模型；τ 为模型时间，未标定为地质年。',[step('[data-key="earthTime"]',600,'快速地球自转下月球轨道扩大')],step('[data-key="earthSpin"]',.8,'慢于公转的初态使转移方向反转')),
 }),
 'planet-environments':Object.freeze({
  balance:context('辐射平衡','距离和反照率怎样决定行星收到的热量？','改变日心距离和反照率，比较入射、反射与热辐射。','能流宽度、吸收通量与平衡温度同步变化。','太阳辐射按距离平方反比稀释；表面采用全球平均、均匀黑体辐射。',[step('[data-key="distance"]',2,'入射通量降为1AU的四分之一'),step('[data-key="albedo"]',.5,'反射增加，吸收与平衡温度下降')],step('[data-key="albedo"]',1,'全反射极限的吸收通量为零')),
  atmosphere:context('大气与能流','大气红外吸收怎样改变表面温度？','调节大气红外吸收率，追踪上下行能流。','表面与大气温度响应同一能量收支，顶层出射通量保持与吸收相等。','采用短波透明、红外灰体的单层大气；表面为黑体，能流为全球平均。',[step('[data-key="emissivity"]',1,'单层大气完全吸收表面红外辐射')],step('[data-key="emissivity"]',0,'透明极限回到无大气的辐射平衡')),
  escape:context('热运动与逃逸','分子速率分布有多少越过逃逸速度？','切换气体并改变温度，比较速率分布与逃逸阈值。','越过阈值的分布尾部随分子质量、温度和引力条件改变。','采用 Maxwell–Boltzmann 速率分布；尾部面积表示瞬时比例，阈值取指定高度。',[step('[data-key="gas"]','H2','较轻气体的分布移向高速'),step('[data-key="temperature"]',1500,'升温增大高速尾部')],step('[data-key="mass"]',2,'同一半径下更大质量提高逃逸速度')),
 }),
 'solar-system':Object.freeze({
  explore:context('太阳系沙盘','从一颗行星到整个系统，距离与尺寸为何需要分别看？','点选地球，再点木星；拖动相机并回到整体视角。','天体选择、相机目标与参数对应同一对象，轨道仍保持原来的运动方向。','沙盘压缩轨道距离、放大天体；球面统一慢放，实际自转周期见天体资料。',[click('[data-body="earth"]','地球被选中'),click('[data-body="jupiter"]','切到木星且参数同步'),click('#home-view','回到整体视角')],click('[data-mode="distance"]','统一距离展示与沙盘差别可见')),
  distance:context('轨道距离','统一距离比例下，内外行星占据怎样的空间？','选择地球与海王星，比较日心距离及太阳光单程时间。','轨道间距与AU读数一起改变；所选远方对象可通过定位靠近查看。','轨道采用统一距离比例，天体放大为定位标记；实际距离以 AU 读数为准。',[click('[data-body="earth"]','显示地球距离'),click('[data-body="neptune"]','显示海王星距离和光行时')],click('[data-mode="explore"]','压缩展示不会改写物理距离')),
  sizes:context('尺寸比较','同一半径标尺下，行星大小相差多少？','选择地球，再选择木星，读取“地球=1”的半径比。','正交排列与半径参数使用共同参照；选择只改变当前对象说明。','八颗行星按共同半径标尺排列，以地球为参照；排列间隔用于区分天体。',[click('[data-body="earth"]','地球半径作为参照'),click('[data-body="jupiter"]','木星半径比明显较大')],click('[data-body="mercury"]','小球仍可通过列表选中读取')),
  compare:context('共同指标','半径、质量与密度，为什么给出不同排序？','将共同指标从平均半径改为质量，再切换线性与对数刻度。','同一行星的数值、单位和参照更新；对数轴突出比值而非线性差值。','每项指标使用各自的单位；线性刻度比较差值，对数刻度比较倍数。',[step('#comparison-metric','mass','质量单位与排序更新','change'),step('#comparison-scale','log','轴改用对数刻度','change')],step('#comparison-metric','density','质量大不等于密度大','change')),
  axes:context('自转轴','逆行自转取决于轴方向，还是屏幕上的顺逆时针？','点选金星和天王星，对照金色轴与轨道正向法线。','倾角超过90°的轴向对应逆行；每颗行星都按自身轨道北侧观察。','各行星的轨道法线对齐，球体等大并慢放自转，便于比较轴向与倾角。',[click('[data-body="venus"]','金星轴倾角和逆行说明'),click('[data-body="uranus"]','天王星接近横躺的轴向')],click('[data-body="earth"]','不能凭屏幕顺时针判定所有对象逆行')),
 }),
 'earth-moon':Object.freeze({
  phase:context('月相','太阳照亮的一半，怎样成为地球所见的月相？','从上弦起点连续播放，或点满月与新月位置作比较。','空间中的月球位置、太阳方向与放大的月面亮区同步变化。','月相由太阳照明与观察方向共同决定；读数表示可见月面的几何受光比例。',[click('[data-phase="180"]','满月附近'),click('#reset','回到上弦起点'),click('[data-phase="0"]','新月附近')],click('#scale','只改显示比例，受光比例不变')),
  spin:context('同步自转','总是同一面朝向地球，是否说明月球不自转？','比较“同步”与“完全不自转”，用半圈位置追踪同一月面金点。','固定月面金点在同步时持续朝地球，在固定方向时轮流转向别处。','金点标记固定月面位置；开启偏心公转，可观察均匀自转下的经度天平动。',[click('[data-guide-action="day:half"]','半圈位置仍朝地球'),click('[data-spin="fixed"]','同位置固定方向时金点背向地球'),click('#reset','回到同步起点'),click('#libration','开启偏心公转示意')],step('#day',6.83,'偏心公转与均匀自转产生可见经度差')),
  period:context('两种月周期','回到恒星方向与回到新月，为什么不是同一天？','从共同新月起点连续推进，先看恒星月端点，再继续到朔望月端点。','月球已转回恒星参照时太阳方向仍有偏移；继续运动才重新对齐。','采用共面圆轨道与平均周期，分别以远星方向和太阳方向作为回归参照。',[click('#reset','共同新月起点'),click('#sidereal','27.32166天回到恒星方向，仍约5.4%受光'),click('#synodic','29.530589天回到新月')],click('#sidereal','同一恒星参照重复不代表同一月相')),
  eclipse:context('日月食','同样是新月，为什么有时没有遮挡？','把局部时间拖到0小时观察无食新月，再将倾角改为0°比较；载入环食起点并推进到0小时。','角圆面重叠与影锥对应同一物理构型；远近月球会改变全食和环食条件。','观测点相对月下点定位；太阳按均匀亮度圆面计算，月食红光为定性示意。',[step('#eclipse-time',0,'倾斜且偏离交点的新月仍无食'),step('#inclination',0,'理想共面时出现全食'),click('#reset','回到无食示例'),click('[data-preset="annular"]','载入较远月球的环食构型')],step('#eclipse-time',0,'较远月球不能完全盖住太阳，出现太阳亮环')),
 }),
 alignments:Object.freeze({
  venus:context('金星相位','轨道位置、距角与所见受光面如何对应？','依次点下合、最大距角与上合，比较月牙及曲线当前点。','受光比例与地金距离、地心距角响应同一轨道构型。','采用匀速圆轨道；受光比例与距离共同决定几何亮度指标 k/d²。',[click('[data-preset="inferior"]','下合附近背光面朝地球'),click('[data-preset="maximum"]','最大距角接近半相'),click('[data-preset="superior"]','上合接近满相')],step('[data-key="inclination"]',8,'下合并不保证凌日')),
  mars:context('火星视逆行','两颗行星同向公转，投影方向为何会折回？','从冲日前90天播放经过冲日，再看冲日后90天。','空间行星持续同向运动；黄经速度在逆行段变为负，方向图当前点同步。','以理想冲日为第 0 天；方向图绘出地球所见的黄经与黄纬变化。',[click('[data-preset="before"]','冲日前90天'),click('#alignment-play','连续时间推进'),click('[data-preset="opposition"]','冲日附近视黄经速度为负')],step('[data-key="inclination"]',0,'纬度回环退化，不取消逆行机制')),
  transit:context('凌星圆盘','圆面交叠面积怎样成为总光通量的下降？','保持半径比，拖动投影横向位置；再增大半径比比较曲线。','黑圆与当前通量点对应；完全进入均匀圆面时深度为半径比平方。','横轴为投影位置；恒星圆面亮度均匀，通量由两个圆面的交叠面积计算。',[step('[data-key="position"]',-1.6,'圆面之外通量为1'),step('[data-key="position"]',0,'进入圆面通量降低'),step('[data-key="radius"]',.2,'半径比增大使下降变深')],step('[data-key="impact"]',1.4,'大于1+r时全程无交叠')),
 }),
 sky:Object.freeze({
  sky:context('纬度与季节','同一太阳路径，换地点或季节会怎样变化？','保持纬度30°，比较夏至与冬至，再将纬度调到70°。','太阳路径、正午高度与昼长同步变化，参照圈说明方向。','采用理想地平线与几何太阳位置；时间以当地太阳过中天的正午为参照。',[click('[data-season="90"]','北半球夏至太阳路径'),click('[data-season="270"]','冬至太阳路径较低'),step('[data-key="latitude"]',70,'高纬昼长变化')],step('[data-key="obliquity"]',0,'反事实轴倾角0°消除季节赤纬变化')),
  stars:context('方向与距离','星图中相邻的点，恢复距离后仍然靠近吗？','点同一壳层，再恢复目录距离；横移观察者并回到太阳系位置。','同一颗带标签的星从方向壳层进入三维距离，观察方向随位置改变。','选取 13 颗 Hipparcos 星表样本；横移观察点用于比较方向与距离的关系。',[click('[data-blend="0"]','距离被统一到壳层'),click('[data-blend="1"]','恢复各星目录距离'),step('[data-key="offset"]',15,'思想实验观察点改变')],step('[data-key="baseline"]',0,'零基线不给出周年视差摆幅')),
  measure:context('圭表测影','太阳方向变化时，竖表影子为何改变长度和方向？','点太阳正午，比较夏至和冬至日期，再拖动一天时间。','表、光线与影长同步；一年正午与一天影子保留各自参照。','采用水平地面、竖直表与平行太阳光；太阳黄经按日期近似换算。',[click('[data-action="noon"]','地方真太阳时正午'),click('[data-shadow-date="2026-06-21"]','夏至影长'),click('[data-shadow-date="2026-12-21"]','冬至影长')],step('[data-key="hour"]',0,'太阳在地平下时不将影长当可测白昼影子')),
  calendar:context('年长累计','整数日的历年怎样积累相对季节年的偏差？','比较每年365天、四年一闰与公历，读取400年累计差。','同一固定季节年参照下，规则不同使累计偏差不同。','以固定 365.2422 日的季节年为参照，比较不同闰年规则的累计偏差。',[step('[data-key="calendar"]','365','365日年累计明显偏差'),click('[data-calendar-years="400"]','400年累计'),step('[data-key="calendar"]','gregorian','公历误差更小')],step('[data-key="years"]',0,'共同起点各规则累计差为零')),
  day:context('两种一天','地球转回远星方向后，为什么还没到下一次正午？','从共同正午播放到恒星日终点，再继续到平均太阳日终点。','固定远星方向、太阳方向与地球上的经线给出两个不同终点。','采用匀速圆轨道与垂直自转轴；放大差角可看清远星和太阳两个参照。',[click('[data-day-end="0"]','共同正午起点'),click('[data-action="play"]','连续推进到恒星日终点'),click('[data-day-end="24"]','太阳参照终点')],step('[data-key="dayHours"]',24,'同一时刻两个参照不会完全重合')),
  precession:context('地轴岁差','快速自转和缓慢轴向变化，可以怎样分开看？','比较只看轴向与只看快速自转，再拖到半个岁差周期。','蓝轴沿天极轨迹改变指向，黄道北极和目录方向保持固定参照。','地轴以约 26000 年周期匀速进动；自转与岁差分别慢放，星表方向固定。',[step('[data-key="spinMode"]','axis','只看轴向变化'),click('[data-precession="13000"]','半周后指向不同方向'),step('[data-key="spinMode"]','spin','只看自转')],click('[data-precession="26000"]','示意一周回到起始轴向，不保证真实26000年复原')),
 }),
 optics:Object.freeze({
  imaging:context('光路与成像','接收面偏离最佳像面，星点会怎样改变？','保持折射式结构，拖动像面偏移，再回到起点。','金色接收面偏离青色最佳面，波动像实际离焦；光路说明传播顺序。','采用单色近轴与瞳面模型；三维图展示光学结构和传播顺序。',[step('[data-key="focus"]',.04,'接收面移动且像点展宽'),step('[data-key="focus"]',0,'回到最佳像面')],click('[data-type="sct"]','结构示意不等于具体曲面追迹')),
  resolution:context('收光与分辨','口径增大后，收光与双星可分性是否总同时改善？','点只看衍射，比较100和200毫米；再点大气主导。','瑞利尺度、波动像与面积读数同步，视宁限制不会因口径扩大消失。','采用等亮双星、单色 PSF 与高斯视宁；图像灰度归一，收光量见面积读数。',[click('[data-preset="diffraction"]','视宁与离焦归零'),step('[data-key="aperture"]',100,'100mm基准'),step('[data-key="aperture"]',200,'理想收光面积增为4倍')],click('[data-preset="atmosphere"]','2角秒视宁仍在，口径不能消除大气')),
  sampling:context('放大与采样','像素网格更细，是否等于天空分辨率提高？','点采样不足，再缩小像元或增加焦距，比较连续像和积分像。','每像素角尺度改变；连续PSF的天空分辨尺度由口径和视宁决定。','每个像元记录其覆盖面积内的积分光量；两图共用天空角尺度。',[click('[data-preset="undersample"]','粗像素采样'),step('[data-key="pixel"]',2,'像元变小细化采样')],step('[data-key="view"]','eyepiece','目镜只改显示角尺度，不缩小天空PSF')),
 }),
 light:Object.freeze({
  thermal:context('黑体连续谱','温度变化会移动峰位，还是改变整条谱的幅度？','比较3000K和10000K；保留基线后切换峰值归一。','Bλ峰位向短波移动；归一前后的曲线分别保留或移除幅度差。','曲线为每单位波长的黑体辐射 Bλ；温度决定谱形，半径决定整星光度。',[click('[data-preset="cold"]','3000K连续谱'),click('[data-save]','保存低温基线'),click('[data-preset="hot"]','10000K与基线比较')],step('[data-key="normalize"]',true,'峰值归一消除了单位面积发光能力差别')),
  motion:context('谱线位移与展宽','整条谱线移动和自转展宽，怎样分别识别？','先选远离，再选快速自转；将观察倾角降到0°。','中心波长响应径向速度，线宽响应v sin i；静止参考线保持656.28nm。','采用低速多普勒近似，叠加固定内禀线、旋转展宽与仪器高斯响应。',[click('[data-preset="recede"]','线中心红移'),click('[data-preset="spin"]','中心回零而轮廓展宽')],click('[data-preset="pole"]','自转仍在，投影自转为零')),
  magnitude:context('通量与传播','变远、变冷和增加消光，都变暗但有什么不同？','分别点只变远、只变冷、只加尘埃，观察两通带比值。','距离只改幅度；温度与波长相关消光会改变短波/长波比。','S、L 为两段矩形能量通带；C 为两通带通量比的对数指标，消光采用可调幂律。',[click('[data-preset="near"]','近处无尘基准'),click('[data-save]','保存基线'),click('[data-preset="far"]','两通量变成基线百分之一，比值不变')],step('[data-key="dustPower"]',0,'灰消光改变幅度但不改谱形')),
  observing:context('观测与噪声','减掉背景均值，为什么随机涨落还在？','固定噪声样本，比较100s与400s，再增加读出次数。','SNR曲线与期望信号响应曝光；更多读出增加读出方差。','相机孔径计数模型采用假定大气条件；平行大气近似适用于高度角 ≥10°。',[click('[data-preset="short"]','100s'),click('[data-save]','固定比较基线'),click('[data-preset="long"]','400s信噪比改善')],step('[data-key="frames"]',100,'同一总时间分更多帧增加读出方差')),
 }),
 imaging:Object.freeze({
  real:context('真实M17通道','改变赋色或拉伸，三通道源值会改变吗？','选择同一像素，将SHO改为HSO，再保留对照并调拉伸。','当前颜色响应显示设置，源线性值不变；对照冻结为保存时的显示结果。','M17 教育 FITS 经 5×5 均值降采样；零值拼接边缘按缺测处理，源值使用相对单位。',[step('[data-pixel-axis="x"]',160,'固定源网格像素'),step('[data-key="mapping"]','HSO','显示颜色改变，源值保持'),click('[data-reference]','冻结显示对照')],step('[data-key="registered"]',false,'彩边来自人工偏移，非自动天测校正')),
  teaching:context('合成计数','曝光改变测量，拉伸改变显示，两者如何区分？','固定种子比较100s与400s，再只改变显示拉伸。','曝光响应累计值和统计噪声；显示处理不重新生成随机源数据。','合成通道用于比较曝光、背景与噪声；饱和会截断计数，拉伸只改变显示。',[step('[data-key="exposure"]',100,'100s合成计数'),click('[data-reference]','保留初始显示'),step('[data-key="exposure"]',400,'测量源值和噪声改变')],step('[data-key="saturation"]',200,'触及封顶的源信息无法用拉伸恢复')),
 }),
 stars:Object.freeze({
  hr:context('赫罗图','相同温度或相同光度时，半径应该怎样改变？','选同温度比光度，再选同光度比温度，追踪A/B点。','温度向右递减、光度向上增加；半径关系读数与比较点同步。','类别点为教学示例，太阳为名义参照；区域轮廓标示主序、巨星与白矮星的大致位置。',[click('[data-hr-compare="temperature"]','同温度100倍光度对应10倍半径'),click('[data-hr-compare="luminosity"]','同光度2倍温度对应1/4半径')],click('[data-hr-compare="none"]','图中类别并非一颗星必经的成长路线')),
  evolution:context('演化模型','同一颗模型星的表面变化和核心变化怎样对应？','固定初始质量，沿EEP移动；再选择3太阳质量比较氢耗尽年龄。','当前点、年龄、温度、光度与中央成分来自同一轨道；内部剖面是组成示意。','提供 1、3、15 太阳质量的非旋转 MIST 模型；EEP 按演化阶段采样，年龄见读数。',[step('[data-key="mass"]','1','固定1太阳质量模型'),click('[data-stage="454"]','核心氢耗尽附近'),step('[data-key="mass"]','3','读取另一条实际模型')],click('[data-stage="end"]','到实际轨道末端，不生成未覆盖后续')),
  pulsar:context('脉冲星灯塔','恒星一直转，观察者一定会收到脉冲吗？','比较单束扫过与完全错过，再播放固定视线下的慢放。','磁轴与锥束旋转，光变当前点只在束扫过视线时非零。','采用实心双锥与几何强度轮廓；动画慢放显示扫束过程，物理周期决定实际频率。',[click('[data-preset="pulse"]','单束扫过'),click('[data-play]','连续慢放并同步曲线')],click('[data-preset="miss"]','旋转仍在而信号全为零')),
  collapse:context('坍缩与潮汐','核心收缩、外层推出与潮汐尺度，是同一种计算吗？','先拖动坍缩过程，关掉成功推出外层；再切视界与潮汐比较质量。','核心与外层走向不同；固定r/rs时质量增大会降低径向潮汐尺度。','坍缩按无量纲过程坐标展示；潮汐任务独立比较黑洞质量、距离与径向差异加速度。',[step('[data-key="progress"]',.8,'核心收缩与外层示意'),step('[data-key="successful"]',false,'未成功推出外层'),click('[data-collapse-task="tidal"]','进入独立潮汐子任务')],step('[data-key="bhMass"]','4000000','大视界半径不等于同r/rs处更强潮汐')),
  ia:context('Ia合成光变','移除宽度与颜色项后，峰值为什么仍不会完全重合？','对同一7个样本比较校正前后，选择一个样本观察光变宽度。','右图合成峰值散布缩小，左图原人工光变始终保持不变。','七个合成光变样本采用统一校正公式；散布表示样本峰值差异，包含预设残差 ε。',[click('[data-ia-preset="before"]','校正前散布'),click('[data-ia-preset="after"]','移除指定宽度颜色项')],step('[data-key="iaCorrection"]',1,'完全校正仍留非零合成残差')),
 }),
 galaxy:Object.freeze({
  galaxy:context('银河内外','盘内的亮带和盘外的结构，怎样来自不同视线？','点太阳位置，比较沿盘面和银北；再切近红外与无尘埃。','模型视线积分与透过率响应方向和尘埃；真实Gaia/2MASS图版保持各自身份。','点云采样解析光分布，曲线计算视线积分；Gaia 与 2MASS 图版分别展示各自波段的结构。',[click('[data-view="inside"]','太阳位置'),click('[data-preset="plane"]','沿盘面'),click('[data-preset="pole"]','银北方向')],click('[data-preset="clear"]','无尘埃时透过率100%，不是真实银河无尘')),
  cmb:context('CMB全天方向','方向地图上的颜色能直接当作精密温度读数吗？','点选平面方向，或用方向键移动，对照球面与l/b标记。','两个图中的金色标记指向同一天空方向；球半径不表示测得的距离。','Planck 2013 发布图用颜色展示温度起伏；此 JPEG 提供方向浏览，数值温度需科学数据产品。',[step('[data-key="longitude"]',45,'方向标记同步'),step('[data-key="latitude"]',30,'球面与平面方向相同')],step('[data-key="delta"]',0,'独立教学温差不改发布图像素')),
  'cmb-spectrum':context('FIRAS平均谱','平均黑体谱与不同天空方向的起伏，回答什么问题？','改变比较频率，再将独立教学ΔT设为零，展开残差。','43行真实发布谱与2.725K黑体同轴；教学谱差响应ΔT，真实点保持不变。','FIRAS 平均谱按单位频率 Bν 表达；发布总谱由参考黑体与实测残差相加得到。',[step('[data-key="frequency"]',160,'接近Bν峰'),step('[data-key="frequency"]',400,'读取另一频率')],click('[data-preset="zero"]','教学相对谱差为零，FIRAS真实点不变')),
 }),
 orbits:Object.freeze({
  orbit:context('解析轨道','固定释放高度，横向速度怎样区分下落、闭合与逃逸？','比较圆、椭圆与临界抛物线预设，播放或拖动经过时间。','虚线给完整解析轨道，亮线记录已走部分；同一初始状态决定能量和终态。','采用球形地球与无大气二体模型；开放轨道可持续向外延伸，箭头标示离开视窗的方向。',[click('[data-conic-preset="circle"]','闭合圆轨道'),click('[data-conic-preset="ellipse"]','椭圆与时间推进'),click('[data-conic-preset="parabola"]','零能量临界开放轨道')],click('[data-conic-preset="drop"]','零横速径向下落到首次触地')),
  transfer:context('两次点火升轨','到同样远地点，为什么还需要第二次点火？','点到达远地点，再看后续轨迹；切换第二次点火开关。','实心与空心点处于同一经过时间，点火后高圆轨道与未点火返回椭圆分开。','两次瞬时点火连接共面、同向圆轨道；目标高度可调，转移过程采用霍曼升轨模型。',[click('[data-preset="apo"]','到远地点'),click('[data-preset="after"]','同时间比较后续轨迹')],step('[data-key="secondBurn"]',false,'不点火则沿转移椭圆回落')),
  staging:context('分级质量与速度','丢弃空一级，收益为什么在下一段燃烧时显现？','播放相同初始条件的两条过程，定位分离和二级燃烧事件。','分离使仍连接质量跳降，速度保持连续；随后丢弃方案累计Δv增长更快。','采用理想火箭方程，比较相同推进剂预算下的速度增量；分离时速度连续、质量下降。',[click('.ls-transport [data-action="play"]','两方案同步燃烧'),step('[data-param="payload"]',4,'同一有效载荷重新计算过程')],step('[data-param="dry1"]',2,'空一级质量较小，分级收益也较小')),
  landing:context('着陆点火时机','速度降到零时，火箭正好到地面了吗？','比较过早、临界和过晚点火，播放并追踪高度、速度与剩余推进剂。','同一时钟下，关机下落后点火减速；质量消耗使固定推力的加速度变化。','采用固定重力、变质量一维模型；推力在点火时建立，触地速度 ≤2 m/s 归为低速触地。',[click('[data-action="early"]','过早点火'),click('.ls-transport [data-action="play"]','观察停在空中后上升'),click('[data-action="critical"]','临界点火起点')],click('[data-action="late"]','过晚带剩余下降速度触地')),
 }),
 measure:Object.freeze({
  shadow:context('月面影长','同一影长，太阳高度角怎样进入推算峰高？','拖动金色端点量影，或用影长滑杆；再改变太阳高度角。','h=l tanα读数与几何三角形、敏感度曲线同步，误差假设分项显示。','主图为平地、平行光的合成几何，影尖固定在 10 km；LRO 照片作为地貌参照。',[step('[data-key="length"]',10,'量到固定合成影尖'),step('[data-key="alpha"]',10,'推算约1.763km'),step('[data-key="alpha"]',20,'固定影长推得更高山峰')],step('[data-key="alpha"]',2,'小角下相对角误差可能主导')),
  jupiter:context('用轨道称木星','周期相同，轨道尺度增加10%会怎样改变质量推断？','点半长轴增加10%，保留读数对照，再改变周期。','质量按a³/P²响应；近圆卫星动画、参数与当前曲线点对应。','默认轨道参数来自 NASA；误差滑块用于设定假设误差，按近圆轨道估计木星质量。',[click('[data-preset="io10"]','同周期质量增为约1.331倍'),step('[data-key="period"]',2,'周期增加降低推断质量')],step('[data-key="errorA"]',5,'误差带是假设输入，非原表真实测量误差')),
  s2:context('S2与银心质量','角轨道相同，采用距离改变怎样进入中心质量？','点距离增加10%，比较线性半长轴和质量，再改变角半长轴。','距离把角尺度转为AU，三次方依赖把质量推断改变为约1.331倍。','采用 125 mas、8000 pc、16 年的教学参数与 e=0.88 的牛顿椭圆，比较距离对质量推断的影响。',[click('[data-preset="s2distance"]','距离增加10%'),step('[data-key="theta"]',150,'角半长轴改变对应质量')],step('[data-key="errorDistance"]',5,'假设距离误差进入质量，不当最新精密结果')),
  distance:context('距离标尺','同一距离变化，半径、光度和动力学质量为何响应不同？','先改变正视差，再点距离标尺增加10%，比较三个尺度因子。','视差倒数改变几何距离；共同标尺分别产生1.10/1.21/1.331倍关系。','采用正、高信噪比视差与独立小误差的一阶传播；测光样例使用同一波段的星等。',[step('[data-key="p"]',20,'几何距离50pc'),click('[data-preset="scale10"]','共同标尺增加10%')],step('[data-key="p"]',2,'仍限制正高信噪比范围，不外推零视差')),
 }),
});

export function getModeContext(slug,mode){
 if(!Object.hasOwn(confirmedModes,slug)||!confirmedModes[slug].includes(mode))return null;
 return modeContexts[slug]?.[mode]||null;
}
export function modeCoverage(){
 return Object.entries(confirmedModes).flatMap(([slug,modes])=>modes.map(mode=>({slug,mode,...getModeContext(slug,mode)})));
}
