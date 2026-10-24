import { useState } from 'react';
import { Link } from 'react-router-dom';
import { afterlifeTerms, afterlifeViews, eschatology, debateById } from '../data';
import { PageHeader, Section, Refs, Conf, SourceLine, Tabs, Empty } from '../components/ui';
import Sequence from '../components/Sequence';
import { t } from '../i18n';

export default function Afterlife() {
  const [tab, setTab] = useState<'terms' | 'early' | 'end'>('terms');
  const [term, setTerm] = useState(afterlifeTerms[0]?.id);
  const cur = afterlifeTerms.find((x) => x.id === term);
  const mill = debateById.get('millennium');
  return (
    <div>
      <PageHeader eyebrow={t('Afterlife, kingdom and eschatology')} title={t('Death, resurrection and the age to come')}>
        {t('The Bible’s vocabulary for the dead and the future, the range of early Christian views, and how the end-times schemes differ step by step.')}
      </PageHeader>
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'terms', label: t('Biblical vocabulary') }, { id: 'early', label: t('Early church views') }, { id: 'end', label: t('End-times sequences') }]} />
      {tab === 'terms' && (afterlifeTerms.length ? (
        <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <nav className="flex lg:flex-col gap-1 scroll-x">{afterlifeTerms.map((x) => <button key={x.id} id={x.id} onClick={() => setTerm(x.id)} className={`text-left px-3 py-1.5 rounded shrink-0 ${x.id === term ? 'bg-sunk font-semibold' : 'hover:bg-sunk'}`}>{x.term}</button>)}</nav>
          {cur && (
            <article className="min-w-0">
              <h2 className="display text-5xl">{cur.term}</h2>
              <div className="font-orig text-2xl text-muted mb-3" dir="auto">{cur.original}</div>
              <p className="prose-serif text-lg">{cur.meaning}</p>
              <Section title={t('Where it appears')}><p className="prose-serif">{cur.usage}</p><div className="mt-2"><Refs refs={cur.refs} /></div></Section>
              <Section title={t('How it is read')}><div className="grid gap-3 md:grid-cols-2">{cur.readings.map((r) => <div key={r.view} className="card p-3"><div className="eyebrow mb-1">{r.view}</div><p className="font-serif text-[.95rem]">{r.text}</p></div>)}</div></Section>
            </article>
          )}
        </div>
      ) : <Empty>{t('The glossary is still being written.')}</Empty>)}
      {tab === 'early' && (
        <ol className="relative border-l-2 border-line ml-2 space-y-5">
          {afterlifeViews.map((v) => (
            <li key={v.id} className="ml-5">
              <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-accent2 mt-2" />
              <div className="card p-4">
                <div className="flex flex-wrap items-baseline gap-2"><h3 className="display text-2xl">{v.title}</h3><Conf c={v.confidence} small /></div>
                <div className="text-sm text-muted mb-2">{v.figures.join(' · ')}</div>
                <p className="font-serif">{v.summary}</p>
                <details className="mt-2"><summary className="cursor-pointer text-sm text-accent">{t('History and sources')}</summary><p className="font-serif mt-2">{v.history}</p><ul className="mt-2 space-y-0.5 text-sm">{v.sources.map((s, i) => <li key={i}><SourceLine s={s} /></li>)}</ul></details>
                <div className="mt-2"><Refs refs={v.refs} max={5} /></div>
              </div>
            </li>
          ))}
        </ol>
      )}
      {tab === 'end' && (
        <div className="space-y-8">
          {eschatology.length ? eschatology.map((d) => (
            <Section key={d.id} title={d.title} aside={<Link to={`/debates/${d.id}`} className="text-sm text-accent">{t('Full debate →')}</Link>}>
              <p className="font-serif text-muted mb-3">{d.question}</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{d.positions.filter((p) => p.sequence?.length).map((p) => <Sequence key={p.id} steps={p.sequence!} color={p.color} title={p.name} />)}</div>
            </Section>
          )) : <Empty>{t('The end-times comparisons are still being written.')}</Empty>}
          {mill && null}
        </div>
      )}
    </div>
  );
}
