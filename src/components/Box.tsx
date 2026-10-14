import { useMemo, useState } from 'react';
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
  setActiveBox,
  setDecision,
  setPartner,
  setTier,
  updateSettings,
  type State,
  type Tier,
} from '../store';
import { boxImage, shareImage } from '../exportImage';
import { myPicks, shareLink, shareOrCopy } from '../share';
import { NameDetail } from './NameInfo';

export const TIERS: { tier: Tier; label: string; emoji: string }[] = [
  { tier: 1, label: 'Love it', emoji: '💖' },
  { tier: 2, label: 'Really like', emoji: '👍' },
  { tier: 3, label: 'Thinking', emoji: '🤔' },
];
const TIER_EMOJI: Record<Tier, string> = { 0: '', 1: '💖', 2: '👍', 3: '🤔' };

function NameChip({ name, tier, onOpen, extra }: { name: string; tier?: Tier; onOpen(name: string): void; extra?: string }) {
  return (
    <button className={`name-chip name-chip--${genderOf(name)}`} onClick={() => onOpen(name)}>
      {tier ? <span className="name-chip-tier">{TIER_EMOJI[tier]}</span> : null}
      {name}
      {extra && <span className="name-chip-extra">{extra}</span>}
    </button>
  );
}

/** "Most of your names are Irish, want the Irish deck?" — only when one origin clearly dominates. */
function useNudge(state: State, names: string[]) {
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
    for (const [origin, n] of [...counts].sort((a, b) => b[1] - a[1])) {
      const key = `${state.activeBox}:${origin}`;
      const deck = `origin:${origin}`;
      if (n >= 5 && n / known >= 0.6 && ORIGIN_META[origin] && !state.settings.decks.includes(deck) && !state.dismissedNudges.includes(key)) {
        return { key, deck, label: ORIGIN_META[origin].label, pct: Math.round((n / known) * 100) };
      }
      break;
    }
    return null;
  }, [state.activeBox, state.settings.decks, state.dismissedNudges, names]);
}

