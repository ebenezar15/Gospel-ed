/**
 * npm run validate [file ...]
 * - Zod-validates every content file (or only the named ones)
 * - checks every scripture Ref exists (book, chapter, verse) against the KJV verse-count table
 * - checks cross-links (personIds, placeIds, eraIds) resolve when the target files exist
 * - lists needs-verification items
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { FILES } from '../src/schemas';
import { parseRef } from '../src/lib/refs';

const dir = join(import.meta.dirname, '..', 'content');
const only = process.argv.slice(2).map((f) => f.replace(/^content\//, ''));
const names = Object.keys(FILES) as (keyof typeof FILES)[];
const load = (f: string) => (existsSync(join(dir, f)) ? JSON.parse(readFileSync(join(dir, f), 'utf8')) : null);

let errors = 0;
const err = (f: string, msg: string) => { errors++; console.log(`✗ ${f}: ${msg}`); };
const verify: string[] = [];

// collect id sets for cross-link checks
const people = new Set<string>(), places = new Set<string>(), eras = new Set<string>();
for (const f of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => `people-${n}.json`)) (load(f) ?? []).forEach((p: any) => people.add(p.id));
(load('places.json') ?? []).forEach((p: any) => places.add(p.id));
(load('eras.json') ?? []).forEach((e: any) => eras.add(e.id));
const bookIds = new Set<string>([...(load('books-ot.json') ?? []), ...(load('books-nt.json') ?? [])].map((b: any) => b.id));
const missing = { people: new Map<string, string[]>(), places: new Map<string, string[]>() };
const note = (m: Map<string, string[]>, id: string, where: string) => { if (!m.has(id)) m.set(id, []); m.get(id)!.push(where); };

function walk(f: string, v: any, path: string) {
  if (Array.isArray(v)) { v.forEach((x, i) => walk(f, x, `${path}[${i}]`)); return; }
  if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) {
      const p = `${path}.${k}`;
      if ((k === 'refs' || k === 'keyRefs' || k === 'keyVerses') && Array.isArray(x)) x.forEach((r: string) => { if (!parseRef(r)) err(f, `bad ref "${r}" at ${p}`); });
      else if ((k === 'ref' || k === 'keyVerse') && typeof x === 'string' && !parseRef(x)) err(f, `bad ref "${x}" at ${p}`);
      if (x === 'needs-verification') verify.push(`${f} ${p}`);
      if (people.size && (k === 'personIds' || (path.endsWith('.family') && ['parents', 'spouses', 'children', 'siblings'].includes(k))) && Array.isArray(x)) x.forEach((id: string) => !people.has(id) && note(missing.people, id, `${f}${p}`));
      if (people.size && (k === 'personId' || ((k === 'from' || k === 'to') && f.startsWith('relationships'))) && typeof x === 'string' && !people.has(x)) note(missing.people, x, `${f}${p}`);
      if (places.size && (k === 'placeIds') && Array.isArray(x)) x.forEach((id: string) => !places.has(id) && note(missing.places, id, `${f}${p}`));
      if (places.size && k === 'placeId' && typeof x === 'string' && !places.has(x)) note(missing.places, x, `${f}${p}`);
      if (eras.size && (k === 'eraIds') && Array.isArray(x)) x.forEach((id: string) => !eras.has(id) && err(f, `unknown era "${id}" at ${p}`));
      if (eras.size && k === 'eraId' && typeof x === 'string' && !eras.has(x)) err(f, `unknown era "${x}" at ${p}`);
      if (k === 'bookId' && typeof x === 'string' && bookIds.size && !bookIds.has(x)) err(f, `unknown book id "${x}" at ${p}`);
      walk(f, x, p);
    }
  }
}

for (const f of names) {
  if (only.length && !only.includes(f)) continue;
  const data = load(f);
  if (data === null) { if (only.length) err(f, 'file missing'); else console.log(`· ${f}: not yet written`); continue; }
  const r = FILES[f].safeParse(data);
  if (!r.success) r.error.issues.slice(0, 25).forEach((i) => err(f, `${i.path.join('.')}: ${i.message}`));
  const ids = new Set<string>();
  if (Array.isArray(data)) data.forEach((d: any) => { if (d?.id) { if (ids.has(d.id)) err(f, `duplicate id ${d.id}`); ids.add(d.id); } });
  walk(f, data, '');
  if (f.startsWith('course-') && data?.lessons) {
    for (const l of data.lessons) for (const v of l.visuals) {
      const where = `lesson ${l.n} visual "${v.title}"`;
      if (v.kind === 'map') { const ids = new Set(v.nodes.map((n: any) => n.id)); v.edges.forEach((e: any) => { if (!ids.has(e.from) || !ids.has(e.to)) err(f, `${where}: edge ${e.from}->${e.to} missing node`); }); }
      if (v.kind === 'decision') { const ids = new Set([...v.nodes.map((n: any) => n.id), ...v.results.map((r: any) => r.id)]); if (!ids.has(v.start)) err(f, `${where}: start missing`); v.nodes.forEach((n: any) => n.options.forEach((o: any) => { if (!ids.has(o.next)) err(f, `${where}: ${n.id} -> missing ${o.next}`); })); }
      if (v.kind === 'sorter') { const ids = new Set(v.categories.map((c: any) => c.id)); v.items.forEach((it: any) => { if (!ids.has(it.answer)) err(f, `${where}: answer "${it.answer}" is not a category id`); }); }
      if (v.kind === 'compare') v.rows.forEach((r: any) => { if (r.cells.length !== v.columns.length) err(f, `${where}: row "${r.label}" has ${r.cells.length} cells, expected ${v.columns.length}`); });
    }
    for (const l of data.lessons) for (const k of l.links) if (!k.to.startsWith('/')) err(f, `lesson ${l.n}: link "${k.to}" must start with /`);
  }
  if (f.startsWith('topic-') && data?.map) {
    const ids = new Set(data.map.nodes.map((n: any) => n.id)), groups = new Set(data.groups.map((g: any) => g.id));
    data.map.edges.forEach((e: any) => { if (!ids.has(e.from) || !ids.has(e.to)) err(f, `map edge ${e.from}->${e.to} points to a missing node`); });
    [...data.map.nodes, ...data.gallery.items].forEach((n: any) => { if (!groups.has(n.group)) err(f, `unknown group "${n.group}" on ${n.id}`); });
    const dn = new Set([...data.decision.nodes.map((n: any) => n.id), ...data.decision.results.map((r: any) => r.id)]);
    if (!dn.has(data.decision.start)) err(f, `decision start "${data.decision.start}" missing`);
    data.decision.nodes.forEach((n: any) => n.options.forEach((o: any) => { if (!dn.has(o.next)) err(f, `decision ${n.id} option -> missing "${o.next}"`); }));
    data.compare.rows.forEach((r: any) => { if (r.cells.length !== data.compare.columns.length) err(f, `compare row "${r.label}" has ${r.cells.length} cells, expected ${data.compare.columns.length}`); });
  }
  console.log(`✓ ${f}: ${Array.isArray(data) ? data.length + ' items' : 'object'}`);
}

const show = (label: string, m: Map<string, string[]>) => {
  if (!m.size) return;
  console.log(`\n⚠ ${m.size} unresolved ${label} ids (warning):`);
  [...m.entries()].slice(0, 60).forEach(([id, w]) => console.log(`  ${id}  ← ${w.length}× e.g. ${w[0]}`));
};
show('person', missing.people); show('place', missing.places);
if (verify.length) console.log(`\n? ${verify.length} needs-verification items`);
console.log(errors ? `\n${errors} errors` : '\nNo errors.');
process.exit(errors ? 1 : 0);
