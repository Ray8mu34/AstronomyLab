# 第三方来源与使用边界

## 当前发行状态（2026-10-04）

独立发行仓库和站点已公开，部署记录见 `docs/DEPLOYMENT.md`。各来源文件中2026-10-03的“本机使用”“未上传”描述的是当时处理记录，不能作为当前发布状态。公开发行没有自动确认科学数据或第三方图像的再分发范围。

以下是从现有记录核对出的未决项，状态均保留为 `pending`。本轮只核对记录和实际资源路径，没有取得新的授权或作出法律结论。

| 资产与衍生关系 | 当前发行中的路径 | 已知依据与待核事项 |
| --- | --- | --- |
| MIST 2.5演化轨道：官方模型表经筛选转换为JSON | `web/observatory/data/stars/tracks.json`，服务路径 `/data/stars/tracks.json` | 官方科学下载入口和模型参数已有记录；具体模型表及衍生JSON再分发条款尚未确认。软件许可不能直接替代模型数据许可。 |
| M17教育FITS：三份拼接科学图像经5×5平均及行序转换得到线性数组 | `web/observatory/data/imaging/{502,656,673}-linear.f32`及`m17-metadata.json`，服务路径 `/data/imaging/` | 官方提供教育数据下载；一般发布图片政策能否覆盖FITS及衍生线性数组仍待核。删去原始ZIP/FITS不自动解决衍生数据的问题。 |
| 月球近远面第三方组合图 | `assets/03/v02/moon-near-far-comparison.jpg`及`web/earth-moon/media/moon-near-far-comparison.jpg`，分别由素材和旧实验路径提供 | NASA LRO / Jatan Mehta署名保留；第三方组合图再分发授权仍待核，不能只据NASA域名推定。 |

所有者后续可依据具体条款确认保留范围、取得补充授权、选择替代素材或暂停相应公开资源。当前表用于定位未决项；本轮没有删除资源，也没有把`pending`改成已获许可。其他素材仍逐项按现有资产清单核对，不把本表当成全部资产的统一许可。

## 既有来源记录

Three.js 及 OrbitControls 的许可随各 vendor/LICENSE 保留。图像署名、处理和许可记录见 assets/ARTICLE_ASSETS.csv、各资产来源Markdown及 web/observatory/sources/。

源码、原创图形、第三方图像、科学模型及科学数据不共享一个未经确认的统一许可，本仓库不添加覆盖全部文件的开源许可证。MIST轨迹、M17 FITS及其衍生数据、第三方月球组合图仍有记录为再分发审查pending的项目；继续逐项处理，不能把图片政策自动推广到所有科学数据。原始ZIP/EEP/FITS未随本仓库发布。

本仓库保留网页实际使用的衍生数据和图片，以便复现教学模型；来源记录中的内部使用/许可待核状态没有因上传GitHub自动改变。