export function BoxPanel({ state, onOpenName, onCompare }: { state: State; onOpenName(name: string): void; onCompare(): void }) {
  const box = state.boxes.find((b) => b.id === state.activeBox) ?? state.boxes[0];
  const entries = state.entries[box.id] ?? {};
  const names = useMemo(() => Object.entries(entries).sort((a, b) => b[1].t - a[1].t), [entries]);
  const nudge = useNudge(
    state,
    useMemo(() => names.map(([n]) => n), [names]),
  );
  const [busy, setBusy] = useState(false);

  async function saveImage() {
    setBusy(true);
    try {
      const blob = await boxImage(box.name, names.map(([n, e]) => [n, e.tier]), state.settings.theme === 'neutral');
      await shareImage(blob, `${box.name.replace(/[^\w -]/g, '') || 'names'}.png`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="box">
      <div className="box-tabs" role="tablist">
        {state.boxes.map((b) => (
          <button key={b.id} role="tab" aria-selected={b.id === box.id} className={`box-tab ${b.id === box.id ? 'is-on' : ''}`} onClick={() => setActiveBox(b.id)}>
            {b.name}
            <span className="box-tab-count">{Object.keys(state.entries[b.id] ?? {}).length}</span>
          </button>
        ))}
        <button
          className="box-tab box-tab--add"
          onClick={() => {
            const name = prompt('Name your new box', `Box ${state.boxes.length + 1}`)?.trim();
            if (name) addBox(name.slice(0, 30));
          }}
        >
          + New box
        </button>
      </div>
      <div className="box-meta">
        <span>New keepers go into this box.</span>
        <span className="box-meta-actions">
          <button
            className="inline-link"
            onClick={() => {
              const name = prompt('Rename this box', box.name)?.trim();
              if (name) renameBox(box.id, name.slice(0, 30));
            }}
          >
            Rename
          </button>
          {state.boxes.length > 1 && (
            <button
              className="inline-link inline-link--danger"
              onClick={() => {
                if (confirm(`Delete "${box.name}"? Names that are only in this box go back into your deck.`)) deleteBox(box.id);
              }}
            >
              Delete
            </button>
          )}
        </span>
      </div>

      {nudge && (
        <div className="nudge">
          <p>
            <b>{nudge.pct}% of your names here are {nudge.label}.</b> Want more like them?
          </p>
          <div className="nudge-actions">
            <button
              className="primary-btn primary-btn--sm"
              onClick={() => {
                updateSettings({ decks: [...state.settings.decks, nudge.deck] });
                dismissNudge(nudge.key);
              }}
            >
              Turn on {nudge.label}
            </button>
            <button className="inline-link" onClick={() => dismissNudge(nudge.key)}>
              No thanks
            </button>
          </div>
        </div>
      )}

      {names.length === 0 ? (
        <p className="empty-note">Nothing here yet. Swipe right on a name you love and it lands in this box.</p>
      ) : (
        <>
          <p className="panel-note">Tap a name to rank it. A top 50 is a good place to start narrowing down.</p>
          {[...TIERS, { tier: 0 as Tier, label: 'Not ranked yet', emoji: '' }].map(({ tier, label, emoji }) => {
            const list = names.filter(([, e]) => e.tier === tier);
            if (!list.length) return null;
            return (
              <section key={tier} className={`tier tier--${tier}`}>
                <h3>
                  {emoji} {label} <span className="tier-count">{list.length}</span>
                </h3>
                <div className="chip-wrap">
                  {list.map(([n]) => (
                    <NameChip key={n} name={n} onOpen={onOpenName} />
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}

      <div className="box-actions">
        <button className="soft-btn" onClick={onCompare}>
          💞 Compare with partner
        </button>
        <button className="soft-btn" onClick={saveImage} disabled={busy || names.length === 0}>
          {busy ? 'Making picture…' : '🖼️ Save as picture'}
        </button>
      </div>
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
          <h3 className="detail-h">How much do you like it?</h3>
          <div className="tier-picker">
            {TIERS.map(({ tier, label, emoji }) => (
              <button key={tier} className={`tier-btn ${entry.tier === tier ? 'is-on' : ''}`} onClick={() => setTier(box, name, entry.tier === tier ? 0 : tier)}>
                <span>{emoji}</span>
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
          <button className="text-btn text-btn--danger" onClick={() => removeFromBox(box, name)}>
            Take it out of the box
          </button>
        </>
      ) : (
        <div className="decide-row">
          <button className={`decide-btn decide-btn--no ${decision === 'no' ? 'is-on' : ''}`} onClick={() => setDecision(name, 'no')}>
            ✕ Pass
          </button>
          <button className="decide-btn decide-btn--yes" onClick={() => addToBox(name)}>
            ♥ Keep it
          </button>
        </div>
      )}
    </div>
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
              💞 You both like <span className="tier-count">{both.length}</span>
            </h3>
            {both.length ? (
              <div className="chip-wrap">
                {both.map((n) => (
                  <NameChip key={n} name={n} onOpen={onOpenName} extra={`${TIER_EMOJI[mine.get(n) ?? 0]}${TIER_EMOJI[theirs.get(n) ?? 0]}`} />
                ))}
              </div>
            ) : (
              <p className="empty-note">No matches yet. Keep swiping!</p>
            )}
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
            <div className="chip-wrap">
              {onlyThem.map((n) => (
                <NameChip key={n} name={n} tier={theirs.get(n)} onOpen={onOpenName} />
              ))}
            </div>
          </section>
          <section className="tier">
            <h3>
              Only you like <span className="tier-count">{onlyMe.length}</span>
            </h3>
            <div className="chip-wrap">
              {onlyMe.map((n) => (
                <NameChip key={n} name={n} tier={mine.get(n)} onOpen={onOpenName} />
              ))}
            </div>
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
