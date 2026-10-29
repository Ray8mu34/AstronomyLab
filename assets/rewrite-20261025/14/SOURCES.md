# 潮汐、致密天体与黑洞：补充来源

查阅日期：2026-10-25。保留的EHT图及原黑洞基础来源见 [v0.2批次C](../../v02-batch-C-SOURCES.md)，S2历史图及基本轨道背景见 [v0.2批次D](../../v02-batch-D-SOURCES.md#l16)。

<a id="s2"></a>

## S2的轨道与相对论效应

- GRAVITY Collaboration (2018), *Detection of the gravitational redshift in the orbit of the star S2 near the Galactic centre massive black hole*：[原论文摘要](https://arxiv.org/abs/1807.09409)。实际读摘要，支持16年、120 AU、7650 km/s及引力红移与横向多普勒共同测量；未重新拟合数据。
- GRAVITY Collaboration (2020), *Detection of the Schwarzschild precession in the orbit of the star S2 near the Galactic centre massive black hole*：[原论文摘要](https://arxiv.org/abs/2004.07187)。实际读摘要，支持每周约12角分进动及联合轨道模型。
- [ESO 2002年S2原图](https://www.eso.org/public/images/eso0226c/)沿用本地已存素材，Credit: ESO，CC BY 4.0；历史观测年份就地写明。1000 AU/16年算例为圆整参数，非从历史图重测。
- 本次ESO 2018原新闻页访问超时，改读对应GRAVITY论文摘要；不把失败访问记为新核验。

<a id="roche"></a>

## 洛希模型

- Rappaport et al. (2021), ApJ 913, 118：[公开论文PDF](https://par.nsf.gov/servlets/purl/10414678)。检索服务返回并实际读到第5页均匀、不可压缩流体洛希公式及组成密度讨论；直接PDF访问返回502。该页支持2.44系数和平均密度依赖；正文先独立推导自引力与差异引力的量级，再给出带条件的流体结果。
- [既有NASA NTRS固体洛希研究记录](../../v02-batch-C-SOURCES.md#c12-04)支持材料强度影响；正文应力尺度由密度、长度和潮汐加速度相乘估计。

<a id="disruption"></a>

## 恒星瓦解

- Coughlin & Nixon (2022), *A simple and accurate prescription for the tidal disruption radius of a star and the peak accretion rate in tidal disruption events*：[原论文摘要](https://arxiv.org/abs/2209.03982)。实际读摘要，支持常用潮汐半径和内部密度分布对部分/完全瓦解条件的影响；正文不采用其拟合系数。
- [非旋转黑洞的潮汐教学来源](../../v02-batch-C-SOURCES.md#c12-05)：原记录保留。本文视界潮汐M^-2与太阳型恒星0.74 AU均为明示条件下的代数估算。
- ETH Zürich, *General Relativity*, HS08 [exercise sheet 12](https://edu.itp.phys.ethz.ch/hs08/gr/ex12.pdf)：实际读测地偏离、径向自由落体局部纵向潮汐2m/r³及视界处有限的推导设置；将几何单位恢复后支持正文2GM/r³以及代入视界半径的M^-2关系。该适用框架已就地明确为径向自由落体。

<a id="eht"></a>

## 毫米波成像

- EHT Collaboration (2022), *First Sagittarius A* Event Horizon Telescope Results. I.*, ApJL 930, L12：[团队论文页](https://eventhorizontelescope.org/publications/first-sagittarius-event-horizon-telescope-results-i-shadow-supermassive-black-hole)。实际读摘要与发表信息，支持2017年1.3毫米观测、51.8±2.3微角秒(68%可信区间)、变化源与恒星轨道的尺度连接。图片沿用2022已存版本，未重建原始干涉数据。
- [NASA黑洞结构](https://science.nasa.gov/universe/black-holes/anatomy/)：查阅视界、吸积盘及喷流背景。正文的牛顿轨道能和吸积效率公式为教学推导。
- OpenStax [§24.4](https://openstax.org/books/astronomy-2e/pages/24-4-time-in-general-relativity)、[§24.5](https://openstax.org/books/astronomy-2e/pages/24-5-black-holes)：重新查阅引力时间、信号和黑洞结构。固定半径发射者的频移公式限定于球对称静态背景；自由落入者另含运动频移。

<a id="gw"></a>

## 引力波

- LIGO Scientific Collaboration / Virgo (2016), [Observation of gravitational waves from a binary black hole merger](https://ligo.org/science-summaries/GW150914/)：实际读信号、探测原理与波形推断段，采用0.2秒内35至振幅峰值附近150 Hz及台址间约7毫秒。全文整个信号可延伸到更高频率；本篇数值明确对应峰值前阶段。
- [原论文记录](https://dcc.ligo.org/ligo-p150914/public)及[基础物理论文摘要](https://dcc.ligo.org/LIGO-P1600161/public)：实际读摘要，支持几十太阳质量的致密双星、数百千米尺度与波形判别。未重新分析探测器噪声或原始应变。

## 新图

[tidal-field.svg](tidal-field.svg)为原创牛顿弱场示意；生成源见 [make_figures.py](../12/make_figures.py)。分别展示中心引力与扣除共同加速度后的局部潮汐，箭头只示相对方向和趋势；未用该图描述强场全局光路。
