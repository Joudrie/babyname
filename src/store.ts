import { useSyncExternalStore } from 'react';
import type { Gender } from './data/catalog';

export type Decision = 'yes' | 'no';
export type Action = Decision | 'maybe';
export type Theme = 'color' | 'neutral';
export type Order = 'popular' | 'random';
/** 0 = not ranked yet, 1 = love it, 2 = really like, 3 = thinking about it. */
export type Tier = 0 | 1 | 2 | 3;

export interface HistoryItem {
  name: string;
  action: Action;
  t: number;
  /** The box a "yes" went into, so undo takes it back out of the right one. */
  box?: string;
}

export interface Box {
  id: string;
  name: string;
}

export interface BoxEntry {
  tier: Tier;
  t: number;
}

export interface Partner {
  name: string;
  picks: [string, Tier][];
  t: number;
}

export interface Settings {
  theme: Theme;
  genders: Record<Gender, boolean>;
  decks: string[];
  /** Only show names starting with one of these letters ('' = any). */
  letters: string;
  order: Order;
  lastName: string;
  /** Optional, only used for the initials check. */
  middleName: string;
  myName: string;
}

export interface State {
  decisions: Record<string, Decision>;
  history: HistoryItem[];
  boxes: Box[];
  activeBox: string;
  entries: Record<string, Record<string, BoxEntry>>;
  partner: Partner | null;
  dismissedNudges: string[];
  settings: Settings;
  tutorialDone: boolean;
  /** True when the browser refused our last save, so the UI can say so instead of silently losing swipes. */
  saveFailed: boolean;
}

const KEY = 'cradle:v1';

export const DEFAULT_DECKS = [
  'popular',
  'classics',
  'origin:english',
  'origin:irish',
  'origin:scottish',
  'origin:welsh',
  'origin:french',
  'origin:german',
  'origin:dutch',
  'origin:spanish',
  'origin:italian',
];

