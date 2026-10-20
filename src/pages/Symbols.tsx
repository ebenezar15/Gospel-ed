import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Fuse from 'fuse.js';
import { symbols, guideById } from '../data';
import { PageHeader, Refs, Conf, Empty } from '../components/ui';
import type { SymbolT } from '../schemas';

const CAT_LABEL: Record<SymbolT['category'], string> = {
  number: 'Numbers', colour: 'Colours', animal: 'Animals', plant: 'Plants & trees', object: 'Objects', nature: 'Nature', place: 'Places',
  body: 'Body', 'metal-stone': 'Metals & stones', garment: 'Clothing', action: 'Actions', 'person-figure': 'Figures',
};
const SWATCH: Record<string, string> = { white: '#f4f1ea', red: '#a8322a', scarlet: '#a8322a', purple: '#6a2a8a', blue: '#1d4ea6', black: '#1f1f1c', green: '#2c6e45', gold: '#b8892b', pale: '#9aa58a' };

function Glyph({ s }: { s: SymbolT }) {
  if (s.category === 'number') { const m = /^[\d,.\s½-]+/.exec(s.name); return <span className="display text-3xl text-accent tabular leading-none">{m ? m[0].trim() : s.name.split(' ')[0]}</span>; }
  if (s.category === 'colour') { const k = Object.keys(SWATCH).find((c) => s.id.includes(c) || s.name.toLowerCase().includes(c)); return <span className="w-9 h-9 rounded-full border border-line inline-block" style={{ background: k ? SWATCH[k] : 'rgb(var(--accent))' }} />; }
  return <span className="w-9 h-9 rounded-full inline-flex items-center justify-center display text-lg" style={{ background: 'rgb(var(--accent) / .12)', color: 'rgb(var(--accent))' }}>{s.name[0]}</span>;
}

export default function Symbols() {
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('');
  const fuse = useMemo(() => new Fuse(symbols, { keys: ['name', 'original', 'plain', 'meanings.meaning'], threshold: 0.3, ignoreLocation: true }), []);
  let list = q ? fuse.search(q).map((r) => r.item) : symbols;
  if (cat) list = list.filter((s) => s.category === cat);
  const sel = symbols.find((s) => s.id === sp.get('s'));
  const cats = (Object.keys(CAT_LABEL) as SymbolT['category'][]).filter((c) => symbols.some((s) => s.category === c));
  const guide = guideById.get('types-shadows-and-symbols');
  return (
    <div>
      <PageHeader eyebrow="Imagery & symbols" title="The Language of Pictures">
        Numbers, colours, animals, objects and places the Bible uses as images: what each meant to its first readers, where it appears, and how far each reading is shared. Tap a symbol to open it.
      </PageHeader>
      <div className="card p-3 mb-4 grid gap-2 md:grid-cols-[2fr_1fr]">
        <input id="sym-q" className="input" placeholder="Search a symbol or meaning (e.g. seven, lamb, oil, holiness)…" value={q} onChange={(e) => setQ(e.target.value)} />
        {guide && <Link to={`/guides/${guide.id}`} className="btn justify-center">How to read symbols wisely →</Link>}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-5"><button className={`btn !py-1 ${!cat ? 'btn-primary' : ''}`} onClick={() => setCat('')}>All ({symbols.length})</button>{cats.map((c) => <button key={c} className={`btn !py-1 ${cat === c ? 'btn-primary' : ''}`} onClick={() => setCat(c)}>{CAT_LABEL[c]}</button>)}</div>
      <AnimatePresence mode="wait">{sel && (
        <motion.article key={sel.id} className="card p-5 md:p-6 mb-6" initial={{ opacity: 0.5, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          <div className="flex justify-between gap-3 items-start">
            <div className="flex items-center gap-4"><Glyph s={sel} /><div><div className="eyebrow">{CAT_LABEL[sel.category]}</div><h2 className="text-3xl">{sel.name}</h2>{sel.original && <div className="font-orig text-muted" dir="auto">{sel.original}</div>}</div></div>
            <button className="btn !px-3" onClick={() => setSp({}, { replace: true })} aria-label="Close">✕</button>
          </div>
          <p className="font-serif text-[1.25rem] leading-relaxed mt-3 max-w-[72ch]">{sel.plain}</p>
          <div className="eyebrow mt-5 mb-2">What it can mean</div>
          <ol className="space-y-3">{sel.meanings.map((m, i) => (
            <motion.li key={i} className="card p-4" initial={{ opacity: 0.5, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
              <div className="flex flex-wrap items-baseline gap-2"><span className="display text-lg">{m.meaning}</span>{m.confidence !== 'biblical' && <Conf c={m.confidence} small />}</div>
              <p className="font-serif text-[1.02rem] mt-0.5">{m.note}</p><div className="mt-1.5"><Refs refs={m.refs} max={5} /></div>
            </motion.li>))}</ol>
          <div className="grid gap-3 md:grid-cols-2 mt-4">
            <div className="card p-4"><div className="eyebrow mb-1">In the Old Testament</div><p className="font-serif">{sel.otUsage}</p></div>
            <div className="card p-4"><div className="eyebrow mb-1">In the New Testament</div><p className="font-serif">{sel.ntUsage}</p></div>
          </div>
          {sel.caution && <aside className="mt-4 rounded-xl border p-4" style={{ borderColor: 'rgb(var(--warn) / .5)', background: 'rgb(var(--warn) / .06)' }}><div className="eyebrow mb-1" style={{ color: 'rgb(var(--warn))' }}>Don’t over-read it</div><p className="text-[.95rem]">{sel.caution}</p></aside>}
          {sel.related.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5 items-center"><span className="eyebrow mr-1">Related</span>{sel.related.map((r) => { const s = symbols.find((x) => x.id === r); return s ? <button key={r} className="chip hover:border-accent" onClick={() => setSp({ s: s.id }, { replace: true })}>{s.name}</button> : r.startsWith('/') ? <Link key={r} to={r} className="chip hover:border-accent">{r.split('/').pop()!.replace(/-/g, ' ')}</Link> : null; })}</div>}
        </motion.article>
      )}</AnimatePresence>
      {!list.length ? <Empty>{symbols.length ? 'Nothing matches that search.' : 'The symbol dictionary is being written.'}</Empty> : (
        <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {list.map((s, i) => (
            <motion.button key={s.id} onClick={() => { setSp({ s: s.id }, { replace: true }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`card p-3 text-left hover:border-accent flex flex-col gap-2 ${sel?.id === s.id ? '!border-accent' : ''}`}
              initial={{ opacity: 0.5, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.01, 0.4) }}>
              <Glyph s={s} />
              <span className="font-semibold leading-tight">{s.name}</span>
              <span className="text-xs text-muted line-clamp-2">{s.meanings.slice(0, 3).map((m) => m.meaning).join(' · ')}</span>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
