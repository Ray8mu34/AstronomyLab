"""Download selected media; originals are immutable, metadata records bytes."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from io import BytesIO
import requests,json,hashlib
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
SPECS=[
(1,'hl-tau.jpg','https://cdn.eso.org/images/large/eso1436a.jpg'),
(1,'pluto-enhanced.jpg','https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/n/nh-pluto-in-false-color-1.jpg'),
(1,'kirkwood-gaps.png','https://ssd.jpl.nasa.gov/images/ast_histo.png'),
(2,'titan-radar.jpg','https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia20/pia20021/PIA20021.jpg'),
(2,'uranus-nircam.png','https://assets.science.nasa.gov/content/dam/science/missions/webb/science/2023/04/STScI-01GWQDPJTF1MY8ZGN4WBMWMACJ.png/jcr:content/renditions/Unannotated.png'),
(3,'moon-2026-fancy.jpg','https://svs.gsfc.nasa.gov/vis/a000000/a005500/a005587/preview_fancy.jpg'),
(3,'moon-2026-orbit.jpg','https://svs.gsfc.nasa.gov/vis/a000000/a005500/a005587/preview_orbit.jpg'),
(3,'moon-crescent.jpg','https://svs.gsfc.nasa.gov/vis/a000000/a005000/a005048/phase_waxing_crescent.2028_print.jpg'),
(3,'moon-quarter.jpg','https://svs.gsfc.nasa.gov/vis/a000000/a005000/a005048/phase_first_quarter.2091_print.jpg'),
(3,'moon-full.jpg','https://svs.gsfc.nasa.gov/vis/a000000/a005000/a005048/phase_full.1571_print.jpg'),
(4,'eclipse-types.jpeg','https://assets.science.nasa.gov/dynamicimage/assets/science/psd/solar/internal_resources/5746/5656_solar_tryptich-3a.jpeg?w=1706'),
(4,'mars-oppositions.jpg','https://assets.science.nasa.gov/content/dam/science/missions/hubble/releases/2007/12/STScI-01EVT6QXHS6Y0CV76JVSP5MFJ8.jpg'),
(4,'venus-transit.jpg','https://assets.science.nasa.gov/dynamicimage/assets/science/psd/solar/2023/09/v/venustransit.jpg?w=4096&h=4096&fit=clip&crop=faces%2Cfocalpoint'),
]
def fetch(spec):
 n,name,url=spec;p=ROOT/f'assets/{n:02}/v02/{name}';p.parent.mkdir(exist_ok=True)
 try:
  if not p.exists():
   r=requests.get(url,timeout=(15,45));r.raise_for_status();data=r.content
   with Image.open(BytesIO(data)) as im:im.verify()
   p.write_bytes(data)
  with Image.open(p) as im:size=im.size;fmt=im.format
  return {'path':p.relative_to(ROOT).as_posix(),'download_url':url,'bytes':p.stat().st_size,'size':size,'format':fmt,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'downloaded':True}
 except Exception as e:return {'path':p.relative_to(ROOT).as_posix(),'download_url':url,'error':str(e),'downloaded':False}
with ThreadPoolExecutor(max_workers=5) as pool:records=list(pool.map(fetch,SPECS))
(ROOT/'build/qa/v02-first4-downloads.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
for r in records:print(json.dumps(r,ensure_ascii=False))
