# AstronomyLab

独立天文学教学网站：16篇完整文章、11个交互实验室、素材和科学来源导航。与社团官网 WebsiteZJUAAA 分开维护和部署。

在线站点：[lab.zjuaaa.cn](https://lab.zjuaaa.cn/)。2026-10-04 已完成独立部署、HTTPS 和续期模拟验证。技术与性能报告见 [docs/TECHNICAL-REPORT.md](docs/TECHNICAL-REPORT.md)，维护交接见 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)。

## 运行

需要 Node.js 22。服务没有 npm 运行时依赖，不需要 npm install、数据库、Python 或服务器显卡。

```powershell
node web/observatory/server.mjs
```

打开 http://127.0.0.1:4180/ 。可用 --port 指定其他本机端口。3D和天文计算在浏览器运行，要求 WebGL2；服务器仅发送文件、路由及轻量HTML适配。

## 目录

- web/observatory：统一入口、共享界面、9个实验模块、Node服务和数据。
- web/solar-system、web/earth-moon：同来源接入的两个既有实验室。
- course：16篇 lesson.md 编辑源；build/articles：当前阅读HTML和公开科学来源页。
- assets：当前站点允许访问的素材、署名、科学表示与使用条件。
- tools/build-articles-v02.py：文章导出源；需已有Pandoc和Pillow，可用PANDOC变量指定二进制。不是运行服务的依赖。
- web/observatory/tools/prepare-catalog.py：索引源，保留人工修改的哈希保护。

原卷、教师文件、私钥、原始科学数据压缩包及内部QA报告未纳入仓库。需要重新提取科学数据时按模块来源记录另行取得原始文件；既有衍生数据已经包含，日常启动不重新下载。

原始文章和实验模型沿用当前课程版本；独立发行只更改工程状态摘要的读取位置与私有检查页链接，不升级科学审校状态。所有真人审校、真实试讲、教材对照仍pending。

部署与隔离边界见 docs/DEPLOYMENT.md；第三方素材边界见 THIRD_PARTY.md。仓库公开不代表所有素材再分发许可已确认。

## 2026-10-04 主线改进与本地验证

本轮范围和实际进度见 [改进计划](docs/IMPROVEMENT-2026-10-04.md)。段落与实验的关联使用公开概念元数据，浏览中的阅读位置、模式和关键控件状态按历史项保存；不携带原题或教师记录。自由相机姿态、比较缓存、随机噪声种子与播放状态不在本轮恢复范围内；恢复后动画暂停，已列入白名单的时间控件仍保留其读数。

`npm run check`现在执行运行界面文件语法检查和公开Node单元测试；`npm run check:syntax`只检查语法。它们均不能替代浏览器、科学模型审校或真实试讲。

浏览器回归需已有Playwright和支持WebGL的浏览器，不自动安装依赖。先启动本地预览，再运行：

```powershell
node web/observatory/server.mjs --port 4181
# 在另一终端；安装在项目中时可省略--playwright，浏览器可通过--browser指定已有程序。
npm run test:browser -- --base http://127.0.0.1:4181 --playwright "<已有Playwright模块路径>" --browser "<已有浏览器可执行文件路径>"
```

结果写入被Git忽略的`build/qa/review-improvements/`。脚本记录操作断言和截图；截图的模型视觉复核需实际打开另行记录。软件WebGL、视口模拟与实体设备、现场投影的结果分别说明。当前公开部署记录仍代表既有上线版本，本轮本地修改没有自动部署。
