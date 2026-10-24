import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { guides, guideById } from '../data';
import { PageHeader, Refs, Conf, SourceLine, fmtYear, Empty, Bookmark, Stagger, item } from '../components/ui';
import { t, tv } from '../i18n';

const CALLOUT: Record<string, { label: string; tone: string }> = {
  note: { label: t('Good to know'), tone: 'accent' }, debate: { label: t('Scholars disagree'), tone: 'warn' },
  tradition: { label: t('Church tradition'), tone: 'gold' }, myth: { label: t('Common misunderstanding'), tone: 'bad' },
};

export default function Guides() {
  const cats = [...new Set(guides.map((g) => g.category))];
  return (
    <div>
      <PageHeader eyebrow={t('Study guides')} title={t('Big questions, answered plainly')}>
        {t('In-depth guides to the questions people ask most: what gospel the apostles preached, how it changed, what the early church hoped for, and how the major camps differ. Each opens with the short answer, then takes you as deep as you want to go, with every claim referenced.')}
      </PageHeader>
      {!guides.length && <Empty>{t('The study guides are being written.')}</Empty>}
      {cats.map((c) => (
        <section key={c} className="mb-9">
          <h2 className="text-2xl mb-3">{tv(c)}</h2>
          <Stagger className="grid gap-3 md:grid-cols-2">
            {guides.filter((g) => g.category === c).map((g) => (
              <motion.div key={g.id} variants={item}>
                <Link to={`/guides/${g.id}`} className="card p-5 h-full flex flex-col gap-2 hover:border-accent group">
                  <span className="display text-xl leading-snug group-hover:text-accent">{g.title}</span>
                  <span className="font-serif text-[1.05rem] text-muted line-clamp-3">{g.plainAnswer}</span>
                  <span className="mt-auto pt-1 text-xs text-muted">{t('{n} sections', { n: g.sections.length })}{g.table ? ` · ${t('comparison table')}` : ''}{g.timeline?.length ? ` · ${t('timeline')}` : ''}</span>
                </Link>
              </motion.div>
            ))}
          </Stagger>
        </section>
      ))}
    </div>
  );
}

