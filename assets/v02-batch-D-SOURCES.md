# v0.2 第14—16讲来源与素材核验

正文是原创长文；下列链接用于事实核验，并非复制文章或取得所有第三方作品许可。2026年10月2日开始检索，10月3日完成本地文件与追加校准。第15讲当年新闻截止仍为2026年10月2日，全年穷尽 **partial**。人工科学审校、真实试讲均 **pending**；导出与成品渲染由主代理另记，不继承旧版通过状态。

原图文件下载、像素尺寸、SHA-256与12字段素材清单见 `v02-batch-D-ASSETS.csv` 及各目录 `retrieval.json` / 本批QA记录。只将机构观测、工程/数据示意与明确标注的原创计算图用于正文；没有生成观测照片。

<a id="l14"></a>
## 第14讲：真实光子到发布图

| ID | 实际打开的来源 | 核验内容与边界 |
|---|---|---|
| D14-01 | [NASA Hubble M1](https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-1/) | M1超新星遗迹、脉冲星、1054观测关联。静态图不测脉冲周期。 |
| D14-02 | [NASA Hubble M33](https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-33/) | 外部旋涡星系、造父测距历史。未把每个亮点判为M33单颗恒星。 |
| D14-03 | [ESA/Hubble heic0515a](https://esahubble.org/images/heic0515a/) | 24次WFPC2曝光；该发布版本滤镜表为OI631/SII673/OIII502 nm，横视场6.41′，**不是SHO**。3864×3864本地JPEG。 |
| D14-04 | [ESO eso0202a](https://www.eso.org/public/images/eso0202a/) | VLT/FORS2马头，2000-02-01，B/V/R映蓝/绿/红；宽带，不写成SHO。发布JPEG3887×4000。 |
| D14-05 | [ESO eso1424a](https://www.eso.org/public/images/eso1424a/) | VST/OmegaCAM M33，g/r/Hα，横视场68.01′。本地4000×3355为publicationjpeg，非19058×15983原始发布最大图。 |
| D14-06 | [Breuval等2023 M33造父研究](https://arxiv.org/abs/2304.00037) | 实读摘要：154颗，840±11 kpc，LMC食双星锚。68′→16.6 kpc为本稿原创小角算例，**画幅非星系边界**。 |
| D14-07 | [OpenStax 6.3](https://openstax.org/books/astronomy-2e/pages/6-3-visible-light-detectors-and-instruments) | CCD光电计数与长曝光相对眼睛短积分时间。只参考事实，未下载教材图或复制教材段落。 |
| D14-08 | [NASA Spinoff 2010](https://spinoff.nasa.gov/node/10643) | 仅使用视杆低照度/视锥颜色功能的背景事实；未采用其产品、健康或蓝光宣传判断。 |
| D14-09 | [OpenStax 5.4](https://openstax.org/books/astronomy-2e/pages/5-4-the-structure-of-the-atom) | 原子能级与光子能量。已替换原来不够贴切的5.2链接。 |
| D14-10 | [OpenStax 20.2](https://openstax.org/books/astronomy-2e/pages/20-2-interstellar-gas) | 电离、复合、发射线、罗马数字离子状态、稀薄气体禁戒线；颜色非元素丰度百分比。 |
| D14-11 | [NASA Imagine：Crab](https://imagine.gsfc.nasa.gov/science/objects/snr_crabneb.html) | 明确相对论电子在星云磁场中产生同步辐射；用以支持连续辐射段。 |
| D14-12 | [STScI STIS IHB 7.3](https://hst-docs.stsci.edu/stisihb/chapter-7-feasibility-and-detector-performance/7-3-ccd-operation-and-feasibility-considerations) | CCD、读出/暗信号及性能边界；未拿STIS参数当WFPC2具体性能。 |
| D14-13 | [STScI STIS DHB 3.4](https://hst-docs.stsci.edu/stisdhb/chapter-3-stis-calibration/3-4-descriptions-of-calibration-steps) | 实读BIASCORR/DARKCORR/FLATCORR：减偏置、按时间暗扣除、除平场；流水线顺序随数据改变。已替换不可访问WFPC2链接。 |
| D14-14 | [STScI DrizzlePac](https://hst-docs.stsci.edu/drizzpac) | 配准、组合、几何/采样处理背景；不是无条件恢复未采样细节的承诺。 |
| D14-15 | [WFPC2 IHB：曝光时间](https://ssb.stsci.edu/cdbs/perigee/jyounger/PhaseI_IHB_JavaHelp/WFPC2/ch6_exposuretime10.html) | 信号、背景、暗与读出噪声项。正文n特定义总像素读出次数；100/400秒为假设电子计数算例。 |
| D14-16 | [Lupton等RGB方法全文](https://arxiv.org/html/astro-ph/0312483v1) | 实读§II及§III：log/asinh显示、强度与颜色、显示截断与探测器饱和的区别。替换不支持拉伸的1308.5237；不搬用论文图。 |
| D14-17 | [ESA/Hubble heic0305a](https://esahubble.org/images/heic0305a/) | M17局部明确SII红/Hα绿/OIII蓝；本文标准SHO真实版本。2163×1756JPEG。 |
| D14-18 | [ESA/Hubble heic1307a](https://esahubble.org/images/heic1307a/) | WFC3马头J1.1/H1.6μm，2704×2826JPEG；不同视场/朝向，不能作2000→2013时间变化比较。 |

图1—5完整credit已就地保留。许可页实际打开：[ESA/Hubble CC BY 4.0](https://esahubble.org/copyright/)、[ESO CC BY 4.0](https://www.eso.org/public/outreach/copyright/)。其普通图片许可不扩展至独立logo、论文或代码。五张下载图未重新着色、裁切、旋转；显示缩放不是数据改变。

<a id="l15"></a>
## 第15讲：轨道、回收与证据层级

| ID | 实际打开的来源 | 核验内容与边界 |
|---|---|---|
| D15-01 | [NASA Basics of Space Flight ch3](https://science.nasa.gov/learn/basics-of-space-flight/chapter3-2/) | 引力、自由落体、圆/椭圆轨道条件。正文用地心半径，200km的7.79km/s、88分钟、94%引力为原创近似计算。 |
| D15-02 | [NASA Glenn Rocket Thrust](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/rocket-thrust/) | 动量喷流、推力与重量、真空中推进；着陆a=T/m−g与125m停止距离为假设简化推算。 |
| D15-03 | [NASA Glenn Specific Impulse](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/specific-impulse/) | 等效排气速度、比冲；g0为标准重力加速度，与G不同。秒不解释为发动机可工作时间。 |
| D15-04 | [NASA Glenn Ideal Rocket Equation](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/) | 实读推导及下载600×451GIF。**原图mf=full初始质量/me=empty结束质量，与正文m0/mf分别对应**，已在图注显式校准。质量比3/10/20及回收代价是假设算例，不为特定型号性能。 |
| D15-05 | [NASA GSFC launch页面：Multi-stage Rockets段](https://solc.gsfc.nasa.gov/modules/launch/mainMenu_textOnly.php) | 只采用分离无用级、后续级继续加速的段落；页面别处对逃逸速度等的简化叙述不作本文事实依据。最初猜测的Glenn multi-stage URL为404，未保留。 |
| D15-06 | [NASA作者2025热防护报告](https://ntrs.nasa.gov/api/citations/20250006125/downloads/NASA_TPS_Perspectives_ReusableRocketsWorkshop_RevB.pdf) | 实读第2页许可/立场说明、第5页激波、对流/辐射与能量、第13/15页验证/整修背景。原PDF29页保存；第5页完整渲染为2400×1350PNG，实际查看。作者观点不是NASA正式政策。 |
| D15-07 | [NASA 2020-12-06 CRS-21通报](https://www.nasa.gov/blogs/spacexcrs21/2020/12/06/falcon-9-first-stage-sticks-the-landing/) | 着陆画面1280×720原截帧；正文明确同一一子级第四飞行含Demo-2。不是根据照片判断硬件复飞，也不外推2026复用次数或成本。 |
| D15-08 | [CNSA 2026-07-10](https://www.cnsa.gov.cn/n6758823/n6758838/c10761540/content.html) | 实际重开并通过requests获取本地UTF-8 HTML：长征十号乙12:15发射、卫星预定轨道、一子级“领航者”网系捕获。日期、型号、任务结果分别核对。后续web重开超时不当作事件不存在。 |
| D15-09 | [CNSA 2026-08-19](https://www.cnsa.gov.cn/n6758823/n6758838/c10768762/content.html) | 实际重开/本地UTF-8 HTML：朱雀三号遥二7:35发射、7:41一子级按程序陆地回收。正文把型号轨道发射后回收能力说明与当次载荷独立结果分开。 |
| D15-10 | [北京经开区元行者原报道](https://kfqgw.beijing.gov.cn/zwgkkfq/ztzl/lqztkfq/lqzx/zxxx/202506/t20250604_4105322.html) | web正文成功，日期2025-05-30，事件05-29；2.5km/125s海面软着陆验证。“入轨+回收”为未来目标。requests保存尝试403，未声称有本地全文备份。 |
| D15-11 | [NASA How We Find and Characterize](https://science.nasa.gov/exoplanets/how-we-find-and-characterize/) | 实读视向速度、凌星、凌星光谱段。简单遮挡面积与密度误差为原创推理；只讲测量链，不声称发现某生命迹象。 |
| D15-12 | [O'Donovan等2006](https://arxiv.org/abs/astro-ph/0603005) | 实读摘要：食双星混光伪凌星、多色测光与高分辨光谱排除。为不同信号来源的具体研究证据。 |

正文原创计算图给出状态量，**不是实测飞行轨迹**。同目录保存Python、SVG、PNG、JSON；图中200km处动能30.3 MJ/kg、势能增量1.90 MJ/kg，不含推进损失。可复用成本C/N+R+O是假设分析关系，不是任何企业报价。

NASA素材的教育/信息使用依据实际打开的[媒体指南](https://www.nasa.gov/nasa-brand-center/images-and-media/)；报告第2页写明非特殊注明图片来自NASA公众素材/作者，第5页图具体署名为Michael (NASA ARC), “Aerothermal Modeling for Entry and Aerocapture”, 2007。保留整页与完整credit，不将logo抽出作课程标志，不表示机构认可。其他报告页含第三方图，**不据此声明整份报告所有图都可任意复用**。

**局部未闭合问题：**原题2026全年型号穷尽与回收定义仍partial；截止2026-10-02没有全年结束数据。三条通报仅支持三事件，不能证明除此之外无其他进展。新闻引用的事实核验与技术长期成本/可靠性评价分开。

<a id="l16"></a>
## 第16讲：空间、运动与宇宙历史

| ID | 实际打开的来源 | 核验内容与边界 |
|---|---|---|
| D16-01 | [NASA Moon Phases](https://science.nasa.gov/moon/moon-phases/) | 月相/照明背景。影长h=l tanα为平地假设原创推算，不是直接由斜视图量山高。 |
| D16-02 | [NASA Tycho Central Peak](https://science.nasa.gov/resource/tycho-craters-central-peak-on-the-moon/) | LRO NAC，历史观测2011-06-10，网页2019-01-30；峰顶约2km高。下载2147×985官方图；近距离斜视不等于目镜效果。 |
| D16-03 | [NASA地月激光测距](https://www.nasa.gov/missions/laser-beams-reflected-between-earth-and-moon-boost-science/) | 往返光时约2.5s；台站到反射器距离，不能无校正当中心距离。384400km→1.86km/角秒为原创量级计算。 |
| D16-04 | [NASA木星卫星参数](https://nssdc.gsfc.nasa.gov/planetary/factsheet/joviansatfact.html) | 表中Io半长轴421.8×10³km、周期1.769138日；据此两体计算GM≈1.27×10¹⁷SI、M≈1.90×10²⁷kg，不声称精密拟合。 |
| D16-05 | [ESO Galactic Centre](https://www.eso.org/public/science/gc/) | 红外/高角分辨银心观测及恒星运动证据。 |
| D16-06 | [ESO eso0226c历史原图](https://www.eso.org/public/images/eso0226c/) | 2002-10-16发布，2.1μmNACO；1992—2002数据位置十字含误差。先971×720JPEG，后另下2883×2023原始TIFF并无损转PNG，正文改用高清PNG。 |
| D16-07 | [ESO 2018 S2近心](https://www.eso.org/public/news/eso1825/) | 周期16年、近心120AU、约四百万太阳质量/引力红移背景；1000AU为圆整代表参数，用于算例，不从旧图重测当前质量。 |
| D16-08 | [ESO 2002原通报](https://www.eso.org/public/news/eso0226/) | 早期轨道与紧致中心质量约束。历史通报旧估值不当2026最新值。 |
| D16-09 | [NASA 2014哈勃视差](https://www.nasa.gov/news-release/nasas-hubble-extends-stellar-tape-measure-10-times-farther-into-space/) | 视差几何背景；本文传统p为1AU，半年≈2p限定选择最大视差位移时刻，基线近垂直视线。 |
| D16-10 | [NASA StarChild Cepheids](https://starchild.gsfc.nasa.gov/docs/StarChild/questions/cepheids.html) | 脉动与周期—光度；“会变星”不自动同一标准。 |
| D16-11 | [NASA 2018距离阶梯](https://science.nasa.gov/asset/hubble/three-steps-to-measuring-the-hubble-constant/) | 3000×2550PNG，视差—造父—Ia—膨胀。图中旧精度不当现今纪录，Ia在正文限定需标准化。 |
| D16-12 | [同图ESA/Hubble opo1812a](https://esahubble.org/images/opo1812a/) | 实际打开，同尺寸/信用行/内容，确认CC BY4适用；完整credit NASA, ESA, A. Feild (STScI), and A. Riess (STScI/JHU)。 |
| D16-13 | [Breuval等2023](https://arxiv.org/abs/2304.00037) | 同D14-06。154颗、840±11kpc；±11不是声称所有系统误差消失。 |
| D16-14 | [OpenStax 18.4 HR图](https://openstax.org/books/astronomy-2e/pages/18-4-the-h-r-diagram) | 实读光度/温度/半径、红巨星/白矮星区别，原创解释非教材图复用。 |
| D16-15 | [OpenStax 21.2演化](https://openstax.org/books/astronomy-2e/pages/21-2-the-h-r-diagram-and-the-study-of-stellar-evolution) | HR位置随物理状态改变，不是空间轨迹。 |
| D16-16 | [OpenStax 22.3群体检验](https://openstax.org/books/astronomy-2e/pages/22-3-checking-out-the-theory) | 主序转折与星团年龄，模型/群体证据。 |
| D16-17 | [NASA 25年蟹状膨胀](https://science.nasa.gov/missions/hubble/nasas-hubble-revisits-crab-nebula-to-track-25-years-of-expansion/) | 2024与1999/2000数据、细丝相对背景星位移、脉冲星供能与仪器变化边界。不是把全部图差都判为天体变化。 |
| D16-18 | [NASA M1](https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-1/) | 1054为地球收到事件光的年份，传播时间分别解释。 |
| D16-19 | [NASA Stars](https://science.nasa.gov/universe/stars/) | 不同质量演化时间、残骸/星际物质联系；本文没有采用简化核心爆炸示意作为完整机制。 |
| D16-20 | [Hogg：Distance measures in cosmology全文](https://arxiv.org/html/astro-ph/9905116v4)；[摘要入口](https://arxiv.org/abs/astro-ph/9905116) | 实读角直径/光度距离、回望时间定义；更远宇宙距离不是统一d/c。NASA LAMBDA也实际参考，不用其H0历史表作当前精度结论。 |

第16讲开头明确为设想场景，未虚构实际观测、学生经历、人工审校或试讲。图1为LRO地形观测，图2是成像+实测轨道数据，图3是科学解释图；表示方式与年代已分别交代。
