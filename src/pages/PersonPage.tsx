import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { personById, contemporaries, lifespan, adjacency, placeById, eraById, occupations, contextItems, journeys } from '../data';
import { PageHeader, Section, Tabs, Refs, Ref, PersonLink, PlaceLink, Paras, DateWithConf, Conf, fmtYear, Bookmark, Empty } from '../components/ui';
import BibleMap, { routeFromPlaceIds } from '../components/BibleMap';
import Chat from '../components/Chat';
import type { PersonT } from '../schemas';

type Tab = 'overview' | 'timeline' | 'journey' | 'family' | 'connections' | 'gifts' | 'stories' | 'context' | 'legacy' | 'interview';

const TYPE_LABEL: Record<string, string> = { family: 'Family', spouse: 'Spouse', mentor: 'Mentor / disciple', ally: 'Ally', enemy: 'Enemy', 'co-worker': 'Co-worker', confrontation: 'Confrontation', successor: 'Successor' };

function FamilyDiagram({ p }: { p: PersonT }) {
  const box = (id: string) => (
    <Link key={id} to={`/people/${id}`} className="card px-3 py-2 text-center hover:border-accent min-w-[7rem]">
      <div className="display text-lg leading-tight">{personById.get(id)?.names.primary ?? id}</div>
      <div className="text-[.68rem] text-muted">{personById.get(id)?.roles[0] ?? ''}</div>
    </Link>
  );
  const row = (label: string, ids: string[]) => ids.length ? (
    <div className="flex flex-col items-center gap-1.5"><div className="eyebrow">{label}</div><div className="flex flex-wrap justify-center gap-2">{ids.map(box)}</div></div>
  ) : null;
  const f = p.family;
  return (
    <div className="flex flex-col items-center gap-3">
      {row('Parents', f.parents)}
      {f.parents.length > 0 && <div className="w-px h-5 bg-line" />}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {f.siblings.length > 0 && <div className="flex flex-wrap gap-2 opacity-80">{f.siblings.map(box)}</div>}
        <div className="card px-4 py-3 text-center border-accent2 border-2"><div className="display text-2xl">{p.names.primary}</div></div>
        {f.spouses.length > 0 && <><span className="rubric display text-2xl">⚭</span><div className="flex flex-wrap gap-2">{f.spouses.map(box)}</div></>}
      </div>
      {f.children.length > 0 && <div className="w-px h-5 bg-line" />}
      {row('Children', f.children)}
      {!f.parents.length && !f.children.length && !f.spouses.length && !f.siblings.length && <Empty>The text names no relatives of {p.names.primary} who have profiles in the atlas.</Empty>}
      <Link to={`/family?root=${p.id}`} className="btn mt-2">Open in the family tree explorer →</Link>
    </div>
  );
}

