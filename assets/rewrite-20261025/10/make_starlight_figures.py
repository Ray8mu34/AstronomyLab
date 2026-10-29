"""Reuse the original numerical models with concise figure labels.

Model source: assets/08/v02/create_batch_b_assets.py, the two section-10 plots.
This script only writes new copies next to itself; it does not download media.
"""
from pathlib import Path
import math
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

out = Path(__file__).resolve().parent
plt.rcParams.update({"font.size": 16, "axes.titlesize": 19, "axes.labelsize": 17,
                     "figure.facecolor": "white", "svg.fonttype": "none"})

def save(fig, stem):
    fig.tight_layout()
    fig.savefig(out / (stem + ".png"), dpi=180, bbox_inches="tight")
    fig.savefig(out / (stem + ".svg"), bbox_inches="tight")
    plt.close(fig)

# Same Planck-law grid, temperatures, normalization, and constants as the old plot.
lam = np.linspace(100, 2200, 1500)
lm = lam * 1e-9
H, C, K = 6.62607015e-34, 299792458, 1.380649e-23
fig, axes = plt.subplots(1, 2, figsize=(14, 5))
for temperature, color in [(3000, "#b4482d"), (5800, "#e3a320"), (10000, "#2165a5")]:
    bb = 2*H*C*C/lm**5/np.expm1(H*C/(lm*K*temperature))
    axes[0].plot(lam, bb/1e13, color=color, lw=3, label=f"{temperature} K")
    axes[1].plot(lam, bb/bb.max(), color=color, lw=3, label=f"{temperature} K")
for ax in axes:
    ax.axvspan(380, 750, color="#a9a9a9", alpha=.12)
    ax.set(xlabel="Wavelength (nm)", xlim=(100, 2200))
    ax.grid(alpha=.2)
    ax.legend()
axes[0].set(ylabel="B_lambda (10^13 W sr^-1 m^-3)", title="Blackbody spectra")
axes[1].set(ylabel="B_lambda / individual peak", title="Normalized spectra", ylim=(0, 1.08))
save(fig, "planck-curves")

# Same magnitude and distance grids, curves, and marked examples as the old plot.
fig, axes = plt.subplots(1, 2, figsize=(14, 5))
dm = np.linspace(-1, 6, 300)
axes[0].semilogy(dm, 10**(-.4*dm), lw=3, color="#155c8a")
axes[0].set(xlabel="m - reference magnitude", ylabel="Flux / reference flux", title="Magnitude and flux")
axes[0].grid(alpha=.25)
d = np.linspace(1, 100, 300)
axes[1].plot(d, 5*np.log10(d/10), lw=3, color="#e17825")
axes[1].set(xlabel="Distance (pc)", ylabel="m - M", title="Distance modulus")
axes[1].grid(alpha=.25)
for distance in [10, 25, 100]:
    value = 5*math.log10(distance/10)
    axes[1].scatter(distance, value, c="#155c8a")
    axes[1].annotate(f"{distance} pc: {value:.2f} mag", (distance, value),
                     xytext=(-140, -25) if distance == 100 else (8, 8),
                     textcoords="offset points", fontsize=12)
save(fig, "magnitude-distance")
