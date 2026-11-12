// Measures how much padding makes the agent's system prompt end on a Moss prefix-cache block boundary, and saves it
// to api/_cache-align.json (keyed by a hash of the unpadded prompt). Run after any change to the system prompt or
// the design library: node scripts/cache-align.mjs   (uses data/bench-state.json for the library; about 20 calls)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { basePrompt, cachePad, promptHash, mossSettings } from '../api/agent.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { token, base, model } = mossSettings();
if (!token) { console.error('Set MOSS_PROJECT_ID and MOSS_PROJECT_KEY first.'); process.exit(1); }
const { directions } = JSON.parse(readFileSync(path.join(ROOT, 'data', 'bench-state.json'), 'utf8'));
const sys = basePrompt(directions);
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

// cached tokens when what follows the system prompt is new (as in a real turn): prime once, then measure
function cached(pad) {
  const send = () => {
    const messages = [{ role: 'system', content: sys + cachePad(pad) }, { role: 'user', content: `turn ${Math.random().toString(36).slice(2)}` }];
    for (;;) {
      const out = execFileSync('curl', ['-sS', `${base}/chat/completions`, '-H', `Authorization: Bearer ${token}`, '-H', 'Content-Type: application/json', '-H', 'X-Moss-Cache: off', '--data-binary', '@-'], { input: JSON.stringify({ model, messages, max_tokens: 1 }) }).toString();
      const j = JSON.parse(out); if (j.usage) return j.usage;
      sleep(1200); // rate limited
    }
  };
  send(); return send().prompt_tokens_details.cached_tokens;
}

const at0 = cached(0);
let lo = 0, hi = 800; // smallest pad whose cached count passes at0 (the next block)
if (cached(hi) <= at0) { console.error('padding 800 tokens did not cache another block; is the block size still 800?'); process.exit(1); }
while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cached(mid) > at0) hi = mid; else lo = mid; }
const pad = hi + 2; // a little margin for how the padding meets the next message
const after = cached(pad);
const out = { hash: promptHash(sys), pad, cachedBefore: at0, cachedAfter: after, model, measuredAt: new Date().toISOString() };
writeFileSync(path.join(ROOT, 'api', '_cache-align.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`pad ${pad} tokens: system prompt cached ${at0} → ${after}. Saved api/_cache-align.json`);
