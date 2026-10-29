"""Reference-circle diagrams, adapted from assets/05/v02/draw-batch-A.py.

The original plane geometry and nutation model are retained. The precession
circle is shown in a polar azimuthal-equidistant projection, with angular
distance from the north ecliptic pole as the radial coordinate.
See course/07-reference-circles/lesson.md and assets/v02-batch-A-SOURCES.md.
Run with: conda run -n dl_env python assets/rewrite-20261025/07/draw-figures.py
"""
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

OUT = Path(__file__).resolve().parent
plt.rcParams.update({
    "font.family": "Microsoft YaHei", "font.size": 13,
    "axes.unicode_minus": False, "svg.fonttype": "none",
})


def save(fig, name):
    for ext in ("png", "svg"):
        fig.savefig(OUT / f"{name}.{ext}", dpi=180,
                    bbox_inches="tight", facecolor="white")
    plt.close(fig)


def rx(angle):
    c, s = np.cos(angle), np.sin(angle)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])


t = np.linspace(0, 2 * np.pi, 1501)
base = np.stack([np.cos(t), np.sin(t), np.zeros_like(t)])
ecliptic = rx(np.deg2rad(23.44)) @ base
lunar = rx(np.deg2rad(23.44)) @ rx(np.deg2rad(5.145)) @ base
ra, dec = np.deg2rad([192.85948, 27.12825])
pole = np.array([np.cos(dec) * np.cos(ra),
                 np.cos(dec) * np.sin(ra), np.sin(dec)])
u = np.cross(pole, [0, 0, 1])
u /= np.linalg.norm(u)
v = np.cross(pole, u)
galactic = u[:, None] * np.cos(t) + v[:, None] * np.sin(t)
fig, ax = plt.subplots(figsize=(13, 6), layout="constrained")
for xyz, label, color, style in [
    (base, "天赤道", "#347bac", "-"),
    (ecliptic, "黄道", "#c76c19", "-"),
    (lunar, "白道", "#b84c67", "--"),
    (galactic, "银道", "#398758", "-"),
]:
    ra_hours = (np.rad2deg(np.arctan2(xyz[1], xyz[0])) % 360) / 15
    dec_degrees = np.rad2deg(np.arcsin(xyz[2]))
    order = np.argsort(ra_hours)
    ax.plot(ra_hours[order], dec_degrees[order],
            color=color, lw=2.3, ls=style, label=label)
ax.set(xlim=(24, 0), ylim=(-90, 90),
       xlabel="赤经（小时）", ylabel="赤纬（度）")
ax.set_xticks(np.arange(0, 25, 3))
ax.grid(alpha=.2)
ax.legend(loc="lower center", ncol=2, fontsize=11)
save(fig, "four-circles")

fig, axes = plt.subplots(1, 2, figsize=(13, 6), layout="constrained")
ax = axes[0]
angle = np.linspace(0, 2 * np.pi, 361)
radius = 23.44
ax.plot(radius * np.cos(angle), radius * np.sin(angle),
        lw=2.5, color="#347bac")
ax.scatter([0], [0], s=70, c="#333", zorder=3)
ax.annotate("北黄极", (0, 0), xytext=(-10, 10),
            textcoords="offset points", ha="right")
ax.scatter([radius], [0], s=80, c="#c76c19", zorder=3)
ax.annotate("北天极", (radius, 0), xytext=(-12, 12),
            textcoords="offset points", ha="right")
ax.plot([0, radius], [0, 0], color="#999", ls="--", lw=1.2)
ax.text(radius / 2, -2.5, "ε", ha="center", va="top")
ax.set(xlim=(-32, 32), ylim=(-32, 32),
       xlabel="x（度）", ylabel="y（度）",
       title="岁差", aspect="equal")
ax.grid(alpha=.15)

ax = axes[1]
years = np.linspace(0, 38, 500)
ax.axhline(0, color="#888", lw=1.5)
ax.plot(years, 9.2 * np.cos(2 * np.pi * years / 18.6),
        color="#b84c67", lw=2.5)
ax.set(xlabel="时间（年）", ylabel="黄赤交角变化 Δε（角秒）",
       title="章动")
ax.grid(alpha=.2)
save(fig, "precession-nutation")
