import { BOOKS, BOOK_INDEX } from './canon';
import counts from './verse-counts.json';

export type ParsedRef = { book: number; c1: number; v1?: number; c2: number; v2?: number };
const RE = /^((?:[123] )?[A-Z][a-z]+) (\d+)(?::(\d+))?(?:-(\d+)(?::(\d+))?)?$/;

/** Parse "Gen 12:1-3", "Ps 23", "Matt 5:3-7:29", "Ps 23-24". Returns null if malformed or out of range. */
export function parseRef(ref: string): ParsedRef | null {
  const m = RE.exec(ref.trim());
  if (!m) return null;
  const book = BOOK_INDEX[m[1]];
  if (book === undefined) return null;
  const c1 = +m[2];
  const v1 = m[3] ? +m[3] : undefined;
  let c2 = c1, v2: number | undefined = v1;
  if (m[4]) {
    if (m[5]) { c2 = +m[4]; v2 = +m[5]; }
    else if (v1 !== undefined) { v2 = +m[4]; }
    else { c2 = +m[4]; }
  }
  const ch = (counts as number[][])[book];
  const ok = (c: number, v?: number) => c >= 1 && c <= ch.length && (v === undefined || (v >= 1 && v <= ch[c - 1]));
  if (!ok(c1, v1) || !ok(c2, v2)) return null;
  if (c2 < c1 || (c2 === c1 && v1 !== undefined && v2 !== undefined && v2 < v1)) return null;
  return { book, c1, v1, c2, v2 };
}

export function bookName(i: number) { return BOOKS[i].name; }
