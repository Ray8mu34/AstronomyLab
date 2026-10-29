"""Export original lecture bytes and their dependencies; never rebuild maintenance sources.

Usage: conda run -n dl_env python tools/export-lectures.py --web --self-test
This local preservation package is not authorization for public redistribution.
"""
from __future__ import annotations

import argparse
import copy
import csv
import hashlib
import html
from html.parser import HTMLParser
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from urllib.parse import quote, unquote, urlsplit, urlunsplit
import zipfile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
QA = ROOT / 'build/qa/lab-refactor/lectures'
spec = importlib.util.spec_from_file_location('article_builder_v02', ROOT / 'tools/build-articles-v02.py')
existing = importlib.util.module_from_spec(spec)
spec.loader.exec_module(existing)

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def lecture_catalog():
    catalog = json.loads((ROOT / 'course/chapters.json').read_text(encoding='utf-8'))
    chapters = catalog['chapters']
    if [c['number'] for c in chapters] != list(range(1, len(chapters) + 1)):
        raise ValueError('Chapter numbers must be unique and consecutive')
    paths = [(ROOT / c['path']).resolve() for c in chapters]
    if len(set(paths)) != len(paths) or any(not p.is_relative_to(ROOT / 'course') or p.name != 'lesson.md' or not p.is_file() for p in paths):
        raise ValueError('Catalog has duplicate, missing or out-of-scope chapter paths')
    if set(paths) != {p.resolve() for p in (ROOT / 'course').glob('*/lesson.md')}:
        raise ValueError('Catalog and actual chapter sources differ')
    return catalog, paths

def approved_digests(baseline_hashes):
    """Keep the original baseline and apply only individually authorized endpoints."""
    approved = dict(baseline_hashes)
    file = ROOT / 'source-protection-amendments.json'
    changes = json.loads(file.read_text(encoding='utf-8'))['changes'] if file.is_file() else []
    for change in changes:
        target = change.get('currentPath', change['path'])
        if baseline_hashes.get(change['path']) != change['before']:
            raise ValueError('Amendment original digest differs: ' + change['path'])
        if not change.get('task') or not change.get('reason') or not re.fullmatch('[a-f0-9]{64}', change['after']):
            raise ValueError('Incomplete authorization: ' + change['path'])
        resolved = (ROOT / target).resolve()
        if not resolved.is_relative_to(ROOT):
            raise ValueError('Amendment target outside project')
        approved[target] = change['after']
    return approved

def css_links(text):
    urls = re.findall(r'url\(\s*[\"\x27]?([^\)\"\x27]+)[\"\x27]?\s*\)', text, flags=re.I)
    urls += re.findall(r'@import\s+[\"\x27]([^\"\x27]+)[\"\x27]', text, flags=re.I)
    return [(html.unescape(x.strip()), 'StyleResource') for x in urls]

def srcset_links(value):
    # Data URI candidates are already self-contained; commas within them are not paths.
    if value.lstrip().startswith('data:'):
        return []
    return [(part.strip().split()[0], 'Image') for part in value.split(',') if part.strip()]

class Resources(existing.Tags):
    """Extend the existing HTML parser to media, SVG, styles and source sets."""
    def __init__(self):
        super().__init__()
        self.style_depth = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'):
            self.ids.append(a['id'])
        if tag == 'a' and a.get('name'):
            self.ids.append(a['name'])
        for key in ('href', 'src', 'poster', 'data', 'xlink:href'):
            if a.get(key):
                kind = 'Image' if tag in ('img', 'image') or key == 'poster' else 'Resource' if key != 'href' else 'Link'
                self.links.append((a[key], kind))
        if a.get('srcset'):
            self.links.extend(srcset_links(a['srcset']))
        if a.get('style'):
            self.links.extend(css_links(a['style']))
        if tag == 'style':
            self.style_depth += 1

    def handle_endtag(self, tag):
        if tag == 'style':
            self.style_depth = max(0, self.style_depth - 1)

    def handle_data(self, data):
        super().handle_data(data)
        if self.style_depth:
            self.links.extend(css_links(data))

