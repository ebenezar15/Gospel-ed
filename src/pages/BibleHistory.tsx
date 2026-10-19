import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactFlow, Background, Controls, MarkerType, type Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { bibleHistory, guideById } from '../data';
import { PageHeader, Tabs, Refs, Ref, Conf, SourceLine, DateWithConf, fmtYear, Empty } from '../components/ui';

const KIND: Record<string, { label: string; c: string }> = {
  oral: { label: 'Oral tradition', c: 'muted' }, writing: { label: 'Writing', c: 'accent' }, canon: { label: 'Canon', c: 'accent-2' }, council: { label: 'Councils', c: 'accent-2' },
  manuscript: { label: 'Manuscripts', c: 'gold' }, discovery: { label: 'Discoveries', c: 'good' }, textual: { label: 'Textual study', c: 'warn' },
  translation: { label: 'Translations', c: 'nt' }, printing: { label: 'Printing', c: 'ot' }, division: { label: 'Chapters & verses', c: 'muted' },
};

function Timeline() {
  const ms = [...bibleHistory.milestones].sort((a, b) => a.year - b.year);
  const [kinds, setKinds] = useState<string[]>(Object.keys(KIND));
  const [sel, setSel] = useState<string | null>(ms[0]?.id ?? null);
  const shown = ms.filter((m) => kinds.includes(m.kind));
  const m = ms.find((x) => x.id === sel);
  if (!ms.length) return <Empty>The history timeline is being written.</Empty>;
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-4">{Object.entries(KIND).filter(([k]) => ms.some((x) => x.kind === k)).map(([k, v]) => (
        <label key={k} className="chip cursor-pointer"><input type="checkbox" id={`k-${k}`} checked={kinds.includes(k)} onChange={() => setKinds((x) => x.includes(k) ? x.filter((y) => y !== k) : [...x, k])} /><span className="w-2.5 h-2.5 rounded-full" style={{ background: `rgb(var(--${v.c}))` }} />{v.label}</label>
      ))}</div>
      <div className="scroll-x pb-3 -mx-1 px-1">
        <ol className="flex gap-0 min-w-max relative pt-2">
          <div className="absolute left-0 right-0 top-[38px] h-0.5 bg-line" />
          {shown.map((x, i) => (
            <li key={x.id} className="w-36 shrink-0 relative">
              <button onClick={() => setSel(x.id)} className="w-full text-left px-2 group">
                <div className={`text-xs tabular ${sel === x.id ? 'text-accent font-semibold' : 'text-muted'}`}>{fmtYear(x.year)}</div>
                <motion.span className="block w-4 h-4 rounded-full border-2 border-surface my-2" style={{ background: `rgb(var(--${KIND[x.kind].c}))`, boxShadow: sel === x.id ? '0 0 0 4px rgb(var(--accent) / .25)' : undefined }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: Math.min(i * 0.02, 0.8) }} />
                <div className={`text-[.82rem] leading-snug ${sel === x.id ? 'font-semibold' : 'group-hover:text-accent'}`}>{x.title}</div>
              </button>
            </li>
          ))}
        </ol>
      </div>
      <AnimatePresence mode="wait">{m && (
        <motion.article key={m.id} className="card p-5 mt-3" initial={{ opacity: 0.001, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          <div className="flex flex-wrap gap-2 items-center text-sm"><span className="chip" style={{ borderColor: `rgb(var(--${KIND[m.kind].c}))` }}>{KIND[m.kind].label}</span><span className="tabular text-muted">{fmtYear(m.year)}{m.endYear ? `–${fmtYear(m.endYear)}` : ''} · {m.place}</span><Conf c={m.confidence} small /></div>
          <h2 className="text-3xl mt-1">{m.title}</h2>
          <p className="font-serif text-[1.2rem] mt-2">{m.summary}</p>
          <div className="prose-serif mt-3 !max-w-[75ch]">{m.details.split(/\n\n+/).map((p, i) => <p key={i}>{p}</p>)}</div>
          {m.refs.length > 0 && <div className="mt-3"><Refs refs={m.refs} /></div>}
          {m.sources.length > 0 && <ul className="mt-3 text-sm space-y-0.5">{m.sources.map((s, i) => <li key={i}><SourceLine s={s} /></li>)}</ul>}
          <div className="flex justify-between mt-4">
            {shown[shown.indexOf(m) - 1] ? <button className="btn" onClick={() => setSel(shown[shown.indexOf(m) - 1].id)}>← Earlier</button> : <span />}
            {shown[shown.indexOf(m) + 1] && <button className="btn btn-primary" onClick={() => setSel(shown[shown.indexOf(m) + 1].id)}>Later →</button>}
          </div>
        </motion.article>
      )}</AnimatePresence>
    </div>
  );
}

