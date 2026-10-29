# 行星内部与环境：补充来源

核验日期：2026-10-25。既有数据、内部模型与原始图像沿用原来源记录；下列为本轮实际查阅的新解释材料。

<a id="planet-properties"></a>

## 行星参数图

数据来自项目已有[JPL参数表](../../shared/v02/planet_parameters.csv)，数据出处为[JPL Solar System Dynamics](https://ssd.jpl.nasa.gov/planets/phys_par.html)。半径及质量除以表内地球值，密度直接取原值；数值标签显示三位有效数字。半径和质量采用对数坐标，密度采用线性坐标。原始素材保持不变。

重绘图：[PNG](planet-properties.png)、[SVG](planet-properties.svg)；可重绘源：[make_planet_properties.py](make_planet_properties.py)。图为课程原创数据绘图。

<a id="radiation"></a>

## 辐射平衡的量与算例

- [NASA NSSDCA：Earth Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html)，地球附近太阳辐照度约1361 W m⁻²与反照率量级。
- [NASA GSFC：Solar Irradiance Science](https://earth.gsfc.nasa.gov/climate/projects/solar-irradiance/science)，太阳辐照度的测量及全球平均几何因子。
- 截光面积πR²、辐射面积4πR²及斯特藩—玻尔兹曼定律构成正文的自主推导。算例取A=0.30、S=1361 W m⁻²、σ=5.670374419×10⁻⁸ W m⁻² K⁻⁴，得Q=238.175 W m⁻²、T_eq≈254.58 K。A为教学用近似；不将这一均匀模型温度解释为每个地表地点的实际温度。

<a id="one-layer"></a>

## 单层辐射交换模型

[Penn State，METEO 469：One-Layer Energy Balance Model](https://courses.ems.psu.edu/meteo469/node/198)。实际阅读层间平衡与式(1)—(7)。正文采用其红外发射率ε=1的理想极限：短波透明、地表近似黑体、大气层均温且向两侧发射、只计辐射并达到稳态。由大气向太空发射Q和地表收到2Q，得到T_s=2^(1/4)T_a。连续大气、对流与光谱依赖在后文另行说明。

原创图：[PNG](radiative-balance.png)、[SVG](radiative-balance.svg)；可重绘源：[make_figure.py](make_figure.py)。图中箭头表示单位面积的能量流率，Q为已经扣除反射后的太阳吸收量。图为课程原创科学示意，未复制来源图版。

<a id="carbon-cycle"></a>

## 地球慢碳循环

[NASA Earth Observatory：The Carbon Cycle](https://science.nasa.gov/earth/earth-observatory/the-carbon-cycle/)。实际阅读“The Slow Carbon Cycle”及前后的气候反馈说明。用于液态水参与风化、碳向岩石储库转移、地质活动回补以及长期负反馈。未采用原页历史排放统计或现时浓度数值；正文将风化反馈写在水、岩石供应和输送条件下。

<a id="water-loss"></a>

## 岩石行星水损失

Wordsworth, R. D. & Pierrehumbert, R. T. (2013), *Water loss from terrestrial planets with CO₂-rich atmospheres*。[摘要](https://arxiv.org/abs/1306.3266)，[全文](https://arxiv.org/html/1306.3266v2)，[DOI](https://doi.org/10.1088/0004-637X/778/2/154)。实际阅读摘要、引言和模型问题说明；仅用于高层水光解、氢逃逸与大气/云条件对效率的影响，不采用该模型的具体阈值作为所有行星的通用标准。金星长期海洋史仍作为研究问题。

## 木卫一质量算例与大气逃逸

- [NASA NSSDCA：Jovian Satellite Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/joviansatfact.html)。实际读取木卫一轨道行：半长轴421.8×10³ km、周期1.769138日。正文采用1.769日作近似演算，继承旧综合篇的质量计算。未使用网页卫星数量。
- [Catling & Kasting，第5章：Escape of Atmospheres to Space](https://geosci.uchicago.edu/~kite/doc/Catling_and_Kasting_ch_5.pdf)。实际阅读开头的逃逸分类和速度分布解释。正文保留热运动、上层大气条件及非热逃逸的概念范围；未转载全文或图像。
