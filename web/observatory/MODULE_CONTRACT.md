# 统一天文学网站模块契约（2026-10-03）

用户要求整个项目为一个大网站，允许子页面。统一入口 `web/observatory/`、一个本机服务4180。主执行者维护服务器、导航、首页、全文、素材库、全局CSS与共享工具。原文章、Pro范例与原模型/数据受保护。2026-10-03后续用户授权太阳系、日地月及各模块界面改进，按本轮文件所有权逐块编辑，禁止用备份整文件回退人工修改。

## 模块

新模块放 `modules/<slug>.js`，数学可放 `modules/<slug>-physics.mjs`。导出 `export function mount(el)`（可async），返回清理函数或 `{dispose()}`。所有浏览器代码ES模块，使用本地Three.js0.180.0；从 `../shared/lab.js` 导入工具。从 `three`、`three/addons/controls/OrbitControls.js` 导入亦可。

每模块是完整教学实验：可运行可调参数、3D/二维联动、实际结果和数量、三段以上连贯解释、公式、限定、完整文章链接与素材/来源入口。禁止只有球体、占位控制、只有介绍。顶部标题由网站壳提供，可在模块内用实验小标题。中文字句适合顶级大学本科生。

共享CSS类：`.lab-grid`（两列）、`.viz-panel`（含 `.panel-title`、`.scene-host`）、`.plot-canvas`（100%宽260高）、`.lab-controls`、`.control`、`.control-row`、`.button-row`、`.active`、`.metrics`（内部`<div><small>...</small><strong>...</strong></div>`）、`.lab-copy`、`.formula`、`.note`、`.legend`、`.lab-tabs`。移动端单列。`.scene-host`默认高度420px，手机340px；需高度可写style。避免iframe、独立网页/服务器、依赖新安装。

共享JS：

```js
import {THREE, makeScene, plot, lessonLinks, assetURL, bindControls} from '../shared/lab.js';
// makeScene(host,{position:[9,7,10],target:[0,0,0],fov:45})
// => {scene,camera,controls,renderer,loop(callback),render(),dispose()}
// loop callback(deltaSeconds, elapsedSeconds)，dispose清理RAF/Observer/Controls/材质/几何
// plot(canvas,{series:[{points:[[x,y],...],color:'#71c8c7',label:'...'}],
// xDomain:[min,max],yDomain:[min,max],xLabel:'...',yLabel:'...',logX:false,logY:false})
// => {width,height,toPixel(x,y)}，canvas高取CSS/clientHeight; 使用DPR
// bindControls(el,state,onChange):监听[data-key]的input/select，number/range转number，checkbox转bool
// 更新[data-value="key"]文本为值；返回取消监听函数。需自定义格式则在onChange内更新。
// lessonLinks([5,6,7]) => HTML anchors href="/read/05"...
// assetURL('assets/13/v02/xxx.jpg') => '/assets/13/v02/xxx.jpg'
```

调用window外禁止永久添加事件未清理。主壳切换模块会执行dispose。暴露 `window.__lab` 可供测试（状态/结果），离开时删除自己对象。数学单独导出供独立极限/基准检查。

## 当前课程入口与控件约定

课程/主题/实验的公共注册表为 `shared/course-map.js`。统一路径采用 `/lab/<slug>?mode=<已确认键>`；两个原子页面仍是 `/labs/<slug>/?mode=<键>`。无效键恢复模块默认。兼容第二参数 `mount(el,{mode}={})` 的模块直接接收模式；已冻结且保留单参数接口的模块，由共享 `mode-entry.js` 顺次点击已确认的真实按钮。禁止直接写 `window.__lab.state` 来伪造入口。课程链接启用前必须实测当前模式、按钮与图形。

当前问题、主要图形、主控与读数相邻；操作建议可以收起，高级参数和完整解释仍可展开。原生输入/按钮/选择框负责键盘交互，标签带单位；当前模式/预设用 `aria-pressed`，展开用 `aria-expanded`。修改参数后，图形、读数和输入标签保持同步；`syncControls()`遵守原生输入步长但不降低模型计算精度。

播放/暂停保留当前构型；模式切换和重置的状态范围以按钮文字与反馈说明。多数“本项/本页起点”重置保留当前任务；图像“重置实验”恢复默认数据/处理链，银河“重置实验”恢复盘外可见光和默认 CMB 参数。二者是全工作台重置，不能描述为仅重置一个滑杆。放大采用原生对话框，可见关闭与 Escape 均回到原入口；只移动既有画布/控件时须确保节点唯一且关闭后归位。

离开模块执行清理，完整文章与素材库仍在统一导航下。太阳系的直达选择在原页面就绪后执行；它的原完整页面生命周期由浏览器导航结束。URL只保存入口任务，不承诺保存所有实验参数、随机噪声或播放时刻。

## 数据/来源/证据

科学机制和新数据实际浏览官方/论文来源，不能靠记忆或搜索摘要。分模块写 `sources/<slug>.md`，实际URL、读取内容、许可、未核项、假设、计算方法。新增数据放 `data/<slug>/`，注明来源/历元/单位/误差/表示性质。沿用现有81项素材不改原件，不冒充本轮新增核验。优先真实资料；无数据时教学示意明确标注，不伪造恒星目录、演化轨迹、CMB或窄带原始图像。

交付 `sources/<slug>-handoff.md` 记录文件、正常/边界测试建议、实际执行情况、未决问题；模型视觉复核、人审/课堂试讲各自独立。不得自动生成科学/视觉“通过”。主执行者统一实际浏览器和视觉核查。
