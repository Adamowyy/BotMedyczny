# Contributing

Two things come up most often: a new UI language and a change to the prompt.
Both are edits in one file.

## Run from source

```bash
npm install
npm run dev      # Express on :3000, Vite on :5173
npm test
npm run build
```

## Adding a language

1. Add the code to `LANGUAGES` in `src/i18n.mjs` and a table with the same keys
   as the English one. `npm test` fails on a missing key, so copy the English
   table and translate in place.
2. Add a system prompt for the code in `lib/system-prompt.js`. English is the
   fallback for anything missing.
3. Nothing else: the header switcher is rendered from `LANGUAGES`.

## Changing the prompt

The rules live in `lib/system-prompt.js`, one template per language. Keep the
numbered structure and the answer-language rule in step with the UI language.

## House style

- User-visible text lives in `src/i18n.mjs`, never inline in a component.
- One short comment line, only where the code is not obvious.
- No long dash in comments, docs or commit subjects.
- Single-line English commit subjects, like the existing history.

## A bug report needs

What you did, what you expected, what happened. Browser, and the message the UI
showed. Never paste an API key; revoke it in the DeepSeek dashboard if it leaked
into a screenshot.
