---
version: alpha
name: AstronomyLab interactive observing atlas
description: 可亲手操作的天文观测图册。运行时CSS token拥有值，本文记录用途、科学图形变体和共享呈现所有者。
colors:
  background: "#f2f4f4"
  foreground: "#202c36"
  muted: "#566674"
  border: "#b8c3cb"
  primary: "#202c36"
  scene: "#070a0e"
  sceneSurface: "#18212b"
  sceneMuted: "#b7c6d1"
  sceneAction: "#cba66c"
  focus: "#285a80"
  error: "#962f2f"
typography:
  sans:
    fontFamily: "ALab Sans, Noto Sans SC, PingFang SC, Microsoft YaHei, Segoe UI Symbol, Cambria Math, sans-serif"
    fontSize: "16px"
    lineHeight: "1.7"
  numeric:
    fontFamily: "IBM Plex Mono, ALab Sans, Noto Sans SC, Segoe UI Symbol, Cambria Math, monospace"
rounded:
  control: "4px"
  layer: "8px"
omitted:
  - section: spacing
    reason: 主体和必要参照决定各模式构图，间距由专属布局拥有；共享呈现只统一控件目标和文字尺度。
  - section: components
    reason: 下面Canonical UI Map记录原生控件与薄呈现文件的所有权，不引入框架组件库。
---

# AstronomyLab 交互观测图册

## Overview

2026-10-19 用户明确授权完整前端重构，并要求直接完成11工具43模式。当前任务以第二前端包及用户最新指令为依据：首页、月相、采样、FIRAS先行，HR和真实成像核查异质性，再按完整模式矩阵推广。原来的局部视觉冻结、只移动DOM、禁止新字体/共享呈现、共享绘图样式不得改等限制由本次授权覆盖。历史批准与证据保留在本文后半，不再限制本轮已经授权的呈现。已经删除的旧设计文档不恢复。

辨识度来自同一个对象随着操作显出关系：月面对应同刻照明几何，星像位置不变而像元尺度改变，光谱与残差用同一频率对应。首页采用黑场月面接明亮工具目录；工具是产品工作区，以可观察对象和第一反馈为先，保持准确的中文与安静的控制。科学主体承担视觉表现，不使用装饰星空、霓虹仪表盘、玻璃卡片或虚构播放。

2026-10-28 用户在最新前端完成后授权增加银河与 M33、宇宙膨胀、地月潮汐和行星环境。原 11 工具 43 模式的 ID、入口、模型与控件继续保留；首批新增后为 15 工具 53 模式。2026-10-30 继续补充阴阳合历、图像校准与测光、恒星内部及超新星光变的 9 个模式，当前为 19 工具 62 模式。新增内容在原站点运行，复用本文件约定的呈现和状态所有者。

本批四组的主体分别为太阳年与朔望月时间轴、同一标尺下的像元与孔径、恒星受力与能量曲线、衰变供能与逃逸光度。paper 表面、原生 range/select/checkbox、模式导航、披露、精确参数与历史恢复均沿用既有所有者。历表日期与合成 CCD 身份明确保留；推导、模型条件和来源在原生披露中。320px 图形按可用宽度重排或统一缩放同组矢量，不裁掉刻度、单位或力箭头。

讲义与实验对应属于外置阅读资产：`course/experiments.json`拥有18篇与实验的关系，`tools/export-experiment-map.mjs`验证现存章节标题和工具注册后生成可折叠的阅读页。阅读页沿用`article-reading.css`与原生details/form；按需展开每篇入口，file模式可设置实验室地址，HTTP模式使用当前服务。运行包不载入课程映射、不增加课程依赖。

第一科学包的模型、独立数值预算、精确状态、像元积分、共享角坐标、速度参考系与FIRAS产品验证继续有效。图形美化允许改变镜头、笔触和构图，不改变物理量、轴方向、数据身份、许可结论或发布权限。工程、独立视觉审查、科学核查、真人使用和实体设备分别记录。

## Colors

唯一运行时值源是 `web/observatory/shared/presentation-tokens.css`。采用runtime canonical的Model B：该文件→CSS语义变量→原生呈现及`getGraphicStyle()`→Canvas/SVG；本文frontmatter镜像已经接受的值与用途。不能在模块复制另一套界面palette。

2026-10-30 用户授权全站白天/黑夜切换，并明确保留首页黑场月面与明亮目录的对比配色。`shared/theme.js`在三个文档的样式之前读取`astronomy-lab-theme`；未选择时跟随系统，手动选择后以用户选择为准。工具和公共来源页面的`data-al-theme-scope="tools"`消费全局`light/dark`语义色；首页`home`保持原配色与布局，不增加主题按钮。刷新、跨工具、历史返回与同源标签页都保留选择，主题不进入科学状态或URL。

`data-al-surface="paper/scene/image/hr"`继续表达任务表面及历史默认值；工具内的普通界面与曲线现由全局主题决定明暗。`data-al-theme-fixed="dark/light"`只标记需要保留自身底色的科学画布及其必要叠加内容，例如照片、星色图和空间沙盘；不可用它锁住整个工具页面。M33速度场仅圆盘与色标底层保留浅底，外围留白与坐标随主题。照片RGB、星体颜色、科学色标和物理参数保持，不用CSS滤镜反色。浅色正文深墨、深色正文浅灰；金色操作强调只用于深底。

普通图表系列使用共同的主题色：`series-gold`白天`#875d18`/黑夜`#ebc77e`，`series-teal`为`#246574`/`#71c8c7`，`series-blue`为`#426a92`/`#8baaca`，`series-green`为`#23734b`/`#82c3a0`，`series-warm`为`#ad4a38`/`#ef9e88`，`series-purple`为`#765792`/`#a796d0`。值只在`presentation-tokens.css`拥有；getGraphicStyle返回对应字段给Canvas，SVG与图例消费相同变量。系列保留色相和身份，通过深浅适配底色；真实科学颜色不走这些主题系列。

必要控件边界使用`--al-control-border`（paper `#6b7c89`、深底 `#758a9b`），与图网格/分隔线`--al-line`分开，不能通过提亮全部网格来补控件可辨识度。

## Typography

标题和正文使用Noto Sans SC派生的ALab Sans 400–600可变字体；数值与单位使用IBM Plex Mono 400。首页问题约34–72px，工具标题24–30px，正文16px，主控15px，必要刻度桌面14px、窄屏13px，主读数26px。投影可按现场任务调整，不将浏览器放大当现场验收。

`shared/fonts/font-faces.css`由`tools/build-presentation-fonts.py`生成：主页/导航字汇核心与扩展字汇采用不重叠unicode-range，同一家族按实际字符加载。首页仅预载核心字汇一次。源17.7MB字库仅在本机build/qa维护，不进入运行包。两份完整OFL随字体保留，来源、变换、字符与SHA在`shared/fonts/FONT_MANIFEST.json`。新增中文后运行生成器及`--check`；不支持的少量科学符号使用可靠系统回退，不假称字体覆盖全部Unicode。

