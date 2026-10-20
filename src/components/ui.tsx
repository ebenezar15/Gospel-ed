import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { parseRef } from '../lib/refs';
import { loadKJV, versesFor, refLabel } from '../lib/kjv';
import { personById, placeName, personName } from '../data';
import type { ConfidenceT, DateValueT, SourceT } from '../schemas';
import { useUI } from '../store';

export const fmtYear = (y: number) => (y < 0 ? `${-y} BC` : y < 1000 ? `AD ${y}` : `${y}`);
export function fmtDate(d?: DateValueT) { if (!d) return '—'; return `${d.circa ? 'c. ' : ''}${fmtYear(d.year)}`; }

const CONF_LABEL: Record<ConfidenceT, string> = {
  biblical: 'Biblical', 'scholarly-consensus': 'Scholarly consensus', debated: 'Debated', tradition: 'Tradition', speculative: 'Speculative', 'needs-verification': 'Needs verification',
};
const CONF_HELP: Record<ConfidenceT, string> = {
  biblical: 'Stated in the biblical text', 'scholarly-consensus': 'Broadly agreed by scholars', debated: 'Scholars disagree; alternatives shown', tradition: 'Extra-biblical church tradition', speculative: 'Speculative reconstruction', 'needs-verification': 'Citation not yet verified',
};
export function Conf({ c, small }: { c: ConfidenceT; small?: boolean }) {
  return <span title={CONF_HELP[c]} className={`chip conf conf-${c} ${small ? '!text-[.65rem] !py-0' : ''}`}>{CONF_LABEL[c]}</span>;
}
export function DateWithConf({ d, label }: { d?: DateValueT; label?: string }) {
  const chronology = useUI((s) => s.chronology);
  if (!d) return null;
  const alt = d.alternatives?.find((a) => (chronology === 'late' ? /late/i.test(a.label) : false));
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {label && <span className="text-muted text-sm">{label}</span>}
      <span className="tabular font-medium">{alt ? `c. ${fmtYear(alt.year)}` : fmtDate(d)}</span>
      <Conf c={d.confidence} small />
      {d.alternatives?.length ? <span className="text-xs text-muted">alt: {d.alternatives.map((a) => `${a.label} ${fmtYear(a.year)}`).join(' · ')}</span> : null}
    </span>
  );
}

