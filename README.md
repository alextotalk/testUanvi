# VibeSummarizer Pro

AI-Integrated Summary Dashboard — Phase 01 build challenge for the Uanvi
Vibe Coding / AI Developer position.

**Repository:** <https://github.com/alextotalk/testUanvi>
**Test assessment platform:** <https://code-test.uanvi.com/>

## What it does

Paste raw user feedback into the textarea, hit **Summarize**, and the
service returns a one-line summary plus a sentiment tag (`positive`,
`neutral`, `negative`). Submissions accumulate in an in-memory,
server-side history that persists for the lifetime of the Node.js
process and is hydrated into the UI on page load.

## Tech stack

- **Next.js 16** (App Router) — both the React frontend and the Node.js
  API endpoint live in the same project.
- **React 19** + **Tailwind CSS 3** for the UI.
- **Vitest 2** + **Testing Library** for unit, component, and API
  integration tests (24 tests across 4 files).
- **TypeScript** strict mode.
- **Node.js 22+** runtime.

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

## Run locally

Prerequisites: **Node.js 22+** and **npm 10+**.

```bash
# 1. Clone the repository
git clone https://github.com/alextotalk/testUanvi.git
cd testUanvi

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
#    → http://localhost:3000
```

### Other useful commands

```bash
npm test            # vitest run — runs all 24 tests
npm run test:watch  # vitest in watch mode
npm run typecheck   # tsc --noEmit
npm run lint        # eslint .
npm run build       # production build
npm run start       # serve the production build
```

### Quick API smoke test

```bash
# POST a feedback string
curl -X POST http://localhost:3000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{"text":"The new dashboard is amazing! It loads instantly."}'

# Read accumulated history
curl http://localhost:3000/api/summarize
```

## Mock AI behaviour

`runMockSummarizer(text)` simulates a 1.5 s upstream call (per the spec)
and returns:

- `summary` — first sentence of the input, capitalised. Falls back to
  the trimmed input when there is no sentence terminator.
- `sentiment` — keyword-based heuristic over positive/negative lexicons.

The pure, synchronous `summarizeText` is exported separately so unit
tests can exercise the logic without waiting on timers.

## API reference

`POST /api/summarize` — body `{ "text": string }`

- `201` → `{ entry, history }`
- `400` → malformed JSON, missing `text`, or empty `text`
- `413` → input longer than 10 000 characters
- `500` → summarizer threw

`GET /api/summarize` — `200` → `{ history }`

---

## Requirements audit

A line-by-line verification against the Phase 01 brief. Every
requirement and acceptance criterion is met.

### Requirement 1. Frontend (React/Next.js + textarea + Summarize button)

**Verification plan:** locate a textarea and a button labelled
"Summarize" in the page component.

**Files:** `app/page.tsx`, `app/layout.tsx`, `app/globals.css`

- `app/page.tsx:88-95` — `<textarea id="feedback">` bound to controlled
  `text` state.
- `app/page.tsx:103-112` — `<button type="submit">` showing
  "Summarize" / "Summarizing…".
- Tailwind wired through `globals.css` → `app/layout.tsx`.
- Page `/` renders with HTTP 200 (confirmed in dev-server logs).

**Status:** done.

### Requirement 2. Backend (Node.js endpoint, text → JSON summary + sentiment)

**Verification plan:** find a Node.js API route that accepts text and
returns JSON with `summary` and `sentiment`.

**File:** `app/api/summarize/route.ts`

- `export const runtime = "nodejs"` — explicit Node.js runtime.
- `POST` accepts `{ text }` and returns
  `{ entry: { id, originalText, summary, sentiment, createdAt }, history }`.
- Live curl call returns
  `{"summary":"The new dashboard is amazing","sentiment":"positive",...}`.

**Status:** done.

### Requirement 3. Mock Integration (1.5 s delay + first sentence + capitalize)

**Verification plan:** confirm the service layer is decoupled from the
API, waits 1500 ms, slices the first sentence, and capitalises it.

**File:** `lib/summarizer.ts`

- `MOCK_AI_DELAY_MS = 1500`.
- `runMockSummarizer` awaits `setTimeout(1500)` before calling the
  synchronous `summarizeText`.
- `extractFirstSentence` splits on `/[.!?]+/` and trims.
- `capitalize` → `value.charAt(0).toUpperCase() + value.slice(1)`.
- Real timing measured via curl: **`real 0m1,533s`** — exactly 1.5 s.

**Status:** done.

### Requirement 4. State Management (in-memory server-side history)

