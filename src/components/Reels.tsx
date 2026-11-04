/** Animated explainer "reels": short motion-graphics stories built from SVG + framer-motion (no video files).
 *  Each reel is a list of scenes (caption + refs) and one `Art` component that draws the stage for scene `s`.
 *  The art stays mounted across scenes so shapes move, morph and draw from one scene into the next. */
import { createContext, memo, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { Refs } from './ui';
import { t, isTa, fmtYear } from '../i18n';
import { prefersReduced } from '../store';

export type ReelId = 'big-story' | 'how-we-got-it' | 'jesus-lens' | 'the-chain' | 'reading-well' | 'covenant-thread';

/* ───────────────────────────── shared helpers ───────────────────────────── */

type Scene = { label: string; caption: string; refs?: string[] };
type ArtProps = { s: number; r: boolean };
type ReelDef = { title: string; blurb: string; minutes: number; scenes: Scene[]; Art: (p: ArtProps) => JSX.Element; Thumb: (p: { r: boolean }) => JSX.Element };

const SCENE_MS = 6800;
const col = (n: string, a = 1) => `rgb(var(--${n}) / ${a})`;
const room = (a = 1) => `rgb(var(--room, var(--accent)) / ${a})`;
const PAL = ['accent', 'nt', 'ot', 'accent-2', 'good', 'warn'];
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const T = (r: boolean, duration = 0.7, delay = 0) => (r ? { duration: 0 } : { duration, delay, ease: EASE });
const LOOP = (r: boolean, duration: number, delay = 0) => (r ? { duration: 0 } : { duration, delay, repeat: Infinity, ease: 'easeInOut' as const });
const rnd = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const STAGE_BG = 'radial-gradient(120% 95% at 12% 0%, rgb(var(--room, var(--accent)) / .16), transparent 55%), radial-gradient(90% 80% at 100% 100%, rgb(var(--accent-2) / .12), transparent 60%), linear-gradient(165deg, rgb(var(--surface)), rgb(var(--sunk)))';

/** Unique ids for gradients/filters, so several reels can share a page. */
const IdCtx = createContext('reel');
const useUrl = () => { const p = useContext(IdCtx); return (n: string) => `url(#${p}-${n})`; };

function Defs({ p, w = 960 }: { p: string; w?: number }) {
  return (
    <defs>
      <filter id={`${p}-glow`} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation={w / 160} result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      <filter id={`${p}-soft`} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation={w / 110} /></filter>
      <filter id={`${p}-shadow`} x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy={w / 90} stdDeviation={w / 70} floodColor="#000" floodOpacity=".13" /></filter>
      <linearGradient id={`${p}-story`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={w} y2="0">
        <stop offset="0" style={{ stopColor: col('ot') }} /><stop offset=".6" style={{ stopColor: col('accent-2') }} /><stop offset=".75" style={{ stopColor: col('accent') }} /><stop offset="1" style={{ stopColor: col('nt') }} />
      </linearGradient>
      <linearGradient id={`${p}-gold`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={w} y2="0">
        <stop offset="0" style={{ stopColor: col('gold', 0.75) }} /><stop offset=".5" style={{ stopColor: col('warn') }} /><stop offset="1" style={{ stopColor: col('gold') }} />
      </linearGradient>
      <radialGradient id={`${p}-light`}>
        <stop offset="0" style={{ stopColor: '#fff', stopOpacity: 0.95 }} /><stop offset=".3" style={{ stopColor: room(), stopOpacity: 0.55 }} /><stop offset="1" style={{ stopColor: room(), stopOpacity: 0 }} />
      </radialGradient>
      <radialGradient id={`${p}-halo`}>
        <stop offset="0" style={{ stopColor: col('gold'), stopOpacity: 0.5 }} /><stop offset="1" style={{ stopColor: col('gold'), stopOpacity: 0 }} />
      </radialGradient>
    </defs>
  );
}

/** Word-wrapped SVG text (a rough width estimate is enough at these sizes, and works in every browser). */
function wrap(s: string, w: number, size: number): string[] {
  const max = Math.max(4, Math.floor(w / (size * (isTa ? 0.43 : 0.53))));
  const lines: string[] = []; let cur = '';
  for (const word of s.split(' ')) {
    if (!cur) cur = word; else if ((cur + ' ' + word).length <= max) cur += ' ' + word; else { lines.push(cur); cur = word; }
  }
  if (cur) lines.push(cur);
  return lines;
}
type TxtProps = { x: number; y: number; w?: number; size?: number; weight?: number; fill?: string; anchor?: 'start' | 'middle' | 'end'; serif?: boolean; italic?: boolean; halo?: boolean; children: string };
function Txt({ x, y, w = 200, size = 16, weight = 600, fill = col('text'), anchor = 'middle', serif, italic, halo = true, children }: TxtProps) {
  const lines = wrap(children, w, size); const lh = size * 1.22;
  const y0 = y - ((lines.length - 1) * lh) / 2;
  return (
    <text x={x} y={y0} fontSize={size} fontWeight={weight} fill={fill} textAnchor={anchor} dominantBaseline="middle" fontStyle={italic ? 'italic' : undefined}
      className={serif ? 'font-serif' : undefined} style={halo ? { paintOrder: 'stroke', stroke: col('surface', 0.8), strokeWidth: size * 0.3, strokeLinejoin: 'round' } : undefined}>
      {lines.map((l, i) => <tspan key={i} x={x} dy={i ? lh : 0}>{l}</tspan>)}
    </text>
  );
}

/** Line icons on a 24-unit grid. */
const IC = {
  sun: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3 7 7M17 17l1.7 1.7M5.3 18.7 7 17M17 7l1.7-1.7',
  fruit: 'M12 7.5C9 5.5 5 7 5 12c0 4.5 3 8.5 7 7.5 4 1 7-3 7-7.5 0-5-4-6.5-7-4.5zM12 7.5c0-2 1-4 3-4.5',
  star: 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4l-5.3 3 1.2-6-4.5-4.1 6-.7z',
  tablets: 'M4 20V8.5a3.5 3.5 0 0 1 7 0V20zM13 20V8.5a3.5 3.5 0 0 1 7 0V20zM6.5 11.5h2M6.5 14.5h2M15.5 11.5h2M15.5 14.5h2',
  crown: 'M3.5 18.5h17M4.5 18.5 3 8l5 4 4-7 4 7 5-4-1.5 10.5',
  river: 'M3 9c3-3 6 3 9 0s6 3 9 0M3 15c3-3 6 3 9 0s6 3 9 0',
  lamp: 'M8 14h8l-1 6H9zM12 14v-3M12 11c-2-1.5-1.5-4 0-7 1.5 3 2 5.5 0 7z',
  cross: 'M12 3v18M6.5 8.5h11',
  flame: 'M12 21c-3.6 0-6-2.6-6-5.8C6 11 10 9.5 10 5c2 1.5 3.2 3.2 3.2 5.4 1-.8 1.4-1.8 1.4-3 2.2 2 3.4 4.6 3.4 7.8 0 3.2-2.4 5.8-6 5.8z',
  tree: 'M12 21v-7M12 14c-3.5 0-6-2.2-6-5.2a6 6 0 0 1 12 0c0 3-2.5 5.2-6 5.2zM9 21h6',
  heart: 'M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.2 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z',
  cup: 'M6 4h12c0 6-2.5 9-6 9s-6-3-6-9zM12 13v5M8 20h8',
  globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM3 12h18M12 3c2.5 2.7 3.6 5.7 3.6 9s-1.1 6.3-3.6 9M12 3c-2.5 2.7-3.6 5.7-3.6 9s1.1 6.3 3.6 9',
  rainbow: 'M3 18a9 9 0 0 1 18 0M6.5 18a5.5 5.5 0 0 1 11 0M10 18a2 2 0 0 1 4 0',
  scroll: 'M7 4h11a2 2 0 0 1 2 2v1h-4M7 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7M7 4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2M12 9h4M12 12h4M12 15h3',
  book: 'M4 5.5C6.5 4 9.5 4 12 6c2.5-2 5.5-2 8-.5V19c-2.5-1.5-5.5-1.5-8 .5-2.5-2-5.5-2-8-.5zM12 6v13.5',
  people: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5M16 11a2.5 2.5 0 1 0 0-5M17.5 14.6c1.9.6 3 2.6 3 5.4',
  ear: 'M7 9a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-6 0M10 9a2 2 0 0 1 4 0',
  press: 'M5 3h14M8 3v4h8V3M12 7v3M6 10h12v3H6zM4 21h16M6 13v8M18 13v8',
  lang: 'M4 5h8M8 3v2M6 5c0 4 2 7 6 8M10 5c0 3-2 6-6 8M13 21l4-9 4 9M14.5 18h5',
  hands: 'M3 13c2 0 4 1 5 3h5a2 2 0 0 1 0 4H8M3 20h3l8 1 7-4a1.6 1.6 0 0 0-2-2.5l-5 2.5M7 10V5.5a1.5 1.5 0 0 1 3 0V10M10 9V4a1.5 1.5 0 0 1 3 0v5',
  stack: 'M12 3 3 8l9 5 9-5zM3 12.5l9 5 9-5M3 16.5l9 5 9-5',
  seal: 'M12 3l2 2.5 3-.6.6 3 2.6 1.6-1.4 2.7 1.4 2.7-2.6 1.6-.6 3-3-.6L12 21l-2-2.5-3 .6-.6-3-2.6-1.6 1.4-2.7-1.4-2.7 2.6-1.6.6-3 3 .6z',
};
function Icon({ d, x, y, size = 24, color = 'currentColor', w = 1.8, fill = 'none' }: { d: string; x: number; y: number; size?: number; color?: string; w?: number; fill?: string }) {
  const k = size / 24;
  return <path d={d} transform={`translate(${x - size / 2} ${y - size / 2}) scale(${k})`} fill={fill} stroke={color} strokeWidth={w / k} strokeLinecap="round" strokeLinejoin="round" />;
}

/* Smooth paths through points (Catmull-Rom → cubic Bézier), and sampling along them. */
type Pt = [number, number];
type Seg = [Pt, Pt, Pt, Pt];
function segs(p: Pt[]): Seg[] {
  const out: Seg[] = [];
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] ?? p2;
    out.push([p1, [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6], p2]);
  }
  return out;
}
const segD = (g: Seg) => `M${g[0]} C${g[1]} ${g[2]} ${g[3]}`;
const fullD = (ss: Seg[]) => (ss.length ? `M${ss[0][0]}` + ss.map((g) => ` C${g[1]} ${g[2]} ${g[3]}`).join('') : '');
const scaleSegs = (ss: Seg[], k: number): Seg[] => ss.map((g) => g.map(([x, y]) => [x * k, y * k]) as Seg);
const stopPt = (ss: Seg[], i: number): Pt => (i === 0 ? ss[0][0] : ss[i - 1][3]);
function bez([a, b, c, d]: Seg, u: number): Pt {
  const v = 1 - u, k0 = v * v * v, k1 = 3 * v * v * u, k2 = 3 * v * u * u, k3 = u * u * u;
  return [k0 * a[0] + k1 * b[0] + k2 * c[0] + k3 * d[0], k0 * a[1] + k1 * b[1] + k2 * c[1] + k3 * d[1]];
}
const eio = (u: number) => -(Math.cos(Math.PI * u) - 1) / 2;
/** Keyframes that glide (eased) from stop `a` to stop `b` along the path, in either direction. */
function along(ss: Seg[], a: number, b: number, k = 18): { x: number[]; y: number[] } {
  if (a === b) { const p = stopPt(ss, b); return { x: [p[0]], y: [p[1]] }; }
  const n = Math.abs(b - a), N = n * k, x: number[] = [], y: number[] = [];
  for (let j = 0; j <= N; j++) {
    const pos = b > a ? a + eio(j / N) * n : a - eio(j / N) * n;
    const i = Math.min(ss.length - 1, Math.floor(pos));
    const p = bez(ss[i], Math.min(1, pos - i)); x.push(p[0]); y.push(p[1]);
  }
  return { x, y };
}
const travelTime = (r: boolean, n: number) => (r || !n ? 0 : Math.min(2.4, 0.9 + 0.45 * n));
function usePrev<V>(v: V): V { const ref = useRef(v); const p = ref.current; useEffect(() => { ref.current = v; }, [v]); return p; }

/** The lit part of a path, drawn segment by segment in step with the travelling light. */
function Trail({ ss, at, r, stroke, width = 5, filter, opacity = 1 }: { ss: Seg[]; at: number; r: boolean; stroke: string; width?: number; filter?: string; opacity?: number }) {
  const from = usePrev(at);
  const plan = useMemo(() => ({ from, D: travelTime(r, Math.abs(at - from)) }), [at]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <g filter={filter} opacity={opacity}>
      {ss.map((g, i) => {
        const lit = i < at; let delay = 0, dur = r ? 0 : 0.4;
        const n = Math.abs(at - plan.from);
        if (plan.D && at > plan.from && i >= plan.from && i < at) { dur = plan.D / n; delay = (i - plan.from) * dur; }
        else if (plan.D && at < plan.from && i >= at && i < plan.from) { dur = plan.D / n; delay = (plan.from - 1 - i) * dur; }
        return (
          <motion.path key={i} d={segD(g)} fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" initial={false}
            animate={{ pathLength: lit ? 1 : 0, opacity: lit ? 1 : 0 }}
            transition={{ pathLength: { duration: dur, delay, ease: 'linear' }, opacity: { duration: r ? 0 : 0.15, delay: lit ? delay : delay + dur } }} />
        );
      })}
    </g>
  );
}
/** A soft light that glides along the path to stop `at`. */
function Traveller({ ss, at, r, size = 1 }: { ss: Seg[]; at: number; r: boolean; size?: number }) {
  const from = usePrev(at); const url = useUrl();
  const plan = useMemo(() => ({ path: along(ss, from, at), D: travelTime(r, Math.abs(at - from)) }), [at]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <motion.g initial={false} animate={{ x: plan.path.x, y: plan.path.y }} transition={{ duration: plan.D, ease: 'linear' }} style={{ pointerEvents: 'none' }}>
      <motion.circle r={34 * size} fill={url('light')} animate={r ? undefined : { scale: [1, 1.18, 1] }} transition={LOOP(r, 2.4)} />
      <circle r={5 * size} fill="#fff" />
    </motion.g>
  );
}

/** Slow drifting motes that give every stage a little life. */
function Ambient({ r, w = 960, h = 540, n = 18 }: { r: boolean; w?: number; h?: number; n?: number }) {
  const dots = useMemo(() => Array.from({ length: n }, (_, i) => ({ x: rnd(i * 3) * w, y: rnd(i * 3 + 1) * h, s: (1 + rnd(i * 3 + 2) * 2.2) * (w / 960), d: 7 + rnd(i + 9) * 8 })), [n, w, h]);
  return (
    <g aria-hidden>
      {dots.map((d, i) => (
        <motion.circle key={i} cx={d.x} cy={d.y} r={d.s} fill={room(0.5)} initial={{ opacity: 0.2 }}
          animate={r ? { opacity: 0.2 } : { y: [0, -h * 0.05, 0], opacity: [0.12, 0.5, 0.12] }} transition={LOOP(r, d.d, -i)} />
      ))}
    </g>
  );
}

/** Scene title drawn on the stage, cross-fading between scenes. */
function Headline({ text, r, x = 56, y = 64, size = 30, anchor = 'start', w = 520 }: { text: string; r: boolean; x?: number; y?: number; size?: number; anchor?: 'start' | 'middle'; w?: number }) {
  return (
    <AnimatePresence initial={false}>
      <motion.g key={text} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10, transition: { duration: r ? 0 : 0.3 } }} transition={T(r, 0.7, 0.15)}>
        <Txt x={x} y={y} size={size} w={w} anchor={anchor} serif weight={700} halo={false}>{text}</Txt>
      </motion.g>
    </AnimatePresence>
  );
}

