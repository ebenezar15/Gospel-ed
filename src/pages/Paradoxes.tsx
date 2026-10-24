import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { paradoxes, guideById } from '../data';
import { PageHeader, Refs, Empty } from '../components/ui';
import type { ParadoxT } from '../schemas';
import { t, tv } from '../i18n';

/** A balance: each pole sits in a pan; choosing a resolution tilts the beam toward the side it emphasises. */
function Scale({ p, leans }: { p: ParadoxT; leans: 'A' | 'B' | 'both' | null }) {
  const angle = leans === 'A' ? -9 : leans === 'B' ? 9 : 0;
  const pan = (side: 'A' | 'B') => {
    const pole = side === 'A' ? p.poleA : p.poleB;
    const on = leans === side || leans === 'both' || leans === null;
    return (
      <motion.div className="w-[46%] -mt-1" animate={{ y: side === 'A' ? -angle * 2.4 : angle * 2.4 }} transition={{ type: 'spring', stiffness: 80, damping: 12 }}>
        <div className="mx-auto w-px h-8 bg-gold" />
        <div className={`card p-3 md:p-4 text-center transition-opacity ${on ? '' : 'opacity-60'}`} style={{ borderColor: `rgb(var(--${side === 'A' ? 'accent' : 'accent-2'}) / .6)`, borderRadius: '0 0 1.5rem 1.5rem' }}>
          <div className="eyebrow mb-1" style={{ color: `rgb(var(--${side === 'A' ? 'accent' : 'accent-2'}))` }}>{pole.label}</div>
          <p className="font-serif text-[1.08rem] leading-snug">{pole.statement}</p>
          <div className="mt-2 flex justify-center"><Refs refs={pole.refs} max={3} /></div>
        </div>
      </motion.div>
    );
  };
  return (
    <div className="relative pt-6">
      <div className="absolute left-1/2 -translate-x-1/2 top-0 w-4 h-4 rounded-full bg-gold" />
      <motion.div className="h-1.5 rounded-full bg-gold mx-[8%]" animate={{ rotate: angle }} transition={{ type: 'spring', stiffness: 80, damping: 12 }} />
      <div className="flex justify-between">{pan('A')}{pan('B')}</div>
    </div>
  );
}

