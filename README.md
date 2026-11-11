# Moss Builder

A chat-driven page builder: you describe your business, and a Moss agent builds the landing page live, section by section. You then shape it in plain words ("make the headline punchier", "add a Booking page", "map the booking flow").

- `moss-builder.html` is the whole front end (inline CSS and JS, one embedded font, no external assets).
- `api/agent.js` is a Vercel function that calls **Moss Inference** (`https://inference.moss.dev/v1/chat/completions`, OpenAI-compatible).

## How it works

1. The page sends your message, the current page structure and the last few chat turns to `POST /api/agent`.
2. The function asks the model for a JSON reply: a short message plus a list of page ops (`addPage`, `addSection`, `updateSection`, `setOrder`, `deleteSection`, `setPalette`, `addLink`, `addFlow`, …). The full contract is the system prompt in `api/agent.js`.
3. The browser cleans every op before applying it. Ids are checked against the real page, links can only point to internal `#/page` routes, and section data is merged over safe defaults and must render. Then the ops are animated onto the page.

The key never reaches the browser. Undo is handled locally. If the endpoint fails, or the file is opened straight from disk, the builder falls back to the built-in scripted demo agent and says so in the chat. You can force that mode with `?offline`.

## Voice

Building is voice-first. Tap the mic (or hold **Space** anywhere outside a text box), describe the business or the change, and pause. What you say appears in the chat box as you speak and sends on its own. Moss reads its reply aloud, with a quick "On it" when a turn is slow. Starting to talk cuts the speech off, and mute silences it. Typed messages get no spoken reply.

- **Deepgram (preferred):** when `DEEPGRAM_API_KEY` is set in Vercel, listening uses Deepgram's live transcription (`nova-3`) and Moss speaks with an Aura voice. The mic is opened with echo cancellation and Moss's audio plays inside the page, so laptop speakers work without Moss interrupting itself. `api/voice-token.js` mints a ~30-second token for the browser's live connection (the key never leaves the server; the key needs the **Member** role or higher in Deepgram to mint tokens, otherwise listening falls back to the browser while Moss still speaks with Aura); `api/speak.js` returns MP3 for each sentence. Both refuse requests from other sites.
- **Browser fallback:** without a Deepgram key, speech uses the browser's built-in recognition and synthesis (Chrome, Edge and Safari; the mic hides in Firefox). Chrome and Edge send audio to Google's speech service, and Safari uses Apple's. Only the text goes to Moss. Add `?browservoice` to the URL to force this mode.
- Spoken page references such as "at home" or "on the booking page" become `@Home` and `@Booking`.
- Everything sits behind the `voice` module (`start`, `stop`, `speak`, `cancelSpeech`) in `moss-builder.html`, so a hosted or Moss speech service can replace it without touching the rest.

## Redesign mocks

Say or type "mock up joesplumbing.com" (or "redesign joes plumbing dot com"). `api/scrape.js` reads that one public page and returns the facts: name, headings, services, phone, email, hours, prices, real reviews and the brand colour. Moss then rebuilds the page from those facts without inventing reviews or prices, and returns three looks. Look A keeps the brand colour.

The frame bar shows an **A / B / C** switcher. Saying "B" or "show me C" re-skins the same sections, and "go with B" (or **Keep**) locks a look in. Switching never calls the model.

The scraper fetches only http(s) on ports 80 and 443. Every DNS answer is checked inside the socket's own lookup, so private, loopback, link-local and cloud-metadata addresses are refused, including after redirects. It times out after 8 s, caps pages at 1.5 MB, accepts HTML only and follows at most 3 redirects. Results are cached on Vercel's CDN for an hour.

## Motion and refine controls