/** A scripture reference. Hover or tap shows the KJV text (public domain). */
export function Ref({ r }: { r: string }) {
  const [open, setOpenRaw] = useState(false);
  const [right, setRight] = useState(false);
  const setOpen = (v: boolean | ((o: boolean) => boolean)) => setOpenRaw((o) => { const n = typeof v === 'function' ? v(o) : v; if (n && box.current) { const r = box.current.getBoundingClientRect(); setRight(r.left + 360 > window.innerWidth); } return n; });
  const [text, setText] = useState<{ c: number; v: number; text: string }[] | null>(null);
  const parsed = parseRef(r);
  const box = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open || text || !parsed) return;
    loadKJV().then((k) => setText(versesFor(k, parsed, 12)));
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const h = (e: PointerEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', h); return () => document.removeEventListener('pointerdown', h);
  }, [open]);
  if (!parsed) return <span className="chip text-bad" title="Unrecognised reference">{r}</span>;
  return (
    <span ref={box} className="relative inline-block" onPointerEnter={(e) => e.pointerType === 'mouse' && setOpen(true)} onPointerLeave={(e) => e.pointerType === 'mouse' && setOpen(false)}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="chip hover:border-accent font-serif !text-[.78rem]" aria-expanded={open}>
        <span className="rubric">✠</span>{r}
      </button>
      {open && (
        <span role="tooltip" className={`absolute z-50 ${right ? 'right-0' : 'left-0'} top-full mt-1 w-[min(22rem,80vw)] card shadow-xl p-3 text-left block`}>
          <span className="eyebrow block mb-1">{refLabel(r)} · KJV</span>
          {!text ? <span className="block skeleton h-12" /> : (
            <span className="block max-h-56 overflow-auto font-serif text-[.92rem] leading-relaxed">
              {text.map((v) => <span key={`${v.c}:${v.v}`}><sup className="rubric mr-0.5">{v.v}</sup>{v.text} </span>)}
            </span>
          )}
          <Link to={`/study?verse=${encodeURIComponent(r)}`} className="text-xs text-accent mt-2 inline-block">Open in verse panel →</Link>
        </span>
      )}
    </span>
  );
}
export function Refs({ refs, max }: { refs: string[]; max?: number }) {
  const [all, setAll] = useState(false);
  if (!refs?.length) return null;
  const shown = max && !all ? refs.slice(0, max) : refs;
  return (
    <span className="inline-flex flex-wrap gap-1 align-middle">
      {shown.map((r, i) => <Ref key={r + i} r={r} />)}
      {max && refs.length > max && !all && <button className="chip text-muted" onClick={() => setAll(true)}>+{refs.length - max}</button>}
    </span>
  );
}
export function PersonLink({ id, className }: { id: string; className?: string }) {
  const p = personById.get(id);
  if (!p) return <span className={className}>{personName(id)}</span>;
  return <Link to={`/people/${id}`} className={`underline decoration-line underline-offset-2 hover:decoration-accent hover:text-accent ${className ?? ''}`}>{p.names.primary}</Link>;
}
export function PlaceLink({ id }: { id: string }) {
  return <Link to={`/maps?place=${id}`} className="underline decoration-line underline-offset-2 hover:text-accent">{placeName(id)}</Link>;
}
export function SourceLine({ s }: { s: SourceT }) {
  return (
    <span className="text-sm">
      {s.author}, <i>{s.title}</i>{s.locator ? ` ${s.locator}` : ''}{s.year ? ` (${s.year < 0 ? `${-s.year} BC` : s.year})` : ''}
      {s.publicDomain && <span className="chip ml-1 !text-[.65rem]">public domain</span>}
      {s.confidence && s.confidence !== 'biblical' && <span className="ml-1"><Conf c={s.confidence} small /></span>}
    </span>
  );
}
export function Paras({ text, className }: { text?: string; className?: string }) {
  if (!text) return null;
  return <div className={`prose-serif ${className ?? ''}`}>{text.split(/\n\n+/).map((p, i) => <p key={i}>{p}</p>)}</div>;
}
export function PageHeader({ eyebrow, title, children, actions }: { eyebrow?: string; title: ReactNode; children?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
        <h1 className="text-4xl md:text-5xl leading-[1.05]">{title}</h1>
        {children && <div className="mt-3 text-muted max-w-[70ch] font-serif text-[1.05rem] leading-relaxed">{children}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
export function Section({ title, children, id, aside }: { title: ReactNode; children: ReactNode; id?: string; aside?: ReactNode }) {
  return (
    <section id={id} className="mt-10 first:mt-0">
      <div className="flex items-baseline justify-between gap-3 border-b border-line pb-1.5 mb-4">
        <h2 className="text-2xl rubric">{title}</h2>{aside}
      </div>
      {children}
    </section>
  );
}
export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; hidden?: boolean }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div role="tablist" className="tabs-scroll flex gap-1 border-b border-line scroll-x mb-5">
      {tabs.filter((t) => !t.hidden).map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} className="tab" onClick={() => onChange(t.id)}>{t.label}</button>
      ))}
    </div>
  );
}
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return <motion.div className={className} initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.025 } } }}>{children}</motion.div>;
}
export const item = { hidden: { opacity: 0.6, y: 6 }, show: { opacity: 1, y: 0 } };
export function Empty({ children }: { children: ReactNode }) {
  return <div className="card p-6 text-muted font-serif">{children}</div>;
}
export function SkeletonCards({ n = 6 }: { n?: number }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: n }, (_, i) => <div key={i} className="card p-4"><div className="skeleton h-5 w-1/2 mb-3" /><div className="skeleton h-3 mb-2" /><div className="skeleton h-3 w-4/5" /></div>)}</div>;
}
export function Bookmark({ path }: { path: string }) {
  const { bookmarks, toggleBookmark } = useUI();
  const on = bookmarks.includes(path);
  return <button className="btn" onClick={() => toggleBookmark(path)} aria-pressed={on}>{on ? '★ Saved' : '☆ Save'}</button>;
}