export function GuidePage() {
  const { id = '' } = useParams();
  const g = guideById.get(id);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const els = [...document.querySelectorAll('[data-guide-section]')];
    if (!els.length || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(+(e.target as HTMLElement).dataset.guideSection!)), { rootMargin: '-20% 0px -70% 0px' });
    els.forEach((e) => io.observe(e)); return () => io.disconnect();
  }, [id]);
  if (!g) return <Empty>{t('No guide “{id}”.', { id })} <Link className="text-accent" to="/guides">{t('See all guides')}</Link></Empty>;
  const idx = guides.indexOf(g);
  return (
    <div>
      <div className="text-sm mb-3"><Link to="/guides" className="text-muted hover:text-accent">← {t('Study guides')}</Link></div>
      <PageHeader eyebrow={tv(g.category)} title={g.title} actions={<Bookmark path={`/guides/${g.id}`} />}>{g.question}</PageHeader>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_250px]">
        <article className="min-w-0 space-y-8">
          <section className="card p-5 md:p-6 border-accent/40" style={{ background: 'linear-gradient(135deg, rgb(var(--accent) / .07), rgb(var(--surface)))' }}>
            <div className="eyebrow !text-accent mb-2">{t('The short answer')}</div>
            <p className="font-serif text-[1.3rem] leading-relaxed">{g.plainAnswer}</p>
            <div className="eyebrow mt-5 mb-2">{t('Key takeaways')}</div>
            <ul className="grid gap-2 md:grid-cols-2">
              {g.keyTakeaways.map((k, i) => <li key={i} className="flex gap-2.5 text-[.95rem]"><span className="mt-1.5 w-2 h-2 rounded-full bg-accent shrink-0" />{k}</li>)}
            </ul>
            <div className="mt-4 flex flex-wrap items-center gap-2"><span className="eyebrow">{t('Key verses')}</span><Refs refs={g.keyVerses} /></div>
          </section>

          {g.sections.map((s, i) => (
            <section key={i} id={`s${i}`} data-guide-section={i} className="scroll-mt-24">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="display text-accent text-lg tabular">{String(i + 1).padStart(2, '0')}</span>
                <h2 className="text-2xl leading-tight">{s.heading}</h2>
                {s.confidence && s.confidence !== 'biblical' && <Conf c={s.confidence} small />}
              </div>
              <div className="prose-serif !max-w-[72ch]">{s.body.split(/\n\n+/).map((p, j) => <p key={j}>{p}</p>)}</div>
              {s.callout && (
                <aside className="mt-4 rounded-2xl border p-4 max-w-[72ch]" style={{ borderColor: `rgb(var(--${CALLOUT[s.callout.kind].tone}) / .5)`, background: `rgb(var(--${CALLOUT[s.callout.kind].tone}) / .07)` }}>
                  <div className="eyebrow mb-1" style={{ color: `rgb(var(--${CALLOUT[s.callout.kind].tone}))` }}>{CALLOUT[s.callout.kind].label}</div>
                  <p className="text-[.95rem]">{s.callout.text}</p>
                </aside>
              )}
              {s.refs.length > 0 && <div className="mt-3"><Refs refs={s.refs} max={8} /></div>}
              {s.sources?.length ? <details className="mt-2"><summary className="text-sm text-muted cursor-pointer">{t('Sources ({n})', { n: s.sources.length })}</summary><ul className="mt-1 space-y-0.5">{s.sources.map((x, j) => <li key={j}><SourceLine s={x} /></li>)}</ul></details> : null}
            </section>
          ))}

          {g.table && (
            <section>
              <h2 className="text-2xl mb-3">{g.table.caption}</h2>
              <div className="scroll-x card">
                <table className="w-full min-w-[720px] text-sm">
                  <thead><tr>{g.table.columns.map((c) => <th key={c} className="text-left eyebrow px-3 py-2.5 border-b border-line bg-sunk/60 align-bottom">{c}</th>)}</tr></thead>
                  <tbody>{g.table.rows.map((r, i) => <tr key={i} className="align-top border-b border-line/60 last:border-0">{r.map((c, j) => <td key={j} className={`px-3 py-2.5 ${j === 0 ? 'font-semibold' : 'font-serif text-[1.02rem] leading-snug'}`}>{c}</td>)}</tr>)}</tbody>
                </table>
              </div>
            </section>
          )}

          {g.views?.length ? (
            <section><h2 className="text-2xl mb-3">{t('The main views')}</h2>
              <div className="grid gap-3 md:grid-cols-2">{g.views.map((v) => <div key={v.name} className="card p-4"><div className="display text-lg mb-1">{v.name}</div><p className="font-serif text-[1.05rem]">{v.summary}</p></div>)}</div>
            </section>
          ) : null}

          {g.timeline?.length ? (
            <section><h2 className="text-2xl mb-3">{t('Timeline')}</h2>
              <ol className="relative border-l-2 border-line ml-2 space-y-4">
                {[...g.timeline].sort((a, b) => a.year - b.year).map((t, i) => (
                  <li key={i} className="ml-5"><span className="absolute -left-[7px] w-3 h-3 rounded-full bg-accent mt-1.5" />
                    <div className="tabular text-sm text-muted">{fmtYear(t.year)} {t.confidence !== 'biblical' && <Conf c={t.confidence} small />}</div>
                    <div className="font-semibold">{t.title}</div><p className="font-serif text-[1.02rem]">{t.note}</p></li>
                ))}
              </ol>
            </section>
          ) : null}

          <section className="grid gap-4 md:grid-cols-2">
            {g.furtherQuestions.length > 0 && <div className="card p-4"><div className="eyebrow mb-2">{t('Questions to keep exploring')}</div><ul className="space-y-1.5">{g.furtherQuestions.map((q) => <li key={q} className="font-serif text-[1.05rem]">{q} <Link className="text-xs text-accent whitespace-nowrap" to={`/study?ask=${encodeURIComponent(q)}`}>{t('Ask →')}</Link></li>)}</ul></div>}
            {g.related.length > 0 && <div className="card p-4"><div className="eyebrow mb-2">{t('Go deeper in the atlas')}</div><div className="flex flex-wrap gap-1.5">{g.related.map((r) => <Link key={r} to={r} className="chip hover:border-accent">{r.replace(/^\//, '').replace(/[?=]/g, ' ').replace(/[-/]/g, ' ')}</Link>)}</div></div>}
          </section>
          <nav className="flex justify-between gap-3 text-sm">
            {guides[idx - 1] ? <Link className="btn" to={`/guides/${guides[idx - 1].id}`}>← {guides[idx - 1].title}</Link> : <span />}
            {guides[idx + 1] && <Link className="btn" to={`/guides/${guides[idx + 1].id}`}>{guides[idx + 1].title} →</Link>}
          </nav>
        </article>
        <aside className="hidden xl:block">
          <nav className="sticky top-6 card p-4 max-h-[85vh] overflow-y-auto" aria-label={t('In this guide')}>
            <div className="eyebrow mb-2">{t('In this guide')}</div>
            <ol className="space-y-1 text-sm">{g.sections.map((s, i) => <li key={i}><a href={`#s${i}`} onClick={(e) => { e.preventDefault(); document.getElementById(`s${i}`)?.scrollIntoView({ behavior: 'smooth' }); }} className={`block py-0.5 ${active === i ? 'text-accent font-semibold' : 'text-muted hover:text-ink'}`}>{s.heading}</a></li>)}</ol>
          </nav>
        </aside>
      </div>
    </div>
  );
}
