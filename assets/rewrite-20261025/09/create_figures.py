"""Concise copies of five original optical diagrams; no original assets are written.

Geometry/models: assets/09/{refractor,newtonian}.svg,
assets/08/v02/create_batch_b_assets.py, assets/09/v02/draw_sct.py.
Run with conda run -n dl_env python assets/rewrite-20261025/09/create_figures.py
"""
from pathlib import Path
import hashlib
import json
import math
import xml.etree.ElementTree as ET
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[2]
names = {'refractor': 'assets/09', 'newtonian': 'assets/09',
         'focal-plane': 'assets/09/v02', 'resolution-and-seeing': 'assets/09/v02',
         'schmidt-cassegrain': 'assets/09/v02'}
originals = [ROOT / folder / f'{name}.{ext}' for name, folder in names.items() for ext in ('png', 'svg')]
before = {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in originals}

def render_primitive_svg(svg, target):
    """Rasterize the two original primitive-only SVGs at their original 2x scale."""
    tree = ET.fromstring(svg)
    scale = 2
    image = Image.new('RGB', (int(tree.get('width')) * scale, int(tree.get('height')) * scale), 'white')
    draw = ImageDraw.Draw(image)
    def point(x, y):
        return (float(x) * scale, float(y) * scale)
    for node in tree:
        tag = node.tag.split('}')[-1]
        a = node.attrib
        width = max(1, round(float(a.get('stroke-width', 1)) * scale))
        stroke = a.get('stroke', '#000000')
        fill = a.get('fill', '#000000')
        if tag == 'line':
            start, end = point(a['x1'], a['y1']), point(a['x2'], a['y2'])
            if 'stroke-dasharray' in a:
                dash, gap = [float(v) * scale for v in a['stroke-dasharray'].split()]
                length = math.dist(start, end)
                for distance in np.arange(0, length, dash + gap):
                    u, v = distance / length, min(distance + dash, length) / length
                    p1 = tuple(start[i] + u * (end[i] - start[i]) for i in range(2))
                    p2 = tuple(start[i] + v * (end[i] - start[i]) for i in range(2))
                    draw.line([p1, p2], fill=stroke, width=width)
            else:
                draw.line([start, end], fill=stroke, width=width)
        elif tag == 'polygon':
            points = [point(*pair.split(',')) for pair in a['points'].split()]
            draw.polygon(points, fill=fill)
        elif tag == 'circle':
            cx, cy = point(a['cx'], a['cy'])
            r = float(a['r']) * scale
            draw.ellipse((cx-r, cy-r, cx+r, cy+r), fill=fill, outline=stroke, width=width)
        elif tag == 'text':
            font = ImageFont.truetype('C:/Windows/Fonts/msyh.ttc', round(float(a['font-size']) * scale))
            anchor = {'middle': 'mm', 'start': 'lm', 'end': 'rm'}.get(a.get('text-anchor', 'start'))
            draw.text(point(a['x'], a['y']), ''.join(node.itertext()), font=font, fill=fill, anchor=anchor)
    image.save(target)

for name, changes in {
    'refractor': {'折射式：平行光 → 物镜成像 → 目镜': '折射式'},
    'newtonian': {'牛顿式：主镜汇聚，平副镜把焦点移到侧面': '牛顿式', '凹主镜（简化）': '凹主镜'},
}.items():
    svg = (ROOT / 'assets/09' / f'{name}.svg').read_text(encoding='utf-8')
    for old, new in changes.items():
        assert old in svg
        svg = svg.replace(old, new)
    (OUT / f'{name}.svg').write_text(svg, encoding='utf-8')
    render_primitive_svg(svg, OUT / f'{name}.png')

plt.rcParams.update({'font.size': 16, 'axes.titlesize': 19, 'axes.labelsize': 17,
                     'figure.facecolor': 'white', 'svg.fonttype': 'none'})

def save(fig, name):
    for ext in ('png', 'svg'):
        fig.savefig(OUT / f'{name}.{ext}', dpi=180, bbox_inches='tight')
    plt.close(fig)

# Original focal-plane geometry; only object labels and measured distances remain.
fig, ax = plt.subplots(figsize=(13, 5.3))
F = 8
for theta, color in [(0, '#e17825'), (.11, '#155c8a')]:
    yfocus = F * theta
    for y in [-1.7, -.8, .8, 1.7]:
        ax.plot([-4, 0], [y-4*theta, y], color=color, lw=2)
        ax.plot([0, F], [y, yfocus], color=color, lw=2)
    ax.scatter(F, yfocus, c=color, s=70, zorder=3)
