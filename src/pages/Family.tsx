import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { hierarchy, tree, type HierarchyPointNode } from 'd3-hierarchy';
import { zoom as d3zoom, zoomIdentity, type ZoomTransform } from 'd3-zoom';
import { select } from 'd3-selection';
import { motion } from 'framer-motion';
import { childrenOf, personById, people } from '../data';
import { PageHeader, Refs, Section } from '../components/ui';

type N = { id: string; children?: N[] };
const LINES: Record<string, { label: string; ids: string[] }> = {
  messianic: { label: 'Messianic line', ids: ['adam', 'seth', 'enoch', 'methuselah', 'noah', 'shem', 'terah', 'abraham', 'isaac', 'jacob', 'judah', 'boaz', 'obed', 'jesse', 'david', 'solomon', 'rehoboam', 'jehoshaphat', 'uzziah', 'hezekiah', 'manasseh-king', 'josiah', 'zerubbabel', 'joseph-of-nazareth', 'mary-mother-of-jesus', 'jesus'] },
  levitical: { label: 'Levitical / priestly line', ids: ['jacob', 'levi', 'amram', 'aaron', 'moses', 'miriam', 'eleazar-priest', 'phinehas', 'zechariah-priest', 'john-the-baptist', 'elizabeth'] },
  royal: { label: 'House of David', ids: ['jesse', 'david', 'solomon', 'absalom', 'rehoboam', 'jehoshaphat', 'joash-judah', 'uzziah', 'hezekiah', 'manasseh-king', 'josiah', 'zedekiah', 'zerubbabel'] },
};

function build(root: string, collapsed: Set<string>): N {
  const seen = new Set<string>();
  const go = (id: string, depth: number): N => {
    seen.add(id);
    const kids = depth > 40 || collapsed.has(id) ? [] : [...(childrenOf.get(id) ?? [])].filter((c) => !seen.has(c));
    return { id, children: kids.length ? kids.map((c) => go(c, depth + 1)) : undefined };
  };
  return go(root, 0);
}

