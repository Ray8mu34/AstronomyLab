"""Two spherical circular-orbit models; illustrative calculations, not fitted data."""
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

OUT = Path(__file__).resolve().parent
plt.rcParams.update({'font.family': 'Microsoft YaHei', 'font.size': 12,
                     'axes.unicode_minus': False, 'svg.fonttype': 'none'})
radius = np.linspace(8, 24, 250)
v0, r0 = 220., 8.
G = 4.30091727003628e-6  # kpc (km/s)^2 / solar mass
m0 = v0**2 * r0 / G
fig, axes = plt.subplots(1, 2, figsize=(11.5, 4.7))
colors = ['#1d6b92', '#bb6237']
axes[0].plot(radius, np.full_like(radius, v0), color=colors[0], lw=2.8,
             label=r'$v=220$ km/s')
axes[0].plot(radius, v0*np.sqrt(r0/radius), color=colors[1], lw=2.8,
             label=r'$M(<R)=M_0$')
axes[1].plot(radius, m0*(radius/r0)/1e11, color=colors[0], lw=2.8,
             label=r'$M(<R)\propto R$')
axes[1].plot(radius, np.full_like(radius, m0)/1e11, color=colors[1], lw=2.8,
             label=r'$M(<R)=M_0$')
axes[0].set(ylabel='圆轨道速度（km/s）', ylim=(100, 245))
axes[1].set(ylabel=r'半径内质量（$10^{11}$ 太阳质量）', ylim=(0, 3))
for ax in axes:
    ax.set(xlabel='距中心的半径 R（kpc）', xlim=(8,24), xticks=[8,12,16,20,24])
    ax.grid(alpha=.2)
    ax.legend(loc='best', frameon=False, fontsize=10)
    ax.spines[['top','right']].set_visible(False)
fig.tight_layout()
for ext in ['png','svg']:
    fig.savefig(OUT/f'rotation-mass-models.{ext}', dpi=180, facecolor='white')
print(f'M(8 kpc) = {m0:.6g} solar masses')
print(f'P(8 kpc,220 km/s) = {2*np.pi*8*3.085677581491367e16/220/(365.25*86400)/1e6:.3f} Myr')
