"""Cache and inspect explicitly selected institutional resource pages."""
from pathlib import Path
from html.parser import HTMLParser
from concurrent.futures import ThreadPoolExecutor
import requests, json
ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'build/qa/v02-first4-cache'
CACHE.mkdir(exist_ok=True)
PAGES={
 'hl-tau':'https://www.eso.org/public/images/eso1436a/',
 'pluto':'https://science.nasa.gov/resource/pluto-dazzles-in-false-color/',
 'kirkwood':'https://ssd.jpl.nasa.gov/diagrams/mb_hist.html',
 'titan':'https://science.nasa.gov/photojournal/mystery-feature-evolves-in-titans-ligeia-mare/',
 'uranus':'https://science.nasa.gov/asset/webb/uranus-nircam-image/',
 'juno':'https://www.missionjuno.swri.edu/science-findings/jupiters-dilute-core',
 'moon':'https://svs.gsfc.nasa.gov/5587/',
 'farside':'https://lroc.im-ldi.com/visit/exhibits/2/gallery/90',
 'mars':'https://science.nasa.gov/asset/hubble/relative-positions-and-sizes-for-1995-2007-mars-oppositions/',
 'galileo':'https://science.nasa.gov/resource/galileos-phases-of-venus-and-other-planets/',
 'eclipses':'https://science.nasa.gov/eclipses/types/',
 'nasa-usage':'https://www.nasa.gov/nasa-brand-center/images-and-media/',
 'jpl-usage':'https://www.jpl.nasa.gov/jpl-image-use-policy/',
 'svs-usage':'https://svs.gsfc.nasa.gov/help/',
}
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[]
 def handle_starttag(self,tag,attrs):
  d=dict(attrs)
  if tag=='a' and 'href' in d:self.links.append(d['href'])
  if tag=='img' and 'src' in d:self.links.append(d['src'])
def fetch(item):
 name,url=item
 try:
  r=requests.get(url,timeout=45);r.raise_for_status()
  (CACHE/f'{name}.html').write_text(r.text,encoding='utf-8')
  p=Links();p.feed(r.text)
  links=list(dict.fromkeys(x for x in p.links if any(s in x.lower() for s in ('.jpg','.jpeg','.png','.tif','copyright','reproduction','usage','image-use'))))
  return {'name':name,'url':r.url,'status':r.status_code,'links':links[:45]}
 except Exception as e:return {'name':name,'url':url,'error':str(e)}
with ThreadPoolExecutor(max_workers=5) as pool:results=list(pool.map(fetch,PAGES.items()))
(CACHE/'page-records.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
for r in results:print(json.dumps(r,ensure_ascii=False))
