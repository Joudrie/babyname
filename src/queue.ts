import type { Catalog } from './data/catalog';
import type { State } from './store';

function shuffle<T>(a: T[], from = 0, to = a.length): T[] {
  for (let i = to - 1; i > from; i--) {
    const j = from + ((Math.random() * (i - from + 1)) | 0);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Indices in a deck. "partner" is the names a partner shared, the rest come from the catalog. */
export function deckMembers(c: Catalog, s: State, id: string): number[] {
  if (id === 'partner') {
    return (s.partner?.picks ?? []).map(([n]) => c.index.get(n)).filter((i): i is number => i !== undefined);
  }
  return c.members(id);
}

/** Gender and first-letter filters, shared by the deck, the counters and the deck picker. */
export function makeFilter(c: Catalog, s: State) {
  const { genders, letters } = s.settings;
  return (i: number) => genders[c.gender[i]] && (letters === '' || letters.includes(c.names[i][0].toUpperCase()));
}

/**
 * The names left to swipe for the current deck mix. In "popular" order every deck contributes its
 * most relevant names first (each deck's own order), lightly shuffled so it never feels like a list.
 */
export function buildQueue(c: Catalog, s: State): string[] {
  const keep = makeFilter(c, s);
  const best = new Map<number, number>();
  for (const id of s.settings.decks) {
    const list = deckMembers(c, s, id);
    for (let pos = 0; pos < list.length; pos++) {
      const i = list[pos];
      const prev = best.get(i);
      if (prev === undefined || pos < prev) best.set(i, pos);
    }
  }
  const out: number[] = [];
  for (const [i] of best) if (keep(i) && !s.decisions[c.names[i]]) out.push(i);
  if (s.settings.order === 'random') shuffle(out);
  else {
    out.sort((a, b) => best.get(a)! - best.get(b)! || a - b);
    for (let k = 0; k < out.length; k += 30) shuffle(out, k, Math.min(out.length, k + 30));
  }
  return out.map((i) => c.names[i]);
}

/** Every name (as an index) in the current deck mix under the filters, decided or not. */
export function mixSet(c: Catalog, s: State): Set<number> {
  const keep = makeFilter(c, s);
  const out = new Set<number>();
  for (const id of s.settings.decks) for (const i of deckMembers(c, s, id)) if (keep(i)) out.add(i);
  return out;
}

/** Sorted / total for the current deck mix. Only walks the decisions, so it's cheap on every swipe. */
export function mixProgress(c: Catalog, s: State, mix: Set<number>): { sorted: number; total: number } {
  let sorted = 0;
  for (const name in s.decisions) {
    const i = c.index.get(name);
    if (i !== undefined && mix.has(i)) sorted++;
  }
  return { sorted, total: mix.size };
}

/** Left / total for one deck under the current filters. */
export function deckCount(c: Catalog, s: State, id: string): { left: number; total: number } {
  const keep = makeFilter(c, s);
  let left = 0;
  let total = 0;
  for (const i of deckMembers(c, s, id)) {
    if (!keep(i)) continue;
    total++;
    if (!s.decisions[c.names[i]]) left++;
  }
  return { left, total };
}
