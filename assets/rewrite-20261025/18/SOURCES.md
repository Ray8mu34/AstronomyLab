# 从观测建立一座星系的物理图景：资料与图像

查阅日期：2026-10-25。正文以M33为贯穿对象，研究结果与用于解释关系的算例分别交代。

## 测距与图像

- [ESO，VST snaps a very detailed view of the Triangulum Galaxy，eso1424a](https://www.eso.org/public/images/eso1424a/)：g/r/Hα，68.01×57.04角分，北在画面左方。使用原有4000×3355 JPEG，Credit: ESO，CC BY 4.0；详细记录见[原来源表](../../v02-batch-D-SOURCES.md#l14)与[下载清单](../../14/v02/retrieval.json)。
- [NASA StarChild，Cepheids](https://starchild.gsfc.nasa.gov/docs/StarChild/questions/cepheids.html)：周期性脉动、周期—光度测距背景。
- Pietrzyński et al. 2019，[A distance to the Large Magellanic Cloud that is precise to one per cent](https://arxiv.org/abs/1903.08096)，[全文](https://arxiv.org/pdf/1903.08096)：读主文第1—3页与表面亮度关系。20个食双星，$49.59\pm0.09$（统计）$\pm0.54$（系统）kpc；线性半径结合表面亮度—颜色关系推角直径，再求距离。论文图像未转载。
- Breuval et al. 2023，[A 1.3% distance to M33 from HST Cepheid photometry](https://arxiv.org/html/2304.00037v1)：读§II—IV及结果表3，154颗造父、地面模板与HST测光、LMC校准、$\mu=24.622\pm0.030$ mag及论文报告$d=840\pm11$ kpc。实际使用近红外Wesenheit组合并处理消光、探测器响应和金属丰度；正文通用单波段关系用于解释原理，不冒充逐步重现其全部拟合。

## 运动、质量与恒星形成

- Corbelli et al. 2014，[Dynamical signatures of a ΛCDM-halo and the distribution of the baryons in M33](https://arxiv.org/abs/1409.2665)，[全文](https://arxiv.org/pdf/1409.2665)：读摘要、距离约定与§3—6相关内容。VLA+GBT的21 cm数据，倾斜圆环与翘曲、旋转曲线、恒星质量光度比与质量分解；采用840 kpc。正文仅引曲线总体速度和半径范围，不重新拟合论文，不采用外推至维里半径的总质量值。
- [STScI/MAST，PHATTER数据档案](https://archive.stsci.edu/hlsp/phatter)：多波段测光与恒星目录。
- Lazzarini et al. 2022，[PHATTER II: The Spatially Resolved Recent Star Formation History of M33](https://arxiv.org/html/2206.11393v1)：读方法§II—III、摘要与结果；2005区域、约24角秒、约100 pc、回溯约630 Myr、约80 Myr两侧的形态差异。该研究固定距离模数24.67，正文引用其空间尺度时保留“约”，没有宣称已经按本篇距离重新拟合其年龄或形成率。
- Smercina et al. 2023，[PHATTER V: The Structure of M33 in Resolved Stellar Populations](https://arxiv.org/html/2308.11618v1)：读摘要及§III—IV；不同恒星群具有不同形态，年轻主序的零碎多臂结构、较老恒星的两条主臂与约1 kpc中央棒。本文不把某一演化阶段的全部恒星指定为单一年龄，论文图片未转载。
- [NASA Webb，Peering Into the Tendrils of NGC 604，2024-03-09](https://science.nasa.gov/missions/webb/peering-into-the-tendrils-of-ngc-604-with-nasas-webb/)：年轻大质量恒星、星风空腔、紫外电离与红外所示气体尘埃。本文未下载或新增引用其图片。

## 本篇科学示意与算例

- `projected-rotation.png`、`.svg`：薄圆环解析投影模型，$v_c=120$ km/s、$i=55^\circ$，$v_{los}-v_{sys}=v_c\sin i\cos\phi$。模型取样点，不是M33实测点；峰值98.30 km/s。
- `distance-dependence.png`、`.svg`：固定角尺度、接收通量、光谱速度和倾角时，$R\propto d$、$L\propto d^2$、球对称等效$M_{dyn}\propto d$。此处与固定周期的角轨道法$M\propto d^3$使用不同观测条件。
- 生成源：`create_figures.py`；计算记录：`calculation-values.json`。采用已有Conda `dl_env`中的NumPy与Matplotlib绘图。
- 68.01角分换算为16.62 kpc是图像画幅宽度；不据此定义星系边界。
- $10^{-15}$ W/m²的谱线通量、$R=15$ kpc与$v=120$ km/s的球对称质量、10 kpc处120 km/s的绕转周期均为明确给出的教学算例。正文未把这些数值标为从图1测出的结果。
- 由$\mu=24.622$得到840.23 kpc；以840 kpc计算1角秒为4.072 pc。0.030 mag通过线性误差传播约为1.4%，论文报告的距离误差照其原值引用。

旧综合篇的月面地形、木卫一和S2图像原文件完整保留，内容由相应专篇承担；本篇保留不同动力学测量对距离依赖的比较与光度、半径、光行时关系。
