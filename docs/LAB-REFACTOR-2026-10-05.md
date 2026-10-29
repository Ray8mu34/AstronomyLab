# AstronomyLab R1 重构进度与交接

## 2026-10-30 全站白天/黑夜切换（保留主页对比配色）

用户明确授权先备份、子agent分工增加全站白天/黑夜切换，记住选择，保留科学原色和功能，并特别要求主页现有黑白对比不动。已核对最新AGENTS、README、主交接与开发手册；开工备份位于`D:/Users/ZJUAAA/2026/AstronomyLab-backups/theme-switch-20261030-005945/`，1102个现存文件共240460078字节逐文件复制并核验，另登记6个此前已删除的历史路径。manifest、Git状态、HEAD和`files/`均保留。恢复时先另存当前工作，再按manifest选择文件；不要reset/clean或恢复已删除旧讲义。

五个作者子agent分别适配空间场景、光学/图像/星光、天球/恒星/银河、轨道/测量、最近新增八组；另有独立全模式浏览器检查及独立可读性复核。父agent负责共享主题、导航、重绘、文档、构建与整合。没有改框架、科学模式ID或现有模型；共19工具62模式。

共享实现为`web/observatory/shared/theme.js`与`theme-control.js`。三个文档在样式前加载主题偏好；首次跟随系统，手动选择后写入同源localStorage的`astronomy-lab-theme`，刷新、跨工具、历史返回与跨标签页保持。存储被拒时当前文档仍能切换并在SPA导航/恢复中保持内存选择。原生“白天/黑夜”按钮进入现有公共/紧凑导航，名称表达下一步操作，键盘与触屏均可用。主题不写入URL或科学快照。`presentation-tokens.css`仍为唯一色值owner，`al-theme-change`沿既有字体重绘登记合帧更新完整图层，避开模型重算、相机重建和随机重抽。

主页使用`home`主题作用域，保留原header、黑场月面和明亮目录，不加主题按钮。`home.js`、`home.css`逐字节保持；两主题1440/390的六处关键配色与开工实页记录一致。工具/来源页使用`tools`作用域；普通文字、控件、轴线、背景和曲线随主题。照片、HR星色、月面、空间沙盘等仅在科学画布及必要叠加层固定原背景/色彩；M33速度场的圆盘和色标RGB保持，外围坐标和空白跟随主题。没有全局滤镜或图像反色。规范、系列色与所有者已同步到DESIGN.md。

实页复查中修正的具体问题：测量图主题重绘原本会经过重建相机的refresh，现单独调用绘图；光学重绘补全剖面而不仅星像；恒星旧range补显式for/id关联；日地月周期页深色浮动小月盘的操作文字固定局部深色配色；390px导航保留品牌宽度，动作区按可用空间换行；页脚/单位小字使用语义muted；星光展开读数取消旧色块背景；模块和启动失败的重试按钮使用canonical al-button；着陆/分级预测曲线保留原虚实线身份并提高可辨识度。主题检查另外发现日食旧提示与视角标尺重叠，经本轮范围内确认只调整文字位置/换行，原视场、几何和计算不变。

实际检查及证据统一在`build/qa/theme-switch-20261030/`：

- `node tests/theme-browser.mjs --base http://127.0.0.1:4494 --suite matrix ...`：62模式×两主题×1440/390共**248个唯一组合**，包含主控操作、切换前后科学快照、可见主题按钮、标签、画布、页面边界；最终检查还核对导航品牌/动作矩形不相交及主要元素左边界。原12项失败均为3个恒星模式的旧标签缺失，已修后复跑20项；共享窄屏导航修正后重跑全部390px的124项，后续曲线修正仅补相关模式。页面异常0。每项最新证据索引由`qa/final-index.json`汇总保留，旧失败不删除。
- 同脚本`--suite behavior`：**14/14**，覆盖系统偏好、显式选择、刷新/跨工具/历史、跨标签页、拒绝存储、320触屏、两主题失败重试、主页配色、M17/教学图/CCD原像素。独立生成包4495也运行该组，**14/14**通过。
- 各作者另查320px、披露/原生select/dialog、播放/暂停、相机拖动、冻结对照等。科学数据与色标按实际对象验证：M17/教学图/CCD完整RGBA一致；HR、恒星剖面/轨迹、星图与CMB固定画布哈希一致；空间画布等待相机阻尼收敛后核对内部像素；M33最终取40个色标点及20个盘内点RGB一致，外围背景按主题变化。没有将不同底色的整个M33画布记为同像素。
- 实际录屏：`space/focused/moon-theme-motion.webm`中播放时切明→暗→明，模型日11.016247→14.683047→18.316447连续，暂停后18.433047保持；`optical/recording/imaging-theme-switch.webm`长16.56秒，9个操作涵盖冻结、赋色、两主题、放大与Escape。作者实际查看代表帧，录屏不代替实体硬件验收。
- 独立可读性复核：82个代表状态、12个classic补充状态、16个定向复核状态、4个模块失败和2个启动失败状态；包含来源页、683px重排、320px强制色彩与原生select。small、展开读数、重试按钮、预测曲线四类已修复并复测。预测线合成对比最低白天3.46:1、黑夜3.16:1。SVG底层背景引起的自动扫描告警通过实图核对排除；没有把此项检查称为全站无障碍认证，详见`contrast/review.md`。
- `npm run check`：**165/165**；新增4项主题状态测试覆盖同步恢复、显式优先、storage同步/拒绝和首页作用域。`npm run build:deploy`生成**273**个HTTP资源、**261**个包文件。`npm run check:boundaries`：334保护项中316未变、18项此前授权修订；保护/包失败、源漂移、禁入资源均0，没有新豁免。
- 独立包`node tests/visual-expansion-routes.mjs --base http://127.0.0.1:4495 ...`：**47/47**；最终着陆曲线CSS后再用主题矩阵对包内orbits四模式×两主题×683px补测**8/8**。运行包通过源/包字节核对，不依赖课程、Python或浏览器测试工具。
- 既有dl_env的字体`--check`通过，汉字缺字0；无需重建字体，7个字体文件字节保持。`npx --offline -p @google/design.md designmd lint DESIGN.md`：0错误0警告；CRLF兼容git diff --check通过。premium strict仍退出1、92项（65按钮识别、24空href、3旧form规则）、unresolved=0，与开工状态同类同数，无本轮新增项；原始结果保留，未声称strict全绿。

`checkpoint-comparison.json`确认18篇讲义、23个独立physics/scene-state文件、404个科学素材/数据/来源文件以及主页两文件和字体七文件全部保持；39个既有web文件为呈现/入口/生成清单变化，新增共享主题文件2个。与科学渲染共处的文件保留逐行diff及对应模型/状态/像素回归。DESIGN中的旧“由页面固定明暗”规则由本次用户授权改为全局选择，局部科学原色和首页固定规则保留，这是已授权的规范演进。

执行中的检查脚本问题按实情保留：日地月原生入口使用earthMoon.state.ready/getState而非通用ready属性，首轮等待器已改；Playwright动态.last()在展开后指向新出现的summary，改为固定元素后复测；惯性相机等待不足改为连续稳定帧；Canvas频繁读回导致GPU/CPU抗锯齿差异，使用同主题对照、软件Canvas复核或科学数组/像元中心RGB区分，未改科学原图来迎合测试。父agent一次导航临时检查漏写可选链、一次Windows rg路径通配失败均已简化修正。原始失败、最终证据和实际命令留在各组QA目录。

本轮只在本地完成。原4491预览已确认本项目PID后重启，以载入新增资源白名单，保留讲义外置阅读；4494源码验收、4495生成包验收服务在检查结束后关闭。最终预览`http://127.0.0.1:4491/`，主题按钮位于工具页面顶部。未提交、推送或部署；运行包许可仍`blocked_pending_licenses`。Edge/SwiftShader、模拟视口、截图和数值证据不等同真人使用或实体硬件验收。

## 2026-10-30 第二批四组可视化与18篇实验对应（已完成本地验证）

用户在询问首批四组是否已覆盖新版讲义后，确认继续补充阴阳合历、图像校准与孔径测光、恒星内部支撑/产能/输运、超新星供能与光变，并整理逐篇对应。实施前读取最新 AGENTS.md、README、主交接及开发手册，核对当前未提交状态；1066 个现存文件、240119899 字节逐文件复制核验至项目外 `D:/Users/ZJUAAA/2026/AstronomyLab-backups/visual-expansion-20261030-001537/`。该目录含 manifest、Git 状态与 HEAD；按 `files/` 中的路径选择恢复，恢复前先保存当前工作，不用旧 HEAD 覆盖之前的讲义及前端修改。原已删除旧篇章只记为 missing，没有恢复。

四个作者子 agent 分别维护新组的模块、纯模型、样式、来源和测试；一名子 agent 整理18篇对应，一名独立复核科学计算。父 agent 负责共享注册、历史状态、入口、字体、阅读导出和整体检查。当前为 **19 工具、62 模式**；此前15工具53模式的顺序、ID和入口保留。本轮新增如下：

| 工具 | 模式 | 图形与操作 |
| --- | --- | --- |
| `lunisolar` | `calendar / intercalation` | 太阳年与朔望月的累计位置、19年235月近似；香港天文台2025/2026实例的月份、中气与闰月。实际民用日边界与平均周期分开。 |
| `image-calibration` | `calibration / photometry` | 同一合成CCD视场依次扣偏置、暗信号并除平场；固定随机曝光、同一ADU显示标尺；恒星孔径、天空环和增长曲线。 |
| `stellar-interior` | `equilibrium / thermostat / transport` | 气体薄层的压力与引力、半径—能量曲线；收缩与核反应反馈；环境梯度、气团位移及浮力。 |
| `supernova-light` | `diffusion / radioactivity` | Ni—Co—Fe数量与供能；储能、逃逸光度和膨胀做功的共同时间轴，参数改变扩散时间与光峰。 |

默认界面以对象、坐标、单位、数据身份和必要操作为主，推导与模型条件进入原生披露。沿用 paper token、字体、导航、控件和状态恢复，没有另建主题或课程运行依赖。新增17个web文件；`checkpoint-comparison.json`确认185个原有科学模块/地月/太阳系文件逐字节不变，18篇正文逐字节不变，原卷与原有素材没有改动。既有web文件的变化仅共享注册/状态/上下文、字体和生成白名单。

`course/experiments.json`与`course/experiments.md`为对应表，18篇共73条关系、涉及全部62种现有模式；每条均指向实际正文小节。表内另列交互、图版或数据对照的延伸方向，不能据此宣称讲义所有内容已可视化。`tools/export-experiment-map.mjs`核对篇章身份、小节和工具ID，生成外置阅读的`experiments.html`；目录提供总入口，每篇导航提供“配套实验”。HTTP阅读使用当前服务地址，file阅读用原生表单指定实验室地址。网站自身仍无需课程包。

实际验证（证据统一在 `build/qa/visual-expansion-20261030/`）：

- `node .../baseline-browser.mjs`：此前53模式 × 1440/390px，**106**页面均HTTP200，默认横向溢出0，pageerror0。`node tests/visual-expansion.mjs --base http://127.0.0.1:4490 --out .../integration-final`：两批新增19模式的1440/390/320布局、标签与来源披露，以及键盘、刷新、Back/Forward和同组切换，共**76/76**通过。首轮76项通过后，各作者修正极值图面，再以最终文件复跑。
- `node tests/visual-expansion-routes.mjs --base http://127.0.0.1:4492 --out .../package-routes`：生成包的19个classic携参入口、19个683×384重排与标签点击、8组模块失败重试/来源、慢样式返回目录，**47/47**通过。新增组都采用当前呈现；原43模式classic行为不变。
- `node .../reader-check.mjs`：18篇/73链接、1366/390/320折叠阅读、键盘与触屏模拟、四篇讲义到新工具及返回、离线地址错误和恢复，**8/8**通过，pageerror0。父 agent 实际查看阅读页与各组代表截图；作者另有极值、全部参数恢复、键盘与触屏模拟记录，见各组子目录。
- 独立科学检查：香港天文台55条日期事实与27个月名全匹配；恒星能量独立积分最大相对差`4.65e-16`，反馈轨迹与DOP853最大半径比差`2.57e-9`；SN独立扩散核最大光度差`1.14e-10`（单位10³⁶W），独立膨胀功积分差`2.63e-11`（单位10⁴²J）；CCD精确erf对照最大差`0.00202 ADU`，固定天空孔径扣背景差`3.76e-12 ADU`。详见`science-review.md`及原始JSON。恒星极端参数下力箭头曾在320px裁切，现按可用宽度共同缩放，保留力比，独立实页复看通过。
- `npm run check`：**161/161**通过。`npm run build:deploy`：**271**个HTTP资源、**259**个包文件。`npm run check:boundaries`：334项中316未变、18项此前授权修订，保护/包失败、源漂移、禁入资源均0，没有新增保护豁免。
- `conda run -n dl_env python -X utf8 tools/export-lectures.py --web --self-test`：18篇、179文件，本地依赖/锚点缺失0；56处维护或私有依赖按既有规则排除。原Markdown保留，导出及ZIP完成。资料包维持`blocked_pending_permissions`，运行包维持`blocked_pending_licenses`。
- 已用既有dl_env执行字体生成及`--check`：汉字缺字0、443196字节，少量科学符号继续系统回退。`npx --offline -p @google/design.md designmd lint DESIGN.md`：0错误0警告。frontend-design-premium strict退出1，共92项：65按钮行为识别、24空href、3旧form规则，unresolved=0；本轮新增1项位于`stellar-interior.js:19`，为动态模式按钮事件委托误报（同文件102行处理、108行绑定，实页切换已验证）。保留原始审计，不宣称strict全绿，也未扩大范围修改旧页面。

已知工具/脚本过程错误也保留：首次比较备份时未跳过原已删除路径的missing记录，触发KeyError，随后按manifest显式区分并确认没有恢复旧文件；首次阅读导出控制台的中文绝对路径被Conda转码，实际目录和HTML正确，生成器日志现输出相对路径；SN键盘极值检查曾未等待绘图帧，已修正检查等待。运行时没有为这些脚本错误添加规避逻辑。

Lunisolar子agent早期使用URL.pathname，误将3张截图写入项目同级百分号编码目录；其移动和清理操作被自动审批拒绝，返回理由仅为`blocked by policy`。已停止该操作，保留`D:/Users/ZJUAAA/2026/%E4%BB%8E%E8%AF%95%E5%8D%B7%E8%AE%B2%E8%B5%B7%E7%9A%84%E5%A4%A9%E6%96%87%E5%AD%A6%E7%9F%A5%E8%AF%86%E5%85%A5%E9%97%A8/build/qa/visual-expansion-20261030/lunisolar/`中的`calendar-1366.png`、`calendar-390.png`、`intercalation-1366.png`。正确位置另有证据副本，源码不受影响；后续脚本使用fileURLToPath。

4490源码验收和4492生成包验收服务在确认PID/命令行后停止；各作者临时服务已停。保留4491作为本轮完整本地预览，启动方式为`npm start -- --port 4491 --lectures <项目根目录>/dist/lectures-web`；讲义对应入口为`http://127.0.0.1:4491/lecture-assets/experiments.html`。本次没有提交、推送或部署。软件浏览器、模拟视口与独立计算不等同真人科学审校、实体硬件或真实试讲；最终命令和图像证据按上述范围使用。

## 2026-10-28 四组新增可视化与最新前端整合（已完成本地验证）

用户在另一前端 agent 完成后明确恢复任务：先核对最新修改、备份，再由子 agent 分工补上银河与 M33、宇宙膨胀、地月潮汐、行星环境；保留现有功能，让图形和交互承载关系。实施前核实上一节 14 个前端文件的 SHA 全部匹配交接；备份当前 1028 个文件、239797161 字节至 `D:/Users/ZJUAAA/2026/AstronomyLab-backups/visual-expansion-20261028-135010/`，逐文件核对复制前后 SHA，含 Git 状态、HEAD 与恢复 manifest。恢复时以该目录 `files/` 为源，按 manifest 选择文件；不要用旧 HEAD 覆盖未提交讲义与前端工作。

四个实现子 agent 各自拥有一组新模块、纯模型、CSS、来源及数值测试；另有旧前端浏览器检查与独立科学交叉检查。父 agent 维护共享注册、模式上下文、入口、历史状态、白名单、字体、构建与整合。当前目录为 **15 工具 53 模式**，原 11 工具 43 模式的 ID、顺序、入口与科学模型保留。

| 新工具 | 模式 | 图形与操作 |
| --- | --- | --- |
| `galaxy-measurements` | `distance / rotation / mass` | 合成造父周光样本与光变、距离尺度传播；倾斜速度场与选环；恒星/气体/暗晕分量及球对称等效质量。原银河视角仍可进入。 |
| `cosmology` | `expansion / distance` | 尺度因子、可换观察者、波长与退行速度；平直 FLRW 光度距离、距离模数差和通量比。 |
| `tides` | `locking / earth-moon` | 共转视角的形变、标记和相反力矩；同步过程、角动量交换、能量耗散。两模式精确时钟和参数分别保留，恢复暂停。 |
| `planet-environments` | `balance / atmosphere / escape` | 距离与反照率、按能流缩放的箭头；单层灰体大气能量收支；分子速率分布、指定高度逃逸阈值和瞬时尾部比例。 |

默认图版只留对象、单位、量值、必要模型身份和操作；条件、推导及来源位于原生披露。使用现有 paper token、字体、共享导航、range/select、披露、绘图和历史状态。新增工具只有当前工作区呈现，携带旧 `ui=classic` 参数时仍加载必要样式；原 43 模式的 classic 分支不变。没有新第三方运行图片/数据文件，没有改讲义正文、原卷或太阳系沙盘。

实际验证和命令（证据统一在 `build/qa/visual-expansion-20261028/`）：

- 最新前端旧 43 模式 × 1440/390px 共 **86** 页面 HTTP 200、默认横溢出 0、pageerror 0；另查 320px 的 **11** 个代表页面。历法反复切换/节点归还、图像冻结/清空/数据集、刷新/Back、错误导入、M17 失败与重试、首页图片失败路径通过。发现并修复 FIRAS info 窄屏越界，1440/900/390/320 的 Enter、Space、触屏、Escape 归焦复测通过；原始失败保留在 baseline 记录中。
- `node tests/visual-expansion.mjs --out build/qa/visual-expansion-20261028/integration-final`：新增 10 模式 × 1440/390/320，及 10 组键盘/刷新/Back/Forward/相邻模式，共 **40/40** 通过，pageerror 0。第一轮发现可见 h1 缺失及 output 抢占隐式 label 关联，已修显式 for/id；第二轮 3 个桌面失败属于银河 agent 尚未完成该修复时的旧文件，最终全过。实际查看新旧页面截图，保留全部轮次。
- `node tests/visual-expansion-routes.mjs --base http://127.0.0.1:4413 --out build/qa/visual-expansion-20261028/package-routes`：生成包上 10 个 classic 携参入口、10 个 683×384 重排/标签点击、4 个模块失败重试与来源、1 个慢样式响应中返回目录，共 **25/25** 通过。各组 agent 另有极值、投影/同步、点选、原生选择、触屏与录屏证据。
- 独立科学检查使用不同表达式/算法：60 组 FLRW 与 SciPy 积分最大相对误差 `3.50e-11`；11 组 Maxwell 尾部与闭式表达式最大相对误差 `3.36e-14`；36 组大气收支最大残差 `1.44e-13`；108 组 M33 的 d/d² 标度通过。潮汐另用 q 变量 DOP853 对照，角动量误差 `2.22e-16`；极端相位差 `1.42e-5 rad ≈ 0.00081°`，如实保留严格预算略超记录。图窗动态上界和同步“力矩=0”的符号冲突已修。详见 `science-review.md` 和数值 JSON；这不是真人科学审校。
- `npm run check`：**131/131**，包括新物理、精确时钟恢复、旧模型及注册边界。`npm run build:deploy`：254 个 HTTP 资源、242 个包文件，输出 `deploy/lab/` 与 `deploy/lab.zip`。`npm run check:boundaries`：334 保护项中316未变、18项为此前已登记授权修订；保护失败、包失败、源漂移、禁入资源均0，本轮未增保护豁免。
- 已用现有 `dl_env` 运行字体生成与 `--check`，新增汉字覆盖通过；`npx --offline -p @google/design.md designmd lint DESIGN.md` 为0错误0警告。frontend-design-premium strict 静态审计退出1：91项（64按钮行为识别项、24空 href、3旧form校验规则），unresolved=0；其中新模块3项均为动态模式按钮的事件委托误报，实页切换已验证，未据此声称 strict 全绿或批量改动旧代码。配置、完整结果与初始失败均保留。

`checkpoint-comparison.json` 确认上一轮前端14文件中13字节不变，只有 FIRAS CSS 增加已复测的浮层定位；其他既有 web 改动仅共享注册/状态/上下文、字体及生成白名单。新科学与呈现共16个 web 文件，来源记录与原有许可状态都保留。可逆备份、所有失败与修复线索均在本节指定目录。4413生成包验证服务及各子 agent 临时端口已停止；4412保留为本地源码预览。

本次没有提交、推送或部署。当前生成包仍为 `blocked_pending_licenses`；本次 Edge/SwiftShader、模拟窄屏、数值和截图检查不等同实体设备、真人理解、教材对照或真实试讲验收。

最后的默认 `git diff --check` 将本机 CRLF 的行尾 CR 报为尾随空白；未批量改写源码换行。使用单次 `git -c core.whitespace=blank-at-eol,blank-at-eof,space-before-tab,cr-at-eol diff --check` 按 Windows 行尾核查后无输出、通过，未修改 Git 或系统配置。

## 2026-10-28 八类前端冗余文案精简（已修改，按用户要求未测试）

用户授权按核查结果直接修改前端，随后明确要求“做完了先不测试，前端修改结束就结束工作”，由后续agent统一测试。已完成源码修改；未启动浏览器、运行测试、构建、字体覆盖检查或部署。本节不是验证通过记录，下方90个默认页面组合及四项交互通过仅属于修改前核查。

- 首页删除开场辅助句、目录重复品牌与数量介绍、工具条目统一附带的问句，目录直接命名“工具目录”。来源页删除用途解释及工具功能摘要，保留工具入口、来源链接、署名和许可；重复的来源链接增加各工具专属可访问名称。
- 测量页删除四模式标题下的练习步骤，原观察建议继续保留在完整资料中。影长测量增加具名info入口，说明拖动、滑块与方向键操作；单位、误差、参数与科学边界保留。
- 图像页标题改为“M17 通道赋色”或“教学计数与显示”；具体练习移入“观察建议、处理方法与单位”，默认对照反馈留空。冻结、清空、导入、错误等实际反馈及源数据身份、单位、缺测和模型说明保持。
- 历法页精简重复标题、侧栏条件段和页底重复边界；固定365.2422日参照留在读数区，完整计算和适用范围保留在原解释中。观察步骤进入原解释披露，切回其他天空模式时由呈现所有者归还节点；科学计算与状态逻辑未作修改。
- 天球、星光、测量的模式切换不再生成常驻的“已切换……”空泛回执，原live region和其他实际操作/失败反馈仍保留。
- 太阳系仅在未选天体、查看系统资料时不渲染抽象导语；原内容资产、天体导语、沙盘与科学呈现未改。
- FIRAS删除开场操作句；频率操作改为具名info入口；发布频率与比较频率的完整解释移入原“读图与来源”。图形、图例、单位、±1σ、数据身份与来源保持。

