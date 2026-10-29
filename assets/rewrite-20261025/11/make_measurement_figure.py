"""A controlled synthetic scene; no observational image is used or modified."""
from pathlib import Path
import json
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.colors import AsinhNorm

out = Path(__file__).resolve().parent
rng = np.random.default_rng(1025)
y, x = np.mgrid[-1:1:120j, -1:1:160j]
cloud = 1.5 * np.exp(-((x + 0.1)**2 / 0.5 + (y + 0.12)**2 / 0.25))
cloud += 0.8 * np.exp(-((y - 0.18 - 0.14*np.sin(5*x))**2 / 0.018 + x*x / 1.2))
cloud *= 1 - 0.7*np.exp(-((x - 0.2)**2/0.03 + (y + 0.05)**2/0.15))
scene = cloud
for sx, sy, peak in [(-.55, .45, 40), (.5, -.45, 23), (.65, .55, 12)]:
    scene = scene + peak*np.exp(-((x-sx)**2+(y-sy)**2)/(2*.025**2))
flat = (1 - .23*(x*x+y*y)) * rng.normal(1, .018, x.shape)
bias, dark, sky, read = 100.0, .02, 9.0, 3.0
def expose(t):
    raw = bias + rng.poisson((flat*(scene+sky)+dark)*t) + rng.normal(0, read, x.shape)
    calibrated = (raw-bias-dark*t)/(flat*t)-sky
    return raw, calibrated
raw100, cal100 = expose(100.)
raw400, cal400 = expose(400.)
plt.rcParams.update({"font.family": "Microsoft YaHei", "font.size": 10, "axes.unicode_minus": False})
fig, axes = plt.subplots(2, 3, figsize=(12.3, 8.3), constrained_layout=True)
common = AsinhNorm(linear_width=.5, vmin=0, vmax=40)
panels = [
    (scene, "A 设定的天体信号", common, "电子 / 秒 / 像素"),
    (raw100, "B 100 秒原始读数", None, "电子"),
    (flat, "C 相对响应（平场）", None, "无量纲"),
    (cal100, "D 100 秒：校准后，asinh 显示", common, "电子 / 秒 / 像素"),
    (cal400, "E 400 秒：校准后，同一显示", common, "电子 / 秒 / 像素"),
    (cal400, "F 同一份 400 秒数据，线性显示", None, "电子 / 秒 / 像素"),
]
for ax, (data, title, norm, label) in zip(axes.flat, panels):
    kwargs = {"norm": norm} if norm else {}
    if title.startswith("F"):
        kwargs = {"vmin": 0, "vmax": 40}
    if title.startswith("C"):
        kwargs = {"vmin": .5, "vmax": 1.05}
    im = ax.imshow(data, origin="lower", cmap="gray", interpolation="nearest", **kwargs)
    ax.set_title(title, fontsize=11, pad=9)
    ax.set_xlabel("横向像素")
    ax.set_ylabel("纵向像素")
    cb = fig.colorbar(im, ax=ax, fraction=.05, pad=.025, shrink=.85)
    cb.set_label(label, fontsize=8)
    cb.ax.tick_params(labelsize=8)
fig.suptitle("同一模拟视场", fontsize=15)
fig.savefig(out / "measurement-and-display.png", dpi=180)
fig.savefig(out / "measurement-and-display.svg")
plt.close(fig)
(out / "simulation-parameters.json").write_text(json.dumps({
    "type": "synthetic, not observational", "seed": 1025,
    "shape": list(scene.shape), "exposure_seconds": [100, 400],
    "sky_rate_e_per_s_per_pixel": sky, "dark_rate_e_per_s_per_pixel": dark,
    "bias_e": bias, "read_noise_e_rms_per_read": read,
    "flat_assumed_exact_for_calibration": True, "background_assumed_known": True,
    "asinh_linear_width_e_per_s_per_pixel": .5,
    "common_display_max_e_per_s_per_pixel": 40,
    "raw_model": "bias + Poisson(t*(flat*(scene+sky)+dark)) + Normal(0,read)",
    "calibration": "(raw-bias-dark*t)/(flat*t)-sky"
}, ensure_ascii=False, indent=2), encoding="utf-8")
print(out / "measurement-and-display.png")
