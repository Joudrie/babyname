import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { GENDER_OF, type Gender } from '../data/names';

export type Dir = 'left' | 'right' | 'up';

export interface DeckHandle {
  swipe(dir: Dir): void;
}

export interface Returning {
  name: string;
  dir: Dir;
  key: number;
}

interface Props {
  queue: string[];
  onSwipe(name: string, dir: Dir): void;
  returning: Returning | null;
}

interface Flying {
  key: number;
  name: string;
  dir: Dir;
  dx: number;
  dy: number;
  speed: number;
}

const GENDER_LABEL: Record<Gender, string> = { m: 'boy', f: 'girl', u: 'unisex' };
const VISIBLE = 3;

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const cardTransform = (dx: number, dy: number) => `translate3d(${dx}px,${dy}px,0) rotate(${dx * 0.05}deg)`;

/** Where a card ends up once it leaves the screen in a given direction. */
function offscreen(dir: Dir, dx = 0, dy = 0) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (dir === 'up') return `translate3d(${dx * 0.6}px,${-h * 1.1}px,0) rotate(${dx * 0.03}deg)`;
  const x = (dir === 'right' ? 1 : -1) * (w * 0.75 + 320);
  return `translate3d(${x}px,${dy + dy * 0.4}px,0) rotate(${dir === 'right' ? 28 : -28}deg)`;
}

/** Sets the KEEP / NOPE / MAYBE stamp strengths through CSS variables, so a drag frame touches no layout. */
function setStamps(el: HTMLElement, like: number, nope: number, maybe: number) {
  el.style.setProperty('--s-like', String(like));
  el.style.setProperty('--s-nope', String(nope));
  el.style.setProperty('--s-maybe', String(maybe));
}

function CardFace({ name }: { name: string }) {
  const gender = GENDER_OF[name] ?? 'u';
  const size = name.length > 10 ? 'xl' : name.length > 7 ? 'l' : 'm';
  return (
    <>
      <div className="card-tag">{GENDER_LABEL[gender]}</div>
      <div className={`card-name card-name--${size}`}>{name}</div>
      <div className="stamp stamp--like">keep</div>
      <div className="stamp stamp--nope">nope</div>
      <div className="stamp stamp--maybe">maybe</div>
    </>
  );
}

function FlyingCard({ f, onDone }: { f: Flying; onDone(key: number): void }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current!;
    setStamps(el, f.dir === 'right' ? 1 : 0, f.dir === 'left' ? 1 : 0, f.dir === 'up' ? 1 : 0);
    // A fast flick leaves faster; a slow drag past the line still gets a quick, clean exit.
    const duration = Math.max(200, 360 - f.speed * 90);
    const anim = el.animate([{ transform: cardTransform(f.dx, f.dy) }, { transform: offscreen(f.dir, f.dx, f.dy) }], {
      duration,
      easing: 'cubic-bezier(.3,.6,.4,1)',
      fill: 'forwards',
    });
    anim.onfinish = () => onDone(f.key);
    return () => anim.cancel();
  }, [f, onDone]);
  return (
    <div ref={ref} className={`card card--${GENDER_OF[f.name] ?? 'u'} card--flying`} aria-hidden="true">
      <CardFace name={f.name} />
    </div>
  );
}

