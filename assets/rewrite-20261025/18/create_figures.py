"""Analytic teaching figures for the M33 chapter, not measured M33 data.

Run: conda run -n dl_env python assets/rewrite-20261025/18/create_figures.py
"""
from pathlib import Path
import json
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import TwoSlopeNorm

ROOT = Path(__file__).resolve().parent
plt.rcParams.update({'font.family': 'Microsoft YaHei', 'font.size': 12,
                     'axes.unicode_minus': False, 'svg.fonttype': 'path'})
i = np.deg2rad(55)
vc = 120.
phi = np.linspace(0, 2*np.pi, 361)
x = np.cos(phi)
y = np.sin(phi)*np.cos(i)
vlos = vc*np.sin(i)*np.cos(phi)
fig, ax = plt.subplots(1, 2, figsize=(12, 4.8), layout='constrained')
norm = TwoSlopeNorm(vmin=-120, vcenter=0, vmax=120)
sc = ax[0].scatter(x, y, c=vlos, cmap='coolwarm', norm=norm, s=24)
ax[0].plot([-1.2, 1.2], [0, 0], '--', lw=.8, color='#64748b')
ax[0].plot([0, 0], [-.8, .8], '--', lw=.8, color='#64748b')
ax[0].plot(0,0,'o',color='#263b4c',markersize=5)
ax[0].set(xlabel='长轴方向 / 圆环半径', ylabel='短轴方向 / 圆环半径',
          xlim=(-1.35,1.35), ylim=(-.95,.95), aspect='equal')
cbar = fig.colorbar(sc, ax=ax[0], fraction=.045, pad=.03)
cbar.set_label(r'$v_{\rm los}-v_{\rm sys}$（km/s）')
ax[1].plot(np.rad2deg(phi), vlos, color='#245d7b', lw=2.8)
ax[1].axhline(0, color='#64748b', lw=.8)
ax[1].set(xlabel='盘面内方位角 φ（度）',
          ylabel='视向速度减去系统速度（km/s）',
          xlim=(0,360), ylim=(-125,125), xticks=[0,90,180,270,360])
for a in ax:
    a.spines[['top','right']].set_visible(False)
    a.grid(color='#d8e0e5', alpha=.55)
    a.set_axisbelow(True)
fig.savefig(ROOT/'projected-rotation.png', dpi=180)
fig.savefig(ROOT/'projected-rotation.svg')
plt.close(fig)

scale = np.linspace(.8, 1.2, 200)
fig, ax = plt.subplots(figsize=(8, 4.8), layout='constrained')
ax.plot(scale,scale, lw=2.8, color='#245d7b', label='长度、动力学质量')
ax.plot(scale,scale**2, lw=2.8, color='#b65035', label='光度')
ax.axvline(1, color='#b6c2cc', ls='--')
ax.axhline(1, color='#b6c2cc', ls='--')
ax.plot([1.1,1.1],[1.1,1.21],'o',color='#263b4c')
ax.set(xlabel='采用距离 / 基准距离', ylabel='推得物理量 / 基准值',
       xlim=(.8,1.2), ylim=(.62,1.49))
ax.spines[['top','right']].set_visible(False)
ax.grid(color='#d8e0e5', alpha=.55)
ax.legend(loc='lower right', frameon=False, fontsize=10)
fig.savefig(ROOT/'distance-dependence.png', dpi=180)
fig.savefig(ROOT/'distance-dependence.svg')
plt.close(fig)
values = {'rotation_model':{'thin_circular_ring':True, 'vc_km_s':vc,
           'inclination_deg':55., 'vlos_peak_km_s':float(vc*np.sin(i))},
          'distance_modulus':24.622,
          'distance_pc':float(10**((24.622+5)/5)),
          'adopted_distance_kpc':840.,
          'pc_per_arcsec':float(840e3*np.pi/(180*3600)),
          'field_width_kpc_68_01_arcmin':float(840*68.01*np.pi/(180*60)),
          'example_luminosity_W':float(4*np.pi*(840e3*3.085677581491367e16)**2*1e-15),
          'example_spherical_mass_Msun':120**2*15/4.301e-6,
          'example_orbit_period_yr':float(2*np.pi*(10e3*3.085677581491367e13)/120/(365.25*86400))}
(ROOT/'calculation-values.json').write_text(json.dumps(values, indent=2), encoding='utf-8')
print(json.dumps(values, indent=2))
