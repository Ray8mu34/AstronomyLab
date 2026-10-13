# 天文学实验室 R1 维护入口

当前Lab是可脱离讲义使用的天文演示与工具集合；16原始Markdown仍是独立内容资产。本轮不推送、不部署。最新执行、包哈希、实际证据和已知限制统一维护在 [R1交接](../../docs/LAB-REFACTOR-2026-10-05.md)。

```powershell
npm run check
npm start -- --port 4189
```

以上命令在项目及Git根目录执行，打开 http://127.0.0.1:4189/，直接维护当前 `web/` 源码。旧 `deployment/AstronomyLab` 已移到项目外备份，不再作为工作区。

本地构建与独立运行验证：

```powershell
npm run export:lectures
npm run build:deploy
npm run check:boundaries
node deploy/lab/web/observatory/server.mjs --port 4188
```

运行包预览为 http://127.0.0.1:4188/ 。`deploy/lab` 是产物，不手工维护；`build:lab` 仍可另导出 `dist/lab`。已有Node >=22，无npm运行依赖；不双击HTML。首次运行不需要外网，空间工具需要WebGL2；纯二维工具使用Canvas/SVG。端口被占用时使用另一个空闲端口，不结束其他项目进程。

`shared/tool-registry.js` 保留11工具/43模式的稳定ID、URL与主题，不含课程编号。主入口不读取catalog/文章。core-controls.js和plot.js是纯二维，scene.js为需要的空间分支按需加载。日地月与太阳系保留完整页面并原生初始化；九模块沿用mount/dispose和状态白名单。日地月/图像的配方是可验证输入配方，历史恢复、临时对照和完整跨设备存档有明确不同范围。

运行包资源权限来自 runtime-assets.json 精确清单；不开放维护工作区。原文、科学输入、原图与许可不因界面重构改写。图像、曲线保留二维，太阳系保留原场景。

讲义源与实际依赖在 `dist/lectures-source/`，派生阅读包在 `dist/lectures-web/`。旧阅读URL交由隔离compat/lectures-server.mjs：可选 `--lectures "<lectures-web绝对目录>"`，没有外置包显示开发期资料说明，工具仍工作。正式迁移地址需另行确定；本轮不改生产重定向。旧工具mode/from保留；classic只在非样板保留历史布局，样板明确迁为原生新布局。

6样板完成深度改造，37其他模式按基础适配与后续深改分别报告。真人科学审校、真实试讲、实体手机和现场投影尚未完成。录屏是实际操作验收材料，不是教学成片。没有视频频道或制作后台。

MIST、M17及第三方图像的再分发待核；本地资料包不等于自由公开发布。工具sources与各许可证随依赖保留，原卷、教师材料、私有QA、凭据不进入服务或运行包。
