import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { people, places, journeys, allDebates, books, eras, alive, lifespan, timeline } from '../data';
import { makeEraScale } from '../lib/eraScale';
import { fmtYear, Ref } from '../components/ui';
import { loadKJV, versesFor } from '../lib/kjv';
import { parseRef } from '../lib/refs';
import { useUI } from '../store';

const DAILY = ['Mic 6:8', 'Isa 40:31', 'John 1:14', 'Rom 8:38-39', 'Ps 46:10', 'Gen 12:2-3', 'Acts 3:21', 'Rev 21:5', 'Luke 4:18-19', 'Hab 3:17-18', 'Lam 3:22-23', 'Col 1:19-20', 'Ruth 1:16', 'Heb 11:13', 'Mark 1:15'];

function River() {
  const W = 1100, H = 190;
  const sc = useMemo(() => makeEraScale(W), []);
  const nav = useNavigate();
  const [year, setYear] = useState(-1000);
  const [hoverEra, setHoverEra] = useState<string | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const dots = useMemo(() => people.map((p) => ({ p, l: lifespan(p) })).filter((d) => d.l).map((d, i) => ({ ...d, cx: sc.x((d.l![0] + d.l![1]) / 2), cy: 70 + ((i * 37) % 70) })), [sc]);
  const living = useMemo(() => alive(year), [year]);
  const nearEvents = useMemo(() => timeline.filter((e) => Math.abs(e.date.year - year) <= 25).slice(0, 3), [year]);
  const setFromEvent = (clientX: number) => {
    const r = svg.current!.getBoundingClientRect();
    setYear(sc.invert(((clientX - r.left) / r.width) * W));
  };
  const lx = sc.x(year);
  const era = eras.find((e) => year >= e.start && year <= e.end);
  return (
    <div>
      <div className="scroll-x -mx-1 px-1">
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[640px] h-auto select-none touch-none" role="slider" aria-label="Year lens" aria-valuenow={year} aria-valuetext={fmtYear(year)} tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'ArrowRight') setYear((y) => y + (e.shiftKey ? 100 : 10)); if (e.key === 'ArrowLeft') setYear((y) => y - (e.shiftKey ? 100 : 10)); }}
          onPointerDown={(e) => { dragging.current = true; (e.target as Element).setPointerCapture?.(e.pointerId); setFromEvent(e.clientX); }}
          onPointerMove={(e) => dragging.current && setFromEvent(e.clientX)} onPointerUp={() => (dragging.current = false)}>
          <defs>
            <linearGradient id="riverfade" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="rgb(var(--accent))" stopOpacity=".18" /><stop offset="1" stopColor="rgb(var(--accent))" stopOpacity=".02" /></linearGradient>
          </defs>
          {sc.segs.map((s, i) => (
            <g key={s.era.id} onMouseEnter={() => setHoverEra(s.era.id)} onMouseLeave={() => setHoverEra(null)} onDoubleClick={() => nav(`/timeline?era=${s.era.id}`)}>
              <rect x={s.x0} y={40} width={s.x1 - s.x0} height={110} fill={s.era.color} opacity={hoverEra === s.era.id ? 0.28 : i % 2 ? 0.1 : 0.16} />
              <text x={(s.x0 + s.x1) / 2} y={i % 2 ? 30 : 18} textAnchor="middle" fontSize="11" fill="rgb(var(--muted))" style={{ letterSpacing: '.06em' }}>
                {s.x1 - s.x0 > s.era.name.length * 6.4 ? s.era.name : s.x1 - s.x0 > 44 ? s.era.name.split(/[ &]/)[0] : ''}
              </text>
            </g>
          ))}
          <motion.path d={`M0 ${H - 30} ${Array.from({ length: 23 }, (_, i) => `Q ${i * 50 + 25} ${H - 30 + (i % 2 ? 9 : -9)} ${(i + 1) * 50} ${H - 30}`).join(' ')}`} fill="none" stroke="rgb(var(--accent) / .5)" strokeWidth="2"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.4, ease: 'easeInOut' }} />
          {dots.map((d) => {
            const on = d.l![0] <= year && year <= d.l![1];
            return <circle key={d.p.id} cx={d.cx} cy={d.cy} r={d.p.tier === 'major' ? 4 : 2.6} fill={on ? 'rgb(var(--accent-2))' : d.p.testament === 'NT' ? 'rgb(var(--nt))' : 'rgb(var(--ot))'} opacity={on ? 1 : 0.4}><title>{d.p.names.primary}</title></circle>;
          })}
          <g transform={`translate(${lx},0)`} style={{ cursor: 'ew-resize' }}>
            <line y1={38} y2={H - 14} stroke="rgb(var(--accent-2))" strokeWidth="2" />
            <circle cy={H - 30} r={9} fill="rgb(var(--accent-2))" />
            <rect x={-38} y={H - 16} width={76} height={16} rx={3} fill="rgb(var(--accent-2))" />
            <text y={H - 4} textAnchor="middle" fontSize="11" fill="rgb(var(--bg))" fontWeight="600" className="tabular">{fmtYear(year)}</text>
          </g>
        </svg>
      </div>
      <div className="mt-3 grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <div className="min-w-0">
          <div className="eyebrow mb-1.5">Alive around {fmtYear(year)}{era ? ` · ${era.name}` : ''}</div>
          <div className="flex flex-wrap gap-1.5">
            {living.slice(0, 18).map((p) => <Link key={p.id} to={`/people/${p.id}`} className="chip hover:border-accent">{p.names.primary}</Link>)}
            {!living.length && <span className="text-muted text-sm font-serif">No dated lives cross this year. Drag the lens along the river.</span>}
            {living.length > 18 && <Link to={`/lens?year=${year}`} className="chip text-accent">+{living.length - 18} more</Link>}
          </div>
        </div>
        <div className="min-w-0 text-sm">
          <div className="eyebrow mb-1.5">Nearby on the timeline</div>
          {nearEvents.length ? nearEvents.map((e) => <div key={e.id} className="mb-1"><span className="tabular text-muted mr-2">{fmtYear(e.date.year)}</span>{e.title}</div>) : <span className="text-muted font-serif">Nothing recorded within 25 years.</span>}
        </div>
      </div>
    </div>
  );
}