function Manuscripts() {
  const list = [...bibleHistory.manuscripts].sort((a, b) => a.date.year - b.date.year);
  if (!list.length) return <Empty>The manuscript gallery is being written.</Empty>;
  const min = list[0].date.year, max = list[list.length - 1].date.year;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {list.map((m) => (
        <article key={m.id} className="card p-4">
          <div className="flex justify-between gap-2 items-baseline"><h3 className="display text-xl">{m.name}</h3>{m.siglum && <span className="chip font-mono">{m.siglum}</span>}</div>
          <div className="text-sm flex flex-wrap gap-x-3 gap-y-1 my-1"><DateWithConf d={m.date} /><span className="text-muted">{m.language} · {m.material}</span></div>
          <div className="h-1.5 bg-sunk rounded-full my-2 relative" title="Position in time"><span className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-accent" style={{ left: `calc(${((m.date.year - min) / (max - min || 1)) * 100}% - 6px)` }} /></div>
          <p className="font-serif text-[1.02rem]"><b>Contains:</b> {m.contents}</p>
          <p className="font-serif text-[1.02rem] mt-1"><b>Why it matters:</b> {m.significance}</p>
          <div className="text-xs text-muted mt-2">{m.discovered} · Now: {m.location}</div>
        </article>
      ))}
    </div>
  );
}

function Variants() {
  const vs = bibleHistory.variants;
  const [i, setI] = useState(0);
  const v = vs[i];
  if (!v) return <Empty>The disputed passages are being written.</Empty>;
  return (
    <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
      <div className="flex lg:flex-col gap-1.5 scroll-x">{vs.map((x, j) => <button key={x.id} onClick={() => setI(j)} className={`text-left px-3 py-2 rounded-xl shrink-0 text-sm ${j === i ? 'bg-accent/10 text-accent font-semibold' : 'hover:bg-sunk'}`}>{x.title}<div className="text-xs text-muted font-normal">{x.ref}</div></button>)}</div>
      <motion.article key={v.id} initial={{ opacity: 0.001 }} animate={{ opacity: 1 }}>
        <div className="flex flex-wrap gap-2 items-center"><h2 className="text-3xl">{v.title}</h2><Conf c={v.confidence} small /></div>
        <div className="my-2"><Ref r={v.ref} /> <span className="text-sm text-muted">Hover to read it in the KJV, which includes most of these passages.</span></div>
        <p className="font-serif text-[1.2rem]">{v.plain}</p>
        <div className="grid gap-3 md:grid-cols-2 mt-4">
          <div className="rounded-xl p-4 border" style={{ borderColor: 'rgb(var(--good) / .4)', background: 'rgb(var(--good) / .05)' }}><div className="eyebrow mb-1" style={{ color: 'rgb(var(--good))' }}>Evidence it is original</div><p className="font-serif">{v.evidenceFor}</p></div>
          <div className="rounded-xl p-4 border" style={{ borderColor: 'rgb(var(--bad) / .4)', background: 'rgb(var(--bad) / .05)' }}><div className="eyebrow mb-1" style={{ color: 'rgb(var(--bad))' }}>Evidence it was added later</div><p className="font-serif">{v.evidenceAgainst}</p></div>
        </div>
        <div className="card p-4 mt-3"><div className="eyebrow mb-1">How modern Bibles handle it</div><p className="font-serif">{v.modern}</p><div className="eyebrow mt-3 mb-1">Does it change any doctrine?</div><p className="font-serif">{v.significance}</p></div>
      </motion.article>
    </div>
  );
}

