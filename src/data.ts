/** Loads every /content/*.json file at build time and builds the cross-reference indexes the UI uses. */
import type {
  PersonT, PlaceT, EraT, TimelineEventT, EmpireT, JourneyT, RelationshipT, RosterT, BookT, DebateT,
  GospelNodeT, EmphasisT, DeepDiveT, PlainLayerT, CanonBookT, ParadoxT, BibleHistoryT, TypeLinkT, SymbolT, GodT, GodsExtraT, CouncilT, BookStudyT, DeepStudyT, GuidingQuestionT, TermT, EarlyViewT, ContextItemT, OccupationT, GiftsListT, StudyPathT, QuizQT,
} from './schemas';

import { applyOverlay } from './i18n';

const files = import.meta.glob('../content/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;
for (const [k, v] of Object.entries(files)) applyOverlay(k.replace('../content/', ''), v);
const get = <T,>(name: string, fallback: T): T => (files[`../content/${name}`] as T) ?? fallback;
const many = <T,>(prefix: string): T[] =>
  Object.keys(files).filter((k) => k.startsWith(`../content/${prefix}`)).sort().flatMap((k) => files[k] as T[]);

export const people: PersonT[] = many<PersonT>('people-');
export const places: PlaceT[] = get('places.json', []);
export const eras: EraT[] = get('eras.json', []);
export const timeline: TimelineEventT[] = [...get<TimelineEventT[]>('timeline.json', [])].sort((a, b) => a.date.year - b.date.year);
export const empires: EmpireT[] = get('empires.json', []);
export const journeys: JourneyT[] = get('journeys.json', []);
export const relationships: RelationshipT[] = many<RelationshipT>('relationships');
export const rosters: RosterT[] = get('rosters.json', []);
const allBooks: BookT[] = [...get<BookT[]>('books-ot.json', []), ...get<BookT[]>('books-nt.json', [])];
export const canonFormation = allBooks.find((b) => b.id === 'canon-formation');
export const books: BookT[] = allBooks.filter((b) => b.id !== 'canon-formation');
export const debates: DebateT[] = many<DebateT>('debates-');
export const eschatology: DebateT[] = get('eschatology.json', []);
export const movements: DebateT[] = get('movements.json', []);
export const allDebates: DebateT[] = [...debates, ...eschatology, ...movements];
export const gospelNodes: GospelNodeT[] = [...get<GospelNodeT[]>('gospel-history.json', [])].sort((a, b) => a.year - b.year);
export const emphasis: EmphasisT | null = get('gospel-emphasis.json', null);
export const gospelQuestions: GuidingQuestionT[] = get('gospel-questions.json', []);
export const afterlifeTerms: TermT[] = get('afterlife-terms.json', []);
export const afterlifeViews: EarlyViewT[] = get('afterlife-views.json', []);
export const contextItems: ContextItemT[] = get('context.json', []);
export const occupations: OccupationT[] = get('occupations.json', []);
export const giftsLists: GiftsListT[] = get('gifts.json', []);
export const studyPaths: StudyPathT[] = get('study-paths.json', []);
export const quiz: QuizQT[] = get('quiz.json', []);
export const guides: DeepDiveT[] = many<DeepDiveT>('guides-');
export const canonBooks: CanonBookT[] = many<CanonBookT>('canon-');
export const paradoxes: ParadoxT[] = many<ParadoxT>('paradoxes-');
export const bibleHistory: BibleHistoryT = get('bible-history.json', { milestones: [], manuscripts: [], variants: [], translations: [], materials: [] });
export const types: TypeLinkT[] = get('types.json', []);
export const symbols: SymbolT[] = many<SymbolT>('symbols-');
export const gods: GodT[] = many<GodT>('gods-').filter((g: any) => g && g.id && g.cultCenter);
export const godById = new Map(gods.map((g) => [g.id, g]));
export const godsExtra: GodsExtraT = get('gods-extra.json', { overview: { plain: '', keyPoints: [] }, showdowns: [], nameShifts: [], finds: [], purge: [], demonChain: [] });
export const council: CouncilT | null = get('council.json', null);
export const bookStudies: BookStudyT[] = [...many<BookStudyT>('study-ot-'), ...many<BookStudyT>('study-nt-')].filter((x) => x && x.id && x.mindmap);
export const studyById = new Map(bookStudies.map((x) => [x.id, x]));
export const deepStudies: DeepStudyT[] = Object.keys(files).filter((k) => k.startsWith('../content/deep-')).map((k) => files[k] as DeepStudyT).filter((x) => x && x.id);
export const deepById = new Map(deepStudies.map((x) => [x.id, x]));
export const guideById = new Map(guides.map((g) => [g.id, g]));
/** Plain-language summaries keyed by debate id (merged from plain-*.json overlays). */
export const plain: PlainLayerT = Object.assign({}, get<PlainLayerT>('plain-1.json', {}), get<PlainLayerT>('plain-2.json', {}));

/** Every theologian / figure named in any debate, merged by name, with the positions they shaped. */
export type FigureEntry = { name: string; lived: string; profession: string; bio: string; works: DebateT['positions'][number]['figures'][number]['works']; roles: { debateId: string; debateTitle: string; positionId: string; positionName: string; role: string; category: string }[] };
export const figures: FigureEntry[] = (() => {
  const m = new Map<string, FigureEntry>();
  allDebates.forEach((d) => d.positions.forEach((p) => p.figures.forEach((f) => {
    const key = f.name.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase();
    const e = m.get(key) ?? { name: f.name, lived: f.lived, profession: f.profession, bio: f.bio, works: [], roles: [] };
    if (f.bio.length > e.bio.length) { e.bio = f.bio; e.profession = f.profession; e.lived = f.lived; }
    f.works.forEach((w) => { if (!e.works.some((x) => x.title === w.title)) e.works.push(w); });
    e.roles.push({ debateId: d.id, debateTitle: d.title, positionId: p.id, positionName: p.name, role: f.role, category: d.category });
    m.set(key, e);
  })));
  const year = (s: string) => { const x = /(\d{2,4})/.exec(s); return x ? +x[1] * (/BC/.test(s) ? -1 : 1) : 3000; };
  return [...m.values()].sort((a, b) => year(a.lived) - year(b.lived));
})();

/* ---------- indexes ---------- */
export const personById = new Map(people.map((p) => [p.id, p]));
export const placeById = new Map(places.map((p) => [p.id, p]));
export const eraById = new Map(eras.map((e) => [e.id, e]));
export const debateById = new Map(allDebates.map((d) => [d.id, d]));
export const journeyById = new Map(journeys.map((j) => [j.id, j]));
export const bookByAbbr = new Map(books.map((b) => [b.abbr, b]));

/** The biblical-era name of a place; with a year, the name in use in that era (era-aware labels on the time slider). */
export function placeLabel(p: PlaceT, year?: number): string {
  const ancient = p.names.filter((n) => n.era !== 'modern');
  if (year !== undefined) {
    const inUse = ancient.filter((n) => (eraById.get(n.era)?.start ?? Infinity) <= year).at(-1);
    if (inUse) return inUse.name;
  }
  return (ancient[0] ?? p.names[0]).name;
}
export const modernName = (p: PlaceT) => p.names.find((n) => n.era === 'modern')?.name;
export const placeName = (id: string) => { const p = placeById.get(id); return p ? placeLabel(p) : id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()); };
export const personName = (id: string) => personById.get(id)?.names.primary ?? id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** Best-known span of a person's life or activity, or null when the text gives no anchor. */
export function lifespan(p: PersonT): [number, number] | null {
  const s = p.born?.year ?? p.active?.[0].year ?? p.events.find((e) => e.year !== undefined)?.year;
  const e = p.died?.year ?? p.active?.[1].year ?? [...p.events].reverse().find((x) => x.year !== undefined)?.year;
  if (s === undefined && e === undefined) return null;
  const a = s ?? e! - 40, b = e ?? s! + 40;
  return [Math.min(a, b), Math.max(a, b)];
}
export function alive(year: number) { return people.filter((p) => { const l = lifespan(p); return l && l[0] <= year && year <= l[1]; }); }
export function contemporaries(p: PersonT) {
  const l = lifespan(p); if (!l) return [];
  return people.filter((q) => { if (q.id === p.id) return false; const m = lifespan(q); return m && m[0] <= l[1] && l[0] <= m[1]; })
    .map((q) => { const m = lifespan(q)!; return { p: q, overlap: Math.min(l[1], m[1]) - Math.max(l[0], m[0]) }; })
    .sort((a, b) => b.overlap - a.overlap);
}