class Collector:
    def __init__(self, root, lectures):
        self.root = root.resolve()
        self.lectures = {x.resolve() for x in lectures}
        self.builder = existing.Builder([])
        self.files = {}
        self.references = []
        self.external = []
        self.issues = []
        self.graph = {}
        self.anchor_cache = {}
        self.visiting = []
        self.cycles = []

    def rel(self, path):
        try:
            return path.relative_to(self.root).as_posix()
        except ValueError:
            return '<outside-approved-root>'

    def approve(self, path):
        if not path.is_relative_to(self.root):
            return 'outside-approved-root'
        rel = self.rel(path)
        parts = rel.split('/')
        forbidden = {'raw', '_teacher', 'qa', '.git', 'node_modules', 'studio', 'private', 'credentials'}
        if any(p.lower() in forbidden or p.lower().startswith('.env') for p in parts):
            return 'non-public-content'
        if path.suffix.lower() in ('.pem', '.key', '.pfx', '.zip', '.fits', '.fit', '.eep', '.py', '.ps1', '.cmd', '.bat'):
            return 'non-public-maintenance-or-raw-archive'
        if path in self.lectures or rel in ('THIRD_PARTY.md', 'course/README.md', 'course/chapters.json', 'course/experiments.json', 'course/experiments.md'):
            return None
        if parts[0] == 'assets':
            return None
        return 'outside-approved-lecture-assets-scope'

    def resolve(self, url, source):
        if re.match(r'^[A-Za-z]:[/\\]', html.unescape(url)):
            return {'blocked': 'absolute-file-url', 'fragment': '', 'query': ''}
        parsed = urlsplit(html.unescape(url))
        if parsed.scheme and parsed.scheme.lower() != 'file':
            return None
        if parsed.netloc:
            return None if parsed.scheme != 'file' else {'blocked': 'absolute-file-url', 'fragment': unquote(parsed.fragment), 'query': parsed.query}
        raw = unquote(parsed.path)
        if '\x00' in raw:
            return {'blocked': 'invalid-null-path', 'fragment': unquote(parsed.fragment), 'query': parsed.query}
        if re.match(r'^[A-Za-z]:[/\\]', raw) or parsed.scheme == 'file':
            return {'blocked': 'absolute-file-url', 'fragment': unquote(parsed.fragment), 'query': parsed.query}
        lexical = Path(os.path.abspath((self.root / raw.lstrip('/')) if raw.startswith('/') else (source.parent / raw))) if raw else source
        final = lexical.resolve()
        item = {'path': final, 'lexical': lexical, 'fragment': unquote(parsed.fragment), 'query': parsed.query}
        item['blocked'] = self.approve(final)
        if lexical != final:
            item['symlink_resolution'] = True
        if lexical.is_relative_to(self.root) and lexical.exists():
            # Native Windows lookup is case-insensitive. Record actual directory spelling.
            current = self.root
            mismatch = []
            for piece in lexical.relative_to(self.root).parts:
                matches = [x.name for x in current.iterdir() if x.name.casefold() == piece.casefold()]
                actual = matches[0] if matches else piece
                if actual != piece:
                    mismatch.append({'requested': piece, 'actual': actual})
                current = current / actual
            item['path'] = current.resolve()
            if mismatch:
                item['case_mismatch'] = mismatch
        return item

    def parse(self, source):
        ext = source.suffix.lower()
        refs, anchors = [], []
        if ext == '.md':
            _, ast, _ = self.builder.ast(source)
            for node in existing.walk(ast['blocks']):
                kind, value = node['t'], node.get('c', [])
                if kind in ('Link', 'Image'):
                    refs.append((value[2][0], kind))
                if kind == 'Header':
                    anchors.append(value[1][0])
                elif kind in ('Div', 'Span', 'Figure', 'Table', 'CodeBlock') and value and isinstance(value[0], list) and value[0]:
                    anchors.append(value[0][0])
                elif kind in ('RawInline', 'RawBlock') and value[0] == 'html':
                    parser = Resources()
                    parser.feed(value[1])
                    anchors.extend(parser.ids)
                    refs.extend(parser.links)
        elif ext in ('.html', '.htm', '.svg'):
            parser = Resources()
            parser.feed(source.read_text(encoding='utf-8-sig'))
            refs, anchors = parser.links, parser.ids
        elif ext == '.css':
            refs = css_links(source.read_text(encoding='utf-8-sig'))
        elif ext == '.csv':
            # Asset ledgers explicitly name root-relative file paths and source pages.
            for row in csv.DictReader(source.read_text(encoding='utf-8-sig').splitlines()):
                for field in ('local_path', 'source_page'):
                    url = row.get(field, '').strip()
                    if url:
                        refs.append(('/' + url if url.startswith(('assets/', 'course/')) else url, 'AssetLedger' if field == 'local_path' else 'SourceLedger'))
        self.anchor_cache[source] = {x for x in anchors if isinstance(x, str) and x}
        return refs

    def collect(self, source, purpose='dependency', referrer=None):
        source = source.resolve()
        rel = self.rel(source)
        if source in self.visiting:
            cycle = [self.rel(x) for x in self.visiting[self.visiting.index(source):]] + [rel]
            if cycle not in self.cycles:
                self.cycles.append(cycle)
            return
        if rel in self.files:
            record = self.files[rel]
            if referrer and referrer not in record['referrers']:
                record['referrers'].append(referrer)
            if purpose not in record['purposes']:
                record['purposes'].append(purpose)
            return
        reason = self.approve(source)
        if reason:
            self.issues.append({'kind': 'non_public_dependency', 'target': rel, 'reason': reason, 'referrer': referrer})
            return
        if not source.is_file():
            self.issues.append({'kind': 'missing_dependency', 'target': rel, 'referrer': referrer})
            return
        self.files[rel] = {'source': rel, 'package_path': rel, 'sha256': digest(source), 'bytes': source.stat().st_size,
                           'purposes': [purpose], 'referrers': [referrer] if referrer else []}
        self.visiting.append(source)
        self.graph[source] = []
        for url, kind in self.parse(source):
            loc = self.resolve(url, source)
            if loc is None:
                self.external.append({'referrer': rel, 'url': url, 'kind': kind, 'offline_resource': kind not in ('Link', 'SourceLedger') and not url.startswith('data:')})
                continue
            item = {'referrer': rel, 'url': url, 'kind': kind, 'query': loc.get('query', ''), 'fragment': loc.get('fragment', '')}
            target = loc.get('path')
            item['target'] = self.rel(target) if target else '<blocked-absolute-file-url>'
            if loc.get('case_mismatch'):
                item['case_mismatch'] = loc['case_mismatch']
            if loc.get('symlink_resolution'):
                item['symlink_resolution'] = True
            reason = loc.get('blocked')
            if reason:
                item.update(status='excluded_non_public', reason=reason)
                self.issues.append({**item, 'reference_kind': kind, 'kind': 'non_public_dependency'})
            elif not target.is_file():
                item['status'] = 'missing'
                self.issues.append({**item, 'reference_kind': kind, 'kind': 'missing_dependency'})
            else:
                item['status'] = 'included'
                self.graph[source].append(target)
                self.collect(target, 'image' if kind == 'Image' else 'dependency', rel)
                if loc['fragment'] and target.suffix.lower() in ('.md', '.html', '.htm', '.svg'):
                    item['anchor_exists'] = loc['fragment'] in self.anchor_cache.get(target, set())
                    if not item['anchor_exists']:
                        self.issues.append({**item, 'reference_kind': kind, 'kind': 'missing_anchor'})
            self.references.append(item)
        self.visiting.pop()

    def outside_check(self, package):
        with tempfile.TemporaryDirectory(prefix='AstronomyLab-lectures-') as temp:
            outside = Path(temp) / 'source'
            shutil.copytree(package, outside)
            checks = []
            for record in self.files.values():
                target = outside / record['package_path']
                checks.append({'path': record['package_path'], 'bytes_equal': target.read_bytes() == (self.root / record['source']).read_bytes(),
                               'hash_equal': digest(target) == record['sha256']})
            references = []
            for ref in self.references:
                if ref['status'] != 'included':
                    continue
                parsed = urlsplit(html.unescape(ref['url']))
                decoded = unquote(parsed.path)
                target = (outside / decoded.lstrip('/')) if decoded.startswith('/') else (outside / ref['referrer']).parent / decoded
                target = target.resolve() if decoded else outside / ref['referrer']
                references.append({'referrer': ref['referrer'], 'url': ref['url'], 'inside_package': target.is_relative_to(outside), 'exists': target.is_file()})
            return {'copied_outside_repository': True, 'temporary_copy_removed_after_checks': True, 'files': checks, 'references': references,
                    'passed': all(x['bytes_equal'] and x['hash_equal'] for x in checks) and all(x['inside_package'] and x['exists'] for x in references)}

