import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { books, canonFormation, people, studyById, deepById, bookStudies } from '../data';
import { PageHeader, Section, Refs, DateWithConf, Paras, Empty, Bookmark, Tabs } from '../components/ui';
import BibleMap, { type MapRoute } from '../components/BibleMap';
import { BookStudyBlock } from './BookStudy';
import { fmtYear } from '../components/StudyViz';
import type { PlaceT } from '../schemas';
import type { BookT, OutlineNodeT } from '../schemas';
import { useUI } from '../store';
import { t, tv } from '../i18n';

const SECTIONS: [string, number, number][] = [
  [t('Law'), 0, 5], [t('History'), 5, 17], [t('Wisdom & Poetry'), 17, 22], [t('Major Prophets'), 22, 27], [t('Minor Prophets'), 27, 39],
  [t('Gospels'), 39, 43], [t('Acts'), 43, 44], [t('Letters of Paul'), 44, 57], [t('Hebrews & General Letters'), 57, 65], [t('Revelation'), 65, 66],
];

type LTab = 'library' | 'when' | 'where' | 'web' | 'deep';
export default function Books() {
  const [sp, setSp] = useSearchParams();
  const tab = (sp.get('tab') as LTab) || 'library';
  return (
    <div>
      <PageHeader eyebrow={t('Sixty-six books')} title={t('The Library')}>
        {t('Every book with its author, setting, first audience, cultural background and a Jewish, covenant reading, drawn as mind maps, flowcharts and maps. Five books also have chapter-by-chapter deep studies.')}
      </PageHeader>
      <Tabs value={tab} onChange={(v) => setSp({ tab: v }, { replace: true })} tabs={[
        { id: 'library', label: t('All books') }, { id: 'deep', label: t('Deep studies ({n})', { n: deepById.size }), hidden: !deepById.size }, { id: 'when', label: t('When written') },
        { id: 'where', label: t('Where written'), hidden: !bookStudies.length }, { id: 'web', label: t('Connection web'), hidden: !bookStudies.length },
      ]} />
      {tab === 'when' && <WhenWritten />}
      {tab === 'where' && <WhereWritten />}
      {tab === 'web' && <BookWeb />}
      {tab === 'deep' && <DeepList />}
      {tab === 'library' && <Shelf />}
    </div>
  );
}

