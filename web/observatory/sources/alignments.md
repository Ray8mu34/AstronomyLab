# 行星相位、视逆行与凌星：实际来源与计算范围

日期2026-10-03。本轮实际读取：

- [NASA Venus Facts](https://science.nasa.gov/venus/venus-facts/)，距离、内轨道、相位与约225天公转段；不采用其“sunrise to sunset 117 days”的不严谨时间表述，也不将整页背书为历史论证。
- [NASA Mars Facts](https://science.nasa.gov/mars/facts/)，约687天公转与轨道背景。
- [JPL Approximate Positions](https://ssd.jpl.nasa.gov/planets/approx_pos.html)，实际轨道参数、历元和适用范围。这里仅用对应半长轴量级；不声称实现该页完整近似历表。
- [NASA What’s a transit](https://science.nasa.gov/exoplanets/whats-a-transit/)及[Light Curve of a Planet Transiting Its Star](https://science.nasa.gov/resource/light-curve-of-a-planet-transiting-its-star/)，实际读取遮挡、光变、半径比/恒星尺寸与重复周期说明；不沿用动态的行星发现总数。一个候选 `what-is-a-transit` URL不可访问，不记为已读取。均匀圆盘面积由独立平面几何推导，并由数值采样验证。

地球365.256天，金星224.701天/0.723332 au，火星686.98天/1.523679 au是与原文章及现有轨道表一致的圆整平均参数。太阳为原点，地球轨道xy平面，倾角绕交点线旋转。夹角用完整向量求值；月相式k=(1+cosα)/2，金星最大距角在共面圆轨道为asin(a金星)。火星黄经速度用对称差分并消除±π跳变，曲线局部连续展开。

凌星采用两均匀圆面交叠，F/F0=1−A/(πR★²)，深度满入时为r²。b、r、x分别归一于恒星半径。无临边昏暗、光行时、曝光积分、天气与噪声。左侧金星式轨道与右侧可调一般凌星半径并非同一真实系统；横轴位置不是时刻。金星云相函数和绝对亮度未计算；不声称k/d²给出星等。

轨道半径保留比例、天体半径放大；实验0天人为取共线构型，没有真实日期。已有304 Å金星凌日与火星冲日对照图均来自现有课程素材，未改原图；原署名/波段/许可见assets/v02-first4-SOURCES.md。Three.js为本地MIT代码，模型线条为原创教学示意。

来源状态checked_with_limits。全站工程/渲染与模型视觉复核另存；真人科学审校、真实试讲及教材对照pending。