/** A small tag under an illustration. */
const Tag = ({ x, y, children, w = 360 }: { x: number; y: number; children: string; w?: number }) => <Txt x={x} y={y} size={18} w={w} serif italic weight={600} fill={col('muted')}>{children}</Txt>;

/** Fade/rise a group in, optionally after a delay. */
function In({ children, r, delay = 0, y = 14, scale }: { children: ReactNode; r: boolean; delay?: number; y?: number; scale?: number }) {
  return <motion.g initial={{ opacity: 0, y, scale: scale ?? 1 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={T(r, 0.7, delay)}>{children}</motion.g>;
}
/** A path that draws itself. */
function Draw({ d, r, delay = 0, dur = 1.1, stroke, w = 3, fill = 'none', dash, opacity = 1 }: { d: string; r: boolean; delay?: number; dur?: number; stroke: string; w?: number; fill?: string; dash?: string; opacity?: number }) {
  return <motion.path d={d} fill={fill} stroke={stroke} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} opacity={opacity}
    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={r ? { duration: 0 } : { duration: dur, delay, ease: 'easeInOut' }} />;
}
/** A number that counts up. */
function Counter({ to, r, suffix = '' }: { to: number; r: boolean; suffix?: string }) {
  const [n, setN] = useState(r ? to : 0);
  useEffect(() => { if (r) { setN(to); return; } const c = animate(0, to, { duration: 1.8, delay: 0.5, ease: 'easeOut', onUpdate: (v) => setN(Math.round(v)) }); return () => c.stop(); }, [to, r]);
  return <>{n.toLocaleString('en-US')}{suffix}</>;
}
/** A round "station" with an icon: used for stops, nodes and knots. */
function Station({ x, y, d, c, state, r, size = 22 }: { x: number; y: number; d: string; c: string; state: 'future' | 'past' | 'active'; r: boolean; size?: number }) {
  const act = state === 'active', lit = state !== 'future';
  return (
    <g transform={`translate(${x} ${y})`}>
      {act && !r && <motion.circle r={size} fill="none" stroke={col(c)} strokeWidth={2} initial={{ opacity: 0.6, scale: 1 }} animate={{ opacity: [0.6, 0], scale: [1, 1.9] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }} />}
      <motion.g initial={false} animate={{ scale: act ? 1.3 : lit ? 1 : 0.8, opacity: lit ? 1 : 0.55 }} transition={T(r, 0.6)}>
        <circle r={size} fill={col('surface')} stroke={lit ? col(c) : col('border')} strokeWidth={2.5} />
        <circle r={size} fill={col(c, act ? 0.2 : lit ? 0.1 : 0)} />
        <Icon d={d} x={0} y={0} size={size * 1.05} color={lit ? col(c) : col('muted')} w={1.8} />
      </motion.g>
    </g>
  );
}

/* ───────────────────────────── 1. The big story ───────────────────────────── */

const BS_PTS: Pt[] = [[84, 250], [170, 388], [258, 332], [348, 280], [438, 214], [528, 394], [618, 346], [708, 300], [798, 228], [884, 152]];
const BS_SS = segs(BS_PTS);
const BS_MAP = [0, 1, 2, 3, 4, 6, 7, 8, 9];
const BS_STOPS = [
  { label: t('Creation'), icon: IC.sun, c: 'ot', below: false },
  { label: t('Fall'), icon: IC.fruit, c: 'ot', below: true },
  { label: t('Promise'), icon: IC.star, c: 'ot', below: true },
  { label: t('Exodus'), icon: IC.tablets, c: 'ot', below: false },
  { label: t('Kingdom'), icon: IC.crown, c: 'ot', below: false },
  { label: t('Exile'), icon: IC.river, c: 'ot', below: true },
  { label: t('Return and waiting'), icon: IC.lamp, c: 'ot', below: true },
  { label: t('Jesus'), icon: IC.cross, c: 'accent', below: true },
  { label: t('Spirit'), icon: IC.flame, c: 'nt', below: false },
  { label: t('New creation'), icon: IC.tree, c: 'nt', below: true },
];
const BIG_STORY: Scene[] = [
  { label: t('Creation'), caption: t('In the beginning God makes a good world and gives humans a calling: to bear his image and care for it.'), refs: ['Gen 1:1', 'Gen 1:27'] },
  { label: t('The fall'), caption: t('Humans reach for life on their own terms. Trust breaks, and death, shame and violence spread through the world.'), refs: ['Gen 3:6', 'Rom 5:12'] },
  { label: t('Promise to Abraham'), caption: t('God calls Abraham and promises that through his family all the families of the earth will be blessed.'), refs: ['Gen 12:1-3'] },
  { label: t('Exodus and covenant'), caption: t('God rescues Israel from slavery in Egypt and binds himself to them in covenant at Mount Sinai.'), refs: ['Exod 3:7-8', 'Exod 19:5-6'] },
  { label: t('Kingdom and temple'), caption: t('Under David and Solomon Israel becomes a kingdom, and God’s presence fills the temple in Jerusalem.'), refs: ['2 Sam 7:12-13', '1 Kgs 8:10-11'] },
  { label: t('Exile, return and waiting'), caption: t('Unfaithfulness ends in exile in Babylon. A remnant returns and rebuilds, still waiting for God to come back as king.'), refs: ['Jer 29:10', 'Isa 40:1-3'] },
  { label: t('Jesus'), caption: t('In Jesus the story reaches its centre: God himself comes, lives, dies and rises again for the world.'), refs: ['John 1:14', '1 Cor 15:3-4'] },
  { label: t('Spirit and church'), caption: t('The Spirit is poured out, and a new family from every nation carries the good news to the ends of the earth.'), refs: ['Acts 2:17', 'Acts 1:8'] },
  { label: t('New creation'), caption: t('The story ends as a beginning: God makes all things new and lives with his people for ever.'), refs: ['Rev 21:1-5'] },
];

function BigStoryArt({ s, r }: ArtProps) {
  const at = BS_MAP[s]; const url = useUrl();
  return (
    <g>
      <Ambient r={r} />
      {/* Old and New Testament band */}
      <g opacity={0.75}>
        <line x1={60} y1={498} x2={680} y2={498} stroke={col('ot', 0.5)} strokeWidth={3} strokeLinecap="round" />
        <line x1={736} y1={498} x2={904} y2={498} stroke={col('nt', 0.5)} strokeWidth={3} strokeLinecap="round" />
        <Txt x={60} y={518} size={13} anchor="start" w={300} fill={col('muted')} weight={700}>{t('Old Testament')}</Txt>
        <Txt x={904} y={518} size={13} anchor="end" w={200} fill={col('muted')} weight={700}>{t('New Testament')}</Txt>
      </g>
      <path d={fullD(BS_SS)} fill="none" stroke={col('border')} strokeWidth={3} strokeDasharray="1 11" strokeLinecap="round" />
      <Trail ss={BS_SS} at={at} r={r} stroke={url('story')} width={14} opacity={0.22} filter={url('soft')} />
      <Trail ss={BS_SS} at={at} r={r} stroke={url('story')} width={5} />
      {BS_STOPS.map((st, i) => {
        const act = i === at || (s === 5 && i === 5);
        const [x, y] = BS_PTS[i];
        return (
          <g key={i}>
            <Station x={x} y={y} d={st.icon} c={st.c} r={r} state={act ? 'active' : i <= at ? 'past' : 'future'} />
            <motion.g initial={false} animate={{ opacity: act ? 1 : i <= at ? 0.85 : 0.4 }} transition={T(r, 0.5)}>
              <Txt x={x} y={y + (st.below ? 54 : -54)} size={act ? 17 : 15} w={124} weight={act ? 700 : 600} fill={act ? col(st.c) : col('text')}>{st.label}</Txt>
            </motion.g>
          </g>
        );
      })}
      <Traveller ss={BS_SS} at={at} r={r} />
      <Headline text={BIG_STORY[s].label} r={r} />
      <motion.g initial={false} animate={{ opacity: s === 0 ? 1 : 0 }} transition={T(r, 0.6)}>
        <Txt x={56} y={102} size={17} anchor="start" w={420} fill={col('muted')} serif italic>{t('Many books, one story')}</Txt>
      </motion.g>
    </g>
  );
}
function BigStoryThumb({ r }: { r: boolean }) {
  const url = useUrl(); const ss = useMemo(() => scaleSegs(BS_SS, 1 / 3), []); const d = fullD(ss);
  return (
    <g>
      <path d={d} fill="none" stroke={col('border')} strokeWidth={1.5} strokeDasharray="1 5" strokeLinecap="round" />
      <path d={d} fill="none" stroke={url('story')} strokeWidth={2.5} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={r ? 0 : 1}>
        {!r && <animate attributeName="stroke-dashoffset" values="1;0;0" keyTimes="0;.85;1" dur="7s" repeatCount="indefinite" />}
      </path>
      {BS_PTS.map(([x, y], i) => <circle key={i} cx={x / 3} cy={y / 3} r={4.5} fill={col('surface')} stroke={col(BS_STOPS[i].c)} strokeWidth={1.5} />)}
      <g>
        <circle r={12} fill={url('light')} /><circle r={2.2} fill="#fff" />
        {r ? <animateTransform attributeName="transform" type="translate" values={`${BS_PTS[7][0] / 3} ${BS_PTS[7][1] / 3}`} dur="1s" fill="freeze" />
          : <animateMotion dur="7s" repeatCount="indefinite" path={d} keyPoints="0;1;1" keyTimes="0;.85;1" calcMode="linear" />}
      </g>
    </g>
  );
}

/* ───────────────────────────── 2. How we got the Bible ───────────────────────────── */

const HW_PTS: Pt[] = Array.from({ length: 9 }, (_, i) => [80 + i * 100, 452 + 9 * Math.sin(i * 1.4)] as Pt);
const HW_SS = segs(HW_PTS);
const HW_NODES = [
  { label: t('Events'), icon: IC.sun, c: 'ot' }, { label: t('Memory'), icon: IC.ear, c: 'ot' }, { label: t('Scrolls'), icon: IC.scroll, c: 'ot' },
  { label: t('Collections'), icon: IC.stack, c: 'accent-2' }, { label: t('Canon'), icon: IC.seal, c: 'accent-2' }, { label: t('Manuscripts'), icon: IC.book, c: 'nt' },
  { label: t('Printing'), icon: IC.press, c: 'nt' }, { label: t('Translations'), icon: IC.lang, c: 'accent' }, { label: t('Your hands'), icon: IC.hands, c: 'accent' },
];
const HOW: Scene[] = [
  { label: t('Events'), caption: t('It starts with events: God acting in real history, among real people, in real places.'), refs: ['1 John 1:1'] },
  { label: t('Oral memory'), caption: t('Before anything was written down, stories, songs and sayings were told and retold, carefully remembered by whole communities.'), refs: ['Deut 6:6-7', 'Luke 1:1-2'] },
  { label: t('Written scrolls'), caption: t('Prophets, scribes and apostles wrote on scrolls of leather and papyrus: human writers, breathed on by God.'), refs: ['Jer 36:2', '2 Tim 3:16'] },
  { label: t('Collections'), caption: t('The writings were gathered into collections: the Law, the Prophets and the Writings; later the Gospels and the apostles’ letters.'), refs: ['Luke 24:44', '2 Pet 3:15-16'] },
  { label: t('Canon recognised'), caption: t('Over time the church recognised which books carried apostolic, life-giving authority. The canon was received, not invented.') },
  { label: t('Hand-copied manuscripts'), caption: t('For centuries scribes copied by hand. Great codices like Sinaiticus and Vaticanus, and thousands of other manuscripts, let scholars compare and check the text.') },
  { label: t('The printing press'), caption: t('Around {y} Gutenberg’s press made identical copies possible, and Bibles spread faster than ever before.', { y: fmtYear(1455) }) },
  { label: t('Translations'), caption: t('Translators carried it into the world’s languages: the King James Version ({a}), Ziegenbalg’s Tamil New Testament ({b}) and the Tamil Union Version ({c}).', { a: fmtYear(1611), b: `${fmtYear(1714)}–15`, c: fmtYear(1871) }) },
  { label: t('Your hands'), caption: t('And now it is in your hands: not written to you, but given to you, to be read with care and with Christ at the centre.'), refs: ['Ps 119:105'] },
];

function Person({ x, y, c = col('text', 0.55), k = 1 }: { x: number; y: number; c?: string; k?: number }) {
  return <g fill={c}><circle cx={x} cy={y - 30 * k} r={11 * k} /><path d={`M${x - 19 * k} ${y} a19 21 0 0 1 ${38 * k} 0z`} /></g>;
}
function Book({ x, y, w = 100, h = 130, c, rot = 0 }: { x: number; y: number; w?: number; h?: number; c: string; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill={col(c, 0.16)} stroke={col(c)} strokeWidth={2.5} />
      <line x1={-w / 2 + 12} y1={-h / 2 + 4} x2={-w / 2 + 12} y2={h / 2 - 4} stroke={col(c, 0.6)} strokeWidth={2} />
      <Icon d={IC.cross} x={6} y={-h / 6} size={26} color={col(c)} w={2.2} />
      {[0, 1, 2].map((j) => <line key={j} x1={-w / 2 + 26} x2={w / 2 - 14} y1={h / 6 + j * 10} y2={h / 6 + j * 10} stroke={col(c, 0.35)} strokeWidth={2} strokeLinecap="round" />)}
    </g>
  );
}

function HowIllustration({ s, r }: ArtProps) {
  const url = useUrl();
  switch (s) {
    case 0: return (
      <g>
        <motion.g animate={r ? undefined : { rotate: 360 }} transition={r ? undefined : { duration: 60, repeat: Infinity, ease: 'linear' }}>
          {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return <line key={i} x1={610 + Math.cos(a) * 46} y1={118 + Math.sin(a) * 46} x2={610 + Math.cos(a) * 62} y2={118 + Math.sin(a) * 62} stroke={col('warn', 0.6)} strokeWidth={3} strokeLinecap="round" />; })}
        </motion.g>
        <In r={r} scale={0.6} y={0}><circle cx={610} cy={118} r={34} fill={col('warn', 0.3)} stroke={col('warn')} strokeWidth={2} /></In>
        <In r={r} delay={0.1}><path d="M240 345 L380 178 L430 232 L500 150 L720 345 Z" fill={col('ot', 0.16)} stroke={col('ot', 0.7)} strokeWidth={2.5} strokeLinejoin="round" /></In>
        <Draw r={r} delay={0.5} d="M210 362 q20 -10 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke={col('nt', 0.6)} w={2.5} dur={1.6} />
        <motion.g animate={r ? undefined : { x: [0, 26, 0] }} transition={LOOP(r, 9)}>
          {[0, 1, 2, 3, 4].map((i) => <Person key={i} x={300 + i * 26} y={346} k={0.42} c={col('text', 0.5)} />)}
        </motion.g>
        <Tag x={480} y={398}>{t('God acts in history')}</Tag>
      </g>
    );
    case 1: return (
      <g>
        {!r && [0, 1, 2].map((i) => <motion.circle key={i} cx={480} cy={280} r={40} fill="none" stroke={room(0.5)} strokeWidth={2} initial={{ scale: 1, opacity: 0.6 }} animate={{ scale: [1, 4], opacity: [0.55, 0] }} transition={{ duration: 3.6, delay: i * 1.2, repeat: Infinity, ease: 'easeOut' }} />)}
        <motion.g animate={r ? undefined : { scaleY: [1, 1.12, 0.95, 1] }} transition={LOOP(r, 1.4)} style={{ originY: 1 }}>
          <Icon d={IC.flame} x={480} y={282} size={64} color={col('warn')} fill={col('warn', 0.3)} w={2.5} />
        </motion.g>
        {[[340, 330], [395, 352], [565, 352], [620, 330]].map(([x, y], i) => <In key={i} r={r} delay={0.15 * i}><Person x={x} y={y} c={col(i % 2 ? 'ot' : 'accent-2', 0.55)} /></In>)}
        {[0, 1, 2].map((i) => <Draw key={i} r={r} delay={0.6 + i * 0.4} d={`M${370 - i * 14} ${282 - i * 16} q -14 ${-18 - i * 6} 0 ${-36 - i * 12}`} stroke={col('ot', 0.5)} w={2.5} dur={0.6} />)}
        <Tag x={480} y={398}>{t('Told and retold')}</Tag>
      </g>
    );
    case 2: return (
      <g>
        <motion.rect x={334} y={138} height={176} rx={4} fill={col('warn', 0.12)} stroke={col('warn', 0.5)} strokeWidth={2} initial={{ width: 0 }} animate={{ width: 296 }} transition={T(r, 1.6, 0.2)} />
        <rect x={316} y={126} width={20} height={200} rx={10} fill={col('warn', 0.45)} stroke={col('warn')} strokeWidth={2} />
        <motion.rect y={126} width={20} height={200} rx={10} fill={col('warn', 0.45)} stroke={col('warn')} strokeWidth={2} initial={{ x: 316 }} animate={{ x: 628 }} transition={T(r, 1.6, 0.2)} />
        {[0, 1, 2, 3, 4, 5].map((i) => <Draw key={i} r={r} delay={1.2 + i * 0.25} dur={0.9} stroke={col('text', 0.45)} w={2.5}
          d={`M${360 + (i % 2) * 10} ${168 + i * 23} ${Array.from({ length: 10 }, (_, j) => `q6 ${j % 2 ? 5 : -5} 12 0 h ${8 + ((i + j) % 3) * 4}`).join(' ')}`} />)}
        <Tag x={480} y={372}>{t('Leather and papyrus')}</Tag>
      </g>
    );
    case 3: {
      const groups = [{ x: 250, l: t('Law'), c: 'ot' }, { x: 370, l: t('Prophets'), c: 'ot' }, { x: 490, l: t('Writings'), c: 'ot' }, { x: 630, l: t('Gospels'), c: 'nt' }, { x: 750, l: t('Letters'), c: 'nt' }];
      return (
        <g>
          {groups.map((g, gi) => (
            <g key={gi}>
              {[-20, 0, 20].map((dx, j) => (
                <motion.rect key={j} x={g.x + dx - 9} y={185} width={18} height={84} rx={9} fill={col(g.c, 0.22)} stroke={col(g.c)} strokeWidth={2}
                  initial={{ opacity: 0, y: -120 - rnd(gi * 3 + j) * 60, x: (rnd(gi + j * 7) - 0.5) * 160, rotate: (rnd(gi * 5 + j) - 0.5) * 80 }}
                  animate={{ opacity: 1, y: 0, x: 0, rotate: dx / 4 }} transition={T(r, 1, 0.15 * gi + 0.08 * j)} />
              ))}
              <In r={r} delay={0.9 + 0.1 * gi}><Txt x={g.x} y={300} size={15} w={110} fill={col(g.c)} weight={700}>{g.l}</Txt></In>
            </g>
          ))}
          <In r={r} delay={0.6}><line x1={560} y1={180} x2={560} y2={300} stroke={col('border')} strokeWidth={2} strokeDasharray="3 6" /></In>
          <Tag x={480} y={372}>{t('Gathered into collections')}</Tag>
        </g>
      );
    }
    case 4: return (
      <g>
        {Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; return (
          <motion.rect key={i} x={471} y={200} width={18} height={60} rx={9} fill={col(i < 6 ? 'ot' : 'nt', 0.3)} stroke={col(i < 6 ? 'ot' : 'nt')} strokeWidth={1.5}
            initial={{ x: Math.cos(a) * 230, y: Math.sin(a) * 140, opacity: 1 }} animate={{ x: 0, y: 0, opacity: 0 }} transition={T(r, 1.3, 0.05 * i)} />
        ); })}
        <In r={r} delay={0.9} scale={0.7} y={0}><Book x={480} y={232} w={130} h={170} c="accent" /></In>
        <motion.circle cx={480} cy={232} r={128} fill="none" stroke={col('accent-2', 0.6)} strokeWidth={2} strokeDasharray="2 8" initial={{ pathLength: 0, rotate: -90 }} animate={{ pathLength: 1, rotate: -90 }} transition={T(r, 1.6, 1.2)} />
        <Tag x={480} y={392}>{t('Received, not invented')}</Tag>
      </g>
    );
    case 5: return (
      <g>
        <In r={r} y={0}>
          <path d="M210 150 q80 -22 160 0 v200 q-80 -22 -160 0z" fill={col('warn', 0.1)} stroke={col('warn', 0.6)} strokeWidth={2} />
          <path d="M370 150 q80 -22 160 0 v200 q-80 -22 -160 0z" fill={col('warn', 0.1)} stroke={col('warn', 0.6)} strokeWidth={2} />
        </In>
        {[0, 1, 2, 3].map((c) => [0, 1, 2, 3, 4, 5, 6, 7].map((j) => {
          const x = 226 + c * 80 + (c > 1 ? 16 : 0);
          return <Draw key={`${c}-${j}`} r={r} delay={0.4 + c * 0.35 + j * 0.05} dur={0.35} stroke={col('text', 0.35)} w={2} d={`M${x} ${172 + j * 20} h${46 + ((c + j) % 3) * 6}`} />;
        }))}
        <In r={r} delay={0.4}><Txt x={290} y={116} size={14} w={160} fill={col('ot')} weight={700}>Codex Sinaiticus</Txt><Txt x={450} y={116} size={14} w={160} fill={col('nt')} weight={700}>Codex Vaticanus</Txt></In>
        <In r={r} delay={0.6}><Txt x={370} y={372} size={14} w={260} fill={col('muted')} weight={600}>{t('c. {y}', { y: fmtYear(350) })}</Txt></In>
        <In r={r} delay={0.3}>
          <text x={720} y={220} textAnchor="middle" fontSize={56} fontWeight={700} className="font-serif" fill={room()}><Counter to={5800} r={r} suffix="+" /></text>
          <Txt x={720} y={268} size={15} w={200} fill={col('muted')} weight={600}>{t('Greek New Testament manuscripts')}</Txt>
        </In>
      </g>
    );
    case 6: return (
      <g>
        <In r={r} y={0}>
          <rect x={372} y={112} width={216} height={22} rx={6} fill={col('nt', 0.3)} stroke={col('nt')} strokeWidth={2} />
          <rect x={384} y={134} width={16} height={210} rx={4} fill={col('nt', 0.2)} stroke={col('nt')} strokeWidth={2} />
          <rect x={560} y={134} width={16} height={210} rx={4} fill={col('nt', 0.2)} stroke={col('nt')} strokeWidth={2} />
          <rect x={410} y={300} width={140} height={14} rx={4} fill={col('text', 0.15)} stroke={col('text', 0.4)} strokeWidth={1.5} />
          <line x1={480} y1={134} x2={480} y2={190} stroke={col('nt')} strokeWidth={6} strokeLinecap="round" />
        </In>
        <motion.g animate={r ? undefined : { y: [0, 84, 0] }} transition={LOOP(r, 1.8)}>
          <rect x={420} y={190} width={120} height={22} rx={5} fill={col('nt', 0.45)} stroke={col('nt')} strokeWidth={2} />
        </motion.g>
        {!r && [0, 1, 2].map((i) => (
          <motion.rect key={i} y={286} width={64} height={84} rx={4} fill={col('surface')} stroke={col('border')} strokeWidth={1.5}
            initial={{ x: 448, opacity: 0, rotate: 0 }} animate={{ x: [448, 640, 720], opacity: [0, 1, 0], rotate: [0, 6, 12] }} transition={{ duration: 3.6, delay: 0.9 + i * 1.2, repeat: Infinity, ease: 'easeOut' }} />
        ))}
        <In r={r} delay={0.4}><Txt x={250} y={180} size={44} w={260} serif weight={700} fill={room()}>{fmtYear(1455)}</Txt><Txt x={250} y={226} size={15} w={220} fill={col('muted')}>{t('Gutenberg’s press')}</Txt></In>
      </g>
    );
    case 7: {
      const books = [
        { name: t('King James Version'), year: fmtYear(1611), c: 'accent-2', x: -170, rot: -10 },
        { name: t('Ziegenbalg’s Tamil New Testament'), year: `${fmtYear(1714)}–15`, c: 'ot', x: 0, rot: 0 },
        { name: t('Tamil Union Version'), year: fmtYear(1871), c: 'nt', x: 170, rot: 10 },
      ];
      return (
        <g>
          {['Ἐν ἀρχῇ ἦν ὁ λόγος', 'בְּרֵאשִׁית', 'ஆதியிலே வார்த்தை இருந்தது'].map((g, i) => (
            <motion.text key={i} x={230 + i * 250} y={84} textAnchor="middle" fontSize={17} className="font-serif" fill={col('muted')}
              initial={{ opacity: 0, y: 10 }} animate={r ? { opacity: 0.6, y: 0 } : { opacity: [0, 0.7, 0.7, 0], y: [10, 0, -6, -14] }} transition={r ? { duration: 0 } : { duration: 5, delay: i * 0.8, repeat: Infinity }}>{g}</motion.text>
          ))}
          {books.map((b, i) => (
            <g key={i}>
              <motion.g initial={{ x: 480, y: 210, rotate: 0, opacity: 0 }} animate={{ x: 480 + b.x, y: 210, rotate: b.rot, opacity: 1 }} transition={T(r, 1.1, 0.2 + i * 0.15)}>
                <Book x={0} y={0} w={96} h={126} c={b.c} />
              </motion.g>
              <In r={r} delay={0.9 + i * 0.15}>
                <Txt x={480 + b.x} y={312} size={14} w={150} weight={700}>{b.name}</Txt>
                <Txt x={480 + b.x} y={352} size={13} w={150} weight={600} fill={col(b.c)}>{b.year}</Txt>
              </In>
            </g>
          ))}
        </g>
      );
    }
    default: return (
      <g>
        {Array.from({ length: 7 }, (_, i) => { const a = -Math.PI / 2 + (i - 3) * 0.28; return (
          <motion.line key={i} x1={480} y1={200} x2={480 + Math.cos(a) * 150} y2={200 + Math.sin(a) * 150} stroke={room(0.5)} strokeWidth={3} strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }} animate={r ? { pathLength: 1, opacity: 0.6 } : { pathLength: [0, 1, 1], opacity: [0, 0.8, 0] }} transition={r ? { duration: 0 } : { duration: 3, delay: 0.6 + i * 0.12, repeat: Infinity }} />
        ); })}
        <In r={r} y={10}>
          <path d="M370 210 q55 -26 110 0 v84 q-55 -26 -110 0z" fill={col('surface')} stroke={col('accent')} strokeWidth={2.5} />
          <path d="M480 210 q55 -26 110 0 v84 q-55 -26 -110 0z" fill={col('surface')} stroke={col('accent')} strokeWidth={2.5} />
        </In>
        <In r={r} delay={0.3}>
          <path d="M330 270 c0 60 50 92 150 96 M630 270 c0 60 -50 92 -150 96" fill="none" stroke={col('warn', 0.45)} strokeWidth={22} strokeLinecap="round" />
        </In>
        <circle cx={480} cy={226} r={60} fill={url('light')} opacity={0.6} />
        <Tag x={480} y={398}>{t('Given to you')}</Tag>
      </g>
    );
  }
}