function Translations() {
  const ts = [...bibleHistory.translations].sort((a, b) => a.year - b.year);
  const [sel, setSel] = useState<string | null>(null);
  const { nodes, edges } = useMemo(() => {
    const lanes: number[] = [];
    const nodes: Node[] = ts.map((t) => {
      const x = t.year < 1000 ? (t.year + 300) * 0.9 : 1170 + (t.year - 1000) * 2.2;
      let lane = 0; while ((lanes[lane] ?? -1e9) > x - 190) lane++; lanes[lane] = x;
      return { id: t.id, position: { x, y: lane * 78 }, data: { label: <div><div className="text-[10px] opacity-70 tabular">{t.year < 0 ? `${-t.year} BC` : t.year}</div><div className="font-semibold text-[12px] leading-tight">{t.name}</div></div> },
        style: { width: 170, background: sel === t.id ? 'rgb(var(--accent))' : 'rgb(var(--surface))', color: sel === t.id ? 'rgb(var(--accent-ink))' : 'rgb(var(--text))', border: '1.5px solid rgb(var(--accent) / .5)', borderRadius: 12, padding: 8 } };
    });
    const ids = new Set(ts.map((t) => t.id));
    const edges: Edge[] = ts.flatMap((t) => t.parent.filter((p) => ids.has(p)).map((p) => ({ id: `${p}>${t.id}`, source: p, target: t.id, markerEnd: { type: MarkerType.ArrowClosed }, animated: sel === t.id || sel === p, style: { stroke: 'rgb(var(--accent) / .6)' } })));
    return { nodes, edges };
  }, [sel]);
  const t = ts.find((x) => x.id === sel);
  if (!ts.length) return <Empty>The translation family tree is being written.</Empty>;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Arrows run from a translation to those that drew on it. Click any translation for its story.</p>
      <div className="card h-[60vh] hidden sm:block"><ReactFlow nodes={nodes} edges={edges} fitView minZoom={0.1} nodesConnectable={false} onNodeClick={(_, n) => setSel(n.id)} proOptions={{ hideAttribution: true }}><Background color="rgb(var(--border))" gap={30} /><Controls showInteractive={false} /></ReactFlow></div>
      <div className="sm:hidden flex flex-wrap gap-1.5">{ts.map((x) => <button key={x.id} className={`chip ${sel === x.id ? '!border-accent' : ''}`} onClick={() => setSel(x.id)}>{x.name}</button>)}</div>
      {t && <motion.article key={t.id} className="card p-5" initial={{ opacity: 0.001, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h3 className="text-2xl">{t.name} <span className="text-muted text-lg tabular">{t.year < 0 ? `${-t.year} BC` : t.year}</span></h3>
        <div className="text-sm text-muted mb-2">{t.translators} · {t.language}</div>
        <dl className="grid gap-2 md:grid-cols-3 text-[.95rem]"><div><dt className="eyebrow">Translated from</dt><dd className="font-serif">{t.basis}</dd></div><div><dt className="eyebrow">Approach</dt><dd className="font-serif">{t.approach}</dd></div><div><dt className="eyebrow">Impact</dt><dd className="font-serif">{t.impact}</dd></div></dl>
      </motion.article>}
    </div>
  );
}

export default function BibleHistory() {
  const [tab, setTab] = useState<'timeline' | 'manuscripts' | 'variants' | 'translations' | 'materials'>('timeline');
  const guide = guideById.get('how-we-got-the-bible');
  return (
    <div>
      <PageHeader eyebrow="How we got the Bible" title="Bible History">
        From words spoken around fires to clay, papyrus and parchment; from scribes and councils to printing presses and modern translations. Follow the journey, see the manuscripts, and weigh the passages scholars debate.
      </PageHeader>
      {guide && <Link to={`/guides/${guide.id}`} className="card p-4 mb-5 flex flex-wrap items-center justify-between gap-2 hover:border-accent"><span><span className="eyebrow block">Start here</span><span className="display text-lg">{guide.title}</span></span><span className="text-accent font-semibold text-sm">Read the guide →</span></Link>}
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'timeline', label: 'Timeline' }, { id: 'manuscripts', label: 'Manuscripts' }, { id: 'variants', label: 'Disputed passages' }, { id: 'translations', label: 'Translation family tree' }, { id: 'materials', label: 'Scrolls, ink & scribes' }]} />
      {tab === 'timeline' && <Timeline />}
      {tab === 'manuscripts' && <Manuscripts />}
      {tab === 'variants' && <Variants />}
      {tab === 'translations' && <Translations />}
      {tab === 'materials' && (bibleHistory.materials.length ? <div className="grid gap-3 md:grid-cols-2">{bibleHistory.materials.map((m) => <div key={m.name} className="card p-4"><div className="display text-xl mb-1">{m.name}</div><p className="font-serif text-[1.05rem]">{m.summary}</p><div className="mt-2"><Refs refs={m.refs} /></div></div>)}</div> : <Empty>Being written.</Empty>)}
    </div>
  );
}
