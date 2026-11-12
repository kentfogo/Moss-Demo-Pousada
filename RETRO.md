# Retro and handoff: Moss Builder latency work

For the next session. Everything is on branch `claude/relaxed-fermat-rr1j2j` (PR kentfogo/Moss-Demo-Pousada#1). `npm test` runs 10 suites, all green.

## Pick up here
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
- Is there a minimum prompt size for the prefix cache? Is 2,400 tokens the step size?
- Does JSON mode slow generation?
- Are short-lived browser tokens planned?
- What's the output speed of fastlane-1?

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

## Still open
- **Vercel region:** pin the function next to Moss (needs Moss's region).
- **Voice timing:** first-audio timing after turn 1 is missing (real browser vs headless).
- **Kokoro:** real-model timing.
- **Deepgram:** Member-role key.
- **Saving projects:** a refresh still loses the site.
- **Public link:** merge to main, or turn off Vercel preview protection.
