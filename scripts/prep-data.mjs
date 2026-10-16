// Generates compact data the app embeds: KJV text and a clipped land outline for the Bible-lands map.
import { readFileSync, writeFileSync } from 'node:fs';
import { feature } from 'topojson-client';

const kjv = JSON.parse(readFileSync('data-src/kjv.json', 'utf8').replace(/^﻿/, ''));
writeFileSync('src/generated/kjv.json', JSON.stringify(kjv.map((b) => b.chapters)));

const topo = JSON.parse(readFileSync('node_modules/world-atlas/land-50m.json', 'utf8'));
const land = feature(topo, topo.objects.land);
const [W, S, E, N] = [-12, 2, 66, 50];
const r = (n) => Math.round(n * 100) / 100;
const polys = [];
for (const g of land.features) {
  const list = g.geometry.type === 'Polygon' ? [g.geometry.coordinates] : g.geometry.coordinates;
  for (const poly of list) {
    const ring = poly[0];
    if (!ring.some(([x, y]) => x >= W && x <= E && y >= S && y <= N)) continue;
    // keep rings, light thinning: drop points closer than 0.03° to the previous kept point
    const out = poly.map((rg) => { const k = []; let p = null; for (const [x, y] of rg) { if (!p || Math.hypot(x - p[0], y - p[1]) > 0.03) { k.push([r(x), r(y)]); p = [x, y]; } } if (k.length > 2) k.push(k[0]); return k; }).filter((k) => k.length > 3);
    if (out.length) polys.push(out);
  }
}
writeFileSync('src/generated/land.json', JSON.stringify({ type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates: polys } }));
console.log('land polys', polys.length);
