import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { books, canonFormation, people } from '../data';
import { PageHeader, Section, Refs, DateWithConf, Paras, Empty, Bookmark } from '../components/ui';
import type { BookT, OutlineNodeT } from '../schemas';
import { useUI } from '../store';

const SECTIONS: [string, number, number][] = [
  ['Law', 0, 5], ['History', 5, 17], ['Wisdom & Poetry', 17, 22], ['Major Prophets', 22, 27], ['Minor Prophets', 27, 39],
  ['Gospels', 39, 43], ['Acts', 43, 44], ['Letters of Paul', 44, 57], ['Hebrews & General Letters', 57, 65], ['Revelation', 65, 66],
];

export default function Books() {
  return (
    <div>
      <PageHeader eyebrow="Sixty-six books" title="The Library">
        Each book shows traditional and critical-scholarship views of author and date side by side, its audience and purpose, and an animated outline.
      </PageHeader>
      {!books.length && <Empty>The book guides are still being written.</Empty>}
      {SECTIONS.map(([name, a, b]) => {
        const list = books.slice(a, b);
        if (!list.length) return null;
        return (
          <section key={name} className="mb-7">
            <h2 className="display text-2xl rubric mb-2">{name}</h2>
            <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              {list.map((bk, i) => (
                <motion.div key={bk.id} initial={{ opacity: 0.001, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                  <Link to={`/books/${bk.id}`} className="card p-3 h-full block hover:border-accent group relative overflow-hidden">
                    <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: `rgb(var(--${bk.testament === 'OT' ? 'ot' : 'nt'}))` }} />
                    <div className="display text-lg leading-tight group-hover:text-accent">{bk.name}</div>
                    <div className="text-xs text-muted">{bk.genre}</div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        );
      })}
      {canonFormation && (
        <Section title="How the canon formed">
          <Outline nodes={canonFormation.outline} root="Canon" />
          {canonFormation.canonNote && <Paras text={canonFormation.canonNote} className="mt-4" />}
        </Section>
      )}
    </div>
  );
}

function Outline({ nodes, root }: { nodes: OutlineNodeT[]; root: string }) {
  const reduced = useUI((s) => s.reducedMotion);
  return (
    <div className="flex flex-col items-center">
      <div className="card px-4 py-2 display text-xl border-accent2 border-2">{root}</div>
      <motion.div className="w-0.5 h-5 bg-accent2" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} />
      <div className="relative w-full">
        <div className="hidden md:block absolute left-[8%] right-[8%] top-0 h-0.5 bg-accent2/60" />
        <div className="grid gap-3 md:pt-5" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${nodes.length > 5 ? 150 : 190}px, 1fr))` }}>
          {nodes.map((n, i) => (
            <motion.div key={i} className="card p-3 relative" initial={{ opacity: 0.001, y: reduced ? 0 : 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduced ? 0 : 0.15 + i * 0.12 }}>
              <span className="hidden md:block absolute -top-5 left-1/2 w-0.5 h-5 bg-accent2/60" />
              <div className="flex gap-2 items-baseline"><span className="display text-xl rubric tabular">{i + 1}</span><span className="font-semibold leading-tight">{n.title}</span></div>
              <div className="mt-1"><Refs refs={n.refs} max={2} /></div>
              {n.children?.length ? <ul className="mt-2 space-y-1.5 border-l border-line pl-2.5">{n.children.map((c, j) => <motion.li key={j} className="text-sm font-serif" initial={{ opacity: 0.001 }} animate={{ opacity: 1 }} transition={{ delay: reduced ? 0 : 0.4 + i * 0.12 + j * 0.05 }}>{c.title} {c.refs.length > 0 && <span className="text-muted text-xs">{c.refs[0]}</span>}</motion.li>)}</ul> : null}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BookPage() {
  const { id = '' } = useParams();
  const i = books.findIndex((b) => b.id === id);
  const b: BookT | undefined = books[i];
  if (!b) return <Empty>No book with the id “{id}”. <Link to="/books" className="text-accent">See the library</Link>.</Empty>;
  const cast = people.filter((p) => p.books?.includes(b.abbr)).slice(0, 30);
  return (
    <div>
      <div className="text-sm mb-3 flex justify-between"><Link to="/books" className="text-muted hover:text-accent">← Library</Link>
        <span className="flex gap-3">{books[i - 1] && <Link className="text-muted hover:text-accent" to={`/books/${books[i - 1].id}`}>← {books[i - 1].name}</Link>}{books[i + 1] && <Link className="text-muted hover:text-accent" to={`/books/${books[i + 1].id}`}>{books[i + 1].name} →</Link>}</span></div>
      <PageHeader eyebrow={`${b.testament === 'OT' ? 'Old' : 'New'} Testament · ${b.genre}`} title={b.name} actions={<Bookmark path={`/books/${b.id}`} />}>{b.purpose}</PageHeader>
      <div className="grid gap-3 md:grid-cols-2 mb-6">
        <div className="card p-4"><div className="eyebrow mb-1">Authorship: traditional view</div><p className="font-serif">{b.authorship.traditional}</p></div>
        <div className="card p-4"><div className="eyebrow mb-1">Authorship: critical scholarship</div><p className="font-serif">{b.authorship.scholarly ?? 'Broadly agrees with the traditional view.'}</p></div>
        <div className="card p-4"><div className="eyebrow mb-1">Date</div><DateWithConf d={b.date} /></div>
        <div className="card p-4"><div className="eyebrow mb-1">Audience & setting</div><p className="font-serif">{b.audience}. {b.setting}</p></div>
      </div>
      <Section title="Outline"><Outline nodes={b.outline} root={b.name} /></Section>
      <Section title="Themes"><div className="flex flex-wrap gap-2">{b.themes.map((t) => <span key={t} className="chip !text-sm !py-1 !whitespace-normal">{t}</span>)}</div></Section>
      <Section title="Key verses"><Refs refs={b.keyRefs} /></Section>
      <Section title="Place in the whole story"><Paras text={b.bigStory} /></Section>
      {b.canonNote && <Section title="Canon note"><Paras text={b.canonNote} /></Section>}
      {cast.length > 0 && <Section title="People in this book"><div className="flex flex-wrap gap-1.5">{cast.map((p) => <Link key={p.id} to={`/people/${p.id}`} className="chip hover:border-accent">{p.names.primary}</Link>)}</div></Section>}
    </div>
  );
}