Canvas/SVG从`getGraphicStyle(element)`读取font字符串、字号与笔触；`observeGraphicFonts(element, redraw)`在字体ready/loadingdone后合并到一帧重画，返回dispose。模块顶层呈现owner负责重画完整图层并在卸载时清理。共享plot仅调用显式`onFontReady`完整回调，默认不会回放局部底图。字体失败仍以系统中文和数学字体显示，不能用空白等待代替内容。

## Layout

主体/第一操作/当前结果/必要参照构成一个观察单元。月相保留大圆盘与可主动比较的同刻几何，采样共用天空窗口，FIRAS主谱和残差同横轴，HR保留左热右冷与双对数。各模式拥有专属构图，不能机械复制多栏模板。手机重新组织比较关系，控制条占真实布局空间并计入safe area；200%可自然重排，不能用整页overflow隐藏功能。

## Elevation & Depth

图像与科学图版无卡片大外壳。边界只区分任务职责；浮层仅在菜单/dialog中使用轻阴影并保持焦点可见。真实光照和星色属于科学主体，界面不叠加改变读图的装饰光晕。

## Shapes

参数/按钮4px、浮层8px圆角。天体、点和range手柄可为圆形。主触控目标44px是本项目舒适目标，不等同于WCAG AA的24px条款；原生range/键盘与非拖动等效操作保留。

## Components

| 能力 | Canonical owner | 契约与变体 | 验证 |
| --- | --- | --- | --- |
| Token与字体 | `shared/presentation-tokens.css`、`shared/fonts/font-faces.css` | paper/scene/image/hr；字体核心/扩展按字加载 | computed值、字体网络字节、缺字/失败回退 |
| 白天/黑夜与选择记忆 | `shared/theme.js`、`shared/theme-control.js` | 原生按钮接入共享导航；localStorage显式选择优先，首次跟随系统；首页固定配色；科学画布局部fixed | 双主题全模式、键盘/触屏、刷新/历史/跨标签页、存储拒绝、首页基线与原图像素 |
| 全局/紧凑工作区导航 | `shared/navigation.js`、`navigation.css`、共享presentation CSS | 原路由、四主题15工具、原生details、Escape归summary；`mountWorkspaceNavigation`为单一紧凑变体 | 键盘、窄屏展开/关闭、历史导航、只有一个活动导航owner |
| 路由初始呈现 | `shared/route-presentation.js`、共享presentation CSS | 小型同步声明仅登记已迁移模式；app消费同一resolve/apply/clear；声明默认与ID以测试对registry校验 | 直接URL/未知mode/经典入口/前进后退/来源页与错误退出；真实FCP/LCP/CLS |
| 工具header与模式选择 | `app.js`的`.tool-heading`、原模块mode按钮 | `.al-mode-nav`只管文字选择组呈现，不复制mode事件 | mode ID/URL与实际选择一致 |
| 参数与选项 | `shared/core-controls.js`及原模块事件 | `.al-parameter`、原生range/select/number；`.al-button/.al-action` | 步长、上下界、可信拖动与键盘 |
| 披露与dialog | 原生details/dialog、原模块交互owner | `.al-disclosure`只视觉；保留关闭/焦点/展开状态 | Tab/Escape/焦点归还与遮挡 |
| 加载/失败 | 原模块实际数据状态、共享CSS | `.al-status/.al-error`、原status/alert与重试入口，不另建toast框架 | pending/error/empty/恢复路径 |
| 科学绘图呈现 | `shared/plot.js`及`shared/presentation.js` | computed字体/字号/线宽；显式ticks/dash/connect/margins/bounds；模块保留数据/域/轴向/图例身份 | 科学oracle、同轴、逆温与双log、字体后重绘 |
| 科学状态与历史 | 原模块getState/applyState、`shared/experiment-state.js` | 第一包精确model为权威，UI展开和渲染状态分离 | capture/刷新/前进后退与坏快照 |
| Scrollbar/焦点/减少动效 | `shared/presentation.css`及tokens | 全document滚动条；focus-visible；reduced-motion只关非必要位移 | computed/键盘/高对比/真实偏好 |

公共呈现入口`/shared/presentation.css`在原全局样式之后加载；各文档body使用`al-app`。`applyPresentation(root,{surface,redraw})`设置视觉scope并登记字体/主题重绘，返回dispose并归还原属性。`al-theme-change`复用同一合帧回调重画完整图层；回调只重绘，不能重建相机、复位模型或重新抽取随机样本。它不保存科学值、不创建时钟、不接管路由。`plot()`保留`width/height/toPixel`，额外返回`bounds/style/xTicks/yTicks`，支持显式刻度及离散点/虚线；两幅图使用相同margins即可保持同轴。

`mountWorkspaceNavigation(container,{modeNav,actions,source,label})`移动原生模式/动作/来源节点而不复制事件，品牌返回由shared navigation生成；临时隐藏全局nav与工具heading并在dispose后原位归还，移动时保留可见焦点。手机两行和桌面一行是同一业务紧凑变体，各模式不再自造平行header。`bindDisclosures(root)`关闭当前最近披露并归还summary，range内Escape可关闭所在披露；文本/日期等编辑器、select和原生dialog保留自身Escape处理。旧editorial CSS只在`editorial-legacy`标记下生效，呈现owner进入即退出旧层，离开可归还；`applyEditorial`不再重排已接新owner的工作区。迁移时同时退役旧hide和重复header。

`route-presentation.js`在初始解析时确定已迁移路由的真实workspace/surface；加载状态保持可见，不隐藏整页或阻塞模块依赖来改进指标。其`loadStyles(href)`按同一声明等待实际CSS依赖ready再mount，按URL去重，load/error及有界超时均结算；路由owner在await后检查取消状态，旧页面不能迟到挂载。主体、mount使用明确格式上下文，首子标题外边距不穿透到body。workspace的app几何由共享层拥有，专属内边距只放模块shell；退出、来源页和错误恢复标准外壳。`applyPresentation`同步并归还`#lab-mount`表面，壳外必要科学说明使用同一语义文字颜色。

日地月与太阳系独立入口同样消费共享字体、表面和紧凑导航。太阳系专属构图由`web/solar-system/style.css`拥有，原生模式/资料节点由`shared/tool-start.js`接入公共导航；沙盘材质、近似位置、相机能力、固定正交半径、JPL指标与轴向投影继续由原科学owner拥有。

日地月四模式统一由`web/earth-moon/phase-ui.js/.css`拥有呈现，退役旧spin/period/eclipse六份适配文件；原app/physics/scene-state继续拥有模型与时钟。月盘、真实太阳mesh及四条方向箭头保持完整；双周期共用真实二维周期关系，食的太阳或月面、同刻空间和影锥组成科学观察单元，局部小时与模型日分别具名。320px和低高度可自然重排，不能只量总外框而省略任何当前应展示子图、单位或控制。