function HowArt({ s, r }: ArtProps) {
  const url = useUrl(); const dur = 1 + s * 0.45; const d = fullD(HW_SS.slice(0, s));
  return (
    <g>
      <Ambient r={r} n={12} />
      <path d={fullD(HW_SS)} fill="none" stroke={col('border')} strokeWidth={14} strokeLinecap="round" opacity={0.7} />
      <path d={fullD(HW_SS)} fill="none" stroke={col('sunk')} strokeWidth={7} strokeLinecap="round" />
      <Trail ss={HW_SS} at={s} r={r} stroke={url('story')} width={7} />
      {s > 0 && !r && (
        <g key={s}>
          {Array.from({ length: 8 }, (_, k) => (
            <circle key={k} r={4} fill={room()} filter={url('glow')}>
              <animateMotion dur={`${dur}s`} begin={`${-(k * dur) / 8}s`} repeatCount="indefinite" path={d} />
            </circle>
          ))}
        </g>
      )}
      {HW_NODES.map((n, i) => (
        <g key={i}>
          <Station x={HW_PTS[i][0]} y={HW_PTS[i][1]} d={n.icon} c={n.c} r={r} size={17} state={i === s ? 'active' : i < s ? 'past' : 'future'} />
          <motion.g initial={false} animate={{ opacity: i === s ? 1 : i < s ? 0.8 : 0.4 }} transition={T(r, 0.5)}>
            <Txt x={HW_PTS[i][0]} y={HW_PTS[i][1] + 44} size={13} w={96} weight={i === s ? 700 : 600} fill={i === s ? col(n.c) : col('text')}>{n.label}</Txt>
          </motion.g>
        </g>
      ))}
      <AnimatePresence initial={false}>
        <motion.g key={s} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10, transition: { duration: r ? 0 : 0.35 } }} transition={T(r, 0.6, 0.25)}>
          <HowIllustration s={s} r={r} />
        </motion.g>
      </AnimatePresence>
      <Headline text={HOW[s].label} r={r} y={56} size={26} w={300} />
    </g>
  );
}
function HowThumb({ r }: { r: boolean }) {
  const url = useUrl(); const ss = useMemo(() => scaleSegs(HW_SS, 1 / 3), []); const d = fullD(ss);
  return (
    <g transform="translate(0 -50)">
      <path d={d} fill="none" stroke={col('border')} strokeWidth={6} strokeLinecap="round" />
      <path d={d} fill="none" stroke={url('story')} strokeWidth={2.5} strokeLinecap="round" />
      {!r && Array.from({ length: 6 }, (_, k) => <circle key={k} r={2.4} fill={room()} filter={url('glow')}><animateMotion dur="4s" begin={`${-k * 0.66}s`} repeatCount="indefinite" path={d} /></circle>)}
      {HW_PTS.map(([x, y], i) => <circle key={i} cx={x / 3} cy={y / 3} r={4} fill={col('surface')} stroke={col(HW_NODES[i].c)} strokeWidth={1.5} />)}
      <g transform="translate(0 50)">
        {[0, 1, 2].map((i) => <rect key={i} x={110 + i * 34} y={44} width={26} height={34} rx={4} fill={col(['ot', 'nt', 'accent'][i], 0.2)} stroke={col(['ot', 'nt', 'accent'][i])} strokeWidth={1.5} />)}
        <motion.g animate={r ? undefined : { y: [0, -4, 0] }} transition={LOOP(r, 3)}><Icon d={IC.scroll} x={160} y={20} size={20} color={col('muted')} /></motion.g>
      </g>
    </g>
  );
}

