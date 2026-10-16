import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import BibleMap, { type MapRoute } from '../components/BibleMap';
import { journeys, journeyById, places, placeById, empires, timeline, people, eras, eraById, placeName, placeLabel, modernName } from '../data';
import { PageHeader, Refs, Conf, fmtYear, PersonLink, Empty } from '../components/ui';
import { prefersReduced } from '../store';

const PALETTE = ['rgb(var(--accent-2))', 'rgb(var(--accent))', 'rgb(var(--good))', 'rgb(var(--warn))'];

export default function Maps() {
  const [sp, setSp] = useSearchParams();
  const jid = sp.get('journey');
  const pid = sp.get('place');
  const [year, setYear] = useState<number>(() => Number(sp.get('year')) || -1000);
  const [stop, setStop] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState<'journey' | 'time'>(jid || !pid ? 'journey' : 'time');
  const journey = jid ? journeyById.get(jid) : undefined;
  const update = (k: string, v: string | null) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); setSp(n, { replace: true }); };

  // Variants: journeys sharing the same id prefix (exodus-*) are drawn together.
  const variants = useMemo(() => (journey ? journeys.filter((j) => j.id === journey.id || (journey.variant && j.variant && j.id.split('-')[0] === journey.id.split('-')[0])) : []), [journey]);
  const routes: MapRoute[] = variants.map((j, i) => ({ id: j.id, color: PALETTE[i % PALETTE.length], dashed: j.id !== journey?.id, coords: j.stops.map((s) => placeById.get(s.placeId)?.coords).filter(Boolean) as [number, number][] }));
  const stopPlaces = journey ? journey.stops.map((s) => placeById.get(s.placeId)).filter(Boolean) as typeof places : [];

  useEffect(() => { setStop(null); setPlaying(false); }, [jid]);
  useEffect(() => {
    if (!playing || !journey) return;
    if ((stop ?? -1) >= journey.stops.length - 1) { setPlaying(false); return; }
    const t = setTimeout(() => setStop((s) => (s ?? -1) + 1), prefersReduced() ? 1200 : 2600);
    return () => clearTimeout(t);
  }, [playing, stop, journey]);

  const activeEmpires = empires.filter((e) => e.start <= year && year <= e.end);
  const eventsNow = timeline.filter((e) => Math.abs(e.date.year - year) <= 40 && e.placeIds.length);
  const eventPlaces = [...new Set(eventsNow.flatMap((e) => e.placeIds))].map((id) => placeById.get(id)).filter(Boolean) as typeof places;
  const place = pid ? placeById.get(pid) : undefined;
  const placePeople = place ? people.filter((p) => p.placeIds.includes(place.id) || p.journey?.some((j) => j.placeId === place.id) || p.events.some((e) => e.placeId === place.id)) : [];
  const placeEvents = place ? timeline.filter((e) => e.placeIds.includes(place.id)) : [];
  const placeJourneys = place ? journeys.filter((j) => j.stops.some((s) => s.placeId === place.id)) : [];
  const grouped = eras.map((e) => ({ era: e, list: journeys.filter((j) => j.eraId === e.id) })).filter((g) => g.list.length);
  const era = eras.find((e) => year >= e.start && year <= e.end);

  return (
    <div>
      <PageHeader eyebrow="Interactive atlas" title="Maps & Journeys">
        Walk a route stop by stop, or slide through time to watch empires rise and events light up. Disputed locations and routes are labelled.
      </PageHeader>
      <div className="flex gap-2 mb-4">
        <button className={`btn ${mode === 'journey' ? 'btn-primary' : ''}`} onClick={() => setMode('journey')}>Journeys</button>
        <button className={`btn ${mode === 'time' ? 'btn-primary' : ''}`} onClick={() => setMode('time')}>Time slider</button>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-3">
          {mode === 'journey' ? (
            <BibleMap routes={routes} places={journey ? stopPlaces : place ? [place] : places.filter((p) => p.type === 'city').slice(0, 300)} activeStop={stop}
              highlight={journey && stop !== null ? journey.stops[stop]?.placeId : pid} onPlace={(id) => update('place', id)} label={journey ? journey.title : 'Places of the Bible'} />
          ) : (
            <>
              <BibleMap places={place ? [...eventPlaces, place] : eventPlaces} empires={activeEmpires} highlight={pid} onPlace={(id) => update('place', id)} focus={[-6, 12, 60, 46]} year={year} label={`The world around ${fmtYear(year)}`} />
              <div className="card p-3">
                <div className="flex flex-wrap justify-between gap-2 mb-1 text-sm"><span className="display text-xl tabular">{fmtYear(year)}</span><span className="text-muted">{era?.name} · {activeEmpires.map((e) => e.name).join(', ') || 'no major empire in data'}</span></div>
                <input id="map-year" aria-label="Year" type="range" min={-2200} max={700} step={10} value={year} onChange={(e) => setYear(+e.target.value)} className="w-full accent-[rgb(var(--accent-2))]" />
                <div className="flex justify-between text-xs text-muted tabular"><span>2200 BC</span><span>1 BC / AD 1</span><span>AD 700</span></div>
              </div>
            </>
          )}
          {mode === 'journey' && journey && (
            <div className="card p-4">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <button className="btn btn-primary" onClick={() => { if (stop === null || stop >= journey.stops.length - 1) setStop(0); setPlaying((p) => !p); }}>{playing ? '❚❚ Pause' : '▶ Walk the route'}</button>
                <button className="btn" disabled={!stop} onClick={() => { setPlaying(false); setStop((s) => Math.max(0, (s ?? 0) - 1)); }}>← Back</button>
                <button className="btn" disabled={stop === journey.stops.length - 1} onClick={() => { setPlaying(false); setStop((s) => (s === null ? 0 : Math.min(journey.stops.length - 1, s + 1))); }}>Next →</button>
                <span className="text-sm text-muted tabular ml-auto">{stop === null ? `${journey.stops.length} stops` : `Stop ${stop + 1} of ${journey.stops.length}`}</span>
              </div>
              <AnimatePresence mode="wait">
                {stop !== null && journey.stops[stop] && (
                  <motion.div key={stop} initial={{ opacity: 0.001, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div className="display text-2xl">{placeName(journey.stops[stop].placeId)}{journey.stops[stop].year !== undefined && <span className="text-base text-muted tabular ml-2">{fmtYear(journey.stops[stop].year!)}</span>}</div>
                    <p className="font-serif text-lg leading-relaxed my-2">{journey.stops[stop].note}</p>
                    <Refs refs={journey.stops[stop].refs} />
                  </motion.div>
                )}
              </AnimatePresence>
              {stop === null && <p className="font-serif">{journey.summary}</p>}
              {variants.length > 1 && (
                <div className="mt-3 pt-3 border-t border-line text-sm space-y-1">
                  <div className="eyebrow">Proposed routes</div>
                  {variants.map((v, i) => <button key={v.id} onClick={() => update('journey', v.id)} className="flex items-center gap-2 hover:text-accent"><span className="inline-block w-6 h-0.5" style={{ background: PALETTE[i % PALETTE.length] }} />{v.variant ?? v.title} <Conf c={v.confidence} small /></button>)}
                </div>
              )}
            </div>
          )}
        </div>
        <aside className="space-y-4 min-w-0">
          {place ? (
            <div className="card p-4">
              <div className="flex justify-between items-start gap-2"><div><div className="eyebrow">{place.type}</div><h2 className="display text-3xl">{placeLabel(place)}</h2>{modernName(place) && <div className="text-sm text-muted">Today: {modernName(place)}</div>}</div><button className="btn !px-2 !py-0.5" onClick={() => update('place', null)} aria-label="Close place">✕</button></div>
              {place.names.length > 1 && <div className="text-sm text-muted mb-2">{place.names.filter((n) => n.era !== 'modern').map((n) => `${n.name} (${eraById.get(n.era)?.name ?? n.era})`).join(' · ')}</div>}
              <div className="mb-2"><Conf c={place.coordConfidence} small /> <span className="text-xs text-muted">location</span></div>
              <p className="font-serif">{place.summary}</p>
              {place.archaeology && <p className="font-serif text-sm mt-2 p-2 bg-sunk rounded"><span className="eyebrow block">Archaeology</span>{place.archaeology}</p>}
              <div className="mt-2"><Refs refs={place.refs} max={5} /></div>
              {placePeople.length > 0 && <div className="mt-3"><div className="eyebrow mb-1">People</div><div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">{placePeople.map((p) => <PersonLink key={p.id} id={p.id} />)}</div></div>}
              {placeEvents.length > 0 && <div className="mt-3"><div className="eyebrow mb-1">Events</div><ul className="text-sm space-y-1">{placeEvents.map((e) => <li key={e.id}><span className="tabular text-muted mr-1.5">{fmtYear(e.date.year)}</span>{e.title}</li>)}</ul></div>}
              {placeJourneys.length > 0 && <div className="mt-3"><div className="eyebrow mb-1">Journeys through here</div>{placeJourneys.map((j) => <button key={j.id} className="chip mr-1 mb-1 hover:border-accent" onClick={() => { setMode('journey'); update('journey', j.id); }}>{j.title}</button>)}</div>}
            </div>
          ) : null}
          {mode === 'journey' ? (
            <div className="card p-3 max-h-[70vh] overflow-y-auto">
              {grouped.length ? grouped.map((g) => (
                <div key={g.era.id} className="mb-3">
                  <div className="eyebrow mb-1">{g.era.name}</div>
                  {g.list.map((j) => (
                    <button key={j.id} onClick={() => update('journey', j.id)} className={`w-full text-left px-2 py-1.5 rounded text-sm ${j.id === jid ? 'bg-sunk font-semibold' : 'hover:bg-sunk'}`}>
                      {j.title}{j.variant && <span className="text-muted"> · {j.variant}</span>}
                    </button>
                  ))}
                </div>
              )) : <Empty>Journeys are still being charted.</Empty>}
            </div>
          ) : (
            <div className="card p-3">
              <div className="eyebrow mb-2">Within 40 years of {fmtYear(year)}</div>
              {eventsNow.length ? <ul className="space-y-2 text-sm">{eventsNow.map((e) => <li key={e.id}><span className="tabular text-muted mr-1.5">{fmtYear(e.date.year)}</span><span className="font-semibold">{e.title}</span> <Conf c={e.date.confidence} small /><div className="text-muted">{e.placeIds.map(placeName).join(', ')}</div></li>)}</ul> : <p className="text-sm text-muted font-serif">No mapped events in this window. Slide on.</p>}
            </div>
          )}
          {journey && <div className="text-sm text-muted"><span className="eyebrow">Travellers </span>{journey.personIds.map((id, i) => <span key={id}>{i ? ', ' : ''}<PersonLink id={id} /></span>)} · {eraById.get(journey.eraId)?.name}</div>}
          {!journey && !place && mode === 'journey' && <p className="text-sm text-muted font-serif">Pick a journey to draw it, or tap any dot for the people and events tied to that place. <Link to="/maps?journey=abraham" className="text-accent">Start with Abraham →</Link></p>}
        </aside>
      </div>
    </div>
  );
}
