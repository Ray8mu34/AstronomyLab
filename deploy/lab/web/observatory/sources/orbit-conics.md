# 横速入轨：解析圆锥轨道与时间控制

2026-10-04定向修订，入口仍为统一网站 `/lab/orbits`。实现：`modules/orbit-conics.js`、`orbit-conics-physics.mjs`、`orbit-conics.css`，由既有 `orbits.js` 接入。点火升轨、原 `orbits-physics.mjs`、原科学数据及第15/16讲正文没有改写。分级/着陆由另一线程的独立组件接入，科学范围见[该组件来源](landing-staging-sources.md)，不由本节圆锥检查代替。

## 实际核对的官方来源

- [JPL：Astrodynamic Parameters](https://ssd.jpl.nasa.gov/astro_par.html)：本次实际读取DE440行，Earth GM为398600.435507 km³/s²。继续使用原 `orbits-physics.mjs` 的常数；球形地球半径6371 km沿用原模块，不引入新的椭球或地理定位精度。
- [NASA：Gravity & Mechanics，Page One](https://science.nasa.gov/learn/basics-of-space-flight/chapter3-2/)：本次读取牛顿力学与圆作为椭圆特例的段落。
- [NASA：Gravity & Mechanics，Page Three](https://science.nasa.gov/learn/basics-of-space-flight/chapter3-3/)：本次读取开普勒定律、焦点、等面积和周期与半长轴的关系。用于轨道几何与时间解释。
- [NASA：Gravity & Mechanics，Page Four](https://science.nasa.gov/learn/basics-of-space-flight/chapter3-4/)：本次读取近远地点能量变化与自由下落段落；来源同时说明真实上层大气会衰减轨道。本模型明确省略空气阻力，不把200 km描述为绝对没有大气的区域。
- [NASA：Planetary Orbits](https://science.nasa.gov/learn/basics-of-space-flight/chapter5-1/)：本次读取轨道要素和偏心率为零的圆轨道说明。
- [JPL/NAIF：prop2b_c](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/cspice/prop2b_c.html)：本次读取统一变量二体推进、近e=1精度问题与单位一致性说明。采用统一变量思路自行实现切向释放特例，未调用SPICE，也未声称与SPICE逐点比对通过。
- [JPL/NAIF：conics_c](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/cspice/conics_c.html)：本次读取椭圆/抛物线/双曲线状态与不含其他天体及非引力摄动的名义轨道范围。

## 算法、单位与分类

位置以地心为原点，释放点为(r₀,0)，速度为(0,v₀)。r₀=6371 km+h，时间为s，速度为km/s，μ为km³/s²。地球固定，飞行器质量相对地球忽略。

由牛顿二体模型和能量/角动量守恒得到：q=r₀v₀²/μ；ε=(q−2)μ/(2r₀)；α=(2−q)/r₀=1/a；H=r₀v₀；p=H²/μ；e=|q−1|；r=p/(1+e cosν)。km²/s²与MJ/kg数值相同。非退化轨道按ε<0、=0、>0区分椭圆、抛物线、双曲线。v₀=0的e=1属于负能量径向退化轨道，不能当作临界抛物线。圆是e=0的椭圆特例。

临界预设直接使用√(2μ/r₀)，仅当|q−2|≤32×机器epsilon×max(2,q)时吸收舍入误差。±10⁻¹⁰相对逃逸速度仍严格保留能量正负；临界附近的小能量用科学计数法，避免显示成假零。

统一变量χ的时间方程为：(1−αr₀)χ³S(αχ²)+r₀χ=√μt。C/S为Stumpff函数，小参数用收敛级数；根由有界Newton与二分保护求得。每次从释放初值直接求解给定时间，完成的椭圆周期先取模，避免累计积分误差。长时间不会通过增大RK4步长实现；开放轨道播放也不以画面边界终止。零横速径向下落采用同一解析推进，首次触地时截断。

低于圆速从远地点释放且近地点穿地时，由偏近点角求第一次下降到地表的时间，位置与速度仅计算到该事件。该数学碰撞边界并非真实再入气动模型。

## 轨道背景、播放与显示

虚线是解析圆锥轨道，金线是从释放至当前时间已走的部分。椭圆整体视角完整闭合；开放轨道使用有限半径取样，以箭头表示延伸，没有虚构远地点。近地点视角保留地球附近尺度，飞行器离开画面后用方向箭头提示，仍可推进时间。零横速只画实际径向下落，不画穿地续轨迹。

整体与近地点使用相同横纵长度比例，标尺为km；地球为焦点。整体巨椭圆中地球不足3px时使用明示的放大焦点指示，物理半径没有暗改。飞行器点也被放大。地球表面复用已有Solar System Scope纹理，CC BY 4.0与署名沿用[原模块说明](orbits.md)；这是表面示意，不能定位地理航迹。

总时间与每真实秒推进的仿真小时数分别输入。总时间0.01—876000 h（约100年）；播放速率0.00001—1000000 h/s。四个轨道预设给出方便课堂观看的时长/播放速度，随后两项可各自修改；“总时长设为一圈”定位完整周期。改速度/高度重新释放；拖时间暂停；切视角保留时刻；切出横速入轨暂停。重置回到200 km精确圆轨道、2 h总时长、0.1 h/s。

## 检查范围与模型边界

9组实际数学检查包括圆/椭圆周期闭合、半周期远地点、独立Barker抛物线解、逃逸阈值两侧、100年位置推进的能量和角动量、首次撞地、地球焦点几何，以及与原1 s RK4短时结果对照。结果见工作区 `review/2026-10-04-orbit-conics/physics-checks.json`。工程、实际浏览器画面及视觉复核另记同目录交接，不把数学正确当作所有交互通过。

理想二体、无大气、无地球扁率与自转、无月球/太阳引力、无有限推力。10.98 km/s例子产生远地点约104万km的数学椭圆，真实地球周边早已不能忽略其他天体；本页说明其形状与能量关系，不能用于任务预报或长期稳定性判定。真人科学审校、真实试讲与教材对照继续pending。
