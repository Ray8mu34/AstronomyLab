"""Original 3:1 conjunction geometry; run with conda run -n dl_env python."""
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Circle

plt.rcParams.update({'font.sans-serif': ['Microsoft YaHei', 'SimHei'], 'axes.unicode_minus': False,
                     'svg.fonttype': 'none', 'font.size': 12})
out = Path(__file__).resolve().parent
fig, axes = plt.subplots(1, 3, figsize=(12.6, 3.6))
fig.patch.set_facecolor('#ffffff')
r = (1 / 3) ** (2 / 3)
for ax, t, title in zip(axes, [0, .5, 1],
        [r'$t=0$', r'$t=P_{\mathrm{J}}/2$', r'$t=P_{\mathrm{J}}$']):
    ax.add_patch(Circle((0, 0), 1, fill=False, color='#b6bdc5', lw=1.5))
    ax.add_patch(Circle((0, 0), r, fill=False, color='#b6bdc5', lw=1.5))
    pj, pa = 2*np.pi*t, 6*np.pi*t
    ax.plot([0, np.cos(pj)], [0, np.sin(pj)], color='#555d65', ls='--', lw=1)
    ax.scatter([0], [0], s=145, c='#ebc13e', zorder=5)
    ax.scatter([r*np.cos(pa)], [r*np.sin(pa)], s=60, c='#247b9e', zorder=6)
    ax.scatter([np.cos(pj)], [np.sin(pj)], s=135, c='#b56430', zorder=6)
    ax.text(0, -.2, '太阳', ha='center', color='#4b4f54', fontsize=10)
    ax.text(r*np.cos(pa), .16, '小行星', ha='center', color='#247b9e', fontsize=11)
    ax.text(np.cos(pj), -.2, '木星', ha='center', color='#a35021', fontsize=11)
    ax.set_title(title, pad=4, fontsize=14)
    ax.set_xlim(-1.3, 1.3); ax.set_ylim(-1.15, 1.15)
    ax.set_aspect('equal'); ax.axis('off')
fig.subplots_adjust(top=.87, bottom=.03, left=.025, right=.975, wspace=.16)
for ext in ['png', 'svg']:
    fig.savefig(out / f'resonant-conjunctions.{ext}', dpi=180, facecolor='white')
plt.close(fig)