行星对齐三模式统一由`modules/alignments-atlas-ui.js/.css`拥有呈现，退役旧三个adapter及pilot样式七文件。金星相位与轨道、火星轨道与方向曲线、凌星遮挡与光变各有专属同步构图；`x/R★`指投影位置，扫描速率不冒充观测时间。原来源节点进入可达资料披露，compact导航和事件均只有一个owner。精确day仅由版本化mode/day模型契约保存；sky倾角、银河方向及observing固定样本seed各按自身科学契约保存，旧无model快照保留实际量化值，不由预设名称猜回科学状态。

活动`applyPresentation`注册统一拥有body/html表面；隐藏的预创建adapter不决定全局表面。注册以独立token分层，旧owner的异步dispose不能覆盖较新owner，嵌套root/mount按剩余层归还；没有活动owner时读取当前路由声明，URL仍由原路由owner拥有。

在plot之后追加误差条/选点等图层的模块，通过根呈现owner的`redraw`重画完整图层；或提供`onFontReady`完整回调。`onFontReady:false`可明确表示归根owner管理。共享plot绝不默认自行回放底图，避免擦掉科学标记。

新增四组采用 paper 图版。M33 的周光关系、倾斜速度场和旋转曲线分别决定构图；宇宙膨胀用同一尺度的星系间距、光波与距离曲线；潮汐将形变和力矩与同刻曲线相连；行星环境以能流宽度和速率分布表示关系。界面保留单位、数据身份和必要图例，推导与条件收进原生披露。每个工作区保留一个可见 h1，含 output 的 range 标签通过 for/id 明确关联输入，点击文字与键盘操作一致。

四组模式与状态均接入 `tool-registry.js`、`mode-entry.js` 和 `experiment-state.js`。非动画参数由原生控件回放；潮汐使用版本化 `tidal-evolution` 模型保存两模式参数及精确时间，恢复时暂停。所有模式的参数节点保持在 DOM，隐藏只影响呈现。绘图仍使用既有 token 与字体，不建立第二套控件或配色。四个新工具只有这一套工作区呈现，沿旧链接携带 `ui=classic` 时也加载其必要样式；原 43 模式的 classic 分支不变。FIRAS 的窄屏 info 以频率标签左缘定位，沿用共享披露行为。

## Do's and Don'ts

2026-10-28 起，界面文案遵循根目录 AGENTS.md 的“前端信息层级与文案原则”。短操作提示复用原生 details/summary 与共享 `bindDisclosures`：`.al-info-tip` 提供具名info入口与浮层，点击/键盘展开，Escape收起并归焦；长观察建议进入已有资料披露。同日四组新增工具整合时已验证键盘、触屏、窄屏边界与邻接模式恢复，并修复 FIRAS 浮层越界；实测范围与证据见主交接顶部。

界面只放观察对象、操作、现象、单位、数据身份、必要科学条件和来源。开发备注、版本/验收进度、自证或防御性解释只进内部交接，不展示给学习者。加载失败说明当前状态和恢复办法；不把未加载数据藏在一条漂亮理论曲线后。

不重建框架、不复制模型状态、不在模块复制字体和界面色常量、不补造观测点、不改精确预设或科学容差。替换局部适配器时同时移除被替代的布局覆盖；历史源码和证据已有可逆备份，不能靠无限append叠加新风格。

本轮视觉、字体和共享绘图变化是用户新授权，科学状态与数据继续按第一包验证。不得将旧182项成绩当新前端结果，不将模拟手机、AI设计审稿或软件WebGL当实体设备、真人理解或硬件验收。当前任务未授权提交、推送或部署。

## 历史批准与迁移记录（2026-10-19整体重构之前）

以下保留当时的批准、候选与限制原文，仅作历史证据；其中旧视觉冻结和已删除文档链接不再作为本轮实施入口。当前范围、值源与owner以上文为准。

稳定执行规范为 [AstronomyLab UI Design System / Design Direction v1](ASTRONOMYLAB-UI-DESIGN-DIRECTION.md)。全局规则在其 D01–D14，类型规则为 S（空间动态）、I（二维图像）、R（二维坐标）；后续 Codex 先读该文件，再按明确授权选具体页面。本索引保留批准样板的所有者和现有数值，不产生第二套全局 token。

三个异质样板已经全部人工批准：`earth-moon/phase`、`imaging/real` 与 `imaging/teaching`、`stars/hr`。其他模式不因此自动批准或改造。下列 frontmatter 颜色是既有月相记录，不是全站 palette。

## 面向使用者的文案

2026-10-17 用户要求全站按成品整理文案。界面只呈现观察对象、操作、结果以及读图所需的单位、比例和数据身份。模型假设用简洁、直接的陈述说明；详细计算方法与署名放在已有的说明和来源入口。

开发版本、适配与验收进度、核验过程和实现保全记录只写入维护文档。避免以“没有冒充”“未用替代”“本轮实际查阅”等自证措辞打断使用。加载和故障提示说明当前状态与恢复办法。科学纠误、缺测、合成数据身份、太阳观测防护及素材署名继续清楚呈现。

文案由各模块、局部 UI 适配器与 `shared/mode-context.js` 的现有文本节点拥有；本次不改变布局、控件、token、科学计算与场景恢复。

## 第一个已人工批准的样板：日地月

`earth-moon / phase` 的正式页面采用 B-reduced；自转、两种周期、日月食和其余工具维持 R1。2026-10-06 用户人工检查正式页面并确认与已通过 prototype 一致，这是第一个已人工批准、冻结的 UI 样板。设计依据是 [Design Grammar](ASTRONOMYLAB-DESIGN-GRAMMAR.md) 和用户验收的真实 prototype revision-1，不再探索其他视觉方向。Imaging 为第二个已人工批准、冻结的样板，现已按用户明确授权迁移正式页面；其批准规则记录于下文。

主体是大月面；空间关系是靠近对象的小视图，用户主动展开后才成为比较状态。条件是可关闭、可滚动的压缩 overlay；不得增加固定侧栏、KPI 卡片或额外常驻参数。展开条件不改变主月面的位置、尺度和标签锚点；比较与条件同时展开时，条件区与几何视图不重叠。太阳方向参照投影原场景的太阳方向标志，并保持边缘箭头可读，不表示太阳距离。

视觉 token 的唯一运行时所有者是 `web/earth-moon/phase-ui.css` 中 `body.reduced` 的 CSS 变量。背景、文字、弱文字、边界、强调和 overlay 颜色均复用已验收 prototype 的值；本文记录意图，不维护第二套数值。原 `style.css` 继续拥有其他三个模式的 token。

