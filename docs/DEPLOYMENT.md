# 独立部署交接

目标：独立子域名 lab.zjuaaa.cn、独立仓库、独立进程。用户已确认此子域名。官网不新增入口，不合并代码、不改数据库、不停止现有站点。部署时检查DNS，不能把DNS未配置误判为部署已完成。

建议服务目录 /srv/apps/astronomy-lab，PM2进程 astronomy-lab，本机端口127.0.0.1:4180，新Nginx配置 /etc/nginx/sites-available/astronomy-lab。仅新站80/443流量由Nginx转发；不要对公网开放4180。保持现有官网及其他站点配置、证书和运行状态。

现有官网代码 /srv/apps/zjuaaa-site，部署指南 /srv/apps/zjuaaa-site/docs/deployment-guide.md；生产数据 /srv/data/zjuaaa-site。现有Nginx站点 /etc/nginx/sites-available/zjuaaa-site 和 flower-site，仅作只读参考。不得把原课程工作区当作Nginx静态根目录。

服务器已读检查的环境：Node22、PM2、Nginx可用。精确主机身份、SSH用户名及私钥路径在本地对话交接中，不写入公开仓库。部署前重新核对内存、磁盘、4180占用、sudo权限、DNS和HTTPS。

本服务不需要npm install或服务器构建：克隆仓库后直接运行node web/observatory/server.mjs，可用PM2维护独立进程。Nginx新server块使用proxy_pass http://127.0.0.1:4180，保留Host、X-Real-IP、X-Forwarded-For、X-Forwarded-Proto。只做nginx -t通过后的reload，不重启/停止官网PM2进程。开机恢复参考既有PM2配置，避免覆盖其他进程列表。

单讲授者使用时不优先增加CDN或复杂缓存。先保障正确路由、全部数据、署名和访问范围，再按需要开启gzip和版本化缓存。当前no-cache并非禁止缓存，但服务未提供ETag/Last-Modified校验。

验证：首页、11实验室、16文章、来源/素材页、深层地址直接访问/刷新、WebGL2、JS/MJS MIME、F32数据、图片和参数互动；同时检查官网和flower站点仍正常。验证实际HTTP和浏览器结果，不能把PM2 online视为完成。公开上线前核对THIRD_PARTY.md的未解决许可。

回滚仅停止/恢复astronomy-lab及其单独Nginx配置，保留原站所有代码、数据、证书和进程。交付最终域名、提交SHA、服务器目录、PM2名字、Nginx路径、HTTPS状态、已完成检查和仍有阻塞。
