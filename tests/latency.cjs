// Streaming turns and the latency waterfall, against a fake /api/agent that sends server-sent events with delays.
// Run: node tests/latency.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const results = [];
const check = (name, ok, detail = '') => { results.push(!!ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const sec = (type, data) => ({ op: 'addSection', page: 'home', section: { type, data } });
const SCRIPTS = {
  build: [
    [0, 'span', { span: { name: 'inference.request', start: 2, end: 120 } }],
    [150, 'span', { span: { name: 'inference.ttft', start: 2, end: 150 } }],
    [300, 'reply', { reply: 'Building Crumb, a bakery in Leeds.' }],
    [350, 'op', { op: { op: 'setBusiness', business: { name: 'Crumb', kind: 'bakery', place: 'Leeds', primary: 'Order' } } }],
    [355, 'op', { op: { op: 'setDesign', design: { direction: 'editorial', hue: 30 } } }],
    [360, 'op', { op: { op: 'addPage', page: { id: 'home', name: 'Home' }, navigate: true } }],
    [500, 'op', { op: sec('hero', { headline: 'Bread worth *waking up* for.', sub: 'Sourdough at 4am.', primary: 'Order', eyebrow: 'Leeds' }) }],
    [900, 'op', { op: sec('features', { eyebrow: 'Why', title: 'Slow bread', items: [['leaf', 'Wild yeast', 'Two-day ferment.'], ['clock', 'Baked daily', 'Before sunrise.'], ['cup', 'Coffee too', 'Local roast.'], ['shield', 'No additives', 'Flour, water, salt.']] }) }],
    [1300, 'op', { op: sec('cta', { title: 'Order for Saturday', sub: 'Collect from 7am.', button: 'Order' }) }],
    [1700, 'op', { op: sec('footer', { name: 'Crumb', blurb: 'Leeds', cols: [['Visit', ['Shop']], ['Order', ['Online']], ['Follow', ['Instagram']]], base: '© Crumb' }) }],
    [1750, 'span', { span: { name: 'inference.total', start: 2, end: 1750, meta: { streamed: true } } }],
    [1760, 'done', { after: 'Home is up.', suggestions: ['Warmer colours'], streamed: true }],
  ],
  broken: [
    [0, 'reply', { reply: 'Adding a FAQ and pricing.' }],
    [100, 'op', { op: sec('faq', { eyebrow: 'FAQ', title: 'Good to know', items: [['Gluten free?', 'Some loaves.'], ['Delivery?', 'Leeds only.'], ['Pre-order?', 'Yes.'], ['Cash?', 'Card only.']] }) }],
    [150, 'CUT'],
  ],
  route: [
    [0, 'span', { span: { name: 'router.query', start: 1, end: 6, meta: { score: 0.91 } } }],
    [10, 'route', { canonical: 'Make it lively', score: 0.91 }],
    [12, 'done', { streamed: false, routed: true }],
  ],
  fail: [[0, 'error', { error: 'Moss inference returned 500', status: 502 }]],
};
const seen = [];
const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/api/voice-token') { res.writeHead(503); return res.end('{}'); }
  if (url === '/api/agent') {
    let b = ''; req.on('data', (c) => (b += c));
    req.on('end', async () => {
      const body = JSON.parse(b); if (body.warm) { res.writeHead(200, { 'content-type': 'application/json' }); return res.end('{"warm":false}'); }
      seen.push({ body, accept: req.headers.accept });
      const key = /lively|pop|alive/.test(body.message) && !body.noRoute ? 'route' : /faq/.test(body.message) ? 'broken' : /explode/.test(body.message) ? 'fail' : 'build';
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      const t0 = Date.now(); const send = (ev, data) => res.write(`event: ${ev}\ndata: ${JSON.stringify({ ...data, t: Date.now() - t0 })}\n\n`);
      send('hello', {});
      for (const [at, ev, data] of SCRIPTS[key]) {
        await wait(Math.max(0, at - (Date.now() - t0)));
        if (ev === 'CUT') { res.socket.destroy(); return; }
        send(ev, data);
      }
      res.end();
    });
    return;
  }
  const file = url === '/' ? 'moss-builder.html' : decodeURIComponent(url).replace(/^\/+/, '');
  const full = path.join(ROOT, file);
  if (!full.startsWith(ROOT) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) { res.writeHead(404); return res.end(); }
  const TYPES = { html: 'text/html', js: 'text/javascript', css: 'text/css', woff2: 'font/woff2' };
  res.writeHead(200, { 'content-type': TYPES[file.split('.').pop()] || 'application/octet-stream' }); fs.createReadStream(full).pipe(res);
});

