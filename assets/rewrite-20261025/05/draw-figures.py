"""Calendar diagrams, adapted from assets/05/v02/draw-batch-A.py.

The original numerical model is retained. Its assumptions and references are
given in course/05-calendars/lesson.md and assets/v02-batch-A-SOURCES.md.
Run with: conda run -n dl_env python assets/rewrite-20261025/05/draw-figures.py
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

fig, axes = plt.subplots(1, 2, figsize=(14, 5.4), layout="constrained")
years = np.arange(0, 401)
for length, label, color in [
    (365, "365日年", "#c45043"),
    (365.25, "儒略历", "#347bac"),
    (365.2425, "格里高利历", "#398758"),
]:
    axes[0].plot(years, years * (length - 365.2422),
                 lw=2.5, label=label, color=color)
axes[0].set(xlabel="年数", ylabel="累计日数差：历年 − 季节年（日）")
axes[0].legend(fontsize=11)
axes[0].grid(alpha=.2)

years = np.arange(0, 20)
axes[1].plot(years, years * 365.2422,
             label="季节年", lw=3, color="#398758")
axes[1].plot(years, years * 12 * 29.5306,
             label="每年12个朔望月", lw=2, color="#c45043")
axes[1].scatter([19], [235 * 29.5306], marker="*", s=160,
                color="#347bac", label="235个朔望月", zorder=4)
axes[1].set(xlabel="年数", ylabel="累计时间（日）")
axes[1].set_xticks([0, 5, 10, 15, 19])
axes[1].legend(fontsize=11)
axes[1].grid(alpha=.2)
for ext in ("png", "svg"):
    fig.savefig(OUT / f"calendar-fit.{ext}", dpi=180,
                bbox_inches="tight", facecolor="white")
plt.close(fig)