function MiniTimeline({ p }: { p: PersonT }) {
  const evs = p.events.filter((e) => e.year !== undefined).sort((a, b) => a.year! - b.year!);
  const l = lifespan(p);
  if (!evs.length || !l) return <Empty>The text gives no datable anchors for {p.names.primary}’s life, so the events are listed in narrative order under Stories.</Empty>;
  const [a, b] = [Math.min(l[0], evs[0].year!), Math.max(l[1], evs.at(-1)!.year!)];
  const x = (y: number) => (b === a ? 50 : ((y - a) / (b - a)) * 100);
  return (
    <div>
      <div className="relative h-16 mx-4 mb-8">
        <div className="absolute left-0 right-0 top-8 h-0.5 bg-line" />
        <motion.div className="absolute top-[30px] h-1.5 rounded bg-accent2/60" style={{ left: `${x(l[0])}%` }} initial={{ width: 0 }} animate={{ width: `${x(l[1]) - x(l[0])}%` }} transition={{ duration: 0.8 }} />
        {evs.map((e, i) => (
          <div key={i} className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left: `${x(e.year!)}%`, top: i % 2 ? 36 : 0 }}>
            <span className="w-2.5 h-2.5 rounded-full bg-accent border-2 border-surface" style={{ marginTop: i % 2 ? 0 : 26 }} />
          </div>
        ))}
        <span className="absolute -bottom-6 left-0 text-xs text-muted tabular">{fmtYear(a)}</span>
        <span className="absolute -bottom-6 right-0 text-xs text-muted tabular">{fmtYear(b)}</span>
      </div>
      <ol className="relative border-l-2 border-line ml-2 space-y-4">
        {evs.map((e, i) => (
          <li key={i} className="ml-4">
            <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-accent2 mt-1.5" />
            <div className="tabular text-sm text-muted">{fmtYear(e.year!)}{e.placeId ? <> · <PlaceLink id={e.placeId} /></> : null}</div>
            <div className="font-semibold">{e.title}</div>
            <div className="font-serif text-[.95rem]">{e.summary}</div>
            <div className="mt-1"><Refs refs={e.refs} max={4} /></div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function PersonPage() {
  const { id = '' } = useParams();
  const [sp, setSp] = useSearchParams();
  const p = personById.get(id);
  const tab = (sp.get('tab') as Tab) || 'overview';
  const setTab = (t: Tab) => { const n = new URLSearchParams(sp); n.set('tab', t); setSp(n, { replace: true }); };
  const contemps = useMemo(() => (p ? contemporaries(p).slice(0, 24) : []), [p]);
  if (!p) return <Empty>No profile with the id “{id}”. <Link className="text-accent" to="/people">Browse all people</Link>.</Empty>;
  const l = lifespan(p);
  const rels = adjacency.get(p.id) ?? [];
  const journeyIds = (p.journey ?? []).sort((a, b) => a.order - b.order);
  const route = routeFromPlaceIds(journeyIds.map((j) => j.placeId));
  const namedJourneys = journeys.filter((j) => j.personIds.includes(p.id));
  const occ = occupations.filter((o) => o.personIds.includes(p.id));
  const ctx = contextItems.filter((c) => c.personIds.includes(p.id));
  const placesHere = p.placeIds.map((x) => placeById.get(x)).filter(Boolean) as NonNullable<ReturnType<typeof placeById.get>>[];

  const rules = `You are role-playing ${p.names.primary} from the Bible for an educational Bible-study app called Logos Atlas. Speak in first person as ${p.names.primary}, in plain modern English with the flavour described here: ${p.voice ?? 'thoughtful and reverent'}.
Ground everything in the profile and scripture below. Cite chapter and verse in parentheses when you refer to an event (e.g. (Gen 22:1-14)). If asked about something the Bible does not say, say plainly that the scriptures are silent on it, and label any later tradition as tradition. If asked about events after your lifetime, answer as yourself with humility, or step out of character briefly with "[Stepping out of character:]" to answer factually. Do not invent quotations. Keep answers under 180 words unless asked for more. Never claim to be the real person; this is an imaginative reconstruction.

PROFILE:
Name: ${p.names.primary}${p.names.original ? ` (${p.names.original})` : ''}${p.names.meaning ? `, meaning "${p.names.meaning}"` : ''}. Aliases: ${p.names.aliases.join(', ') || 'none'}.
Roles: ${p.roles.join(', ')}. Occupations: ${p.occupations.join(', ')}.
Summary: ${p.summary}
${p.textSays ? `What the text says: ${p.textSays}` : ''}
Key events: ${p.events.map((e) => `${e.title} (${e.refs.join(', ')}): ${e.summary}`).join(' | ')}
${p.arc ? `Strengths: ${p.arc.strengths.join('; ')}. Failures: ${p.arc.failures.join('; ')}. Turning points: ${p.arc.turningPoints.join('; ')}.` : ''}
Family: parents ${p.family.parents.join(', ') || '—'}; spouses ${p.family.spouses.join(', ') || '—'}; children ${p.family.children.join(', ') || '—'}.`;

  return (
    <div>
      <div className="text-sm mb-3"><Link to="/people" className="text-muted hover:text-accent">← People</Link></div>
      <PageHeader
        eyebrow={[p.testament === 'NT' ? 'New Testament' : p.testament === 'OT' ? 'Old Testament' : 'Both testaments', ...p.eraIds.map((e) => eraById.get(e)?.name ?? e)].join(' · ')}
        title={<span className="flex flex-wrap items-baseline gap-x-4">{p.names.primary}{p.names.original && <span className="font-orig text-3xl text-muted" dir="auto">{p.names.original}</span>}</span>}
        actions={<><Bookmark path={`/people/${p.id}`} /><button className="btn" onClick={() => setTab('interview')}>Interview {p.names.primary.split(' ')[0]}</button></>}>
        {p.names.meaning && <span>Name meaning: <i>“{p.names.meaning}”</i>. </span>}
        {p.names.aliases.length > 0 && <span>Also called {p.names.aliases.join(', ')}.</span>}
      </PageHeader>

      <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-4 card p-4 mb-6 text-sm">
        <div><div className="eyebrow">Born</div>{p.born ? <DateWithConf d={p.born} /> : <span className="text-muted">Not stated</span>}</div>
        <div><div className="eyebrow">Died</div>{p.died ? <DateWithConf d={p.died} /> : <span className="text-muted">Not stated</span>}</div>
        <div><div className="eyebrow">Roles</div>{p.roles.join(', ')}</div>
        <div><div className="eyebrow">{p.tribe ? 'Tribe' : 'Nation'}</div>{p.tribe ?? p.nation ?? '—'}</div>
      </div>

      <Tabs<Tab> value={tab} onChange={setTab} tabs={[
        { id: 'overview', label: 'Overview' }, { id: 'timeline', label: 'Timeline' }, { id: 'journey', label: 'Journey Map', hidden: !route.length && !placesHere.length },
        { id: 'family', label: 'Family' }, { id: 'connections', label: `Connections (${rels.length})` }, { id: 'gifts', label: 'Gifts & Skills' },
        { id: 'stories', label: 'Stories' }, { id: 'context', label: 'Context' }, { id: 'legacy', label: 'Legacy' }, { id: 'interview', label: '✦ Interview' },
      ]} />

      {tab === 'overview' && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            <Paras text={p.summary} className="dropcap" />
            {p.textSays && (<Section title="What the text says"><Paras text={p.textSays} /></Section>)}
            {p.interpretations?.length ? (
              <Section title="How traditions read them">
                <div className="grid gap-3 md:grid-cols-2">{p.interpretations.map((i) => <div key={i.tradition} className="card p-3"><div className="eyebrow mb-1">{i.tradition}</div><p className="font-serif text-[.95rem]">{i.view}</p></div>)}</div>
              </Section>
            ) : null}
            {p.arc && (
              <Section title="Character arc">
                <div className="grid gap-3 md:grid-cols-3">
                  {([['Strengths', p.arc.strengths, 'good'], ['Failures', p.arc.failures, 'bad'], ['Turning points', p.arc.turningPoints, 'accent']] as const).map(([t, l, c]) => (
                    <div key={t} className="card p-3"><div className="eyebrow mb-1.5" style={{ color: `rgb(var(--${c}))` }}>{t}</div><ul className="font-serif text-[.95rem] space-y-1.5 list-disc pl-4">{l.map((x) => <li key={x}>{x}</li>)}</ul></div>
                  ))}
                </div>
              </Section>
            )}
            {p.traditions?.length ? (
              <Section title="Extra-biblical traditions">
                <ul className="space-y-2">{p.traditions.map((t, i) => <li key={i} className="card p-3"><Conf c="tradition" small /> <span className="font-serif">{t.text}</span> <span className="text-xs text-muted">— {t.source}</span></li>)}</ul>
              </Section>
            ) : null}
            <Section title="Key references"><Refs refs={p.refs} /></Section>
          </div>
          <aside className="space-y-4">
            <div className="card p-4">
              <div className="eyebrow mb-2">Who else was alive then?</div>
              {!l ? <p className="text-sm text-muted font-serif">No datable lifespan, so contemporaries can’t be computed.</p> : contemps.length ? (
                <ul className="space-y-1 text-sm">{contemps.slice(0, 12).map(({ p: q, overlap }) => <li key={q.id} className="flex justify-between gap-2"><PersonLink id={q.id} /><span className="text-muted tabular text-xs">{overlap} yrs overlap</span></li>)}</ul>
              ) : <p className="text-sm text-muted">No overlapping dated lives.</p>}
              {l && <Link to={`/lens?year=${Math.round((l[0] + l[1]) / 2)}`} className="text-xs text-accent mt-2 inline-block">Open the year lens →</Link>}
            </div>
            {p.books?.length ? <div className="card p-4"><div className="eyebrow mb-2">Appears in</div><div className="flex flex-wrap gap-1">{p.books.map((b) => <span key={b} className="chip">{b}</span>)}</div></div> : null}
            {occ.length > 0 && <div className="card p-4"><div className="eyebrow mb-2">Work</div>{occ.map((o) => <Link key={o.id} to={`/work#${o.id}`} className="chip mr-1 mb-1 hover:border-accent">{o.name}</Link>)}</div>}
          </aside>
        </div>
      )}

      {tab === 'timeline' && <MiniTimeline p={p} />}

      {tab === 'journey' && (
        <div className="space-y-4">
          <BibleMap routes={route.length > 1 ? [{ id: p.id, color: 'rgb(var(--accent-2))', coords: route }] : []} places={placesHere} label={`Journey of ${p.names.primary}`} />
          {journeyIds.length > 0 && (
            <ol className="grid gap-2 md:grid-cols-2">
              {journeyIds.map((j, i) => <li key={i} className="card p-3"><span className="rubric display text-lg mr-2 tabular">{i + 1}</span><PlaceLink id={j.placeId} />{j.year !== undefined && <span className="text-muted text-sm tabular"> · {fmtYear(j.year)}</span>}<p className="font-serif text-[.95rem] mt-1">{j.note}</p><Refs refs={j.refs} max={3} /></li>)}
            </ol>
          )}
          {namedJourneys.length > 0 && <div className="flex flex-wrap gap-2">{namedJourneys.map((j) => <Link key={j.id} className="btn" to={`/maps?journey=${j.id}`}>Walk: {j.title} →</Link>)}</div>}
        </div>
      )}

      {tab === 'family' && <FamilyDiagram p={p} />}

      {tab === 'connections' && (
        rels.length ? (
          <div>
            <div className="grid gap-2 md:grid-cols-2">
              {rels.map((r, i) => { const other = r.from === p.id ? r.to : r.from; return (
                <div key={i} className="card p-3 flex gap-3 items-start">
                  <span className="chip shrink-0">{TYPE_LABEL[r.type]}</span>
                  <div className="min-w-0"><PersonLink id={other} className="font-semibold" />{r.note && <span className="text-sm text-muted"> — {r.note}</span>}<div className="mt-1"><Refs refs={r.refs} max={3} /></div></div>
                </div>
              ); })}
            </div>
            <Link to={`/connections?focus=${p.id}`} className="btn mt-4">See {p.names.primary} in the connections graph →</Link>
          </div>
        ) : <Empty>No recorded relationships yet.</Empty>
      )}

      {tab === 'gifts' && (
        <div className="grid gap-6 md:grid-cols-2">
          {([['Spiritual gifts & callings', p.gifts], ['Skills', p.skills]] as const).map(([t, list]) => (
            <Section key={t} title={t}>{list.length ? <ul className="space-y-2">{list.map((g) => <li key={g.name} className="card p-3"><div className="font-semibold mb-1">{g.name}</div><Refs refs={g.refs} /></li>)}</ul> : <p className="text-muted font-serif">None recorded.</p>}</Section>
          ))}
          <Section title="Occupations"><div className="flex flex-wrap gap-1.5">{p.occupations.map((o) => <span key={o} className="chip">{o}</span>)}</div></Section>
        </div>
      )}

      {tab === 'stories' && (
        <ol className="space-y-3">
          {p.events.map((e, i) => (
            <motion.li key={i} className="card p-4" initial={{ opacity: 0.001, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
              <div className="flex flex-wrap items-baseline gap-x-3"><span className="display text-xl">{e.title}</span>{e.year !== undefined && <span className="text-sm text-muted tabular">{fmtYear(e.year)}</span>}{e.placeId && <span className="text-sm"><PlaceLink id={e.placeId} /></span>}</div>
              <p className="font-serif mt-1">{e.summary}</p>
              <div className="mt-2"><Refs refs={e.refs} /></div>
            </motion.li>
          ))}
        </ol>
      )}

      {tab === 'context' && (
        <div className="space-y-6">
          {p.context ? <Paras text={p.context} /> : <p className="text-muted font-serif">No context notes yet.</p>}
          {ctx.length > 0 && <Section title="From the context library"><div className="grid gap-2 md:grid-cols-2">{ctx.map((c) => <Link key={c.id} to={`/context/${c.id}`} className="card p-3 hover:border-accent"><div className="eyebrow">{c.category}</div><div className="display text-lg">{c.title}</div><p className="text-sm text-muted">{c.summary}</p></Link>)}</div></Section>}
        </div>
      )}

      {tab === 'legacy' && (p.legacy ? <Paras text={p.legacy} /> : <p className="text-muted font-serif">No legacy notes yet.</p>)}

      {tab === 'interview' && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <Chat key={p.id} rules={rules} speaker={p.names.primary} placeholder={`Ask ${p.names.primary.split(' ')[0]} a question…`}
            intro={`An imaginative conversation with ${p.names.primary}, written by Claude from this profile and cited scripture. Treat it as a study aid, not as revelation or history.`}
            suggestions={[`What was the hardest moment of your life?`, `What did you understand about God that others missed?`, `What do you wish you had done differently?`, `Who shaped you most?`]} />
          <aside className="text-sm text-muted font-serif space-y-2">
            <p>Answers cite chapter and verse so you can check them. Hover any reference elsewhere in the atlas to read the KJV text.</p>
            <p>Questions use your own Claude account. Nothing is stored after you leave the page.</p>
          </aside>
        </div>
      )}
    </div>
  );
}

