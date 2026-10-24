"""Assemble translations: i18n/ta/*.json (by string id) -> public/ta/c-N.json overlays (by content file + path),
and i18n/ui/*.json (English -> Tamil UI strings) -> src/generated/ui-ta.json. Untranslated strings fall back to English."""
import json, glob, os
ROOT = os.path.join(os.path.dirname(__file__), '..')
J = lambda *p: os.path.join(ROOT, *p)
tr = {}
for f in glob.glob(J('i18n', 'ta', '*.json')):
    try: tr.update(json.load(open(f)))
    except Exception as e: print('skip bad file', f, e)
manifest = json.load(open(J('i18n', 'manifest.json')))
ENUM_KEYS = {'parent', 'books', 'abbr', 'category', 'criterion', 'kind', 'leans', 'region', 'role', 'side', 'testament', 'tier', 'track', 'type', 'verdict', 'warrant', 'status', 'confidence'}
import re
# id-like = a real id somewhere in the content, or a slug with a hyphen/underscore/digit (e.g. "christus-victor", "es-c1")
SLUG = re.compile(r'[a-z0-9]*([-_][a-z0-9]+)+|[a-z]+\d+[a-z0-9]*')
IDS = set()
def collect(v, k=None):
    if isinstance(v, dict): [collect(x, kk) for kk, x in v.items()]
    elif isinstance(v, list): [collect(x, k) for x in v]
    elif isinstance(v, str) and k == 'id': IDS.add(v)
for cf in glob.glob(J('content', '*.json')): collect(json.load(open(cf)))
class _Id:
    def fullmatch(self, t): return t in IDS or SLUG.fullmatch(t)
IDLIKE = _Id()
src_text = {}
for f in glob.glob(J('i18n', 'src', '*.json')): src_text.update(json.load(open(f)))
out, done, total = {}, 0, 0
for f, paths in manifest.items():
    # never overlay id-like strings (link targets such as positionId / parent values)
    m = {p: tr[i] for p, i in paths.items() if i in tr and not IDLIKE.fullmatch(src_text.get(i, '')) and not any(seg.endswith(('Id', 'Ids')) for seg in p.split('.')) and not src_text.get(i, '').startswith('/') and p.split('.')[-1] not in ENUM_KEYS and not any(seg == 'books' for seg in p.split('.')) and '.status.' not in '.' + p}
    total += len(paths); done += len(m)
    if m: out[f] = m
os.makedirs(J('public', 'ta'), exist_ok=True)
for p in glob.glob(J('public', 'ta', 'c-*.json')): os.remove(p)
groups, cur, size, LIMIT = [], {}, 0, 5_000_000
for f in sorted(out):
    b = len(json.dumps(out[f], ensure_ascii=False).encode())
    if cur and size + b > LIMIT: groups.append(cur); cur, size = {}, 0
    cur[f] = out[f]; size += b
if cur: groups.append(cur)
names = []
for i, g in enumerate(groups):
    n = f'c-{i}.json'; names.append(n)
    json.dump(g, open(J('public', 'ta', n), 'w'), ensure_ascii=False, separators=(',', ':'))
json.dump(names, open(J('public', 'ta', 'index.json'), 'w'))
ui = {}
for f in sorted(glob.glob(J('i18n', 'ui', '*.json'))):
    try: ui.update(json.load(open(f)))
    except Exception as e: print('skip bad ui file', f, e)
json.dump(ui, open(J('src', 'generated', 'ui-ta.json'), 'w'), ensure_ascii=False, indent=0, sort_keys=True)
print(f'content: {done}/{total} paths translated ({100*done//max(total,1)}%), {len(names)} overlay files; ui: {len(ui)} strings')