/* ───────────────────────────── 3. Jesus as the lens ───────────────────────────── */

const LENS = { x: 480, y: 270 }, FOCUS = { x: 800, y: 270 };
const RAYS = Array.from({ length: 7 }, (_, i) => {
  const y0 = 100 + i * 57, y1 = LENS.y + (y0 - LENS.y) * 0.6;
  return { y0, y1, sy: y1 + (y0 - LENS.y) * 0.95 + (rnd(i + 4) - 0.5) * 70, c: PAL[i % PAL.length] };
});
const LENS_SCENES: Scene[] = [
  { label: t('Many portions, many ways'), caption: t('God spoke through the prophets “in many portions and in many ways”: true light, but partial and scattered.'), refs: ['Heb 1:1'] },
  { label: t('The lens'), caption: t('Many Christians read Scripture this way: the Son is the lens in whom all those rays are gathered.'), refs: ['Heb 1:2'] },
  { label: t('A clear image'), caption: t('Through him the light comes into focus. The Son is the charaktēr, the exact imprint, of God’s nature.'), refs: ['Heb 1:3'] },
  { label: t('He has made him known'), caption: t('“No one has ever seen God”, but the Son has exēgēsato, made him known. Jesus is the Father’s exegesis.'), refs: ['John 1:18'] },
  { label: t('Scripture points to him'), caption: t('Jesus said the Scriptures testify about him, yet life is found in coming to him, not in the pages alone.'), refs: ['John 5:39-40'] },
  { label: t('Shadows and substance'), caption: t('Old Testament types are shadows; the substance belongs to Christ: the lamb, the temple, the bread.'), refs: ['Col 2:17', 'John 1:29'] },
  { label: t('A lens, held humbly'), caption: t('This is one way Christians read the Bible, and others weigh these texts differently. Test it by reading the whole of Scripture.') },
];
const SHAPES = {
  lamb: 'M-26 6a14 12 0 0 1 4-18 12 12 0 0 1 18-6 12 12 0 0 1 20 4 12 12 0 0 1 8 18 10 10 0 0 1-12 10h-26a10 10 0 0 1-12-8zM22-8a9 8 0 1 0 14 6M-14 16v14M-4 16v14M8 16v14M18 16v14',
  temple: 'M-32 26h64M-24 26V-2M-8 26V-2M8 26V-2M24 26V-2M-34-2h68L0-26z',
  bread: 'M-32 18c0-22 14-32 32-32s32 10 32 32v6h-64zM-14-6l-6 12M0-8l-4 14M14-6l-2 12',
};
function LensArt({ s, r }: ArtProps) {
  const url = useUrl();
  const focused = s >= 1, shadows = s === 5, image = s >= 2 && !shadows;
  const focalSub = s === 2 ? t('exact imprint') : s === 3 ? t('he has made him known') : s === 4 ? t('come to him for life') : '';
  const greek = s === 2 ? 'charaktēr' : s === 3 ? 'exēgēsato' : '';
  return (
    <g>
      <Ambient r={r} n={14} />
      {/* rays */}
      <motion.g initial={false} animate={{ opacity: shadows ? 0.15 : 1 }} transition={T(r, 0.8)}>
        {RAYS.map((ray, i) => {
          const d = focused ? `M40 ${ray.y0} L${LENS.x} ${ray.y1} L${FOCUS.x} ${FOCUS.y}` : `M40 ${ray.y0} L${LENS.x} ${ray.y1} L960 ${ray.sy}`;
          return (
            <g key={i}>
              <motion.path initial={false} animate={{ d }} transition={T(r, 1.4, 0.05 * i)} fill="none" stroke={col(ray.c, 0.55)} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
              {!r && <motion.path initial={false} animate={{ d, strokeDashoffset: [0, -58] }} transition={{ d: T(r, 1.4, 0.05 * i), strokeDashoffset: { duration: 1.4, repeat: Infinity, ease: 'linear' } }} fill="none" stroke="#fff" strokeOpacity={0.75} strokeWidth={2} strokeDasharray="3 26" strokeLinecap="round" />}
            </g>
          );
        })}
      </motion.g>
      {/* sources: points of light, or scrolls in scene 4 */}
      {RAYS.map((ray, i) => (
        <g key={i}>
          <motion.circle cx={40} cy={ray.y0} r={7} fill={col(ray.c)} filter={url('glow')} initial={false} animate={{ opacity: s === 4 ? 0 : 1 }} transition={T(r, 0.4)} />
          <motion.g initial={false} animate={{ opacity: s === 4 ? 1 : 0 }} transition={T(r, 0.5, 0.05 * i)}>
            <circle cx={40} cy={ray.y0} r={17} fill={col('surface')} stroke={col(ray.c)} strokeWidth={1.5} />
            <Icon d={IC.scroll} x={40} y={ray.y0} size={20} color={col(ray.c)} />
          </motion.g>
        </g>
      ))}
      {/* the lens */}
      <motion.g initial={false} animate={{ opacity: focused ? 1 : 0, scaleY: focused ? 1 : 0.3 }} transition={T(r, 1)}>
        <ellipse cx={LENS.x} cy={LENS.y} rx={60} ry={190} fill={room(0.08)} filter={url('soft')} />
        <ellipse cx={LENS.x} cy={LENS.y} rx={32} ry={168} fill={room(0.14)} stroke={room(0.9)} strokeWidth={2.5} />
        <path d={`M${LENS.x - 12} ${LENS.y - 130} q-10 130 0 260`} fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={3} strokeLinecap="round" />
        <motion.g initial={false} animate={{ opacity: s >= 2 && s !== 5 ? 1 : 0 }} transition={T(r, 0.6)}><Icon d={IC.heart} x={LENS.x} y={LENS.y} size={26} color={room()} w={2} /></motion.g>
        <Txt x={LENS.x} y={472} size={24} w={160} serif weight={700} fill={room()}>{t('Jesus')}</Txt>
      </motion.g>
      {/* the focused image */}
      <motion.g initial={false} animate={{ opacity: image ? 1 : 0, scale: image ? 1 : 0.6 }} transition={T(r, 1, image ? 0.6 : 0)}>
        <circle cx={FOCUS.x} cy={FOCUS.y} r={95} fill={url('light')} opacity={0.75} />
        {!r && [0, 1].map((i) => <motion.circle key={i} cx={FOCUS.x} cy={FOCUS.y} r={44} fill="none" stroke={room(0.6)} strokeWidth={2} animate={{ scale: [1, 2.2], opacity: [0.6, 0] }} transition={{ duration: 2.8, delay: i * 1.4, repeat: Infinity, ease: 'easeOut' }} />)}
        <circle cx={FOCUS.x} cy={FOCUS.y} r={42} fill={col('surface')} stroke={room()} strokeWidth={2.5} />
        <Icon d={IC.heart} x={FOCUS.x} y={FOCUS.y + 2} size={44} color={room()} fill={room(0.3)} w={2} />
        <Txt x={FOCUS.x} y={FOCUS.y + 78} size={17} w={190} weight={700}>{t('The Father made known')}</Txt>
      </motion.g>
      <AnimatePresence initial={false}>
        {image && (greek || focalSub) && (
          <motion.g key={s} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: r ? 0 : 0.25 } }} transition={T(r, 0.6, 0.9)}>
            {greek && <Txt x={FOCUS.x} y={FOCUS.y - 82} size={22} w={200} serif italic weight={700} fill={col('accent-2')}>{greek}</Txt>}
            <Txt x={FOCUS.x} y={FOCUS.y + (greek ? -56 : 110)} size={14} w={200} fill={col('muted')}>{focalSub}</Txt>
          </motion.g>
        )}
      </AnimatePresence>
      {/* shadows and substance */}
      <AnimatePresence>
        {shadows && (
          <motion.g key="types" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: r ? 0 : 0.3 } }} transition={T(r, 0.6)}>
            <Txt x={210} y={92} size={14} w={160} weight={700} fill={col('muted')}>{t('Shadow')}</Txt>
            <Txt x={760} y={92} size={14} w={160} weight={700} fill={room()}>{t('Substance')}</Txt>
            {([['lamb', t('Passover lamb'), t('Lamb of God')], ['temple', t('Temple'), t('His body')], ['bread', t('Manna'), t('Bread of life')]] as const).map(([k, a, b], i) => {
              const y = 160 + i * 120;
              return (
                <g key={k}>
                  <In r={r} delay={0.2 + i * 0.2} y={0}><path d={SHAPES[k]} transform={`translate(210 ${y})`} fill={col('muted', 0.3)} filter={url('soft')} /><path d={SHAPES[k]} transform={`translate(210 ${y})`} fill="none" stroke={col('muted', 0.5)} strokeWidth={1.5} strokeDasharray="3 4" /></In>
                  <Draw r={r} delay={0.5 + i * 0.25} dur={1.2} d={`M262 ${y} C 400 ${y}, 420 ${LENS.y + (y - LENS.y) * 0.4}, ${LENS.x} ${LENS.y + (y - LENS.y) * 0.4} S 600 ${y}, 702 ${y}`} stroke={room(0.5)} w={2} dash="2 7" />
                  <In r={r} delay={1.4 + i * 0.25} scale={0.7} y={0}><path d={SHAPES[k]} transform={`translate(760 ${y})`} fill={room(0.22)} stroke={room()} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" /></In>
                  <Txt x={210} y={y + 46} size={13} w={150} fill={col('muted')}>{a}</Txt>
                  <In r={r} delay={1.6 + i * 0.25}><Txt x={760} y={y + 46} size={14} w={150} weight={700}>{b}</Txt></In>
                </g>
              );
            })}
          </motion.g>
        )}
      </AnimatePresence>
      <Headline text={LENS_SCENES[s].label} r={r} x={480} y={40} size={24} anchor="middle" w={560} />
      <motion.g initial={false} animate={{ opacity: s >= 1 ? 1 : 0 }} transition={T(r, 0.6)}>
        <Txt x={480} y={516} size={13} w={700} fill={col('muted')} italic>{s === 6 ? t('One way of reading: test it with the whole of Scripture') : t('Many Christians read Scripture this way')}</Txt>
      </motion.g>
    </g>
  );
}
function LensThumb({ r }: { r: boolean }) {
  const url = useUrl();
  return (
    <g>
      {[0, 1, 2, 3, 4].map((i) => {
        const y0 = 30 + i * 30, y1 = 90 + (y0 - 90) * 0.55;
        return (
          <g key={i}>
            <path d={`M14 ${y0} L160 ${y1} L268 90`} fill="none" stroke={col(PAL[i], 0.55)} strokeWidth={2.2} strokeLinejoin="round" />
            <path d={`M14 ${y0} L160 ${y1} L268 90`} fill="none" stroke="#fff" strokeOpacity={0.8} strokeWidth={1.2} strokeDasharray="2 12">
              {!r && <animate attributeName="stroke-dashoffset" from="0" to="-28" dur="1.2s" repeatCount="indefinite" />}
            </path>
            <circle cx={14} cy={y0} r={3} fill={col(PAL[i])} />
          </g>
        );
      })}
      <ellipse cx={160} cy={90} rx={11} ry={62} fill={room(0.15)} stroke={room()} strokeWidth={1.5} />
      <circle cx={268} cy={90} r={30} fill={url('light')}>{!r && <animate attributeName="r" values="26;34;26" dur="2.4s" repeatCount="indefinite" />}</circle>
      <Icon d={IC.heart} x={268} y={91} size={18} color={room()} fill={room(0.3)} />
    </g>
  );
}