- **Motion:** each design has a motion level: `none`, `calm` or `lively`. The hero headline is revealed word by word, sections rise in as you scroll, and the art drifts slowly. Say "make it lively", "add some animation", "no animations" or "replay the animation". Reduced-motion settings turn all of it off.
- **Buttons and nav:** for example "outline buttons", "bigger buttons", "glow on hover", "floating nav", "sticky nav". Buttons can be solid, outline, soft or ghost; small, medium or large; with lift, glow, fill or underline on hover. The nav can be a bar, floating, minimal or centred.
- **Swatches:** "save this colour as Ocean", then "use ocean for the buttons" or "ocean background on the pricing".
- **One section:** click a section for its toolbar (dark, accent or plain fill; roomy or tight spacing; round or square corners; centred; photo), or say "dark background on the FAQ".
- **Photos:** hover any art slot and choose **Add photo**, drop an image onto a section, or say "add a photo to the hero". Images are resized in the browser and never sent to Moss.
- **Style drawer:** the **Style** button in the frame bar holds every control. Each control runs the same phrase you could say, so it shows in the chat and can be undone.

All of these run in the browser and cost no tokens.

## Costs and a public link

**Moss tokens:**
- Instant commands run locally and never call the model: undo, views, pages, motion, buttons, nav, swatches, section style, photos and mock switching.
- The design library is sent only when a look can change: planning, building, mocks, or a style request.
- Replies are capped per phase (`max_tokens`: 350 for interview questions, up to 2,500 for a full build).
- History is cut to 6 turns, and state is compacted.

**Deepgram listening** is billed per minute of streamed audio. The mic streams raw 16 kHz PCM from an AudioWorklet and sends audio only while someone is talking, with 400 ms of pre-roll and 1.5 s of tail. Silence sends a KeepAlive instead. A forgotten hot mic turns itself off after 2 quiet minutes.

**Deepgram speech** is billed per character. Only Moss's short spoken replies are synthesised, and repeated sentences are cached in the page.

**Abuse guards** (`api/_guard.js`):
- Every function refuses other sites.
- Each IP is rate-limited per function instance: 40 agent turns, 240 spoken sentences, 60 tokens and 10 scrapes per 10 minutes.
- For a hard cap, add a Vercel Firewall rate-limit rule on `/api/*`.

**Public link:**
- Merging to `main` gives a production URL that is public under Vercel's default Standard Protection.
- To make preview links public as well, go to **Settings → Deployment Protection** and turn Vercel Authentication off.

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
   | `DEEPGRAM_API_KEY` | Deepgram key for voice (optional; without it the browser's speech is used) |
   | `DEEPGRAM_VOICE` | optional, default `aura-2-thalia-en` |
   | `DEEPGRAM_STT_MODEL` | optional, default `nova-3` |

   The function calls `POST <base>/chat/completions` with `Authorization: Bearer <project id>:<project key>`.

3. Deploy. `/` serves the builder (see `vercel.json`) and `/api/agent` runs the function.

**Run locally:** run `vercel dev` with the variables in `.env.local`.

## Tests

```bash
npm test
```

- `tests/agent-api.mjs`: the agent function against a mock OpenAI-compatible server (request shape, JSON mode, retry, errors, token budgets, when the library is sent), the guards (other sites, rate limits), the Deepgram functions, and the scraper (private-address refusal, spoken domains, redirects, size and type limits, extraction).
- `tests/remote.cjs`: the builder served over http against a mock `/api/agent` returning imperfect model output (cleaning, rendering, flow layout, fallback).
- `tests/voice-deepgram.cjs`: the Deepgram path with fakes for the mic, the live socket and audio (token use, quick end of turn, Aura playback, barge-in, reconnect, fallbacks).
- `tests/voice.cjs`: the voice loop with a fake recognizer and synthesizer (speak to build, spoken replies, hold Space, spoken @mentions, barge-in, mute, unsupported browsers).
- `tests/mocks.cjs`: "mock up a site" against mock scrape and agent endpoints (scraped facts, three looks, A/B/C switching with no model calls, "go with B", undo, unreadable sites, offline mocks that invent nothing).
- `tests/style.cjs`: motion (levels, word reveal, scroll-in, reduced motion), buttons, nav, swatches, section style, the Style drawer, the section toolbar, photo upload (never sent to Moss), undo and the phone layout.
- `tests/functional.cjs`: the original end-to-end checks (build, edit, reorder, restyle, delete, undo, pages, @mentions, flow drag, theme, sound, 375px mobile), using the offline agent.

Playwright and Chromium must be available for the browser tests.
