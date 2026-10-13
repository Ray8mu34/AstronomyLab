"""Record the root's actual session review; run after reading all source articles
and inspecting all sixteen browser screenshot sheets. Not an automatic science
grader. Hash validation prevents this attestation from following changed prose.
"""
from pathlib import Path
from datetime import datetime, timezone
import json, hashlib

root=Path(__file__).resolve().parents[1]
qa=json.loads((root/'build/qa/v02-article-qa.json').read_text(encoding='utf-8'))
render=json.loads((root/'build/qa/v02-article-render.json').read_text(encoding='utf-8'))
render_by={r['id']:r for r in render['records']}
hashfile=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
scope=[
 '形成、共振、轨道与分类，机构图的显示与统计年代',
 '体积等效半径、质量和密度、结构及大气比较',
 '月相与多个周期、同步自转、地照和天平动',
 '食、凌星与冲日几何，角直径与轨道条件',
 '季节几何、不同日与年、置闰、中气与文化日期边界',
 '方向与投影、回绕时角、周年视差与三维运动',
 '四种参考圆、岁差章动、测影与真实仪器源流',
 '空气柱、背景与计数涨落、视宁、暗适应与观测条件',
 '焦平面与光路、出瞳、衍射/视宁、采样与主动/自适应校正',
 '星等/消光、黑体和色指数、谱线物态、分辨本领与速度精度',
 '维里与供能、结构反馈、群体检验、简并与多种末期',
 '视界和阴影、潮汐、中微子机制、Ia多通道与标准化距离',
 '银河地图和旋转、宇宙学距离、FIRAS平均谱与CMB各向异性',
 '物理对象和角尺度、CCD校准、噪声、asinh显示与SHO编码',
 '轨道与火箭质量预算、着陆/复飞/成本证据、凌星解释链',
 '测影、激光、Kepler质量、S2、距离阶梯与传播历史的连续论证',
]
notes={1:'部分Pro引用的范围超出原页，补证和未闭合项见Pro来源校准表。',
2:'部分内部结构主张属于模型推断，Pro原表的partial范围保留。',
3:'近远面合图有第三方署名，公开再分发许可待确认；部分原引用有补证。',
4:'假阳性已补读原机构页；不继承原卷原图的许可通过。',
5:'七月流火的具体古历/史源与帝星身份待人工史源审校。',
6:'严格运动群成员判定不是本次独立目录再分析。',
7:'两张文物图低清且开放许可未明；IERS新站实时打开局部受阻。',
15:'新闻截止2026-10-02，年度型号穷尽与原题回收口径保持partial。'}
records=[]
for q in qa['articles']:
    n=int(q['lesson'][1:]); r=render_by[q['lesson']]
    assert q['engineering_status']=='passed',q['lesson']
    assert q['source_sha256']==hashfile(root/q['source'])==r['source_sha256'],q['lesson']+' changed prose'
    assert q['html']['sha256']==hashfile(root/q['html']['file'])==r['html_sha256'],q['lesson']+' changed HTML'
    assert r['state']=='rendered' and not r['errors'],q['lesson']
    assert (root/f'build/qa/v02-contact/L{n:02}.jpg').exists()
    records.append({'id':q['lesson'],'source_sha256':q['source_sha256'],'html_sha256':r['html_sha256'],
        'source_checked':'checked_with_limits（主要主张已核；具体未核项见分讲报告）',
        'science_review':'full_text_model_read_and_incremental_recheck_completed',
        'review_scope':scope[n-1],
        'model_visual_review':'checked_views_passed（开篇、首公式及全部图版上下文）',
        'screenshots_inspected':r['screenshots'],
        'visual_method':'root viewed actual browser screenshot contact sheet; L02/L12/L15 formula frames additionally viewed at full size',
        'visual_limits':'1200px desktop viewport; screenshot contexts checked, not every paragraph at pixel level; mobile/print PDF/Office layout not reviewed',
        'remaining_limits':notes.get(n,'选定主要来源实际查读；摘要/相关段不升级为论文全文或原始数据再分析。'),
        'human_review':'pending','classroom_trial':'pending','textbook_comparison':'pending'})
