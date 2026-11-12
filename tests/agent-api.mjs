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
    if (json.stream && json.model !== 'nostream') { // token stream, a few characters at a time
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      const body2 = JSON.stringify({ reply: 'Two sections, "quoted".', ops: [{ op: 'addSection', page: 'home', section: { type: 'faq', data: { title: 'A { brace' } } }, { op: 'addSection', page: 'home', section: { type: 'cta', data: { title: 'Go' } } }], after: 'Done.', suggestions: ['More'] });
      const parts = body2.match(/.{1,7}/gs);
      let k = 0; const tick = () => { if (k < parts.length) { res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: parts[k++] } }] })}\n\n`); setTimeout(tick, 2); } else { res.write('data: [DONE]\n\n'); res.end(); } };
      return tick();
    }
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

// 8. Deepgram: short-lived token and Aura speech, key kept server-side
const vt = await import('../api/voice-token.js');
const sp = await import('../api/speak.js');
const calls = [];
const fakeFetch = (ok, json, bytes) => async (url, opts) => { calls.push({ url, opts }); return { ok, status: ok ? 200 : 401, json: async () => json, arrayBuffer: async () => new Uint8Array(bytes || [1, 2, 3]).buffer }; };
const g = await vt.grant({ DEEPGRAM_API_KEY: 'dg-secret' }, fakeFetch(true, { access_token: 'jwt-123', expires_in: 30 }));
check('voice-token asks Deepgram for a temporary token with the key', calls.at(-1).url === 'https://api.deepgram.com/v1/auth/grant' && calls.at(-1).opts.headers.authorization === 'Token dg-secret');
check('…and returns only the token and settings, never the key', g.token === 'jwt-123' && g.model === 'nova-3' && g.voice === 'aura-2-thalia-en' && !JSON.stringify(g).includes('dg-secret'));
try { await vt.grant({}, fakeFetch(true, {})); check('voice-token without a key', false); } catch (e) { check('voice-token without a key → 503', e.status === 503); }
try { await vt.grant({ DEEPGRAM_API_KEY: 'k' }, fakeFetch(false, {})); check('voice-token upstream error', false); } catch (e) { check('voice-token refused (401/403) → 502, says speech still works and names the fix', e.status === 502 && e.speak === true && /Member/.test(e.message)); }
const audio = await sp.synthesize('Hello there.', { DEEPGRAM_API_KEY: 'dg-secret', DEEPGRAM_VOICE: 'aura-2-apollo-en' }, fakeFetch(true, null, [9, 9]));
check('speak calls Aura with the chosen voice as MP3', calls.at(-1).url.includes('/v1/speak?model=aura-2-apollo-en&encoding=mp3') && JSON.parse(calls.at(-1).opts.body).text === 'Hello there.' && audio.length === 2);
const mres = () => { const r = { code: 0, body: null, headers: {} }; r.status = (c) => ((r.code = c), r); r.json = (b) => ((r.body = b), r); r.setHeader = (k, v) => (r.headers[k] = v); r.end = (b) => ((r.body = b), r); return r; };
let rr = mres(); await sp.default({ method: 'POST', headers: { host: 'a.app' }, body: { text: 'x'.repeat(601) } }, rr);
check('speak refuses very long text', rr.code === 413);
rr = mres(); await sp.default({ method: 'POST', headers: { host: 'a.app', origin: 'https://evil.example' }, body: { text: 'hi' } }, rr);
check('speak refuses other sites', rr.code === 403);
rr = mres(); await vt.default({ method: 'GET', headers: { host: 'a.app', origin: 'https://evil.example' } }, rr);
check('voice-token refuses other sites', rr.code === 403);

// 9. cost controls: output budget per phase, design library only when a look can change
const { MAX_TOKENS, needsLibrary } = await import('../api/agent.js');
const lib = [{ id: 'hospitality', name: 'Hospitality', mood: 'warm', fits: 'hotels', colors: {}, type: {}, shape: {}, variants: {}, art: 'orb' }];
await callMoss({ message: 'add a faq', state: home, directions: lib }, env('moss-test'));
check('edit turns skip the design library and cap output', !seen.at(-1).json.messages.at(-1).content.includes('DIRECTIONS:') && seen.at(-1).json.max_tokens === MAX_TOKENS.edit);
await callMoss({ message: 'make it warmer colours', state: home, directions: lib }, env('moss-test'));
check('style requests still get the library', seen.at(-1).json.messages.at(-1).content.includes('DIRECTIONS:'));
await callMoss({ message: 'hi', state: { pages: [] }, directions: lib }, env('moss-test'));
check('interview turns get a small budget', seen.at(-1).json.max_tokens === 350 && needsLibrary('interview', 'hi'));
const hist = Array.from({ length: 12 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 't' + i }));
check('history is cut to 6 turns', bm({ message: 'x', state: home, history: hist }).length === 8);
const mockMsgs = bm({ message: 'mock up joes.com', state: { pages: [] }, mode: 'mock', scraped: { name: 'Joe\'s Plumbing', h1: ['24/7 plumbers'] } });
check('mock mode sends the scraped facts with the REDESIGN MOCKS phase', mockMsgs[0].content.includes('PHASE: REDESIGN MOCKS') && mockMsgs.at(-1).content.includes('SCRAPED SITE') && mockMsgs.at(-1).content.includes('Joe\'s Plumbing'));

// 10. abuse guards
const guardMod = await import('../api/_guard.js');
guardMod.resetLimits();
const ip = { method: 'POST', headers: { host: 'a.app', 'x-forwarded-for': '9.9.9.9' } };
let blocked = 0; for (let i = 0; i < guardMod.LIMITS.scrape.limit + 2; i++) if (guardMod.rateLimited(ip, 'scrape')) blocked++;
check('per-IP rate limit kicks in after the limit', blocked === 2);
r = mockRes(); guardMod.guard({ method: 'POST', headers: { host: 'a.app', 'x-forwarded-for': '9.9.9.9' } }, r, { methods: ['POST'], bucket: 'scrape' });
check('…and answers 429', r.code === 429);
r = mockRes(); await handler({ method: 'POST', headers: { host: 'a.app', origin: 'https://evil.example' }, body: { message: 'hi' } }, r);
check('agent refuses other sites', r.code === 403);
guardMod.resetLimits();

// 11. scraper: address safety, URL parsing, redirects, limits, extraction
const sc = await import('../api/scrape.js');
check('private / loopback / link-local / ULA / mapped addresses are refused', ['10.0.0.1', '127.0.0.1', '169.254.169.254', '172.20.1.1', '192.168.1.1', '100.64.0.1', '0.0.0.0', '::1', 'fd12::1', 'fe80::1', '::ffff:10.0.0.1'].every(sc.isPrivateAddress) && !sc.isPrivateAddress('8.8.8.8') && !sc.isPrivateAddress('2606:4700::1111'));
check('spoken domains become URLs ("joes plumbing dot com")', String(sc.toUrl('joesplumbing dot com')) === 'https://joesplumbing.com/' && String(sc.toUrl('www.x.co.uk/about#a')) === 'https://www.x.co.uk/about');
check('localhost, metadata IPs, odd ports, credentials and other schemes are refused', ['localhost', 'http://169.254.169.254/latest', 'x.com:8080', 'https://u:p@x.com', 'ftp://x.com', 'printer.local', 'file:///etc/passwd'].every((u) => sc.toUrl(u) === null));
const lk = await new Promise((res2) => sc.safeLookup('localhost', {}, (e) => res2(e)));
check('the socket lookup itself refuses hosts that resolve privately (DNS rebinding)', lk && lk.code === 'EBLOCKED');
const fixture = `<html><head><title>Joe's Plumbing | Austin Plumbers</title><meta name="description" content="Fast, fair plumbing in Austin."><style>.btn{background:#1f6feb}.x{color:#1f6feb}.y{color:#ffffff}</style></head><body><nav><a href="/">Home</a><a href="/services">Services</a><a href="/contact">Contact</a></nav><h1>Leaks fixed &amp; drains cleared today</h1><h2>Our services</h2><ul><li>Emergency leak repair</li><li>Drain cleaning</li><li>Water heater installs</li></ul><p>Family-run since 1998, we serve all of Austin with upfront pricing and a 1-year guarantee on every job.</p><p>Drain cleaning from $89, water heaters from $1,200.</p><blockquote>Joe came out at midnight and fixed our burst pipe in an hour. Lifesavers.</blockquote><a href="tel:512-555-0142">Call</a><a href="mailto:hi@joes.example">Email</a><p>Mon-Fri 8am-6pm</p><script>var secret="x"</script></body></html>`;
const ex = sc.extract(fixture, 'https://joes.example/');
check('extract: name, headline, services, contact, prices, quotes, brand colour', ex.name === "Joe's Plumbing" && ex.h1[0] === 'Leaks fixed & drains cleared today' && ex.items.includes('Drain cleaning') && ex.contact.phone === '512-555-0142' && ex.contact.email === 'hi@joes.example' && ex.prices.includes('$89') && /burst pipe/.test(ex.quotes[0]) && ex.brandColor === '#1f6feb' && ex.brandHue > 200 && ex.brandHue < 230 && !JSON.stringify(ex).includes('secret'), JSON.stringify(ex).slice(0, 200));
check('extract keeps the payload small', JSON.stringify(sc.extract(fixture.replace('<ul>', '<ul>' + '<li>Another service we really do offer</li>'.repeat(300)), 'https://joes.example/')).length <= 4000);
// a local fixture server, reached only through an injected lookup (the handler never allows this)
const site = http.createServer((q, s2) => {
  if (q.url === '/') { s2.writeHead(200, { 'content-type': 'text/html' }); return s2.end(fixture); }
  if (q.url === '/hop') { s2.writeHead(302, { location: '/' }); return s2.end(); }
  if (q.url === '/to-private') { s2.writeHead(302, { location: 'http://169.254.169.254/latest/meta-data' }); return s2.end(); }
  if (q.url === '/pdf') { s2.writeHead(200, { 'content-type': 'application/pdf' }); return s2.end('%PDF'); }
  if (q.url === '/huge') { s2.writeHead(200, { 'content-type': 'text/html' }); return s2.end('x'.repeat(2e6)); }
  s2.writeHead(404); s2.end();
});
await new Promise((rr2) => site.listen(0, rr2));
const sp0 = site.address().port;
const local = (h, o, cb) => { if (typeof o === 'function') cb = o; o && o.all ? cb(null, [{ address: '127.0.0.1', family: 4 }]) : cb(null, '127.0.0.1', 4); };
const at = (p) => Object.assign(new URL('http://joes.example' + p), { port: String(sp0) });
const viaTest = (p) => sc.fetchPage(at(p), { lookup: local }).then((x) => ({ ok: true, x }), (e) => ({ ok: false, e }));
const okHop = await viaTest('/hop');
check('follows a redirect on the same public site', okHop.ok && /Joe's Plumbing/.test(okHop.x.body));
const toPriv = await viaTest('/to-private');
check('a redirect into a private address is refused', !toPriv.ok && toPriv.e.status === 422, toPriv.e && toPriv.e.message);
const pdf = await viaTest('/pdf');
check('non-HTML is refused', !pdf.ok && pdf.e.status === 422);
const huge = await viaTest('/huge');
check('pages over 1.5 MB are refused', !huge.ok && huge.e.status === 413);
site.close();
const mr2 = () => { const x = mockRes(); x.end = () => x; return x; };
r = mr2(); await sc.default({ method: 'GET', headers: { host: 'a.app' }, query: { url: 'localhost' } }, r);
check('scrape handler: 400 for a non-public address', r.code === 400);

// 12. streaming: the scanner, and the handler's server-sent events
const { createScanner } = await import('../api/_jsonScan.js');
const sc2 = createScanner(); const evs = [];
const whole = 'Sure!\n```json\n' + JSON.stringify({ reply: 'He said "hi" \\ {ok}', ops: [{ op: 'a', x: '} ] {' }, { op: 'b', y: [1, { z: 2 }] }], after: 'x' }) + '\n``` trailing { "reply": "no" }';
for (const ch of whole) evs.push(...sc2.push(ch));
check('scanner: reply as soon as its string closes, each op as it closes, braces in strings ignored', evs.length === 3 && evs[0].type === 'reply' && evs[0].text === 'He said "hi" \\ {ok}' && evs[1].op.x === '} ] {' && evs[2].op.y[1].z === 2, JSON.stringify(evs));
const sseRes = () => { const r = { code: 0, headers: {}, chunks: [], ended: false }; r.status = (c) => ((r.code = c), r); r.json = (b) => ((r.body = b), r); r.setHeader = (k, v) => (r.headers[k.toLowerCase()] = v); r.write = (c) => r.chunks.push(c); r.end = () => (r.ended = true); r.flushHeaders = () => {}; return r; };
const parseSSE = (chunks) => chunks.join('').split('\n\n').filter(Boolean).map((b) => ({ event: (b.match(/^event: (.*)$/m) || [])[1], data: JSON.parse((b.match(/^data: (.*)$/m) || [])[1]) }));
Object.assign(process.env, env('moss-test'));
let sr = sseRes(); await handler({ method: 'POST', headers: { host: 'a.app', accept: 'text/event-stream' }, body: { message: 'add two', state: home } }, sr);
let ev = parseSSE(sr.chunks); const names = ev.map((e) => e.event);
check('SSE: event-stream headers and a hello first', /text\/event-stream/.test(sr.headers['content-type']) && names[0] === 'hello' && sr.ended);
check('SSE: reply comes before the ops, ops one by one, then done', names.indexOf('reply') < names.indexOf('op') && names.filter((n) => n === 'op').length === 2 && names.at(-1) === 'done' && ev.find((e) => e.event === 'op').data.op.section.data.title === 'A { brace', names.join());
const spanNames = ev.filter((e) => e.event === 'span').map((e) => e.data.span.name);
check('SSE: inference spans (request, time to first token, total) with server times', ['inference.request', 'inference.ttft', 'inference.total'].every((n) => spanNames.includes(n)) && ev.every((e) => typeof e.data.t === 'number') && ev.find((e) => e.event === 'done').data.streamed === true, spanNames.join());
process.env.MOSS_MODEL = 'nostream';
sr = sseRes(); await handler({ method: 'POST', headers: { host: 'a.app', accept: 'text/event-stream' }, body: { message: 'add a faq', state: home } }, sr);
ev = parseSSE(sr.chunks);
check('SSE: a server that does not stream still delivers reply, ops and done (streamed:false)', ev.some((e) => e.event === 'reply') && ev.filter((e) => e.event === 'op').length === 1 && ev.find((e) => e.event === 'done').data.streamed === false);
const ag = await import('../api/agent.js');
const savedPrep = ag.hooks.prepare;
ag.hooks.prepare = async (a, tr) => { const end = tr.start('router.query'); end({ score: 0.93 }); return { route: { canonical: 'Make it lively', score: 0.93 } }; };
sr = sseRes(); const calls0 = seen.length; await handler({ method: 'POST', headers: { host: 'a.app', accept: 'text/event-stream' }, body: { message: 'make it pop', state: home } }, sr);
ev = parseSSE(sr.chunks);
check('a router hit answers without calling the model', ev.some((e) => e.event === 'route' && e.data.canonical === 'Make it lively') && seen.length === calls0 && ev.some((e) => e.event === 'span' && e.data.span.name === 'router.query'));
let jr = mockRes(); await handler({ method: 'POST', headers: { host: 'a.app' }, body: { message: 'make it pop', state: home } }, jr);
check('…also on the JSON path, with timing', jr.code === 200 && jr.body.route.canonical === 'Make it lively' && Array.isArray(jr.body.timing));
ag.hooks.prepare = savedPrep;
process.env = saved;

// 13. helpers
check('extractJSON tolerates prose around the object', extractJSON('Sure! {"reply":"ok","ops":[]} Hope that helps.').reply === 'ok');
check('compactState keeps flow names only', JSON.stringify(compactState({ flows: [{ name: 'Booking', nodes: [1, 2] }] }).flows) === '["Booking"]');

server.close();
const failed = results.filter((x) => !x).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
