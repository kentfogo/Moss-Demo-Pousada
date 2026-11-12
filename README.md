# Moss Builder

A chat-driven page builder: you describe your business, and a Moss agent builds the landing page live, section by section. You then shape it in plain words ("make the headline punchier", "add a Booking page", "map the booking flow").

- `moss-builder.html` is the whole front end (inline CSS and JS, one embedded font, no external assets).
- `api/agent.js` calls **Moss Inference** (`https://inference.moss.dev/v1/chat/completions`, OpenAI-compatible). `server.mjs` serves the page and the `api/` handlers as one long-running Node process.

**Watch a replay** (no keys, no server): open `moss-builder.html?replay=pousada` from any static host, or the repository's GitHub Pages site. It replays a real recorded session with Moss at the speed it happened.

**Run it live:**

```bash
npm install
cp .env.example .env     # then put your Moss project id and key in .env
npm start                # http://localhost:3000
```

Without keys, the page still works with its offline demo agent.

## How it works

1. The page sends your message, the current page structure and the last few chat turns to `POST /api/agent`.
2. The function asks the model for a JSON reply: a short message plus a list of page ops (`addPage`, `addSection`, `updateSection`, `setOrder`, `deleteSection`, `setPalette`, `addLink`, `addFlow`, …). The full contract is the system prompt in `api/agent.js`.
3. The browser cleans every op before applying it. Ids are checked against the real page, links can only point to internal `#/page` routes, and section data is merged over safe defaults and must render. Then the ops are animated onto the page.

The key never reaches the browser. Undo is handled locally. If the endpoint fails, or the file is opened straight from disk, the builder falls back to the built-in scripted demo agent and says so in the chat. You can force that mode with `?offline`.

## Voice

Building is voice-first. Tap the mic (or hold **Space** anywhere outside a text box), describe the business or the change, and pause. What you say appears in the chat box as you speak and sends on its own. Moss reads its reply aloud, with a quick "On it" when a turn is slow. Starting to talk cuts the speech off, and mute silences it. Typed messages get no spoken reply.

- **Deepgram (preferred):** when `DEEPGRAM_API_KEY` is set on the server, listening uses Deepgram's live transcription (`nova-3`) and Moss speaks with an Aura voice. The mic is opened with echo cancellation and Moss's audio plays inside the page, so laptop speakers work without Moss interrupting itself. `api/voice-token.js` mints a ~30-second token for the browser's live connection (the key never leaves the server; the key needs the **Member** role or higher in Deepgram to mint tokens, otherwise listening falls back to the browser while Moss still speaks with Aura); `api/speak.js` returns MP3 for each sentence. Both refuse requests from other sites.
- **Browser fallback:** without a Deepgram key, speech uses the browser's built-in recognition and synthesis (Chrome, Edge and Safari; the mic hides in Firefox). Chrome and Edge send audio to Google's speech service, and Safari uses Apple's. Only the text goes to Moss. Add `?browservoice` to the URL to force this mode.
- Spoken page references such as "at home" or "on the booking page" become `@Home` and `@Booking`.
- Everything sits behind the `voice` module (`start`, `stop`, `speak`, `cancelSpeech`) in `moss-builder.html`, so a hosted or Moss speech service can replace it without touching the rest.

## Redesign mocks

Say or type "mock up joesplumbing.com" (or "redesign joes plumbing dot com"). `api/scrape.js` reads that one public page and returns the facts: name, headings, services, phone, email, hours, prices, real reviews and the brand colour. Moss then rebuilds the page from those facts without inventing reviews or prices, and returns three looks. Look A keeps the brand colour.

The frame bar shows an **A / B / C** switcher. Saying "B" or "show me C" re-skins the same sections, and "go with B" (or **Keep**) locks a look in. Switching never calls the model.

The scraper fetches only http(s) on ports 80 and 443. Every DNS answer is checked inside the socket's own lookup, so private, loopback, link-local and cloud-metadata addresses are refused, including after redirects. It times out after 8 s, caps pages at 1.5 MB, accepts HTML only and follows at most 3 redirects. Responses allow an hour of caching by a CDN in front.

## Motion and refine controls

- **Motion:** each design has a motion level: `none`, `calm` or `lively`. The hero headline is revealed word by word, sections rise in as you scroll, and the art drifts slowly. Say "make it lively", "add some animation", "no animations" or "replay the animation". Reduced-motion settings turn all of it off.
- **Buttons and nav:** for example "outline buttons", "bigger buttons", "glow on hover", "floating nav", "sticky nav". Buttons can be solid, outline, soft or ghost; small, medium or large; with lift, glow, fill or underline on hover. The nav can be a bar, floating, minimal or centred.
- **Swatches:** "save this colour as Ocean", then "use ocean for the buttons" or "ocean background on the pricing".
- **One section:** click a section for its toolbar (dark, accent or plain fill; roomy or tight spacing; round or square corners; centred; photo), or say "dark background on the FAQ".
- **Photos:** hover any art slot and choose **Add photo**, drop an image onto a section, or say "add a photo to the hero". Images are resized in the browser and never sent to Moss.
- **Style drawer:** the **Style** button in the frame bar holds every control. Each control runs the same phrase you could say, so it shows in the chat and can be undone.