payload={'checked_at_utc':datetime.now(timezone.utc).isoformat(),'reviewer':'root model, actual reading and screenshot inspection',
 'records':records,'article_count':16,'han_body_total':sum(q['counts']['han_body'] for q in qa['articles']),
 'image_placements':sum(len(r['layout']['images']) for r in render['records']),
 'mathml_elements':sum(r['layout']['mathCount'] for r in render['records']),
 'actual_browser_screenshots':sum(len(r['screenshots']) for r in render['records']),
 'human_review':'pending','classroom_trial':'pending','print_pdf_export':'not_performed_v02','ppt_export':'v01_historical_not_synchronized'}
(root/'build/qa/v02-root-review.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
md=['# v0.2 全课程根代理整合审读','',f"记录时间：{payload['checked_at_utc']}。审读者为模型，不是人工审校。",'',
 '01—04采用用户Pro长文；原范例文件未改。05—16从原题知识点展开完整文章，根代理逐篇全文读取，并复读各作者最终增补及已修问题；全部作者来源片段和检查报告实际读取。独立审读报告提供另一轮科学与图注核对，未把作者声明自动当成所有引用逐字独立复核。','',
 f"工程实际结果：16篇、主体约{payload['han_body_total']}汉字（含标题；图注与来源另计），{payload['image_placements']}处本地图引用，{payload['mathml_elements']}个MathML公式。Pandoc实际转换、离线本地链接/锚点、图片解码检查通过。",'',
 f"安装的Microsoft Edge实际渲染16篇，生成{payload['actual_browser_screenshots']}张截图。根代理实际查看16张逐篇联系图中的全部截图上下文，另全尺寸查看02/12/15首公式截图；没有破图、横向溢出或本次检查视图中的显著裁字/重叠。该结论限1200px桌面视口和所检视图，不声称全部段落逐像素、人类校对、手机或打印版式通过。",'',
 'HTML仅使用本地CSS及MathML，不依赖在线MathJax。Pro旧式TeX字体命令与相邻数字引文的方括号仅在派生AST中归一，原Markdown正文未改写。','',
 '## 已落实并复读的关键校准','',
 '- 06：时角按24小时回绕，跨零点例子实际修复。',
 '- 07：两地高度差需太阳在天顶同侧，否则比较带方向天顶距。',
 '- 08、10：行星有限角面与肉眼分辨消歧；1 AU视差角与B/V通带定义准确。',
 '- 12：光度距离的全波段定义及固定滤镜K校正已补明。',
 '- 14：asinh显示引用改为实际支持该方法的Lupton原论文。',
 '- 15：NASA图的full/empty符号与正文初/末质量对照；分级的初末质量范围修复。',
 '- 16：半年2p限定最大位移基线；结尾倒转语义已修。','',
 '## 分讲范围与保留项','',
 '|讲次|实际内容审读范围|仍需保留的限制|','|---|---|---|']
md += [f"|{r['id']}|{r['review_scope']}|{r['remaining_limits']}|" for r in records]
md += ['', '## 分开记录的后续状态','',
 '主要科学主张与图源已经实际核对；所有来源支持范围、访问失败、只读摘要及授权限制保留在各片段与独立报告，未宣布全部史源/原题设备/原图追溯通过。人工科学及文史审校、真实试讲、《今日天文》全文对照均pending。v0.2 HTML已实际生成与检查；未导出v0.2整篇PDF/PPT，旧v0.1 Office/PDF记录只是历史。','',
 '版本绑定见同名JSON；之后正文或HTML变化不能继续沿用这次检查状态。']
(root/'build/qa/v02-root-review.md').write_text('\n'.join(md)+'\n',encoding='utf-8')
print(json.dumps({k:payload[k] for k in ('article_count','han_body_total','image_placements','mathml_elements','actual_browser_screenshots')},ensure_ascii=False))
