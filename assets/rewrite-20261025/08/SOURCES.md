# 第 08 篇参考说明

本页列出正文实际采用的来源与推导范围，查阅日期为 2026-10-25。原有图文件、署名和许可记录继续保存在[批次 B 来源表](../../v02-batch-B-SOURCES.md)与[素材表](../../v02-batch-B-ASSETS.csv)。

| 来源 | 正文所用内容 |
|---|---|
| [ESO Observing Conditions](https://www.eso.org/sci/observing/phase2/ObsConditions.html) | 透明度、月光、湍流条件的分别定义；视宁与仪器最终图像质量的区别。 |
| [ESO La Silla Extinction Coefficients](https://www.eso.org/sci/observing/tools/Extinction.html) | 消光系数的波长依赖与当夜测量；表内历史数据没有当作本地通用常数。 |
| [ESO VIMOS Atmospheric Effects](https://www.eso.org/sci/facilities/paranal/decommissioned/vimos/inst/atmos.html) | 大气差分折射及色散随观测方向和时间的变化。 |
| [STScI WFPC2 信噪比说明](https://ssb.stsci.edu/cdbs/perigee/jyounger/PhaseI_IHB_JavaHelp/WFPC2/ch6_exposuretime10.html) | 目标、背景、读出和暗电流的噪声贡献。正文使用固定测量区域、光子噪声占主导且平均背景已知的简化模型，并由计数率推导曝光时间的平方根关系。 |
| [OpenStax Astronomy 2e, 6.2](https://openstax.org/books/astronomy-2e/pages/6-2-telescopes-today)；[ESO Adaptive Optics](https://www.eso.org/public/teles-instr/technology/adaptive_optics/) | 地面观测的大气限制、湍流与像质；由波前扰动解释图像的位置和形状变化。 |
| [Kalloniatis 与 Luu：Light and Dark Adaptation](https://www.webvision.pitt.edu/book/part-viii-psychophysics-of-vision/light-and-dark-adaptation/) | 视杆与视锥适应、视网膜位置与波长依赖。暗适应从光照改变后连续发生，其时间取决于适应前的光照与测试条件。 |
| [NPS：Dark Adaptation and Red Flashlights](https://www.nps.gov/articles/dark-adaptation-of-the-human-eye-and-the-value-of-red-flashlights.htm) | 现场使用微弱红光的实践说明。文章中关于色素在黑暗二十分钟后才开始产生的简化说法未采用；生理解释以上一项为依据。 |
| [NASA：Why NASA Watches Airglow](https://www.nasa.gov/solar-system/why-nasa-watches-airglow-the-colors-of-the-upper-atmospheric-wind/)；[NASA：Earth Awash in Lights of the Night](https://science.nasa.gov/earth/earth-observatory/earth-awash-in-lights-of-the-night-92912/) | 新增核对气辉的激发、复合和夜间化学发光机制。 |
| [ESO potw1936a](https://www.eso.org/public/images/potw1936a/)；[ESO potw1638a](https://www.eso.org/public/images/potw1638a/) | 两张原有照片的对象、署名与摄影性质。文件未修改；许可及使用范围沿用原素材记录。 |

上中天高度、平行层大气质量、消光比例、均匀目标面亮度、背景对比度和曝光时间算例依正文给出的几何及统计条件独立计算。它们是说明关系的模型，没有作为某个夜晚的预报或实测。两张计算图的原生成源为 `assets/08/v02/create_batch_b_assets.py`。

背景对比图按原模型在本目录生成简洁副本，删除整句结论标题和图内重复的对比度数值，保留背景值、坐标、单位及两条曲线标签；模型条件和数值说明放在正文图注。新图源为 [create_figures.py](create_figures.py)，输出 [PNG](background-contrast.png) 与 [SVG](background-contrast.svg)。大气质量图及两张机构照片保持原样。原背景图的 SHA-256 记录在 [figure-provenance.json](figure-provenance.json)，生成前后已核对一致。
