# 宇宙距离、膨胀与CMB：补充来源和图件

访问与计算日期：2026-10-25。已有距离阶梯、FIRAS和Planck全天图保留原文件及署名。

- [Berkeley Lab：Standard-Candle Supernovae are Still Standard, but Why?](https://newscenter.lbl.gov/2014/03/03/standard-candle-supernovae/)：已读研究机构正文，支持Ia光变宽度、峰值、颜色与标准化，以及抛出物/镍-56的物理联系。正文未将2014报道的精度写作当前统一精度。
- [Hogg：Distance Measures in Cosmology，第4节](https://ned.ipac.caltech.edu/level5/Hogg/Hogg4.html)及[第7节](https://ned.ipac.caltech.edu/level5/Hogg/Hogg7.html)：已读共动距离、光度距离和K校正关系；用于新增模型计算。
- [Riess等1998](https://arxiv.org/abs/astro-ph/9805201)：已读论文摘要，支持历史超新星距离—红移结果、加速膨胀与所列系统误差。没有重新拟合历史样本。
- [NASA/LAMBDA：FIRAS CMB Monopole Spectrum](https://lambda.gsfc.nasa.gov/product/cobe/firas_monopole_spect.html)：已读发布产品说明；原本地总谱为2.725 K黑体加报告残差，误差为1σ。
- [ESA：Planck and the cosmic microwave background](https://www.esa.int/Science_Exploration/Space_Science/Planck/Planck_and_the_cosmic_microwave_background)：已读复合、退耦、膨胀冷却与多频率背景说明。
- [ESA：History of cosmic structure formation](https://www.esa.int/Science_Exploration/Space_Science/Planck/History_of_cosmic_structure_formation)：已读光子—普通物质耦合、压力与引力、退耦后物质聚集及声学图样相关正文。正文用正面物理过程解释，不沿用网页某些过度简化的早期恒星质量/年代概述。
- [ESA：The cosmic microwave background and inflation](https://www.esa.int/Science_Exploration/Space_Science/Planck/The_cosmic_microwave_background_and_inflation)：已读扰动起源及温度/引力关系。正文保留暴胀具体机制待检验的范围。
- [ESA：Tools to study the distribution of matter in the Universe](https://www.esa.int/Science_Exploration/Space_Science/Planck/Tools_to_study_the_distribution_of_matter_in_the_Universe)：已读尺度统计介绍；正文按球面温度波动的功率定义解释C_l，不采用把功率等同于结构数目直方图的类比。
- [Planck Collaboration 2018 VI](https://arxiv.org/abs/1807.06209)：已读摘要和标准平直ΛCDM模型、温度/偏振/透镜联合约束。年龄量级同时沿用[旧C13-11来源记录](../../v02-batch-C-SOURCES.md#c13-11)。
- [ESA 2024：Webb & Hubble confirm Universe’s expansion rate](https://www.esa.int/Science_Exploration/Space_Science/Webb/Webb_Hubble_confirm_Universe_s_expansion_rate)：已读研究机构正文；仅使用2024交叉观测针对造父邻星混杂、支持所检验样本标定这一结论。正文未采用其“所有测量误差已经排除”的宽泛措辞，也不声称这是2026最新结果。

<a id="distance-models"></a>
## 膨胀历史与光度距离模型图

文件：[PNG](expansion-distance-models.png)、[SVG](expansion-distance-models.svg)、[生成源](plot_expansion.py)。

在空间平直FLRW模型、0≤z≤1.2、忽略辐射密度条件下，计算

$$
d_L(z)=(1+z)\frac{c}{H_0}\int_0^z
\frac{dz'}{\sqrt{\Omega_m(1+z')^3+\Omega_\Lambda}}.
$$

两组密度参数为(0.3,0.7)、(1,0)，均取H0=70 km/s/Mpc；密度参数指各成分今天的密度除以临界密度。以Δz=0.0005的梯形积分生成模型曲线。下图为5log10(dL_blue/dL_orange)。图中没有观测点，也没有对超新星数据进行拟合。z=0.5时，两者分别为2832.938 Mpc和2357.698 Mpc，距离模数相差0.39874等。

使用已有Conda dl_env中的NumPy与Matplotlib。科学关系取自上述Hogg第4、7节；图为列明参数后的课程模型演算。

<a id="planck-spectrum"></a>
## Planck温度角功率谱

本地文件：[planck-power-spectrum-2013.jpg](planck-power-spectrum-2013.jpg)。

SHA256：F9BD25474AAB5C640D68778BB4DA55EBD7E92E52C18FB1A643AA458BC4D3B4DA。

[原图页面](https://www.esa.int/ESA_Multimedia/Images/2013/03/Planck_Power_Spectrum)，发布日期2013-03-21。
[实际下载地址](https://www.esa.int/var/esa/storage/images/esa_multimedia/images/2013/03/planck_power_spectrum/12584050-5-eng-GB/Planck_Power_Spectrum_pillars.jpg)。

Credit: ©ESA and the Planck Collaboration。ESA Standard Licence；已读[使用条件](https://www.esa.int/ESA_Multimedia/Terms_and_conditions_of_use_of_images_and_videos_available_on_the_esa_website)，本课程作教育用途并保留署名。原图完整保存，未裁切、修改或重拟合。图中红点为观测，绿线为相应最佳拟合模型；横轴下方为角尺度、上方为多极矩；纵轴为温度波动强度，单位μK²。正文用它说明峰结构，未将其写作最新数据版本。

## 复用图

- 距离阶梯：assets/16/v02/distance-ladder.png；NASA, ESA, A. Feild (STScI), A. Riess (STScI/JHU)，CC BY 4.0；2018历史图示。[原记录D16-11、12](../../v02-batch-D-SOURCES.md#l16)。
- FIRAS：assets/13/v02/firas-spectrum.png。保留原43行数据、绘图源与上下图量纲。[原记录C13-I3](../../v02-batch-C-SOURCES.md#c13-i3)。
- Planck全天温度图：assets/13/v02/planck.jpg；2013发布，©ESA and the Planck Collaboration，ESA Standard Licence。[原记录C13-I4](../../v02-batch-C-SOURCES.md#c13-i4)。

检索中ESA Planck Legacy Archive的CMB spectrum wiki页面超时，未据此使用数据。最终采用上面实际打开、下载并观看的ESA正式功率谱图。
