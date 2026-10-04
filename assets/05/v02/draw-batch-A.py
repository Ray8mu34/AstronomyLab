"""Original physical/data diagrams; no AI observations. Run in Conda dl_env.
Sources and assumptions: assets/v02-batch-A-SOURCES.md.
Earth spherical, latitude=30 deg, obliquity=23.44 deg. No refraction.
White-circle node longitude=0 chosen for explanation, not real ephemeris.
"""
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.font_manager import FontProperties
ROOT=Path(__file__).resolve().parents[3]
plt.rcParams.update({'font.family':'Microsoft YaHei','font.size':13,'axes.unicode_minus':False,'svg.fonttype':'none'})
def save(fig,nn,name):
 p=ROOT/'assets'/nn/'v02';p.mkdir(parents=True,exist_ok=True)
 fig.savefig(p/(name+'.png'),dpi=180,bbox_inches='tight',facecolor='white')
 fig.savefig(p/(name+'.svg'),bbox_inches='tight',facecolor='white');plt.close(fig)
def alt(phi,delta,H):
 return np.rad2deg(np.arcsin(np.sin(np.deg2rad(phi))*np.sin(np.deg2rad(delta))+np.cos(np.deg2rad(phi))*np.cos(np.deg2rad(delta))*np.cos(np.deg2rad(H))))
H=np.linspace(-180,180,721)
fig,ax=plt.subplots(figsize=(12,6))
for delta,label,col in [(23.44,'北半球夏至：δ = +23.44°','#c76c19'),(0,'春秋分：δ = 0°','#477755'),(-23.44,'北半球冬至：δ = −23.44°','#3272ab')]:
 a=alt(30,delta,H);ax.plot(H/15,a,color=col,lw=3,label=label)
ax.axhline(0,color='#444',lw=1.4);ax.set(xlim=(-12,12),ylim=(-90,90),xlabel='相对地方真太阳正午的时角 / 15°（小时）',ylabel='太阳几何高度（度）',title='北纬30°：同一地点的三条太阳日轨迹')
ax.legend(loc='lower center');ax.grid(alpha=.18);save(fig,'05','sun-paths')
fig,axs=plt.subplots(1,2,figsize=(14,5.4))
y=np.arange(0,401)
for yr,label,col in [(365,'每年365日','#c45043'),(365.25,'儒略历平均365.25日','#347bac'),(365.2425,'格里高利历平均365.2425日','#398758')]:axs[0].plot(y,y*(yr-365.2422),lw=2.5,label=label,color=col)
axs[0].set(xlabel='从同一起点累计的年数',ylabel='累计日数差：历年 − 季节年（日）',title='太阳历：小差额的长期累积');axs[0].legend(fontsize=10);axs[0].grid(alpha=.2)
y=np.arange(0,20)
axs[1].plot(y,y*365.2422,label='19个季节年',lw=3,color='#398758')
axs[1].plot(y,y*12*29.5306,label='每年12个朔望月',lw=2,color='#c45043')
axs[1].scatter([19],[235*29.5306],marker='*',s=160,color='#347bac',label='235个月：增加7个月')
axs[1].set(xlabel='季节年数',ylabel='从起点累计的日数',title='阴阳合历：19年与235月接近重合');axs[1].legend(fontsize=10);axs[1].grid(alpha=.2)
fig.suptitle('历法是离散安排对连续自然周期的近似',fontsize=17);save(fig,'05','calendar-fit')
fig,ax=plt.subplots(figsize=(12,6))
for delta,label,col in [(0,'天赤道上的星：δ = 0°','#347bac'),(16.5,'毕宿五近似：δ = +16.5°','#c76c19'),(70,'北天区的星：δ = +70°','#815299'),(-30,'南天区的星：δ = −30°','#398758')]:ax.plot(H/15,alt(30,delta,H),lw=2.6,label=label,color=col)
ax.axhline(0,color='#444',lw=1.4);ax.set(xlim=(-12,12),ylim=(-90,90),xlabel='时角 H / 15°（小时）；0 为上中天',ylabel='几何高度（度）',title='北纬30°：赤纬决定一颗星能否升起、升到多高')
ax.grid(alpha=.18);ax.legend(loc='lower center');save(fig,'06','star-altitudes')
fig,axs=plt.subplots(1,2,figsize=(13,6))
ax=axs[0]
ax.scatter([-1,1],[0,0],s=100,c=['#347bac','#398758']);ax.scatter([0],[6],s=220,marker='*',c='#c76c19');ax.scatter([0],[0],s=110,c='#e4ae28')
ax.plot([-1,0,1],[0,6,0],color='#444');ax.plot([0,0],[0,6],color='#888',ls='--')
ax.text(-1.2,-.5,'观察位置1');ax.text(.5,-.5,'观察位置2');ax.text(.1,.15,'太阳');ax.text(.15,3,'距离 d');ax.text(.15,5.3,'p');ax.text(-.75,.3,'1 AU');ax.text(.1,6.25,'近星')
ax.set(xlim=(-2,2),ylim=(-.9,7),title='视差角 p：1 AU 在恒星处张开的角');ax.set_aspect('equal');ax.axis('off')
ax=axs[1];phase=np.linspace(0,2*np.pi,300)
for p,label,col in [(100,'10 pc：p=100毫角秒','#347bac'),(20,'50 pc：p=20毫角秒','#398758')]:ax.plot(p*np.cos(phase),.6*p*np.sin(phase),lw=2.5,label=label,color=col)
ax.set(xlabel='天空切平面横向位移（毫角秒）',ylabel='纵向位移（毫角秒）',title='示例周年视差椭圆：近星移动幅度更大');ax.legend(fontsize=11);ax.grid(alpha=.2);ax.set_aspect('equal')
fig.suptitle('恒星未必住在一起：给方向图增加距离',fontsize=17);save(fig,'06','parallax')
# Ecliptic (J2000 obliquity rounded), lunar illustrative plane, galactic
t=np.linspace(0,2*np.pi,1501)
def rx(a):
 c,s=np.cos(a),np.sin(a);return np.array([[1,0,0],[0,c,-s],[0,s,c]])
