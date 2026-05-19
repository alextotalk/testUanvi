# VibeSummarizer Pro

AI-Integrated Summary Dashboard — Phase 01 build challenge for the Uanvi
Vibe Coding / AI Developer position.

Live test assessment: <https://code-test.uanvi.com/>

## What it does

Paste raw user feedback into the textarea, hit **Summarize**, and the
service returns a one-line summary plus a sentiment tag (`positive`,
`neutral`, `negative`). Submissions accumulate in an in-memory,
server-side history that persists for the lifetime of the Node.js process
and is hydrated into the UI on page load.

## Stack

- **Next.js 16** (App Router) — both the React frontend and the Node.js
  API endpoint live in the same project.
- **React 19** + **Tailwind CSS** for the UI.
- **Vitest** + **Testing Library** for unit, component and API integration
  tests (24 tests across 4 files).
- **TypeScript** strict mode.

## Project layout

```
app/
  page.tsx               UI: textarea, button, loading state, history list
  page.test.tsx          Component tests for the page
  api/summarize/
    route.ts             POST + GET API endpoints with error handling
    route.test.ts        API integration tests
lib/
  summarizer.ts          Mock AI service: first-sentence + sentiment + 1.5s delay
  summarizer.test.ts     Unit tests for the summary logic
  history.ts             In-memory server-side history store
  history.test.ts        Unit tests for the store
  types.ts               Shared types
```

## Mock AI behaviour

`runMockSummarizer(text)` simulates a 1.5 s upstream call (per the spec)
and returns:

- `summary` — first sentence of the input, capitalised. Falls back to the
  trimmed input when there is no sentence terminator.
- `sentiment` — keyword-based heuristic over positive/negative lexicons.

The pure, synchronous `summarizeText` is exported separately so unit tests
can exercise the logic without waiting on timers.

## API

`POST /api/summarize` — body `{ "text": string }`

- `201` → `{ entry, history }`
- `400` → malformed JSON, missing `text`, or empty `text`
- `413` → input longer than 10 000 characters
- `500` → summarizer threw

`GET /api/summarize` — `200` → `{ history }`

## Running locally

```bash
npm install
npm run dev         # http://localhost:3000
npm test            # vitest run — 24 tests
npm run typecheck   # tsc --noEmit
npm run lint        # eslint .
npm run build       # production build
```
