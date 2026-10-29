# 火箭的入轨、返回与复用：资料与图像

本篇以2020年的CRS-21任务为具体对象，物理算例单独给出模型条件。来源查阅日期：2026-10-25。

## 任务记录

- [NASA，New SpaceX Cargo Dragon Docks to Station，2020-12-07](https://www.nasa.gov/blogs/spacestation/2020/12/07/new-spacex-cargo-dragon-docks-to-station/)：12月6日发射、12月7日对接，货运任务和目的地。
- [NASA，Main Engine Cutoff, First Stage Separates，2020-12-06](https://www.nasa.gov/blogs/commercialresupply/2020/12/06/main-engine-cutoff-first-stage-separates-6/)：一级九台发动机关机、级间分离、二级继续飞行。
- [NASA，Falcon 9 First Stage Sticks the Landing!，2020-12-06](https://www.nasa.gov/blogs/spacexcrs21/2020/12/06/falcon-9-first-stage-sticks-the-landing/)：海上平台名称、这件一级第四次飞行及曾执行Demo-2。正文采用事件结果，不将博客发布分钟当作精确飞行遥测。
- [NASA，Dragon Separates from Second Stage，2020-12-06](https://www.nasa.gov/blogs/commercialresupply/2020/12/06/dragon-separates-from-second-stage-3/)：飞船与二级分离。旧blogs.nasa.gov链接现重定向到博客首页，正文使用迁移后的可读原文地址。

## 物理与工程

- [NASA，Basics of Space Flight，第3章第3页](https://science.nasa.gov/learn/basics-of-space-flight/chapter3-3/)：圆周运动中的向心加速度与引力、开普勒关系。
- [NASA Glenn，Rocket Thrust](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/rocket-thrust/)：推力的喷流动量项与压力项。
- [NASA Glenn，Specific Impulse](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/specific-impulse/)：比冲与等效排气速度。正文直接由推力定义采用$v_e=T/\dot m_p$，$g_0$为标准重力加速度。
- [NASA Glenn，Ideal Rocket Equation](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/)：变质量动量推导。正文采用初始$m_0$、结束$m_f$；旧机构图用full/empty下标，原文件保留，新正文配图直接展示喷气前后运动。
- Sidor, Olson & Bouslog，[NASA Perspective on the Future of TPS for Hypersonic Flight，2025-06-18](https://ntrs.nasa.gov/citations/20250006125)，[PDF](https://ntrs.nasa.gov/api/citations/20250006125/downloads/NASA_TPS_Perspectives_ReusableRocketsWorkshop_RevB.pdf)：本地保留文件`assets/15/v02/nasa-tps-2025.pdf`。本轮读第2、5—8、13、15—16页，使用激波、能量传递、材料响应、检查整修内容；作者观点不代表NASA正式立场。

## 图像与计算

1. `orbit-energy.png`、`.svg`：依据球对称地球的圆轨道关系重新绘制。保留旧稿同一组物理量与参数，旧文件`assets/15/v02/orbit-energy.*`未修改。生成源为本目录`create_figures.py`，参数及结果为`orbit-energy-data.json`。
2. `rocket-momentum.png`、`.svg`：重新绘制喷气前后运动。取初始静止的惯性系及无外力、喷口压力推力可忽略的模型；原质量$m$分成箭体$m-\delta m_p$和气体$\delta m_p$，气体相对箭体的排气速率为$u_e$。同目录`create_figures.py`保存生成源。NASA原方程图`assets/15/v02/rocket-equation.gif`保留供来源对照。
3. `entry-heat-transfer.png`、`.svg`：依据报告第5—8页物理关系绘制钝头物体、相对来流、弓形激波、热层与能量传递方向。图为定性机制示意，箭长不表示热流或速度的数值。生成源同上。旧报告整页渲染`assets/15/v02/reentry-heating.png`保留，已从正文配图替换；旧页内示意原署名Michael（NASA ARC），2007。
4. `assets/15/v02/crs21-landing.jpg`：NASA，2020-12-06，1280×720截帧。

以上既有图片的获取记录、署名与使用依据见[原素材记录](../../v02-batch-D-SOURCES.md#l15)和[原下载清单](../../14/v02/retrieval.json)。机构图像及标志按原来源条件使用；本篇新增科学图为解析公式绘图。

文中的质量比3/10/20、两级100 t算例、保留5 t的回收代价、3与8 km/s能量比较、125 m停止距离，以及成本$C/N+R+O$均为教学模型，不指称CRS-21的实测设计参数。200 km圆轨道为数量估算，不是这次货运任务的轨道参数。
