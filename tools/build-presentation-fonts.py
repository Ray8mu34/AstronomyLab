"""Build local presentation fonts using the existing dl_env fontTools runtime.

The reviewed full Noto source stays in build/qa, never in the runtime package.
Use --check after changing UI copy to verify coverage without downloading.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import urllib.request
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = ROOT / 'docs/AstronomyLab_02_Frontend_Package/02_frontend_redesign/resources/fonts'
OUTPUT = ROOT / 'web/observatory/shared/fonts'
SOURCE = ROOT / 'build/qa/frontend-round2-20261019/foundation/NotoSansSC-VF.ttf'
SOURCE_URL = 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf'
SOURCE_HASH = 'a3041811a78c361b1de50f953c805e0244951c21c5bd412f7232ef0d899af0da'

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def corpus():
    excluded = {'data', 'vendor', 'textures', 'media', 'fonts'}
    files = sorted(path for path in (ROOT / 'web').rglob('*') if path.is_file()
                   and path.suffix in {'.html', '.js', '.mjs', '.css'}
                   and not excluded.intersection(path.relative_to(ROOT / 'web').parts))
    chars = {ord(char) for path in files for char in path.read_text(encoding='utf-8') if not char.isspace()}
    return files, chars

def coverage(files, chars):
    known = set()
    for path in OUTPUT.glob('*.woff2'):
        known.update(TTFont(path).getBestCmap())
    return {'input_count': len(files), 'actual_text_codepoints': len(chars),
            'system_fallback_codepoints': [f'U+{cp:04X}' for cp in sorted(chars - known)],
            'uncovered_cjk_codepoints': [f'U+{cp:04X}' for cp in sorted(chars - known) if 0x3400 <= cp <= 0x9fff],
            'font_bytes': sum(path.stat().st_size for path in OUTPUT.glob('*.woff2')),
            'outputs': [{'file': path.name, 'bytes': path.stat().st_size, 'sha256': digest(path)}
                        for path in sorted(OUTPUT.glob('*.woff2'))]}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    files, chars = corpus()
    if args.check:
        result = coverage(files, chars)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        if result['uncovered_cjk_codepoints']:
            raise SystemExit(1)
        return
    SOURCE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    if not SOURCE.exists():
        with urllib.request.urlopen(SOURCE_URL, timeout=60) as response:
            SOURCE.write_bytes(response.read())
    if digest(SOURCE) != SOURCE_HASH:
        raise SystemExit('Reviewed font source hash changed; do not bypass its identity check.')
    font = TTFont(SOURCE, recalcTimestamp=False)
    available = set(font.getBestCmap())
    # Include Greek quantities, scientific punctuation and numeric notation.
    selected = (chars | set(range(32, 127)) | set(range(0x370, 0x400))
                | set(range(0x2070, 0x20a0)) | {ord(c) for c in '☉☾☽⊕°−μλσΔθ′″'}) & available
    core_paths = ['web/observatory/shared/home.js', 'web/observatory/shared/navigation.js',
                  'web/observatory/shared/tool-registry.js', 'web/observatory/index.html']
    core_text = ''.join((ROOT / path).read_text(encoding='utf-8') for path in core_paths if (ROOT / path).exists())
    core = (set(map(ord, core_text)) | {cp for cp in selected if cp < 0x2e80}) & selected
    options = subset.Options()
    options.layout_features = ['*']
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14, 16, 17]
    names = {1: 'ALab Sans', 2: 'Regular', 3: 'ALabSans-400-600-20261019',
             4: 'ALab Sans', 6: 'ALabSans', 16: 'ALab Sans', 17: 'Regular'}
    faces = []
    for filename, points in [('ALabSans.woff2', core), ('ALabSans-Extended.woff2', selected - core)]:
        face = copy.deepcopy(font)
        sub = subset.Subsetter(options=options)
        sub.populate(unicodes=points)
        sub.subset(face)
        instantiateVariableFont(face, {'wght': (400, 400, 600)}, inplace=True)
        for rec in face['name'].names:
            if rec.nameID in names:
                rec.string = names[rec.nameID].encode(rec.getEncoding(), errors='replace')
        for name_id, value in names.items():
            face['name'].setName(value, name_id, 3, 1, 0x409)
        face.recalcTimestamp = False
        face.flavor = 'woff2'
        face.save(OUTPUT / filename)
        ranges = ','.join(f'U+{cp:04X}' for cp in sorted(points))
        faces.append(f'@font-face {{\n font-family: "ALab Sans";\n src: url("./{filename}") format("woff2");\n font-weight: 400 600;\n font-style: normal;\n font-display: swap;\n unicode-range: {ranges};\n}}')
    mono = TTFont(PACKAGE / 'IBMPlexMono-Regular.ttf', recalcTimestamp=False)
    mono.flavor = 'woff2'
    mono.save(OUTPUT / 'IBMPlexMono-Regular.woff2')
    faces.append('@font-face {\n font-family: "IBM Plex Mono";\n src: url("./IBMPlexMono-Regular.woff2") format("woff2");\n font-weight: 400;\n font-style: normal;\n font-display: swap;\n}')
    (OUTPUT / 'font-faces.css').write_text('/* Generated by tools/build-presentation-fonts.py. */\n' + '\n'.join(faces) + '\n', encoding='utf-8')
    for license_file in ['NotoSansSC-OFL.txt', 'IBMPlexMono-OFL.txt']:
        (OUTPUT / license_file).write_bytes((PACKAGE / license_file).read_bytes())
    report = {'source_url': SOURCE_URL, 'source_sha256': SOURCE_HASH,
              'derived_family': 'ALab Sans', 'weight_range': [400, 600],
              'transformation': 'Application codepoints, disjoint home/navigation core and extended Unicode ranges, variable weight 400–600, renamed ALab Sans, WOFF2 compression.',
              'core_inputs': core_paths,
              'initial_font_bytes': (OUTPUT / 'ALabSans.woff2').stat().st_size + (OUTPUT / 'IBMPlexMono-Regular.woff2').stat().st_size,
              'numeric_source_sha256': digest(PACKAGE / 'IBMPlexMono-Regular.ttf'),
              'numeric_transformation': 'Unchanged IBM Plex Mono outlines and naming; lossless WOFF2 container conversion.',
              'input_files': [str(path.relative_to(ROOT)).replace('\\', '/') for path in files],
              'selected_codepoints': [f'U+{cp:04X}' for cp in sorted(selected)],
              **coverage(files, chars)}
    (OUTPUT / 'FONT_MANIFEST.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({key: report[key] for key in ['font_bytes', 'system_fallback_codepoints', 'outputs']}, indent=2))

if __name__ == '__main__':
    main()
