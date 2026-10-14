import { useState } from 'react';
import { BoxIcon, ClockIcon, GlobeIcon, HeartIcon, MaybeIcon, UndoIcon, XIcon } from './icons';
import { APP_NAME } from '../config';

export function Tutorial({ onDone }: { onDone(): void }) {
  const [step, setStep] = useState(0);
  const last = step === 1;

  return (
    <div className="tutorial" role="dialog" aria-modal="true">
      <div className="tutorial-card" key={step}>
        {step === 0 ? (
          <>
            <div className="tutorial-emoji">🍼</div>
            <h2>Welcome to {APP_NAME}</h2>
            <p>There are a lot of names out there. Let's find yours, one card at a time.</p>
            <ul className="gesture-list">
              <li>
                <span className="gesture gesture--like">
                  <HeartIcon size={18} />
                </span>
                <span>Swipe <b>right</b> to keep a name</span>
              </li>
              <li>
                <span className="gesture gesture--nope">
                  <XIcon size={18} />
                </span>
                <span>Swipe <b>left</b> to pass</span>
              </li>
              <li>
                <span className="gesture gesture--maybe">
                  <MaybeIcon size={18} />
                </span>
                <span>Swipe <b>up</b> if you're not sure. It'll come back later</span>
              </li>
            </ul>
            <p className="tutorial-small">Tap a card to flip it and see what the name means. Rather tap than swipe? The buttons under the card work too.</p>
          </>
        ) : (
          <>
            <div className="tutorial-emoji">📦</div>
            <h2>Your keepers &amp; your decks</h2>
            <ul className="gesture-list">
              <li>
                <span className="gesture">
                  <BoxIcon size={18} />
                </span>
                <span>Tap the box in the corner to see your names</span>
              </li>
              <li>
                <span className="gesture">
                  <UndoIcon size={18} />
                </span>
                <span>Swiped too fast? Undo takes it back</span>
              </li>
              <li>
                <span className="gesture">
                  <GlobeIcon size={18} />
                </span>
                <span>
                  We start you on American &amp; Western European names. Tap the globe anytime for other countries, eras,
                  fiction, or names starting with a letter
                </span>
              </li>
              <li>
                <span className="gesture">
                  <ClockIcon size={18} />
                </span>
                <span>History shows every name you've swiped</span>
              </li>
            </ul>
            <p className="tutorial-small">Everything saves on this device as you go.</p>
          </>
        )}
        <div className="tutorial-foot">
          <div className="dots">
            <span className={step === 0 ? 'is-on' : ''} />
            <span className={step === 1 ? 'is-on' : ''} />
          </div>
          <button className="primary-btn" onClick={() => (last ? onDone() : setStep(1))}>
            {last ? 'Start swiping' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
