import { isTa } from '../i18n';
import { useEffect, useRef, useState } from 'react';
import { getSample, ERROR_COPY } from '../lib/ask';

type Turn = { role: 'user' | 'assistant'; content: string };
type Tool = { name: string; description: string; inputSchema?: object; execute: (input: any) => unknown };

/** A small chat with Claude. `rules` is the standing instruction turn the page always sends first. */
export default function Chat({ rules, placeholder, suggestions, speaker, tools, intro, initial }: {
  rules: string; placeholder: string; suggestions: string[]; speaker: string; tools?: Tool[]; intro?: string; initial?: string;
}) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState(initial ?? '');
  const [live, setLive] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const ctl = useRef<AbortController | null>(null);
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => { let on = true; getSample().then((s) => on && setAvailable(!!s)); return () => { on = false; ctl.current?.abort(); }; }, []);
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight }); }, [turns, live]);

  async function ask(q: string) {
    const sample = await getSample(); if (!sample || !q.trim()) return;
    const next: Turn[] = [...turns, { role: 'user' as const, content: q.trim() }].slice(-12);
    setTurns(next); setDraft(''); setLive(''); setStatus('Thinking…');
    ctl.current = new AbortController();
    try {
      let useTools = tools;
      if (tools?.length) { const lim = await sample.limits?.().catch(() => null); if (!lim?.tools) useTools = undefined; }
      const opts: Record<string, unknown> = { signal: ctl.current.signal, onText: ({ text }: { text: string }) => { setStatus(''); setLive(text); } };
      if (useTools) opts.tools = useTools.map((t) => ({ ...t, execute: (i: any) => { setStatus(`Looking up ${t.name.replace(/_/g, ' ')}…`); return t.execute(i); } }));
      else opts.cache = false;
      const { text, truncated } = await sample([{ role: 'user', content: isTa ? `${rules}\n\nReply in clear, natural modern Tamil (தமிழ்). Use Tamil Union Version (பழைய திருப்புதல்) spellings for Bible names and books, and keep scripture references in the form "Rom 3:20".` : rules }, ...next], opts);
      setTurns([...next, { role: 'assistant', content: text }]); setStatus(truncated ? 'The answer was cut short. Ask a narrower question for the rest.' : '');
    } catch (e: any) {
      if (e?.text) setTurns([...next, { role: 'assistant', content: e.text }]);
      if (e?.code === 'not_granted' || e?.code === 'sampling_disabled' || e?.code === 'not_declared' || e?.code === 'capability_disabled') setAvailable(false);
      setStatus(e?.code === 'cancelled' ? '' : ERROR_COPY[e?.code] ?? ERROR_COPY.upstream_error);
    } finally { setLive(null); ctl.current = null; }
  }

  if (available === false) return <div className="card p-5 font-serif text-muted">Asking Claude needs the Claude app or claude.ai, with Claude allowed for this page. Everything else in the atlas works without it.</div>;
  return (
    <div className="card flex flex-col h-[min(70vh,620px)]">
      <div ref={log} className="flex-1 overflow-y-auto p-4 space-y-4" aria-live="polite">
        {intro && !turns.length && <p className="font-serif text-muted">{intro}</p>}
        {turns.map((t, i) => (
          <div key={i} className={t.role === 'user' ? 'flex justify-end' : ''}>
            <div className={t.role === 'user' ? 'max-w-[85%] bg-sunk rounded-lg px-3 py-2 text-[.95rem]' : 'max-w-[68ch]'}>
              {t.role === 'assistant' && <div className="eyebrow rubric !text-accent2 mb-1">{speaker}</div>}
              <div className={t.role === 'assistant' ? 'font-serif leading-relaxed whitespace-pre-wrap' : 'whitespace-pre-wrap'}>{t.content}</div>
            </div>
          </div>
        ))}
        {live !== null && (
          <div className="max-w-[68ch]"><div className="eyebrow rubric !text-accent2 mb-1">{speaker}</div><div className="font-serif leading-relaxed whitespace-pre-wrap">{live || <span className="text-muted italic">{status}</span>}</div></div>
        )}
        {!turns.length && live === null && (
          <div className="flex flex-wrap gap-2">{suggestions.map((s) => <button key={s} className="chip hover:border-accent !text-[.82rem] !py-1" onClick={() => ask(s)} disabled={!available}>{s}</button>)}</div>
        )}
      </div>
      {status && live === null && <div className="px-4 pb-1 text-sm text-warn">{status}</div>}
      <form className="border-t border-line p-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); ask(draft); }}>
        <label htmlFor={`chat-${speaker}`} className="sr-only">Your question</label>
        <input id={`chat-${speaker.replace(/\W/g, '')}`} className="input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={available === null ? 'Connecting…' : placeholder} disabled={!available || live !== null} />
        {live !== null ? <button type="button" className="btn" onClick={() => ctl.current?.abort()}>Stop</button> : <button className="btn btn-primary" disabled={!available || !draft.trim()}>Ask</button>}
        {turns.length > 0 && live === null && <button type="button" className="btn" onClick={() => { setTurns([]); setStatus(''); }}>Clear</button>}
      </form>
    </div>
  );
}
