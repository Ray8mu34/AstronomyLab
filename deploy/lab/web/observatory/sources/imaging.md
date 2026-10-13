# 图像实验：真实通道、处理步骤与教学数据

## 当前发行说明（2026-10-04）

本实验及M17衍生线性数组已随独立发行公开，实际资源为`/data/imaging/{502,656,673}-linear.f32`及`m17-metadata.json`。原始ZIP/FITS和本地处理头文件不在发行仓库。下文“当前本机使用”描述2026-10-03的历史处理状态；教育FITS及衍生数组再分发许可仍为`pending`，见[当前未决清单](../../../THIRD_PARTY.md)。本轮没有改动源数组、图像、署名或许可结论。

## 2026-10-03 获取与核验记录

实施/访问日期2026-10-03。第14讲原文及五幅原图未改。

## 本轮取得真实单通道FITS

实际访问 [ESA/Hubble教育数据目录](https://esahubble.org/projects/fits_liberator/datasets/)，再打开 [M17数据页](https://esahubble.org/projects/fits_liberator/m17data/)。页面明确三个文件对应WFPC2窄带[OIII]502 nm、Hα656 nm、[SII]673 nm。web工具不能解析ZIP，随后PowerShell直接下载页面给出的三个官方URL；下载成功后实际解析FITS头和线性像素，不只验证文件存在。

| 通道 | 压缩包 | 原头日期 | EXPTIME头字段 | 本地处理 |
| --- | --- | --- | --- | --- |
| [O III] F502N | [502nmos.zip](https://esahubble.org/static/projects/fits_liberator/datasets/m17/502nmos.zip) | 1999-05-30 | 4300 s | 1600²→320²，5×5均值 |
| Hα F656N | [656nmos.zip](https://esahubble.org/static/projects/fits_liberator/datasets/m17/656nmos.zip) | 1999-05-30 | 2600 s | 同上 |
| [S II] F673N | [673nmos.zip](https://esahubble.org/static/projects/fits_liberator/datasets/m17/673nmos.zip) | 1999-05-29 | 5200 s | 同上 |

`data/imaging/raw/`保留三个原ZIP和完整头文本；`m17-metadata.json`包含ZIP、解压FITS、导出Float32各SHA256。数据由已有Conda dl_env的NumPy定向处理，没有安装astropy。解析主HDU -32大端Float32、BSCALE/BZERO，平均5×5线性值，垂直翻转FITS行序，输出little-endian `.f32`。没有拉伸，没有用发布RGB拆分数据，没有填入臆造深度。

原头确认HST、WFPC2、F502N/F656N/F673N，BIAS/DARK/FLAT为COMPLETE，HISTORY包含CRREJ处理。因此称为“已校准/拼接真实教育FITS”，不称未经校准探测器原始帧。三通道CRVAL/CRPIX/CD头字段相同；精密星表配准、拼接后WCS仍未独立验证。网页的“校正偏移”只撤回人为像素偏移，不运行真实天体测量求解。

BUNIT缺失；网页报告“FITS源单位”，没有擅自当作e⁻、DN/s或绝对谱线通量。PHOTFLAM和EXPTIME是原头记录，教育拼接的归一方式没有独立复核，故不凭它们推出绝对亮度/谱线比/丰度。独立显示参考各通道正值99.5%分位数；数据内负值保留，只有显示映射截为黑色。

## 显示与教学模型

真实组只控制灰度、SHO/HSO/HOO映射、通道增益、人工错位、黑白点与线性/log/asinh拉伸。曝光、背景、噪声与累计封顶只作用于明示合成教学组。

教学三个线性通道来自解析式的环、核心、尘遮与假想星点，160²，单位e⁻/s。它们不是M17观测或物理星云辐射转移。计数按s t+b t后加泊松或大计数高斯近似与读出r√n帧；可扣已知背景均值。封顶是累计总计数限制，用来展示丢失线性，未详细模拟每帧满阱。忽略暗电流、平场、宇宙射线、追踪及相关像素误差。

[Lupton等原论文](https://arxiv.org/html/astro-ph/0312483v1)实际读取第II节asinh与综合色构造、以及饱和讨论。这里逐通道简单拉伸，并未实现论文中以共同强度I保持综合色的完整Lupton算法，也不声称颜色保持。像素检查读取源数组而非渲染RGB，所以能验证拉伸不改原线性数值。

## 真实图版与许可

- 本轮重新读取 [M17 heic0305a](https://esahubble.org/images/heic0305a/)，确认1999-05-29/30、SII红、氢绿、氧蓝、完整Credit: European Space Agency, NASA, and J. Hester (Arizona State University)。网页实验重新赋色/降采样，未声明复现其发布流水线。
- 本轮读取 [近红外马头heic1307a](https://esahubble.org/images/heic1307a/)，其余蟹状星云、可见马头、M33沿用已有 `assets/v02-batch-D-SOURCES.md` 与第14讲图注，不冒充本轮逐项重新核验。
- [ESA/Hubble版权页](https://esahubble.org/copyright/)web工具多次超时，PowerShell取得完整HTML并实际读取相关版权段：图片、视频与网页文本为CC BY 4.0，要求完整可读署名，显著变换建议说明；音乐、科学论文和代码不受该条覆盖。仅记录版权内容，不公开镜像整页。五幅已有发布图沿用既有CC BY 4.0署名。
- 官方FITS教育数据页没有独立许可字段。它明确为教育与个人处理提供下载；当前本机使用。一般图片政策能否完全覆盖FITS科学数据再分发属于解释，公开发布前应核对具体数据许可，不把图片CC声明自动扩展为所有科学数据许可。

## 核查状态

来源与文件头实际核验：checked_with_limits。10项独立数值/输入哈希检查见 `data/light/model-checks.json`。实际浏览器渲染及模型视觉复核由主执行者另记录；真人科学审校pending，真实试讲pending，教材对照pending。BUNIT/教育拼接归一与精密天测未核，不阻塞结构及显示教学。