export default function Paradoxes() {
  const [sp, setSp] = useSearchParams();
  const p = paradoxes.find((x) => x.id === sp.get('p')) ?? paradoxes[0];
  const [res, setRes] = useState<number | null>(null);
  const [showSkeptic, setShowSkeptic] = useState(false);
  const cats = [...new Set(paradoxes.map((x) => x.category))];
  const pick = (id: string) => { setSp({ p: id }, { replace: true }); setRes(null); setShowSkeptic(false); };
  const guide = guideById.get('living-with-scriptural-paradox');
  if (!p) return <div><PageHeader eyebrow={t('Truths in tension')} title={t('Scriptural Paradoxes')} /><Empty>{t('The paradoxes are being written.')}</Empty></div>;
  const r = res !== null ? p.resolutions[res] : null;
  return (
    <div>
      <PageHeader eyebrow={t('Truths in tension')} title={t('Scriptural Paradoxes')}>
        {t('Places where the Bible holds two things together that seem to pull apart. Put both on the scale, then try each way Christians have resolved the tension and watch which side it leans toward.')}
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <nav className="lg:max-h-[80vh] lg:overflow-y-auto lg:sticky lg:top-4 space-y-3">
          {guide && <Link to={`/guides/${guide.id}`} className="card p-3 block hover:border-accent text-sm"><span className="eyebrow block">{t('Guide')}</span>{guide.title} →</Link>}
          <select id="paradox-pick" className="input lg:hidden" value={p.id} onChange={(e) => pick(e.target.value)} aria-label={t('Choose a paradox')}>{paradoxes.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</select>
          <div className="hidden lg:block space-y-3">{cats.map((c) => <div key={c}><div className="eyebrow mb-1">{tv(c)}</div>{paradoxes.filter((x) => x.category === c).map((x) => <button key={x.id} onClick={() => pick(x.id)} className={`block w-full text-left px-3 py-1.5 rounded-full text-sm ${x.id === p.id ? 'bg-accent/10 text-accent font-semibold' : 'hover:bg-sunk'}`}>{x.title}</button>)}</div>)}</div>
        </nav>
        <article className="min-w-0">
          <div className="eyebrow">{tv(p.category)}</div>
          <h2 className="text-3xl md:text-4xl mb-2">{p.title}</h2>
          <p className="font-serif text-[1.25rem] leading-relaxed max-w-[70ch]">{p.plain}</p>
          <div className="my-6"><Scale p={p} leans={r ? r.leans : null} /></div>
          <div className="card p-4 mb-5"><div className="eyebrow mb-1">{t('Where the tension lies')}</div><p className="font-serif text-[1.08rem]">{p.tension}</p></div>
          <div className="eyebrow mb-2">{t('Try a resolution')}</div>
          <div className="flex flex-wrap gap-2 mb-4">
            {p.resolutions.map((x, i) => <button key={i} onClick={() => setRes(res === i ? null : i)} className={`btn ${res === i ? 'btn-primary' : ''}`}>{x.name}</button>)}
          </div>
          {r && (
            <motion.div key={res} className="card p-5 mb-5" initial={{ opacity: 0.5, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-wrap justify-between gap-2"><div className="display text-xl">{r.name}</div><span className="chip">{r.leans === 'both' ? t('Holds both equally') : t('Leans toward: {pole}', { pole: r.leans === 'A' ? p.poleA.label : p.poleB.label })}</span></div>
              <div className="text-sm text-muted mb-2">{t('Held by {who}', { who: r.heldBy })}</div>
              <p className="font-serif text-[1.1rem] leading-relaxed">{r.explanation}</p>
              <div className="mt-2"><Refs refs={r.refs} /></div>
            </motion.div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="card p-4"><div className="eyebrow mb-1 !text-accent">{t('The heart of it')}</div><p className="font-semibold">{p.takeaway}</p><div className="eyebrow mt-3 mb-1">{t('For everyday life')}</div><p className="font-serif text-[1.05rem]">{p.practical}</p></div>
            <div className="card p-4">
              <div className="eyebrow mb-1" style={{ color: 'rgb(var(--bad))' }}>{t('“Isn’t that a contradiction?”')}</div>
              <p className="font-serif text-[1.05rem]">{p.skeptic.objection}</p>
              {showSkeptic ? <><div className="eyebrow mt-3 mb-1" style={{ color: 'rgb(var(--good))' }}>{t('A reply')}</div><p className="font-serif text-[1.05rem]">{p.skeptic.reply}</p></> : <button className="btn mt-3" onClick={() => setShowSkeptic(true)}>{t('Show a reply')}</button>}
            </div>
          </div>
          {p.related.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5 items-center"><span className="eyebrow mr-1">{t('Go deeper')}</span>{p.related.filter((x) => x.startsWith('/')).map((x) => <Link key={x} to={x} className="chip hover:border-accent">{x.split('/').pop()!.replace(/-/g, ' ')}</Link>)}</div>}
          <div className="flex justify-between mt-6">
            {paradoxes[paradoxes.indexOf(p) - 1] ? <button className="btn" onClick={() => pick(paradoxes[paradoxes.indexOf(p) - 1].id)}>{t('← Previous')}</button> : <span />}
            {paradoxes[paradoxes.indexOf(p) + 1] && <button className="btn btn-primary" onClick={() => pick(paradoxes[paradoxes.indexOf(p) + 1].id)}>{t('Next paradox →')}</button>}
          </div>
        </article>
      </div>
    </div>
  );
}
