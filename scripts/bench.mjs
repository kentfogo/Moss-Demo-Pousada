// Moss latency benchmark: time to first token, total time and token counts for the prompts the builder really sends.
// Run: npm run bench   (needs MOSS_PROJECT_ID and MOSS_PROJECT_KEY; not part of npm test, it spends real tokens)
//   BENCH_RUNS=10      repeats per variant (default 10)
//   BENCH_ONLY=a,b     run only these variant ids
// Calls go through curl, not fetch: Node's fetch ignores the container's HTTPS proxy. X-Moss-Cache: off on every call,
// so Moss's reply cache can't answer repeats for free; the prefix cache (cached_tokens) still works and is reported.
// Writes data/bench-results.json and data/bench-results.md.
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { buildMessages, mossSettings, usageMeta, TALKER_PROMPT, MAX_TOKENS, phaseOf } from '../api/agent.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RUNS = Number(process.env.BENCH_RUNS || 10);
const ONLY = (process.env.BENCH_ONLY || '').split(',').filter(Boolean);
const { token, base, model } = mossSettings();
if (!token) { console.error('Set MOSS_PROJECT_ID and MOSS_PROJECT_KEY first.'); process.exit(1); }

const sample = JSON.parse(readFileSync(path.join(ROOT, 'data', 'bench-state.json'), 'utf8'));
const EDIT = { message: 'make the headline punchier', state: sample.state, history: [], directions: sample.directions, recentDirections: [] };
const phase = phaseOf(EDIT.state);

// The prompt layout before the restructure (commit 320a90f), loaded next to the real module so its imports resolve.
const OLD = path.join(ROOT, 'api', '.bench-old-agent.mjs');
writeFileSync(OLD, execFileSync('git', ['show', '320a90f:api/agent.js'], { cwd: ROOT }));
let oldAgent;
try { oldAgent = await import(OLD); } finally { rmSync(OLD, { force: true }); }

/* ------------------------------------------------------------ one call through curl */
const HDR = 'x-moss-'; // response headers worth keeping
function curl({ url, body, method = 'POST' }) {
  const args = ['-sS', '-N', '--no-buffer', '-X', method, url,
    '-H', `Authorization: Bearer ${token}`, '-H', 'X-Moss-Cache: off',
    '-D', '-', '-w', '%{stderr}\nCURLTIME %{time_pretransfer} %{time_starttransfer} %{time_total} %{http_code}\n'];
  if (body) args.push('-H', 'Content-Type: application/json', '-H', 'Accept: text/event-stream', '--data-binary', '@-');
  return new Promise((resolve) => {
    const t0 = performance.now(); let tFirst = null; let out = ''; let err = '';
    const p = spawn('curl', args, { stdio: ['pipe', 'pipe', 'pipe'] });
    const firstTokenSeen = (s) => /"delta"\s*:\s*\{[^}]*"content"\s*:\s*"[^"]|"type"\s*:\s*"response\.output_text\.delta"/.test(s);
    p.stdout.on('data', (b) => { out += b; if (tFirst === null && firstTokenSeen(out)) tFirst = performance.now(); });
    p.stderr.on('data', (b) => { err += b; });
    p.on('close', () => {
      const tEnd = performance.now();
      const m = err.match(/CURLTIME (\S+) (\S+) (\S+) (\d+)/) || [];
      const pre = Number(m[1]) * 1000; const status = Number(m[4]);
      const headers = Object.fromEntries(out.split(/\r?\n/).map((l) => l.match(/^([\w-]+):\s*(.*)$/)).filter((x) => x && x[1].toLowerCase().startsWith(HDR)).map((x) => [x[1].toLowerCase(), x[2]]));
      resolve({ status, out, headers,
        // times after curl has the connection up (TCP + TLS through the proxy excluded), so they show Moss, not setup
        ttft: tFirst === null ? null : tFirst - t0 - pre,
        total: tEnd - t0 - pre, connect: pre, firstByte: Number(m[2]) * 1000 - pre });
    });
    if (body) p.stdin.end(JSON.stringify(body)); else p.stdin.end();
  });
}

/** Text and usage out of a streamed (or plain) Chat Completions or Responses reply. */
function parse(out) {
  let text = ''; let usage = null;
  for (const line of out.split('\n')) {
    const s = line.trim(); const raw = s.startsWith('data:') ? s.slice(5).trim() : s.startsWith('{') ? s : '';
    if (!raw || raw === '[DONE]') continue;
    let j; try { j = JSON.parse(raw); } catch { continue; }
    const c = j?.choices?.[0];
    text += c?.delta?.content ?? c?.message?.content ?? (j.type === 'response.output_text.delta' ? j.delta : '') ?? '';
    usage = j.usage || j.response?.usage || usage;
  }
  return { text, usage: usageMeta(usage) };
}

/* ------------------------------------------------------------ variants */
const chat = (messages, extra = {}) => ({ url: `${base}/chat/completions`, body: { model, messages, temperature: 0.4, stream: true, stream_options: { include_usage: true }, ...extra } });
const talkerMessages = [{ role: 'system', content: TALKER_PROMPT }, { role: 'user', content: `Site: ${sample.state.business?.name || 'a new one'}. Request: ${EDIT.message}` }];
const newEdit = () => buildMessages(EDIT);
const json = { response_format: { type: 'json_object' } };
const editTokens = MAX_TOKENS[phase] || 900;
const nonce = () => `[run ${Math.random().toString(36).slice(2)}]\n`;
const coldify = (msgs) => [{ ...msgs[0], content: nonce() + msgs[0].content }, ...msgs.slice(1)]; // a new first token defeats the prefix cache

