import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { quiz, people } from '../data';
import { PageHeader, Refs, Tabs, Empty } from '../components/ui';
import { useUI } from '../store';
import { t, tv } from '../i18n';

const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

function QuizRun() {
  const topics = [...new Set(quiz.map((q) => q.topic))];
  const [topic, setTopic] = useState('');
  const [seed, setSeed] = useState(0);
  const qs = useMemo(() => shuffle(quiz.filter((q) => !topic || q.topic === topic)).slice(0, 10), [topic, seed]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const { quizBest, set } = useUI();
  const restart = () => { setI(0); setPicked(null); setScore(0); setSeed((s) => s + 1); };
  if (!quiz.length) return <Empty>{t('Quiz questions are still being written.')}</Empty>;
  const done = i >= qs.length;
  const q = qs[i];
  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap gap-1.5 mb-4"><button className={`btn !py-1 ${!topic ? 'btn-primary' : ''}`} onClick={() => { setTopic(''); restart(); }}>{t('Mixed')}</button>{topics.map((tp) => <button key={tp} className={`btn !py-1 ${topic === tp ? 'btn-primary' : ''}`} onClick={() => { setTopic(tp); restart(); }}>{tv(tp)}</button>)}</div>
      {done ? (
        <div className="card p-6 text-center">
          <div className="display text-5xl mb-2 tabular">{score} / {qs.length}</div>
          <p className="font-serif text-muted mb-4">{score === qs.length ? t('A perfect round.') : score >= qs.length * 0.7 ? t('Well studied.') : t('Every miss is a page worth reading.')} {t('Best so far: {n}.', { n: Math.max(quizBest, score) })}</p>
          <button className="btn btn-primary" onClick={() => { if (score > quizBest) set({ quizBest: score }); restart(); }}>{t('Another round')}</button>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={q.id + seed} className="card p-5" initial={{ opacity: 0.5, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
            <div className="flex justify-between text-sm text-muted mb-2 tabular"><span className="eyebrow">{tv(q.topic)}</span><span>{t('Question {n} of {total} · score {score}', { n: i + 1, total: qs.length, score })}</span></div>
            <h2 className="display text-2xl mb-4">{q.q}</h2>
            <div className="grid gap-2">
              {q.options.map((o, j) => {
                const state = picked === null ? '' : j === q.answer ? 'border-good bg-good/10' : j === picked ? 'border-bad bg-bad/10' : 'opacity-60';
                return <button key={j} disabled={picked !== null} onClick={() => { setPicked(j); if (j === q.answer) setScore((s) => s + 1); }} className={`card p-3 text-left hover:border-accent ${state}`}><span className="tabular text-muted mr-2">{'ABCD'[j]}</span>{o}</button>;
              })}
            </div>
            {picked !== null && (
              <div className="mt-4">
                <p className="font-serif"><b>{picked === q.answer ? t('Correct.') : t('The answer is {answer}.', { answer: q.options[q.answer] })}</b> {q.explain}</p>
                <div className="mt-2"><Refs refs={q.refs} /></div>
                <button className="btn btn-primary mt-3" onClick={() => { setI(i + 1); setPicked(null); }}>{i + 1 === qs.length ? t('See score') : t('Next question →')}</button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

function Flashcards() {
  const deck = useMemo(() => shuffle(people.filter((p) => p.tier !== 'minor')), []);
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  if (!deck.length) return <Empty>{t('Flashcards appear once profiles are loaded.')}</Empty>;
  const p = deck[i % deck.length];
  return (
    <div className="max-w-xl">
      <button onClick={() => setFlip((f) => !f)} className="w-full [perspective:1200px]" aria-label={t('Flip card')}>
        <motion.div className="relative h-72 [transform-style:preserve-3d]" animate={{ rotateY: flip ? 180 : 0 }} transition={{ duration: 0.5 }}>
          <div className="absolute inset-0 card p-6 flex flex-col justify-center items-center text-center [backface-visibility:hidden]">
            <div className="eyebrow mb-2">{t('Who am I?')}</div>
            <p className="font-serif text-lg">{p.events.slice(0, 2).map((e) => e.summary).join(' ').replace(new RegExp(p.names.primary.split(' ')[0], 'g'), '___')}</p>
          </div>
          <div className="absolute inset-0 card p-6 flex flex-col justify-center items-center text-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="display text-4xl">{p.names.primary}</div>
            <div className="text-muted mt-1">{p.roles.slice(0, 3).join(' · ')}</div>
          </div>
        </motion.div>
      </button>
      <div className="flex justify-between mt-3"><span className="text-sm text-muted tabular">{t('Card {n} of {total} · tap to flip', { n: (i % deck.length) + 1, total: deck.length })}</span><button className="btn btn-primary" onClick={() => { setFlip(false); setI(i + 1); }}>{t('Next card →')}</button></div>
    </div>
  );
}

export default function Quiz() {
  const [tab, setTab] = useState<'quiz' | 'cards'>('quiz');
  return (
    <div>
      <PageHeader eyebrow={t('Practice')} title={t('Quiz & Flashcards')}>{t('Ten questions a round, each with an explanation and its references. Debate questions ask what a view holds, never which view wins.')}</PageHeader>
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'quiz', label: t('Quiz') }, { id: 'cards', label: t('Flashcards') }]} />
      {tab === 'quiz' ? <QuizRun /> : <Flashcards />}
    </div>
  );
}
