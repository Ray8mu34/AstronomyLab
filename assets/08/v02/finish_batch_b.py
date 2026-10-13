from pathlib import Path
import re, csv, hashlib, json, math
from PIL import Image
ROOT=Path(__file__).resolve().parents[3]
p=ROOT/'course/08-observing/lesson.md'
s=p.read_text(encoding='utf8')
s=s.replace('恒星在肉眼下通常近似点源，来自很窄的方向；行星有可分辨的视圆面，圆面不同部分的光穿过不完全相同的路径，部分变化得以平均，所以行星通常闪烁较弱。','恒星对大气传播而言通常近似点源，来自极窄的方向；行星则有有限的角直径，属于扩展光源，肉眼未必能分辨其圆面。圆面不同部分的光穿过不完全相同的路径，部分变化得以平均，所以行星通常闪烁较弱。')
s=s.replace('## 一次观测可以怎样留下证据','## 把条件组织成一夜的选择\n\n假设在北纬三十度的冬季夜晚，想看猎户座方向的一片弥散星云，也想比较亮双星的分离情况。这里不指定某个实际日期，因此月球与时刻必须另查星历。对星云，先确认它能在较高位置出现在月光较弱的时段；对双星，则更关心图像是否稳定，以及两点间隔能否大于仪器和大气造成的有效模糊尺度。一份目标表可以相同，排序却随条件变化：薄云让星云难以辨认时，明亮目标仍可能可用；透明却抖动的空气，让淡星云的检测保留机会，却损失双星的细结构。\n\n对长曝光摄影，还要把“多拍一会儿”的收益说清。在目标与背景速率都稳定、光子涨落占主导的近似下，两者计数都随时间增加，而涨落只随计数平方根增加，因而信噪比大致随曝光时间平方根增长。曝光四倍通常换来两倍信噪比，而不是四倍；若背景随月升或薄云变化，或者仪器追踪发生漂移，这种简单比例就不再完整。长曝光还可能饱和亮核。多张较短曝光可以筛除明显失效的帧并提供时间上的检查，却会重复引入读出噪声，不能宣布无条件比一张长曝光优越。\n\n目视观察无法把这些计数公式原样搬进大脑，但它同样需要管理时间：暗适应与目标升高往往都要等待；在亮目标旁频繁开强光找星，会抵消等待的一部分收益。安排一段安静观察，逐渐确认亮核、邻星与淡外缘，比不断在器材、手机和天空之间切换更有利于形成可信印象。真正的规划不是把任务塞满夜晚，而是让每个目标获得与它所需证据相配的条件。\n\n## 一次观测可以怎样留下证据')
p.write_text(s,encoding='utf8')
p=ROOT/'course/09-telescopes/lesson.md';s=p.read_text(encoding='utf8').replace('鏡筒长度','镜筒长度');p.write_text(s,encoding='utf8')
p=ROOT/'course/10-starlight/lesson.md';s=p.read_text(encoding='utf8').replace('相差五等只剩百分之一通量，相差十等只剩万分之一。','相差五等只剩百分之一通量。');p.write_text(s,encoding='utf8')
fields=['asset_id','local_path','title','source_page','creator','credit','permission_or_license','permission_checked_at','modifications','representation_type','used_by','release_status']
photo=[
('08','light-pollution','Paranal low-light environment','potw1936a','ESO/P. Horálek','visible-light night photography; exposure/display not naked-eye photometry'),
('08','airglow','Airglow and Milky Way','potw1638a','Y. Beletsky (LCO)/ESO','visible-light night panorama; enhanced faint color, not naked-eye saturation'),
('09','primary-mirror','Yepun mirror after recoating','recoating-ut4','ESO/G. Huedepohl (atacamaphoto.com)','visible-light maintenance photograph; perspective retained; identifiable persons: internal education, commercial use requires clearance'),
('09','neptune-ao','Neptune with and without adaptive optics','eso1824b','ESO/P. Weilbacher (AIP)','processed scientific composite; left AO on/right off; page lists 551–920 nm channels, not calibrated true color'),
('10','flames-spectra','GIRAFFE first-light stellar spectra detail','eso0219b','ESO','processed detector data; orange display mapping, not stellar color; Mg triplet around 517 nm; no calibrated axes supplied'),
]
models=[('08','airmass-extinction','Airmass and extinction','X=1/sin(h), h>=15deg; k=0.10,0.20,0.40 mag/airmass; no clouds'),('08','background-contrast','Source and background contrast','Gaussian peak increment 20, background20/100/500; mean signals, no noise'),('09','focal-plane','Ideal paraxial focal-plane mapping','arbitrary geometric units; two incoming directions, y≈F theta; no diffraction/aberrations'),('09','resolution-and-seeing','Diffraction and blurred double-source model','Rayleigh1.22λ/D at550/800nm; comparison seeing FWHM2arcsec is differently defined; two Gaussian sources separated2arcsec, individual peaks normalized'),('10','planck-curves','Blackbody continuum model','Planck B_lambda,3000/5800/10000K; left absolute radiance/right individual peak normalization; visible region380–750nm; no atmosphere/lines'),('10','magnitude-distance','Magnitude and distance-modulus model','F/Fref=10^(-0.4dm); m-M=5log10(d/10pc); no extinction; identical intrinsic luminosity')]
rows=[]
for nn,name,title,page,credit,desc in photo:
 rows.append([f'V02-B{nn}-{name}',f'assets/{nn}/v02/{name}.jpg',title,f'https://www.eso.org/public/images/{page}/',credit,credit,'CC BY 4.0; ESO public-media policy https://www.eso.org/public/outreach/copyright/','2026-10-02','No crop, recolor or edit; official published JPG rendition downloaded; '+desc,'institutional photograph / scientific data','L'+nn,'local decoded; model visual review completed; human review pending'])
for nn,name,title,desc in models:
 for ext in ['png','svg']:
  rows.append([f'V02-B{nn}-{name}-{ext}',f'assets/{nn}/v02/{name}.{ext}',title,'assets/08/v02/create_batch_b_assets.py','课程原创计算（Codex）','课程原创计算（Codex）','Course original; reusable editable source','2026-10-02','Generated from explicit model: '+desc,'scientific model, not observed data','L'+nn,'local decoded/rendered PNG reviewed; human review pending'])
out=ROOT/'assets/v02-batch-B-ASSETS.csv'
with out.open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.writer(f);w.writerow(fields);w.writerows(rows)
stats=[];imglinks=[]
for folder in ['08-observing','09-telescopes','10-starlight']:
 p=ROOT/'course'/folder/'lesson.md';s=p.read_text(encoding='utf8')
 body=re.sub(r'^---\n.*?\n---\n','',s,count=1,flags=re.S).split('\n---\n')[0]
 body=re.sub(r'!\[[^\]]*\]\([^\n]*\)\n?','',body)
 body='\n'.join(line for line in body.splitlines() if not line.startswith('*图 '))
 body=re.sub(r'\[([^\]]+)\]\\?\([^)]*\)',r'\1',body)
 count=len(re.findall(r'[\u3400-\u9fff]',body))
 links=re.findall(r'!\[[^\]]*\]\(([^)]+)\)',s)
 for rel in links:
  ip=(p.parent/rel).resolve();assert ip.exists(),ip
  with Image.open(ip) as im:im.load();size=im.size
  imglinks.append((str(ip.relative_to(ROOT)),size))
 stats.append((folder,count,len(links),hashlib.sha256(p.read_bytes()).hexdigest()))
print(json.dumps({'articles':stats,'image_links':imglinks},ensure_ascii=False,indent=2))