行为所有者仍是 `app.js` 与 `scene-state.js`：原参数、模式 ID、预设、时间、拖动、相机、配方和载入起点复位契约不变。`phase-ui.js` 只移动原 DOM 控件，并在切换或导入其他模式时归还节点。月相预设和模式选择各收成一个入口；显示、配方、来源和边界按需展开。模型时间不是日历日期；当前速率及复位目的地放在时间控制附近。时间轴保留键盘操作，按钮与 disclosure 保留可见焦点。

响应式继续沿用已验收方向：窄屏一个主月面，几何视图向下滚动；比较不能把两个视图挤成横向小卡片。功能回归包含 320/390 像素与等效 200% 缩放，无横向溢出。软件 WebGL 验证不能称为实体设备或真人科学审校。

2026-10-19 科学遮挡修复补充：手机固定时间条由 `phase-ui.js` 的 ResizeObserver 读取实际高度（含 safe-area），`phase-ui.css` 为文档保留对应空间。默认保留大月面与向下查看几何的方向；主动展开比较时采用紧凑上下布局，让月面反馈与完整关键几何共同可见。caption 随 views 组织，切换模式时归还原节点。原生控件、时间与科学状态所有者保持原契约。本条仅记录本次科学参照遮挡修复，不升级人工视觉批准、实体手机或教学验收身份。

迁移交付证据保存 `output/phase-ui-migration/`；批准冻结证据、运行包与哈希保存 `output/approved-moon-freeze/`、`build/qa/approved-moon-freeze/`；测试和失败记录写入主交接 `docs/LAB-REFACTOR-2026-10-05.md`。不部署、不推广其他模式。

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | 原生 select | index.html 的 speed 与 app.js | 操作系统 popup；保留原速率选项 | moon-refactor-browser / 原生选择与实时速率 |
| Scrollbar | 浏览器原生滚动 | phase-ui.css | 条件 overlay 独立滚动、窄屏文档滚动 | 320/390/683 回归 |
| Date | 原生 input type=date | sky.js 的 shadowDate、sky-motion-physics.mjs 的日期映射 | 系统日期 popup，原min/max和input事件保留 | 测影原包/当前恢复停止证据，未修科学或状态owner |
| Modal/Drawer | 原 source-dialog 和 HTML Popover | index.html / phase-ui.js | 来源 modal；条件非 modal；模式与预设 auto | moon-phase-ui / Escape、焦点、双展开 |

## 第二个已人工批准的样板：Imaging

2026-10-06 用户批准真实 Imaging prototype。二维科学图像保持主体，显示主控靠近图像；真实取样才出现读数，条件、来源与边界按需展开，冻结/单通道比较随任务出现。教学曝光改变源计数；赋色与拉伸改变显示，原科学数据、模型、配方、状态恢复和原事件仍由 `web/observatory/modules/imaging.js` 及其原依赖拥有。不机械复用月相的布局，不推广到其他模式。

已有冻结参考时，原冻结按钮改为“更新参考”，可见辅助说明为“以当前结果替换左侧冻结参考”；初次进入比较仍为“冻结当前 · 比较”。手机高级参数的纵向滚动距离已被用户接受，维持清楚分组、显式关闭、Escape 和稳定的原生滚动，不通过增加密度或重排压缩次级路径。

正式展示结构与 token 的唯一运行时所有者为 `web/observatory/modules/imaging-ui.js` / `imaging-ui.css`；`imaging-page.js` 包装原模块 mount/dispose，`app.js` 仅在 Imaging 入口选择该包装模块。CSS 与已批准快照逐字节相同；JS 仅更换正式 CSS 地址并移除“隔离样板 · 已批准”环境标识。原生 select、range、details、dialog 及行为所有者表见冻结 adapter 的 `BRIEF.md`，与下列正式对应表。冻结证据在 `output/approved-imaging-freeze/`，哈希清单在 `build/qa/imaging-prototype/approved-freeze.json`；正式迁移证据在 `build/qa/imaging-migration/` 与 `output/imaging-ui-migration/`。不继续视觉设计。

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | 原生 select | imaging.js / imaging-state.mjs | 同一 DOM 移至主控与条件层；操作系统 popup | 原 Imaging 27项及冻结版一致性 |
| Scrollbar | 浏览器原生滚动 | imaging-ui.css 与原 focus dialog | 桌面条件层滚动；手机文档滚动 | 320/390 与比较+条件回归 |
| Modal/Drawer | 原生 dialog 与 details | imaging.js / imaging-ui.js | 原放大对照；非 modal 的条件与任务披露 | Escape、节点归还、焦点与一致性 |

## 视觉迭代的验收顺序

按 2026-10-06 用户调整后的流程，先由独立 `frontend-design-review` 实际审稿；仍有 P1/P2 结构性问题时，在既定方向内自主修复并复审，最多自主修改三轮。独立审稿通过、仅剩低优先级 polishing 后，才提交最终截图、完整操作录屏和结论供人工批准。无人回复不代表批准；三轮后仍有高优先级问题则停止报告，不自行换方向，不提前提交中间视觉稿。

## 第三个已人工批准的样板：HR

2026-10-06 用户指定 `stars/hr` 为最后一个样板，并明确授权直接迭代正式页面；未建隔离 prototype、未进入 Figma。第二轮独立通过后，用户明确人工批准，接受两项 P3，不再修改布局。现在冻结为第三个已人工批准样板。修改前 Git checkpoint 为 `refs/checkpoints/hr-ui-before-20261006`（`722db1a`），保全当前已跟踪和未忽略的未跟踪文件，原 HEAD 与暂存区不变；它是回退点，不是最终批准代码的 commit。批准版本由 `build/qa/approved-hr-freeze/freeze.json` 的源码、运行包与媒体哈希标识。

本轮目标是以二维坐标关系为主体：完整赫罗图、左热右冷、光度向上增加、两轴对数。对象身份与近点读数同步，完整解释按需展开；比较明确为固定太阳 A 与构造示例 B，隐藏与其无关的单对象选择器，退出时恢复原对象。模式、读图、来源和基线操作使用原生 details；单对象选择仍由原生 select 与原事件拥有。宽度不超过 1000px 时保留整图，将对象说明放在图下，不把图压成横向双栏；较宽桌面使用近点注释。来源长说明在工具行下方按需展开为可关闭、可滚动的短横区，位于图表外；它与对象长解释协调披露。

HR 的呈现只由 `stars-hr-ui.js/.css` 拥有，CSS 限定 `body.hr-observing` 与 HR 挂载节点；模式切换及卸载归还原 DOM 节点。数据、坐标变换、半径公式和固定 A/B 逻辑仍由未修改的 `stars-hr.mjs` / `stars-hr-renderer.js` 与 `stars.js` 原计算分支拥有。运行 token 取自原共享图表的背景、文字及 A/B 颜色，不增加共享 token 实现。第一轮证据保留 `build/qa/hr-ui/` 与 `output/hr-ui-round1/`。第二轮在原方向内修复遮挡和脱锚：注释避让点位、区域名称与 A/B 连接，原生披露布局稳定后重新测量并更新连线端点；不改变科学绘图坐标。原第二轮证据保留 `build/qa/hr-ui/round2/` 与 `output/hr-ui-round2-candidate/`，批准后源码/截图/录屏快照保存 `output/approved-hr-freeze/`，测试及审稿副本保存 `build/qa/approved-hr-freeze/evidence/`。未重录或修改已批准媒体。

