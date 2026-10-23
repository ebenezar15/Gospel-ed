/** Visual building blocks for the book studies: mind map, flowchart, argument graph, audience donut, time bar, misreading compare. */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactFlow, Background, Controls, MarkerType, type Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Refs, Conf, Rich } from './ui';
import type { MisreadingT, DeepStudyT } from '../schemas';
import { books } from '../data';

const PALETTE = ['--accent', '--nt', '--ot', '--accent-2', '--good', '--warn'];
const col = (i: number, a = 1) => `rgb(var(${PALETTE[i % PALETTE.length]}) / ${a})`;
export const bookName = (id: string) => books.find((b) => b.id === id)?.name ?? id;
import { fmtYear } from '../i18n';
export { fmtYear };

/* ---------- radial mind map ---------- */
export function MindMap({ center, branches }: { center: string; branches: { label: string; items: string[] }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const n = branches.length;
  return (
    <div>
      {/* wide: radial */}
      <div className="hidden md:block relative w-full mb-10" style={{ aspectRatio: "16 / 9" }}>
        <svg viewBox="0 0 160 90" className="absolute inset-0 w-full h-full" aria-hidden>
          {branches.map((b, i) => {
            const a = (i / n) * Math.PI * 2 - Math.PI / 2;
            const x = 80 + Math.cos(a) * 46, y = 45 + Math.sin(a) * 30;
            return <motion.path key={i} d={`M80 45 Q ${(80 + x) / 2 + Math.sin(a) * 6} ${(45 + y) / 2 - Math.cos(a) * 4} ${x} ${y}`} fill="none" stroke={col(i, open === null || open === i ? 0.75 : 0.2)} strokeWidth={open === i ? 0.9 : 0.5} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: i * 0.08 }} />;
          })}
        </svg>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[19%] aspect-square rounded-full flex items-center justify-center text-center p-3 display text-xl leading-tight border-2 shadow-lg" style={{ background: 'rgb(var(--surface))', borderColor: 'rgb(var(--accent))' }}>{center}</div>
        {branches.map((b, i) => {
          const a = (i / n) * Math.PI * 2 - Math.PI / 2;
          const x = 50 + (Math.cos(a) * 46 * 100) / 160, y = 50 + (Math.sin(a) * 30 * 100) / 90;
          const on = open === i;
          return (
            <div key={i} className={`absolute -translate-x-1/2 -translate-y-1/2 w-[24%] ${on ? 'z-20' : 'z-10'}`} style={{ left: `${x}%`, top: `${y}%` }}>
            <motion.button onClick={() => setOpen(on ? null : i)} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: open === null || on ? 1 : 0.55, scale: 1 }} transition={{ delay: 0.2 + i * 0.08 }}
              className={`card px-3 py-2 text-left w-full ${on ? 'shadow-xl' : ''}`} style={{ borderColor: col(i, on ? 1 : 0.5), borderWidth: on ? 2 : 1 }}>
              <div className="font-semibold leading-tight text-sm" style={{ color: col(i) }}>{b.label}</div>
              <AnimatePresence initial={false}>
                {on ? <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-1 space-y-0.5 text-[.8rem] font-serif overflow-hidden">{b.items.map((it) => <li key={it}>• {it}</li>)}</motion.ul>
                  : <div className="text-[.7rem] text-muted">{b.items.length} ideas · tap</div>}
              </AnimatePresence>
            </motion.button>
            </div>
          );
        })}
      </div>
      {/* narrow: tree */}
      <div className="md:hidden">
        <div className="card px-4 py-2 display text-xl text-center border-2" style={{ borderColor: 'rgb(var(--accent))' }}>{center}</div>
        <ul className="mt-2 ml-4 border-l-2 border-line pl-3 space-y-2">{branches.map((b, i) => (
          <li key={i}><button onClick={() => setOpen(open === i ? null : i)} className="font-semibold text-left" style={{ color: col(i) }}>{b.label} <span className="text-muted text-xs">{open === i ? '−' : `+${b.items.length}`}</span></button>
            {open === i && <ul className="mt-1 ml-2 text-sm font-serif space-y-0.5">{b.items.map((it) => <li key={it}>• {it}</li>)}</ul>}</li>))}</ul>
      </div>
    </div>
  );
}

