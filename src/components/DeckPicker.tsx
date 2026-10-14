import { useMemo, useState, type ReactNode } from 'react';
import { GROUPS, getCatalog, type Gender } from '../data/catalog';
import { DEFAULT_DECKS, updateSettings, type State } from '../store';
import { deckCount } from '../queue';
import { CheckIcon } from './icons';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const GENDERS: { key: Gender; label: string }[] = [
  { key: 'm', label: 'Boys' },
  { key: 'f', label: 'Girls' },
  { key: 'u', label: 'Unisex' },
];
/** The few decks shown up front; everything else sits one tap deeper so the screen stays calm. */
const START_HERE = ['popular', 'classics', 'trending', 'oldfashioned'];
const THEMES = ['origin:fiction', 'origin:myth', 'origin:biblical', 'everything'];

type Counts = Map<string, { left: number; total: number }>;

function DeckChip({ id, label, state, counts }: { id: string; label: string; state: State; counts: Counts }) {
  const on = state.settings.decks.includes(id);
  const count = counts.get(id);
  const onlyOne = on && state.settings.decks.length === 1;
  return (
    <button
      className={`deck-chip ${on ? 'is-on' : ''}`}
      aria-pressed={on}
      disabled={onlyOne}
      title={onlyOne ? 'Keep at least one deck on' : undefined}
      onClick={() => updateSettings({ decks: on ? state.settings.decks.filter((d) => d !== id) : [...state.settings.decks, id] })}
    >
      <span className="deck-chip-check" aria-hidden="true">
        {on && <CheckIcon size={14} />}
      </span>
      <span className="deck-chip-label">{label}</span>
      {count && <span className="deck-chip-count">{count.left.toLocaleString()}</span>}
    </button>
  );
}

/** A tappable row that opens to show its options, with a short summary of what's chosen inside. */
function Section({ title, summary, children, open }: { title: string; summary?: string; children: ReactNode; open?: boolean }) {
  return (
    <details className="picker-row" open={open}>
      <summary>
        <span className="picker-row-title">{title}</span>
        {summary && <span className="picker-row-summary">{summary}</span>}
      </summary>
      <div className="picker-row-body">{children}</div>
    </details>
  );
}

export function DeckPicker({ state }: { state: State }) {
  const c = getCatalog();
  const { genders, letters, decks } = state.settings;
  const [loadingYear, setLoadingYear] = useState(false);
  const onCount = Object.values(genders).filter(Boolean).length;

  const counts = useMemo(() => {
    const m: Counts = new Map();
    for (const d of c.decks) m.set(d.id, deckCount(c, state, d.id));
    for (const id of decks) if (!m.has(id)) m.set(id, deckCount(c, state, id));
    if (state.partner) m.set('partner', deckCount(c, state, 'partner'));
    return m;
  }, [c, state.decisions, genders, letters, decks, state.partner]); // eslint-disable-line react-hooks/exhaustive-deps

  const byId = new Map(c.decks.map((d) => [d.id, d]));
  const onIn = (ids: string[]) => ids.filter((id) => decks.includes(id)).length;
  const onSummary = (n: number) => (n ? `${n} on` : '');
  const chips = (ids: string[]) => (
    <div className="deck-grid">
      {ids.map((id) => (
        <DeckChip key={id} id={id} label={byId.get(id)?.label ?? id} state={state} counts={counts} />
      ))}
    </div>
  );

  const countries = c.decks.filter((d) => d.group === 'world').map((d) => d.id);
  const eras = c.decks.filter((d) => d.group === 'eras').map((d) => d.id);
  const yearDecks = decks.filter((d) => d.startsWith('year:'));
  const regionIds = GROUPS.filter((g) => g.key !== 'world').flatMap((g) => c.decks.filter((d) => d.group === g.key).map((d) => d.id));

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
        <h3>Start here</h3>
        {chips(START_HERE)}
      </section>

      <div className="picker-rows">
        {state.partner && (
          <Section title={`${state.partner.name || 'Partner'}'s picks`} summary={onSummary(onIn(['partner']))}>
            <div className="deck-grid">
              <DeckChip id="partner" label={`${state.partner.name || 'Partner'}'s picks`} state={state} counts={counts} />
            </div>
          </Section>
        )}

        <Section title="Starts with a letter" summary={letters ? letters.split('').join(', ') : 'Any'}>
          <div className="letters">
            {LETTERS.map((l) => (
              <button key={l} className={`letter ${letters.includes(l) ? 'is-on' : ''}`} aria-pressed={letters.includes(l)} onClick={() => toggleLetter(l)}>
                {l}
              </button>
            ))}
          </div>
          {letters && (
            <button className="text-btn" onClick={() => updateSettings({ letters: '' })}>
              Any letter
            </button>
          )}
        </Section>

        <Section title="Popular in other countries" summary={onSummary(onIn(countries))}>
          {chips(countries)}
        </Section>

        <Section title="Where names come from" summary={onSummary(onIn(regionIds))}>
          {GROUPS.filter((g) => g.key !== 'world').map((g) => (
            <div key={g.key} className="region-block">
              <h4>{g.label}</h4>
              {chips(c.decks.filter((d) => d.group === g.key).map((d) => d.id))}
            </div>
          ))}
        </Section>

        <Section title="Themes" summary={onSummary(onIn(THEMES))}>
          {chips(THEMES)}
        </Section>

        <Section title="Through the years" summary={onSummary(onIn([...eras, ...yearDecks]))}>
          <p className="panel-note">The most-given US names of each decade, or the top 100 of one year.</p>
          {chips(eras)}
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
            <div className="deck-grid">
              {yearDecks.map((id) => (
                <DeckChip key={id} id={id} label={id.slice(5)} state={state} counts={counts} />
              ))}
            </div>
          )}
        </Section>
      </div>

      <button className="text-btn" onClick={() => updateSettings({ decks: DEFAULT_DECKS, letters: '' })}>
        Reset to the starter decks
      </button>
    </div>
  );
}
