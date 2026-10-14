// Partner sharing without accounts: a box is packed into the link's #hash, so nothing leaves
// the two phones except the link itself.
import type { Partner, State, Tier } from './store';

interface Packed {
  v: 1;
  n: string;
  p: [string, Tier][];
}

function toBase64Url(text: string) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/** Every liked name across all boxes, keeping the best (lowest non-zero) tier it has anywhere. */
export function myPicks(s: State): Map<string, Tier> {
  const out = new Map<string, Tier>();
  for (const b of s.boxes) {
    for (const [name, e] of Object.entries(s.entries[b.id] ?? {})) {
      const prev = out.get(name);
      if (prev === undefined || (e.tier !== 0 && (prev === 0 || e.tier < prev))) out.set(name, e.tier);
    }
  }
  return out;
}

export function shareLink(s: State): string {
  const packed: Packed = { v: 1, n: s.settings.myName.trim(), p: [...myPicks(s)] };
  const url = new URL(window.location.href);
  url.hash = `partner=${toBase64Url(JSON.stringify(packed))}`;
  return url.toString();
}

/** Reads a partner link's hash, if this page was opened from one. */
export function readPartnerHash(hash: string): Partner | null {
  const m = hash.match(/^#partner=([A-Za-z0-9_-]+)/);
  if (!m) return null;
  try {
    const data = JSON.parse(fromBase64Url(m[1])) as Packed;
    if (data.v !== 1 || !Array.isArray(data.p)) return null;
    const picks = data.p.filter((x) => Array.isArray(x) && typeof x[0] === 'string').map(([n, t]) => [n.slice(0, 40), ([0, 1, 2, 3].includes(t) ? t : 0) as Tier] as [string, Tier]);
    return { name: String(data.n ?? '').slice(0, 40), picks: picks.slice(0, 2000), t: Date.now() };
  } catch {
    return null;
  }
}

export async function shareOrCopy(title: string, url: string): Promise<'shared' | 'copied' | 'failed'> {
  try {
    if (navigator.share) {
      await navigator.share({ title, url });
      return 'shared';
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') return 'failed';
  }
  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
}
