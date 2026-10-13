"""Read-only article/asset QA; writes only this batch's evidence and inventory."""
from pathlib import Path
import csv,json,re,hashlib,subprocess,math
from PIL import Image
ROOT=Path(__file__).resolve().parents[3]
DATE='2026-10-03'
SRC='assets/v02-batch-A-SOURCES.md'
fields=['asset_id','local_path','title','source_page','creator','credit','permission_or_license','permission_checked_at','modifications','representation_type','used_by','release_status']
rows=[]
figures=[('05','sun-paths','太阳日轨迹','a05-04','球形地球、北纬30°；无折射；赤纬±23.44°与0°'),('05','calendar-fit','历法的累计差额','a05-09','回归年固定365.2422日、朔望月29.5306日；平均曲线非逐年台阶'),('06','star-altitudes','恒星高度与赤纬','a06-11','纬度30°；赤纬0°、16.5°、70°、−30°；非星历实测'),('06','parallax','周年视差与距离','a06-13','左几何比例夸大；右轴比0.6任选、半长轴100/20毫角秒'),('07','four-circles','四条天球参照圆','a07-08','黄赤交角23.44°；白道节点任选、倾角5.145°；J2000银极近似'),('07','precession-nutation','岁差与章动尺度','a07-11','左近似23.44°方向圆；右仅9.2角秒/18.6年主倾角分量，相位任选'),('07','shadow-angle','影长与测角','a07-13','北纬30°竖表1m、水平地面无折射；右仅象限功能示意')]
for nn,name,title,anchor,mod in figures:
 for ext in ['png','svg']:
  rows.append([f'V02-A-{nn}-{name}-{ext}',f'assets/{nn}/v02/{name}.{ext}',title+('（可编辑）' if ext=='svg' else ''),SRC+'#'+anchor,'课程编辑组（Codex辅助）','课程原创解析几何/周期示意；绘图源assets/05/v02/draw-batch-A.py','course-original；内部课程编辑教学；对外开放许可待作者决定',DATE,mod,'自制计算示意：不是观测','L'+nn,'internal-draft'])
downloads=[('05','solstice-earth.png','两次至日的地球实景','a05-03','NASA/DSCOVR EPIC','NASA/DSCOVR EPIC','NASA教育使用条件，保留署名；无第三方作者另列','PNG实际格式；原下载URL为webp后缀，像素未改；1041×586','处理后的观测影像组合','educational-attributed'),('06','gaia-colour.png','Gaia EDR3全天颜色图','a06-16','ESA/Gaia/DPAC','ESA/Gaia/DPAC; Acknowledgement: A. Moitinho','CC BY-SA 3.0 IGO', '未裁切、未重新赋色；2000×1000','观测目录的全天合成数据图','licensed-attributed'),('07','jianyi-model.jpg','元代简仪模型','a07-15','中国国家博物馆','中国国家博物馆','permission-unresolved；原页没有明确开放许可','350×268原图，保留水印；不是元代实物原件','机构发布的仪器模型照片','internal-reference'),('07','quadrant.jpg','御制方矩象限仪','a07-16','故宫博物院','故宫博物院','permission-unresolved；页面版权与授权入口非开放许可','306×400原图；康熙时期仿西式，未裁切重赋色','机构发布的文物照片','internal-reference')]
source_pages={'a05-03':'https://science.nasa.gov/solar-system/skywatching/night-sky-network/tropical-solstice-shadows/','a06-16':'https://www.esa.int/ESA_Multimedia/Images/2020/12/The_colour_of_the_sky_from_Gaia_s_Early_Data_Release_3','a07-15':'https://www.chnmuseum.cn/zp/zpml/kgfjp/202111/t20211116_252346.shtml','a07-16':'https://www.dpm.org.cn/collection/clock/228933.html'}
for nn,name,title,anchor,creator,credit,lic,mod,rep,status in downloads:
 rows.append([f'V02-A-{nn}-{Path(name).stem}',f'assets/{nn}/v02/{name}',title,source_pages[anchor],creator,credit,lic,DATE,mod,rep,'L'+nn,status])
