import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ReactFlow, Background, Controls, MarkerType, type Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { hierarchy, tree } from 'd3-hierarchy';
import { debates, eschatology, movements, debateById, contextItems, plain, guides } from '../data';
import { PageHeader, Section, Tabs, Refs, Ref, Paras, Conf, SourceLine, fmtYear, Bookmark, Empty, Stagger, item } from '../components/ui';
import Sequence from '../components/Sequence';
import Chat from '../components/Chat';
import type { DebateT, PositionT } from '../schemas';

const FALLBACK = ['#5b7fb0', '#b0645b', '#5b9a7a', '#a08a4a', '#8a6bb0', '#4f9aa8', '#b07a9a', '#7a8a5b', '#a8735b'];
const colorOf = (d: DebateT, p: PositionT) => p.color ?? FALLBACK[d.positions.indexOf(p) % FALLBACK.length];

export default function Debates({ kind }: { kind: 'debate' | 'movement' }) {
  const list = kind === 'movement' ? movements : [...debates, ...eschatology];
  const cats = [...new Set(list.map((d) => d.category))];
  return (
    <div>
      {kind === 'movement' ? (
        <PageHeader eyebrow="Renewal & supernatural ministry" title="Movements">
          Dominion theology, Word of Faith, the prophetic movement, healing, hearing God, tongues. Each is presented by its proponents and its critics, with scriptures and historical evidence for both, and the replies to each critique.
        </PageHeader>
      ) : (
        <PageHeader eyebrow="Theological camps" title="Debates">
          Every position uses the same template: who shaped it, its claims, its key scriptures, its strongest arguments, the critiques from every other side and its replies to them. No view is treated as the default.
        </PageHeader>
      )}
      {!list.length && <Empty>These pages are still being written.</Empty>}
      {cats.map((c) => (
        <Section key={c} title={c[0].toUpperCase() + c.slice(1)}>
          <Stagger className="grid gap-3 md:grid-cols-2">
            {list.filter((d) => d.category === c).map((d) => (
              <motion.div key={d.id} variants={item}>
                <Link to={`/${kind === 'movement' ? 'movements' : 'debates'}/${d.id}`} className="card p-4 block h-full hover:border-accent group">
                  <div className="display text-2xl group-hover:text-accent">{d.title}</div>
                  <p className="font-serif text-muted mt-1 text-[1.05rem]">{plain[d.id]?.takeaway ?? d.question}</p>
                  <div className="flex h-1.5 rounded overflow-hidden mt-3">{d.positions.map((p) => <span key={p.id} className="flex-1" style={{ background: colorOf(d, p) }} title={p.name} />)}</div>
                  <div className="text-xs text-muted mt-1.5">{d.positions.map((p) => p.name).join(' · ')}</div>
                </Link>
              </motion.div>
            ))}
          </Stagger>
        </Section>
      ))}
    </div>
  );
}

function PlainBox({ title, summary, takeaway, extra, verse, analogy }: { title: string; summary: string; takeaway: string; extra?: string; verse?: string; analogy?: string }) {
  return (
    <section className="card p-5 mb-6" style={{ background: 'linear-gradient(135deg, rgb(var(--accent) / .07), rgb(var(--surface)))' }}>
      <div className="eyebrow !text-accent mb-1.5">{title}</div>
      <p className="font-serif text-[1.25rem] leading-relaxed max-w-[70ch]">{summary}</p>
      <p className="mt-3 font-semibold max-w-[70ch]"><span className="text-accent">The heart of it: </span>{takeaway}</p>
      {extra && <p className="mt-2 text-[.95rem] text-muted max-w-[70ch]"><span className="font-semibold text-ink">Why it matters: </span>{extra}</p>}
      {analogy && <p className="mt-2 text-[.95rem] max-w-[70ch]"><span className="font-semibold">Picture it: </span><i className="font-serif text-[1.05rem]">{analogy}</i></p>}
      {verse && <div className="mt-3"><Refs refs={[verse]} /></div>}
    </section>
  );
}

