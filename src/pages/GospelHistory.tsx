import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ReactFlow, Background, Controls, MarkerType, type Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import { gospelNodes, emphasis, gospelQuestions } from '../data';
import { PageHeader, Section, Refs, Conf, SourceLine, fmtYear, Tabs, Empty } from '../components/ui';
import BibleMap from '../components/BibleMap';
import type { GospelNodeT } from '../schemas';

const KIND: Record<GospelNodeT['kind'], { label: string; c: string; lane: number }> = {
  preaching: { label: 'Preaching', c: 'rgb(var(--accent-2))', lane: 0 }, father: { label: 'Fathers & theologians', c: 'rgb(var(--accent))', lane: 1 },
  'turning-point': { label: 'Turning point', c: 'rgb(var(--warn))', lane: 2 }, movement: { label: 'Movement', c: 'rgb(var(--good))', lane: 3 },
};
// Compress time: early centuries get more room than later ones.
const ty = (y: number) => (y < 100 ? (y - 25) * 14 : y < 600 ? 1050 + (y - 100) * 2.6 : y < 1500 ? 2350 + (y - 600) * 0.9 : 3160 + (y - 1500) * 3.2);

function Heatmap() {
  const [hover, setHover] = useState<number | null>(null);
  if (!emphasis) return <Empty>The emphasis chart is still being prepared.</Empty>;
  const e = emphasis;
  return (
    <div>
      <p className="font-serif text-muted mb-3 max-w-[75ch]">{e.caveat}</p>
      <div className="scroll-x">
        <table className="min-w-[760px] w-full border-separate border-spacing-[3px] text-sm">
          <thead><tr><th />{e.eras.map((er, i) => <th key={er.id} className={`text-left font-normal text-xs align-bottom pb-1 ${hover === i ? 'text-accent' : 'text-muted'}`} style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 130 }}>{er.label}</th>)}</tr></thead>
          <tbody>{e.themes.map((t, ti) => (
            <tr key={t}><th className="text-left font-medium pr-3 whitespace-nowrap">{t}</th>
              {e.eras.map((er, i) => { const v = er.values[ti] ?? 0; return (
                <td key={er.id} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} title={`${t} · ${er.label}: ${v}/5`}
                  className="h-9 rounded text-center tabular text-xs" style={{ background: `rgb(var(--accent-2) / ${0.06 + v * 0.17})`, color: v >= 3 ? 'rgb(var(--bg))' : 'rgb(var(--text))' }}>{v}</td>); })}
            </tr>))}</tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted mt-2"><span>0 absent</span>{[0, 1, 2, 3, 4, 5].map((v) => <span key={v} className="w-5 h-3 rounded-sm" style={{ background: `rgb(var(--accent-2) / ${0.06 + v * 0.17})` }} />)}<span>5 central</span></div>
      <div className="grid gap-2 md:grid-cols-3 mt-4">{e.eras.map((er, i) => <div key={er.id} className={`card p-3 text-sm ${hover === i ? 'border-accent' : ''}`}><div className="font-semibold mb-0.5">{er.label}</div><p className="font-serif text-muted">{er.note}</p></div>)}</div>
    </div>
  );
}

