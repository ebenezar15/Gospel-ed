/** Language support. The language is chosen once at startup (switching reloads the page), so every
 *  module can read `lang` synchronously. UI strings use English as the key: t('Map of the gods'). */
import uiTa from './generated/ui-ta.json';

export type Lang = 'en' | 'ta';
const KEY = 'logos-lang';
function readLang(): Lang {
  try { const v = localStorage.getItem(KEY); if (v === 'ta' || v === 'en') return v; } catch { /* storage blocked */ }
  try { if (typeof navigator !== 'undefined' && navigator.language?.startsWith('ta')) return 'ta'; } catch { /* ignore */ }
  return 'en';
}
export const lang: Lang = readLang();
export const isTa = lang === 'ta';
export function setLang(l: Lang) {
  try { localStorage.setItem(KEY, l); } catch { /* storage blocked: still reload into the default */ }
  if (l !== lang) location.reload();
}

const dict = uiTa as Record<string, string>;
/** Translate a UI string. `{name}` placeholders are filled from `vars`. Unknown strings fall back to English. */
export function t(s: string, vars?: Record<string, string | number>): string {
  let out = isTa ? dict[s] ?? s : s;
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
  return out;
}
/** Translate an enum-like content value (category, region, kind…) shown in the UI. Same dictionary as t(). */
export const tv = (s: string | undefined | null) => (s ? t(s) : '');

/** Year label: -950 → "950 BC" / "கி.மு. 950". */
export const fmtYear = (y: number) => (isTa ? (y < 0 ? `கி.மு. ${-y}` : `கி.பி. ${y}`) : y < 0 ? `${-y} BC` : `AD ${y}`);

export const TA_BOOKS = ['ஆதியாகமம்', 'யாத்திராகமம்', 'லேவியராகமம்', 'எண்ணாகமம்', 'உபாகமம்', 'யோசுவா', 'நியாயாதிபதிகள்', 'ரூத்', '1 சாமுவேல்', '2 சாமுவேல்', '1 இராஜாக்கள்', '2 இராஜாக்கள்', '1 நாளாகமம்', '2 நாளாகமம்', 'எஸ்றா', 'நெகேமியா', 'எஸ்தர்', 'யோபு', 'சங்கீதம்', 'நீதிமொழிகள்', 'பிரசங்கி', 'உன்னதப்பாட்டு', 'ஏசாயா', 'எரேமியா', 'புலம்பல்', 'எசேக்கியேல்', 'தானியேல்', 'ஓசியா', 'யோவேல்', 'ஆமோஸ்', 'ஒபதியா', 'யோனா', 'மீகா', 'நாகூம்', 'ஆபகூக்', 'செப்பனியா', 'ஆகாய்', 'சகரியா', 'மல்கியா',
  'மத்தேயு', 'மாற்கு', 'லூக்கா', 'யோவான்', 'அப்போஸ்தலர்', 'ரோமர்', '1 கொரிந்தியர்', '2 கொரிந்தியர்', 'கலாத்தியர்', 'எபேசியர்', 'பிலிப்பியர்', 'கொலோசெயர்', '1 தெசலோனிக்கேயர்', '2 தெசலோனிக்கேயர்', '1 தீமோத்தேயு', '2 தீமோத்தேயு', 'தீத்து', 'பிலேமோன்', 'எபிரெயர்', 'யாக்கோபு', '1 பேதுரு', '2 பேதுரு', '1 யோவான்', '2 யோவான்', '3 யோவான்', 'யூதா', 'வெளிப்படுத்தின விசேஷம்'];
export const TA_ABBR = ['ஆதி', 'யாத்', 'லேவி', 'எண்', 'உபா', 'யோசு', 'நியா', 'ரூத்', '1 சாமு', '2 சாமு', '1 இரா', '2 இரா', '1 நாளா', '2 நாளா', 'எஸ்றா', 'நெகே', 'எஸ்தர்', 'யோபு', 'சங்', 'நீதி', 'பிர', 'உன்', 'ஏசா', 'எரே', 'புல', 'எசே', 'தானி', 'ஓசி', 'யோவே', 'ஆமோ', 'ஒப', 'யோனா', 'மீகா', 'நாகூ', 'ஆப', 'செப்', 'ஆகா', 'சக', 'மல்',
  'மத்', 'மாற்', 'லூக்', 'யோவா', 'அப்', 'ரோம', '1 கொரி', '2 கொரி', 'கலா', 'எபே', 'பிலி', 'கொலோ', '1 தெச', '2 தெச', '1 தீமோ', '2 தீமோ', 'தீத்', 'பிலே', 'எபி', 'யாக்', '1 பேது', '2 பேது', '1 யோவா', '2 யோவா', '3 யோவா', 'யூதா', 'வெளி'];

/** Tamil content overlay, filled by the bootstrap before the data module is evaluated: { "people-1.json": { "0.summary": "…" } }. */
export type Overlay = Record<string, Record<string, string>>;
declare global { interface Window { __TA_OVERLAY__?: Overlay } }
export async function loadOverlay(): Promise<void> {
  if (!isTa) return;
  try {
    const idx: string[] = await fetch('ta/index.json').then((r) => r.json());
    const parts = await Promise.all(idx.map((f) => fetch(`ta/${f}`).then((r) => r.json() as Promise<Overlay>)));
    window.__TA_OVERLAY__ = Object.assign({}, ...parts);
  } catch (e) { console.warn('Tamil content could not be loaded; showing English content.', e); }
}
/** Writes overlay strings into a parsed content file in place. Paths look like "3.events.0.text". */
export function applyOverlay(name: string, data: unknown) {
  const o = typeof window !== 'undefined' ? window.__TA_OVERLAY__?.[name] : undefined;
  if (!o || !data) return;
  for (const [path, val] of Object.entries(o)) {
    const keys = path.split('.'); let cur: any = data;
    for (let i = 0; i < keys.length - 1 && cur; i++) cur = cur[keys[i]];
    const last = keys[keys.length - 1];
    if (cur && typeof cur[last] === 'string') cur[last] = val;
  }
}

/** Tamil Union Version, one file per book, fetched on demand. */
const taBible = new Map<number, Promise<string[][]>>();
export function loadTamilBook(i: number): Promise<string[][]> {
  if (!taBible.has(i)) taBible.set(i, fetch(`ta/bible/${String(i + 1).padStart(2, '0')}.json`).then((r) => r.json()));
  return taBible.get(i)!;
}
