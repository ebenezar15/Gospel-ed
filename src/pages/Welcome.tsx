/** The home page: greeting, an animated hero, today's verse, course progress, animated explainer reels,
 *  an explore grid of every section, the River of Ages and big questions. */
import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Reel, { REELS, ReelCard, type ReelId } from '../components/Reels';
import { NAV } from '../components/Layout';
import { River, DailyVerse } from './Home';
import { courseLessons, guides, people, books, allDebates, places } from '../data';
import { useUI, prefersReduced } from '../store';
import { t, tv } from '../i18n';

const TONES = ['accent', 'nt', 'ot', 'good', 'accent-2'];
const c = (k: string, a = 1) => `rgb(var(--${k}) / ${a})`;

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? t('Peace to you tonight') : h < 12 ? t('Good morning') : h < 17 ? t('Good afternoon') : t('Good evening');
}

/** Hero illustration: an open book with the story's arc of light rising out of it. */
function HeroArt() {
  const still = prefersReduced();
  const arc = 'M60 250 C 140 60, 360 40, 440 230';
  const stops = [0.08, 0.24, 0.4, 0.56, 0.72, 0.88];
  return (
    <svg viewBox="0 0 500 320" className="w-full h-full" role="img" aria-label={t('An open book with an arc of light rising from it')}>
      <defs>
        <radialGradient id="hero-glow" cx="50%" cy="60%" r="55%"><stop offset="0" stopColor={c('accent', 0.35)} /><stop offset="1" stopColor={c('accent', 0)} /></radialGradient>
        <linearGradient id="hero-arc" x1="0" x2="1"><stop offset="0" stopColor={c('nt')} /><stop offset=".5" stopColor={c('accent')} /><stop offset="1" stopColor={c('accent-2')} /></linearGradient>
        <filter id="hero-blur"><feGaussianBlur stdDeviation="6" /></filter>
      </defs>
      <ellipse cx="250" cy="200" rx="230" ry="130" fill="url(#hero-glow)" />
      <motion.path d={arc} fill="none" stroke="url(#hero-arc)" strokeWidth="5" strokeLinecap="round" initial={{ pathLength: still ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.2, ease: 'easeInOut' }} />
      <path d={arc} fill="none" stroke="url(#hero-arc)" strokeWidth="14" opacity=".25" filter="url(#hero-blur)" />
      {stops.map((s, i) => (
        <motion.circle key={i} r="7" fill={c(TONES[i % TONES.length])} stroke="rgb(var(--surface))" strokeWidth="3"
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.6 + i * 0.22, type: 'spring' }}
          style={{ offsetPath: `path('${arc}')`, offsetDistance: `${s * 100}%` } as CSSProperties} />))}
      {!still && <circle r="5" fill="#fff" opacity=".95"><animateMotion dur="5s" repeatCount="indefinite" path={arc} /></circle>}
      {/* open book */}
      <motion.g initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }}>
        <path d="M250 262 C 205 238, 150 236, 100 248 L 100 300 C 150 288, 205 290, 250 312 Z" fill="rgb(var(--surface))" stroke={c('accent', 0.5)} strokeWidth="2" />
        <path d="M250 262 C 295 238, 350 236, 400 248 L 400 300 C 350 288, 295 290, 250 312 Z" fill="rgb(var(--surface))" stroke={c('accent', 0.5)} strokeWidth="2" />
        {[0, 1, 2, 3].map((k) => <path key={k} d={`M${120 + 0} ${262 + k * 9} C 160 ${254 + k * 9}, 200 ${256 + k * 9}, 235 ${270 + k * 9}`} fill="none" stroke={c('muted', 0.35)} strokeWidth="2" strokeLinecap="round" />)}
        {[0, 1, 2, 3].map((k) => <path key={`r${k}`} d={`M265 ${270 + k * 9} C 300 ${256 + k * 9}, 340 ${254 + k * 9}, 380 ${262 + k * 9}`} fill="none" stroke={c('muted', 0.35)} strokeWidth="2" strokeLinecap="round" />)}
      </motion.g>
      {!still && [...Array(10)].map((_, i) => (
        <motion.circle key={`p${i}`} cx={170 + (i * 37) % 170} cy={250} r={1.5 + (i % 3)} fill={c(TONES[i % TONES.length], 0.7)}
          animate={{ cy: [250, 120 - (i % 4) * 20], opacity: [0, 1, 0] }} transition={{ duration: 4 + (i % 4), repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }} />))}
    </svg>
  );
}