/* ---------- relationship graph (relationships.json + each person's family block) ---------- */
export type Edge = { from: string; to: string; type: RelationshipT['type']; note?: string; refs: string[] };
const edgeKey = (a: string, b: string, t: string) => [a, b].sort().join('|') + '|' + t;
export const edges: Edge[] = (() => {
  const seen = new Set<string>(); const out: Edge[] = [];
  const add = (e: Edge) => { if (!personById.has(e.from) || !personById.has(e.to) || e.from === e.to) return; const k = edgeKey(e.from, e.to, e.type === 'spouse' ? 'spouse' : e.type); if (seen.has(k)) return; seen.add(k); out.push(e); };
  relationships.forEach((r) => add({ ...r }));
  people.forEach((p) => {
    p.family.children.forEach((c) => add({ from: p.id, to: c, type: 'family', refs: [], note: 'parent of' }));
    p.family.parents.forEach((c) => add({ from: c, to: p.id, type: 'family', refs: [], note: 'parent of' }));
    p.family.spouses.forEach((c) => add({ from: p.id, to: c, type: 'spouse', refs: [] }));
    p.family.siblings.forEach((c) => add({ from: p.id, to: c, type: 'family', refs: [], note: 'sibling' }));
  });
  return out;
})();
export const adjacency = (() => {
  const m = new Map<string, Edge[]>();
  edges.forEach((e) => { [e.from, e.to].forEach((id) => { if (!m.has(id)) m.set(id, []); m.get(id)!.push(e); }); });
  return m;
})();
/** Breadth-first shortest path between two people over all relationship types. */
export function findPath(a: string, b: string): Edge[] | null {
  if (a === b) return [];
  const prev = new Map<string, Edge>(); const q = [a]; const seen = new Set([a]);
  while (q.length) {
    const cur = q.shift()!;
    for (const e of adjacency.get(cur) ?? []) {
      const nxt = e.from === cur ? e.to : e.from;
      if (seen.has(nxt)) continue; seen.add(nxt); prev.set(nxt, e);
      if (nxt === b) { const path: Edge[] = []; let x = b; while (x !== a) { const pe = prev.get(x)!; path.unshift(pe); x = pe.from === x ? pe.to : pe.from; } return path; }
      q.push(nxt);
    }
  }
  return null;
}
/** Parent → children map for genealogy trees (family edges with note 'parent of', plus relationships typed family from parent to child). */
export const childrenOf = (() => {
  const m = new Map<string, Set<string>>();
  const add = (p: string, c: string) => { if (!personById.has(p) || !personById.has(c)) return; if (!m.has(p)) m.set(p, new Set()); m.get(p)!.add(c); };
  people.forEach((p) => { p.family.children.forEach((c) => add(p.id, c)); p.family.parents.forEach((x) => add(x, p.id)); });
  const fam = relationships.filter((r) => r.type === 'family' && !/sibling|brother|sister|cousin|in-law|uncle|aunt|nephew|niece|kinsman|relative/i.test(r.note ?? ''));
  fam.filter((r) => !/descendant|ancestor/i.test(r.note ?? '')).forEach((r) => add(r.from, r.to));
  // "Descendant" links bridge skipped generations; add one only when no existing chain already connects the pair,
  // shortest spans first, so a direct Adam → Jesus shortcut never bypasses the recorded line.
  const reach = (a: string, b: string) => { const st = [a], seen = new Set([a]); while (st.length) { const x = st.pop()!; if (x === b) return true; m.get(x)?.forEach((c) => { if (!seen.has(c)) { seen.add(c); st.push(c); } }); } return false; };
  const mid = (id: string) => { const p = personById.get(id); const l = p && lifespan(p); return l ? l[0] : 0; };
  fam.filter((r) => /descendant|ancestor/i.test(r.note ?? '')).sort((x, y) => (mid(x.to) - mid(x.from)) - (mid(y.to) - mid(y.from))).forEach((r) => { if (!reach(r.from, r.to)) add(r.from, r.to); });
  return m;
})();
