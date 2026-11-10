// Tests for api/agent.js against a mock OpenAI-compatible Moss server. No real credentials needed.
// Run: node tests/agent-api.mjs
import http from 'node:http';
import handler, { callMoss, extractJSON, compactState, mossSettings } from '../api/agent.js';

const results = [];
const check = (name, ok, detail = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

// Mock Moss: records requests; behaviour chosen by the model name.
const seen = [];
const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const json = JSON.parse(body);
    seen.push({ url: req.url, auth: req.headers.authorization, json });
    if (json.model === 'strict' && json.response_format) { res.writeHead(400); return res.end('response_format not supported'); }
    if (json.model === 'down') { res.writeHead(500); return res.end('boom'); }
    const content = '```json\n' + JSON.stringify({ reply: 'Adding a FAQ.', ops: [{ op: 'addSection', page: 'home', section: { type: 'faq', data: { title: 'Good to know' } } }], suggestions: ['Warmer colors'] }) + '\n```';
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ choices: [{ message: { role: 'assistant', content } }] }));
  });
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}/v1`;
const env = (model) => ({ MOSS_PROJECT_ID: 'proj_123', MOSS_PROJECT_KEY: 'key_abc', MOSS_BASE_URL: base + '/', MOSS_MODEL: model });
const state = { business: { name: 'Pousada Maré', kind: 'pousada', copy: { big: 'x'.repeat(5000) } }, pages: [{ id: 'home', name: 'Home', sections: [{ id: 'her1', type: 'hero', data: { headline: 'Hi', punchy: ['a'], punchIx: 1 } }] }], currentPage: 'home' };

// 1. happy path
const out = await callMoss({ message: 'add a faq', state, history: [{ role: 'user', content: 'earlier' }, { role: 'system', content: 'ignored' }] }, env('moss-test'));
const req1 = seen.at(-1);
check('posts to <base>/chat/completions', req1.url === '/v1/chat/completions', req1.url);
check('sends Bearer <project id>:<project key> and model', req1.auth === 'Bearer proj_123:key_abc' && req1.json.model === 'moss-test', req1.auth);
check('asks for JSON mode', req1.json.response_format && req1.json.response_format.type === 'json_object');
check('system prompt first, history kept, foreign roles dropped', req1.json.messages[0].role === 'system' && req1.json.messages[1].content === 'earlier' && req1.json.messages.length === 3);
const lastUser = req1.json.messages.at(-1).content;
check('state is compacted (no copy library, no local helpers)', !lastUser.includes('xxxxx') && !lastUser.includes('punchIx') && lastUser.includes('"headline":"Hi"'));
check('parses fenced JSON reply', out.reply === 'Adding a FAQ.' && out.ops.length === 1 && out.suggestions[0] === 'Warmer colors');

// 2. server without JSON mode: retry without response_format
const out2 = await callMoss({ message: 'x', state }, env('strict'));
check('retries without response_format on 400', out2.ops.length === 1 && seen.at(-1).json.response_format === undefined);

// 3. upstream failure surfaces as 502
try { await callMoss({ message: 'x', state }, env('down')); check('upstream 500 → error', false); }
catch (e) { check('upstream 500 → 502 error', e.status === 502, e.message); }

// 4. handler: not configured / bad input
const mockRes = () => { const r = { code: 0, body: null, headers: {} }; r.status = (c) => ((r.code = c), r); r.json = (b) => ((r.body = b), r); r.setHeader = (k, v) => (r.headers[k] = v); return r; };
const saved = { ...process.env }; ['MOSS_API_KEY', 'MOSS_PROJECT_ID', 'MOSS_PROJECT_KEY', 'MOSS_BASE_URL', 'MOSS_MODEL'].forEach((k) => delete process.env[k]);
let r = mockRes(); await handler({ method: 'POST', body: { message: 'hi', state } }, r);
check('handler: 503 when Moss env vars are missing', r.code === 503, r.body && r.body.error);
r = mockRes(); await handler({ method: 'GET' }, r); check('handler: 405 on GET', r.code === 405);
r = mockRes(); await handler({ method: 'POST', body: { message: '' } }, r); check('handler: 400 on empty message', r.code === 400);
r = mockRes(); await handler({ method: 'POST', body: { message: 'x'.repeat(2001) } }, r); check('handler: 413 on long message', r.code === 413);
Object.assign(process.env, env('moss-test'));
r = mockRes(); await handler({ method: 'POST', body: JSON.stringify({ message: 'add a faq', state }) }, r);
check('handler: 200 with string body', r.code === 200 && r.body.ops.length === 1 && r.headers['cache-control'] === 'no-store');
process.env = saved;

// 5. defaults match Moss Inference
const d = mossSettings({ MOSS_PROJECT_ID: 'p', MOSS_PROJECT_KEY: 'k' });
check('defaults: inference.moss.dev, moss/fastlane-1, id:key token', d.base === 'https://inference.moss.dev/v1' && d.model === 'moss/fastlane-1' && d.token === 'p:k');
check('MOSS_API_KEY works as the project key', mossSettings({ MOSS_PROJECT_ID: 'p', MOSS_API_KEY: 'k2' }).token === 'p:k2');
check('a full id:key token is used as is', mossSettings({ MOSS_API_KEY: 'p:k3' }).token === 'p:k3');
check('missing key half → not configured', mossSettings({ MOSS_PROJECT_ID: 'p' }).token === '');

// 6. live voice turns ask for short replies
const live = (await import('../api/agent.js')).buildMessages({ message: 'hi', state: {}, live: true }).at(-1).content;
check('live mode asks for short spoken replies', live.includes('VOICE: live spoken conversation'));

// 7. the phase picks the right instructions
const { phaseOf, buildMessages: bm } = await import('../api/agent.js');
const home = { pages: [{ id: 'home', name: 'Home', sections: [{ id: 'h', type: 'hero', data: {} }] }] };
check('new site → interview; "just build" → build now', phaseOf({ pages: [] }) === 'interview' && phaseOf({ pages: [] }, 'autopilot') === 'autobuild');
check('plan phases → interview / review / guided; built site → editing', phaseOf({ pages: [], plan: { phase: 'interview' } }) === 'interview' && phaseOf({ pages: [], plan: { phase: 'proposed' } }) === 'review' && phaseOf(Object.assign({ plan: { phase: 'building' } }, home)) === 'guided' && phaseOf(home) === 'edit');
const sys = bm({ message: 'hi', state: { pages: [] } })[0].content;
check('the interview prompt asks one question per turn and builds nothing', sys.includes('PHASE: INTERVIEW') && sys.includes('Exactly ONE question per turn') && sys.includes('no addSection'));
const guided = bm({ message: 'next', state: Object.assign({ plan: { phase: 'building', sections: [{ type: 'hero', done: true }, { type: 'steps', variant: 'list', intent: 'how it works' }] } }, home) });
check('guided build tells Moss the next planned section', guided[0].content.includes('PHASE: GUIDED BUILD') && guided.at(-1).content.includes('"next":{"type":"steps"'));

// 8. helpers
check('extractJSON tolerates prose around the object', extractJSON('Sure! {"reply":"ok","ops":[]} Hope that helps.').reply === 'ok');
check('compactState keeps flow names only', JSON.stringify(compactState({ flows: [{ name: 'Booking', nodes: [1, 2] }] }).flows) === '["Booking"]');

server.close();
const failed = results.filter((x) => !x).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
