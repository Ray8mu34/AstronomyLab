> 2026-10-13：用户授权发布当前R1与分批UI状态。发布准备与最新结果见主交接及本机build/qa/release-20261013；以下2026-10-04检查数量属于历史证据。运行包由deploy/lab生成，本轮不更换Nginx、证书或其他站点配置。

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
