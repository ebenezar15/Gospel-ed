import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import BibleMap, { type MapRoute } from '../components/BibleMap';
import { Section, Refs, Ref, Conf, Paras, Empty, PageHeader, Tabs, Bookmark, Rich } from '../components/ui';
import { MindMap, FlowChart, ArgumentGraph, AudienceDonut, TimeBar, Misreadings, ConnectionStar, bookName } from '../components/StudyViz';
import { books, studyById, deepById } from '../data';
import type { BookStudyT, BookT, PlaceT } from '../schemas';

const pin = (id: string, name: string, coords: [number, number]): PlaceT => ({ id, names: [{ era: '', name }], coords, coordConfidence: 'debated', type: 'city', refs: [], summary: '' });

function FromToMap({ s }: { s: BookStudyT }) {
  const a = s.writtenFrom.coords, b = s.writtenTo.coords;
  const places: PlaceT[] = [];
  if (a) places.push(pin('from', `Written: ${s.writtenFrom.place}`, a));
  if (b && (!a || a[0] !== b[0] || a[1] !== b[1])) places.push(pin('to', `To: ${s.writtenTo.place}`, b));
  if (!places.length) return null;
  const routes: MapRoute[] = a && b && places.length === 2 ? [{ id: 'letter', color: 'rgb(var(--accent))', coords: [a, b], dashed: true }] : [];
  const pts = places.map((p) => p.coords);
  const focus: [number, number, number, number] = [Math.min(...pts.map((p) => p[0])) - 7, Math.min(...pts.map((p) => p[1])) - 4.5, Math.max(...pts.map((p) => p[0])) + 7, Math.max(...pts.map((p) => p[1])) + 4.5];
  return <BibleMap places={places} routes={routes} height={360} focus={focus} label={`Where ${bookName(s.id)} was written and sent`} highlight="from" />;
}

