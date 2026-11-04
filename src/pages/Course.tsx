/** The course "The Bible: How We Got It and How to Read It": a course map with progress, and one page per lesson. */
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { courseUnits, courseLessons } from '../data';
import { PageHeader, Section, Refs, Paras, Empty, Bookmark, Rich, SourceLine } from '../components/ui';
import { Misreadings } from '../components/StudyViz';
import { VisualView } from '../components/Visuals';
import { useUI } from '../store';
import { t } from '../i18n';

const color = (c: string, a = 1) => `rgb(var(--${c}) / ${a})`;
const UNIT_COLORS = ['ot', 'accent', 'nt', 'accent-2', 'good'];

export function CourseMap() {
  const done = useUI((s) => s.courseDone);
  const total = courseLessons.length; const n = courseLessons.filter((l) => done.includes(l.id)).length;
  const next = courseLessons.find((l) => !done.includes(l.id)) ?? courseLessons[0];
  if (!total) return <Empty>{t('The course is being written.')}</Empty>;
  return (
    <div>
      <PageHeader eyebrow={t('A course in {n} lessons', { n: total })} title={t('The Bible: How We Got It and How to Read It')}>
        {t('Start at the beginning and go in order: where the Bible came from, what kind of word it is, how to read it well, how Jesus is the lens, and how reading shapes living. Each lesson has interactive diagrams, games, discussion questions and practice.')}
      </PageHeader>
      <div className="card p-4 mb-6 flex flex-wrap items-center gap-4">
        <div className="relative w-16 h-16 shrink-0"><svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90"><circle cx="18" cy="18" r="15.9" fill="none" stroke="rgb(var(--border))" strokeWidth="3.5" /><motion.circle cx="18" cy="18" r="15.9" fill="none" stroke="rgb(var(--accent))" strokeWidth="3.5" strokeLinecap="round" initial={{ strokeDasharray: '0 100' }} animate={{ strokeDasharray: `${(n / total) * 100} 100` }} /></svg><span className="absolute inset-0 flex items-center justify-center font-bold tabular">{Math.round((n / total) * 100)}%</span></div>
        <div className="flex-1 min-w-0"><div className="font-semibold">{t('{n} of {total} lessons completed', { n, total })}</div><div className="text-sm text-muted">{t('Your progress is saved on this device.')}</div></div>
        {next && <Link to={`/course/${next.id}`} className="btn btn-primary">{n ? t('Continue') : t('Start the course')}: {next.n}. {next.title} →</Link>}
      </div>
      <div className="space-y-8">{courseUnits.map((u, ui) => { const c = UNIT_COLORS[ui % UNIT_COLORS.length]; return (
        <section key={u.id}>
          <div className="flex items-baseline gap-3 mb-1"><span className="display text-4xl tabular" style={{ color: color(c) }}>{ui + 1}</span><h2 className="display text-2xl">{u.unit.title}</h2></div>
          <p className="font-serif text-muted max-w-[72ch] mb-3">{u.unit.summary}</p>
          <ol className="relative grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{u.lessons.map((l, i) => { const ok = done.includes(l.id); return (
            <motion.li key={l.id} initial={{ opacity: 0.5, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <Link to={`/course/${l.id}`} className="card p-4 flex gap-3 h-full hover:border-accent relative overflow-hidden">
                <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: color(c) }} />
                <span className="w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 border-2" style={ok ? { background: color(c), borderColor: color(c), color: 'rgb(var(--accent-ink))' } : { borderColor: color(c, 0.6), color: color(c) }}>{ok ? '✓' : l.n}</span>
                <span className="min-w-0"><span className="font-semibold leading-tight block">{l.title}</span><span className="text-sm text-muted font-serif block mt-0.5 line-clamp-2">{l.question}</span><span className="text-xs text-muted mt-1 block">{t('{m} min', { m: l.minutes })} · {t('{v} interactive visuals', { v: l.visuals.length })}</span></span>
              </Link>
            </motion.li>); })}</ol>
        </section>); })}</div>
    </div>
  );
}