function PositionCard({ d, p, onOpen }: { d: DebateT; p: PositionT; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="card p-4 text-left hover:border-accent h-full flex flex-col gap-2 relative overflow-hidden">
      <span className="absolute inset-x-0 top-0 h-1" style={{ background: colorOf(d, p) }} />
      <div className="display text-2xl" style={{ color: colorOf(d, p) }}>{p.name}</div>
      <p className="font-serif text-[1.02rem] line-clamp-5">{plain[d.id]?.positions[p.id]?.summary ?? p.summary}</p>
      {plain[d.id]?.positions[p.id]?.takeaway && <p className="text-sm font-semibold"><span className="text-accent">In a sentence: </span>{plain[d.id]!.positions[p.id].takeaway}</p>}
      <div className="mt-auto text-xs text-muted">{p.figures.slice(0, 3).map((f) => f.name).join(', ')}{p.originYear ? ` · from ${fmtYear(p.originYear)}` : ''}</div>
    </button>
  );
}

function PositionDetail({ d, p }: { d: DebateT; p: PositionT }) {
  const c = colorOf(d, p);
  return (
    <article className="space-y-2">
      <div className="flex flex-wrap items-baseline gap-3"><h2 className="display text-4xl" style={{ color: c }}>{p.name}</h2>{p.originYear && <span className="text-muted tabular">from {fmtYear(p.originYear)}</span>}</div>
      {plain[d.id]?.positions[p.id] && <PlainBox title="In plain words" summary={plain[d.id].positions[p.id].summary} takeaway={plain[d.id].positions[p.id].takeaway} verse={plain[d.id].positions[p.id].keyVerse} analogy={plain[d.id].positions[p.id].analogy} />}
      <div className="eyebrow mb-1">In depth</div>
      <Paras text={p.summary} className="text-lg" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] pt-4">
        <div className="min-w-0">
          <Section title="Core claims"><ol className="space-y-2 font-serif">{p.claims.map((x, i) => <li key={i} className="flex gap-3"><span className="display text-xl tabular" style={{ color: c }}>{i + 1}</span><span>{x}</span></li>)}</ol></Section>
          <Section title="Key scriptures, as this view reads them"><div className="space-y-2">{p.scriptures.map((s, i) => <div key={i} className="card p-3 flex flex-col sm:flex-row gap-2 sm:gap-4"><div className="shrink-0"><Ref r={s.ref} /></div><p className="font-serif text-[.95rem]">{s.reading}</p></div>)}</div></Section>
          <Section title="Strongest arguments">
            <div className="grid gap-2 md:grid-cols-2">{p.arguments.map((a, i) => <div key={i} className="card p-3"><span className="chip !text-[.65rem] mb-1.5">{a.kind}</span><p className="font-serif text-[.95rem]">{a.text}</p>{a.refs && <div className="mt-1"><Refs refs={a.refs} max={3} /></div>}</div>)}</div>
          </Section>
          <Section title="Critiques and replies">
            <div className="space-y-3">{p.critiques.map((cr, i) => {
              const replies = p.responses.filter((r) => r.toCritique === i);
              const fromPos = d.positions.find((x) => x.id === cr.from || x.name === cr.from);
              return (
                <div key={i} className="card overflow-hidden">
                  <div className="p-3 border-l-4" style={{ borderColor: fromPos ? colorOf(d, fromPos) : 'rgb(var(--bad))' }}>
                    <div className="eyebrow mb-1">Critique from {fromPos?.name ?? cr.from}</div><p className="font-serif text-[.95rem]">{cr.text}</p>{cr.refs && <div className="mt-1"><Refs refs={cr.refs} max={6} /></div>}
                  </div>
                  {replies.map((r, j) => <div key={j} className="p-3 bg-sunk border-l-4" style={{ borderColor: c }}><div className="eyebrow mb-1">{p.name} replies</div><p className="font-serif text-[.95rem]">{r.text}</p>{r.refs && <div className="mt-1"><Refs refs={r.refs} max={6} /></div>}</div>)}
                </div>
              );
            })}</div>
          </Section>
          <Section title="Straw men, corrected"><div className="space-y-2">{p.strawMen.map((s, i) => <div key={i} className="card p-3 grid gap-2 md:grid-cols-2"><div><div className="eyebrow text-bad mb-0.5">Often said</div><p className="font-serif line-through decoration-bad/50">{s.strawMan}</p></div><div><div className="eyebrow mb-0.5" style={{ color: 'rgb(var(--good))' }}>What it actually holds</div><p className="font-serif">{s.correction}</p></div></div>)}</div></Section>
          <Section title="Practical and pastoral impact"><div className="grid gap-3 md:grid-cols-2">
            <div className="card p-3"><div className="eyebrow mb-1" style={{ color: 'rgb(var(--good))' }}>As adherents see it</div><ul className="list-disc pl-5 font-serif space-y-1">{p.impacts.positive.map((x) => <li key={x}>{x}</li>)}</ul></div>
            <div className="card p-3"><div className="eyebrow mb-1 text-bad">As critics see it</div><ul className="list-disc pl-5 font-serif space-y-1">{p.impacts.negative.map((x) => <li key={x}>{x}</li>)}</ul></div>
          </div></Section>
        </div>
        <aside className="space-y-4">
          {p.sequence?.length ? <Sequence steps={p.sequence} color={c} title="How it unfolds" /> : null}
          <div className="card p-4"><div className="eyebrow mb-2">Historical context</div><Paras text={p.context} className="!text-[.95rem]" /></div>
          <div className="card p-4"><div className="eyebrow mb-2">Who shaped it</div><ul className="space-y-3">{p.figures.map((f) => <li key={f.name}><div className="font-semibold">{f.name} <span className="text-xs text-muted font-normal">{f.lived}</span></div><div className="text-xs eyebrow !normal-case !tracking-normal">{f.role} · {f.profession}</div><p className="text-sm font-serif mt-0.5">{f.bio}</p>{f.works.map((w, i) => <div key={i} className="text-xs text-muted"><SourceLine s={w} /></div>)}</li>)}</ul></div>
          <div className="card p-4"><div className="eyebrow mb-2">Notable adherents</div><p className="text-sm">{p.adherents.join(' · ')}</p></div>
          <div className="card p-4"><div className="eyebrow mb-2">Further reading</div><div className="text-xs eyebrow mb-1">From proponents</div><ul className="space-y-1 mb-2">{p.reading.proponent.map((s, i) => <li key={i}><SourceLine s={s} /></li>)}</ul><div className="text-xs eyebrow mb-1">From critics</div><ul className="space-y-1">{p.reading.critic.map((s, i) => <li key={i}><SourceLine s={s} /></li>)}</ul></div>
        </aside>
      </div>
    </article>
  );
}

