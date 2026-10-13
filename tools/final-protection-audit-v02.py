"""Verify preserved current sources after authorized cleanup, then fingerprint.

No v0.1 backups are required or recreated. This is file protection evidence,
not scientific, visual, human or classroom review.
"""
from pathlib import Path
from datetime import datetime, timezone
import hashlib, json

root=Path(__file__).resolve().parents[1]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
cleanup=json.loads((root/'build/qa/v02-cleanup-manifest.json').read_text(encoding='utf-8'))
changed=[name for name,digest in cleanup['protected_sha256'].items() if not (root/name).is_file() or sha(root/name)!=digest]
remaining=[item['path'] for item in cleanup['delete_files'] if (root/item['path']).exists()]
adoption=json.loads((root/'build/qa/v02-pro-adoption.json').read_text(encoding='utf-8'))
pro=[{'path':r['supplied_file'],'unchanged':sha(root/r['supplied_file'])==r['supplied_sha256']} for r in adoption]
report={'checked_at_utc':datetime.now(timezone.utc).isoformat(), 'scope':'Authorized v0.1 cleanup; current prose, original inputs, user examples and current media preservation', 'protected_files':len(cleanup['protected_sha256']), 'unexpected_protected_changes':changed, 'remaining_cleanup_files':remaining, 'pro_original_articles':pro, 'cleanup_record':'build/qa/v02-cleanup-manifest.json', 'human_review':'pending', 'classroom_trial':'pending'}
(root/'build/qa/v02-protection-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
assert not changed and not remaining and all(r['unchanged'] for r in pro),report
selected=set()
for prefix in ('raw','course','assets','tools'):
    selected.update(p for p in (root/prefix).rglob('*') if p.is_file() and not any(part in ('__pycache__','vendor') for part in p.parts))
selected.update([root/'README.md',root/'AGENTS.md'])
snapshot={'version':'v0.2-after-authorized-cleanup','saved_at_utc':datetime.now(timezone.utc).isoformat(), 'scope':'Current internal sources; removed v0.1 files recorded separately in cleanup manifest.', 'source_sha256':{p.relative_to(root).as_posix():sha(p) for p in sorted(selected)}}
(root/'build/qa/source-v0.2-baseline.json').write_text(json.dumps(snapshot,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'protected_files_unchanged':len(cleanup['protected_sha256']),'pro_original_articles_unchanged':len(pro),'current_source_files':len(selected)},ensure_ascii=False))
