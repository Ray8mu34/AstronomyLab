# PhET：把条件与结果放在同一实验画面

2026-10-06｜[Gravity and Orbits](https://phet.colorado.edu/sims/html/gravity-and-orbits/latest/gravity-and-orbits_en.html)｜[My Solar System](https://phet.colorado.edu/sims/html/my-solar-system/latest/my-solar-system_en.html)。本次直接运行 HTML5 仿真，未以营销页或旧 Flash 版本代替。

实际操作：进入 Gravity 模型、开启力/速度/轨迹、播放后暂停、拖动恒星质量至 2.0、Reset All；进入 My Solar System 的 Lab 并展开 More Data。静态 HTML 成功获取，但运行 UI 为生成的绘图界面，DOM 快照未提供可用控件树；以下主要按真实截图与操作记录，不伪造 CSS 字体/圆角。没有确认独立浅色主题。

![暂停后保留位置、向量和轨迹](images/phet-gravity-orbit-paused.jpg)
![暂停中改变质量，力箭头同步改变](images/phet-gravity-mass-change.jpg)
![Lab 展开 More Data](images/phet-solar-more-data.jpg)
![竖屏整体缩放的限制](images/phet-gravity-mobile-portrait.jpg)

## Visual Theme & Atmosphere

画面是一张直接可操作的实验台：天体、向量和路径是主角，解释主要由操作与表示承担。Gravity 用 Model / To Scale 区分观察表示，My Solar System 用 Intro / Lab 区分复杂度；后者首次点击未选中的 Lab 先突出入口，再点击进入，本次没有把这两步合并成一次成功。

关键特征：主体与控制相邻、显式显示图层、向量附着对象、累计路径、暂停观察、简单/复杂实验分层、数据按需展开。

## Color Palette & Roles

| 视觉角色 | 观察来源 | 含义 |
| --- | --- | --- |
| 黑底、浅色控制文字 | 两个仿真实际截图 | 场景后退，操作可读 |
| 蓝色力箭头、绿色速度箭头 | Gravity 图层标签及场内箭头 | 每种量有一致编码，图例和位置共同解释 |
| 不同颜色的天体与数据行标识 | My Solar System | 参数行与对象对应 |
| 醒目播放和重置 | 实际截图 | 运行控制区别于参数 |

未读取到这些绘图对象的可信 CSS 色值，不给出 Hex；也不将其视觉配色指定为 Lab 标准。

## Typography Rules

字体家族与完整字号未核实。场景 UI 与网页 DOM 字号不是同一回事，不能用 body 默认值替代。

| 角色 | 观察到的层级 |
| --- | --- |
| Display / H1 | 首页仿真名；进入后转为底部产品名 |
| H2 / H3 | 质量、显示选项等分组，不建立长文章标题层级 |
| Body | 控件使用直接词语；数量带单位 |
| Small / Mono | 未确认字体或 token；不据截图猜造 |

字号让位于实验任务；竖屏等比缩放后文字可读性明显下降，不能把桌面字大理解为移动端已经达标。

## Component Stylings

Gravity 右侧上组是系统构型、Gravity on/off 与显示图层，下组是质量。显示层和物理参数有清楚分组。底部是速度档、播放/暂停、返回起点、单步、时间和 Clear；Reset All 另处放置。

My Solar System 把构型选择、运行控制、显示/测量工具分组，底部数据区默认显示质量，More Data 才显示位置及速度分量。[默认 Lab](images/phet-solar-lab.jpg)与展开图对照可见：高级披露改变数据密度，没有移除场内速度箭头。输入框、步进和滑杆提供多种数值操作，但本次未全面验证键盘操作。

## Layout Principles

Gravity 桌面大致以四分之三宽度给场景、四分之一给控制，下方留运行带；My Solar System 的数据面板另占左下区域。这是近似的视觉空间估计，不是提取出的 CSS 栅格。

模型主体周围留空，让箭头与整段路径能展开。信息少时不会用装饰卡片填满空白；但物体尺寸仍可能很小，需缩放或表示选择。完整 spacing / radius / elevation 数字没有来源，不填写。

## Depth & Elevation

浅边界和控制底面将“可操作区域”分出来，主场景维持平坦。图层本身不另起一张卡片，而直接画到对象上；空间靠位置、方向和轨迹解释。此处最重要的层级是因果关系，不是阴影强弱。

## Interaction & Motion

1. 默认暂停时开启 Force、Velocity、Path，当前向量直接附在对象上。
2. 实际启动播放再暂停，读数到 428 Earth Days；位置、向量和累计路径保留。[起点向量图](images/phet-gravity-vectors-paused.jpg)与暂停图能核对状态变化，不能证明整个过程流畅。
3. 暂停后把 Star Mass 从 1.0 拖到 2.0，太阳示意尺寸和蓝色力箭头立即增大，绿色速度与旧路径仍保留。旧路径不是新条件重新计算的预测；这对 Lab 是必须明确的区别。
4. 实际 Reset All 恢复时间 0、默认质量和关闭的图层，见[复位证据](images/phet-gravity-reset-all.jpg)。本次未单独执行 Clear、返回起点、单步或 Gravity off，不能替其行为作保证。

hover/focus、精确动画 easing 未取得。适合 Lab：条件和结果在同一画面；暂停便于解读；历史轨迹帮助追踪。不得因此给原模型新增质量调节、N 体求解或新的预测轨道。

## Responsive Behavior

Gravity 在 390×844 时基本保留横向实验的相对位置，主体操作区约只用中间四分之一至三分之一高度，文字和触控目标极小；844×390 [横屏](images/phet-gravity-mobile-landscape.jpg)明显更利用空间。这是视口模拟，未验证实体触控或全部屏幕。

没有可信 CSS 断点或全站触控最小值。Lab 不宜复制整体等比缩小；应在竖屏中保留一个大主视图，把控制重新排列或逐层展开。My Solar System 的移动端未另测，不以 Gravity 的结果代替。

## Agent Prompt Guide

- 提示一：在既有日地月/轨道模型上，将主要输入、向量或参照和观察结果放在同一可见工作区，保持模型不变。
- 提示二：把显示图层、物理输入、运行控制分组；只有实际存在时间推进的模式才显示播放。
- 提示三：保留基础读数，完整数据按需展开；窄屏重新组织，避免等比缩小整张实验台。

迭代检查向量身份、参数即时反馈、历史轨迹身份、暂停保留和 Reset All 作用范围。适用的是实验交互原则；具体皮肤、儿童向图标比例和复杂 N 体实验能力不作为 Lab 的复制目标。
