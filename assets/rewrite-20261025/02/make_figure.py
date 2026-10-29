"""Original steady one-layer radiative energy-flow schematic."""
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle

plt.rcParams.update({'font.sans-serif': ['Microsoft YaHei', 'SimHei'], 'axes.unicode_minus': False,
                     'svg.fonttype': 'none', 'font.size': 12})
out = Path(__file__).resolve().parent
fig, axes = plt.subplots(1, 2, figsize=(11.8, 4.1))
solar, ir = '#b97a16', '#bc4e36'

def arrow(ax, x, y0, y1, label, color, dx=.04):
    ax.annotate('', xy=(x,y1), xytext=(x,y0),
                arrowprops={'arrowstyle':'-|>', 'color':color, 'lw':2.6, 'mutation_scale':17})
    ax.text(x+dx, (y0+y1)/2, label, ha='left', va='center', color=color, fontsize=13)

for ax in axes:
    ax.set_xlim(0,1); ax.set_ylim(0,1); ax.axis('off')
    ax.add_patch(Rectangle((.05,.13),.90,.10,color='#dbe5df'))
    ax.text(.50,.18,'地表',ha='center',va='center',color='#344a40')
    ax.text(.05,.92,'太空',ha='left',va='center',color='#636b73')
    arrow(ax,.22,.89,.24,'Q',solar)

arrow(axes[0],.65,.24,.89,'Q',ir)

axes[1].add_patch(Rectangle((.05,.55),.90,.10,color='#d9e8f3',zorder=0))
axes[1].text(.665,.60,'大气层',ha='center',va='center',color='#2c536d')
arrow(axes[1],.48,.24,.54,'2Q',ir)
arrow(axes[1],.70,.66,.89,'Q',ir)
arrow(axes[1],.82,.54,.24,'Q',ir)
fig.subplots_adjust(left=.04,right=.98,bottom=.01,top=.99,wspace=.24)
for ext in ['png','svg']:
    fig.savefig(out/f'radiative-balance.{ext}',dpi=180,facecolor='white')
plt.close(fig)
