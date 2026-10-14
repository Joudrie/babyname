// Loads the generated name data (public/data, built by scripts/build-data.py) and answers
// questions about it: who is in a deck, a name's gender/origins, its details and variants.

export type Gender = 'm' | 'f' | 'u';

export interface OriginMeta {
  label: string;
  group: GroupKey;
}

export type GroupKey = 'special' | 'west' | 'east' | 'mena' | 'asia' | 'africa' | 'americas';

export const GROUPS: { key: GroupKey; label: string; open?: boolean }[] = [
  { key: 'west', label: 'Western Europe', open: true },
  { key: 'east', label: 'Eastern Europe' },
  { key: 'mena', label: 'Middle East & North Africa' },
  { key: 'asia', label: 'Asia' },
  { key: 'africa', label: 'Africa' },
  { key: 'americas', label: 'Americas & Pacific' },
];

export const ORIGIN_META: Record<string, OriginMeta> = {
  english: { label: 'English', group: 'west' },
  irish: { label: 'Irish', group: 'west' },
  scottish: { label: 'Scottish', group: 'west' },
  welsh: { label: 'Welsh & Celtic', group: 'west' },
  french: { label: 'French', group: 'west' },
  german: { label: 'German', group: 'west' },
  dutch: { label: 'Dutch & Flemish', group: 'west' },
  spanish: { label: 'Spanish & Latin American', group: 'west' },
  portuguese: { label: 'Portuguese & Brazilian', group: 'west' },
  italian: { label: 'Italian', group: 'west' },
  latin: { label: 'Latin', group: 'west' },
  greek: { label: 'Greek', group: 'west' },
  nordic: { label: 'Nordic', group: 'west' },
  russian: { label: 'Russian & Ukrainian', group: 'east' },
  polish: { label: 'Polish', group: 'east' },
  czech: { label: 'Czech & Slovak', group: 'east' },
  balkan: { label: 'Balkan & Romanian', group: 'east' },
  slavic: { label: 'Slavic', group: 'east' },
  hungarian: { label: 'Hungarian', group: 'east' },
  baltic: { label: 'Baltic', group: 'east' },
  hebrew: { label: 'Hebrew', group: 'mena' },
  arabic: { label: 'Arabic', group: 'mena' },
  persian: { label: 'Persian', group: 'mena' },
  turkish: { label: 'Turkish & Central Asian', group: 'mena' },
  armenian: { label: 'Armenian & Georgian', group: 'mena' },
  indian: { label: 'Indian & South Asian', group: 'asia' },
  chinese: { label: 'Chinese', group: 'asia' },
  japanese: { label: 'Japanese', group: 'asia' },
  korean: { label: 'Korean', group: 'asia' },
  vietnamese: { label: 'Vietnamese', group: 'asia' },
  filipino: { label: 'Filipino', group: 'asia' },
  seasian: { label: 'Southeast Asian', group: 'asia' },
  westafrican: { label: 'West African', group: 'africa' },
  eastafrican: { label: 'East African', group: 'africa' },
  southafrican: { label: 'Southern African', group: 'africa' },
  african: { label: 'African', group: 'africa' },
  american: { label: 'Modern American', group: 'americas' },
  native: { label: 'Native American', group: 'americas' },
  polynesian: { label: 'Hawaiian & Polynesian', group: 'americas' },
  fiction: { label: 'Books, film & TV', group: 'special' },
  myth: { label: 'Mythology', group: 'special' },
  biblical: { label: 'Biblical', group: 'special' },
};

export interface DeckDef {
  id: string;
  label: string;
  group: GroupKey | 'featured' | 'eras';
  hint?: string;
}

export interface Catalog {
  names: string[];
  gender: Gender[];
  /** Origin keys per name, primary origin first. */
  origins: string[][];
  peak: Int8Array;
  pop: Uint8Array;
  decades: number[];
  index: Map<string, number>;
  decks: DeckDef[];
  members(deckId: string): number[];
  hasYears(): boolean;
  loadYears(): Promise<void>;
  yearsRange: [number, number];
}

interface RawCore {
  origins: string[];
  decades: number[];
  names: string[];
  popular: number[];
  trending: number[];
  eras: number[][];
}

const BASE = `${import.meta.env.BASE_URL}data/`;
let catalog: Catalog | null = null;
let years: Record<string, { m?: number[]; f?: number[] }> | null = null;

export const getCatalog = () => catalog!;

