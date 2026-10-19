## 2026-10-19 第二轮前端发布结果（当前）

用户明确授权推送后部署。生产 [lab.zjuaaa.cn](https://lab.zjuaaa.cn/) 已发布源码提交 [df03eff5faa4bfe30d4bf0251d3bf19d4a60a7a9](https://github.com/Ray8mu34/AstronomyLab/commit/df03eff5faa4bfe30d4bf0251d3bf19d4a60a7a9)，后续回执仅改维护文档。运行包 r1-20261005-ad7992e8d7e2，238资源/226文件，manifest SHA256 b5866a98b611f8c616f1e54e1b4898112bf4f08c2770d31a1dbf9ac4ba4086a6；blocked_pending_licenses及完整署名保持。

部署前 /srv/apps/astronomy-lab 的HEAD为67048a8b180ea39385f5d328ed5bc5feffcea735、工作区clean。可读归档、Git bundle及SHA位于 /srv/data/astronomy-lab/release-frontend-round2-20261019/，私有PM2快照只保留服务器。因远端GitHub fetch未完成，使用本机已推送并核实的1.01MB增量bundle，验证所需旧基点与目标Git对象；未改origin配置。独立候选4181保留旧服务时完成 Node22.22.1 的95语法/103Node、256公开保护（254原哈希＋2科学精确例外）、226包SHA及238 HTTP SHA、43模式入口、5私有/不存在404和POST405。精确状态16/16、关键UI7/7通过；完整本轮软件验收身份见唯一主交接，不将发布抽测称为重复全量182。

仅重启 astronomy-lab，当前PID823408、Node22.22.1、入口 /srv/apps/astronomy-lab/web/observatory/server.mjs、监听127.0.0.1:4180；PM2列表已保存。本机与公网首页200，实际 /app.js SHA256 46c4cb5577c28a15ab95a2bf90746ff21d92f780e9eb6eddcedc926833e544a5 与候选一致，服务器manifest SHA相同。其他站点 zjuaaa-site PID23405与三份Nginx配置SHA不变，没有改代理、证书或全局重启。

回滚先核对本仓库clean，再仅执行 git -C /srv/apps/astronomy-lab switch --detach 67048a8b180ea39385f5d328ed5bc5feffcea735 和 pm2 restart astronomy-lab，确认4180及HTTPS健康。不要恢复整套PM2或Nginx。后续文档回执只快进到服务器、不再重启。公开上传扫描851文件0命中，输入01/02包、教师、raw、QA及凭据留本机。详细命令与实际失败记录在本机 build/qa/release-frontend-round2-20261019/，以下10月13日及10月4日为历史记录。

> 2026-10-13：用户授权发布当前R1与分批UI状态。发布准备与最新结果见主交接及本机build/qa/release-20261013；以下2026-10-04检查数量属于历史证据。运行包由deploy/lab生成，本轮不更换Nginx、证书或其他站点配置。

## 2026-10-13 发布结果

R1与当前分批UI已从原`1e8a776`快进发布，代码提交`38c7a48678e913a32fc0ba942ec3b64db6e6f729`（含公开保护清单范围修正）；后续发布回执只更新维护文档。生产仍由ubuntu的PM2 `astronomy-lab`运行`/srv/apps/astronomy-lab/web/observatory/server.mjs`，监听127.0.0.1:4180，实际Node22.22.1。生成deploy/lab与生产web资源一致，不引入新运行依赖或外部课程服务。

同一发布包本地完整浏览器182/182；本地97语法/48Node/34Imaging与完整334保护通过。生产源码在独立归档中完成Node22同项检查，公开256保护及232包哈希通过；实际服务244资源逐一HTTP取回、SHA一致。HTTPS首页、月相、HR、Imaging返回200；公网真实操作检查4/4、脚本异常0，覆盖月相手调与比较+条件、HR对象与A/B身份、Imaging真实数组不因赋色改变。私有与不存在路径404、POST405。软件Edge/SwiftShader不代表实体设备或科学审校。

首次远端完整浏览器运行因太阳系大素材默认30秒load超时中止，证据保留；没有称其完整通过。首次277公开保护清单含21个不公开的内部QA，保留失败并修正为256公开保护+21原哈希保留记录，本机完整334项范围不变。

回滚材料位于`/srv/data/astronomy-lab/release-20261013/previous-worktree.tgz`与`previous-head.bundle`，另有仅在服务器保存的PM2部署前私有快照。旧工作区部署前clean；只重启AstronomyLab并保存进程列表，其他站点PID及核对的Nginx配置哈希保持。既有第三方pending、四项功能/UI停止项与人工验收身份保持，不因部署自动升级。

若需要代码回滚，先核对本项目工作区clean，再仅在本仓库`git switch --detach 1e8a77642b489c990e917a4791c0eb83851fadd1`并重启`astronomy-lab`、核对本地及HTTPS健康；不要reset其他项目或恢复整套PM2/Nginx配置。历史旧阅读地址仍按R1隔离兼容回退；本轮没有接入外置讲义包。

# 独立部署与维护交接

2026-10-04 已部署到 https://lab.zjuaaa.cn/，源码仓库为 https://github.com/Ray8mu34/AstronomyLab。官网不新增入口，两个项目分别维护。SSH 登录资料仅保留在本地对话，不写入公开仓库。

## 当前部署

| 项目 | 实际位置或配置 |
| --- | --- |
| 代码 | `/srv/apps/astronomy-lab`，Git 分支 `main` |
| 启动入口 | `node web/observatory/server.mjs`，Node.js 22 |
| PM2 | `astronomy-lab`，由 `ubuntu` 用户维护 |
| 监听 | `127.0.0.1:4180`，只通过 Nginx 对外提供服务 |
| 运行日志 | `/srv/data/astronomy-lab/logs/out.log`、`error.log` |
| Nginx | `/etc/nginx/sites-available/astronomy-lab`，同名启用链接 |
| TLS | `/etc/letsencrypt/live/lab.zjuaaa.cn/`；不要读取或公开私钥 |
| ACME 验证根目录 | `/srv/data/astronomy-lab/acme` |
| 证书续期 | `certbot.timer` 已启用；webroot 验证，成功后 reload Nginx |
| 开机恢复 | 既有 `pm2-ubuntu` 服务已启用，进程列表已保存 |

DNS 在父域名 `zjuaaa.cn` 的 DNSPod 解析区添加 `lab`、类型 A、指向部署服务器 IPv4，线路和 TTL 使用默认值。不需要建立独立子域解析区或 NS 委派。2026-10-04 已通过权威与递归解析确认记录生效。

Nginx 的 80 端口保留 `/.well-known/acme-challenge/` 的 webroot 路由，其余请求 301 跳转 HTTPS。443 使用本子域的独立证书，反向代理 `127.0.0.1:4180`，保留 Host 和转发地址、协议头；JS、CSS、JSON 与 F32 等响应启用 gzip。服务端未配置长期缓存或内容校验缓存头，原始 JPEG/PNG 仍按文件传输。

## 原站保护边界

现有官网代码 `/srv/apps/zjuaaa-site`，部署指南 `/srv/apps/zjuaaa-site/docs/deployment-guide.md`，生产数据 `/srv/data/zjuaaa-site`。原 Nginx 配置 `/etc/nginx/sites-available/zjuaaa-site` 和 `flower-site` 只作参考。不得合并代码、改数据库、停服、重启其他 PM2 进程、复用其他站点证书，或把原课程工作区作为 Nginx 静态根目录。

本次部署前后，原官网与 flower 的 Nginx 文件 SHA256 一致，官网进程 PID 未变，官网 HTTPS 返回 200。其他站点的独立运维问题不能归入本项目自动修复。

## 更新与检查

在本地修改独立仓库，验证后更新 `distribution-manifest.json` 中的文件列表、字节数和 SHA256，提交并推送。服务器只更新本目录；先检查有无本地修改，有修改则停下核对，不能直接 reset 或覆盖。

```bash
git -C /srv/apps/astronomy-lab status --short
git -C /srv/apps/astronomy-lab pull --ff-only origin main
cd /srv/apps/astronomy-lab
node --check web/observatory/server.mjs
```

变更服务代码后，只重启本进程：

```bash
pm2 restart astronomy-lab
curl --fail --retry 10 --retry-connrefused --retry-delay 1 http://127.0.0.1:4180/ -o /dev/null
curl --fail https://lab.zjuaaa.cn/ -o /dev/null
pm2 save
```

仅调整静态素材或文档通常不需要重启 Node。Nginx 变更必须先 `sudo nginx -t`，成功后 `sudo systemctl reload nginx`。不要执行 `pm2 restart all`、`pm2 delete all` 或停止 Nginx。

证书检查与本证书续期模拟：

```bash
sudo openssl x509 -in /etc/letsencrypt/live/lab.zjuaaa.cn/fullchain.pem -noout -dates
sudo certbot renew --cert-name lab.zjuaaa.cn --dry-run
systemctl is-active certbot.timer
```

本次证书到期时间为 2027-01-02 UTC；以后以实际证书为准。本项目运行无 npm 包依赖、数据库、Python 或构建步骤。重新导出文章才需要 Pandoc 与 Pillow，按本地既有环境配置，不在服务器全局安装。

## 验证与回滚

本次检查覆盖：独立副本本地 31 个页面的浏览器加载及文章/素材图像；生产 Node 31 个页面和共 145 个 HTTP 检查；公网 HTTPS 首页、日地月、图像处理、第 01 讲，含两项参数交互。无浏览器脚本异常或网络错误。HTTP 跳转、证书校验、gzip、只监听回环地址、续期模拟及官网访问均通过。浏览器使用 Edge 无头模式和软件 WebGL，不能据此宣称真实硬件帧率、真人科学审校、真实试讲或教材对照通过。

回滚先记录当前版本和工作区，再仅恢复本仓库版本与 `astronomy-lab` 进程；必要时只禁用或恢复本项目的 Nginx 文件，测试配置后 reload。部署前 HTTP 配置备份位于 `/srv/data/astronomy-lab/nginx-http-before-*.conf`。不要恢复整个 PM2 列表或整套 Nginx 配置，以免覆盖其他项目后续更新。PM2 的部署前备份含运行环境信息，不能公开上传。

第三方许可和科学核验待办仍按 `THIRD_PARTY.md` 与各模块来源记录处理；工程上线没有升级这些状态。
