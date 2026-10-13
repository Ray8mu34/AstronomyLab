# 当前长文构建环境

使用已有 Conda `dl_env`，不安装依赖或改变环境。已确认的解释器为 `D:/Env/Conda/envs/dl_env/python.exe`；日常也可用 `conda run -n dl_env python`。结构检查使用 Pillow，科学绘图使用该环境现有 NumPy/Matplotlib。

离线 HTML 导出使用 `tools/vendor/pandoc-3.12/pandoc.exe`，公式为 MathML。Pandoc 官方 Windows 包来源为 [3.12发行页](https://github.com/jgm/pandoc/releases/tag/3.12)，本地下载包 SHA256 为 `2A77EBC2517D13E95056E76B1CD5B574CFE958AC61AA6058117D80C22CA19B79`；该本地哈希不表示验证发行者签名。

`render-articles-v02.mjs`使用现有 Codex Node/Playwright 和已安装 Edge 实际截图；这与内容审读、人工审校、真实试讲分别记录。路径在该脚本中，换机器需重新定位现有运行时。CSS优先使用微软雅黑及系统中文字体，未复制系统字体。

常规入口为 `integrate-articles-v02.py --check`、`build-articles-v02.py`、`integrate-articles-v02.py --require-all`。索引工具保留人工改动拒绝覆盖与版本哈希校验，概念种子为 `course/_teacher/article-concepts.csv`。

图片下载、绘图、素材登记和审读记录脚本只供定向维护；不要整批重跑覆盖用户修改。`record-root-review-v02.py`仅记录已实际完成的全文阅读/截图检查，不是自动科学评分器。2026-10-03按用户要求删除第一版PPT/PDF构建工具及一次性旧稿生成脚本。
