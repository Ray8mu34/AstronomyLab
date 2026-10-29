"""Circular orbit teaching figure; run with conda run -n dl_env python.

Recalculates the existing course/15 ideal circular orbit example. No flight
telemetry is used. Original assets/15/v02 files are left unchanged.
"""
from pathlib import Path
import json
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon, Rectangle

ROOT = Path(__file__).resolve().parent
plt.rcParams.update({'font.family': 'Microsoft YaHei', 'font.size': 12,
                     'axes.unicode_minus': False, 'svg.fonttype': 'path'})
mu = 3.986e14
earth_r = 6371e3
h = np.linspace(0, 36000e3, 400)
v = np.sqrt(mu / (earth_r + h)) / 1000
h0 = 200e3
r0 = earth_r + h0
v0 = np.sqrt(mu / r0)
energy = [v0**2 / 2 / 1e6, mu * (1/earth_r - 1/r0) / 1e6]
fig, ax = plt.subplots(1, 2, figsize=(12, 4.6), layout='constrained')
ax[0].plot(h/1000, v, color='#245d7b', lw=2.8)
ax[0].plot([200], [v0/1000], 'o', color='#b65035')
ax[0].annotate(f'200 km：{v0/1000:.2f} km/s', (200, v0/1000),
               (5000, 7.6), arrowprops={'arrowstyle': '->', 'color': '#b65035'})
ax[0].set(xlabel='距地表高度（km）', ylabel='圆轨道速度（km/s）',
          xlim=(0,36000), ylim=(2.5,8.5))
bars = ax[1].bar(['轨道动能', '抬升的势能增量'], energy,
                 color=['#245d7b', '#b65035'], width=.52)
ax[1].bar_label(bars, labels=[f'{energy[0]:.1f}', f'{energy[1]:.2f}'],
                padding=6, fontsize=15)
ax[1].set(ylabel='单位质量能量（MJ/kg）', ylim=(0,36))
for a in ax:
    a.spines[['top','right']].set_visible(False)
    a.grid(axis='y', color='#d8e0e5', alpha=.7)
    a.set_axisbelow(True)
fig.savefig(ROOT/'orbit-energy.png', dpi=180)
fig.savefig(ROOT/'orbit-energy.svg')
plt.close(fig)
values = {'model':'spherical Earth, circular orbit; no rotation or atmosphere',
          'mu_m3_s2':mu, 'earth_radius_m':earth_r, 'height_m':h0,
          'speed_m_s':float(v0), 'period_min':float(2*np.pi*r0/v0/60),
          'kinetic_MJ_kg':energy[0], 'potential_change_MJ_kg':energy[1]}
(ROOT/'orbit-energy-data.json').write_text(json.dumps(values, indent=2), encoding='utf-8')
print(json.dumps(values, indent=2))

# Momentum before/after an infinitesimal ejection, in the inertial frame in
# which the rocket is initially at rest. No nozzle pressure thrust is drawn.
fig, ax = plt.subplots(1, 2, figsize=(12, 3.5), layout='constrained')
def rocket(a, x, y):
    a.add_patch(Polygon([(x,y-.38),(x+1.65,y-.38),(x+2.1,y),
                         (x+1.65,y+.38),(x,y+.38)],
                        facecolor='#d7e6ec', edgecolor='#245d7b', lw=2))
    a.add_patch(Polygon([(x,y-.16),(x-.22,y-.27),(x-.22,y+.27),(x,y+.16)],
                       facecolor='#728f9d', edgecolor='#245d7b', lw=1.6))
for a in ax:
    a.set(xlim=(-.4,5.2), ylim=(-1.15,1.55), aspect='equal')
    a.axis('off')
rocket(ax[0], 1.6, 0)
ax[0].add_patch(Rectangle((1.65,-.16),.36,.32,color='#cc713f'))
ax[0].text(2.65,.66,r'$m$',ha='center',fontsize=18)
ax[0].text(2.65,-.82,r'$v=0$',ha='center',fontsize=16)
ax[0].text(2.65,1.2,'喷气前',ha='center',fontsize=15)
rocket(ax[1], 2.3, 0)
ax[1].add_patch(Rectangle((.95,-.16),.36,.32,color='#cc713f'))
ax[1].text(3.35,.66,r'$m-\delta m_p$',ha='center',fontsize=18)
ax[1].text(1.12,-.7,r'$\delta m_p$',ha='center',fontsize=17)
ax[1].annotate('',(5.02,0),(4.5,0),
               arrowprops={'arrowstyle':'-|>','color':'#245d7b','lw':2.5})
