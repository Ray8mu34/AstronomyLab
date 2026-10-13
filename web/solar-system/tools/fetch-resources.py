"""Fetch pinned Three.js modules and attributed planet textures locally.

Use the existing Conda dl_env. Never overwrite an existing different resource.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import csv, hashlib, html, json, re, urllib.request
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
VERSION='0.180.0'
def fetch(item):
    name,url,kind=item
    target=ROOT/name
    target.parent.mkdir(parents=True,exist_ok=True)
    if target.exists():
        data=target.read_bytes()
    else:
        req=urllib.request.Request(url,headers={'User-Agent':'AstronomyCourse/1.0 (local educational preparation)'})
        with urllib.request.urlopen(req,timeout=50) as response:
            data=response.read()
        target.write_bytes(data)
    row={'path':name,'url':url,'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data),'kind':kind}
    if kind=='texture':
        with Image.open(target) as image:
            image.load();row['dimensions']=list(image.size)
        row.update(credit='Solar System Scope / INOVE; underlying NASA imagery and elevation data',license='CC BY 4.0',source_page='https://www.solarsystemscope.com/textures/',representation='Adjusted equirectangular rendering texture; some gaps reconstructed, colors enhanced; not a single calibrated photograph')
    return row

items=[(f'vendor/{name}',f'https://cdn.jsdelivr.net/npm/three@{VERSION}/{remote}','code') for name,remote in [
    ('three.module.js','build/three.module.js'),('three.core.js','build/three.core.js'),('OrbitControls.js','examples/jsm/controls/OrbitControls.js'),('LICENSE','LICENSE')]]
names=['mercury','venus_atmosphere','venus_surface','earth_daymap','earth_clouds','mars','jupiter','saturn','uranus','neptune','sun','moon']
items += [(f'textures/{n}.jpg',f'https://www.solarsystemscope.com/textures/download/2k_{n}.jpg','texture') for n in names]
items += [('textures/saturn_ring_alpha.png','https://www.solarsystemscope.com/textures/download/2k_saturn_ring_alpha.png','texture')]
items += [('data/source-jpl-orbits.html','https://ssd.jpl.nasa.gov/planets/approx_pos.html','source'),('data/source-jpl-physical.html','https://ssd.jpl.nasa.gov/planets/phys_par.html','source'),('data/source-texture-license.html','https://www.solarsystemscope.com/textures/','source')]
records=list(ThreadPoolExecutor(max_workers=5).map(fetch,items))

# Parse the actual JPL table, rather than retyping its coefficients.
s=(ROOT/'data/source-jpl-orbits.html').read_text(encoding='utf-8')
plain=html.unescape(re.sub('<[^>]+>','',s))
pattern=r'(Mercury|Venus|EM Bary|Mars|Jupiter|Saturn|Uranus|Neptune)\s+((?:[-\d.]+\s+){11}[-\d.]+)'
elements=[]
for name,numbers in re.findall(pattern,plain):
    if name in [x['name'] for x in elements]:continue
    vals=[float(x) for x in numbers.split()]
    elements.append({'name':name,'elements':vals[:6],'rates':vals[6:]})
assert len(elements)==8,elements
(ROOT/'data/orbits.json').write_text(json.dumps({'source':'https://ssd.jpl.nasa.gov/planets/approx_pos.html','reference':'J2000 mean ecliptic and equinox; Table 1, 1800–2050','fields':['a_au','e','inclination_deg','mean_longitude_deg','perihelion_longitude_deg','ascending_node_deg'],'planets':elements},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

workspace=ROOT.parents[1]
rows=list(csv.DictReader((workspace/'assets/shared/v02/planet_parameters.csv').open(encoding='utf-8-sig')))
(ROOT/'data/physical.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
manifest={'retrieved_at_utc':datetime.now(timezone.utc).isoformat(),'three_version':VERSION,'texture_source_notes':'Solar System Scope based on NASA data, tuned colors, reconstructed missing parts. Neptune especially is not a calibrated true-color view.','records':records}
(ROOT/'data/resources.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'resources':len(records),'textures':len([r for r in records if r['kind']=='texture']),'three_version':VERSION,'orbit_rows':len(elements)},ensure_ascii=False))
