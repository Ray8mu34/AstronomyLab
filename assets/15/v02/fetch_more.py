from pathlib import Path
import requests,re,html
from PIL import Image
ROOT=Path(__file__).resolve().parents[3]
for name,url in [('cnsa-july.html','https://www.cnsa.gov.cn/n6758823/n6758838/c10761540/content.html'),('cnsa-august.html','https://www.cnsa.gov.cn/n6758823/n6758838/c10768762/content.html')]:
 r=requests.get(url,timeout=60);r.raise_for_status();s=r.content.decode('utf-8')
 (ROOT/'assets/15/v02'/name).write_text(s,encoding='utf-8')
 text=re.sub(r'\s+',' ',re.sub('<[^>]+>',' ',s))
 i=text.find('发布时间');print(name,text[i:i+1600])
items=[('15','rocket-equation.gif','https://www1.grc.nasa.gov/wp-content/uploads/rktpow-600x451.gif'),('16','distance-ladder.png','https://assets.science.nasa.gov/content/dam/science/missions/hubble/releases/2018/02/STScI-01EVT0XXS9RX8ZG6H874Y2Z4ZY.tif/jcr:content/renditions/Full%20Res.png'),('16','s2-orbit-full.jpg','https://cdn.eso.org/images/original/eso0226c.jpg')]
for nn,name,url in items:
 p=ROOT/'assets'/nn/'v02'/name
 if not p.exists():
  try:
   r=requests.get(url,timeout=90);r.raise_for_status();p.write_bytes(r.content)
  except Exception as e: print('FAILED',name,e);continue
 with Image.open(p) as im:im.load();print(name,im.size,p.stat().st_size)
