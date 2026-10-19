---
version: alpha
name: AstronomyLab approved UI references
description: 三个已人工批准样板的发现索引；下列颜色仅属于月相，运行时 token 保持类型专属。
colors:
  background: "#080e16"
  foreground: "#eef3f7"
  muted: "#9daab8"
  border: "#334353"
  primary: "#b7ced8"
  overlay: "#101924"
typography:
  sans:
    fontFamily: "Microsoft YaHei, system-ui, sans-serif"
omitted:
  - section: rounded
    reason: 方形 overlay 和文字按钮沿用已验收 CSS，不建立跨模式圆角系统。
  - section: spacing
    reason: 精确响应式几何由 phase-ui.css 拥有，不把单个模式的定位规则推广全站。
  - section: components
    reason: 移动原控件并保留其行为，不引入新的组件库。
---

# AstronomyLab 已批准 UI 样板与规则索引

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