/* ───────────────────────────── 4. The chain ───────────────────────────── */

const CH_X = Array.from({ length: 6 }, (_, i) => 130 + i * 130);
const CH_LABELS = [t('Presuppositions and anthropology'), t('Interpretation'), t('Theology'), t('Eschatology'), t('Ecclesiology'), t('Lifestyle')];
const CHAIN: Scene[] = [
  { label: t('A chain of ideas'), caption: t('How we live is rarely random. It sits at the end of a chain of ideas, each one resting on the one before.') },
  { label: t('Where it starts'), caption: t('The first domino is our presuppositions and anthropology: what we assume about God and about human beings.') },
  { label: t('The fall'), caption: t('Tip a bad assumption and the rest follow: interpretation, theology, eschatology, ecclesiology, and finally lifestyle.') },
  { label: t('Trace it back'), caption: t('Bad lifestyle comes from bad ecclesiology, which comes from bad eschatology, and so on back to the start. Fixing behaviour alone treats only the last domino.') },
  { label: t('Start again'), caption: t('So begin again at the beginning: with who God is, as revealed in Jesus, and who we are in him.'), refs: ['John 14:9'] },
  { label: t('Union with Christ'), caption: t('“I have been crucified with Christ… Christ lives in me.” Our life is hidden with Christ in God.'), refs: ['Gal 2:20', 'Col 3:3'] },
  { label: t('A healthy chain'), caption: t('From that foundation, reading, theology, hope, church and daily life line up, and love becomes the shape of a life.'), refs: ['1 John 4:16'] },
];
const PIPS: Record<number, [number, number][]> = {
  1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};
