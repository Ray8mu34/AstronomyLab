"""Download only observed institutional asset URLs for lessons 11–13; dl_env."""
from pathlib import Path
import json, hashlib, requests
from PIL import Image
ROOT = Path(__file__).resolve().parents[3]
FILES = [
('11','orion.jpg','https://cdn.esahubble.org/archives/images/publicationjpg/heic0601a.jpg'),
('11','ring.jpg','https://cdn.esahubble.org/archives/images/large/heic1310a.jpg'),
('11','gaia-hr.jpg','https://www.esa.int/var/esa/storage/images/esa_multimedia/images/2018/04/gaia_s_hertzsprung-russell_diagram/17476330-1-eng-GB/Gaia_s_Hertzsprung-Russell_diagram.jpg'),
('12','sgr-a.jpg','https://cdn.eso.org/images/large/eso2208-eht-mwa.jpg'),
('12','sn1987a.jpg','https://cdn.esahubble.org/archives/images/publicationjpg/heic1704a.jpg'),
('13','hudf.jpg','https://cdn.esahubble.org/archives/images/publicationjpg/heic0406a.jpg'),
('13','planck.jpg','https://www.esa.int/var/esa/storage/images/esa_multimedia/images/2013/03/planck_cmb/12583930-4-eng-GB/Planck_CMB.jpg'),
('13','gaia-sky.png','https://www.esa.int/var/esa/storage/images/esa_multimedia/images/2020/12/the_colour_of_the_sky_from_gaia_s_early_data_release_3/22358049-1-eng-GB/The_colour_of_the_sky_from_Gaia_s_Early_Data_Release_3.png'),
('13','firas_monopole_spec_v1.txt','https://lambda.gsfc.nasa.gov/data/cobe/firas/monopole_spec/firas_monopole_spec_v1.txt'),
]
records=[]
for nn,name,url in FILES:
    path=ROOT/'assets'/nn/'v02'/name
    path.parent.mkdir(parents=True,exist_ok=True)
    if path.exists():
        raise RuntimeError('Refusing existing file: '+str(path))
    response=requests.get(url,timeout=90)
    response.raise_for_status()
    path.write_bytes(response.content)
    rec=dict(path=str(path.relative_to(ROOT)).replace('\\','/'),url=url,sha256=hashlib.sha256(response.content).hexdigest(),bytes=len(response.content))
    if path.suffix in {'.jpg','.png'}:
        with Image.open(path) as im:
            im.load()
            rec['pixels']=list(im.size)
    records.append(rec)
    print(name,rec.get('pixels'),rec['bytes'])
(ROOT/'assets/11/v02/download-record.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
