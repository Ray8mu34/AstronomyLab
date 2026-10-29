"""Original explanatory SVGs; Python standard library only.
Run from the repository root: conda run -n dl_env python assets/rewrite-20261025/12/make_figures.py
"""
from pathlib import Path
from math import sqrt
from html import escape

BASE = Path(__file__).resolve().parent.parent
FONT = "Microsoft YaHei, Noto Sans CJK SC, sans-serif"


def svg(width, height, body):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
<defs>
<marker id="blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#2a617b"/></marker>
<marker id="red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#bd6a35"/></marker>
<marker id="gray" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#8a9698"/></marker>
</defs>
<rect width="100%" height="100%" fill="#fffdf8"/>
<g font-family="{FONT}" fill="#263842">{body}</g></svg>'''


def text(x, y, value, size=24, anchor="start", fill=None):
    color = f' fill="{fill}"' if fill else ""
    return f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}"{color}>{escape(value)}</text>'


def line(x1, y1, x2, y2, color="#2a617b", width=4, arrow=None, dashed=False):
    end = f' marker-end="url(#{arrow})"' if arrow else ""
    dash = ' stroke-dasharray="8 6"' if dashed else ""
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{width}"{end}{dash}/>'


def circle(x, y, r, fill, stroke=None, width=2):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{stroke or fill}" stroke-width="{width}"/>'


# A structural diagram, with radii and thicknesses deliberately schematic.
b = text(265, 56, "核心氢聚变", 29, "middle") + text(870, 56, "壳层氢聚变", 29, "middle")
b += circle(265, 290, 110, "#f6d892", "#d4a153")
b += circle(265, 290, 45, "#cf773d")
b += text(265, 288, "H → He", 22, "middle", "#ffffff")
b += text(265, 447, "包层", 24, "middle")
b += line(418, 290, 554, 290, "#8a9698", 3, "gray")
b += circle(870, 290, 185, "#f7e1d0", "#cf936d")
b += circle(870, 290, 42, "#d98441")
b += circle(870, 290, 28, "#8f5954")
b += text(870, 298, "He", 21, "middle", "#ffffff")
b += line(912, 290, 1100, 290, "#bd6a35", 2)
b += text(1110, 282, "H → He", 22)
b += line(868, 264, 756, 164, "#8f5954", 2)
b += text(705, 139, "核心", 24)
b += line(1006, 413, 1086, 472, "#cf936d", 2)
b += text(1096, 477, "包层", 24)
b += line(870, 103, 870, 77, "#2a617b", 4, "blue")
b += line(685, 290, 637, 290, "#2a617b", 4, "blue")
b += line(870, 475, 870, 519, "#2a617b", 4, "blue")
b += line(943, 290, 1002, 290, "#bd6a35", 4, "red", True)
b += line(870, 215, 870, 156, "#bd6a35", 4, "red", True)
b += line(870, 366, 870, 421, "#bd6a35", 4, "red", True)
b += line(146, 559, 215, 559, "#2a617b", 4, "blue")
b += text(231, 567, "物质层位移", 21)
b += line(439, 559, 508, 559, "#bd6a35", 4, "red", True)
b += text(524, 567, "能量传递", 21)
(BASE / "12" / "core-envelope.svg").write_text(svg(1320, 610, b), encoding="utf-8")


# Uniform expanding sphere. The plotted time scales, in days, are t and A/t.
msun = 1.99e30
c = 299792458.0
kappa = 0.01
mass = 1.4 * msun
speed = 1.0e7
day = 86400.0
from math import pi
A = 3 * kappa * mass / (4 * pi * c * speed) / day**2
cross = sqrt(A)
W, H = 1160, 680
left, right, top, bottom = 120, 1070, 55, 565
X = lambda t: left + (t - 4) / 36 * (right - left)
Y = lambda t: bottom - t / 80 * (bottom - top)
b = ""
for y in (0, 20, 40, 60, 80):
    b += line(left, Y(y), right, Y(y), "#dfe3e1", 1)
    b += text(left - 20, Y(y) + 8, str(y), 22, "end")
for x in (4, 10, 20, 30, 40):
    b += line(X(x), top, X(x), bottom, "#edf0eb", 1)
    b += text(X(x), bottom + 34, str(x), 22, "middle")
b += line(left, top, left, bottom, "#52636b", 2)
b += line(left, bottom, right, bottom, "#52636b", 2)
for color, f in (("#2a617b", lambda t: A/t), ("#bd6a35", lambda t: t)):
    points = " ".join(f"{X(t):.2f},{Y(f(t)):.2f}" for t in [4 + 36*i/300 for i in range(301)])
    b += f'<polyline points="{points}" fill="none" stroke="{color}" stroke-width="4"/>'
b += circle(X(cross), Y(cross), 7, "#263842")
b += line(X(cross), Y(cross), X(cross), bottom, "#52636b", 2, dashed=True)
b += text(X(cross) + 20, Y(cross) - 19, f"{cross:.1f} 日", 24)
b += text(760, 90, "扩散时间", 25, fill="#2a617b")
b += text(760, 124, "已经过的时间", 25, fill="#bd6a35")
b += text((left + right)/2, 650, "爆发后时间 / 日", 25, "middle")
b += f'<g transform="translate(33 315) rotate(-90)">{text(0, 0, "时间尺度 / 日", 25, "middle")}</g>'
(BASE / "13" / "diffusion-time.svg").write_text(svg(W, H, b), encoding="utf-8")


# Tidal acceleration schematic, after subtracting the centre-of-mass motion.
b = text(340, 52, "引力加速度", 28, "middle")
b += circle(140, 200, 62, "#dfbf7b", "#b9934f") + text(140, 207, "M", 28, "middle")
b += circle(725, 200, 94, "#ecf2f3", "#829ca7")
b += text(725, 333, "小天体", 24, "middle")
for x, length in ((631, 145), (725, 97), (819, 67)):
    b += circle(x, 200, 5, "#263842")
    b += line(x, 200, x-length, 200, "#2a617b", 4, "blue")
b += text(616, 160, "近端", 21, "middle")
b += text(725, 160, "中心", 21, "middle")
b += text(835, 160, "远端", 21, "middle")
b += line(140, 299, 725, 299, "#87928b", 2)
b += text(430, 324, "r", 24, "middle")
b += text(340, 415, "相对中心的加速度", 28, "middle")
b += circle(725, 554, 79, "#ecf2f3", "#829ca7")
b += circle(725, 554, 5, "#263842")
b += line(646, 554, 573, 554, "#bd6a35", 4, "red")
b += line(804, 554, 877, 554, "#bd6a35", 4, "red")
b += line(725, 475, 725, 512, "#bd6a35", 4, "red")
b += line(725, 633, 725, 596, "#bd6a35", 4, "red")
b += text(919, 562, "径向拉伸", 24)
b += text(725, 685, "横向压缩", 24, "middle")
b += text(140, 561, "← 引力源方向", 23, "middle")
(BASE / "14" / "tidal-field.svg").write_text(svg(1140, 730, b), encoding="utf-8")
print(f"Created 3 SVGs; diffusion crossover = {cross:.3f} days.")

# Optional previews in the same asset folders, using the existing browser.
import sys
if "--render" in sys.argv:
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        for folder, name, w, h in (
            ("12", "core-envelope", 1320, 610),
            ("13", "diffusion-time", 1160, 680),
            ("14", "tidal-field", 1140, 730),
        ):
            path = BASE / folder / f"{name}.svg"
            page = browser.new_page(viewport={"width": w, "height": h}, device_scale_factor=1.5)
            page.goto(path.as_uri())
            page.screenshot(path=str(path.with_suffix(".png")))
            page.close()
        browser.close()
    print("Rendered 3 PNG previews.")