function ChainArt({ s, r }: ArtProps) {
  const url = useUrl();
  const fallen = s === 2 || s === 3, healthy = s >= 4;
  const tint = (i: number) => (s === 1 && i === 0 ? 'warn' : fallen ? 'bad' : healthy ? (i === 0 ? 'accent' : 'good') : 'text');
  const tintA = (i: number) => (s === 0 ? 0.04 : s === 1 ? (i === 0 ? 0.22 : 0.04) : fallen ? 0.08 + i * 0.03 : 0.16);
  return (
    <g>
      <Ambient r={r} n={12} />
      <line x1={70} y1={380} x2={900} y2={380} stroke={col('border')} strokeWidth={3} strokeLinecap="round" />
      {healthy && <Draw r={r} delay={s === 6 ? 0 : 0.8} dur={1.6} d="M70 380 H900" stroke={col('good', 0.7)} w={3} />}
      {/* union halo */}
      <motion.g initial={false} animate={{ opacity: s === 5 ? 1 : 0 }} transition={T(r, 0.8)}>
        <circle cx={CH_X[0]} cy={290} r={120} fill={url('halo')} />
        <circle cx={CH_X[0] - 12} cy={150} r={22} fill={room(0.12)} stroke={room()} strokeWidth={2} />
        <circle cx={CH_X[0] + 12} cy={150} r={22} fill={room(0.12)} stroke={room()} strokeWidth={2} />
        <Txt x={CH_X[0]} y={110} size={15} w={160} weight={700} fill={room()}>{t('In Christ')}</Txt>
      </motion.g>
      {CH_X.map((cx, i) => {
        const rot = fallen ? (i < 5 ? 38 : 62) : 0;
        const delay = r ? 0 : fallen ? (s === 2 ? 0.6 + i * 0.32 : 0) : s === 4 ? 0.2 + (5 - i) * 0.12 : 0;
        const c = tint(i);
        const wave = s === 6 && !r;
        return (
          <g key={i}>
            <motion.g initial={false} animate={{ rotate: rot, x: s === 1 && i === 0 && !r ? [0, -3, 3, 0] : 0, opacity: s === 5 && i > 0 ? 0.45 : 1 }}
              transition={{ rotate: fallen ? (r ? { duration: 0 } : { duration: 0.5, delay, ease: [0.55, 0, 1, 0.45] }) : T(r, 0.8, delay), x: { duration: 0.6, repeat: s === 1 ? 3 : 0, delay: 0.5 }, opacity: T(r, 0.6) }}
              style={{ originX: 1, originY: 1 }}>
              <rect x={cx - 22} y={210} width={44} height={170} rx={8} fill={col('surface')} stroke={col(c, s === 0 ? 0.45 : 1)} strokeWidth={2.5} style={{ transition: 'stroke .6s' }} />
              <motion.rect x={cx - 22} y={210} width={44} height={170} rx={8} style={{ fill: col(c, tintA(i)), transition: 'fill .6s' }}
                animate={wave ? { opacity: [0.4, 1, 0.4] } : { opacity: 1 }} transition={wave ? { duration: 2.4, delay: i * 0.3, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }} />
              <line x1={cx - 14} x2={cx + 14} y1={295} y2={295} stroke={col(c, 0.35)} strokeWidth={2} />
              {PIPS[i + 1].map(([px, py], j) => <circle key={j} cx={cx + px * 10} cy={252 + py * 22} r={4.5} style={{ fill: col(c, s === 0 ? 0.55 : 0.9), transition: 'fill .6s' }} />)}
              {healthy && i === 0 && <Icon d={IC.heart} x={cx} y={336} size={22} color={col('accent')} w={2} />}
            </motion.g>
            <motion.g initial={{ opacity: 0, y: 8 }} animate={{ opacity: s === 5 && i > 0 ? 0.5 : 1, y: 0 }} transition={T(r, 0.6, s === 0 ? 0.3 + i * 0.15 : 0)}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.g key={healthy && (i === 0 || i === 5) ? 'h' : 'n'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={T(r, 0.4)}>
                  {healthy && i === 0
                    ? <><Txt x={cx} y={414} size={14} w={128} weight={700} fill={col('accent')}>{t('Who God is in Jesus')}</Txt><Txt x={cx} y={460} size={13} w={128} weight={600} fill={col('good')}>{t('Who we are in him')}</Txt></>
                    : <Txt x={cx} y={420} size={14} w={124} weight={i === 0 && s <= 1 ? 700 : 600} fill={fallen ? col('bad') : healthy ? col('good') : col('text')}>{healthy && i === 5 ? t('A life of love') : CH_LABELS[i]}</Txt>}
                </motion.g>
              </AnimatePresence>
            </motion.g>
          </g>
        );
      })}
      <AnimatePresence>
        {s === 3 && (
          <motion.g key="back" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: r ? 0 : 0.3 } }}>
            <Draw r={r} delay={0.3} dur={1.8} d="M800 196 C 640 80, 300 80, 150 176" stroke={col('accent-2')} w={3} dash="7 7" />
            <In r={r} delay={1.9} y={0}><path d="M150 176 l4 -16 M150 176 l16 -4" stroke={col('accent-2')} strokeWidth={3} strokeLinecap="round" /></In>
            <In r={r} delay={0.8}><Txt x={475} y={98} size={16} w={300} serif italic fill={col('accent-2')}>{t('Trace it back')}</Txt></In>
          </motion.g>
        )}
      </AnimatePresence>
      <Headline text={CHAIN[s].label} r={r} />
    </g>
  );
}
function ChainThumb({ r }: { r: boolean }) {
  return (
    <g>
      <line x1={30} y1={130} x2={292} y2={130} stroke={col('border')} strokeWidth={2} strokeLinecap="round" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.g key={i} style={{ originX: 1, originY: 1 }} initial={{ rotate: 0 }}
          animate={r ? { rotate: 0 } : { rotate: [0, 0, i < 5 ? 36 : 60, i < 5 ? 36 : 60, 0, 0] }}
          transition={r ? { duration: 0 } : { duration: 6, repeat: Infinity, times: [0, 0.1 + i * 0.06, 0.16 + i * 0.06, 0.7, 0.82 + (5 - i) * 0.02, 1], ease: 'easeInOut' }}>
          <rect x={50 + i * 42} y={74} width={14} height={56} rx={3} fill={col(i === 0 ? 'accent' : 'good', 0.18)} stroke={col(i === 0 ? 'accent' : 'good')} strokeWidth={1.5} />
          <circle cx={57 + i * 42} cy={88} r={2} fill={col(i === 0 ? 'accent' : 'good')} />
        </motion.g>
      ))}
    </g>
  );
}

/* ───────────────────────────── 5. Reading well ───────────────────────────── */

const RW_LAYERS = [t('The words'), t('The genre'), t('The literary context'), t('History and culture'), t('The whole canon'), t('Christ'), t('The community today'), t('Life')];
const READING: Scene[] = [
  { label: RW_LAYERS[0], caption: t('Start with the words themselves: what they meant in Hebrew, Aramaic or Greek, and how a translation carries them.'), refs: ['John 1:1'] },
  { label: RW_LAYERS[1], caption: t('Ask what kind of writing it is: story, law, poem, proverb, prophecy, letter or apocalypse. Each is read differently.') },
  { label: RW_LAYERS[2], caption: t('Read the verses around it: the paragraph, the section, the whole book. A verse lifted out can be made to say what it never meant.') },
  { label: RW_LAYERS[3], caption: t('Ask who wrote it, to whom, when and why, and which idioms and customs would have been obvious to the first hearers.') },
  { label: RW_LAYERS[4], caption: t('Let Scripture interpret Scripture: see where the passage sits in the one story from Genesis to Revelation.'), refs: ['Luke 24:27'] },
  { label: RW_LAYERS[5], caption: t('Ask how it points to Jesus, the centre and fulfilment of the story, the One the Scriptures testify about.'), refs: ['John 5:39'] },
  { label: RW_LAYERS[6], caption: t('Read with others: the church across the centuries and the believers around you guard against private readings.'), refs: ['Acts 17:11'] },
  { label: RW_LAYERS[7], caption: t('Finally, let it shape you. The goal of reading is not information but transformation.'), refs: ['Jas 1:22', 'Rom 12:2'] },
];
const CARD = { x: 400, y: 122, w: 500, h: 340 };
const CX = CARD.x + CARD.w / 2;
const BAR_X = (i: number) => CARD.x + 50 + i * 6.1;
const ARCS: [number, number][] = [[0, 42], [11, 60], [22, 45], [5, 64], [18, 39], [30, 50], [2, 63], [26, 44], [8, 57], [14, 65]];

