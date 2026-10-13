"""Read-only article/material verification; emits only the dedicated batch B QA report.
Run in dl_env. Sources and article edits are maintained separately.
"""
from pathlib import Path
import re, csv, hashlib, json, math, subprocess
from PIL import Image
ROOT=Path(__file__).resolve().parents[3]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
errors=[];summaries=[];photos=[]
csvpath=ROOT/'assets/v02-batch-B-ASSETS.csv'
with csvpath.open(encoding='utf-8-sig',newline='') as f:
 reader=csv.DictReader(f);fields=reader.fieldnames;rows=list(reader)
assert len(fields)==12
for row in rows:
 p=ROOT/row['local_path'];assert p.exists(),p
 if p.suffix in ['.jpg','.png']:
  with Image.open(p) as im:im.load()
 if p.suffix=='.svg':assert '<svg' in p.read_text(encoding='utf8')
pandoc=ROOT/'tools/vendor/pandoc-3.12/pandoc.exe'
for folder in ['08-observing','09-telescopes','10-starlight']:
 p=ROOT/'course'/folder/'lesson.md';s=p.read_text(encoding='utf8')
 ast=json.loads(subprocess.run([str(pandoc),str(p),'--from=markdown','--to=json'],capture_output=True,text=True,encoding='utf8',check=True).stdout)
 blocks=ast['blocks'];nn=folder[:2]
 anchors=[b['c'][1][0] for b in blocks if b['t']=='Header']
 assert all(f'L{nn}-C{x:02d}' in anchors for x in range(1,4)),anchors
 assert 'human_review: pending' in s and 'classroom_trial: pending' in s
 assert not any(word in s for word in ['TODO','待补图片','教师自行发挥'])
 body=re.sub(r'^---\n.*?\n---\n','',s,count=1,flags=re.S).split('\n---\n')[0]
 body=re.sub(r'!\[[^\]]*\]\([^\n]*\)\n?','',body)
 body='\n'.join(line for line in body.splitlines() if not line.startswith('*图 '))
 body=re.sub(r'\[([^\]]+)\]\([^)]*\)',r'\1',body)
 count=len(re.findall(r'[\u3400-\u9fff]',body))
 links=re.findall(r'!\[[^\]]*\]\(([^)]+)\)',s)
 for rel in links:
  ip=(p.parent/rel).resolve();assert ip.exists(),ip
  with Image.open(ip) as im:im.load();size=im.size
  photos.append((str(ip.relative_to(ROOT)).replace('\\','/'),size,sha(ip)))
 summaries.append((nn,count,len(links),len(blocks),sha(p)))
