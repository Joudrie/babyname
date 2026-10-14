import { useSyncExternalStore } from 'react';
import type { Gender } from './data/names';

export type Decision = 'yes' | 'no';
export type Action = Decision | 'maybe';
export type Theme = 'color' | 'neutral';

export interface HistoryItem {
  name: string;
  action: Action;
  t: number;
}

export interface Settings {
  theme: Theme;
  genders: Record<Gender, boolean>;
}

export interface State {
  decisions: Record<string, Decision>;
  history: HistoryItem[];
  settings: Settings;
  tutorialDone: boolean;
  /** True when the browser refused our last save, so the UI can say so instead of silently losing swipes. */
  saveFailed: boolean;
}

const KEY = 'cradle:v1';

const DEFAULTS: State = {
  decisions: {},
  history: [],
  settings: { theme: 'color', genders: { m: true, f: true, u: true } },
  tutorialDone: false,
  saveFailed: false,
};

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const saved = JSON.parse(raw);
    return {
      ...DEFAULTS,
      ...saved,
      settings: { ...DEFAULTS.settings, ...saved.settings, genders: { ...DEFAULTS.settings.genders, ...saved.settings?.genders } },
      saveFailed: false,
    };
  } catch {
    return DEFAULTS;
  }
}

let state: State = load();
const listeners = new Set<() => void>();

// Saving is batched so a fast run of swipes never stalls an animation frame
// on JSON.stringify; pending saves are flushed when the tab is hidden or closed.
let saveTimer: number | undefined;
function flush() {
  if (saveTimer !== undefined) {
    clearTimeout(saveTimer);
    saveTimer = undefined;
  }
  const { decisions, history, settings, tutorialDone } = state;
  let failed = false;
  try {
    localStorage.setItem(KEY, JSON.stringify({ decisions, history, settings, tutorialDone }));
  } catch {
    failed = true;
  }
  if (failed !== state.saveFailed) {
    state = { ...state, saveFailed: failed };
    emit();
  }
}
function scheduleSave() {
  if (saveTimer === undefined) saveTimer = window.setTimeout(flush, 400);
}
window.addEventListener('pagehide', flush);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flush();
});

function emit() {
  listeners.forEach((l) => l());
}

function update(fn: (s: State) => Partial<State>) {
  state = { ...state, ...fn(state) };
  emit();
  scheduleSave();
}

export function useStore(): State {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

export const getState = () => state;

export function decide(name: string, action: Action) {
  update((s) => ({
    decisions: action === 'maybe' ? s.decisions : { ...s.decisions, [name]: action },
    history: [...s.history, { name, action, t: Date.now() }],
  }));
}

/** Removes the most recent swipe and returns it, or null when there is nothing to undo. */
export function undo(): HistoryItem | null {
  const last = state.history[state.history.length - 1];
  if (!last) return null;
  update((s) => {
    const decisions = { ...s.decisions };
    if (last.action !== 'maybe') delete decisions[last.name];
    return { decisions, history: s.history.slice(0, -1) };
  });
  return last;
}

/** Changes a name's decision after the fact (from history or the box) without adding a history row. */
export function setDecision(name: string, decision: Decision) {
  update((s) => ({ decisions: { ...s.decisions, [name]: decision } }));
}

export function updateSettings(patch: Partial<Settings>) {
  update((s) => ({ settings: { ...s.settings, ...patch } }));
}

export function setTutorialDone(done: boolean) {
  update(() => ({ tutorialDone: done }));
}

export function resetAll() {
  update((s) => ({ decisions: {}, history: [], settings: s.settings }));
}
