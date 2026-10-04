# AstronomyLab

独立天文学教学网站：16篇完整文章、11个交互实验室、素材和科学来源导航。与社团官网 WebsiteZJUAAA 分开维护和部署。

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
