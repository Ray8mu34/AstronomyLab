"""Read primary pages and download explicitly selected assets, dl_env only."""
from pathlib import Path
import requests, re, json, sys
from urllib.parse import urljoin
ROOT=Path(__file__).resolve().parents[3]
pages={
'seasons':'https://science.nasa.gov/solar-system/skywatching/night-sky-network/tropical-solstice-shadows/',
'gaia':'https://www.esa.int/ESA_Multimedia/Images/2020/12/The_colour_of_the_sky_from_Gaia_s_Early_Data_Release_3',
'jianyi':'https://www.chnmuseum.cn/zp/zpml/kgfjp/202111/t20211116_252346.shtml',
'quadrant':'https://www.dpm.org.cn/collection/clock/228933.html',
}
session=requests.Session()
for key,url in pages.items():
 try:
  r=session.get(url,timeout=35);r.raise_for_status();r.encoding='utf-8'
  folder=ROOT/'assets'/({'seasons':'05','gaia':'06','jianyi':'07','quadrant':'07'}[key])/'v02'
  folder.mkdir(parents=True,exist_ok=True)
  (folder/(key+'-source.html')).write_text(r.text,encoding='utf-8')
  urls=re.findall(r'<img[^>]+(?:src|data-src)=["\']([^"\']+)',r.text)
  print(key,url,r.status_code)
  print('\n'.join(urljoin(url,x) for x in urls if not any(z in x for z in ['logo','icon','png;base64'])))
 except Exception as ex:print(key,type(ex).__name__,str(ex))
downloads=[
('05','solstice-earth.png','https://science.nasa.gov/wp-content/uploads/2024/04/solstice-comparison-horz-notext.webp'),
('06','gaia-colour.png','https://www.esa.int/var/esa/storage/images/esa_multimedia/images/2020/12/the_colour_of_the_sky_from_gaia_s_early_data_release_3/22358049-1-eng-GB/The_colour_of_the_sky_from_Gaia_s_Early_Data_Release_3.png'),
('07','jianyi-model.jpg','https://www.chnmuseum.cn/zp/zpml/kgfjp/202111/P020211116599281919618.jpg'),
('07','quadrant.jpg','https://img.dpm.org.cn/Uploads/Picture/dc/3546.jpg'),
]
from PIL import Image
for nn,name,url in downloads:
 try:
  r=session.get(url,timeout=60);r.raise_for_status()
  target=ROOT/'assets'/nn/'v02'/name;target.write_bytes(r.content)
  im=Image.open(target);im.load()
  print('DOWNLOADED',name,len(r.content),im.size,im.format)
 except Exception as ex:print('DOWNLOAD FAILED',name,type(ex).__name__,str(ex))
