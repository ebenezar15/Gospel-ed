/** Renderers for the course's interactive visuals. One component per `Visual.kind`. */
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactFlow, Background, Controls, MarkerType, type Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Refs, Ref, Rich, Paras } from './ui';
import { t, fmtYear } from '../i18n';
import type { VisualT } from '../schemas';

const color = (c: string, a = 1) => `rgb(var(--${c}) / ${a})`;
const PAL = ['accent', 'nt', 'ot', 'accent-2', 'good', 'warn'];
type V<K extends VisualT['kind']> = Extract<VisualT, { kind: K }>;

export function VisualView({ v }: { v: VisualT }) {
  return (
    <div className="card p-4 md:p-5">
      <div className="eyebrow mb-0.5">{t(KIND_LABEL[v.kind])}</div>
      <h3 className="display text-2xl leading-tight">{v.title}</h3>
      {v.intro && <p className="font-serif text-[1.03rem] mt-1 max-w-[72ch]"><Rich text={v.intro} /></p>}
      <div className="mt-4">
        {v.kind === 'flow' && <Flow v={v} />}
        {v.kind === 'chain' && <Chain v={v} />}
        {v.kind === 'compare' && <Compare v={v} />}
        {v.kind === 'spectrum' && <Spectrum v={v} />}
        {v.kind === 'timeline' && <Timeline v={v} />}
        {v.kind === 'map' && <ConceptMap v={v} />}
        {v.kind === 'decision' && <Decision v={v} />}
        {v.kind === 'sorter' && <Sorter v={v} />}
        {v.kind === 'lenses' && <Lenses v={v} />}
        {v.kind === 'versions' && <Versions v={v} />}
        {v.kind === 'wordstudy' && <WordStudy v={v} />}
      </div>
    </div>
  );
}
const KIND_LABEL: Record<VisualT['kind'], string> = {
  flow: 'Flowchart', chain: 'Cause and effect', compare: 'Side by side', spectrum: 'Spectrum', timeline: 'Timeline', map: 'Concept map',
  decision: 'Decision guide', sorter: 'Try it yourself', lenses: 'One passage, several lenses', versions: 'Translations compared', wordstudy: 'Word study',
};

function Flow({ v }: { v: V<'flow'> }) {
  const [at, setAt] = useState(0); const s = v.steps[at];
  return (
    <div>
      <div className="flex flex-wrap items-center gap-y-2">{v.steps.map((st, i) => (
        <div key={i} className="flex items-center"><button onClick={() => setAt(i)} className={`rounded-xl border px-3 py-2 text-left text-sm font-semibold max-w-[11rem] leading-tight transition-colors ${i === at ? 'bg-accent text-accentInk border-accent' : i < at ? 'border-accent text-accent' : 'border-line'}`}><span className="tabular opacity-70 mr-1">{i + 1}</span>{st.label}</button>
          {i < v.steps.length - 1 && <svg width="22" height="12" className="shrink-0 mx-0.5" aria-hidden><path d="M1 6h16m-4-4 4 4-4 4" fill="none" stroke={i < at ? 'rgb(var(--accent))' : 'rgb(var(--border))'} strokeWidth="2" /></svg>}</div>))}</div>
      {s && <motion.div key={at} initial={{ opacity: 0.4, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-xl p-4" style={{ background: color('accent', 0.06) }}>
        <div className="font-semibold">{s.label}</div><p className="font-serif mt-1"><Rich text={s.detail} /></p>{s.refs?.length ? <div className="mt-2"><Refs refs={s.refs} max={4} /></div> : null}
        <div className="flex justify-between mt-3"><button className="btn" disabled={at === 0} onClick={() => setAt(at - 1)}>←</button><button className="btn btn-primary" disabled={at === v.steps.length - 1} onClick={() => setAt(at + 1)}>{t('Next step')} →</button></div>
      </motion.div>}
    </div>
  );
}

function Chain({ v }: { v: V<'chain'> }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <ol className="space-y-0">{v.links.map((l, i) => (
      <li key={i}>
        <motion.button initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} onClick={() => setOpen(open === i ? null : i)}
          className="w-full text-left rounded-xl border px-4 py-3 flex gap-3 items-start" style={{ borderColor: color(PAL[i % PAL.length], 0.6), background: color(PAL[i % PAL.length], open === i ? 0.12 : 0.05), marginLeft: `${Math.min(i, 6) * 0.9}rem`, width: `calc(100% - ${Math.min(i, 6) * 0.9}rem)` }}>
          <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ background: color(PAL[i % PAL.length]), color: 'rgb(var(--accent-ink))' }}>{i + 1}</span>
          <span className="min-w-0"><span className="font-semibold block">{l.label}</span>{open === i && <span className="font-serif block mt-1"><Rich text={l.detail} /></span>}</span>
        </motion.button>
        {i < v.links.length - 1 && <div className="h-5 flex items-center" style={{ marginLeft: `${Math.min(i, 6) * 0.9 + 1.2}rem` }}><span className="text-accent">↓</span><span className="text-xs text-muted ml-2">{t('leads to')}</span></div>}
      </li>))}</ol>
  );
}