ax[1].text(4.7,.28,r'$\delta v$',ha='center',fontsize=17)
ax[1].annotate('',(-.18,0),(.89,0),
               arrowprops={'arrowstyle':'-|>','color':'#b65035','lw':2.5})
ax[1].text(.34,.28,r'$u_e-\delta v$',ha='center',fontsize=16)
ax[1].text(2.55,1.2,'喷气后',ha='center',fontsize=15)
fig.savefig(ROOT/'rocket-momentum.png',dpi=180)
fig.savefig(ROOT/'rocket-momentum.svg')
plt.close(fig)

# Blunt-body entry cross-section in the body rest frame: flow enters from
# the left, crosses a detached bow shock, then turns around the body.
# Geometry and arrow magnitudes are qualitative, not CFD values.
fig, a = plt.subplots(figsize=(11.5,5.2),layout='constrained')
a.set(xlim=(0,9.5),ylim=(-2.5,2.7),aspect='equal')
a.axis('off')
yy = np.linspace(-2.25,2.25,250)
shockx = 2.72+.64*yy**2
yhot = np.linspace(-1.6,1.6,250)
xshockhot = 2.72+.64*yhot**2
xbody = 5.5-1.1*np.sqrt(np.maximum(0,1-(yhot/1.6)**2))
a.fill_betweenx(yhot,xshockhot,xbody,color='#f7d5b1',alpha=.8)
a.plot(shockx,yy,color='#b65035',lw=2.4)
theta=np.linspace(np.pi/2,3*np.pi/2,100)
nosex=5.5+1.1*np.cos(theta)
nosey=1.6*np.sin(theta)
outer=np.vstack([np.column_stack([nosex,nosey]),[[8.8,-1.6],[8.8,1.6]]])
a.add_patch(Polygon(outer,closed=True,facecolor='#d2e4ea',edgecolor='#245d7b',lw=2))
innerx=5.58+.94*np.cos(theta)
innery=1.42*np.sin(theta)
inner=np.vstack([np.column_stack([innerx,innery]),[[8.8,-1.42],[8.8,1.42]]])
a.add_patch(Polygon(inner,closed=True,facecolor='#f6f8f8',edgecolor='#688c9c',lw=1))
for sy in [-1.5,-.75,0,.75,1.5]:
    a.annotate('',(1.75,sy),(.28,sy),
               arrowprops={'arrowstyle':'-|>','color':'#245d7b','lw':1.7})
a.text(.95,2.05,'相对来流',ha='center',fontsize=14)
a.text(.95,1.75,r'$v$',ha='center',fontsize=16)
a.annotate('弓形激波',(3.18,.86),(2.0,1.88),fontsize=14,
           arrowprops={'arrowstyle':'-','color':'#b65035'})
a.text(3.53,-.83,'高温气体层',ha='center',fontsize=13,rotation=90)
a.annotate('',(4.4,.08),(3.12,.08),
           arrowprops={'arrowstyle':'-|>','color':'#b65035','lw':2.3})
a.text(3.6,.36,'对流与辐射',ha='center',fontsize=12)
a.annotate('',(3.75,2.25),(5.5-1.1*np.sqrt(1-(1.04/1.6)**2),1.04),
           arrowprops={'arrowstyle':'-|>','color':'#ba8a2e','lw':2.1})
a.text(4.23,2.33,'再辐射',ha='center',fontsize=13,color='#825c14')
a.annotate('',(6.32,-.28),(4.42,-.28),
           arrowprops={'arrowstyle':'-|>','color':'#b65035','lw':1.6})
a.text(5.68,-.64,'向内传导',ha='center',fontsize=13)
a.annotate('热防护层',(6.45,1.51),(6.1,2.15),fontsize=14,
           arrowprops={'arrowstyle':'-','color':'#245d7b'})
a.text(7.3,.55,'内部结构',ha='center',fontsize=15,color='#245d7b')
fig.savefig(ROOT/'entry-heat-transfer.png',dpi=180)
fig.savefig(ROOT/'entry-heat-transfer.svg')
plt.close(fig)