第二轮独立最终审稿已通过，P1=0、P2=0。用户明确接受两项 P3：窄屏同光度比较的 B 与主序区域名称偏近；600px 高度桌面展开来源后完整横轴底部需要少量滚动，当前 A/B 关系仍可见。停止视觉修改，保留当前方向；人工批准及冻结不代表发布或推广授权。设计规则第一版只维护文档，不批量实现组件或修改其他模式。

## 首批连续谱：已人工批准

2026-10-07 用户只授权 `light/thermal`，按 R 类直接迭代正式页面，未制作 prototype、未进入 Figma。修改前 checkpoint 为 `refs/checkpoints/thermal-ui-before-20261007`（`e58403f9`）；HEAD 与原暂存区未变。三个已批准样板仍是执行依据，2026-10-07 用户人工批准本页，接受唯一P3，停止微调。后续本批三个模式仅在各自critic通过后等待批次人工批准；本页批准不自动批准它们。

谱线是完整二维坐标主体，原有效温度 range 紧贴图下。峰点与波长竖线使用原 plot 返回的变换，λmax 数值位于图头，避免遮挡当前、基线或固定参考曲线。默认仅温度为主要输入；半径与光度、温度预设、显示条件、基线对照分别按需展开，原长说明与来源位于图外。半径与整星 L 保留一行身份，明确半径不改变单位表面 Bλ；图头及原纵轴区分绝对谱和峰值归一，归一只消去显示幅度。原自动纵轴范围与100–2000nm图窗含义可见，不把局部曲线面积称为整星光度。

呈现与本模式 token 唯一由 `web/observatory/modules/light-thermal-ui.js/.css` 拥有，作用域限制为 `thermal-active` / `thermal-observing`；颜色继承原 plot 的背景及曲线身份，不生成共享 palette。原 `light.js` 保留科学计算、参数、预设、基线、复位和委托事件；原 `shared/plot.js`、`light-physics.mjs`、恢复与共享 focus 均不改。切换到另外三个 light 模式及卸载时归还原节点和样式。原生 details / range / 浏览器文档滚动及原 dialog 是 canonical owners，没有新自定义选择器或侧栏。显式关闭条件、比较或 Escape 后，若图头已卷出视口则回到观察位置，参数保持。

本页不套用 HR 的点选对象、固定太阳A/B或近点资料结构。窄屏保留完整坐标，图头读数允许换行，条件纵向展开；低高度高级操作允许滚动。首轮标注遮挡失败、第二轮修复与专项/兼容验证保存 `build/qa/thermal-ui/`；候选原图和完整录屏保存 `output/thermal-ui-round2/`。最终审稿与测试结论以 `build/qa/thermal-ui/round2/verification.json` 及独立审稿为准，测试通过不代表人工批准、发布或实体设备验收。

## 第一批剩余模式：critic通过，等待批次人工批准

**后续人工决定（2026-10-07，覆盖本节历史待批准状态）：用户已明确批准motion、sampling、venus，接受各一项P3，停止微调。** 冻结清单 `build/qa/approved-ui-batch1-freeze/freeze.json`，原源码/最终媒体快照 `output/approved-ui-batch1-freeze/`；不重新设计。用户随后授权分类表第2–6批，新增候选只在独立critic通过后等待批次人工批准，不加入批准样板或更改Direction。

2026-10-07 用户授权按 `light/motion` → `optics/sampling` → `alignments/venus` 顺序直接正式迭代。motion第三轮、sampling第二轮、venus第二轮各独立Pass，P1=0/P2=0，各保留1项P3，停止视觉修改。它们尚未人工批准，不能加入上方三个批准样板或推广第二批。具体checkpoint、测试、原图与完整录屏由 `build/qa/ui-batch1/final/verification.json` 和主交接标识；严格保留原科学/状态/共享渲染契约。

| 模式与类型 | 唯一局部呈现所有者 | 当前主体与披露规则 | 保留的P3（待人工验收） |
|---|---|---|---|
| light/motion · R | light-motion-ui.js/.css | 整幅谱线和vr/veq主控；倾角/线型、预设、基线、来源按需；共享focus打开时Escape交原dialog | 手机/低高度高级路径自然滚动暂时卷出谱线，关闭回观察 |
| optics/sampling · I | optics-sampling-ui.js/.css | 必要连续像与积分像保持各自天空角尺度；窄屏纵排；相机/目镜原控件近图，剖面与完整条件按需；原dialog准确称“单图观察” | 两处原ARIA组名仍含旧“放大”措辞，dialog标题及操作职责正确 |
| alignments/venus · S | alignments-venus-ui.js/.css | 大相位、近旁必要轨道参照，时间近相位；几何条件与k关系图近轨道按需；原模型日数、速率、72天复位与教学放大可见 | 600高桌面读完整k曲线需滚动，关闭返回观察 |

三种局部token分别沿用原曲线身份、科学图像与原场景关系，不升级为共享palette；作用域body类和节点由adapter挂载/卸载、跨模式归还。业务计算与事件仍由原light.js/optics.js/alignments.js拥有，models/shared plot/scene/focus/history不改。原生控件和详情/模态所有者表如下，避免新增自定义选择器、侧栏、永久指标卡或伪造放大。

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Range | 原生select/range和原事件 | 三个原模块及原controls帮助器 | 同一DOM移近任务主体/按需条件，值域/科学输入不变 | 各13专项、critic原生键盘/指针 |
| Scrollbar | 浏览器原生滚动 | 三个局部CSS、原focus dialog | 图外高级路径自然滚动，关闭回观察且不改参数 | 320/390/低高度、组合输入与焦点 |
| Modal/Drawer | 原生details及原dialog | 三个局部adapter、原共享focus | 条件/比较/资料非modal；focus由原dialog cancel与DOM归还拥有 | 一次Escape、显式返回、再进入、history及兄弟模式 |

## 第2–6批授权内的局部候选

测影原日期能力的所有者已经核对，保持原生日期输入；日内/年内恢复异常另记停止项，不以UI改动修复公共状态所有者。

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Date | 原生 input type=date | sky.js 的 shadowDate；sky-motion-physics.mjs 原2026日期映射 | 系统原生日期 popup，原min/max及input事件不改 | sky-measure/round1 原包与候选日期/恢复复现；年内恢复已停止单列 |

