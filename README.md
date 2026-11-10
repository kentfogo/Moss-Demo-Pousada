# Moss Builder

A chat-driven page builder: you describe your business, and a Moss agent builds the landing page live, section by section. You then shape it in plain words ("make the headline punchier", "add a Booking page", "map the booking flow").

- `moss-builder.html` is the whole front end (inline CSS and JS, one embedded font, no external assets).
- `api/agent.js` is a Vercel function that calls **Moss inference** through its OpenAI-compatible chat completions API.

## How it works

1. The page sends your message, the current page structure and the last few chat turns to `POST /api/agent`.
2. The function asks the model for a JSON reply: a short message plus a list of page ops (`addPage`, `addSection`, `updateSection`, `setOrder`, `deleteSection`, `setPalette`, `addLink`, `addFlow`, …). The full contract is the system prompt in `api/agent.js`.
3. The browser cleans every op before applying it. Ids are checked against the real page, links can only point to internal `#/page` routes, and section data is merged over safe defaults and must render. Then the ops are animated onto the page.

The key never reaches the browser. Undo is handled locally. If the endpoint fails, or the file is opened straight from disk, the builder falls back to the built-in scripted demo agent and says so in the chat. You can force that mode with `?offline`.

## Deploy on Vercel

1. Import this repository in Vercel (framework preset: **Other**; no build command).
2. In **Project → Settings → Environment Variables**, add:

   | Name | Value |
   |---|---|
   | `MOSS_API_KEY` | your Moss inference key |
   | `MOSS_BASE_URL` | the OpenAI-compatible base URL, ending in `/v1` (the function appends `/chat/completions`) |
   | `MOSS_MODEL` | the model id to use |
   | `MOSS_TEMPERATURE` | optional, default `0.4` |

3. Deploy. `/` serves the builder (see `vercel.json`) and `/api/agent` runs the function.

If your local `.env` uses different variable names, either rename them to the ones above or set the values under these names in Vercel.

**Run locally:** run `vercel dev` with the variables in `.env.local`.

## Tests

```bash
npm test
```

- `tests/agent-api.mjs`: the function against a mock OpenAI-compatible server (request shape, JSON mode, retry without JSON mode, error handling).
- `tests/remote.cjs`: the builder served over http against a mock `/api/agent` returning imperfect model output (cleaning, rendering, flow layout, fallback).
- `tests/functional.cjs`: the original end-to-end checks (build, edit, reorder, restyle, delete, undo, pages, @mentions, flow drag, theme, sound, 375px mobile), using the offline agent.

Playwright and Chromium must be available for the browser tests.