All of these run in the browser and cost no tokens.

## Streaming and the latency waterfall

**Streaming.** `/api/agent` streams server-sent events when asked (`accept: text/event-stream`): `reply`, each `op`, the `span` timings, then `done`. An incremental JSON scanner (`api/_jsonScan.js`) releases the reply the moment its string closes, and each op the moment its object closes. The page speaks the reply right away and builds each op as it arrives, with one undo step per turn. If the stream breaks, what was built stays. If Moss doesn't stream, the same events come from one response.

**Latency panel.** Open it with the bars button in the top bar, or add `?debug`. Each turn is a waterfall, with bars coloured by group:

| Group | What it covers |
|---|---|
| Speech | From when you stopped talking to the send |
| Network | The request until the first byte |
| Retrieval | `router.query`, `knowledge.*`, `crawl.page`, `index.*` |
| Inference | `inference.request`, `inference.ttft`, `inference.total` |
| Build | One segment per op applied |
| Voice | First audio, labelled by engine |

Server spans are placed on the page's clock using the server time carried on every event. Below the waterfall: p50 and p95 over the last 20 turns, a Copy JSON button, and the Voice switch.

## Moss indexes

**1. Intent router.** The commands (`api/_intents.js`) and about 140 example paraphrases are a Moss index, built automatically on first use and renamed whenever the list changes. Each warm function loads it once and queries it before inference while you edit, in about 13 ms including embedding the query.
- **High score:** the page runs the command itself, with no LLM.
- **Middle score:** the likely commands go to Moss as hints.
- **Guards:** embeddings confuse opposites ("bigger" matched *Smaller buttons* at 0.94), so each command has `require` and `avoid` word patterns that veto contradictions. In the live evaluation (`data/router-eval.md`, re-run with `GET /api/router-eval`), the hybrid router had no wrong commands or misfires; semantic search alone had 3–5.
- **Cold starts:** a cold instance doesn't make a turn wait for the model and index (250 ms budget), and the page sends a warm-up ping when it opens.

**2. Site knowledge.** "Mock up joesplumbing.com" reads the home page plus up to 3 nav pages (services, about, contact, reviews, pricing or FAQ) in parallel within 8 s. It splits them into passages tagged by kind (service, hours, contact, review, price, about, FAQ), into one Moss index per site (`site-<host>`).
- A site read in the last 24 hours skips the crawl.
- At most about 50 site indexes are kept, oldest deleted first.
- The server is long-lived, so the index build finishes in the background and the first mock never waits for it (`KNOWLEDGE_WAIT=upload` waits for the upload instead).
- Mock builds and later edits retrieve only the relevant facts.
- When you ask for real facts that aren't on the site, Moss is told not to invent them.

## Voices: Aura and Kokoro

- **Aura (Deepgram)** is the default. `GET /api/speak?text=` streams the audio, so each sentence starts playing on its first bytes, the next ones preload, and the browser caches repeated lines.
- **Kokoro** (open source, Kokoro-82M through `kokoro-js`) runs in the visitor's browser in a Web Worker, with no server cost. It's opt-in: use the Voice switch in the Latency panel or `?voice=kokoro`. The first time it downloads the `q8` model (about 92 MB, then cached) for WASM; `?kokoro=webgpu` uses WebGPU with the larger fp32 model. If it fails, Aura (or the browser voice) takes over.
- **Browser** speech is the last fallback.

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
- For a hard cap, put a rate limit in front of `/api/*` at your host or proxy.

**Sharing it without paying for every visit:** send the replay link. It costs nothing to watch, and every delay in it is real. Keep the live server for people who clone the repository with their own Moss keys, or for invited demos.

## Replays: record and play back real sessions

- `?record` records a live session: what you type, and every `/api` response with its bytes and timing as it streamed. **● Save recording** downloads it.
- `node scripts/record.cjs <name> http://localhost:3000` drives a scripted session in a headless browser against a running server, and saves `replays/<name>.json`.
- `?replay=<name>` plays `replays/<name>.json` back at the recorded speed, with no server. The page runs exactly as it does live; only `fetch('/api/…')` is answered from the recording, chunk by chunk.
- Each recording says where it was made in `note`. `replays/pousada.json` was recorded with the server about 50 ms from Moss and the browser on the same machine as the server. A real visitor adds their own browser-to-server round trip.
- Every turn that reaches Moss gets a badge (bottom left): Moss's time to first token, and when the reply was on screen. Click it for the waterfall.
- `.github/workflows/pages.yml` publishes the page and the replays to GitHub Pages. The root URL opens the `pousada` replay.

## Speed: how a turn is made fast

