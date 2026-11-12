// Tests for api/agent.js against a mock OpenAI-compatible Moss server. No real credentials needed.
// Run: node tests/agent-api.mjs
import http from 'node:http';
import handler, { callMoss, extractJSON, compactState, mossSettings, buildMessages } from '../api/agent.js';

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
    if (json.stream && /^You are the voice of Moss/.test(json.messages[0].content)) { // the talker: one short sentence, as text
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      ['Sure, adding ', 'two sections ', 'now.'].forEach((t) => res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: t } }] })}\n\n`));
      res.write(`data: ${JSON.stringify({ choices: [], usage: { prompt_tokens: 120, completion_tokens: 6, prompt_tokens_details: { cached_tokens: 110 } } })}\n\n`);
      res.write('data: [DONE]\n\n'); return res.end();
    }
    if (json.stream && json.model !== 'nostream') { // token stream, a few characters at a time
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      const body2 = JSON.stringify({ reply: 'Two sections, "quoted".', ops: [{ op: 'addSection', page: 'home', section: { type: 'faq', data: { title: 'A { brace' } } }, { op: 'addSection', page: 'home', section: { type: 'cta', data: { title: 'Go' } } }], after: 'Done.', suggestions: ['More'] });
      const parts = body2.match(/.{1,7}/gs);
      let k = 0; const tick = () => { if (k < parts.length) { res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: parts[k++] } }] })}\n\n`); setTimeout(tick, 2); } else { res.write(`data: ${JSON.stringify({ choices: [], usage: { prompt_tokens: 5000, completion_tokens: 90, prompt_tokens_details: { cached_tokens: 4700 } } })}\n\n`); res.write('data: [DONE]\n\n'); res.end(); } };
      return tick();
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ choices: [{ message: { role: 'assistant', content } }] }));
  });
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}/v1`;
const env = (model) => ({ MOSS_PROJECT_ID: 'proj_123', MOSS_PROJECT_KEY: 'key_abc', MOSS_BASE_URL: base + '/', MOSS_MODEL: model, MOSS_ROUTER: 'off' });
const state = { business: { name: 'Pousada Maré', kind: 'pousada', copy: { big: 'x'.repeat(5000) } }, pages: [{ id: 'home', name: 'Home', sections: [{ id: 'her1', type: 'hero', data: { headline: 'Hi', punchy: ['a'], punchIx: 1 } }] }], currentPage: 'home' };

// 1. happy path
const out = await callMoss({ message: 'add a faq', state, history: [{ role: 'user', content: 'earlier' }, { role: 'system', content: 'ignored' }] }, env('moss-test'));
const req1 = seen.at(-1);
check('posts to <base>/chat/completions', req1.url === '/v1/chat/completions', req1.url);
check('sends Bearer <project id>:<project key> and model', req1.auth === 'Bearer proj_123:key_abc' && req1.json.model === 'moss-test', req1.auth);
check('asks for JSON mode', req1.json.response_format && req1.json.response_format.type === 'json_object');
check('system prompt first, history kept, foreign roles dropped', req1.json.messages[0].role === 'system' && req1.json.messages[1].content === 'earlier' && req1.json.messages.length === 3);
const lastUser = req1.json.messages.at(-1).content;
check('state is compacted: no copy library or local helpers; untouched sections are an outline', !lastUser.includes('xxxxx') && !lastUser.includes('punchIx') && lastUser.includes('"title":"Hi"') && !lastUser.includes('"headline":"Hi"'));
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
const streamFetch = async () => ({ ok: true, status: 200, body: (async function* () { yield new Uint8Array([1, 2]); yield new Uint8Array([3]); })() });
const sr0 = await sp.synthesizeStream('Hi.', { DEEPGRAM_API_KEY: 'k' }, streamFetch); const parts0 = []; for await (const c of sr0.body) parts0.push(c.length);
check('speak (GET) streams Aura through chunk by chunk', parts0.join() === '2,1');
rr = mres(); rr.headersSent = false; await sp.default({ method: 'GET', headers: { host: 'a.app', referer: 'https://evil.example/x' }, query: { text: 'hi' } }, rr);
check('speak (GET) refuses other sites by referer', rr.code === 403);
rr = mres(); await vt.default({ method: 'GET', headers: { host: 'a.app', origin: 'https://evil.example' } }, rr);
check('voice-token refuses other sites', rr.code === 403);

// 9. cost controls: output budget per phase, design library only when a look can change
const { MAX_TOKENS, needsLibrary } = await import('../api/agent.js');
const lib = [{ id: 'hospitality', name: 'Hospitality', mood: 'warm', fits: 'hotels', colors: {}, type: {}, shape: {}, variants: {}, art: 'orb' }];
await callMoss({ message: 'add a faq', state: home, directions: lib }, env('moss-test'));
check('edit turns skip the design library and cap output', !seen.at(-1).json.messages.at(-1).content.includes('DIRECTIONS:') && seen.at(-1).json.max_tokens === MAX_TOKENS.edit);
await callMoss({ message: 'make it warmer colours', state: home, directions: lib }, env('moss-test'));
check('the design library sits in the fixed system message, identical across turns and phases', seen.at(-1).json.messages[0].content.includes('DIRECTIONS:') && seen.at(-1).json.messages[0].content === seen.at(-2).json.messages[0].content && bm({ message: 'hi', state: { pages: [] }, directions: lib })[0].content === bm({ message: 'make the faq dark', state: home, directions: lib })[0].content);
const focusState = { currentPage: 'home', pages: [{ id: 'home', name: 'Home', sections: [{ id: 'h1', type: 'hero', data: { headline: 'Bread' } }, { id: 'f1', type: 'faq', data: { title: 'Q', items: [['a', 'b']] } }, { id: 'p1', type: 'pricing', data: { title: 'Prices', plans: [] } }] }] };
const ft = JSON.parse(bm({ message: 'make the faq answers shorter', state: focusState }).at(-1).content.split('STATE:\n')[1].split('\n\nMESSAGE')[0]).pages[0].sections;
check('only the sections a request names carry their data (the faq), the rest are an outline', ft.find((x) => x.id === 'f1').data && !ft.find((x) => x.id === 'p1').data && ft.find((x) => x.id === 'p1').title === 'Prices');
const ft2 = JSON.parse(bm({ message: 'make the headline punchier', state: focusState }).at(-1).content.split('STATE:\n')[1].split('\n\nMESSAGE')[0]).pages[0].sections;
check('a copy edit with no section named focuses the hero', ft2.find((x) => x.id === 'h1').data && !ft2.find((x) => x.id === 'f1').data);
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
  if (q.url === '/services') { s2.writeHead(200, { 'content-type': 'text/html' }); return s2.end('<html><body><h2>Emergency plumbing</h2><p>We repair burst pipes, leaking taps and blocked drains across Austin, day or night, with upfront quotes.</p><h2>Opening hours</h2><p>Mon-Fri 8am-6pm, Saturday 9am-1pm, emergencies 24/7.</p></body></html>'); }
  if (q.url === '/contact') { s2.writeHead(200, { 'content-type': 'text/html' }); return s2.end('<html><body><h1>Contact</h1><address>12 Lamar Blvd, Austin TX</address><p>Call 512-555-0142 or email hi@joes.example and we will get back to you within the hour.</p></body></html>'); }
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
const crawled = await sc.scrape(at('/'), { lookup: local });
check('crawl: home plus nav pages (services, contact), facts merged', crawled.summary.pages.length === 3 && crawled.summary.pages.some((pg) => /\/services$/.test(pg.url)) && crawled.summary.contact.address.includes('Lamar'), JSON.stringify(crawled.summary.pages.map((x) => x.url)));
const kinds = new Set(crawled.passages.map((x) => x.kind));
check('crawl: pages split into passages tagged by kind (service, hours, contact…)', crawled.passages.length >= 4 && kinds.has('hours') && kinds.has('contact') && crawled.passages.every((x) => x.text.length <= 590 && x.page), JSON.stringify(crawled.passages.map((x) => [x.kind, x.text.slice(0, 40)])));
check('crawl: nav pages picked by priority, same site only', JSON.stringify(sc.pickPages('<nav><a href="/about">About</a><a href="https://evil.example/x">X</a><a href="/services">Services</a><a href="/blog">Blog</a><a href="/contact-us">Contact</a><a href="/faq">FAQ</a></nav>', new URL('https://joes.example/'), 3).map((x) => x.pathname)) === '["/services","/about","/contact-us"]');
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
const replies = ev.filter((e) => e.event === 'reply');
check('talker: an edit gets one spoken reply from the tiny call, before the ops', replies.length === 1 && replies[0].data.talker === true && replies[0].data.reply === 'Sure, adding two sections now.' && names.indexOf('reply') < names.indexOf('op'), JSON.stringify(replies.map((r) => r.data.reply)));
const workerReq = seen.filter((x) => x.json.stream && !/^You are the voice/.test(x.json.messages[0].content)).at(-1).json;
check('talker: the worker is told the acknowledgement was spoken (reply left empty)', workerReq.messages.at(-1).content.includes('SPOKEN ALREADY') && ev.find((e) => e.event === 'done').data.split === true);
const talkerReq = seen.filter((x) => /^You are the voice/.test(x.json.messages[0].content)).at(-1).json;
check('talker: a tiny call (short fixed prompt, 40 tokens max)', talkerReq.max_tokens === 40 && JSON.stringify(talkerReq.messages).length < 1200);
const tSpans = ev.filter((e) => e.event === 'span').map((e) => e.data.span);
check('talker and worker both show in the waterfall, with token usage incl. cached prefix', tSpans.some((x) => x.name === 'talker.ttft') && tSpans.find((x) => x.name === 'talker.total').meta.cachedTokens === 110 && tSpans.find((x) => x.name === 'inference.total').meta.cachedTokens === 4700);
const tCalls = seen.filter((x) => /^You are the voice/.test(x.json.messages[0].content)).length;
sr = sseRes(); await handler({ method: 'POST', headers: { host: 'a.app', accept: 'text/event-stream' }, body: { message: 'I run a bakery', state: { pages: [] } } }, sr);
check('talker: not used while planning (the reply carries the question)', seen.filter((x) => /^You are the voice/.test(x.json.messages[0].content)).length === tCalls && parseSSE(sr.chunks).filter((e) => e.event === 'reply').length === 1);
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

// 13. intent router (Moss index #1) with a fake Moss client
const mossMod = await import('../api/_moss.js');
const fakeMoss = (scoreFor) => { const f = { created: [], loads: 0, queries: 0, exists: false,
  async loadIndex(name) { f.loads++; if (!f.exists) throw new Error(`Index ${name} not found`); return name; },
  async createIndex(name, docs) { f.created.push({ name, n: docs.length, sample: docs[0] }); f.exists = true; return { indexName: name, docCount: docs.length }; },
  async query(name, q) { f.queries++; return { docs: scoreFor(q) }; } }; return f; };
const doc = (canonical, score) => ({ id: 'x', text: 'x', score, metadata: { canonical } });
const fm = fakeMoss((q) => /pop/.test(q) ? [doc('Make it lively', 0.91), doc('Add some animation', 0.7)] : /colour behind/.test(q) ? [doc('Accent background on the {section}', 0.6), doc('Dark background on the {section}', 0.55)] : /tie/.test(q) ? [doc('Glow on hover', 0.9), doc('Lift on hover', 0.885)] : [doc('Undo', 0.31)]);
mossMod.setClient(fm);
const { trace } = await import('../api/_trace.js');
let tr0 = trace();
let d1 = await mossMod.route('make it pop', tr0, {});
check('router: a missing intent index is built once, then loaded', fm.created.length === 1 && fm.created[0].name === mossMod.INTENT_INDEX && fm.created[0].n > 100 && fm.created[0].sample.metadata.canonical && tr0.spans.some((x) => x.name === 'index.build') && tr0.spans.some((x) => x.name === 'router.load'));
check('router: a confident match runs the command (high)', d1.decision === 'high' && d1.canonical === 'Make it lively');
const loads = fm.loads; await mossMod.route('make it pop', trace(), {});
check('router: the index stays loaded in a warm instance', fm.loads === loads);
check('router: a middle score becomes hints, a low one nothing, a near tie is not trusted', (await mossMod.route('brand colour behind it', trace(), {})).decision === 'mid' && (await mossMod.route('add a pricing page', trace(), {})).decision === 'low' && (await mossMod.route('tie: glow or lift on hover', trace(), {})).decision === 'mid');
const opp = fakeMoss(() => [doc('Smaller buttons', 0.944), doc('Bigger buttons', 0.82)]); opp.exists = true; mossMod.setClient(opp);
const dOpp = await mossMod.route('the buttons need to be bigger', trace(), {});
check('router: keyword guards veto an opposite the embedding confused (bigger ≠ smaller)', dOpp.decision === 'high' && dOpp.canonical === 'Bigger buttons', JSON.stringify(dOpp));
const broken = fakeMoss(() => []); broken.loadIndex = async () => { broken.loads++; throw new Error('Error loading model: fetch failed'); };
mossMod.setClient(broken);
await mossMod.route('make it pop', trace(), {}); await new Promise((r) => setTimeout(r, 5));
const tBroken = Date.now(); const trB = trace(); const dB = await mossMod.route('make it pop', trB, {});
check('router: after a failed load, later turns skip at once instead of waiting and reloading', dB.decision === 'cold' && Date.now() - tBroken < 50 && broken.loads === 1 && trB.spans.some((x) => x.name === 'router.cold' && x.meta && x.meta.failed), `${Date.now() - tBroken} ms, ${broken.loads} loads`);
mossMod.setClient(fm); fm.exists = true;
check('router: one best score per command', JSON.stringify(mossMod.rank([doc('A', 0.5), doc('A', 0.8), doc('B', 0.6)])) === '[{"canonical":"A","score":0.8},{"canonical":"B","score":0.6}]');
// in the handler: on for edits, off while planning or when the page already tried it
Object.assign(process.env, env('moss-test')); delete process.env.MOSS_ROUTER;
let q0 = fm.queries; let calls1 = seen.length;
let hr = sseRes(); await handler({ method: 'POST', headers: { host: 'a.app', accept: 'text/event-stream' }, body: { message: 'make it pop', state: home } }, hr);
let hev = parseSSE(hr.chunks);
check('handler: a router hit skips inference and reports the router span', hev.some((e) => e.event === 'route' && e.data.canonical === 'Make it lively') && seen.length === calls1 && hev.some((e) => e.event === 'span' && e.data.span.name === 'router.query' && e.data.span.meta.decision === 'high'));
await handler({ method: 'POST', headers: { host: 'a.app' }, body: { message: 'brand colour behind the pricing please', state: home } }, mockRes());
check('handler: a middle score adds LIKELY COMMANDS to the prompt', seen.at(-1).json.messages.at(-1).content.includes('LIKELY COMMANDS') && seen.at(-1).json.messages.at(-1).content.includes('Accent background on the {section}'));
q0 = fm.queries;
await handler({ method: 'POST', headers: { host: 'a.app' }, body: { message: 'make it pop', state: { pages: [] } } }, mockRes());
await handler({ method: 'POST', headers: { host: 'a.app' }, body: { message: 'make it pop', state: home, noRoute: true } }, mockRes());
check('handler: no router while planning, or when the page asks for the model (noRoute)', fm.queries === q0);
fm.query = async () => { throw new Error('moss down'); };
let jr2 = mockRes(); await handler({ method: 'POST', headers: { host: 'a.app' }, body: { message: 'make it pop', state: home } }, jr2);
check('handler: a router failure falls through to inference, recorded as a span', jr2.code === 200 && jr2.body.ops.length === 1 && jr2.body.timing.some((x) => x.name === 'router.error'));
mossMod.setClient(null);
process.env = saved;

// 14. site knowledge (Moss index #2) with a fake Moss client
const kn = await import('../api/_knowledge.js');
const now = Date.now();
const kfake = { indexes: new Map([['site-old-1', { name: 'site-old-1', createdAt: new Date(now - 9e7).toISOString(), updatedAt: new Date(now - 9e7).toISOString(), status: 'Ready' }]]), deleted: [], created: [], qs: 0,
  async getIndex(n) { const i = this.indexes.get(n); if (!i) throw new Error('not found'); return i; },
  async listIndexes() { return [...this.indexes.values()]; },
  async deleteIndex(n) { this.deleted.push(n); this.indexes.delete(n); return true; },
  async createIndex(n, docs, o) { this.created.push({ n, docs }); o && o.onProgress && o.onProgress({ status: 'building' }); this.indexes.set(n, { name: n, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: 'Building', docs }); return new Promise((r) => setTimeout(() => { this.indexes.get(n).status = 'Ready'; r({}); }, 30)); },
  async getDocs(n, o) { return (this.indexes.get(n).docs || []).filter((d) => o.docIds.includes(d.id)); },
  async loadIndex(n) { if (!this.indexes.has(n)) throw new Error('not found'); return n; },
  async query(n, q) { this.qs++; const docs = this.indexes.get(n).docs || []; return { docs: docs.map((d) => ({ ...d, score: d.id === '__meta' ? 0.9 : q.split(' ').some((w) => w.length > 3 && d.text.toLowerCase().includes(w)) ? 0.7 : 0.1 })) }; } };
mossMod.setClient(kfake);
check('knowledge: index names are per site', kn.siteIndexName('www.Joes-Plumbing.com') === 'site-joes-plumbing-com');
let ktr = trace();
check('knowledge: an unknown site is not fresh', !(await kn.lookup('joes.example', ktr)).fresh && ktr.spans.some((x) => x.name === 'knowledge.lookup'));
const built = await kn.build('joes.example', crawled.passages, crawled.summary, ktr);
check('knowledge: build uploads passages plus a summary doc, and reports the span', kfake.created[0].n === 'site-joes-example' && kfake.created[0].docs.some((d) => d.id === '__meta') && kfake.created[0].docs.length === crawled.passages.length + 1 && ktr.spans.some((x) => x.name === 'index.build'));
await new Promise((r) => setTimeout(r, 60));
check('knowledge: a site read within 24 h is reused (summary included)', (await kn.lookup('joes.example', trace())).fresh && (await kn.cachedSummary('site-joes-example')).name === crawled.summary.name);
check('knowledge: the stale index is not fresh', !(await kn.lookup('old-1', trace())).fresh);
const facts = await kn.retrieve('site-joes-example', ['opening hours'], ktr);
check('knowledge: retrieval returns relevant passages only, never the summary doc', facts.length >= 1 && facts.every((f) => f.score >= kn.KNOWLEDGE.minScore && !/Site summary/.test(f.text)) && ktr.spans.some((x) => x.name === 'knowledge.query'));
kfake.indexes.set('site-new-one', { name: 'site-new-one', status: 'Building', createdAt: new Date().toISOString(), docs: [{ id: 'p0', text: 'Opening hours Mon-Fri', metadata: { kind: 'hours' } }] });
check('knowledge: an index still building returns nothing (and says so)', (await kn.retrieve('site-new-one', ['opening hours'], ktr)).length === 0 && ktr.spans.some((x) => x.name === 'knowledge.pending'));
check('knowledge: without an index, passages are picked by kind', kn.byKind(crawled.passages).some((x) => x.kind === 'hours'));
for (let i = 0; i < 52; i++) kfake.indexes.set(`site-x${i}`, { name: `site-x${i}`, createdAt: new Date(now - (60 - i) * 1000).toISOString(), status: 'Ready' });
kfake.deleted.length = 0; await kn.build('joes.example', crawled.passages, crawled.summary, trace()); await new Promise((r) => setTimeout(r, 60));
check('knowledge: at most ~50 site indexes, oldest deleted first', kfake.deleted.includes('site-old-1') && kfake.deleted.includes('site-x0') && !kfake.deleted.includes('site-x51'), kfake.deleted.slice(0, 5).join());
// in the agent: mock builds get SITE FACTS; edits on a mocked site only when relevant
Object.assign(process.env, env('moss-test')); process.env.MOSS_ROUTER = 'off';
await handler({ method: 'POST', headers: { host: 'a.app' }, body: { message: 'mock up joes.example', mode: 'mock', state: { pages: [] }, scraped: { ...crawled.summary, passages: crawled.passages, index: { name: 'site-joes-example', ready: true } } } }, mockRes());
const mockPrompt = seen.at(-1).json.messages.at(-1).content;
check('agent: a mock build gets SITE FACTS from the index, without sending all passages', mockPrompt.includes('SITE FACTS') && !mockPrompt.includes('"passages"'), mockPrompt.slice(0, 160));
await handler({ method: 'POST', headers: { host: 'a.app' }, body: { message: 'put our opening hours in the footer', siteIndex: 'site-joes-example', state: home } }, mockRes());
check('agent: a later edit pulls the relevant facts', seen.at(-1).json.messages.at(-1).content.includes('SITE FACTS'));
await handler({ method: 'POST', headers: { host: 'a.app' }, body: { message: 'zzz qq', siteIndex: 'site-joes-example', state: home } }, mockRes());
check('agent: an unrelated edit adds nothing', !seen.at(-1).json.messages.at(-1).content.includes('SITE FACTS'));
await handler({ method: 'POST', headers: { host: 'a.app' }, body: { message: 'add their customer reviews', siteIndex: 'site-joes-example', state: home } }, mockRes());
check('agent: asked for real facts that are not there, Moss is told not to invent them', seen.at(-1).json.messages.at(-1).content.includes('Do NOT invent'));
mossMod.setClient(null);
process.env = saved;

// 14b. warm-up ping primes Moss's prefix cache with the exact system prompt the turns send
{
  const saved2 = process.env; process.env = { ...saved2, ...env('moss-test') };
  const lib2 = [{ id: 'hospitality', name: 'Hospitality', mood: 'warm', fits: 'hotels', colors: {}, type: {}, shape: {}, variants: {}, art: 'orb' }];
  const n0 = seen.length; const out = mockRes();
  await handler({ method: 'POST', headers: { host: 'a.app' }, body: { warm: true, directions: lib2 } }, out);
  const call = seen.slice(n0).find((x) => x.json.max_tokens === 1);
  const turnSystem = buildMessages({ message: 'x', state: {}, directions: lib2 }).at(0).content;
  check('warm-up: primes Moss with the same system prompt a turn sends (1 token)', !!call && call.json.messages[0].content === turnSystem && out.body && out.body.primed === true, out.body && JSON.stringify(out.body).slice(0, 120));
  const n1 = seen.length; process.env.MOSS_PRIME = 'off';
  await handler({ method: 'POST', headers: { host: 'a.app' }, body: { warm: true } }, mockRes());
  check('warm-up: MOSS_PRIME=off skips the priming call', seen.length === n1);
  process.env = saved2;
}

// 15. helpers
check('extractJSON tolerates prose around the object', extractJSON('Sure! {"reply":"ok","ops":[]} Hope that helps.').reply === 'ok');
check('compactState keeps flow names only', JSON.stringify(compactState({ flows: [{ name: 'Booking', nodes: [1, 2] }] }).flows) === '["Booking"]');

server.close();
const failed = results.filter((x) => !x).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