const DOORS = [
  { to: '/maps?journey=abraham', k: 'Walk', t: 'From Ur to Moriah with Abraham', d: 'An animated route with every stop cited.' },
  { to: '/maps?journey=paul-to-rome', k: 'Sail', t: 'Paul’s voyage and shipwreck', d: 'Caesarea, Crete, Malta, Rome.' },
  { to: '/connections?from=ruth&to=jesus', k: 'Trace', t: 'How is Ruth connected to Jesus?', d: 'Path-finding across the people graph.' },
  { to: '/debates/atonement', k: 'Weigh', t: 'Nine ways to read the cross', d: 'Every theory animated as a flowchart.' },
  { to: '/gospel-history', k: 'Follow', t: 'What gospel was preached, and when?', d: 'From Galilee to Lausanne, with sources.' },
  { to: '/people/elijah?tab=interview', k: 'Interview', t: 'Ask Elijah a question', d: 'An imaginative, scripture-grounded conversation.' },
];

export default function Home() {
  const [verse, setVerse] = useState<string>('');
  const ref = DAILY[Math.floor(Date.now() / 86_400_000) % DAILY.length];
  useEffect(() => { const p = parseRef(ref); if (p) loadKJV().then((k) => setVerse(versesFor(k, p).map((v) => v.text).join(' '))); }, [ref]);
  const reduced = useUI((s) => s.reducedMotion);
  const positions = allDebates.reduce((n, d) => n + d.positions.length, 0);
  return (
    <div>
      <section className="grid gap-8 lg:grid-cols-[1.25fr_1fr] items-end mb-8">
        <div>
          <div className="eyebrow mb-3">An atlas of Scripture, its people and its arguments</div>
          <h1 className="text-5xl md:text-7xl leading-[.95]">
            Every name<br />in the story<br /><span className="font-serif italic font-semibold text-accent tracking-normal">has a road.</span>
          </h1>
          <p className="mt-5 font-serif text-lg text-muted max-w-[52ch] leading-relaxed">
            Follow {people.length || 'the'} lives across {places.length || 'hundreds of'} places, walk {journeys.length} journeys on an animated map, read {books.length} books as flowcharts,
            and weigh {positions} theological positions side by side, each argued as its best defenders would.
          </p>
        </div>
        <motion.blockquote className="card p-5 md:p-6 relative" initial={{ opacity: 0.001, y: reduced ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="eyebrow mb-2">Today’s verse</div>
          <p className="font-serif text-xl leading-relaxed dropcap min-h-[4.5rem]">{verse || <span className="block skeleton h-16" />}</p>
          <footer className="mt-3 flex items-center justify-between"><Ref r={ref} /><span className="text-xs text-muted">King James Version</span></footer>
        </motion.blockquote>
      </section>

      <section className="card p-4 md:p-5 mb-10">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
          <h2 className="text-2xl">The River of Ages</h2>
          <span className="text-sm text-muted">Drag the red lens through time. Dots are people; lit dots were alive that year. Double-click an era to open it.</span>
        </div>
        <River />
      </section>

      <section>
        <h2 className="text-3xl mb-4">Start a journey</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DOORS.map((d, i) => (
            <motion.div key={d.to} initial={{ opacity: 0.001, y: reduced ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
              <Link to={d.to} className="card p-4 h-full flex flex-col gap-1 hover:border-accent transition-colors group">
                <span className="eyebrow rubric !text-accent2">{d.k}</span>
                <span className="display text-xl leading-tight group-hover:text-accent">{d.t}</span>
                <span className="text-sm text-muted">{d.d}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