export default function Family() {
  const [sp, setSp] = useSearchParams();
  const roots = useMemo(() => people.filter((p) => childrenOf.has(p.id)).sort((a, b) => a.names.primary.localeCompare(b.names.primary)), []);
  const root = sp.get('root') && personById.has(sp.get('root')!) ? sp.get('root')! : personById.has('adam') ? 'adam' : roots[0]?.id;
  const [line, setLine] = useState<keyof typeof LINES | ''>('messianic');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [t, setT] = useState<ZoomTransform>(zoomIdentity);
  const zRef = useRef<ReturnType<typeof d3zoom<SVGSVGElement, unknown>> | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const data = useMemo(() => (root ? build(root, collapsed) : null), [root, collapsed]);
  const layout = useMemo(() => {
    if (!data) return null;
    const h = hierarchy(data);
    return tree<N>().nodeSize([34, 170])(h);
  }, [data]);
  const nodes = layout ? layout.descendants() : [];
  const links = layout ? layout.links() : [];
  const minX = Math.min(0, ...nodes.map((n) => n.x)), maxX = Math.max(0, ...nodes.map((n) => n.x));
  const maxY = Math.max(0, ...nodes.map((n) => n.y));
  const W = maxY + 260, H = maxX - minX + 80;
  const VW = 1100, VH = 560;
  // Start fitted to the tree, but never so small that names become unreadable; the reader can pan from there.
  const fit = () => { const k = Math.max(0.55, Math.min(1, VW / W, VH / H)); return zoomIdentity.translate(10, Math.max(0, (VH - H * k) / 2)).scale(k); };
  const hl = line ? new Set(LINES[line].ids) : new Set<string>();
  useEffect(() => {
    if (!svg.current) return;
    const z = d3zoom<SVGSVGElement, unknown>().scaleExtent([0.2, 3]).on('zoom', (e) => setT(e.transform));
    zRef.current = z;
    select(svg.current).call(z).call(z.transform, fit());
    return () => { select(svg.current!).on('.zoom', null); };
  }, [root, W, H]);
  const toggle = (id: string) => setCollapsed((c) => { const n = new Set(c); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const P = (n: HierarchyPointNode<N>) => ({ x: n.y + 30, y: n.x - minX + 40 });

  const renderList = (n: N, d = 0): JSX.Element => (
    <li key={n.id + d}><Link to={`/people/${n.id}`} className={`hover:text-accent ${hl.has(n.id) ? 'rubric font-semibold' : ''}`}>{personById.get(n.id)?.names.primary}</Link>
      {n.children && <ul className="pl-4 border-l border-line ml-1">{n.children.map((c) => renderList(c, d + 1))}</ul>}</li>
  );

  return (
    <div>
      <PageHeader eyebrow="Genealogy explorer" title="Family Trees">
        Built from every parent–child link in the atlas. Drag to pan and scroll to zoom. Click a dot to fold or unfold its branch; click a name to open the profile. Generations the text skips are joined directly.
      </PageHeader>
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <label className="eyebrow" htmlFor="fam-root">Start from</label>
        <select id="fam-root" className="input !w-auto" value={root} onChange={(e) => { setCollapsed(new Set()); setSp({ root: e.target.value }); }}>
          {roots.map((p) => <option key={p.id} value={p.id}>{p.names.primary}</option>)}
        </select>
        <span className="eyebrow ml-2">Highlight</span>
        {(Object.keys(LINES) as (keyof typeof LINES)[]).map((k) => <button key={k} className={`btn !py-1 ${line === k ? 'btn-primary' : ''}`} onClick={() => setLine(line === k ? '' : k)}>{LINES[k].label}</button>)}
        <button className="btn !py-1" onClick={() => svg.current && zRef.current && select(svg.current).call(zRef.current.transform, fit())}>Reset view</button>
      </div>
      {data && (
        <>
          <div className="card overflow-hidden hidden md:block">
            <svg ref={svg} viewBox={`0 0 ${VW} ${VH}`} className="w-full h-auto block touch-none cursor-grab" role="img" aria-label="Family tree; a nested list follows for screen readers">
              <g transform={t.toString()}>
                {links.map((l, i) => {
                  const a = P(l.source), b = P(l.target); const on = hl.has(l.source.data.id) && hl.has(l.target.data.id);
                  return <motion.path key={l.target.data.id + i} d={`M${a.x},${a.y}C${(a.x + b.x) / 2},${a.y} ${(a.x + b.x) / 2},${b.y} ${b.x},${b.y}`} fill="none"
                    stroke={on ? 'rgb(var(--accent-2))' : 'rgb(var(--border))'} strokeWidth={on ? 2.5 : 1.2} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: l.target.depth * 0.04 }} />;
                })}
                {nodes.map((n) => {
                  const { x, y } = P(n); const p = personById.get(n.data.id)!; const has = childrenOf.has(n.data.id); const folded = collapsed.has(n.data.id); const on = hl.has(n.data.id);
                  return (
                    <motion.g key={n.data.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: n.depth * 0.04 }}>
                      <circle cx={x} cy={y} r={6} fill={folded ? 'rgb(var(--accent))' : on ? 'rgb(var(--accent-2))' : 'rgb(var(--surface))'} stroke={on ? 'rgb(var(--accent-2))' : 'rgb(var(--muted))'} strokeWidth={1.5}
                        className={has ? 'cursor-pointer' : ''} onClick={() => has && toggle(n.data.id)} role={has ? 'button' : undefined} aria-label={has ? `${folded ? 'Unfold' : 'Fold'} ${p.names.primary}` : undefined} />
                      <Link to={`/people/${n.data.id}`}>
                        <text x={x + 10} y={y + 4} fontSize={13} fill={on ? 'rgb(var(--accent-2))' : 'rgb(var(--text))'} fontWeight={on ? 600 : 400} paintOrder="stroke" stroke="rgb(var(--bg))" strokeWidth={3} className="hover:underline">{p.names.primary}{folded ? ' …' : ''}</text>
                      </Link>
                    </motion.g>
                  );
                })}
              </g>
            </svg>
          </div>
          <ul className="md:hidden card p-4 text-[.95rem] space-y-1">{renderList(data)}</ul>
        </>
      )}
      <Section title="Why Matthew and Luke give different genealogies">
        <div className="grid gap-4 md:grid-cols-2 prose-serif !max-w-none">
          <div className="card p-4"><div className="eyebrow mb-1">What the text shows</div><p>Matthew traces Jesus from Abraham through David and Solomon, arranged in three sets of fourteen (Matt 1:17). Luke runs backward from Jesus to Adam, passing through David’s son Nathan rather than Solomon (Luke 3:31). The two lists agree from Abraham to David and meet again at Shealtiel and Zerubbabel.</p><div className="mt-2"><Refs refs={['Matt 1:1-17', 'Luke 3:23-38']} /></div></div>
          <div className="card p-4"><div className="eyebrow mb-1">Main explanations</div><ul className="list-disc pl-5 space-y-1.5"><li><b>Mary’s line in Luke:</b> Luke gives Mary’s ancestry, with Heli as Joseph’s father-in-law (a view dating to the Reformation era, held by many evangelicals).</li><li><b>Levirate marriage:</b> Julius Africanus (c. 220, cited by Eusebius, <i>Church History</i> 1.7) proposed that Heli and Jacob were half-brothers, one legal and one natural father.</li><li><b>Royal vs natural descent:</b> Matthew gives the legal royal succession, Luke the physical descent.</li><li><b>Theological arrangement:</b> many critical scholars see each list as shaped for its Gospel’s purpose rather than as archival records.</li></ul></div>
        </div>
      </Section>
    </div>
  );
}