ax.plot([0, 0], [-2.1, 2.1], color='black', lw=7, alpha=.5)
ax.plot([F, F], [-2.2, 2.2], color='#777777', lw=2, ls='--')
ax.annotate('', (0, -2.5), (F, -2.5), arrowprops={'arrowstyle': '<->'})
ax.text(3.5, -2.85, 'F')
ax.text(-.7, 2.35, 'Objective')
ax.text(7.4, 2.35, 'Focal plane')
ax.annotate('', (8.5, 0), (8.5, .88), arrowprops={'arrowstyle': '<->', 'color': '#444444'})
ax.text(8.7, .36, 'y')
ax.set(xlim=(-4.5, 10.5), ylim=(-3.2, 3), aspect='equal')
ax.axis('off')
save(fig, 'focal-plane')

# Same original diffraction and Gaussian models, without explanatory headings.
D = np.linspace(.06, .40, 300)
fig, axes = plt.subplots(1, 2, figsize=(14, 5))
axes[0].plot(D*1000, 1.22*550e-9/D*206265, color='#155c8a', lw=3, label='Rayleigh: 550 nm')
axes[0].plot(D*1000, 1.22*800e-9/D*206265, color='#e17825', lw=3, label='Rayleigh: 800 nm')
axes[0].axhline(2, ls='--', color='#666666', label='Seeing FWHM: 2 arcsec')
axes[0].set(xlabel='Aperture D (mm)', ylabel='Angular scale (arcsec)', ylim=(0, 3.8))
axes[0].legend(fontsize=11)
axes[0].grid(alpha=.2)
x = np.linspace(-4, 4, 1000)
for fwhm, color in [(.7, '#155c8a'), (2, '#e17825')]:
    sigma = fwhm/2.355
    y = np.exp(-.5*((x-1)/sigma)**2) + np.exp(-.5*((x+1)/sigma)**2)
    axes[1].plot(x, y, lw=3, label=f'FWHM = {fwhm} arcsec', color=color)
axes[1].set(xlabel='Sky position (arcsec)', ylabel='Relative intensity')
axes[1].legend(fontsize=11, loc='lower center', bbox_to_anchor=(.5, 1.015), ncol=2, frameon=False)
axes[1].grid(alpha=.2)
fig.tight_layout()
save(fig, 'resolution-and-seeing')

# Original SCT routing. The explanatory footer now belongs to the lesson caption.
fig, ax = plt.subplots(figsize=(14, 5.5))
ax.axhline(0, color='#bbbbbb', lw=1)
ax.plot([1, 1], [-1.8, 1.8], c='#444444', lw=5)
for sign in [-1, 1]:
    y, sy, ey = sign*1.3, sign*.65, -sign*.65/7
    for x1, y1, x2, y2, color in [(0,y,8,y,'#155c8a'), (8,y,3,sy,'#b85c20'),
                                 (3,sy,11,ey,'#653c88'), (11,ey,12.8,ey,'#653c88')]:
        ax.plot([x1,x2], [y1,y2], color=color, lw=2.8)
        ax.annotate('', (x1+.60*(x2-x1), y1+.60*(y2-y1)),
                    (x1+.45*(x2-x1), y1+.45*(y2-y1)),
                    arrowprops={'arrowstyle':'-|>', 'color':color, 'lw':2})
for y1, y2 in [(.3,1.75), (-1.75,-.3)]:
    yy = np.linspace(y1,y2,50)
    xx = 8+.10*(1-(yy/1.75)**2)
    ax.plot(xx,yy,c='#444444',lw=7)
yy = np.linspace(-.8,.8,70)
xx = 3+.15*(1-(yy/.8)**2)
ax.plot(xx,yy,c='#444444',lw=5)
ax.plot([11,11],[-.55,.55],c='#444444',lw=5)
ax.scatter(10,0,s=65,c='#cf3131',zorder=4)
ax.text(.5,2,'Corrector plate',ha='left')
ax.text(2.8,1.05,'Convex secondary',ha='center')
ax.text(7.1,-2.1,'Primary mirror')
ax.text(9.7,.5,'Rear focus',ha='center')
ax.text(11.1,-.95,'Eyepiece')
ax.set(xlim=(-.35,13.4),ylim=(-2.35,2.7),title='Schmidt–Cassegrain')
ax.axis('off')
fig.tight_layout()
save(fig,'schmidt-cassegrain')

assert before == {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in originals}
(OUT/'figure-provenance.json').write_text(json.dumps({'original_sha256':before,
    'sources':['assets/09/refractor.svg','assets/09/newtonian.svg',
               'assets/08/v02/create_batch_b_assets.py','assets/09/v02/draw_sct.py'],
    'change':'Removed explanatory headings, repeated formulas and the SCT reading instruction; kept geometry, axes, units and curve/object labels.'},
    ensure_ascii=False,indent=2),encoding='utf-8')
print('Wrote five diagram copies as PNG/SVG; original hashes unchanged.')
