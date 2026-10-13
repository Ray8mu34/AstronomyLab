"""Integrate article entry points only; never author prose or rebuild v0.1 slides.

Run --check for a read-only inventory, then --require-all after the v0.2
HTML/review tools finish. Current concept seeds are independent of v0.1 files.
Generated outputs are hash-protected: a later manual edit is never overwritten.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import unquote

ASSET_FIELDS = ["asset_id", "local_path", "title", "source_page", "creator", "credit",
                "permission_or_license", "permission_checked_at", "modifications",
                "representation_type", "used_by", "release_status"]
FRAGMENTS = ["v02-first4"] + [f"v02-batch-{x}" for x in "ABCD"]
CONCEPTS = "course/_teacher/article-concepts.csv"
MANIFEST = "build/qa/article-integration-manifest.json"
INVENTORY = "build/qa/v02-article-integration.json"
PROGRESS = "course/_teacher/progress.md"
QA_PATH = "build/qa/v02-article-qa.json"
RENDER_PATH = "build/qa/v02-article-render.json"
REVIEW_PATH = "build/qa/v02-root-review.json"
BATCH_BY_LESSON = {n: "first4" if n <= 4 else "A" if n <= 7 else
                   "B" if n <= 10 else "C" if n <= 13 else "D"
                   for n in range(1, 17)}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def read_json(path: Path, default=None):
    return json.loads(path.read_text(encoding="utf-8-sig")) if path.exists() else default


def text(path: Path) -> str:
    return path.read_text(encoding="utf-8-sig")


def rel(root: Path, path: Path) -> str:
    return path.relative_to(root).as_posix()


def local(root: Path, value: str) -> Path:
    candidate = (root / unquote(value.replace("\\", "/").split("#")[0])).resolve()
    if not candidate.is_relative_to(root):
        raise ValueError(f"Path leaves workspace: {value}")
    return candidate


def csv_bytes(fields, rows) -> bytes:
    stream = io.StringIO(newline="")
    writer = csv.DictWriter(stream, fieldnames=fields, lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    return stream.getvalue().encode("utf-8-sig")


def cell(value) -> str:
    return str(value).replace("|", "\\|").replace("\n", " ")


def table(headers, rows) -> str:
    return "\n".join(["| " + " | ".join(headers) + " |", "| " + " | ".join(["---"] * len(headers)) + " |"] +
                     ["| " + " | ".join(cell(v) for v in row) + " |" for row in rows])


def get_record(report, lesson_id):
    if not isinstance(report, dict):
        return {}
    records = report.get("articles", report.get("records", report.get("lessons", [])))
    if isinstance(records, dict):
        records = [dict(value, id=key) if isinstance(value, dict) else {"id": key} for key, value in records.items()]
    for item in records:
        if isinstance(item, dict) and str(item.get("lesson", item.get("id", ""))) == lesson_id:
            return item
    return {}


def hash_matches(record, article_hash):
    digest = record.get("source_sha256", record.get("lesson_sha256", ""))
    return bool(digest and digest.lower() == article_hash.lower())


def declared_state(record, names):
    for name in names:
        value = record.get(name)
        if isinstance(value, dict):
            value = value.get("state", value.get("status"))
        if isinstance(value, str):
            return value
    return None


def heading_info(article: str):
    headings = []
    for match in re.finditer(r"^(#{1,6})\s+(.+)$", article, re.M):
        label = re.sub(r"\s*\{#[^}]+\}\s*$", "", match[2]).strip()
        headings.append({"pos": match.start(), "level": len(match[1]), "title": label})
    anchors = {}
    for match in re.finditer(r'<a\s+[^>]*id=["\']([^"\']+)["\'][^>]*>(?:\s*</a>)?|\{#([^}]+)\}', article):
        anchor = match[1] or match[2]
        previous = [h for h in headings if h["pos"] <= match.start()]
        following = [h for h in headings if h["pos"] > match.end() and h["level"] >= 2]
        # The Pro articles put an invisible concept anchor immediately before H2.
        if following and not article[match.end():following[0]["pos"]].strip():
            section = following[0]
        else:
            section = previous[-1] if previous else (following[0] if following else None)
        anchors[anchor] = section["title"] if section else ""
    return headings, anchors


def inspect(root: Path):
    qa = read_json(root / QA_PATH, {})
    render = read_json(root / RENDER_PATH, {})
    review = read_json(root / REVIEW_PATH, {})
    adoption = read_json(root / "build/qa/v02-pro-adoption.json", [])
    adopted = {str(r.get("output")): r for r in adoption if isinstance(r, dict)}
    records, warnings, input_hashes = [], [], {}
    for number in range(1, 17):
        lesson_id = f"L{number:02d}"
        directories = sorted((root / "course").glob(f"{number:02d}-*"))
        if len(directories) != 1:
            raise RuntimeError(f"Expected one directory for {lesson_id}; found {len(directories)}")
        directory = directories[0]
        source = directory / "lesson.md"
        data = source.read_bytes() if source.exists() else b""
        article = data.decode("utf-8-sig")
        source_path = rel(root, source)
        digest = sha(data)
        if source.exists():
            input_hashes[source_path] = digest
        headings, anchors = heading_info(article)
        title = next((h["title"] for h in headings if h["level"] == 1), directory.name)
        version02 = bool(re.search(r"^version:\s*[\"']?0\.2\b", article, re.M))
        pro_article = source_path in adopted and number <= 4
        # Some prose follows the supplied Pro Markdown style without YAML.
        # A current, hash-bound explicit root reading attestation is version
        # evidence; a changed file or an existing report alone is not.
        attestation = get_record(review, lesson_id)
        reviewed_article = (hash_matches(attestation, digest)
                            and attestation.get('science_review') == 'full_text_model_read_and_incremental_recheck_completed')
        current = source.exists() and (version02 or pro_article or reviewed_article)
        content_state = "v0.2 正文已落盘（草稿）" if current else "pending：仍为 v0.1/尚未落盘"
        row = {"id": lesson_id, "title": title, "source": source_path, "source_sha256": digest,
               "article_current": current, "content_state": content_state, "anchors": anchors,
               "headings": headings, "han_visible": len(re.findall(r"[\u3400-\u9fff]", article)),
               "source_verification": "pending", "html_export": "pending", "model_render_review": "pending",
               "human_review": "pending", "classroom_trial": "pending", "textbook_comparison": "pending",
               "html": None, "evidence": [], "local_images": [], "missing_images": []}
        for image in re.findall(r"!\[[^\]]*\]\(([^)]+)\)", article):
            raw_path = image.strip().split(' "')[0].strip("<>")
            if re.match(r"https?://", raw_path):
                warnings.append(f"{lesson_id} remote-only image: {raw_path}")
                continue
            target = (directory / unquote(raw_path.split("#")[0])).resolve()
            if not target.is_relative_to(root):
                raise ValueError(f"Article image leaves workspace: {raw_path}")
            row["local_images"].append(rel(root, target))
            if not target.exists():
                row["missing_images"].append(rel(root, target))
        if row["missing_images"]:
            warnings.append(f"{lesson_id} missing local images: {row['missing_images']}")
        batch = BATCH_BY_LESSON[number]
        batch_report = root / "build/qa" / f"v02-{'first4' if batch == 'first4' else 'batch-' + batch}-report.md"
        batch_sources = root / "assets" / f"v02-{'first4' if batch == 'first4' else 'batch-' + batch}-SOURCES.md"
        if current and batch_report.exists() and batch_sources.exists():
            # Read the actual fragment/report; existence alone is not verification.
            source_text, report_text = text(batch_sources), text(batch_report)
            source_claims = [line.strip() for line in source_text.splitlines()
                             if re.search(r"web-verified|已核对|实际(?:打开|查阅|核对)|状态[^\n]*partial", line, re.I)]
            row["source_claim_excerpts"] = source_claims[:8]
            row["batch_report_sha256"] = sha(batch_report.read_bytes())
            row["batch_source_sha256"] = sha(batch_sources.read_bytes())
            if source_claims and report_text.strip():
                row["source_verification"] = "partial：作者记录的支持范围；独立审读pending"
            row["evidence"].extend([rel(root, batch_report), rel(root, batch_sources)])
        q = get_record(qa, lesson_id)
        if current and hash_matches(q, digest):
            row["evidence"].append(QA_PATH)
            if isinstance(q.get("counts"), dict):
                row["counts"] = q["counts"]
            html = q.get("html", {})
            if html.get("conversion") == "passed" and html.get("file") and html.get("sha256"):
                hp = local(root, html["file"])
                if hp.exists() and sha(hp.read_bytes()) == html["sha256"]:
                    row["html"] = rel(root, hp)
                    row["html_sha256"] = html["sha256"]
                    row["html_export"] = "exported：当前源与HTML哈希匹配"
                else:
                    row["html_export"] = "pending：HTML缺失或哈希已变化"
            elif html.get("conversion") == "failed":
                row["html_export"] = "failed：见工程报告"
        elif q:
            row["evidence"].append(f"{QA_PATH}（旧源哈希，不继承通过状态）")
        r = get_record(render, lesson_id)
        if current and hash_matches(r, digest) and row.get("html_sha256") and r.get("html_sha256") == row["html_sha256"]:
            row["evidence"].append(RENDER_PATH)
            if r.get("state") == "rendered":
                row["model_render_review"] = "partial：实际浏览器渲染，模型审读pending"
            elif r.get("state") == "issues":
                row["model_render_review"] = "partial：实际渲染有问题，见报告"
        v = get_record(review, lesson_id)
        if current and hash_matches(v, digest):
            row["evidence"].append(REVIEW_PATH)
            science = declared_state(v, ["source_verification", "source_checked", "science_review"])
            model = declared_state(v, ["model_visual_review", "model_render_review", "model_review"])
            if science:
                row["source_verification"] = science + "：见独立复核实际支持范围"
            if model and row.get("html_sha256") and v.get("html_sha256") == row["html_sha256"]:
                row["model_render_review"] = model + "：见当前HTML独立模型复核"
        # Human, trial and textbook statuses remain pending without genuine dated evidence.
        records.append(row)
    return records, warnings, input_hashes


def integrate_assets(root: Path):
    rows, missing, hashes, seen = [], [], {}, {}
    for fragment in FRAGMENTS:
        path = root / "assets" / (fragment + "-ASSETS.csv")
        if not path.exists():
            missing.append(rel(root, path))
            continue
        hashes[rel(root, path)] = sha(path.read_bytes())
        reader = csv.DictReader(io.StringIO(text(path)))
        if reader.fieldnames != ASSET_FIELDS:
            raise ValueError(f"Asset schema differs from required 12 fields: {path}")
        for row in reader:
            if None in row or any(row.get(k) is None for k in ASSET_FIELDS):
                raise ValueError(f"Malformed asset row: {path}")
            identity = row["asset_id"]
            if not identity:
                raise ValueError(f"Missing asset ID: {path}")
            if identity in seen:
                if seen[identity] != row:
                    raise ValueError(f"Conflicting duplicate asset ID: {identity}")
                continue
            local(root, row["local_path"])
            seen[identity] = row
            rows.append(row)
    return rows, missing, hashes


def article_coverage(root: Path, records):
    path = root / CONCEPTS
    fields = ["exam_id", "original_concept", "primary_lesson", "article_path", "concept_anchor",
              "section_title", "article_link", "mapping_state",
              "current_source_verification", "notes"]
    by_id = {r["id"]: r for r in records}
    result = []
    for old in csv.DictReader(io.StringIO(text(path))):
        row = by_id.get(old["primary_lesson"])
        anchor = old.get("concept_anchor", "")
        valid = bool(row and row["article_current"] and anchor in row["anchors"] and row["anchors"][anchor])
        result.append({"exam_id": old["exam_id"], "original_concept": old["original_concept"],
                       "primary_lesson": old["primary_lesson"], "article_path": row["source"] if row else "",
                       "concept_anchor": anchor if valid else "", "section_title": row["anchors"][anchor] if valid else "",
                       "article_link": row["source"] + "#" + anchor if valid else "",
                       "mapping_state": "mapped-to-existing-article-section" if valid else "pending-real-article-anchor",
                       "current_source_verification": row["source_verification"] if row else "pending",
                       "notes": "原卷概念索引；映射至实际正文节标题，不代表科学审读或课堂效果通过。"})
    return csv_bytes(fields, result), result


def make_outputs(root: Path, records, assets, missing_fragments, warnings, coverage_rows, coverage_data, backup):
    README = ["# 从试卷讲起的天文学知识入门：v0.2 长文", "",
              "当前讲解基石是每讲 `lesson.md` 的独立天文学文章。01—04沿用用户提供的 Pro 范例并补本地素材；05—16依据校准后的长文要求编写。文章适用于具备大学生数学/物理理解能力、尚缺天文学先修知识的读者；篇幅不等于真实课堂计时。", "",
              "每讲目录只保留当前 `lesson.md`。阅读用HTML在 `build/articles/`，图片与数据在 `assets/`；用户据文章和素材自行制作PPT。", ""]
    if (root / 'web/observatory/index.html').exists():
        README += ["## 统一天文学网站（当前主入口）", "", "整个项目由一个网站承载：知识地图首页、16讲完整文章、81项图片素材、来源与核查状态、11个共享导航的实验室。既有太阳系和日地月已接入同一服务，无需单独启动。", "", "双击 [打开天文学实验室.cmd](web/observatory/打开天文学实验室.cmd)，或运行 `node web/observatory/server.mjs` 后访问 http://127.0.0.1:4180/ 。[全站说明与修改方式](web/observatory/README.md)、[中央实际检查](build/qa/observatory/checks.json)、[中央画面复核](build/qa/observatory/visual-review.json)。", "", "七阶段核心及星光、观测、图像、行星相位均已实际落盘；真实数据和教学示意分开。中央结果以对应报告的版本和范围为准。真人科学审校、真实试讲与教材对照仍pending。", ""]
    if (root / 'build/qa/usability-solar/REPORT.md').exists():
        README += ["2026-10-03按用户反馈修订行星标签跟随、日地月四模式引导及播放控制，并移除全站装饰性英文、改善导航与手机操作。[本轮记录](build/qa/usability-solar/REPORT.md)、[日地月交接](build/qa/usability-moon/HANDOFF.md)、[长期交接台账](course/_teacher/INTERACTIVE_VISUALIZATION_PLAN.md)。原文、物理计算和科学数据保留；旧界面报告仅代表其绑定历史版本。", ""]
    README += ["## 16篇文章入口", ""]
    entries = []
    for r in records:
        number = r["id"][1:]
        article = f"[正文]({r['source']})" if r["article_current"] else "pending：旧稿不作为v0.2入口"
        html = f"[HTML]({r['html']})" if r.get("html") else "pending"
        image_directory = root / "assets" / number / "v02"
        images = f"[素材](assets/{number}/v02/)" if image_directory.exists() else "pending"
        display_title = re.sub(r'^\d{2}\s+', '', r['title'])
        entries.append([r["id"] + " " + display_title, article, html, images, r["content_state"]])
    README += [table(["讲次与实际标题", "当前正文", "当前HTML", "本地素材", "文章状态"], entries), "",
               "[长文素材台账](assets/ARTICLE_ASSETS.csv)｜[来源片段导航](assets/ARTICLE_SOURCES.md)｜[原卷概念到真实文章节标题](course/_teacher/article-coverage.csv)｜[分项进度](course/_teacher/progress.md)", "",
               "概念索引只标真实存在的文章节标题/概念锚点，不强加课堂题目。未到齐片段或未映射锚点如实记 pending。来源核验、HTML导出、实际模型渲染审读、人工审校、真实试讲、教材对照各自独立；文件存在或工程成功不表示科学审读通过。", "",
               "## 文件维护", "",
               "2026-10-03按用户要求清理第一版课件、讲义、练习、答案、旧教案/记录、未复用素材与构建临时文件。[清理记录](build/qa/v02-cleanup-manifest.json)列出删除项及保留文件校验。原始试卷、课程方案、用户Pro范例及输入素材包、16篇当前正文和仍使用的图片保留。", "",
               "## 更新当前索引", "", "```powershell", "conda run -n dl_env python tools/integrate-articles-v02.py --check",
               "conda run -n dl_env python tools/build-articles-v02.py",
               "# 实际渲染和独立模型审读由各自工具/报告记录；不要用旧v0.1构建覆盖当前文章。",
               "conda run -n dl_env python tools/integrate-articles-v02.py --require-all", "```", "",
               "整合工具不修改正文。它只在当前正文/HTML哈希与实际报告一致时继承导出和复核状态；人工改动过的生成索引会拒绝覆盖。各片段作者报告为核验范围入口，不能代替独立科学审校。", ""]
    if (root / 'web/solar-system/index.html').exists() and not (root / 'web/observatory/index.html').exists():
        README += ["## 太阳系交互网页", "", "第01、02讲已接入Three.js沙盘，含行星介绍、距离/尺寸视图及完整文章。[打开方式与文件说明](web/solar-system/README.md)；本机服务运行时访问 http://127.0.0.1:4173/ 。", ""]
    if (root / 'web/earth-moon/index.html').exists() and not (root / 'web/observatory/index.html').exists():
        README += ["## 日地月实验室", "", "第03、04讲阶段一核心：月相双视角、同步自转与经度天平动、恒星月/朔望月、日月食与影锥，含两讲完整文章。[打开方式与文件说明](web/earth-moon/README.md)；本机服务运行时访问 http://127.0.0.1:4174/ 。", "", "[来源与模型范围](web/earth-moon/SOURCES.md)、[实际检查](build/qa/earth-moon-web/checks.json)、[模型画面复核](build/qa/earth-moon-web/visual-review.json)分别记录。真人科学审校、真实试讲和教材对照仍待完成。", ""]
    if (root / 'course/_teacher/INTERACTIVE_VISUALIZATION_PLAN.md').exists():
        README += ["## 交互可视化后续计划", "", "[建设计划与交接记录](course/_teacher/INTERACTIVE_VISUALIZATION_PLAN.md)保存全部16讲评估、七阶段实施顺序、素材与科学边界、验收和续做入口。新模块的实际状态见计划台账，计划落盘不代表已实现。", ""]
    progress = ["# v0.2 长文独立进度", "", f"整合记录：{datetime.now(timezone.utc).isoformat()}。正文为唯一当前讲解基石；各项状态只来自当前版本对应证据。", "",
                table(["讲次", "文章", "来源核验", "HTML导出", "实际模型渲染/审读", "人工审校", "真实试讲", "教材对照"],
                      [[r["id"], r["content_state"], r["source_verification"], r["html_export"], r["model_render_review"],
                        r["human_review"], r["classroom_trial"], r["textbook_comparison"]] for r in records]), "",
                "状态来自当前源哈希匹配的工程/渲染/独立模型报告；只有网页下载、CSV或HTML存在不算审读。批次作者报告的范围列为partial，详情请读对应记录。", "", "## 分讲证据与实际数量", "",
                table(["讲次", "正文汉字统计", "正文实际本地图引用", "证据报告"],
                      [[r["id"], f"主体 {r['counts']['han_body']}（工程报告）" if r.get("counts", {}).get("han_body") is not None else f"可见全文 {r['han_visible']}（未分离来源/图注）",
                        len(r["local_images"]), "; ".join(r["evidence"]) or "pending：当前报告尚未到齐"] for r in records]), "",
                "缺失资产片段：" + ("、".join(missing_fragments) or "无（五份CSV已读取）") + "。概念映射：" +
                str(sum(x["mapping_state"].startswith("mapped") for x in coverage_rows)) + "/" + str(len(coverage_rows)) + "；映射成功仅证实锚点/标题存在，不证明解释质量。", "",
                "人工科学/文史审校、真实试讲及《今日天文》教材对照未获得真实记录，保持pending。", "",
                "2026-10-03按用户指示清理v0.1文件，当前正文与所需素材保留。实际删除项及哈希保护结果见 [清理记录](../../build/qa/v02-cleanup-manifest.json)。清理不改变已有科学核验、渲染或审校状态。", ""]
    if (root / 'web/solar-system/index.html').exists():
        progress += ["## 太阳系交互网页", "", "2026-10-03新增独立Three.js网页，原文章保持为内容源。来源限定见[网页来源记录](../../web/solar-system/SOURCES.md)，工程与渲染实际状态见[浏览器检查](../../build/qa/solar-system-web/checks.json)和[模型视觉审读](../../build/qa/solar-system-web/visual-review.json)。真人科学审校与真实试讲仍pending，不从工程通过升级。", ""]
    if (root / 'web/earth-moon/index.html').exists():
        progress += ["## 日地月实验室", "", "2026-10-03按用户指令完成阶段一核心实验，[说明与打开方式](../../web/earth-moon/README.md)。月相、同步/不自转与经度天平动、两种月、日月食及影锥联动，接入03/04完整文章与本地图版。来源核验有范围限定，见[SOURCES](../../web/earth-moon/SOURCES.md)；[当前检查](../../build/qa/earth-moon-web/checks.json)记录27项数学/工程与实际浏览器检查通过，[模型画面复核](../../build/qa/earth-moon-web/visual-review.json)记录16幅已实际查看的画面。报告只代表其绑定版本。真人科学审校、真实试讲与教材对照仍pending；真实日期和精细天平动未实施。行星相位/逆行/凌星已由后续统一网站alignments补齐，不改旧模型。", ""]
    if (root / 'course/_teacher/INTERACTIVE_VISUALIZATION_PLAN.md').exists():
        progress += ["## 交互可视化建设计划", "", "[建设计划与交接记录](INTERACTIVE_VISUALIZATION_PLAN.md)保存16讲评估、七阶段顺序和当前实际台账。七阶段核心均已交付；高级扩展与核查范围仍分别列出，不把计划项视为已通过。", ""]
    if (root / 'web/observatory/index.html').exists():
        progress += ["## 全项目统一网站", "", "2026-10-03用户要求完成整个项目并合成一个大网站。[当前整站入口](../../web/observatory/README.md)以4180一个服务承载16篇全文、素材、来源状态及11个实验室，原太阳系/日地月文件受保护接入。阶段二—七核心与行星相位扩展已落盘。中央实际工程/浏览器结果、规定画面及版本分别见 [checks.json](../../build/qa/observatory/checks.json) 与 [visual-review.json](../../build/qa/observatory/visual-review.json)；分模块报告在各sources/handoff。不由本索引工具重新执行核验或自动升级状态，真人审校、真实试讲和教材对照继续pending。", ""]
    if (root / 'build/qa/usability-solar/REPORT.md').exists():
        progress += ["## 网站用户体验修订", "", "2026-10-03根据用户反馈实际修订既有太阳系与日地月界面：标签平稳跟随、四模式引导及快捷预设、上下同步播放/速度/时间、移除装饰性英文、紧凑导航与手机操作。[修订记录](../../build/qa/usability-solar/REPORT.md)、[日地月交接](../../build/qa/usability-moon/HANDOFF.md)、[文案与导航检查](../../build/qa/usability-copy/REPORT.md)。既有界面文件按本轮用户授权修改，科学计算、原文和数据保持原版本。前文27项日地月报告等为初版绑定版本；当前整站结果以中央checks/visual-review为准，生成本索引不等于重新检查。初版中央证据另存于build/qa/observatory-before-usability，真人科学审校、真实试讲与教材对照仍pending。", ""]
    progress_data = ("\n".join(progress) + "\n").encode("utf-8")
    sources = ["# v0.2 长文科学来源导航", "", "下表导航实际来源片段；核验范围、访问失败、许可与适用条件以片段记录为准。本页不重新核验来源，不把下载成功或旧v0.1状态升级为长文审读通过。", ""]
    for fragment in FRAGMENTS:
        source = root / "assets" / (fragment + "-SOURCES.md")
        report = root / "build/qa" / (fragment + "-report.md")
        sources.append(f"- {fragment}：" + (f"[来源]({source.name})" if source.exists() else "pending：来源片段未到齐") +
                       (f"；[作者实际记录](../{rel(root, report)})" if report.exists() else "；作者报告pending"))
    pro = root / "assets/v02-reference/SOURCES-pro-01-04.md"
    if pro.exists():
        sources += ["", "[用户Pro01—04文章来源表](v02-reference/SOURCES-pro-01-04.md)保留原引用编号；本地素材来源另见first4片段。"]
    sources += ["", "[长文素材台账](ARTICLE_ASSETS.csv)分开记录科学表示、署名、许可及处理，含当前仍使用的早期素材。", "",
                "当前独立工程报告：`build/qa/v02-article-qa.json`；实际浏览器渲染：`build/qa/v02-article-render.json`；独立模型复核：`build/qa/v02-root-review.md/json`。存在报告不代表每一讲当前版本都已审读，应检查source/HTML哈希与逐讲状态。", ""]
    return {"README.md": "\n".join(README).encode("utf-8"), PROGRESS: progress_data,
            "assets/ARTICLE_ASSETS.csv": csv_bytes(ASSET_FIELDS, assets),
            "assets/ARTICLE_SOURCES.md": "\n".join(sources).encode("utf-8"),
            "course/_teacher/article-coverage.csv": coverage_data}


def write_protected(root: Path, outputs, backup, inputs, inventory):
    previous = read_json(root / MANIFEST, {"outputs": {}})
    old_hashes = {f["original"]: f["sha256"] for f in backup["files"]}
    # All checks precede all writes. Manual changes cause a refusal, not a lost edit.
    for name in outputs:
        path = root / name
        if path.exists():
            expected = previous.get("outputs", {}).get(name, old_hashes.get(name))
            if expected is None or sha(path.read_bytes()) != expected:
                raise RuntimeError(f"Manual/unregistered output preserved; refusing overwrite: {name}")
    for name, digest in inputs.items():
        if sha((root / name).read_bytes()) != digest:
            raise RuntimeError(f"Input changed during integration; rerun after author finishes: {name}")
    hashes = {}
    for name, data in outputs.items():
        path = root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        hashes[name] = sha(data)
    payload = {"version": "0.2", "generated_at_utc": datetime.now(timezone.utc).isoformat(),
               "outputs": hashes, "inputs": inputs, "concept_seeds": CONCEPTS}
    (root / MANIFEST).write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def self_test():
    """Verify freshness and protection without any historical files."""
    import tempfile
    with tempfile.TemporaryDirectory(prefix="article-current-check-") as folder:
        root = Path(folder)
        for number in range(1, 17):
            p = root / f"course/{number:02d}-fixture/lesson.md"
            p.parent.mkdir(parents=True)
            p.write_text(f'---\nversion: 0.2\n---\n# Article {number}\n\n<a id="L{number:02d}-C01"></a>\n\n## Mechanism {number}\n\n正文。\n', encoding="utf-8")
        h = root / "build/articles/L01.html"
        h.parent.mkdir(parents=True)
        h.write_text("<html>Fixture</html>", encoding="utf-8")
        q = root / QA_PATH
        q.parent.mkdir(parents=True)
        q.write_text(json.dumps({"articles": [{"lesson": "L01", "source_sha256": sha((root/"course/01-fixture/lesson.md").read_bytes()), "html": {"file": "build/articles/L01.html", "conversion": "passed", "sha256": sha(h.read_bytes())}}]}), encoding="utf-8")
        c = root / CONCEPTS
        c.parent.mkdir(parents=True, exist_ok=True)
        c.write_bytes(csv_bytes(["exam_id", "original_concept", "primary_lesson", "concept_anchor"], [{"exam_id": "Q4", "original_concept": "观测", "primary_lesson": "L08", "concept_anchor": "L08-C01"}]))
        records, _, inputs = inspect(root)
        assert records[0]["html_export"].startswith("exported")
        assert all(r["human_review"] == "pending" and r["classroom_trial"] == "pending" for r in records)
        _, rows = article_coverage(root, records)
        assert rows[0]["section_title"] == "Mechanism 8"
        outputs = {"README.md": b"Generated\n", "course/_teacher/progress.md": b"Pending\n"}
        write_protected(root, outputs, {"files": []}, inputs, {})
        write_protected(root, outputs, {"files": []}, inputs, {})
        (root/"README.md").write_bytes(b"Human edit\n")
        try:
            write_protected(root, outputs, {"files": []}, inputs, {})
        except RuntimeError as e:
            assert "refusing overwrite" in str(e)
        else:
            raise AssertionError("Must preserve manual edit")
        assert (root/"README.md").read_bytes() == b"Human edit\n"
        assert (root/"course/_teacher/progress.md").read_bytes() == b"Pending\n"
        h.write_text("Changed HTML", encoding="utf-8")
        records, _, _ = inspect(root)
        assert records[0]["html"] is None
        assert records[0]["model_render_review"] == "pending"
    print("Self-test passed: current concept seeds, manual-output refusal, no partial writes, stale-HTML rejection, pending human/trial statuses.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--self-test", action="store_true", help="Test safety/freshness in disposable fixtures only")
    parser.add_argument("--check", action="store_true", help="Read-only inventory; do not write anything")
    parser.add_argument("--require-all", action="store_true", help="Require 16 v0.2 articles and all 5 asset/source fragments")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return
    root = args.root.resolve()
    records, warnings, inputs = inspect(root)
    assets, missing, asset_inputs = integrate_assets(root)
    inputs.update(asset_inputs)
    for name in FRAGMENTS:
        path = root / "assets" / (name + "-SOURCES.md")
        if not path.exists():
            missing.append(rel(root, path))
    inventory = {"generated_at_utc": datetime.now(timezone.utc).isoformat(), "article_count": len(records),
                 "current_v02_articles": sum(r["article_current"] for r in records), "asset_rows": len(assets),
                 "missing_fragments": missing, "warnings": warnings, "records": records,
                 "human_review": "pending", "classroom_trial": "pending", "textbook_comparison": "pending"}
    print(json.dumps({k: v for k, v in inventory.items() if k != "records"}, ensure_ascii=False, indent=2))
    if args.require_all and (inventory["current_v02_articles"] != 16 or missing):
        raise RuntimeError("Not all articles/fragments are ready; no outputs written")
    if args.check:
        return
    backup = {"files": []}
    inputs[CONCEPTS] = sha((root / CONCEPTS).read_bytes())
    coverage_data, coverage_rows = article_coverage(root, records)
    outputs = make_outputs(root, records, assets, missing, warnings, coverage_rows, coverage_data, backup)
    outputs[INVENTORY] = (json.dumps(inventory, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    write_protected(root, outputs, backup, inputs, inventory)
    print("Integrated current article entry points; prose unchanged; no dependency on deleted v0.1 files.")


if __name__ == "__main__":
    main()
