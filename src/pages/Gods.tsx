import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { gods, godById, godsExtra, council, guideById, allDebates } from '../data';
import { PageHeader, Tabs, Refs, Ref, Conf, fmtYear, Empty } from '../components/ui';
import BibleMap from '../components/BibleMap';
import type { GodT, PlaceT } from '../schemas';

type Tab = 'map' | 'gods' | 'showdowns' | 'vowels' | 'digs' | 'purge' | 'demons' | 'council';

const REGION: Record<GodT['region'], { label: string; c: string }> = {
  canaan: { label: 'Canaan', c: 'accent' }, phoenicia: { label: 'Phoenicia', c: 'nt' }, philistia: { label: 'Philistia', c: 'warn' },
  transjordan: { label: 'Moab & Ammon', c: 'ot' }, aram: { label: 'Aram (Syria)', c: 'accent-2' }, mesopotamia: { label: 'Mesopotamia', c: 'gold' },
  egypt: { label: 'Egypt', c: 'good' }, 'greco-roman': { label: 'Greece & Rome', c: 'nt' }, 'israelite-folk': { label: 'Israel’s own idols', c: 'bad' },
  'spirit-beings': { label: 'Spirits & powers', c: 'muted' },
};
const tone = (g?: GodT) => (g ? REGION[g.region]?.c ?? 'accent' : 'accent');

function GodBadge({ g, size = 40 }: { g: GodT; size?: number }) {
  return <span className="inline-flex items-center justify-center rounded-full display font-semibold shrink-0" style={{ width: size, height: size, fontSize: size * 0.42, background: `rgb(var(--${tone(g)}) / .14)`, color: `rgb(var(--${tone(g)}))`, border: `1.5px solid rgb(var(--${tone(g)}) / .5)` }}>{g.name[0]}</span>;
}

