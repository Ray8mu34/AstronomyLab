# 第三方来源与使用边界

发行状态：`blocked_pending_licenses`。公开仓库、运行验证或科学修复不自动确认第三方资产的再分发范围。本页根据现存模块来源记录维护，不表示取得新授权。

| 资产及衍生关系 | 运行资源 | 尚未解决的范围 |
| --- | --- | --- |
| MIST 2.5 模型表经筛选转换的演化轨道 | `/data/stars/tracks.json` | 模型表及衍生 JSON 的再分发许可为 `pending`；软件许可不能替代数据许可。详见[恒星来源](stars.md)。 |
| M17 教育 FITS 经 5×5 平均与行序转换的线性数组 | `/data/imaging/{502,656,673}-linear.f32`、`m17-metadata.json` | FITS 及衍生线性数组的再分发许可为 `pending`；发布图片政策是否覆盖这些数据仍待核。详见[图像来源](imaging.md)。 |
| 月球近远面第三方组合图 | 原素材及旧实验媒体路径中的 `moon-near-far-comparison.jpg` | NASA LRO / Jatan Mehta 署名保留，第三方组合图再分发授权为 `pending`，不能据 NASA 域名推定。详见[日地月来源](/labs/earth-moon/SOURCES.md)。 |

其他资产继续逐项按既有来源和署名记录判断，本表不授予统一许可。Three.js 与 OrbitControls 的 MIT 许可随 [vendor/LICENSE](/vendor/LICENSE) 保留。太阳系纹理的 Solar System Scope / INOVE 署名与 CC BY 4.0 记录见[太阳系来源](/labs/solar-system/SOURCES.md)。

随运行资源保留的图版作者、完整 credit、来源网址、处理方式及使用条件见[逐图署名记录](/sources/tool-credits.json)。各工具的模型与数据身份继续见本目录对应来源文件；FIRAS、Planck、2MASS 的获取及署名见[银河来源](galaxy.md)和数据 manifest。原始 ZIP、EEP、FITS 与私有教师资料不属于运行包。

维护时应核对具体资产的现行条款、取得补充授权、选择替代素材或暂停相应公开资源，再更新对应来源及本页；不得仅因测试通过把 `pending` 改为已许可。
