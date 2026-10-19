import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { types, guideById } from '../data';
import { PageHeader, Refs, SourceLine, Empty } from '../components/ui';
import { parseRef } from '../lib/refs';
import type { TypeLinkT } from '../schemas';

const WARRANT: Record<TypeLinkT['warrant'], { label: string; c: string; note: string }> = {
  'explicit-nt': { label: 'New Testament says so', c: 'good', note: 'A New Testament writer draws this link directly.' },
  'implicit-nt': { label: 'New Testament implies it', c: 'accent', note: 'The New Testament echoes it clearly without naming it a type.' },
  traditional: { label: 'Church tradition', c: 'gold', note: 'Drawn by the Church Fathers and later interpreters.' },
  speculative: { label: 'Speculative', c: 'muted', note: 'Suggested by some readers; handle with care.' },
};
const refOrder = (refs: string[]) => { const p = refs.map(parseRef).find(Boolean); return p ? p.book * 1000 + p.c1 : 99999; };
const order = (t: TypeLinkT) => refOrder(t.type.refs);

export default function Types() {
  const [sp, setSp] = useSearchParams();
  const [cat, setCat] = useState('');
  const [warrants, setWarrants] = useState<string[]>(Object.keys(WARRANT));
  const [hover, setHover] = useState<string | null>(null);
  const list = useMemo(() => types.filter((t) => (!cat || t.category === cat) && warrants.includes(t.warrant)).sort((a, b) => order(a) - order(b)), [cat, warrants]);
  const right = useMemo(() => [...list].sort((a, b) => refOrder(a.antitype.refs) - refOrder(b.antitype.refs)), [list]);
  const sel = types.find((t) => t.id === sp.get('t'));
  const cats = [...new Set(types.map((t) => t.category))];
  const ROW = 44, H = Math.max(list.length * ROW + 20, 120);
  const guide = guideById.get('types-shadows-and-symbols');
  const pick = (id: string) => { setSp({ t: id }, { replace: true }); setTimeout(() => document.getElementById('type-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); };
  return (
    <div>
      <PageHeader eyebrow="Types & shadows" title="From Shadow to Substance">
        The New Testament reads people, events and institutions of the Old as “shadows” of what was coming (Col 2:17; Heb 10:1). Each line crosses from an Old Testament shadow (left, in Bible order) to its New Testament fulfilment (right, in Bible order). Hover a name to trace its line. Colour shows how firmly the link rests on the New Testament itself.
      </PageHeader>
      {guide && <Link to={`/guides/${guide.id}`} className="card p-4 mb-5 flex flex-wrap items-center justify-between gap-2 hover:border-accent"><span><span className="eyebrow block">Read first</span><span className="display text-lg">{guide.title}</span></span><span className="text-accent font-semibold text-sm">How to read types wisely →</span></Link>}
      <div className="flex flex-wrap gap-1.5 mb-2"><button className={`btn !py-1 ${!cat ? 'btn-primary' : ''}`} onClick={() => setCat('')}>All</button>{cats.map((c) => <button key={c} className={`btn !py-1 capitalize ${cat === c ? 'btn-primary' : ''}`} onClick={() => setCat(c)}>{c}s</button>)}</div>
      <div className="flex flex-wrap gap-1.5 mb-4">{(Object.keys(WARRANT) as TypeLinkT['warrant'][]).map((w) => <label key={w} className="chip cursor-pointer" title={WARRANT[w].note}><input type="checkbox" id={`w-${w}`} checked={warrants.includes(w)} onChange={() => setWarrants((x) => x.includes(w) ? x.filter((y) => y !== w) : [...x, w])} /><span className="w-3 h-1 rounded" style={{ background: `rgb(var(--${WARRANT[w].c}))` }} />{WARRANT[w].label}</label>)}</div>
      {!list.length ? <Empty>{types.length ? 'Nothing matches those filters.' : 'The types are being written.'}</Empty> : (
        <>
          <div className="card p-3 hidden md:block">
            <div className="grid grid-cols-[1fr_minmax(120px,1fr)_1fr] text-center eyebrow mb-2"><span>Old Testament shadow</span><span /><span>New Testament fulfilment</span></div>
            <div className="grid grid-cols-[1fr_minmax(120px,1fr)_1fr]">
              <ul>{list.map((t) => <li key={t.id} style={{ height: ROW }} className="flex items-center justify-end pr-2"><button onMouseEnter={() => setHover(t.id)} onMouseLeave={() => setHover(null)} onClick={() => pick(t.id)} className={`text-right rounded-full px-3 py-1 text-sm transition-colors ${sel?.id === t.id || hover === t.id ? 'bg-accent/10 text-accent font-semibold' : 'hover:bg-sunk'}`}>{t.type.name}</button></li>)}</ul>
              <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" className="w-full" style={{ height: list.length * ROW }} aria-hidden>
                {list.map((t, i) => { const y = i * ROW + ROW / 2; const y2 = right.indexOf(t) * ROW + ROW / 2; const on = sel?.id === t.id || hover === t.id; return (
                  <motion.path key={t.id} d={`M0 ${y} C 55 ${y}, 45 ${y2}, 100 ${y2}`} fill="none" stroke={`rgb(var(--${WARRANT[t.warrant].c}))`} strokeWidth={on ? 3 : 1.4} 
                    strokeDasharray={t.warrant === 'speculative' ? '3 3' : t.warrant === 'traditional' ? '6 3' : undefined} vectorEffect="non-scaling-stroke"
                    initial={{ opacity: 0 }} animate={{ opacity: hover && !on ? 0.2 : on ? 1 : 0.7 }} transition={{ duration: 0.4, delay: Math.min(i * 0.02, 0.5) }} />); })}
              </svg>
              <ul>{right.map((t) => <li key={t.id} style={{ height: ROW }} className="flex items-center pl-2"><button onMouseEnter={() => setHover(t.id)} onMouseLeave={() => setHover(null)} onClick={() => pick(t.id)} className={`text-left rounded-full px-3 py-1 text-sm transition-colors ${sel?.id === t.id || hover === t.id ? 'bg-accent/10 text-accent font-semibold' : 'hover:bg-sunk'}`}>{t.antitype.name}</button></li>)}</ul>
            </div>
          </div>
          <ul className="md:hidden space-y-2">{list.map((t) => <li key={t.id}><button onClick={() => pick(t.id)} className="card p-3 w-full text-left"><span className="font-semibold">{t.type.name}</span> <span className="text-accent">→</span> <span>{t.antitype.name}</span><span className="block h-1 mt-2 rounded" style={{ background: `rgb(var(--${WARRANT[t.warrant].c}))` }} /></button></li>)}</ul>
        </>
      )}
      {sel && (
        <motion.article id="type-detail" key={sel.id} className="card p-5 md:p-6 mt-6 scroll-mt-6" initial={{ opacity: 0.001, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-wrap gap-2 items-center"><span className="eyebrow capitalize">{sel.category}</span><span className="chip" style={{ borderColor: `rgb(var(--${WARRANT[sel.warrant].c}))` }}>{WARRANT[sel.warrant].label}</span></div>
          <h2 className="text-3xl mt-1">{sel.title}</h2>
          <p className="font-serif text-[1.25rem] leading-relaxed mt-2 max-w-[72ch]">{sel.plain}</p>
          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] items-stretch mt-5">
            <div className="card p-4"><div className="eyebrow mb-1">Shadow</div><div className="display text-xl">{sel.type.name}</div><p className="font-serif mt-1">{sel.type.summary}</p><div className="mt-2"><Refs refs={sel.type.refs} /></div></div>
            <div className="hidden md:flex items-center text-3xl text-accent">→</div>
            <div className="card p-4" style={{ borderColor: 'rgb(var(--accent) / .5)' }}><div className="eyebrow mb-1 !text-accent">Fulfilment</div><div className="display text-xl">{sel.antitype.name}</div><p className="font-serif mt-1">{sel.antitype.summary}</p><div className="mt-2"><Refs refs={sel.antitype.refs} /></div></div>
          </div>
          {sel.correspondences.length > 0 && (
            <div className="mt-5"><div className="eyebrow mb-2">How they match</div>
              <div className="scroll-x"><table className="w-full min-w-[480px] text-[.95rem]"><tbody>{sel.correspondences.map((c, i) => (
                <motion.tr key={i} className="border-b border-line/60" initial={{ opacity: 0.001, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08 }}>
                  <td className="py-2 pr-3 font-serif w-1/2">{c.type}</td><td className="text-accent px-2">⟶</td><td className="py-2 font-serif w-1/2">{c.antitype}</td></motion.tr>))}</tbody></table></div>
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2 mt-5">
            <div className="card p-4"><div className="eyebrow mb-1">Where the shadow falls short</div><p className="font-serif">{sel.differences}</p></div>
            <div className="card p-4"><div className="eyebrow mb-1">Biblical basis for the link</div>{sel.warrantRefs.length ? <Refs refs={sel.warrantRefs} /> : <p className="text-sm text-muted">No direct New Testament statement; this link comes from later interpreters.</p>}<p className="text-sm text-muted mt-2">{WARRANT[sel.warrant].note}</p></div>
          </div>
          {sel.fathers.length > 0 && <div className="mt-4"><div className="eyebrow mb-1.5">In the early church</div><ul className="space-y-1.5 text-[.95rem]">{sel.fathers.map((f, i) => <li key={i}><b>{f.who}:</b> <span className="font-serif">{f.note}</span>{f.source && <span className="text-muted text-sm"> (<SourceLine s={f.source} />)</span>}</li>)}</ul></div>}
          {sel.caution && <aside className="mt-4 rounded-xl border p-4" style={{ borderColor: 'rgb(var(--warn) / .5)', background: 'rgb(var(--warn) / .06)' }}><div className="eyebrow mb-1" style={{ color: 'rgb(var(--warn))' }}>Handle with care</div><p className="text-[.95rem]">{sel.caution}</p></aside>}
        </motion.article>
      )}
    </div>
  );
}
