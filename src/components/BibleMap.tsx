import { useEffect, useMemo, useRef, useState } from 'react';
import { geoMercator, geoPath, geoGraticule10 } from 'd3-geo';
import { zoom as d3zoom, zoomIdentity, type ZoomTransform } from 'd3-zoom';
import { select } from 'd3-selection';
import { motion } from 'framer-motion';
import land from '../generated/land.json';
import { placeById, placeLabel } from '../data';
import type { EmpireT, PlaceT } from '../schemas';
import { prefersReduced } from '../store';
import { t } from '../i18n';

export type MapRoute = { id: string; color: string; coords: [number, number][]; labels?: string[]; dashed?: boolean };
type Props = {
  routes?: MapRoute[];
  places?: PlaceT[];
  empires?: EmpireT[];
  highlight?: string | null;
  activeStop?: number | null;
  onPlace?: (id: string) => void;
  /** [W,S,E,N] the view should fit. Defaults to the bounds of routes/places, else the Levant. */
  focus?: [number, number, number, number];
  height?: number;
  label?: string;
  /** When set, place labels use the name current in that year. */
  year?: number;
};

const W = 1000;
const RIVERS: { name: string; c: [number, number][] }[] = [
  { name: 'Nile', c: [[31.2, 30.1], [31.3, 29], [30.9, 27.6], [31.4, 26.4], [32.6, 25.7], [32.9, 24.1], [32.8, 22.0], [31.0, 21.0], [30.6, 19.4], [32.5, 15.6]] },
  { name: 'Jordan', c: [[35.6, 33.2], [35.6, 32.9], [35.57, 32.7], [35.55, 32.3], [35.53, 31.9], [35.55, 31.76]] },
  { name: 'Euphrates', c: [[38.3, 39.2], [38.0, 37.5], [38.0, 36.8], [38.4, 36.0], [40.1, 35.3], [41.0, 34.4], [42.3, 33.6], [43.9, 32.6], [44.4, 32.5], [45.6, 31.4], [46.9, 31.0], [47.8, 30.6]] },
  { name: 'Tigris', c: [[39.8, 38.4], [41.2, 37.6], [42.4, 37.0], [43.1, 36.3], [43.6, 35.0], [44.4, 33.3], [45.6, 32.3], [46.8, 31.4], [47.8, 30.6]] },
];

