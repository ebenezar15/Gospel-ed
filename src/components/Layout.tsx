import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Fuse from 'fuse.js';
import { SCHEMES, useUI, applyTheme } from '../store';
import {
  people, places, placeLabel, books, guides, figures, canonBooks, paradoxes, types, symbols, bibleHistory, gods, godsExtra, allDebates, contextItems, occupations, journeys, afterlifeTerms, gospelNodes, eras, studyPaths, deepStudies, bookStudies,
} from '../data';
import { parseRef } from '../lib/refs';

const NAV: { group: string; items: { to: string; label: string; glyph: string }[] }[] = [
  { group: 'The Book', items: [
    { to: '/', label: 'Home', glyph: '⌂' }, { to: '/guides', label: 'Study Guides', glyph: '❖' }, { to: '/people', label: 'People', glyph: '☺' }, { to: '/rosters', label: 'Rosters', glyph: '≡' },
    { to: '/books', label: 'Books', glyph: '❦' }, { to: '/family', label: 'Family Tree', glyph: '⚘' }, { to: '/connections', label: 'Connections', glyph: '✣' },
    { to: '/work', label: 'Work & Ministry', glyph: '⚒' },
  ] },
  { group: 'Reading the Bible', items: [
    { to: '/bible-history', label: 'Bible History', glyph: '▤' }, { to: '/canon', label: 'Omitted & Lost Books', glyph: '✠' },
    { to: '/types', label: 'Types & Shadows', glyph: '⇄' }, { to: '/symbols', label: 'Symbols & Imagery', glyph: '◈' }, { to: '/paradoxes', label: 'Paradoxes', glyph: '☯' },
    { to: '/gods', label: 'Gods of the Nations', glyph: '♆' },
  ] },
  { group: 'Time & Place', items: [{ to: '/timeline', label: 'Timeline', glyph: '⟿' }, { to: '/maps', label: 'Maps & Journeys', glyph: '✦' }, { to: '/lens', label: 'Who Was Alive?', glyph: '◎' }] },
  { group: 'Gospel & Doctrine', items: [
    { to: '/gospel-history', label: 'Gospel Through History', glyph: '✉' }, { to: '/afterlife', label: 'Afterlife & Kingdom', glyph: '☼' },
    { to: '/debates', label: 'Debates', glyph: '⚖' }, { to: '/theologians', label: 'Theologians', glyph: '✒' }, { to: '/movements', label: 'Movements', glyph: '✧' }, { to: '/context', label: 'Cultural Context', glyph: '❂' },
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
      ...guides.map((g) => ({ kind: 'Study guide', title: g.title, sub: g.question, to: `/guides/${g.id}` })),
      ...figures.map((f) => ({ kind: 'Theologian', title: f.name, sub: `${f.lived} · ${f.profession}`, to: '/theologians' })),
      ...canonBooks.map((b) => ({ kind: 'Omitted book', title: b.title, sub: b.altTitles.join(', ') || b.category, to: `/canon?book=${b.id}` })),
      ...paradoxes.map((p) => ({ kind: 'Paradox', title: p.title, sub: p.takeaway, to: `/paradoxes?p=${p.id}` })),
      ...types.map((t) => ({ kind: 'Type', title: `${t.type.name} → ${t.antitype.name}`, sub: t.title, to: `/types?t=${t.id}` })),
      ...symbols.map((s) => ({ kind: 'Symbol', title: s.name, sub: s.meanings.slice(0, 3).map((m) => m.meaning).join(', '), to: `/symbols?s=${s.id}` })),
      ...bibleHistory.variants.map((v) => ({ kind: 'Disputed passage', title: v.title, sub: v.ref, to: '/bible-history' })),
      ...gods.map((g) => ({ kind: 'God', title: g.name, sub: [g.otherNames.join(', '), g.domains.slice(0, 3).join(', ')].filter(Boolean).join(' · '), to: `/gods?tab=gods&g=${g.id}` })),
      ...godsExtra.showdowns.map((s) => ({ kind: 'Showdown', title: s.title, sub: s.place, to: '/gods?tab=showdowns' })),
      ...deepStudies.flatMap((d) => [{ kind: 'Deep study', title: d.title, sub: `${d.chapters.length} chapters, chapter by chapter`, to: `/books/${d.id}/deep` },
        ...d.chapters.map((c) => ({ kind: 'Chapter study', title: `${books.find((b) => b.id === d.id)?.name ?? d.id} ${c.n}: ${c.title}`, sub: c.summary.slice(0, 80), to: `/books/${d.id}/deep?ch=${c.n}` }))]),
      ...bookStudies.flatMap((s) => s.misreadings.map((m) => ({ kind: 'Misreading', title: m.topic, sub: books.find((b) => b.id === s.id)?.name ?? '', to: `/books/${s.id}` }))),
      { kind: 'Page', title: 'When the books were written', sub: 'Timeline of all 66 books', to: '/books?tab=when' },
      { kind: 'Page', title: 'Where the books were written', sub: 'Map of authors and first readers', to: '/books?tab=where' },
      { kind: 'Page', title: 'The divine council', sub: 'Psalm 82, Deuteronomy 32:8, sons of God', to: '/gods?tab=council' },
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
        <span>Appearance</span><span className="text-muted">{SCHEMES.find((s) => s.id === scheme)?.name ?? 'Parchment'}</span>
      </button>
      {open && (
        <div className="absolute bottom-full mb-2 left-0 w-72 card shadow-xl p-3 z-50 space-y-3">
          <div>
            <div className="eyebrow mb-1.5">Scheme</div>
            <div className="grid grid-cols-2 gap-1.5">
              {SCHEMES.map((s) => (
                <button key={s.id} data-scheme-preview={s.id} onClick={() => set({ scheme: s.id })} className={`text-left p-2 rounded border ${scheme === s.id ? 'border-accent' : 'border-line'}`}>
                  <div className="flex gap-1 mb-1">{s.swatch.map((c) => <span key={c} className="w-3 h-3 rounded-full border border-line" style={{ background: c }} />)}</div><div className="text-sm font-medium">{s.name}</div><div className="text-[.68rem] text-muted leading-tight">{s.note}</div>
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

function useWidth() {
  const [w, setW] = useState(() => (typeof window === 'undefined' ? 1400 : window.innerWidth));
  useEffect(() => { const h = () => setW(window.innerWidth); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return w;
}

export default function Layout({ children }: { children: ReactNode }) {
  const { scheme, mode, reducedMotion, navOpen, set } = useUI();
  const [palette, setPalette] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const loc = useLocation();
  const width = useWidth();
  const phone = width < 768;
  // On tablets in portrait (and narrow windows) the open pane floats over the page instead of squeezing it.
  const overlay = width < 1100;
  const open = navOpen ?? width >= 1280;
  const pinned = open && !overlay;
  const setOpen = (v: boolean) => set({ navOpen: v });

  useEffect(() => applyTheme(scheme, mode, reducedMotion), [scheme, mode, reducedMotion]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((p) => !p); }
      const typing = (e.target as HTMLElement).closest('input,textarea,select');
      if (e.key === '/' && !typing) { e.preventDefault(); setPalette(true); }
      if (e.key === '[' && !typing) { e.preventDefault(); set({ navOpen: !(useUI.getState().navOpen ?? window.innerWidth >= 1280) }); }
      if (e.key === 'Escape') setDrawer(false);
    };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, []);
  useEffect(() => {
    setDrawer(false);
    if (overlay && navOpen) set({ navOpen: false });
    window.scrollTo(0, 0);
  }, [loc.pathname]);

  const navList = (compact = false) => (
    <nav aria-label="Main" className={compact ? 'flex flex-col items-center gap-1' : 'space-y-5'}>
      {NAV.map((g, gi) => (
        <div key={g.group} className={compact ? 'flex flex-col items-center gap-1 w-full' : ''}>
          {compact ? (gi > 0 && <span className="block w-6 h-px bg-line my-1.5" aria-hidden />) : <div className="eyebrow mb-1.5 px-2">{g.group}</div>}
          <ul className={compact ? 'flex flex-col items-center gap-0.5' : 'space-y-0.5'}>
            {g.items.map((i) => (
              <li key={i.to}>
                <NavLink to={i.to} end={i.to === '/'} title={compact ? i.label : undefined} aria-label={compact ? i.label : undefined}
                  className={({ isActive }) => compact
                    ? `group relative flex items-center justify-center w-10 h-10 rounded-full text-[1.05rem] ${isActive ? 'bg-accent/15 text-accent' : 'text-gold hover:bg-sunk'}`
                    : `flex items-center gap-2.5 px-2.5 py-1.5 rounded-full text-[.9rem] font-medium ${isActive ? 'bg-accent/10 text-accent font-semibold' : 'text-ink/75 hover:text-ink hover:bg-sunk'}`}>
                  <span aria-hidden className={compact ? '' : 'w-4 text-center text-gold'}>{i.glyph}</span>
                  {compact ? null : i.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
  const logo = <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden><circle cx="16" cy="16" r="15" fill="rgb(var(--accent))" /><circle cx="16" cy="16" r="12.5" fill="none" stroke="rgb(var(--accent-ink))" strokeOpacity=".5" strokeWidth="1" /><path d="M16 6v20M9 13h14" stroke="rgb(var(--accent-ink))" strokeWidth="2.2" strokeLinecap="round" /></svg>;
  const brand = (
    <NavLink to="/" className="flex items-center gap-2.5 min-w-0">
      {logo}
      <span className="leading-none min-w-0"><span className="display text-[1.35rem] font-semibold tracking-tight block">Logos Atlas</span><span className="text-[.6rem] tracking-[.12em] uppercase text-muted whitespace-nowrap">Bible · People · Doctrine</span></span>
    </NavLink>
  );
  const collapseBtn = (
    <button className="btn !px-2.5 !py-1.5 shrink-0" onClick={() => setOpen(false)} aria-label="Hide menu" title="Hide menu ( [ )">
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
  );
  const fullPane = (
    <>
      <div className="flex items-center justify-between gap-2 px-1">{brand}{collapseBtn}</div>
      <button className="btn justify-between text-muted" onClick={() => setPalette(true)}><span>Search…</span><kbd className="text-xs">Ctrl K</kbd></button>
      <EraFilter />
      <div className="flex-1">{navList()}</div>
      <ThemeMenu />
      <p className="text-[.68rem] text-muted px-1 leading-snug">Scripture text: King James Version (public domain). Summaries are original; confidence labels mark what is text, consensus, debate or tradition. Press [ to show or hide this menu.</p>
    </>
  );
  const safeTop = { paddingTop: 'max(1.25rem, calc(env(safe-area-inset-top, 0px) + .75rem))', paddingLeft: 'max(12px, env(safe-area-inset-left, 0px))' };

  return (
    <div className="min-h-full paper-grain md:flex">
      {/* Tablet & desktop: a slim icon rail that is always there, plus the full pane when open. */}
      {!phone && !pinned && (
        <aside className="hidden md:flex flex-col items-center gap-2 [&>*]:shrink-0 sticky top-0 h-[100dvh] w-16 shrink-0 overflow-y-auto overflow-x-visible border-r border-line bg-surface py-4 z-30" style={{ paddingTop: safeTop.paddingTop, paddingLeft: 'env(safe-area-inset-left, 0px)' }}>
          <NavLink to="/" aria-label="Home" title="Logos Atlas">{logo}</NavLink>
          <button className="w-10 h-10 rounded-full border border-line flex items-center justify-center hover:border-accent" onClick={() => setOpen(true)} aria-label="Show menu" title="Show menu ( [ )">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button className="w-10 h-10 rounded-full hover:bg-sunk flex items-center justify-center" onClick={() => setPalette(true)} aria-label="Search" title="Search (Ctrl K)">
            <svg width="17" height="17" viewBox="0 0 16 16" aria-hidden><circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="m10.5 10.5 3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
          <span className="block w-6 h-px bg-line my-1" aria-hidden />
          {navList(true)}
        </aside>
      )}
      {!phone && pinned && (
        <aside className="hidden md:flex flex-col gap-5 sticky top-0 h-[100dvh] w-[284px] shrink-0 overflow-y-auto border-r border-line bg-surface px-3 pb-5" style={safeTop}>
          {fullPane}
        </aside>
      )}
      <AnimatePresence>
        {!phone && open && overlay && (
          <motion.div className="fixed inset-0 z-50 bg-black/25" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={() => setOpen(false)}>
            <motion.aside className="absolute left-0 top-0 bottom-0 w-[min(300px,80vw)] bg-surface border-r border-line px-3 pb-5 overflow-y-auto flex flex-col gap-5 shadow-2xl"
              style={{ ...safeTop, willChange: 'transform' }} initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }} transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }} onClick={(e) => e.stopPropagation()}>
              {fullPane}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phones: top bar + slide-in drawer from the left. */}
      <header className="md:hidden sticky top-[env(safe-area-inset-top,0px)] z-40 bg-surface border-b border-line gutter py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button className="btn !px-2.5" onClick={() => setDrawer(true)} aria-label="Open menu">☰</button>
          {brand}
        </div>
        <button className="btn !px-2.5" onClick={() => setPalette(true)} aria-label="Search">
          <svg width="17" height="17" viewBox="0 0 16 16" aria-hidden><circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="m10.5 10.5 3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </button>
      </header>
      <AnimatePresence>
        {drawer && phone && (
          <motion.div className="fixed inset-0 z-50 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)}>
            <motion.aside className="absolute left-0 top-0 bottom-0 w-[min(300px,85vw)] bg-surface border-r border-line p-4 overflow-y-auto space-y-4" style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top,0px))', paddingLeft: 'max(16px, env(safe-area-inset-left,0px))' }}
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: 'tween', duration: 0.22 }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between gap-2"><div className="min-w-0">{brand}</div><button className="btn !px-2.5" onClick={() => setDrawer(false)} aria-label="Close menu">✕</button></div>
              <EraFilter />{navList()}<ThemeMenu />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <main id="main" className="flex-1 min-w-0 gutter py-6 md:py-8 md:!px-7 lg:!px-10 xl:!px-12">
        <div key={loc.pathname} className="page-enter max-w-[1280px] mx-auto">
          {children}
        </div>
      </main>
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}
