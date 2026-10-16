import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const SCHEMES = [
  { id: 'parchment', name: 'Parchment', note: 'Vellum, iron-gall ink and lapis' },
  { id: 'midnight', name: 'Midnight Scroll', note: 'Gold on night blue (always dark)' },
  { id: 'byzantine', name: 'Byzantine', note: 'Mosaic gold and deep blue' },
  { id: 'desert', name: 'Desert Sand', note: 'Ochre, clay and oasis teal' },
  { id: 'stained', name: 'Stained Glass', note: 'Ruby and cobalt' },
  { id: 'contrast', name: 'High Contrast', note: 'Maximum legibility' },
] as const;
export type Scheme = (typeof SCHEMES)[number]['id'];
export type Mode = 'system' | 'light' | 'dark';

type Note = { id: string; target: string; text: string; at: number };
type UI = {
  scheme: Scheme; mode: Mode; reducedMotion: boolean; showSpeculative: boolean; chronology: 'early' | 'late';
  eraFilter: string | null; bookmarks: string[]; notes: Note[]; quizBest: number;
  set: (p: Partial<Omit<UI, 'set' | 'toggleBookmark' | 'addNote' | 'removeNote'>>) => void;
  toggleBookmark: (path: string) => void; addNote: (target: string, text: string) => void; removeNote: (id: string) => void;
};

const safeStorage = createJSONStorage(() => {
  try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return localStorage; }
  catch { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) }; }
});

export const useUI = create<UI>()(persist((set) => ({
  scheme: 'parchment', mode: 'system', reducedMotion: false, showSpeculative: false, chronology: 'early',
  eraFilter: null, bookmarks: [], notes: [], quizBest: 0,
  set: (p) => set(p),
  toggleBookmark: (path) => set((s) => ({ bookmarks: s.bookmarks.includes(path) ? s.bookmarks.filter((b) => b !== path) : [...s.bookmarks, path] })),
  addNote: (target, text) => set((s) => ({ notes: [...s.notes, { id: Math.random().toString(36).slice(2), target, text, at: Date.now() }] })),
  removeNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
}), { name: 'logos-ui', storage: safeStorage }));

/** Mirror theme state onto <html> so CSS tokens switch. */
export function applyTheme(scheme: Scheme, mode: Mode, reduced: boolean) {
  const r = document.documentElement;
  r.dataset.scheme = scheme;
  if (mode === 'system') delete r.dataset.mode; else r.dataset.mode = mode;
  if (reduced) r.dataset.motion = 'reduced'; else delete r.dataset.motion;
}
export const prefersReduced = () => useUI.getState().reducedMotion || (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