numeric={
 'airmass_60deg':1/math.sin(math.radians(60)),
 '30vs60_flux_k0.20':10**(-.4*.2*(2-1/math.sin(math.radians(60)))),
 '15vs60_flux_k0.20':10**(-.4*.2*(1/math.sin(math.radians(15))-1/math.sin(math.radians(60)))),
 'magnification_1950_40':1950/40,
 'moon_image_1000mm':1000*math.radians(.5),
 'rayleigh_D100_550nm_arcsec':1.22*550e-9/.1*206265,
 'rayleigh_D200_550nm_arcsec':1.22*550e-9/.2*206265,
 '4um_F1000_pixel_arcsec':206265*.004/1000,
 'VLT8.2m_vs200mm_area':(8.2/.2)**2,
 'one_mag_flux_ratio':10**.4,
 'one_mag_unmodelled_extinction_distance_factor':10**.2,
 'Wien_3000_5800_10000_nm':[2.898e6/T for T in [3000,5800,10000]],
 'Halpha_shift0.2nm_velocity_km_s':3e5*.2/656.3,
 'R10000_velocity_width_km_s':3e5/10000,
 'HARPS_R115000_velocity_width_km_s':3e5/115000,
}
assert abs(numeric['30vs60_flux_k0.20']-.856)<.002
assert abs(numeric['15vs60_flux_k0.20']-.607)<.004
assert abs(numeric['rayleigh_D100_550nm_arcsec']-1.38)<.01
assert abs(numeric['Halpha_shift0.2nm_velocity_km_s']-91.42)<.1
report=['# v0.2 批次 B：08—10 讲实际检查记录','','检查日期：2026-10-03；dl_env Python `D:/Env/Conda/envs/dl_env/python.exe`；项目本地 Pandoc 3.12。未安装新依赖。','','## 交付与内容审读','','|讲次|正文近似汉字数（去 frontmatter、图、图注、来源尾段）|实际引用图件|Pandoc AST 块数|lesson.md SHA-256|','|---|---:|---:|---:|---|']
for nn,count,nimg,nb,h in summaries:report.append(f'|L{nn}|{count}|{nimg}|{nb}|`{h}`|')
report+=['','正文是连贯解释文章，无目标、诊断卡、分钟流程、出口任务。保留 C01—C03 既有概念锚点；不把文章自动裁成投影片。字数是范围指标，正文数字与英文单位未计为汉字。','','根代理已实际全文审读 08、09、10：08 行星有限角直径与肉眼分辨消歧、10 视差 1 AU 定义与 B/V 通带消歧已修。独立代理 lessons_13_16 已全文读 10 与三图，核对激发/电离、低速多普勒与 R/RV 精度边界，未发现硬科学错误；建议 NIST 直接波长表，已打开并改链接。模型审读不能升级为 human_review。','','## 实际文件与科学算例检查','','- 每讲 Markdown 被项目 Pandoc 实际解析为 JSON AST，C01—C03 均存在；图片引用实际解析、逐件 PIL 解码；所有登记的 PNG/JPG 解码、SVG 含有效根节点。','- 新增图片图注区分观测/摄影/数据显示/原创模型；17 个初始登记件加重绘 SCT 的 PNG/SVG，共 19 个新登记件，旧折射/牛顿图使用原登记。','- 新 ESO 图均打开实际发布页、下载官方 JPG、记录署名与 CC BY 4.0 政策；不是搜索缩略图。','- 有意义的数值按公式重新计算如下（不等于真实观测）：','','```json',json.dumps(numeric,ensure_ascii=False,indent=2),'```','','## 实际素材查看与修复','','已实际逐图使用 view_image 查看全部本批 12 组新图，以及复用的折射、牛顿光路；没有以文件存在代替看图。星等距离图的 100 pc 注释原与标题重叠，已移入图内并复看。旧 SCT 光路图右边缘拥挤，重绘为本地 v02 PNG/SVG，凸副镜朝主镜、中央孔、后焦点与传播箭头全部可见；曲率与距离简化，不能按图加工。','','|正文引用文件|实际解码尺寸|SHA-256|','|---|---|---|']
for name,size,h in photos:report.append(f'|`{name}`|{size[0]}×{size[1]}|`{h}`|')
report+=['','## 状态与边界','','|环节|状态|','|---|---|','|长文初稿|08、09、10 完成|','|独立来源核验|本批来源表的具体支持范围已核；Q23 原设备型号未因此解决|','|模型科学与素材视觉审读|已完成本批检查；根代理全课程整合另记|','|v0.2 导出与渲染|本子任务未执行，交根代理构建/视觉代理；不把 v0.1 PPT/PDF 当 v0.2|','|slides.md / handout.md / PPT|保持 v0.1，未同步；用户重点为长文和素材|','|人工审校|pending，没有真实审校者记录|','|真实试讲|pending，没有真实教学记录|','','未改共享 progress、README、SOURCES、ASSETS、构建工具、范例、旧 slides/handout/PPT 或原 PDF。旧 lesson 的备份由根代理已完成。没有当前阻止三篇长文阅读的局部阻塞。未来维护直接编辑 lesson.md，不重跑一次性 finish_batch_b.py 覆盖人工变化。']
(ROOT/'build/qa/v02-batch-B-report.md').write_text('\n'.join(report)+'\n',encoding='utf8')
print(json.dumps({'articles':summaries,'registered_new_assets':len(rows),'numerical_checks':numeric},ensure_ascii=False,indent=2))