短info提示使用原生details/summary及已有共享Escape处理，不新增事件或模型所有者；共享CSS负责44px目标和浮层，空live region不再留下文字占位。DESIGN.md记录该约定。修改清单见本机 `build/qa/frontend-copy-edit-20261028/edits.json`，编辑脚本为同目录 `edit.mjs`，修改前web哈希为 `before.json`。14个修改前源码文件备份至项目外 `D:/Users/ZJUAAA/2026/AstronomyLab-backups/frontend-copy-20261028-1793165867265/`；用户此前未提交工作及另一agent新增的法兰距交接均保留。首次交接补丁因顶部已插入该agent记录而未匹配，读取现状后重新插入。

后续统一验证应覆盖：八类默认文案与必要信息可达；两个info入口的Enter/Space/触屏/Escape与浮层边界；历法切入切出、反复导航及提示节点归还；图像冻结/清空/切模式、来源链接、实际错误反馈、模型状态恢复；桌面与窄屏相邻模式。再运行项目检查、字体覆盖与边界检查。运行资源清单 `web/observatory/runtime-assets.json` 及任何运行包尚未刷新，后续构建统一生成，不直接修改deploy产物。当前未提交、推送或部署。

## 2026-10-28 法兰距补充与新讲义—网站可视化对照

用户本次只要求补入法兰距，其他原卷缺口暂不处理，并要求审查旧网站可视化相对新18篇的缺口。已按expository-writing在第09篇“从理想成像走到真实光斑”内、像差与平场镜段落后加入两段，说明法兰基准面、感光面、有效焦距和校正镜指定间距，以及17.5＋21＋16.5＝55 mm装配例。Edmund Optics与ZWO实际查阅来源已加入该篇SOURCES。未新增图、未改其余17篇，原图保持；知识清单顶部记录K40后续覆盖状态，10月25日原数据和地图继续作为当日快照。

改动前9个相关文件已逐字节备份至项目外 `D:/Users/ZJUAAA/2026/AstronomyLab-backups/flange-and-visual-review-20261028-051914`，checkpoint包含18篇和359个网站文件的开工哈希。仅更新第09篇catalog哈希及其保护修订端点，历史哈希与授权保留。已重新导出正文和离线阅读包；177文件、本地依赖/锚点缺失0，边界检查334项无失败，226运行包文件与源无漂移。新增段落在1280和390宽度下实际查看，图片、数学与页面边界检查通过。

网站审查以当前web源码在本地4396端口运行，逐一打开11工具43模式，记录控件与模型范围，全部返回200且页面异常0；保存并查看15个代表模式画面，另核对现有黑洞潮汐子任务和距离标尺控件。完整18篇对照与优先级见本机 `course/_teacher/visualization-review-20261028.md`：优先缺口为银河旋转/M33连续测量、宇宙膨胀、地月潮汐、行星能量收支，其后为阴阳合历、校准与恒星能量过程。现有距离标尺的固定角轨道/周期模型使用质量随d³变化，第18篇固定光谱速度的M33推断使用质量随d变化，两者条件不同，后续须分别呈现。历史learning-paths已退出工具运行包，不作为当前运行缺陷。

本次359个网站文件保持，未修改模型、UI或部署；用户要求的是审查，尚未实施报告中的扩充。实际脚本与证据位于 `build/qa/lecture-visual-review-20261028/`。执行命令包括该目录checkpoint.py、update-lecture-records.py、inspect-website.mjs、focused-check.cjs，以及tools/export-lectures.py --web --self-test、node tools/check-boundaries.mjs。检查中曾有Windows不接受的rg路径通配/花括号语法与一次physics.js路径错误，已改为目录配合glob及实际physics.mjs；首次插入交接时发现同日另一项文案核查已更新顶部，读取现状后保留该节重新插入。CRLF兼容的git diff --check通过；确认PID63096属于本次4396预览后已停止，4396无监听。浏览器使用Edge/SwiftShader，此次内容审查与局部阅读检查不代替完整交互、真人科学审校或硬件验收。

## 2026-10-28 前端文案与信息层级专项核查

用户要求按“避免冗余微文案，让布局、层级和主操作解释界面”的原则核查前端，并写入项目 AGENTS.md。已在现有 AGENTS.md 顶部加入执行规则，保留原项目约定和此前未提交工作。本次为核查与规则落盘，下面均是待实施建议；未修改 web/、讲义、运行包或线上服务，未提交、推送、部署。

### 核查范围与结论

通过本任务4197源码服务，以本机Edge无头浏览器检查首页、来源页和11工具43模式：1366×900与390×900共90个默认页面/视口组合。记录实际可见文本、控件标签、页面宽度和浏览器异常；22张默认页面截图中实际查看8张，覆盖首页桌面/窄屏、月相窄屏、图像桌面、历法桌面、FIRAS桌面、测影窄屏、来源页窄屏。四项额外交互检查均通过：首页主题筛选并键盘进入月相、月相播放/暂停、FIRAS资料Enter展开及Escape关闭归焦、首页月面图像失败时保留明确入口和错误提示。

默认页面横向溢出0、pageerror 0；这只能说明所查默认状态正常，不能代替所有操作、无障碍合规或真人首次使用测试。现有主要动作和图形通常清晰；突出的问题是说明与任务标题重复、练习步骤常驻，以及无实际增量的模式切换提示。下表P2为影响默认任务层级的优先处理项，P3为可随后精简项；未据此认定全站已符合新原则。

| 优先级 / 页面 | 实际证据与源码 | 建议处理及必须保留内容 |
| --- | --- | --- |
| P2 / 天文测量四模式 | `modules/measure-atlas-ui.js:14` 在默认标题下分别要求“记下当前读数，再把半长轴增加10%”“保持角半长轴与周期，把采用距离增加10%”等。影高窄屏同样在参数之前放整句操作步骤。 | 木卫一、S2的指定练习移入按需观察建议；影高保留必要的直接操作发现方式，可改为测量端点的可聚焦提示。参数、单位、当前推断和误差读数常驻；不把必要操作藏进只有hover可见的提示。 |
| P2 / 天文图像两模式 | `modules/imaging.js:58` 默认显示“在图中选一个点，将SHO改为HSO…”及“先保留100 s的图，再增至600 s…”；`:56` 的“保留左图，再改变右图…”又解释已有对照按钮。桌面截图中长步骤在标题右侧，与下方赋色/对照控件分离。 | 默认以数据身份、原图/合成图、取样读数与赋色操作为主；具体练习移入现有披露。先精简重复说明，再检查对照按钮是否需更准确命名。保留源单位未标定、缺测、曝光与拉伸作用差异等必要科学信息，以及操作后的冻结状态反馈。 |
| P2 / 天球与时间·历法 | `modules/sky.js:97、193、199` 与 `shared/mode-context.js:35` 分别提供操作段、固定365.2422日说明、图下计算解释和页底同义边界；截图中还有标题、图标题、侧栏标题重复表达整数历年追逐季节年。 | 用“历法规则”和“累计历日差”等具体名称组织选择器和图；固定季节年条件保留一处靠近参照读数。完整计算与不适用范围进已有“读图、公式与完整解释”，避免相同条件分散重述。 |
| P3 / 首页与工具目录 | `shared/home.js:4` 的“改变时间，把月面的明暗…”位于问题标题和“开始观察月相”之间；目录又叠加“天文学实验室 / 从一个问题开始 / 四个主题，十一种探索入口”，每项工具统一跟随问句。 | 先去掉重复品牌、目录数量与开场辅助句，目录标题直接命名“工具目录”。逐项判断工具问句是否提供必要区分；标题已清晰的条目不必统一补说明，不将全部问句机械搬成info图标。图像来源、署名及许可保留。 |
| P3 / 来源页 | `app.js:14` 在“模型与来源”下解释本页用途，11个工具各自再显示工具功能摘要，然后提供同名来源链接。窄屏图中每条资料入口需要穿过同构说明。 | 来源页以工具名称和对应资料链接形成清晰行结构，删去重复功能摘要；图像署名、许可、实际科学来源与工具跳转仍可达。 |
| P3 / 天球、星光、测量的切换反馈 | `modules/sky.js:242–243`、`modules/light.js:131`、`modules/measure.js:146`；默认加载的6+4+4个模式均出现“已切换到…”“已切换模式；比较基线按模式保留”或“已切换实验；可直接操作主控”。这些消息持续占用页面，而当前模式已有明确选中状态。 | 删除空泛尾句；初始路由不生成虚假的用户操作回执。真实交互如需读屏播报，保留适当的live region。保留基线保存/恢复、失败、数据缺失等实际状态反馈，不整体删除反馈系统。 |
| P3 / 太阳系资料导语 | `web/solar-system/content.js:52` 的“从空间分布出发，把形成、组成、运动与时间连成一张知识地图”在五模式页面文本中均可见。 | 该句属于抽象导语，可从默认界面移除；保护沙盘既有布局、模型、拖动/定位入口、比例条件和天体资料。此次仅记录，未改沙盘。 |
| P3 / FIRAS操作辅助句 | `modules/galaxy-cmb-spectrum-ui.js` 默认同时显示“选择频率，对照平均谱与放大的残差”“点选谱图，或用方向键每次移动1 GHz”和图例解释。截图已具备同轴两图、比较频率滑块、邻近发布点读数与图例。 | 可删开场操作句，键盘步长移入比较频率的可聚焦info提示；发布频率与比较频率的区别可用图例紧邻对应标记表达。保留FIRAS/黑体身份、两组不同单位、±1σ和发布原表链接。 |

### 不应按冗余文案处理的内容

月相的压缩距离与放大尺度、真实时间与动画速度区别、FIRAS残差单位、M17数据身份与源单位、表单标签、曲线轴名/图例，以及加载失败的恢复入口都承担实质意义。月相窄屏已有图形—播放—模型时间的清晰顺序；FIRAS完整原理置于可键盘展开的“读图与来源”中，均可作为现有结构参考。此次未发现支付或永久提交流程；不因此省略未来危险操作的后果提示。新增tooltip尚未实施，未宣称其触屏或读屏已验。

### 实际命令与证据限制

执行 `node web/observatory/server.mjs --port 4197`、`node build/qa/frontend-copy-audit-20261028/audit.mjs`、`node build/qa/frontend-copy-audit-20261028/states.mjs`。证据同目录：`browser-audit.json`、`state-checks.json`及24张截图（22默认、2状态）。脚本和证据属于本机忽略目录，不另建一份主报告。

按设计技能执行 `conda run -n dl_env python C:/Users/30674/.codex/plugins/cache/openai-curated-remote/frontend-design-premium/1.4.0/skills/frontend-design-premium/scripts/audit_project.py . --mode strict --output build/qa/frontend-copy-audit-20261028/premium-audit.json`，退出1、301项静态提示。默认扫描混入deploy、output、第三方存档和教师HTML，并将外部绑定事件的原生按钮报为无动作；另有未配置的原生date/select所有权提示。该结果保留为原始扫描，未视为301个已确认产品缺陷，也未声称strict通过；本次未为消除扫描数字修改历史资产或扩张为全站重构。

执行中PowerShell下几次带路径通配符的rg检索失败，随后改用目录加`-g`检索；首轮截图脚本将URL编码的中文路径直接当文件路径，证据误写到项目同级编码目录，已将本次文件移动回上述QA目录并改用`fileURLToPath`，未重跑或覆盖旧证据。组合清理命令被自动审批拦截后，改为仅能删除空目录的rmdir清理四层空目录，并用原进程会话Ctrl+C停止预览；4197已无监听。CRLF兼容的git diff --check通过。没有界面代码变化，因此未重复构建运行包或引用历史完整回归作为本轮成绩。软件视口与模型审查不能证明实体手机、读屏软件或首次使用者理解；这些仍待实际测试。

## 2026-10-25 指定纳新试卷的知识清单与覆盖核对

本次从用户指定的四页《学术部.pdf》重新抽取全部27题，形成68项清单与六簇知识地图。当前18篇中，60项稳定知识主题有58项覆盖、2项部分覆盖；另有文学语境1项覆盖、特定火箭事实4项未覆盖、开放应用3项分别记录方法支持与作答要求。未将旧题目索引或锚点存在等同于覆盖证明，也未把当前状态记为全部覆盖。明确缺口为帝星历史对应、法兰距和题设火箭型号事实；18篇各取一项实质延伸，地图共86节点、157条带具体关系的连线。

清单、逐题映射、正文证据和来源版本保存在本机忽略目录 `course/_teacher/knowledge-map-20261025/`，入口为 `knowledge-inventory.md`，可编辑数据为 `knowledge-data.json`，交互地图为 `knowledge-map.html`。原卷已逐页查看文字与图片；本次第三幅天体照片为M57，正文第12篇已有对应图片和形成解释，与旧题目索引的M33不同。历史索引保持，后续针对此卷使用新清单。

实际执行dl_env解释器下的 `build_inventory.py`、`build_map.py`、`verify_inventory.py`，以及 `node build/qa/knowledge-map-20261025/check_map.cjs`。18篇正文哈希与重写完成版一致，原卷未改；证据行与节点关系通过数据检查。地图在768、528、328、320像素容器检查中无标签重叠、越界及浏览器异常，节点选择、邻接高亮和状态显示通过，并查看桌面与窄屏截图。首轮密集标签碰撞已修正；核对记录与原卷渲染均留在上述本机QA目录。本次仅编制清单、核对与制图，没有补写缺口或发布。

## 2026-10-25 讲义18篇重写与本地阅读版完成

用户先讨论各篇内容和展开逻辑，随后明确批准18篇安排，授权子agent按expository-writing重写全部正文，覆盖早期“16篇正文不改”和01—04沿用范例的限制。范围为本地讲义、素材补充、阅读目录与导出；Lab工具、科学模型、线上服务不在修改范围。本次没有推送或部署授权。

改动前Git工作区clean，原稿及课程依赖240文件、98,772,475字节已复制至项目外 `D:/Users/ZJUAAA/2026/AstronomyLab-backups/lectures-before-rewrite-20261025-125631`，逐文件SHA256一致；checkpoint.json记录原HEAD、原路径、哈希及web只读基线。原16篇与完整assets、教师资料、课程原卷/方案均包含在备份，随后另补保存未修改的source-protection-amendments.json。恢复时先备份当前工作，再按checkpoint选择恢复；不reset/clean、不覆盖后来人工修改。

当前正文统一维护于course/，18篇编号和旧篇对应见course/chapters.json，阅读入口course/README.md。原11→12，原12分13/14，原13分15/16，原14→11，原15→17，原16→18；assets旧编号按历史来源保留。旧reading/L01—L16外置阅读入口由导出层保持原专题对应；新篇章在chapters/01—18。素材原文件与旧来源记录保持；新增图/来源在assets/rewrite-20261025/分篇目录。

八名子agent各自读取指定expository-writing skill及科学、数学物理补充后完成18篇全文。主agent通读了18篇，按核心问题组织观测、机制、公式与算例，移出原题覆盖/QA状态及假想误读式说理。关键算例由作者复算，新增实质内容的实际查阅范围及访问限制记录于分篇SOURCES。图像经过用户明确纠正后，重新检查了全套原创配图：去掉说明卡、重复结论和读图告诫，使用轨道/地标、光路、结构、曲线和能流传递关系；原来整页航天投影片换成原创机制示意。旧图、旧绘图源和历史来源不覆盖。

本地正文及阅读入口分别为course/README.md、dist/lectures-web/index.html；18篇HTML位于chapters/，正文和阅读ZIP均已生成。原146个资产逐文件SHA256保持，359个web文件保持且无新增。原保护基线不改，source-protection-amendments.json记录原16篇的精确前后哈希与改名，新增两篇由catalog记录哈希。边界检查334项中316未变、18项精确授权（本次16篇加此前2项科学改动），226个运行包文件无漂移。

教师article-concepts.csv仅用于从历史题目定位现有知识解释；2026具体型号题、个人作答及小说语境分别标注未继承/仅物理知识，不把锚点存在当作原卷事实已核验。木卫一质量、月面影长、S2轨道和距离阶梯分别回到相关专篇，18集中于M33的连续推断。

实际执行：使用已核实属于dl_env的D:/Env/Conda/envs/dl_env/python.exe -X utf8运行freeze-edition.py与tools/export-lectures.py --web --self-test；node tools/check-boundaries.mjs；node build/qa/course-rewrite-20261025/browser-check.cjs。导出核对177个文件，所需本地依赖/锚点缺失均0，仓库外复制与ZIP逐字节检查通过；56处维护脚本或私有依赖按原有导出策略排除，阅读中指向范围说明。18篇在1280和390宽度的36个页面检查中图片加载、MathML、页面边界通过，外部资源请求与浏览器异常均0；另实际查看代表性正文/数学和新图截图。导出后的SVG使用XML处理，保留viewBox、clipPath及内部use/marker引用，避免HTML解析损坏图形。

执行中已解决：并发conda run临时文件竞争，改用已核实的环境解释器；12—14的TeX单位转义控制字符修复；首轮导出发现旧式rm宏嵌套转换失败，当前正文统一为mathrm，最后导出转换警告0；一次SVG导出使同步图月球实例不显示，已修复内部片段与XML大小写并重新实际查看。Chrome工具拒绝作者指定路径的PNG落盘，统一Edge本地渲染已覆盖。早期失败输出和修复脚本留在本机QA，不能冒充最终通过证据。

旧导出已移到原稿备份下previous-exports，未删。当前原稿、图片和来源保留，运行时及线上未改，未提交、推送或部署。当前完成的是模型写作、所述算例与来源核查、软件导出和抽样视觉检查；真人科学审校、教材对照与真实试讲待进行，素材许可状态不升级。旧v0.2结论不沿用为当前科学验收。机器证据集中于build/qa/course-rewrite-20261025/，导出器记录在build/qa/lab-refactor/lectures/export-checks.json；不另建多份主交接。

## 2026-10-19 第二轮 GitHub 与生产发布完成