export async function loadCatalog(): Promise<Catalog> {
  if (catalog) return catalog;
  const raw: RawCore = await fetch(`${BASE}names.json`).then((r) => r.json());
  const n = raw.names.length;
  const names: string[] = new Array(n);
  const gender: Gender[] = new Array(n);
  const origins: string[][] = new Array(n);
  const peak = new Int8Array(n);
  const pop = new Uint8Array(n);
  const index = new Map<string, number>();
  const byOrigin: Record<string, number[]> = {};
  const byOriginSecondary: Record<string, number[]> = {};

  for (let i = 0; i < n; i++) {
    const [name, g, o, pk, pp] = raw.names[i].split('|');
    names[i] = name;
    gender[i] = g as Gender;
    origins[i] = o ? o.split('.').map((x) => raw.origins[+x]) : [];
    peak[i] = pk === '' ? -1 : +pk;
    pop[i] = +pp || 0;
    index.set(name, i);
    // A name's first origin is its main one; later ones are looser associations. Decks list
    // main-origin names first so "Japanese" opens with Haruto, not Naomi.
    origins[i].forEach((key, k) => {
      const bucket = k === 0 || key === 'biblical' || key === 'myth' || key === 'fiction' ? byOrigin : byOriginSecondary;
      (bucket[key] ??= []).push(i);
    });
  }

  const all = Array.from({ length: n }, (_, i) => i);
  const classics = all.filter((i) => pop[i] >= 5).slice(0, 2000);
  const oldFashioned = all.filter((i) => peak[i] >= 0 && peak[i] <= 4 && pop[i] >= 4);

  const decks: DeckDef[] = [
    { id: 'popular', label: 'Popular in the US now', group: 'featured', hint: 'Top 1,000 boys & girls, last 10 years' },
    { id: 'classics', label: 'All-time US favorites', group: 'featured' },
    { id: 'trending', label: 'Trending up', group: 'featured', hint: 'Rising fastest lately' },
    { id: 'oldfashioned', label: 'Old-fashioned', group: 'featured', hint: 'Peaked before 1930' },
    { id: 'origin:fiction', label: 'Books, film & TV', group: 'featured' },
    { id: 'origin:myth', label: 'Mythology', group: 'featured' },
    { id: 'origin:biblical', label: 'Biblical', group: 'featured' },
    { id: 'everything', label: 'Explore everything', group: 'featured', hint: 'Every name we have' },
    ...Object.entries(ORIGIN_META)
      .filter(([, m]) => m.group !== 'special')
      .map(([key, m]) => ({ id: `origin:${key}`, label: m.label, group: m.group })),
    ...raw.decades.map((d, i) => ({ id: `era:${i}`, label: `${d}s`, group: 'eras' as const })),
  ];

  const cache = new Map<string, number[]>();
  function members(id: string): number[] {
    const hit = cache.get(id);
    if (hit) return hit;
    let list: number[] = [];
    if (id === 'popular') list = raw.popular;
    else if (id === 'classics') list = classics;
    else if (id === 'trending') list = raw.trending;
    else if (id === 'oldfashioned') list = oldFashioned;
    else if (id === 'everything') list = all;
    else if (id.startsWith('origin:')) {
      const key = id.slice(7);
      list = [...(byOrigin[key] ?? []), ...(byOriginSecondary[key] ?? [])];
    } else if (id.startsWith('era:')) list = raw.eras[+id.slice(4)] ?? [];
    else if (id.startsWith('year:') && years) {
      const y = years[id.slice(5)];
      list = y ? [...(y.m ?? []), ...(y.f ?? [])] : [];
    }
    if (!id.startsWith('year:') || years) cache.set(id, list);
    return list;
  }

  catalog = {
    names,
    gender,
    origins,
    peak,
    pop,
    decades: raw.decades,
    index,
    decks,
    members,
    hasYears: () => !!years,
    async loadYears() {
      if (!years) years = await fetch(`${BASE}years.json`).then((r) => r.json());
    },
    yearsRange: [1880, 2024],
  };
  return catalog;
}

export function deckLabel(id: string): string {
  if (id.startsWith('year:')) return `Top names of ${id.slice(5)}`;
  return catalog?.decks.find((d) => d.id === id)?.label ?? id;
}

// ---------- Details (meaning, pronunciation, popularity by decade), sharded by first letter ----------

export interface Details {
  meaning: string;
  pron: string;
  /** Share of births per 100k in each decade, 1880s onward. */
  series: number[];
  /** Other spellings and other-language forms, most popular first. */
  variants: string[];
}

const shards = new Map<string, Promise<Record<string, [string, string, number[], string[]]>>>();

function shardKey(name: string) {
  const c = name[0]?.toLowerCase() ?? '';
  return c >= 'a' && c <= 'z' ? c : 'other';
}

function loadShard(key: string) {
  let p = shards.get(key);
  if (!p) {
    p = fetch(`${BASE}details/${key}.json`)
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => {
        shards.delete(key);
        return {};
      });
    shards.set(key, p);
  }
  return p;
}

export async function getDetails(name: string): Promise<Details | null> {
  const row = (await loadShard(shardKey(name)))[name];
  return row ? { meaning: row[0], pron: row[1], series: row[2], variants: row[3] ?? [] } : null;
}

/** Warms the detail shards for names about to be shown, so a card flip has its data ready. */
export function prefetchDetails(names: string[]) {
  for (const n of names) loadShard(shardKey(n));
}

// ---------- Fiction sources ----------

let fiction: Promise<Record<string, string>> | null = null;

export async function getFictionSource(name: string): Promise<string | null> {
  fiction ??= fetch(`${BASE}fiction.json`).then((r) => r.json()).catch(() => ({}));
  return (await fiction)[name] ?? null;
}

export function genderOf(name: string): Gender {
  const c = catalog;
  const i = c?.index.get(name);
  return i === undefined || !c ? 'u' : c.gender[i];
}

export function originLabels(name: string): string[] {
  const c = catalog;
  const i = c?.index.get(name);
  if (i === undefined || !c) return [];
  return c.origins[i].map((o) => ORIGIN_META[o]?.label ?? o);
}
