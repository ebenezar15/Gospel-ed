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
out, done, total = {}, 0, 0
for f, paths in manifest.items():
    m = {p: tr[i] for p, i in paths.items() if i in tr}
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
