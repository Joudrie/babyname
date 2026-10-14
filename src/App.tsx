import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getCatalog, loadCatalog, type Catalog } from './data/catalog';
import { decide, getState, setPartner, setTutorialDone, undo, updateSettings, useStore, type Action, type Partner } from './store';
import { buildQueue, mixProgress, mixSet } from './queue';
import { readPartnerHash } from './share';
import { Deck, type DeckHandle, type Dir, type Returning } from './components/Deck';
import { Sheet } from './components/Sheet';
import { HistoryPanel, SettingsPanel } from './components/Panels';
import { BoxPanel, ComparePanel, NameActions } from './components/Box';
import { DeckPicker } from './components/DeckPicker';
import { ListView } from './components/ListView';
import { Tutorial } from './components/Tutorial';
import { BackIcon, BoxIcon, CardsIcon, ClockIcon, GearIcon, GlobeIcon, HeartIcon, ListIcon, MaybeIcon, UndoIcon, XIcon } from './components/icons';
import { APP_NAME } from './config';

const DIR_ACTION: Record<Dir, Action> = { right: 'yes', left: 'no', up: 'maybe' };
const ACTION_DIR: Record<Action, Dir> = { yes: 'right', no: 'left', maybe: 'up' };

type Panel = 'history' | 'settings' | 'decks' | null;
/** Full pages (not pop-ups). They live in the URL hash so the phone's back gesture works. */
type Page = 'home' | 'box' | 'compare';

const readPage = (): Page => (window.location.hash === '#box' ? 'box' : window.location.hash === '#compare' ? 'compare' : 'home');

export default function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    loadCatalog()
      .then(async (c) => {
        // Year decks need the per-year lists before the first queue is built.
        if (getState().settings.decks.some((d) => d.startsWith('year:'))) await c.loadYears();
        setCatalog(c);
      })
      .catch(() => setFailed(true));
  }, []);

  if (!catalog) {
    return (
      <div className="loading">
        <div className="loading-mark">🍼</div>
        <p>{failed ? "Couldn't load the names. Check your connection and refresh." : `Gathering names…`}</p>
      </div>
    );
  }
  return <Main />;
}

