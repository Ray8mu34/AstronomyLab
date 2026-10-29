# 第04篇补充来源与原创图

查阅日期：2026-10-25。原三幅图片保留于原位置，署名和使用条件沿用[01—04素材记录](../../v02-first4-SOURCES.md)。原科学来源沿用[01—04来源表](../../v02-reference/SOURCES-pro-01-04.md)。

## 本轮实际读取的资料

| 资料 | 使用范围 |
| --- | --- |
| [NASA Eclipses and the Moon's Orbit](https://eclipse.gsfc.nasa.gov/SEhelp/moonorbit.html) | 近地点、远地点的代表距离及月球运动的周期。 |
| [NASA Eclipses and the Moon](https://science.nasa.gov/moon/eclipses/) | 日月食的遮挡、影区、月食的可见范围与大气照明背景。 |
| [NASA Periodicity of Solar Eclipses](https://eclipse.gsfc.nasa.gov/SEsaros/SEperiodicity.html) | 约5.1°轨道倾角、交点、食季中心约173.3日间隔、沙罗三周期和经度变化。 |
| [NASA Venus Transit Catalog](https://eclipse.gsfc.nasa.gov/transit/catalog/VenusCatalog.html) | 下合与交点条件、八年配对及2004/2012实例。按该页周期数值复算：八个地球年与十三个金星年的时长差是0.935日。页面约2.45日的交会提前量与此直接差值含义不同，正文以明确的8Y−13P计算为准。 |
| [NASA Galileo's Phases of Venus](https://science.nasa.gov/resource/galileos-phases-of-venus-and-other-planets/) | 历史图版与金星相位观测。 |
| [Museo Galileo, Phases of Venus](https://catalogue.museogalileo.it/indepth/PhasesVenus.html) | 经典托勒密配置、金星相位的约束、第谷配置同样容纳相位的历史关系。 |
| [NASA Hubble Mars Oppositions 2016 and 2018](https://science.nasa.gov/asset/hubble/mars-oppositions-2016-and-2018/) | 冲几何、365与687日轨道周期和约26个月会合周期。 |
| [Andrew Vanderburg, Transit Light Curve Tutorial](https://avanderburg.github.io/tutorial/tutorial.html) | 光变与凌星深度、半径比及恒星半径的依赖。 |
| [NASA How We Find and Characterize](https://science.nasa.gov/exoplanets/how-we-find-and-characterize/) | 周期结合恒星质量求轨道、视向速度、凌星透射光谱。仅使用方法说明，未引用动态行星总数和未来任务时态。 |
| [JPL Kepler Gets a Little Help From Its Friends](https://www.jpl.nasa.gov/news/kepler-gets-a-little-help-from-its-friends/) | 食双星、背景混光及图像/光谱后续观测方法，未采用2013年候选数量。 |
| [O'Donovan等2006, Rejecting Astrophysical False Positives...](https://arxiv.org/abs/astro-ph/0603005) | 实读作者摘要：GSC 03885-00829的多色深度、K矮星双星与F矮星混合模型，以及高分辨光谱的确认。未扩写正文数据或声称通读论文全文。 |
| [NASA Eclipse Viewing Safety](https://science.nasa.gov/eclipses/safety/) | 直接目视观日、光学设备入光前端专用滤光、全食阶段的条件。 |

原NASA Types of Eclipses页面本轮两次读取超时；原有食型照片及其来源记录保留，食型几何由可访问的NASA Moon Eclipses与文中的独立光路构造交叉检查。

## 原创科学图与推导

[shadow-cones.svg](shadow-cones.svg)和[maximum-elongation.svg](maximum-elongation.svg)自身均为完整可编辑矢量源，几何参数和构造写在SVG注释中，未复用第三方图像元素。

- 影锥图采用小角边界光线，光源中心(100,220)、半径70，遮挡体中心(450,220)、半径25；本影顶点在x=644.444444，半影与伪本影由同侧/异侧边界线确定。此比例为教学示意，非真实日月尺寸距离比例。
- 最大距角图采用圆轨道：地球半径1、金星半径q=0.723，太阳在原点、地球在(1,0)，切点为(q²,q√(1−q²))。两条金星处方向向量点积为零，距角为arcsin(q)=46.3027°。显示坐标等比例映射，天体符号另行放大。
- 影锥长度、月球距离处地影宽度、最大距角、会合周期、视逆行角速度与混光深度，均为按正文条件自行展开的基础几何/动力学推导。
- 原图实际查看后，将金星凌日黑点方位修正为左上；原素材文件不改。

复算得到：月球本影长度约374289千米；月球平均距离处地球本影半径约4599千米；水星圆轨道最大距角22.768°；火星会合周期779.934日；采用正文圆整速度的冲时视逆行约−0.360°/日；地球遮挡太阳大小恒星的深度约83.79百万分之一。
