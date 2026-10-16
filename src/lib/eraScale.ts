import { eras } from '../data';

/** Piecewise scale: each era gets width ∝ sqrt(duration), so short, crowded eras stay readable next to long ones. */
export function makeEraScale(width: number) {
  const ws = eras.map((e) => Math.sqrt(e.end - e.start));
  const total = ws.reduce((a, b) => a + b, 0);
  let acc = 0;
  const segs = eras.map((e, i) => { const x0 = (acc / total) * width; acc += ws[i]; return { era: e, x0, x1: (acc / total) * width }; });
  const x = (year: number) => {
    const s = segs.find((g) => year >= g.era.start && year <= g.era.end) ?? (year < eras[0].start ? segs[0] : segs[segs.length - 1]);
    const f = Math.max(0, Math.min(1, (year - s.era.start) / (s.era.end - s.era.start)));
    return s.x0 + f * (s.x1 - s.x0);
  };
  const invert = (px: number) => {
    const s = segs.find((g) => px >= g.x0 && px <= g.x1) ?? (px < 0 ? segs[0] : segs[segs.length - 1]);
    const f = Math.max(0, Math.min(1, (px - s.x0) / (s.x1 - s.x0)));
    return Math.round(s.era.start + f * (s.era.end - s.era.start));
  };
  return { x, invert, segs };
}
