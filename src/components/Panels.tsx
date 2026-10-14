import { useMemo } from 'react';
import { GENDER_OF, type Gender } from '../data/names';
import { resetAll, setDecision, updateSettings, type State } from '../store';
import { XIcon } from './icons';

/** Liked names, most recently liked first. */
export function likedNames(state: State): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (let i = state.history.length - 1; i >= 0; i--) {
    const { name } = state.history[i];
    if (seen.has(name)) continue;
    seen.add(name);
    if (state.decisions[name] === 'yes') out.push(name);
  }
  return out;
}

export function BoxPanel({ state }: { state: State }) {
  const names = useMemo(() => likedNames(state), [state]);
  if (!names.length) {
    return <p className="empty-note">Nothing here yet. Swipe right on a name you love and it lands in your box.</p>;
  }
  return (
    <ul className="box-list">
      {names.map((name) => (
        <li key={name} className={`box-row box-row--${GENDER_OF[name] ?? 'u'}`}>
          <span className="box-name">{name}</span>
          <button className="box-remove" onClick={() => setDecision(name, 'no')} aria-label={`Remove ${name}`}>
            <XIcon size={16} />
          </button>
        </li>
      ))}
    </ul>
  );
}

const ACTION_LABEL = { yes: 'kept', no: 'passed', maybe: 'not sure' } as const;

export function HistoryPanel({ state }: { state: State }) {
  const rows = state.history;
  if (!rows.length) return <p className="empty-note">Every name you swipe shows up here, newest first.</p>;
  return (
    <>
      <p className="panel-note">Tap a name to switch it between kept and passed.</p>
      <ol className="history-list">
        {rows
          .map((item, i) => {
            const current = state.decisions[item.name] ?? 'maybe';
            return (
              <li
                key={i}
                className={`history-row ${current === 'yes' ? 'is-kept' : ''}`}
                onClick={() => setDecision(item.name, current === 'yes' ? 'no' : 'yes')}
              >
                <strong>{item.name}</strong>
                <span>{ACTION_LABEL[current]}</span>
              </li>
            );
          })
          .reverse()}
      </ol>
    </>
  );
}

const GENDER_OPTIONS: { key: Gender; label: string }[] = [
  { key: 'm', label: 'Boys' },
  { key: 'f', label: 'Girls' },
  { key: 'u', label: 'Unisex' },
];

export function SettingsPanel({ state, onReplayTutorial }: { state: State; onReplayTutorial(): void }) {
  const { genders, theme } = state.settings;
  const onCount = Object.values(genders).filter(Boolean).length;

  return (
    <div className="settings">
      <section>
        <h3>Show me names for</h3>
        <div className="chips">
          {GENDER_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              className={`chip chip--${key} ${genders[key] ? 'is-on' : ''}`}
              aria-pressed={genders[key]}
              // Keep at least one group on so the deck is never empty by accident.
              disabled={genders[key] && onCount === 1}
              onClick={() => updateSettings({ genders: { ...genders, [key]: !genders[key] } })}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3>Card colors</h3>
        <div className="segmented">
          <button className={theme === 'color' ? 'is-on' : ''} onClick={() => updateSettings({ theme: 'color' })}>
            Blue, pink &amp; lavender
          </button>
          <button className={theme === 'neutral' ? 'is-on' : ''} onClick={() => updateSettings({ theme: 'neutral' })}>
            All the same
          </button>
        </div>
      </section>

      <section className="settings-actions">
        <button className="text-btn" onClick={onReplayTutorial}>
          Show the quick tour again
        </button>
        <button
          className="text-btn text-btn--danger"
          onClick={() => {
            if (confirm('Start over? This clears your box and everything you have swiped.')) resetAll();
          }}
        >
          Start over
        </button>
      </section>

      <p className="panel-note">
        {state.saveFailed
          ? "⚠️ Your browser is blocking storage, so swipes aren't being saved. Try a normal (non-private) window."
          : 'Your progress saves on this device automatically.'}
      </p>
    </div>
  );
}
