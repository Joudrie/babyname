import { useEffect, useMemo, useRef, useState } from 'react';
import { ORIGIN_META, getCatalog, genderOf } from '../data/catalog';
import {
  addBox,
  addToBox,
  boxesOf,
  deleteBox,
  dismissNudge,
  moveToBox,
  removeFromBox,
  renameBox,
  restoreToBox,
  setActiveBox,
  setDecision,
  setPartner,
  setTier,
  updateSettings,
  type BoxEntry,
  type State,
  type Tier,
} from '../store';
import { boxImage, shareImage } from '../exportImage';
import { myPicks, shareLink, shareOrCopy } from '../share';
import { NameDetail } from './NameInfo';
import { ChevronIcon, XIcon } from './icons';

/** Optional ranking, set from a name's details. Shown as a small tag in the list. */
export const TIERS: { tier: Tier; label: string }[] = [
  { tier: 1, label: 'Love it' },
  { tier: 2, label: 'Really like' },
  { tier: 3, label: 'Maybe' },
];
const TIER_LABEL: Record<Tier, string> = { 0: '', 1: 'Love it', 2: 'Really like', 3: 'Maybe' };

const count = (n: number) => `${n} name${n === 1 ? '' : 's'}`;

/** The folder button opens this: every box as a row. Tap one to see what's inside. */
export function BoxesPage({ state, onOpenBox, onCompare }: { state: State; onOpenBox(id: string): void; onCompare(): void }) {
  return (
    <div className="boxes">
      <ul className="row-list">
        {state.boxes.map((b) => (
          <li key={b.id}>
            <button className="row-link" onClick={() => onOpenBox(b.id)}>
              <span className="row-link-main">
                <strong>{b.name}</strong>
                <span>
                  {count(Object.keys(state.entries[b.id] ?? {}).length)}
                  {b.id === state.activeBox && state.boxes.length > 1 ? ' · new keepers go here' : ''}
                </span>
              </span>
              <ChevronIcon size={18} />
            </button>
          </li>
        ))}
      </ul>
      <button
        className="text-btn"
        onClick={() => {
          const name = prompt('Name your new box', `Box ${state.boxes.length + 1}`)?.trim();
          if (name) onOpenBox(addBox(name.slice(0, 30)));
        }}
      >
        + New box
      </button>

      <ul className="row-list row-list--spaced">
        <li>
          <button className="row-link" onClick={onCompare}>
            <span className="row-link-main">
              <strong>Compare with your partner</strong>
              <span>{state.partner ? `${state.partner.name || 'Partner'}'s list is saved` : 'See the names you both like'}</span>
            </span>
            <ChevronIcon size={18} />
          </button>
        </li>
      </ul>
    </div>
  );
}

/** "Most of your names are Irish, want the Irish deck?" — only when one origin clearly dominates. */
function useNudge(state: State, box: string, names: string[]) {
  return useMemo(() => {
    const c = getCatalog();
    const counts = new Map<string, number>();
    let known = 0;
    for (const n of names) {
      const i = c.index.get(n);
      const o = i === undefined ? undefined : c.origins[i][0];
      if (!o || o === 'american') continue;
      known++;
      counts.set(o, (counts.get(o) ?? 0) + 1);
    }
    const top = [...counts].sort((a, b) => b[1] - a[1])[0];
    if (!top) return null;
    const [origin, n] = top;
    const key = `${box}:${origin}`;
    const deck = `origin:${origin}`;
    if (n >= 5 && n / known >= 0.6 && ORIGIN_META[origin] && !state.settings.decks.includes(deck) && !state.dismissedNudges.includes(key)) {
      return { key, deck, label: ORIGIN_META[origin].label, pct: Math.round((n / known) * 100) };
    }
    return null;
  }, [box, state.settings.decks, state.dismissedNudges, names]);
}

type Sort = 'newest' | 'az';

