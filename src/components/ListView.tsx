import { useState } from 'react';
import { genderOf, originLabels } from '../data/catalog';
import { HeartIcon, XIcon } from './icons';

const PAGE = 100;

/** The same deck as a scrolling list, for people who'd rather scan than swipe. */
export function ListView({ queue, onDecide, onOpenName }: { queue: string[]; onDecide(name: string, keep: boolean): void; onOpenName(name: string): void }) {
  const [shown, setShown] = useState(PAGE);
  if (!queue.length) {
    return <p className="empty-note">You've sorted every name in these decks. Tap 🌍 to open more.</p>;
  }
  return (
    <div className="list-view">
      <ul className="name-list">
        {queue.slice(0, shown).map((name) => (
          <li key={name} className="name-row">
            <span className={`dot dot--${genderOf(name)}`} />
            <button className="name-row-main" onClick={() => onOpenName(name)}>
              <strong>{name}</strong>
              <span>{originLabels(name).slice(0, 2).join(' · ')}</span>
            </button>
            <button className="row-btn row-btn--no" onClick={() => onDecide(name, false)} aria-label={`Pass on ${name}`}>
              <XIcon size={18} />
            </button>
            <button className="row-btn row-btn--yes" onClick={() => onDecide(name, true)} aria-label={`Keep ${name}`}>
              <HeartIcon size={18} />
            </button>
          </li>
        ))}
      </ul>
      {shown < queue.length && (
        <button className="soft-btn more-btn" onClick={() => setShown((s) => s + PAGE)}>
          Show {Math.min(PAGE, queue.length - shown)} more
        </button>
      )}
    </div>
  );
}
