from pathlib import Path
import csv,json,hashlib,re,math
from PIL import Image
ROOT=Path(__file__).resolve().parents[3]
checked='2026-10-03'
cols='asset_id,local_path,title,source_page,creator,credit,permission_or_license,permission_checked_at,modifications,representation_type,used_by,release_status'.split(',')
rows=[]
def reg(id,path,title,page,creator,credit,license,mods,representation,lesson):
    rows.append(dict(zip(cols,[id,path,title,page,creator,credit,license,checked,mods,representation,lesson,'internal-draft'])))
cc='CC BY 4.0；完整credit就地显示；许可页实际打开'
nasa='NASA媒体指南允许教育/信息事实性使用；保留署名与原图；不单独复用logo，不表示机构认可'
reg('A-V02-L14-01','assets/14/v02/crab.jpg','M1 WFPC2正式合成 heic0515a','https://esahubble.org/images/heic0515a/','NASA/ESA/Hubble','NASA, ESA and Allison Loll/Jeff Hester (Arizona State University). Acknowledgement: Davide De Martin (ESA/Hubble)',cc,'原机构JPEG未改色/裁切；OI/SII/OIII非SHO','机构观测合成图','L14')
reg('A-V02-L14-02','assets/14/v02/horsehead-optical.jpg','马头VLT宽带 eso0202a','https://www.eso.org/public/images/eso0202a/','ESO','ESO',cc,'原机构publicationJPEG；B/V/R；未改色/裁切','机构观测宽带图','L14')
reg('A-V02-L14-03','assets/14/v02/m33.jpg','M33 VST宽场 eso1424a','https://www.eso.org/public/images/eso1424a/','ESO','ESO',cc,'原机构publicationJPEG；g/r/Halpha；非最大原图；未改色/裁切','机构观测宽带与窄带合成','L14')
reg('A-V02-L14-04','assets/14/v02/m17-sho.jpg','M17明确SHO heic0305a','https://esahubble.org/images/heic0305a/','NASA/ESA/Hubble','European Space Agency, NASA, and J. Hester (Arizona State University)',cc,'原机构JPEG未改色/裁切；SII红Halpha绿OIII蓝','机构观测窄带合成','L14')
reg('A-V02-L14-05','assets/14/v02/horsehead-ir.jpg','马头WFC3近红外 heic1307a','https://esahubble.org/images/heic1307a/','NASA/ESA/Hubble','NASA, ESA, and the Hubble Heritage Team (AURA/STScI)',cc,'原机构JPEG；1.1/1.6um编码显示；未改色/裁切','机构近红外观测合成','L14')
for ext in ['png','svg']:
    reg('A-V02-L15-01'+('S' if ext=='svg' else ''),f'assets/15/v02/orbit-energy.{ext}','圆轨道速度与能量原创计算图','https://science.nasa.gov/learn/basics-of-space-flight/chapter3-2/','课程编辑组（Codex辅助）','课程原创计算；Python、SVG、JSON同目录','原创课程图；内部课程使用','球对称圆轨道、无大气/自转；非实测；PNG200dpi','原创定量计算图','L15')
