/** Topic deep studies (hermeneutics, ministries, gifts): one page per topic with a set of interactive visuals. */
import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactFlow, Background, Controls, MarkerType, type Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { topics, topicById } from '../data';
import { PageHeader, Section, Refs, Conf, Paras, Empty, Tabs, Bookmark, Rich, SourceLine } from '../components/ui';
import { Misreadings } from '../components/StudyViz';
import { t, fmtYear } from '../i18n';
import type { TopicStudyT } from '../schemas';

type TabId = 'overview' | 'map' | 'flow' | 'decide' | 'timeline' | 'gallery' | 'compare' | 'spectrum' | 'cases' | 'misreadings' | 'views' | 'practice';
const color = (c: string, a = 1) => `rgb(var(--${c}) / ${a})`;
const groupColor = (tp: TopicStudyT, id: string) => tp.groups.find((g) => g.id === id)?.color ?? 'accent';

export function TopicsIndex() {
  return (
    <div>
      <PageHeader eyebrow={t('Deep topics')} title={t('Topic studies')}>{t('Long, visual studies of big questions: how to read the Bible, the ministries God gives, and how gifts and talents are meant to be used.')}</PageHeader>
      <div className="grid gap-3 md:grid-cols-3">{topics.map((tp, i) => (
        <motion.div key={tp.id} initial={{ opacity: 0.5, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
          <Link to={`/topics/${tp.id}`} className="card p-5 block h-full hover:border-accent">
            <div className="display text-2xl leading-tight">{tp.title}</div>
            <div className="text-sm text-muted mt-1">{tp.subtitle}</div>
            <p className="font-serif mt-2 line-clamp-4"><Rich text={tp.plain} /></p>
            <div className="flex flex-wrap gap-1.5 mt-3">{tp.groups.map((g) => <span key={g.id} className="chip" style={{ borderColor: color(g.color, 0.6) }}><span className="w-2 h-2 rounded-full" style={{ background: color(g.color) }} />{g.label}</span>)}</div>
          </Link>
        </motion.div>))}
        {!topics.length && <Empty>{t('The topic studies are being written.')}</Empty>}
      </div>
    </div>
  );
}

export default function TopicPage() {
  const { id = '' } = useParams();
  const [sp, setSp] = useSearchParams();
  const tp = topicById.get(id);
  if (!tp) return <Empty>{t('No topic study with this id.')} <Link to="/topics" className="text-accent">{t('See all topics')}</Link></Empty>;
  const tab = (sp.get('tab') as TabId) || 'overview';
  const setTab = (x: TabId) => { const n = new URLSearchParams(sp); n.set('tab', x); setSp(n, { replace: true }); };
  const others = topics.filter((x) => x.id !== id);
  return (
    <div>
      <div className="text-sm mb-3 flex flex-wrap justify-between gap-2"><Link to="/topics" className="text-muted hover:text-accent">← {t('All topic studies')}</Link>
        <span className="flex flex-wrap gap-3">{others.map((o) => <Link key={o.id} to={`/topics/${o.id}`} className="text-muted hover:text-accent">{o.title.split(':')[0]}</Link>)}</span></div>
      <PageHeader eyebrow={t('Deep topic study')} title={tp.title} actions={<Bookmark path={`/topics/${id}`} />}>{tp.subtitle}</PageHeader>
      <Tabs value={tab} onChange={setTab} tabs={[
        { id: 'overview', label: t('Overview') }, { id: 'map', label: t('Concept map') }, { id: 'flow', label: t('Step by step') }, { id: 'decide', label: t('Decision guide') },
        { id: 'timeline', label: t('Timeline') }, { id: 'gallery', label: t('Explorer') }, { id: 'compare', label: t('Compare') }, { id: 'spectrum', label: t('Spectrum') },
        { id: 'cases', label: t('Worked examples') }, { id: 'misreadings', label: t('Misreadings ({n})', { n: tp.misreadings.length }) }, { id: 'views', label: t('Views') }, { id: 'practice', label: t('Practice') },
      ]} />
      <div key={tab} className="page-enter">
        {tab === 'overview' && <Overview tp={tp} go={setTab} />}
        {tab === 'map' && <ConceptMap tp={tp} />}
        {tab === 'flow' && <FlowWalk tp={tp} />}
        {tab === 'decide' && <DecisionTree tp={tp} />}
        {tab === 'timeline' && <Timeline tp={tp} />}
        {tab === 'gallery' && <Gallery tp={tp} />}
        {tab === 'compare' && <Compare tp={tp} />}
        {tab === 'spectrum' && <Spectrum tp={tp} />}
        {tab === 'cases' && <Cases tp={tp} />}
        {tab === 'misreadings' && <Misreadings list={tp.misreadings} />}
        {tab === 'views' && <Views tp={tp} />}
        {tab === 'practice' && <Practice tp={tp} />}
      </div>
    </div>
  );
}

/* ---------- overview: plain answer, key points, chaptered reading with a progress rail ---------- */
function Overview({ tp, go }: { tp: TopicStudyT; go: (t: TabId) => void }) {
  const [open, setOpen] = useState(0);
  const tiles: [TabId, string, string][] = [['map', t('Concept map'), '✣'], ['flow', t('Step by step'), '➜'], ['decide', t('Decision guide'), '⑂'], ['timeline', t('Timeline'), '⟿'], ['gallery', t('Explorer'), '▦'], ['spectrum', t('Spectrum'), '↔']];
  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="card p-5" style={{ background: color('accent', 0.05) }}><div className="eyebrow mb-1">{t('The short answer')}</div><Paras text={tp.plain} /></div>
        <div className="card p-5"><div className="eyebrow mb-2">{t('Key points')}</div><ol className="space-y-2">{tp.keyPoints.map((k, i) => <li key={i} className="flex gap-2.5"><span className="display text-xl rubric tabular leading-none">{i + 1}</span><span className="font-serif"><Rich text={k} /></span></li>)}</ol></div>
      </div>
      <div className="grid gap-2 grid-cols-3 md:grid-cols-6 my-6">{tiles.map(([id, label, g]) => <button key={id} onClick={() => go(id)} className="card p-3 text-center hover:border-accent"><div className="text-2xl text-accent">{g}</div><div className="text-sm font-semibold mt-1 leading-tight">{label}</div></button>)}</div>
      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="hidden lg:block sticky top-16 self-start"><ol className="border-l-2 border-line">{tp.sections.map((s, i) => (
          <li key={s.id}><button onClick={() => setOpen(i)} className={`block text-left text-sm py-1.5 pl-3 -ml-0.5 border-l-2 ${open === i ? 'border-accent text-accent font-semibold' : 'border-transparent text-muted hover:text-ink'}`}>{i + 1}. {s.heading}</button></li>))}</ol></nav>
        <div className="space-y-2">{tp.sections.map((s, i) => {
          const on = open === i;
          return (
            <div key={s.id} className={`card overflow-hidden ${on ? 'border-accent' : ''}`}>
              <button className="w-full text-left p-4 flex items-center justify-between gap-3" onClick={() => setOpen(on ? -1 : i)}>
                <span className="flex gap-3 items-baseline"><span className="display text-2xl rubric tabular">{i + 1}</span><span className="display text-xl leading-tight">{s.heading}</span></span>
                <span className="flex items-center gap-2 shrink-0">{s.confidence && <Conf c={s.confidence} small />}<span className="text-muted">{on ? '−' : '+'}</span></span>
              </button>
              <AnimatePresence initial={false}>{on && <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden"><div className="px-4 pb-5">
                <Paras text={s.body} />
                {s.callout && <div className="mt-3 rounded-xl p-3 border-l-4" style={{ borderColor: color(s.callout.kind === 'myth' ? 'warn' : s.callout.kind === 'debate' ? 'nt' : s.callout.kind === 'tip' ? 'good' : 'accent-2'), background: color(s.callout.kind === 'myth' ? 'warn' : 'accent', 0.07) }}>
                  <div className="eyebrow mb-0.5">{s.callout.kind === 'myth' ? t('Common myth') : s.callout.kind === 'debate' ? t('Scholars disagree') : s.callout.kind === 'tip' ? t('Tip') : t('Tradition')}</div><p className="font-serif"><Rich text={s.callout.text} /></p></div>}
                <div className="mt-3"><Refs refs={s.refs} max={8} /></div>
              </div></motion.div>}</AnimatePresence>
            </div>);
        })}</div>
      </div>
      {tp.sources.length > 0 && <Section title={t('Further reading')}><ul className="text-sm space-y-1">{tp.sources.map((s, i) => <li key={i}><SourceLine s={s} /></li>)}</ul></Section>}
    </div>
  );
}

/* ---------- concept map: nodes laid out in group columns, labelled arrows, side panel ---------- */
function ConceptMap({ tp }: { tp: TopicStudyT }) {
  const [sel, setSel] = useState<string | null>(tp.map.nodes[0]?.id ?? null);
  const [only, setOnly] = useState<string | null>(null);
  const { nodes, edges } = useMemo(() => {
    const cols = tp.groups.map((g) => g.id);
    const counts = new Map<string, number>();
    const linked = new Set(sel ? tp.map.edges.filter((e) => e.from === sel || e.to === sel).flatMap((e) => [e.from, e.to]) : []);
    const nodes: Node[] = tp.map.nodes.map((n) => {
      const c = Math.max(0, cols.indexOf(n.group)); const r = counts.get(n.group) ?? 0; counts.set(n.group, r + 1);
      const gc = groupColor(tp, n.group); const dim = (only && n.group !== only) || (sel && !linked.has(n.id) && sel !== n.id && linked.size > 0);
      return { id: n.id, position: { x: c * 185 + (r % 2) * 18, y: r * 78 }, data: { label: n.label },
        style: { width: 160, borderRadius: 14, padding: '8px 10px', fontSize: 14, fontWeight: 600, lineHeight: 1.2, opacity: dim ? 0.4 : 1, background: sel === n.id ? color(gc) : 'rgb(var(--surface))', color: sel === n.id ? 'rgb(var(--accent-ink))' : 'rgb(var(--text))', border: `2px solid ${color(gc, 0.8)}` } };
    });
    const edges: Edge[] = tp.map.edges.map((e, i) => {
      const on = sel === e.from || sel === e.to;
      return { id: `e${i}`, source: e.from, target: e.to, label: on ? e.label : undefined, type: 'smoothstep', animated: on, markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: on ? 'rgb(var(--accent))' : 'rgb(var(--border))', strokeWidth: on ? 2 : 1.2, opacity: only ? 0.35 : 1 }, labelStyle: { fontSize: 11, fill: 'rgb(var(--text))' }, labelBgStyle: { fill: 'rgb(var(--surface))' } };
    });
    return { nodes, edges };
  }, [tp, sel, only]);
  const n = tp.map.nodes.find((x) => x.id === sel);
  const rel = sel ? tp.map.edges.filter((e) => e.from === sel || e.to === sel) : [];
  const label = (id: string) => tp.map.nodes.find((x) => x.id === id)?.label ?? id;
  return (
    <div>
      <h2 className="display text-2xl">{tp.map.title}</h2><p className="font-serif text-[1.05rem] max-w-[72ch] mt-1 mb-3"><Rich text={tp.map.intro} /></p>
      <GroupFilter tp={tp} value={only} onChange={setOnly} />
      <div className="grid gap-4 mt-3">
        <div className="card h-[440px] md:h-[600px] overflow-hidden"><ReactFlow nodes={nodes} edges={edges} fitView fitViewOptions={{ padding: 0.04 }} minZoom={0.15} maxZoom={1.6} nodesConnectable={false} onNodeClick={(_, x) => setSel(x.id)} proOptions={{ hideAttribution: true }}><Background gap={22} color="rgb(var(--border))" /><Controls showInteractive={false} /></ReactFlow></div>
        {n && <motion.div key={n.id} className="card p-5 max-w-4xl" initial={{ opacity: 0.5, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="eyebrow" style={{ color: color(groupColor(tp, n.group)) }}>{tp.groups.find((g) => g.id === n.group)?.label}</div>
          <div className="display text-2xl leading-tight">{n.label}</div>
          <p className="font-serif text-[1.05rem] mt-2"><Rich text={n.detail} /></p>
          {n.examples?.length ? <div className="flex flex-wrap gap-1.5 mt-2">{n.examples.map((x) => <span key={x} className="chip">{x}</span>)}</div> : null}
          <div className="mt-2"><Refs refs={n.refs} max={5} /></div>
          {rel.length > 0 && <div className="mt-3 border-t border-line pt-2"><div className="eyebrow mb-1">{t('Connections')}</div><ul className="space-y-1 text-sm">{rel.map((e, i) => {
            const other = e.from === sel ? e.to : e.from;
            return <li key={i}><button className="text-left hover:text-accent" onClick={() => setSel(other)}>{e.from === sel ? <>→ <i>{e.label}</i> → <b>{label(other)}</b></> : <><b>{label(other)}</b> → <i>{e.label}</i> →</>}</button></li>;
          })}</ul></div>}
        </motion.div>}
      </div>
    </div>
  );
}
function GroupFilter({ tp, value, onChange }: { tp: TopicStudyT; value: string | null; onChange: (g: string | null) => void }) {
  return <div className="flex flex-wrap gap-1.5"><button className={`chip ${!value ? '!border-accent text-accent' : ''}`} onClick={() => onChange(null)}>{t('All')}</button>{tp.groups.map((g) => (
    <button key={g.id} onClick={() => onChange(value === g.id ? null : g.id)} className="chip" style={value === g.id ? { borderColor: color(g.color), color: color(g.color) } : undefined}><span className="w-2 h-2 rounded-full" style={{ background: color(g.color) }} />{g.label}</button>))}</div>;
}

/* ---------- step-by-step flowchart with questions to ask ---------- */
function FlowWalk({ tp }: { tp: TopicStudyT }) {
  const [at, setAt] = useState(0);
  const s = tp.flow.steps[at];
  return (
    <div>
      <h2 className="display text-2xl">{tp.flow.title}</h2><p className="font-serif text-[1.05rem] max-w-[72ch] mt-1 mb-4"><Rich text={tp.flow.intro} /></p>
      <div className="grid gap-5 md:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
        <ol className="relative">{tp.flow.steps.map((st, i) => (
          <li key={i} className="flex gap-3 items-stretch">
            <div className="flex flex-col items-center"><button onClick={() => setAt(i)} className={`w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold tabular shrink-0 transition-colors ${i === at ? 'bg-accent text-accentInk border-accent' : i < at ? 'border-accent text-accent' : 'border-line text-muted'}`}>{i + 1}</button>{i < tp.flow.steps.length - 1 && <span className={`w-0.5 flex-1 my-1 ${i < at ? 'bg-accent' : 'bg-line'}`} />}</div>
            <button onClick={() => setAt(i)} className={`text-left pb-4 pt-1.5 font-semibold leading-tight ${i === at ? 'text-accent' : ''}`}>{st.label}</button>
          </li>))}</ol>
        {s && <motion.div key={at} initial={{ opacity: 0.4, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-5 self-start">
          <div className="eyebrow">{t('Step {n} of {total}', { n: at + 1, total: tp.flow.steps.length })}</div>
          <div className="display text-3xl leading-tight">{s.label}</div>
          <p className="font-serif text-[1.08rem] mt-2"><Rich text={s.detail} /></p>
          <div className="mt-4 rounded-xl p-4" style={{ background: color('accent', 0.06) }}><div className="eyebrow mb-2">{t('Questions to ask')}</div>
            <ul className="space-y-1.5">{s.ask.map((q, i) => <li key={i} className="flex gap-2 font-serif"><span className="text-accent">?</span><span><Rich text={q} /></span></li>)}</ul></div>
          <div className="mt-3"><Refs refs={s.refs} max={5} /></div>
          <div className="flex justify-between mt-4"><button className="btn" disabled={at === 0} onClick={() => setAt(at - 1)}>← {t('Back')}</button>{at < tp.flow.steps.length - 1 ? <button className="btn btn-primary" onClick={() => setAt(at + 1)}>{t('Next step')} →</button> : <button className="btn" onClick={() => setAt(0)}>↺ {t('Start again')}</button>}</div>
        </motion.div>}
      </div>
    </div>
  );
}

/* ---------- decision tree with breadcrumb trail ---------- */
function DecisionTree({ tp }: { tp: TopicStudyT }) {
  const d = tp.decision;
  const [path, setPath] = useState<{ node: string; choice?: string }[]>([{ node: d.start }]);
  const cur = path[path.length - 1].node;
  const q = d.nodes.find((n) => n.id === cur);
  const r = d.results.find((x) => x.id === cur);
  const choose = (label: string, next: string) => setPath([...path.slice(0, -1), { node: cur, choice: label }, { node: next }]);
  return (
    <div className="max-w-3xl">
      <h2 className="display text-2xl">{d.title}</h2><p className="font-serif text-[1.05rem] mt-1 mb-4"><Rich text={d.intro} /></p>
      {path.length > 1 && <ol className="mb-4 space-y-1">{path.slice(0, -1).map((p, i) => (
        <li key={i} className="flex gap-2 items-start text-sm"><span className="text-muted tabular w-5">{i + 1}.</span><span className="text-muted flex-1">{d.nodes.find((n) => n.id === p.node)?.q}</span><button className="chip !border-accent text-accent shrink-0" onClick={() => setPath(path.slice(0, i + 1).map((x, j) => (j === i ? { node: x.node } : x)))}>{p.choice} ✎</button></li>))}</ol>}
      <AnimatePresence mode="wait">
        {q && <motion.div key={q.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="card p-5">
          <div className="eyebrow">{t('Question {n}', { n: path.length })}</div><div className="display text-2xl leading-tight mt-0.5">{q.q}</div>
          <div className="grid gap-2 sm:grid-cols-2 mt-4">{q.options.map((o) => <button key={o.label} onClick={() => choose(o.label, o.next)} className="card p-3 text-left font-semibold hover:border-accent hover:bg-sunk">{o.label} →</button>)}</div>
        </motion.div>}
        {r && <motion.div key={r.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="card p-6 border-2" style={{ borderColor: color('accent') }}>
          <div className="eyebrow">{t('Where this leads')}</div><div className="display text-3xl leading-tight">{r.title}</div>
          <div className="mt-2"><Paras text={r.text} /></div><div className="mt-3"><Refs refs={r.refs} max={6} /></div>
          <button className="btn mt-4" onClick={() => setPath([{ node: d.start }])}>↺ {t('Start again')}</button>
        </motion.div>}
      </AnimatePresence>
      <div className="mt-6"><div className="eyebrow mb-2">{t('All possible outcomes')}</div><div className="flex flex-wrap gap-1.5">{d.results.map((x) => <button key={x.id} className={`chip ${cur === x.id ? '!border-accent text-accent' : ''}`} onClick={() => setPath([{ node: x.id }])}>{x.title}</button>)}</div></div>
    </div>
  );
}

/* ---------- horizontal, scrollable timeline coloured by group ---------- */
function Timeline({ tp }: { tp: TopicStudyT }) {
  const ev = [...tp.timeline.events].sort((a, b) => a.year - b.year);
  const [sel, setSel] = useState(0);
  const [only, setOnly] = useState<string | null>(null);
  const list = ev.filter((e) => !only || e.group === only);
  const e = list[Math.min(sel, list.length - 1)];
  return (
    <div>
      <h2 className="display text-2xl mb-2">{tp.timeline.title}</h2>
      <GroupFilter tp={tp} value={only} onChange={(g) => { setOnly(g); setSel(0); }} />
      <div className="card mt-3 p-3 scroll-x"><ol className="flex gap-0 min-w-max relative pt-2 pb-1">
        <span className="absolute left-0 right-0 top-[30px] h-0.5 bg-line" />
        {list.map((x, i) => { const gc = groupColor(tp, x.group); return (
          <li key={i} className="w-36 shrink-0 relative"><button onClick={() => setSel(i)} className="w-full text-left px-2">
            <div className="text-xs tabular text-muted h-5">{fmtYear(x.year)}</div>
            <span className="block w-4 h-4 rounded-full border-2 my-1 transition-transform" style={{ background: i === sel ? color(gc) : 'rgb(var(--surface))', borderColor: color(gc), transform: i === sel ? 'scale(1.3)' : undefined }} />
            <div className={`text-sm leading-tight ${i === sel ? 'font-semibold text-accent' : ''}`}>{x.label}</div></button></li>); })}
      </ol></div>
      {e && <motion.div key={e.label + e.year} initial={{ opacity: 0.4, y: 6 }} animate={{ opacity: 1, y: 0 }} className="card p-5 mt-3 max-w-3xl">
        <div className="eyebrow" style={{ color: color(groupColor(tp, e.group)) }}>{fmtYear(e.year)} · {tp.groups.find((g) => g.id === e.group)?.label}</div>
        <div className="display text-2xl">{e.label}</div><p className="font-serif text-[1.06rem] mt-1"><Rich text={e.text} /></p>
        <div className="flex justify-between mt-3"><button className="btn" disabled={sel === 0} onClick={() => setSel(sel - 1)}>←</button><button className="btn" disabled={sel >= list.length - 1} onClick={() => setSel(sel + 1)}>→</button></div>
      </motion.div>}
    </div>
  );
}

/* ---------- filterable card explorer ---------- */
function Gallery({ tp }: { tp: TopicStudyT }) {
  const [only, setOnly] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const items = tp.gallery.items.filter((x) => (!only || x.group === only) && (!q || (x.title + x.summary + x.people.join(' ')).toLowerCase().includes(q.toLowerCase())));
  return (
    <div>
      <h2 className="display text-2xl">{tp.gallery.title}</h2><p className="font-serif text-[1.05rem] max-w-[72ch] mt-1 mb-3"><Rich text={tp.gallery.intro} /></p>
      <div className="flex flex-wrap gap-2 items-center mb-3"><input className="input max-w-xs" placeholder={t('Filter…')} value={q} onChange={(e) => setQ(e.target.value)} /><GroupFilter tp={tp} value={only} onChange={setOnly} /></div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{items.map((x) => { const on = open === x.id; const gc = groupColor(tp, x.group); return (
        <motion.button layout key={x.id} onClick={() => setOpen(on ? null : x.id)} className={`card p-4 text-left relative overflow-hidden ${on ? 'sm:col-span-2 lg:col-span-3 border-accent' : ''}`}>
          <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: color(gc) }} />
          <div className="flex justify-between gap-2"><span className="display text-xl leading-tight">{x.title}</span><span className="text-muted">{on ? '−' : '+'}</span></div>
          <p className="font-serif text-[.98rem] mt-1"><Rich text={x.summary} /></p>
          {on && <div className="mt-2" onClick={(e) => e.stopPropagation()}><Paras text={x.detail} />{x.people.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">{x.people.map((p) => <span key={p} className="chip">{p}</span>)}</div>}<div className="mt-2"><Refs refs={x.refs} max={6} /></div></div>}
        </motion.button>); })}</div>
      {!items.length && <Empty>{t('Nothing matches that filter.')}</Empty>}
    </div>
  );
}

/* ---------- comparison table with row focus ---------- */
function Compare({ tp }: { tp: TopicStudyT }) {
  const [col, setCol] = useState<number | null>(null);
  const c = tp.compare;
  return (
    <div>
      <h2 className="display text-2xl mb-1">{c.title}</h2><p className="text-sm text-muted mb-3">{t('Tap a column heading to highlight it.')}</p>
      <div className="card overflow-x-auto"><table className="w-full text-[.95rem] min-w-[640px]">
        <thead><tr><th className="p-3 text-left w-40" />{c.columns.map((h, i) => <th key={i} className={`p-3 text-left cursor-pointer ${col === i ? 'text-accent' : ''}`} onClick={() => setCol(col === i ? null : i)}>{h}</th>)}</tr></thead>
        <tbody>{c.rows.map((r, i) => <tr key={i} className="border-t border-line align-top"><th className="p-3 text-left font-semibold">{r.label}</th>{r.cells.map((cell, j) => <td key={j} className="p-3 font-serif transition-colors" style={col === j ? { background: color('accent', 0.08) } : col !== null ? { opacity: 0.55 } : undefined}><Rich text={cell} /></td>)}</tr>)}</tbody>
      </table></div>
    </div>
  );
}

/* ---------- spectrum between two poles ---------- */
function Spectrum({ tp }: { tp: TopicStudyT }) {
  const s = tp.spectrum;
  const stops = [...s.stops].sort((a, b) => a.pos - b.pos);
  const [sel, setSel] = useState(Math.floor(stops.length / 2));
  const cur = stops[sel];
  return (
    <div>
      <h2 className="display text-2xl">{s.title}</h2><p className="font-serif text-[1.05rem] max-w-[72ch] mt-1 mb-6"><Rich text={s.intro} /></p>
      <div className="mx-4 md:mx-12 pt-6 pb-6 md:pt-14 md:pb-14">
        <div className="relative h-3 rounded-full" style={{ background: `linear-gradient(90deg, ${color('nt', 0.7)}, ${color('accent', 0.4)}, ${color('ot', 0.7)})` }}>
          {stops.map((x, i) => (
            <button key={i} onClick={() => setSel(i)} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${x.pos}%` }} aria-label={x.label}>
              <span className={`block rounded-full border-[3px] transition-all ${i === sel ? 'w-7 h-7 bg-accent border-surface shadow-lg' : 'w-5 h-5 bg-surface border-accent'}`} />
              <span className={`hidden md:block absolute left-1/2 -translate-x-1/2 ${i % 2 ? 'top-9' : 'bottom-9'} text-[.72rem] leading-tight w-[5.5rem] text-center ${i === sel ? 'font-bold text-accent' : 'text-muted'}`}>{x.label}</span>
            </button>))}
        </div>
      </div>
      <div className="flex justify-between text-sm font-semibold mb-4 gap-4"><span className="max-w-[45%]">← {s.left}</span><span className="max-w-[45%] text-right">{s.right} →</span></div>
      <div className="md:hidden flex flex-wrap gap-1.5 mb-4">{stops.map((x, i) => <button key={i} onClick={() => setSel(i)} className={`chip ${i === sel ? '!bg-accent !text-accentInk !border-accent' : ''}`}><span className="tabular opacity-70">{i + 1}</span>{x.label}</button>)}</div>
      {cur && <motion.div key={sel} initial={{ opacity: 0.4, y: 6 }} animate={{ opacity: 1, y: 0 }} className="card p-5 max-w-3xl">
        <div className="display text-2xl">{cur.label}</div><div className="text-sm text-muted">{cur.who}</div><p className="font-serif text-[1.06rem] mt-2"><Rich text={cur.text} /></p>
        <div className="flex justify-between mt-3"><button className="btn" disabled={sel === 0} onClick={() => setSel(sel - 1)}>←</button><button className="btn" disabled={sel === stops.length - 1} onClick={() => setSel(sel + 1)}>→</button></div>
      </motion.div>}
    </div>
  );
}

/* ---------- worked examples, revealed one step at a time ---------- */
function Cases({ tp }: { tp: TopicStudyT }) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(1);
  const c = tp.cases[i];
  if (!c) return <Empty>{t('Worked examples are being written.')}</Empty>;
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-4">{tp.cases.map((x, j) => <button key={j} className={`chip !text-[.8rem] !py-1 ${j === i ? '!bg-accent !text-accentInk !border-accent' : ''}`} onClick={() => { setI(j); setShown(1); }}>{x.title}</button>)}</div>
      <motion.div key={i} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="max-w-3xl">
        <div className="card p-5" style={{ background: color('accent', 0.05) }}><div className="flex flex-wrap items-center gap-2"><span className="display text-2xl">{c.title}</span><Refs refs={[c.ref]} /></div><p className="font-serif text-[1.1rem] mt-1"><Rich text={c.question} /></p></div>
        <ol className="mt-3 space-y-2">{c.steps.slice(0, shown).map((s, j) => (
          <motion.li key={j} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="card p-4 flex gap-3"><span className="w-8 h-8 rounded-full bg-accent text-accentInk flex items-center justify-center font-bold shrink-0">{j + 1}</span>
            <div><div className="font-semibold">{s.step}</div><p className="font-serif mt-0.5"><Rich text={s.note} /></p></div></motion.li>))}</ol>
        {shown < c.steps.length ? <button className="btn btn-primary mt-3" onClick={() => setShown(shown + 1)}>{t('Show next step')} ({shown}/{c.steps.length})</button>
          : <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="card p-4 mt-3 border-2" style={{ borderColor: color('good', 0.7) }}><div className="eyebrow mb-1">{t('Takeaway')}</div><p className="font-serif text-[1.06rem]"><Rich text={c.takeaway} /></p></motion.div>}
      </motion.div>
    </div>
  );
}

function Views({ tp }: { tp: TopicStudyT }) {
  return <div className="grid gap-3 md:grid-cols-2">{tp.views.map((p) => (
    <div key={p.name} className="card p-4"><div className="display text-xl">{p.name}</div><div className="text-sm text-muted">{p.who}</div><p className="font-serif mt-2"><Rich text={p.summary} /></p>
      <div className="grid gap-2 sm:grid-cols-2 mt-3 text-sm"><div className="rounded-lg p-2.5" style={{ background: color('good', 0.1) }}><b>{t('Strengths.')}</b> <Rich text={p.strengths} /></div><div className="rounded-lg p-2.5" style={{ background: color('warn', 0.1) }}><b>{t('Critiques.')}</b> <Rich text={p.critiques} /></div></div></div>))}</div>;
}

function Practice({ tp }: { tp: TopicStudyT }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  return <div className="grid gap-3 md:grid-cols-2">{tp.practice.map((p, i) => (
    <div key={i} className="card p-5"><div className="display text-xl mb-2">{p.title}</div><ol className="space-y-2">{p.steps.map((s, j) => { const k = `${i}-${j}`; return (
      <li key={j}><label className="flex gap-2.5 items-start cursor-pointer"><input type="checkbox" className="mt-1.5 accent-[rgb(var(--accent))]" checked={!!done[k]} onChange={() => setDone({ ...done, [k]: !done[k] })} /><span className={`font-serif ${done[k] ? 'line-through opacity-60' : ''}`}><Rich text={s} /></span></label></li>); })}</ol></div>))}</div>;
}
