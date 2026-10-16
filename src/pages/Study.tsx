import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Fuse from 'fuse.js';
import { studyPaths, people, personById, lifespan, contemporaries, allDebates, contextItems, books } from '../data';
import { PageHeader, Section, Refs, Tabs, fmtYear, Empty } from '../components/ui';
import { parseRef } from '../lib/refs';
import { loadKJV, versesFor, refLabel } from '../lib/kjv';
import { BOOKS } from '../lib/canon';
import { useUI } from '../store';
import Chat from '../components/Chat';

type Tab = 'verse' | 'paths' | 'compare' | 'saved' | 'ask';

function VersePanel({ initial }: { initial: string }) {
  const [q, setQ] = useState(initial || 'John 1:1-14');
  const [shown, setShown] = useState(initial || 'John 1:1-14');
  const [verses, setVerses] = useState<{ c: number; v: number; text: string }[] | null>(null);
  const p = parseRef(shown);
  useEffect(() => { setVerses(null); if (p) loadKJV().then((k) => setVerses(versesFor(k, p, 200))); }, [shown]);
  const go = (r: string) => { setQ(r); setShown(r); };
  const chapter = p ? `${BOOKS[p.book].abbr} ${p.c1}` : '';
  return (
    <div>
      <form className="flex gap-2 mb-4" onSubmit={(e) => { e.preventDefault(); setShown(q.trim()); }}>
        <label htmlFor="verse-q" className="sr-only">Reference</label>
        <input id="verse-q" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Rom 8:28-39 or Ps 23" />
        <button className="btn btn-primary">Read</button>
      </form>
      {!p ? <Empty>“{shown}” isn’t a reference I recognise. Use abbreviations like Gen, 1 Sam, Ps, Matt, 1 Cor, with chapter and verse (Gen 12:1-3).</Empty> : (
        <article className="card p-5 md:p-8">
          <div className="flex justify-between items-baseline gap-2 mb-4 flex-wrap">
            <h2 className="display text-3xl">{refLabel(shown)}</h2>
            <div className="flex gap-1">
              {p.c1 > 1 && <button className="btn !py-1" onClick={() => go(`${BOOKS[p.book].abbr} ${p.c1 - 1}`)}>← Ch. {p.c1 - 1}</button>}
              {(p.v1 !== undefined) && <button className="btn !py-1" onClick={() => go(chapter)}>Whole chapter</button>}
              <button className="btn !py-1" onClick={() => go(`${BOOKS[p.book].abbr} ${p.c2 + 1}`)}>Ch. {p.c2 + 1} →</button>
            </div>
          </div>
          {!verses ? <div className="space-y-2">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-4" />)}</div> : (
            <div className="font-serif text-[1.15rem] leading-[1.85] max-w-[66ch]">
              {verses.map((v) => <span key={`${v.c}:${v.v}`}><sup className="rubric font-sans text-[.65rem] mr-0.5 tabular">{v.c !== p.c1 || v.v === 1 ? `${v.c}:` : ''}{v.v}</sup>{v.text} </span>)}
            </div>
          )}
          <p className="text-xs text-muted mt-5">King James Version, public domain. Versification follows the KJV.</p>
        </article>
      )}
    </div>
  );
}