export const Deck = forwardRef<DeckHandle, Props>(function Deck({ queue, onSwipe, returning }, handle) {
  const topRef = useRef<HTMLDivElement | null>(null);
  const nextRef = useRef<HTMLDivElement | null>(null);
  const [flying, setFlying] = useState<Flying[]>([]);
  const drag = useRef<{
    id: number;
    x0: number;
    y0: number;
    dx: number;
    dy: number;
    samples: { x: number; y: number; t: number }[];
    raf: number;
  } | null>(null);
  const flyKey = useRef(0);

  const top = queue[0];
  const visible = queue.slice(0, VISIBLE);

  const removeFlying = useRef((key: number) => setFlying((list) => list.filter((f) => f.key !== key))).current;

  function paint() {
    const d = drag.current;
    const el = topRef.current;
    if (!d || !el) return;
    d.raf = 0;
    el.style.transform = cardTransform(d.dx, d.dy);
    const horizontal = Math.abs(d.dx) >= Math.abs(d.dy);
    setStamps(el, horizontal ? clamp01(d.dx / 110) : 0, horizontal ? clamp01(-d.dx / 110) : 0, horizontal ? 0 : clamp01(-d.dy / 110));
    // The card underneath grows into place as the top card is pulled away.
    const next = nextRef.current;
    if (next) {
      const p = clamp01(Math.hypot(d.dx, d.dy) / 160);
      next.style.transform = `translate3d(0,${14 * (1 - p)}px,0) scale(${0.95 + 0.05 * p})`;
    }
  }

  function releaseNext() {
    const next = nextRef.current;
    if (next) next.style.transform = '';
  }

  function fling(dir: Dir, dx: number, dy: number, speed: number) {
    if (!top) return;
    const el = topRef.current;
    if (el) {
      el.style.transform = '';
      setStamps(el, 0, 0, 0);
    }
    releaseNext();
    setFlying((list) => [...list, { key: ++flyKey.current, name: top, dir, dx, dy, speed }]);
    onSwipe(top, dir);
  }

  useImperativeHandle(handle, () => ({
    swipe(dir) {
      if (drag.current) return;
      fling(dir, 0, 0, 0.5);
    },
  }));

  // Undo: the restored card flies back in from the side it left.
  useLayoutEffect(() => {
    const el = topRef.current;
    if (!returning || !el || returning.name !== top) return;
    const anim = el.animate([{ transform: offscreen(returning.dir) }, { transform: 'translate3d(0,0,0) rotate(0deg)' }], {
      duration: 420,
      easing: 'cubic-bezier(.2,.9,.3,1.08)',
    });
    return () => anim.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returning?.key]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || drag.current) return;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    el.getAnimations().forEach((a) => a.cancel());
    el.classList.add('is-dragging');
    nextRef.current?.classList.add('is-dragging');
    drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, samples: [{ x: e.clientX, y: e.clientY, t: e.timeStamp }], raf: 0 };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    d.dx = e.clientX - d.x0;
    d.dy = e.clientY - d.y0;
    d.samples.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
    if (d.samples.length > 6) d.samples.shift();
    if (!d.raf) d.raf = requestAnimationFrame(paint);
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    if (d.raf) cancelAnimationFrame(d.raf);
    const el = e.currentTarget;
    el.classList.remove('is-dragging');
    nextRef.current?.classList.remove('is-dragging');

    // Release velocity in px/ms over the last ~100ms. The release point counts as a sample,
    // so pausing before letting go reads as a slow release rather than the earlier motion.
    d.samples.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
    const last = d.samples[d.samples.length - 1];
    const first = d.samples.find((s) => last.t - s.t <= 100) ?? d.samples[0];
    const dt = Math.max(1, last.t - first.t);
    const vx = (last.x - first.x) / dt;
    const vy = (last.y - first.y) / dt;

    const line = Math.min(120, window.innerWidth * 0.28);
    const flick = 0.55;
    let dir: Dir | null = null;
    if (Math.abs(d.dx) >= Math.abs(d.dy)) {
      if (d.dx > line || (vx > flick && d.dx > 24)) dir = 'right';
      else if (d.dx < -line || (vx < -flick && d.dx < -24)) dir = 'left';
    } else if (d.dy < -line || (vy < -flick && d.dy < -24)) {
      dir = 'up';
    }

    if (dir) {
      fling(dir, d.dx, d.dy, Math.hypot(vx, vy));
      return;
    }
    // Not far enough: spring back with a little overshoot.
    const from = cardTransform(d.dx, d.dy);
    el.style.transform = '';
    setStamps(el, 0, 0, 0);
    releaseNext();
    el.animate([{ transform: from }, { transform: 'translate3d(0,0,0) rotate(0deg)' }], {
      duration: 450,
      easing: 'cubic-bezier(.34,1.5,.64,1)',
    });
  }

  return (
    <div className="deck">
      {visible.length === 0 && (
        <div className="card card--empty">
          <div className="card-name card-name--l">All sorted 🎉</div>
          <p className="card-sub">You've been through every name in your decks. Turn on more in settings.</p>
        </div>
      )}
      {visible
        .map((name, i) => (
          <div
            key={name}
            ref={i === 0 ? topRef : i === 1 ? nextRef : undefined}
            className={`card card--${GENDER_OF[name] ?? 'u'} depth-${i}`}
            onPointerDown={i === 0 ? onPointerDown : undefined}
            onPointerMove={i === 0 ? onPointerMove : undefined}
            onPointerUp={i === 0 ? onPointerUp : undefined}
            onPointerCancel={i === 0 ? onPointerUp : undefined}
            aria-hidden={i !== 0}
          >
            <CardFace name={name} />
          </div>
        ))
        .reverse()}
      {flying.map((f) => (
        <FlyingCard key={f.key} f={f} onDone={removeFlying} />
      ))}
    </div>
  );
});
