# 天文图像：参考资料与模拟图

本页记录正文使用的解释图及其模型。原有五张机构图片的版本、署名和许可沿用[原始素材记录](../../v02-batch-D-SOURCES.md#l14)，原图文件保持不变。

## 参考资料

以下页面于 2026-10-25 实际打开，相关事实与原有记录交叉检查；正文采用独立表述，未复制论文或教材图片。

| 资料 | 对应内容 |
|---|---|
| [STIS CCD operation](https://hst-docs.stsci.edu/stisihb/chapter-7-feasibility-and-detector-performance/7-3-ccd-operation-and-feasibility-considerations) | 暗电流、线性响应与饱和；只使用一般机理，不采用页面的当年仪器预测参数。 |
| [STIS calibration steps](https://hst-docs.stsci.edu/stisdhb/chapter-3-stis-calibration/3-4-descriptions-of-calibration-steps) | 偏置、暗与平场处理及实际流水线顺序的依赖。正文方程是加性/乘性响应的简化模型。 |
| [WFPC2 signal-to-noise](https://ssb.stsci.edu/cdbs/perigee/jyounger/PhaseI_IHB_JavaHelp/WFPC2/ch6_exposuretime10.html) | 光子统计、天空、暗与读出方差，正文改用明确测光区域内的总信号率，并显式写出像素数与曝光次数。 |
| [Lupton et al., RGB images](https://arxiv.org/html/astro-ph/0312483v1) | §II 的非线性显示与 asinh，§III 的探测器饱和；本文模拟仅使用灰度映射。 |
| [M17 image heic0305a](https://esahubble.org/images/heic0305a/) | SII→红、Hα→绿、OIII→蓝的明确对应，以及实际滤镜和原署名。 |
| [Horsehead image heic1307a](https://esahubble.org/images/heic1307a/) | WFC3 1.1/1.6 微米、视场 5.78×6.04 角分、近红外较弱消光及可见结构。 |

背景直达光的指数衰减式，由各薄层独立移走一定比例光的模型写出；云的自发射、入射散射和前景光在正文中单列。预期电子计数积分式由能量通量除以单光子能量、再乘面积、时间、透过率和探测效率得到。这两式将原文已有物理过程形式化，不用于拟合展示的机构发布图。

<a id="simulation"></a>
## 校准与显示的受控模拟

- [PNG 图](measurement-and-display.png)
- [SVG 图](measurement-and-display.svg)
- [生成源](make_measurement_figure.py)
- [完整参数](simulation-parameters.json)

模拟在 160×120 像素网格上设置三个高斯星点和解析云状分布，全部数据由程序生成。它没有读取、变换或拟合任何观测照片。各面板使用相同天体模型与像素几何；100 秒和 400 秒分别为独立随机曝光。

原始计数模型为

$$
R_i=B+\operatorname{Poisson}\{t[q_i(s_i+b)+d]\}
 +\mathcal N(0,r^2).
$$

偏置 $B=100$ 电子，均匀背景 $b=9$ 电子/秒/像素，暗电流 $d=0.02$ 电子/秒/像素，单次读出噪声 $r=3$ 电子。相对响应包含解析渐晕和固定像素差异。生成用固定随机种子 1025。

校准假定偏置、暗电流、相对响应和平均背景已知，按 $(R_i-B-td)/(tq_i)-b$ 得到天体信号率。光子与读出涨落仍保留；本模型不含校准帧误差、相关噪声、追踪误差和饱和。

A、D、E 使用同一 asinh 灰度范围 0—40 电子/秒/像素，线性转折尺度 0.5；F 与 E 数组完全相同，仅改为同一端点范围的线性显示。负的背景扣除残差在这些显示中呈黑色，原数组的统计意义不变。B 和 C 分别使用原始电子数与无量纲响应的独立色标。

图在已有 Conda `dl_env` 中以 NumPy 和 Matplotlib 生成，PNG 与 SVG 从同一图对象导出；已实际查看 PNG，确认标题、色标、像素坐标与对照关系可读。
