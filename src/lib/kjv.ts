import { parseRef, type ParsedRef } from './refs';
import { BOOKS } from './canon';
import { isTa, TA_BOOKS, TA_ABBR } from '../i18n';

let cache: string[][][] | null = null;
let loading: Promise<string[][][]> | null = null;
/** KJV text (public domain) is ~4MB, so it's split into its own lazily evaluated module. */
export function loadKJV() {
  if (cache) return Promise.resolve(cache);
  loading ??= import('../generated/kjv.json').then((m) => (cache = (m.default as unknown) as string[][][]));
  return loading;
}
export type Verse = { c: number; v: number; text: string };
export function versesFor(kjv: string[][][], r: ParsedRef, max = 40): Verse[] {
  const out: Verse[] = []; const book = kjv[r.book];
  for (let c = r.c1; c <= r.c2; c++) {
    const ch = book[c - 1]; const from = c === r.c1 ? r.v1 ?? 1 : 1; const to = c === r.c2 ? r.v2 ?? ch.length : ch.length;
    for (let v = from; v <= to && out.length < max; v++) out.push({ c, v, text: ch[v - 1] });
  }
  return out;
}
const swapBook = (ref: string, names: string[]) => { const p = parseRef(ref); return p ? ref.replace(/^\S+( \S+)?(?= \d)/, names[p.book]) : ref; };
/** "Rom 3:20" → "Romans 3:20" / "ரோமர் 3:20". */
export function refLabel(ref: string) { return swapBook(ref, isTa ? TA_BOOKS : BOOKS.map((b) => b.name)); }
/** Chip label: the reference as written in English, Tamil abbreviation in Tamil mode. */
export function refShort(ref: string) { return isTa ? swapBook(ref, TA_ABBR) : ref; }
