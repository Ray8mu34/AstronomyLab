"""Sky-position diagrams, adapted from assets/05/v02/draw-batch-A.py.

The original numerical models are retained. See course/06-sky-maps/lesson.md
and assets/v02-batch-A-SOURCES.md for assumptions and references.
Run with: conda run -n dl_env python assets/rewrite-20261025/06/draw-figures.py
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


def altitude(phi, delta, hour_angle):
    phi = np.deg2rad(phi)
    delta = np.deg2rad(delta)
    hour_angle = np.deg2rad(hour_angle)
    return np.rad2deg(np.arcsin(
        np.sin(phi) * np.sin(delta)
        + np.cos(phi) * np.cos(delta) * np.cos(hour_angle)
    ))


hour_angle = np.linspace(-180, 180, 721)
fig, ax = plt.subplots(figsize=(12, 6), layout="constrained")
for delta, label, color in [
    (0, "δ = 0°", "#347bac"),
    (16.5, "毕宿五（δ ≈ +16.5°）", "#c76c19"),
    (70, "δ = +70°", "#815299"),
    (-30, "δ = −30°", "#398758"),
]:
    ax.plot(hour_angle / 15, altitude(30, delta, hour_angle),
            lw=2.6, label=label, color=color)
ax.axhline(0, color="#444", lw=1.4)
ax.set(xlim=(-12, 12), ylim=(-90, 90),
       xlabel="时角 H（小时）", ylabel="几何高度（度）")
ax.grid(alpha=.18)
ax.legend(loc="lower center")
save(fig, "star-altitudes")

fig, axes = plt.subplots(1, 2, figsize=(13, 6), layout="constrained")
ax = axes[0]
ax.scatter([-1, 1], [0, 0], s=100, c=["#347bac", "#398758"])
ax.scatter([0], [6], s=220, marker="*", c="#c76c19")
ax.scatter([0], [0], s=110, c="#e4ae28")
ax.plot([-1, 0, 1], [0, 6, 0], color="#444")
ax.plot([0, 0], [0, 6], color="#888", ls="--")
ax.plot([-1, 0], [0, 0], color="#888", lw=1)
ax.text(-1.15, -.5, "观测位置1", ha="center")
ax.text(1.15, -.5, "观测位置2", ha="center")
ax.text(.12, .12, "太阳")
ax.text(.15, 3, "d")
ax.text(.1, 6.25, "恒星")
ax.text(-.5, .25, "1 AU", ha="center")
# Draw the angle already represented by the two sightlines.
angle = np.arctan(1 / 6)
arc = np.linspace(-np.pi / 2 - angle, -np.pi / 2, 50)
ax.plot(.65 * np.cos(arc), 6 + .65 * np.sin(arc),
        color="#555", lw=1)
ax.annotate("p", (-.054, 5.35), xytext=(-.6, 5.0),
            arrowprops={"arrowstyle": "-", "color": "#888"})
ax.set(xlim=(-2.1, 2.1), ylim=(-.8, 6.8), aspect="equal")
ax.axis("off")

ax = axes[1]
phase = np.linspace(0, 2 * np.pi, 300)
for parallax, label, color in [
    (100, "10 pc", "#347bac"),
    (20, "50 pc", "#398758"),
]:
    ax.plot(parallax * np.cos(phase), .6 * parallax * np.sin(phase),
            lw=2.5, label=label, color=color)
ax.set(xlabel="横向角位移（毫角秒）", ylabel="纵向角位移（毫角秒）",
       aspect="equal")
ax.legend(fontsize=11)
ax.grid(alpha=.2)
save(fig, "parallax")