const DEFAULTS: State = {
  decisions: {},
  history: [],
  boxes: [{ id: 'b1', name: 'Box 1' }],
  activeBox: 'b1',
  entries: { b1: {} },
  partner: null,
  dismissedNudges: [],
  settings: {
    theme: 'color',
    genders: { m: true, f: true, u: true },
    decks: DEFAULT_DECKS,
    letters: '',
    order: 'popular',
    lastName: '',
    middleName: '',
    myName: '',
  },
  tutorialDone: false,
  saveFailed: false,
};

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const saved = JSON.parse(raw);
    const s: State = {
      ...DEFAULTS,
      ...saved,
      settings: { ...DEFAULTS.settings, ...saved.settings, genders: { ...DEFAULTS.settings.genders, ...saved.settings?.genders } },
      saveFailed: false,
    };
    // Saves from before boxes existed: every liked name goes into the first box.
    if (!saved.entries) {
      const t = Date.now();
      s.entries = { b1: Object.fromEntries(Object.entries(s.decisions).filter(([, d]) => d === 'yes').map(([n]) => [n, { tier: 0 as Tier, t }])) };
    }
    if (!s.boxes.some((b) => b.id === s.activeBox)) s.activeBox = s.boxes[0].id;
    // The first box used to be called "My names"; it's "Box 1" now unless someone renamed it.
    s.boxes = s.boxes.map((b) => (b.id === 'b1' && b.name === 'My names' ? { ...b, name: 'Box 1' } : b));
    return s;
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
  const { saveFailed: _, ...persisted } = state;
  let failed = false;
  try {
    localStorage.setItem(KEY, JSON.stringify(persisted));
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

/** Every box a name sits in. */
export function boxesOf(s: State, name: string): string[] {
  return s.boxes.filter((b) => s.entries[b.id]?.[name]).map((b) => b.id);
}

function withEntry(s: State, box: string, name: string, entry: BoxEntry | null) {
  const current = { ...(s.entries[box] ?? {}) };
  if (entry) current[name] = entry;
  else delete current[name];
  return { ...s.entries, [box]: current };
}

export function decide(name: string, action: Action) {
  update((s) => ({
    decisions: action === 'maybe' ? s.decisions : { ...s.decisions, [name]: action },
    entries: action === 'yes' ? withEntry(s, s.activeBox, name, { tier: 0, t: Date.now() }) : s.entries,
    history: [...s.history, { name, action, t: Date.now(), box: action === 'yes' ? s.activeBox : undefined }],
  }));
}

/** Removes the most recent swipe and returns it, or null when there is nothing to undo. */
export function undo(): HistoryItem | null {
  const last = state.history[state.history.length - 1];
  if (!last) return null;
  update((s) => {
    const decisions = { ...s.decisions };
    if (last.action !== 'maybe') delete decisions[last.name];
    return {
      decisions,
      entries: last.action === 'yes' && last.box ? withEntry(s, last.box, last.name, null) : s.entries,
      history: s.history.slice(0, -1),
    };
  });
  return last;
}

/** Changes a name's decision after the fact (from history or a list) without adding a history row. */
export function setDecision(name: string, decision: Decision) {
  update((s) => {
    let entries = s.entries;
    if (decision === 'yes' && boxesOf(s, name).length === 0) entries = withEntry(s, s.activeBox, name, { tier: 0, t: Date.now() });
    if (decision === 'no') for (const b of boxesOf(s, name)) entries = withEntry({ ...s, entries }, b, name, null);
    return { decisions: { ...s.decisions, [name]: decision }, entries };
  });
}

/** Puts a name into a box (from variants or a partner's list), counting it as liked. */
export function addToBox(name: string, box = state.activeBox) {
  update((s) => ({
    decisions: { ...s.decisions, [name]: 'yes' },
    entries: s.entries[box]?.[name] ? s.entries : withEntry(s, box, name, { tier: 0, t: Date.now() }),
  }));
}

export function setTier(box: string, name: string, tier: Tier) {
  update((s) => {
    const e = s.entries[box]?.[name];
    return e ? { entries: withEntry(s, box, name, { ...e, tier }) } : {};
  });
}

/** Takes a name out of a box. If it's in no box any more it counts as passed. */
export function removeFromBox(box: string, name: string) {
  update((s) => {
    const entries = withEntry(s, box, name, null);
    const stillKept = s.boxes.some((b) => entries[b.id]?.[name]);
    return { entries, decisions: stillKept ? s.decisions : { ...s.decisions, [name]: 'no' } };
  });
}

/** Puts a just-removed name back exactly as it was (the "Undo" after removing). */
export function restoreToBox(box: string, name: string, entry: BoxEntry) {
  update((s) => ({
    decisions: { ...s.decisions, [name]: 'yes' },
    entries: s.boxes.some((b) => b.id === box) ? withEntry(s, box, name, entry) : s.entries,
  }));
}

export function moveToBox(from: string, to: string, name: string) {
  update((s) => {
    const e = s.entries[from]?.[name];
    if (!e || from === to) return {};
    const entries = withEntry(s, from, name, null);
    return { entries: { ...entries, [to]: { ...(entries[to] ?? {}), [name]: e } } };
  });
}

export function addBox(name: string): string {
  const id = `b${Date.now().toString(36)}`;
  update((s) => ({ boxes: [...s.boxes, { id, name }], entries: { ...s.entries, [id]: {} }, activeBox: id }));
  return id;
}

export function renameBox(id: string, name: string) {
  update((s) => ({ boxes: s.boxes.map((b) => (b.id === id ? { ...b, name } : b)) }));
}

/** Deletes a box. Names that were only in that box go back into the deck. */
export function deleteBox(id: string) {
  update((s) => {
    if (s.boxes.length <= 1) return {};
    const boxes = s.boxes.filter((b) => b.id !== id);
    const { [id]: removed = {}, ...entries } = s.entries;
    const decisions = { ...s.decisions };
    for (const name of Object.keys(removed)) if (!boxes.some((b) => entries[b.id]?.[name])) delete decisions[name];
    return { boxes, entries, decisions, activeBox: s.activeBox === id ? boxes[0].id : s.activeBox };
  });
}

export function setActiveBox(id: string) {
  update(() => ({ activeBox: id }));
}

export function setPartner(partner: Partner | null) {
  update(() => ({ partner }));
}

export function dismissNudge(key: string) {
  update((s) => ({ dismissedNudges: [...s.dismissedNudges, key] }));
}

export function updateSettings(patch: Partial<Settings>) {
  update((s) => ({ settings: { ...s.settings, ...patch } }));
}

export function setTutorialDone(done: boolean) {
  update(() => ({ tutorialDone: done }));
}

export function resetAll() {
  update((s) => ({
    decisions: {},
    history: [],
    boxes: [{ id: 'b1', name: 'Box 1' }],
    activeBox: 'b1',
    entries: { b1: {} },
    partner: null,
    dismissedNudges: [],
    settings: s.settings,
  }));
}