/* ---------- step flowchart with play ---------- */
export function FlowChart({ steps }: { steps: { label: string; detail: string; refs: string[] }[] }) {
  const [at, setAt] = useState(0);
  const s = steps[at];
  return (
    <div>
      <div className="flex flex-wrap items-stretch gap-y-3">
        {steps.map((st, i) => (
          <div key={i} className="flex items-center">
            <button onClick={() => setAt(i)} className={`card px-3 py-2 text-left max-w-[11rem] min-h-[3.4rem] transition-colors ${i === at ? 'border-accent border-2' : i < at ? 'opacity-80' : ''}`} style={i === at ? { background: 'rgb(var(--accent) / .08)' } : undefined}>
              <div className="text-[.65rem] tabular text-muted">STEP {i + 1}</div>
              <div className="text-sm font-semibold leading-tight">{st.label}</div>
            </button>
            {i < steps.length - 1 && <svg width="26" height="14" className="shrink-0 mx-0.5" aria-hidden><path d="M2 7h18m-5-5 5 5-5 5" fill="none" stroke={i < at ? 'rgb(var(--accent))' : 'rgb(var(--border))'} strokeWidth="2" /></svg>}
          </div>
        ))}
      </div>
      {s && <motion.div key={at} initial={{ opacity: 0.4, y: 6 }} animate={{ opacity: 1, y: 0 }} className="card p-4 mt-3 flex flex-wrap gap-3 items-start justify-between">
        <div className="min-w-0 flex-1"><div className="display text-xl">{s.label}</div><p className="font-serif text-[1.05rem] mt-1"><Rich text={s.detail} /></p><div className="mt-2"><Refs refs={s.refs} max={4} /></div></div>
        <div className="flex gap-2 shrink-0"><button className="btn" disabled={at === 0} onClick={() => setAt(at - 1)}>←</button><button className="btn btn-primary" disabled={at === steps.length - 1} onClick={() => setAt(at + 1)}>Next →</button></div>
      </motion.div>}
    </div>
  );
}