export default function Welcome() {
  const { courseDone } = useUI();
  const [reel, setReel] = useState<ReelId | null>(null);
  const next = courseLessons.find((l) => !courseDone.includes(l.id)) ?? courseLessons[0];
  const pct = courseLessons.length ? Math.round((courseLessons.filter((l) => courseDone.includes(l.id)).length / courseLessons.length) * 100) : 0;
  const stats = [{ n: people.length, l: t('lives') }, { n: places.length, l: t('places') }, { n: books.length, l: t('books') }, { n: allDebates.length, l: t('debates') }, { n: courseLessons.length, l: t('lessons') }];
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-line/60" style={{ background: `linear-gradient(130deg, ${c('accent', 0.14)}, ${c('accent-2', 0.10)} 50%, ${c('nt', 0.08)})` }}>
        <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-center">
          <div className="p-6 md:p-10">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-bold text-accent">{greeting()}</motion.div>
            <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="text-4xl md:text-6xl font-bold leading-[1.04] mt-2">
              {t('Every name in the story')}<br /><span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(90deg, ${c('accent')}, ${c('accent-2')})` }}>{t('has a road.')}</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-muted text-lg mt-3 max-w-[48ch]">{t('Explore Scripture, its people, places, books and arguments, and learn to read it well, with maps, motion and diagrams.')}</motion.p>
            <div className="flex flex-wrap gap-2 mt-5">
              {next && <Link to={`/course/${next.id}`} className="btn btn-primary !py-2.5 !px-5">{pct ? t('Continue the course') : t('Start the Bible course')} →</Link>}
              <button className="btn !py-2.5 !px-5" onClick={() => setReel('big-story')}>▶ {t('Watch the big story')}</button>
            </div>
            <div className="flex flex-wrap gap-5 mt-6">{stats.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.07 }}><div className="display text-3xl font-bold tabular">{s.n}</div><div className="text-xs text-muted uppercase tracking-wider">{s.l}</div></motion.div>))}</div>
          </div>
          <div className="h-[240px] md:h-[360px] p-2"><HeroArt /></div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <DailyVerse />
        <div className="card p-5 flex flex-col">
          <div className="eyebrow mb-2">{t('Your course')}</div>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 shrink-0"><svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90"><circle cx="18" cy="18" r="15.9" fill="none" stroke="rgb(var(--border))" strokeWidth="3.2" /><motion.circle cx="18" cy="18" r="15.9" fill="none" stroke="rgb(var(--accent))" strokeWidth="3.2" strokeLinecap="round" initial={{ strokeDasharray: '0 100' }} animate={{ strokeDasharray: `${pct} 100` }} transition={{ duration: 1.2 }} /></svg><span className="absolute inset-0 flex items-center justify-center font-bold">{pct}%</span></div>
            <div className="min-w-0">{next && <><div className="text-sm text-muted">{t('Next lesson')}</div><Link to={`/course/${next.id}`} className="font-bold leading-tight hover:text-accent block">{next.n}. {next.title}</Link><div className="text-xs text-muted mt-0.5">{t('{m} min', { m: next.minutes })}</div></>}</div>
          </div>
          <Link to="/course" className="text-sm font-semibold text-accent mt-auto pt-3">{t('Open the course map')} →</Link>
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between gap-3 mb-3"><h2 className="text-3xl font-bold">{t('Watch and understand')}</h2><span className="text-sm text-muted">{t('Short animated explainers')}</span></div>
        <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1 snap-x tabs-scroll">{REELS.map((r) => <div key={r.id} className="w-[280px] shrink-0 snap-start"><ReelCard id={r.id} onOpen={() => setReel(r.id)} /></div>)}</div>
      </section>

      <section>
        <h2 className="text-3xl font-bold mb-4">{t('Explore')}</h2>
        <div className="space-y-5">{NAV.map((g, gi) => { const tone = TONES[gi % TONES.length]; const items = g.items.filter((i) => i.to !== '/'); return (
          <div key={g.group}>
            <div className="eyebrow mb-2" style={{ color: c(tone) }}>{g.group}</div>
            <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">{items.map((i, k) => (
              <motion.div key={i.to} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: k * 0.04 }}>
                <Link to={i.to} className="card p-4 h-full flex flex-col gap-2 group">
                  <span className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg transition-transform group-hover:scale-110 group-hover:-rotate-6" style={{ background: c(tone, 0.12), color: c(tone) }}>{i.glyph}</span>
                  <span className="font-semibold leading-tight">{i.label}</span>
                </Link>
              </motion.div>))}</div>
          </div>); })}</div>
      </section>

      <section className="card p-4 md:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2"><h2 className="text-2xl font-bold">{t('The River of Ages')}</h2><span className="text-sm text-muted">{t('Drag the red lens through time. Dots are people; lit dots were alive that year. Double-click an era to open it.')}</span></div>
        <River />
      </section>

      {guides.length > 0 && <section>
        <div className="flex items-baseline justify-between gap-3 mb-4"><h2 className="text-3xl font-bold">{t('Big questions, answered plainly')}</h2><Link to="/guides" className="text-sm text-accent font-semibold">{t('All {n} study guides →', { n: guides.length })}</Link></div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{guides.slice(0, 6).map((g) => (
          <Link key={g.id} to={`/guides/${g.id}`} className="card p-4 flex flex-col gap-1.5 group"><span className="eyebrow">{tv(g.category)}</span><span className="display text-lg leading-snug font-semibold group-hover:text-accent">{g.question}</span><span className="font-serif text-muted line-clamp-2">{g.plainAnswer}</span></Link>))}</div>
      </section>}

      <AnimatePresence>{reel && (
        <motion.div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-3 md:p-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setReel(null)}>
          <motion.div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-surface rounded-[1.8rem] p-3 md:p-5 shadow-2xl" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2"><span className="font-bold">{REELS.find((r) => r.id === reel)?.title}</span><button className="btn !px-3" onClick={() => setReel(null)} aria-label={t('Close')}>✕</button></div>
            <Reel id={reel} autoPlay />
          </motion.div>
        </motion.div>)}</AnimatePresence>
    </div>
  );
}