用户在本地验收后明确授权推送并部署，覆盖下节本地阶段的“不提交、推送、部署”限制。第二轮源码提交 [df03eff5faa4bfe30d4bf0251d3bf19d4a60a7a9](https://github.com/Ray8mu34/AstronomyLab/commit/df03eff5faa4bfe30d4bf0251d3bf19d4a60a7a9) 已推送main并以ls-remote确认；本节为后续文档回执，不写自身提交hash。生产 https://lab.zjuaaa.cn/ 已切换同一已验包 r1-20261005-ad7992e8d7e2，runtime manifest SHA256 b5866a98b611f8c616f1e54e1b4898112bf4f08c2770d31a1dbf9ac4ba4086a6，238运行资源/226包文件，许可仍为 blocked_pending_licenses。

发布前main/origin同步于46668aa；Actions工作流、仓库webhook均0。采用明确路径暂存294项，851份公开文件/602个唯一Git blob的凭据、私有路径及95MiB以上扫描0命中；223运行源与最终包完全相同。01/02输入包、教师、raw、QA及凭据继续仅在本机ignored，既有删除未恢复。项目外发布checkpoint为 D:/Users/ZJUAAA/2026/AstronomyLab-backups/release-frontend-round2-20261019-2026-10-19T08-53-13-293Z，含852文件、55删除索引及Git bundle。

服务器部署前HEAD为67048a8b180ea39385f5d328ed5bc5feffcea735且clean；备份保留在 /srv/data/astronomy-lab/release-frontend-round2-20261019/previous-worktree.tgz 与 previous-head.bundle，已验证可读与SHA，PM2私有快照只存服务器。远端GitHub fetch未完成后，使用本机已推送且ls-remote确认的精确增量bundle传入，Git验证对象与所需旧基点，origin配置不变。独立候选4181在原生产继续服务期间验证：Node22.22.1的95语法/103Node通过，公开保护256＝254未变＋2精确科学授权变更，226包SHA、238实际HTTP资源SHA、43模式入口、5项404与POST405通过；候选精确预设/恢复/键盘/拖动16/16，关键新UI抽测7/7、异常0。该发布抽测不是再跑完整182，前轮完整及组合证据范围仍按下节记录。

仅本项目PM2 astronomy-lab切换，实际运行 /srv/apps/astronomy-lab/web/observatory/server.mjs、127.0.0.1:4180，当前PID823408，进程列表已保存。切换后本机端口与公网首页200、实际 /app.js SHA256 46c4cb5577c28a15ab95a2bf90746ff21d92f780e9eb6eddcedc926833e544a5 与已验包一致，服务器manifest SHA相同。zjuaaa-site PID23405及核对的三份Nginx配置SHA保持；未改其他站点、代理、证书或全局服务。实际命令、失败保留、候选/生产记录见本机 build/qa/release-frontend-round2-20261019/INDEX.json。

需要回滚时，先确认本项目工作区clean，再在 /srv/apps/astronomy-lab 执行 git switch --detach 67048a8b180ea39385f5d328ed5bc5feffcea735，仅 pm2 restart astronomy-lab 并核对4180及公网健康；不要恢复整套PM2/Nginx或覆盖其他项目。文档回执随后仅快进到服务器，不重启运行服务。

## 2026-10-19 第二前端包（本地软件迁移完成）

首页、来源及全部11工具43模式已按第二包矩阵完成迁移，模式ID、原科学模型、来源许可、实际预设/对照/状态恢复继续保留。共享呈现token、字体、DOM/Canvas样式与紧凑导航统一，逐工具使用单一呈现owner，退出旧叠加适配；月相四模式、会合三模式、光学/真实图像、FIRAS和HR分别保留其科学观察结构。新增精确状态只扩展已授权的银道方向、噪声seed、会合day及地轴倾角契约；版本校验与旧快照路径仍实测。过程End与真实播放终点等价、分辨率固定天空窗、精确原生预设均复核。前端不展示开发/验收措辞。

开工前HEAD为46668aa96d23b31b282de3573b54b846daffedfb，复制前后Git均clean；812文件、约178.12MB与SHA/删除索引位于项目外 D:/Users/ZJUAAA/2026/AstronomyLab-backups/frontend-round2-20261019-2026-10-19T06-41-21-453Z，详见本机 baseline/checkpoint.json。原始输入包、私有资料及QA均未加入Git，既有删除未恢复。本轮未提交、推送、部署、连接线上或重启其他项目。回退前先备份当前修改，再按checkpoint索引逐文件选择恢复并重新构建，禁止reset/clean或盲目覆盖。

统一最终预览为 http://127.0.0.1:4382/ （Node PID70024，session82938）；重启命令为 node deploy/lab/web/observatory/server.mjs --port 4382。最终运行包由构建器生成，未手改：r1-20261005-ad7992e8d7e2，238运行资源/226包文件；runtime manifest SHA256 b5866a98b611f8c616f1e54e1b4898112bf4f08c2770d31a1dbf9ac4ba4086a6，zip SHA256 d09772dd069d33626793bbc04a60c669084f8574a310b850eab04c5a962d8fb1。完整223源SHA及命令记录见本机 [总INDEX](../build/qa/frontend-round2-20261019/INDEX.json)、[43模式账本](../build/qa/frontend-round2-20261019/migration-ledger.json)和integration/frozen-package.json。包仍为 blocked_pending_licenses，完整署名及待核许可没有升级。

| 证据 | 实际结果与范围 |
| --- | --- |
| 功能/历史/故障 | 冻结包2完整182运行181通过；测影唯一harness误映射经独立审查，以真实俯视尺＋权威读数＋同尺度三角形观察组复核2/2。最后包只改sky.js/stars.js/stars-collapse-ui.js三源，另220源SHA相同；最终包补sky19＋stale1、collapse桌面/手机/历史及7路原生200。组合适用182门槛通过，**不是最终包单次182全绿**。原失败与源版本关联全部保留。 |
| 科学 | 最终对应未变科学源：原生精确预设16/16；End与实际播放4/4；固定分辨天空窗/重进/刷新通过；FIRAS24坏响应/恢复通过；三速度场景×桌手机Canvas验证通过。采样66049栅格字节误差0，角度映射最大误差1.137e-13。原oracle/物理文件保护与独立数值预算未放宽。 |
| 响应式/任务/视觉 | 43矩阵任务逐项有实际步骤/结果、五规定视口截图与完整原片，独立任务审查43/43、open P1/P2=0。四代表页桌面/手机图已实际查看，索引如下；原片版本及1×回看身份按owner/review索引，不把早期源码视频冒称最终包新录片。 |
| 原生缩放/可访问 | 真实tabs.setZoom(2)，DPR2/CSSzoom1、668×336，43模式＋首页补测及最后7受影响路线通过。修复演化select重建失焦、Ia/transfer抢滚动、可见读数同步；collapse过程滑杆具名。60观察AX命名/可见开发备注/横向溢出无遗留；不声称完整WCAG或真人读屏验收。 |
| 性能/字体 | 无并行QA测试浏览器的冷观察：50未变页＋最后10复核，合计12路线×5视口；最大LCP 696ms、最大CLS 0.067480，均在2500ms/.1预算内。首页五视口CLS0，核心字体131992B、图像184918B；全部字体437664B，缺失CJK0，19非CJK符号有明确系统回退。真实采样拖动median7.6/p9510.1/max12.6ms。localhost、无CPU/网络节流、SwiftShader，非实体硬件或field INP。 |
| 工程/边界 | 最终95语法/103Node通过，保护334项＝332原哈希＋2前轮精确授权变更，226包文件校验、source drift/forbidden均0。DESIGN lint0错误/0警告；canonical modules premium strict仍12条历史发现、新增0，退出1，不称clean或全站审计。 |

测试适配只映射真实呈现结构和可达控件：命名科学主体/量与真实来源替换旧字数门槛；eclipse/CMB/测影分别验证所有应显示子图，保留原整组尺寸和首屏预算。390px的CMB单图171.5px、测影单SVG约141.94px，不声称各自满足旧单图180px；Canvas累计fillText只证明标签出现，不证明当前帧或无遮挡。最终复验还保留一次collapse同URL恢复tidal后测试前置条件不符的失败；fresh390完整任务及独立history通过。详情见integration/test-adaptations.json、review/shadow-composite/review.json和review/native200-final/review.json。

| 代表页 | 桌面 / 手机截图 | 完整原片 |
| --- | --- | --- |
| 首页 | [桌面](../build/qa/frontend-round2-20261019/integration/cold-performance-final2/home-1440x900.png) / [手机](../build/qa/frontend-round2-20261019/integration/cold-performance-final2/home-390x844.png) | [完整操作](http://127.0.0.1:4398/?file=home/browser-round2/recordings/page@af4fa9880b497e47eff684172991f9f7.webm) |
| 月相 | [桌面](../build/qa/frontend-round2-20261019/integration/cold-performance-final2/phase-1440x900.png) / [手机](../build/qa/frontend-round2-20261019/integration/cold-performance-final2/phase-390x844.png) | [完整操作](http://127.0.0.1:4398/?file=earth-moon/p0-final02/390x844-operations.webm) |
| 采样 | [桌面](../build/qa/frontend-round2-20261019/integration/cold-performance-final2/sampling-1440x900.png) / [手机](../build/qa/frontend-round2-20261019/integration/cold-performance-final2/sampling-390x844.png) | [完整操作](http://127.0.0.1:4398/?file=optics-imaging/p0/performance/operations-uncut.webm) |
| FIRAS | [桌面](../build/qa/frontend-round2-20261019/integration/cold-performance-final2/firas-1440x900.png) / [手机](../build/qa/frontend-round2-20261019/integration/cold-performance-final2/firas-390x844.png) | [完整操作](http://127.0.0.1:4398/?file=galaxy/round1/recording-final/mobile-complete-uncut.webm) |

原片只读播放器4398为PID26708/session12972；只读第一科学包基线4390和源码诊断4392另有明确用途，均不代表最终包。实体手机、课堂投影、真人首次使用/随机A/B、真人科学审校与读屏试验继续待验，不能用软件WebGL或agent审查替代。

## 2026-10-19 GitHub源码推送回执（未部署）

用户在六项修复本地验收后明确授权“推送到github，不过不部署”。此前的文案整理、第一科学包修复、测试、生成运行包、设计/主交接更新和明确删除已提交为 [`0e63e3e`](https://github.com/Ray8mu34/AstronomyLab/commit/0e63e3e530e43db2d9616cf1eb40516a9c2291fe)，并通过 `git push origin main` 成功快进；`git ls-remote origin refs/heads/main` 已核对远端完整SHA为 `0e63e3e530e43db2d9616cf1eb40516a9c2291fe`。本节是后续文档回执，不将自己的提交hash写入自身。

推送前fetch确认本地与origin/main均为67048a8、ahead/behind=0/0；GitHub API检查Actions工作流0、仓库webhook0，本地仅sample hooks，没有由这些入口触发的自动部署。实际暂存采用明确路径清单，未使用git add .。对拟公开812份Git文件逐blob扫描，凭据特征、私有路径及95MiB以上文件均0命中；244条运行源码SHA仍与本次182/182最终包一致，未无故重复全部测试。暂存差异及CRLF whitespace检查通过。

第一科学包与新加入的第二前端输入包目录/zip均仅保留本机，并加入精确gitignore；私有原卷、教师资料、raw、build/qa、output及凭据继续不上传。可公开的USNO/NASA原有资料、科学数据、来源署名、三项pending和blocked_pending_licenses不升级。公开审查与命令回执在本机 `build/qa/science-round1-20261019/github-push/`。

此次仅更新GitHub源码，没有连接生产服务器、执行部署脚本或重启任何服务；生产事实仍查既有docs/DEPLOYMENT.md记录。本地最终包预览仍为 `http://127.0.0.1:4382/`。下节的“未提交/推送”属于此次授权之前的本地验收阶段记录。


## 2026-10-19 第一科学包：六项修复与同包集成验收（本地完成）

用户明确授权第一科学包的六项修复，覆盖旧的笼统模型/视觉冻结限制；本轮没有发布授权。HEAD 保持 `67048a8b180ea39385f5d328ed5bc5feffcea735`，已有文案修改、未跟踪科学包及根目录四份文档删除均保留，没有 reset/clean、提交、推送或线上操作。项目外备份包含503文件约41.27 MB与删除索引，路径见 `build/qa/science-round1-20261019/integration/baseline.json`。备份在并行实现已经开始后于06:20 UTC采集，不能称为六项全部修复前的纯净源码；各执行者另存修改前局部源及本包冻结基线。基线 check 为97语法/48 Node通过；第一次边界检查的2个模型差异及部分包漂移已来自同时进行的本轮修改，另有根 THIRD_PARTY 删除，不误记为历史模型缺陷。

| 任务 | 实际改动与本轮验收 |
| --- | --- |
| A 精确科学状态 | 在原实验历史体系登记模块 getState/applyState，v1快照新增带自身版本的model；原生range仍按原步长量化，数学预设不经DOM舍入保存。坏model整份拒绝，旧无model快照诚实恢复旧数值。100/200/1200/5000 km圆与临界预设，capture/刷新/目录真实点击后退前进、可见标签、键盘10种键及可信拖动均验证；最终生成包16/16。200 km速度11.014585251781234 km/s、e=1及零能量保持，滑杆11.015不再改变权威问题；木星421800×1.1的463980.00000000006 km及质量保持，标签463980。未扩大分类容差。 |
| B 像元面积积分 | 对原有限分段双线性PSF使用可复用行前缀与矩形原函数积分；两星各半通量，探测器数组不重新归一化。九组独立节点基函数oracle的最大总通量相对误差3.997e-15，归一分布L1最大2.328e-15，满足原1e-3/1e-2预算。实际dl_env独立SciPy艾里64/128阶均运行，窄峰L1约0.00029347885；32阶仅留未收敛对照。有限窗口与网格近似仍分别记录。 |
| C 共享天空坐标 | 连续图与像元图实际drawImage共用天空窗口、中心与角度映射；完整探测器extent另记，边界允许部分像元。F400/800/1600的窗口及星点位置保持、角像元依次减半（5.156620/2.578310/1.289155角秒）。实际连续图16761个栅格点独立复算字节误差0；连续原生拖动33次input/32次draw逐帧验证映射。 |
| D 月相手机遮挡 | ResizeObserver读取固定时间条真实高度并预留空间；默认大月面与向下几何保留，主动比较用紧凑上下布局共同观察。374×860、374×667、320×568共45次科学边界观测及既有月相4/4通过；检查球体轮廓、轨道、太阳参照、标签及月面反馈，非仅canvas可见。3段实际原片及自然1×回看在D索引。320×568部分月相方向文字与地球标签轻微相交为P3保留。 |
| E 速度颜色参考系 | 圆面颜色、左右文字和图例统一观测者总视向速度，含正负、单位与运动方向文字。自转静止/全盘远离/全盘接近独立公式与真实Canvas检查通过；v_r=150、v_eq=120、i=90°的+30至+270 km/s场景错误蓝色块从2195降为0。正确主谱线模型及相邻三模式科学结果/像素保持。 |
| F FIRAS身份与完整性 | 原43行官方v1数据字节未变；加载需通过产品、五列、单位、有限值、正sigma、严格递增频率与数值身份摘要，残差可正负。HTML、截断、坏列、NaN/Infinity、sigma、重复/乱序、伪单位等24项Node与24项真实响应浏览器检查通过，坏内容进入failed并可恢复；原谱页13/13含像素/邻接保持。官方远端与本地字节SHA256相同，记录在F索引。 |

光学固定条件的同窗误差（相对误差为无量纲；独立参考没有复用生产求积）：

| 条件 | 参考总通量 | 修复前相对误差 | 修复后相对误差 | 修复后L1 |
| --- | ---: | ---: | ---: | ---: |
| ordinary-default | 0.99886457295 | -1.0082e-3 | 6.6613e-16 | 1.8595e-15 |
| undersample-preset | 0.99989406629 | -2.1338e-2 | -3.9968e-15 | 2.2508e-16 |
| f4-200mm-800mm-pixel10 | 0.99987084978 | -1.8287e-1 | 1.1102e-15 | 5.1797e-16 |
| f5-200mm-1000mm-pixel10 | 0.99987084978 | -1.5451e-3 | 1.1102e-15 | 1.1420e-15 |
| narrow-psf-pixel6-separation2 | 0.99991083225 | -9.1143e-1 | 8.8818e-16 | 7.6591e-16 |

性能证据来自AMD Ryzen 9 8945HX、Edge 155.0.4283.62软件WebGL，5次预热后50次同步psf+detector：默认中位4.4 ms/p95 6.0 ms，窄峰0.7/1.1 ms；原生连续拖动input到实际draw中位9.3 ms、最大28.7 ms。它们是本机测量，不推断统一性能分数或硬件验收。

最终执行 `node tools/check.mjs`（97语法、88 Node，含原Imaging检查）、`node tools/build-lab.mjs --out deploy/lab`、`node tools/check-boundaries.mjs --package deploy/lab`；244资源/232文件、包哈希/source drift=0/禁止资源=0。完整原入口 `tests/standalone-refactor.mjs` 的 assets,coverage,history-all,layout,faults 在同一冻结最终包一次182/182，含43模式×桌面/390和全部模式历史恢复；不是继承旧成绩或拼接两包。最终包额外 `npm run test:native-presets -- --mode all --base http://127.0.0.1:4382 --playwright <已有模块路径> --browser <已有Edge路径>` 为16/16，测试入口支持CLI/环境路径，不依赖旧机器calibration文件。全部实际完整命令、错误表、包及源码SHA见 `integration/verification.json`；冻结包标识 `r1-20261005-8071f8831008`，runtime manifest SHA256 `7f18a26569ee86b3e61aa5e3255ab81517cdac1421fc3fd6fa83960f55707104`。

原保护哈希不改；`source-protection-amendments.json` 仅列本包明确授权的optics-physics、galaxy-physics精确before/after及理由。检查结果为332原字节未变＋2授权科学变更，不称334原字节全等；未知条目、重复、旧hash不符、后续字节漂移仍失败，独立审查确认无静默放行。根THIRD_PARTY保持删除，许可运行源迁至 `web/observatory/sources/release-status.md` 并修复既有来源链接；旧manifest拥有且哈希精确吻合的单个退休生成文件先归档后移除，再由构建生成新路径。署名、vendor许可、三项pending和blocked_pending_licenses保持。

限定modules的premium strict仍12条历史finding，按file/rule/message对照新增0，不称clean pass；D范围另有23条原index按钮静态发现，新增0。DESIGN只补本次遮挡修复的局部所有者规则，lint0 error/0 warning（4 infos），不升级人工视觉批准。失败记录保留：A旧量化门禁、B/C旧求积结果与测试RAF观测顺序假失败、E颜色解码测试假失败、F坏单位反例均在各索引。D第一次原始baseline目录被误覆盖，已明确标注不再作before证据；另存before-source重放有独立时间/hash，不能冒充失去的原片。

六项证据入口统一在 `build/qa/science-round1-20261019/{A,BC,D,E,F}/`，总索引 `INDEX.json`，集成详情 `integration/verification.json`，独立审查 `review/review.json` 为P1=0/P2=0/P3=1（含15源hash与3段原片完整1×自然结束）。本地最终包预览 `http://127.0.0.1:4382/`，本次服务PID60124、exec session32110；启动 `node deploy/lab/web/observatory/server.mjs --port 4382`。未执行实体手机、现场投影、真实硬件长期性能、30分钟稳定性、新手访谈或教材对照；科学修复与工程通过不等于43模式科学认证或学习效果验证。本轮未部署，线上事实仍按既有DEPLOYMENT记录。


## 2026-10-17 全站成品文案整理（本地完成）

用户要求清理前端所有使用者不需要知道的描述，去除防御性、自证与审稿 demo 口吻。本次覆盖 11 工具、43 模式，修改 48 个前端源码文件：删除候选版/待试用/审校进度、来源核验日志和“没有冒充/不使用替代”等表达；模型说明改为直接描述对象、条件与读数。统一已有说明入口名称，简化加载、错误与重试提示，讲义兼容页移除维护命令。保留数据身份、单位、比例、缺测、科学纠误、太阳观测防护、来源与使用条件。C 指标明确为通量比的对数指标。未改变模型、科学数据、控制参数、模式 ID、布局与场景恢复；太阳系仅修改来源弹窗文字。

用户文案规则已补入 DESIGN.md。独立 frontend-design-review 文案审查 P1=0/P2=0；其最后三条建议也已处理：日地月故障提示改为可理解的加载/画面中断说明，自转周期明确为相对远星的周期。本次为文案整理，不升级既有视觉冻结、科学审校或实体设备验收身份。

实际验证与本机证据统一存于 `build/qa/frontend-copy-20261017/`，汇总 `verification.json`，外部源码备份 `D:/Users/ZJUAAA/2026/AstronomyLab-backups/frontend-copy-20261017/`。修改前工作区 clean。`npm run check` 最终通过 97 文件语法、48 Node 测试及 34 纯 Imaging 检查；`npm run build:deploy` 与最终 QA 包均为 244 资源、232 文件；`npm run check:boundaries` 334 保护/232 包文件通过，source drift=0、禁止资源=0。`npx --offline -p @google/design.md designmd lint DESIGN.md` 0 errors/0 warnings。premium 严格静态审计复用既有 canonical config，仍为 12 条历史发现，与 10-13 基线按 file/rule/message 对比新增 0；不称 clean pass。首次 Conda 捕获输出出现 GBK 编码错误，改用 `conda run --no-capture-output -n dl_env python -X utf8 ...`，未改环境或依赖。Git 行尾按既有 CRLF 用命令级 `core.whitespace=...cr-at-eol` 核查通过，未改全局配置。

完整候选包浏览器运行 `node tests/standalone-refactor.mjs --base http://127.0.0.1:4198 --out build/qa/frontend-copy-20261017/browser --package build/qa/frontend-copy-20261017/package --part assets,coverage,history-all,layout,faults --playwright C:/Users/30674/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright --browser "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"` 首次 178/182：43 模式桌面/390px操作、全部历史恢复及布局通过；三项故障断言仍匹配旧文案，导致月球贴图失败测试未走到解除路由并连带影响随后上下文恢复。保留失败日志。测试改为检查新提示、图像隐藏、重试入口与原恢复行为，未放宽模型断言。最后三项源码差异仅日地月故障文案与太阳系来源措辞；最终包 `package-final` 在 4199 对 assets/faults 重跑 25/25，含真实 context loss 与解除故障后的恢复。合并同名最终结果为 182/182；这是完整候选运行加最终包分段复核，**不称同一最终包单次完整 182**。

专项 `node tests/galaxy-cmb-ui.mjs --base http://127.0.0.1:4197 --before http://127.0.0.1:4198 --out build/qa/frontend-copy-20261017/cmb-final` 15/15；`node tests/galaxy-spectrum-ui.mjs --base http://127.0.0.1:4197 --before http://127.0.0.1:4198 --out build/qa/frontend-copy-20261017/spectrum-pass` 13/13，含待加载、404、空表、真实恢复与科学像素对照。早期专项按历史布局直接点击已收起控件、空表误当 alert 的测试失败保留；改为打开现有模式菜单/教学条件，并分别检查空状态 status 与失败 alert。基线为本次候选包，未声称重新核验旧视觉 checkpoint。实际查看桌面/窄屏及故障截图；本次没有运动/布局改动，不重新录制运动验收。

本地预览 `http://127.0.0.1:4197/`。本次未提交、推送或连接生产服务器，线上仍为 10-13 发布状态；本地 deploy/lab 仅由构建命令更新。许可及 blocked_pending_licenses 保持，原始课程、科学数据、素材、视频和历史证据不改。

**当前维护位置（2026-10-13）：唯一项目/Git根，源码web/。用户明确授权提交并推送当前状态，连接本项目生产服务器完成部署；此授权覆盖早期不提交/不推送/不部署限制，不改变科学、状态与其他项目保护边界。第10批分级/着陆与圭表已自动冻结，其余四项保留停止状态，失败试验已撤回。自动冻结不推断成人工批准。发布证据集中build/qa/release-20261013，既有UI证据索引保持。**

## 2026-10-13 发布准备

**发布结果：已推送并上线。代码提交38c7a48678e913a32fc0ba942ec3b64db6e6f729，后续回执仅维护文档。最终同包本地完整182/182，生产Node22.22.1的97语法/48Node/34Imaging及256公开保护、232包哈希通过；生产244资源HTTP SHA全一致，公网真实操作4/4、异常0。本机334完整保护再次通过。仅重启AstronomyLab，其他站点PID及Nginx配置核对保持；备份与回滚见docs/DEPLOYMENT.md。第三方pending、自动冻结/人工批准身份、4停止项不升级。证据build/qa/release-20261013/INDEX.json，完整与失败运行分别保留，不推断远端完整浏览器通过。**

从原普通HEAD `1e8a77642b489c990e917a4791c0eb83851fadd1` 整理当前R1、批准样板及分批UI源码，保留原历史。生成deploy/lab（232文件、244资源），97运行文件语法、48Node测试及34纯Imaging检查通过；334保护、包哈希、source drift0及禁止资源0通过。Git可见806文件扫描无私钥/token特征、无私有路径和超过95MiB文件；本机证据、设计调研截图、原始科学档案与教师资料不上传。第三方pending与blocked_pending_licenses不因用户发布授权改成许可通过。

生产部署前原仓库clean、HEAD仍为旧基线，实际Node22.22.1；旧工作树及Git bundle已备份于`/srv/data/astronomy-lab/release-20261013/`。独立候选端口4181实际核对232包文件及244资源哈希零失败；仅AstronomyLab待更新，不改Nginx或其他PM2进程。完整Node22服务浏览器回归和最终上线结果以本节后续发布记录及本机证据为准，准备不代表已部署。

首次公开源码归档核查暴露旧保护子集含21个内部QA文件（浏览器/数学检查、探针图、文章AST及contact），这些文件按原规则不公开。保留失败归档与原277清单；明确公开子集为256项，21项原路径/哈希记录为excludedLocalEvidence，并实际核对本机字节未变、不是任何运行依赖。完整本机334保护范围不变，不删除科学数据或放宽数值断言。远端首次完整浏览器运行的244 HTTP字节核对通过，太阳系大资源默认30秒load超时保留；同包改用本地服务完成浏览器全回归，远端Node22源码、HTTP与公网实际操作分别验收，不称远端完整浏览器运行通过。

## 2026-10-13 持续推进：第10批与历史停止项

分级checkpoint `fe8bef50a4267a4cffe783f5ca6f7a273d65b44e`，private ref `refs/checkpoints/orbits-staging-ui-before-20261013`，普通HEAD/index保持。原分级模型、原生输入、SVG路径与曲线单位不改，局部呈现把同刻Δv/质量关系释放为主体，预算与条件按需。初轮独立critic指出从过程进入transfer后原导航被旧owner晚归还，已调整呈现归还先于接收；必须验证可见菜单往返，不能只断言mode值。另发现原transfer适配器在非transfer首帧回调重建过程、覆盖恢复后的时间/速率，已限定该呈现回调只作用transfer。未改科学或experiment-state。失败证据与后续实际回归分轮保存，不隐去原始问题。

历史停止项只读预审 `build/qa/autonomous-20261013/remaining-contract-preflight.json`：sky/measure选择标记、S2首帧布局可尝试局部呈现修复；orbit/Jupiter精确预设须保持公开捕获精度及原键盘步长，不能简单step=any或放宽科学断言；sky/stars派生参数和进度恢复存在状态所有者疑问，继续保持停止条件。此预审不代表这些项已经修好。

第10批已自动冻结：staging独立第二轮0/0/1、15专项、182完整，原片16.08秒；landing独立首轮0/0/1、16专项、182完整，原片16.8秒，checkpoint `b03bf405caf1d7d1a7cef0206e91809ffb1f8253`。各份`build/qa/ui-batch10/{staging,landing}/INDEX.json`保存最终截图/原片/critic/测试/源码快照。分级保留320px示意级名小，着陆保留速度零线未额外标0的P3，不继续微调。着陆新增呈现后分级9组状态/布局/同尺寸截图像素exact；334保护与230包文件检查、source drift0、96语法/48Node/34纯Imaging通过。premium仍12历史静态发现、新呈现0，lint0error/0warning；普通HEAD/index不变、不推送部署。自动冻结不标作人工批准。着陆初始预设焦点生命周期和测试用滑杆代精确事件终点的失败均保留：焦点现在原重建后归摘要，精确触地用原event入口验证，不放宽模型断言。

圭表sky/measure第三轮独立0/0/1已按持续授权自动冻结（非人工批准），checkpoint d2e3f7d8b821ec3990d877128e32cedb20882dfa。13专项、4周期恢复、4暂停倍率即时语义、16天空邻接状态/布局/像素exact、182完整回归通过，334保护/232包文件/source drift0；97语法/48Node/34纯Imaging通过。15最终截图与22.56秒原片、critic自然播放、源码快照见build/qa/autonomous-20261013/sky-measure/INDEX.json。局部selected优先级修复及时间文字事件同步均不改科学/捕获器。首两轮时间语义失败保留，第三轮P3周期菜单不自动关闭接受，不再polish。premium以显式原canonical config扫描仍12历史发现；初始无config扫到旧产物的失败日志保留，不当作新UI问题或clean pass。

剩余门禁（2026-10-13）：解析轨道checkpoint 4b0fdf785ea288f07dc0348f18930a8b8e6f9af8，实测Edge原native range即使step=any、六种赋值途径仍缩短精确圆速/逃逸速；13项精度预检3pass/10fail，试验源已exact撤回。Jupiter checkpoint aa2cb7c4f3cfbef39abcf0b8ef9ace7e705757d7，原io10 463980.00000000006被range100保存为464000；1/3门禁，不新增UI。禁止改预设/分类容差/共享捕获器或hidden精确proxy；独立calibration-critic已确认STOP与回滚。

S2 checkpoint 97aa98e79194854eaf3a3bb38c12694c66e6c0dd，10核心专项通过、原六参数/质量/模型未改；先完成目的布局再画曲线可消除二维首帧错误，但展开轨道后手机返回Jupiter发生原布局回归，390px host331而原352。flex align-start与canvas固有比例耦合为当前假说，并未独立证明唯一机制或宣称未来局部修复不可能；同步/五RAF二维曲线与模型通过，失败发生在后续完整PNG，DOM探针另证最终尺寸差异。局部current-host取景不能消除此相邻回归，完整撤回measure.js到checkpoint及两个确认新UI资产，不改共享scene/plot/模型，不把核心测试Pass当视觉冻结。失败源/逐帧/图像/DOM探针留于measure-s2/round1，最终独立停止核对随status索引保存。sky/stars继续保留原progress/派生blend/offset/motion状态所有者疑问，无实现。

最终244运行资源与圭表已通过182完整回归的包SHA全部一致，最终npm check与334保护/232包文件/source drift0再次通过；普通HEAD/index未动、不推送部署。最终索引build/qa/autonomous-20261013/INDEX.json包含3自动冻结、4停止、全部checkpoint/证据和真实限制；自动冻结仍非人工批准。

## 2026-10-11 银河内外：critic通过，等待人工验收

checkpoint `refs/checkpoints/galaxy-galaxy-ui-before-20261011` / `4de637b0037f0fffef1b292b654572cc1893af0e`，普通 HEAD/index 不变。仅局部呈现 `galaxy-galaxy-ui.js/.css` 借用原 DOM；原点云、相机、解析积分、图版、共享 renderer、模式/恢复及整模块复位所有者不改。主体为当前观察位置的教学银河结构；曲线主动展开后与原 l/b 操作相邻，真实 Gaia/2MASS 图版作为独立结构参照按需。三种身份、模型观察者、单位与当前消光波段明确；无永久等权多窗口，无新时间轴/图版数值取样。证据集中 `build/qa/galaxy-galaxy/` 与 `output/galaxy-galaxy/`，独立critic及实际回归以最终 INDEX 为准。下一项授权不推断为 CMB 的人工冻结。

首轮独立 Pass：P1=0/P2=0/P3=2；保留320px盘外外围标签裁边、画布拖动后BODY焦点下Escape未收起条件（可见关闭有效），不继续微调。专项18/18，连续原生range拖动及同尺寸曲线像素/几何buffer精确对照通过；相邻CMB/FIRAS四对默认与操作后state/layout/owners/2D pixels一致，三次模式往返通过。`node tests/standalone-refactor.mjs --base http://127.0.0.1:4359 --out build/qa/galaxy-galaxy/round1/full --package build/qa/galaxy-galaxy/round1/package --part assets,coverage,history-all,layout,faults --playwright C:/Users/30674/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright --browser "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"` 单次完整182/182；95语法/48Node/34纯Imaging、334保护/228包文件及drift0通过。237原运行资源不变，六hook反转后原模块全文exact；788项checkpoint树、46FIRAS与81Eclipse冻结副本、CMB候选源码/媒体保持。premium仍12条未改历史静态发现、本页新增0；Design lint0error/0warning。早期QA历史/异步轮询设置失败与首次拖动证据保留，呈现DOM移动现幂等，未改科学或状态逻辑。22图和21.24秒13操作未裁原片由独立critic从0、1×自然ended验看，raw/final同SHA。最终索引 `build/qa/galaxy-galaxy/INDEX.json`；软件Edge/SwiftShader与模拟viewport验收，不称实体硬件或真人科学审校。

## 2026-10-11 全天方向图：第二轮 critic 通过，等待人工批准

checkpoint `refs/checkpoints/galaxy-cmb-ui-before-20261011` / `5c84a62964df612cf165ecf48907b9262c481990`，普通 HEAD/index 保持不变。原 Planck 2013 完整等距柱状 JPEG 为主体；原 l/b、点选和键盘贴图，小球面仅同一方向的投影参照。JPEG 不读取 µK、球面没有深度意义；原整模块复位仍返回银河盘外俯瞰。坐标条件、来源及嵌套模式按需。Planck 等待/失败同时隐藏图和无纹理球面；FIRAS 失败不阻断方向图。

独立第二轮 Pass：P1=0/P2=0/P3=1，已停止视觉修改。第一轮小球面金点难辨的 P2，只通过原 marker/camera 投影上的 14px 高对比轮廓解决；原 mesh/position、UV、相机、科学绘图与共享 renderer 不改。保留 P3：球面拖动后焦点落 BODY 时 Escape 不收起披露，可见关闭按钮仍一击关闭并返回 summary，科学状态不变。该取舍尚待本页人工验收，不能宣称人工批准。

专项 15/15，同一最终版本完整回归 182/182；94 文件语法、48 Node 测试及 34 纯 Imaging 检查通过。保护 334/334、包 226 文件、238 资源，source drift=0。原图四组同尺寸像素/UV/marker/camera 一致；已批准平均谱与保护银河的桌面/手机默认及操作四对 state/layout/owners/2D pixels 一致，三次原生模式往返通过。七处呈现 hook 逆向移除后银河模块全文与 checkpoint 一致，其余 235 原运行资源不变；FIRAS 46 冻结副本及局部源码/媒体保持原字节。premium 严格静态审计仍有 12 项未改历史文件发现，本页新增 0；Design lint 0 error/0 warning。

证据 `build/qa/galaxy-cmb/INDEX.json`；最终 14 图和 18.12 秒连续原片 `output/galaxy-cmb/round2/`。录屏从 0、1×自然播放至结束，raw 与交付副本同 SHA。本页仅通过软件功能与独立视觉验收，未推断实体硬件或真人科学审校；未进入 galaxy/galaxy，不推送、不部署。

## 2026-10-11 FIRAS人工冻结；仅继续全天方向图

用户人工批准平均谱并接受P3，46份源码/媒体/审稿/测试按SHA冻结，checkpoint b03fab8978c70153c10205227d28924e8baf9996。冻结索引build/qa/approved-galaxy-cmb-spectrum-freeze/freeze.json；下一项仅galaxy/cmb，真实Planck全天JPEG主体、球面仅方向投影参照，沿用状态/入口/reset。

## 2026-10-11 FIRAS平均谱单项最终候选（历史）

checkpoint `refs/checkpoints/galaxy-cmb-spectrum-ui-before-20261011` / `b03fab8978c70153c10205227d28924e8baf9996`，普通HEAD/index不变。仅本谱页按R类实现主谱/必要残差同轴纵向主体；原频率点选/键盘/range近图，教学ΔT、预设、来源及嵌套模式按需，方向球面不常驻。FIRAS pending/404/空表均明确，不用黑体替代；原整模块reset仍回Galaxy，同历史项恢复实际模式。galaxy.js仅六个命名呈现hook，反转后原模块全文exact；233其余原运行资源不变、81 Eclipse冻结副本exact。新的JS/CSS只拥有谱页呈现，不改data/models/shared renderer/state/mode入口。

实际执行：`node tests/galaxy-spectrum-ui.mjs --out build/qa/galaxy-cmb-spectrum/round1/targeted-final` 13/13，三原谱图四组参数逐像素exact；Galaxy/CMB桌面手机默认与操作后state/layout/owner/2D pixels四对exact，三个循环切换及history、复位、FIRAS故障与恢复通过。首跑专项9/13失败保留：测试错误假设同URL会覆盖reset后的旧历史项，后续用Lab目录的新入口；readiness轮询加optional chaining，未改产品状态/断言/超时。before证据服务初次缺compat依赖，只补复制原compat后4354启动，未安装或改环境。

`node tools/build-lab.mjs --out build/qa/galaxy-cmb-spectrum/round1/package` 236资源/224文件；`node tests/standalone-refactor.mjs --base http://127.0.0.1:4355 --out build/qa/galaxy-cmb-spectrum/round1/full --package build/qa/galaxy-cmb-spectrum/round1/package --part assets,coverage,history-all,layout,faults --playwright C:/Users/30674/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright --browser "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"` 单次完整182/182，只为新披露位置增加展开原galaxy-head的测试导航。npm check：93语法/48Node/34Imaging；boundary：334保护/224包、drift0；Design lint：0error/0warning。strict premium仍12条未改历史模块的原生按钮静态提示，本页0新增，不称全局审计绿。

独立frontend-design-review首轮Pass 0/0/1，停止视觉修改；唯一P3是600高桌面需自然滚动完整读残差/±1σ，不压缩主体。13图和17.4秒未裁原片，critic从0以1×到自然ended，raw/final同SHA。最终索引 `build/qa/galaxy-cmb-spectrum/INDEX.json`，媒体 `output/galaxy-cmb-spectrum/round1/`，预览4355。尚未人工批准；软件Edge/SwiftShader与模拟viewport，不是实体硬件或真人科学审校。未实施cmb/galaxy，无普通提交、推送或部署。

## 2026-10-11 第9批只读专项预审

实际查看三入口桌面1440×900与手机390×844、FIRAS残差/教学谱差展开、银河积分与调查对照；沿用顺序cmb-spectrum→cmb→galaxy，但三者分别为R谱/残差、I方向图/投影解释、Mixed空间模型/积分/独立图版，不统一布局。当前教学ΔT归零主FIRAS谱画布字节相同，disk图层开关不改固定积分。既有状态限制：点选−66.192°/25.242°刷新按原range恢复−66°/25°；调查比较为临时态，刷新关闭；原reset返回galaxy，入口URL保留原query属于历史项机制，不能擅自重写状态契约。受控资源404复现FIRAS错误未呈现、Planck错误位于方向图容器，谱页不可见；Promise完成不等于数据成功。证据`build/qa/galaxy-batch9-preflight/observations.json`、`risk-probes.json`、`verification.json`，故障仅浏览器拦截，未改实际数据。234运行资源和81冻结文件哈希核对一致，普通HEAD/index保持；没有UI、模型、shared renderer、状态或入口改动。未进入第10批。

## 2026-10-11 Eclipse第三轮验收材料；Collapse人工冻结（历史）

用户批准collapse并接受旧任务提示语P3，52份源码/截图/录屏/测试/审稿原字节冻结，见`build/qa/approved-stars-collapse-freeze/freeze.json`。仅继续授权eclipse：开工前alternate-index checkpoint `d15d492b5f0e80de91f9e585e92bb30c542d2f87`（`refs/checkpoints/earth-moon-eclipse-ui-before-20261010`），普通HEAD/index保持。太阳遮挡圆面或地心月面为主体，小三体几何为必要参照，影锥按需；原参数和状态所有者不变。app.js仅一个呈现分支把视场外文字与角尺度分开，反转后原科学主体字节exact。第三轮核心原时间控制靠近观测，五条件单项披露，原剖面横向滚动保留18px标注；独立0/0/2后停止视觉修改，保留同比例实体极小与手机紧凑几何标签局部贴近P3，未人工批准。

实际命令与证据：`node tests/moon-eclipse-ui.mjs --out build/qa/earth-moon-eclipse/round3/check-final` 17/17；`node tools/build-lab.mjs --out build/qa/earth-moon-eclipse/round3/package` 234资源/222文件；`node tests/standalone-refactor.mjs --base http://127.0.0.1:4353 --out build/qa/earth-moon-eclipse/round3/full-final --package build/qa/earth-moon-eclipse/round3/package --part assets,coverage,history-all,layout,faults --playwright C:/Users/30674/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright --browser "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"` 同一锁定源码完整182/182。`npm run check` 92语法/48Node/34Imaging，原地月state8、browser14、phase4、lifecycle7，6邻接状态/布局/owner/画布精确对照；334保护/222包/drift0。原测试完整首跑180/182的两失败是旧脚本查找常驻说明，仅增加展开原说明/关闭两条测试导航，不改断言、超时或产品源码；失败保留。R2并发Conda激活临时文件冲突保留，R3串行dl_env审计完成，仍23旧静态原生button finding、本页0新增，不称全局审计绿。Design lint0error/0warning/4info。

25图、24步25.92秒未裁原片由独立critic从0以1×播放到自然ended，raw/final同SHA；776项checkpoint树及已冻结媒体保护核对通过。索引`build/qa/earth-moon-eclipse/INDEX.json`、`output/earth-moon-eclipse/round3/INDEX.md`，正式源码本地预览4353。证据为软件Edge WebGL与模拟viewport，不是实体硬件或真人科学审校。未进入第9批，无普通提交、推送、部署。

## 2026-10-11 Eclipse人工冻结；第9批仅预审

用户在最终验收材料后指示冻结当前版本，保留两项P3，不继续修改。81份源码、原图原片、critic与测试按SHA256核对后冻结；checkpoint d15d492b5f0e80de91f9e585e92bb30c542d2f87，索引build/qa/approved-earth-moon-eclipse-freeze/freeze.json。仅授权分析galaxy/cmb-spectrum、cmb、galaxy的数据身份、任务与风险，不实施、不进入第10批。

执行依据为 `docs/开发指导/10_5重构/AstronomyLab-Codex-Refactoring-Handbook-2026-10-05.md` 和后续用户指令。R1本地工程验收完成；2026-10-06 负责人已人工确认正式日地月与通过的 prototype 一致，冻结为第一个已人工批准的 UI 样板，仅 `earth-moon / phase`。Imaging 也已人工批准并冻结为第二样板，现按明确授权原样迁移正式源码。HR 第二轮随后独立通过并获人工批准，接受两项 P3，冻结为第三样板。其余页面视觉试用、真人科学审校与实体设备验收仍待完成，不推断批准。不推送、不部署、不修改其他站点。

## 2026-10-07 Transit等待人工批准

Checkpoint `a6e95ba681ad5df12a940624fa03d67d49cfb256`（独立ref，普通HEAD/index不变）。原二维遮挡圆盘主体，原位置—归一化通量曲线同位参照；位置主控近观察，r/b、独立轨道示意及完整解释按需。明确x/R★不是时间、0.30R★/秒仅教学扫描、均匀圆盘非观测拟合。首轮独立Pass P1=0/P2=0/P3=1，保留600px高扫描说明约20px自然滚动，停止微调；不是人工批准。16专项、182全量、8组Venus/Mars原场景/curve pixels+状态/布局/owner精确对照、6圆盘通量/曲线同值原像素通过；88语法/48Node/34Imaging、334保护/214包/drift0通过。DESIGN lint0error/0warning/4info；premium仍12旧静态finding、本页0新增，非全局绿。13图与17.88秒未裁原片由独立NativeEdge从0以1×自然ended验看，raw/final同SHA。7具名呈现hooks反转后科学主体字节exact；相机FOV仅本页按原值域完整取景，退出归还；科学模型/shared renderer/state owner及已冻结adapter/媒体不改。早期QA把较早snapshot误作运行中pagehide最终snapshot已改验证，失败保留；无科学修复。索引`build/qa/alignments-transit/INDEX.json`，媒体`output/alignments-transit/round1/`，源码预览4345。未进入pulsar，无普通提交/推送/部署。

## 2026-10-07 Mars人工冻结；Transit授权内执行

用户明确批准Mars，接受低高度桌面时间控件少量滚动，不继续修改。31源码/测试/critic/原图原片文件按原字节冻结至`output/approved-alignments-mars-freeze/`，清单`build/qa/approved-alignments-mars-freeze/freeze.json`，checkpoint `b1ef6314afd39a02d3658acdf0b59ca52f4ddc7b`。覆盖下方历史等待批准状态。Transit开工前独立ref checkpoint `a6e95ba681ad5df12a940624fa03d67d49cfb256`，普通HEAD/index保持；仅授权本项，无pulsar实现。

## 2026-10-07 Imaging冻结；Mars等待人工批准（历史）

用户明确批准optics/imaging，接受嵌套说明首次Escape的局部P3。源码、原图/原片、critic与测试按原字节冻结，见`build/qa/approved-optics-imaging-freeze/freeze.json`；checkpoint `d668b226e4a59ec0d8de85beb9d8063366d3d1c1`，本轮15冻结源码/媒体文件hash复核一致。覆盖下方历史等待批准状态。

Mars checkpoint `b1ef6314afd39a02d3658acdf0b59ca52f4ddc7b`（独立ref，普通HEAD/index不变）。原空间运动为主，原地心方向图为必要参照；顺行箭头取原轨道点，视逆行不表示轨道反转。默认受光圆面隐藏，原时间/轨迹/当前点同步。独立Pass P1=0/P2=0/P3=1，保留600px高桌面约23px自然滚动；非人工批准，不继续微调。14专项、182全量、8组Venus/transit实际3D/二维像素与科学状态/布局精确对照、3预设原图像素一致；87语法/48Node/34Imaging、334保护/212包/drift0通过。premium仍12原静态finding，本页0新增。14图与27.56秒未裁原片经独立1×自然ended验看；短索引`build/qa/alignments-mars/INDEX.json`，媒体`output/alignments-mars/round1/`，源码预览4343。剥离8具名呈现hook后科学主体字节一致，模型/shared renderer/state owner未改。未进入其他Mixed实现，未提交/推送/部署。

## 2026-10-07 Mixed首项 optics/imaging 等待人工批准

Checkpoint `d668b226e4a59ec0d8de85beb9d8063366d3d1c1`（独立ref，普通HEAD/index不变）。二维接收结果主体，近旁焦面示意与原离焦range；完整光路/参数/剖面按需。独立Pass 0/0/1，保留隐藏内层说明消费首次Escape的P3，停止微调。13专项、182全量、8组sampling/resolution实际像素/状态/布局精确对照，86语法/48Node/34Imaging与334保护通过；premium原12静态finding保留，本页0新增。10原图、26.44秒未裁片已独立1×完整验看。短索引 `build/qa/optics-imaging/INDEX.json`，最终证据 `round1/verification.json`，媒体 `output/optics-imaging/round1/`；源码预览4340。科学主体剥离9具名呈现接入后字节一致，其他Mixed及所有模型/shared renderer不改，未人工批准/推送/部署。

## 2026-10-07 第2–6批处理结束，停止等待人工批次验收

按原18项顺序已逐项处理，**13项critic通过等待批次人工批准，5项停止/跳过**；不是18项全通过，且不推断人工批准。第2批4通过，第3批3通过，第4批3通过，第5批2通过2停止，第6批1通过3停止。保留10P3，不再视觉微调，未进入第7批Mixed，不改太阳系，不推送/部署。第一批motion/sampling/venus已根据明确人工批准冻结。

逐模式checkpoint、最终critic/P3、全套截图与未裁完整录屏索引见`build/qa/ui-batches2-6/BATCHES-2-6-INDEX.md`（机器记录`FINAL-INDEX.json`，每项MEDIA-INDEX.md）。13最终片均有同SHA原native raw，所有13通过项局部源码/媒体/最终审稿哈希锁定；Calendar审稿收尾比原stamp晚18秒，本轮仅更新最终报告hash记录，无UI改变。Transfer首轮0/0/1、12专项12邻接；同time点火分支、focus鼠标按下移动目标问题在本地呈现修好，P3保留。不将服务端软件WebGL/模拟viewport称为实体设备验收。

最终全量`final-full/assets,coverage,history-all,layout,faults-checks.json` **182/182**，base4318/独立包220resources208files；原43模式桌面手机/每模式refresh/back/forward/故障与布局。85运行语法、48Node、34Imaging纯测试、8Moon状态通过；原Imaging正式专项27再次通过。最终邻接HR12、已批准phase8、sampling6、calendar/day/path各6精确一致，Transfer12专项；S2撤回后原measure三兄弟桌面/手机直达与after-s212严格首次pixels/backing/科学/rect/owner一致。`final-boundaries.json`334保护/208包文件0失败drift0；`final-source-proof.json`194原资源186完全未改，8具名呈现入口/26局部UI新增，模型/科学数据/shared renderer/public恢复/太阳系未改。普通HEAD仍1e8a77642b489c990e917a4791c0eb83851fadd1，index SHA07d493…16c1，18checkpoint refs均有效。

停止四个原恢复问题：sky/measure年内选择捕获day、sky/stars derived progress/motion回放、orbits/orbit临界速度步长取整改分类、measure/jupiter10%预设取整改质量。S2为新UI首次窄屏handoff画布尺寸回归，严格试验发现后撤回接入与2资产，完整失败候选/回归及恢复证据保留，criticStopped非Pass。四原问题补原页实际reload未裁复现片；S2补失败包与撤回源码原生窄屏对照片，全部不得当作改造通过媒体。模型/state owner不越权修。常规182项不覆盖这些精确preset/派生回放特殊case，所以仍明确5停止。

Design Direction无新视觉方向调整证据；新增验收注意：精确预设与native步长精度、derived state回放身份、首次canvas backingstore/CSS尺寸。不是统一组件重构授权。premium strict仍exit1/12旧委托literal按钮扫描finding、unresolved0/本轮局部UI0，不冒称全绿、不改原页面刷审计；DESIGN lint0error0warning4intentional info，原生Date owner补进解析器读取的首张canonical table仅文档。critic误建URL编码兄弟目录删除已被automatic review拒绝（blocked by policy），保留未绕过；plan.cleanup记录。最终可看源码服务4318；后续仅按用户批准再处理停止项/新批次，不自动发布。

## 2026-10-07 S2 邻接停止并撤回

`measure/s2` checkpoint `450701702ef76af7e2953fd890635a785115762b`。R类候选自身10专项与measure常规12邻接通过，但严格原包对照第12项发现390px S2→distance首次canvas backing原374×340、候选354×250，DOM均374×340；state/result/rect/owner相同，原p往返后pixels才exact，不能以此掩盖首次绘图回归。`round1/adjacent-exact`与`adjacent-verified`保留失败、完整两次值和截图；初步QA note曾颠倒baseline/candidate顺序，已在最终checks明确更正。按用户停止条件直接撤回唯一measure hooks与2本项资产，measure.js raw hash与before-module完全一致，不修共享plot、不改scientific/restore。候选12截图与完整视频保留为失败候选，不计最终Pass；critic中止，无人工批准。第2–6批18项现已逐项处理，13critic通过等待批次人工、5停止项；只做最终恢复验证与汇总，不进入第7批。

## 2026-10-07 木星测量停止项

`measure/jupiter` checkpoint `1267459d9cc755f0e4756f71fbbaffef1e944779`，实施前公开snapshot预检发现原io10预设a=463980.00000000006 km被原range步长100捕获为464000 km，reload质量也改变。4335原包与4316源码均复现，证据`measure-jupiter/preset-restore.json`。不做本项UI接入，不修改科学模型或snapshot owner，未提交critic。S2原完整参数与10%距离预设8800 pc恢复精确通过，继续最后S2；不进入第7批。

## 2026-10-07 解析轨道停止项

`orbits/orbit` checkpoint `d84612152942bedf7fd89c534f7690d3e6e54ba1`，原包4335与候选4315分别圆/临界抛物线/双曲线公开capture刷新实测：精确vc7.7884879234918465捕获7.788，圆→束缚椭圆；escape11.014585251781234捕获11.015，临界抛物线→双曲线；普通双曲线类别保持。证据`orbits-orbit/round1/restore-preflight.json`与六失败场景截图。属于原恢复精度/分类身份异常，不能把原48Node样本numeric回放通过称为临界预设通过。按停止条件撤回本项两个局部资产及conics接入，源逐字节恢复before-module；候选包/原图/失败留作证据，无模型/快照owner修改，未提交critic。风险限conic:speed原range .001，转移使用不同state/controls和Hohmann不依赖此preset精度，继续orbits/transfer；原所有Mixed与太阳系不改。
## 2026-10-07 第5批结束：星表恢复停止项

`sky/stars` checkpoint `64f645ddd64f07b13a6ad81f251ef65794d5d381`，只读预检即停止，没有实施本项UI。原4335与当前4314均四case复现：group/selected和manual offset恢复exact；两步progress0.75快照刷新变0.751；原motion checkbox开启使blend1/offset0但progress0，刷新后progress0.55。真实公开capture前后保存`sky-stars/preflight.json`，没有以公差掩盖实质0→0.55变化，没有改原state/模型。风险位于原state.tab=stars的blend/offset/motion派生进度回放，和测影另一局部问题分别单列；其余sky/共享renderer未回归，6模式邻接18与已完成sky三页面exact各6通过。第5批：sky与precession critic通过等待人工批准；measure与stars停止跳过，非critic通过。按用户无共享风险继续独立第6批orbits/orbit→transfer→measure/jupiter→s2，停止后不进入第7批。
## 2026-10-07 岁差完成

`sky/precession` 首轮Pass 0/0/1，checkpoint `b3471f8fad2d9daa04f8fcc00440f4c082995104`，停止视觉等待批次人工批准。完整蓝轴/天赤道与固定黄道方向主体，原spinMode/epoch时钟近图，原四预设/投影/三读数对照/所有说明按需。原共享motionRenderer及13px投影文字、epochPhysics、固定目录/data/plot/history不改，模块仅具名呈现hooks且body exact。10专项+18sky邻接+day/calendar/path各6实际pixel/state/rect/label/owner精确一致；84语法48Node34Imaging、334保护206包drift0。12原图+18.36秒完整原片由独立NativeEdge从0以1×自然ended、served/final/raw SHA一致，保留P3低高长边缘引线不微调。原QA数字CSS属性引号错误/PowerShell转义已改测试脚本，不改科学层；证据`sky-precession/round1/verification.json`。当前进入`sky/stars`先核对公开状态/对象身份，测影停止问题没有扩写为已修复。
## 2026-10-07 测影停止与跳过

`sky/measure` checkpoint `8bb4c81edf4fdf979236ca11b776ca45cce9be75`，未提交critic。原year周期按钮与day按钮同时aria-pressed=true，使原公开capture取first day；year日序125刷新变day/hour12。R2只读原包4335与本项候选4313逐条复现完全相同，证据`sky-measure/round1/restore-reproduction.json`及原失败截图。按用户URL/history/状态所有者停止条件，本项接入已撤回：sky.js逐字节恢复本项before，两局部新资产撤回且候选package仍保留；stopped-package恢复216原资源。没有修原sync/capture/科学逻辑，没有为绕过契约把年内功能隐藏。风险限定原measure/shadow双属性按钮与shadowCycle读取；其他模式controls重建后没有data-shadow-cycle，恢复路径与旧owner相同，继续前做六sky回归。最终记录为跳过，非critic通过/人工批准。继续独立`sky/precession`，checkpoint `b3471f8fad2d9daa04f8fcc00440f4c082995104`。
## 2026-10-07 第5批太阳路径完成

`sky/sky` 第二轮独立Pass，P1=0/P2=0/P3=1，停视觉等待批次人工批准；checkpoint `5f4f05694900bb2f6d06c9e77b954a0f6d3b95c7`。R1两P2仅以本页原sprite世界点投影13px文字与非默认ε/参照条件摘要修复；坐标/相机/共享renderer不改。14专项、calendar/day各6精确状态/实际像素/矩形/归属、sky18direct/history、83语法48Node34Imaging、334保护204包drift0通过。13原图、30.12秒完整原片独立NativeEdge从0以1×自然ended，served/final/raw同SHA；保留P3仅低高度长边缘引线交叉，不刷零。证据`sky-sky/round2/verification.json`。空SVG占位测试误判与closed条件下look可见性步骤错误已修QA，旧失败保留。当前继续`sky/measure`，只做本项呈现；真实正式owner初始化后λ90.141619源于原2026-06-21公式，未把裸defaults误当页面状态。
## 2026-10-07 第4批完成，进入第5批

`sky/day` 首轮独立Pass，P1=0/P2=0/P3=1，停止视觉修改，等待批次人工批准；checkpoint `a297c40ee6234499319d80f77ce45cf41cbd3fee`。原地球、太阳、远星与标记主体提前，差角辅助×40明确，原恒星日自动停及继续约236秒、原restart/fullreset/原三读数对照语义保持。11专项、6sky直达与history18组、历法直接/换规则/day往返6组精确像素/状态/矩形/归属、82语法/48Node+34Imaging、334保护/202包/drift0通过。11原图及18.44秒完整原片经独立CUA4420原速自然ended，served/final/raw一致；证据`sky-day/round1/verification.json`。保留P3仅次级北极俯视旧sprites叠字，不改共享renderer清零。683×450焦点检查、标签旧样式scope、guide渐进披露QA和before图OUT误写已修，失败与原片均保留/记录BRIEF；科学body剔除明确呈现hook后逐字节一致。第4批三项全部critic通过，尚未人工批准；按既定顺序进入第5批`sky/sky`。

## 2026-10-07 第4批两种周期最终更新

`earth-moon/period` 首轮独立Pass，P1=0/P2=0/P3=1，停止视觉修改，等待批次人工批准；checkpoint `63a0ee82198638cd70d98a66d43755e47e792b64`。完整原二维日心/地心方向图成为主体，同刻月面参照按需，原两个端点按钮与暂停仍由app处理；仅index接线及两个本项UI资产新增，原app/physics/drawAnnual/scene-state/phase/spin字节不变。9专项、14原Moon、12四模式direct/history、4批准phase专项及直接8/经period往返8组冻结phase状态/像素/矩形/控件归属一致通过；81语法、48Node+34Imaging、334保护/200包/drift0。12截图和23.56秒完整原片由独立NativeEdge新4418播放器原速自然ended且served/final/raw哈希一致，证据`round1/verification.json`与`output/ui-batches2-6/earth-moon-period/round1/`。P3仅600高完整时钟自然滚动，完整方向图与顺次端点仍可用，不压缩主体。原模型明确进度是导航坐标而非精确相位事件，未重置载入几何参数或改科学计算。当前顺序进入`sky/day`，checkpoint `a297c40ee6234499319d80f77ce45cf41cbd3fee`；尚在独立审稿，未人工批准。

## 2026-10-07 第4批自转最终更新

earth-moon/spin 第二轮独立Pass，P1=0/P2=0/P3=1，停止视觉修改，critic通过等待批次人工批准。checkpoint e7b4a6b8d5f74ae6df54912d32ef36ec8bc13003；证据build/qa/ui-batches2-6/earth-moon-spin/round2/verification.json，10截图与37.92秒完整原片output/ui-batches2-6/earth-moon-spin/round2/。条件占正常桌面图外既有空白，空间不足自然流，不覆盖两参照；原app只有模式前呈现释放事件，科学/scene-state/phase样板不变。11专项、4条件契约、12四模式邻接、4批准phase专项、8初始和8跨spin后的冻结phase像素/状态/布局一致，334保护与198包/drift0。QA入口辅助错误与raw误选均记录，旧失败未抹去；最终所有对应验证通过。当前按顺序进入period，开始前checkpoint 63a0ee82198638cd70d98a66d43755e47e792b64。

## 2026-10-07 后续授权：第一批人工冻结，第2–6批执行

最新用户明确人工批准 `light/motion`、`optics/sampling`、`alignments/venus`，接受当前三个P3，停止微调；本节覆盖上方和下方历史“等待批次人工批准”。原源码/媒体哈希复核后，按原字节保存快照与测试/审稿证据到 `output/approved-ui-batch1-freeze/` 和 `build/qa/approved-ui-batch1-freeze/`，批准冻结清单 `freeze.json`。未改批准布局或重录媒体，未推送部署。

新授权只到分类表第2–6批18模式，批内与批间严格既定顺序；直接正式页面、每模式checkpoint/reduction、独立review至多三轮，P1/P2归零标“critic 通过，等待批次人工批准”并停视觉。第7批Mixed及后续、太阳系五模式保持保护，不创建统一布局模板或共享组件重构。后续科学/renderer/已批准页面/URL-history-owner风险按用户要求停止对应模式，共享风险阻断则停批次；无人回复不是批准。当前执行证据在 `build/qa/ui-batches2-6/`，最终索引在该目录维护，不另建全项目交接。

第2批四项全部critic通过并停视觉、等待批次人工批准：magnitude第二轮0/0/1、shadow第二轮0/0/0、distance第二轮0/0/0、calendar首轮0/0/1。checkpoint依次99d3616f80f239092632063b1da483b9b7962a91、1be46d17bfe7d38d9f45ec6118d84fac3c562ccb、50c1c4ea3bdb6026c0311d61fd0d89ca705f7368、ab2c2d1a634c6fd75cac6a965f4e4ae1a3ec55cc。每项current.json保留ref/tree/index/source/mediahash及独立审稿。前3专项11/10/10与各light/measure12原direct/history邻接通过；calendar9专项+6sky18邻接通过，334保护/190包/drift0；science/shared/history字节原样。批准或critic停改局部UI保持hash，原owning module仅允许后续授权兄弟接入，最终版本再回归。

shadow两P2在第二轮通过原alpha移近完整图/短图例/明确几何值消除。distance唯一P2在683×450下原p主控与完整曲线不能同屏，第二轮只本页CSS改完整图260高后通过，无裁轴。calendar首次QA选择器/隐藏模式入口步骤错误，随后async wait谓词提前返回与误把无公开控件内部longitude当恢复契约；失败原件保留，等待原ready+canonical mode并严格比较全部public snapshot后通过，生产恢复未改。历法科学年序/整年规则/原y轴、两种reset、原保留三读数与nestedowner保留。calendar视频首次误用newPage前墙钟2257ms裁剪，删掉默认和首切换；错误版保留raw/bad-wall-trim.webm，最终operations是完整18.68s原片逐字节副本，独立CUA1×自然ended+hash一致。

第3批light/observing第二轮critic Pass 0/0/0，停止修改并等待批次人工批准；checkpoint c2232596f5b78f1210c7434ee74c19abb30359ec。第一轮0/1/0唯一P2为新UI文案把“固定seed”误写成“固定整个样本”；不是原模型疑问，只改一句“更换种子，参数仍更新计数剖面”，原layout/owning light.js/CSS未改。第二轮11专项+4light12direct/history、77runtime语法/48Node/34Imaging通过；原202资源201不变+2，334保护/192包/drift0。7新原图及19.44s完整未剪原片由独立NativeEdge1×自然ended，4实际尺寸/seed/返回/modal复验通过。R1媒体/审稿保留；CUA R2浏览器服务不可用，明确NativeEdge边界。不宣称人工批准。

第3批optics/resolution第二轮critic Pass 0/0/1，停止视觉修改并等待批次人工批准，checkpoint957057502a0f865dac9460469e9c8caa880d01ec。首轮0/1/1唯一P2低高有效PSF太小；只压缩局部低高重复说明/次级读数，实际1366×600和683×450的PSF175/110→295/220px，近图主控完整同屏，正常布局及P3手机剖面提示换行保留。原161/720PSF、129display/sqrt灰度、4×4detector、原角窗/两图各角宽/261剖面不动；原204资源203不变+2局部。两轮12专项、3optics9邻接、78runtime/48Node/34Imaging、334保护/194包/drift0通过；R2已批准sampling R2只读4330与当前4306六组result/pixels/layout/labels精确一致。首轮QA等错FWHM、第二轮QA误用不存在data-primary选择器，均改QA后通过，失败保留，不改科学层。9原图/完整未剪18.76s操作由独立NativeEdge1×自然ended并核对served/raw/operations SHA，实际22观察Pass，CUA原浏览器服务不可用边界明确。Premium仍13旧发现/local0，不宣称全局strict通过。

第3批stars/ia预检与reduction完成，checkpoint6e8031f5a361ee95cba1f45f075080a4e653e451。原7合成样本、q只校正峰值、131原始光变不被q改写、星等上亮和ε残差保留；原view/snapshot/baseline/focus所有者不迁移。已批准HR原R2只读4331与当前4306，1440/390×4对象+2固定A/B共12组state/result/canvas pixels/rect/身份完全一致，进入前预检通过。仅准备IA局部呈现，无其他stars模式授权设计变化。

更新：stars/ia首轮独立CUA 0/1/1，唯一P2为原shared focus header浅底浅字1.2186:1，核心交互与完整20.04s原片通过；R2仅局部dialog --bg/--panel补暗色，实际1440/390标题/返回14.5328:1，原JS/owning module/布局不再改。P3原长科学文左/右历史表达保留，局部短注正确。R1所有43mode/direct/history/layout/faults及assets原182/182在R2前完成，source4307+R1匹配package；日志“unpacked service”标签不表示另启动包服务。R2 11专项、stars15邻接、已批准HR精确一致12、79syntax/48Node/34Imaging、334保护/196包/drift0、原206中205资源不变+2。早期局部modal节点null、嵌套Escape错误断言和320focus超9.7px分别修局部引用/QA/完整canvas锚点，失败保留，不改科学/原owner；原恢复与邻接通过。R2实际8常规+2popup读图和完整新原片已采，纯条件与条件＋基线区分，R1同图及“9”计数误报透明留档，等待R2独立critic，不称人工批准。第4批仅只读预查；共享DOM需要先释放再激活，保护phase-ui与物理模型，不先改。

最终更新：stars/ia R2新增P2为隐藏于closed资料内的advanced先吞Escape，基线仍开；R3仅局部key候选排除closed details祖先，仍让可见最深层及原dialog优先，原隐藏展开状态与科学状态保留。R3初版rect过滤不够（native content-visibility仍有rect）失败留档，语义祖先过滤后12专项通过。R3独立Pass 0/0/1，停止视觉修改，等待批次人工批准；checkpoint6e8031f5a361ee95cba1f45f075080a4e653e451。15stars邻接、已批准HR精确一致12、79syntax/48Node/34Imaging、334保护/196包/drift0均通过，10旧PNG与R2同SHA、default与R1/R2同SHA，增加keyboard-exit合计11PNG；完整新原片24.96s自然1× ended，served/raw/operations同SHA1c0fbd349290e0335570b6422c131cb527dba6ddb9e050181941aa315deb7ff6。第三輪CUA服务不可用，NativeEdge独立完整回退明确；不宣称真人科学/硬件或人工批准。第2批4项与第3批3项已完成，按序开始第4批spin。

premium strict仍13旧静态发现（原Date未声明owner、12原委托按钮检测不全），新局部无新增；不称全项目Pass，不跨范围改或隐藏。阶段日志实际语法计数以各unit.log为准。源服务当前4305由本任务启动；其他项目服务器不动。18项全部完成前不提交中间视觉稿。

用户此次明确要求删除critic误写临时目录，已再次按原生PowerShell literal绝对目标发出删除；自动审批仍以“blocked by policy”拒绝，目录保留，未绕过。正确证据不受影响。原目录路径与上一节失败记录保持。

## 2026-10-07 第一批剩余三模式：批次级人工验收

用户已人工批准 thermal 第二轮并接受唯一P3，不继续修改。其下方早期“待人工／未开始motion”的记录按历史保留，由本节后续状态覆盖。第一批只授权 `light/motion`（R/低）、`optics/sampling`（I/中）、`alignments/venus`（S/中）。各项先保全checkpoint，再reduction review和正式实现，独立critic最多三轮；通过后明确为“critic 通过，等待批次人工批准”，不是人工批准。所有三项结束即停止，不进入第二批。

motion 的修改前 checkpoint：`refs/checkpoints/light-motion-ui-before-20261007` / `39b845d2134b19c04ceddc47807959ba7a1f4a01`。第一轮 focus 白底浅字、第二轮本页 Escape 误拦原 modal 两项P2均在本页修复：局部深色focus；modal打开时把Escape交回原native cancel处理，不改shared focus。第三轮独立 Pass P1=0/P2=0/P3=1，仅高级长路径自然滚动暂时卷出曲线。13专项检查通过；原4个light模式direct/history共12项兼容通过；23.36秒录屏完整1×播放，1440/390一次Escape、背景披露、实际canvas/焦点归还、参数保持及重新进入均有独立证据。334保护文件/178包文件、190资源与源码边界通过；原188资源除light.js外187项字节相同，新增2项本页UI。证据：`build/qa/ui-batch1/motion/round3/verification.json`、`independent-review.md`，原图/视频 `output/ui-batch1/motion/round3/`。停止视觉修改，等待批次人工批准。

sampling 修改前 checkpoint：`refs/checkpoints/optics-sampling-ui-before-20261007` / `f4db5744bbf494c1dbe71da91ba25330fbe5f078`。必要连续像/积分图扩大，窄屏纵排；原view/focal/pixel/eyepiece控件和数据保持，详细条件/剖面/原素材按需披露。第一轮独立Fail P1=0/P2=2/P3=0：原dialog头浅底浅字；旧“放大图像”在新默认大图之后反而较小。第二轮局部修暗色标题/返回按钮，并准确命名“单图观察”，保留原天空角尺度及原DOM/参数/返回路径。第二轮独立Pass P1=0/P2=0/P3=1：仅两处原辅助技术组名仍含“放大”，dialog标题与可见职责准确，保留待批次人工验收，不进入第三轮微调。23.56秒录屏由主线程和critic完整1×观看，七张原图逐张查看。13专项测试通过，9项原optics direct/history兼容通过。原190资源除optics.js外189项字节相同，新增2项；334保护/180包文件、192资源边界通过。初检窄屏键盘后立刻读取sensor视场发生一项QA取值时序失败，原RAF尚未提交；改为等待原结果后全部通过，不改模型。旧失败报告/截图保留。最终证据：`build/qa/ui-batch1/sampling/round2/verification.json`、`independent-review.md`，媒体 `output/ui-batch1/sampling/round2/`。

venus 修改前 checkpoint：`refs/checkpoints/alignments-venus-ui-before-20261007` / `ee9ef79ed4c84888653e2e16c2f1cbb30dcb9d51`。S类大相位主体、必要小轨道参照、原日数与播放复位近主体；原k关系曲线、几何条件、预设与完整资料按需披露。轨道名称投影原camera位置；相机、材料、灯光、observer.scale、原配置与k曲线变换不改，不假造行星拖动或真实日期。第一轮独立Fail P1=0/P2=1：条件与曲线同时展开后，原生倾角键盘输入滚动到条件，常规桌面看不到因果参照。第二轮把原条件与曲线移至轨道附近，时间主控留在大相位下；轨道canvas310高、主体560高，关闭披露必要时回到观察，参数保持。独立实际1440×900组合输入后scrollY=0且两个主体持续可见；1366×600完整圆面与轨道持续可见；390/320关闭回观察，参数/result/焦点保持。第二轮Pass P1=0/P2=0/P3=1：仅600高桌面读完整关系曲线需自然滚动，关闭返回观察。13专项、9原alignments direct/history检查通过；191原资源字节不变，原资源只改alignments.js，新增2项。最终证据 `build/qa/ui-batch1/venus/round2/verification.json`、`independent-review.md`，七原图及24.04秒完整1×录屏在 `output/ui-batch1/venus/round2/`。第一轮录制中fullPage截图临时改变viewport造成灰块，是捕获瑕疵；第二轮截图和视频分开在真实当前页面采集，完整播放未再出现，不伪造科学状态。旧失败证据保留。

三个模式都是“critic 通过，等待批次人工批准”，三个P3只保留并报告，没有推断人工接受。共同的行为所有者仍是原模块事件、原生range/select/details/dialog与浏览器滚动；局部UI适配器只移动原DOM、组织披露及绘制原坐标投影的标注。科学模型、共享plot/scene/focus、模式恢复与来源资产不修改；退回兄弟模式归还节点和局部样式。Direction、Grammar、分类表保持不变。批次证据汇总在 `build/qa/ui-batch1/final/verification.json`；各项BRIEF保留reduction review，DESIGN只记录局部所有者，不生成第二套全站规则。

最终完整回归182/182通过（43模式桌面/390、43模式刷新/前进后退、布局、旧入口、故障及WebGL降级），当前源码服务4223与当前独立包194资源逐字节匹配，不能冒称第二个解压包独立服务运行。三个专项各13/13，共39/39；最终 `npm run check` 为72运行JS语法、48 Node测试、34 Imaging断言全部通过。当前候选334受保护文件、182包文件无失败，源码漂移0、禁止文件0；初始188资源中185项不变，原资源仅light.js、optics.js、alignments.js三个呈现接入变化，新增6个局部UI资源。最终批次哈希复核各critic通过版本源码/媒体/审稿未再改变，Direction/Grammar/分类表与第一个checkpoint逐字节相同。未失败或跳过模式，没有共享renderer、科学、恢复或旧入口的新阻断。

实际最终命令（在唯一项目根目录，Windows/Node24.14.0）：

```powershell
npm run check > build/qa/ui-batch1/final/unit.log 2>&1
node tests/standalone-refactor.mjs --base http://127.0.0.1:4223 --out build/qa/ui-batch1/final/compatibility --part assets,coverage,history-all,layout,faults --playwright C:/Users/30674/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright --browser 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' --package build/qa/ui-batch1/venus/round2/package
conda run -n dl_env python C:/Users/30674/.codex/plugins/cache/openai-curated-remote/frontend-design-premium/1.4.0/skills/frontend-design-premium/scripts/audit_project.py . --config build/qa/thermal-ui/premium-ui.json --mode strict --output build/qa/ui-batch1/final/premium-audit.json > build/qa/ui-batch1/final/premium-audit.log 2>&1
node build/qa/ui-batch1/stamp.mjs venus round2 1
node build/qa/ui-batch1/final/aggregate.mjs
```

总验收JSON：`build/qa/ui-batch1/final/verification.json`。全部证据留本机、不推送部署；正式源码4223和仅本轮视频播放器4253/4255/4257保留供用户查看，没有全局重启或停止用户服务。三个checkpoint完整ref/commit分别见上，普通HEAD仍`1e8a776`，未创建普通分支提交。当前在第一批三模式结束处停止，下一步只等待明确批次人工批准。

失败与限制：`node tools/check-boundaries.mjs --help` 并不显示帮助，而执行旧deploy包校验，报告4项陈旧包漂移；对当前候选显式传入package重新构建/校验后漂移归零。专项QA的Node/浏览器浮点末位、原RAF异步与播放跨帧两次读数错误均只修复QA读取/容差，原失败保留，不修改科学模型。Premium strict静态审计仍为13项原有发现（sky原生日期所有权、12处原委托按钮未被审计识别），新增局部UI无新发现，不声称全局strict通过。软件浏览器/软件WebGL/模拟视口不等于实体手机或真人科学审校。critic曾因路径解码错误写入仓库外URL编码同级目录 `D:/Users/ZJUAAA/2026/%E4%BB%8E%E8%AF%95%E5%8D%B7%E8%AE%B2%E8%B5%B7%E7%9A%84%E5%A4%A9%E6%96%87%E5%AD%A6%E7%9F%A5%E8%AF%86%E5%85%A5%E9%97%A8/build/qa/ui-batch1/venus/round1/`；已在正确位置重采，自动审批以“blocked by policy”拒绝删除误写临时目录，原处保留，未绕过删除。

全部checkpoint使用独立Git index，保全当时tracked及未忽略untracked；普通HEAD仍`1e8a776`，普通暂存区未变，ignored QA/私有资产原处保留。它们是回退点，不是最终候选commit。未推送部署。

## 2026-10-07 首批首项：light/thermal（已人工批准）

修改前使用独立临时 Git index 创建 `refs/checkpoints/thermal-ui-before-20261007`：commit `e58403f9f2adc046c92522803a0f28fbb52e0425`，tree `dae6921062c930948ed8715721f5ca6c51f72607`；保全现有 tracked 与未忽略 untracked 字节，普通 HEAD（仍为 `1e8a776`）及暂存区不变。记录在 `build/qa/thermal-ui/checkpoint.json`。没有普通分支提交、推送或部署，也不清理已有工作。

先做 reduction review，记录 `build/qa/thermal-ui/BRIEF.md`。完整曲线与原温度滑杆成为主要观察/操作区域，半径与光度、预设、显示条件、基线与读图来源分别按需披露；R/L 保留一行身份，表面 Bλ、归一消去幅度与整星光度明确分开。本模式 DOM 适配与作用域 CSS 新增 `light-thermal-ui.js/.css`；`light.js` 只接入呈现及按需基线可见性。原共享 plot、科学模型、数据、恢复与另外三个 light 科学分支字节不变；原186资源中185项完全不变，唯一修改的原资源为 light.js。运行清单增加2资源为188项。DESIGN.md 仅记录本页候选所有者，不改变稳定 Direction，不推广其他页面。

第一轮独立审稿不通过：P1=0、P2=1、P3=1，关键阻断是窄屏/固定参考时峰位文字覆盖曲线。保持原方向修复：读数撤至图头，原变换控制峰点与波长竖线，不缩小曲线；显式关闭/Escape 后图头如已卷出则返回观察位且不重置参数。第一轮几何脚本复用了归一状态，critic指出文件名与真实状态不符；旧21/100失败计数不能当成严格独立的绝对/归一矩阵。第二轮显式设置并断言每组真实 normalize/references/baseline 状态，5宽度×4显示状态×5温度共100项通过，标注与 canvas 完全不重叠。旧失败截图和审稿保留，不用测试绿替代视觉审稿。

第二轮 `tests/thermal-ui-browser.mjs` 15项通过：T→峰位/表面谱/光度；R翻倍使L四倍且表面曲线像素与峰位不变；归一不改 result；原预设/基线保存恢复/复位、刷新历史、三个 sibling 模式归还节点、原 focus、320/390/低高度/等效200%/键盘/Escape。`npm run check` 69个运行JS语法、48个Node测试及34个Imaging断言通过；模型保全原专项通过；边界334受保护文件与176包内文件均0失败，漂移0、禁止文件0。第二轮锁定188资源版本的完整兼容 `assets,coverage,history-all,layout,faults` 已完成，182/182通过，含43模式×桌面/窄屏、43刷新/前进/后退、布局与错误恢复。汇总在 `build/qa/thermal-ui/round2/verification.json`，不把源码服务URL核查冒称另一次解压包独立服务运行。

原兼容测试初次有两项 thermal 可见性失败，因为原问题/边界现已渐进披露；测试增加仅 thermal 的展开问题与关闭说明两处导航步骤，原断言与阈值不变。第一次候选构建后又编辑源码造成边界漂移3项，重新构建后清零；不把旧包的测试当作最终候选验收。Premium 模块 strict 静态审计仍有13项既有发现，与已批准HR基线一致，本页新问题0；委托事件解析限制已用原控件回归核实，不称全仓 strict 通过，不为此改其他页面。

六张最终候选原图与真实操作录屏在 `output/thermal-ui-round2/`：默认、调温、半径展开、归一显示、主动基线、手机；操作计时24.002秒，媒体容器25.12秒。`tests/review-recordings-refactor.mjs` 实际1×播放到ended，逐秒采样和contact在 `build/qa/thermal-ui/round2/recording-review/`，主线程已查看六张原图及contact。独立 critic 的完整播放/真实临时页验证与最终意见保存同目录 `critic-playback.json`、`critic-interaction.json`、`independent-review.md`，不把图像抽帧称为完整观看。实体设备、真人科学审校和人工视觉批准仍待用户；未开始 `light/motion`。

第二轮独立最终审稿 Pass，P1=0、P2=0、P3=1，可交人工。critic 在 CUA 连接不可用后使用项目已有 Playwright/Edge 的独立临时浏览器；六原图、3000K/绝对/归一/固定参考/320/390/1366×600 实际交互及25.12秒无seek的1×完整播放均有独立证据。仅剩P3：低高度长显示/比较披露操作时谱峰暂时卷出视口，关闭/Escape 后图头回到y=0且参数保持，D12允许此高级路径滚动，不继续为此改布局。停止本轮视觉实现，等待用户人工验收；P1/P2清零及182项回归不代表人工批准。未开始motion。

## 基线与保护（W0）

根工作区不是 Git；发行仓库 `deployment/AstronomyLab` 的实际 HEAD 为 `1e8a77642b489c990e917a4791c0eb83851fadd1`，开工 Git 状态干净。以根工作区实际字节继续，未回滚或覆盖其差异。保护清单 `build/qa/lab-refactor/baseline/manifest.json` 含514项文件、334项正文/数据/图片/许可/物理模型；代码开工副本保存在同目录 working-copy。原4180入口及监听4190/4194的其他进程不作全局操作。

实际开工环境：原生 Windows PowerShell7；系统 Node v24.14.0（既有环境，运行契约仍是 >=22，Node22兼容待另查）；Conda dl_env Python3.12.12；已有 Pandoc3.12、Playwright与Edge软件WebGL，不安装环境。原 `raw/CODEX_COURSE_BUILD.md` 已移动至 `docs/开发指导/教材部分/`，已读取现存手册、教师进度、写作要求和旧交互计划；本轮新边界优先，不恢复已删除旧课件。

旧产品开工验证：31项Node单元通过，旧browser-review实际118项通过，证据在 baseline/browser。旧文章返回断言属于历史课程产品，与新工具独立性分开记录。

## 进度

| 工作包 | 实际状态 | 证据 |
| --- | --- | --- |
| W0 | 基线、差异、保护已记录 | baseline/manifest.json、browser/checks.json |
| W1 | 原始资料与静态阅读包已导出并仓库外核查 | lectures/export-checks.json、browser-checks.json |
| W2 | 注册表、主入口、共享2D/3D与白名单已拆分，最终包检查通过 | runtime-assets.json、boundaries/checks.json |
| W3 | 11工具43模式基础适配完成；最终包桌面/窄屏86操作路径通过 | shared/mode-context.js、standalone/final-locked/ |
| W4 | 日地月4模式实现、专项验证、完整录屏及独立播放复核完成 | moon/、standalone/recording-review/ |
| W5 | 图像2模式实现、专项验证、完整录屏及独立播放复核完成 | imaging/、standalone/recording-review/ |
| W6 | 本地工程回归完成：156集成检查、43×2操作、全部43历史恢复、实际30分钟218轮、解压包独立运行及模型视觉复核 | standalone/final-locked/、unpacked-final/ |
| W7 | 资料/运行包交付完成；源码冻结、最终覆盖表、A01–A24矩阵、失败与待验交接已落盘 | standalone/final-r1-f401f2d0/、dist/、本记录 |

## 已完成资料分包（W1）

`npm run export:lectures` 使用现存 Conda/Pandoc AST 与扩展HTML/CSS解析，不重写正文。`dist/lectures-source/` 与ZIP携带16原始md及110源文件，全部与开工字节一致。1608条本地引用无缺失文件/锚点，39条私有、维护程序或原始档案引用明确排除。被排除引用保留在原来源文字中，并在manifest报告，不称全部链接都已公开开放。

`dist/lectures-web/` 是派生静态阅读包（非新的维护源），1849条生成链接/锚点核查无缺失；仓库外 file://、阻断HTTP的18项浏览器检查通过。source/web ZIP逐文件字节与CRC核查；12项解析自检。实际Windows符号链接创建、实体设备与科学审校待验。

两个包均为本地保全，公开分发 blocked，MIST/M17及第三方月面组合图等许可状态不升级。

## 接口与兼容去向

工具注册表为 `shared/tool-registry.js`，中性ID与URL保留。原 course-map/learning-paths/reading-state仅用于内容兼容，不进工具运行包。二维控件与plot分别在core-controls.js/plot.js，场景在scene.js；纯二维图像/星光不导入Three。

原两完整工具页面原生启动 `shared/tool-start.js`；太阳系保持原场景/模型/材质/相机，只拆整讲读取和入口。日地月由自己的显式场景接口管理恢复。其余工具沿用原mode-entry与experiment-state白名单恢复。

`/courses`、`/materials`、`/read/NN` 与 `/reading/LNN.html` 由隔离 `compat/lectures-server.mjs` 处理。可选 `--lectures <lectures-web目录>` 接入外置副本；没有该包时显示本地资料说明。工具运行不读取该包。正式部署的阅读迁移地址尚未确定，此回退不能称为长期迁移已完成。旧tool URL/mode/from保持有效；classic保留旧非样板布局，样板采用新原生布局并保留模式。

## 使用与未决范围

`npm run build:lab` 为纯Node构建，不需要课程、Pandoc或Python。独立包解压后运行 `node web/observatory/server.mjs --port 4182`，访问 http://127.0.0.1:4182/ 。资源为精确白名单，不开放工作区。首次运行无外网；三维需WebGL2。非file://单文件、部署根路径限定、没有账户或跨设备云恢复。

本轮仅6模式深度样板，其余37模式基础适配；后续深改按光学、行星投影/两种一天、星光/测量、恒星/银河/航天顺序择实际需要推进。没有新增视频频道/播放器/制作后台；测试录屏不是正式视频。

真人科学审校、真实试讲、实体手机与现场投影保持pending；源码字节不变、工程成功和模型视觉检查分别记录。新科学问题单列，不能包装为UI整理。最终检查、失败与修复、包哈希、画面与动态证据见本记录和最终矩阵。

## 2026-10-05 21:23 状态核对

实际Git HEAD仍为1e8a77642b489c990e917a4791c0eb83851fadd1，deployment/AstronomyLab无未提交、未跟踪文件。R1实现在非Git根工作区；相对W0实际字节37文件修改、40新增、0删除，完整路径在build/qa/lab-refactor/status-snapshot.json，dist和QA输出另列。不能用发行仓库Git干净代替R1已纳入版本控制。

最终lab.zip SHA256为f401f2d0b4d9aecdc8eb44d749994ae6508d44e87d5a069d7db2dee3efa9a3a9。334受保护文件不变，167包内清单文件哈希无失败、源码漂移0、禁止文件0；179资源URL核对通过。最终包156项集成检查与86条模式操作通过；48项Node测试通过。实际30分钟测试于21:18:04.726启动，尚未结束，不能记通过；旧候选虽跑满30分钟但版本变化已判无效。当前是可运行的UI基线候选，完成W6/W7锁定后再开始UI改动。源码保持冻结，仅收尾验收材料。

## 分包与版本身份

| 本地交付 | 组成与用途 | SHA256 |
| --- | --- | --- |
| dist/lectures-source.zip | 16讲原始Markdown、110实际源文件；含清单等113实体文件；原正文不改 | 0d27a41a7fe8ab47e93b24c7d8dc1e61e86b9a726359ba472282ed4ca70357ee |
| dist/lectures-web.zip | 可选派生静态阅读副本，单独维护原Markdown；不是Lab依赖 | b3584d21c4524d965d49a68dde18df6fdd600eba31065274a964ddc9e3303002 |
| dist/lab.zip | 精确白名单运行文件167项，另含分发清单，共168实体文件；179 URL | f401f2d0b4d9aecdc8eb44d749994ae6508d44e87d5a069d7db2dee3efa9a3a9 |

Lab runtime-assets.json哈希为f2eee92f3273cf306dd3020852c5ac1c236087b46a63217ba837ea4998b119ae。运行源码冻结后验证同一哈希，测试证据不等于新的Git提交。原始资料包和运行包都维持公开分发待核；只交付本地资料保全与工程试用。

运行包从ZIP实际解压到工作区外TEMP，168实体文件哈希/字节/CRC通过；仅以解压目录启动4188，不带课程目录、课程映射、文章或外置阅读服务。179资源校验、43模式桌面/窄屏86操作、6样板配方在该解压目录通过，证据为unpacked-package.json与standalone/unpacked-final/。未使用开发服务器或工作区资源补齐运行包。

## 基础、样板与后续内容

基础改造覆盖11工具43模式：入口、独立语境、操作路径、已有引导复用、模型边界、状态恢复及失败反馈。37个非样板模式的布局仍有图、曲线和控件纵向分散，未承诺全部内容深度重制。

日地月phase/spin/period/eclipse四样板扩大主体、明确观察与参照、保留原物理/渲染关系并连续播放；显式场景接口和严格配方校验处理复位起点、模式默认、暂停恢复、隐藏页面与释放资源。图像real/teaching两样板以同网格同点追踪源值与显示变化，复用冻结对照、放大、数据处理信息；教学测量固定种子、显示不重新抽噪声，真实数据失败不悄悄改成合成数据。

R2与后续UI工作尚未开始。后续顺序遵照手册的光学、行星投影/两种一天、星光/测量、恒星/银河/航天。UI可以重新设计信息层级、画面与控制布局；须继续保护原数据/模型、稳定ID/入口和已验证场景状态语义。当前工程验收不是负责人视觉批准。

已知UI限制：390px月周期参照纵排，方向标签和读数需滚动，不能称所有因果关系都在窄屏首屏同时可见；原生200%下也允许垂直滚动。日食手动调整倾角后，图与读数响应正确，但preset-summary仍显示载入预设的复位起点，未标明其身份，容易误读为当前条件；作为后续提示明确化待办保留，未修改冻结源码。太阳系原布局与原场景保留，后续不能整批覆盖其表现。

最后图像原生200%对话框实看还记录：粘性标题局部压到fieldset legend，所测控件仍清晰可操作、可滚动，关闭/Esc与焦点返回通过；作为后续对话框布局改善保留，不能把原生缩放操作通过描述成完全没有视觉问题。详细16张实际查看记录在imaging/native-zoom-checks.json。

## 动态与画面证据

六个样板完整WebM已实际1×播放至ended，再看关键时序帧；静态截图不代替运动验收。图像real片23.48秒、teaching片23.40秒，操作段约22秒；月相18.32秒、自转18.56秒、周期21.04秒、日月食22.68秒。记录时长是测试录屏，不是正式视频内容。

| 模式 | 实际录屏 | 播放与代表画面 |
| --- | --- | --- |
| earth-moon/phase | [月相完整操作录屏](<D:/Users/ZJUAAA/2026/从试卷讲起的天文学知识入门/build/qa/lab-refactor/moon/phase-operation.webm>) | [代表截图](<D:/Users/ZJUAAA/2026/从试卷讲起的天文学知识入门/build/qa/lab-refactor/standalone/final-locked/earth-moon-phase-1366.png>)；moon/playback-checks.json |
| earth-moon/spin | [自转完整操作录屏](<D:/Users/ZJUAAA/2026/从试卷讲起的天文学知识入门/build/qa/lab-refactor/moon/spin-operation.webm>) | [代表截图](<D:/Users/ZJUAAA/2026/从试卷讲起的天文学知识入门/build/qa/lab-refactor/standalone/final-locked/earth-moon-spin-1366.png>)；moon/playback-checks.json |
| earth-moon/period | [周期完整操作录屏](<D:/Users/ZJUAAA/2026/从试卷讲起的天文学知识入门/build/qa/lab-refactor/moon/period-operation.webm>) | [代表截图](<D:/Users/ZJUAAA/2026/从试卷讲起的天文学知识入门/build/qa/lab-refactor/standalone/final-locked/earth-moon-period-1366.png>)；moon/playback-checks.json |
| earth-moon/eclipse | [日月食完整操作录屏](<D:/Users/ZJUAAA/2026/从试卷讲起的天文学知识入门/build/qa/lab-refactor/moon/eclipse-operation.webm>) | [代表截图](<D:/Users/ZJUAAA/2026/从试卷讲起的天文学知识入门/build/qa/lab-refactor/standalone/final-locked/earth-moon-eclipse-1366.png>)；moon/playback-checks.json |
| imaging/real | [真实图像完整操作录屏](<D:/Users/ZJUAAA/2026/从试卷讲起的天文学知识入门/build/qa/lab-refactor/imaging/imaging-real-operations.webm>) | [代表首屏](<D:/Users/ZJUAAA/2026/从试卷讲起的天文学知识入门/build/qa/lab-refactor/imaging/real-default-1366-viewport.png>)；imaging/recordings-evidence.json |
| imaging/teaching | [教学计数完整操作录屏](<D:/Users/ZJUAAA/2026/从试卷讲起的天文学知识入门/build/qa/lab-refactor/imaging/imaging-teaching-operations.webm>) | [代表首屏](<D:/Users/ZJUAAA/2026/从试卷讲起的天文学知识入门/build/qa/lab-refactor/imaging/teaching-default-1366-viewport.png>)；imaging/recordings-evidence.json |

11工具桌面/窄屏代表画面及6样板默认画面均独立查看。原生200%六代表页面的完整画面已用CDP paint坐标捕获并实看；测试工具最初按CSS宽度捕获而右裁半幅，已确认是截图工具问题并改验收脚本，未修改运行源码。Moon四模式原生200%的实际播放/暂停/复位/模式/边界操作通过，图像操作证据另列imaging/native-zoom-checks.json；这些均不是实体手机或投影验收。

## 实际命令与失败记录

以下命令在原生PowerShell7执行，不装包、不改环境。详细退出码、早期失败与修复分别保存在lectures/command-history.json、moon/evidence.json、imaging/summary.json和standalone证据；保留候选失败，不以重复绿色结果覆盖历史。

```powershell
git -C deployment/AstronomyLab rev-parse HEAD
git -C deployment/AstronomyLab status --short --untracked-files=all
conda run -n dl_env python tools/export-lectures.py --web --self-test
node tools/build-lab.mjs
node tools/check.mjs
node tools/check-boundaries.mjs
node tools/check-isolated-build.mjs
node tests/model-preservation-refactor.mjs
node --test tests/moon-refactor-state.mjs
node tests/moon-refactor-browser.mjs
node tests/moon-refactor-lifecycle.mjs
node tests/moon-refactor-record.mjs
node tests/moon-refactor-playback.mjs
node --test tests/imaging-refactor.test.mjs
node tests/imaging-refactor-browser.mjs
node tests/imaging-refactor-record.mjs
node tests/imaging-refactor-playback.mjs
node tests/native-zoom-refactor.mjs
node dist/lab/web/observatory/server.mjs --port 4182
node dist/lab/web/observatory/server.mjs --port 4183 --lectures dist/lectures-web
node tests/reading-compat-refactor.mjs --base http://127.0.0.1:4183
& 'build/qa/lab-refactor/unpack-package.ps1'
node build/qa/lab-refactor/check-unpacked.mjs
conda run -n dl_env python build/qa/lab-refactor/check-zip-crc.py
```

全站浏览器脚本使用实际包路径、显式现存Playwright模块和Edge二进制，命令模板如下；最终30分钟使用part=stability、stability-minutes=30，解压目录使用4188/standalone/unpacked-final及part=assets,coverage,pilots。真实完整命令保存于最终验收摘要。

```powershell
node tests/standalone-refactor.mjs --base http://127.0.0.1:4182 --package dist/lab --out build/qa/lab-refactor/standalone/final-locked --part coverage,state,faults,pilots,layout,assets --playwright 'C:/Users/30674/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright' --browser 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
```

真实缺陷及复测：ESM加载失败会缓存Rejected，原重试无法恢复，改为保持URL/历史的整页重载并复测；月周期新月参照标签重叠，改固定引线标记并重新录周期片；图像源值在1366×768首屏下方，复用原检查像素行移到图前并隔离旧CSS影响，重新录两片；图像异步数据加载使用路由signal及generation guard、配方绑定元信息/数据哈希，专项原子拒绝与快速切换复测通过。

工具/环境失败单列：导出解析器issue类别被reference kind覆盖（已修）；Windows ESM驱动器路径（改file URL）；旧服务白名单不含新模块（仅重启自有测试服务）；隐藏details断言与原生缩放截图坐标（修测试方法）；太阳系默认自动时钟导致fresh入口日期随耗时变化（fresh仅排除该动态默认，Back/refresh保存日期仍严格核对）；中文锚点平滑滚动需要等待真实目标就位；服务重启瞬间connection refused独立记录。早期30分钟候选测试版本变化不能作为终版通过。Node22未测试、Windows实际符号链接创建、实体设备与真人审校仍待验，不能以本轮工程结果推断通过。

## 2026-10-05 最终锁定

最终包实际30分钟测试已通过：2026-10-05T13:18:04.726Z开始，13:48:05.435Z结束；测试循环实际1800053ms，218轮、221检查全通过，0页面异常、0课程请求。每轮采样退出pending animation frames与active intervals均0。这是六工具代表循环与软件WebGL证据，不保证所有硬件、所有操作组合或长期内存泄漏认证。

最终64运行文件语法与48 Node测试通过，334保护文件和167清单文件哈希全通过，源码漂移/禁止文件0。Moon4与Imaging2原生200%实际操作通过，图片真实查看及详细范围见两模块native-zoom-checks.json。整个11/43独立包基础适配完成，深度样板仍严格仅6模式；后续37深制与负责人视觉批准保持未完成。

权威验收矩阵：[A01–A24](<D:/Users/ZJUAAA/2026/从试卷讲起的天文学知识入门/build/qa/lab-refactor/standalone/final-r1-f401f2d0/acceptance-A01-A24.json>)；[43模式覆盖表](<D:/Users/ZJUAAA/2026/从试卷讲起的天文学知识入门/build/qa/lab-refactor/standalone/final-r1-f401f2d0/mode-coverage.csv>)。原始采集保存在final-locked，失败候选保留各iteration；最终矩阵精确引用，不修改原始失败使其变绿。

最后Git HEAD仍1e8a77642b489c990e917a4791c0eb83851fadd1，发行仓库无未提交/未跟踪。非Git根工作区相对W0为37修改、41新增、0删除（含新增验收汇总脚本），完整清单在status-snapshot.json。当前lab.zip与runtime manifest哈希即上表，已足以作为UI重构的本地工程基线，不能称为已经提交到Git或正式验收产品。

仅保留最终独立包预览http://127.0.0.1:4182/；自有4181、4183、4186、4187、4188测试服务已停止，其他4190/4194进程保持原PID。未来预览停止后从dist/lab运行node web/observatory/server.mjs --port 4182即可。没有主站、Sky、生产、全局重启、提交、推送或部署动作。

## 2026-10-05 用户要求直接覆盖原Git仓库

本节更新上方的历史Git状态。用户确认不做逐项合并，要求用当前R1工作区直接覆盖旧仓库，并先审阅产品变化。原仓库覆盖前HEAD为1e8a77642b489c990e917a4791c0eb83851fadd1、工作树干净。先完整备份865文件（含.git）并逐文件哈希校验，另存Git历史bundle并verify通过，之后才复制482源文件与168运行文件。仅一个原仓库独有、已经不用的工程摘要JSON从工作树退出，完整保留在备份。

当前本目录即原GitHub仓库的R1可维护源码，.git、remote和原提交历史未改；HEAD仍为旧提交是因为新源码尚未提交。Git现在可见源码修改及新增文件，不再把Git干净误解为R1已入库。后续开发在本Git仓库进行，外层根工作区的R1运行源码保持冻结，不同时维护两份网站代码。

新维护入口：npm run check；npm run build:deploy在本地生成deploy/lab；npm run check:boundaries使用本仓库278项公开源保护子集（私有完整W0存在时优先使用）。原外层工作区334保护记录仍保留，范围不能混为同一数目。Git忽略本地Pandoc预编译程序、ZIP、私有输入和QA；源码、构建脚本与deploy/lab实际文件可审阅。服务器将来只取deploy/lab的流程尚未配置生产，不提前执行旧部署命令。

覆盖后48项Node测试通过；475源文件逐字节对应原R1输入，其余为维护README/AGENTS、Git忽略、打包入口及哈希记录等元数据。重新实际运行build:deploy，166部署文件字节与已验收R1一致，只有runtime-assets和分发清单的生成时间/哈希元数据更新；179资源地图及buildId相同。原冻结lab.zip仍为f401f2d0…，源码仓库新生成deploy/lab.zip为c4586d1b…，不把两种时间戳包当作同一个ZIP哈希。

源码覆盖与备份详细证据在原工作区build/qa/lab-refactor/repository-replacement.json，完整备份目录为build/qa/lab-refactor/source-replacement/20261005T145047888Z/original-repository，历史恢复包同层original-history.bundle。内部材料不上传；实际仓库新预览为http://127.0.0.1:4189/，原4182冻结包不受影响。本轮未stage、commit、push或修改服务器。

与原1e8a776的产品区别：课程平台改为独立工具主入口；16原始讲义及派生阅读独立保全；43模式基础语境、控制及边界可独立使用；日地月4、图像2是深度样板；已有引导/预设/对照/放大/状态恢复继续复用。太阳系和全部科学模型/数据身份保持，其他37的深度内容重制、当前UI定稿、正式阅读迁移与实际视频接入均未完成。来源许可、真人科学审校、教材对照、试讲、实体设备和硬件长期性能仍待验。

新仓库本地打包目录4189实际复测完成：179资源逐字节/哈希通过，43模式桌面与窄屏86操作通过，6样板配方通过，无课程请求、无页面异常；证据在原工作区build/qa/lab-refactor/source-replacement-browser。源文件复制后仅本交接与维护元数据补充，不改变运行模型。先保留旧R1的30分钟证据并验证全部运行源字节一致，本次没有把新ZIP生成时间冒充重新30分钟验收。

## 2026-10-06 目录整理：一个项目根目录、一个开发入口

用户指出源码仓库嵌在deployment下、两套web并存令人混淆，授权整理目录。现在本README/AGENTS所在根目录直接拥有原.git，Git和网站开发均在此进行。原路径deployment/AstronomyLab不再存在；web/仍在用户原本熟悉的位置，不需要进入部署目录修改源码。没有新建仓库、丢弃历史、reset、逐模式重新合并或改写科学内容。

Git分支main，HEAD仍1e8a77642b489c990e917a4791c0eb83851fadd1，remote仍是原Ray8mu34/AstronomyLab。HEAD表示上次已有提交；当前R1和目录说明都在工作树中，尚未stage/commit/push。Git对象检查exit0，存在历史dangling blob信息，不是损坏，也未执行GC清理。

整理前完整工作区快照在项目外 `../AstronomyLab-backups/20261005-234607/workspace-before/`，8685项、3005243160字节全部匹配检查。原有Git历史与未提交文件均备份后才调整。旁边retired保存实际移出的目录，只有根.git继续用于日常工作。

| 原位置 | 当前保存位置（相对项目根目录） |
| --- | --- |
| deployment/（旧发行仓库及发布脚本） | ../AstronomyLab-backups/20261005-234607/retired/deployment/ |
| entry-release-3/、entry-release-4/ | ../AstronomyLab-backups/20261005-234607/retired/同名目录/ |
| review/、tmp/（历史审查和报告生成缓存） | ../AstronomyLab-backups/20261005-234607/retired/同名目录/ |
| build/qa/lab-refactor/source-replacement/（旧Git完整备份） | ../AstronomyLab-backups/20261005-234607/retired/historical-repository-backups/ |

因此上文覆盖记录里的旧备份路径需按此表定位；历史JSON保留原记录，重定位映射在build/qa/workspace-organization/relocation.json。原报告成品仍在output/pdf，讲义与独立运行ZIP仍在dist，原始R1截图/六段录屏及验收矩阵仍在build/qa/lab-refactor原路径。没有删除资料。移出目录逐文件复核无差异。

把仓库维护元数据、构建入口和运行包放回根目录；原web/assets/course中494项非维护文件逐字节保持。179资源条目及buildId r1-20261005-df61e22783ed不变；166运行文件与整理前运行包相同，仅runtime-assets和分发清单生成元数据重新生成。新的deploy/lab.zip为e0b42e99bdb9e5c37fc9a05f33a65384454efd1d0ca55e3f704dfd1631d844ca，原dist下三个交付ZIP哈希完全不变。

当前职责：web是唯一源码；deploy/lab是生成的运行包，不能手改；dist是资料导出；build/qa是本机证据；私有课程材料和科学原始文件仍保留在本机。修正忽略规则以覆盖data/imaging/raw等嵌套原始目录、内部QA与旧阅读内嵌QA。MIST原始科学压缩包仅本机保留，不进入Git；它仍由完整W0的334项保护记录检查。因此source-protection.json的可随Git保存子集从278调整为277，变的是检查范围，没有改动该压缩包或任何科学数据。不能用277代替本机完整334，也不把许可待核改为已获许可。

实际验证与证据均在build/qa/workspace-organization：

- npm run check：64运行文件语法、48/48 Node测试通过（node-check.txt）。
- npm run build:deploy：179资源、167清单文件加分发清单共168运行实体文件。
- npm run check:boundaries：334保护项、167清单项、源码漂移0、禁止文件0，静态边界测试通过。
- node tools/check-isolated-build.mjs：在仓库外无课程源、目录、文章服务、Pandoc或维护素材台账时构建通过。
- 独立运行包4188：97/97检查；43模式×桌面/窄屏86操作、179资源字节/哈希、6配方通过；0页面错误、0课程请求（browser/assets,coverage,pilots-checks.json）。
- 根源码服务4189：9/9资源及样板配方检查，0页面错误、0课程请求（source-browser-final/assets,pilots-checks.json）。
- Git可见工作树单独复制到TEMP，不带.git、私有W0、教师记录或科学raw：277项保护与167运行文件检查通过（public-source-checks.json）。不是已经推送到GitHub的测试。
- 目录、源字节、归档、原三个ZIP、远程/HEAD/暂存检查通过（verification.json）；运行资源身份相同，历史录屏与30分钟证据仍适用，本轮未重新录屏或再做30分钟试验。

命令（全部从当前根目录运行）：

```powershell
git rev-parse --show-toplevel
git rev-parse HEAD
git fsck --full
npm run check
npm run build:deploy
npm run check:boundaries
node tools/check-isolated-build.mjs
npm start -- --port 4189
node deploy/lab/web/observatory/server.mjs --port 4188
node tests/standalone-refactor.mjs --base http://127.0.0.1:4188 --package deploy/lab --out build/qa/workspace-organization/browser --part assets,coverage,pilots --playwright 'C:/Users/30674/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright' --browser 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
node tests/standalone-refactor.mjs --base http://127.0.0.1:4189 --package deploy/lab --out build/qa/workspace-organization/source-browser-final --part assets,pilots --playwright 'C:/Users/30674/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright' --browser 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
node build/qa/workspace-organization/check-public-source.mjs
node build/qa/workspace-organization/verify.mjs
```

保留实际失败：初次源码预览验证错误地把--package指向完整仓库根，触发“运行包不得含课程”磁盘断言；其资源HTTP与六配方仍通过，失败记录留在source-browser。正确验证使用实际deploy/lab包核对4189源码HTTP，复测9项通过，没有为了通过断言删除课程。第一次源字节小检查包含本轮更新的web/observatory/README.md，被判差异；明确排除维护说明后，494原始代码/数据/内容项通过。元数据补丁重复路径与模板转义错误在写入前拒绝，修正后完成。Git格式CRLF旧诊断与真人/设备/Node22待验没有借目录整理升级。

最终只保留源码预览http://127.0.0.1:4189/。本轮自有的4188验收服务及旧4182冻结包预览停止；没有全局重启或操作其他项目、主站、Sky、生产服务器。UI下一轮直接在当前根目录web/继续，读取当前AGENTS与本记录。不推送、不部署。

复制阶段Node24 fs.cpSync在Windows完整目录备份时异常退出，未覆盖原仓库；改用系统Robocopy成功后，865文件均匹配并验证Git历史包，之后才执行覆盖。部分源文件保留原CRLF与末尾空行，普通git diff --check会报告这类格式诊断，未为消除警告批量格式化科学/运行源码；不把该样式诊断视为运行测试失败或隐藏它。完整失败记录在repository-replacement.json。原仓库旧工程摘要已退出现工作树但可从完整备份恢复，原始正文与科学数据没有删除。


## 2026-10-06 B-reduced 迁移回正式月相页（未部署）

用户批准 B-reduced，不再探索或进入 Figma，授权迁移正式日地月页面。本轮仅 'earth-moon / phase'：新增 'web/earth-moon/phase-ui.js' 与 'phase-ui.css'，从原入口成功初始化后接入；CSS 仅 body.reduced 生效。大月面、小几何视图、按需比较、条件压缩 overlay、太阳方向边缘参照、时间基准/速率/载入起点复位语义保持批准版。原引导问题、操作说明及完整边界放回“机制与适用边界”，仍可按需阅读。所有参数、预设、视图与配方操作复用原节点和处理器；切换或导入其他模式时归还原 DOM。其他三个模式与其他工具没有迁移视觉规则。

保护证据：迁移前副本在 build/qa/phase-ui-migration/before；app.js、physics.mjs、content.js、scene-state.js、style.css 均与开工字节一致。179 个原运行资源仅 earth-moon/index.html 改变，新增两个 UI 资源后为181；模型、正文、来源、许可和数据不变。构建白名单增加两个文件。新增 DESIGN.md 记录已批准的局部方向与唯一 CSS token 所有者。没有 stage/commit/push/deploy，deploy/lab 和生产服务器未改。

实际验证：

- npm run check：65 运行文件语法、48/48 Node测试通过；node --test tests/moon-refactor-state.mjs：8/8。
- 原 moon-refactor-browser：14/14；原 lifecycle：7/7；moon-phase-ui：4/4。断言未弱化，仅为新的 disclosure 调整原点击路径；原录屏与 standalone harness 同样支持收起控件。
- standalone --part assets,pilots,compat：9/9，181 URL 的 HTTP 字节/哈希与六样板配方通过；compat 并非该 harness 的分支名，没有把它报告成兼容性检查。另以 --part faults --check-filter 'Old source query' 实际通过旧URL/来源参数/模式检查。
- standalone --part coverage --check-filter 'Direct earth-moon'：四模式×1366/390 共8/8；未把过滤掉的其他模式当作本轮重测。原 browser 另验证320、683×384等效200%和1920。
- standalone --part faults --check-filter Moon：3/3，缺失WebGL、贴图失败重试、真实软件WebGL上下文丢失暂停及重试恢复。实体设备、硬件丢失和物理BFCache未因此认证。
- node tools/build-lab.mjs --out build/qa/phase-ui-migration/package：独立本地候选包；node tools/check-boundaries.mjs --package 同路径：334保护项、169清单项通过，源码漂移0、禁止资源0。公共分发仍 blocked_pending_licenses。
- npx --yes -p @google/design.md designmd lint DESIGN.md：0错误/0警告。premium strict 根审计仍有既有范围外和静态误报；定向月相审计无所有权未决，仅23个原HTML按钮被静态审计器误判无动作，真实处理器在未改app.js，功能与异常回归验证它们有效。不宣称全项目 premium strict 通过。

交付 'output/phase-ui-migration/'：四张真实桌面截图、21.866秒完整操作视频，1280×720/30fps；1134个真实 compositor frame按时间戳保持最近帧，无科学或视觉插值。已用原生视频播放器1×回放到ended=true，实际查看四截图及八个回放时刻：拖动→月相连续改变→播放暂停→条件→比较→双展开持续播放→复位回7.383天并暂停→收起。桌面条件开关不重排月面与标签；双展开保留几何视图。frontend-design-review 的视觉层级、动态因果、关键标注、时间语义及比较状态验收通过。窄屏延续批准版纵向布局和按需条件层，本轮不扩展新的移动设计方向。

失败原样保留：初次回归 helper 用零高度 UI 包装层判断可见、把 details 的空 open 属性当作 false，导致点击超时；修正辅助路径后原断言全部通过。首次录屏任务跨调用丢失执行上下文，下一次超时，另一尝试的 raw CDP Home 键被接口拒绝；均未交付，重新完整采集后核对。一次补丁多余上下文匹配被拒绝，一次 PowerShell Get-Content Raw/TotalCount 冲突；改为直接小补丁与单独读取，没有覆盖科学文件。

证据集中于 build/qa/phase-ui-migration（regression、coverage、standalone、faults、old-entry、preservation、capture、encoding、playback、verification）。正式源码预览当前 http://127.0.0.1:4198/labs/earth-moon/?mode=phase；本轮QA播放器4199只服务录屏，不是产品频道，交付后停止。原4197 prototype服务未全局重启。停止工作，不推广其他模式。
交接写入脚本首次因模板内反引号未转义产生 SyntaxError，未写入文件；改为普通引号后验证记录和本段一次性追加成功。


## 2026-10-06 日地月人工批准冻结与 Imaging 隔离样板

负责人明确表示已人工检查正式日地月并确认与通过的 prototype 一致。它是第一个已人工批准的 UI 样板，仅 phase，不把其他月球模式或其他工具算作视觉批准。正式源码未继续调整。新回归：原 moon browser 14、lifecycle 7、phase UI 4 项全通过；48 Node 测试和 34 Imaging 科学断言通过。最终四张桌面截图、21.866 s 已实际完整播放的最终录屏、冻结运行包保存在 `output/approved-moon-freeze/`；181 运行资源的当前源码哈希与冻结 manifest 完全一致。详细批准/哈希/测试证据：`build/qa/approved-moon-freeze/`。

没有创建 checkpoint commit：当前 R1 工程依赖尚未提交，并混有独立课程/素材和人工修改；仅提交月相会遗漏其 R1 依赖，广泛提交会夹带无关工作。保留现有 Git 状态，没有 stage/reset/clean，也未推送部署。冻结运行包 SHA256 d5a84894345b8af9129e8ccb2f4c6b9de887bb06df6d3952cce4f82fa284e706，作为可运行检查点证据，未声称是 Git commit。

Imaging 前审查指出：导航/标题/说明堆叠挤压图像；默认灰度/RGB 双栏没有先建立比较任务；未取样就常驻坐标与读数；固定控制区把显示处理与教学测量输入放在相近层级；起点、复位、完整参数竞争主体。依据 Grammar，使用 frontend-design + premium，做单幅二维科学图像工作台，显示主控靠近图像，取样/条件/灰度比较与来源按任务披露。原教育 FITS、320² 网格/缺测遮罩、160² 假想计数、白点归一、曝光模型/种子、状态恢复及原事件仍由原模块负责。

原型位于 `build/qa/imaging-prototype/`：`server.mjs` 为 localhost 白名单服务器，仅把 Imaging mount 包装为原模块 + presentation adapter，所有模型/数据从同一原源码读取，不另建开发副本。入口 http://127.0.0.1:4200/lab/imaging?mode=real，可选 teaching；从根目录运行 `node build/qa/imaging-prototype/server.mjs --port 4200` 重启。正式 `web/`、运行 manifest 及冻结的全部181资源仍逐字节不变。

独立 frontend-design-review critic 首轮指出5项：指导与冻结标题碰撞、取样盖住 legend、灰度选择操纵隐藏对象、曝光比较语义/源值位置不明确、复位范围只依赖 hover。集中修改1轮后：删重复比较指导；两图对应源值紧贴各自图像；gray selector 仅在实时单通道任务出现；教学曝光标出改变源计数及显示参考随曝光调整；复位可见标出载入起点与清空对照。默认1280×720实测可见控件14→8（减少43%），RGB边长300→480 CSS px。critic 最终认为所审状态无明显结构性阻塞、方向可保留，建议停止；`critic-round-0.md`、`critic-final.md` 在原型QA目录。未开第二轮、未自行迁移。

最终桌面默认/显示条件操作/冻结比较/比较+条件，以及教学100→600s比较截图在 `output/imaging-prototype/`；390窄屏PNG来自实际原浏览器回归。完整 `operation.webm` 18.933s，展示真实M17取样、冻结、HSO、白点拖动/线性拉伸、条件与增益披露/关闭、复位、明示教学100→600s曝光、HOO/log显示变化、组合状态与最终复位。69个原始 compositor帧按时间保持编码，包含真实复位后1.7s静止停留，没有插值科学状态。实施agent原生1倍速完整播放到 ended=true；critic 独立查看全部69原帧完整时间序列、7播放样本、最终桌面与窄屏图。critic 浏览器连接不可用，没有伪称其本人额外完整实时播放。

测试：正式 Imaging 原浏览器27项先通过；隔离版在仅调整 disclosure 导航后保持原科学/数组/配方/原子验证/复位/缺测/失败恢复断言，最终27项通过；另9项审稿问题专项通过（含320/390比较和条件、同点冻结值、无覆盖、181哈希不变）。`npm run check` 65运行语法文件、48 Node测试与34 Imaging断言通过。候选 premium strict 实际扫描0错误/警告；原CLI排除build目录，即使显式sourceRoots也会跳过，因此QA wrapper仅在进程内移除该路径排除再运行官方规则，不改已安装skill。初次canonical map缺失与未被扫描器认识的Modal/Drawer声明已记失败，不把空扫描当通过；完整行为所有者表留在隔离BRIEF。

还需人工选择：比较中的再次冻结是否命名“更新冻结参考”；手机高级参数纵向滚动与看图距离的取舍。手机截图/等效200%仅软件视口验证，不能说实体触控或真实投影已验收。Cua临时窄屏设置实际仍1280×720，已丢弃误标图且复位覆盖；交付窄屏图用实测390浏览器PNG。没有全站Design System、Figma、第三页面UI、太阳系沙盘修改、推送或部署。

最终状态：日地月已批准冻结；Imaging 隔离方向可保留，尚待负责人人工批准。现在停止视觉实现，不将无人回复或critic通过视为正式迁移授权。


## 2026-10-06 Imaging 第二个人工批准样板冻结

负责人明确批准 Imaging 隔离样板，并决定比较中的再次冻结命名为“更新参考”，辅助说明“以当前结果替换左侧冻结参考”。已在原按钮增加仅比较时出现的说明与 aria-describedby；初次比较仍为“冻结当前 · 比较”，仍调用原 reference 处理器。隔离批准标识同步更新。手机高级参数的纵向滚动距离已接受，参数分组、关闭、Escape/焦点和原生滚动方式保留，没有为了压缩滚动而加密或重排。上述决定覆盖上一节的两个待选项。

最终必要回归：原 Imaging 浏览器27/27、专项9/9（含320/390比较+条件无横向溢出及显式关闭）、npm run check 的65文件语法/48 Node测试/34 Imaging科学断言、隔离候选 premium strict 0错误/0警告。181项正式运行资源与日地月冻结 manifest 哈希全部一致。实际原生浏览器核对冻结SHO→当前HSO→更新参考后左图冻结HSO→右图独立HOO→关闭条件→复位SHO并清空比较；最终默认、条件、比较与双展开截图保存于 output/approved-imaging-freeze/，390软件视口截图来自本次原浏览器回归。没有宣称实体设备验收。

冻结记录 build/qa/imaging-prototype/approved-freeze.json 包含人工批准、决定、adapter SHA256、证据和测试命令；output/approved-imaging-freeze/ 保存只读adapter快照、最终截图、原27/9项证据、历史critic与完整已批准方向录屏。该18.933s录屏逐字节保留此前已完整1倍速播放的版本，其按钮与批准标识早于本次最后文案修改，最终文案以新截图为准，未伪称重新录制。底层181资源对应已有 output/approved-moon-freeze/approved-runtime.zip，避免另建源码开发副本。原型位置/重启命令不变：node build/qa/imaging-prototype/server.mjs --port 4200；http://127.0.0.1:4200/lab/imaging?mode=real。DESIGN.md 和隔离 BRIEF 同步记录第二样板规则与已接受取舍，不建立全站 Design System。

最终状态：两个样板均已人工批准冻结；Imaging 仍是隔离 prototype，未获正式迁移授权。停止视觉微调，不推广其他模式、不修改太阳系沙盘、不进入 Figma、不提交推送部署。


## 2026-10-06 已批准 Imaging 原样迁移正式页面

负责人明确授权正式迁移，不继续设计。web/observatory/modules/imaging-page.js 包装原 imaging.js 的 mount/dispose；imaging-ui.js/.css 从批准冻结 adapter 原样迁入，app.js 只对 imaging slug 选择该包装模块。imaging.js、physics、state、M17 f32/metadata、素材/来源和其余全部旧运行资源逐字节保持：181项旧资源仅 app.js 的一处加载器分支改变；新增3资源使白名单成为184项。原 CSS 与冻结版逐字节相同，JS 仅改正式 CSS URL 并去掉“隔离样板 · 已批准”标识；这是唯一可见差异。没有修改其他模式、太阳系沙盘或科学逻辑，没有新功能/Design System/Figma/提交/推送/部署。

正式源码预览仍为 http://127.0.0.1:4198/lab/imaging?mode=real，可选 teaching。只重启本任务自己的4198服务以读取新增白名单。4200冻结对照使用 build/qa/imaging-migration/frozen-reference-server.mjs：不可变冻结 adapter + 迁移前 app.js + 未变科学源，避免当前正式加载器导致原型重复安装；重启用 node build/qa/imaging-migration/frozen-reference-server.mjs --port 4200。旧冻结文件/截图/视频保留，未冒充迁移后的新版。

功能回归：原 Imaging 27/27（全部原科学/数组/缺测/配方/原子失败/复位断言，只更新原生披露导航）、67语法文件/48 Node测试/34 Imaging科学断言；全部功能集成201/201，其中43模式×桌面/390视口86路径及所有43模式历史恢复，旧来源参数/入口、私有资源隔离、404/损坏数组/慢请求/切换竞态/WebGL不可用/软件上下文恢复均通过；6/6原生浏览器200%缩放（独立临时Edge扩展，不是CSS zoom）、现有4组数值检查通过；334保护项、172包文件、来源漂移0/禁止资源0通过。完整原有稳定性测试实际30.005分钟、218次切换循环通过，卸载后的动画回调/interval均为0。未把软件测试称为实体设备或真人科学审校。

一致性：1280×720、390×900的11状态×2视口，共22对真实画面，原/正式科学state、源数组、冻结源/图像、标题/反馈、控件几何完全一致；除明确的环境标识区域，其余像素差异为0。覆盖默认、条件、冻结比较、比较+条件、更新参考、结束比较、教学曝光/显示变化及双展开、复位、单通道任务。具体证据 consistency.json、pixel-consistency.json。

输出 output/imaging-ui-migration/：四张最终原生桌面截图、实际390窄屏图、M17与教学两段完整操作录屏（22.72s / 22.80s）；两段均自动及原生1倍速完整播放到ended=true，实际回看有效源值与曝光/显示变化、条件开关、更新/结束比较、放大键盘、载入起点与复位。build/qa/imaging-migration/verification.json 集中记录命令、SHA256、包与全部证据。DESIGN.md 仅同步两个批准样板的现有所有者。

保留失败：旧集成脚本点击隐藏旧导航，测试改为当前可见入口后重跑完整201项，科学断言未削弱；旧录屏固定像素坐标在放大主体后落到M17缺测边界，改测试为相对有效取样点后重录完整证据，页面未调整；Pillow getdata 弃用提示未改环境，像素比对仍通过。premium严格模块范围审计保留13项旧发现（未触及Sky的Date所有权及原模块动态委托按钮静态误报）；本次迁移的3文件及app.js无发现，原 imaging.js 的resample处理器与种子变化/复位由真实27项回归验证。未声称整个模块范围strict通过；DESIGN.md lint 0错误/0警告。

迁移完成并停止；不进入第三样板，不推广其余模式，不部署。

## 2026-10-06 第三且最后样板：正式 stars/hr 第一轮

负责人选择赫罗图并明确授权直接改正式源码，覆盖此前隔离 prototype 工作方式；不进 Figma。开工前用独立临时 Git index 和 commit-tree 保存当前所有已跟踪及未忽略未跟踪文件：checkpoint refs/checkpoints/hr-ui-before-20261006，commit 722db1ad06f277447da2f05724c35fd6380895ed，parent/原 HEAD 仍为1e8a776。正常暂存区与分支未动；没有推送。build/qa/hr-ui/checkpoint.json、before-status.txt、rollback.json 保存证据及仅恢复本轮明确路径的方法；被忽略资料未改。不能用 git diff checkpoint 对普通 index 的“未跟踪文件删除”显示推断文件消失，实际按 Git blob 对文件系统逐一比对。

正式呈现由新增 web/observatory/modules/stars-hr-ui.js/.css 拥有，stars.js 仅加入 HR 控件与呈现生命周期。完整二维图、轴、点和区域成为主体；单对象读数靠近点，半径解释按需展开；比较入口显示实际固定太阳 A 和构造 B，隐藏无关单对象选择器，退出恢复原观察对象。模式、来源、指导与基线原节点移动到 native details，并在离开 HR 时归还。手机保留整图、长说明在图下。数据、hrPosition、hrRadius、hrComparison、drawHR、基线与默认复位语义、模式ID/旧入口/状态恢复契约保持。没有改变其他模式或科学数据。

第一轮证据 output/hr-ui-round1/：desktop-default.png、desktop-selected-giant.png、desktop-comparison.png、mobile-selected-giant.png。真实 hr-operations.webm 总长24.96秒，实际操作23.015秒，覆盖画布点选红巨星→展开半径解释→同温度A/B→同光度A/B→退出并恢复红巨星→点选白矮星→开关解释。已自动1×完整播放24.986秒到 ended，主代理查看交付图与实际关键帧；独立 critic 另亲自从头1×完整观看到time=duration=24.96/ended=true，并操作正式桌面、390/320及Enter/Escape。只使用本机QA播放器4204，不是产品新页面。软件视口证据不冒充实体手机或真人科学审校。

回归：npm run check（68运行文件语法、48 Node测试、另34 Imaging科学断言）通过；node tests/hr-ui-browser.mjs 的13项通过，涵盖6真实点位、原半径、身份一致、比较进出、原基线/复位、历史Back/Forward/refresh/新链接隔离、四个同工具兄弟模式节点归还、320/390与CSS200%、原tracks缺失500及原生重试。原 standalone-refactor 用 --package build/qa/hr-ui/package 跑 assets/coverage/history-all/layout/faults，共182有效检查，包含86实际模式×视口路径和43历史恢复，最终182通过；首次竞态测试误点已披露隐藏的恒星模式按钮，仅补 native disclosure 导航后原1200ms延迟/后续Ia断言的单项复验通过。原命令含未实现的lifecycle part，不将其记为生命周期或30分钟稳定性验收，本轮没有重复旧30分钟测试。

科学/边界：原4组数值检查通过；node tools/check-boundaries.mjs --package build/qa/hr-ui/package 验证334保护项、174包文件、来源漂移0/禁止资源0。以checkpoint实际比较244个现存web文件，242逐字节不变，仅stars.js与运行白名单改变，另新增2 HR呈现文件；未改原共享renderer/物理模型/数据/其他模式页面。186运行资源在本机4198旧服务之外由本任务4203源码预览精确服务（只重启本任务自己的4203）。综合 evidence/命令在 build/qa/hr-ui/verification.json，源码哈希在 source-preservation.json。

保留核查失败：初版专项错误期待复位返回保存基线，按原所有者实际语义修正测试为默认太阳/重置基线，页面未改；Git中文路径默认quote造成3条假缺失，改只读ls-tree core.quotepath=false后全在；边界命令首次误读旧deploy产物产生3条漂移，显式指向本轮QA包后通过，未改deploy；premium第一次无范围扫描连档案/旧产物一起报告270项，限定原modules后13项既有发现均在HR之外，三个本轮呈现源0发现，未声称全模块strict通过。

独立 frontend-design-review 结论：保留方向，但 Needs work，第一轮不宜冻结。两项高优先级：展开解释/来源会遮挡A/B、关键参照线与区域名称；录屏操作顺序中关闭白矮星解释后短注释与连线持续脱锚。没有发现科学数值错误或流程阻断。完整独立结果 build/qa/hr-ui/independent-review.md。按本次要求停止在第一轮交付，不自行启动第二轮；第三样板尚未人工批准。DESIGN.md 只记录本轮特定所有者与待审状态，不建立全站系统。没有隔离 prototype、Figma、其他页面修改、部署或推送。

## 2026-10-06 HR 第二轮修复与独立通过，待人工批准

用户明确更新工作流：独立 frontend-design-review 仍有 P1/P2 时先自主修复再审，最多三轮；通过后才提交最终证据给人工，不提前提交中间视觉稿。本次在原 HR 方向完成一轮自主修改（整体第二轮），未换方向，未启动第三轮。Checkpoint 仍为 refs/checkpoints/hr-ui-before-20261006 / 722db1ad06f277447da2f05724c35fd6380895ed，原 HEAD 和暂存区不变；回退清单 build/qa/hr-ui/rollback.json 补入新几何测试的精确路径，不 reset/clean。

本轮仅修改 HR 呈现 stars-hr-ui.js/.css：注释避让原点位、对象标注、区域名称与 A/B 直接连接；下一帧和实际 ResizeObserver 尺寸稳定后重新测量注释、更新 SVG 连线端点，避免原生披露关闭后的脱锚。来源说明改在工具行下方的可关闭、可滚动短横区，位于图表外，与长对象解释协调披露。800px 实测长说明图内空间不足，因此宽度不超过1000px保留完整图表、将说明放在图下；较宽桌面保持近点注释。没有固定侧栏、KPI、新常驻按钮、科学状态注入或模型改动。第一轮接入 stars.js、原科学分支和共享 renderer 本轮均未再改。

回归：npm run check 的68运行文件语法、48 Node测试及既有 Imaging 科学断言通过，最终HR JS另单独node --check通过；13/13 HR功能专项；162/162实际几何检查，覆盖1440/1280/1024/800、六对象开闭解释、两比较与来源、完整连续白矮星路径，另1366×600和1280×620各27项；现有 standalone-refactor 的 assets/coverage/history-all/layout/faults 完整182/182通过，无需像第一轮再补测单项。334保护项与174包文件通过，sourceDrift=0、forbidden=0；checkpoint的244个旧web文件中242字节不变，仅第一轮stars.js与运行白名单变化，另2个HR呈现文件。原科学数据、坐标、共享renderer、其他模式与前两个批准样板均保持。未重复30分钟稳定性、实体手机或真人科学审校，未推送部署。Premium限定模块strict仍有13项既有发现，当前HR源0发现，不声称全站strict通过。

保留自验失败证据：初版注释区域文字避让padding不足；800px长说明重新遮点。分别扩大仅呈现文字避让空间、使用图下响应式处理后原几何断言通过，未放宽宽桌面不遮挡/连线端点断言。旧独立critic恢复后IAB失联，仅能静态续审，报告 round2/independent-review.md明确未完成动态验收；随后按用户独立审稿要求启用新critic，成功实际操作正式页面，没有把静态报告当动态通过。

最终独立 frontend-design-review：Pass，P1=0、P2=0，旧两项问题在真实连续操作及25.08秒完整1×录屏中已解决。critic实际检查六对象、两比較、来源开闭、退出恢复红巨星、白矮星连续开闭、Enter/Escape、1280/1366×600/800/390/320及实际1024；一次1024 viewport请求实际仍1280，后以CDP核实并补真1024截图，不误记。完整结论 build/qa/hr-ui/round2/independent-review-final.md，独立完整播放证据 critic-playback.json。仅2个不阻塞的P3：窄屏B标记与主序名称偏近；600px高桌面展开来源后完整横轴底部需少量滚动，A/B与关系仍可見。停止视觉修改，不为polishing扩大修改范围。

最终5张真实截图在 output/hr-ui-round2-candidate/（默认、红巨星长解释、A/B、比较+来源、390手机）。hr-operations.webm总长25.08秒，真实操作约23秒：点选红巨星→查看关系→两种比较与关系→打开/关闭来源→退出恢复红巨星→白矮星开/闭关系→稳定停留。自动原生1×播放25.655秒至ended=true；critic另实际1×从头至ended并核对原尺寸关键帧。主代理已逐张查看交付截图、完整时序contact及白矮星关闭的原尺寸帧。测试/源码/媒体哈希与命令合并到 round2/verification.json；QA运行包在 round2/package，不改deploy产物。

当前状态：第三样板独立通过，等待用户人工批准，未冻结。DESIGN.md记录新流程和HR局部规则；不推广其他模式、不改太阳系沙盘、不建全站Design System、不进Figma、不提交普通commit、不推送、不部署。源码本地预览4203保持供人工查看；临时只读QA播放器4204验收后关闭，后续必要时运行 node build/qa/hr-ui/playback-server.mjs --input output/hr-ui-round2-candidate/hr-operations.webm 重开。

## 2026-10-06 第三样板人工冻结与 UI Design Direction v1

用户明确人工批准 `stars/hr` 第二轮（P1=0、P2=0），接受两项 P3，停止布局修改；冻结为第三个已人工批准 UI 样板。三个异质样板全部完成：日地月 `earth-moon/phase` 的空间动态、Imaging `real/teaching` 的二维图像、HR `stars/hr` 的二维坐标。它们的具体批准范围不扩大至同工具其他模式，不把其余基础适配称为视觉验收。

执行 `node build/qa/hr-ui/freeze-approved.mjs`：186运行资源全部与当前manifest及已审版本SHA256一致，复核HR源码/最终媒体/独立结论未漂移；33份源码、测试脚本、审稿、测试JSON与媒体按字节复制保全。冻结记录 `build/qa/approved-hr-freeze/freeze.json`；最终5截图与25.08秒录屏、局部只读源码/测试快照在 `output/approved-hr-freeze/`，测试/审稿副本在冻结QA的evidence目录；第二轮原证据不覆盖，已有 `build/qa/hr-ui/round2/package.zip` 保存原位并记录哈希，避免复制第二套开发工程。唯一源码仍为web。

checkpoint仍为 `refs/checkpoints/hr-ui-before-20261006` / `722db1ad06f277447da2f05724c35fd6380895ed`，是改造前回退点，不称为最终批准实现的Git提交。当前批准身份由冻结源码及原QA包哈希明确；原HEAD `1e8a77642b489c990e917a4791c0eb83851fadd1` 和暂存区保留，没有另建commit、推送或部署。接受P3是局部取舍，不新增实体设备、科学审校或分发许可批准。

本轮仅设计规则提炼，根目录 `ASTRONOMYLAB-UI-DESIGN-DIRECTION.md` 是稳定规范正文：D01–D14全局规则、S/I/R各5条类型规则，明确默认/上下文/比较、控制常驻条件、直接操作、科学标注、遮挡、响应式、状态连续性、比较与复位不能统一的语义，以及dashboard/卡片堆叠禁用项。规则依据原Grammar及三样板实际批准截图/代码/验收，不创建新palette、全站CSS或组件库；后续仅按具体授权执行。DESIGN.md作为索引记录三项批准、运行时所有者及独立审稿先于人工的最多3轮工作流；README加执行文档入口，原Grammar正文保留为历史调研并加当前状态指向，不重做四站研究。

验证 `node build/qa/ui-design-direction-v1/verify.mjs` 的8项通过：14唯一全局ID、15类型规则、正文/索引本地链接、明确HR批准、33冻结副本与原件哈希、186运行资源未改、HEAD/checkpoint不变、前两个样板呈现哈希不变。`npx --offline --no -p @google/design.md designmd lint DESIGN.md` 使用现有缓存，0错误/警告。证据 `build/qa/ui-design-direction-v1/verification.json` 与 `designmd-lint.log`。本次没有代码变化，不重复运行并冒称新功能回归；HR原最终13功能/162几何/182完整回归/48 Node及语法证据已冻结保存。

当前停止在文档交付：三样板均已人工批准冻结；其余模式未改，没有Figma、新prototype、批量迁移、普通提交、推送或部署。此节覆盖上一节的“等待人工批准”历史状态。






## 2026-10-07 transit 人工冻结与 pulsar 独立通过待批准

用户明确“transit通过，开始pulsar”。transit 原实现未再改，29项源码/原图原片/审稿/测试按字节保全，状态改为已人工批准并冻结；build/qa/approved-alignments-transit-freeze/freeze.json，原checkpoint a6e95ba681ad5df12a940624fa03d67d49cfb256，保留600px桌面边界说明少量滚动P3。

本次仅正式 stars/pulsar。改造前 alternate-index checkpoint 0f9918b802d166817344677fc1f9566c9acd5210（refs/checkpoints/stars-pulsar-ui-before-20261007），普通HEAD和暂存区未变。局部呈现文件 stars-pulsar-ui.js/.css；stars.js 9个具名呈现接入逆转后与原模块逐字节相同，226旧资源仅该模块变化、新增2局部资源；原模型、数据、shared plot/scene/focus、恢复与4秒可见时钟不改。空间灯塔主体加必要同相位曲线，原phase控件支持曲线直接拖动；基线、几何、真实周期、来源按需。原app边界DOM与原基线所有者保留，SVG投影原sprite位置并在离开恢复。

最终专项13/13；全43模式完整回归182/182（181个最终完整跑通过＋1个更严格原入口异步竞争复测组合，原失败完整保留，并非声称单次全绿）；89运行文件语法、48 Node及34 Imaging科学断言；4相邻stars模式桌面/手机8组默认+操作后与8组首次切出科学状态、布局、原渲染像素精确一致；4组原曲线同尺寸仅新当前点像素差。334保护项/216包文件零漂移。设计lint零错误警告；premium strict12个既有委托按钮误报，当前局部零发现，不声称全局strict通过。最初QA包哈希过期与导引/原边界隐藏失败保留，分别重建包、披露原说明、移动原边界后完整重跑，不放宽断言。

独立critic P1=0、P2=0、P3=1，结论及完整1×自然结束播放见 build/qa/stars-pulsar/round1/review.json。最终15张真实截图与32.48秒未剪辑录屏在 output/stars-pulsar/round1/final/，原片/交付SHA一致；证据索引 build/qa/stars-pulsar/INDEX.json。停止视觉修改，等待人工批准，未冻为已批准。未改其他模式、未进入后续批次、未推送部署。预览4347；baseline4346可结束，不全局重启其他服务。

## 2026-10-08 第7批批准补记；evolution授权自动冻结

用户已明确第7批完成并批准pulsar；31项原源码、原图原片、critic与测试按字节冻结至 output/approved-stars-pulsar-freeze/，清单 build/qa/approved-stars-pulsar-freeze/freeze.json，保留局部低高桌面自然滚动P3，未微调。覆盖旧等待批准历史。

本轮仅授权正式 stars/evolution，改造前 alternate-index checkpoint 051b0e14aa9aec877266a39138dd2905e78de478（refs/checkpoints/stars-evolution-ui-before-20261007），普通HEAD/index保持。HR历史为主体，模型同一行内部示意为必要参照；初始质量与当前质量分开，EEP32行/秒明确非等时间，star_age另读；三条原MIST轨迹不插值、不添加模型末端。阶段、原基线与完整读数渐进披露；手机保留双任务。两局部呈现文件和9具名接入逆转后 stars.js 与开工前字节相同，228个旧资源仅该模块变化、新增2局部资源。模型、shared HR/内部renderer、状态/URL恢复所有者不改。

专项14/14（18原模型阶段/末端、4组原HR与内部同尺寸exact、新增低高原生键盘605→606可见性断言）；4邻接stars模式桌面/手机8组默认+操作及8组切出首帧科学状态/布局/owner/实际像素exact。完整原回归单次182/182；90语法/48Node/34Imaging；334保护218包drift0。premium strict12既有委托按钮finding、本页新增0，不声称全局绿；DESIGN lint0error/0warning。第一次专项读取关闭details的innerText为空，保留失败JSON，仅改测试观察textContent后18行逐个验证通过，无科学修复。第一次wire检测混合行尾在写源码前停止；记录具名逆转保证原字节。

独立 critic P1=0/P2=0/P3=1，真实页面、最终图与完整未剪辑1×视频验收见 build/qa/stars-evolution/round2/review.json。自动冻结授权来自本轮明确用户流程，不推断无人回复批准，也不标人工批准。图/片 output/stars-evolution/round2/final/，短索引 build/qa/stars-evolution/INDEX.json，冻结 build/qa/auto-frozen-stars-evolution/freeze.json。第一轮独立P2为低高键盘卷出观察；第二轮仅本页主控上移及必要参照紧凑排列，经同一critic独立复现修复。旧审稿与失败图保留；P3按阈值保留，停止视觉修改。科学停止条件未触发；未进入collapse/eclipse。源码预览4349。执行 node tests/stars-evolution-ui.mjs；node tests/stars-evolution-record.mjs（screens-only及原片）；node tests/standalone-refactor.mjs --base http://127.0.0.1:4349 --out build/qa/stars-evolution/round2/full --package build/qa/stars-evolution/round2/package --part assets,coverage,history-all,layout,faults（原Playwright/Edge路径）；npm run check；node tools/check-boundaries.mjs。软件浏览器验收不是实体硬件或真人科学审校。未普通提交/推送/部署。

## 2026-10-10 Collapse等待人工批准

用户接受evolution自动冻结结果，仅授权collapse完整做到critic通过后提交一次人工验收。开工前alternate-index checkpoint f0473edddce4e27358f8a2c9538621c91aeb7a4a（refs/checkpoints/stars-collapse-ui-before-20261010），普通HEAD/index保持。两个独立子任务沿用collapseTask与整模式基线/恢复，各自单主体，模型、shared renderer、状态所有者不改；9具名呈现接入反转后科学主体字节一致。专项15/15、8邻接状态/布局/画布精确对照及8首次离开对照、3原潮汐比较同尺寸像素通过；完整单次复跑182/182、91语法/48Node/34Imaging、334保护/220包/drift0。第三轮将专注任务显示锚定稳定根节点，并让原focus模块独占工作区位置所有权，P1=0/P2=0/P3=1，保留旧切任务提示语，不继续视觉修改。25图与完整新原片经独立1×自然ended复核，raw/final同SHA；首轮并发4个load超时和媒体空mesh异常保留，未放宽断言或改科学代码。索引build/qa/stars-collapse/INDEX.json，source预览4351。仅等待最终人工批准，不称为人工冻结；未进入eclipse，无普通提交/推送/部署。