/* ---------- branching argument graph ---------- */
export function ArgumentGraph({ nodes }: { nodes: DeepStudyT['argument'] }) {
  const [sel, setSel] = useState<string | null>(nodes[0]?.id ?? null);
  const { flowNodes, flowEdges } = useMemo(() => {
    const level = new Map<string, number>();
    const incoming = new Set(nodes.flatMap((n) => n.next));
    const roots = nodes.filter((n) => !incoming.has(n.id));
    const visit = (id: string, d: number, seen: Set<string>) => {
      if (seen.has(id)) return; seen.add(id);
      if ((level.get(id) ?? -1) < d) level.set(id, d);
      nodes.find((n) => n.id === id)?.next.forEach((x) => visit(x, d + 1, new Set(seen)));
    };
    (roots.length ? roots : nodes.slice(0, 1)).forEach((r) => visit(r.id, 0, new Set()));
    nodes.forEach((n) => { if (!level.has(n.id)) level.set(n.id, 0); });
    const rows = new Map<number, string[]>();
    nodes.forEach((n) => { const l = level.get(n.id)!; rows.set(l, [...(rows.get(l) ?? []), n.id]); });
    const pos = new Map<string, { x: number; y: number }>();
    // wrap levels into bands that snake left-right so long chains stay readable
    const PER = 4, maxW = Math.max(...[...rows.values()].map((r) => r.length));
    const bandH = maxW * 95 + 70;
    rows.forEach((ids, l) => {
      const band = Math.floor(l / PER), c = l % PER, colX = (band % 2 ? PER - 1 - c : c) * 260;
      ids.forEach((id, i) => pos.set(id, { x: colX, y: band * bandH + (i - (ids.length - 1) / 2) * 95 + (maxW - 1) * 47 }));
    });
    const flowNodes: Node[] = nodes.map((n) => ({
      id: n.id, position: pos.get(n.id)!, data: { label: <div className="text-left"><div className="text-[10px] tabular opacity-70">ch. {n.chapters}</div><div className="font-semibold leading-tight text-[13px]">{n.label}</div></div> },
      style: { width: 210, borderRadius: 12, padding: 8, background: sel === n.id ? 'rgb(var(--accent))' : 'rgb(var(--surface))', color: sel === n.id ? 'rgb(var(--accent-ink))' : 'rgb(var(--text))', border: '1px solid rgb(var(--border))' },
    }));
    const flowEdges: Edge[] = nodes.flatMap((n) => n.next.filter((t) => pos.has(t)).map((t) => ({ id: `${n.id}-${t}`, source: n.id, target: t, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: 'rgb(var(--accent) / .7)', strokeWidth: 1.6 }, animated: sel === n.id, type: 'smoothstep' })));
    return { flowNodes, flowEdges };
  }, [nodes, sel]);
  const s = nodes.find((n) => n.id === sel);
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="card h-[460px] overflow-hidden"><ReactFlow nodes={flowNodes} edges={flowEdges} fitView minZoom={0.2} maxZoom={1.5} nodesConnectable={false} nodesDraggable={false} onNodeClick={(_, n) => setSel(n.id)} proOptions={{ hideAttribution: true }}><Background gap={20} color="rgb(var(--border))" /><Controls showInteractive={false} /></ReactFlow></div>
      {s && <motion.div key={s.id} className="card p-5 self-start" initial={{ opacity: 0.5, x: 8 }} animate={{ opacity: 1, x: 0 }}>
        <div className="eyebrow">Chapters {s.chapters}</div><div className="display text-2xl leading-tight">{s.label}</div>
        <p className="font-serif text-[1.08rem] mt-2"><Rich text={s.text} /></p>
        {s.next.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5 items-center"><span className="text-xs text-muted">Leads to →</span>{s.next.map((t) => { const x = nodes.find((n) => n.id === t); return x && <button key={t} className="chip hover:border-accent" onClick={() => setSel(t)}>{x.label}</button>; })}</div>}
      </motion.div>}
    </div>
  );
}

/* ---------- audience donut ---------- */
export function AudienceDonut({ groups }: { groups: DeepStudyT['audienceMap'] }) {
  const [sel, setSel] = useState(0);
  const total = groups.reduce((t, x) => t + x.share, 0) || 1;
  let acc = 0;
  const arcs = groups.map((x) => { const startAngle = (acc / total) * Math.PI * 2; acc += x.share; return { startAngle, endAngle: (acc / total) * Math.PI * 2 }; });
  const a = ({ startAngle: s0, endAngle: e0 }: { startAngle: number; endAngle: number }) => {
    const s = s0 + 0.012, e = Math.max(s + 0.001, e0 - 0.012), R = 90, r = 52, big = e - s > Math.PI ? 1 : 0;
    const p = (rad: number, ang: number) => `${Math.sin(ang) * rad} ${-Math.cos(ang) * rad}`;
    return `M${p(R, s)}A${R} ${R} 0 ${big} 1 ${p(R, e)}L${p(r, e)}A${r} ${r} 0 ${big} 0 ${p(r, s)}Z`;
  };
  const g = groups[sel];
  return (
    <div className="grid gap-4 sm:grid-cols-[200px_minmax(0,1fr)] items-center">
      <svg viewBox="-100 -100 200 200" className="w-[200px] mx-auto" role="img" aria-label="Who was in the first audience">
        {arcs.map((x, i) => <path key={i} d={a(x)} fill={col(i, sel === i ? 0.95 : 0.45)} className="cursor-pointer transition-opacity" onClick={() => setSel(i)} transform={sel === i ? `translate(${Math.cos((x.startAngle + x.endAngle) / 2 - Math.PI / 2) * 6} ${Math.sin((x.startAngle + x.endAngle) / 2 - Math.PI / 2) * 6})` : undefined} />)}
        <text textAnchor="middle" dy="-2" className="fill-current display" fontSize="26">{g?.share}%</text>
        <text textAnchor="middle" dy="16" fontSize="9" className="fill-current opacity-60">rough share</text>
      </svg>
      <div>
        <div className="flex flex-wrap gap-1.5 mb-2">{groups.map((x, i) => <button key={i} onClick={() => setSel(i)} className="chip !whitespace-normal" style={sel === i ? { borderColor: col(i), color: col(i) } : undefined}><span className="w-2 h-2 rounded-full" style={{ background: col(i) }} />{x.group}</button>)}</div>
        {g && <motion.p key={sel} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="font-serif text-[1.05rem]"><b>{g.group}:</b> <Rich text={g.concerns} /></motion.p>}
      </div>
    </div>
  );
}