/** The study block shown on every book page. */
export function BookStudyBlock({ b }: { b: BookT }) {
  const s = studyById.get(b.id);
  const deep = deepById.get(b.id);
  if (!s) return null;
  return (
    <div>
      <motion.p className="display text-2xl md:text-3xl leading-snug my-6 max-w-[48ch]" initial={{ opacity: 0.5 }} animate={{ opacity: 1 }}>“{s.oneLine}”</motion.p>
      {deep && <Link to={`/books/${b.id}/deep`} className="card p-4 mb-6 flex items-center justify-between gap-3 hover:border-accent border-2" style={{ borderColor: 'rgb(var(--accent) / .5)' }}>
        <span><span className="eyebrow">Deep study · chapter by chapter</span><span className="display text-xl block">{deep.title}</span><span className="text-sm text-muted">{deep.chapters.length} chapters · argument map · Jewish lens · {deep.misreadings.length} common misreadings</span></span><span className="text-2xl text-accent">→</span></Link>}

      <Section title="Who, where and to whom">
        <div className="grid gap-3 md:grid-cols-3 mb-4">
          <div className="card p-4"><div className="eyebrow mb-1">Author</div><div className="display text-xl">{s.author.name}</div><p className="font-serif text-[1rem] mt-1"><Rich text={s.author.who} /></p><p className="text-sm text-muted mt-1.5"><Rich text={s.author.howWeKnow} /></p><div className="mt-1.5"><Conf c={s.author.confidence} small /></div>
            {s.author.otherWritings.length > 0 && <div className="mt-2 text-sm"><span className="text-muted">Also wrote: </span>{s.author.otherWritings.join(', ')}</div>}</div>
          <div className="card p-4"><div className="eyebrow mb-1">Written from</div><div className="display text-xl">{s.writtenFrom.place}</div><p className="font-serif text-[1rem] mt-1"><Rich text={s.writtenFrom.note} /></p><div className="mt-1.5"><Conf c={s.writtenFrom.confidence} small /></div></div>
          <div className="card p-4"><div className="eyebrow mb-1">Written to</div><div className="display text-xl">{s.writtenTo.who}</div><div className="text-sm text-muted">{s.writtenTo.place}</div><p className="font-serif text-[1rem] mt-1"><Rich text={s.writtenTo.situation} /></p><div className="mt-1.5"><Conf c={s.writtenTo.confidence} small /></div></div>
        </div>
        <FromToMap s={s} />
      </Section>

      <Section title="When: the world around it"><TimeBar written={b.date.year} setIn={s.setIn} events={s.worldEvents} /></Section>
      <Section title="Historical backdrop"><Paras text={s.backdrop} /></Section>
      <Section title="Mind map"><MindMap center={s.mindmap.center} branches={s.mindmap.branches} /></Section>
      <Section title="How the book moves"><FlowChart steps={s.flow} /></Section>
      <Section title="Cultural keys"><CultureCards items={s.culture} /></Section>
      <Section title="Through Jewish, covenant eyes"><div className="card p-5" style={{ background: 'rgb(var(--accent) / .05)' }}><Paras text={s.jewishLens} /></div></Section>
      <Section title="Key words"><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{s.keyWords.map((k) => <div key={k.word} className="card p-3"><div className="flex items-baseline gap-2 flex-wrap"><span className="display text-xl">{k.word}</span><i className="text-accent">{k.original}</i></div><p className="font-serif text-[.98rem] mt-1"><Rich text={k.meaning} /></p><div className="mt-1"><Refs refs={k.refs} max={3} /></div></div>)}</div></Section>
      {s.connections.length > 0 && <Section title="Connections to other books"><ConnectionStar id={b.id} links={s.connections} /></Section>}
      <Section title="Pointing to Jesus"><Paras text={s.jesusLens} /></Section>
      {s.misreadings.length > 0 && <Section title="Common misreadings"><Misreadings list={s.misreadings} /></Section>}
      <Section title="Relevance"><div className="grid gap-3 md:grid-cols-2"><div className="card p-4"><div className="eyebrow mb-1">For the first hearers</div><Paras text={s.relevance.then} /></div><div className="card p-4"><div className="eyebrow mb-1">For readers today</div><Paras text={s.relevance.now} /></div></div></Section>
      {s.sources.length > 0 && <Section title="Further reading"><ul className="text-sm space-y-1">{s.sources.map((x, i) => <li key={i}><b>{x.author}</b>, <i>{x.title}</i>{x.year ? ` (${x.year})` : ''}{x.confidence === 'needs-verification' && <span className="text-muted"> · to verify</span>}</li>)}</ul></Section>}
    </div>
  );
}

function CultureCards({ items }: { items: { term: string; explain: string; refs: string[] }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="grid gap-2 sm:grid-cols-2">{items.map((c, i) => (
      <button key={i} onClick={() => setOpen(open === i ? null : i)} className={`card p-4 text-left ${open === i ? 'border-accent' : ''}`}>
        <div className="flex justify-between gap-2"><span className="font-semibold">{c.term}</span><span className="text-muted">{open === i ? '−' : '+'}</span></div>
        {open === i ? <div className="mt-1.5"><p className="font-serif text-[1rem]"><Rich text={c.explain} /></p><div className="mt-1.5" onClick={(e) => e.stopPropagation()}><Refs refs={c.refs} max={3} /></div></div> : <p className="text-sm text-muted line-clamp-1 mt-0.5"><Rich text={c.explain} /></p>}
      </button>))}</div>
  );
}

/* ---------- deep study page: /books/:id/deep ---------- */
type DTab = 'chapters' | 'argument' | 'lens' | 'misreadings' | 'views' | 'terms';
const LENSES = [['background', 'History behind it'], ['culture', 'Cultural world'], ['jewishLens', 'Jewish covenant lens'], ['audience', 'First hearers'], ['today', 'For today']] as const;

