"""Local v02 material retrieval; no installation, no overwrite of existing assets."""
from pathlib import Path
import requests, json, re, hashlib
from PIL import Image
ROOT=Path(__file__).resolve().parents[3]
items=[
('14','crab.jpg','https://cdn.esahubble.org/archives/images/large/heic0515a.jpg'),
('14','horsehead-optical.jpg','https://cdn.eso.org/images/publicationjpg/eso0202a.jpg'),
('14','m33.jpg','https://cdn.eso.org/images/publicationjpg/eso1424a.jpg'),
('14','horsehead-ir.jpg','https://cdn.esahubble.org/archives/images/large/heic1307a.jpg'),
('14','m17-sho.jpg','https://cdn.esahubble.org/archives/images/large/heic0305a.jpg'),
('15','crs21-landing.jpg','https://www.nasa.gov/wp-content/uploads/2020/12/CRS-landing_screengrab.jpg'),
('16','s2-orbit.jpg','https://cdn.eso.org/images/large/eso0226c.jpg'),
]
records=[]
for nn,name,url in items:
 p=ROOT/'assets'/nn/'v02'/name;p.parent.mkdir(parents=True,exist_ok=True)
 if not p.exists():
  r=requests.get(url,timeout=90);r.raise_for_status();p.write_bytes(r.content)
 with Image.open(p) as im: im.load();size=im.size
 records.append(dict(path=str(p.relative_to(ROOT)).replace('\\','/'),url=url,bytes=p.stat().st_size,dimensions=size,sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
 print(name,size,p.stat().st_size)
pages=[('15','cnsa-july.html','https://www.cnsa.gov.cn/n6758823/n6758838/c10761540/content.html'),('15','cnsa-august.html','https://www.cnsa.gov.cn/n6758823/n6758838/c10768762/content.html'),('15','yuanxingzhe-2025.html','https://kfqgw.beijing.gov.cn/zwgkkfq/ztzl/lqztkfq/lqzx/zxxx/202506/t20250604_4105322.html'),('16','ladder-page.html','https://science.nasa.gov/asset/hubble/three-steps-to-measuring-the-hubble-constant/'),('15','rocket-equation-page.html','https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/')]
for nn,name,url in pages:
 p=ROOT/'assets'/nn/'v02'/name
 try:
  if not p.exists():
   r=requests.get(url,timeout=50);r.raise_for_status();r.encoding=r.apparent_encoding;p.write_text(r.text,encoding='utf-8')
  s=p.read_text(encoding='utf-8')
  print('PAGE',name,len(s))
  if name.startswith('cnsa'):
   text=re.sub('<[^>]+>',' ',s);text=re.sub(r'\s+',' ',text)
   for key in ['2026','长征','朱雀']:
    i=text.find(key);print(text[max(0,i-80):i+1800])
  if name=='ladder-page.html':
   urls=re.findall(r'https://assets\.science\.nasa\.gov/[^\s\"<>]+',s)
   print('LADDER_IMAGES',list(dict.fromkeys(u for u in urls if 'STScI' in u))[:20])
  if name=='rocket-equation-page.html':
   print('ROCKET_IMAGES',re.findall(r'<img[^>]+src=[\"\']([^\"\']+)',s)[:8])
 except Exception as e: print('PAGE_FAILED',name,type(e).__name__,str(e))
(ROOT/'assets/14/v02/retrieval.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
