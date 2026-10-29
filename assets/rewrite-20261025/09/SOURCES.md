# 第 09 篇参考说明

2026-10-28补充法兰距。实际查阅[Edmund Optics镜头结构说明](https://www.edmundoptics.com/knowledge-center/application-notes/imaging/the-anatomy-of-a-lens/)中的安装肩面、法兰距与像面定义，以及[ZWO接环连接示例](https://www.zwoastro.com/product/zwo-m42-m42-extender-21mm-length/)的17.5＋21＋16.5＝55 mm组合；[ZWO外接平场镜安装说明](https://us.zwoastro.com/blogs/usage-tutorials/the-best-solution-of-55mm-back-focal-length)支持校正镜指定间距与视场校正的关系。正文把法兰距、有效焦距与校正镜至感光面的距离分别对应到具体基准；55 mm仅用于该算例，实际配置按设备说明处理。新增两段文字，无新增图像或资产替换。

查阅日期：2026-10-25。正文保留七张图的科学内容；两张机构图片文件与署名保持原样，五张原创光学图由原源文件生成简洁副本。完整的原许可和文件记录见[批次 B 来源表](../../v02-batch-B-SOURCES.md)与[素材表](../../v02-batch-B-ASSETS.csv)。

| 来源 | 正文所用内容 |
|---|---|
| [OpenStax Astronomy 2e, 6.1](https://openstax.org/books/astronomy-2e/pages/6-1-telescopes) | 收光面积、折射反射成像及测量系统。 |
| [Celestron Optical Tubes](https://www.celestron.com/blogs/knowledgebase/the-ultimate-guide-to-celestron-optical-tubes) | 三类望远镜的实际元件和光路；只采用结构事实。 |
| [Celestron Exit Pupil](https://www.celestron.com/blogs/knowledgebase/what-is-exit-pupil-and-eye-relief-for-sport-optics) | 出瞳直径与观看位置。正文个体眼瞳为明确算例，未将页面给出的常见范围作为所有人的固定范围。 |
| [Celestron Eyepieces](https://www.celestron.com/blogs/knowledgebase/how-to-determine-which-eyepieces-to-use-with-your-telescope) | 倍率和温度平衡、准直、稳定空气的关系。没有使用厂商最高倍率数字作为普遍界限。 |
| [Celestron Focal Reducers](https://www.celestron.com/blogs/knowledgebase/understanding-focal-reducers) | 有效焦距、场曲和系统匹配。 |
| [OpenStax University Physics 3, 4.5](https://openstax.org/books/university-physics-volume-3/pages/4-5-circular-apertures-and-resolution) | 艾里图样、第一暗环与瑞利判据。正文给出 $D\theta$ 的光程量级解释，并按 550 nm 独立计算例子。 |
| [ESO Adaptive Optics](https://www.eso.org/public/teles-instr/technology/adaptive_optics/)；[MUSE/GALACSI 2018 测试](https://www.eso.org/public/news/eso1824/) | 波前测量、可变形镜、导星、主动与自适应光学；海王星对照的实际仪器模式。 |
| [STScI ACS Wide Field Optical CCD Imaging](https://hst-docs.stsci.edu/acsihb/chapter-5-imaging/5-3-wide-field-optical-ccd-imaging) | 像素角尺度、不同波长下采样与抖动观测。正文采样表使用独立设定的 4 μm 像素及 500、1000、2000 mm 焦距。 |
| [NASA Eclipse Viewing Safety](https://science.nasa.gov/eclipses/safety/) | 专门太阳滤光系统、前端滤光与目镜后使用裸眼日食镜的危险。 |
| [ESO recoating UT4](https://www.eso.org/public/images/recoating-ut4/)；[ESO eso1824b](https://www.eso.org/public/images/eso1824b/) | 主镜和海王星图的身份、尺寸、署名与波段。海王星主链接两次超时后，经同页 `?lang=` 地址成功读取，图注仍保留规范链接。 |

正文从入光面积、近轴几何、出瞳与像素角面积分别推导计数、像尺度、倍率、扩展目标视网膜照度及焦比关系。扩展目标结论明确固定波段、像素大小与透过率；高斯模糊平方和只用于独立近似高斯过程。

原稿像素段的指代矛盾已修正：焦距由 500 增至 1000 mm 时，2 角秒光斑从约 1.21 像素增至 2.42 像素，采样变细；由 1000 减至 500 mm 则变粗。正文以递增焦距表格重新组织这项推导。

原图源继续保留：`assets/08/v02/create_batch_b_assets.py`、`assets/09/v02/draw_sct.py` 及各图 SVG。本目录的 [create_figures.py](create_figures.py) 从这些原几何和模型生成五张 PNG/SVG 副本：折射式、牛顿式、焦平面、衍射与视宁、施密特—卡塞格林。删去解释性标题、重复公式及读图提醒，保留对象、坐标、单位和曲线标签；焦平面以距离箭头标出 $y$，替代图中重复正文的公式。近轴、归一化与示意比例等条件保留在正文图注。源图 SHA-256 记录在 [figure-provenance.json](figure-provenance.json)，生成前后核对一致。
