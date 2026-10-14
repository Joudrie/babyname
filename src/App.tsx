import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NAMES } from './data/names';
import { decide, getState, setTutorialDone, undo, useStore, type Action, type State } from './store';
import { Deck, type DeckHandle, type Dir, type Returning } from './components/Deck';
import { Sheet } from './components/Sheet';
import { BoxPanel, HistoryPanel, SettingsPanel, likedNames } from './components/Panels';
import { Tutorial } from './components/Tutorial';
import { BoxIcon, ClockIcon, GearIcon, HeartIcon, MaybeIcon, UndoIcon, XIcon } from './components/icons';
import { APP_NAME } from './config';

const DIR_ACTION: Record<Dir, Action> = { right: 'yes', left: 'no', up: 'maybe' };
const ACTION_DIR: Record<Action, Dir> = { yes: 'right', no: 'left', maybe: 'up' };

function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQueue(s: State): string[] {
  const { genders } = s.settings;
  return shuffle(NAMES.filter((n) => genders[n.gender] && !s.decisions[n.name]).map((n) => n.name));
}

type Panel = 'box' | 'history' | 'settings' | null;

export default function App() {
  const state = useStore();
  const { genders, theme } = state.settings;
  const [queue, setQueue] = useState(() => buildQueue(getState()));
  const [returning, setReturning] = useState<Returning | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [bump, setBump] = useState(0);
  const deck = useRef<DeckHandle>(null);

  // Turning a group on or off reshuffles the deck from everything not yet sorted.
  const genderKey = `${genders.m}${genders.f}${genders.u}`;
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setQueue(buildQueue(getState()));
  }, [genderKey]);

  // After "start over" the decisions are empty again, so refill the deck.
  const decidedCount = Object.keys(state.decisions).length;
  useEffect(() => {
    if (decidedCount === 0 && state.history.length === 0) setQueue(buildQueue(getState()));
  }, [decidedCount, state.history.length]);

  const onSwipe = useCallback((name: string, dir: Dir) => {
    const action = DIR_ACTION[dir];
    decide(name, action);
    if (action === 'yes') setBump((b) => b + 1);
    // "Not sure" names go to the back of the pile instead of disappearing.
    setQueue((q) => {
      const rest = q.filter((n) => n !== name);
      return action === 'maybe' ? [...rest, name] : rest;
    });
  }, []);

  const onUndo = useCallback(() => {
    const item = undo();
    if (!item) return;
    setQueue((q) => [item.name, ...q.filter((n) => n !== item.name)]);
    setReturning({ name: item.name, dir: ACTION_DIR[item.action], key: Date.now() });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (panel || !getState().tutorialDone) return;
      if (e.key === 'ArrowRight') deck.current?.swipe('right');
      else if (e.key === 'ArrowLeft') deck.current?.swipe('left');
      else if (e.key === 'ArrowUp') {
        e.preventDefault();
        deck.current?.swipe('up');
      } else if (e.key === 'Backspace' || (e.key === 'z' && (e.metaKey || e.ctrlKey))) onUndo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel, onUndo]);

  const total = useMemo(() => NAMES.filter((n) => genders[n.gender]).length, [genders]);
  const sorted = useMemo(() => NAMES.filter((n) => genders[n.gender] && state.decisions[n.name]).length, [genders, state.decisions]);
  const likedCount = useMemo(() => likedNames(state).length, [state]);
  const close = useCallback(() => setPanel(null), []);

  return (
    <div className={`app theme-${theme}`}>
      <header className="topbar">
        <button className="icon-btn" onClick={() => setPanel('settings')} aria-label="Settings">
          <GearIcon size={22} />
        </button>
        <div className="brand">
          <span className="brand-name">{APP_NAME}</span>
          <span className="counter">
            {sorted} / {total}
          </span>
        </div>
        <button className="icon-btn" onClick={() => setPanel('history')} aria-label="Name history">
          <ClockIcon size={22} />
        </button>
      </header>

      {state.saveFailed && <div className="save-warning">⚠️ Not saving: your browser is blocking storage</div>}

      <main className="stage">
        <Deck ref={deck} queue={queue} onSwipe={onSwipe} returning={returning} />
      </main>

      <nav className="controls">
        <button className="ctl ctl--sm" onClick={onUndo} disabled={!state.history.length} aria-label="Undo last swipe">
          <UndoIcon size={20} />
        </button>
        <button className="ctl ctl--lg ctl--nope" onClick={() => deck.current?.swipe('left')} disabled={!queue.length} aria-label="Pass">
          <XIcon size={30} />
        </button>
        <button className="ctl ctl--md ctl--maybe" onClick={() => deck.current?.swipe('up')} disabled={!queue.length} aria-label="Not sure">
          <MaybeIcon size={24} />
        </button>
        <button className="ctl ctl--lg ctl--like" onClick={() => deck.current?.swipe('right')} disabled={!queue.length} aria-label="Keep">
          <HeartIcon size={30} />
        </button>
        <button className="ctl ctl--sm ctl--box" onClick={() => setPanel('box')} aria-label={`Your box, ${likedCount} names`}>
          <BoxIcon size={20} />
          {likedCount > 0 && (
            <span className="badge" key={bump}>
              {likedCount}
            </span>
          )}
        </button>
      </nav>

      <Sheet open={panel === 'box'} onClose={close} title={`Your box · ${likedCount}`}>
        <BoxPanel state={state} />
      </Sheet>
      <Sheet open={panel === 'history'} onClose={close} title={`History · ${state.history.length}`}>
        <HistoryPanel state={state} />
      </Sheet>
      <Sheet open={panel === 'settings'} onClose={close} title="Settings">
        <SettingsPanel
          state={state}
          onReplayTutorial={() => {
            setPanel(null);
            setTutorialDone(false);
          }}
        />
      </Sheet>

      {!state.tutorialDone && <Tutorial onDone={() => setTutorialDone(true)} />}
    </div>
  );
}
