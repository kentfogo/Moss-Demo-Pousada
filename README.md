# Moss Builder

A chat-driven page builder: you describe your business, and a Moss agent builds the landing page live, section by section. You then shape it in plain words ("make the headline punchier", "add a Booking page", "map the booking flow").

- `moss-builder.html` is the whole front end (inline CSS and JS, one embedded font, no external assets).
- `api/agent.js` is a Vercel function that calls **Moss Inference** (`https://inference.moss.dev/v1/chat/completions`, OpenAI-compatible).

## How it works

1. The page sends your message, the current page structure and the last few chat turns to `POST /api/agent`.
2. The function asks the model for a JSON reply: a short message plus a list of page ops (`addPage`, `addSection`, `updateSection`, `setOrder`, `deleteSection`, `setPalette`, `addLink`, `addFlow`, …). The full contract is the system prompt in `api/agent.js`.
3. The browser cleans every op before applying it. Ids are checked against the real page, links can only point to internal `#/page` routes, and section data is merged over safe defaults and must render. Then the ops are animated onto the page.

The key never reaches the browser. Undo is handled locally. If the endpoint fails, or the file is opened straight from disk, the builder falls back to the built-in scripted demo agent and says so in the chat. You can force that mode with `?offline`.

## Deploy on Vercel

1. Import this repository in Vercel (framework preset: **Other**; no build command).
2. In **Project → Settings → Environment Variables**, set:

   | Name | Value |
   |---|---|
   | `MOSS_PROJECT_ID` | your Moss project id |
   | `MOSS_PROJECT_KEY` | your Moss project key (`MOSS_API_KEY` also works) |
   | `MOSS_MODEL` | optional, default `moss/fastlane-1` |
   | `MOSS_BASE_URL` | optional, default `https://inference.moss.dev/v1` |
   | `MOSS_TEMPERATURE` | optional, default `0.4` |

   The function calls `POST <base>/chat/completions` with `Authorization: Bearer <project id>:<project key>`.

3. Deploy. `/` serves the builder (see `vercel.json`) and `/api/agent` runs the function.

**Run locally:** run `vercel dev` with the variables in `.env.local`.

## Tests

```bash
npm test
```

- `tests/agent-api.mjs`: the function against a mock OpenAI-compatible server (request shape, JSON mode, retry without JSON mode, error handling).
- `tests/remote.cjs`: the builder served over http against a mock `/api/agent` returning imperfect model output (cleaning, rendering, flow layout, fallback).
- `tests/functional.cjs`: the original end-to-end checks (build, edit, reorder, restyle, delete, undo, pages, @mentions, flow drag, theme, sound, 375px mobile), using the offline agent.

Playwright and Chromium must be available for the browser tests.
