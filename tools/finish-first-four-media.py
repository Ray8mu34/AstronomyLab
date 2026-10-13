from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from io import BytesIO
import requests, json, hashlib
from PIL import Image, ImageOps, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
URL='https://science.nasa.gov/moon/moon-phases/'
class Parser(HTMLParser):
 def handle_starttag(self,tag,attrs):
  d=dict(attrs)
  if tag=='img':
   text=' '.join(str(v) for v in d.values())
   if any(x in text.lower() for x in ['phase','earthshine']): print(json.dumps(d,ensure_ascii=False))
if __name__=='__main__':
 html=requests.get(URL,timeout=(15,45));html.raise_for_status()
 (ROOT/'build/qa/v02-first4-cache/moon-phases.html').write_text(html.text,encoding='utf-8')
 specs=[('moon-phases.png','https://assets.science.nasa.gov/dynamicimage/assets/science/psd/lunar-science/internal_resources/603/moon-phases-jpl.png?w=1700&h=904&fit=clip&crop=faces%2Cfocalpoint'),('moon-nearside.png','https://www.nasa.gov/wp-content/uploads/2024/06/lro-8-lro-lunar-nearside.png'),('moon-farside.png','https://www.nasa.gov/wp-content/uploads/2024/06/lro-9-lro-lunar-farside.png'),('daytime-moon.jpg','https://assets.science.nasa.gov/dynamicimage/assets/science/psd/lunar-science/2023/08/427_moonridge-800.jpg?w=800&h=800&fit=clip&crop=faces%2Cfocalpoint')]
 specs.append(('moon-near-far-comparison.jpg','https://assets.science.nasa.gov/dynamicimage/assets/science/psd/lunar-science/internal_resources/588/moon-nearside-farside_copy.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1110&w=2000'))
 def fetch(spec):
  name,url=spec;p=ROOT/'assets/03/v02'/name
  try:
   if not p.exists():
    r=requests.get(url,timeout=(15,45));r.raise_for_status()
    with Image.open(BytesIO(r.content)) as im: im.verify()
    p.write_bytes(r.content)
   with Image.open(p) as im:size=im.size
   return dict(path=p.relative_to(ROOT).as_posix(),download_url=url,size=size,bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest(),downloaded=True)
  except Exception as e:return dict(path=str(p),downloaded=False,error=str(e))
 with ThreadPoolExecutor(max_workers=4) as pool: records=list(pool.map(fetch,specs))
 (ROOT/'build/qa/v02-first4-alternate-downloads.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
 for r in records:print(json.dumps(r,ensure_ascii=False))
 files=sorted(ROOT.glob('assets/0[1-4]/v02/*'))
 contact=Image.new('RGB',(1200,340*((len(files)+2)//3)), '#ececec');draw=ImageDraw.Draw(contact)
 for i,p in enumerate(files):
  with Image.open(p) as im: thumb=ImageOps.contain(im.convert('RGB'),(380,290))
  x=(i%3)*400+(400-thumb.width)//2;y=(i//3)*340
  contact.paste(thumb,(x,y));draw.text(((i%3)*400+8,y+300),p.name,fill='black')
 contact.save(ROOT/'build/qa/v02-first4-contact.jpg')
