"""Check translated chunks: python3 scripts/i18n-check.py 012 013 ... (or 'all'). Reports missing keys, extra keys,
untranslated (mostly-Latin) values, lost \n\n breaks and changed scripture refs."""
import json, os, re, sys
ROOT = os.path.join(os.path.dirname(__file__), '..')
REF = re.compile(r'\b(?:[123] )?(?:Gen|Exod|Lev|Num|Deut|Josh|Judg|Ruth|Sam|Kgs|Chr|Ezra|Neh|Esth|Job|Ps|Prov|Eccl|Song|Isa|Jer|Lam|Ezek|Dan|Hos|Joel|Amos|Obad|Jonah|Mic|Nah|Hab|Zeph|Hag|Zech|Mal|Matt|Mark|Luke|John|Acts|Rom|Cor|Gal|Eph|Phil|Col|Thess|Tim|Titus|Phlm|Heb|Jas|Pet|Jude|Rev) \d+(?::\d+)?')
names = sys.argv[1:]
if names == ['all']: names = sorted(f[:-5] for f in os.listdir(os.path.join(ROOT, 'i18n', 'src')))
bad = 0
for n in names:
    src = json.load(open(os.path.join(ROOT, 'i18n', 'src', n + '.json')))
    p = os.path.join(ROOT, 'i18n', 'ta', n + '.json')
    if not os.path.exists(p): print(f'{n}: MISSING FILE'); bad += 1; continue
    try: ta = json.load(open(p))
    except Exception as e: print(f'{n}: INVALID JSON {e}'); bad += 1; continue
    miss = [k for k in src if k not in ta]; extra = [k for k in ta if k not in src]
    eng = [k for k in src if k in ta and len(src[k]) > 12 and len(re.findall(r'[஀-௿]', ta[k])) < 0.15 * len(re.sub(r'[\s\d\W]', '', ta[k]) or 'x')]
    paras = [k for k in src if k in ta and src[k].count('\n\n') != ta[k].count('\n\n')]
    refs = [k for k in src if k in ta and set(REF.findall(src[k])) - set(REF.findall(ta[k]))]
    probs = []
    if miss: probs.append(f'{len(miss)} missing keys e.g. {miss[:5]}')
    if extra: probs.append(f'{len(extra)} extra keys e.g. {extra[:5]}')
    if eng: probs.append(f'{len(eng)} look untranslated e.g. {eng[:5]}')
    if paras: probs.append(f'{len(paras)} with different paragraph breaks e.g. {paras[:5]}')
    if refs: probs.append(f'{len(refs)} lost a scripture ref e.g. {refs[:5]}')
    if probs: bad += 1; print(f'{n}: ' + '; '.join(probs))
    else: print(f'{n}: ok ({len(src)} strings)')
sys.exit(1 if bad else 0)