reg('A-V02-L15-02','assets/15/v02/rocket-equation.gif','理想火箭方程原图','https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/','NASA Glenn Research Center','NASA Glenn Research Center',nasa,'原600x451GIF不放大生成细节；mf full/me empty映射正文m0/mf','机构工程方程图','L15')
reg('A-V02-L15-03','assets/15/v02/reentry-heating.png','激波与再入气动热报告第5页','https://ntrs.nasa.gov/api/citations/20250006125/downloads/NASA_TPS_Perspectives_ReusableRocketsWorkshop_RevB.pdf','Adam Sidor; Nate Olson; Stan Bouslog (NASA JSC)','Report: Adam Sidor, Nate Olson, Stan Bouslog (NASA JSC). Image: Michael (NASA ARC), "Aerothermal Modeling for Entry and Aerocapture", 2007',nasa+'；报告第2页NASA作者/公众素材说明；仅第5页','pdftoppm 180dpi整页渲染；无裁切/改色；作者观点非NASA正式立场','机构工程物理示意','L15')
reg('A-V02-L15-03P','assets/15/v02/nasa-tps-2025.pdf','NASA作者2025热防护源报告','https://ntrs.nasa.gov/api/citations/20250006125/downloads/NASA_TPS_Perspectives_ReusableRocketsWorkshop_RevB.pdf','Adam Sidor; Nate Olson; Stan Bouslog (NASA JSC)','Adam Sidor, Nate Olson, Stan Bouslog (NASA JSC)','公开来源报告保存供核验；第5页使用说明见PNG行；其他页第三方图不作整体许可判断','原PDF未改；29页','来源报告/渲染源','L15')
reg('A-V02-L15-04','assets/15/v02/crs21-landing.jpg','CRS21一子级着陆原截帧','https://www.nasa.gov/blogs/spacexcrs21/2020/12/06/falcon-9-first-stage-sticks-the-landing/','NASA','NASA',nasa,'NASA原1280x720直播截帧；镜面水滴/逆光是原画面；未做锐化修复','机构真实工程事件画面','L15')
reg('A-V02-L16-01','assets/16/v02/tycho-peak.jpg','LRO第谷中央峰斜视','https://science.nasa.gov/resource/tycho-craters-central-peak-on-the-moon/','NASA Goddard/Arizona State University','NASA Goddard/Arizona State University',nasa,'下载官方2147宽rendition；未改色/裁切；近轨道斜视不是目镜效果','机构月面观测图','L16')
reg('A-V02-L16-02','assets/16/v02/s2-orbit.png','S2近红外与1992至2002轨道高清','https://www.eso.org/public/images/eso0226c/','ESO','ESO',cc,'原TIFF无损转RGB PNG；未裁切/改色；历史测量非最新质量','机构观测与轨道数据图','L16')
reg('A-V02-L16-02T','assets/16/v02/s2-orbit-original.tif','S2机构原始发布TIFF','https://www.eso.org/public/images/eso0226c/','ESO','ESO',cc,'原TIFF保存无修改；PNG渲染源','机构观测与数据母图','L16')
reg('A-V02-L16-03','assets/16/v02/distance-ladder.png','2018宇宙距离阶梯','https://esahubble.org/images/opo1812a/','NASA/ESA/STScI','NASA, ESA, A. Feild (STScI), and A. Riess (STScI/JHU)',cc,'NASA3000x2550原PNG；同图ESA/Hubble核对；图中2018精度非现今纪录','机构科学解释与数据示意','L16')
with (ROOT/'assets/v02-batch-D-ASSETS.csv').open('w',encoding='utf-8-sig',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=cols);writer.writeheader();writer.writerows(rows)
metadata=[]
for row in rows:
    p=ROOT/row['local_path']; item={'asset_id':row['asset_id'],'path':row['local_path'],'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
    if p.suffix.lower() in ['.jpg','.png','.gif','.tif']:
        with Image.open(p) as im:
            im.load();item.update(width=im.width,height=im.height,format=im.format)
    metadata.append(item)
for lesson in ['14-astronomical-images','15-news-and-explanation','16-integration']:
    p=ROOT/'course'/lesson/'lesson.md';s=p.read_text(encoding='utf-8')
    assert not any(ord(c)<32 and c not in '\n\t\r' for c in s)
    images=re.findall(r'!\[[^\]]*\]\(([^)]+)\)',s)
    for rel in images: assert (p.parent/rel).resolve().is_file(),rel
    assert s.count('$$')%2==0
    main='\n'.join(l for l in s.splitlines() if not l.startswith(('#','![','*图','具体事件','具体来源','测量来源')))
    metadata.append({'lesson':lesson,'total_han':len(re.findall('[\u4e00-\u9fff]',s)),'main_han':len(re.findall('[\u4e00-\u9fff]',main)),'local_image_links':len(images),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(ROOT/'build/qa/v02-batch-D-verification.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(metadata[-3:],ensure_ascii=False,indent=2))
print('CSV records',len(rows),'columns',len(cols))
