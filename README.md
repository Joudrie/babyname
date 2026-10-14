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
- `src/data/names.ts`: starter list (~550 names) until the real dataset is imported.
- `src/config.ts`: the app name, so a rename is one line.

See `ROADMAP.md` for what's next.