def owned_output(path):
    if not path.exists():
        path.mkdir(parents=True)
        return
    manifest = path / 'manifest.json'
    if not manifest.is_file() or json.loads(manifest.read_text(encoding='utf-8')).get('exporter') != 'tools/export-lectures.py':
        raise RuntimeError(f'Refusing to overwrite an output without this exporter ownership marker: {path.name}')

def make_zip(directory):
    destination = directory.with_suffix('.zip')
    with zipfile.ZipFile(destination, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for source in sorted(directory.rglob('*')):
            if source.is_file():
                archive.write(source, source.relative_to(directory.parent).as_posix())
    with zipfile.ZipFile(destination) as archive:
        if archive.testzip():
            raise RuntimeError('ZIP CRC check failed')
        checked = len(archive.infolist())
        for item in archive.infolist():
            rel = Path(item.filename).relative_to(directory.name)
            if archive.read(item) != (directory / rel).read_bytes():
                raise RuntimeError('ZIP bytes differ from directory: ' + str(rel))
    return {'file': destination.relative_to(ROOT).as_posix(), 'sha256': digest(destination), 'bytes': destination.stat().st_size, 'crc_checked_files': checked, 'byte_checked_files': checked}

def check_output_inventory(directory, expected):
    actual = {x.relative_to(directory).as_posix() for x in directory.rglob('*') if x.is_file()}
    extra = sorted(actual - expected)
    if extra:
        raise RuntimeError('Unowned or stale output files require review before packaging: ' + ', '.join(extra))

def rewrite_css(text, transform):
    result = re.sub(r'url\(\s*([\"\x27]?)([^\)\"\x27]+)\1\s*\)', lambda m: 'url("' + transform(m[2].strip()) + '")', text, flags=re.I)
    return re.sub(r'(@import\s+)([\"\x27])([^\"\x27]+)\2', lambda m: m[1] + m[2] + transform(m[3]) + m[2], result, flags=re.I)

class RewriteHTML(HTMLParser):
    def __init__(self, transform):
        super().__init__(convert_charrefs=False)
        self.transform, self.output, self.style_depth = transform, [], 0

    def opening(self, tag, attrs, close):
        result = []
        for name, value in attrs:
            if value is not None:
                if name in ('href', 'src', 'poster', 'data', 'xlink:href'):
                    value = self.transform(value)
                elif name == 'srcset' and not value.startswith('data:'):
                    value = ', '.join(self.transform(x.strip().split()[0]) + (' ' + ' '.join(x.strip().split()[1:]) if len(x.strip().split()) > 1 else '') for x in value.split(',') if x.strip())
                elif name == 'style':
                    value = rewrite_css(value, self.transform)
                result.append(f'{name}="{html.escape(value, quote=True)}"')
            else:
                result.append(name)
        self.output.append('<' + tag + (' ' if result else '') + ' '.join(result) + close)
        if tag == 'style':
            self.style_depth += 1

    def handle_starttag(self, tag, attrs): self.opening(tag, attrs, '>')
    def handle_startendtag(self, tag, attrs): self.opening(tag, attrs, '/>')
    def handle_endtag(self, tag):
        self.output.append('</' + tag + '>')
        if tag == 'style': self.style_depth = max(0, self.style_depth - 1)
    def handle_data(self, value): self.output.append(rewrite_css(value, self.transform) if self.style_depth else value)
    def handle_entityref(self, name): self.output.append('&' + name + ';')
    def handle_charref(self, name): self.output.append('&#' + name + ';')
    def handle_comment(self, value): self.output.append('<!--' + value + '-->')
    def handle_decl(self, value): self.output.append('<!' + value + '>')

def rewrite_svg(text, transform):
    # SVG is case-sensitive XML: HTMLParser would damage viewBox, clipPath,
    # gradients and marker sizing. Preserve those names while remapping URLs.
    ET.register_namespace('', 'http://www.w3.org/2000/svg')
    ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')
    parser = ET.XMLParser(target=ET.TreeBuilder(insert_comments=True))
    tree = ET.fromstring(text, parser=parser)
    for node in tree.iter():
        for name, value in list(node.attrib.items()):
            if name.rsplit('}', 1)[-1] in ('href', 'src', 'poster', 'data'):
                node.set(name, transform(value))
            elif name == 'style' or 'url(' in value:
                node.set(name, rewrite_css(value, transform))
        if isinstance(node.tag, str) and node.tag.rsplit('}', 1)[-1] == 'style' and node.text:
            node.text = rewrite_css(node.text, transform)
    return ET.tostring(tree, encoding='unicode')

def render_web(collector, lectures, out, catalog):
    owned_output(out)
    experiment_source = ROOT / 'course/experiments.md'
    has_experiments = experiment_source.is_file() and (ROOT / 'course/experiments.json').is_file()
    mapping = {}
    lesson_names = {}
    for number, source in enumerate(lectures, 1):
        mapping[source] = out / f'chapters/{number:02}.html'
        _, ast, _ = collector.builder.ast(source)
        lesson_names[number] = next((existing.plain(n) for n in ast['blocks'] if n['t'] == 'Header'), f'L{number:02}')
    for rel in collector.files:
        source = (collector.root / rel).resolve()
        mapping.setdefault(source, out / ('linked/' + rel) if source.suffix.lower() == '.md' else out / rel)
        if source.suffix.lower() == '.md' and source not in lectures:
            mapping[source] = mapping[source].with_suffix('.html')
    if has_experiments:
        mapping[experiment_source.resolve()] = out / 'experiments.html'
    errors, warnings, normalizations = [], [], []
    def rewrite(url, source, destination):
        # An SVG <use> must keep a local fragment; an external self-reference
        # is suppressed when browsers load SVG through an image element.
        if url.startswith('#'):
            return url
        loc = collector.resolve(url, source)
        if loc is None:
            return url
        target = loc.get('path')
        if target not in mapping or loc.get('blocked'):
            dest = out / 'unavailable.html'
            query, fragment = '', ''
        else:
            dest, query, fragment = mapping[target], loc.get('query', ''), quote(loc.get('fragment', ''), safe='-._~:')
        return urlunsplit(('', '', quote(Path(os.path.relpath(dest, destination.parent)).as_posix(), safe='/:'), query, fragment))
    for source, destination in mapping.items():
        destination.parent.mkdir(parents=True, exist_ok=True)
        if has_experiments and source == experiment_source.resolve():
            continue  # The structured mapping generates this companion below.
        transform = lambda value, source=source, destination=destination: rewrite(value, source, destination)
        if source.suffix.lower() == '.md':
            _, ast, _ = collector.builder.ast(source)
            ast = copy.deepcopy(ast)
            for node in existing.walk(ast['blocks']):
                if node['t'] in ('Link', 'Image'):
                    node['c'][2][0] = transform(node['c'][2][0])
                elif node['t'] in ('RawInline', 'RawBlock') and node['c'][0] == 'html':
                    parser = RewriteHTML(transform)
                    parser.feed(node['c'][1])
                    node['c'][1] = ''.join(parser.output)
                elif node['t'] == 'Math':
                    value = node['c'][1]
                    normalized = re.sub(r'\{\s*\\rm\s+([^{}]*)\}', lambda m: r'\mathrm{' + m[1] + '}', value)
                    if normalized != value:
                        normalizations.append({'source': collector.rel(source), 'original': value, 'derived_mathml_tex': normalized})
                    node['c'][1] = normalized
            title = next((existing.plain(n) for n in ast['blocks'] if n['t'] == 'Header'), source.stem)
            stylesheet = Path(os.path.relpath(out / 'article-reading.css', destination.parent)).as_posix()
            result = subprocess.run([str(existing.PANDOC), '--from=json', '--to=html5', '--standalone', '--math-method=mathml', '--toc', '--toc-depth=2',
                                     '--section-divs', '--wrap=none', '--css=' + stylesheet, '--metadata=lang:en', '--variable=lang:zh-CN',
                                     '--metadata=toc-title:目录', '--metadata=pagetitle:' + title], input=json.dumps(ast, ensure_ascii=False), capture_output=True, text=True, encoding='utf-8')
            if result.returncode or 'Could not convert TeX math' in result.stderr:
                errors.append({'source': collector.rel(source), 'error': result.stderr})
            if result.stderr.strip(): warnings.append({'source': collector.rel(source), 'stderr': result.stderr.strip()})
            home = Path(os.path.relpath(out / 'index.html', destination.parent)).as_posix()
            related = ''
            if has_experiments and source in lectures:
                number = lectures.index(source) + 1
                target = Path(os.path.relpath(out / 'experiments.html', destination.parent)).as_posix()
                related = f'<a href="{target}#chapter-{number:02}">配套实验</a>'
            nav = '<nav class="reading-nav" aria-label="阅读导航"><a href="' + home + '">文章目录</a>' + related + '</nav>'
            destination.write_text(result.stdout.replace('<body>', '<body>\n' + nav, 1), encoding='utf-8')
        elif source.suffix.lower() == '.svg':
            destination.write_text(rewrite_svg(source.read_text(encoding='utf-8-sig'), transform), encoding='utf-8')
        elif source.suffix.lower() in ('.html', '.htm'):
            parser = RewriteHTML(transform)
            parser.feed(source.read_text(encoding='utf-8-sig'))
            destination.write_text(''.join(parser.output), encoding='utf-8')
        elif source.suffix.lower() == '.css':
            destination.write_text(rewrite_css(source.read_text(encoding='utf-8-sig'), transform), encoding='utf-8')
        else:
            shutil.copy2(source, destination)
    shutil.copy2(ROOT / 'tools/article-reading.css', out / 'article-reading.css')
    if has_experiments:
        subprocess.run(['node', str(ROOT / 'tools/export-experiment-map.mjs'), '--out', str(out / 'experiments.html')], cwd=ROOT, check=True)
    rows = ''.join(f'<li><a href="chapters/{n:02}.html">{html.escape(lesson_names[n])}</a></li>' for n in lesson_names)
    experiment_link = '<p><a href="experiments.html">讲义与实验对应 →</a></p>' if has_experiments else ''
    (out / 'index.html').write_text('<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>从试卷讲起的天文学知识入门</title><link rel="stylesheet" href="article-reading.css"></head><body><h1>从试卷讲起的天文学知识入门</h1><p>从附近的天体和天象出发，沿着观测、测量与物理解释，走向恒星、星系和宇宙。</p>' + experiment_link + '<ol>' + rows + '</ol><p><a href="README.md">资料说明</a> · <a href="manifest.json">来源与生成记录</a></p></body></html>', encoding='utf-8')
    (out / 'unavailable.html').write_text('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>资料范围说明</title><body><h1>此引用未纳入独立资料包</h1><p>原始 Markdown 保留原有引用。本派生副本不携带教师记录、私有 QA、维护程序、凭据或批准范围外的文件。缺失及非公开依赖分别记录在 manifest.json；这不表示引用已完成迁移。</p><a href="index.html">文章目录</a></body></html>', encoding='utf-8')
    (out / 'README.md').write_text(f'# 独立静态阅读副本\n\n双击 index.html 可离线阅读全部{len(lectures)}篇。当前篇章位于 chapters/；reading/L01.html 至 L16.html 保留原专题对应关系，拆分篇提供分篇入口。\n\n正文维护源位于项目 course/，此处为派生阅读。配图与来源记录随包保存。公开分发状态 blocked_pending_licenses；真人科学审校、教材对照与真实试讲待进行。\n', encoding='utf-8')
    legacy_files = set()
    for old, numbers in catalog.get('legacy_reading', {}).items():
        if not re.fullmatch(r'L\d{2}', old) or not numbers or any(n not in lesson_names for n in numbers):
            raise ValueError('Invalid legacy reading mapping')
        destination = out / f'reading/{old}.html'
        destination.parent.mkdir(parents=True, exist_ok=True)
        if len(numbers) == 1:
            # Both paths have the same depth, so the relative resource links stay valid.
            shutil.copy2(out / f'chapters/{numbers[0]:02}.html', destination)
        else:
            links = ''.join(f'<li><a href="../chapters/{n:02}.html">{html.escape(lesson_names[n])}</a></li>' for n in numbers)
            destination.write_text('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>专题阅读</title><link rel="stylesheet" href="../article-reading.css"><body><nav><a href="../index.html">文章目录</a></nav><h1>专题阅读</h1><ol>' + links + '</ol></body></html>', encoding='utf-8')
        legacy_files.add(destination.relative_to(out).as_posix())
    # Validate after generation, including auto-generated title anchors, in a repository-external copy.
    with tempfile.TemporaryDirectory(prefix='AstronomyLab-reading-') as temp:
        outside = Path(temp) / 'reading'
        shutil.copytree(out, outside)
        documents, anchors = [], {}
        for path in outside.rglob('*'):
            if path.suffix.lower() in ('.html', '.htm', '.svg'):
                parser = Resources()
                parser.feed(path.read_text(encoding='utf-8-sig'))
                anchors[path] = set(parser.ids)
                documents.append((path, parser.links))
        checked = 0
        for path, links in documents:
            for url, kind in links:
                parsed = urlsplit(html.unescape(url))
                if parsed.scheme or parsed.netloc: continue
                target = (path.parent / unquote(parsed.path)).resolve() if parsed.path else path
                checked += 1
                if target.name == 'manifest.json': continue  # Written after verification, never a runtime dependency.
                if not target.is_relative_to(outside) or not target.is_file():
                    errors.append({'source': path.relative_to(outside).as_posix(), 'url': url, 'error': 'generated_local_target_missing_or_outside'})
                elif parsed.fragment and target.suffix.lower() in ('.html', '.htm', '.svg') and unquote(parsed.fragment) not in anchors.get(target, set()):
                    errors.append({'source': path.relative_to(outside).as_posix(), 'url': url, 'error': 'generated_anchor_missing'})
        standalone = {'copied_outside_repository': True, 'local_references_checked': checked, 'errors': errors, 'passed': not errors}
    manifest = {'exporter': 'tools/export-lectures.py', 'kind': 'derived-static-reading', 'source_maintenance_root': 'course/*/lesson.md',
                'public_distribution': 'blocked_pending_permissions', 'article_count': len(lectures), 'edition': catalog['edition'], 'course_runtime_dependency': False,
                'lab_navigation_or_spa_scripts': False, 'conversion_warnings': warnings, 'math_normalizations_derived_only': normalizations,
                'standalone_check': standalone, 'browser_visual_review': 'not_run',
                'files': [{'path': x.relative_to(out).as_posix(), 'sha256': digest(x), 'bytes': x.stat().st_size} for x in sorted(out.rglob('*')) if x.is_file() and x.name != 'manifest.json']}
    write_json(out / 'manifest.json', manifest)
    check_output_inventory(out, {x.relative_to(out).as_posix() for x in mapping.values()} | legacy_files | {'README.md', 'index.html', 'unavailable.html', 'article-reading.css', 'manifest.json'})
    return {'directory': out.relative_to(ROOT).as_posix(), 'check': standalone, 'zip': make_zip(out)}

def self_test():
    """Exercise collector boundaries beyond the syntax in the current chapter sources."""
    with tempfile.TemporaryDirectory(prefix='collector-fixture-', dir=QA) as temp:
        root = Path(temp)
        (root / 'course/01-fixture').mkdir(parents=True)
        (root / 'assets').mkdir()
        (root / 'course/_teacher').mkdir()
        lecture = root / 'course/01-fixture/lesson.md'
        lecture.write_text('## 测试 {#正文}\n\n![图][image]\n\n[image]: ../../assets/%E4%B8%AD%E6%96%87.svg?x=1#point\n\n[说明](../../assets/a.md#说明)\n\n<video poster="../../assets/中文.svg"><source src="../../assets/test.webm"></video>\n<img srcset="../../assets/中文.svg 1x, ../../assets/second.svg 2x">\n<link rel="stylesheet" href="../../assets/style.css">\n\n[私有](../_teacher/secret.md)\n\n[缺失](../../assets/missing.png)\n\n[坏锚点](../../assets/a.md#不存在)\n', encoding='utf-8')
        (root / 'assets/中文.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg"><g id="point"/></svg>', encoding='utf-8')
        (root / 'assets/second.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg"/>', encoding='utf-8')
        (root / 'assets/test.webm').write_bytes(b'fixture-media-not-a-video')
        (root / 'assets/style.css').write_text('@import "extra.css"; a { background:url("中文.svg#point"); }', encoding='utf-8')
        (root / 'assets/extra.css').write_text('body{color:#000}', encoding='utf-8')
        (root / 'assets/a.md').write_text('## 说明\n\n[环](b.md)\n', encoding='utf-8')
        (root / 'assets/b.md').write_text('[循环](a.md)\n', encoding='utf-8')
        (root / 'course/_teacher/secret.md').write_text('private fixture', encoding='utf-8')
        collector = Collector(root, [lecture])
        collector.collect(lecture, 'lecture')
        checks = {'reference_style_image': 'assets/中文.svg' in collector.files,
                  'query_and_encoded_anchor': any(x['query'] == 'x=1' and x['fragment'] == 'point' and x.get('anchor_exists') for x in collector.references),
                  'html_media_and_srcset': 'assets/test.webm' in collector.files and 'assets/second.svg' in collector.files,
                  'recursive_css': 'assets/extra.css' in collector.files,
                  'cycles_recorded': bool(collector.cycles),
                  'missing_reported': any(x['kind'] == 'missing_dependency' for x in collector.issues),
                  'private_excluded': 'course/_teacher/secret.md' not in collector.files and any(x['kind'] == 'non_public_dependency' for x in collector.issues),
                  'bad_anchor_reported': any(x['kind'] == 'missing_anchor' for x in collector.issues)}
        # Junction/symlink escape is checked by resolving the final destination before scope approval.
        outside = collector.resolve('../../../../outside.png', lecture)
        checks['parent_escape_blocked'] = outside['blocked'] == 'outside-approved-root'
        checks['absolute_file_url_blocked'] = collector.resolve('file:///C:/private/key.pem', lecture)['blocked'] == 'absolute-file-url'
        checks['native_drive_path_blocked'] = collector.resolve('C:/private/key.pem', lecture)['blocked'] == 'absolute-file-url'
        case = collector.resolve('../../assets/SECOND.svg', lecture)
        checks['filesystem_case_checked'] = bool(case.get('case_mismatch')) and case['path'].name == 'second.svg'
        if not all(checks.values()):
            write_json(QA / 'collector-self-test-failure.json', {'checks': checks, 'references': collector.references, 'issues': collector.issues, 'ast': collector.builder.ast(lecture)[1]})
            raise RuntimeError('Collector self-test failed: ' + repr(checks))
        return {'checks': checks, 'passed': True, 'symlink_final_destination_policy': 'enforced_by_Path.resolve_before_approval; real Windows symlink creation not exercised'}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--web', action='store_true', help='Also generate isolated static reading package')
    parser.add_argument('--self-test', action='store_true', help='Exercise reference syntax and exclusion policy')
    args = parser.parse_args()
    QA.mkdir(parents=True, exist_ok=True)
    if not existing.PANDOC.is_file(): parser.error('Existing Pandoc dependency is missing; no installation performed')
    catalog, lectures = lecture_catalog()
    baseline_path = ROOT / 'build/qa/lab-refactor/baseline/manifest.json'
    if not baseline_path.is_file(): baseline_path = ROOT / 'source-protection.json'
    baseline = json.loads(baseline_path.read_text(encoding='utf-8'))
    baseline_hashes = {x['path']: x['sha256'] for x in baseline.get('files', [])}
    baseline_hashes.update({x['path']: x['sha256'] for x in baseline['protectedFiles']})
    approved = approved_digests(baseline_hashes)
    collector = Collector(ROOT, lectures)
    for source in lectures: collector.collect(source, 'original_lecture')
    for source in ('assets/ARTICLE_ASSETS.csv', 'assets/ARTICLE_SOURCES.md', 'course/README.md', 'course/chapters.json'):
        collector.collect(ROOT / source, 'credits_and_license_record')
    for source in ('course/experiments.json', 'course/experiments.md'):
        if (ROOT / source).is_file(): collector.collect(ROOT / source, 'lecture_experiment_mapping')
    if (ROOT / 'THIRD_PARTY.md').is_file(): collector.collect(ROOT / 'THIRD_PARTY.md', 'credits_and_license_record')
    protection = [{'path': path.relative_to(ROOT).as_posix(), 'baseline_sha256': baseline_hashes.get(path.relative_to(ROOT).as_posix()),
                   'source_sha256': digest(path), 'baseline_equal': baseline_hashes.get(path.relative_to(ROOT).as_posix()) == digest(path),
                   'authorized_edition_equal': approved.get(path.relative_to(ROOT).as_posix(), chapter.get('sha256')) == digest(path)} for chapter, path in zip(catalog['chapters'], lectures)]
    dependency_protection = [{'path': record['source'], 'baseline_sha256': baseline_hashes.get(record['source']),
                             'source_sha256': record['sha256'],
                             'baseline_equal': baseline_hashes[record['source']] == record['sha256'] if record['source'] in baseline_hashes else None,
                             'authorized_edition_equal': approved[record['source']] == record['sha256'] if record['source'] in approved else None}
                            for record in collector.files.values()]
    out = ROOT / 'dist/lectures-source'
    owned_output(out)
    for record in collector.files.values():
        destination = out / record['package_path']
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / record['source'], destination)
    ledger = list(csv.DictReader((ROOT / 'assets/ARTICLE_ASSETS.csv').read_text(encoding='utf-8-sig').splitlines()))
    included_credits = [row for row in ledger if row['local_path'] in collector.files]
    pending = [row for row in included_credits if re.search(r'pending|待核|待作者|内部|internal', row['permission_or_license'] + ' ' + row['release_status'], re.I)]
    write_json(out / 'credits/asset-status.json', {'preserved_full_ledger': 'assets/ARTICLE_ASSETS.csv', 'assets': included_credits, 'permission_pending_or_internal_count': len(pending),
                                                'public_distribution': 'blocked', 'not_legal_or_new_license_verification': True})
    (out / 'README.md').write_text('# 原始天文学讲义资料包\n\n这是本机当前18篇 lesson.md 的发行快照，唯一正文维护源仍是项目 course/*/lesson.md。请勿在此副本另行维护正文。原始文件没有格式化、改写或换行转换，course 与 assets 的相对层级保留。\n\n可在 Markdown 阅读器中打开 course/<原目录>/lesson.md。实际图片、本地来源和资产署名随包携带；manifest.json 分别记录本地依赖、外部来源、缺失/非公开依赖与锚点。外部网站没有被下载，也不属于此归档。\n\n本地资料归档，公开分发 blocked，第三方及原创素材的许可仍按原有记录保留。私有教师记录、原卷、QA、凭据、维护脚本、原始科学压缩包未纳入；原文件中的此类链接保留不动，排除记录见 manifest.json，不声称所有原文链接均公开可达。人工科学审校、真实试讲、教材对照仍待进行。\n', encoding='utf-8')
    outside = collector.outside_check(out)
    missing = [x for x in collector.issues if x['kind'] in ('missing_dependency', 'missing_anchor')]
    manifest = {'exporter': 'tools/export-lectures.py', 'kind': 'original-markdown-and-local-dependencies', 'created_at': datetime.now(timezone.utc).isoformat(),
                'baseline_git_head': baseline.get('head'), 'baseline_workspace_is_git': baseline.get('workspaceIsGit', True), 'edition': catalog['edition'], 'maintenance_source': 'actual local workspace bytes; not reset to Git checkout',
                'lecture_count': len(lectures), 'files': list(collector.files.values()), 'references': collector.references, 'external_sources': collector.external,
                'dependency_cycles': collector.cycles, 'issues': collector.issues, 'source_protection': protection,
                'dependency_source_protection': dependency_protection, 'outside_repository_check': outside,
                'all_required_local_images_and_sources_present': not missing, 'all_original_links_resolvable_in_package': not collector.issues,
                'public_distribution': 'blocked_pending_permissions', 'known_global_pending': 'Existing asset source ledgers retain pending permissions (including MIST, M17 FITS derivatives and third-party Moon composite)',
                'included_pending_or_internal_asset_count': len(pending), 'approval_scope': f'{len(lectures)} catalogued lecture paths; assets/; course index; final symlink destination checked; private and raw archives excluded',
                'scientific_review': 'not_performed_by_exporter', 'human_review': 'pending', 'classroom_trial': 'pending'}
    write_json(out / 'manifest.json', manifest)
    check_output_inventory(out, set(collector.files) | {'README.md', 'manifest.json', 'credits/asset-status.json'})
    report = {'command': subprocess.list2cmdline(sys.orig_argv),
              'source_directory': out.relative_to(ROOT).as_posix(), 'source_zip': make_zip(out), 'lecture_count': len(lectures), 'file_count': len(collector.files),
              'dependency_issue_counts': {kind: sum(x['kind'] == kind for x in collector.issues) for kind in ('missing_dependency', 'missing_anchor', 'non_public_dependency')},
              'outside_repository_check': outside, 'protection': protection, 'dependency_source_protection': dependency_protection, 'public_distribution': 'blocked_pending_permissions',
              'passed_required_dependencies_and_source_protection': not missing and outside['passed'] and all(x['authorized_edition_equal'] for x in protection)
                  and not any(x['authorized_edition_equal'] is False for x in dependency_protection),
              'parser_reuse': 'Builder.ast and walk from tools/build-articles-v02.py; extended Tags HTML parser; old builder run() never called'}
    if args.self_test: report['collector_self_test'] = self_test()
    if args.web: report['web'] = render_web(collector, lectures, ROOT / 'dist/lectures-web', catalog)
    current_changes = [r['source'] for r in collector.files.values() if digest(ROOT / r['source']) != r['sha256']]
    report['sources_changed_during_export'] = current_changes
    report['passed'] = report['passed_required_dependencies_and_source_protection'] and not current_changes and (not args.web or report['web']['check']['passed'])
    write_json(QA / 'export-checks.json', report)
    print(json.dumps({key: report[key] for key in ('source_directory', 'lecture_count', 'file_count', 'dependency_issue_counts', 'public_distribution', 'passed')}, ensure_ascii=False))
    return 0 if report['passed'] else 1

if __name__ == '__main__':
    raise SystemExit(main())