function Shelf() {
  return (
    <div>
      {!books.length && <Empty>{t('The book guides are still being written.')}</Empty>}
      {SECTIONS.map(([name, a, b]) => {
        const list = books.slice(a, b);
        if (!list.length) return null;
        return (
          <section key={name} className="mb-7">
            <h2 className="display text-2xl rubric mb-2">{name}</h2>
            <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              {list.map((bk, i) => (
                <motion.div key={bk.id} initial={{ opacity: 0.5, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                  <Link to={`/books/${bk.id}`} className="card p-3 h-full block hover:border-accent group relative overflow-hidden">
                    <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: `rgb(var(--${bk.testament === 'OT' ? 'ot' : 'nt'}))` }} />
                    <div className="display text-lg leading-tight group-hover:text-accent">{bk.name}</div>
                    <div className="text-xs text-muted">{tv(bk.genre)}</div>
                    {deepById.has(bk.id) && <span className="chip !text-[.65rem] mt-1.5 !border-accent text-accent">{t('deep study')}</span>}
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        );
      })}
      {canonFormation && (
        <Section title={t('How the canon formed')}>
          <Outline nodes={canonFormation.outline} root={t('Canon')} />
          {canonFormation.canonNote && <Paras text={canonFormation.canonNote} className="mt-4" />}
        </Section>
      )}
    </div>
  );
}

function Outline({ nodes, root }: { nodes: OutlineNodeT[]; root: string }) {
  const reduced = useUI((s) => s.reducedMotion);
  return (
    <div className="flex flex-col items-center">
      <div className="card px-4 py-2 display text-xl border-accent2 border-2">{root}</div>
      <motion.div className="w-0.5 h-5 bg-accent2" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} />
      <div className="relative w-full">
        <div className="hidden md:block absolute left-[8%] right-[8%] top-0 h-0.5 bg-accent2/60" />
        <div className="grid gap-3 md:pt-5" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${nodes.length > 5 ? 150 : 190}px, 1fr))` }}>
          {nodes.map((n, i) => (
            <motion.div key={i} className="card p-3 relative" initial={{ opacity: 0.5, y: reduced ? 0 : 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduced ? 0 : 0.15 + i * 0.12 }}>
              <span className="hidden md:block absolute -top-5 left-1/2 w-0.5 h-5 bg-accent2/60" />
              <div className="flex gap-2 items-baseline"><span className="display text-xl rubric tabular">{i + 1}</span><span className="font-semibold leading-tight">{n.title}</span></div>
              <div className="mt-1"><Refs refs={n.refs} max={2} /></div>
              {n.children?.length ? <ul className="mt-2 space-y-1.5 border-l border-line pl-2.5">{n.children.map((c, j) => <motion.li key={j} className="text-sm font-serif" initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} transition={{ delay: reduced ? 0 : 0.4 + i * 0.12 + j * 0.05 }}>{c.title} {c.refs.length > 0 && <span className="text-muted text-xs">{c.refs[0]}</span>}</motion.li>)}</ul> : null}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BookPage() {
  const { id = '' } = useParams();
  const i = books.findIndex((b) => b.id === id);
  const b: BookT | undefined = books[i];
  if (!b) return <Empty>{t('No book with the id “{id}”.', { id })} <Link to="/books" className="text-accent">{t('See the library')}</Link>.</Empty>;
  const cast = people.filter((p) => p.books?.includes(b.abbr)).slice(0, 30);
  return (
    <div>
      <div className="text-sm mb-3 flex justify-between"><Link to="/books" className="text-muted hover:text-accent">{t('← Library')}</Link>
        <span className="flex gap-3">{books[i - 1] && <Link className="text-muted hover:text-accent" to={`/books/${books[i - 1].id}`}>← {books[i - 1].name}</Link>}{books[i + 1] && <Link className="text-muted hover:text-accent" to={`/books/${books[i + 1].id}`}>{books[i + 1].name} →</Link>}</span></div>
      <PageHeader eyebrow={`${b.testament === 'OT' ? t('Old Testament') : t('New Testament')} · ${tv(b.genre)}`} title={b.name} actions={<Bookmark path={`/books/${b.id}`} />}>{b.purpose}</PageHeader>
      <div className="grid gap-3 md:grid-cols-2 mb-6">
        <div className="card p-4"><div className="eyebrow mb-1">{t('Authorship: traditional view')}</div><p className="font-serif">{b.authorship.traditional}</p></div>
        <div className="card p-4"><div className="eyebrow mb-1">{t('Authorship: critical scholarship')}</div><p className="font-serif">{b.authorship.scholarly ?? t('Broadly agrees with the traditional view.')}</p></div>
        <div className="card p-4"><div className="eyebrow mb-1">{t('Date')}</div><DateWithConf d={b.date} /></div>
        <div className="card p-4"><div className="eyebrow mb-1">{t('Audience & setting')}</div><p className="font-serif">{b.audience}. {b.setting}</p></div>
      </div>
      <BookStudyBlock b={b} />
      <Section title={t('Outline')}><Outline nodes={b.outline} root={b.name} /></Section>
      <Section title={t('Themes')}><div className="flex flex-wrap gap-2">{b.themes.map((th) => <span key={th} className="chip !text-sm !py-1 !whitespace-normal">{th}</span>)}</div></Section>
      <Section title={t('Key verses')}><Refs refs={b.keyRefs} /></Section>
      <Section title={t('Place in the whole story')}><Paras text={b.bigStory} /></Section>
      {b.canonNote && <Section title={t('Canon note')}><Paras text={b.canonNote} /></Section>}
      {cast.length > 0 && <Section title={t('People in this book')}><div className="flex flex-wrap gap-1.5">{cast.map((p) => <Link key={p.id} to={`/people/${p.id}`} className="chip hover:border-accent">{p.names.primary}</Link>)}</div></Section>}
    </div>
  );
}

/* ---------- library-wide visuals ---------- */
const GROUP = (i: number) => SECTIONS.find(([, a, b]) => i >= a && i < b)?.[0] ?? '';

function WhenWritten() {
  const nav = useNavigate();
  const [hover, setHover] = useState<string | null>(null);
  const [mode, setMode] = useState<'written' | 'both'>('both');
  const [range, setRange] = useState<'all' | 'OT' | 'NT'>('all');
  const [lo, hi] = range === 'NT' ? [-10, 130] : range === 'OT' ? [-1500, -100] : [-1500, 120];
  const x = (y: number) => ((Math.max(lo, Math.min(hi, y)) - lo) / (hi - lo)) * 100;
  const ticks = range === 'NT' ? [0, 20, 40, 60, 80, 100, 120] : range === 'OT' ? [-1400, -1200, -1000, -800, -600, -400, -200] : [-1400, -1200, -1000, -800, -600, -400, -200, 0, 100];
  return (
    <div>
      <p className="font-serif text-[1.08rem] max-w-[70ch] mb-3">{t('Each row is a book. The dot is when most scholars think it was written (whiskers show the range of serious proposals); the soft bar is the span of history the book describes. Many Old Testament books were completed long after the events they tell.')}</p>
      <div className="flex flex-wrap gap-2 mb-3"><button className={`btn ${mode === 'both' ? 'btn-primary' : ''}`} onClick={() => setMode('both')}>{t('Written + story span')}</button><button className={`btn ${mode === 'written' ? 'btn-primary' : ''}`} onClick={() => setMode('written')}>{t('Writing dates only')}</button>
        <span className="w-px bg-line mx-1" />{(['all', 'OT', 'NT'] as const).map((r) => <button key={r} className={`btn ${range === r ? 'btn-primary' : ''}`} onClick={() => setRange(r)}>{r === 'all' ? t('Whole Bible') : r === 'OT' ? t('Zoom: Old Testament') : t('Zoom: New Testament')}</button>)}</div>
      <div className="card p-3 overflow-x-auto"><div className="min-w-[640px]">
        <div className="relative h-5 ml-28 text-[.65rem] text-muted">{ticks.map((tk) => <span key={tk} className="absolute -translate-x-1/2" style={{ left: `${x(tk)}%` }}>{fmtYear(tk)}</span>)}</div>
        {books.map((b, i) => { if (range !== 'all' && b.testament !== range) return null; const st = studyById.get(b.id); const alts = (b.date.alternatives ?? []).map((a) => a.year); const mn = Math.min(b.date.year, ...alts), mx = Math.max(b.date.year, ...alts); const g = GROUP(i); const first = i === 0 || GROUP(i - 1) !== g; return (
          <div key={b.id}>
            {first && <div className="eyebrow mt-2 mb-0.5">{g}</div>}
            <button onClick={() => nav(`/books/${b.id}`)} onMouseEnter={() => setHover(b.id)} onMouseLeave={() => setHover(null)} className={`flex items-center w-full h-5 group ${hover === b.id ? 'bg-sunk' : ''}`}>
              <span className="w-28 shrink-0 text-left text-[.75rem] truncate group-hover:text-accent">{b.name}</span>
              <span className="relative flex-1 h-full">
                {ticks.map((tk) => <span key={tk} className="absolute top-0 bottom-0 w-px bg-line/60" style={{ left: `${x(tk)}%` }} />)}
                {mode === 'both' && st?.setIn && <span className="absolute top-1.5 h-2 rounded-full" style={{ left: `${x(st.setIn.from)}%`, width: `${Math.max(0.5, x(st.setIn.to) - x(st.setIn.from))}%`, background: `rgb(var(--${b.testament === 'OT' ? 'ot' : 'nt'}) / .3)` }} />}
                {mx > mn && <span className="absolute top-[9px] h-0.5" style={{ left: `${x(mn)}%`, width: `${x(mx) - x(mn)}%`, background: 'rgb(var(--muted) / .6)' }} />}
                <span className="absolute top-[5px] w-2.5 h-2.5 -ml-[5px] rounded-full border border-surface" style={{ left: `${x(b.date.year)}%`, background: `rgb(var(--${b.testament === 'OT' ? 'ot' : 'nt'}))` }} />
              </span>
            </button>
          </div>); })}
      </div></div>
      {hover && (() => { const b = books.find((x) => x.id === hover)!; return <div className="text-sm mt-2"><b>{b.name}</b>: {t('written c. {year}', { year: fmtYear(b.date.year) })}{studyById.get(b.id)?.setIn && <>; {t('describes {from} to {to}', { from: fmtYear(studyById.get(b.id)!.setIn!.from), to: fmtYear(studyById.get(b.id)!.setIn!.to) })}</>}</div>; })()}
    </div>
  );
}

function WhereWritten() {
  const [sel, setSel] = useState<string | null>(null);
  const [tst, setT] = useState<'all' | 'OT' | 'NT'>('NT');
  const list = bookStudies.filter((s) => s.writtenFrom.coords && (tst === 'all' || books.find((b) => b.id === s.id)?.testament === tst));
  const { places, routes } = useMemo(() => {
    const at = new Map<string, { coords: [number, number]; names: string[] }>();
    const add = (c: [number, number], n: string) => { const k = c.join(','); const e = at.get(k) ?? { coords: c, names: [] }; e.names.push(n); at.set(k, e); };
    list.forEach((s) => add(s.writtenFrom.coords!, s.id));
    const places: PlaceT[] = [...at.entries()].map(([k, e]) => ({ id: k, names: [{ era: '', name: e.names.map((id) => books.find((b) => b.id === id)?.abbr ?? id).join(' · ') }], coords: e.coords, coordConfidence: 'debated', type: 'city', refs: [], summary: '' }));
    const routes: MapRoute[] = list.filter((s) => s.writtenTo.coords && s.writtenTo.coords.join() !== s.writtenFrom.coords!.join()).map((s) => ({ id: s.id, color: sel === s.id ? 'rgb(var(--accent))' : `rgb(var(--${books.find((b) => b.id === s.id)?.testament === 'OT' ? 'ot' : 'nt'}) / .55)`, coords: [s.writtenFrom.coords!, s.writtenTo.coords!], dashed: true }));
    return { places, routes };
  }, [list, sel]);
  const cur = sel ? studyById.get(sel) : null;
  return (
    <div>
      <p className="font-serif text-[1.08rem] max-w-[70ch] mb-3">{t('Dots mark where each book was most likely written; dashed lines run to its first readers. Most locations are debated, so read them as best guesses.')}</p>
      <div className="flex gap-2 mb-3">{(['NT', 'OT', 'all'] as const).map((x) => <button key={x} className={`btn ${tst === x ? 'btn-primary' : ''}`} onClick={() => setT(x)}>{x === 'all' ? t('All') : x === 'OT' ? t('Old Testament') : t('New Testament')}</button>)}</div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <BibleMap places={places} routes={routes} height={520} label={t('Where the books were written')} onPlace={(k) => { const id = list.find((s) => s.writtenFrom.coords!.join(',') === k)?.id; if (id) setSel(id); }} />
        <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
          {cur && <div className="card p-4 border-accent"><Link to={`/books/${cur.id}`} className="display text-2xl hover:text-accent">{books.find((b) => b.id === cur.id)?.name} →</Link><p className="text-sm mt-1"><b>{t('Written from')}:</b> {cur.writtenFrom.place} · <b>{t('Written to')}:</b> {cur.writtenTo.who}</p><p className="font-serif mt-1.5">{cur.writtenTo.situation}</p></div>}
          <div className="flex flex-wrap gap-1.5">{list.map((s) => <button key={s.id} onClick={() => setSel(s.id)} className={`chip ${sel === s.id ? '!border-accent text-accent' : ''}`}>{books.find((b) => b.id === s.id)?.name}</button>)}</div>
        </div>
      </div>
    </div>
  );
}

function BookWeb() {
  const [sel, setSel] = useState<string | null>('romans');
  const nav = useNavigate();
  const n = books.length, R = 300, C = 340;
  const pos = (i: number) => { const a = (i / n) * Math.PI * 2 - Math.PI / 2; return [C + Math.cos(a) * R, C + Math.sin(a) * R, a] as const; };
  const idx = new Map(books.map((b, i) => [b.id, i]));
  const links = bookStudies.flatMap((s) => s.connections.filter((c) => idx.has(c.bookId)).map((c) => ({ a: s.id, b: c.bookId, how: c.how, refs: c.refs })));
  const mine = sel ? links.filter((l) => l.a === sel || l.b === sel) : [];
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <div className="card p-2"><svg viewBox="0 0 680 680" className="w-full h-auto" role="img" aria-label={t('Web of connections between the books')}>
        {links.map((l, i) => { const [x1, y1] = pos(idx.get(l.a)!); const [x2, y2] = pos(idx.get(l.b)!); const on = sel && (l.a === sel || l.b === sel); return <path key={i} d={`M${x1} ${y1} Q${C} ${C} ${x2} ${y2}`} fill="none" stroke={on ? 'rgb(var(--accent))' : 'rgb(var(--border))'} strokeOpacity={on ? 0.95 : sel ? 0.25 : 0.6} strokeWidth={on ? 1.8 : 0.7} />; })}
        {books.map((b, i) => { const [x, y, a] = pos(i); const on = sel === b.id; const deg = (a * 180) / Math.PI; const flip = deg > 90 && deg < 270; return (
          <g key={b.id} className="cursor-pointer" onClick={() => setSel(b.id)} onDoubleClick={() => nav(`/books/${b.id}`)}>
            <circle cx={x} cy={y} r={on ? 7 : 4.5} fill={`rgb(var(--${b.testament === 'OT' ? 'ot' : 'nt'}))`} />
            <text transform={`translate(${x},${y}) rotate(${flip ? deg + 180 : deg})`} x={flip ? -10 : 10} y={3} textAnchor={flip ? 'end' : 'start'} fontSize={on ? 11 : 9} fontWeight={on ? 700 : 500} className="fill-current">{b.abbr}</text>
          </g>); })}
      </svg></div>
      <div>
        <p className="font-serif text-[1.05rem] mb-2">{t('Every curve is a connection the studies trace between two books: quotations, shared themes, a story continued. Tap a book on the ring.')}</p>
        {sel && <div className="card p-4"><Link to={`/books/${sel}`} className="display text-2xl hover:text-accent">{books.find((b) => b.id === sel)?.name} →</Link><div className="text-sm text-muted mb-2">{t('{n} connections', { n: mine.length })}</div>
          <ul className="space-y-2 max-h-[480px] overflow-y-auto pr-1">{mine.map((l, i) => { const other = l.a === sel ? l.b : l.a; return <li key={i} className="border-l-2 border-accent/40 pl-2.5"><button className="font-semibold hover:text-accent" onClick={() => setSel(other)}>{books.find((b) => b.id === other)?.name}</button><p className="font-serif text-[.95rem]">{l.how}</p><Refs refs={l.refs} max={3} /></li>; })}</ul></div>}
      </div>
    </div>
  );
}

function DeepList() {
  return (
    <div className="grid gap-3 md:grid-cols-2">{[...deepById.values()].map((d, i) => (
      <motion.div key={d.id} initial={{ opacity: 0.5, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
        <Link to={`/books/${d.id}/deep`} className="card p-5 block h-full hover:border-accent">
          <div className="eyebrow">{books.find((b) => b.id === d.id)?.name} · {t('{n} chapters', { n: d.chapters.length })}</div>
          <div className="display text-2xl leading-tight mt-0.5">{d.title}</div>
          <p className="font-serif mt-2 line-clamp-4">{d.intro.split(/\n\n/)[0]}</p>
          <div className="flex flex-wrap gap-1.5 mt-3"><span className="chip">{t('argument map')}</span><span className="chip">{t('{n} misreadings', { n: d.misreadings.length })}</span><span className="chip">{t('{n} scholarly views', { n: d.perspectives.length })}</span><span className="chip">{t('{n} key terms', { n: d.keyTerms.length })}</span></div>
          <div className="flex gap-1 mt-3">{d.chapters.map((c) => <span key={c.n} className="h-1.5 flex-1 rounded-full" style={{ background: c.misread ? 'rgb(var(--warn))' : 'rgb(var(--accent) / .35)' }} />)}</div>
        </Link>
      </motion.div>))}</div>
  );
}