- **Two calls per turn.** A tiny "talker" call writes the one-line spoken reply while the worker writes the page ops. The talker goes out 30 ms first: Moss batches concurrent requests, and a small one sent alongside a large one waits for the large prompt.
- **Parallel builds** (`api/_fanout.js`). For a first build or a new page, the worker plans the sections as short briefs and writers fill them in at the same time, each starting when its brief arrives. Ops still reach the page in order. A full build takes about 5 s instead of about 11 s.
- **Prompt cache.** Moss caches prompts in 800-token blocks. The system prompt is the same on every call and padded to end on a block, so all of it is cached and only the turn's own tail is read. Run `node scripts/cache-align.mjs` after editing the prompt or the design library.
- **Warm-up.** When the page opens, the server loads the router, opens the connection to Moss and primes the prompt cache.
- **Rate limits.** fastlane-1 allows a burst of 10 requests per project. 429 and 503 replies with `Retry-After` are retried once.
- **Voice to voice.** For voice turns the latency panel shows the time from the end of your speech (from the mic's level) to Moss's first sound, split into stages, and **Voice report** copies a summary. How to measure it: [docs/voice-measurement.md](docs/voice-measurement.md).
- **Page pacing.** A section's entrance plays in full when nothing waits behind it, and shortens when sections arrive together.

## Run and deploy

`npm start` runs `server.mjs`: one Node process serving the page and `/api/*`. It reads `.env`, and `PORT` (default 3000). It runs anywhere Node 22 or a container runs. For the lowest latency:

- **Keep one instance always on** (no scale-to-zero). A long-lived process keeps its connection to Moss open between turns (about 60 ms saved per turn), keeps the router's model and index in memory, and keeps Moss's prompt cache warm through the page's warm-up ping (about 290 ms saved on the first edit). See RETRO.md for the measurements.
- **Run it in the region closest to Moss** (Moss is served from Google Cloud).
- If `HTTPS_PROXY` is set, outgoing requests use it.

Settings (in `.env` or your host's secrets; see `.env.example`):

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
   | `ROUTER_HIGH` / `ROUTER_MID` | optional router cut-offs, default `0.65` / `0.5` (from `data/router-eval.md`) |
   | `MOSS_ROUTER` | optional, `off` disables the intent router |
   | `KNOWLEDGE_MIN` | optional relevance cut-off for site facts, default `0.25` |

   | `MOSS_PRIME` | optional, `off` skips priming Moss's prompt cache on the warm-up ping |
   | `MOSS_FANOUT` | optional, `off` builds pages in one serial stream instead of in parallel |
   | `MOSS_TALKER_LEAD_MS` | optional, default `30`: how much earlier the spoken reply's call goes out than the worker's |
   | `MOSS_CACHE_ALIGN` | optional, `off` drops the system prompt's cache padding (see `scripts/cache-align.mjs`) |
   | `MOSS_REPLY_CACHE` | optional, `off` sends `X-Moss-Cache: off` (for recordings and benchmarks) |
   | `MOSS_HTTP2` | optional, `off` uses HTTP/1.1 to Moss |
   | `MOSS_DEBUG` | optional, `connections` logs every new outgoing connection |
   | `PORT` | optional, default `3000` |

   The server calls `POST <base>/chat/completions` with `Authorization: Bearer <project id>:<project key>`.

## Tests

```bash
npm test
```

- `tests/replay.cjs`: a recorded session plays back from a plain static server (no `/api` requests reach the network), with the latency badge; a missing recording says so.

- `tests/agent-api.mjs`: the agent function against a mock OpenAI-compatible server (request shape, JSON mode, retry, errors, token budgets, when the library is sent), the guards (other sites, rate limits), the Deepgram functions, and the scraper (private-address refusal, spoken domains, redirects, size and type limits, extraction).
- `tests/remote.cjs`: the builder served over http against a mock `/api/agent` returning imperfect model output (cleaning, rendering, flow layout, fallback).
- `tests/voice-deepgram.cjs`: the Deepgram path with fakes for the mic, the live socket and audio (token use, quick end of turn, Aura playback, barge-in, reconnect, fallbacks).
- `tests/voice.cjs`: the voice loop with a fake recognizer and synthesizer (speak to build, spoken replies, hold Space, spoken @mentions, barge-in, mute, unsupported browsers).
- `tests/mocks.cjs`: "mock up a site" against mock scrape and agent endpoints (scraped facts, three looks, A/B/C switching with no model calls, "go with B", undo, unreadable sites, offline mocks that invent nothing).
- `tests/style.cjs`: motion (levels, word reveal, scroll-in, reduced motion), buttons, nav, swatches, section style, the Style drawer, the section toolbar, photo upload (never sent to Moss), undo and the phone layout.
- `tests/latency.cjs`: streaming turns against a fake SSE agent (the reply before the build finishes, ops one by one, one undo per turn, a broken stream, router hits that skip inference, an error falling back), the waterfall rows, clock alignment and p50/p95, streamed mocks, and Kokoro with a fake worker (progress, speaking, falling back, the Voice switch).
- `tests/functional.cjs`: the original end-to-end checks (build, edit, reorder, restyle, delete, undo, pages, @mentions, flow drag, theme, sound, 375px mobile), using the offline agent.

Playwright and Chromium must be available for the browser tests.
