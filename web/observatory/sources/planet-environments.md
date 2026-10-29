# 行星环境：模型与来源

核查日期：2026-10-28。图形由本项目按以下方程绘制，曲线与能流为模型计算。

## 辐射平衡

太阳参考辐照度取 1 AU 处的 1361 W m⁻²。距太阳 r AU 处 S = 1361/r²；球面平均入射为 S/4，反射为 AS/4，吸收 Q = (1−A)S/4。采用均匀温度、黑体热辐射、内部热源可忽略的稳态模型，T_eq = (Q/σ)^(1/4)。σ = 5.670374419×10⁻⁸ W m⁻² K⁻⁴。

图中三条箭身共用一个固定的线性比例尺；同一视口改变参数时比例尺保持。箭头只表示流向，其尖端不参与定量比较。全球平均值均以行星整个球面面积归一。

- [NASA Goddard：Solar Irradiance Science](https://earth.gsfc.nasa.gov/climate/projects/solar-irradiance/science)。已核对 1361 W m⁻² 与全球平均约 340 W m⁻² 的关系；页面另列具体任务和太阳活动状态下的测量值。此处采用固定参考太阳。
- [NSSDCA：Earth Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html)、[Venus Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/venusfact.html)、[Mars Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html)。参考按钮采用金星 (r = 0.723, A = 0.77)、地球 (1, 0.30)、火星 (1.524, 0.25)。地球反照率取讲义算例的约数 0.30；表中给出的 0.294 保留在原始来源。计算温度为上述模型的平衡温度。

## 单层大气

地表为黑体，大气短波透明；大气层红外吸收率和发射率均为 ε，向上和向下各发射 εσT_a⁴。各层只通过辐射交换并已达到稳态。

地表发射 F_s = Q/(1−ε/2)，向太空直接透出的地表红外为 (1−ε)F_s，大气上下行各为 εF_s/2。地表、整个大气层和大气顶三处收支分别满足：

```text
Q + εF_s/2 = F_s
εF_s = εF_s/2 + εF_s/2
Q = (1−ε)F_s + εF_s/2
```

T_s = (F_s/σ)^(1/4)。当 ε > 0 时 T_a = T_s/2^(1/4)；当 ε = 0 时大气与红外辐射解耦，模型返回空的大气温度读数。默认 ε = 0.77 为演示参数。大气发射率只在本模型中作为单个可调参数；真实环境还涉及垂直结构、对流、潜热和光谱吸收。

[Penn State METEO 469：One-Layer Energy Balance Model](https://courses.ems.psu.edu/meteo469/node/198)，已核对式 (1)—(7) 及其短波透明条件。能流构图为本项目原创，不使用来源图版。

## 热运动与逃逸

球对称、忽略自转的引力势给出所选高度 h 处的 v_esc = √[2GM/(R+h)]。地球参考质量 5.9722×10²⁴ kg、平均半径 6371 km；火星按钮采用 M/M⊕ = 0.1074、R/R⊕ = 0.532。按钮仅指定质量与半径；高层气体温度与高度继续由用户选择。上述参考依据为 NSSDCA 地球、火星参数表。

理想气体局地平衡速率分布为：

```text
v_p = √(2kT/m)
f(v) = 4 v² exp[−(v/v_p)²] / (√π v_p³)
λ = (v_esc/v_p)²
P(v ≥ v_esc) = Q_gamma(3/2, λ)
```

界面使用 km/s，概率密度因而使用 (km/s)⁻¹。阴影积分给出速率超过逃逸速度的瞬时粒子比例。逃逸通量还涉及密度、向外运动方向、碰撞及输运。默认的“热运动尺度”显示 0—4v_p，逃逸阈值在窗外时以带数值的右箭头标注；“包含逃逸速度”将横轴扩展到至少 1.12v_esc。两种范围保持实际速率坐标。

- [OpenStax University Physics Volume 2 §2.4：Distribution of Molecular Speeds](https://openstax.org/books/university-physics-volume-2/pages/2-4-distribution-of-molecular-speeds)。已核对归一化速率密度及其温度、质量依赖。此处只引用公式，未复用图版或原文。
- [Catling & Kasting：Escape of Atmospheres to Space](https://geosci.uchicago.edu/~kite/doc/Catling_and_Kasting_ch_5.pdf)，第 5 章开头与 Jeans 逃逸部分。用于高层温度、无碰撞外逸层与逃逸过程的物理范围。
- 常数采用 [NIST CODATA 2018 汇总](https://physics.nist.gov/cuu/pdf/all_2018.pdf)：G = 6.67430×10⁻¹¹ m³ kg⁻¹ s⁻²，k = 1.380649×10⁻²³ J K⁻¹，u = 1.66053906660×10⁻²⁷ kg；气体质量按 H、H₂、He、N₂、CO₂ 分别取 1、2、4、28、44 u 的整数近似。

上式 Q_gamma 为正则化上不完全伽马函数，等于从 v_esc 到无穷远对 f(v) 的积分。

## 素材与使用

图形、布局和模型计算由本项目编写；外部链接提供公式及常数/参考参数的出处。未复制外部照片、插图或数据集。项目整体第三方素材的既有许可状态保持。
