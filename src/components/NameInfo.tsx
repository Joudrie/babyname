import { useEffect, useState } from 'react';
import { getCatalog, getDetails, getFictionSource, genderOf, originLabels, type Details } from '../data/catalog';

export function useNameInfo(name: string) {
  const [info, setInfo] = useState<{ name: string; details: Details | null; fiction: string | null } | null>(null);
  useEffect(() => {
    let live = true;
    Promise.all([getDetails(name), getFictionSource(name)]).then(([details, fiction]) => {
      if (live) setInfo({ name, details, fiction });
    });
    return () => {
      live = false;
    };
  }, [name]);
  return info?.name === name ? info : null;
}

const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

export function speak(name: string) {
  if (!canSpeak) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(name);
  u.rate = 0.85;
  speechSynthesis.speak(u);
}

export function SpeakButton({ name }: { name: string }) {
  if (!canSpeak) return null;
  return (
    <button className="speak-btn" onClick={() => speak(name)} aria-label={`Hear ${name}`}>
      🔊
    </button>
  );
}

/** Popularity in the US by decade as a soft area chart. */
export function Sparkline({ series }: { series: number[] }) {
  const decades = getCatalog().decades;
  const max = Math.max(...series);
  if (!series.length || max <= 0) return null;
  const w = 240;
  const h = 46;
  const pad = 5;
  const step = (w - pad * 2) / (series.length - 1);
  const pts = series.map((v, i) => [pad + i * step, h - 4 - (v / max) * (h - 10)] as const);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');
  const peak = series.indexOf(max);
  return (
    <figure className="spark">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
        <path d={`${line}L${w - pad},${h}L${pad},${h}Z`} className="spark-area" />
        <path d={line} className="spark-line" />
        <circle cx={pts[peak][0]} cy={pts[peak][1]} r="3.5" className="spark-dot" />
      </svg>
      <figcaption>
        <span>{decades[0]}</span>
        <span>peaked in the {decades[peak]}s</span>
        <span>today</span>
      </figcaption>
    </figure>
  );
}

const GENDER_WORD = { m: 'Boy', f: 'Girl', u: 'Unisex' } as const;

/** The back of a swipe card: meaning, origin, how it sounds, and how popular it's been. */
export function CardBack({ name }: { name: string }) {
  const info = useNameInfo(name);
  const origins = originLabels(name);
  const d = info?.details;
  return (
    <div className="card-back">
      <div className="back-head">
        <span className="back-name">{name}</span>
        <SpeakButton name={name} />
      </div>
      {d?.pron && <div className="back-pron">{d.pron}</div>}
      {d?.meaning && <p className="back-meaning">{d.meaning}</p>}
      {info?.fiction && <p className="back-fiction">📖 From {info.fiction}</p>}
      {origins.length > 0 && (
        <div className="tag-row">
          {origins.slice(0, 4).map((o) => (
            <span key={o} className="tag">
              {o}
            </span>
          ))}
        </div>
      )}
      {d && <Sparkline series={d.series} />}
      {d && d.variants.length > 0 && (
        <p className="back-variants">
          <b>Also:</b> {d.variants.slice(0, 7).join(', ')}
        </p>
      )}
      {info && !d && !info.fiction && <p className="back-meaning">We don't have notes on this one yet.</p>}
      <div className="card-hint">tap to flip back</div>
    </div>
  );
}

/** The fuller version used in the name sheet (from the box, history or list). */
export function NameDetail({ name, onPickVariant }: { name: string; onPickVariant?(name: string): void }) {
  const info = useNameInfo(name);
  const origins = originLabels(name);
  const d = info?.details;
  const c = getCatalog();
  return (
    <div className="name-detail">
      <div className="detail-head">
        <span className={`detail-name detail-name--${genderOf(name)}`}>{name}</span>
        <SpeakButton name={name} />
      </div>
      <div className="detail-sub">
        {GENDER_WORD[genderOf(name)]}
        {d?.pron ? ` · ${d.pron}` : ''}
      </div>
      {d?.meaning && <p className="detail-meaning">{d.meaning}</p>}
      {info?.fiction && <p className="back-fiction">📖 From {info.fiction}</p>}
      {origins.length > 0 && (
        <div className="tag-row">
          {origins.map((o) => (
            <span key={o} className="tag">
              {o}
            </span>
          ))}
        </div>
      )}
      {d && <Sparkline series={d.series} />}
      {d && d.variants.length > 0 && (
        <>
          <h3 className="detail-h">Other versions</h3>
          <div className="variant-row">
            {d.variants.map((v) => (
              <button key={v} className={`variant variant--${genderOf(v)}`} onClick={() => onPickVariant?.(v)} disabled={!c.index.has(v) || !onPickVariant}>
                {v}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