export function LessonPage() {
  const { id = '' } = useParams();
  const i = courseLessons.findIndex((l) => l.id === id); const l = courseLessons[i];
  const done = useUI((s) => s.courseDone); const set = useUI((s) => s.set);
  if (!l) return <Empty>{t('No lesson with this id.')} <Link to="/course" className="text-accent">{t('Back to the course')}</Link></Empty>;
  const unit = courseUnits.find((u) => u.lessons.some((x) => x.id === id));
  const ok = done.includes(l.id);
  const toggle = () => set({ courseDone: ok ? done.filter((x) => x !== l.id) : [...done, l.id] });
  const prev = courseLessons[i - 1], next = courseLessons[i + 1];
  return (
    <div>
      <div className="text-sm mb-3 flex flex-wrap justify-between gap-2"><Link to="/course" className="text-muted hover:text-accent">← {t('Course map')}</Link><span className="text-muted">{unit?.unit.title} · {t('Lesson {n} of {total}', { n: l.n, total: courseLessons.length })}</span></div>
      <div className="h-1.5 rounded-full bg-sunk overflow-hidden mb-5"><div className="h-full bg-accent" style={{ width: `${(l.n / courseLessons.length) * 100}%` }} /></div>
      <PageHeader eyebrow={t('Lesson {n}', { n: l.n })} title={l.title} actions={<Bookmark path={`/course/${l.id}`} />}><span className="text-ink">{l.question}</span></PageHeader>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-5 mb-6 border-2" style={{ borderColor: color('accent', 0.6), background: color('accent', 0.05) }}>
        <div className="eyebrow mb-1">{t('The big idea')}</div><p className="display text-xl md:text-2xl leading-snug"><Rich text={l.bigIdea} /></p>
        <div className="mt-3"><Refs refs={l.keyVerses} max={8} /></div>
      </motion.div>

      <div className="space-y-8">
        {l.sections.map((s, k) => (
          <section key={k}>
            <h2 className="display text-2xl rubric mb-2">{s.heading}</h2><Paras text={s.body} /><div className="mt-2"><Refs refs={s.refs} max={6} /></div>
            {l.visuals[k] && <div className="mt-5"><VisualView v={l.visuals[k]} /></div>}
          </section>))}
        {l.visuals.slice(l.sections.length).map((v, k) => <VisualView key={`x${k}`} v={v} />)}
      </div>

      {l.voices.length > 0 && <Section title={t('Voices')}><div className="grid gap-3 md:grid-cols-2">{l.voices.map((q, k) => (
        <figure key={k} className="card p-5 relative"><span className="absolute -top-2 left-4 display text-5xl text-accent leading-none">“</span><blockquote className="font-serif text-[1.08rem] italic mt-2"><Rich text={q.text} /></blockquote><figcaption className="text-sm text-muted mt-2">— {q.who}{q.source ? `, ${q.source}` : ''}</figcaption></figure>))}</div></Section>}

      {l.views.length > 0 && <Section title={t('Views')}><div className="grid gap-3 md:grid-cols-2">{l.views.map((p) => (
        <div key={p.name} className="card p-4"><div className="display text-xl">{p.name}</div><div className="text-sm text-muted">{p.who}</div><p className="font-serif mt-2"><Rich text={p.summary} /></p>
          <div className="grid gap-2 sm:grid-cols-2 mt-3 text-sm"><div className="rounded-lg p-2.5" style={{ background: color('good', 0.1) }}><b>{t('Strengths.')}</b> <Rich text={p.strengths} /></div><div className="rounded-lg p-2.5" style={{ background: color('warn', 0.1) }}><b>{t('Critiques.')}</b> <Rich text={p.critiques} /></div></div></div>))}</div></Section>}

      {l.misreadings.length > 0 && <Section title={t('Common misreadings')}><Misreadings list={l.misreadings} /></Section>}

      <div className="grid gap-3 md:grid-cols-2 mt-10">
        <div className="card p-5"><div className="eyebrow mb-2">{t('Discuss together')}</div><ol className="space-y-2 list-decimal pl-5 font-serif">{l.discuss.map((q, k) => <li key={k}><Rich text={q} /></li>)}</ol></div>
        <div className="card p-5"><div className="eyebrow mb-2">{t('Try this week')}</div><ul className="space-y-2 font-serif">{l.practice.map((q, k) => <li key={k} className="flex gap-2"><span className="text-accent">✦</span><span><Rich text={q} /></span></li>)}</ul></div>
      </div>

      {l.links.length > 0 && <Section title={t('Go deeper in the atlas')}><div className="flex flex-wrap gap-2">{l.links.map((k) => <Link key={k.to + k.label} to={k.to} className="btn">{k.label} →</Link>)}</div></Section>}
      {l.sources.length > 0 && <Section title={t('Further reading')}><ul className="text-sm space-y-1">{l.sources.map((s, k) => <li key={k}><SourceLine s={s} /></li>)}</ul></Section>}

      <div className="card p-4 mt-10 flex flex-wrap items-center justify-between gap-3">
        {prev ? <Link to={`/course/${prev.id}`} className="btn">← {prev.n}. {prev.title}</Link> : <span />}
        <button onClick={toggle} className={`btn ${ok ? '' : 'btn-primary'}`}>{ok ? `✓ ${t('Completed')}` : t('Mark lesson complete')}</button>
        {next ? <Link to={`/course/${next.id}`} onClick={() => !ok && set({ courseDone: [...done, l.id] })} className="btn btn-primary">{next.n}. {next.title} →</Link> : <Link to="/course" className="btn">{t('Back to the course')}</Link>}
      </div>
    </div>
  );
}
