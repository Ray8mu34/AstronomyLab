from pathlib import Path
import json,re,csv
root=Path.cwd();data=json.loads((root/'assets/13/v02/source-records.json').read_text(encoding='utf-8-sig'))
lessons={}
for n,slug in [(11,'stellar-evolution'),(12,'gravity-and-supernovae'),(13,'galaxies-and-cmb')]:
 lessons[n]=(root/f'course/{n}-{slug}/lesson.md').read_text(encoding='utf-8')
parts=['# 第 11—13 讲 v0.2 来源与素材核验\n','核验日期：2026-10-02—03。本表记录实际打开的机构说明、教材相关正文、论文摘要/段落及图源页面；不把打开网页等同整篇科学复核通过。教学推导独立写作，数值估算另行复算。人工审校与真实试讲均 pending。\n']
for r in data['sources']:
 parts += [f'<a id="{r["id"].lower()}"></a>\n',f'## {r["id"]}｜{r["title"]}\n',f'作者/机构：{r["author"]}。\n']
 for i,url in enumerate(r['urls'],1): parts.append(f'[原始来源 {i}]({url})。\n')
 parts += [f'支持范围：{r["support"]}\n',f'核验边界：{r["limits"]}\n']
rows=[]
rights={'Hubble':'https://esahubble.org/copyright/','ESO':'https://www.eso.org/public/outreach/copyright/','ESA':'https://www.esa.int/ESA_Multimedia/Terms_and_conditions_of_use_of_images_and_videos_available_on_the_esa_website','NASA':'https://www.nasa.gov/nasa-brand-center/images-and-media/'}
for id,path,title,page,lic,scope in data['images']:
 n=int(id[1:3]);cap=next(t for t in lessons[n].splitlines() if '图源 '+id in t or '数据与处理 '+id in t or '图源 ['+id in t)
 credit=cap.split('Credit: ',1)[1].split('；CC')[0].split('. CC')[0].split('；ESA')[0] if 'Credit: ' in cap else 'NASA/LAMBDA; Fixsen et al. 1996; Fixsen & Mather 2002; chart redrawn by course editors'
 if id=='C11-I2': credit='ESA/Gaia/DPAC; Acknowledgement: Gaia Data Processing and Analysis Consortium (DPAC); Carine Babusiaux (IPAG / Université Grenoble Alpes, GEPI / Observatoire de Paris, France)'
 if id=='C13-I1': credit='ESA/Gaia/DPAC; Acknowledgement: A. Moitinho'
 if id=='C13-I4':credit='ESA and the Planck Collaboration'
 owner='Hubble' if 'esahubble' in page else 'ESO' if 'eso.org' in page else 'NASA' if 'gsfc.nasa' in page else 'ESA'
 parts += [f'<a id="{id.lower()}"></a>\n',f'## {id}｜{title}\n',f'[图源页面]({page})；[本地文件]({path.removeprefix("assets/")})。\n',f'Credit: {credit}。\n',f'表示方式与支持范围：{scope}\n',f'许可：{lic}；[机构使用条件]({rights[owner]})；实际已读图源及条件，无商业许可承诺。\n','文件已实际下载、解码并观看；除数据重绘外不改发布图。\n']
 rows.append([id,path,title,page,owner,credit,lic,'2026-10-02/03','FIRAS 数据重绘，原表与 Python 源保留' if id=='C13-I3' else '无本地图像改动；课程页面按宽度显示','科学数据重绘' if id=='C13-I3' else '观测数据图' if id in ('C11-I2','C13-I1','C13-I4') else '观测合成/重建图',f'L{n}','internal-draft'])
base=next(r for r in rows if r[0]=='C13-I3')
for suf,path,kind in [('data','assets/13/v02/firas_monopole_spec_v1.txt','科学数据发布表'),('svg','assets/13/v02/firas-spectrum.svg','科学数据重绘矢量图'),('code','assets/13/v02/plot_firas.py','重绘源代码')]:
 r=base.copy();r[0]+='-'+suf;r[1]=path;r[9]=kind;rows.append(r)
parts += ['## FIRAS 数据处理的可复现记录\n','[发布数据表](13/v02/firas_monopole_spec_v1.txt)、[绘图源](13/v02/plot_firas.py)、[SVG](13/v02/firas-spectrum.svg)。表的第 1 列 cm^-1 乘 29.9792458 成 GHz；第 2 列 MJy/sr 为 2.725 K 黑体加第 3 列残差构成的产品；残差及第 4 列 1σ 误差单位 kJy/sr。图保持此误差与量纲，未重新拟合温度或删去离群点。\n','[下载记录及 SHA256](11/v02/download-record.json)、[下载源](11/v02/acquire_materials.py)。复用蟹状星云原文件，图源与波段重新核对。\n']
(root/'assets/v02-batch-C-SOURCES.md').write_text('\n'.join(parts),encoding='utf-8')
with (root/'assets/v02-batch-C-ASSETS.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.writer(f);w.writerow('asset_id,local_path,title,source_page,creator,credit,permission_or_license,permission_checked_at,modifications,representation_type,used_by,release_status'.split(','));w.writerows(rows)
print('Source anchors:',len(data['sources'])+len(data['images']),'Asset records:',len(rows))
