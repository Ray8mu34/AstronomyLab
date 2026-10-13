# AstronomyLab 唯一开发入口

本文件所在目录就是项目根目录和 Git 根目录，保留原 AstronomyLab GitHub 历史。2026-10-05 已把 .git 从旧 deployment/AstronomyLab 提升至此；R1 运行源码仍在原有 web/。旧嵌套仓库与发布临时文件已经移到仓库外 AstronomyLab-backups，不要恢复两套开发副本。所有开发、构建和 Git 命令在本目录执行。

先读 README.md、docs/LAB-REFACTOR-2026-10-05.md 和 docs/开发指导/10_5重构/AstronomyLab-Codex-Refactoring-Handbook-2026-10-05.md。交接文档顶部及最后目录整理记录反映现状，早期“根目录非 Git”等描述是历史。

原生 Windows PowerShell 7；Python 使用已有 Conda dl_env，不使用 WSL、不全局安装或改变环境。Node >=22，实际验证24.14.0；Node22专项待验。使用简单、可观察、可逆的操作。

16讲原始 lesson.md 是独立内容资产，Lab无需阅读讲义。11工具43模式保持ID、旧工具入口和既有引导、预设、对照、状态恢复。深度样板仅日地月4模式与图像2模式，其他37仅基础适配；保护用户满意的太阳系沙盘。图像和曲线不强制三维化，不建设没有真实内容的视频频道或制作后台。

网站源码只维护 web/，构建与测试为 tools/、tests/。本地开发使用 npm start -- --port <空闲端口>，读取源码；npm run build:deploy 生成 deploy/lab/，不要直接修改产物。运行包仅依赖已有Node，不依赖课程、文章服务或维护脚本。dist/ 是本地导出；build/qa/ 是本地证据。不另外复制一个源码工作区来重做UI。

保留当前未提交及未跟踪工作，不reset/clean回旧HEAD。科学数据、物理模型、正文、来源和许可范围保持；新科学问题单列验证与报告。工程、模型视觉、真人科学审校、教材对照和真实试讲分别按实际证据报告。不能把基础适配称为全部内容重制，也不能把软件WebGL测试视为真实硬件验收。

处理原始课程内容时，读取实际现存 docs/开发指导/教材部分/CODEX_COURSE_BUILD.md、原卷与课程方案，并从 course/_teacher/progress.md、ARTICLE_REVISION_V02.md 继续。旧手册被后续用户明确要求覆盖的条款不再适用。保护人工修改，原卷不改；不恢复已经删除的第一版投影片、练习、答案或教案，不批量运行下载/登记/作者脚本覆盖已有修改。

私有原卷与教师资料仍保留在本机，但 course/_teacher/、docs/开发指导/教材部分/、科学 raw/、工具预编译程序、凭据和内部QA被Git忽略。旧阅读导出内嵌QA也应忽略。许可待核不表示可以公开分发；运行包仍为 blocked_pending_licenses，现存素材与视频工作不得清空。

维护一份主交接，不批量生成重复报告。保留实际命令、失败与待验事项；两个样板的运动验收使用实际录屏。备份留在项目外，详细路径及恢复线索见本机 build/qa/workspace-organization/ 与主交接。

不改WebsiteZJUAAA、Sky或其他项目，不全局重启。2026-10-13用户明确授权提交、推送和部署当前状态；发布只限AstronomyLab，必须先备份与验证，只重启本项目进程。连接凭据只保留在本机，发布事实以docs/DEPLOYMENT.md和主交接最新记录为准；后续发布仍须用户授权，不照历史部署脚本自动执行。
