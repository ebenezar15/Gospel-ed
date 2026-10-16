import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Fuse from 'fuse.js';
import { SCHEMES, useUI, applyTheme } from '../store';
import {
  people, places, placeLabel, books, allDebates, contextItems, occupations, journeys, afterlifeTerms, gospelNodes, eras, studyPaths,
} from '../data';
import { parseRef } from '../lib/refs';

const NAV: { group: string; items: { to: string; label: string; glyph: string }[] }[] = [
  { group: 'The Book', items: [
    { to: '/', label: 'Home', glyph: '⌂' }, { to: '/people', label: 'People', glyph: '☺' }, { to: '/rosters', label: 'Rosters', glyph: '≡' },
    { to: '/books', label: 'Books', glyph: '❦' }, { to: '/family', label: 'Family Tree', glyph: '⚘' }, { to: '/connections', label: 'Connections', glyph: '✣' },
    { to: '/work', label: 'Work & Ministry', glyph: '⚒' },
  ] },
  { group: 'Time & Place', items: [{ to: '/timeline', label: 'Timeline', glyph: '⟿' }, { to: '/maps', label: 'Maps & Journeys', glyph: '✦' }, { to: '/lens', label: 'Who Was Alive?', glyph: '◎' }] },
  { group: 'Gospel & Doctrine', items: [
    { to: '/gospel-history', label: 'Gospel Through History', glyph: '✉' }, { to: '/afterlife', label: 'Afterlife & Kingdom', glyph: '☼' },
    { to: '/debates', label: 'Debates', glyph: '⚖' }, { to: '/movements', label: 'Movements', glyph: '✧' }, { to: '/context', label: 'Cultural Context', glyph: '⌘' },
  ] },
  { group: 'Study', items: [{ to: '/study', label: 'Study Desk', glyph: '✎' }, { to: '/quiz', label: 'Quiz & Cards', glyph: '?' }] },
];

