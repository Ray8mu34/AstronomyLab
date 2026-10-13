from pathlib import Path
import math,json,requests
import numpy as np
import matplotlib
matplotlib.use('Agg')
from matplotlib import pyplot as plt
from PIL import Image,ImageOps,ImageDraw

ROOT=Path(__file__).resolve().parents[3]
base=ROOT/'assets/15/v02'
mu=3.986e14; R=6371000.
h=np.linspace(0,36000,600)
v=np.sqrt(mu/(R+h*1000))/1000
r200=R+200000
ke=mu/(2*r200)/1e6; pe=mu*(1/R-1/r200)/1e6
plt.rcParams.update({'font.family':'Microsoft YaHei','svg.fonttype':'none','font.size':13})
fig,(ax,bx)=plt.subplots(1,2,figsize=(12.5,5.2),gridspec_kw={'width_ratios':[1.2,1]},layout='constrained')
ax.plot(h,v,color='#245d83',lw=2.8)
v200=math.sqrt(mu/r200)/1000
ax.scatter([200],[v200],color='#be5738',s=65,zorder=4)
ax.annotate(f'200 km: {v200:.2f} km/s',(200,v200),xytext=(7000,7.35),arrowprops={'arrowstyle':'->','color':'#be5738'})
ax.set(xlabel='距地表高度 (km)',ylabel='理想圆轨道速度 (km/s)',title='高度改变，入轨速度也改变',xlim=(0,36000),ylim=(2.5,8.5))
ax.grid(alpha=.2)
bars=bx.bar(['轨道动能','抬升的势能增量'],[ke,pe],color=['#245d83','#be5738'],width=.55)
bx.bar_label(bars,labels=[f'{ke:.1f}',f'{pe:.2f}'],padding=6,fontsize=15)
bx.set(ylabel='单位质量能量 (MJ/kg)',title='200 km圆轨道：两项状态能量',ylim=(0,36))
bx.grid(axis='y',alpha=.2);bx.set_axisbelow(True)
fig.suptitle('入轨不只是到达某个高度',fontsize=19)
fig.text(.50,-.035,'原创计算图｜球对称地球，忽略大气与自转；不含推进过程损失，不是实际火箭轨迹。',ha='center',fontsize=10)
fig.savefig(base/'orbit-energy.png',dpi=200,bbox_inches='tight',facecolor='white')
fig.savefig(base/'orbit-energy.svg',bbox_inches='tight',facecolor='white')
plt.close(fig)
(base/'orbit-energy-data.json').write_text(json.dumps({'earth_radius_m':R,'mu_m3_s2':mu,'circular_speed_at_200km_km_s':v200,'kinetic_energy_at_200km_MJ_kg':ke,'potential_increment_at_200km_MJ_kg':pe,'model':'spherical Earth, circular orbit, no atmosphere or rotation'},ensure_ascii=False,indent=2),encoding='utf-8')
url='https://assets.science.nasa.gov/dynamicimage/assets/science/psd/solar/2023/09/5/565736main_M162350671LE_full-1.jpg?crop=faces%2Cfocalpoint&fit=clip&h=986&w=2147'
res=requests.get(url,timeout=60);res.raise_for_status()
path=ROOT/'assets/16/v02/tycho-peak.jpg';path.write_bytes(res.content)
with Image.open(path) as im: im.load();print('tycho',im.size)
page=requests.get('https://www.eso.org/public/images/eso0226c/',timeout=60);page.raise_for_status()
import re
matches=re.findall(r'href="([^"]+)"[^>]*>Fullsize Original',page.text)
if not matches:
    matches=re.findall(r'href="([^"]*original[^\"]*eso0226c[^\"]*)"',page.text)
print('s2 fullsize candidates',matches)
for u in matches[:1]:
    if u.startswith('//'):u='https:'+u
    response=requests.get(u,timeout=60);response.raise_for_status()
    orig=ROOT/'assets/16/v02/s2-orbit-original.tif';orig.write_bytes(response.content)
    with Image.open(orig) as im:
        im.load(); print('s2 original',im.size)
        im.convert('RGB').save(ROOT/'assets/16/v02/s2-orbit.png')
files=[]
for n in (14,15,16):
    files.extend((ROOT/f'assets/{n}/v02').glob('*.jpg'))
    files.extend((ROOT/f'assets/{n}/v02').glob('*.png'))
    files.extend((ROOT/f'assets/{n}/v02').glob('*.gif'))
sheet=Image.new('RGB',(1200,math.ceil(len(files)/3)*345),'#fafafa');draw=ImageDraw.Draw(sheet)
for i,path in enumerate(files):
    with Image.open(path) as im:
        im.load();tile=ImageOps.contain(im.convert('RGB'),(390,305))
    x=(i%3)*400+5;y=(i//3)*345+5
    sheet.paste(tile,(x,y));draw.text((x,y+310),f'{path.parent.parent.name}/{path.name}',fill='black')
sheet.save(ROOT/'build/qa/v02-batch-D-contact.png')
