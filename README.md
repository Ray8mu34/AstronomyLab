# AstronomyLab

**本 README 所在目录就是唯一项目根目录，也是 Git 仓库根目录。日常开发、构建和 Git 操作都在这里进行。** 页面源码位于 `web/`；`deploy/lab/` 是生成的服务器运行包。旧的 `deployment/AstronomyLab` 开发副本已移到仓库外备份，不再维护两份网站源码。

R1 与后续分批 UI 改造保留原 Git 历史；2026-10-13 用户授权提交、推送与部署当前状态。发布结果、备份与回滚信息统一维护在 [重构交接](docs/LAB-REFACTOR-2026-10-05.md) 与 [部署记录](docs/DEPLOYMENT.md)。

16 篇原始 Markdown 是独立内容资产；Lab 是无需先读讲义的天文演示与工具集合。11 工具、43 模式保留原 ID 与入口，UI 按已批准样板分批改造。自动冻结与人工批准分别记录；解析轨道、木星测量、S2 和星表仍保留明确停止项，不能称为全模式视觉验收完成。保护太阳系沙盘及原科学数据、模型与来源。

后续独立视觉阶段的三个异质样板现已人工批准并冻结：`earth-moon/phase`（空间动态）、Imaging 两模式（二维图像）、`stars/hr`（二维坐标）。[UI Design System / Design Direction v1](ASTRONOMYLAB-UI-DESIGN-DIRECTION.md) 是后续 Codex 的稳定设计规则；[DESIGN.md](DESIGN.md) 记录批准证据与运行时所有者。规则不授权批量改造其他模式，其他页面的 R1 基础适配仍不等于视觉批准。

## 开发

在本目录使用已有 Node >=22；本地 Node 24.14.0、生产 Node 22.22.1 已分别完成源码检查。发布包完整浏览器回归182项在本地通过；生产逐资源字节核对与公网交互另行验证。无需 `npm install`。

```powershell
npm run check
npm start -- --port 4189
```

访问命令实际指定端口（如 http://127.0.0.1:4189/）。开发服务直接读取 `web/`，修改 UI 时不应编辑运行包。端口被占用时选择空闲端口，不结束其他项目进程。新增运行资源后需要重新构建资源白名单，并重新启动自己的本地预览。

## 构建运行包

```powershell
npm run build:deploy
npm run check:boundaries
node deploy/lab/web/observatory/server.mjs --port 4188
```

`build:deploy` 从当前源码生成 `deploy/lab/` 和本地 ZIP；运行包无需课程、文章服务、Python、Pandoc 或 npm 依赖。发布须有用户授权，并检查源与包哈希、生产工作区、备份和独立端口验证；只重启 AstronomyLab 进程。`build:lab` 是同一构建工具的备用 `dist/lab/` 导出，不是另一套维护源码。

## 目录职责

| 路径 | 职责 |
| --- | --- |
| `.git/` | 原 GitHub 仓库的提交历史与配置 |
| `web/` | 唯一网站源码，含 11 工具、共享代码、数据及来源 |
| `tools/`、`tests/` | 构建、维护与回归源码 |
| `course/*/lesson.md`、`assets/` | 16 篇原始正文及本地图片、来源依赖 |
| `docs/` | 开发手册及持续维护的交接记录 |
| `deploy/lab/` | 从源码生成的独立运行包；不要手工修改 |
| `dist/` | 本地资料包与派生阅读导出；Git 忽略 |
| `build/articles/` | 旧派生阅读，供兼容核查；不是 Lab 的运行依赖 |
| `build/qa/` | 本地验收、截图、录屏及目录整理证据；Git 忽略 |
| `output/` | 已交付报告等本地输出；Git 忽略 |
| `course/_teacher/`、`docs/开发指导/教材部分/` | 私有教师资料与原卷；保留在本机，Git 忽略 |
| `tools/vendor/`、`web/**/raw/` | 本机已有维护工具与科学原始文件；Git 忽略 |

旧发布副本、临时预览、审查快照和 Git 备份集中保存在项目外的 `AstronomyLab-backups/`，具体位置见本机交接记录。只有本项目根目录作为日常开发入口。

`source-protection.json` 是可随源码保存的 256 项保护子集；21 项内部 QA 被排除在 Git 发布之外，其原哈希仍记录在清单中，本机文件保持。完整 W0 记录包含 334 项，存在时边界检查优先使用完整记录。`distribution-manifest.json` 是当前 Git 可见源码及运行包文件清单；实际 HTTP 资源白名单是 `web/observatory/runtime-assets.json`。

## 原始讲义

```powershell
npm run export:lectures
```

使用既有 Conda `dl_env` 与 Pandoc；本机 `tools/vendor` 被 Git 忽略，其他机器可以用 `PANDOC` 指向已有程序。导出不改写原始 Markdown。依赖见 [tools/dependencies.md](tools/dependencies.md)。原始资料为 `dist/lectures-source/`，派生静态阅读为 `dist/lectures-web/`；可选外置阅读通过服务的 `--lectures` 接入。正式旧阅读迁移地址仍待确定。

## 验证与边界

R1 历史工程证据包括 48 项 Node 测试、全部 43 模式桌面及窄屏操作、状态恢复、六段完整录屏、原生 200% 操作及实际 30 分钟稳定性。目录整理只验证路径、源字节、Git 保护与运行，不代表重新完成全部历史验收。最新实际命令与结果见交接记录。

已知 UI 问题及其余 37 模式深改保留待办；真人科学审校、教材对照、真实试讲、实体手机、现场投影和硬件长期性能尚未完成。工程通过不能代替这些验收。

原卷、教师记录、凭据、原始科学压缩包和内部 QA 不公开上传。第三方许可待核保持待核，运行包及资料包维持 `blocked_pending_licenses`。来源见 `THIRD_PARTY.md` 与模块记录。旧 `docs/DEPLOYMENT.md`、`TECHNICAL-REPORT.md` 是历史生产记录，不能当作 R1 已部署的证明。
