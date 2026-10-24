import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { rosters } from '../data';
import { PageHeader, Refs, fmtYear, Empty } from '../components/ui';
import type { RosterT } from '../schemas';
import { t } from '../i18n';

const VERDICT: Record<string, string> = { good: 'good', mixed: 'warn', evil: 'bad', 'n/a': 'muted' };

function RosterTimeline({ r }: { r: RosterT }) {
  const dated = r.entries.filter((e) => e.start !== undefined);
  if (dated.length < 2) return <Empty>{t('This roster has too few dated entries for a timeline.')}</Empty>;
  const a = Math.min(...dated.map((e) => e.start!)), b = Math.max(...dated.map((e) => e.end ?? e.start!));
  const x = (y: number) => ((y - a) / (b - a || 1)) * 100;
  return (
    <div className="space-y-1">
      {dated.sort((p, q) => p.start! - q.start!).map((e) => (
        <div key={e.name + e.start} className="grid grid-cols-[9rem_1fr] gap-2 items-center text-sm">
          <span className="truncate">{e.personId ? <Link className="hover:text-accent" to={`/people/${e.personId}`}>{e.name}</Link> : e.name}</span>
          <div className="relative h-4 bg-sunk rounded"><div className="absolute top-0 bottom-0 rounded" style={{ left: `${x(e.start!)}%`, width: `${Math.max(0.8, x(e.end ?? e.start!) - x(e.start!))}%`, background: `rgb(var(--${VERDICT[e.verdict ?? 'n/a']}))` }} title={`${fmtYear(e.start!)}–${fmtYear(e.end ?? e.start!)}`} /></div>
        </div>
      ))}
      <div className="grid grid-cols-[9rem_1fr] text-xs text-muted tabular"><span /><span className="flex justify-between"><span>{fmtYear(a)}</span><span>{fmtYear(b)}</span></span></div>
    </div>
  );
}

export default function Rosters() {
  const [sp, setSp] = useSearchParams();
  const id = sp.get('r') ?? rosters[0]?.id;
  const r = rosters.find((x) => x.id === id);
  const [view, setView] = useState<'table' | 'timeline'>('table');
  const groups = useMemo(() => (r ? [...new Set(r.entries.map((e) => e.group ?? ''))] : []), [r]);
  return (
    <div>
      <PageHeader eyebrow={t('Complete lists')} title={t('Rosters')}>{t('Prophets, apostles, judges, kings of Israel and Judah with the text’s verdict on each, priests, rulers, the women of the Bible, authors and named angels.')}</PageHeader>
      <div className="flex flex-wrap gap-1.5 mb-5">{rosters.map((x) => <button key={x.id} className={`btn !py-1 ${x.id === id ? 'btn-primary' : ''}`} onClick={() => setSp({ r: x.id }, { replace: true })}>{x.title}</button>)}</div>
      {!r ? <Empty>{t('Rosters are still being compiled.')}</Empty> : (
        <div>
          <div className="flex flex-wrap justify-between gap-3 items-end mb-3">
            <p className="font-serif max-w-[70ch]">{r.intro}</p>
            <div className="flex gap-1"><button className={`btn !py-1 ${view === 'table' ? 'btn-primary' : ''}`} onClick={() => setView('table')}>{t('Table')}</button><button className={`btn !py-1 ${view === 'timeline' ? 'btn-primary' : ''}`} onClick={() => setView('timeline')}>{t('Timeline')}</button></div>
          </div>
          {r.entries.some((e) => e.verdict && e.verdict !== 'n/a') && <div className="flex gap-3 text-xs mb-3">{['good', 'mixed', 'evil'].map((v) => <span key={v} className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: `rgb(var(--${VERDICT[v]}))` }} />{v === 'good' ? t('Did right') : v === 'evil' ? t('Did evil') : t('Mixed')}</span>)}</div>}
          {view === 'timeline' ? <RosterTimeline r={r} /> : groups.map((g) => (
            <div key={g} className="mb-6">
              {g && <h3 className="display text-2xl rubric mb-2">{g}</h3>}
              <div className="scroll-x"><table className="w-full min-w-[560px] text-sm">
                <thead><tr className="text-left border-b border-line"><th className="eyebrow py-2 pr-3">{t('Name')}</th><th className="eyebrow py-2 pr-3 w-32">{t('Dates')}</th><th className="eyebrow py-2 pr-3">{t('Notes')}</th><th className="eyebrow py-2">{t('References')}</th></tr></thead>
                <tbody>{r.entries.filter((e) => (e.group ?? '') === g).map((e, i) => (
                  <tr key={e.name + i} className="border-b border-line/60 align-top">
                    <td className="py-2 pr-3 font-medium whitespace-nowrap">{e.verdict && e.verdict !== 'n/a' && <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: `rgb(var(--${VERDICT[e.verdict]}))` }} />}{e.personId ? <Link className="hover:text-accent underline decoration-line" to={`/people/${e.personId}`}>{e.name}</Link> : e.name}</td>
                    <td className="py-2 pr-3 tabular text-muted whitespace-nowrap">{e.start !== undefined ? `${fmtYear(e.start)}${e.end !== undefined && e.end !== e.start ? `–${fmtYear(e.end)}` : ''}` : '—'}</td>
                    <td className="py-2 pr-3 font-serif">{e.note}</td>
                    <td className="py-2"><Refs refs={e.refs} max={2} /></td>
                  </tr>))}</tbody>
              </table></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
