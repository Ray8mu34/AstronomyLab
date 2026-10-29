"""Plot existing JPL parameter CSV with coordinates and values only."""
from pathlib import Path
import csv
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import FixedLocator, FixedFormatter, NullFormatter

plt.rcParams.update({'font.sans-serif': ['Microsoft YaHei', 'SimHei'],
                    'axes.unicode_minus': False, 'svg.fonttype': 'none', 'font.size': 12})
out = Path(__file__).resolve().parent
with (out.parents[1] / 'shared/v02/planet_parameters.csv').open(encoding='utf-8-sig', newline='') as f:
    rows = list(csv.DictReader(f))
earth = next(row for row in rows if row['English_name'] == 'Earth')
names = [row['名称'] for row in rows]
radii = [float(row['volume_equivalent_mean_radius_km']) / float(earth['volume_equivalent_mean_radius_km']) for row in rows]
masses = [float(row['mass_10^24_kg']) / float(earth['mass_10^24_kg']) for row in rows]
densities = [float(row['bulk_density_g_cm3']) for row in rows]
fig, axes = plt.subplots(1, 3, figsize=(12.6, 4.9), sharey=True)
for i, (ax, values, label) in enumerate(zip(axes, [radii, masses, densities],
        ['半径 / 地球', '质量 / 地球', r'平均密度 / (g cm$^{-3}$)'])):
    ax.set_axisbelow(True)
    ax.grid(axis='x', color='#e1e5e8', lw=.7)
    ax.scatter(values, range(8), s=48, color='#256d85', zorder=3)
    for y, value in enumerate(values):
        ax.annotate(f'{value:.3g}', (value, y), xytext=(7, 0), textcoords='offset points',
                    va='center', fontsize=10, color='#243440')
    ax.set_xlabel(label, labelpad=10)
    for side in ['top', 'right', 'left']:
        ax.spines[side].set_visible(False)
    ax.spines['bottom'].set_color('#9aa4ac')
    ax.tick_params(axis='y', length=0, pad=9)
    if i < 2:
        ax.set_xscale('log')
        ticks = [.3, 1, 3, 10] if i == 0 else [.1, 1, 10, 100]
        labels = ['0.3','1','3','10'] if i == 0 else ['0.1','1','10','100']
        ax.xaxis.set_major_locator(FixedLocator(ticks))
        ax.xaxis.set_major_formatter(FixedFormatter(labels))
        ax.xaxis.set_minor_formatter(NullFormatter())
    else:
        ax.set_xticks([0, 2, 4, 6])
axes[0].set_xlim(.25, 20)
axes[1].set_xlim(.025, 850)
axes[2].set_xlim(0, 6.5)
axes[0].set_yticks(range(8), names)
axes[0].set_ylim(7.55, -.55)
fig.subplots_adjust(left=.07, right=.99, bottom=.16, top=.97, wspace=.22)
for ext in ['png', 'svg']:
    fig.savefig(out / f'planet-properties.{ext}', dpi=180, facecolor='white')
plt.close(fig)