function GodDetail({ g, onClose }: { g: GodT; onClose: () => void }) {
  return (
    <motion.article key={g.id} className="card p-5 md:p-6" initial={{ opacity: 0.5, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex justify-between gap-3 items-start">
        <div className="flex gap-4 items-center min-w-0">
          <GodBadge g={g} size={56} />
          <div className="min-w-0">
            <div className="eyebrow" style={{ color: `rgb(var(--${tone(g)}))` }}>{REGION[g.region]?.label} · {g.cultCenter.name}</div>
            <h2 className="text-3xl leading-tight">{g.name}</h2>
            <div className="text-sm text-muted">{[g.original, ...g.otherNames].filter(Boolean).join(' · ')}</div>
          </div>
        </div>
        <button className="btn !px-3" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">{g.domains.map((d) => <span key={d} className="chip">{d}</span>)}<span className="chip">Symbol: {g.symbol}</span><Conf c={g.confidence} small /></div>
      <p className="font-serif text-[1.25rem] leading-relaxed mt-4 p-4 rounded-xl max-w-[75ch]" style={{ background: `rgb(var(--${tone(g)}) / .07)` }}>{g.plain}</p>
      <div className="grid gap-4 lg:grid-cols-2 mt-5">
        <section><div className="eyebrow mb-1">What their worshippers told</div><div className="prose-serif !text-[1.08rem]">{g.myth.split(/\n\n+/).map((p, i) => <p key={i}>{p}</p>)}</div></section>
        <section><div className="eyebrow mb-1">Their place in the Bible</div><div className="prose-serif !text-[1.08rem]">{g.biblicalRole.split(/\n\n+/).map((p, i) => <p key={i}>{p}</p>)}</div></section>
      </div>
      {g.encounters.length > 0 && <section className="mt-5"><div className="eyebrow mb-2">Where they meet the story</div>
        <ol className="relative border-l-2 border-line ml-2 space-y-3">{g.encounters.map((e, i) => (
          <motion.li key={i} className="ml-5" initial={{ opacity: 0.5, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
            <span className="absolute -left-[7px] w-3 h-3 rounded-full mt-1.5" style={{ background: `rgb(var(--${tone(g)}))` }} />
            <div className="font-semibold">{e.title}</div><p className="font-serif text-[1.02rem]">{e.summary}</p><div className="mt-1"><Refs refs={e.refs} max={4} /></div>
          </motion.li>))}</ol></section>}
      {g.renamed && <aside className="mt-5 rounded-xl border p-4" style={{ borderColor: 'rgb(var(--warn) / .5)', background: 'rgb(var(--warn) / .06)' }}>
        <div className="eyebrow mb-1" style={{ color: 'rgb(var(--warn))' }}>Check the vowels</div>
        <div className="display text-xl"><span className="line-through decoration-bad/60 text-muted mr-2">{g.renamed.original}</span>→ <span className="text-accent">{g.renamed.biblical}</span></div>
        <p className="text-[.95rem] mt-1">{g.renamed.explanation}</p></aside>}
      {g.archaeology.length > 0 && <section className="mt-5"><div className="eyebrow mb-2">From the ground</div>
        <div className="grid gap-2 md:grid-cols-2">{g.archaeology.map((a, i) => <div key={i} className="card p-3"><div className="flex justify-between gap-2"><span className="font-semibold">{a.find}</span><Conf c={a.confidence} small /></div><div className="text-xs text-muted">{a.year} · {a.place}</div><p className="font-serif text-[1rem] mt-1">{a.summary}</p></div>)}</div></section>}
      <div className="grid gap-3 md:grid-cols-2 mt-5">
        <div className="card p-4"><div className="eyebrow mb-1">Family</div>{g.family.length ? <ul className="text-sm space-y-0.5">{g.family.map((f, i) => <li key={i}><span className="text-muted">{f.relation}:</span> {f.godId && godById.has(f.godId) ? <Link className="text-accent" to={`/gods?g=${f.godId}`}>{f.name}</Link> : f.name}</li>)}</ul> : <p className="text-sm text-muted">No family recorded.</p>}</div>
        <div className="card p-4"><div className="eyebrow mb-1">What became of them</div><p className="font-serif text-[1rem]">{g.laterFate}</p></div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2"><span className="eyebrow">Key passages</span><Refs refs={g.refs} max={8} /></div>
      {g.related.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5 items-center"><span className="eyebrow mr-1">Related</span>{g.related.map((r) => godById.get(r) ? <Link key={r} to={`/gods?g=${r}`} className="chip hover:border-accent">{godById.get(r)!.name}</Link> : r.startsWith('/') ? <Link key={r} to={r} className="chip hover:border-accent">{r.split('/').pop()!.replace(/-/g, ' ')}</Link> : null)}</div>}
    </motion.article>
  );
}

function Showdowns() {
  const list = [...godsExtra.showdowns].sort((a, b) => a.year - b.year);
  const [id, setId] = useState(list[0]?.id);
  const [step, setStep] = useState(0);
  const s = list.find((x) => x.id === id);
  if (!s) return <Empty>The showdowns are being written.</Empty>;
  const SIDE: Record<string, { label: string; c: string; align: string }> = {
    god: { label: 'The other god', c: 'bad', align: 'mr-auto' }, yahweh: { label: 'The LORD', c: 'accent', align: 'ml-auto' },
    people: { label: 'The people', c: 'warn', align: 'mx-auto' }, narrator: { label: 'The narrator', c: 'muted', align: 'mx-auto' },
  };
  return (
    <div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
      <nav className="flex lg:flex-col gap-1.5 scroll-x">{list.map((x) => <button key={x.id} onClick={() => { setId(x.id); setStep(0); }} className={`text-left px-3 py-2 rounded-xl shrink-0 text-sm ${x.id === id ? 'bg-accent/10 text-accent font-semibold' : 'hover:bg-sunk'}`}>{x.title}<div className="text-xs text-muted font-normal tabular">{fmtYear(x.year)} · {x.place}</div></button>)}</nav>
      <div className="min-w-0">
        <h2 className="text-3xl">{s.title}</h2>
        <div className="flex flex-wrap gap-2 items-center my-2 text-sm"><span className="tabular text-muted">{fmtYear(s.year)} · {s.place}</span><Conf c={s.confidence} small />{s.godIds.map((gid) => godById.get(gid) && <Link key={gid} to={`/gods?g=${gid}`} className="chip hover:border-accent">{godById.get(gid)!.name}</Link>)}</div>
        <div className="flex gap-1 my-4">{s.steps.map((_, i) => <button key={i} onClick={() => setStep(i)} aria-label={`Scene ${i + 1}`} className={`h-1.5 flex-1 rounded ${i <= step ? 'bg-accent' : 'bg-sunk'}`} />)}</div>
        <div className="space-y-3 min-h-[200px]">
          {s.steps.slice(0, step + 1).map((st, i) => { const sd = SIDE[st.side]; return (
            <motion.div key={i} className={`max-w-[85%] md:max-w-[75%] ${sd.align} rounded-2xl border p-4`} style={{ borderColor: `rgb(var(--${sd.c}) / .5)`, background: `rgb(var(--${sd.c}) / ${i === step ? .1 : .04})` }}
              initial={{ opacity: 0.4, y: 10, scale: .98 }} animate={{ opacity: i === step ? 1 : .75, y: 0, scale: 1 }}>
              <div className="eyebrow mb-0.5" style={{ color: `rgb(var(--${sd.c}))` }}>{sd.label} · Scene {i + 1}</div>
              <div className="display text-lg">{st.title}</div><p className="font-serif text-[1.05rem]">{st.text}</p><div className="mt-1"><Refs refs={st.refs} max={3} /></div>
            </motion.div>); })}
        </div>
        <div className="flex justify-between mt-4">
          <button className="btn" disabled={step === 0} onClick={() => setStep(step - 1)}>← Back</button>
          {step < s.steps.length - 1 ? <button className="btn btn-primary" onClick={() => setStep(step + 1)}>Next scene →</button> : <span className="text-sm text-muted self-center">End of the story</span>}
        </div>
        {step === s.steps.length - 1 && (
          <motion.div className="mt-5 grid gap-3 md:grid-cols-2" initial={{ opacity: 0.5 }} animate={{ opacity: 1 }}>
            <div className="card p-4"><div className="eyebrow mb-1 !text-accent">What it meant</div><p className="font-serif text-[1.05rem]">{s.meaning}</p><div className="mt-2"><Refs refs={s.refs} /></div></div>
            <div className="card p-4"><div className="eyebrow mb-1">How it is read</div><ul className="space-y-2">{s.interpretations.map((x, i) => <li key={i}><b>{x.view}:</b> <span className="font-serif">{x.text}</span></li>)}</ul></div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function Vowels() {
  const [shown, setShown] = useState<string[]>([]);
  const list = godsExtra.nameShifts;
  if (!list.length) return <Empty>The name changes are being written.</Empty>;
  return (
    <div>
      <p className="font-serif text-[1.15rem] max-w-[70ch] mb-5">Hebrew was written with consonants only; vowels were added much later. Scribes sometimes swapped in the vowels of <i>bosheth</i>, “shame”, or changed one letter to turn a god’s honoured title into an insult. Tap a card to watch the name change.</p>
      <div className="flex gap-2 mb-4"><button className="btn" onClick={() => setShown(list.map((x) => x.id))}>Reveal all</button><button className="btn" onClick={() => setShown([])}>Reset</button></div>
      <div className="grid gap-3 md:grid-cols-2">
        {list.map((n) => { const on = shown.includes(n.id); return (
          <button key={n.id} onClick={() => setShown((s) => on ? s.filter((x) => x !== n.id) : [...s, n.id])} className="card p-4 text-left hover:border-accent">
            <div className="h-14 flex items-center relative overflow-hidden">
              <AnimatePresence mode="wait">
                {!on ? <motion.div key="a" className="display text-3xl" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12, filter: 'blur(4px)' }}>{n.original}</motion.div>
                  : <motion.div key="b" className="display text-3xl text-accent" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}>{n.changed}</motion.div>}
              </AnimatePresence>
            </div>
            <div className="text-sm"><span className="text-muted">{on ? 'Now means:' : 'Means:'}</span> <b>{on ? n.changedMeaning : n.originalMeaning}</b></div>
            {on && <motion.div initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="mt-2"><span className="chip">{n.technique}</span><p className="font-serif text-[1rem] mt-1.5">{n.note}</p><div className="mt-1.5 flex flex-wrap gap-2 items-center"><Refs refs={n.refs} max={3} /><Conf c={n.confidence} small /></div></motion.div>}
            {!on && <div className="text-xs text-accent mt-2">Tap to see what the scribes did →</div>}
          </button>); })}
      </div>
    </div>
  );
}

function Digs() {
  const finds = [...godsExtra.finds].sort((a, b) => a.discovered - b.discovered);
  const [sel, setSel] = useState<string | null>(finds[0]?.id ?? null);
  const f = finds.find((x) => x.id === sel);
  if (!finds.length) return <Empty>The finds are being written.</Empty>;
  const places = finds.map((x) => ({ id: x.id, names: [{ era: '', name: x.name }], coords: x.coords, coordConfidence: x.confidence, type: 'site', refs: [], summary: '' })) as PlaceT[];
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-3">
        <BibleMap places={places} highlight={sel} onPlace={setSel} focus={[-2, 25, 50, 41]} label="Where the finds were made" />
        <ol className="flex gap-0 scroll-x pb-2">{finds.map((x) => <li key={x.id} className="w-32 shrink-0"><button onClick={() => setSel(x.id)} className={`text-left px-2 text-sm ${sel === x.id ? 'text-accent font-semibold' : 'hover:text-accent'}`}><div className="tabular text-xs text-muted">dug up {x.discovered}</div>{x.name}</button></li>)}</ol>
      </div>
      {f && <motion.article key={f.id} className="card p-5 self-start" initial={{ opacity: 0.5, x: 8 }} animate={{ opacity: 1, x: 0 }}>
        <div className="eyebrow">{f.place} · found {f.discovered} · dated {f.dated}</div>
        <h3 className="text-2xl">{f.name}</h3><div className="my-1"><Conf c={f.confidence} small /></div>
        <p className="font-serif text-[1.08rem] mt-2">{f.summary}</p>
        <div className="eyebrow mt-3 mb-1">Why it matters</div><p className="font-serif text-[1.05rem]">{f.significance}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">{f.godIds.map((gid) => godById.get(gid) && <Link key={gid} to={`/gods?g=${gid}`} className="chip hover:border-accent">{godById.get(gid)!.name}</Link>)}</div>
        <div className="mt-2"><Refs refs={f.refs} /></div>
      </motion.article>}
    </div>
  );
}

function Purge() {
  const [done, setDone] = useState<number[]>([]);
  const list = godsExtra.purge;
  if (!list.length) return <Empty>Josiah’s reform is being written.</Empty>;
  const pct = Math.round((done.length / list.length) * 100);
  return (
    <div className="max-w-3xl">
      <p className="font-serif text-[1.15rem] mb-4">In about 622 BC King Josiah of Judah cleared the land of other gods (2 Kings 23). Tap each item to carry out the reform and see what had been standing in Jerusalem, some of it inside the temple itself.</p>
      <div className="card p-3 mb-4 sticky top-2 z-10"><div className="flex justify-between text-sm mb-1"><span className="font-semibold">Reform progress</span><span className="tabular">{done.length}/{list.length}</span></div><div className="h-2.5 bg-sunk rounded-full overflow-hidden"><motion.div className="h-full bg-accent rounded-full" animate={{ width: `${pct}%` }} /></div></div>
      <ul className="space-y-2">{list.map((p, i) => { const on = done.includes(i); return (
        <li key={i}><button onClick={() => setDone((d) => on ? d.filter((x) => x !== i) : [...d, i])} className={`card p-4 w-full text-left flex gap-3 items-start transition-opacity ${on ? 'opacity-60' : ''}`}>
          <span className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center mt-0.5 ${on ? 'bg-accent border-accent text-accentInk' : 'border-line'}`}>{on ? '✓' : ''}</span>
          <span className="min-w-0"><span className={`font-semibold ${on ? 'line-through decoration-2 decoration-accent' : ''}`}>{p.item}</span><span className="block font-serif text-[1rem] text-muted">{p.what}</span><span className="mt-1 flex flex-wrap gap-1.5 items-center"><Ref r={p.ref} />{p.godIds.map((gid) => godById.get(gid) && <span key={gid} className="chip">{godById.get(gid)!.name}</span>)}</span></span>
        </button></li>); })}</ul>
      {done.length === list.length && <motion.p className="card p-4 mt-4 font-serif text-[1.1rem]" initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}>Reform complete. Within a generation Jerusalem fell to Babylon (586 BC), and Jeremiah 44 shows some refugees blaming the reform itself for their troubles.</motion.p>}
    </div>
  );
}

function Demons() {
  const chain = godsExtra.demonChain;
  if (!chain.length) return <Empty>Being written.</Empty>;
  return (
    <ol className="max-w-3xl">{chain.map((c, i) => (
      <motion.li key={i} className="flex gap-4" initial={{ opacity: 0.5, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <div className="flex flex-col items-center"><span className="w-9 h-9 rounded-full bg-accent text-accentInk flex items-center justify-center display font-semibold">{i + 1}</span>{i < chain.length - 1 && <span className="w-0.5 flex-1 bg-accent/40 my-1" />}</div>
        <div className="pb-6 min-w-0"><div className="eyebrow">{c.period}</div><div className="display text-xl">{c.stage}</div><p className="font-serif text-[1.08rem] mt-1">{c.text}</p>
          {c.examples.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">{c.examples.map((e) => <span key={e} className="chip">{e}</span>)}</div>}<div className="mt-2"><Refs refs={c.refs} max={5} /></div></div>
      </motion.li>))}</ol>
  );
}

function Council() {
  const [scene, setScene] = useState(0);
  const [nationFilter, setNationFilter] = useState<'all' | 'acts2' | 'paul'>('all');
  const [openQ, setOpenQ] = useState<number | null>(0);
  if (!council) return <Empty>The divine council section is being written.</Empty>;
  const c = council;
  const sc = c.scenes[scene];
  const nations = c.nations.filter((n) => nationFilter === 'all' || (nationFilter === 'acts2' ? n.acts2 : n.paulVisited));
  const nationPlaces = nations.map((n, i) => ({ id: `n${i}`, names: [{ era: '', name: n.name }], coords: n.coords, coordConfidence: 'scholarly-consensus', type: 'region', refs: [], summary: '' })) as PlaceT[];
  return (
    <div className="space-y-10">
      <section className="card p-5 md:p-6" style={{ background: 'linear-gradient(135deg, rgb(var(--accent) / .07), rgb(var(--surface)))' }}>
        <div className="eyebrow !text-accent mb-2">The divine council in plain words</div>
        <p className="font-serif text-[1.25rem] leading-relaxed max-w-[75ch]">{c.plain}</p>
        <ul className="grid gap-2 md:grid-cols-2 mt-4">{c.keyPoints.map((k, i) => <li key={i} className="flex gap-2.5 text-[.95rem]"><span className="mt-1.5 w-2 h-2 rounded-full bg-accent shrink-0" />{k}</li>)}</ul>
      </section>

      <section><h2 className="text-2xl mb-3">Who is in the heavenly court</h2>
        <div className="flex flex-col items-center gap-2">{c.tiers.map((t, i) => (
          <motion.div key={t.name} className="card p-4 text-center" style={{ width: `${Math.min(100, 46 + i * 18)}%`, borderColor: `rgb(var(--accent) / ${0.8 - i * 0.18})` }} initial={{ opacity: 0.4, scale: .96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
            <div className="display text-xl">{t.name} <span className="font-orig text-muted text-base">{t.hebrew}</span></div>
            <div className="text-sm text-muted">{t.who}</div><p className="font-serif text-[1rem] mt-1">{t.role}</p><div className="mt-1.5 flex justify-center"><Refs refs={t.refs} max={4} /></div>
          </motion.div>))}</div>
      </section>

      <section><h2 className="text-2xl mb-1">One word, many beings: <i className="font-serif">elohim</i></h2><p className="text-muted mb-3">The Hebrew word usually translated “God” is also used for other beings.</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{c.elohimUses.map((u, i) => <div key={i} className="card p-3"><div className="font-semibold">{u.who}</div><div className="my-1"><Ref r={u.ref} /></div><p className="text-sm font-serif text-[1rem]">{u.note}</p></div>)}</div>
      </section>

      <section><h2 className="text-2xl mb-3">Council scenes</h2>
        <div className="flex flex-wrap gap-1.5 mb-3">{c.scenes.map((s, i) => <button key={s.id} className={`btn !py-1 ${i === scene ? 'btn-primary' : ''}`} onClick={() => setScene(i)}>{s.title}</button>)}</div>
        {sc && <motion.div key={sc.id} className="card p-5" initial={{ opacity: 0.5, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-wrap gap-2 items-center"><Ref r={sc.ref} /><span className="text-sm text-muted">{sc.setting}</span></div>
          <div className="flex flex-wrap gap-1.5 my-2">{sc.whoIsThere.map((w) => <span key={w} className="chip">{w}</span>)}</div>
          <p className="font-serif text-[1.12rem]">{sc.whatHappens}</p>
          <div className="grid gap-2 md:grid-cols-2 mt-3">{sc.readings.map((r, i) => <div key={i} className="rounded-xl bg-sunk p-3"><div className="eyebrow mb-0.5">{r.view}</div><p className="font-serif text-[1rem]">{r.text}</p></div>)}</div>
        </motion.div>}
      </section>

      <section><h2 className="text-2xl mb-1">One verse, three manuscripts: Deuteronomy 32:8</h2><p className="text-muted mb-3">Which group of beings were the nations divided by?</p>
        <div className="grid gap-3 md:grid-cols-3">
          {[['Masoretic Text (Hebrew, medieval copies)', c.deut32.mt, 'warn'], ['Dead Sea Scrolls (4QDeutj, c. 50 BC)', c.deut32.dss, 'good'], ['Septuagint (Greek, c. 250 BC onward)', c.deut32.lxx, 'good']].map(([t, v, col]) => (
            <div key={t} className="card p-4" style={{ borderColor: `rgb(var(--${col}) / .5)` }}><div className="eyebrow mb-1">{t}</div><p className="font-serif text-[1.12rem]">{v}</p></div>))}
        </div>
        <div className="scroll-x mt-3"><table className="text-sm min-w-[420px]"><tbody>{c.deut32.translations.map((t) => <tr key={t.name} className="border-b border-line/60"><td className="py-1.5 pr-4 font-semibold">{t.name}</td><td className="py-1.5 font-serif text-[1rem]">{t.reads}</td></tr>)}</tbody></table></div>
        <p className="font-serif text-[1.05rem] mt-3 max-w-[75ch]">{c.deut32.explanation}</p><p className="font-serif text-[1.05rem] mt-2 max-w-[75ch]"><b>Why it matters:</b> {c.deut32.significance}</p><div className="mt-1"><Conf c={c.deut32.confidence} small /></div>
      </section>

      <section><h2 className="text-2xl mb-3">Three rebellions, and how each is undone</h2>
        <div className="grid gap-3 lg:grid-cols-3">{c.rebellions.map((r, i) => (
          <motion.div key={r.id} className="card p-4 flex flex-col" initial={{ opacity: 0.5, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
            <div className="eyebrow">Rebellion {i + 1}</div><div className="display text-xl">{r.title}</div><div className="my-1"><Refs refs={r.refs} max={3} /></div>
            <p className="text-sm"><b>Who:</b> {r.who}</p><p className="font-serif text-[1rem] mt-1">{r.what}</p><p className="text-sm mt-1"><b>Result:</b> {r.consequence}</p>
            <div className="mt-auto pt-3 border-t border-line mt-3"><div className="eyebrow !text-accent">Undone by</div><p className="font-serif text-[1rem]">{r.reversal}</p><div className="mt-1"><Refs refs={r.reversalRefs} max={4} /></div></div>
            <details className="mt-2"><summary className="text-sm text-muted cursor-pointer">Other readings</summary><ul className="mt-1 space-y-1 text-sm">{r.readings.map((x, j) => <li key={j}><b>{x.view}:</b> {x.text}</li>)}</ul></details>
          </motion.div>))}</div>
      </section>

      <section><h2 className="text-2xl mb-3">Reclaiming the nations</h2>
        <ol className="flex gap-0 scroll-x pb-2">{c.reclaim.map((r, i) => (
          <li key={i} className="w-56 shrink-0 pr-3">
            <div className="flex items-center"><span className="w-8 h-8 rounded-full bg-accent text-accentInk flex items-center justify-center font-semibold shrink-0">{i + 1}</span>{i < c.reclaim.length - 1 && <span className="h-0.5 flex-1 bg-accent/40 ml-1" />}</div>
            <div className="display text-lg mt-2 leading-tight">{r.stage}</div><p className="text-sm font-serif text-[.98rem] mt-1">{r.text}</p><div className="mt-1"><Refs refs={r.refs} max={2} /></div>{r.confidence !== 'biblical' && <Conf c={r.confidence} small />}
          </li>))}</ol>
      </section>

      <section><h2 className="text-2xl mb-2">From Babel’s nations to Pentecost and Spain</h2>
        <div className="flex flex-wrap gap-1.5 mb-3">{([['all', 'All peoples'], ['acts2', 'Present at Pentecost (Acts 2)'], ['paul', 'Reached by Paul']] as const).map(([k, l]) => <button key={k} className={`btn !py-1 ${nationFilter === k ? 'btn-primary' : ''}`} onClick={() => setNationFilter(k)}>{l}</button>)}</div>
        <BibleMap places={nationPlaces} focus={[-10, 18, 58, 46]} label="Nations of the Table of Nations, Pentecost and Paul's mission" />
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 mt-3">{nations.map((n) => <div key={n.name} className="card p-3 text-sm"><div className="font-semibold">{n.name}</div><div className="text-xs text-muted">{n.gen10}</div><p className="font-serif text-[.98rem] mt-1">{n.note}</p></div>)}</div>
      </section>

      <section><h2 className="text-2xl mb-3">Hard questions</h2>
        <div className="space-y-2">{c.objections.map((o, i) => (
          <div key={i} className="card overflow-hidden">
            <button className="w-full text-left p-4 flex justify-between gap-3 items-center" onClick={() => setOpenQ(openQ === i ? null : i)} aria-expanded={openQ === i}><span className="font-semibold">{o.question}</span><span className="text-accent text-xl">{openQ === i ? '−' : '+'}</span></button>
            {openQ === i && <motion.div className="px-4 pb-4" initial={{ opacity: 0.5 }} animate={{ opacity: 1 }}><p className="font-serif text-[1.08rem]">{o.answer}</p><p className="text-[.95rem] mt-2 p-3 rounded-xl bg-sunk"><b>Other views:</b> {o.otherViews}</p><div className="mt-2"><Refs refs={o.refs} /></div></motion.div>}
          </div>))}</div>
      </section>

      <section><h2 className="text-2xl mb-3">Who brought this to light</h2>
        <ol className="relative border-l-2 border-line ml-2 space-y-3">{[...c.scholars].sort((a, b) => a.year - b.year).map((s) => <li key={s.name + s.year} className="ml-5"><span className="absolute -left-[7px] w-3 h-3 rounded-full bg-accent mt-1.5" /><div className="tabular text-sm text-muted">{s.year}</div><div className="font-semibold">{s.name} — <i>{s.work}</i></div><p className="font-serif text-[1rem]">{s.contribution}</p></li>)}</ol>
      </section>
    </div>
  );
}

export default function Gods() {
  const [sp, setSp] = useSearchParams();
  const tab = (sp.get('tab') as Tab) || (sp.get('g') ? 'gods' : 'map');
  const setTab = (t: Tab) => setSp({ tab: t }, { replace: true });
  const sel = sp.get('g') ? godById.get(sp.get('g')!) : undefined;
  const open = (id: string | null) => setSp(id ? { tab: tab === 'map' ? 'map' : 'gods', g: id } : { tab }, { replace: true });
  const [region, setRegion] = useState<string>('');
  const regions = (Object.keys(REGION) as GodT['region'][]).filter((r) => gods.some((g) => g.region === r));
  const list = region ? gods.filter((g) => g.region === region) : gods;
  const mapPlaces = useMemo(() => list.map((g) => ({ id: g.id, names: [{ era: '', name: `${g.name}` }], coords: g.cultCenter.coords, coordConfidence: g.confidence, type: 'site', refs: [], summary: '' })) as PlaceT[], [list]);
  const guide = guideById.get('the-other-gods-of-the-bible');
  const councilGuide = guideById.get('the-divine-council');
  const debatesHere = allDebates.filter((d) => d.category === 'God and the gods');
  return (
    <div>
      <PageHeader eyebrow="Gods of the nations" title="The Other Gods of the Bible">
        Baal, Asherah, Dagon, Chemosh, Molech and the rest were real objects of worship with temples, priests and inscriptions we can still read. Meet them, watch the showdowns, see what the archaeologists found, and discover how the Bible renamed and mocked them, and what the “divine council” passages say about the powers behind the nations.
      </PageHeader>
      {godsExtra.overview.plain && <section className="card p-5 mb-5" style={{ background: 'linear-gradient(135deg, rgb(var(--accent) / .07), rgb(var(--surface)))' }}><div className="eyebrow !text-accent mb-1">In plain words</div><p className="font-serif text-[1.2rem] leading-relaxed max-w-[75ch]">{godsExtra.overview.plain}</p>{godsExtra.overview.keyPoints.length > 0 && <ul className="grid gap-1.5 md:grid-cols-2 mt-3">{godsExtra.overview.keyPoints.map((k, i) => <li key={i} className="flex gap-2.5 text-[.95rem]"><span className="mt-1.5 w-2 h-2 rounded-full bg-accent shrink-0" />{k}</li>)}</ul>}</section>}
      <div className="flex flex-wrap gap-2 mb-4">
        {guide && <Link to={`/guides/${guide.id}`} className="chip hover:border-accent !py-1 !text-[.82rem]">Guide: {guide.title} →</Link>}
        {councilGuide && <Link to={`/guides/${councilGuide.id}`} className="chip hover:border-accent !py-1 !text-[.82rem]">Guide: {councilGuide.title} →</Link>}
        {debatesHere.map((d) => <Link key={d.id} to={`/debates/${d.id}`} className="chip hover:border-accent !py-1 !text-[.82rem]">Debate: {d.title} →</Link>)}
      </div>
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[
        { id: 'map', label: 'Map of the gods' }, { id: 'gods', label: `All gods (${gods.length})` }, { id: 'showdowns', label: 'Showdowns' }, { id: 'vowels', label: 'Check the vowels' },
        { id: 'digs', label: 'Archaeology' }, { id: 'purge', label: 'Josiah’s purge' }, { id: 'demons', label: 'From gods to demons' }, { id: 'council', label: '✦ The divine council' },
      ]} />
      {(tab === 'map' || tab === 'gods') && (
        <div className="flex flex-wrap gap-1.5 mb-4"><button className={`btn !py-1 ${!region ? 'btn-primary' : ''}`} onClick={() => setRegion('')}>Everywhere</button>{regions.map((r) => <button key={r} className={`btn !py-1 ${region === r ? 'btn-primary' : ''}`} onClick={() => setRegion(r)}><span className="w-2.5 h-2.5 rounded-full" style={{ background: `rgb(var(--${REGION[r].c}))` }} />{REGION[r].label}</button>)}</div>
      )}
      {!gods.length && (tab === 'map' || tab === 'gods') && <Empty>The gods are being catalogued.</Empty>}
      {tab === 'map' && gods.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="min-w-0"><BibleMap places={mapPlaces} highlight={sel?.id} onPlace={(id) => open(id)} focus={[-5, 20, 52, 43]} label="Cult centres of the gods" /><p className="text-sm text-muted mt-2">Each dot is a god’s main cult centre. Tap one to meet that god.</p></div>
          <div className="min-w-0">{sel ? <GodDetail g={sel} onClose={() => open(null)} /> : <div className="grid gap-2 sm:grid-cols-2">{list.slice(0, 12).map((g) => <button key={g.id} onClick={() => open(g.id)} className="card p-3 text-left hover:border-accent flex gap-3 items-center"><GodBadge g={g} /><span className="min-w-0"><span className="font-semibold block">{g.name}</span><span className="text-xs text-muted">{g.domains.slice(0, 2).join(', ')}</span></span></button>)}</div>}</div>
        </div>
      )}
      {tab === 'gods' && gods.length > 0 && (
        <div className="space-y-5">
          {sel && <GodDetail g={sel} onClose={() => open(null)} />}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{list.map((g, i) => (
            <motion.button key={g.id} onClick={() => { open(g.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`card p-4 text-left hover:border-accent flex flex-col gap-2 ${sel?.id === g.id ? '!border-accent' : ''}`} initial={{ opacity: 0.5, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.015, 0.4) }}>
              <span className="flex gap-3 items-center"><GodBadge g={g} /><span className="min-w-0"><span className="display text-lg block leading-tight">{g.name}</span><span className="text-xs" style={{ color: `rgb(var(--${tone(g)}))` }}>{REGION[g.region]?.label} · {g.cultCenter.name}</span></span></span>
              <span className="font-serif text-[1rem] line-clamp-3">{g.plain}</span>
              <span className="flex flex-wrap gap-1 mt-auto">{g.domains.slice(0, 3).map((d) => <span key={d} className="chip !text-[.65rem]">{d}</span>)}</span>
            </motion.button>))}</div>
        </div>
      )}
      {tab === 'showdowns' && <Showdowns />}
      {tab === 'vowels' && <Vowels />}
      {tab === 'digs' && <Digs />}
      {tab === 'purge' && <Purge />}
      {tab === 'demons' && <Demons />}
      {tab === 'council' && <Council />}
    </div>
  );
}