function Chip({ x, y, w = 92, label, c = 'accent', on = 0 }: { x: number; y: number; w?: number; label: string; c?: string; on?: number }) {
  return <g><rect x={x - w / 2} y={y - 17} width={w} height={34} rx={17} fill={col(c, 0.08 + on * 0.2)} stroke={col(c, 0.4 + on * 0.6)} strokeWidth={1.5} /><Txt x={x} y={y} size={13} w={w - 10} halo={false} fill={col('text')}>{label}</Txt></g>;
}
function ReadingIllustration({ s, r }: ArtProps) {
  const url = useUrl();
  switch (s) {
    case 0: return (
      <g>
        <In r={r} scale={0.8} y={0}><text x={CX} y={292} textAnchor="middle" dominantBaseline="middle" fontSize={68} className="font-serif" fontWeight={600} fill={room()}>λόγος</text></In>
        <In r={r} delay={0.4}><text x={CX} y={340} textAnchor="middle" fontSize={18} fontStyle="italic" fill={col('muted')}>logos</text></In>
        {[t('word'), t('message'), t('reason')].map((l, i) => <In key={i} r={r} delay={0.8 + i * 0.2}><Chip x={CX - 110 + i * 110} y={398} w={100} label={l} /></In>)}
      </g>
    );
    case 1: {
      const g = [t('Story'), t('Law'), t('Poetry'), t('Wisdom'), t('Prophecy'), t('Letter'), t('Apocalypse')];
      return (
        <g>
          {g.map((l, i) => {
            const row = i < 4 ? 0 : 1, x = row ? CX - 105 + (i - 4) * 105 : CX - 157 + i * 105, y = 270 + row * 56;
            return (
              <In key={i} r={r} delay={0.1 * i}>
                <Chip x={x} y={y} w={98} label={l} c={PAL[i % PAL.length]} />
                {!r && <motion.rect x={x - 49} y={y - 17} width={98} height={34} rx={17} fill={col(PAL[i % PAL.length], 0.3)} initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.2, delay: 1 + i * 0.7, repeat: Infinity, repeatDelay: 7 * 0.7 - 1.2 }} />}
              </In>
            );
          })}
          <In r={r} delay={0.9}><Tag x={CX} y={412} w={420}>{t('What kind of writing is this?')}</Tag></In>
        </g>
      );
    }
    case 2: return (
      <g>
        {Array.from({ length: 8 }, (_, j) => <Draw key={j} r={r} delay={0.05 * j} dur={0.5} d={`M${CX - 170} ${232 + j * 24} h${300 + ((j * 37) % 40)}`} stroke={j === 4 ? room() : col('text', 0.2)} w={j === 4 ? 6 : 4} />)}
        {[{ pad: 10, a: 4, b: 4, l: t('Verse'), d: 0.6 }, { pad: 22, a: 2, b: 6, l: t('Paragraph'), d: 1.2 }, { pad: 34, a: 0, b: 7, l: t('Whole book'), d: 1.8 }].map((f, i) => (
          <g key={i}>
            <Draw r={r} delay={f.d} dur={0.8} stroke={col(PAL[i + 1], 0.8)} w={2} d={`M${CX - 170 - f.pad} ${232 + f.a * 24 - 12 - f.pad / 3} h${340 + f.pad * 2} v${(f.b - f.a) * 24 + 24 + (f.pad / 3) * 2} h${-(340 + f.pad * 2)} z`} />
            <In r={r} delay={f.d + 0.4}><Txt x={CX + 170 + f.pad + 6} y={232 + f.a * 24 - 12 - f.pad / 3} anchor="start" size={12} w={110} fill={col(PAL[i + 1])}>{f.l}</Txt></In>
          </g>
        ))}
      </g>
    );
    case 3: return (
      <g>
        <In r={r} scale={0.6} y={0}><circle cx={CX + 130} cy={250} r={22} fill={col('warn', 0.3)} stroke={col('warn')} strokeWidth={2} /></In>
        <Draw r={r} d={`M${CX - 200} 410 q60 -50 120 -20 t140 -10 t140 10`} stroke={col('ot', 0.6)} w={2.5} dur={1.2} />
        <In r={r} delay={0.5}>
          <path d={`M${CX - 60} 400 v-60 h12 v-10 h12 v10 h12 v-10 h12 v10 h12 v-10 h12 v10 h12 v60 z M${CX - 6} 400 v-24 a10 10 0 0 1 20 0 v24`} fill={col('ot', 0.15)} stroke={col('ot')} strokeWidth={2} strokeLinejoin="round" />
          <path d={`M${CX - 150} 408 q4 -50 -6 -78 M${CX - 156} 330 q-22 -6 -34 8 M${CX - 156} 330 q-10 -18 -30 -18 M${CX - 156} 330 q18 -16 36 -8 M${CX - 156} 330 q20 0 30 16`} fill="none" stroke={col('good')} strokeWidth={3} strokeLinecap="round" />
        </In>
        <In r={r} delay={0.9}><Txt x={CX} y={262} size={19} w={300} serif italic fill={col('muted')}>{t('Who? To whom? When? Why?')}</Txt></In>
      </g>
    );
    case 4: case 5: {
      const christ = s === 5;
      return (
        <g>
          {Array.from({ length: 66 }, (_, i) => (
            <motion.rect key={i} x={BAR_X(i) - 2} width={4} rx={2} fill={col(i < 39 ? 'ot' : 'nt', 0.75)} initial={{ height: 0, y: 410 }} animate={{ height: 38, y: 372 }} transition={T(r, 0.5, i * 0.012)} />
          ))}
          {christ
            ? Array.from({ length: 17 }, (_, k) => { const i = k * 4 + (k > 9 ? 1 : 0); const x = BAR_X(Math.min(65, i)); return <Draw key={k} r={r} delay={0.5 + k * 0.05} dur={0.9} d={`M${x} 366 Q${(x + CX) / 2} ${300 - Math.abs(x - CX) * 0.1} ${CX} 262`} stroke={room(0.45)} w={1.5} />; })
            : ARCS.map(([a, b], k) => { const xa = BAR_X(a), xb = BAR_X(b); return <Draw key={k} r={r} delay={0.6 + k * 0.15} dur={0.9} d={`M${xa} 366 Q${(xa + xb) / 2} ${366 - Math.abs(xb - xa) * 0.36} ${xb} 366`} stroke={col(PAL[k % PAL.length], 0.6)} w={1.8} />; })}
          {christ && <In r={r} delay={1.2} scale={0.5} y={0}><circle cx={CX} cy={246} r={44} fill={url('light')} /><Icon d={IC.cross} x={CX} y={246} size={34} color={room()} w={2.5} /></In>}
          <Txt x={BAR_X(0)} y={428} anchor="start" size={12} w={120} fill={col('ot')}>{t('Genesis')}</Txt>
          <Txt x={BAR_X(65)} y={428} anchor="end" size={12} w={120} fill={col('nt')}>{t('Revelation')}</Txt>
        </g>
      );
    }
    case 6: return (
      <g>
        <motion.g animate={r ? undefined : { rotate: 360 }} transition={r ? undefined : { duration: 80, repeat: Infinity, ease: 'linear' }}>
          {Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2; return <circle key={i} cx={CX + Math.cos(a) * 118} cy={318 + Math.sin(a) * 86} r={6} fill={col('muted', 0.35)} />; })}
        </motion.g>
        {Array.from({ length: 7 }, (_, i) => { const a = (i / 7) * Math.PI * 2 - Math.PI / 2; return <In key={i} r={r} delay={0.1 * i} y={0} scale={0.5}><Person x={CX + Math.cos(a) * 70} y={330 + Math.sin(a) * 50} k={0.5} c={col(PAL[i % PAL.length], 0.7)} /></In>; })}
        <In r={r} delay={0.8} scale={0.6} y={0}><Icon d={IC.book} x={CX} y={318} size={34} color={col('accent')} w={2} /></In>
      </g>
    );
    default: return (
      <g>
        <Icon d={IC.book} x={CX} y={414} size={46} color={col('accent')} w={2} />
        <Draw r={r} delay={0.2} dur={1.4} d={`M${CX} 396 C ${CX - 20} 350, ${CX + 20} 310, ${CX} 262`} stroke={col('good')} w={4} />
        {[[CX, 350, -1], [CX + 4, 318, 1], [CX - 2, 290, -1]].map(([x, y, side], i) => (
          <In key={i} r={r} delay={0.9 + i * 0.25} scale={0.2} y={0}><ellipse cx={x + side * 18} cy={y} rx={18} ry={8} transform={`rotate(${side * -25} ${x + side * 18} ${y})`} fill={col('good', 0.3)} stroke={col('good')} strokeWidth={2} /></In>
        ))}
        <In r={r} delay={1.7} scale={0.3} y={0}>
          <circle cx={CX} cy={244} r={40} fill={url('light')} />
          <Icon d={IC.heart} x={CX} y={246} size={34} color={col('accent-2')} fill={col('accent-2', 0.3)} w={2} />
        </In>
      </g>
    );
  }
}
function ReadingArt({ s, r }: ArtProps) {
  const url = useUrl();
  return (
    <g>
      <Ambient r={r} n={10} />
      <line x1={96} y1={80} x2={96} y2={472} stroke={col('border')} strokeWidth={3} strokeLinecap="round" />
      <motion.line x1={96} y1={80} x2={96} initial={false} animate={{ y2: 80 + s * 56 }} transition={T(r, 0.9)} stroke={room()} strokeWidth={3} strokeLinecap="round" />
      {RW_LAYERS.map((l, i) => (
        <g key={i}>
          <circle cx={96} cy={80 + i * 56} r={7} fill={i <= s ? room() : col('surface')} stroke={i <= s ? room() : col('border')} strokeWidth={2} style={{ transition: 'fill .4s, stroke .4s' }} />
          <motion.g initial={false} animate={{ opacity: i === s ? 1 : i < s ? 0.7 : 0.4, x: i === s ? 6 : 0 }} transition={T(r, 0.5)}>
            <Txt x={136} y={80 + i * 56} anchor="start" size={i === s ? 17 : 15} w={230} weight={i === s ? 700 : 600} fill={i === s ? room() : col('text')} halo={false}>{l}</Txt>
          </motion.g>
        </g>
      ))}
      {/* magnifying glass */}
      <motion.g initial={false} animate={{ y: 80 + s * 56 }} transition={T(r, 0.9)}>
        <g transform="translate(96 0)">
          <circle r={24} fill={col('surface', 0.35)} stroke={col('text', 0.75)} strokeWidth={4} />
          <path d="M-12 -10 a15 15 0 0 1 10 -8" fill="none" stroke="#fff" strokeOpacity={0.8} strokeWidth={3} strokeLinecap="round" />
          <line x1={17} y1={17} x2={34} y2={34} stroke={col('text', 0.75)} strokeWidth={8} strokeLinecap="round" />
        </g>
      </motion.g>
      {/* card stack */}
      <AnimatePresence initial={false}>
        {READING.map((sc, i) => {
          const d = s - i;
          if (d < 0 || d > 3) return null;
          return (
            <motion.g key={i} initial={{ opacity: 0, y: 140 }} animate={{ opacity: 1 - d * 0.22, y: -d * 30, scale: 1 - d * 0.05 }} exit={{ opacity: 0, y: d < 0 ? 140 : -120, transition: T(r, 0.5) }} transition={T(r, 0.8)}>
              <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx={26} fill={col('surface')} stroke={col('border')} strokeWidth={1.5} filter={url('shadow')} />
              <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx={26} fill={col(PAL[i % PAL.length], 0.05)} />
              <circle cx={CARD.x + 30} cy={CARD.y + 18} r={4} fill={col(PAL[i % PAL.length])} />
              <Txt x={CARD.x + 42} y={CARD.y + 18} anchor="start" size={12} w={420} weight={700} fill={col('muted')} halo={false}>{`${t('Layer {n}', { n: i + 1 })} · ${sc.label}`}</Txt>
              {d === 0 && <Txt x={CARD.x + 30} y={CARD.y + 58} anchor="start" size={26} w={440} serif weight={700} halo={false}>{sc.label}</Txt>}
            </motion.g>
          );
        })}
      </AnimatePresence>
      <AnimatePresence initial={false}>
        <motion.g key={s} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: r ? 0 : 0.2 } }} transition={T(r, 0.5, 0.4)}>
          <ReadingIllustration s={s} r={r} />
        </motion.g>
      </AnimatePresence>
      <Txt x={56} y={30} anchor="start" size={13} w={300} weight={700} fill={col('muted')} halo={false}>{t('Eight layers of reading')}</Txt>
    </g>
  );
}
function ReadingThumb({ r }: { r: boolean }) {
  return (
    <g>
      {[2, 1, 0].map((d) => <rect key={d} x={140 + d * 0} y={44 - d * 12} width={150 - d * 12} height={110} rx={12} transform={`translate(${d * 6} 0)`} fill={col('surface')} stroke={col('border')} strokeWidth={1.2} opacity={1 - d * 0.25} />)}
      {[0, 1, 2, 3, 4].map((j) => <line key={j} x1={156} x2={262 - (j % 2) * 20} y1={70 + j * 16} y2={70 + j * 16} stroke={j === 2 ? room() : col('text', 0.2)} strokeWidth={j === 2 ? 4 : 3} strokeLinecap="round" />)}
      <line x1={40} y1={30} x2={40} y2={150} stroke={col('border')} strokeWidth={2} strokeLinecap="round" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <circle key={i} cx={40} cy={30 + i * 17} r={3} fill={room(0.7)} />)}
      <motion.g animate={r ? undefined : { y: [0, 119, 0] }} transition={LOOP(r, 8)}>
        <circle cx={40} cy={30} r={11} fill={col('surface', 0.3)} stroke={col('text', 0.75)} strokeWidth={2.5} />
        <line x1={48} y1={38} x2={58} y2={48} stroke={col('text', 0.75)} strokeWidth={4} strokeLinecap="round" />
      </motion.g>
    </g>
  );
}

/* ───────────────────────────── 6. The covenant thread ───────────────────────────── */

const CV_PTS: Pt[] = [[96, 300], [226, 258], [356, 312], [486, 248], [616, 304], [746, 254], [866, 290]];
const CV_SS = segs(CV_PTS);
const CV_KNOTS = [
  { label: t('Noah'), icon: IC.rainbow, promise: t('Never again a flood') },
  { label: t('Abraham'), icon: IC.star, promise: t('A people, a land, a blessing') },
  { label: t('Sinai'), icon: IC.tablets, promise: t('A treasured people') },
  { label: t('David'), icon: IC.crown, promise: t('A throne for ever') },
  { label: t('New covenant'), icon: IC.heart, promise: t('The law written on hearts') },
  { label: t('Jesus'), icon: IC.cup, promise: t('The new covenant in his blood') },
  { label: t('All nations'), icon: IC.globe, promise: t('Blessing for every people') },
];
const COVENANT: Scene[] = [
  { label: t('Noah'), caption: t('After the flood God promises never again to destroy the earth, and sets the rainbow as the sign of his covenant with every living creature.'), refs: ['Gen 9:12-13'] },
  { label: t('Abraham'), caption: t('God binds himself by oath to Abraham: descendants like the stars and a land, passing alone between the pieces.'), refs: ['Gen 15:5', 'Gen 15:17-18'] },
  { label: t('Sinai'), caption: t('At Sinai, through Moses, God makes Israel his treasured people, a kingdom of priests, and gives the Law as the shape of covenant life.'), refs: ['Exod 19:5-6', 'Exod 24:7-8'] },
  { label: t('David'), caption: t('God promises David a house and a son whose throne will last for ever.'), refs: ['2 Sam 7:12-16'] },
  { label: t('A new covenant promised'), caption: t('Through Jeremiah God promises a new covenant: his law written on hearts, and sins forgiven and remembered no more.'), refs: ['Jer 31:31-34'] },
  { label: t('Fulfilled in Jesus'), caption: t('At the Last Supper Jesus takes the cup: “This cup is the new covenant in my blood.”'), refs: ['Luke 22:20'] },
  { label: t('For all nations'), caption: t('The thread was never for one people only: in Abraham’s seed all the nations are blessed.'), refs: ['Gal 3:8', 'Gal 3:29'] },
];
function CovenantArt({ s, r }: ArtProps) {
  const url = useUrl(); const [ex, ey] = CV_PTS[6];
  return (
    <g>
      <Ambient r={r} />
      <path d={`M20 330 C 50 320, 70 306, ${CV_PTS[0][0]} ${CV_PTS[0][1]}`} fill="none" stroke={col('gold', 0.5)} strokeWidth={3} strokeDasharray="2 7" strokeLinecap="round" />
      <path d={fullD(CV_SS)} fill="none" stroke={col('border')} strokeWidth={2} strokeDasharray="2 9" strokeLinecap="round" />
      <Trail ss={CV_SS} at={s} r={r} stroke={url('gold')} width={16} opacity={0.3} filter={url('soft')} />
      <Trail ss={CV_SS} at={s} r={r} stroke={url('gold')} width={5} />
      <AnimatePresence>
        {s === 6 && (
          <motion.g key="nations" initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: r ? 0 : 0.3 } }}>
            {Array.from({ length: 7 }, (_, k) => {
              const y = 120 + k * 52;
              return (
                <g key={k}>
                  <Draw r={r} delay={0.6 + k * 0.08} dur={1.1} d={`M${ex} ${ey} C ${ex + 40} ${ey}, ${ex + 40} ${y}, 948 ${y}`} stroke={col(PAL[k % PAL.length], 0.8)} w={2.5} />
                  <In r={r} delay={1.5 + k * 0.08} scale={0.3} y={0}><circle cx={948} cy={y} r={5} fill={col(PAL[k % PAL.length])} /></In>
                </g>
              );
            })}
          </motion.g>
        )}
      </AnimatePresence>
      {CV_KNOTS.map((k, i) => {
        const [x, y] = CV_PTS[i]; const act = i === s, lit = i <= s;
        return (
          <g key={i}>
            <motion.g initial={false} animate={{ opacity: lit ? 1 : 0, y: lit ? 0 : 16, scale: act ? 1.15 : 0.82 }} transition={T(r, 0.7, act ? 0.6 : 0)}>
              <g transform={`translate(${x} ${y - 112})`}>
                {act && <circle r={56} fill={url('halo')} />}
                <circle r={32} fill={col('surface')} stroke={col('gold')} strokeWidth={2} />
                {i === 0
                  ? ['accent-2', 'warn', 'good', 'nt'].map((c, j) => <path key={c} d={`M${-20 + j * 4} 10 a${20 - j * 4} ${20 - j * 4} 0 0 1 ${40 - j * 8} 0`} fill="none" stroke={col(c)} strokeWidth={3} strokeLinecap="round" />)
                  : <Icon d={k.icon} x={0} y={0} size={32} color={col('gold')} w={2} />}
              </g>
              <line x1={x} y1={y - 78} x2={x} y2={y - 16} stroke={col('gold', 0.4)} strokeWidth={1.5} strokeDasharray="2 4" />
            </motion.g>
            <circle cx={x} cy={y} r={act ? 11 : 8} fill={lit ? col('gold') : col('surface')} stroke={lit ? col('gold') : col('border')} strokeWidth={2.5} style={{ transition: 'fill .5s, stroke .5s' }} />
            <motion.g initial={false} animate={{ opacity: act ? 1 : lit ? 0.75 : 0.35 }} transition={T(r, 0.5)}>
              <Txt x={x} y={y + 36} size={act ? 17 : 14} w={124} weight={700} fill={act ? col('text') : col('muted')}>{k.label}</Txt>
            </motion.g>
          </g>
        );
      })}
      <AnimatePresence initial={false}>
        <motion.g key={s} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: r ? 0 : 0.25 } }} transition={T(r, 0.6, 0.9)}>
          <Txt x={Math.min(820, Math.max(140, CV_PTS[s][0]))} y={CV_PTS[s][1] + 82} size={15} w={220} serif italic fill={col('gold')}>{CV_KNOTS[s].promise}</Txt>
        </motion.g>
      </AnimatePresence>
      <Traveller ss={CV_SS} at={s} r={r} size={0.8} />
      <Headline text={COVENANT[s].label} r={r} y={60} />
      <Txt x={56} y={502} anchor="start" size={13} w={420} weight={700} fill={col('muted')} halo={false}>{t('One faithful God, one golden thread')}</Txt>
    </g>
  );
}
function CovenantThumb({ r }: { r: boolean }) {
  const url = useUrl(); const ss = useMemo(() => scaleSegs(CV_SS, 1 / 3), []); const d = fullD(ss);
  return (
    <g transform="translate(0 -6)">
      <path d={d} fill="none" stroke={url('gold')} strokeWidth={6} opacity={0.25} filter={url('soft')} />
      <path d={d} fill="none" stroke={url('gold')} strokeWidth={2.5} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={r ? 0 : 1}>
        {!r && <animate attributeName="stroke-dashoffset" values="1;0;0" keyTimes="0;.8;1" dur="6s" repeatCount="indefinite" />}
      </path>
      {CV_PTS.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x / 3} cy={y / 3} r={3.5} fill={col('gold')} />
          <circle cx={x / 3} cy={y / 3 - 34} r={10} fill={col('surface')} stroke={col('gold', 0.7)} strokeWidth={1} />
          <Icon d={CV_KNOTS[i].icon} x={x / 3} y={y / 3 - 34} size={11} color={col('gold')} w={1.2} />
        </g>
      ))}
      <g>
        <circle r={11} fill={url('light')} /><circle r={2} fill="#fff" />
        {r ? <animateTransform attributeName="transform" type="translate" values={`${CV_PTS[5][0] / 3} ${CV_PTS[5][1] / 3}`} dur="1s" fill="freeze" />
          : <animateMotion dur="6s" repeatCount="indefinite" path={d} keyPoints="0;1;1" keyTimes="0;.8;1" calcMode="linear" />}
      </g>
    </g>
  );
}