function Paths({ initial }: { initial: string | null }) {
  const [id, setId] = useState(initial ?? studyPaths[0]?.id);
  const [step, setStep] = useState(0);
  const p = studyPaths.find((x) => x.id === id);
  useEffect(() => setStep(0), [id]);
  if (!studyPaths.length) return <Empty>Guided paths are still being written.</Empty>;
  return (
    <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
      <nav className="space-y-1">{studyPaths.map((x) => <button key={x.id} onClick={() => setId(x.id)} className={`w-full text-left px-3 py-2 rounded ${x.id === id ? 'bg-sunk font-semibold' : 'hover:bg-sunk'}`}>{x.title}<div className="text-xs text-muted font-normal">{x.steps.length} steps</div></button>)}</nav>
      {p && (
        <div className="min-w-0">
          <h2 className="display text-3xl">{p.title}</h2>
          <p className="font-serif text-muted mb-4">{p.summary}</p>
          <div className="flex gap-1 mb-4">{p.steps.map((_, i) => <button key={i} onClick={() => setStep(i)} aria-label={`Step ${i + 1}`} className={`h-1.5 flex-1 rounded ${i <= step ? 'bg-accent2' : 'bg-sunk'}`} />)}</div>
          <div className="card p-5">
            <div className="eyebrow mb-1">Step {step + 1} of {p.steps.length}</div>
            <h3 className="display text-2xl mb-2">{p.steps[step].title}</h3>
            <p className="font-serif text-lg leading-relaxed">{p.steps[step].body}</p>
            <div className="mt-3"><Refs refs={p.steps[step].refs} /></div>
            {p.steps[step].link && <Link to={p.steps[step].link!} className="btn mt-4">Open in the atlas →</Link>}
          </div>
          <div className="flex justify-between mt-3">
            <button className="btn" disabled={step === 0} onClick={() => setStep(step - 1)}>← Previous</button>
            <button className="btn btn-primary" disabled={step === p.steps.length - 1} onClick={() => setStep(step + 1)}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Compare() {
  const sorted = useMemo(() => [...people].sort((a, b) => a.names.primary.localeCompare(b.names.primary)), []);
  const [a, setA] = useState(personById.has('elijah') ? 'elijah' : sorted[0]?.id);
  const [b, setB] = useState(personById.has('john-the-baptist') ? 'john-the-baptist' : sorted[1]?.id);
  const pa = personById.get(a), pb = personById.get(b);
  const row = (label: string, f: (p: NonNullable<typeof pa>) => React.ReactNode) => <tr><th className="eyebrow text-left align-top pr-3 py-2 w-28">{label}</th><td className="align-top py-2 pr-3">{pa && f(pa)}</td><td className="align-top py-2">{pb && f(pb)}</td></tr>;
  const shared = pa && pb ? contemporaries(pa).some((c) => c.p.id === pb.id) : false;
  return (
    <div>
      <div className="grid gap-2 grid-cols-2 mb-4">
        {[[a, setA], [b, setB]].map(([v, s], i) => <select key={i} id={`cmp-person-${i}`} aria-label={`Person ${i + 1}`} className="input" value={v as string} onChange={(e) => (s as (x: string) => void)(e.target.value)}>{sorted.map((p) => <option key={p.id} value={p.id}>{p.names.primary}</option>)}</select>)}
      </div>
      {pa && pb && (
        <div className="scroll-x"><table className="w-full min-w-[560px] text-sm font-serif"><tbody>
          {row('Name', (p) => <Link to={`/people/${p.id}`} className="display text-2xl hover:text-accent">{p.names.primary}</Link>)}
          {row('Lived', (p) => { const l = lifespan(p); return l ? `${fmtYear(l[0])} – ${fmtYear(l[1])}` : 'Undated'; })}
          {row('Roles', (p) => p.roles.join(', '))}
          {row('Work', (p) => p.occupations.join(', ') || '—')}
          {row('Gifts', (p) => p.gifts.map((g) => g.name).join(', ') || '—')}
          {row('Strengths', (p) => p.arc?.strengths.join('; ') ?? '—')}
          {row('Failures', (p) => p.arc?.failures.join('; ') ?? '—')}
          {row('Turning points', (p) => p.arc?.turningPoints.join('; ') ?? '—')}
          {row('Summary', (p) => p.summary.split('\n')[0])}
        </tbody></table></div>
      )}
      {pa && pb && <p className="text-sm text-muted mt-3">{shared ? `${pa.names.primary} and ${pb.names.primary} were alive at the same time.` : `Their recorded lifespans don’t overlap.`} <Link className="text-accent" to={`/connections?from=${pa.id}&to=${pb.id}`}>How are they connected? →</Link></p>}
    </div>
  );
}

function Saved() {
  const { bookmarks, notes, addNote, removeNote, toggleBookmark } = useUI();
  const [draft, setDraft] = useState('');
  const [target, setTarget] = useState('General');
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Section title="Bookmarks">{bookmarks.length ? <ul className="space-y-1.5">{bookmarks.map((b) => <li key={b} className="flex justify-between gap-2"><Link className="hover:text-accent" to={b}>{b}</Link><button className="text-xs text-muted hover:text-bad" onClick={() => toggleBookmark(b)}>Remove</button></li>)}</ul> : <p className="text-muted font-serif">Use the ☆ Save button on any person, book, debate or context page.</p>}</Section>
      <Section title="Notes">
        <form className="space-y-2 mb-4" onSubmit={(e) => { e.preventDefault(); if (draft.trim()) { addNote(target, draft.trim()); setDraft(''); } }}>
          <input id="note-target" className="input" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="About (a verse, person, topic)" />
          <textarea id="note-text" className="input min-h-24" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a note…" />
          <button className="btn btn-primary">Save note</button>
        </form>
        {notes.length ? <ul className="space-y-2">{[...notes].reverse().map((n) => <li key={n.id} className="card p-3"><div className="flex justify-between"><span className="eyebrow">{n.target}</span><button className="text-xs text-muted hover:text-bad" onClick={() => removeNote(n.id)}>Delete</button></div><p className="font-serif whitespace-pre-wrap">{n.text}</p><div className="text-xs text-muted">{new Date(n.at).toLocaleDateString()}</div></li>)}</ul> : <p className="text-muted font-serif text-sm">Notes stay in this browser only.</p>}
      </Section>
    </div>
  );
}

function AskAtlas({ initial }: { initial?: string }) {
  const fuse = useMemo(() => new Fuse([
    ...people.map((p) => ({ kind: 'person', id: p.id, title: p.names.primary, text: p.summary })),
    ...allDebates.map((d) => ({ kind: 'debate', id: d.id, title: d.title, text: d.question + ' ' + d.positions.map((p) => p.name).join(', ') })),
    ...contextItems.map((c) => ({ kind: 'context', id: c.id, title: c.title, text: c.summary })),
    ...books.map((b) => ({ kind: 'book', id: b.id, title: b.name, text: b.purpose })),
  ], { keys: ['title', 'text'], threshold: 0.35, ignoreLocation: true }), []);
  const tools = [
    { name: 'search_atlas', description: 'Search the Logos Atlas content (people, debates, context entries, books). Returns up to 8 matches with kind, id, title and a short summary.', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
      execute: (i: any) => fuse.search(String(i.query ?? ''), { limit: 8 }).map((r) => ({ ...r.item, text: r.item.text.slice(0, 300) })) },
    { name: 'get_person', description: 'Get a person profile from the atlas by id (from search_atlas). Returns summary, roles, key events with scripture refs.', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
      execute: (i: any) => { const p = personById.get(String(i.id)); if (!p) throw new Error('No such person id'); return { name: p.names.primary, roles: p.roles, summary: p.summary.slice(0, 1500), events: p.events.map((e) => ({ title: e.title, refs: e.refs })), refs: p.refs }; } },
    { name: 'get_verse', description: 'Get King James Version text for one reference like "Gen 12:1-3" or "Ps 23". Abbreviations: Gen Exod Lev Num Deut Josh Judg Ruth 1 Sam 2 Sam 1 Kgs 2 Kgs 1 Chr 2 Chr Ezra Neh Esth Job Ps Prov Eccl Song Isa Jer Lam Ezek Dan Hos Joel Amos Obad Jonah Mic Nah Hab Zeph Hag Zech Mal Matt Mark Luke John Acts Rom 1 Cor 2 Cor Gal Eph Phil Col 1 Thess 2 Thess 1 Tim 2 Tim Titus Phlm Heb Jas 1 Pet 2 Pet 1 John 2 John 3 John Jude Rev.', inputSchema: { type: 'object', properties: { ref: { type: 'string' } }, required: ['ref'] },
      execute: async (i: any) => { const p = parseRef(String(i.ref)); if (!p) throw new Error('Unrecognised reference format'); const k = await loadKJV(); return versesFor(k, p, 40).map((v) => `${v.c}:${v.v} ${v.text}`).join('\n'); } },
  ];
  const rules = `You are the guide inside Logos Atlas, an even-handed Bible, church-history and theology study app. Use the tools to look things up in the atlas and to quote KJV text before answering. Cite scripture as (Book chapter:verse). On contested questions, describe the main views fairly and never declare one correct. Distinguish what the text says from interpretation and from later tradition. Never fabricate quotations or citations; say when you are unsure. Keep answers under 250 words unless asked for more. When you mention an atlas person or debate, give its id in brackets like [person:paul] or [debate:atonement].`;
  return <Chat initial={initial} rules={rules} speaker="Atlas guide" tools={tools} placeholder="Ask anything about the Bible, its people or its debates…"
    intro="Ask a question and the guide will search the atlas and read the KJV text before answering."
    suggestions={['Which prophets were active when Samaria fell?', 'What does Acts 3:21 mean in different traditions?', 'Compare Elijah and John the Baptist', 'What did the earliest Christians preach?']} />;
}

export default function Study() {
  const [sp] = useSearchParams();
  const verse = sp.get('verse');
  const path = sp.get('path');
  const ask = sp.get('ask') ?? undefined;
  const [tab, setTab] = useState<Tab>(verse ? 'verse' : ask ? 'ask' : 'paths');
  useEffect(() => { if (verse) setTab('verse'); }, [verse]);
  return (
    <div>
      <PageHeader eyebrow="Study desk" title="Study">Read any passage, walk a guided path, compare two lives, keep notes, or ask the atlas a question.</PageHeader>
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[{ id: 'paths', label: 'Guided paths' }, { id: 'verse', label: 'Verse panel' }, { id: 'compare', label: 'Compare people' }, { id: 'saved', label: 'Bookmarks & notes' }, { id: 'ask', label: '✦ Ask the Atlas' }]} />
      {tab === 'verse' && <VersePanel key={verse ?? ''} initial={verse ?? ''} />}
      {tab === 'paths' && <Paths initial={path} />}
      {tab === 'compare' && <Compare />}
      {tab === 'saved' && <Saved />}
      {tab === 'ask' && <AskAtlas initial={ask} />}
    </div>
  );
}