(async () => {
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => {
    window.__spoken = [];
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { speaking: false, speak: (u) => { window.__spoken.push(u.text); setTimeout(() => { u.onstart && u.onstart(); setTimeout(() => u.onend && u.onend(), 200); }, 80); }, cancel() {}, getVoices: () => [], addEventListener() {} } });
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|503/.test(m.text())) errors.push(m.text()); });
  await page.goto(`${base}/?speed=0.03&debug`);
  await page.waitForFunction(() => document.body.dataset.voice);
  const idle = () => page.evaluate(() => window.moss.app.whenIdle());

  check('?debug opens the Latency panel', await page.isVisible('#latPanel'));
  // a voice turn: stopped talking 600 ms before it was sent
  await page.evaluate(() => { window.moss.app.send('build a bakery called Crumb in Leeds', { voice: true, speechEndAt: performance.now() - 600 }); });
  await page.waitForFunction(() => /Building Crumb/.test(document.querySelector('.msg.agent:last-child .text').textContent), null, { timeout: 4000 });
  const early = await page.evaluate(() => (window.moss.pageModel.page('home') || { sections: [] }).sections.length);
  check('the reply shows before the build has finished arriving', early < 4, `${early} sections when the reply appeared`);
  check('…and is spoken right away', (await page.evaluate(() => window.__spoken.some((t) => /Building Crumb/.test(t)))));
  await page.waitForFunction(() => (window.moss.pageModel.page('home') || { sections: [] }).sections.length >= 1 && (window.moss.pageModel.page('home') || { sections: [] }).sections.length < 4, null, { timeout: 3000 });
  check('sections appear one by one while the stream is still open', true);
  await idle();
  check('all streamed sections are built', (await page.evaluate(() => window.moss.pageModel.page('home').sections.map((x) => x.type).join())) === 'hero,features,cta,footer');
  check('the request asked for a stream', /text\/event-stream/.test(seen[0].accept || ''));
  await page.waitForTimeout(400);
  const t1 = JSON.parse(await page.evaluate(() => window.moss.latency.json())).at(-1);
  const names = t1.spans.map((s) => s.name);
  check('waterfall rows: speech, request, server inference spans, applying ops, first audio', ['speech end → send', 'request → first byte', 'inference.request', 'inference.ttft', 'inference.total', 'apply ops', 'first audio · browser'].every((n) => names.includes(n)), names.join(' | '));
  const sp = Object.fromEntries(t1.spans.map((s) => [s.name, s]));
  check('speech end → send is the 600 ms you waited', sp['speech end → send'].ms >= 550 && sp['speech end → send'].ms <= 900, String(sp['speech end → send'].ms));
  check('server spans land after the request starts (clocks lined up)', sp['inference.total'].startMs >= sp['request → first byte'].startMs - 5 && sp['inference.total'].ms >= 1500, JSON.stringify(sp['inference.total']));
  check('each op is its own segment on the build row', sp['apply ops'].parts === 7, String(sp['apply ops'].parts));
  check('the panel draws the turn with bars', (await page.locator('#latTurns .lat-turn').count()) === 1 && (await page.locator('#latTurns .lat-turn[open] .seg').count()) >= 8);
  await page.screenshot({ path: path.join(ROOT, 'screenshots', 'latency-panel.png') });

  await page.evaluate(() => window.moss.app.send('undo')); await idle();
  check('one undo removes the whole streamed turn', (await page.evaluate(() => window.moss.pageModel.get().pages.length)) === 0);
  await page.evaluate(() => window.moss.app.send('build a bakery called Crumb in Leeds')); await idle();

  // a router hit: no inference
  await page.evaluate(() => window.moss.app.send('could it feel a bit more alive')); await idle();
  const t2 = JSON.parse(await page.evaluate(() => window.moss.latency.json())).at(-1);
  check('a router hit runs the command without inference', (await page.evaluate(() => window.moss.pageModel.get().design.motion)) === 'lively' && !t2.spans.some((s) => /^inference/.test(s.name)) && t2.spans.some((s) => s.name === 'router.query'), t2.spans.map((s) => s.name).join());
  check('…and the turn is tagged with the score', /router · 0\.91/.test(await page.locator('#latTurns .lat-turn').first().innerText()));

  // the stream breaks after one op
  await page.evaluate(() => window.moss.app.send('add a faq and pricing')); await idle();
  const faq = await page.evaluate(() => ({ has: window.moss.pageModel.page('home').sections.some((x) => x.type === 'faq'), log: document.querySelector('.msg.agent:last-of-type').textContent }));
  check('a broken stream keeps what was built and says so', faq.has && /stopped part-way/.test(faq.log), faq.log.slice(-120));
  await page.evaluate(() => window.moss.app.send('undo')); await idle();
  check('…and undo removes it', !(await page.evaluate(() => window.moss.pageModel.page('home').sections.some((x) => x.type === 'faq'))));

  // an error before anything arrived falls back to the offline agent
  await page.evaluate(() => window.moss.app.send('explode the hero')); await idle();
  check('an error before the reply falls back to the offline agent', /offline demo agent/.test(await page.locator('.msg.agent').last().innerText()));

  const stats = await page.evaluate(() => window.moss.latency.stats());
  const total = stats.find((s) => s.name === 'turn total');
  check('p50 / p95 over the kept turns', total && total.n >= 5 && total.p50 > 0 && total.p95 >= total.p50 && (await page.locator('#latStats tbody tr').count()) >= 5);
  check('no console/page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();

  // Kokoro (open-source voice in the browser), with a fake worker and fake audio
  const ctxK = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctxK.addInitScript(() => {
    window.__worker = { msgs: [], failSpeak: false };
    window.Worker = class { constructor(url, o) { window.__worker.opts = o; this.onmessage = null; }
      postMessage(m) { window.__worker.msgs.push(m); const send = (d, ms) => setTimeout(() => this.onmessage && this.onmessage({ data: d }), ms);
        if (m.type === 'load') { send({ type: 'progress', file: 'model.onnx', loaded: 46, total: 92 }, 20); send({ type: 'ready', device: m.device }, 250); }
        if (m.type === 'speak') send(window.__worker.failSpeak ? { type: 'error', id: m.id, error: 'synth failed' } : { type: 'audio', id: m.id, wav: new ArrayBuffer(64) }, 60); } };
    window.__plays = [];
    window.Audio = class { constructor(src) { this.src = src; } play() { window.__plays.push(this.src); setTimeout(() => this.onended && this.onended(), 150); return Promise.resolve(); } pause() {} };
    window.__spoken = [];
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { speaking: false, speak: (u) => { window.__spoken.push(u.text); setTimeout(() => u.onstart && u.onstart(), 30); }, cancel() {}, getVoices: () => [], addEventListener() {} } });
  });
  const pk = await ctxK.newPage(); const errK = []; pk.on('pageerror', (e) => errK.push(e.message));
  await pk.goto(`${base}/?speed=0.03&debug&voice=kokoro`);
  await pk.waitForFunction(() => window.__worker.msgs.some((m) => m.type === 'load'), null, { timeout: 3000 });
  check('?voice=kokoro loads Kokoro in a module worker (WASM by default)', (await pk.evaluate(() => window.__worker.opts && window.__worker.opts.type === 'module' && window.__worker.msgs[0].device === 'wasm')));
  await pk.waitForFunction(() => /Kokoro \d+%/.test(document.querySelector('#latVoice').textContent), null, { timeout: 2000 }).catch(() => {});
  const prog = await pk.locator('#latVoice').textContent();
  await pk.waitForFunction(() => window.moss.voice.kokoro().state === 'ready', null, { timeout: 3000 });
  check('download progress shows on the Voice switch, then Kokoro is ready and selected', /Kokoro 50%/.test(prog) && (await pk.getAttribute('#latVoice [data-voice="kokoro"]', 'aria-pressed')) === 'true' && (await pk.evaluate(() => window.moss.voice.engine())) === 'kokoro', prog);
  await pk.evaluate(() => window.moss.app.send('build a bakery called Crumb in Leeds', { voice: true, speechEndAt: performance.now() - 300 }));
  await pk.evaluate(() => window.moss.app.whenIdle()); await pk.waitForTimeout(700);
  const kt = JSON.parse(await pk.evaluate(() => window.moss.latency.json())).at(-1);
  check('Moss speaks with Kokoro, sentence by sentence, not the browser voice', (await pk.evaluate(() => window.__worker.msgs.filter((m) => m.type === 'speak').length)) >= 1 && (await pk.evaluate(() => window.__plays.length)) >= 1 && (await pk.evaluate(() => window.__spoken.length)) === 0);
  check('the waterfall labels first audio with the engine (Kokoro)', kt.spans.some((x) => x.name === 'first audio · kokoro'), kt.spans.map((x) => x.name).join());
  await pk.evaluate(() => { window.__worker.failSpeak = true; window.moss.voice.speak('One more thing. And another.'); });
  await pk.waitForTimeout(900);
  check('if Kokoro fails, it falls back (here to the browser voice) and the switch says so', (await pk.evaluate(() => window.__spoken.length)) >= 1 && (await pk.evaluate(() => window.moss.voice.kokoro().state)) === 'failed' && /failed/.test(await pk.locator('#latVoice').textContent()));
  await pk.click('#latVoice [data-voice="browser"]');
  check('the switch remembers the choice', (await pk.evaluate(() => localStorage.getItem('moss-voice'))) === 'browser' && (await pk.evaluate(() => window.moss.voice.engine())) === 'browser');
  check('no page errors (Kokoro)', errK.length === 0, errK.join(' | '));
  await ctxK.close();

  // phone: the panel fits
  const ctx2 = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const p2 = await ctx2.newPage(); await p2.goto(`${base}/?speed=0.03&debug`);
  const box = await p2.evaluate(() => { const r = document.querySelector('#latPanel').getBoundingClientRect(); return { l: r.left, r: r.right, w: innerWidth }; });
  check('on a phone the panel fits the screen', box.l >= 0 && box.r <= box.w, JSON.stringify(box));
  await ctx2.close();

  await browser.close(); server.close();
  const failed = results.filter((x) => !x).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); server.close(); process.exit(1); });
