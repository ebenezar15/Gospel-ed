import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const SCHEMES = [
  { id: 'parchment', swatch: ['#9a6b12', '#7d2a1d', '#0c1424'], name: 'Parchment', note: 'Gold and oxblood; night blue in dark mode' },
  { id: 'byzantine', swatch: ['#6a2a8a', '#a0700a', '#f3eef6'], name: 'Byzantine', note: 'Imperial purple and gold' },
  { id: 'iona', swatch: ['#2c6e45', '#8a4a1c', '#edf2ea'], name: 'Iona', note: 'Celtic green and peat' },
  { id: 'lapis', swatch: ['#1d4ea6', '#a37b16', '#edf1f8'], name: 'Lapis', note: 'Ultramarine and gilt' },
  { id: 'rose', swatch: ['#9f1f2e', '#1f5f8a', '#faf0ee'], name: 'Rose Window', note: 'Ruby and sky' },
  { id: 'desert', swatch: ['#a84b22', '#2e6b6b', '#f7ede2'], name: 'Desert', note: 'Terracotta and oasis teal' },
  { id: 'monastic', swatch: ['#5d4b2c', '#3a5a6b', '#f1f0ec'], name: 'Monastic', note: 'Undyed wool and slate' },
  { id: 'contrast', swatch: ['#000000', '#ffd600', '#ffffff'], name: 'High Contrast', note: 'Maximum legibility' },
] as const;
export type Scheme = (typeof SCHEMES)[number]['id'];
export type Mode = 'system' | 'light' | 'dark';

type Note = { id: string; target: string; text: string; at: number };
type UI = {
  scheme: Scheme; mode: Mode; reducedMotion: boolean; showSpeculative: boolean; chronology: 'early' | 'late';
  eraFilter: string | null; bookmarks: string[]; notes: Note[]; quizBest: number;
  /** Left pane state on tablet/desktop: null = automatic (open on wide screens, rail on narrower ones). */
  navOpen: boolean | null;
  set: (p: Partial<Omit<UI, 'set' | 'toggleBookmark' | 'addNote' | 'removeNote'>>) => void;
  toggleBookmark: (path: string) => void; addNote: (target: string, text: string) => void; removeNote: (id: string) => void;
};

const safeStorage = createJSONStorage(() => {
  try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return localStorage; }
  catch { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) }; }
});

export const useUI = create<UI>()(persist((set) => ({
  scheme: 'parchment', mode: 'system', reducedMotion: false, showSpeculative: false, chronology: 'early',
  eraFilter: null, bookmarks: [], notes: [], quizBest: 0, navOpen: null,
  set: (p) => set(p),
  toggleBookmark: (path) => set((s) => ({ bookmarks: s.bookmarks.includes(path) ? s.bookmarks.filter((b) => b !== path) : [...s.bookmarks, path] })),
  addNote: (target, text) => set((s) => ({ notes: [...s.notes, { id: Math.random().toString(36).slice(2), target, text, at: Date.now() }] })),
  removeNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
}), { name: 'logos-ui', storage: safeStorage }));

/** Mirror theme state onto <html> so CSS tokens switch. */
export function applyTheme(scheme: Scheme, mode: Mode, reduced: boolean) {
  const r = document.documentElement;
  r.dataset.scheme = SCHEMES.some((s) => s.id === scheme) ? scheme : 'parchment';
  if (mode === 'system') delete r.dataset.mode; else r.dataset.mode = mode;
  if (reduced) r.dataset.motion = 'reduced'; else delete r.dataset.motion;
}
export const prefersReduced = () => useUI.getState().reducedMotion || (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
