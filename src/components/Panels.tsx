import { resetAll, updateSettings, type Order, type State } from '../store';

const ACTION_LABEL = { yes: 'kept', no: 'passed', maybe: 'not sure' } as const;

export function HistoryPanel({ state, onOpenName }: { state: State; onOpenName(name: string): void }) {
  const rows = state.history;
  if (!rows.length) return <p className="empty-note">Every name you swipe shows up here, newest first.</p>;
  return (
    <>
      <p className="panel-note">Tap a name to change your mind or see what it means.</p>
      <ol className="history-list">
        {rows
          .map((item, i) => {
            const current = state.decisions[item.name] ?? 'maybe';
            return (
              <li key={i} className={`history-row ${current === 'yes' ? 'is-kept' : ''}`} onClick={() => onOpenName(item.name)}>
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

export function SettingsPanel({ state, onReplayTutorial }: { state: State; onReplayTutorial(): void }) {
  const { theme, order, lastName } = state.settings;
  const setOrder = (o: Order) => updateSettings({ order: o });

  return (
    <div className="settings">
      <section>
        <h3>Your last name</h3>
        <label className="field">
          <span>Shows each name with it, so you can hear how it flows.</span>
          <input value={lastName} maxLength={40} placeholder="e.g. Taylor" autoComplete="family-name" onChange={(e) => updateSettings({ lastName: e.target.value })} />
        </label>
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

      <section>
        <h3>Card order</h3>
        <div className="segmented">
          <button className={order === 'popular' ? 'is-on' : ''} onClick={() => setOrder('popular')}>
            Best-known first
          </button>
          <button className={order === 'random' ? 'is-on' : ''} onClick={() => setOrder('random')}>
            Totally random
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
            if (confirm('Start over? This clears your boxes and everything you have swiped.')) resetAll();
          }}
        >
          Start over
        </button>
      </section>

      <p className="panel-note">
        {state.saveFailed
          ? "Your browser is blocking storage, so swipes aren't being saved. Try a normal (non-private) window."
          : 'Your progress saves on this device automatically. We never send promotional email.'}
      </p>
      <p className="panel-note small">
        Name data: US Social Security Administration (1880–2024) via the open-source usbabynames project. Meanings and origins are a guide, not gospel.
      </p>
    </div>
  );
}
