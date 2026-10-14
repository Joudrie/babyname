// Draws a box as a shareable picture (instead of making people screenshot it).
import { genderOf } from './data/catalog';
import { APP_NAME } from './config';
import type { Tier } from './store';

const TIER_TITLES: Record<Tier, string> = { 1: '💖 Love it', 2: '👍 Really like', 3: '🤔 Thinking about it', 0: 'Not ranked yet' };
const COLORS = { m: ['#cde4f6', '#284860'], f: ['#f8d5e0', '#6a2e44'], u: ['#e3dbf5', '#47396c'] } as const;
const PLAIN = ['#fff8ec', '#4b4036'] as const;

export async function boxImage(title: string, names: [string, Tier][], neutral: boolean): Promise<Blob> {
  await document.fonts?.ready;
  const W = 1080;
  const pad = 64;
  const chipH = 72;
  const gap = 16;
  const scratch = document.createElement('canvas').getContext('2d')!;
  scratch.font = '600 38px Fredoka, Nunito, sans-serif';

  // Lay out the chips first so the canvas can be exactly as tall as it needs.
  const order: Tier[] = [1, 2, 3, 0];
  type Item = { kind: 'title'; text: string; y: number } | { kind: 'chip'; text: string; x: number; y: number; w: number };
  const items: Item[] = [];
  let y = 230;
  for (const tier of order) {
    const list = names.filter(([, t]) => t === tier).map(([n]) => n);
    if (!list.length) continue;
    items.push({ kind: 'title', text: TIER_TITLES[tier], y });
    y += 34;
    let x = pad;
    for (const n of list) {
      const w = Math.ceil(scratch.measureText(n).width) + 56;
      if (x + w > W - pad) {
        x = pad;
        y += chipH + gap;
      }
      items.push({ kind: 'chip', text: n, x, y, w });
      x += w + gap;
    }
    y += chipH + 60;
  }
  const H = y + 80;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#f4faf1');
  bg.addColorStop(1, '#e4f1e1');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#33403a';
  ctx.font = '600 72px Fredoka, Nunito, sans-serif';
  ctx.fillText(title, pad, 130);
  ctx.fillStyle = '#7f8c85';
  ctx.font = '700 30px Nunito, sans-serif';
  ctx.fillText(`${names.length} name${names.length === 1 ? '' : 's'}`, pad, 180);

  for (const it of items) {
    if (it.kind === 'title') {
      ctx.fillStyle = '#7f8c85';
      ctx.font = '800 28px Nunito, sans-serif';
      ctx.fillText(it.text.toUpperCase(), pad, it.y);
      continue;
    }
    const [fill, ink] = neutral ? PLAIN : COLORS[genderOf(it.text)];
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(it.x, it.y, it.w, chipH, 22);
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.font = '600 38px Fredoka, Nunito, sans-serif';
    ctx.fillText(it.text, it.x + 28, it.y + 49);
  }

  ctx.fillStyle = '#7f8c85';
  ctx.font = '700 26px Nunito, sans-serif';
  ctx.fillText(`Made with ${APP_NAME} 🍼`, pad, H - 40);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'));
}

/** Opens the phone's share sheet with the picture, or downloads it where sharing files isn't supported. */
export async function shareImage(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