function Compare({ v }: { v: V<'compare'> }) {
  const [col, setCol] = useState<number | null>(null);
  return (
    <div className="overflow-x-auto"><table className="w-full text-[.95rem] min-w-[560px]">
      <thead><tr><th className="p-2.5 text-left w-36" />{v.columns.map((h, i) => <th key={i} onClick={() => setCol(col === i ? null : i)} className={`p-2.5 text-left cursor-pointer ${col === i ? 'text-accent' : ''}`}>{h}</th>)}</tr></thead>
      <tbody>{v.rows.map((r, i) => <tr key={i} className="border-t border-line align-top"><th className="p-2.5 text-left font-semibold">{r.label}</th>{r.cells.map((c, j) => <td key={j} className="p-2.5 font-serif" style={col === j ? { background: color('accent', 0.08) } : col !== null ? { opacity: 0.55 } : undefined}><Rich text={c} /></td>)}</tr>)}</tbody>
    </table></div>
  );
}

function Spectrum({ v }: { v: V<'spectrum'> }) {
  const stops = [...v.stops].sort((a, b) => a.pos - b.pos);
  const [sel, setSel] = useState(Math.floor(stops.length / 2)); const cur = stops[sel];
  return (
    <div>
      <div className="mx-4 md:mx-10 pt-4 pb-4 md:pt-12 md:pb-12">
        <div className="relative h-3 rounded-full" style={{ background: `linear-gradient(90deg, ${color('nt', 0.7)}, ${color('accent', 0.4)}, ${color('ot', 0.7)})` }}>
          {stops.map((x, i) => (
            <button key={i} onClick={() => setSel(i)} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${x.pos}%` }} aria-label={x.label}>
              <span className={`block rounded-full border-[3px] transition-all ${i === sel ? 'w-7 h-7 bg-accent border-surface shadow-lg' : 'w-5 h-5 bg-surface border-accent'}`} />
              <span className={`hidden md:block absolute left-1/2 -translate-x-1/2 ${i % 2 ? 'top-9' : 'bottom-9'} text-[.72rem] leading-tight w-[5.5rem] text-center ${i === sel ? 'font-bold text-accent' : 'text-muted'}`}>{x.label}</span>
            </button>))}
        </div>
      </div>
      <div className="flex justify-between text-sm font-semibold mb-3 gap-4"><span className="max-w-[45%]">← {v.left}</span><span className="max-w-[45%] text-right">{v.right} →</span></div>
      <div className="md:hidden flex flex-wrap gap-1.5 mb-3">{stops.map((x, i) => <button key={i} onClick={() => setSel(i)} className={`chip ${i === sel ? '!bg-accent !text-accentInk !border-accent' : ''}`}>{x.label}</button>)}</div>
      {cur && <motion.div key={sel} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="rounded-xl p-4" style={{ background: color('accent', 0.06) }}><div className="font-semibold">{cur.label}</div><div className="text-sm text-muted">{cur.who}</div><p className="font-serif mt-1"><Rich text={cur.text} /></p></motion.div>}
    </div>
  );
}

function Timeline({ v }: { v: V<'timeline'> }) {
  const ev = [...v.events].sort((a, b) => a.year - b.year); const [sel, setSel] = useState(0); const e = ev[sel];
  return (
    <div>
      <div className="scroll-x"><ol className="flex min-w-max relative pt-1"><span className="absolute left-0 right-0 top-[26px] h-0.5 bg-line" />{ev.map((x, i) => (
        <li key={i} className="w-32 shrink-0"><button onClick={() => setSel(i)} className="w-full text-left px-1.5"><div className="text-xs tabular text-muted h-5">{fmtYear(x.year)}</div>
          <span className={`block w-3.5 h-3.5 rounded-full border-2 border-accent my-1 ${i === sel ? 'bg-accent scale-125' : 'bg-surface'}`} /><div className={`text-sm leading-tight ${i === sel ? 'font-semibold text-accent' : ''}`}>{x.label}</div></button></li>))}</ol></div>
      {e && <motion.div key={sel} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="rounded-xl p-4 mt-2" style={{ background: color('accent', 0.06) }}><div className="eyebrow">{fmtYear(e.year)}</div><div className="font-semibold">{e.label}</div><p className="font-serif mt-1"><Rich text={e.text} /></p>
        <div className="flex justify-between mt-2"><button className="btn" disabled={sel === 0} onClick={() => setSel(sel - 1)}>←</button><button className="btn" disabled={sel === ev.length - 1} onClick={() => setSel(sel + 1)}>→</button></div></motion.div>}
    </div>
  );
}

function ConceptMap({ v }: { v: V<'map'> }) {
  const [sel, setSel] = useState<string | null>(v.nodes[0]?.id ?? null);
  const { nodes, edges } = useMemo(() => {
    // radial layout: first node in the centre, the rest on a ring
    const n = v.nodes.length - 1;
    const nodes: Node[] = v.nodes.map((x, i) => {
      const a = ((i - 1) / Math.max(1, n)) * Math.PI * 2 - Math.PI / 2; const R = 120 + n * 14;
      const pos = i === 0 ? { x: 0, y: 0 } : { x: Math.cos(a) * R * 1.35, y: Math.sin(a) * R };
      return { id: x.id, position: pos, data: { label: x.label }, style: { width: 150, borderRadius: 14, padding: 8, fontSize: 13, fontWeight: 600, lineHeight: 1.2, background: sel === x.id ? 'rgb(var(--accent))' : 'rgb(var(--surface))', color: sel === x.id ? 'rgb(var(--accent-ink))' : 'rgb(var(--text))', border: `2px solid ${color(i === 0 ? 'accent' : PAL[i % PAL.length], 0.7)}` } };
    });
    const edges: Edge[] = v.edges.map((e, i) => { const on = sel === e.from || sel === e.to; return { id: `e${i}`, source: e.from, target: e.to, label: on ? e.label : undefined, animated: on, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: on ? 'rgb(var(--accent))' : 'rgb(var(--border))', strokeWidth: on ? 2 : 1.2 }, labelStyle: { fontSize: 11 }, labelBgStyle: { fill: 'rgb(var(--surface))' } }; });
    return { nodes, edges };
  }, [v, sel]);
  const n = v.nodes.find((x) => x.id === sel);
  return (
    <div>
      <div className="h-[420px] md:h-[480px] rounded-xl border border-line overflow-hidden"><ReactFlow nodes={nodes} edges={edges} fitView fitViewOptions={{ padding: 0.06 }} minZoom={0.2} maxZoom={1.6} nodesConnectable={false} onNodeClick={(_, x) => setSel(x.id)} proOptions={{ hideAttribution: true }}><Background gap={22} color="rgb(var(--border))" /><Controls showInteractive={false} /></ReactFlow></div>
      {n && <motion.div key={n.id} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="rounded-xl p-4 mt-3" style={{ background: color('accent', 0.06) }}><div className="font-semibold text-lg">{n.label}</div><p className="font-serif mt-1"><Rich text={n.detail} /></p>{n.refs?.length ? <div className="mt-2"><Refs refs={n.refs} max={4} /></div> : null}</motion.div>}
    </div>
  );
}

function Decision({ v }: { v: V<'decision'> }) {
  const [path, setPath] = useState<{ node: string; choice?: string }[]>([{ node: v.start }]);
  const cur = path[path.length - 1].node; const q = v.nodes.find((n) => n.id === cur); const r = v.results.find((x) => x.id === cur);
  return (
    <div>
      {path.length > 1 && <ol className="mb-3 space-y-1">{path.slice(0, -1).map((p, i) => <li key={i} className="flex gap-2 items-start text-sm"><span className="text-muted flex-1">{v.nodes.find((n) => n.id === p.node)?.q}</span><button className="chip !border-accent text-accent shrink-0" onClick={() => setPath(path.slice(0, i + 1).map((x, j) => (j === i ? { node: x.node } : x)))}>{p.choice} ✎</button></li>)}</ol>}
      <AnimatePresence mode="wait">
        {q && <motion.div key={q.id} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }}>
          <div className="font-semibold text-lg">{q.q}</div>
          <div className="grid gap-2 sm:grid-cols-2 mt-3">{q.options.map((o) => <button key={o.label} onClick={() => setPath([...path.slice(0, -1), { node: cur, choice: o.label }, { node: o.next }])} className="rounded-xl border border-line p-3 text-left font-semibold hover:border-accent hover:bg-sunk">{o.label} →</button>)}</div>
        </motion.div>}
        {r && <motion.div key={r.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl p-4 border-2" style={{ borderColor: color('accent') }}>
          <div className="eyebrow">{t('Where this leads')}</div><div className="display text-2xl">{r.title}</div><div className="mt-1"><Paras text={r.text} /></div>{r.refs?.length ? <div className="mt-2"><Refs refs={r.refs} max={5} /></div> : null}
          <button className="btn mt-3" onClick={() => setPath([{ node: v.start }])}>↺ {t('Start again')}</button></motion.div>}
      </AnimatePresence>
    </div>
  );
}

/* sorting game: the reader picks a category for each item and gets the answer with an explanation */
function Sorter({ v }: { v: V<'sorter'> }) {
  const [picks, setPicks] = useState<Record<number, string>>({});
  const done = Object.keys(picks).length; const right = v.items.filter((it, i) => picks[i] === it.answer).length;
  const cat = (id: string) => v.categories.find((c) => c.id === id)?.label ?? id;
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3"><div className="text-sm text-muted">{t('Choose a category for each item. You will see the answer and why.')}</div>
        <div className="shrink-0 text-sm font-semibold tabular">{t('{right} of {done} correct', { right, done })} · {done}/{v.items.length}</div></div>
      <div className="h-1.5 rounded-full bg-sunk overflow-hidden mb-3"><motion.div className="h-full bg-accent" animate={{ width: `${(done / v.items.length) * 100}%` }} /></div>
      <ol className="space-y-2">{v.items.map((it, i) => { const p = picks[i]; const ok = p === it.answer; return (
        <li key={i} className="rounded-xl border p-3" style={p ? { borderColor: color(ok ? 'good' : 'warn', 0.7), background: color(ok ? 'good' : 'warn', 0.06) } : { borderColor: 'rgb(var(--border))' }}>
          <div className="flex flex-wrap gap-2 items-baseline"><span className="font-serif text-[1.05rem]"><Rich text={it.text} /></span>{it.ref && <Ref r={it.ref} />}</div>
          {!p ? <div className="flex flex-wrap gap-1.5 mt-2">{v.categories.map((c) => <button key={c.id} className="chip hover:border-accent !py-1" onClick={() => setPicks({ ...picks, [i]: c.id })}>{c.label}</button>)}</div>
            : <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-[.95rem]"><b>{ok ? '✓ ' : '✗ '}{cat(it.answer)}.</b> <span className="font-serif"><Rich text={it.why} /></span>{!ok && <span className="text-muted text-sm"> ({t('you chose')}: {cat(p)})</span>}</motion.div>}
        </li>); })}</ol>
      {done > 0 && <button className="btn mt-3" onClick={() => setPicks({})}>↺ {t('Reset')}</button>}
    </div>
  );
}

function Lenses({ v }: { v: V<'lenses'> }) {
  const [sel, setSel] = useState(0); const l = v.lenses[sel];
  return (
    <div>
      <div className="rounded-xl p-4 border-l-4" style={{ borderColor: color('accent'), background: color('accent', 0.05) }}><div className="mb-1"><Ref r={v.ref} /></div><p className="font-serif text-[1.1rem] italic"><Rich text={v.passage} /></p></div>
      <div className="flex flex-wrap gap-1.5 my-3">{v.lenses.map((x, i) => <button key={i} onClick={() => setSel(i)} className="chip !py-1.5 !text-[.82rem]" style={i === sel ? { background: color(PAL[i % PAL.length]), color: 'rgb(var(--accent-ink))', borderColor: color(PAL[i % PAL.length]) } : { borderColor: color(PAL[i % PAL.length], 0.6) }}>◉ {x.name}</button>)}</div>
      {l && <motion.div key={sel} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl p-4 border-2" style={{ borderColor: color(PAL[sel % PAL.length], 0.7) }}><div className="font-semibold">{l.name}</div><div className="text-sm text-muted">{l.who}</div><div className="mt-1"><Paras text={l.reading} /></div></motion.div>}
    </div>
  );
}

function Versions({ v }: { v: V<'versions'> }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3"><Ref r={v.ref} />{v.original && <span className="font-orig text-lg" dir="auto">{v.original}</span>}</div>
      <div className="grid gap-2 md:grid-cols-2">{v.versions.map((x, i) => (
        <button key={i} onClick={() => setOpen(open === i ? null : i)} className={`rounded-xl border p-3 text-left ${open === i ? 'border-accent' : 'border-line'}`}>
          <div className="eyebrow">{x.name}</div><p className="font-serif text-[1.05rem] mt-0.5">“<Rich text={x.text} />”</p>
          {open === i ? <p className="text-sm mt-2 text-muted"><Rich text={x.note} /></p> : <span className="text-xs text-accent">{t('Why it reads this way')} +</span>}
        </button>))}</div>
    </div>
  );
}

function WordStudy({ v }: { v: V<'wordstudy'> }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-3 mb-3"><span className="display text-3xl">{v.word}</span><span className="font-orig text-2xl text-accent" dir="auto">{v.original}</span></div>
      <ol className="grid gap-2 md:grid-cols-2">{v.senses.map((s, i) => (
        <motion.li key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="rounded-xl border border-line p-3">
          <div className="flex gap-2 items-baseline"><span className="rubric display text-xl tabular">{i + 1}</span><span className="font-semibold">{s.meaning}</span></div>
          <p className="font-serif mt-1"><Rich text={s.note} /></p><div className="mt-1.5"><Refs refs={s.refs} max={4} /></div></motion.li>))}</ol>
    </div>
  );
}
