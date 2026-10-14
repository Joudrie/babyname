// Ads. For now these are "house ads" we control (our own projects). When a real ad network is
// added, it plugs into AdBanner / AdCardFace and the cookie notice in the privacy policy applies.

export interface HouseAd {
  id: string;
  title: string;
  body: string;
  cta: string;
  url: string;
}

export const HOUSE_ADS: HouseAd[] = [
  {
    id: 'globalio',
    title: 'Globalio',
    body: 'Another project from the same small team. Take a look.',
    cta: 'Visit globalio.app',
    url: 'https://globalio.app',
  },
];

/** One sponsored card after this many swipes. */
export const AD_EVERY = 50;
/** Stands in for a name in the deck; swiping it away in any direction just dismisses it. */
export const AD_TOKEN = '__ad__';

const pick = () => HOUSE_ADS[Math.floor(Math.random() * HOUSE_ADS.length)];

export function AdCardFace() {
  const ad = HOUSE_ADS[0] ?? pick();
  return (
    <div className="face face--front ad-face">
      <div className="card-tag">Sponsored</div>
      <div className="ad-title">{ad.title}</div>
      <p className="ad-body">{ad.body}</p>
      <a className="ad-cta" href={ad.url} target="_blank" rel="noopener sponsored">
        {ad.cta}
      </a>
      <div className="card-hint">swipe either way to keep going</div>
    </div>
  );
}

export function AdBanner() {
  const ad = HOUSE_ADS[0];
  if (!ad) return null;
  return (
    <a className="ad-banner" href={ad.url} target="_blank" rel="noopener sponsored">
      <span className="ad-label">Ad</span>
      <span className="ad-banner-text">
        <b>{ad.title}</b> {ad.cta.replace(/^Visit /, '')}
      </span>
    </a>
  );
}
