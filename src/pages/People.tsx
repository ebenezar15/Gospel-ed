import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Fuse from 'fuse.js';
import { people, eras, lifespan } from '../data';
import { PageHeader, Stagger, item, fmtYear, Empty } from '../components/ui';
import { useUI } from '../store';
import { t, tv } from '../i18n';

const ROLE_GROUPS: string[] = ['prophet', 'king', 'queen', 'judge', 'priest', 'apostle', 'disciple', 'patriarch', 'matriarch', 'evangelist', 'missionary', 'ruler', 'warrior', 'scribe', 'teacher'];

export default function People() {
  const [sp, setSp] = useSearchParams();
  const eraFilter = useUI((s) => s.eraFilter);
  const [q, setQ] = useState(sp.get('q') ?? '');
  const testament = sp.get('t') ?? '';
  const role = sp.get('role') ?? '';
  const tier = sp.get('tier') ?? '';
  const sort = sp.get('sort') ?? 'chron';
  const setParam = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); setSp(n, { replace: true }); };
  const fuse = useMemo(() => new Fuse(people, { keys: ['names.primary', 'names.aliases', 'roles', 'occupations', 'summary'], threshold: 0.3, ignoreLocation: true }), []);
  const list = useMemo(() => {
    let l = q ? fuse.search(q).map((r) => r.item) : [...people];
    if (testament) l = l.filter((p) => p.testament === testament || p.testament === 'both');
    if (role) l = l.filter((p) => p.roles.some((r) => r.toLowerCase().includes(role)));
    if (tier) l = l.filter((p) => p.tier === tier);
    if (eraFilter) l = l.filter((p) => p.eraIds.includes(eraFilter));
    if (!q) {
      if (sort === 'name') l.sort((a, b) => a.names.primary.localeCompare(b.names.primary));
      else l.sort((a, b) => (lifespan(a)?.[0] ?? eras.find((e) => e.id === a.eraIds[0])?.start ?? 0) - (lifespan(b)?.[0] ?? eras.find((e) => e.id === b.eraIds[0])?.start ?? 0));
    }
    return l;
  }, [q, testament, role, tier, sort, eraFilter, fuse]);

  return (
    <div>
      <PageHeader eyebrow={t('Character atlas')} title={t('People of the Bible')}>
        {t('Patriarchs, prophets, kings, apostles, outsiders and enemies. Every profile separates what the text says from how traditions read it, and labels each date by how sure we can be.')}
      </PageHeader>
      <div className="card p-3 mb-5 grid gap-2 md:grid-cols-[2fr_repeat(4,1fr)]">
        <input id="people-q" className="input" placeholder={t('Search names, aliases, roles…')} value={q} onChange={(e) => setQ(e.target.value)} />
        <select id="people-t" className="input" value={testament} onChange={(e) => setParam('t', e.target.value)} aria-label={t('Testament')}><option value="">{t('Both testaments')}</option><option value="OT">{t('Old Testament')}</option><option value="NT">{t('New Testament')}</option></select>
        <select id="people-role" className="input" value={role} onChange={(e) => setParam('role', e.target.value)} aria-label={t('Role')}><option value="">{t('Any role')}</option>{ROLE_GROUPS.map((r) => <option key={r} value={r}>{t(r[0].toUpperCase() + r.slice(1))}</option>)}</select>
        <select id="people-tier" className="input" value={tier} onChange={(e) => setParam('tier', e.target.value)} aria-label={t('Profile depth')}><option value="">{t('All profiles')}</option><option value="major">{t('Major')}</option><option value="secondary">{t('Secondary')}</option><option value="minor">{t('Minor')}</option></select>
        <select id="people-sort" className="input" value={sort} onChange={(e) => setParam('sort', e.target.value)} aria-label={t('Sort')}><option value="chron">{t('Chronological')}</option><option value="name">{t('A–Z')}</option></select>
      </div>
      <div className="text-sm text-muted mb-3 tabular">{eraFilter ? t(list.length === 1 ? '{n} person in {era}' : '{n} people in {era}', { n: list.length, era: eras.find((e) => e.id === eraFilter)?.name ?? '' }) : t(list.length === 1 ? '{n} person' : '{n} people', { n: list.length })}</div>
      {!list.length ? <Empty>{t('No one matches those filters. Clear the search or the era filter in the sidebar.')}</Empty> : (
        <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => {
            const l = lifespan(p);
            return (
              <motion.div key={p.id} variants={item}>
                <Link to={`/people/${p.id}`} className="card p-4 h-full flex flex-col gap-1.5 hover:border-accent transition-colors group relative overflow-hidden">
                  <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: `rgb(var(--${p.testament === 'NT' ? 'nt' : 'ot'}))` }} aria-hidden />
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="display text-xl group-hover:text-accent">{p.names.primary}</span>
                    {p.names.original && <span className="font-orig text-muted text-sm" dir="auto">{p.names.original}</span>}
                  </div>
                  <div className="text-xs text-muted">{[p.roles.slice(0, 3).join(' · '), l ? `${fmtYear(l[0])} – ${fmtYear(l[1])}` : null].filter(Boolean).join('  ·  ')}</div>
                  <p className="text-sm font-serif leading-snug line-clamp-3">{p.summary.split('\n')[0]}</p>
                  <div className="mt-auto pt-1 flex gap-1.5"><span className="chip !text-[.65rem]">{tv(p.tier)}</span>{p.names.meaning && <span className="chip !text-[.65rem] !block truncate min-w-0">“{p.names.meaning}”</span>}</div>
                </Link>
              </motion.div>
            );
          })}
        </Stagger>
      )}
    </div>
  );
}
