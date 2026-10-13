"""Copy existing permitted local resources and 03/04 reading; never edit originals."""
from pathlib import Path
import csv, hashlib, html, json, re, shutil
from urllib.parse import unquote, urlsplit
WEB=Path(__file__).resolve().parents[1]
ROOT=WEB.parents[1]
records=[]
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def copy(origin,out,kind):
    out.parent.mkdir(parents=True,exist_ok=True)
    if out.exists() and out.read_bytes()!=origin.read_bytes():raise RuntimeError(f'Existing changed output protected: {out}')
    if not out.exists():shutil.copyfile(origin,out)
    records.append(dict(source=origin.relative_to(ROOT).as_posix(),output=out.relative_to(WEB).as_posix(),sha256=sha(origin),kind=kind))
for name in ['three.module.js','three.core.js','OrbitControls.js','LICENSE']:
    copy(ROOT/'web/solar-system/vendor'/name,WEB/'vendor'/name,'Three.js 0.180.0, MIT; existing verified local package')
for name in ['earth_daymap.jpg','moon.jpg']:
    copy(ROOT/'web/solar-system/textures'/name,WEB/'textures'/name,'Solar System Scope/INOVE, CC BY 4.0; existing local texture')
source=(ROOT/'assets/v02-reference/SOURCES-pro-01-04.md').read_text(encoding='utf-8')
sections=re.findall(r'<a id="(s\d+)"></a>(.*?)(?=<a id="s\d+"></a>|\Z)',source,re.S)
citations={key:re.search(r'\]\((https?://[^)]+)\)',section)[1] for key,section in sections}
assets=list(csv.DictReader((ROOT/'assets/v02-first4-ASSETS.csv').open(encoding='utf-8-sig')))
asset_sources={row['asset_id']:row['source_page'] for row in assets}
for number in (3,4):
    page=ROOT/f'build/articles/L{number:02}.html'
    text=page.read_text(encoding='utf-8')
    text=text[text.index('<section ',text.index('<body>')):text.index('</body>')]
    def image(match):
        origin=(page.parent/unquote(match[1])).resolve()
        assert origin.is_relative_to(ROOT/'assets') and origin.is_file()
        copy(origin,WEB/'media'/origin.name,'Original course image, attribution kept in reading caption')
        return f'src="media/{origin.name}"'
    text=re.sub(r'src="([^"]+)"',image,text)
    def link(match):
        href=html.unescape(match[1]);p=urlsplit(href)
        if p.scheme in ('http','https'):return f'href="{html.escape(href,quote=True)}" target="_blank" rel="noopener"'
        if not p.path and p.fragment:return match[0]
        if 'SOURCES-pro-01-04' in p.path and p.fragment in citations:return f'href="{html.escape(citations[p.fragment],quote=True)}" target="_blank" rel="noopener"'
        if 'v02-first4-SOURCES' in p.path and p.fragment in asset_sources:return f'href="{html.escape(asset_sources[p.fragment],quote=True)}" target="_blank" rel="noopener"'
        if 'SOURCES' in p.path:return 'href="references.html" target="_blank"'
        raise RuntimeError(f'Unexpected local link, not copied: {href}')
    text=re.sub(r'href="([^"]+)"',link,text)
    assert '_teacher' not in text and 'raw/' not in text
    out=WEB/f'reading/{number:02}.html';out.parent.mkdir(exist_ok=True)
    previous=json.loads((WEB/'data/resources.json').read_text(encoding='utf-8')) if (WEB/'data/resources.json').exists() else []
    expected=next((r['sha256'] for r in previous if r['output']==out.relative_to(WEB).as_posix()),None)
    if out.exists() and sha(out)!=expected:raise RuntimeError(f'Changed reading output protected: {out}')
    out.write_text(text,encoding='utf-8')
    lesson=next((ROOT/'course').glob(f'{number:02}-*/lesson.md'))
    records.append(dict(source=lesson.relative_to(ROOT).as_posix(),source_sha256=sha(lesson),html_source=page.relative_to(ROOT).as_posix(),html_source_sha256=sha(page),output=out.relative_to(WEB).as_posix(),sha256=sha(out),kind='Complete article; only image and link destinations adapted'))
references='<h1>日地月文章：来源导航</h1><p>保留课程引用编号。来源核验范围见课程素材记录与本实验SOURCES.md。</p><ol>'+''.join(f'<li id="{key}"><a href="{html.escape(url)}">{key} · {html.escape(url)}</a></li>' for key,url in citations.items())+'</ol>'
out=WEB/'references.html'
if not out.exists():out.write_text('<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>日地月来源导航</title><link rel="stylesheet" href="style.css"></head><body style="padding:30px;max-width:1000px;margin:auto">'+references+'</body></html>',encoding='utf-8')
(WEB/'data').mkdir(exist_ok=True)
(WEB/'data/resources.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Prepared {len(records)} resources, 2 full articles; originals unchanged.')
