"""Build offline article previews and structural QA, without editing course sources.

Usage: conda run -n dl_env python tools/build-articles-v02.py
Optional calibration: --lessons 01,02,03,04
Counts describe text, not scientific or narrative depth. HTML conversion is not
browser visual review; source verification and human review remain separate.
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import html
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
from datetime import datetime, timezone
from urllib.parse import unquote, urlsplit, urlunsplit

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PANDOC = Path(os.environ.get('PANDOC') or shutil.which('pandoc') or str(ROOT / 'tools/vendor/pandoc-3.12/pandoc.exe'))
OUT = ROOT / 'build/articles'
QA = ROOT / 'build/qa/v02-article-qa.json'
HAN = re.compile(r'[\u3400-\u4dbf\u4e00-\u9fff\U00020000-\U0002ebef]')
SOURCE_HEADING = re.compile(r'^(?:来源(?:与.*)?|参考资料(?:与.*)?|参考文献|资料与.*|素材与.*|进一步阅读|相关图版|来源说明|引用资料|本篇来源)(?:[：:].*)?$')
CAPTION = re.compile(r'^(?:图\s*(?:[0-9０-９一二三四五六七八九十A-Z]|[注版：:])|图片说明|影像说明|素材说明)')
OLD_HEADINGS = {'学习目标与前置知识', '学习目标', '28 分钟流程', '28分钟流程',
                '练习和答案', '图示与操作', '延迟复核', '首次验收', '学习者验收', '出口任务'}
PLACEHOLDERS = re.compile(r'(?i)\b(?:TODO|TBD)\b|这里可以放图|此处(?:插入|放置|补充)(?:图片|图像|图表|正文)|待(?:插入|补写|撰写)(?:图片|正文|图表)|占位(?:图|图片|文本)|\{\{[^}]+\}\}')
NS = '{http://www.w3.org/2000/svg}'


class Tags(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.links, self.words = [], [], []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'):
            self.ids.append(a['id'])
        if tag == 'a' and a.get('name'):
            self.ids.append(a['name'])
        for key in ('href', 'src'):
            if a.get(key):
                self.links.append((a[key], 'Image' if key == 'src' else 'Link'))

    def handle_data(self, data):
        self.words.append(data)


def walk(obj):
    if isinstance(obj, dict):
        if 't' in obj:
            yield obj
        for value in obj.values():
            yield from walk(value)
    elif isinstance(obj, list):
        for value in obj:
            yield from walk(value)


def plain(obj, image_alt=False):
    """Visible AST text; suppress image alternative text in running prose."""
    if isinstance(obj, list):
        return ''.join(plain(x, image_alt) for x in obj)
    if not isinstance(obj, dict):
        return ''
    kind, c = obj.get('t'), obj.get('c')
    if kind == 'Str':
        return c
    if kind in ('Space', 'SoftBreak', 'LineBreak'):
        return ' '
    if kind in ('Code', 'CodeBlock', 'Math'):
        return c[-1]
    if kind == 'Image':
        return plain(c[1], image_alt) if image_alt else ''
    if kind == 'Link':
        return plain(c[1], image_alt)
    if kind in ('RawBlock', 'RawInline'):
        if c[0] == 'html':
            p = Tags()
            p.feed(c[1])
            return ''.join(p.words)
        return ''
    if kind == 'Header':
        return plain(c[2], image_alt)
    if kind == 'Figure':
        # Caption is counted in its own category below, never as running prose.
        return (plain(c[1]) if image_alt else '') + plain(c[2], image_alt=False)
    if kind == 'Table':
        # Table attributes contain identifiers/classes, not article prose.
        return plain(c[1:])
    return plain(c, image_alt)


def issues_append(record, severity, code, **data):
    record['issues'].append(dict(severity=severity, code=code, **data))


class Builder:
    def __init__(self, selected):
        self.selected = selected
        self.articles = {}
        for n in range(1, 17):
            files = sorted((ROOT / 'course').glob(f'{n:02}-*/lesson.md'))
            if len(files) == 1:
                self.articles[files[0].resolve()] = OUT / f'L{n:02}.html'
        self.cache, self.anchor_cache, self.image_cache, self.source_hash = {}, {}, {}, {}
        self.support_queue, self.support_done, self.support_records = set(), set(), []

    def ast(self, source):
        source = source.resolve()
        if source not in self.cache:
            blob = source.read_bytes()
            raw = blob.decode('utf-8-sig')
            self.source_hash[source] = hashlib.sha256(blob).hexdigest()
            result = subprocess.run([str(PANDOC), '--from=markdown', '--to=json'],
                                    input=raw, capture_output=True, text=True, encoding='utf-8')
            if result.returncode:
                raise RuntimeError(result.stderr.strip() or 'Pandoc AST failed')
            self.cache[source] = (raw, json.loads(result.stdout), result.stderr.strip())
        return self.cache[source]

    def anchors(self, source):
        source = source.resolve()
        if source in self.anchor_cache:
            return self.anchor_cache[source]
        ids = []
        if source.suffix.lower() == '.md':
            _, ast, _ = self.ast(source)
            for node in walk(ast['blocks']):
                if node['t'] == 'Header':
                    ids.append(node['c'][1][0])
                elif node['t'] in ('Div', 'Span', 'Figure', 'Table', 'CodeBlock'):
                    c = node.get('c', [])
                    if c and isinstance(c[0], list) and c[0] and isinstance(c[0][0], str):
                        ids.append(c[0][0])
                elif node['t'] in ('RawBlock', 'RawInline') and node['c'][0] == 'html':
                    tags = Tags()
                    tags.feed(node['c'][1])
                    ids.extend(tags.ids)
        elif source.suffix.lower() in ('.html', '.htm', '.svg'):
            tags = Tags()
            tags.feed(source.read_text(encoding='utf-8-sig'))
            ids = tags.ids
        self.anchor_cache[source] = [x for x in ids if x]
        return self.anchor_cache[source]

    def local(self, url, source):
        """Return a resolved local target and fragment, or None for nonlocal URLs."""
        if re.match(r'^[A-Za-z]:[/\\]', url):
            return Path(unquote(url)).resolve(), ''
        parsed = urlsplit(url)
        if parsed.scheme and parsed.scheme.lower() not in ('file',):
            return None
        if parsed.netloc and parsed.scheme != 'file':
            return None
        path = unquote(parsed.path)
        if parsed.scheme == 'file' and re.match(r'^/[A-Za-z]:/', path):
            path = path[1:]
        target = (source.parent / path).resolve() if path else source.resolve()
        return target, unquote(parsed.fragment)

    def destination(self, source):
        source = source.resolve()
        if source in self.articles:
            return self.articles[source]
        return (OUT / 'linked' / source.relative_to(ROOT)).with_suffix('.html')

    def rewrite(self, url, source, output, queue=True):
        loc = self.local(url, source)
        if loc is None:
            return url
        target, fragment = loc
        query = urlsplit(url).query
        if target == source.resolve() and url.startswith('#'):
            return url
        if target.suffix.lower() == '.md' and target.is_file() and target.is_relative_to(ROOT):
            dest = self.destination(target)
            if target not in self.articles and queue:
                self.support_queue.add(target)
        else:
            dest = target
        relative = Path(os.path.relpath(dest, output.parent)).as_posix()
        # URL encode spaces and Unicode; a native offline browser then decodes them.
        from urllib.parse import quote
        return urlunsplit(('', '', quote(relative, safe='/:'), query, fragment))

    def decode_image(self, source):
        source = source.resolve()
        if source in self.image_cache:
            return self.image_cache[source]
        try:
            if source.suffix.lower() == '.svg':
                import xml.etree.ElementTree as ET
                root = ET.parse(source).getroot()
                if root.tag != NS + 'svg' and root.tag != 'svg':
                    raise ValueError('SVG root element missing')
                item = {'status': 'svg_xml_valid', 'raster_decode': 'not_applicable',
                        'browser_svg_render': 'not_run', 'viewBox': root.get('viewBox')}
            else:
                with Image.open(source) as im:
                    fmt, size, frames = im.format, im.size, getattr(im, 'n_frames', 1)
                    im.verify()
                with Image.open(source) as im:
                    im.load()
                item = {'status': 'decoded', 'format': fmt, 'width': size[0],
                        'height': size[1], 'frames': frames,
                        'animation_review': 'not_run' if frames > 1 else 'not_applicable'}
        except Exception as exc:
            item = {'status': 'failed', 'error': str(exc)}
        self.image_cache[source] = item
        return item

    def counts(self, ast):
        body, captions, sources = [], [], []
        tail, last_image = False, False
        blocks = ast['blocks']
        for i, block in enumerate(blocks):
            text = plain(block)
            if block['t'] == 'Header' and SOURCE_HEADING.match(text.strip()) and i >= len(blocks) * .55:
                tail = True
            if i >= len(blocks) * .8 and text.lstrip().startswith(('相关图版', '来源说明', '来源与素材记录', '资料性质', '素材来源', '具体来源核对', '具体事件核验', '测量来源、近似条件')):
                tail = True
            if tail:
                sources.append(plain(block, image_alt=True))
                continue
            if block['t'] == 'Figure':
                captions.append(plain(block['c'][1]))
            elif last_image and block['t'] in ('Para', 'Plain') and CAPTION.match(text.strip()):
                captions.append(text)
                last_image = False
                continue
            else:
                # Alternative text is classified as caption even if there is no
                # visible figure caption. It is always excluded from body text.
                captions.extend(plain(n['c'][1]) for n in walk(block) if n['t'] == 'Image')
            body.append(text)
            last_image = any(n['t'] == 'Image' for n in walk(block))
        return {'han_body': len(HAN.findall('\n'.join(body))),
                'han_captions_and_alt': len(HAN.findall('\n'.join(captions))),
                'han_source_tail': len(HAN.findall('\n'.join(sources))),
                'han_total_visible': len(HAN.findall(plain(blocks, image_alt=True))),
                'count_policy': 'AST visible text; title/section headings and tables included in body; figure captions/image alt and recognized source tail separated; metadata/URLs/raw HTML markup excluded',
                'depth_assessment': 'not_inferred_from_character_count'}

    def inspect(self, source, ast, record):
        ids = self.anchors(source)
        duplicates = sorted({x for x in ids if ids.count(x) > 1})
        if duplicates:
            issues_append(record, 'error', 'duplicate_anchor', anchors=duplicates)
        record['anchors'] = ids
        nodes = list(walk(ast['blocks']))
        record['math'] = {'inline': sum(n['t'] == 'Math' and n['c'][0]['t'] == 'InlineMath' for n in nodes),
                          'display': sum(n['t'] == 'Math' and n['c'][0]['t'] == 'DisplayMath' for n in nodes),
                          'output': 'offline MathML', 'browser_visual_review': 'not_run'}
        for node in nodes:
            if node['t'] == 'Header':
                title = plain(node).strip()
                if title in OLD_HEADINGS:
                    issues_append(record, 'warning', 'legacy_classroom_heading', text=title)
        text = plain(ast['blocks'], image_alt=True)
        for match in PLACEHOLDERS.finditer(text):
            issues_append(record, 'warning', 'possible_empty_placeholder', text=text[max(0, match.start()-25):match.end()+35])
        legacy_ids = sorted(set(re.findall(r'L\d{2}-(?:Q|A|D)\d{2}', text)))
        if legacy_ids:
            issues_append(record, 'warning', 'legacy_classroom_task_markers', markers=legacy_ids)
        record['article_revision_state'] = 'legacy_classroom_structure_detected' if any(x['code'].startswith('legacy_') for x in record['issues']) else 'article_structure_no_legacy_markers'
        references = []
        for node in nodes:
            if node['t'] in ('Link', 'Image'):
                references.append((node['c'][2][0], node['t']))
            elif node['t'] in ('RawBlock', 'RawInline') and node['c'][0] == 'html':
                tags = Tags()
                tags.feed(node['c'][1])
                references.extend(tags.links)
        record['local_references'], record['external_references'] = [], []
        for url, kind in references:
            loc = self.local(url, source)
            if loc is None:
                record['external_references'].append({'url': url, 'kind': kind, 'web_verification': 'not_run_by_this_tool'})
                if kind == 'Image':
                    issues_append(record, 'warning', 'remote_image_not_offline', url=url)
                continue
            target, fragment = loc
            item = {'url': url, 'kind': kind, 'target': self.rel(target), 'exists': target.is_file(), 'fragment': fragment}
            record['local_references'].append(item)
            if not target.is_file():
                issues_append(record, 'error', 'missing_local_target', url=url, target=self.rel(target))
                continue
            if fragment:
                if target.suffix.lower() in ('.md', '.html', '.htm', '.svg'):
                    try:
                        item['anchor_exists'] = fragment in self.anchors(target)
                        if not item['anchor_exists']:
                            issues_append(record, 'error', 'missing_local_anchor', url=url, target=self.rel(target), anchor=fragment)
                    except Exception as exc:
                        issues_append(record, 'error', 'anchor_check_failed', url=url, error=str(exc))
                else:
                    item['anchor_exists'] = 'not_checked_for_this_file_format'
            if kind == 'Image':
                item['image'] = self.decode_image(target)
                if item['image']['status'] == 'failed':
                    issues_append(record, 'error', 'image_decode_failed', url=url, error=item['image']['error'])

    @staticmethod
    def rel(path):
        try:
            return path.relative_to(ROOT).as_posix()
        except ValueError:
            return str(path)

    def convert(self, source, ast, output, record):
        converted = copy.deepcopy(ast)
        normalized_math = []
        for node in walk(converted['blocks']):
            if node['t'] in ('Link', 'Image'):
                node['c'][2][0] = self.rewrite(node['c'][2][0], source, output)
                # Adjacent numbered Pro citations otherwise look like a single
                # number (e.g. 5 and 23 become 523). Change derived labels only.
                if node['t'] == 'Link' and re.fullmatch(r'\d+', plain(node['c'][1])):
                    node['c'][1] = [{'t': 'Str', 'c': '[' + plain(node['c'][1]) + ']'}]
            elif node['t'] in ('RawBlock', 'RawInline') and node['c'][0] == 'html':
                # Preserve raw HTML exactly except quoted local href/src values.
                node['c'][1] = re.sub(r'(\b(?:href|src)\s*=\s*)([\"\x27])(.*?)\2',
                    lambda m: m[1] + m[2] + html.escape(self.rewrite(html.unescape(m[3]), source, output), quote=True) + m[2], node['c'][1], flags=re.I)
            elif node['t'] == 'Math':
                original = node['c'][1]
                # Old-style TeX font switches accepted by many TeX engines are
                # not accepted by Pandoc's MathML reader. Normalize only the
                # derived AST, preserving the author's Markdown byte for byte.
                node['c'][1] = re.sub(r'\{\s*\\rm\s+([^{}]*)\}', lambda m: r'\mathrm{' + m[1] + '}', original)
                if node['c'][1] != original:
                    normalized_math.append({'original': original, 'derived_mathml_tex': node['c'][1]})
        titles = [plain(n) for n in ast['blocks'] if n['t'] == 'Header']
        title = titles[0] if titles else source.stem
        css = Path(os.path.relpath(OUT / 'article-reading.css', output.parent)).as_posix()
        result = subprocess.run([str(PANDOC), '--from=json', '--to=html5', '--standalone', '--mathml',
                                 '--toc', '--toc-depth=2', '--section-divs', '--wrap=none',
                                 '--css=' + css, '--metadata=lang:en', '--variable=lang:zh-CN',
                                 '--metadata=toc-title:目录', '--metadata=pagetitle:' + title],
                                input=json.dumps(converted, ensure_ascii=False), capture_output=True,
                                text=True, encoding='utf-8')
        if result.returncode:
            raise RuntimeError(result.stderr.strip() or 'Pandoc HTML conversion failed')
        if result.stderr.strip():
            if 'Could not convert TeX math' in result.stderr:
                issues_append(record, 'error', 'mathml_conversion_failed', text=result.stderr.strip())
            # --mathml is intentionally retained for the requested mode. The
            # installed 3.12 prints a deprecation notice, not a rendering error.
            other = '\n'.join(line for line in result.stderr.splitlines() if 'Deprecated: --mathml.' not in line).strip()
            if other and 'Could not convert TeX math' not in other:
                issues_append(record, 'warning', 'pandoc_html_warning', text=other)
        home = Path(os.path.relpath(OUT / 'index.html', output.parent)).as_posix()
        nav = f'<nav class="reading-nav" aria-label="阅读导航"><a href="{home}">十六篇文章</a><span>离线阅读预览 · 工程生成，不代表审校通过</span></nav>'
        generated = result.stdout.replace('<body>', '<body>\n' + nav, 1)
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(generated, encoding='utf-8')
        record['html'] = {'file': self.rel(output), 'conversion': 'passed',
                          'browser_visual_review': 'not_run', 'math_mode': 'MathML; no remote JavaScript',
                          'derived_math_normalizations': normalized_math,
                          'mathml_elements': len(re.findall(r'<math\b', generated)),
                          'pandoc_stderr': result.stderr.strip(),
                          'sha256': hashlib.sha256(output.read_bytes()).hexdigest()}

    def process(self, source, output, lesson=None):
        record = {'lesson': lesson, 'source': self.rel(source), 'issues': [],
                  'scientific_source_verification': 'not_assessed_by_this_tool',
                  'model_content_review': 'not_assessed_by_this_tool',
                  'human_review': 'pending', 'classroom_trial': 'pending'}
        try:
            raw, ast, warning = self.ast(source)
            record['source_sha256'] = self.source_hash[source.resolve()]
            record['counts'] = self.counts(ast)
            if warning:
                issues_append(record, 'warning', 'pandoc_ast_warning', text=warning)
            self.inspect(source, ast, record)
            self.convert(source, ast, output, record)
            record['source_current_at_finish'] = hashlib.sha256(source.read_bytes()).hexdigest() == record['source_sha256']
            if not record['source_current_at_finish']:
                issues_append(record, 'error', 'source_changed_during_build', note='HTML represents the recorded source snapshot; rerun after the author finishes.')
        except Exception as exc:
            issues_append(record, 'error', 'processing_failed', error=str(exc))
            record.setdefault('html', {'conversion': 'failed', 'browser_visual_review': 'not_run'})
        record['engineering_status'] = ('failed' if any(x['severity'] == 'error' for x in record['issues'])
                                        else 'passed_with_warnings' if record['issues'] else 'passed')
        return record

    def run(self):
        OUT.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / 'tools/article-reading.css', OUT / 'article-reading.css')
        records = []
        for n in self.selected:
            paths = sorted((ROOT / 'course').glob(f'{n:02}-*/lesson.md'))
            if len(paths) != 1:
                records.append({'lesson': f'L{n:02}', 'engineering_status': 'failed',
                                'issues': [{'severity': 'error', 'code': 'article_file_count', 'actual': len(paths)}],
                                'html': {'conversion': 'not_run', 'browser_visual_review': 'not_run'}})
            else:
                records.append(self.process(paths[0].resolve(), OUT / f'L{n:02}.html', f'L{n:02}'))
        while self.support_queue - self.support_done:
            source = sorted(self.support_queue - self.support_done)[0]
            self.support_done.add(source)
            self.support_records.append(self.process(source, self.destination(source)))
        self.index(records)
        all_records = records + self.support_records
        for record in all_records:
            if record['html']['conversion'] != 'passed':
                continue
            output = ROOT / record['html']['file']
            tags = Tags()
            tags.feed(output.read_text(encoding='utf-8'))
            checked = 0
            for url, kind in tags.links:
                loc = self.local(html.unescape(url), output)
                if loc is None:
                    continue
                target, fragment = loc
                checked += 1
                if not target.is_file():
                    issues_append(record, 'error', 'generated_html_missing_local_target', url=url, target=self.rel(target))
                elif fragment and target.suffix.lower() in ('.html', '.htm', '.svg') and fragment not in self.anchors(target):
                    issues_append(record, 'error', 'generated_html_missing_local_anchor', url=url, anchor=fragment)
            record['html']['local_references_checked_after_generation'] = checked
            record['engineering_status'] = ('failed' if any(x['severity'] == 'error' for x in record['issues'])
                                            else 'passed_with_warnings' if record['issues'] else 'passed')
        # Update the index after checks of rewritten targets (not a browser render).
        self.index(records)
        result = {'generated_at': datetime.now(timezone.utc).isoformat(),
                  'tool': self.rel(Path(__file__).resolve()),
                  'pandoc': str(PANDOC), 'selected_lessons': self.selected,
                  'overall_engineering_status': 'failed' if any(r['engineering_status'] == 'failed' for r in all_records) else 'passed_with_warnings' if any(r['issues'] for r in all_records) else 'passed',
                  'browser_visual_review': 'not_run',
                  'limits': ['No fixed word-count threshold or inferred depth grade.',
                             'No internet/source-content/license verification by this tool.',
                             'SVG XML validity is checked; SVG visual rendering is not claimed.',
                             'Raster first frame is decoded; animated motion is not reviewed.',
                             'Caption/source-tail separation is a documented structural heuristic.',
                             'HTML generation does not establish browser layout or MathML appearance.',
                             'Old slides, handouts and Office exports are preserved and not synchronized.'],
                  'articles': records, 'linked_markdown_previews': self.support_records}
        QA.parent.mkdir(parents=True, exist_ok=True)
        QA.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
        for r in records:
            c = r.get('counts', {})
            print(f"{r['lesson']}: body {c.get('han_body', '?')} Han; captions {c.get('han_captions_and_alt', '?')}; source tail {c.get('han_source_tail', '?')}; {r['engineering_status']}")
        print(f'QA: {self.rel(QA)} | HTML: {self.rel(OUT / "index.html")} | Browser visual review: not_run')
        return 1 if result['overall_engineering_status'] == 'failed' else 0

    def index(self, records):
        rows = []
        for r in records:
            n = r['lesson']
            label = next((plain(x) for x in self.cache.get((ROOT / r.get('source', '')).resolve(), ('', {'blocks': []}, ''))[1]['blocks'] if x['t'] == 'Header'), n)
            if r['html']['conversion'] == 'passed':
                link = f'<a href="{n}.html">{html.escape(n + " · " + label)}</a>'
            else:
                link = html.escape(n + ' · 未生成')
            c = r.get('counts', {})
            rows.append(f'<li>{link}<small>正文汉字 {c.get("han_body", "—")} · {html.escape(r["engineering_status"])} · 内容状态 {html.escape(r.get("article_revision_state", "unknown"))}</small></li>')
        doc = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>天文学文章离线阅读</title><link rel="stylesheet" href="article-reading.css"></head><body><h1>天文学文章离线阅读</h1><p>本页为文章的工程预览。字数描述篇幅，不判定解释深度；来源核验、内容审读、人工审校和试讲另行记录。HTML已生成不代表浏览器视觉检查通过。</p><ol class="article-index">' + ''.join(rows) + '</ol><p><a href="../qa/v02-article-qa.json">结构检查记录 JSON</a></p></body></html>'
        (OUT / 'index.html').write_text(doc, encoding='utf-8')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lessons', help='Comma-separated numbers, e.g. 01,02,03,04; default all 16')
    args = parser.parse_args()
    selected = sorted(set(int(x.strip().removeprefix('L')) for x in args.lessons.split(','))) if args.lessons else list(range(1, 17))
    if not selected or any(n < 1 or n > 16 for n in selected):
        parser.error('Lesson numbers must be 1–16')
    if not PANDOC.is_file():
        parser.error(f'Existing Pandoc not found: {PANDOC}')
    return Builder(selected).run()


if __name__ == '__main__':
    raise SystemExit(main())
