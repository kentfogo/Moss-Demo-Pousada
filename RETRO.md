# Retro and handoff: Moss Builder latency work

For the next session. The work started on branch `claude/relaxed-fermat-rr1j2j` (PR kentfogo/Moss-Demo-Pousada#1) and continues on `claude/retro-md-continuation-y29ff4`, which holds everything. `npm test` runs 11 suites, all green.

## Pick up here (after the "replace Vercel" session, 2026-11-12)
**Decisions:** Vercel is gone. The app is one Node server (`npm start`, `server.mjs`). Sharing happens through a **replay link** (free to watch) plus a **public repository** people can clone and run with their own Moss keys. No hosted live server for now.

**Done this session:**
- **`server.mjs`:** serves the page and `api/*` with Vercel-style `req`/`res` helpers. It reads `.env`, uses a 60 s keep-alive to Moss, and honours `HTTPS_PROXY`. `vercel.json`, `.vercelignore` and `@vercel/functions` are removed. The knowledge index finishes in the background.
- **Warm-up ping:** primes Moss's prompt cache with the turns' exact system prompt (1 output token) and opens the connection. `MOSS_PRIME=off` disables it.
- **Router fix:** after a failed load it skips at once for 60 s. Before, every edit turn waited 250 ms and retried.
- **Record and replay:** `?record`, `?replay=<name>`, `scripts/record.cjs`, `replays/pousada.json`, `tests/replay.cjs`.
- **Latency badge** on every Moss turn ("Moss first token 44 ms · reply on screen in 59 ms"). Clicking it opens the waterfall.
- **GitHub Pages workflow** for the replay site (`.github/workflows/pages.yml`). The root redirects to `?replay=pousada`.
- **Environment:** the Moss SDK's model host `pub-3744a26a99de4bab8592b11025ee7942.r2.dev` was added to this cloud environment's allowed hosts. The router can't load without it.

**Measured live through `server.mjs`** (container about 50 ms from Moss, browser on the same machine), second recording:
- **Talker first token:** 41–45 ms.
- **Reply on screen:** 52–64 ms after Enter.
- **Worker first token:** 192–234 ms. Real turns add about 1,000 uncached tokens (history and state) after the cached 4,800.
- **Router:** 5–26 ms. Page-local commands take about 124 ms on screen.
- **Variance:** the first recording had a ~190 ms talker on every turn and never reproduced. Probably Moss-side.

**Next:**
1. **Going public** (the user decides): make a new public repository with clean history rather than flipping this one. History is 35 MB and includes a period when `node_modules` was tracked.
   - Decide what stays: `references/` (screenshots and GIFs of other products), `PROMPT.md`, `Critic prompt.md`, `design-log.md`, `RETRO.md`.
   - Add a LICENSE. `@inferedge/moss` is PolyForm Shield.
   - Then enable Pages (Source: GitHub Actions).
2. **Worker first token** (optional): try ending the system prompt on an 800-token block boundary (cache blocks look like 800 tokens), or move per-turn history after a stable block. Expect up to about 100 ms on edits.
3. **More recordings:** a mock-up of a real site, and a voice session (needs a real browser for Aura timing).
4. **Ask Moss** the questions below.

## Benchmark session list (done)
1. **Check the Moss keys.**
   - `MOSS_PROJECT_ID` and `MOSS_PROJECT_KEY` are now environment variables on this cloud environment, and the old Moss network secret was deleted.
   - Confirm both are set without printing them, e.g. `[ -n "$MOSS_PROJECT_KEY" ] && echo set`.
   - Then make one call: `curl https://inference.moss.dev/v1/chat/completions -H "Authorization: Bearer $MOSS_PROJECT_ID:$MOSS_PROJECT_KEY" ...`. Expect 200.
   - **Use curl, not Node `fetch`.** Node's fetch ignores the container's HTTPS proxy and fails DNS.
   - Earlier 401 ("Send Bearer project_id:project_key"): the saved network secret was probably not in `id:key` form. If the variables give a 401 too, the id/key pair itself is wrong.
2. **Build and run the benchmark** (approved plan: `/root/.claude/plans/virtual-hopping-grove.md`; it may not survive, so the plan is repeated here).
   - Write `scripts/bench.mjs` and add `npm run bench`. It's not part of `npm test`.
   - Reuse `buildMessages`, `systemPrompt`, `talk` and `usageMeta` from `api/agent.js`.
   - Call Moss through curl (child process), with `X-Moss-Cache: off` so the reply cache doesn't hide real timings.
   - Run 10 repeats per variant and report p50/p95 time to first token, total time, and prompt / cached / output tokens. Variants:
     - the talker prompt
     - a new-layout edit, cold then warm
     - the old-layout edit (`git show 320a90f:api/agent.js`, the commit before the prompt restructure)
     - JSON mode on and off
     - Chat Completions against Responses (`/v1/responses`)
     - `max_tokens` caps
   - Measure the container-to-Moss round trip on its own (`GET /v1/models`).
   - Sample state: build one with the offline agent in Playwright ("just build a smash burger joint in Brooklyn"), then `window.moss.agent.slimState(window.moss.pageModel.get())`.
3. **Report** what it takes to get under 200 ms, and the questions for Moss (below).

## What the user wants
- **Goal:** inference time to first token of 200 ms or less, and an honest account of why setup was hard: what Moss's docs don't say.
- **Feedback for Moss:** the user wants it on why setup was hard and what would make it faster.
- **Keep secret:** never print keys or `.env`. Keep user info private.
- **No new PRs** unless asked; push to the branch above.

## What's built (and where)
- **App:** `moss-builder.html`, a single file containing the agent, normalizer, renderer, voice, latency module and app. `site/design.js` and `site/design.css` hold the design system, motion and refine tokens.
- **Functions in `api/`:**
  - `agent.js`: Moss calls. Streams server-sent events with a talker and a worker; prompt layout; router and knowledge hooks.
  - `scrape.js`: home page plus 3 nav pages, safe against requests to private addresses; builds passages and the knowledge index.
  - `speak.js`: Aura speech; GET streams the audio.
  - `voice-token.js`: Deepgram tokens.
  - `router-eval.js`: live router evaluation.
  - `_moss.js`: index client and router.
  - `_knowledge.js`: per-site index, reused for 24 h.
  - `_intents.js`: commands, paraphrases and keyword guards.
  - `_guard.js`: same-origin check and rate limits.
  - `_trace.js`: timing spans.
  - `_jsonScan.js`: incremental parser for the streamed JSON.
- **Tests:** in `tests/`.
- **Eval data:** `data/router-eval.md`.
- **Screenshots:** in `screenshots/`.
- **Latency panel:** the bars button or `?debug`. A waterfall per turn, p50/p95, and the Voice switch (Aura / Kokoro / Browser).

## Measured (live, Vercel `iad1` → Moss)

**Latest run** (talker plus worker, cache-friendly prompt):
- **Talker first token:** 165–192 ms.
- **Worker first token:** 224–255 ms.
- **Reply ready in the browser:** about 0.4 s. The Vercel hop adds about 140 ms.
- **Edits:** 1.7–2.0 s per turn, down from about 2.5 s.
- **Prefix cache:** works, in **2,400-token steps** (4,800 of about 5,850 tokens cached once warm). The talker's 230-token prompt is never cached.

**Other figures:**
- **Builds:** limited by output speed, about 1,400 tokens at roughly 120 tokens/s, so about 12 s. About 60% of a build turn's time is the deliberate build animation.
- **Aura first audio:** p50 about 1.6 s before streaming. After streaming, the waterfall stopped recording first audio after turn 1. Possibly the headless browser fails to play the MP3; not checked in a real browser.
- **Router:** queries take about 13 ms when warm. Cold load is about 5 s; a fresh server skips the router and a warm-up ping is sent. Hybrid keyword guards gave zero wrong commands in the live evaluation; high threshold 0.65.

## Benchmark (2026-11-12, cloud dev container → Moss)
- **How to run:** `npm run bench`. It rebuilds `data/bench-state.json` with `scripts/bench-state.cjs`, then runs `scripts/bench.mjs`. Not part of `npm test`.
- **Setup:** 10 runs per variant, `X-Moss-Cache: off`. Times start once curl has the connection up, so the TCP + TLS cost is a separate column. Test edit: "make the headline punchier" on a 7-section page, phase `edit`.

| Variant | TTFT p50 / p95 (ms) | Total p50 (ms) | Prompt / cached / output tokens |
|---|---|---|---|
| Round trip only (`GET /v1/models`) | n/a | 49 | n/a |
| Talker | **100 / 116** | 166 | 231 / 0 / 10 |
| Edit, new layout, **cold** prefix | 407 / 430 | 972 | 5,681 / 0 / 80 |
| Edit, new layout, **warm** prefix | **119 / 134** | 789 | 5,669 / 5,600 / 87 |
| Edit, old layout (320a90f), warm | 154 / 178 | 593 | 3,863 / 3,200 / 71 |
| Edit, JSON mode off | 115 / 154 | 759 | 5,669 / 5,600 / 86 |
| Edit, `max_tokens` 200 | 121 / 135 | 754 | 5,669 / 5,600 / 90 |
| Edit, Responses API | 156 / 166 | 757 | 5,669 / 5,600 / 89 |

Connection setup (TCP + TLS through the proxy) adds about 60 ms to every call that opens a new connection.

**What it means:**
- **Moss already answers in under 200 ms when the prefix is warm.** Talker 100 ms, edit 119 ms; about 50 ms of each is network round trip. The model's own first token takes roughly 50–70 ms.
- **The prefix cache matters most.** A cold 5.7k-token prompt costs about 290 ms more (407 against 119). Cached counts are always multiples of 800 (5,600, 3,200, and last session's 4,800), so the cache probably works in 800-token blocks. Prompts under 800 tokens, like the talker's 231, are never cached; the talker is fast anyway.
- **Cache lifetime:** a primed prefix was still fully cached (5,600/5,700) after 0 s, 30 s, 2 min, 5 min and 10 min.
- **The new prompt layout pays off.** It leaves 69 tokens uncached against 663 in the old layout, which makes it 35 ms faster to first token. Totals differ only through output length.
- **No first-token effect** from JSON mode or `max_tokens`. Keep both.
- **Responses API is about 37 ms slower** to first token than Chat Completions. Stay on Chat Completions.
- **Output speed** is about 130 tokens/s (87 tokens in about 670 ms after the first).
- **Rate limits:** about 2% of back-to-back calls got HTTP 429. The bench reports them and leaves them out of the times. No retry-after guidance was found.

**Why Vercel measured 165–192 ms (talker) and 224–255 ms (worker), and what gets it under 200 ms:**
1. **Warm prefix:** saves about 290 ms on cold turns. The worker prompt is identical every turn, so it stays warm while the user is active. The first turn after the page opens is cold unless the warm-up ping primes it with a 1-token call (cheap: almost every token is cached on later calls).
2. **Connection reuse:** saves about 60 ms per turn. Node's fetch (undici) closes idle connections after 4 s by default, so almost every chat turn reconnects. Use a module-level `new Agent({ keepAliveTimeout: 60_000, keepAliveMaxTimeout: 300_000 })` as the `dispatcher`, and open the connection in the warm-up ping.
3. **Region:** the container is about 49 ms from Moss. Vercel `iad1` could be closer or further. The region needs Moss's answer, or a test from two or three Vercel regions.
4. **Already done, keep it:** Chat Completions, a stable system prompt first, the variable tail last.

With 1 and 2, the expected server-side times on Vercel are a talker first token of about 100–130 ms and a worker first token of about 120–150 ms. That is not yet verified on Vercel. The browser → Vercel hop (about 140 ms) comes on top of that and is outside Moss.

## Moss docs findings (docs.moss.dev; `/llms.txt` indexes them)
- **Endpoints:** both Responses (`/v1/responses`) and Chat Completions. Auth is `Bearer <id>:<key>`.
- **Headers:**
  - `X-Moss-Indexes` names indexes for server-side retrieval, on the same machines as inference.
  - `X-Moss-Retrieve` and `X-Moss-Cache` turn retrieval and the reply cache on or off.
  - Replies carry `X-Moss-Retrieve-Ms`.
- **`moss/fastlane-1`:** under 200 ms time to first token "grounded", with a prefix cache. Usage reports `prompt_tokens_details.cached_tokens`. The reply cache answers repeats free; that explains a 27 ms repeat we saw.
- **Browser calls:** CORS is open (`*`), but there are **no short-lived browser tokens**. The docs say to proxy through your own server route, so the Vercel hop can't be removed safely.
- **Other:** other models are listed at `/v1/models`. Moss is hosted behind Google Cloud; the region isn't stated.

## Questions for Moss
- Which region? (Pin the Vercel function next to it.)
- Is the prefix cache in 800-token blocks, with nothing cached under 800? How long does a prefix stay cached, and can it be pinned or warmed explicitly?
- What are the rate limits? We saw 429s on about 2% of back-to-back calls. Do 429 replies carry `Retry-After`?
- What keep-alive timeout does the edge allow, and is HTTP/2 to the API recommended for reuse?
- Are short-lived browser tokens planned?
- What's the output speed of fastlane-1? (We measured about 130 tokens/s.)

## Gotchas learned
- **Vercel:**
  - `excludeFiles` is limited to 256 characters.
  - `vercel.json` headers override a function's own headers (scrape and speak are exempted from no-store).
  - Background work needs `waitUntil` (`@vercel/functions`).
  - Only `/tmp` is writable (embedding-model cache).
- **Moss index SDK (`@inferedge/moss`):**
  - Needs the project key, so it can't run in a browser.
  - About 600 MB of dependencies; CUDA and other-platform ONNX files are excluded in `vercel.json`.
  - Index builds are background jobs.
  - Licence is PolyForm Shield (testing and internal use only).
- **Embeddings confuse opposites** (bigger/smaller at 0.94), hence the keyword guards.
- **Deepgram:** the key needs the Member role to mint live-listening tokens. The user still has to swap the key.
- **Kokoro:** the real model is untested here; the headless check was blocked by the permission classifier.
- **Test servers:** must ignore the page's warm-up ping (`{warm:true}`).
- **Bench:**
  - Moss's server-sent events put spaces after colons (`"content": "Hi"`), so match them loosely.
  - From a Node child process, curl can't write `-D /dev/stderr` (exit 23). Use `-D -` and parse the headers from stdout.

## Still open
- **Vercel region:** pin the function next to Moss (needs Moss's region).
- **Voice timing:** first-audio timing after turn 1 is missing (real browser vs headless).
- **Kokoro:** real-model timing.
- **Deepgram:** Member-role key.
- **Saving projects:** a refresh still loses the site.
- **Public link:** merge to main, or turn off Vercel preview protection.
