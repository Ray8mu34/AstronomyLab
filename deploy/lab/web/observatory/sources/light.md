# 星光与观测：来源、计算与状态

访问/实施日期：2026-10-03，Asia/Shanghai。对应 `modules/light.js`、`light-physics.mjs`，第08、10讲原文章未改。

## 本轮实际读取

- [OpenStax Astronomy 2e §5.2](https://openstax.org/books/astronomy-2e/pages/5-2-the-electromagnetic-spectrum)：实际读取黑体连续分布、温度、维恩关系、斯特藩—玻尔兹曼与球面光度关系。该教材正文只是机制参考；不复制其图版或段落。所有网页解释与计算图由本项目重新写作。
- [OpenStax §5.6](https://openstax.org/books/astronomy-2e/pages/5-6-the-doppler-effect)：实际读取沿视线靠近/远离与波长位移，不将径向速度当作三维总速率。
- [PyAstronomy 官方旋转核文档](https://pyastronomy.readthedocs.io/en/latest/modelSuiteDoc/rotBroadProfile.html)：实际读取线性临边昏暗旋转核、c1/c2、归一与采样警告；使用数学公式重新实现，不安装或复制库代码。使用161个核积分点，局部速度坐标，非宽波段通用卷积。
- [PyAstronomy broadening](https://pyastronomy.readthedocs.io/en/latest/pyaslDoc/aslDoc/rotBroad.html)：读取边界及窄波段近似说明。
- [STScI WFPC2 成像信噪说明](https://ssb.stsci.edu/cdbs/perigee/jyounger/PhaseI_IHB_JavaHelp/WFPC2/ch6_exposuretime10.html)：实际读取光子涨落、每像素背景、暗电流、读出及多次曝光；本网站使用明示孔径模型，并非直接复现其最优PSF权重。
- [ESO La Silla 历史消光](https://www.eso.org/sci/observing/tools/Extinction.html)：读取不同波长历史表以及需要当夜测量的提醒。默认k=0.20是教学值，没有将La Silla表移植为杭州或当前天气。
- [NIST CODATA 2022完整表](https://physics.nist.gov/cuu/Constants/Table/allascii.txt)：实际读取精确h、c、k与σ/维恩常数值。σ=5.670374419×10⁻⁸，维恩波长常数2.897771955×10⁻³ m K。

## 数学定义

- 普朗克 Bλ 单位W·m⁻³·sr⁻¹，输入nm在函数中转为m。图绝对纵轴除10¹³；归一模式每条曲线除各自峰值。波长横轴100—2000 nm并不包含所有辐射，光度另由全谱σT⁴计算，不将有限图窗积分冒充总功率。
- 半径单位太阳半径，采用6.957×10⁸ m作为标尺；秒差距=3.085677581491367×10¹⁶ m。有效温度模型L=4πR²σT⁴；距离与灰消光F=L/(4πd²)×10⁻⁰·⁴ᴬ。显示的是相对当前模型10 pc无消光的星等差，无绝对波段零点；A为灰消光教学模型。
- 参考吸收线656.28 nm是简化Hα参考，不处理精细结构/空气真空转换。低速Δλ/λ=v/c，|v|≤250 km/s。内禀高斯σ=4 km/s，深度0.7；仪器σ=(c/ℛ)/2.35482，旋转与仪器卷积保持等效宽度。v sin i分别由赤道速度和视线夹角联动。颜色表示运动符号，没有计算综合色觉。
- 大气X=1/sin h在10°—90°使用，中高空较合理；10°附近已属较粗略近似，不含球面大气、折射或实测消光。不能向0°外推精密结论。
- 孔径SNR信号/背景为同一9像素孔径总e⁻/s，读出和0.02 e⁻/s暗电流为每像素值。源、背景、暗、n像素×n帧×r²方差分别列出。下方随机剖面是独立逐像素示意，未作为孔径SNR拟合数据。
- 伪随机使用固定种子；均值<35的泊松逆累乘采样，大计数使用均值与方差匹配的高斯近似。未模拟真实探测器、系统误差、人体暗适应曲线或目视检测阈值。

## 状态与局部问题

实际数值检查在 `data/light/model-checks.json`，10项检查覆盖星光和图像；含对应4个代码SHA256。浏览器/模型视觉由主执行者单独检查，不能由本文件替代。真人科学审校pending，真实试讲pending，教材系统对照pending。

两个候选新版STScI曝光章节URL（WFC3/ACS第9章猜测路径）不可访问，未作为核验来源。NIST `Value?bwien`、`Value?sigma`被工具解析为错误请求，改用实际取得的完整表；没有把错误响应记为常数核验成功。这些局部问题不阻塞已有替代主来源。