/** One box: a compact list built for a hundred names, with one-tap remove and undo. */
export function BoxPage({ state, boxId, onOpenName, onGone }: { state: State; boxId: string; onOpenName(name: string): void; onGone(): void }) {
  const box = state.boxes.find((b) => b.id === boxId);
  const entries = state.entries[boxId] ?? {};
  const [sort, setSort] = useState<Sort>('newest');
  const [removed, setRemoved] = useState<{ name: string; entry: BoxEntry } | null>(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef<number>(undefined);

  const names = useMemo(() => {
    const list = Object.entries(entries);
    if (sort === 'az') list.sort((a, b) => a[0].localeCompare(b[0]));
    else list.sort((a, b) => b[1].t - a[1].t);
    return list;
  }, [entries, sort]);
  const nudge = useNudge(
    state,
    boxId,
    useMemo(() => names.map(([n]) => n), [names]),
  );

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!box) onGone();
  }, [box, onGone]);
  if (!box) return null;

  function remove(name: string, entry: BoxEntry) {
    removeFromBox(boxId, name);
    setRemoved({ name, entry });
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setRemoved(null), 6000);
  }

  function undoRemove() {
    if (!removed) return;
    restoreToBox(boxId, removed.name, removed.entry);
    setRemoved(null);
    clearTimeout(timer.current);
  }

  async function saveImage() {
    setBusy(true);
    try {
      const blob = await boxImage(box!.name, names.map(([n, e]) => [n, e.tier]), state.settings.theme === 'neutral');
      await shareImage(blob, `${box!.name.replace(/[^\w -]/g, '') || 'names'}.png`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="box-page">
      <div className="box-toolbar">
        <span className="box-count">{count(names.length)}</span>
        <div className="segmented segmented--sm">
          <button className={sort === 'newest' ? 'is-on' : ''} onClick={() => setSort('newest')}>
            Newest
          </button>
          <button className={sort === 'az' ? 'is-on' : ''} onClick={() => setSort('az')}>
            A–Z
          </button>
        </div>
      </div>

      {boxId !== state.activeBox && (
        <div className="box-note">
          New keepers go into {state.boxes.find((b) => b.id === state.activeBox)?.name}.
          <button className="inline-link" onClick={() => setActiveBox(boxId)}>
            Use this box instead
          </button>
        </div>
      )}

      {nudge && (
        <div className="nudge">
          <p>
            <b>{nudge.pct}% of these names are {nudge.label}.</b> Want more like them?
          </p>
          <div className="nudge-actions">
            <button
              className="primary-btn primary-btn--sm"
              onClick={() => {
                updateSettings({ decks: [...state.settings.decks, nudge.deck] });
                dismissNudge(nudge.key);
              }}
            >
              Add {nudge.label} names
            </button>
            <button className="inline-link" onClick={() => dismissNudge(nudge.key)}>
              No thanks
            </button>
          </div>
        </div>
      )}

      {names.length === 0 ? (
        <p className="empty-note">Nothing here yet. Swipe right on a name you love and it lands here.</p>
      ) : (
        <ul className="kept-list">
          {names.map(([name, e]) => (
            <li key={name} className="kept-row">
              <button className="kept-main" onClick={() => onOpenName(name)}>
                <span className={`dot dot--${genderOf(name)}`} />
                <strong>{name}</strong>
                {e.tier > 0 && <span className={`rank-tag rank-tag--${e.tier}`}>{TIER_LABEL[e.tier]}</span>}
              </button>
              <button className="kept-remove" onClick={() => remove(name, e)} aria-label={`Remove ${name}`}>
                <XIcon size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="box-footer">
        <button
          className="inline-link"
          onClick={() => {
            const name = prompt('Rename this box', box.name)?.trim();
            if (name) renameBox(boxId, name.slice(0, 30));
          }}
        >
          Rename
        </button>
        <button className="inline-link" onClick={saveImage} disabled={busy || names.length === 0}>
          {busy ? 'Making picture…' : 'Save as picture'}
        </button>
        {state.boxes.length > 1 && (
          <button
            className="inline-link inline-link--danger"
            onClick={() => {
              if (confirm(`Delete "${box.name}"? Names that are only in this box go back into your deck.`)) deleteBox(boxId);
            }}
          >
            Delete box
          </button>
        )}
      </div>

      {removed && (
        <div className="toast" role="status">
          <span>Removed {removed.name}</span>
          <button onClick={undoRemove}>Undo</button>
        </div>
      )}
    </div>
  );
}

/** One name, opened from anywhere: details plus whatever you can do with it from here. */
export function NameActions({ state, name, onPick }: { state: State; name: string; onPick(name: string): void }) {
  const inBoxes = boxesOf(state, name);
  const box = inBoxes.includes(state.activeBox) ? state.activeBox : inBoxes[0];
  const entry = box ? state.entries[box][name] : undefined;
  const decision = state.decisions[name];

  return (
    <div className="name-actions">
      <NameDetail name={name} onPickVariant={onPick} />

      {entry && box ? (
        <>
          <h3 className="detail-h">Rank it (optional)</h3>
          <div className="tier-picker">
            {TIERS.map(({ tier, label }) => (
              <button key={tier} className={`tier-btn ${entry.tier === tier ? 'is-on' : ''}`} onClick={() => setTier(box, name, entry.tier === tier ? 0 : tier)}>
                {label}
              </button>
            ))}
          </div>
          {state.boxes.length > 1 && (
            <label className="move-row">
              In box
              <select value={box} onChange={(e) => moveToBox(box, e.target.value, name)}>
                {state.boxes.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </>
      ) : (
        <div className="decide-row">
          <button className={`decide-btn decide-btn--no ${decision === 'no' ? 'is-on' : ''}`} onClick={() => setDecision(name, 'no')}>
            Pass
          </button>
          <button className="decide-btn decide-btn--yes" onClick={() => addToBox(name)}>
            Keep it
          </button>
        </div>
      )}
    </div>
  );
}

function NameRows({ names, onOpen, note }: { names: string[]; onOpen(name: string): void; note?: (name: string) => string }) {
  return (
    <ul className="kept-list">
      {names.map((n) => (
        <li key={n} className="kept-row">
          <button className="kept-main" onClick={() => onOpen(n)}>
            <span className={`dot dot--${genderOf(n)}`} />
            <strong>{n}</strong>
            {note?.(n) && <span className="rank-tag">{note(n)}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function ComparePanel({ state, onOpenName, onSwipePartner }: { state: State; onOpenName(name: string): void; onSwipePartner(): void }) {
  const [status, setStatus] = useState('');
  const mine = useMemo(() => myPicks(state), [state.entries, state.boxes]); // eslint-disable-line react-hooks/exhaustive-deps
  const partner = state.partner;
  const theirs = useMemo(() => new Map(partner?.picks ?? []), [partner]);
  const them = partner?.name || 'Your partner';

  async function share() {
    const r = await shareOrCopy('My baby name list', shareLink(state));
    setStatus(r === 'copied' ? 'Link copied. Send it to your partner.' : r === 'shared' ? '' : "Couldn't share. Try again?");
  }

  const score = (t: Tier | undefined) => (t ? 4 - t : 0.5);
  const both = [...mine.keys()].filter((n) => theirs.has(n)).sort((a, b) => score(mine.get(b)) + score(theirs.get(b)) - score(mine.get(a)) - score(theirs.get(a)));
  const onlyThem = [...theirs.keys()].filter((n) => !mine.has(n));
  const onlyMe = [...mine.keys()].filter((n) => !theirs.has(n));
  const unswiped = onlyThem.filter((n) => !state.decisions[n] && getCatalog().index.has(n)).length;

  return (
    <div className="compare">
      <section className="compare-share">
        <p className="panel-note">
          Each of you swipes on your own phone. Send your list with a link, and when your partner opens it you'll see the names you both like. No account needed.
        </p>
        <label className="field">
          Your first name <span>(so they know it's you)</span>
          <input value={state.settings.myName} maxLength={40} placeholder="e.g. Sam" onChange={(e) => updateSettings({ myName: e.target.value })} />
        </label>
        <button className="primary-btn" onClick={share} disabled={mine.size === 0}>
          Share my list ({mine.size})
        </button>
        {status && <p className="panel-note">{status}</p>}
      </section>

      {partner && (
        <>
          <section className="tier">
            <h3>
              You both like <span className="tier-count">{both.length}</span>
            </h3>
            {both.length ? <NameRows names={both} onOpen={onOpenName} /> : <p className="empty-note">No matches yet. Keep swiping!</p>}
          </section>
          <section className="tier">
            <h3>
              Only {them} likes <span className="tier-count">{onlyThem.length}</span>
            </h3>
            {unswiped > 0 && (
              <button className="primary-btn primary-btn--sm" onClick={onSwipePartner}>
                Swipe on {them}'s {unswiped} new name{unswiped === 1 ? '' : 's'}
              </button>
            )}
            <NameRows names={onlyThem} onOpen={onOpenName} note={(n) => TIER_LABEL[theirs.get(n) ?? 0]} />
          </section>
          <section className="tier">
            <h3>
              Only you like <span className="tier-count">{onlyMe.length}</span>
            </h3>
            <NameRows names={onlyMe} onOpen={onOpenName} note={(n) => TIER_LABEL[mine.get(n) ?? 0]} />
          </section>
          <button
            className="text-btn text-btn--danger"
            onClick={() => {
              if (confirm(`Forget ${them}'s list?`)) setPartner(null);
            }}
          >
            Forget {them}'s list
          </button>
        </>
      )}
    </div>
  );
}
