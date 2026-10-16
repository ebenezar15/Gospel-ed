import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { alive, empires, rosters, timeline, eras, lifespan } from '../data';
import { PageHeader, fmtYear, Conf, Empty } from '../components/ui';

export default function Lens() {
  const [sp, setSp] = useSearchParams();
  const [year, setYearState] = useState(Number(sp.get('year')) || -700);
  const setYear = (y: number) => { setYearState(y); setSp({ year: String(y) }, { replace: true }); };
  const living = useMemo(() => alive(year), [year]);
  const era = eras.find((e) => year >= e.start && year <= e.end);
  const rulers = rosters.filter((r) => /king|herod|roman|high-priest|judge/i.test(r.id)).map((r) => ({ r, on: r.entries.filter((e) => e.start !== undefined && e.end !== undefined && e.start! <= year && year <= e.end!) })).filter((x) => x.on.length);
  const ev = timeline.filter((e) => Math.abs(e.date.year - year) <= 15);
  const emp = empires.filter((e) => e.start <= year && year <= e.end);
  const jumps = [-1446, -1010, -853, -722, -701, -586, -538, -445, -167, -4, 30, 49, 70, 325];
  return (
    <div>
      <PageHeader eyebrow="Synchronism lens" title={<>Who was alive in <span className="rubric tabular">{fmtYear(year)}</span>?</>}>
        Pick any year to see the people, rulers, empires and events that overlapped. Lifespans are approximate; open a profile to see how sure each date is.
      </PageHeader>
      <div className="card p-4 mb-6">
        <input id="lens-year" aria-label="Year" type="range" min={-2200} max={120} value={year} onChange={(e) => setYear(+e.target.value)} className="w-full accent-[rgb(var(--accent-2))]" />
        <div className="flex flex-wrap gap-1.5 mt-2 items-center">
          <span className="eyebrow mr-1">Jump to</span>
          {jumps.map((y) => <button key={y} className={`chip hover:border-accent tabular ${y === year ? '!border-accent2' : ''}`} onClick={() => setYear(y)}>{fmtYear(y)}</button>)}
          <span className="text-sm text-muted ml-auto">{era?.name}</span>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section>
          <h2 className="text-2xl rubric mb-3">People ({living.length})</h2>
          {living.length ? (
            <div className="space-y-2">
              {living.map((p) => {
                const l = lifespan(p)!; const span = l[1] - l[0] || 1; const pos = ((year - l[0]) / span) * 100;
                return (
                  <motion.div layout key={p.id} className="card p-2.5 flex items-center gap-3">
                    <Link to={`/people/${p.id}`} className="display text-lg w-40 shrink-0 truncate hover:text-accent">{p.names.primary}</Link>
                    <div className="flex-1 min-w-0">
                      <div className="relative h-2 bg-sunk rounded"><div className="absolute top-0 bottom-0 left-0 bg-accent/40 rounded" style={{ width: '100%' }} /><div className="absolute -top-1 w-1 h-4 bg-accent2 rounded" style={{ left: `calc(${pos}% - 2px)` }} /></div>
                      <div className="flex justify-between text-[.7rem] text-muted tabular mt-0.5"><span>{fmtYear(l[0])}</span><span className="truncate px-2">{p.roles.slice(0, 2).join(', ')}</span><span>{fmtYear(l[1])}</span></div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : <Empty>No dated lives cross {fmtYear(year)}. Try one of the jump years.</Empty>}
        </section>
        <section className="space-y-5">
          {rulers.map(({ r, on }) => (
            <div key={r.id}><h3 className="eyebrow mb-1.5">{r.title}</h3>{on.map((e) => <div key={e.name} className="card p-2.5 mb-1.5 flex justify-between gap-2"><span>{e.personId ? <Link className="hover:text-accent font-medium" to={`/people/${e.personId}`}>{e.name}</Link> : <span className="font-medium">{e.name}</span>}</span><span className="text-xs text-muted tabular">{fmtYear(e.start!)}–{fmtYear(e.end!)}{e.verdict && e.verdict !== 'n/a' ? ` · ${e.verdict}` : ''}</span></div>)}</div>
          ))}
          <div><h3 className="eyebrow mb-1.5">Empires</h3>{emp.length ? emp.map((e) => <div key={e.id} className="text-sm mb-1"><span className="font-medium">{e.name}</span> <span className="text-muted tabular">{fmtYear(e.start)}–{fmtYear(e.end)}</span></div>) : <p className="text-sm text-muted">None in data.</p>}</div>
          <div><h3 className="eyebrow mb-1.5">Events within 15 years</h3>{ev.length ? ev.map((e) => <div key={e.id} className="text-sm mb-1.5"><span className="tabular text-muted mr-1.5">{fmtYear(e.date.year)}</span>{e.title} <Conf c={e.date.confidence} small /></div>) : <p className="text-sm text-muted">None recorded.</p>}</div>
        </section>
      </div>
    </div>
  );
}
