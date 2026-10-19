# 日地月实验室：来源、计算与限定

## 当前发行说明（2026-10-04）

本实验已随独立发行仓库和网站公开。下文2026-10-03的获取、处理和核验记录保留其当时范围；“本机使用、未公开上传”是历史状态。`media/moon-near-far-comparison.jpg`及文章素材中的同图现在已纳入发行，第三方组合图再分发仍待核，详见[当前未决清单](/sources/release-status.md)。本轮说明整理没有升级来源许可、真人科学审校、真实试讲或教材对照状态。

## 2026-10-03 获取与核验记录

记录日期：2026-10-03（Asia/Shanghai）。本轮实际读取相关NASA、JPL和纹理许可页面；来源状态为 `checked_with_limits`，仅覆盖下列主张、参数和许可范围。没有取得真人审校或真实课堂试讲记录。

## 科学与参数来源

| 来源 | 本轮读取并采用的内容 | 使用限定 |
| --- | --- | --- |
| [NASA Moon Phases](https://science.nasa.gov/moon/moon-phases/) | 月相由受光与可见半球交叠；同步自转；偏心轨道与经度天平动 | 原页面的简写不能替代细致月轴模型；本实验仅实现经度机制 |
| [NASA Types of Eclipses](https://science.nasa.gov/eclipses/types/) | 全食、环食、偏食和月食的几何条件 | 未建立真实日期预报，也未核验任意一次食的时刻/路径 |
| [NASA SVS 2026月相与天平动](https://svs.gsfc.nasa.gov/5587/) | 真实轨道可视化、倾斜月轨、交点、变化距离和观察方向的对照入口 | 读取了说明；未下载新影片或帧集，未逐日数值比对；不声称复现其精度 |
| [NASA Moon Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html) | 月球均半径1737.4 km、地球均半径6371.0 km；半长轴384400 km、倾角5.145°、偏心率0.0549及约27.3217天周期 | 球形教学近似；表内均值不代表任一时刻的轨道 |
| [NASA Sun Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html) | 太阳均半径695700 km；半度左右的视直径量级 | 本实验恒定日地距离，未建年内变化 |
| [JPL Astrodynamic Parameters](https://ssd.jpl.nasa.gov/astro_par.html) | 1 au = 149597870.7 km；恒星年365.25636天的量级与参照 | 教学采用文章舍入的365.256天；不把恒星年与365.25天儒略年混同 |

恒星月27.32166天沿用第03讲原文，NASA事实表独立支持其舍入值27.3217天。代码的朔望月由 `1/(1/P−1/Y)` 得到29.5305894185天，是选定平均参数下的理想结果，不代表真实每个月的相位间隔。距离滑块356400—406700 km参考SVS所述变化范围，实验可独立调整；不是当年的历表。

曾尝试访问以下候选页面，但本轮浏览工具返回不可访问：`https://eclipse.gsfc.nasa.gov/SEhelp/depend.html`、`https://eclipse.gsfc.nasa.gov/SEhelp/synodic.html`、`https://eclipse.gsfc.nasa.gov/SEhelp/periodicity.html`。这些页面未作为本轮已核验来源；基础模型改用已读取事实表、原文章与独立几何检查，核心实验没有依赖这些失败入口。

课程全文、公式和原有图注来自 `course/03-moon/lesson.md`、`course/04-eclipses-and-alignments/lesson.md` 对应的现有HTML，原文未改。阅读副本只调整资源路径与来源链接。课程原科学/文史主张的核验范围继承原记录，不在本轮一并升级。

## 纹理、图版、代码与署名

- 本地 `textures/moon.jpg` 与 `earth_daymap.jpg` 从已有太阳系网页复制。原始来源 [Solar System Scope / INOVE](https://www.solarsystemscope.com/textures/)，本轮再次读取页尾许可： [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。原包注明基于NASA数据并作色彩调整、缺测地貌补绘；属于纹理素材，不是单幅标定照片。此处应用于球体，月面零经度与极轴未按真实测绘惯例标定，金点为教学标记。
- `media/moon-phases.png`：NASA/JPL-Caltech，月相示意，尺寸与距离未按比例。
- `media/daytime-moon.jpg`：NASA/Bill Dunford，白昼月亮的照片。
- `media/moon-near-far-comparison.jpg`：NASA LRO / Jatan Mehta，近远面对照，第三方组合图的公开再分发许可仍沿用课程记录中的待确认状态；本项目为本机使用，未公开上传。
- `media/eclipse-types.jpeg`：左NASA/MSFC/Joseph Matus，中NASA/Bill Dunford，右NASA/Bill Ingalls；不同事件与曝光的全食、环食、偏食照片。
- `media/venus-transit.jpg`：NASA/SDO, AIA，304 Å通道的赋色太阳，非肉眼红太阳。
- `media/mars-oppositions.jpg`：NASA, ESA and Z. Levay (STScI)，轨道位置与望远镜影像合成对比。
- 上述图版未新增下载、裁切或色彩处理，原图注/波段和来源说明保留在两篇全文中。完整使用条件见工作区 `assets/v02-first4-SOURCES.md`、`assets/v02-first4-ASSETS.csv`。
- `vendor/`沿用既有Three.js 0.180.0和OrbitControls，MIT，许可证在 `vendor/LICENSE`。本轮未安装包或升级依赖。
- `data/resources.json`逐项记录14个复制/阅读资源的源路径、输出路径及SHA256；含两篇文章与源HTML哈希。模型、光照着色器、交互文字、星点背景、影锥SVG和日心小图为本轮原创代码/教学示意，星点不代表真实恒星目录。

## 计算定义

所有物理位置用千米、黄道北为+z。月球绕地心；太阳相对地球的方向按恒星年匀速变化，等价于在日心圆轨道中跟随地球观察。未求解日地月三体运动、质心运动或真实交点进动。起点人为取理想新月，日数不是日期。

圆轨道的平均月球方向为 `2πt/P`；经交点方向和倾角旋转得到空间位置。偏心模式解开普勒方程，均匀自转仍按平均运动，拆出经度天平动。参数变化用于比较条件：调整距离不会同步改变公转周期，不能据动画测得开普勒动力学。

月相面积比例使用相位角公式。GPU按球面法向、物理光源方向及简单漫反射绘制月面；暗部有极弱展示底光，供辨认球体，不能解释为计算过的地照。可选月食红光为人工选色的定性示意，未计算折射、气溶胶、光谱或绝对亮度。

在地面点看太阳与月球，视半径为 `asin(R/d)`，中心角距用向量夹角；圆面大小和偏移采用共同角尺度。遮挡率是均匀太阳的小角度平面圆盘交叠面积比，不含临边昏暗，界面颜色渐变仅作展示。未建日冕、月面山谷、贝利珠、折射或散射。场景球体着色器使用同一物理位置和局部表面点计算几何遮挡，不读取沙盘夸张的位置。

地面控制采用相对月下点的两个球面角，观测点在地球均半径球面上。固定控制值会随月下点移动，并非固定城市。此设定适合分离视差条件，局部时间播放不能作为某地点的真实全过程/接触时刻。太阳在该点几何地平线下时，界面明确提示。

影锥取两球公切线。令光源半径Rs、遮挡半径Rb、中心距D，影轴上距遮挡中心x：`q=(Rs−Rb)/D`，本影有符号截面半径为 `(Rb−qx)/sqrt(1−q²)`；负值对应越过顶点后的伪本影。半影使用 `p=(Rs+Rb)/D`，半径 `(Rb+px)/sqrt(1−p²)`。月食分类考虑月球半径与锥面垂直距离。大气扩展本影未计入。

影锥剖面显示为非等比例坐标，天体随之为椭圆；横轴和纵轴各自线性。目标偏离影轴时，剖面取包含其中心的方向；观测点若不在此剖面，金点只是投影位置，食的类型始终由完整3D位置另算。空间的金球是太阳方向标志，尺寸和位置不表示真实日地比例。

## 实际核查与未完成项

`build/qa/earth-moon-web/checks.json`记录实际数学与浏览器检查；截图须由模型实际查看后才写视觉复核记录。数学检查包括切线与两球相切、圆盘面积独立采样、105个地面位置的影锥/圆面分类交叉检查、周期终点、轨道平面、同步标记与偏心机制。工程成功不等于人工科学审校。

真实日期历表、精细月轴/纬度天平动、真实地理观测点、接触时刻、金星相位、火星视逆行、凌日/凌星为后续扩展，当前未实现。真人科学审校、真实试讲与教材对照均为pending。