base=np.stack([np.cos(t),np.sin(t),np.zeros_like(t)])
e=rx(np.deg2rad(23.44))@base
m=rx(np.deg2rad(23.44))@rx(np.deg2rad(5.145))@base
# J2000 Galactic north pole approximation; FK5 values from Astropy official source.
ra,dec=np.deg2rad([192.85948,27.12825]);n=np.array([np.cos(dec)*np.cos(ra),np.cos(dec)*np.sin(ra),np.sin(dec)])
u=np.cross(n,[0,0,1]);u/=np.linalg.norm(u);v=np.cross(n,u);g=u[:,None]*np.cos(t)+v[:,None]*np.sin(t)
fig,ax=plt.subplots(figsize=(13,6))
for xyz,label,col,style in [(base,'天赤道','#347bac','-'),(e,'黄道','#c76c19','-'),(m,'白道（交点位置为示意）','#b84c67','--'),(g,'银道（J2000约定）','#398758','-')]:
 r=(np.rad2deg(np.arctan2(xyz[1],xyz[0]))%360)/15;d=np.rad2deg(np.arcsin(xyz[2]));ix=np.argsort(r);ax.plot(r[ix],d[ix],color=col,lw=2.3,ls=style,label=label)
ax.set(xlim=(24,0),ylim=(-90,90),xlabel='赤经（小时）；向左增加',ylabel='赤纬（度）',title='同一张赤道方向图中的四条大圆：弯曲来自投影')
ax.set_xticks(np.arange(0,25,3));ax.grid(alpha=.2);ax.legend(loc='lower center',ncol=2,fontsize=11)
save(fig,'07','four-circles')
fig,axs=plt.subplots(1,2,figsize=(13,6))
ax=axs[0];a=np.linspace(0,2*np.pi,361);r=23.44
ax.plot(r*np.cos(a),r*np.sin(a),lw=2.5,color='#347bac');ax.scatter([0],[0],s=70,c='#333')
ax.text(1,1,'北黄极');ax.scatter([r,0,-r],[0,r,0],s=80,c='#c76c19');ax.text(r+1,-1,'轴向A');ax.text(1,r+1,'轴向B');ax.text(-r-6,-1,'轴向C')
ax.set(xlim=(-32,32),ylim=(-32,32),xlabel='角方向示意（度）',ylabel='角方向示意（度）',title='近似岁差圆：半径约为黄赤交角');ax.set_aspect('equal');ax.grid(alpha=.15)
ax=axs[1];x=np.linspace(0,38,500);ax.plot(x,np.zeros_like(x),color='#888',lw=2,label='平滑背景方向')
ax.plot(x,9.2*np.cos(2*np.pi*x/18.6),color='#b84c67',lw=2.5,label='章动主要项的倾角分量示意')
ax.set(xlabel='示意时间（年）',ylabel='倾角小变化（角秒）',title='叠加的小摆动：与左图使用不同尺度');ax.legend(fontsize=11);ax.grid(alpha=.2)
fig.suptitle('轴向会改变：慢的岁差与较小的章动',fontsize=17);save(fig,'07','precession-nutation')
fig,axs=plt.subplots(1,2,figsize=(13,6))
ax=axs[0];height=1
for sunalt,label,col in [(36.56,'冬至：影长约1.35 m','#347bac'),(60,'春秋分：约0.58 m','#398758'),(83.44,'夏至：约0.12 m','#c76c19')]:
 length=height/np.tan(np.deg2rad(sunalt));ax.plot([0,length],[height,0],lw=2.3,color=col,label=label);ax.plot([0,length],[0,0],lw=5,color=col,alpha=.4)
ax.plot([0,0],[0,1],color='#444',lw=6);ax.axhline(0,color='#444');ax.set(xlim=(-.1,1.6),ylim=(-.1,1.3),xlabel='水平距离（m）',ylabel='高度（m）',title='北纬30°、表高1 m：正午影子的季节变化');ax.legend(fontsize=10);ax.set_aspect('equal');ax.grid(alpha=.15)
ax=axs[1];a=np.linspace(0,90,181);ax.plot(np.cos(np.deg2rad(a)),np.sin(np.deg2rad(a)),color='#444',lw=3)
for angle in [0,15,30,45,60,75,90]:
 rad=np.deg2rad(angle);ax.plot([.94*np.cos(rad),np.cos(rad)],[.94*np.sin(rad),np.sin(rad)],color='#444');ax.text(1.08*np.cos(rad),1.08*np.sin(rad),str(angle)+'°',ha='center',va='center')
ax.plot([0,1.1*np.cos(np.deg2rad(35))],[0,1.1*np.sin(np.deg2rad(35))],lw=3,color='#347bac');ax.plot([0,0,1],[1,0,0],color='#444',lw=2)
ax.set(xlim=(-.2,1.3),ylim=(-.2,1.3),title='象限测角原理：瞄准方向与基准的夹角');ax.axis('off');ax.set_aspect('equal')
save(fig,'07','shadow-angle')
print('Generated 7 PNG + 7 editable SVG figures')
