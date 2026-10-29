# 恒星爆发与超新星遗迹：补充来源

查阅日期：2026-10-25。既有 SN 1987A、蟹状星云图片和原基础资料见 [v0.2来源记录](../../v02-batch-C-SOURCES.md)。下列记录明确本次实际阅读范围。

<a id="thermonuclear"></a>

## 热核失控与传播

- Hillebrandt, Kromer, Röpke & Ruiter (2013), *Towards an understanding of Type Ia supernovae from a synthesis of theory and observations*：[全文](https://arxiv.org/pdf/1302.6420)。查阅引言与爆发模型部分，支持白矮星双星前身、爆燃/爆轰、膨胀对核产物的影响与多通道研究。未给不同通道的确定比例。

<a id="collapse"></a>

## 核心坍缩与爆发驱动

- H.-T. Janka (2012), *Explosion Mechanisms of Core-Collapse Supernovae*, Annual Review of Nuclear and Particle Science 62, 407–451：[全文](https://arxiv.org/pdf/1206.2503)。实际读引言、核心坍缩与反弹、§IV C中微子加热及多维流动相关段。支持初始激波损耗、停滞、受热区与能量预算。公式GM²/R用于量级，未据此计算相对论中子星精确束缚能；未复现三维爆炸模拟。

<a id="diffusion"></a>

## 膨胀中的辐射扩散

- W. D. Arnett (1982), *Type I supernovae. I. Analytic solutions for the early part of the light curve*, ApJ 253, 785–797：[原论文](https://adsabs.harvard.edu/pdf/1982ApJ...253..785A)。实际读§II物理假设与能量/扩散方程、§IV对放射性衰变及透明度演化的扩展。正文随机游走推导为独立的均匀球量级模型，不把其系数当作完整Arnett模型拟合值。
- Dexter & Kasen (2013), *Supernova Light Curves Powered by Fallback Accretion*, ApJ 772, 30：[论文附录](https://doi.org/10.1088/0004-637X/772/1/30)。查阅附录列出的膨胀做功、加热与辐射损失方程，作为一般能量守恒的交叉依据；本文未引入其回落供能模型。

<a id="light-curves"></a>

## 厚包层与光变

- Onno Pols, *Stellar Structure and Evolution*，[第12—13章](https://www.astro.ru.nl/~onnop/education/stev_utrecht_notes/chapter12-13.pdf)：查阅超新星类别、光变、氢复合与放射性衰变的相应讨论，支持光度平台与热源的区别。
- Nagy et al. (2014), *A semianalytical light curve model and its application to type IIP supernovae*：[出版页面](https://doi.org/10.1051/0004-6361/201424237)。检索摘要确认模型纳入复合前沿、半径、质量与不透明度；直接全文访问403。本篇具体解释以已读Pols教材和Arnett论文为依据，不把该文记为全文已读。

<a id="sn1987a"></a>

## SN 1987A 的中心电离

- NASA (2024-02-22), [Webb Finds Evidence for Neutron Star at Heart of Young Supernova Remnant](https://science.nasa.gov/missions/webb/webb-finds-evidence-for-neutron-star-at-heart-of-young-supernova-remnant/)：实际读中心氩谱线、MIRI/NIRSpec、强电离所需能源以及中微子时序段。2024结果按该研究的日期表述，未称最新结论或直接拍到中子星表面。

<a id="crab"></a>

## 蟹状星云的持续能源

- NASA/GSFC, [The Crab Nebula](https://imagine.gsfc.nasa.gov/science/objects/snr_crabneb.html)：实际读高能电子与星云磁场中的同步辐射。转动能与周期导数公式由刚体转动能关系推导，采用短期转动惯量近似恒定条件。
- [既有超新星遗迹与脉冲星资料](../../v02-batch-C-SOURCES.md#c12-10)：历史事件、气体细丝与脉冲星结构。

<a id="figure"></a>

## 新图与数值假设

[diffusion-time.svg](diffusion-time.svg) 为原创简化模型曲线，生成源见 [make_figures.py](../12/make_figures.py)。均匀球、固定不透明度0.01平方米每千克、抛出质量1.4太阳质量、代表速度10000千米每秒；采用平均自由程与随机游走量级推导。图中蓝线为瞬时扩散时间，橙线为爆发后年龄；没有观测数据，也不是光度随时间的曲线。两条线相交约17.2日。
