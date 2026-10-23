# Interface translation brief (Tamil)

The app now has `src/i18n.ts` exporting:
- `t(english, vars?)` — returns the Tamil translation of an interface string in Tamil mode, the English otherwise. Placeholders: `t('{n} chapters', { n: d.chapters.length })`.
- `tv(value)` — same dictionary, for enum-like content values shown on screen (category, region, kind, type, status, verdict, tier, role…). These values stay English in the data because the code compares them, so wrap the DISPLAY of them: `{tv(d.category)}` instead of `{d.category}`.
- `isTa` (boolean), `fmtYear` (already localized; `fmtYear` in components/ui.tsx is localized too).

## Your job for each file you own
1. Wrap EVERY user-visible English string in `t(...)`: JSX text, headings, buttons, tabs labels, placeholders, `aria-label`s, `title`s, empty-state messages, tooltips, chart labels, status messages, template strings shown to users. Turn string concatenations with variables into one `t()` call with `{placeholders}` so Tamil word order can differ.
   - JSX text: `<h2>Key words</h2>` → `<h2>{t('Key words')}</h2>`.
   - Props: `label="Map of the gods"` → `label={t('Map of the gods')}`; arrays of tab objects: `{ id: 'map', label: t('Map of the gods') }`.
   - Module-level constant arrays/objects with labels (e.g. NAV, SECTIONS, LENSES): since `lang` is fixed at startup, calling `t()` at module level is fine.
   - Do NOT translate: ids, route paths, CSS classes, data keys, comparisons (`x.kind === 'trade'`), console messages, content values coming from `/content` (those are translated separately), the brand name "Logos Atlas" (keep in English), scripture refs.
   - Wrap displayed enum-like content values with `tv()`.
2. Add import: `import { t, tv } from '../i18n';` (path relative to file; only what you use).
3. Put every string you wrapped into YOUR dictionary file `i18n/ui/<your-name>.json`: `{ "English exactly as passed to t()": "Tamil" }`. Keys must match the `t()` argument character for character (including punctuation, arrows like →, and `{placeholders}`). Keep `{placeholders}` in the Tamil value. If another file of yours uses the same string, one entry is enough.
4. Tamil style: short, natural interface Tamil, as a well-made Tamil app would use (e.g. Search → தேடு, Save → சேமி, Next → அடுத்தது, Back → பின், Close → மூடு, Home → முகப்பு, Settings → அமைப்புகள், Timeline → காலவரிசை, Map → வரைபடம், People → நபர்கள், Books → புத்தகங்கள், Study Guides → படிப்பு வழிகாட்டிகள், Debates → விவாதங்கள், Family Tree → குடும்ப மரம், Connections → தொடர்புகள், Who Was Alive? → அப்போது யார் வாழ்ந்தார்கள்?, Old Testament → பழைய ஏற்பாடு, New Testament → புதிய ஏற்பாடு). Bible names and theology terms: follow `i18n/GLOSSARY.md` (read it). Confidence labels: biblical → வேதாகமம் கூறுவது, scholarly-consensus / Scholarly consensus → அறிஞர் பொதுக்கருத்து, debated / Debated → விவாதத்திற்குரியது, tradition / Tradition → மரபு, speculative / Speculative → ஊகம், needs-verification → சரிபார்க்க வேண்டியது.
5. Run `cd /home/user/Gospel-ed && npx tsc --noEmit -p .` until clean. Don't run the build or change any file you don't own. Don't commit.
6. Finally run `python3 scripts/i18n-ui-check.py <your files…>` which lists `t('…')` keys in your files that are missing from all `i18n/ui/*.json` dictionaries, and fix them.
