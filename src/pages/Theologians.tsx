import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Fuse from 'fuse.js';
import { figures } from '../data';
import { PageHeader, SourceLine, Empty } from '../components/ui';
import { t, tv } from '../i18n';

export default function Theologians() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const fuse = useMemo(() => new Fuse(figures, { keys: ['name', 'profession', 'bio', 'roles.positionName', 'roles.debateTitle'], threshold: 0.3, ignoreLocation: true }), []);
  const cats = [...new Set(figures.flatMap((f) => f.roles.map((r) => r.category)))];
  let list = q ? fuse.search(q).map((r) => r.item) : figures;
  if (cat) list = list.filter((f) => f.roles.some((r) => r.category === cat));
  return (
    <div>
      <PageHeader eyebrow={t('People behind the views')} title={t('Theologians & Teachers')}>
        {t('Everyone who started, shaped or popularised a position in the debates and movements: when they lived, what they did for a living, their story, their key works, and which views they shaped.')}
      </PageHeader>
      <div className="card p-3 mb-5 grid gap-2 md:grid-cols-[2fr_1fr]">
        <input id="theo-q" className="input" placeholder={t('Search a name, profession or view (e.g. Calvin, pastor, annihilationism)…')} value={q} onChange={(e) => setQ(e.target.value)} />
        <select id="theo-cat" className="input" value={cat} onChange={(e) => setCat(e.target.value)} aria-label={t('Topic')}><option value="">{t('All topics')}</option>{cats.map((c) => <option key={c} value={c}>{tv(c)}</option>)}</select>
      </div>
      <div className="text-sm text-muted mb-3 tabular">{t('{n} people, ordered by when they lived', { n: list.length })}</div>
      {!list.length ? <Empty>{t('No one matches that search.')}</Empty> : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((f) => (
            <article key={f.name} className="card p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="display text-xl">{f.name}</h2><span className="text-sm text-muted tabular">{f.lived}</span></div>
              <div className="text-sm text-accent font-semibold mb-1.5">{f.profession}</div>
              <p className="font-serif text-[1.05rem] leading-snug">{f.bio}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">{f.roles.map((r, i) => <Link key={i} to={`/${r.category === 'movement' ? 'movements' : 'debates'}/${r.debateId}?pos=${r.positionId}`} className="chip hover:border-accent !whitespace-normal" title={r.debateTitle}><span className="text-muted">{tv(r.role)}:</span> {r.positionName}</Link>)}</div>
              {f.works.length > 0 && <details className="mt-2"><summary className="text-sm text-muted cursor-pointer">{t('Key works ({n})', { n: f.works.length })}</summary><ul className="mt-1 space-y-0.5">{f.works.map((w, i) => <li key={i}><SourceLine s={w} /></li>)}</ul></details>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
