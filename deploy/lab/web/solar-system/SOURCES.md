# 太阳系沙盘：来源、图注与模型限定

核验日期：2026-10-03（北京时间）。来源、工程运行、模型视觉审读、真人审校与真实试讲分别记录。

## 轨道和物理参数

- [JPL Approximate Positions](https://ssd.jpl.nasa.gov/planets/approx_pos.html)：实际读取Table 1与计算说明，保存6个要素及每世纪变化率，使用开普勒方程和坐标旋转。原表适用1800—2050年；网页限制2000—2049年。原网页 `data/source-jpl-orbits.html`，解析系数 `data/orbits.json`。
- [JPL Physical Parameters](https://ssd.jpl.nasa.gov/planets/phys_par.html)：实际核对原表；平均半径、质量、密度来自课程已有JPL CSV。平均半径为体积等效量，不是赤道半径。原网页 `data/source-jpl-physical.html`，数值 `data/physical.json`。
- 地球平均半径6371.0084 km、木星69911 km，半径比约10.973、体积比约1321。1 AU = 149597870700 m，光速299792458 m/s，单程光行时约499.005 s。比例示例由这些量推导。
- 自转与轴倾角为常用教学近似。巨行星周期依赖口径，并非刚体自转；精确极轴方位、差异自转与不确定度没有建模。

| 对象 | 官方资料 | 核验/继承范围 |
| --- | --- | --- |
| 太阳 | [NASA Sun Facts](https://science.nasa.gov/sun/facts/) | 质量主导、聚变；延续第01讲 |
| 水星 | [NASA Mercury Facts](https://science.nasa.gov/mercury/facts/) | 偏心轨道，约59日恒星自转、88日公转，极稀薄外逸层，并非最高温 |
| 金星 | [NASA Venus Facts](https://science.nasa.gov/venus/venus-facts/) | 浓厚大气、逆行；原课程243日自转/225日公转/117日太阳日的区分 |
| 地球 | [NASA Earth Facts](https://science.nasa.gov/earth/facts/) | 岩石世界、液态水；具体参数用JPL |
| 火星 | [NASA Mars Facts](https://science.nasa.gov/mars/facts/) | 古水活动与稀薄大气；历史重建解释延续第02讲 |
| 木星 | [NASA Jupiter Facts](https://science.nasa.gov/jupiter/jupiter-facts/) | 氢氦与高压；体积/质量用JPL计算 |
| 土星 | [NASA Saturn Facts](https://science.nasa.gov/saturn/facts/) / [Cassini Titan](https://science.nasa.gov/mission/cassini/science/titan/) | 环颗粒；卫星解释延续第02讲；密度用JPL |
| 天王星 | [NASA Uranus Facts](https://science.nasa.gov/uranus/facts/) | 实际重读Orbit and Rotation/Structure：97.77°轴倾、逆行、冰巨星物质状态 |
| 海王星 | [NASA Neptune Facts](https://science.nasa.gov/neptune/neptune-facts/) | 实际重读距离/周期/Atmosphere：30 AU、165年、4小时，旅行者颜色增强与重新处理 |
| 边界 | [NASA Kuiper Belt](https://science.nasa.gov/solar-system/kuiper-belt/) / [NASA Oort Cloud](https://science.nasa.gov/solar-system/oort-cloud/) | 带区与假定近球状储库；延续第01讲限定 |

介绍基于现有第01、02讲。并未重新逐字审读上述全部链接；重点核验与原课程继承范围分开。形成、迁移、大气历史和内部结构的研究未在本轮逐篇复核原始论文，保持 `checked_with_limits`。不引入易变化的卫星总数，不把碰撞/迁移假说写成确定事件。

金星的“一天”有定义混淆风险：网页明确恒星自转约243日、公转约225日、完整太阳日约117日，不把117日写成单纯日出到日落。天王星轴倾与公转倾角分开；海王星颜色增强与组成证据分开。

## 球面贴图

Credit: Solar System Scope / INOVE；[原下载与制作说明](https://www.solarsystemscope.com/textures/)，[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。实际读取许可与说明，保存 `data/source-texture-license.html`。

13份2k资源已下载至 `textures/`。原作者使用NASA影像/地形，并调色、补绘缺测区；是展示贴图，不是校准照片。此次进行球面/环映射、照明与云层叠加，土星环保留alpha。金星展示云层；金星表面与月球贴图目前备用。海王星深蓝属于增强外观，不能用于真彩色比较。下载URL、尺寸、SHA256见 `data/resources.json`。

## 文章图版

6个文件从课程复制，图像字节不变。原记录为工作区 `assets/v02-first4-SOURCES.md`，复制哈希见 `data/reading-manifest.json`。

| 本地文件 | 科学表示与图注 | 来源与署名 |
| --- | --- | --- |
| media/hl-tau.jpg | ALMA约1.28 mm尘埃盘；红橙为赋色，暗环不等于逐个确认行星 | [ESO eso1436a](https://www.eso.org/public/images/eso1436a/)；ALMA (ESO/NAOJ/NRAO) |
| media/kirkwood-gaps.png | 2007年半长轴统计，每0.005 AU箱内数量；不是空间环形照片或当前总数 | [JPL](https://ssd.jpl.nasa.gov/diagrams/mb_hist.html)；Alan Chamberlin (2007), JPL/Caltech |
| media/pluto-enhanced.jpg | LORRI/Ralph增强色合成，非肉眼真彩色 | [NASA Pluto Dazzles](https://science.nasa.gov/resource/pluto-dazzles-in-false-color/)；NASA/JHUAPL/SwRI |
| media/planet-properties.png | 课程数据图；半径/质量对数轴，密度线性轴 | [JPL参数](https://ssd.jpl.nasa.gov/planets/phys_par.html)；课程编辑组（Codex辅助），数据JPL SSD |
| media/titan-radar.jpg | 雷达回波与多时刻合成，棕黄非可见光；亮斑机制未唯一确定 | [NASA Ligeia Mare](https://science.nasa.gov/photojournal/mystery-feature-evolves-in-titans-ligeia-mare/)；NASA/JPL-Caltech/ASI/Cornell |
| media/uranus-nircam.png | 1.4/3.0 μm近红外代表色，不是肉眼图 | [NASA Webb Uranus](https://science.nasa.gov/asset/webb/uranus-nircam-image/)；NASA, ESA, CSA, STScI; Image Processing: Joseph DePasquale (STScI) |

沿用课程使用记录：[NASA媒体规则](https://www.nasa.gov/nasa-brand-center/images-and-media/)、[JPL图像规则](https://www.jpl.nasa.gov/jpl-image-use-policy/)、[ESO版权页](https://www.eso.org/public/outreach/copyright/)。保留联合与第三方署名，不概括成“NASA网站全部公共领域”。

## 模型限定

- 沙盘径向映射 `9+10√r`（r以AU计），距离压缩使椭圆形状失真；球体独立放大。不可从屏幕测实际距离/偏心率/尺寸。
- 距离视图 `1 AU=3场景单位`，保留近似轨道倾角/偏心率；球体仍夸大。
- 尺寸视图平均半径同比例、地球半径1，排列任意。太阳因直径约109个地球而不在该列。
- JPL截断近似不是N体积分或Horizons精密星历。UTC当作TDB近似，地球点是地月质心。未用精密星历逐日校准；算法检查只证明列明的方程/几何约束。
- 日心坐标不表示太阳真实静止。自转慢速展示、不与日历同步；轴倾为示意，方位非精确定向。
- 星空与小天体带是采样示意，数量/密度非真实统计。奥尔特云仅文字解释，不假装用50 AU场景覆盖全部引力范围。
- 补光、云层与光晕为显示效果；没有辐射传输、扁率、环影或各环粒子动力学。选中球体的金色圆圈是界面标记，不是行星环或卫星轨道。

## 软件与状态

[Three.js](https://threejs.org/) 0.180.0，MIT；`vendor/LICENSE`保留许可。引擎与OrbitControls同一固定版本，运行不依赖CDN。实际检查核心请求均为本机资源。

来源为 `checked_with_limits`；实际运行和视觉检查见[运行说明](README.md)及工作区 `build/qa/solar-system-web/`。真人科学审校、真实试讲均为 `pending`。