只按分类表18模式顺序执行，不进入第7批/太阳系，不建立统一骨架/共享组件。各局部运行时token继承其原科学曲线/图像/几何职责，不成为全站palette；原生select/range/details/dialog/滚动以及原pointer/keyboard仍为canonical owners。科学与恢复所有者不迁移。以下候选未人工批准，完整checkpoint/审稿/截图视频/测试由 `build/qa/ui-batches2-6/` 标识；历史第一批现已人工批准的决定见上。
| 模式 | 局部呈现所有者 | 本任务结构与特殊契约 | 当前状态 |
|---|---|---|---|
| light/magnitude · R | light-magnitude-ui.js/.css | 绝对接收谱、S/L教学通带与距离主控；源/尘埃近曲线按需；原y自动包含保存基线，未归一；native focus核心条件同屏，原dialog Escape归原owner | 第二轮critic通过，等待批次人工批准；1 P3 |
| measure/shadow · R | measure-shadow-ui.js/.css | 原SVG量影长/CTM/公里marker为直接操作，原三角形近推断；原敏感度曲线可见，与alpha对齐；记下的是读数，非冻结图/曲线；不量LRO图版像素 | 第二轮critic通过，等待批次人工批准；P3=0 |
| measure/distance · R | measure-distance-ui.js/.css | 视差完整曲线与当前p/d/σ为默认主体；共同尺度传播按需且与p图独立，原亮度模数条件近读数；对照记读数字符串，原science/native/history不变 | 第二轮critic通过，等待批次人工批准；P3=0 |
| sky/calendar · R | sky-calendar-ui.js/.css | 累计差完整图、native日期规则、原年序时钟；restart保留规则归0/fullreset公历归0清对照，原nested tab/task/capture恢复所有者保持，纯2D | 首轮critic通过，等待批次人工批准；1 P3 |
| light/observing · R | light-observing-ui.js/.css | 完整总曝光—孔径SNR图和曝光/背景原主控；原固定seed剖面按任务展开，替换样本靠近原像素剖面；大气/信号/分帧和baseline按需；原计数/随机/restore/focus owner不迁移 | 第二轮critic通过，等待批次人工批准；P3=0 |
| optics/resolution · I | optics-resolution-ui.js/.css | 原双星连续PSF大主体；aperture/seeing近图，原relativeLight和形状读数分清；原积分比较/剖面/条件任务按需，原grid/gray归一/各角宽与focus恢复保留，不改sampling呈现 | 第二轮critic通过，等待批次人工批准；P3=1 |
| stars/ia · R | stars-ia-ui.js/.css | 峰值关系图与原校正主控近邻；原合成光变按任务切换，七样本身份一致，原view/snapshot/baseline/focus owner、轴方向与ε残差保留；approved HR精确一致12通过 | 第三轮critic通过，等待批次人工批准；P3=1 |
| earth-moon/spin · S | spin-ui.js/.css | 原空间轨道、固定金点和地心虚线为主体；原地心月面作小必要参照，自转二选/原时钟靠近观察；原physics/scene-state/phase UI均保留，mode前同步释放DOM；条件用图外既有空白，空间不足自然流，不改变canvas；原生控件与原pointer为唯一所有者 | 第二轮critic通过，等待批次人工批准；P3=1 |
| earth-moon/period · S | period-ui.js/.css | 完整原二维日心/地心方向图，原顺次端点播放及暂停近关系；同刻月面参照主动开关；时钟/载入起点/原两进度具名，跳点/原视角/完整资料按需；app/physics/drawAnnual/phase/spin不变 | 首轮critic通过，等待批次人工批准；P3=1 |
| sky/day · S | sky-day-ui.js/.css | 同一地面标记、远星及太阳主体先行，原时钟及×40辅助差角近图；端点/视角/原读数对照/完整边界按需；恒星日自动停、约236秒继续、原restart/fullreset区分；所有sky科学body和共享renderer保留 | 首轮critic通过，等待批次人工批准；P3=1 |
| sky/sky · S | sky-sky-ui.js/.css | 纬度近完整方向球，分至/视角具当前身份；小屏原点投影标注，非默认条件摘要；原真太阳时/参照/三读数对照与状态所有者保留 | 第二轮critic通过，等待批次人工批准；P3=1 |
| sky/precession · S | sky-precession-ui.js/.css | 完整原轴/天赤道与固定黄道先行，原时代与运动类型近图；两种时钟分别压缩、原投影/读数对照/资料按需；共享模型renderer和状态保持 | 首轮critic通过，等待批次人工批准；P3=1 |
| orbits/transfer · S | orbits-transfer-ui.js/.css | 原两点同经过时间、当前第二点火开关近图；原height/target/完整Δv曲线/文本记读数对照按需；原瞬时Hohmann与12实秒时钟、四mode owners保持 | 首轮critic通过，等待批次人工批准；P3=1 |

停止项保持原正式UI，不能计入critic通过：sky/measure原年内/日内公开选择恢复异常；sky/stars原progress与motion回放不一致；orbits/orbit原临界速度快照按步长取整改变分类；measure/jupiter原10%预设取整改变质量；measure/s2候选首次窄屏返回distance画布内部尺寸回归，已撤回唯一接入。前三个已有候选者及S2的失败包/媒体保留，所有科学/公共状态所有者不修。证据见主交接与本轮总索引。

## Mixed 已批准局部参考：optics/imaging

用户已人工批准并冻结。接收面二维成像主体，近轴焦面示意为必要参照；完整光路、原参数与剖面按需，原科学与状态所有者保留。运行时局部所有者为 optics-imaging-ui.js/.css，继承原光学图像/光路身份，不成为全局模板。接受的P3：隐藏嵌套说明消耗首次Escape，显式关闭正常，不继续修改。冻结证据：build/qa/approved-optics-imaging-freeze/freeze.json，媒体与源码快照：output/approved-optics-imaging-freeze/。

## Mixed 已批准局部参考：alignments/mars

用户已人工批准并冻结。空间运动为主体，原地心黄经/黄纬方向图为必要参照，共享原模型日序；受光圆面按需。局部呈现所有者alignments-mars-ui.js/.css，原科学/时间/恢复所有者不变，不推广统一布局。已接受P3：低高度桌面时间控件需少量自然滚动，不继续修改。冻结证据build/qa/approved-alignments-mars-freeze/freeze.json，原图原片与源码快照output/approved-alignments-mars-freeze/。

## Mixed 已批准局部参考：alignments/transit

用户已人工批准并冻结。遮挡圆盘为主体，原共享位置参数光度曲线为必要参照；x/R★ 是位置，扫描不代表观测时间，均匀圆盘几何模型不包装为实测拟合。轨道与完整参数按需，原科学、恢复及共享渲染所有者不变。保留 P3：600px 高桌面边界说明少量自然滚动。证据 build/qa/approved-alignments-transit-freeze/freeze.json，源码和原图原片 output/approved-alignments-transit-freeze/。

## Mixed 局部候选：stars/pulsar