function Main() {
  const state = useStore();
  const c = getCatalog();
  const { theme, decks, genders, letters, order, lastName } = state.settings;
  const [queue, setQueue] = useState(() => buildQueue(c, getState()));
  const [returning, setReturning] = useState<Returning | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [openName, setOpenName] = useState<string | null>(null);
  const [incoming, setIncoming] = useState<Partner | null>(() => readPartnerHash(window.location.hash));
  const [mode, setMode] = useState<'swipe' | 'list'>('swipe');
  const [bump, setBump] = useState(0);
  const [page, setPage] = useState<Page>(readPage);
  const deck = useRef<DeckHandle>(null);

  useEffect(() => {
    const onHash = () => setPage(readPage());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const openPage = useCallback((p: Page) => {
    if (p === 'home') {
      if (readPage() !== 'home') history.back();
    } else window.location.hash = p;
  }, []);

  // Changing decks or filters rebuilds the pile right away from everything not yet sorted.
  const mixKey = `${decks.join(',')}|${genders.m}${genders.f}${genders.u}|${letters}|${order}`;
  const builtFor = useRef(mixKey);
  useEffect(() => {
    if (builtFor.current === mixKey) return;
    builtFor.current = mixKey;
    setQueue(buildQueue(c, getState()));
  }, [mixKey, c]);

  // After "start over" the decisions are empty again, so refill the deck.
  const historyEmpty = state.history.length === 0 && Object.keys(state.decisions).length === 0;
  useEffect(() => {
    if (historyEmpty) setQueue(buildQueue(c, getState()));
  }, [historyEmpty, c]);

  // A name decided outside the deck (list, history, name sheet) leaves the pile. Only the names whose
  // decision changed are checked, so a normal swipe (already removed) costs next to nothing.
  const prevDecisions = useRef(state.decisions);
  useEffect(() => {
    const prev = prevDecisions.current;
    prevDecisions.current = state.decisions;
    const changed = Object.keys(state.decisions).filter((n) => prev[n] !== state.decisions[n]);
    if (!changed.length) return;
    setQueue((q) => (changed.some((n) => q.includes(n)) ? q.filter((n) => !state.decisions[n]) : q));
  }, [state.decisions]);

  // Opened from a partner's link: offer to compare, then tidy the URL.
  useEffect(() => {
    if (incoming) history.replaceState(null, '', window.location.pathname + window.location.search);
  }, [incoming]);

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

  const onListDecide = useCallback(
    (name: string, keep: boolean) => {
      onSwipe(name, keep ? 'right' : 'left');
    },
    [onSwipe],
  );

  const onUndo = useCallback(() => {
    const item = undo();
    if (!item) return;
    setQueue((q) => [item.name, ...q.filter((n) => n !== item.name)]);
    setReturning({ name: item.name, dir: ACTION_DIR[item.action], key: Date.now() });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (panel || openName || page !== 'home' || !getState().tutorialDone || mode !== 'swipe') return;
      if ((e.target as HTMLElement).closest('input, select, textarea')) return;
      if (e.key === 'ArrowRight') deck.current?.swipe('right');
      else if (e.key === 'ArrowLeft') deck.current?.swipe('left');
      else if (e.key === 'ArrowUp') {
        e.preventDefault();
        deck.current?.swipe('up');
      } else if (e.key === 'Backspace' || (e.key === 'z' && (e.metaKey || e.ctrlKey))) onUndo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel, openName, page, mode, onUndo]);

  const mix = useMemo(() => mixSet(c, getState()), [c, mixKey, state.partner]); // eslint-disable-line react-hooks/exhaustive-deps
  const progress = useMemo(() => mixProgress(c, state, mix), [c, state.decisions, mix]); // eslint-disable-line react-hooks/exhaustive-deps
  const boxCount = Object.keys(state.entries[state.activeBox] ?? {}).length;
  const close = useCallback(() => setPanel(null), []);
  const closeName = useCallback(() => setOpenName(null), []);

  return (
    <div className={`app theme-${theme}`}>
      {page === 'home' ? (
        <>
          <header className="topbar">
            <div className="topbar-side">
              <button className="icon-btn icon-btn--accent" onClick={() => setPanel('decks')}>
                <GlobeIcon size={22} />
                <span>Names</span>
              </button>
              <button className="icon-btn" onClick={() => setPanel('settings')}>
                <GearIcon size={22} />
                <span>Settings</span>
              </button>
            </div>
            <div className="brand">
              <span className="brand-name">{APP_NAME}</span>
              <span className="counter">
                {progress.sorted.toLocaleString()} / {progress.total.toLocaleString()}
              </span>
            </div>
            <div className="topbar-side topbar-side--right">
              <button className="icon-btn" onClick={() => setMode(mode === 'swipe' ? 'list' : 'swipe')}>
                {mode === 'swipe' ? <ListIcon size={22} /> : <CardsIcon size={22} />}
                <span>{mode === 'swipe' ? 'List' : 'Cards'}</span>
              </button>
              <button className="icon-btn" onClick={() => setPanel('history')}>
                <ClockIcon size={22} />
                <span>History</span>
              </button>
            </div>
          </header>

          {state.saveFailed && <div className="save-warning">⚠️ Not saving: your browser is blocking storage</div>}

          <main className={`stage stage--${mode}`}>
            {mode === 'swipe' ? (
              <Deck ref={deck} queue={queue} onSwipe={onSwipe} returning={returning} lastName={lastName.trim()} />
            ) : (
              <ListView queue={queue} onDecide={onListDecide} onOpenName={setOpenName} />
            )}
          </main>

          <nav className="controls">
            <button className="ctl ctl--sm" onClick={onUndo} disabled={!state.history.length} aria-label="Undo last swipe">
              <UndoIcon size={20} />
            </button>
            {mode === 'swipe' && (
              <>
                <button className="ctl ctl--lg ctl--nope" onClick={() => deck.current?.swipe('left')} disabled={!queue.length} aria-label="Pass">
                  <XIcon size={30} />
                </button>
                <button className="ctl ctl--md ctl--maybe" onClick={() => deck.current?.swipe('up')} disabled={!queue.length} aria-label="Not sure">
                  <MaybeIcon size={24} />
                </button>
                <button className="ctl ctl--lg ctl--like" onClick={() => deck.current?.swipe('right')} disabled={!queue.length} aria-label="Keep">
                  <HeartIcon size={30} />
                </button>
              </>
            )}
            <button className="ctl ctl--sm ctl--box" onClick={() => openPage('box')} aria-label={`My names, ${boxCount}`}>
              <BoxIcon size={20} />
              {boxCount > 0 && (
                <span className="badge" key={bump}>
                  {boxCount}
                </span>
              )}
            </button>
          </nav>
        </>
      ) : (
        <div className="page">
          <header className="page-head">
            <button className="icon-btn page-back" onClick={() => openPage('home')} aria-label="Back">
              <BackIcon size={24} />
            </button>
            <h1>{page === 'box' ? 'My names' : state.partner ? `You & ${state.partner.name || 'your partner'}` : 'Compare with your partner'}</h1>
          </header>
          <div className="page-body">
            {page === 'box' ? (
              <BoxPanel state={state} onOpenName={setOpenName} onCompare={() => openPage('compare')} />
            ) : (
              <ComparePanel
                state={state}
                onOpenName={setOpenName}
                onSwipePartner={() => {
                  if (!decks.includes('partner')) updateSettings({ decks: [...decks, 'partner'] });
                  setMode('swipe');
                  history.replaceState(null, '', window.location.pathname + window.location.search);
                  setPage('home');
                }}
              />
            )}
          </div>
        </div>
      )}

      <Sheet open={panel === 'decks'} onClose={close} title="Choose your names">
        <DeckPicker state={state} />
      </Sheet>
      <Sheet open={panel === 'history'} onClose={close} title={`History · ${state.history.length}`}>
        <HistoryPanel state={state} onOpenName={setOpenName} />
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
      <Sheet open={openName !== null} onClose={closeName} title="" level={2}>
        {openName && <NameActions state={state} name={openName} onPick={setOpenName} />}
      </Sheet>
      <Sheet open={incoming !== null} onClose={() => setIncoming(null)} title="💞 A list for you" level={3}>
        {incoming && (
          <div className="incoming">
            <p>
              <b>{incoming.name || 'Your partner'}</b> shared their {incoming.picks.length} favorite name{incoming.picks.length === 1 ? '' : 's'}. Compare them
              with yours to see where you match.
            </p>
            {state.partner && state.partner.name !== incoming.name && (
              <p className="panel-note">This replaces the list from {state.partner.name || 'your partner'} you saved before.</p>
            )}
            <button
              className="primary-btn"
              onClick={() => {
                setPartner(incoming);
                setIncoming(null);
                openPage('compare');
              }}
            >
              Compare our names
            </button>
          </div>
        )}
      </Sheet>

      {!state.tutorialDone && <Tutorial onDone={() => setTutorialDone(true)} />}
    </div>
  );
}