function Compare({ d }: { d: DebateT }) {
  const [sel, setSel] = useState<string[]>(d.positions.slice(0, Math.min(3, d.positions.length)).map((p) => p.id));
  const ps = d.positions.filter((p) => sel.includes(p.id));
  const rows: { label: string; render: (p: PositionT) => JSX.Element }[] = [
    { label: 'In plain words', render: (p) => <p className="font-serif text-[1rem]">{plain[d.id]?.positions[p.id]?.summary ?? p.summary.split('\n')[0]}</p> },
    { label: 'In a sentence', render: (p) => <p className="text-[.9rem] font-semibold">{plain[d.id]?.positions[p.id]?.takeaway ?? '—'}</p> },
    { label: 'Core claims', render: (p) => <ol className="list-decimal pl-4 font-serif text-[.9rem] space-y-1">{p.claims.map((c) => <li key={c}>{c}</li>)}</ol> },
    { label: 'Anchor texts', render: (p) => <Refs refs={p.scriptures.map((s) => s.ref)} /> },
    { label: 'Best argument', render: (p) => <p className="font-serif text-[.9rem]">{p.arguments[0]?.text}</p> },
    { label: 'Hardest critique', render: (p) => <p className="font-serif text-[.9rem]">{p.critiques[0]?.text}</p> },
    { label: 'Its reply', render: (p) => <p className="font-serif text-[.9rem]">{p.responses[0]?.text}</p> },
    { label: 'Shaped by', render: (p) => <p className="text-sm">{p.figures.map((f) => f.name).join(', ')}</p> },
    ...(d.positions.some((p) => p.sequence?.length) ? [{ label: 'Sequence', render: (p: PositionT) => p.sequence?.length ? <Sequence steps={p.sequence} color={colorOf(d, p)} /> : <span className="text-muted">—</span> }] : []),
  ];
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-3"><span className="eyebrow self-center mr-1">Compare 2–4</span>
        {d.positions.map((p) => <label key={p.id} className="chip cursor-pointer" style={{ borderColor: sel.includes(p.id) ? colorOf(d, p) : undefined }}>
          <input type="checkbox" id={`cmp-${p.id}`} checked={sel.includes(p.id)} disabled={!sel.includes(p.id) && sel.length >= 4} onChange={() => setSel((s) => s.includes(p.id) ? (s.length > 2 ? s.filter((x) => x !== p.id) : s) : [...s, p.id])} />{p.name}</label>)}
      </div>
      <div className="scroll-x">
        <table className="w-full min-w-[640px] border-separate border-spacing-2 table-fixed">
          <thead><tr><th className="w-28" />{ps.map((p) => <th key={p.id} className="text-left align-bottom"><div className="display text-xl font-normal" style={{ color: colorOf(d, p) }}>{p.name}</div><div className="h-1 rounded mt-1" style={{ background: colorOf(d, p) }} /></th>)}</tr></thead>
          <tbody>{rows.map((r) => <tr key={r.label}><th className="eyebrow text-left align-top pt-2">{r.label}</th>{ps.map((p) => <td key={p.id} className="align-top card p-3">{r.render(p)}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

function Battleground({ d }: { d: DebateT }) {
  const [i, setI] = useState(0);
  const b = d.battleground[i];
  if (!b) return <Empty>No contested verses recorded.</Empty>;
  return (
    <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
      <div className="flex lg:flex-col gap-1.5 scroll-x">{d.battleground.map((x, j) => <button key={x.ref} onClick={() => setI(j)} className={`btn justify-start shrink-0 ${j === i ? 'btn-primary' : ''}`}>{x.ref}</button>)}</div>
      <div>
        <div className="mb-3"><Ref r={b.ref} /> <span className="text-sm text-muted ml-2">Hover the reference for the KJV text.</span></div>
        <div className="grid gap-3 md:grid-cols-2">
          {b.readings.map((r, j) => { const p = d.positions.find((x) => x.id === r.positionId); return (
            <motion.div key={r.positionId + i} className="card p-3 border-t-4" style={{ borderTopColor: p ? colorOf(d, p) : undefined }} initial={{ opacity: 0.001, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: j * 0.06 }}>
              <div className="display text-lg" style={{ color: p ? colorOf(d, p) : undefined }}>{p?.name ?? r.positionId}</div><p className="font-serif text-[.95rem]">{r.reading}</p>
            </motion.div>); })}
        </div>
      </div>
    </div>
  );
}

function ArgumentMap({ d }: { d: DebateT }) {
  const { nodes, edges } = useMemo(() => {
    const items = d.argumentMap; if (!items.length) return { nodes: [], edges: [] };
    const root = { id: '__root', kind: 'claim' as const, text: d.question };
    const all = [root, ...items];
    const h = hierarchy(root as any, (n: any) => all.filter((x: any) => (x.parent ?? (x.id === '__root' ? undefined : '__root')) === n.id && x.id !== n.id));
    const t = tree<any>().nodeSize([260, 170])(h);
    const tone: Record<string, string> = { claim: 'rgb(var(--accent))', support: 'rgb(var(--good))', objection: 'rgb(var(--bad))', reply: 'rgb(var(--warn))' };
    const nodes: Node[] = t.descendants().map((n) => {
      const pos = d.positions.find((p) => p.id === n.data.positionId);
      return { id: n.data.id, position: { x: n.x, y: n.y }, data: { label: <div className="text-left"><div className="text-[9px] uppercase tracking-widest font-semibold mb-0.5" style={{ color: tone[n.data.kind] }}>{n.data.kind}{pos ? ` · ${pos.name}` : ''}</div><div className="text-[11.5px] leading-snug font-serif">{n.data.text}</div></div> },
        style: { width: 230, background: 'rgb(var(--surface))', color: 'rgb(var(--text))', border: `1.5px solid ${n.data.id === '__root' ? 'rgb(var(--accent-2))' : tone[n.data.kind]}`, borderRadius: 6, padding: 8 } };
    });
    const edges: Edge[] = t.links().map((l) => ({ id: l.source.data.id + l.target.data.id, source: l.source.data.id, target: l.target.data.id, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: tone[l.target.data.kind] } }));
    return { nodes, edges };
  }, [d]);
  if (!nodes.length) return <Empty>No argument map yet.</Empty>;
  return (
    <div>
      <div className="flex flex-wrap gap-3 text-xs mb-2">{[['claim', 'accent'], ['support', 'good'], ['objection', 'bad'], ['reply', 'warn']].map(([k, c]) => <span key={k} className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm border-2" style={{ borderColor: `rgb(var(--${c}))` }} />{k}</span>)}</div>
      <div className="card h-[70vh] hidden sm:block"><ReactFlow nodes={nodes} edges={edges} fitView minZoom={0.1} nodesConnectable={false} proOptions={{ hideAttribution: true }}><Background color="rgb(var(--border))" gap={30} /><Controls showInteractive={false} /></ReactFlow></div>
      <ul className="sm:hidden space-y-2">{d.argumentMap.map((a) => <li key={a.id} className="card p-3" style={{ marginLeft: a.parent ? 16 : 0 }}><span className="eyebrow">{a.kind}</span><p className="font-serif text-sm">{a.text}</p></li>)}</ul>
    </div>
  );
}

function Influence({ d }: { d: DebateT }) {
  const inf = d.influence ?? [];
  const { nodes, edges } = useMemo(() => {
    const names = [...new Set(inf.flatMap((e) => [e.from, e.to]))];
    const figYear = new Map<string, number>();
    d.positions.forEach((p) => p.figures.forEach((f) => { const m = /(\d{3,4})/.exec(f.lived); if (m) figYear.set(f.name, +m[1] * (/BC/.test(f.lived) ? -1 : 1)); }));
    const sortedNames = names.sort((a, b) => (figYear.get(a) ?? 1500) - (figYear.get(b) ?? 1500));
    const nodes: Node[] = sortedNames.map((n, i) => ({ id: n, position: { x: (i % 5) * 210 + (Math.floor(i / 5) % 2) * 100, y: Math.floor(i / 5) * 110 }, data: { label: n }, style: { background: 'rgb(var(--surface))', color: 'rgb(var(--text))', border: '1px solid rgb(var(--border))', borderRadius: 999, fontSize: 12, width: 'auto', padding: '4px 10px' } }));
    const edges: Edge[] = inf.map((e, i) => ({ id: `i${i}`, source: e.from, target: e.to, label: e.note, animated: true, markerEnd: { type: MarkerType.ArrowClosed }, labelStyle: { fontSize: 10, fill: 'rgb(var(--muted))' }, labelBgStyle: { fill: 'rgb(var(--bg))' }, style: { stroke: 'rgb(var(--accent))' } }));
    return { nodes, edges };
  }, [d]);
  if (!inf.length) return <Empty>No influence links recorded.</Empty>;
  return (
    <>
      <div className="card h-[60vh] hidden sm:block"><ReactFlow nodes={nodes} edges={edges} fitView nodesConnectable={false} proOptions={{ hideAttribution: true }}><Background color="rgb(var(--border))" gap={30} /><Controls showInteractive={false} /></ReactFlow></div>
      <ul className="sm:hidden space-y-1 text-sm">{inf.map((e, i) => <li key={i}>{e.from} → {e.to}{e.note ? <span className="text-muted"> ({e.note})</span> : null}</li>)}</ul>
    </>
  );
}

type Tab = 'positions' | 'compare' | 'detail' | 'battleground' | 'timeline' | 'argument' | 'influence' | 'sequences' | 'ask';

export function DebatePage() {
  const { id = '' } = useParams();
  const loc = useLocation();
  const [sp, setSp] = useSearchParams();
  const d = debateById.get(id);
  const pos = sp.get('pos');
  const tab = (sp.get('tab') as Tab) || (pos ? 'detail' : 'positions');
  const setTab = (t: Tab, extra?: Record<string, string>) => setSp({ tab: t, ...(extra ?? (pos ? { pos } : {})) }, { replace: true });
  if (!d) return <Empty>No debate with the id “{id}”. <Link to="/debates" className="text-accent">See all debates</Link>.</Empty>;
  const position = d.positions.find((p) => p.id === pos) ?? d.positions[0];
  const isMovement = loc.pathname.startsWith('/movements');
  const ctx = contextItems.filter((c) => c.debateIds.includes(d.id));
  const rules = `You are a scrupulously even-handed theology tutor inside Logos Atlas, a Bible-study app. The topic is "${d.title}": ${d.question}
Positions in the atlas: ${d.positions.map((p) => `${p.name} — ${p.summary.slice(0, 400)}`).join('\n')}
Rules: present each view as its best defenders would (steelman), never declare a winner or imply one view is the default, cite scripture as (Book chapter:verse), name real scholars and works only when you are confident, say "I'm not certain of the exact citation" otherwise, and never fabricate quotations. If asked which view is correct, explain what each side would say and what the user might weigh. Keep answers under 220 words unless asked for more.`;

  return (
    <div>
      <div className="text-sm mb-3"><Link to={isMovement ? '/movements' : '/debates'} className="text-muted hover:text-accent">← {isMovement ? 'Movements' : 'Debates'}</Link></div>
      <PageHeader eyebrow={d.category} title={d.title} actions={<Bookmark path={loc.pathname} />}>
        <span className="text-ink">{d.question}</span>
      </PageHeader>
      <div className="flex h-2 rounded overflow-hidden mb-4 max-w-xl">{d.positions.map((p) => <button key={p.id} className="flex-1 hover:opacity-80" style={{ background: colorOf(d, p) }} title={p.name} onClick={() => setTab('detail', { pos: p.id })} />)}</div>
      <Tabs<Tab> value={tab} onChange={(t) => setTab(t)} tabs={[
        { id: 'positions', label: 'Positions' }, { id: 'compare', label: 'Side by side' }, { id: 'detail', label: 'Full case' }, { id: 'battleground', label: 'Scripture battleground' },
        { id: 'sequences', label: 'Flowcharts', hidden: !d.positions.some((p) => p.sequence?.length) }, { id: 'argument', label: 'Argument map' }, { id: 'influence', label: 'Who influenced whom' },
        { id: 'timeline', label: 'Origins' }, { id: 'ask', label: '✦ Ask a tutor' },
      ]} />
      {tab === 'positions' && (
        <div className="space-y-6">
          {plain[d.id] && <PlainBox title="This debate in plain words" summary={plain[d.id].summary} takeaway={plain[d.id].takeaway} extra={plain[d.id].whyItMatters} />}
          {guides.filter((g) => g.related.some((r) => r.endsWith('/' + d.id))).length > 0 && (
            <div className="flex flex-wrap gap-2 items-center"><span className="eyebrow">Study guide</span>{guides.filter((g) => g.related.some((r) => r.endsWith('/' + d.id))).map((g) => <Link key={g.id} to={`/guides/${g.id}`} className="chip hover:border-accent !text-[.82rem] !py-1">{g.title} →</Link>)}</div>
          )}
          <div className="eyebrow">In depth</div>
          <Paras text={d.intro} />
          <div><span className="eyebrow mr-2">Key texts</span><Refs refs={d.keyRefs} /></div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{d.positions.map((p) => <PositionCard key={p.id} d={d} p={p} onOpen={() => setTab('detail', { pos: p.id })} />)}</div>
          {ctx.length > 0 && <Section title="Background from the context library"><div className="flex flex-wrap gap-2">{ctx.map((c) => <Link key={c.id} className="chip hover:border-accent" to={`/context/${c.id}`}>{c.title}</Link>)}</div></Section>}
        </div>
      )}
      {tab === 'compare' && <Compare d={d} />}
      {tab === 'detail' && (
        <div>
          <div className="flex flex-wrap gap-1.5 mb-5">{d.positions.map((p) => <button key={p.id} onClick={() => setTab('detail', { pos: p.id })} className="chip !py-1 !text-[.82rem]" style={{ borderColor: p.id === position.id ? colorOf(d, p) : undefined, color: p.id === position.id ? colorOf(d, p) : undefined }}>{p.name}</button>)}</div>
          <PositionDetail d={d} p={position} />
        </div>
      )}
      {tab === 'battleground' && <Battleground d={d} />}
      {tab === 'sequences' && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{d.positions.filter((p) => p.sequence?.length).map((p) => <Sequence key={p.id} steps={p.sequence!} color={colorOf(d, p)} title={p.name} />)}</div>}
      {tab === 'argument' && <ArgumentMap d={d} />}
      {tab === 'influence' && <Influence d={d} />}
      {tab === 'timeline' && (
        <ol className="relative border-l-2 border-line ml-2 space-y-4">
          {[...d.timeline].sort((a, b) => a.year - b.year).map((t, i) => (
            <motion.li key={i} className="ml-5" initial={{ opacity: 0.001, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
              <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-accent2 mt-1.5" />
              <div className="tabular text-sm text-muted">{fmtYear(t.year)} <Conf c={t.confidence} small /></div>
              <div className="font-semibold">{t.title}</div><p className="font-serif text-[.95rem]">{t.note}</p>
            </motion.li>
          ))}
        </ol>
      )}
      {tab === 'ask' && (
        <Chat key={d.id} rules={rules} speaker="Tutor" placeholder="Ask about any side of this debate…"
          intro="Ask Claude to steelman a view, explain a verse from each side, or trace where an idea came from. It is instructed never to pick a winner."
          suggestions={[`What is the strongest case for each side?`, `Which verses are hardest for each view?`, `Where did this debate begin historically?`, `What do the sides actually agree on?`]} />
      )}
    </div>
  );
}