正式页面局部呈现，critic 通过后等待人工批准。灯塔几何为主体，同相位曲线必须保留；直接拖曲线走原 phase 控件，手机不把两个必要任务拆成互斥切换。参数、预设、原基线与资料按需；真实 P/频率与动画四秒一周显式分开，非实测模型边界保留原 DOM。局部标注投影原 sprite 世界位置，退出恢复原可见性；共享场景/曲线/focus 与 stars 模型、时钟、恢复所有者不改。证据 build/qa/stars-pulsar/INDEX.json；不外推统一布局，未人工批准。

## Mixed 已批准局部参考：stars/pulsar

用户已明确人工批准并冻结。空间双束与固定视线为主体，同一相位曲线为必要因果参照；物理周期与四秒一周的教学慢放分开。保留 P3：600px高桌面横轴与播放需少量自然滚动。冻结证据 build/qa/approved-stars-pulsar-freeze/freeze.json；源码和原图原片 output/approved-stars-pulsar-freeze/。

## 第8批局部参考：stars/evolution（授权自动冻结）

独立critic通过后按用户明确授权自动冻结，不标为人工批准。原MIST HR轨迹是主体，同一模型行内部组成/供能示意是必要参照；表面读数贴图、中央温度贴示意，初始质量与当前质量区分。EEP浏览为原32点/秒，不是等时间；模型年龄单列。图层、尺寸、颜色不当作径向定量/半径/温度；不插值1/3/15质量，不连接末端到坍缩或白矮星冷却。原质量/EEP/play/baseline/state owner与共享HR/内部renderer不改；阶段/基线/完整读数按需，手机保留两个观察并把EEP靠近HR。证据 build/qa/stars-evolution/INDEX.json；冻结 build/qa/auto-frozen-stars-evolution/freeze.json。仅本页授权，collapse/eclipse待授权，不外推统一模板。

## stars/collapse：两个独立任务（critic通过，等待人工批准）

2026-10-10，仅本模式实施。坍缩核心/包层/冲击的S任务与视界/潮汐的R任务按原collapseTask切换，各自独占主体，不是连续模拟。过程坐标非真实时间，黑洞质量独立指定，2m径向差异加速度只作尺度估计。原输入、mode ID、whole-mode基线与历史恢复继续由stars.js/shared experiment-state拥有；基线恢复可能切回保存的任务。解释、预设和对照渐进披露；对照沿用原共同对数纵轴，明确轴范围可变化而数值未归一。

局部呈现所有者 stars-collapse-ui.js/.css，不扩散布局。checkpoint f0473edddce4e27358f8a2c9538621c91aeb7a4a；证据 build/qa/stars-collapse/INDEX.json。第三轮完成原专注窗口的任务隔离与位置所有权修复，独立审稿0/0/1，保留旧切任务反馈文案P3，不继续布局微调；等待最终人工批准，不自动冻结为批准，不进入eclipse。

### stars/collapse 人工冻结（2026-10-10）

两个独立任务保持原 collapseTask 与恢复契约；第三轮 critic P1=0、P2=0，旧切换提示语 P3 已由用户接受。冻结索引：`build/qa/approved-stars-collapse-freeze/freeze.json`；不继续微调。

## earth-moon/eclipse：第8批授权内候选

局部Mixed观察工作区，运行时呈现仅由 `web/earth-moon/eclipse-ui.js/.css` 拥有，继承日地月原对象颜色和原生控件。太阳圆面或原地心方向月面为主体，原空间几何为小必要参照；原影锥仅在主动解释时出现。旧view ID仍恢复，呈现中同时保留观测与必要几何；条件、预设、相机/比例、配方与完整资料渐进披露。条件放在必要几何之后，通过一个原生参数选择器显示当前原range；完整参数与资料再展开，避免编辑时把观测结果滚走。手机展开条件时缩小主圆面，但保留观测、太阳方向与地月关系同屏；不以遮挡覆盖或静态缩略图解决。核心播放、局部小时、复位在观测圆面上方，影锥与资料的高度不推开核心操作。教学地面点跟随月下点、月面地心语义、显示比例/角尺度、局部小时/模型日/载入起点分别具名。原影锥维持1000px横向可滚与18px文字，不缩印为手机第三窗口。app.js唯一变更是太阳视场外状态文字由本页图外呈现，与角尺度分离，科学模型、原shader/阴影/观察者/恢复所有者不改。

Canonical owners为原生range/select/details/dialog与原app.js事件/状态、文档滚动；新adapter只移动同一DOM并跨模式归还。token沿用style.css，不升级全站palette。checkpoint `d15d492b5f0e80de91f9e585e92bb30c542d2f87`；第三轮独立critic P1=0、P2=0、P3=2，保留主动统一比例实体极小和紧凑手机几何标签局部贴近，不再微调。专项17/17、同一锁定版本完整回归182/182及原地月14/4/7项通过；第三轮证据 `build/qa/earth-moon-eclipse/round3/`、25图与25.92秒原片 `output/earth-moon-eclipse/round3/`。等待人工批准，不宣称人工冻结，不进入第9批。

### earth-moon/eclipse 人工冻结（2026-10-11）

用户在最终验收材料后指示冻结当前版本。第三轮critic P1=0/P2=0/P3=2，保留主动统一比例实体极小与紧凑手机几何标签局部贴近；不继续微调。证据 `build/qa/approved-earth-moon-eclipse-freeze/freeze.json`，源码、25图、原录屏和验收原字节快照 `output/approved-earth-moon-eclipse-freeze/`。历史verification保留当时等待批准状态，当前批准状态以freeze和INDEX为准。

## galaxy/cmb-spectrum：第9批单项授权候选

仅平均谱页按R类迭代，未授权另外两个Galaxy模式。原FIRAS 43行发布谱与2.725 K黑体参考是主体，同频率范围的原残差±1σ默认可见；频率原点选、键盘和range贴图，黑体读数明确不是FIRAS点读数。独立ΔT谱差、预设、完整公式/边界及嵌套模式按需，方向球面和指标区不常驻。FIRAS pending/失败/空表分别明示，真实谱到达前不显示模型替代。复位保持整个模块返回Galaxy，历史项恢复实际模式，URL入口不擅自改写。

唯一局部呈现所有者 `galaxy-cmb-spectrum-ui.js/.css`，原DOM移动后退出归还；原range/details/文档滚动和galaxy.js事件为canonical owners。局部token沿用原shared plot背景、文字和FIRAS/黑体曲线身份，未新增共享palette；科学drawSpectrum、误差条、数据、galaxy-physics、shared plot/scene及状态所有者均不改。checkpoint `b03fab8978c70153c10205227d28924e8baf9996`；证据 `build/qa/galaxy-cmb-spectrum/` 与 `output/galaxy-cmb-spectrum/`。独立critic结果以最终索引为准，未人工批准，不自动进入cmb/galaxy。

### galaxy/cmb-spectrum 人工冻结（2026-10-11）

