import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ReactFlow, Background, Controls, MarkerType, type Node, type Edge as FlowEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { people, personById, edges, adjacency, findPath, lifespan, eras, type Edge } from '../data';
import { PageHeader, Refs, PersonLink, Empty } from '../components/ui';
import { makeEraScale } from '../lib/eraScale';
import { useUI } from '../store';

const TYPES = ['family', 'spouse', 'mentor', 'ally', 'co-worker', 'enemy', 'confrontation', 'successor'] as const;
const COLOR: Record<string, string> = {
  family: 'rgb(var(--muted))', spouse: 'rgb(var(--accent-2))', mentor: 'rgb(var(--accent))', ally: 'rgb(var(--good))',
  'co-worker': 'rgb(var(--nt))', enemy: 'rgb(var(--bad))', confrontation: 'rgb(var(--warn))', successor: 'rgb(var(--ot))',
};
const LABEL: Record<string, string> = { family: 'Family', spouse: 'Spouse', mentor: 'Mentor → disciple', ally: 'Ally', 'co-worker': 'Co-worker', enemy: 'Enemy', confrontation: 'Prophet confronts ruler', successor: 'Successor' };

function midYear(id: string) {
  const p = personById.get(id)!; const l = lifespan(p);
  if (l) return (l[0] + l[1]) / 2;
  const e = eras.find((x) => x.id === p.eraIds[0]); return e ? (e.start + e.end) / 2 : 0;
}

