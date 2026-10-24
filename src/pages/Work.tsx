import { occupations, giftsLists } from '../data';
import { PageHeader, Section, Refs, PersonLink, Empty } from '../components/ui';
import { t } from '../i18n';

export default function Work() {
  const trades = occupations.filter((o) => o.kind === 'trade');
  const ministries = occupations.filter((o) => o.kind === 'ministry');
  const allGifts = [...new Set(giftsLists.flatMap((g) => g.gifts.map((x) => x.toLowerCase())))];
  const card = (o: (typeof occupations)[number]) => (
    <article key={o.id} id={o.id} className="card p-4 scroll-mt-20">
      <h3 className="display text-2xl">{o.name}</h3>
      <p className="font-serif mt-1">{o.summary}</p>
      <dl className="mt-2 grid gap-1 text-sm">
        <div><dt className="eyebrow inline mr-1.5">{t('Status')}</dt><dd className="inline">{o.status}</dd></div>
        {o.tools.length > 0 && <div><dt className="eyebrow inline mr-1.5">{t('Tools')}</dt><dd className="inline">{o.tools.join(', ')}</dd></div>}
        {o.personIds.length > 0 && <div><dt className="eyebrow inline mr-1.5">{t('Who did it')}</dt><dd className="inline">{o.personIds.map((id, i) => <span key={id}>{i ? ', ' : ''}<PersonLink id={id} /></span>)}</dd></div>}
      </dl>
      {o.teaching.length > 0 && <div className="mt-2 border-t border-line pt-2 space-y-1.5">{o.teaching.map((tc, i) => <div key={i} className="text-sm"><span className="font-serif">{tc.text}</span> <Refs refs={tc.refs} max={2} /></div>)}</div>}
    </article>
  );
  return (
    <div>
      <PageHeader eyebrow={t('Occupations & ministries')} title={t('Work in the Biblical World')}>
        {t('What shepherds, fishermen, scribes, tentmakers and tax collectors actually did, how they were regarded, and how their work became the language of parables. Then the ministries, and the gift lists compared.')}
      </PageHeader>
      {!occupations.length && <Empty>{t('This section is still being written.')}</Empty>}
      {trades.length > 0 && <Section title={t('Trades')}><div className="grid gap-3 md:grid-cols-2">{trades.map(card)}</div></Section>}
      {ministries.length > 0 && <Section title={t('Ministries & offices')}><div className="grid gap-3 md:grid-cols-2">{ministries.map(card)}</div></Section>}
      {giftsLists.length > 0 && (
        <Section title={t('The gift lists, side by side')}>
          <div className="scroll-x">
            <table className="min-w-[720px] w-full text-sm border-separate border-spacing-1">
              <thead><tr><th className="text-left eyebrow">{t('Gift')}</th>{giftsLists.map((g) => <th key={g.id} className="text-left font-normal align-bottom"><div className="font-serif font-semibold">{g.ref}</div></th>)}</tr></thead>
              <tbody>{allGifts.map((gift) => <tr key={gift}><td className="pr-2 capitalize">{gift}</td>{giftsLists.map((g) => <td key={g.id} className="text-center">{g.gifts.some((x) => x.toLowerCase() === gift) ? <span className="inline-block w-3 h-3 rounded-full bg-accent2" aria-label={t('listed')} /> : <span className="text-line">·</span>}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <div className="grid gap-2 md:grid-cols-2 mt-4">{giftsLists.map((g) => <div key={g.id} className="card p-3 text-sm"><Refs refs={[g.ref]} /> <span className="font-serif">{g.context}</span></div>)}</div>
        </Section>
      )}
    </div>
  );
}