export default function GospelHistory() {
  const [sp, setSp] = useSearchParams();
  const [tab, setTab] = useState<'flow' | 'emphasis' | 'questions' | 'map'>('flow');
  const sel = gospelNodes.find((n) => n.id === sp.get('node')) ?? null;
  const pick = (id: string) => setSp({ node: id }, { replace: true });
  const { nodes, edges } = useMemo(() => {
    const byYearLane = new Map<string, number>();
    const nodes: Node[] = gospelNodes.map((n) => {
      const k = KIND[n.kind]; const key = `${k.lane}-${Math.round(ty(n.year) / 70)}`; const off = byYearLane.get(key) ?? 0; byYearLane.set(key, off + 1);
      return { id: n.id, position: { x: k.lane * 270 + off * 30, y: ty(n.year) + off * 40 }, data: { label: <div className="text-left"><div className="text-[10px] tabular opacity-70">{fmtYear(n.year)} · {n.place}</div><div className="text-[12.5px] leading-tight font-semibold">{n.title}</div></div> },
        style: { width: 230, background: sel?.id === n.id ? k.c : 'rgb(var(--surface))', color: sel?.id === n.id ? 'rgb(var(--bg))' : 'rgb(var(--text))', border: `1.5px solid ${k.c}`, borderRadius: 6, padding: 8 } };
    });
    const ids = new Set(gospelNodes.map((n) => n.id));
    const edges: Edge[] = gospelNodes.flatMap((n) => n.leadsTo.filter((t) => ids.has(t)).map((t) => ({ id: `${n.id}>${t}`, source: n.id, target: t, animated: sel?.id === n.id || sel?.id === t, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: sel && (sel.id === n.id || sel.id === t) ? 'rgb(var(--accent-2))' : 'rgb(var(--border))', strokeWidth: sel && (sel.id === n.id || sel.id === t) ? 2.5 : 1.2 } })));
    return { nodes, edges };
  }, [sel]);
  const located = gospelNodes.filter((n) => n.coords);

  return (
    <div>
      <PageHeader eyebrow="Gospel through history" title="What gospel was preached, and when?">
        From Jesus’ announcement of the kingdom to modern evangelistic formulas: who preached, where, what they emphasised, and where scholars see the emphasis shift. Every node cites its sources; disagreements are shown rather than settled.
      </PageHeader>
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'flow', label: 'Flowchart' }, { id: 'emphasis', label: 'Message emphasis by era' }, { id: 'questions', label: 'Guiding questions' }, { id: 'map', label: 'Map' }]} />
      {tab === 'flow' && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-3 text-xs mb-2">{Object.values(KIND).map((k) => <span key={k.label} className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm border-2" style={{ borderColor: k.c }} />{k.label}</span>)}<span className="text-muted">Time runs downward; early centuries are stretched.</span></div>
            <div className="card h-[75vh] hidden sm:block">
              <ReactFlow nodes={nodes} edges={edges} fitView fitViewOptions={{ nodes: nodes.slice(0, 10) }} minZoom={0.08} nodesConnectable={false} onNodeClick={(_, n) => pick(n.id)} proOptions={{ hideAttribution: true }}>
                <Background color="rgb(var(--border))" gap={30} /><Controls showInteractive={false} />
              </ReactFlow>
            </div>
            <ol className="sm:hidden space-y-2">{gospelNodes.map((n) => <li key={n.id}><button className="card p-3 w-full text-left" onClick={() => pick(n.id)}><div className="text-xs text-muted tabular">{fmtYear(n.year)} · {n.place}</div><div className="font-semibold">{n.title}</div></button></li>)}</ol>
          </div>
          <aside className="min-w-0">
            {sel ? (
              <motion.div key={sel.id} className="card p-4 lg:sticky lg:top-4 max-h-[80vh] overflow-y-auto" initial={{ opacity: 0.001, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                <div className="eyebrow" style={{ color: KIND[sel.kind].c }}>{KIND[sel.kind].label}</div>
                <h2 className="display text-3xl leading-tight">{sel.title}</h2>
                <div className="text-sm text-muted tabular mb-2">{fmtYear(sel.year)}{sel.endYear ? `–${fmtYear(sel.endYear)}` : ''} · {sel.place} <Conf c={sel.confidence} small /></div>
                {sel.people.length > 0 && <div className="text-sm mb-2">{sel.people.join(', ')}</div>}
                <div className="eyebrow mt-3 mb-1">What was preached</div><p className="font-serif">{sel.message}</p>
                {sel.shift && <><div className="eyebrow mt-3 mb-1 text-warn">What shifted</div><p className="font-serif">{sel.shift}</p></>}
                <div className="mt-3"><Refs refs={sel.refs} /></div>
                {sel.sources.length > 0 && <><div className="eyebrow mt-3 mb-1">Sources</div><ul className="space-y-1">{sel.sources.map((s, i) => <li key={i}><SourceLine s={s} /></li>)}</ul></>}
                {sel.leadsTo.length > 0 && <div className="mt-3 flex flex-wrap gap-1">{sel.leadsTo.map((t) => <button key={t} className="chip hover:border-accent" onClick={() => pick(t)}>→ {gospelNodes.find((n) => n.id === t)?.title ?? t}</button>)}</div>}
              </motion.div>
            ) : <div className="card p-4 font-serif text-muted">Select any node to read what was preached there, what changed, and the primary sources.</div>}
          </aside>
        </div>
      )}
      {tab === 'emphasis' && <Heatmap />}
      {tab === 'questions' && (
        <div className="space-y-8">{gospelQuestions.map((q) => (
          <Section key={q.question} title={q.question}>
            <div className="grid gap-3 md:grid-cols-2">{q.answers.map((a, i) => <div key={i} className="card p-4"><div className="display text-xl mb-1">{a.view}</div><p className="font-serif text-[.95rem]">{a.evidence}</p><div className="mt-2"><Refs refs={a.refs} max={5} /></div>{a.sources.length > 0 && <ul className="mt-2 text-xs text-muted space-y-0.5">{a.sources.map((s, j) => <li key={j}><SourceLine s={s} /></li>)}</ul>}</div>)}</div>
          </Section>
        ))}</div>
      )}
      {tab === 'map' && (
        <div className="space-y-3">
          <BibleMap focus={[-12, 20, 50, 56]} routes={[]} places={located.map((n) => ({ id: n.id, names: [{ era: '', name: `${n.title} (${fmtYear(n.year)})` }], coords: n.coords!, coordConfidence: n.confidence, type: 'site', refs: [], summary: '' }))} highlight={sel?.id} onPlace={(id) => { pick(id); setTab('flow'); }} label="Where the gospel was preached" />
          <p className="text-sm text-muted">Each dot is a node from the flowchart. Click one to open it.</p>
        </div>
      )}
    </div>
  );
}