/* ---------- time bar: writing date, story span, world events ---------- */
export function TimeBar({ written, setIn, events }: { written: number; setIn?: { from: number; to: number; note: string }; events: { year: number; event: string }[] }) {
  const ys = [written, ...events.map((e) => e.year), ...(setIn ? [setIn.from, setIn.to] : [])];
  const lo = Math.min(...ys), hi = Math.max(...ys), pad = Math.max(10, (hi - lo) * 0.08);
  const x = (y: number) => ((y - (lo - pad)) / (hi - lo + pad * 2)) * 100;
  const [sel, setSel] = useState<number | null>(null);
  const sorted = [...events].sort((a, b) => a.year - b.year);
  return (
    <div>
      <div className="relative h-24 mt-2 overflow-hidden">
        <div className="absolute left-0 right-0 top-12 h-0.5 bg-line" />
        {setIn && <div className="absolute top-[42px] h-3 rounded-full" style={{ left: `${x(setIn.from)}%`, width: `${Math.max(0.8, x(setIn.to) - x(setIn.from))}%`, background: 'rgb(var(--ot) / .35)' }} title={setIn.note} />}
        {setIn && <div className="absolute top-[58px] text-[.7rem] text-muted whitespace-nowrap" style={{ left: `${x(setIn.from)}%` }}>story: {fmtYear(setIn.from)}–{fmtYear(setIn.to)}</div>}
        <span className="absolute text-[.7rem] font-bold text-accent whitespace-nowrap" style={x(written) > 80 ? { right: `${100 - x(written)}%`, top: 0 } : x(written) < 20 ? { left: `${x(written)}%`, top: 0 } : { left: `${x(written)}%`, top: 0, transform: 'translateX(-50%)' }}>written ~{fmtYear(written)}</span>
        <span className="absolute -translate-x-1/2 top-[38px] w-4 h-4 rounded-full bg-accent border-2 border-surface shadow" style={{ left: `${x(written)}%` }} />
        {sorted.map((e, i) => <button key={i} onClick={() => setSel(sel === i ? null : i)} className="absolute -translate-x-1/2 top-[42px] w-3 h-3 rotate-45 border-2 hover:scale-125 transition-transform" style={{ left: `${x(e.year)}%`, background: sel === i ? 'rgb(var(--nt))' : 'rgb(var(--surface))', borderColor: 'rgb(var(--nt))' }} aria-label={e.event} />)}
      </div>
      <ul className="grid gap-1 sm:grid-cols-2 text-sm">{sorted.map((e, i) => <li key={i}><button onClick={() => setSel(i)} className={`text-left ${sel === i ? 'text-accent' : ''}`}><span className="tabular font-semibold">{fmtYear(e.year)}</span> · {e.event}</button></li>)}</ul>
    </div>
  );
}

