"""List t('…') / t("…") keys used in the given source files that are missing from i18n/ui/*.json."""
import json, glob, os, re, sys
ROOT = os.path.join(os.path.dirname(__file__), '..')
d = {}
for f in glob.glob(os.path.join(ROOT, 'i18n', 'ui', '*.json')):
    try: d.update(json.load(open(f)))
    except Exception as e: print('BAD JSON', f, e)
pat = re.compile(r"""\bt\(\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`([^`$]*)`)""")
files = sys.argv[1:] or glob.glob(os.path.join(ROOT, 'src', '**', '*.tsx'), recursive=True)
miss = 0
for f in files:
    src = open(f).read()
    for m in pat.finditer(src):
        k = next(g for g in m.groups() if g is not None).replace("\\'", "'").replace('\\"', '"')
        if k not in d: miss += 1; print(f'{os.path.basename(f)}: missing "{k}"')
print('missing', miss)