用户明确人工批准，接受600高桌面需滚动完整阅读残差/±1σ的P3，不继续微调。冻结源码、13张截图、17.4秒原片及测试/critic原字节：build/qa/approved-galaxy-cmb-spectrum-freeze/freeze.json，output/approved-galaxy-cmb-spectrum-freeze/。仅下一项galaxy/cmb获准，galaxy/galaxy仍保护。

## galaxy/cmb：全天方向图单项候选

主体为原 Planck 2013 全天等距柱状 JPEG，保留完整投影、原金圈与 l/b 方向，不把宣传图版颜色转换为 µK。球面缩为同源方向投影参照，明确没有深度意义；原生 OrbitControls 只转显示视角。图边银经方向、银北/银南及定性颜色边界常驻，原坐标 range、完整来源和机制渐进披露。来源失败/等待时同步隐藏图与无纹理球面，保留原重新载入路径；FIRAS 独立失败不阻断方向图。

局部呈现所有者仅 `galaxy-cmb-ui.js/.css`，native range/details、文档滚动、原 galaxy.js 点选/相机/状态/复位继续作为 canonical owners。切换前先归还旧适配器 DOM，再激活当前适配器；不让平均谱和方向图同时占有控件。原 JPEG/UV/marker、科学函数、shared scene/plot 和恢复所有者不改。没有时间推进，禁止假播放；重置仍返回整个银河实验的盘外俯瞰，不改成图内选点复位。桌面图下参照与读图区不是第二工作区，窄屏按自然流保留完整全天图、原方向操作和小球面。token沿用原图颜色及已批准科学画布背景，不新增共享组件。

checkpoint `5c84a62964df612cf165ecf48907b9262c481990`；证据位于 `build/qa/galaxy-cmb/` 与 `output/galaxy-cmb/`。最终独立 critic 和回归结果以 INDEX 为准；未人工批准，不进入 galaxy/galaxy。

第二轮独立 critic P1=0/P2=0/P3=1，专项15/15、完整182/182，停止视觉修改并等待人工验收。仅通过原 marker 世界位置与原 camera 投影的14px轮廓增强小球面选点，圈随原视角更新，出场时短提示；原mesh/UV/相机/renderer和科学状态不改。保留局部P3：拖动球面后焦点在BODY时Escape不收起披露，关闭按钮仍一击可用并返回summary；不把它推广为全局规则。最终14图及18.12秒原片见round2索引。

## galaxy/galaxy：单项授权候选（2026-10-11）

仅本页使用局部 `galaxy-galaxy-ui.js/.css`，token 为本页科学画布配色，非全局 palette；原生 range/details/文档滚动、原 galaxy.js 视角/波段/临时比较、共享 scene/plot 与 experiment-state 均保持 canonical owners。当前观察位置的教学点云是主体；盘内 l/b 常驻，其他条件及原高度/组成分层披露。原解析积分主动展开后贴近方向控制；真实 Gaia Hammer 亮度/颜色与 2MASS Aitoff 星数图按需作独立结构参照，不能逐像素比较，也不被参数重新生成。模型消光波段、观察者 R/高度/l/b 与任意积分单位具名。图片等待/失败明示，模型不代替图版；主题切换先归还原 DOM，再交给当前所有者，复位仍恢复整个原模块。禁止把点云包装成真实三维星表、把末端透过率当作整条视线总光度，或新增播放。

checkpoint `4de637b0037f0fffef1b292b654572cc1893af0e`；审稿、截图/原片及实际回归以 `build/qa/galaxy-galaxy/INDEX.json` 为准。仅候选，不宣称人工批准；此次开始授权不自动冻结前一 CMB 页面。不进入第10批。

首轮独立 critic Pass：P1=0/P2=0/P3=2，停止视觉修改，等待人工验收。保留320px盘外外围原生标签裁边与画布拖动后BODY焦点下Escape未收起条件的局部P3，可见关闭按钮有效、核心任务及科学状态不受影响。主点云独占默认主体，解析积分仅在任务展开时与方向操作相邻，固定观测图版独立按需出现；这种条件式组织不外推为其他Mixed页面模板。22张最终截图与21.24秒13操作原片见 `output/galaxy-galaxy/round1/`；原片已独立从0、1×自然播放至结束。

## 第10批：原共享事件过程的局部呈现

2026-10-13，用户授权继续自主推进。分级保留原纸面工程表示与实/虚线身份，不机械套深色月面布局；同一时刻的结构、Δv与质量曲线共同解释分离因果。时间控制靠近过程，载荷/推进条件、各级分解与完整来源原生披露。新 `landing-staging-ui.js/.css` 只借用原DOM及局部空间/字号，曲线path、事件、单位、模型与输入所有者保持原 `landing-staging-lab.js`；token沿用其原CSS，文档滚动和原生details/range/select为canonical owners。

本轮发现旧transfer呈现适配器首帧回调在非transfer模式触发重建、覆盖恢复后的时间/速率；只在orbits.js给该呈现回调增加当前模式保护，不修改experiment-state、模型或时间算法。原guide受editorial重定位影响时，必须在过程完整重建/卸载前归还稳定父节点；部分重建不能重挂正在拖动的输入。独立预审已核对原因，实际恢复与邻接测试为通过前提。证据 `build/qa/ui-batch10/`，批准状态以各项最终索引为准，critic或自动冻结不能标为人工批准。

分级第二轮独立0/0/1、15专项与182完整通过，已按持续授权自动冻结，不宣称人工批准。原导航从过程交给transfer前必须先释放，不允许两个适配器同时持有返回占位。着陆保持独立观察任务：高度与带正负号的速度共用原时间，推进剂曲线降权；点火高度为当前必要输入，三预设一个入口，参数和原方程按需。临界是本方程预设，不是实际制导；空中速度为零不叫着陆；预设完整重建后焦点归回可见摘要，不能留在已隐藏/移除的原按钮。着陆的局部规则不能改变分级布局/像素，最终邻接证据必须核实。原生range按步长显示，精确触地事件由原事件入口验收，不能放宽科学断言以适配控件取整。

## 圭表：原日影与两种压缩时间（2026-10-13）

S工作区保留原三维太阳/竖表/影端为主体，纬度与当前日内时间或年日期相邻。日期、表高、曲线与临时三读数对照按任务披露；320px标注只投影原sprite世界位置，不改变几何。真实影长可超4.8m显示范围，夜间无直射日光不能伪造影长。日内固定日期、1×每实秒1.2地方真太阳时小时；年序固定正午12:00、1×每实秒18日。倍率变化即刻更新原说明，不重绘/改科学状态；重置演示与恢复整项默认值保留原不同语义。所有者仍为sky.js原range/select/details/clock/experiment-state。

原双属性day按钮的selected呈现优先shadowCycle，避免year和day同时pressed造成错误公开捕获；不改捕获器或模型。第三轮独立0/0/1，保留原周期菜单选择后不自动关闭的P3；完整回归与冻结状态见build/qa/autonomous-20261013/sky-measure/INDEX.json，不据此宣称人工批准。
