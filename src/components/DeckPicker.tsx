import { useMemo, useState } from 'react';
import { GROUPS, getCatalog, type Gender } from '../data/catalog';
import { DEFAULT_DECKS, updateSettings, type State } from '../store';
import { deckCount } from '../queue';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const GENDERS: { key: Gender; label: string }[] = [
  { key: 'm', label: 'Boys' },
  { key: 'f', label: 'Girls' },
  { key: 'u', label: 'Unisex' },
];

function DeckChip({ id, label, state, counts }: { id: string; label: string; state: State; counts: Map<string, { left: number; total: number }> }) {
  const on = state.settings.decks.includes(id);
  const count = counts.get(id);
  const onlyOne = on && state.settings.decks.length === 1;
  return (
    <button
      className={`deck-chip ${on ? 'is-on' : ''}`}
      aria-pressed={on}
      disabled={onlyOne}
      title={onlyOne ? 'Keep at least one deck on' : undefined}
      onClick={() => {
        const decks = on ? state.settings.decks.filter((d) => d !== id) : [...state.settings.decks, id];
        updateSettings({ decks });
      }}
    >
      <span className="deck-chip-label">{label}</span>
      {count && <span className="deck-chip-count">{count.left === count.total ? count.total : `${count.left} left`}</span>}
    </button>
  );
}

export function DeckPicker({ state }: { state: State }) {
  const c = getCatalog();
  const { genders, letters, decks } = state.settings;
  const [loadingYear, setLoadingYear] = useState(false);
  const onCount = Object.values(genders).filter(Boolean).length;

  // Counts depend on what's been sorted and the filters; recomputed when any of those change.
  const counts = useMemo(() => {
    const m = new Map<string, { left: number; total: number }>();
    for (const d of c.decks) m.set(d.id, deckCount(c, state, d.id));
    for (const id of decks) if (!m.has(id)) m.set(id, deckCount(c, state, id));
    if (state.partner) m.set('partner', deckCount(c, state, 'partner'));
    return m;
  }, [c, state.decisions, genders, letters, decks, state.partner]); // eslint-disable-line react-hooks/exhaustive-deps

  const featured = c.decks.filter((d) => d.group === 'featured');
  const eras = c.decks.filter((d) => d.group === 'eras');
  const yearDecks = decks.filter((d) => d.startsWith('year:'));

  async function addYear(year: string) {
    if (!year) return;
    setLoadingYear(true);
    await c.loadYears();
    setLoadingYear(false);
    const id = `year:${year}`;
    if (!decks.includes(id)) updateSettings({ decks: [...decks, id] });
  }

  const toggleLetter = (l: string) => updateSettings({ letters: letters.includes(l) ? letters.replace(l, '') : letters + l });

  return (
    <div className="picker">
      <p className="panel-note">Turn on as many decks as you like. A name you've sorted never comes back in another deck.</p>

      <section>
        <h3>Show me</h3>
        <div className="chips">
          {GENDERS.map(({ key, label }) => (
            <button
              key={key}
              className={`chip chip--${key} ${genders[key] ? 'is-on' : ''}`}
              aria-pressed={genders[key]}
              disabled={genders[key] && onCount === 1}
              onClick={() => updateSettings({ genders: { ...genders, [key]: !genders[key] } })}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3>
          Starts with
          {letters && (
            <button className="inline-link" onClick={() => updateSettings({ letters: '' })}>
              any letter
            </button>
          )}
        </h3>
        <div className="letters">
          {LETTERS.map((l) => (
            <button key={l} className={`letter ${letters.includes(l) ? 'is-on' : ''}`} aria-pressed={letters.includes(l)} onClick={() => toggleLetter(l)}>
              {l}
            </button>
          ))}
        </div>
      </section>

      {state.partner && (
        <section>
          <h3>From your partner</h3>
          <div className="deck-grid">
            <DeckChip id="partner" label={`${state.partner.name || 'Partner'}'s picks`} state={state} counts={counts} />
          </div>
        </section>
      )}

      <section>
        <h3>Popular picks</h3>
        <div className="deck-grid">
          {featured.map((d) => (
            <DeckChip key={d.id} id={d.id} label={d.label} state={state} counts={counts} />
          ))}
        </div>
      </section>

      {GROUPS.map((g) => {
        const list = c.decks.filter((d) => d.group === g.key);
        const active = list.filter((d) => decks.includes(d.id)).length;
        return (
          <details key={g.key} className="region" open={g.open || active > 0}>
            <summary>
              <span>{g.label}</span>
              {active > 0 && <span className="region-count">{active} on</span>}
            </summary>
            <div className="deck-grid">
              {list.map((d) => (
                <DeckChip key={d.id} id={d.id} label={d.label} state={state} counts={counts} />
              ))}
            </div>
          </details>
        );
      })}

      <details className="region" open={decks.some((d) => d.startsWith('era:') || d.startsWith('year:'))}>
        <summary>
          <span>Through the years</span>
        </summary>
        <p className="panel-note">The most-given US names of each decade, or the top 100 boys and girls of one year.</p>
        <div className="deck-grid deck-grid--tight">
          {eras.map((d) => (
            <DeckChip key={d.id} id={d.id} label={d.label} state={state} counts={counts} />
          ))}
        </div>
        <div className="year-row">
          <select defaultValue="" onChange={(e) => addYear(e.target.value)} disabled={loadingYear} aria-label="Add a year">
            <option value="">{loadingYear ? 'Loading…' : '+ Top names of a year…'}</option>
            {Array.from({ length: c.yearsRange[1] - c.yearsRange[0] + 1 }, (_, i) => String(c.yearsRange[1] - i)).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        {yearDecks.length > 0 && (
          <div className="deck-grid deck-grid--tight">
            {yearDecks.map((id) => (
              <DeckChip key={id} id={id} label={id.slice(5)} state={state} counts={counts} />
            ))}
          </div>
        )}
      </details>

      <button className="text-btn" onClick={() => updateSettings({ decks: DEFAULT_DECKS, letters: '' })}>
        Back to the starter decks
      </button>
    </div>
  );
}
