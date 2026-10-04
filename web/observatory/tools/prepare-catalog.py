"""创建统一站点全文/素材索引；不改原文与图片，保护人工修改过的生成索引。"""
import csv, hashlib, json, re
from pathlib import Path
from datetime import datetime, timezone
root=Path(__file__).resolve().parents[3]
site=root/'web/observatory'
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
manifest_path=site/'data/catalog-manifest.json'
previous=json.loads(manifest_path.read_text(encoding='utf-8')) if manifest_path.exists() else {}
articles=[]
for n in range(1,17):
    folder=next((root/'course').glob(f'{n:02d}-*'))
    source=folder/'lesson.md'
    text=source.read_text(encoding='utf-8')
    title=re.search(r'^#\s+(.+)',text,re.M)[1]
    title=re.sub(r'^\d{2}\s+', '',title)
    articles.append({'number':n,'title':title,'source':source.relative_to(root).as_posix(),'source_sha256':sha(source),'html_sha256':sha(root/f'build/articles/L{n:02d}.html'),'han_characters':len(re.findall(r'[\u4e00-\u9fff]',text))})
assets=[]
with (root/'assets/ARTICLE_ASSETS.csv').open(encoding='utf-8-sig',newline='') as f:
    for row in csv.DictReader(f):
        p=root/row['local_path']
        if p.exists() and p.suffix.lower() in {'.png','.jpg','.jpeg','.svg','.webp','.gif'}:
            assets.append({**row,'sha256':sha(p),'bytes':p.stat().st_size})
for slug,label,file,url in [
    ('oae-ursa','大熊座：从地球所见的方向图','oae-ursa-major.png','https://www.astro4edu.org/media/diagrams/multimedia/ursa-major-constellation-map_en.png'),
    ('oae-taurus','金牛座：相邻方向不等于相邻距离','oae-taurus.png','https://astro4edu.org/resources/diagram/b237po71Gd6/')]:
    p=root/'assets/06'/file
    if p.exists() and not any(a['local_path']==p.relative_to(root).as_posix() for a in assets):
        assets.append({'asset_id':slug,'local_path':p.relative_to(root).as_posix(),'title':label,'source_page':url,'creator':'IAU OAE / IAU / Sky & Telescope','credit':'Adapted by the IAU Office of Astronomy for Education from the original by IAU and Sky & Telescope','permission_or_license':'CC BY 4.0；沿用已实际核验的A06-08/09记录，非本轮新许可结论','modifications':'保留原图','representation_type':'真实方向星图，非3D目录','used_by':'L06','sha256':sha(p),'bytes':p.stat().st_size})
galaxy_manifest=site/'data/galaxy/manifest.json'
if galaxy_manifest.exists():
    for item in json.loads(galaxy_manifest.read_text(encoding='utf-8'))['resources']:
        if not item['file'].startswith('data/') or Path(item['file']).suffix not in {'.jpg','.png'}: continue
        p=site/item['file']
        assets.append({'asset_id':'galaxy-'+p.stem,'local_path':item['file'],'title':'2MASS近红外全天星数图' if '2mass' in p.name else 'Planck 2013背景温度起伏方向图','source_page':item['source_page'],'creator':item['credit'],'credit':item['credit'],'permission_or_license':item['license'],'modifications':item['modifications'],'representation_type':item['representation'],'used_by':'L13','sha256':sha(p),'bytes':p.stat().st_size})
public_assets={a['local_path'] for a in assets if a['local_path'].startswith('assets/')}
for n in range(1,17):
    html=(root/f'build/articles/L{n:02d}.html').read_text(encoding='utf-8')
    for target in re.findall(r'(?:src|href)="\.\./\.\./(assets/[^"#]+)',html):
        path=(root/target).resolve()
        if path.is_relative_to(root/'assets') and path.is_file() and path.suffix.lower() in {'.png','.jpg','.jpeg','.svg','.gif','.webp','.py'}:
            public_assets.add(target)
catalog={'generated_at':datetime.now(timezone.utc).isoformat(),'articles':articles,'assets':assets,'public_assets':sorted(public_assets),'human_review':'pending','classroom_trial':'pending','textbook_comparison':'pending'}
output=site/'data/catalog.json'
if output.exists() and previous.get('catalog_sha256')!=sha(output):
    raise RuntimeError('catalog.json has changed since generation; preserved for review')
output.parent.mkdir(parents=True,exist_ok=True)
output.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
manifest_path.write_text(json.dumps({'catalog_sha256':sha(output),'sources':{'assets/ARTICLE_ASSETS.csv':sha(root/'assets/ARTICLE_ASSETS.csv')},'articles':articles},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Indexed {len(articles)} complete articles and {len(assets)} local image entries; originals unchanged.')
