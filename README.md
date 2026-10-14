# Cradle (working name)

A calm, swipe-to-sort baby name finder. Swipe right to keep a name, left to pass, up if you're not sure.

## Run it

```sh
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
```

## How it's put together

- `src/components/Deck.tsx`: the swipe engine. Drag frames write transforms straight to the DOM (no React render per frame), and released cards fly out on the compositor via the Web Animations API, so the next card is usable immediately.
- `src/store.ts`: all state (decisions, history, settings) with batched saves to the browser's localStorage. If storage is blocked the app says so.
- `src/data/catalog.ts`: loads the generated name data and defines the decks.
- `src/queue.ts`: turns the chosen decks and filters into the pile of cards.
- `src/share.ts`: partner compare. A box is packed into the link's `#hash`, so there are no accounts and no server.
- `public/sw.js`: caches the app and data so it opens instantly and works offline.

## Name data

`public/data/` is generated, not hand-edited:

```sh
python3 scripts/build-data.py <dir with us-name-data.sqlite and us-name-details.sqlite> [intl dir]
```

- US Social Security names 1880–2024, plus per-name origin, meaning and pronunciation, from the
  MIT-licensed [`usbabynames`](https://www.npmjs.com/package/usbabynames) package (`npm pack usbabynames`, then unzip
  its `sqlite/*.zip`). The meanings in that package are a guide, not gospel.
- Optional `intl` dir with official statistics: `ons.xlsx` (England & Wales, ONS), `VSA50.csv`/`VSA60.csv`
  (Ireland, CSO), `nat2021.csv` (France, INSEE), `ine_fecha.xls` (Spain, INE), `ssb.json` (Norway, SSB table 10467).
- `python3 scripts/fetch-wiktionary.py <intl dir>/wiktionary.json` adds names from Wiktionary (CC BY-SA, via kaikki.org) for
  languages the US data covers thinly (Yoruba, Turkish, Hindi...). Scotland's lists go in the intl dir as `nrs_<year>.xlsx`.
- Variants come from the name notes; the fiction deck is the hand-picked list in `scripts/fiction.py`.
- `src/config.ts`: the app name, so a rename is one line.

See `ROADMAP.md` for what's next.