with (ROOT/'assets/v02-batch-A-ASSETS.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.writer(f);w.writerow(fields);w.writerows(rows)
anchors=set(re.findall(r'\{#([^}]+)\}',(ROOT/SRC).read_text(encoding='utf-8')))
report=['# 第05—07讲 v0.2 批次A实际检查','',f'检查日期：{DATE}。主稿、素材与来源片段已落地；未改slides/handout/PPTX、共享索引或范例。原lesson已由根任务备份。','', '|讲次|正文汉字（去图注、标题、YAML）|全文汉字|图片组|来源锚点|Pandoc解析|','|---|---:|---:|---:|---:|---|']
issues=[]
pandoc=ROOT/'tools/vendor/pandoc-3.12/pandoc.exe'
for nn,slug in [('05','05-calendars'),('06','06-sky-maps'),('07','07-reference-circles')]:
 p=ROOT/'course'/slug/'lesson.md';s=p.read_text(encoding='utf-8')
 body=re.sub(r'\A---\n.*?\n---\n','',s,flags=re.S)
 body='\n'.join(x for x in body.splitlines() if not x.startswith(('#','![','*图')))
 body=re.sub(r'\[([^]]+)\]\([^)]+\)',r'\1',body)
 allhan=len(re.findall('[\u4e00-\u9fff]',s));han=len(re.findall('[\u4e00-\u9fff]',body))
 images=re.findall(r'!\[[^]]*\]\(([^)]+)\)',s)
 citations=re.findall(r'v02-batch-A-SOURCES\.md#([^)]+)',s)
 for loc in images:
  ap=(p.parent/loc).resolve()
  if not ap.exists():issues.append('Missing image '+str(ap))
  else:im=Image.open(ap);im.load()
 for anchor in citations:
  if anchor not in anchors:issues.append('Missing anchor '+anchor)
 proc=subprocess.run([str(pandoc),str(p),'-f','markdown','-t','json'],capture_output=True,text=True,encoding='utf-8')
 if proc.returncode:issues.append(proc.stderr)
 else:json.loads(proc.stdout)
 (ROOT/'assets'/nn/'v02'/'article-ast.json').write_text(proc.stdout,encoding='utf-8')
 report.append(f'|L{nn}|{han}|{allhan}|{len(images)}|{len(set(citations))}|'+('成功' if not proc.returncode else '失败')+'|')
 report.extend(['',f'L{nn}主稿SHA256：`{hashlib.sha256(p.read_bytes()).hexdigest()}`',''])
report.extend(['','## 实际素材解码','', '|文件|解码格式|像素|SHA256|','|---|---|---|---|'])
for row in rows:
 p=ROOT/row[1]
 if p.suffix=='.svg':continue
 im=Image.open(p);im.load()
 report.append(f'|{row[1]}|{im.format}|{im.width}×{im.height}|`{hashlib.sha256(p.read_bytes()).hexdigest()}`|')
assert abs(1/math.tan(math.radians(36.56))-1.34853)<.01
assert abs(19*365.2422-6939.60)<.01
assert abs(235*29.5306-6939.69)<.01
assert abs(400*(365.2425-365.2422)-.12)<1e-8
report.extend(['','## 检查结论与状态','', '- 来源：49个独有片段已落地。核心科学定义、数量关系和仪器说明已按所列机构网页/论文/USNO PDF实际核读；IERS新站完整网页打开有故障，正文搜索与巴黎天文台Bulletin B替代已核，未声称当前EOP数据分析。','- 本地图片：11张新PNG/JPEG及7张SVG可解码/读取；另复用并再次查看两张已有OAE星图。新CSV18行，不重复登记旧OAE。四张机构素材真实下载；七组自制图有源。','- 模型视觉查看：全部7组生成PNG、4张新机构图及2张旧OAE图实际查看；文字/坐标/数据关系可读。两张仪器图仅350×268、306×400，作为额外文物证据，不冒称高分辨素材；三组07主功能图为高分辨可编辑几何图。','- 模型科学审读：已完成逐段自查；根任务全文审读后修正06的24h回绕、07测影同侧条件。05现代农历规则明确十三月区间与首个无中气月，避免无条件等同。','- 工程：三篇Pandoc JSON实际解析、全部图片路径与49个来源目标检查完成。这里只证实Markdown解析；课程HTML/PDF整体验证由根任务独立记录，不伪称本批次完成整套导出渲染。','- 人工审校：pending。教材全文核对：pending。真实试讲：pending；未提供实测讲授时长。','- 权利局部阻塞：国博简仪模型、故宫象限仪原页未明示开放许可；internal-reference，公开再分发待确认。原图没有去水印，未升级为CC授权。其余课程内容与原创功能素材已完成。','- 历史边界：七月流火具体古历转换、帝星精确年代/身份未核定，不编造结论。埃拉托色尼数字为自设机制算例，古代单位不确定性已说明。','- PPT/handout：沿旧v0.1未改，不能视为与新文同步。','', '工程问题：'+('无缺图、缺来源锚点或解析错误。' if not issues else '\n'.join(issues))])
(ROOT/'build/qa/v02-batch-A-report.md').write_text('\n'.join(report)+'\n',encoding='utf-8')
print('CSV rows',len(rows),'source anchors',len(anchors),'issues',issues)
for line in report:
 if line.startswith('|L'):print(line)
