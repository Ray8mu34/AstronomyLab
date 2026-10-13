# 银河内外与CMB实验：来源、数据及表示边界

2026-10-03；统一网站 `/lab/galaxy`。本轮实际读取机构页面、图注、发布表和许可；不是复核所有原始观测或重做宇宙学分析。

## 实际读取的科学资料

1. [OpenStax 银河结构](https://openstax.org/books/astronomy-2e/pages/25-1-the-architecture-of-the-galaxy)：读盘、棒、核球、恒星晕、暗物质晕、尘埃与红外视角相关段落。支持几何结构与内部重建的区别；未转载其插图或正文。没有把十万光年盘直径当全部物质共同边界。
2. [ESA Gaia EDR3 全天图](https://www.esa.int/ESA_Multimedia/Images/2020/12/The_colour_of_the_sky_from_Gaia_s_Early_Data_Release_3)：实际读超过18亿源、总亮度和蓝红测光组合、暗纹与银河盘说明。沿用 `assets/13/v02/gaia-sky.png`，未改原文件。Hammer 投影，非银河外部照片。
3. [2MASS 红外全天图注](https://www.ipac.caltech.edu/2mass/gallery/showcase/allsky/caption.html)、[下载页](https://www.ipac.caltech.edu/2mass/gallery/showcase/allsky/fullres.html)、[许可](https://www.ipac.caltech.edu/2mass/gallery/showcase/copyright.html)：逐页读取。全天图来自三红外波段点源星数，不是直接图像拼接；近一亿星、约 Ks=13.5 下限，Aitoff 投影。暗纹仍包括稠密尘埃，中央核球更清晰。新增2350×1200官方JPEG，不与Gaia逐像素同标定比较。
4. [NASA/LAMBDA FIRAS 单极谱产品](https://lambda.gsfc.nasa.gov/product/cobe/firas_monopole_spect.html)：实际读2005 v1发布产品说明，逐行解析本地43行表。出处 Fixsen等1996、Fixsen & Mather2002。总谱列为2.725 K黑体加报告残差；残差、1σ、银河模型列为 kJy/sr。不是原始仪器读数。这里不声称2.725 K是最新绝对温度精度。
5. [ESA CMB与Planck解释](https://www.esa.int/Science_Exploration/Space_Science/Planck/Planck_and_the_cosmic_microwave_background)：实际读多波段、退耦、平均谱、微小起伏和成分分离相关段落。说明方向与谱是不同信息；退耦不是瞬间首次制造光子。
6. [Planck美国数据中心 planck13-002a](https://planck.ipac.caltech.edu/image/planck13-002a)：实际读图注、频段、银河尘埃前景分离、银道坐标、等距柱状投影和球面映射镜像说明。新增1500×750官方 JPEG，平面与球面共用原件。图为2013发布温度各向异性，不是随机纹理，不是可见光颜色或三维物质密度。
7. [Planck图片使用规则](https://planck.ipac.caltech.edu/page/image_use_policy)、[ESA图片教育用途条款](https://www.esa.int/ESA_Multimedia/Terms_and_conditions_of_use_of_images_and_videos_available_on_the_esa_website)：实际读取。图署名为 ©ESA and the Planck Collaboration；教育/说明用途保留署名，不暗示机构背书。商业用途不得从本课程记录直接推定已许可。

### 许可与署名

Gaia：ESA/Gaia/DPAC; CC BY-SA 3.0 IGO. Acknowledgement: A. Moitinho。

2MASS：图库声明公共领域，要求项目致谢；图署名 2MASS/J. Carpenter, M. Skrutskie, R. Hurt。项目为马萨诸塞大学与 IPAC/Caltech 联合的 Two Micron All Sky Survey，资金来自 NASA 与 NSF。要求随图保留的完整致谢如下：

Atlas Image [or Atlas Image mosaic] obtained as part of the Two Micron All Sky Survey (2MASS), a joint project of the University of Massachusetts and the Infrared Processing and Analysis Center/California Institute of Technology, funded by the National Aeronautics and Space Administration and the National Science Foundation.

Planck：©ESA and the Planck Collaboration。FIRAS公开科学发布数据保留 NASA/LAMBDA 与研究论文出处，数学谱和残差图由代码原创绘制。

## 算法与假设

- 距离单位kpc，银心为原点，太阳为(8,0.025,0)；y为银北。0°银经朝银心。8 kpc、220 km/s是第13讲同一代表性算例，非最新精密拟合。
- 三维点云是带固定种子的解析分布采样，不是Gaia目录。盘、棒、核球、恒星晕可以开关；暗物质晕为无光线框示意，不是一幅观测照片。旋臂只是简化调制，没有拿规则旋涡当实际银河旋臂坐标。
- 视线光积分的盘发射密度为 exp(−R/3.2)exp(−|y|/0.32)，另加高斯中央核球；尘埃 exp(−R/4)exp(−|y|/0.10)。0.32/0.10 kpc为教学参数，未做观测拟合。棒/晕显示开关不改解析光积分，界面明确说明。
- 路径中点积分180段，总长40 kpc；逐段 τ 累积，光发射按 exp(−τ)衰减。保留恒星自身不含尘埃的比较曲线。忽略散射进入视线、恒星种群差异及尘埃自身热发射。
- 示意近红外消光系数为可见光的0.12倍，明确是例子，不冒充三波段2MASS统一消光实测常数。三维暗点仅定性云层，定量透过率只来自解析积分。
- P=2πR/v；M≈v²R/G只作近圆、球对称量级。盘引力非球对称，未将量级数字升级为银河精准称重。
- Planck原等距柱状图为天空内部向外看投影，银心居中、银北向上。方向(l,b)映射到(−cos b cos l,sin b,cos b sin l)，源图 u=1/2−l/360°、v=1/2−b/180°。几何UV按这一约定设置，未把普通外部球纹理的默认镜像当天空坐标。球半径任意，只表示方向，不表示最后散射面的实体壳。
- 原JPEG图注未提供温差数值色标。界面色带仅定性冷暖，并明确零点未标定；不从RGB反推µK。ΔT控件是独立教学温差，与点击像素分开。真实像素温度与Cℓ统计需HEALPix数值产品、置信掩膜和束流；本版本不虚构这些结果。
- 黑体 Bν=2hν³/[c²(expm1(hν/kT))]，输出 MJy/sr。cm⁻¹转GHz乘29.9792458；FIRAS残差与σ保留kJy/sr。真实残差最末高频点为−432±282 kJy/sr，图域包含它，未为“漂亮曲线”裁掉。ΔT相对谱差为精确黑体差而非线性式代算。

## 核查状态与未决项

节点语法、独立数值极限/量级与实际Edge浏览器初步检查已执行，详见 `galaxy-handoff.md`。模型画面实际查看与主站统一版本验收分开；真人科学审校、真实试讲、教材对照均 pending。

实际失败候选页面：NASA `/resource/milky-way-galaxy-infrared/`不可取；NASA `/universe/galaxies/our-milky-way-galaxy/`404；ESA旧sci域等距柱状页面不能读取；ESA Planck PLA wiki一度502。没有把失败页记为已读，采用可读的IPAC官方图注和NASA/LAMBDA产品页。

没有独立复现Planck成分分离、FIRAS标定或银河参数拟合；没有下载或伪造科学HEALPix像素、角功率谱和实际恒星空间目录。默认方向登记依据官方等距柱状图注与解析公式，尚未进行独立科学目录交叉验证。