/* ───────────────────────────── registry ───────────────────────────── */

const DEFS: Record<ReelId, ReelDef> = {
  'big-story': { title: t('The Big Story'), blurb: t('The whole Bible as one story, from creation to new creation.'), minutes: 1, scenes: BIG_STORY, Art: BigStoryArt, Thumb: BigStoryThumb },
  'how-we-got-it': { title: t('How We Got the Bible'), blurb: t('From events and memory to the book in your hands.'), minutes: 1, scenes: HOW, Art: HowArt, Thumb: HowThumb },
  'jesus-lens': { title: t('Jesus as the Lens'), blurb: t('Reading the many voices of Scripture through the One they point to.'), minutes: 1, scenes: LENS_SCENES, Art: LensArt, Thumb: LensThumb },
  'the-chain': { title: t('The Chain'), blurb: t('How our starting assumptions shape everything downstream, and a better place to start.'), minutes: 1, scenes: CHAIN, Art: ChainArt, Thumb: ChainThumb },
  'reading-well': { title: t('Reading Well'), blurb: t('Eight layers to look through whenever you read a passage.'), minutes: 1, scenes: READING, Art: ReadingArt, Thumb: ReadingThumb },
  'covenant-thread': { title: t('The Covenant Thread'), blurb: t('God’s covenants as one golden thread running through history.'), minutes: 1, scenes: COVENANT, Art: CovenantArt, Thumb: CovenantThumb },
};
export const REELS: { id: ReelId; title: string; blurb: string; minutes: number }[] = (Object.keys(DEFS) as ReelId[]).map((id) => ({ id, title: DEFS[id].title, blurb: DEFS[id].blurb, minutes: DEFS[id].minutes }));

/* ───────────────────────────── player ───────────────────────────── */

const PlayI = () => <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.2-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5z" fill="currentColor" /></svg>;
const PauseI = () => <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor" /><rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor" /></svg>;
const Chevron = ({ dir }: { dir: 'l' | 'r' }) => <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path d={dir === 'l' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const ReplayI = () => <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>;

const Stage = memo(function Stage({ id, s, r }: { id: ReelId; s: number; r: boolean }) {
  const Art = DEFS[id].Art;
  return <Art s={s} r={r} />;
});

export default function Reel({ id, autoPlay }: { id: ReelId; autoPlay?: boolean }) {
  const def = DEFS[id]; const n = def.scenes.length;
  const r = useMemo(() => prefersReduced(), []);
  const uid = 'reel' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const [s, setS] = useState(0);
  const [playing, setPlaying] = useState(!!autoPlay && !r);
  const [started, setStarted] = useState(!!autoPlay && !r);
  const [hover, setHover] = useState(false);
  const [inView, setInView] = useState(true);
  const [ended, setEnded] = useState(false);
  const elapsed = useRef(0);
  const fill = useRef<HTMLSpanElement>(null);
  const root = useRef<HTMLDivElement>(null);

  const paint = () => { if (fill.current) fill.current.style.width = `${Math.min(100, (elapsed.current / SCENE_MS) * 100)}%`; };
  const go = useCallback((i: number) => { elapsed.current = 0; setEnded(false); setStarted(true); setS(Math.max(0, Math.min(n - 1, i))); }, [n]);

  useEffect(() => { elapsed.current = 0; setS(0); setEnded(false); }, [id]);
  useEffect(() => {
    const el = root.current; if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el); return () => io.disconnect();
  }, []);
  useEffect(() => {
    paint();
    if (!playing || hover || !inView) return;
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      elapsed.current += Math.min(100, now - last); last = now; paint();
      if (elapsed.current >= SCENE_MS) {
        if (s < n - 1) go(s + 1); else { elapsed.current = SCENE_MS; setPlaying(false); setEnded(true); }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, hover, inView, s, n, go]);

  const toggle = () => {
    setStarted(true);
    if (playing) { setPlaying(false); return; }
    if (ended) go(0);
    setPlaying(true);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(s + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(s - 1); }
    else if ((e.key === ' ' || e.key === 'k') && e.target === e.currentTarget) { e.preventDefault(); toggle(); }
  };
  const scene = def.scenes[s];

  return (
    <div ref={root} tabIndex={0} onKeyDown={onKey} role="region" aria-roledescription={t('Reel')} aria-label={def.title} className="reel rounded-[1.75rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-line shadow-[0_18px_50px_-24px_rgb(var(--glow)/.45)]" style={{ background: STAGE_BG, aspectRatio: '16 / 9' }}
        onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(true)} onPointerLeave={() => setHover(false)}>
        <svg viewBox="0 0 960 540" className="absolute inset-0 w-full h-full select-none" role="img" aria-label={`${def.title}: ${scene.label}`}>
          <IdCtx.Provider value={uid}>
            <Defs p={uid} />
            <Stage id={id} s={s} r={r} />
          </IdCtx.Provider>
        </svg>
        {/* progress */}
        <div className="absolute left-4 right-4 bottom-3 flex gap-1.5" aria-hidden>
          {def.scenes.map((_, i) => (
            <span key={i} className="relative flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgb(var(--text) / .12)' }}>
              <span ref={i === s ? fill : undefined} className="absolute inset-y-0 left-0 rounded-full" style={{ background: room(), width: i < s ? '100%' : i === s ? `${Math.min(100, (elapsed.current / SCENE_MS) * 100)}%` : '0%' }} />
            </span>
          ))}
        </div>
        <AnimatePresence>
          {!started && (
            <motion.button key="poster" type="button" onClick={toggle} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={T(r, 0.4)}
              className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgb(var(--surface) / .28)' }} aria-label={t('Play reel')}>
              <span className="w-16 h-16 md:w-20 md:h-20 rounded-full grid place-items-center shadow-xl transition-transform hover:scale-105" style={{ background: room(), color: 'rgb(var(--accent-ink))' }}>
                <span className="scale-150 translate-x-[2px]"><PlayI /></span>
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 px-1 min-h-[6.5rem]" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={s} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={T(r, 0.35)}>
            <div className="eyebrow mb-1">{t('Scene {n} of {total}', { n: s + 1, total: n })} · {scene.label}</div>
            <p className="font-serif text-[1.08rem] leading-relaxed max-w-[68ch]">{scene.caption}</p>
            {scene.refs?.length ? <div className="mt-2"><Refs refs={scene.refs} /></div> : null}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button type="button" className="btn !p-2.5 disabled:opacity-40" onClick={() => go(s - 1)} disabled={s === 0} aria-label={t('Previous scene')}><Chevron dir="l" /></button>
        <button type="button" onClick={toggle} className="w-11 h-11 rounded-full grid place-items-center shadow-md transition-transform hover:scale-105 active:scale-95" style={{ background: room(), color: 'rgb(var(--accent-ink))' }}
          aria-label={playing ? t('Pause reel') : ended ? t('Replay') : t('Play reel')}>
          {playing ? <PauseI /> : ended ? <ReplayI /> : <span className="translate-x-[1px]"><PlayI /></span>}
        </button>
        <button type="button" className="btn !p-2.5 disabled:opacity-40" onClick={() => go(s + 1)} disabled={s === n - 1} aria-label={t('Next scene')}><Chevron dir="r" /></button>
        <div className="flex-1 flex items-center justify-center flex-wrap">
          {def.scenes.map((sc, i) => (
            <button key={i} type="button" onClick={() => go(i)} className="p-1.5 group" aria-label={t('Scene {n}', { n: i + 1 }) + ': ' + sc.label} aria-current={i === s ? 'step' : undefined} title={sc.label}>
              <span className="block h-2 rounded-full transition-all duration-300 group-hover:opacity-80" style={{ width: i === s ? 22 : 8, background: i <= s ? room() : 'rgb(var(--border))' }} />
            </button>
          ))}
        </div>
        <span className="text-xs text-muted tabular-nums w-10 text-right">{s + 1} / {n}</span>
      </div>
    </div>
  );
}

/** A thumbnail card with a looping mini-animation and a play button. */
export function ReelCard({ id, onOpen }: { id: ReelId; onOpen?: () => void }) {
  const def = DEFS[id];
  const r = useMemo(() => prefersReduced(), []);
  const uid = 'thumb' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const Thumb = def.Thumb;
  return (
    <motion.button type="button" onClick={onOpen} whileHover={r ? undefined : { y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="group card !rounded-[1.5rem] overflow-hidden text-left w-full transition-shadow hover:shadow-[0_18px_40px_-20px_rgb(var(--glow)/.5)]" aria-label={`${def.title}: ${def.blurb}`}>
      <span className="relative block" style={{ background: STAGE_BG, aspectRatio: '16 / 9' }}>
        <svg viewBox="0 0 320 180" className="absolute inset-0 w-full h-full" aria-hidden>
          <IdCtx.Provider value={uid}>
            <Defs p={uid} w={320} />
            <Ambient r={r} w={320} h={180} n={8} />
            <Thumb r={r} />
          </IdCtx.Provider>
        </svg>
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-12 h-12 rounded-full grid place-items-center shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:scale-110" style={{ background: 'rgb(var(--surface) / .82)', color: room() }}>
            <span className="translate-x-[1px]"><PlayI /></span>
          </span>
        </span>
        <span className="absolute left-3 top-3 chip !bg-surface/80 backdrop-blur-sm">{t('{n} scenes', { n: def.scenes.length })}</span>
      </span>
      <span className="block p-4">
        <span className="eyebrow block">{t('Reel')} · {t('{n} min', { n: def.minutes })}</span>
        <span className="display block text-lg leading-tight mt-0.5">{def.title}</span>
        <span className="block text-sm text-muted mt-1 leading-snug">{def.blurb}</span>
      </span>
    </motion.button>
  );
}