const VARIANTS = [
  { id: 'rtt', label: 'Round trip only (GET /v1/models)', req: () => ({ url: `${base}/models`, method: 'GET' }) },
  { id: 'talker', label: 'Talker (tiny prompt, 40 tokens)', req: () => chat(talkerMessages, { max_tokens: 40, temperature: 0.3 }) },
  { id: 'talker-nostream', label: 'Talker, not streamed', req: () => ({ ...chat(talkerMessages, { max_tokens: 40, temperature: 0.3 }), body: { model, messages: talkerMessages, max_tokens: 40, temperature: 0.3 } }) },
  { id: 'edit-cold', label: 'Edit, new layout, cold prefix', req: () => chat(coldify(newEdit()), { max_tokens: editTokens, ...json }) },
  { id: 'edit-warm', label: 'Edit, new layout, warm prefix', prime: true, req: () => chat(newEdit(), { max_tokens: editTokens, ...json }) },
  { id: 'edit-old', label: 'Edit, old layout (320a90f), warm', prime: true, req: () => chat(oldAgent.buildMessages(EDIT), { max_tokens: editTokens, ...json }) },
  { id: 'edit-nojson', label: 'Edit, new layout, JSON mode off', prime: true, req: () => chat(newEdit(), { max_tokens: editTokens }) },
  { id: 'edit-cap200', label: 'Edit, new layout, max_tokens 200', prime: true, req: () => chat(newEdit(), { max_tokens: 200, ...json }) },
  { id: 'edit-responses', label: 'Edit, Responses API (/v1/responses)', prime: true, req: () => {
    const [sys, ...rest] = newEdit();
    return { url: `${base}/responses`, body: { model, instructions: sys.content, input: rest.map((m) => ({ role: m.role, content: m.content })), max_output_tokens: editTokens, temperature: 0.4, stream: true, text: { format: { type: 'json_object' } } } };
  } },
];

/* ------------------------------------------------------------ run */
const pct = (xs, p) => { const s = xs.filter((x) => x != null).sort((a, b) => a - b); if (!s.length) return null; return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)]; };
const ms = (x) => (x == null ? '–' : `${Math.round(x)}`);
const avg = (xs) => { const s = xs.filter((x) => x != null); return s.length ? s.reduce((a, b) => a + b, 0) / s.length : null; };

const results = [];
for (const v of VARIANTS) {
  if (ONLY.length && !ONLY.includes(v.id)) continue;
  if (v.prime) await curl(v.req()); // one untimed call so the prefix is in the cache
  const runs = [];
  for (let i = 0; i < RUNS; i++) {
    const r = await curl(v.req());
    const { text, usage } = parse(r.out);
    if (r.status !== 200) { console.error(`${v.id}: HTTP ${r.status} ${r.out.slice(0, 200)}`); }
    runs.push({ status: r.status, ttft: r.ttft, total: r.total, connect: r.connect, firstByte: r.firstByte, chars: text.length, ...usage, headers: r.headers });
    process.stdout.write('.');
  }
  const ok = runs.filter((r) => r.status === 200);
  const row = { id: v.id, label: v.label, ok: ok.length, runs: runs.length,
    ttftP50: pct(ok.map((r) => r.ttft), 50), ttftP95: pct(ok.map((r) => r.ttft), 95),
    totalP50: pct(ok.map((r) => r.total), 50), totalP95: pct(ok.map((r) => r.total), 95),
    connectP50: pct(runs.map((r) => r.connect), 50),
    prompt: avg(ok.map((r) => r.promptTokens)), cached: avg(ok.map((r) => r.cachedTokens)), output: avg(ok.map((r) => r.outputTokens)),
    sample: runs[0] };
  results.push(row);
  console.log(`\n${v.label}: ttft p50 ${ms(row.ttftP50)} p95 ${ms(row.ttftP95)} · total p50 ${ms(row.totalP50)} p95 ${ms(row.totalP95)} · tokens ${ms(row.prompt)}/${ms(row.cached)} cached/${ms(row.output)} out · ${row.ok}/${row.runs} ok`);
}

const when = new Date().toISOString();
writeFileSync(path.join(ROOT, 'data', 'bench-results.json'), JSON.stringify({ when, model, runs: RUNS, phase, results: results.map(({ sample: s, ...r }) => ({ ...r, headers: s && s.headers })) }, null, 1) + '\n');
const md = [
  `# Moss benchmark, ${when.slice(0, 16).replace('T', ' ')} UTC`, '',
  `Model \`${model}\`, ${RUNS} runs per variant, from the cloud dev container (not Vercel). Times in ms, measured after the connection is up, so TCP and TLS setup through the proxy are left out (shown separately as "connect").`, '',
  '| Variant | TTFT p50 | TTFT p95 | Total p50 | Total p95 | Prompt tok | Cached tok | Output tok | Connect p50 | OK |',
  '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
  ...results.map((r) => `| ${r.label} | ${ms(r.ttftP50)} | ${ms(r.ttftP95)} | ${ms(r.totalP50)} | ${ms(r.totalP95)} | ${ms(r.prompt)} | ${ms(r.cached)} | ${ms(r.output)} | ${ms(r.connectP50)} | ${r.ok}/${r.runs} |`),
  '', 'For the round-trip row, "Total" is the full request after connecting: the floor any call pays.', '',
].join('\n');
writeFileSync(path.join(ROOT, 'data', 'bench-results.md'), md);
console.log('\n' + md);