export default function Connections() {
  const [sp, setSp] = useSearchParams();
  const eraFilter = useUI((s) => s.eraFilter);
  const [types, setTypes] = useState<string[]>([...TYPES]);
  const from = sp.get('from') ?? '', to = sp.get('to') ?? '';
  const focus = sp.get('focus') ?? '';
  const setP = (k: string, v: string) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); setSp(n, { replace: true }); };
  const path = useMemo(() => (from && to && personById.has(from) && personById.has(to) ? findPath(from, to) : null), [from, to]);
  const sorted = useMemo(() => [...people].sort((a, b) => a.names.primary.localeCompare(b.names.primary)), []);

  const { nodes, flowEdges, shown } = useMemo(() => {
    let es: Edge[] = edges.filter((e) => types.includes(e.type));
    let ids: Set<string>;
    if (path) { ids = new Set(path.flatMap((e) => [e.from, e.to])); es = path; }
    else if (focus && personById.has(focus)) {
      ids = new Set([focus]); (adjacency.get(focus) ?? []).forEach((e) => { ids.add(e.from); ids.add(e.to); });
      [...ids].forEach((id) => (adjacency.get(id) ?? []).slice(0, 6).forEach((e) => { ids.add(e.from); ids.add(e.to); }));
      es = es.filter((e) => ids.has(e.from) && ids.has(e.to));
    } else {
      ids = new Set(es.flatMap((e) => [e.from, e.to]));
      if (eraFilter) { ids = new Set([...ids].filter((id) => personById.get(id)!.eraIds.includes(eraFilter))); es = es.filter((e) => ids.has(e.from) && ids.has(e.to)); }
    }
    const sc = makeEraScale(4200);
    const pathOrder = path ? [from, ...path.map((e, i) => { let cur = from; for (let j = 0; j <= i; j++) { const pe = path[j]; cur = pe.from === cur ? pe.to : pe.from; } return cur; })] : [];
    const lanes = new Map<number, number>();
    const nodes: Node[] = [...ids].map((id) => {
      const p = personById.get(id)!;
      let x: number, y: number;
      if (path) { const i = pathOrder.indexOf(id); x = i * 220; y = (i % 2) * 90; }
      else { x = sc.x(midYear(id)); const b = Math.round(x / 150); const lane = lanes.get(b) ?? 0; lanes.set(b, lane + 1); y = lane * 64 * (lane % 2 ? 1 : -1); }
      const hot = id === focus || id === from || id === to;
      return { id, position: { x, y }, data: { label: p.names.primary }, style: {
        background: hot ? 'rgb(var(--accent-2))' : 'rgb(var(--surface))', color: hot ? 'rgb(var(--bg))' : 'rgb(var(--text))',
        border: `1.5px solid ${p.testament === 'NT' ? 'rgb(var(--nt))' : 'rgb(var(--ot))'}`, borderRadius: 999, fontSize: 13, padding: '4px 12px', width: 'auto',
        fontFamily: '"IM Fell English", Georgia, serif', boxShadow: p.tier === 'major' ? '0 0 0 3px rgb(var(--accent) / .15)' : undefined } };
    });
    const flowEdges: FlowEdge[] = es.map((e, i) => ({ id: `${e.from}-${e.to}-${i}`, source: e.from, target: e.to, animated: !!path || e.type === 'mentor',
      style: { stroke: COLOR[e.type], strokeWidth: path ? 3 : 1.4, strokeDasharray: e.type === 'enemy' || e.type === 'confrontation' ? '5 4' : undefined },
      markerEnd: e.type === 'mentor' || e.type === 'confrontation' || e.type === 'successor' ? { type: MarkerType.ArrowClosed, color: COLOR[e.type] } : undefined,
      label: path ? (LABEL[e.type] + (e.note ? `: ${e.note}` : '')) : undefined, labelStyle: { fill: 'rgb(var(--text))', fontSize: 11 }, labelBgStyle: { fill: 'rgb(var(--surface))' } }));
    return { nodes, flowEdges, shown: es };
  }, [types, path, focus, eraFilter, from]);

  return (
    <div>
      <PageHeader eyebrow="Relationship network" title="Connections">
        Family, mentors, allies, rivals and prophets facing kings. Pick two people to find the shortest chain between them.
      </PageHeader>
      <div className="card p-3 mb-3 grid gap-2 md:grid-cols-[auto_1fr_auto_1fr_auto] items-center">
        <span className="eyebrow">How is</span>
        <select id="conn-from" className="input" value={from} onChange={(e) => setP('from', e.target.value)}><option value="">choose a person…</option>{sorted.map((p) => <option key={p.id} value={p.id}>{p.names.primary}</option>)}</select>
        <span className="eyebrow">connected to</span>
        <select id="conn-to" className="input" value={to} onChange={(e) => setP('to', e.target.value)}><option value="">choose a person…</option>{sorted.map((p) => <option key={p.id} value={p.id}>{p.names.primary}</option>)}</select>
        <button className="btn" onClick={() => setSp({}, { replace: true })}>Clear</button>
      </div>
      {from && to && !path && <Empty>No chain links {personById.get(from)?.names.primary} and {personById.get(to)?.names.primary} in the recorded relationships yet.</Empty>}
      {path && (
        <div className="card p-4 mb-3">
          <div className="eyebrow mb-2">{path.length} step{path.length === 1 ? '' : 's'}</div>
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 font-serif text-lg">
            {(() => { let cur = from; const out = [<li key="s"><PersonLink id={from} className="font-semibold" /></li>]; path.forEach((e, i) => { const nxt = e.from === cur ? e.to : e.from; out.push(<li key={i} className="text-sm text-muted">→ <span style={{ color: COLOR[e.type] }}>{LABEL[e.type]}</span>{e.note ? ` (${e.note})` : ''} →</li>, <li key={`p${i}`}><PersonLink id={nxt} className="font-semibold" /></li>); cur = nxt; }); return out; })()}
          </ol>
          <div className="mt-2 flex flex-wrap gap-1">{path.flatMap((e) => e.refs).slice(0, 10).map((r, i) => <Refs key={i} refs={[r]} />)}</div>
        </div>
      )}
      {!path && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {TYPES.map((t) => <label key={t} className="chip cursor-pointer"><input type="checkbox" id={`ct-${t}`} checked={types.includes(t)} onChange={() => setTypes((x) => x.includes(t) ? x.filter((y) => y !== t) : [...x, t])} /><span className="inline-block w-3 h-0.5" style={{ background: COLOR[t] }} />{LABEL[t]}</label>)}
          {focus && <button className="chip text-accent" onClick={() => setP('focus', '')}>Showing {personById.get(focus)?.names.primary}’s circle · show everyone</button>}
        </div>
      )}
      <div className="card h-[min(70vh,640px)] hidden sm:block">
        <ReactFlow nodes={nodes} edges={flowEdges} fitView minZoom={0.05} maxZoom={2} nodesConnectable={false} onNodeClick={(_, n) => setP('focus', n.id)} proOptions={{ hideAttribution: true }}>
          <Background color="rgb(var(--border))" gap={28} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <p className="text-sm text-muted mt-2 hidden sm:block">Time runs left to right. Click a name to focus on that person’s circle; open profiles from the list below.</p>
      <details className="mt-4 sm:mt-6" open={typeof window !== 'undefined' && window.innerWidth < 640}>
        <summary className="cursor-pointer text-sm text-muted">List view ({shown.length} links)</summary>
        <ul className="mt-2 grid gap-1 md:grid-cols-2 text-sm">{shown.slice(0, 400).map((e, i) => <li key={i}><PersonLink id={e.from} /> <span style={{ color: COLOR[e.type] }}>— {LABEL[e.type]} —</span> <PersonLink id={e.to} />{e.note ? <span className="text-muted"> ({e.note})</span> : null}</li>)}</ul>
      </details>
    </div>
  );
}
