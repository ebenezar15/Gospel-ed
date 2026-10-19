import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { canonBooks, books, guideById } from '../data';
import { PageHeader, Tabs, Refs, SourceLine, DateWithConf, Empty, Conf } from '../components/ui';
import type { CanonBookT } from '../schemas';

const TRAD: { key: keyof CanonBookT['status']; label: string }[] = [
  { key: 'jewish', label: 'Jewish' }, { key: 'protestant', label: 'Protestant' }, { key: 'catholic', label: 'Catholic' },
  { key: 'orthodox', label: 'Orthodox' }, { key: 'ethiopian', label: 'Ethiopian' }, { key: 'syriac', label: 'Syriac' },
];
const STATUS: Record<string, { label: string; c: string; o: number }> = {
  canon: { label: 'Scripture', c: 'good', o: 0.85 }, deuterocanon: { label: 'Deuterocanon (scripture)', c: 'good', o: 0.5 },
  appendix: { label: 'Appendix', c: 'warn', o: 0.45 }, 'read-not-canon': { label: 'Read, not scripture', c: 'warn', o: 0.25 },
  rejected: { label: 'Rejected', c: 'bad', o: 0.22 }, lost: { label: 'Lost', c: 'muted', o: 0.25 }, 'n/a': { label: 'Not applicable', c: 'border', o: 0.25 },
};
const CAT: Record<CanonBookT['category'], string> = {
  deuterocanon: 'Deuterocanon / Apocrypha', 'ot-pseudepigrapha': 'Old Testament pseudepigrapha', qumran: 'Dead Sea Scrolls writings', 'lost-book': 'Books the Bible mentions but we have lost',
  'apostolic-fathers': 'Apostolic Fathers', 'nt-apocrypha': 'New Testament apocrypha', gnostic: 'Gnostic writings',
};
const VERDICT: Record<string, { label: string; c: string; w: number }> = { meets: { label: 'Meets', c: 'good', w: 100 }, partial: { label: 'Partly', c: 'warn', w: 55 }, fails: { label: 'Fails', c: 'bad', w: 18 }, 'n/a': { label: 'n/a', c: 'muted', w: 6 } };

function Cell({ s }: { s: string }) {
  const st = STATUS[s] ?? STATUS['n/a'];
  return <td className="p-0.5"><div title={st.label} className="h-7 rounded-md flex items-center justify-center text-[.65rem] font-semibold" style={{ background: `rgb(var(--${st.c}) / ${st.o})`, color: st.o > 0.6 ? 'rgb(var(--bg))' : 'rgb(var(--text))' }}>{st.label.split(' ')[0]}</div></td>;
}

