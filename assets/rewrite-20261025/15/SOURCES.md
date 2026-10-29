# 银河系与星系：补充来源和图件

访问与计算日期：2026-10-25。已有材料保留原文件及原素材记录。本文件只记录本轮新增解释和图件的支持范围。

- [ESA：Guide to our galaxy](https://www.esa.int/Science_Exploration/Space_Science/Gaia/Guide_to_our_galaxy)：已读机构正文，支持盘、核球/棒、恒星晕、暗物质晕与太阳位置的量级。
- [Gaia Collaboration, Drimmel等：Mapping the asymmetric disc of the Milky Way](https://arxiv.org/abs/2206.06207)：已读论文摘要，使用年轻OB星、年轻星团、造父及红巨星的不同结构/运动示踪功能；未使用论文的详细样本参数或声称复现分析。
- [Sanna等2017：Mapping Spiral Structure on the far side of the Milky Way](https://arxiv.org/abs/1710.06489)：已读摘要；水脉泽几何距离为20.4 (+2.8/-2.2) kpc。
- [ESA：Five fascinating Gaia revelations about the Milky Way](https://www.esa.int/Science_Exploration/Space_Science/Gaia/Five_fascinating_Gaia_revelations_about_the_Milky_Way)：已读旋臂、恒星流相关正文；支持旋臂图样与恒星运动、不同旋臂模型和潮汐剥离。未采用其早期报道中的确定旋臂条数表述。
- [NASA/GSFC：Formation of Galaxies](https://imagine.gsfc.nasa.gov/educators/galaxies/imagine/formation.html)：已读正文；使用气体碰撞、能量耗散与盘形成的基础机制。该页年代较早，本稿未采用其最早星系年代或将形态归于单一形成顺序的简化。
- [NASA：Types of Galaxies](https://science.nasa.gov/universe/galaxies/types/)：已读形态相关正文；支持旋涡、椭圆、透镜、不规则的观测形态与典型星族性质。
- [NASA：Galaxy Evolution](https://science.nasa.gov/universe/galaxies/evolution/)：已读形成、相互作用和并合相关正文；支持潮汐结构、气体压缩、恒星形成及并合改变形态。
- [ESA：Gaia’s decade of discoveries](https://www.esa.int/Science_Exploration/Space_Science/Gaia/Gaia_s_decade_of_discoveries_unravelling_the_intricacies_of_our_galaxy)：星流、化学组成与银河并合历史的机构说明。

<a id="rotation"></a>
## 旋转—质量关系图

文件：[PNG](rotation-mass-models.png)、[SVG](rotation-mass-models.svg)、[生成源](plot_rotation.py)。

球对称、圆轨道关系 $M(<R)=v^2R/G$ 下比较两种理想模型，限定R=8—24 kpc：
1. 圆轨道速度固定为220 km/s，包围质量随R线性增加。
2. 包围质量固定为R=8 kpc处的值，圆轨道速度随R的负二分之一次方下降。

两者起点均为约9.003×10^10太阳质量。使用G=4.30091727003628×10^-6 kpc (km/s)^2 / M_sun。图为关系演算，不包含观测点，不是银河旋转曲线拟合。对应公转周期为223.405 Myr。使用现有Conda dl_env中的NumPy与Matplotlib生成；图中文字为Microsoft YaHei。新增课程示意。

## 复用图

- Gaia EDR3全天图、Hubble Ultra Deep Field：见[原来源表C13-I1、I2](../../v02-batch-C-SOURCES.md#c13-i1)。
- ESO M33 g/r/Hα宽场：[原图页](https://www.eso.org/public/images/eso1424a/)，本地文件仍为assets/14/v02/m33.jpg；Credit: ESO，CC BY 4.0，原来源见[批次D记录](../../v02-batch-D-SOURCES.md#l14)。

正文中的薄圆盘投影、透明均匀星场沿视线路径累积亮度，以及球对称圆轨道关系均为列明条件后的几何/动力学推导。
