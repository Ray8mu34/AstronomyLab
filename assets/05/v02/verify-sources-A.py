from pathlib import Path
import requests,re
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[3]
pages=[('05','pmo-calendar','https://www.pmo.cas.cn/xwdt2019/kpdt2019/202203/t20220317_6399980.html'),('05','antares','https://www.cnsa.gov.cn/n6758968/n6758973/c6771597/content.html'),('07','gnomon','https://www.dpm.org.cn/lemmas/239748.html'),('06','astrometry','https://gea.esac.esa.int/archive/documentation/GEDR3/Data_processing/chap_cu3ast/sec_cu3ast_intro/ssec_cu3ast_intro_tansforms.html')]
for nn,key,url in pages:
 try:
  r=requests.get(url,timeout=25);r.raise_for_status();r.encoding='utf-8'
  soup=BeautifulSoup(r.text,'html.parser')
  for el in soup(['script','style','nav','header','footer']):el.decompose()
  tx=soup.get_text('\n',strip=True)
  (ROOT/'assets'/nn/'v02'/(key+'-source.html')).write_text(r.text,encoding='utf-8')
  (ROOT/'assets'/nn/'v02'/(key+'-source.txt')).write_text(tx,encoding='utf-8')
  print(key,r.status_code,len(tx))
 except Exception as e: print(key,type(e).__name__,str(e))
