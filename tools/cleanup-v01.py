"""Plan the user-authorized v0.1 cleanup and verify preservation afterward.

Deletion uses the generated PowerShell script, with absolute path/hash checks.
This tool never deletes files itself and never recreates deleted v0.1 files.
"""
from pathlib import Path
from datetime import datetime, timezone
import argparse, csv, hashlib, json, re
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / 'build/qa/v02-cleanup-manifest.json'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()


def plan():
    if PLAN.exists():
        raise RuntimeError('Existing cleanup record preserved; use --audit to verify it.')
    baseline = json.loads((ROOT/'build/qa/source-v0.2-baseline.json').read_text(encoding='utf-8'))['source_sha256']
    exports = json.loads((ROOT/'build/qa/manifest.json').read_text(encoding='utf-8'))['outputs']
    keep = set()
    for p in (ROOT/'course').glob('[0-9][0-9]-*/lesson.md'):
        keep.add(p)
        for match in re.finditer(r'!\[[^\]]*\]\(([^)]+)\)', p.read_text(encoding='utf-8-sig')):
            keep.add((p.parent/unquote(match[1].split('#')[0])).resolve())
    for row in csv.DictReader((ROOT/'assets/ARTICLE_ASSETS.csv').open(encoding='utf-8-sig')):
        keep.add((ROOT/row['local_path']).resolve())
    # Editable companions of reused media remain useful for the user's own PPT.
    for p in list(keep):
        if p.suffix == '.png' and p.with_suffix('.svg').exists():
            keep.add(p.with_suffix('.svg'))
    candidates = set()
    for folder in (ROOT/'course').glob('[0-9][0-9]-*'):
        candidates.update(p for p in folder.iterdir() if p.is_file() and p.name != 'lesson.md')
    for name in ('lesson-plans-v0.1', 'v01-records'):
        candidates.update((ROOT/'course/_teacher'/name).rglob('*'))
    teacher_names = ['answer-key.md', 'batch-C-check.json', 'review-log.md', 'coverage.csv', 'calibration-coverage.csv']
    teacher_names += [f'batch-{x}-{suffix}' for x in 'ABC' for suffix in ('coverage.csv', 'answer-key.md')]
    candidates.update(ROOT/'course/_teacher'/n for n in teacher_names)
    # Baseline v0.1 asset files outside current v0.2 folders, excluding reuse.
    for name in baseline:
        if name.startswith('assets/') and '/v02/' not in name and '/v02-reference/' not in name and not Path(name).name.startswith(('v02-', 'ARTICLE_')):
            candidates.add(ROOT/name)
    current_tools = {
        'cleanup-v01.py', 'integrate-articles-v02.py', 'build-articles-v02.py',
        'render-articles-v02.mjs', 'article-reading.css', 'article-review-contact.py',
        'record-root-review-v02.py', 'plot-planet-comparisons-v02.py',
        'fetch-first-four-v02.py', 'download-first-four-v02.py',
        'finish-first-four-media.py', 'inspect-reading-style.mjs', 'dependencies.md',
        'final-protection-audit-v02.py',
    }
    candidates.update(p for p in (ROOT/'tools').iterdir() if p.is_file() and p.name not in current_tools)
    candidates.update((ROOT/'tools/__pycache__').rglob('*'))
    for name in ('teacher', 'student'):
        candidates.update((ROOT/'build'/name).rglob('*'))
    qa_keep = {'article-integration-manifest.json', 'source-v0.2-baseline.json', 'inputs'}
    for p in (ROOT/'build/qa').iterdir():
        if p.name.startswith('v02-') or p.name in qa_keep:
            continue
        candidates.update(p.rglob('*') if p.is_dir() else [p])
    removed, preserved = [], []
    for p in sorted(candidates):
        if not p.is_file() or p in keep:
            continue
        name = p.relative_to(ROOT).as_posix()
        digest = sha(p)
        expected = baseline.get(name, exports.get(name, {}).get('sha256'))
        if expected and digest != expected:
            preserved.append({'path': name, 'reason': 'changed since recorded baseline; possible human edit'})
            continue
        removed.append({'path': name, 'sha256': digest, 'bytes': p.stat().st_size})
    protected = set(keep)
    protected.update(p for p in (ROOT/'raw').rglob('*') if p.is_file())
    for folder in (ROOT/'course').iterdir():
        if folder.is_dir() and not re.match(r'^\d{2}-', folder.name) and folder.name != '_teacher':
            protected.update(p for p in folder.rglob('*') if p.is_file())
    protected.update(p for p in (ROOT/'assets').rglob('*') if p.is_file() and ('v02' in p.parts or 'v02-reference' in p.parts))
    payload = {
        'authorized_by': '用户：清理一下之前的第一版的其他文件，我觉得不需要它们了',
        'planned_at_utc': datetime.now(timezone.utc).isoformat(), 'workspace': str(ROOT),
        'state': 'planned', 'delete_files': removed, 'preserved_changed_files': preserved,
        'protected_sha256': {p.relative_to(ROOT).as_posix(): sha(p) for p in sorted(protected)},
        'reused_v01_media': [p.relative_to(ROOT).as_posix() for p in sorted(keep) if p.parent.name != 'v02' and p.is_relative_to(ROOT/'assets')],
    }
    PLAN.write_text(json.dumps(payload, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({'planned_files': len(removed), 'bytes': sum(x['bytes'] for x in removed), 'preserved_changed_files': preserved, 'reused_v01_media': payload['reused_v01_media'], 'protected_files': len(protected)}, ensure_ascii=False, indent=2))


def audit():
    payload = json.loads(PLAN.read_text(encoding='utf-8'))
    remaining = [x['path'] for x in payload['delete_files'] if (ROOT/x['path']).exists()]
    changed = [name for name, digest in payload['protected_sha256'].items() if not (ROOT/name).is_file() or sha(ROOT/name) != digest]
    result = {'checked_at_utc': datetime.now(timezone.utc).isoformat(), 'deleted_files': len(payload['delete_files'])-len(remaining), 'deleted_bytes': sum(x['bytes'] for x in payload['delete_files'] if not (ROOT/x['path']).exists()), 'remaining_planned_files': remaining, 'protected_files': len(payload['protected_sha256']), 'changed_protected_files': changed}
    payload['verification'] = result
    payload['state'] = 'completed' if not remaining and not changed else 'issues'
    PLAN.write_text(json.dumps(payload, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if remaining or changed:
        raise RuntimeError('Cleanup incomplete or protected files changed')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--audit', action='store_true')
    args = parser.parse_args()
    audit() if args.audit else plan()
