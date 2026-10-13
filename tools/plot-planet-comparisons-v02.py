from pathlib import Path
import csv, json
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
ROOT=Path(__file__).resolve().parents[1]
rows=list(csv.DictReader((ROOT/'assets/shared/v02/planet_parameters.csv').open(encoding='utf-8-sig')))
earth=rows[2]
r=np.array([float(x['volume_equivalent_mean_radius_km']) for x in rows]);m=np.array([float(x['mass_10^24_kg']) for x in rows]);d=np.array([float(x['bulk_density_g_cm3']) for x in rows])
plt.rcParams.update({'font.family':'Microsoft YaHei','font.size':12,'axes.spines.top':False,'axes.spines.right':False})
fig,axs=plt.subplots(1,3,figsize=(15,6),layout='constrained')
names=[x['名称'] for x in rows]; colors=['#ba6b35']*4+['#257d9e']*4
for ax,val,title,log in zip(axs,[r/r[2],m/m[2],d],['体积等效平均半径 / 地球','质量 / 地球','平均密度 / (g/cm³)'],[True,True,False]):
 y=np.arange(8);ax.barh(y,val,color=colors,height=.6);ax.set_yticks(y,names);ax.invert_yaxis();ax.set_xlabel(title)
 if log:ax.set_xscale('log');ax.set_xlim(min(val)*.6,max(val)*2)
 else:ax.set_xlim(0,max(val)*1.22)
 for yi,v in zip(y,val):ax.text(v*1.08 if log else v+.08,yi,f'{v:.3g}',va='center',fontsize=10)
 ax.grid(axis='x',alpha=.15)
fig.suptitle('“大”有三种不同的含义：半径、质量与平均密度',fontsize=19)
fig.text(.5,-.035,'数据：JPL Solar System Dynamics · 半径与质量为地球归一化；前两图为对数横轴，柱长不能当线性比例。',ha='center',fontsize=10)
out=ROOT/'assets/02/v02/planet-properties';fig.savefig(out.with_suffix('.png'),dpi=180,bbox_inches='tight');fig.savefig(out.with_suffix('.svg'),bbox_inches='tight')
print(json.dumps({'jupiter_volume_ratio':float((r[4]/r[2])**3),'source':'https://ssd.jpl.nasa.gov/planets/phys_par.html','outputs':[str(out.with_suffix('.png')),str(out.with_suffix('.svg'))]},ensure_ascii=False))
