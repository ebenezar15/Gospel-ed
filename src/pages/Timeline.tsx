import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { scaleLinear } from 'd3-scale';
import { zoom as d3zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';
import { select } from 'd3-selection';
import { timeline, eras, empires, eraById } from '../data';
import { PageHeader, Refs, Conf, fmtYear, PersonLink, PlaceLink, DateWithConf } from '../components/ui';
import { useUI } from '../store';
import type { TimelineEventT } from '../schemas';
import { t } from '../i18n';

const TRACKS: { id: TimelineEventT['track']; label: string }[] = [
  { id: 'world', label: t('World') }, { id: 'empires', label: t('Empires') }, { id: 'israel', label: t('Israel') }, { id: 'judah', label: t('Judah') }, { id: 'prophets', label: t('Prophets') }, { id: 'church', label: t('Church') },
];
const W = 1200, TOP = 52, ROW = 58;

export default function Timeline() {
  const [sp, setSp] = useSearchParams();
  const { chronology, eraFilter, set } = useUI();
  const svg = useRef<SVGSVGElement>(null);
  const zr = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [k, setK] = useState({ k: 1, x: 0 });
  const [sel, setSel] = useState<TimelineEventT | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);
  const H = TOP + TRACKS.length * ROW + 30;
  const base = useMemo(() => scaleLinear().domain([-2300, 2030]).range([0, W]), []);
  const x = useMemo(() => zoomIdentity.translate(k.x, 0).scale(k.k).rescaleX(base), [k, base]);
  const yearOf = (e: TimelineEventT) => (chronology === 'late' && e.date.alternatives?.find((a) => /late/i.test(a.label))?.year) || e.date.year;
  const tracks = TRACKS.filter((tr) => !hidden.includes(tr.id));

  useEffect(() => {
    if (!svg.current) return;
    const z = d3zoom<SVGSVGElement, unknown>().scaleExtent([1, 120]).translateExtent([[0, 0], [W, H]]).extent([[0, 0], [W, H]])
      .filter((ev) => ev.type !== 'wheel' || ev.ctrlKey || ev.metaKey || ev.shiftKey || Math.abs(ev.deltaX) < Math.abs(ev.deltaY))
      .on('zoom', (ev) => setK({ k: ev.transform.k, x: ev.transform.x }));
    zr.current = z; select(svg.current).call(z);
    return () => { select(svg.current!).on('.zoom', null); };
  }, [H]);
  const zoomTo = (a: number, b: number) => {
    if (!svg.current || !zr.current) return;
    const kk = Math.min(120, W / (base(b) - base(a)) * 0.92);
    select(svg.current).call(zr.current.transform, zoomIdentity.translate(-base(a) * kk + W * 0.04, 0).scale(kk));
  };
  useEffect(() => {
    const id = sp.get('era') ?? eraFilter; const e = id ? eraById.get(id) : null;
    if (e) setTimeout(() => zoomTo(Math.max(-2300, e.start), e.end), 50);
  }, [sp.get('era'), eraFilter]);

  const [d0, d1] = x.domain();
  const ticks = x.ticks(10);
  const vis = timeline.filter((e) => { const y = yearOf(e); return y >= d0 - 50 && y <= d1 + 50 && !hidden.includes(e.track); });
  const pxPerYear = W / (d1 - d0);

  return (
    <div>
      <PageHeader eyebrow={t('Master timeline')} title={t('From the patriarchs to today')}
        actions={<>
          <button className="btn" onClick={() => zoomTo(-2300, 2030)}>{t('Show all')}</button>
          <select id="tl-era" className="input !w-auto" value={sp.get('era') ?? ''} onChange={(e) => setSp(e.target.value ? { era: e.target.value } : {}, { replace: true })} aria-label={t('Zoom to era')}>
            <option value="">{t('Zoom to era…')}</option>{eras.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </>}>
        {t('Scroll or pinch to zoom from millennia to single years, drag to pan. Disputed dates carry a')} <Conf c="debated" small /> {t('label; switch the exodus chronology to see dependent events move.')}
      </PageHeader>
      <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
        <span className="eyebrow">{t('Chronology')}</span>
        <button className={`btn !py-1 ${chronology === 'early' ? 'btn-primary' : ''}`} onClick={() => set({ chronology: 'early' })}>{t('Early exodus')}</button>
        <button className={`btn !py-1 ${chronology === 'late' ? 'btn-primary' : ''}`} onClick={() => set({ chronology: 'late' })}>{t('Late exodus')}</button>
        <span className="eyebrow ml-3">{t('Tracks')}</span>
        {TRACKS.map((tr) => <label key={tr.id} className="chip cursor-pointer"><input type="checkbox" id={`trk-${tr.id}`} checked={!hidden.includes(tr.id)} onChange={() => setHidden((h) => h.includes(tr.id) ? h.filter((x) => x !== tr.id) : [...h, tr.id])} />{tr.label}</label>)}
      </div>
      <div className="card overflow-hidden">
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block touch-none cursor-grab active:cursor-grabbing" role="img" aria-label={t('Zoomable timeline; the event list below is the text alternative')}>
          {eras.map((e) => {
            const a = x(e.start), b = x(e.end); if (b < 0 || a > W) return null;
            return <g key={e.id}><rect x={a} y={0} width={Math.max(0, b - a)} height={H} fill={e.color} opacity={0.09} />
              {b - a > e.name.length * 6.2 + 10 && <text x={Math.max(a, 0) + 6} y={eras.indexOf(e) % 2 ? 30 : 16} fontSize={12} fill={e.color} className="display" style={{ letterSpacing: '.04em' }}>{e.name}</text>}</g>;
          })}
          {ticks.map((tk) => <g key={tk}><line x1={x(tk)} x2={x(tk)} y1={22} y2={H - 22} stroke="rgb(var(--border))" strokeDasharray="2 4" /><text x={x(tk)} y={H - 8} fontSize={11} textAnchor="middle" fill="rgb(var(--muted))" className="tabular">{fmtYear(tk)}</text></g>)}
          {tracks.map((tr, i) => (
            <g key={tr.id} transform={`translate(0, ${TOP + i * ROW})`}>
              <line x1={0} x2={W} y1={ROW / 2} y2={ROW / 2} stroke="rgb(var(--border))" />
              <rect x={0} y={4} width={78} height={18} fill="rgb(var(--surface))" opacity={.92} />
              <text x={6} y={17} fontSize={11} fill="rgb(var(--muted))" fontWeight={600} style={{ letterSpacing: '.1em' }}>{tr.label.toUpperCase()}</text>
              {tr.id === 'empires' && empires.map((em, j) => { const a = x(em.start), b = x(em.end); if (b < 0 || a > W) return null; return (
                <g key={em.id}><rect x={a} y={ROW / 2 - 9 + (j % 2) * 10} width={Math.max(2, b - a)} height={8} rx={3} fill="rgb(var(--accent-2))" opacity={.35} />
                  {b - a > em.name.length * 6 && <text x={Math.max(a, 80) + 3} y={ROW / 2 - 12 + (j % 2) * 26} fontSize={10} fill="rgb(var(--text))">{em.name}</text>}</g>); })}
              {vis.filter((e) => e.track === tr.id).map((e, j) => {
                const cx = x(yearOf(e)); const on = sel?.id === e.id; const showLabel = pxPerYear * 25 > 8 || on;
                return (
                  <g key={e.id} onClick={() => setSel(e)} className="cursor-pointer" role="button" tabIndex={0} aria-label={`${e.title}, ${fmtYear(yearOf(e))}`} onKeyDown={(ev) => ev.key === 'Enter' && setSel(e)}>
                    <circle cx={cx} cy={ROW / 2} r={on ? 7 : 5} fill={e.date.confidence === 'debated' ? 'rgb(var(--warn))' : e.date.confidence === 'tradition' ? 'rgb(var(--accent))' : 'rgb(var(--text))'} stroke="rgb(var(--surface))" strokeWidth={2} />
                    {showLabel && <text x={cx + 7} y={ROW / 2 + (j % 2 ? 17 : -9)} fontSize={11} fill="rgb(var(--text))" paintOrder="stroke" stroke="rgb(var(--bg))" strokeWidth={3}>{e.title.length > 34 ? e.title.slice(0, 32) + '…' : e.title}</text>}
                  </g>
                );
              })}
            </g>
          ))}
        </svg>
      </div>
      {sel && (
        <div className="card p-4 mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <div className="eyebrow">{TRACKS.find((tr) => tr.id === sel.track)?.label} · {eraById.get(sel.eraId)?.name}</div>
            <h2 className="display text-3xl">{sel.title}</h2>
            <DateWithConf d={sel.date} />
            <p className="font-serif mt-2">{sel.summary}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {sel.personIds.map((id) => <PersonLink key={id} id={id} />)}{sel.placeIds.map((id) => <PlaceLink key={id} id={id} />)}
            </div>
            <div className="mt-2"><Refs refs={sel.refs} /></div>
          </div>
          <button className="btn self-start" onClick={() => setSel(null)}>{t('Close')}</button>
        </div>
      )}
      <details className="mt-6">
        <summary className="cursor-pointer text-sm text-muted">{t('Text list of all {n} events', { n: timeline.length })}</summary>
        <ol className="mt-3 space-y-1 text-sm columns-1 md:columns-2">
          {timeline.map((e) => <li key={e.id} className="break-inside-avoid"><span className="tabular text-muted w-20 inline-block">{fmtYear(yearOf(e))}</span>{e.title}</li>)}
        </ol>
      </details>
    </div>
  );
}