/* ---------- three-way compare for misreadings ---------- */
export function Misreadings({ list }: { list: MisreadingT[] }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="space-y-2">{list.map((m, i) => {
      const on = open === i;
      return (
        <div key={i} className={`card overflow-hidden ${on ? 'border-accent' : ''}`}>
          <button className="w-full text-left p-4 flex gap-3 items-center justify-between" onClick={() => setOpen(on ? -1 : i)}>
            <span className="font-semibold">{m.topic}</span><span className="flex gap-2 items-center shrink-0"><Conf c={m.confidence} small /><span className="text-muted">{on ? '−' : '+'}</span></span>
          </button>
          <AnimatePresence initial={false}>{on && <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl p-3" style={{ background: 'rgb(var(--warn) / .1)' }}><div className="eyebrow mb-1">Popular reading</div><p className="font-serif"><Rich text={m.popular} /></p></div>
                <div className="rounded-xl p-3" style={{ background: 'rgb(var(--good) / .1)' }}><div className="eyebrow mb-1">In its Jewish, first-century setting</div><p className="font-serif"><Rich text={m.inContext} /></p></div>
                <div className="rounded-xl p-3" style={{ background: 'rgb(var(--nt) / .1)' }}><div className="eyebrow mb-1">How traditional scholars respond</div><p className="font-serif"><Rich text={m.defence} /></p></div>
              </div>
              <p className="font-serif mt-3"><b>Why it matters:</b> <Rich text={m.whyItMatters} /></p>
              <div className="mt-2 flex flex-wrap gap-2 items-center"><Refs refs={m.refs} max={5} />{m.scholars.map((s) => <span key={s} className="chip">{s}</span>)}</div>
            </div>
          </motion.div>}</AnimatePresence>
        </div>);
    })}</div>
  );
}

/* ---------- connection star around one book ---------- */
export function ConnectionStar({ id, links }: { id: string; links: { bookId: string; how: string; refs: string[] }[] }) {
  const [sel, setSel] = useState(0);
  const n = links.length;
  const l = links[sel];
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center">
      <svg viewBox="-120 -95 240 190" className="w-full max-w-md mx-auto" role="img" aria-label="Connections to other books">
        {links.map((x, i) => { const a = (i / n) * Math.PI * 2 - Math.PI / 2; const px = Math.cos(a) * 85, py = Math.sin(a) * 68; const ot = books.find((b) => b.id === x.bookId)?.testament === 'OT'; return (
          <g key={i} className="cursor-pointer" onClick={() => setSel(i)}>
            <motion.line x1={0} y1={0} x2={px} y2={py} stroke={sel === i ? 'rgb(var(--accent))' : 'rgb(var(--border))'} strokeWidth={sel === i ? 2 : 1} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} />
            <circle cx={px} cy={py} r={sel === i ? 17 : 14} fill={`rgb(var(--${ot ? 'ot' : 'nt'}) / ${sel === i ? 0.9 : 0.25})`} />
            <text x={px} y={py + 3} textAnchor="middle" fontSize="7.5" fontWeight="700" className="fill-current pointer-events-none">{(books.find((b) => b.id === x.bookId)?.abbr ?? x.bookId).slice(0, 7)}</text>
          </g>); })}
        <circle r="24" fill="rgb(var(--accent))" /><text y="3" textAnchor="middle" fontSize="8" fontWeight="700" fill="rgb(var(--accent-ink))">{(books.find((b) => b.id === id)?.abbr ?? id).slice(0, 8)}</text>
      </svg>
      {l && <motion.div key={sel} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="card p-4">
        <Link to={`/books/${l.bookId}`} className="display text-2xl hover:text-accent">{bookName(l.bookId)} →</Link>
        <p className="font-serif text-[1.05rem] mt-1"><Rich text={l.how} /></p><div className="mt-2"><Refs refs={l.refs} max={4} /></div>
      </motion.div>}
    </div>
  );
}
