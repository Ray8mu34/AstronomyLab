"""Copy only current articles 01/02 and their six permitted course images.

Do not serve the workspace or teacher files. Prose stays unchanged; only paths
and reference destinations adapt to this self-contained reading surface.
"""
from pathlib import Path
import csv, hashlib, html, json, re, shutil
from urllib.parse import unquote, urlsplit

WEB=Path(__file__).resolve().parents[1]
ROOT=WEB.parents[1]
(WEB/'reading').mkdir(exist_ok=True);(WEB/'media').mkdir(exist_ok=True)
source=(ROOT/'assets/v02-reference/SOURCES-pro-01-04.md').read_text(encoding='utf-8')
sections=re.findall(r'<a id="(s\d+)"></a>(.*?)(?=<a id="s\d+"></a>|\Z)',source,re.S)
citations={key:re.search(r'\]\((https?://[^)]+)\)',section)[1] for key,section in sections}
assets=list(csv.DictReader((ROOT/'assets/v02-first4-ASSETS.csv').open(encoding='utf-8-sig')))
asset_sources={row['asset_id']:row['source_page'] for row in assets}
records=[]
for number in (1,2):
    page=ROOT/f'build/articles/L{number:02}.html'
    text=page.read_text(encoding='utf-8')
    text=text[text.index('<section ',text.index('<body>')):text.index('</body>')]
    def image(match):
        src=match[1]
        origin=(page.parent/unquote(src)).resolve()
        assert origin.is_relative_to(ROOT/'assets') and origin.is_file()
        out=WEB/'media'/origin.name
        if out.exists() and out.read_bytes()!=origin.read_bytes():
            raise RuntimeError(f'Changed local image preserved: {out}')
        if not out.exists():shutil.copyfile(origin,out)
        records.append({'source':origin.relative_to(ROOT).as_posix(),'output':out.relative_to(WEB).as_posix(),'sha256':hashlib.sha256(origin.read_bytes()).hexdigest()})
        return f'src="media/{origin.name}"'
    text=re.sub(r'src="([^"]+)"',image,text)
    def link(match):
        href=html.unescape(match[1]);p=urlsplit(href)
        if p.scheme in ('http','https'):
            return f'href="{html.escape(href,quote=True)}" target="_blank" rel="noopener"'
        if not p.path and p.fragment:return match[0]
        if 'SOURCES-pro-01-04' in p.path and p.fragment in citations:
            return f'href="{html.escape(citations[p.fragment],quote=True)}" target="_blank" rel="noopener"'
        if 'v02-first4-SOURCES' in p.path and p.fragment in asset_sources:
            return f'href="{html.escape(asset_sources[p.fragment],quote=True)}" target="_blank" rel="noopener"'
        if p.path.endswith('planet_parameters.csv'):return 'href="data/physical.json" target="_blank"'
        if 'SOURCES' in p.path:return 'href="references.html" target="_blank"'
        raise RuntimeError(f'Unexpected local link, not copied: {href}')
    text=re.sub(r'href="([^"]+)"',link,text)
    assert '_teacher' not in text and 'raw/' not in text and 'linked/' not in text
    output=WEB/f'reading/{number:02}.html'
    output.write_text(text,encoding='utf-8')
    lesson=next((ROOT/'course').glob(f'{number:02}-*/lesson.md'))
    records.append({'source':lesson.relative_to(ROOT).as_posix(),'source_sha256':hashlib.sha256(lesson.read_bytes()).hexdigest(),'html_source_sha256':hashlib.sha256(page.read_bytes()).hexdigest(),'output':output.relative_to(WEB).as_posix(),'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'adaptation':'Only local image/link paths adapted; original article body preserved.'})
references='<h1>太阳系文章：来源导航</h1><p>各编号保留课程文章引用。原文完整科学来源表与复核边界仍在课程assets中；本页面只提供外部原始资料入口，不复制试卷或教师记录。</p>'
references+='<ol>'+''.join(f'<li id="{key}"><a href="{html.escape(url)}">{key} · {html.escape(url)}</a></li>' for key,url in citations.items())+'</ol>'
(WEB/'references.html').write_text('<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>太阳系来源导航</title><link rel="stylesheet" href="style.css"></head><body style="height:auto;min-height:100vh;padding:30px;max-width:1000px;margin:auto">'+references+'</body></html>',encoding='utf-8')
(WEB/'data/reading-manifest.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Prepared two full articles and {len(records)-2} local image placements; teacher/raw inputs excluded.')