**Verification plan:** history is held server-side in process memory
and survives between requests.

**File:** `lib/history.ts`

- `const store: { entries: HistoryEntry[] } = { entries: [] }` —
  module-level state, lives for the lifetime of the Node.js process.
- `addHistoryEntry` inserts at the head and caps the list at 50.
- `getHistory` returns a defensive copy (covered by
  `lib/history.test.ts`).
- Confirmed at runtime: three sequential POSTs accumulated; the
  follow-up GET returned all three entries in newest-first order.

**Status:** done.

### Requirement 5. Testing (≥1 unit test for summary logic + ≥1 component test for button click)

**Verification plan:** at least one unit test on the summary logic,
plus at least one component test that exercises the button click.

**Files:** `lib/summarizer.test.ts`, `app/page.test.tsx`

- Unit: `summarizeText > returns the capitalized first sentence and a sentiment tag`
  (plus 10 more unit cases covering `extractFirstSentence`,
  `capitalize`, `detectSentiment`).
- Component: `<HomePage /> > submits the textarea contents to /api/summarize on button click` —
  drives `userEvent.click` and asserts the outgoing `fetch` call and
  request body.

**Status:** done (well beyond the minimum).

### Tech stack

| Required          | Implemented        |
|-------------------|--------------------|
| React / Next.js   | Next.js `^16.2.6` + React `^19.2.6` |
| Node.js           | v22.22.3           |
| Tailwind CSS      | `^3.4.16`          |
| Vitest / Jest     | Vitest `^2.1.8`    |

---

## Acceptance criteria

### A. Fully functional with no console or runtime errors during common usage

- `npm run build` → succeeded.
- Dev-server logs show only HTTP `200 / 201 / 400` lines — no warnings,
  no errors.
- 24/24 tests green (including DOM-render tests through jsdom — any
  React warning would surface there).
- Manual eight-step smoke run via curl: all expected statuses.

**Status:** met.

### B. ≥ 3 automated integration tests covering the summarisation flow

`app/api/summarize/route.test.ts` — **5 integration tests:**

1. `POST returns 201, a structured entry, and updated history for valid input` — summarisation happy path.
2. `POST returns 400 when the text field is missing or empty`.
3. `POST returns 400 for malformed JSON bodies`.
4. `POST returns 500 when the summarizer throws`.
5. `GET returns the in-memory history accumulated across POSTs`.

Plus 5 UI-level integration tests in `app/page.test.tsx` (render +
mocked fetch + interaction).

**Status:** met (5 ≥ 3).

### C. Backend handles errors gracefully with appropriate HTTP status codes

Every error branch verified with a live request:

- `400` malformed JSON → `"Request body must be valid JSON."`
- `400` missing `text` field → `"Field 'text' is required and must be a string."`
- `400` empty `text` → `"Field 'text' must not be empty."`
- `413` for input longer than 10 000 characters (payload-size guard).
- `500` when the summarizer throws → logged as `Summarization failed`.
- `201 Created` on success, `200 OK` for GET.

**Status:** met.

### D. UI shows a loading state and a clear history of previous summaries

- Loading: button switches to `Summarizing…` with a spinner; both the
  button and the textarea become `disabled` (`app/page.tsx:103-112`).
- Covered by the test
  `shows the loading state while the request is in-flight, then renders the new history entry`.
- History: `<section aria-label="history">` lists sentiment badges,
  summary, snippet of the original text, and a timestamp
  (`app/page.tsx:121-160`).
- History hydrates from `GET /api/summarize` on mount
  (`app/page.tsx:17-31`), covered by the test
  `hydrates the history list from GET /api/summarize on mount`.

**Status:** met.

---

## Audit summary

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Frontend: React/Next.js + textarea + Summarize button | ✅ |
| 2 | Backend: Node.js endpoint, text → JSON summary + sentiment | ✅ |
| 3 | Mock service: 1.5 s delay + first sentence + capitalize | ✅ |
| 4 | In-memory server-side history persisting during session | ✅ |
| 5 | ≥ 1 unit test (summary logic) + ≥ 1 component test (button click) | ✅ |
| Tech | React/Next.js + Node.js + Tailwind + Vitest | ✅ |
| A | Fully functional, no console / runtime errors | ✅ |
| B | ≥ 3 integration tests covering summarisation flow | ✅ (5) |
| C | Backend graceful errors + correct HTTP codes | ✅ (400 / 413 / 500 / 201 / 200) |
| D | UI loading state + history of previous summaries | ✅ |

No requirement was skipped.
