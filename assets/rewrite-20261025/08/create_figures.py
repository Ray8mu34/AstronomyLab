"""Background figure, adapted from assets/08/v02/create_batch_b_assets.py.

Only this new directory is written. Original data model and axes are retained.
Run with conda run -n dl_env python assets/rewrite-20261025/08/create_figures.py
"""
from pathlib import Path
import hashlib
import json
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[2]
originals = [ROOT / 'assets/08/v02' / f'background-contrast.{ext}' for ext in ('png', 'svg')]
before = {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in originals}
plt.rcParams.update({'font.size': 16, 'axes.titlesize': 19, 'axes.labelsize': 17,
                     'figure.facecolor': 'white', 'svg.fonttype': 'none'})
fig, axes = plt.subplots(1, 3, figsize=(15, 4.8))
x = np.arange(0, 100)
source = 20 * np.exp(-0.5 * ((x - 50) / 11) ** 2)
for ax, background in zip(axes, [20, 100, 500]):
    ax.plot(x, np.full_like(x, background), ls='--', color='#888888', label='Sky background B')
    ax.plot(x, background + source, color='#155c8a', lw=3, label='Source + sky')
    ax.set(xlabel='Position (arbitrary units)', ylabel='Mean counts per cell',
           title=f'B = {background}', ylim=(0, 550))
axes[0].legend(fontsize=11)
fig.tight_layout()
for ext in ('png', 'svg'):
    fig.savefig(OUT / f'background-contrast.{ext}', dpi=180, bbox_inches='tight')
plt.close(fig)
assert before == {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in originals}
(OUT / 'figure-provenance.json').write_text(json.dumps({'source': 'assets/08/v02/create_batch_b_assets.py',
    'original_sha256': before, 'change': 'Removed explanatory heading and repeated contrast values; retained source, background and axes.'},
    ensure_ascii=False, indent=2), encoding='utf-8')
print('Wrote background-contrast.png and .svg; original hashes unchanged.')