type Hit = { kind: string; title: string; sub: string; to: string };
function useSearchIndex() {
  return useMemo(() => {
    const docs: Hit[] = [
      ...people.map((p) => ({ kind: 'Person', title: p.names.primary, sub: [p.names.aliases.join(', '), p.roles.slice(0, 3).join(', ')].filter(Boolean).join(' · '), to: `/people/${p.id}` })),
      ...places.map((p) => ({ kind: 'Place', title: placeLabel(p), sub: p.names.map((n) => n.name).join(' / '), to: `/maps?place=${p.id}` })),
      ...books.map((b) => ({ kind: 'Book', title: b.name, sub: b.genre, to: `/books/${b.id}` })),
      ...allDebates.map((d) => ({ kind: d.category === 'movement' ? 'Movement' : 'Debate', title: d.title, sub: d.positions.map((p) => p.name).join(' · '), to: d.category === 'movement' ? `/movements/${d.id}` : `/debates/${d.id}` })),
      ...allDebates.flatMap((d) => d.positions.map((p) => ({ kind: 'Position', title: p.name, sub: d.title, to: `/debates/${d.id}?pos=${p.id}` }))),
      ...contextItems.map((c) => ({ kind: 'Context', title: c.title, sub: c.category, to: `/context/${c.id}` })),
      ...occupations.map((o) => ({ kind: o.kind === 'trade' ? 'Occupation' : 'Ministry', title: o.name, sub: o.summary.slice(0, 80), to: `/work#${o.id}` })),
      ...journeys.map((j) => ({ kind: 'Journey', title: j.title, sub: j.variant ?? j.summary.slice(0, 80), to: `/maps?journey=${j.id}` })),
      ...afterlifeTerms.map((t) => ({ kind: 'Term', title: t.term, sub: t.original, to: `/afterlife#${t.id}` })),
      ...gospelNodes.map((g) => ({ kind: 'Gospel history', title: g.title, sub: `${g.year} · ${g.place}`, to: `/gospel-history?node=${g.id}` })),
      ...eras.map((e) => ({ kind: 'Era', title: e.name, sub: e.summary.slice(0, 80), to: `/timeline?era=${e.id}` })),
      ...studyPaths.map((s) => ({ kind: 'Study path', title: s.title, sub: s.summary.slice(0, 80), to: `/study?path=${s.id}` })),
      ...NAV.flatMap((g) => g.items.map((i) => ({ kind: 'Page', title: i.label, sub: g.group, to: i.to }))),
    ];
    return new Fuse(docs, { keys: [{ name: 'title', weight: 3 }, 'sub'], threshold: 0.32, ignoreLocation: true });
  }, []);
}

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const fuse = useSearchIndex();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) { setQ(''); setSel(0); setTimeout(() => input.current?.focus(), 10); } }, [open]);
  const verse = parseRef(q.trim().replace(/^(\w+)\s/, (m) => m.charAt(0).toUpperCase() + m.slice(1)));
  const hits: Hit[] = [
    ...(verse ? [{ kind: 'Verse', title: q.trim(), sub: 'Open in the verse panel (KJV)', to: `/study?verse=${encodeURIComponent(q.trim())}` }] : []),
    ...(q ? fuse.search(q, { limit: 14 }).map((r) => r.item) : NAV.flatMap((g) => g.items.map((i) => ({ kind: 'Page', title: i.label, sub: g.group, to: i.to })))),
  ];
  const go = (h: Hit) => { nav(h.to); onClose(); };
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] bg-black/40 flex items-start justify-center pt-[10vh] gutter" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.div role="dialog" aria-label="Search the atlas" className="card w-full max-w-xl shadow-2xl overflow-hidden" initial={{ y: -12, scale: .98 }} animate={{ y: 0, scale: 1 }} onMouseDown={(e) => e.stopPropagation()}>
            <input ref={input} id="palette-q" value={q} onChange={(e) => { setQ(e.target.value); setSel(0); }} placeholder="Search people, places, placeLabel, books, debates… or type a verse (John 3:16)"
              className="w-full bg-transparent px-4 py-3.5 text-base border-b border-line outline-none"
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, hits.length - 1)); }
                if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
                if (e.key === 'Enter' && hits[sel]) go(hits[sel]);
                if (e.key === 'Escape') onClose();
              }} />
            <ul className="max-h-[55vh] overflow-auto py-1" role="listbox">
              {hits.map((h, i) => (
                <li key={h.kind + h.to + i} role="option" aria-selected={i === sel}>
                  <button onMouseEnter={() => setSel(i)} onClick={() => go(h)} className={`w-full text-left px-4 py-2 flex items-baseline gap-3 ${i === sel ? 'bg-sunk' : ''}`}>
                    <span className="eyebrow w-24 shrink-0 !text-[.62rem]">{h.kind}</span>
                    <span className="min-w-0"><span className="font-medium">{h.title}</span> <span className="text-muted text-sm truncate">{h.sub}</span></span>
                  </button>
                </li>
              ))}
              {!hits.length && <li className="px-4 py-6 text-muted">Nothing matches “{q}”. Try a name, a place, or a reference like Rom 8:28.</li>}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ThemeMenu() {
  const { scheme, mode, reducedMotion, showSpeculative, chronology, set } = useUI();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button className="btn w-full justify-between" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>Appearance</span><span className="text-muted">{SCHEMES.find((s) => s.id === scheme)?.name}</span>
      </button>
      {open && (
        <div className="absolute bottom-full mb-2 left-0 w-72 card shadow-xl p-3 z-50 space-y-3">
          <div>
            <div className="eyebrow mb-1.5">Scheme</div>
            <div className="grid grid-cols-2 gap-1.5">
              {SCHEMES.map((s) => (
                <button key={s.id} data-scheme-preview={s.id} onClick={() => set({ scheme: s.id })} className={`text-left p-2 rounded border ${scheme === s.id ? 'border-accent' : 'border-line'}`}>
                  <div className="text-sm font-medium">{s.name}</div><div className="text-[.68rem] text-muted leading-tight">{s.note}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="eyebrow mb-1.5">Light / dark</div>
            <div className="flex gap-1">{(['system', 'light', 'dark'] as const).map((m) => <button key={m} className={`btn flex-1 justify-center ${mode === m ? 'btn-primary' : ''}`} onClick={() => set({ mode: m })}>{m}</button>)}</div>
          </div>
          <div>
            <div className="eyebrow mb-1.5">Exodus chronology</div>
            <div className="flex gap-1">
              <button className={`btn flex-1 justify-center ${chronology === 'early' ? 'btn-primary' : ''}`} onClick={() => set({ chronology: 'early' })}>Early (c. 1446 BC)</button>
              <button className={`btn flex-1 justify-center ${chronology === 'late' ? 'btn-primary' : ''}`} onClick={() => set({ chronology: 'late' })}>Late (c. 1260 BC)</button>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" id="opt-motion" checked={reducedMotion} onChange={(e) => set({ reducedMotion: e.target.checked })} /> Reduce motion</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" id="opt-spec" checked={showSpeculative} onChange={(e) => set({ showSpeculative: e.target.checked })} /> Show speculative items</label>
        </div>
      )}
    </div>
  );
}

function EraFilter() {
  const { eraFilter, set } = useUI();
  return (
    <select id="era-filter" aria-label="Filter everything by era" value={eraFilter ?? ''} onChange={(e) => set({ eraFilter: e.target.value || null })} className="input !py-1.5 !text-sm">
      <option value="">All eras</option>
      {eras.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
    </select>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const { scheme, mode, reducedMotion } = useUI();
  const [palette, setPalette] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const loc = useLocation();
  useEffect(() => applyTheme(scheme, mode, reducedMotion), [scheme, mode, reducedMotion]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((p) => !p); } if (e.key === '/' && !(e.target as HTMLElement).closest('input,textarea,select')) { e.preventDefault(); setPalette(true); } };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, []);
  useEffect(() => { setDrawer(false); document.getElementById('main')?.scrollTo?.(0, 0); window.scrollTo(0, 0); }, [loc.pathname]);

  const navList = (
    <nav aria-label="Main" className="space-y-5">
      {NAV.map((g) => (
        <div key={g.group}>
          <div className="eyebrow mb-1.5 px-2">{g.group}</div>
          <ul className="space-y-0.5">
            {g.items.map((i) => (
              <li key={i.to}>
                <NavLink to={i.to} end={i.to === '/'} className={({ isActive }) => `flex items-center gap-2.5 px-2 py-1.5 rounded text-[.92rem] ${isActive ? 'bg-sunk text-ink font-semibold' : 'text-muted hover:text-ink'}`}>
                  <span aria-hidden className="w-4 text-center rubric font-serif">{i.glyph}</span>{i.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
  const brand = (
    <NavLink to="/" className="flex items-center gap-2.5">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden><circle cx="16" cy="16" r="14.5" fill="none" stroke="rgb(var(--accent-2))" strokeWidth="1.5" /><path d="M16 4v24M6 12h20" stroke="rgb(var(--accent))" strokeWidth="2" /><circle cx="16" cy="12" r="3" fill="rgb(var(--accent-2))" /></svg>
      <span className="display text-2xl leading-none">Logos Atlas</span>
    </NavLink>
  );

  return (
    <div className="min-h-full lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="hidden lg:flex flex-col gap-5 sticky top-0 h-screen overflow-y-auto border-r border-line bg-surface px-3 py-5">
        <div className="px-2">{brand}</div>
        <button className="btn justify-between text-muted" onClick={() => setPalette(true)}><span>Search…</span><kbd className="text-xs">Ctrl K</kbd></button>
        <EraFilter />
        <div className="flex-1">{navList}</div>
        <ThemeMenu />
        <p className="text-[.68rem] text-muted px-1 leading-snug">Scripture text: King James Version (public domain). Summaries are original; confidence labels mark what is text, consensus, debate or tradition.</p>
      </aside>
      <header className="lg:hidden sticky top-[env(safe-area-inset-top,0px)] z-40 bg-surface border-b border-line gutter py-2.5 flex items-center justify-between gap-3">
        {brand}
        <div className="flex gap-2">
          <button className="btn" onClick={() => setPalette(true)} aria-label="Search">⌕</button>
          <button className="btn" onClick={() => setDrawer(true)} aria-label="Open menu">☰</button>
        </div>
      </header>
      <AnimatePresence>
        {drawer && (
          <motion.div className="lg:hidden fixed inset-0 z-50 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)}>
            <motion.aside className="absolute right-0 top-0 bottom-0 w-[min(300px,85vw)] bg-surface p-4 overflow-y-auto space-y-4" style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top,0px))', paddingRight: 'max(16px, env(safe-area-inset-right,0px))' }}
              initial={{ x: 40 }} animate={{ x: 0 }} exit={{ x: 40 }} onClick={(e) => e.stopPropagation()}>
              <EraFilter />{navList}<ThemeMenu />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
      <main id="main" className="min-w-0 gutter py-6 lg:py-10 lg:px-10">
        <AnimatePresence mode="wait">
          <motion.div key={loc.pathname} initial={{ opacity: 0.001, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="max-w-[1180px] mx-auto">
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}