export function DeepStudyPage() {
  const { id = '' } = useParams();
  const [sp, setSp] = useSearchParams();
  const d = deepById.get(id);
  const b = books.find((x) => x.id === id);
  const tab = (sp.get('tab') as DTab) || 'chapters';
  const ch = Number(sp.get('ch') || 1);
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); n.set(k, v); setSp(n, { replace: true }); };
  if (!d || !b) return <Empty>No deep study for “{id}” yet. <Link to="/books" className="text-accent">Back to the library</Link>.</Empty>;
  const c = d.chapters.find((x) => x.n === ch) ?? d.chapters[0];
  const others = [...deepById.keys()].filter((x) => x !== id);
  return (
    <div>
      <div className="text-sm mb-3 flex flex-wrap justify-between gap-2"><Link to={`/books/${id}`} className="text-muted hover:text-accent">← {b.name} overview</Link>
        <span className="flex flex-wrap gap-3">{others.map((o) => <Link key={o} to={`/books/${o}/deep`} className="text-muted hover:text-accent">{bookName(o)}</Link>)}</span></div>
      <PageHeader eyebrow={`Deep study · ${b.name}`} title={d.title} actions={<Bookmark path={`/books/${id}/deep`} />}>{d.intro.split(/\n\n/)[0]}</PageHeader>
      <Tabs value={tab} onChange={(t) => set('tab', t)} tabs={[
        { id: 'chapters', label: `Chapter by chapter (${d.chapters.length})` }, { id: 'argument', label: 'Argument map' }, { id: 'lens', label: 'The Jewish lens' },
        { id: 'misreadings', label: `Misreadings (${d.misreadings.length})` }, { id: 'views', label: 'Scholarly views' }, { id: 'terms', label: 'Key terms' },
      ]} />

      {tab === 'chapters' && c && <div>
        <div className="flex flex-wrap gap-1.5 mb-4" role="tablist" aria-label="Chapters">{d.chapters.map((x) => (
          <button key={x.n} onClick={() => set('ch', String(x.n))} title={x.title} className={`w-10 h-10 rounded-xl border tabular font-semibold relative transition-colors ${x.n === c.n ? 'bg-accent text-accentInk border-accent' : 'border-line hover:border-accent bg-surface'}`}>
            {x.n}{x.misread && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full" style={{ background: 'rgb(var(--warn))' }} title="has a common misreading" />}</button>))}
          <span className="text-xs text-muted self-center ml-2"><span className="inline-block w-2.5 h-2.5 rounded-full align-middle" style={{ background: 'rgb(var(--warn))' }} /> = often misread</span></div>
        <ChapterView c={c} bookAbbr={b.abbr} key={c.n} />
        <div className="flex justify-between mt-4">{c.n > 1 ? <button className="btn" onClick={() => set('ch', String(c.n - 1))}>← Chapter {c.n - 1}</button> : <span />}{c.n < d.chapters.length && <button className="btn btn-primary" onClick={() => set('ch', String(c.n + 1))}>Chapter {c.n + 1} →</button>}</div>
      </div>}

      {tab === 'argument' && <div><p className="font-serif text-[1.08rem] mb-4 max-w-[70ch]">How the whole book's argument moves. Tap a box to read that step; arrows show what each part leads to.</p><ArgumentGraph nodes={d.argument} />
        {d.audienceMap.length > 0 && <Section title="Who was in the room"><AudienceDonut groups={d.audienceMap} /></Section>}</div>}

      {tab === 'lens' && <div className="max-w-4xl"><Paras text={d.lens.summary} /><div className="grid gap-3 md:grid-cols-2 mt-5">{d.lens.principles.map((p, i) => (
        <motion.div key={i} className="card p-4" initial={{ opacity: 0.5, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}><div className="flex gap-2 items-baseline"><span className="display text-2xl rubric tabular">{i + 1}</span><span className="font-semibold">{p.name}</span></div><p className="font-serif mt-1"><Rich text={p.text} /></p><div className="mt-1.5"><Refs refs={p.refs} max={4} /></div></motion.div>))}</div>
        {d.intro.split(/\n\n/).length > 1 && <Section title="Introduction"><Paras text={d.intro.split(/\n\n/).slice(1).join('\n\n')} /></Section>}</div>}

      {tab === 'misreadings' && <div><p className="font-serif text-[1.08rem] mb-4 max-w-[70ch]">Each card sets a common popular reading beside the reading from the book's Jewish, first-century setting, and then lets careful traditional scholars answer. Often both sides agree that popular preaching flattened something richer.</p><Misreadings list={d.misreadings} /></div>}

      {tab === 'views' && <div className="grid gap-3 md:grid-cols-2">{d.perspectives.map((p) => (
        <div key={p.name} className="card p-4"><div className="display text-xl">{p.name}</div><div className="text-sm text-muted">{p.who}</div><p className="font-serif mt-2"><Rich text={p.summary} /></p>
          <div className="grid gap-2 sm:grid-cols-2 mt-3 text-sm"><div className="rounded-lg p-2.5" style={{ background: 'rgb(var(--good) / .1)' }}><b>Strengths.</b> <Rich text={p.strengths} /></div><div className="rounded-lg p-2.5" style={{ background: 'rgb(var(--warn) / .1)' }}><b>Critiques.</b> <Rich text={p.critiques} /></div></div></div>))}</div>}

      {tab === 'terms' && <div className="grid gap-2 md:grid-cols-2">{d.keyTerms.map((k) => (
        <div key={k.term} className="card p-4"><div className="flex items-baseline gap-2 flex-wrap"><span className="display text-xl">{k.term}</span><i className="text-accent">{k.original}</i></div>
          <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 mt-2 text-[.95rem] font-serif"><span className="eyebrow pt-1">Usual</span><span><Rich text={k.usual} /></span><span className="eyebrow pt-1">In context</span><span><Rich text={k.inContext} /></span></div><div className="mt-1.5"><Refs refs={k.refs} max={4} /></div></div>))}</div>}

      {d.sources.length > 0 && <Section title="Further reading"><ul className="text-sm space-y-1">{d.sources.map((x, i) => <li key={i}><b>{x.author}</b>, <i>{x.title}</i>{x.year ? ` (${x.year})` : ''}</li>)}</ul></Section>}
    </div>
  );
}

function ChapterView({ c, bookAbbr }: { c: NonNullable<ReturnType<typeof deepById.get>>['chapters'][number]; bookAbbr: string }) {
  const [lens, setLens] = useState<(typeof LENSES)[number][0]>('background');
  return (
    <motion.article initial={{ opacity: 0.5, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-wrap items-baseline gap-3"><span className="display text-5xl rubric tabular">{c.n}</span><h2 className="display text-3xl leading-tight">{c.title}</h2><Ref r={`${bookAbbr} ${c.n}`} /></div>
      <p className="font-serif text-[1.15rem] mt-2 max-w-[72ch]"><Rich text={c.summary} /></p>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] mt-4">
        <div className="card p-4">
          <div className="flex flex-wrap gap-1 mb-3">{LENSES.map(([k, l]) => <button key={k} onClick={() => setLens(k)} className={`chip !text-[.8rem] !py-1 ${lens === k ? '!bg-accent !text-accentInk !border-accent' : 'hover:border-accent'}`}>{l}</button>)}</div>
          <motion.div key={lens} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}><Paras text={c[lens]} /></motion.div>
          <div className="mt-3"><Refs refs={c.keyRefs} max={6} /></div>
        </div>
        <div className="space-y-3">
          {c.echoes.length > 0 && <div className="card p-4"><div className="eyebrow mb-2">Old Testament echoes</div><ul className="space-y-2">{c.echoes.map((e, i) => <li key={i} className="flex gap-2 items-start"><span className="shrink-0"><Ref r={e.ref} /></span><span className="font-serif text-[.98rem]"><Rich text={e.note} /></span></li>)}</ul></div>}
          {c.misread && <div className="card p-4" style={{ borderColor: 'rgb(var(--warn) / .6)' }}><div className="eyebrow mb-1">Often misread</div><p className="font-serif text-[.98rem]"><b>Popular:</b> <Rich text={c.misread.popular} /></p><p className="font-serif text-[.98rem] mt-1.5"><b>In context:</b> <Rich text={c.misread.better} /></p></div>}
        </div>
      </div>
    </motion.article>
  );
}
