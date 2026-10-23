"""Extract translatable strings from content/*.json into deduplicated chunks for translators.
Writes i18n/src/NNN.json ({id: english}) and i18n/manifest.json ({file: {path: id}})."""
import json, glob, os, re, sys
ROOT = os.path.join(os.path.dirname(__file__), '..')
SKIP = {'id','ids','ref','refs','keyRefs','keyVerses','keyVerse','confidence','eraId','eraIds','placeId','placeIds','personId','personIds','bookId','godId','godIds',
        'type','kind','color','coords','tier','testament','role','from','to','parents','spouses','children','siblings','category','status','abbr','coordConfidence',
        'region','verdict','era','author','locator','original','hebrew','greek','scholars','url','next','chapters','journey','route','routeIds','stopIds','icon','glyph','shape','c','categoryId'}
REF = re.compile(r'^(\d )?[A-Z][a-z]+ \d+(:\d+)?(-\d+(:\d+)?)?$')
CHUNK = int(sys.argv[1]) if len(sys.argv) > 1 else 24000
texts, order = {}, []          # english -> id
manifest = {}
def walk(f, v, path, key, parent):
    if isinstance(v, str):
        if key in SKIP or not v.strip() or REF.match(v) or re.fullmatch(r'[\d\s.,:;–—()\-+/%]+', v): return
        if key == 'title' and isinstance(parent, dict) and 'author' in parent: return  # bibliographic titles stay as published
        if key == 'name' and isinstance(parent, dict) and 'era' in parent and len(parent) == 2: pass
        if v not in texts: texts[v] = str(len(texts)); order.append((f, v))
        manifest.setdefault(f, {})[path] = texts[v]
    elif isinstance(v, list):
        for i, x in enumerate(v): walk(f, x, f'{path}.{i}' if path else str(i), key, parent)
    elif isinstance(v, dict):
        for k, x in v.items(): walk(f, x, f'{path}.{k}' if path else k, k, v)
files = sorted(os.path.basename(p) for p in glob.glob(os.path.join(ROOT, 'content', '*.json')))
for f in files: walk(f, json.load(open(os.path.join(ROOT, 'content', f))), '', None, None)
os.makedirs(os.path.join(ROOT, 'i18n', 'src'), exist_ok=True)
for p in glob.glob(os.path.join(ROOT, 'i18n', 'src', '*.json')): os.remove(p)
chunks, cur, size, curfile = [], {}, 0, None
for f, v in order:
    fam = re.sub(r'(-\d+|-(ot|nt)-\d)?\.json$', '', f)
    if cur and (size + len(v) > CHUNK or fam != curfile): chunks.append((curfile, cur)); cur, size = {}, 0
    cur[texts[v]] = v; size += len(v); curfile = fam
if cur: chunks.append((curfile, cur))
index = []
for i, (fam, c) in enumerate(chunks):
    name = f'{i:03d}'
    json.dump(c, open(os.path.join(ROOT, 'i18n', 'src', name + '.json'), 'w'), ensure_ascii=False, indent=0)
    index.append({'chunk': name, 'family': fam, 'strings': len(c), 'chars': sum(map(len, c.values()))})
json.dump(manifest, open(os.path.join(ROOT, 'i18n', 'manifest.json'), 'w'))
json.dump(index, open(os.path.join(ROOT, 'i18n', 'chunks.json'), 'w'), indent=0)
print(len(texts), 'unique strings,', sum(len(t) for t in texts), 'chars,', len(chunks), 'chunks')