export default function BibleMap({ routes = [], places = [], empires = [], highlight, activeStop, onPlace, focus, height = 520, label = t('Map of the biblical world'), year }: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const [zt, setT] = useState<ZoomTransform>(zoomIdentity);
  const zRef = useRef<ReturnType<typeof d3zoom<SVGSVGElement, unknown>> | null>(null);
  const H = Math.round((height / 640) * W * 0.64);

  const bounds = useMemo<[number, number, number, number]>(() => {
    if (focus) return focus;
    const pts = [...routes.flatMap((r) => r.coords), ...places.map((p) => p.coords)];
    if (!pts.length) return [29, 28.5, 39, 34.5];
    let [w, s, e, n] = [180, 90, -180, -90];
    pts.forEach(([x, y]) => { w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y); });
    const padX = Math.max(1.2, (e - w) * 0.15), padY = Math.max(1, (n - s) * 0.15);
    return [w - padX, s - padY, e + padX, n + padY];
  }, [focus, routes, places]);

  const projection = useMemo(() => {
    const [w, s, e, n] = bounds;
    return geoMercator().fitExtent([[20, 20], [W - 20, H - 20]], { type: 'MultiPoint', coordinates: [[w, s], [e, n]] } as any);
  }, [bounds, H]);
  const path = useMemo(() => geoPath(projection), [projection]);

  useEffect(() => {
    if (!svg.current) return;
    const z = d3zoom<SVGSVGElement, unknown>().scaleExtent([0.6, 12]).on('zoom', (ev) => setT(ev.transform));
    zRef.current = z;
    const sel = select(svg.current).call(z);
    sel.call(z.transform, zoomIdentity);
    return () => { sel.on('.zoom', null); };
  }, [bounds]);

  const P = (c: [number, number]) => projection(c) ?? [0, 0];
  const reduced = prefersReduced();
  const k = zt.k;

  return (
    <div className="relative card overflow-hidden" style={{ touchAction: 'none' }}>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block cursor-grab active:cursor-grabbing" role="img" aria-label={label}>
        <rect width={W} height={H} className="map-sea" />
        <g transform={zt.toString()}>
          <path d={path(geoGraticule10()) ?? ''} fill="none" stroke="rgb(var(--border))" strokeWidth={0.4 / k} strokeDasharray={`${2 / k} ${3 / k}`} />
          <path d={path(land as any) ?? ''} className="map-land" style={{ strokeWidth: 0.7 / k }} />
          {RIVERS.map((r) => <path key={r.name} d={path({ type: 'LineString', coordinates: r.c } as any) ?? ''} fill="none" stroke="rgb(var(--accent) / .55)" strokeWidth={1.4 / k} />)}
          {empires.map((em) => {
            const [cx, cy] = P(em.center);
            const edge = P([em.center[0] + em.radiusKm / 90, em.center[1]]);
            const r = Math.abs(edge[0] - cx);
            return (
              <g key={em.id}>
                <motion.circle cx={cx} cy={cy} initial={{ r: 0 }} animate={{ r }} transition={{ duration: reduced ? 0 : 0.6 }} fill="rgb(var(--accent-2) / .08)" stroke="rgb(var(--accent-2) / .5)" strokeWidth={1 / k} strokeDasharray={`${4 / k} ${3 / k}`} />
                <text x={cx} y={cy - r + 14 / k} textAnchor="middle" fontSize={13 / k} className="display" fill="rgb(var(--accent-2))" style={{ letterSpacing: '.12em' }}>{em.name.toUpperCase()}</text>
              </g>
            );
          })}
          {routes.map((r) => {
            const d = 'M' + r.coords.map((c) => P(c).join(',')).join('L');
            return (
              <g key={r.id}>
                <path d={d} fill="none" stroke="rgb(var(--bg))" strokeWidth={5 / k} strokeLinejoin="round" strokeLinecap="round" opacity={0.7} />
                <motion.path d={d} fill="none" stroke={r.color} strokeWidth={2.6 / k} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={r.dashed ? `${6 / k} ${4 / k}` : undefined}
                  initial={{ pathLength: reduced ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduced ? 0 : Math.min(6, 1 + r.coords.length * 0.35), ease: 'easeInOut' }} />
                {r.coords.map((c, i) => {
                  const [x, y] = P(c); const on = activeStop === i;
                  return (
                    <g key={i}>
                      <motion.circle cx={x} cy={y} r={(on ? 7 : 4.5) / k} fill={on ? r.color : 'rgb(var(--surface))'} stroke={r.color} strokeWidth={2 / k}
                        initial={{ scale: reduced ? 1 : 0 }} animate={{ scale: 1 }} transition={{ delay: reduced ? 0 : 0.3 + i * 0.3 }} />
                      <text x={x + 8 / k} y={y + 4 / k} fontSize={11 / k} fill="rgb(var(--muted))" className="tabular">{i + 1}</text>
                    </g>
                  );
                })}
              </g>
            );
          })}
          {places.map((p) => {
            const [x, y] = P(p.coords); const on = highlight === p.id;
            return (
              <g key={p.id} className="cursor-pointer" onClick={() => onPlace?.(p.id)} tabIndex={onPlace ? 0 : -1} role={onPlace ? 'button' : undefined} aria-label={placeLabel(p, year)}
                onKeyDown={(e) => { if (e.key === 'Enter') onPlace?.(p.id); }}>
                <circle cx={x} cy={y} r={(on ? 6 : p.type === 'region' ? 2.5 : 3.2) / k} fill={on ? 'rgb(var(--accent-2))' : 'rgb(var(--text))'} opacity={p.type === 'region' ? 0.45 : 0.85} />
                {on && <circle cx={x} cy={y} r={12 / k} fill="none" stroke="rgb(var(--accent-2))" strokeWidth={1.5 / k}><animate attributeName="r" values={`${8 / k};${16 / k};${8 / k}`} dur="2s" repeatCount="indefinite" /></circle>}
                {(on || k > 2.2 || places.length < 40) && (
                  <text x={x + 6 / k} y={y - 6 / k} fontSize={(on ? 15 : 11.5) / k} fill="rgb(var(--text))" className={on ? 'display' : ''} paintOrder="stroke" stroke="rgb(var(--bg))" strokeWidth={3 / k}>{placeLabel(p, year)}</text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
      <div className="absolute right-2 bottom-2 flex gap-1">
        <button className="btn !px-2 !py-1" aria-label={t('Zoom in')} onClick={() => svg.current && zRef.current && select(svg.current).call(zRef.current.scaleBy, 1.6)}>+</button>
        <button className="btn !px-2 !py-1" aria-label={t('Zoom out')} onClick={() => svg.current && zRef.current && select(svg.current).call(zRef.current.scaleBy, 1 / 1.6)}>−</button>
        <button className="btn !px-2 !py-1" aria-label={t('Reset view')} onClick={() => svg.current && zRef.current && select(svg.current).call(zRef.current.transform, zoomIdentity)}>⟲</button>
      </div>
    </div>
  );
}

export function routeFromPlaceIds(ids: string[]): [number, number][] {
  return ids.map((id) => placeById.get(id)?.coords).filter(Boolean) as [number, number][];
}
