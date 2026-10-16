import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { contextItems, debateById } from '../data';
import { PageHeader, Refs, Paras, PersonLink, Empty, Bookmark } from '../components/ui';

export default function Context() {
  const cats = [...new Set(contextItems.map((c) => c.category))];
  const [cat, setCat] = useState<string>('');
  const list = cat ? contextItems.filter((c) => c.category === cat) : contextItems;
  return (
    <div>
      <PageHeader eyebrow="Cultural context library" title="The World Behind the Text">Honour and shame, covenants, festivals, coins and cubits, Pharisees and Sadducees. Each entry links to the people, passages and debates it explains.</PageHeader>
      <div className="flex flex-wrap gap-1.5 mb-5"><button className={`btn !py-1 ${!cat ? 'btn-primary' : ''}`} onClick={() => setCat('')}>All</button>{cats.map((c) => <button key={c} className={`btn !py-1 ${cat === c ? 'btn-primary' : ''}`} onClick={() => setCat(c)}>{c}</button>)}</div>
      {!contextItems.length ? <Empty>The library is still being written.</Empty> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{list.map((c) => <Link key={c.id} to={`/context/${c.id}`} className="card p-4 hover:border-accent group"><div className="eyebrow">{c.category}</div><div className="display text-xl group-hover:text-accent">{c.title}</div><p className="text-sm font-serif text-muted mt-1">{c.summary}</p></Link>)}</div>
      )}
    </div>
  );
}

export function ContextPage() {
  const { id = '' } = useParams();
  const c = contextItems.find((x) => x.id === id);
  if (!c) return <Empty>No entry “{id}”. <Link className="text-accent" to="/context">Back to the library</Link>.</Empty>;
  return (
    <div>
      <div className="text-sm mb-3"><Link to="/context" className="text-muted hover:text-accent">← Context library</Link></div>
      <PageHeader eyebrow={c.category} title={c.title} actions={<Bookmark path={`/context/${c.id}`} />}>{c.summary}</PageHeader>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0"><Paras text={c.body} className="dropcap" /><div className="mt-5"><Refs refs={c.refs} /></div></div>
        <aside className="space-y-4">
          {c.facts?.length ? <div className="card p-4"><div className="eyebrow mb-2">At a glance</div><dl className="space-y-2 text-sm">{c.facts.map((f) => <div key={f.label}><dt className="font-semibold">{f.label}</dt><dd className="font-serif text-muted">{f.value}</dd></div>)}</dl></div> : null}
          {c.personIds.length > 0 && <div className="card p-4"><div className="eyebrow mb-2">People it illuminates</div><div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">{c.personIds.map((p) => <PersonLink key={p} id={p} />)}</div></div>}
          {c.debateIds.length > 0 && <div className="card p-4"><div className="eyebrow mb-2">Debates it bears on</div>{c.debateIds.filter((d) => debateById.has(d)).map((d) => <Link key={d} to={`/debates/${d}`} className="block text-sm hover:text-accent">{debateById.get(d)!.title}</Link>)}</div>}
        </aside>
      </div>
    </div>
  );
}