function Detail({ b, onClose }: { b: CanonBookT; onClose: () => void }) {
  return (
    <motion.article key={b.id} className="card p-5 md:p-6" initial={{ opacity: 0.001, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="flex justify-between gap-3 items-start">
        <div><div className="eyebrow">{CAT[b.category]}</div><h2 className="text-3xl">{b.title}</h2>{b.altTitles.length > 0 && <div className="text-sm text-muted">Also: {b.altTitles.join(' · ')}</div>}</div>
        <button className="btn !px-3" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm"><span><span className="eyebrow mr-1">Written</span><DateWithConf d={b.date} /></span><span><span className="eyebrow mr-1">Language</span>{b.language}</span><span><span className="eyebrow mr-1">Origin</span>{b.origin}</span><Conf c={b.confidence} small /></div>
      <p className="mt-4 font-serif text-[1.25rem] leading-relaxed p-4 rounded-xl" style={{ background: 'rgb(var(--accent) / .07)' }}>{b.plain}</p>
      <div className="mt-4 grid gap-1.5 grid-cols-3 md:grid-cols-6">{TRAD.map((t) => { const st = STATUS[b.status[t.key]]; return <div key={t.key} className="rounded-lg p-2 text-center" style={{ background: `rgb(var(--${st.c}) / ${st.o * 0.6})` }}><div className="eyebrow !text-[.6rem]">{t.label}</div><div className="text-xs font-semibold">{st.label}</div></div>; })}</div>
      <div className="prose-serif mt-4 !max-w-none">{b.summary.split(/\n\n+/).map((p, i) => <p key={i}>{p}</p>)}</div>
      {b.contents.length > 0 && <><div className="eyebrow mt-4 mb-1.5">What's in it</div><ul className="grid gap-1 md:grid-cols-2 text-[.95rem]">{b.contents.map((c) => <li key={c} className="flex gap-2"><span className="text-accent">▸</span>{c}</li>)}</ul></>}
      <div className="eyebrow mt-5 mb-2">How it measures against the tests the church used</div>
      <div className="space-y-2">{b.criteria.map((c) => { const v = VERDICT[c.verdict]; return (
        <div key={c.criterion} className="grid grid-cols-[8rem_1fr] md:grid-cols-[9rem_10rem_1fr] gap-2 items-center text-sm">
          <span className="font-semibold capitalize">{c.criterion.replace(/-/g, ' ')}</span>
          <div className="h-2.5 bg-sunk rounded-full overflow-hidden"><motion.div className="h-full rounded-full" style={{ background: `rgb(var(--${v.c}))` }} initial={{ width: 0 }} animate={{ width: `${v.w}%` }} transition={{ duration: 0.6 }} /></div>
          <span className="col-span-2 md:col-span-1 text-muted"><b className="text-ink">{v.label}.</b> {c.note}</span>
        </div>); })}</div>
      <div className="grid gap-3 md:grid-cols-2 mt-5">
        <div className="rounded-xl p-4 border" style={{ borderColor: 'rgb(var(--bad) / .4)', background: 'rgb(var(--bad) / .05)' }}><div className="eyebrow mb-1" style={{ color: 'rgb(var(--bad))' }}>Why it was left out</div><p className="font-serif text-[1.05rem]">{b.whyRejected}</p></div>
        <div className="rounded-xl p-4 border" style={{ borderColor: 'rgb(var(--good) / .4)', background: 'rgb(var(--good) / .05)' }}><div className="eyebrow mb-1" style={{ color: 'rgb(var(--good))' }}>Why some treasure it</div><p className="font-serif text-[1.05rem]">{b.whyValued}</p></div>
      </div>
      {b.biblicalLinks.length > 0 && <><div className="eyebrow mt-5 mb-1.5">Where the Bible touches it</div><ul className="space-y-1.5">{b.biblicalLinks.map((l, i) => <li key={i} className="text-sm flex flex-wrap gap-2 items-center"><Refs refs={[l.ref]} /><span className="font-serif text-[1rem]">{l.note}</span></li>)}</ul></>}
      {b.citedBy.length > 0 && <><div className="eyebrow mt-5 mb-1.5">Who used or judged it</div><ul className="space-y-1.5 text-sm">{b.citedBy.map((c, i) => <li key={i}><b>{c.who}</b> — {c.how} <span className="text-muted">(<SourceLine s={c.source} />)</span></li>)}</ul></>}
      {b.reading.length > 0 && <details className="mt-4"><summary className="text-sm text-muted cursor-pointer">Further reading</summary><ul className="mt-1 space-y-0.5">{b.reading.map((s, i) => <li key={i}><SourceLine s={s} /></li>)}</ul></details>}
    </motion.article>
  );
}

function Game() {
  const pool = useMemo(() => [...canonBooks.map((b) => ({ title: b.title, answer: b.status.protestant === 'canon' ? 0 : (b.status.catholic === 'canon' || b.status.catholic === 'deuterocanon') ? 1 : (b.status.orthodox === 'canon' || b.status.orthodox === 'deuterocanon' || b.status.ethiopian === 'canon' || b.status.syriac === 'canon') ? 2 : 3, why: b.plain, id: b.id })),
    ...books.map((b) => ({ title: b.name, answer: 0, why: `${b.name} is in every Christian canon. ${b.purpose}`, id: '' }))].sort(() => Math.random() - 0.5), []);
  const [i, setI] = useState(0); const [pick, setPick] = useState<number | null>(null); const [score, setScore] = useState(0);
  const OPTS = ['In every Christian Bible', 'Catholic (and Orthodox) Bibles', 'Only some Orthodox, Ethiopian or Syriac Bibles', 'Not in any canon'];
  const q = pool[i % pool.length];
  if (!pool.length) return <Empty>The game needs the book catalogue.</Empty>;
  return (
    <div className="max-w-2xl">
      <div className="flex justify-between text-sm text-muted mb-2 tabular"><span>Round {i + 1}</span><span>Score {score}/{i + (pick !== null ? 1 : 0)}</span></div>
      <div className="card p-6">
        <div className="eyebrow mb-1">Where would you find…</div>
        <AnimatePresence mode="wait"><motion.h2 key={i} className="text-4xl mb-5" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }}>{q.title}</motion.h2></AnimatePresence>
        <div className="grid gap-2">{OPTS.map((o, j) => (
          <button key={o} disabled={pick !== null} onClick={() => { setPick(j); if (j === q.answer) setScore((s) => s + 1); }}
            className={`card p-3 text-left hover:border-accent ${pick === null ? '' : j === q.answer ? '!border-good bg-good/10' : j === pick ? '!border-bad bg-bad/10' : 'opacity-50'}`}>{o}</button>
        ))}</div>
        {pick !== null && <div className="mt-4"><p className="font-serif text-[1.1rem]"><b>{pick === q.answer ? 'Right.' : `It's: ${OPTS[q.answer]}.`}</b> {q.why}</p>
          <div className="flex gap-2 mt-3">{q.id && <Link className="btn" to={`/canon?book=${q.id}`}>Read about it</Link>}<button className="btn btn-primary" onClick={() => { setPick(null); setI(i + 1); }}>Next book →</button></div></div>}
      </div>
    </div>
  );
}

export default function Canon() {
  const [sp, setSp] = useSearchParams();
  const [tab, setTab] = useState<'matrix' | 'library' | 'game'>('matrix');
  const sel = canonBooks.find((b) => b.id === sp.get('book'));
  const open = (id: string | null) => setSp(id ? { book: id } : {}, { replace: true });
  const cats = (Object.keys(CAT) as CanonBookT['category'][]).filter((c) => canonBooks.some((b) => b.category === c));
  const guide = guideById.get('why-some-books-were-left-out');
  return (
    <div>
      <PageHeader eyebrow="Beyond the 66" title="Omitted, Disputed & Lost Books">
        The Apocrypha, 1 Enoch, the Gospel of Thomas, the Shepherd of Hermas and the books the Bible itself mentions but we no longer have. See which Christians and Jews read each one as scripture, how it fares against the tests the early church used, and why it was kept or left out.
      </PageHeader>
      {guide && <Link to={`/guides/${guide.id}`} className="card p-4 mb-5 flex flex-wrap items-center justify-between gap-2 hover:border-accent"><span><span className="eyebrow block">Start here</span><span className="display text-lg">{guide.title}</span></span><span className="text-accent font-semibold text-sm">Read the guide →</span></Link>}
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'matrix', label: 'Canon matrix' }, { id: 'library', label: 'Library' }, { id: 'game', label: '✦ Canon or not?' }]} />
      <AnimatePresence>{sel && tab !== 'game' && <div className="mb-6"><Detail b={sel} onClose={() => open(null)} /></div>}</AnimatePresence>
      {!canonBooks.length && <Empty>The book catalogue is being written.</Empty>}
      {tab === 'matrix' && canonBooks.length > 0 && (
        <div>
          <div className="flex flex-wrap gap-3 mb-3 text-xs">{Object.entries(STATUS).map(([k, v]) => <span key={k} className="flex items-center gap-1.5"><span className="w-4 h-3 rounded" style={{ background: `rgb(var(--${v.c}) / ${v.o})` }} />{v.label}</span>)}</div>
          <div className="scroll-x card p-2">
            <table className="w-full min-w-[720px] text-sm border-separate border-spacing-0">
              <thead><tr><th className="text-left eyebrow p-2">Book</th>{TRAD.map((t) => <th key={t.key} className="eyebrow p-2 w-[13%]">{t.label}</th>)}</tr></thead>
              {cats.map((c) => (
                <tbody key={c}>
                  <tr><td colSpan={7} className="pt-4 pb-1 px-2 display text-lg text-accent">{CAT[c]}</td></tr>
                  {canonBooks.filter((b) => b.category === c).map((b) => (
                    <tr key={b.id} onClick={() => { open(b.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`cursor-pointer hover:bg-sunk ${sel?.id === b.id ? 'bg-sunk' : ''}`}>
                      <td className="px-2 py-1 font-medium">{b.title}</td>{TRAD.map((t) => <Cell key={t.key} s={b.status[t.key]} />)}
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
          <p className="text-sm text-muted mt-2">Tap a row to open the book. Ethiopian and Syriac canons are listed separately because they differ most; the Ethiopian broader canon includes 1 Enoch and Jubilees.</p>
        </div>
      )}
      {tab === 'library' && cats.map((c) => (
        <section key={c} className="mb-7"><h2 className="text-2xl mb-3">{CAT[c]}</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{canonBooks.filter((b) => b.category === c).map((b) => (
            <button key={b.id} onClick={() => { open(b.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="card p-4 text-left hover:border-accent">
              <div className="display text-lg">{b.title}</div><div className="text-xs text-muted mb-1">{b.language} · {b.date.circa ? 'c. ' : ''}{b.date.year < 0 ? `${-b.date.year} BC` : `AD ${b.date.year}`}</div>
              <p className="font-serif text-[1rem] line-clamp-3">{b.plain}</p>
              <div className="flex gap-0.5 mt-2">{TRAD.map((t) => { const st = STATUS[b.status[t.key]]; return <span key={t.key} title={`${t.label}: ${st.label}`} className="h-1.5 flex-1 rounded" style={{ background: `rgb(var(--${st.c}) / ${Math.max(st.o, .3)})` }} />; })}</div>
            </button>
          ))}</div>
        </section>
      ))}
      {tab === 'game' && <Game />}
    </div>
  );
}
