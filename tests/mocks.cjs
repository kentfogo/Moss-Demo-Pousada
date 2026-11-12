// "Mock up joesplumbing.com": the builder reads the site (mock /api/scrape), Moss redesigns it (mock /api/agent),
// and the A/B/C switcher flips between three looks without calling the model. Run: node tests/mocks.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const results = [];
const check = (name, ok, detail = '') => { results.push(!!ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

const SCRAPED = {
  url: 'https://joesplumbing.com/', name: "Joe's Plumbing", title: "Joe's Plumbing | Austin Plumbers", description: 'Fast, fair plumbing in Austin since 1998.',
  h1: ['Leaks fixed and drains cleared today'], headings: ['Our services', 'Why Austin calls Joe'], nav: ['Home', 'Services', 'Reviews', 'Contact'],
  paragraphs: ['Family-run since 1998, we serve all of Austin with upfront pricing.', 'Every job comes with a one-year guarantee and a tidy van.'],
  items: ['Emergency leak repair', 'Drain cleaning', 'Water heater installs', 'Repiping'], contact: { phone: '512-555-0142', email: 'hi@joesplumbing.com', address: '12 Lamar Blvd, Austin' },
  hours: ['Mon-Fri 8am-6pm'], prices: ['$89'], quotes: ['Joe came out at midnight and fixed our burst pipe in an hour.'], brandColor: '#1f6feb', brandHue: 216,
};
const MODEL = {
  reply: "Here's Joe's Plumbing in three looks.",
  ops: [
    { op: 'setBusiness', business: { name: "Joe's Plumbing", kind: 'plumber', place: 'Austin', primary: 'Call 512-555-0142' } },
    { op: 'setDesign', design: { direction: 'luxury' } }, // ignored in mock mode: look A applies
    { op: 'addSection', page: 'home', section: { type: 'hero', data: { variant: 'editorial', eyebrow: 'Austin plumbers since 1998', headline: 'Leaks fixed *today*.', sub: 'Upfront prices and a one-year guarantee.', primary: 'Call 512-555-0142', secondary: 'Our services' } } },
    { op: 'addSection', page: 'home', section: { type: 'features', data: { eyebrow: 'Services', title: 'What we fix', lede: '', items: [['bolt', 'Emergency leaks', 'Day or night.'], ['clock', 'Drain cleaning', 'Same day.'], ['shield', 'Water heaters', 'Installed and guaranteed.'], ['leaf', 'Repiping', 'Done tidy.']] } } },
    { op: 'addSection', page: 'home', section: { type: 'callStrip', title: 'Burst pipe?', sub: 'Mon-Fri 8am-6pm', phone: '512-555-0142', button: 'Call now' } }, // fields not under "data", as models sometimes send
    { op: 'addSection', page: 'home', section: { type: 'footer', data: { name: "Joe's Plumbing", blurb: 'Austin', cols: [['Visit', ['Home']], ['Call', ['512-555-0142']], ['Mail', ['hi@joesplumbing.com']]], base: '© Joe' } } },
    { op: 'setMocks', source: 'joesplumbing.com', looks: [{ direction: 'trade', name: 'Trade, your blue', why: 'Bold and local', hue: 216, variants: { hero: 'editorial' } }, { direction: 'swiss', name: 'Clean grid', why: 'Calm and clear', hue: 20, variants: { hero: 'bigtype', features: 'cards' } }, { direction: 'playful', name: 'Friendly', why: 'Warm', hue: 140, motion: 'lively' }, { direction: 'made-up' }] },
  ],
};
const seen = { scrape: [], agent: [] };
let scrapeFail = false;
const server = http.createServer((req, res) => {
  const [url, qs] = req.url.split('?');
  if (url === '/api/scrape') { seen.scrape.push(new URLSearchParams(qs).get('url')); if (scrapeFail) { res.writeHead(422, { 'content-type': 'application/json' }); return res.end('{"error":"That link is not a web page."}'); } res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify(SCRAPED)); }
  if (url === '/api/agent') { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => { if (JSON.parse(b).warm) { res.writeHead(200, { 'content-type': 'application/json' }); return res.end('{}'); } seen.agent.push(JSON.parse(b)); res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(MODEL)); }); return; }
  if (url === '/api/voice-token') { res.writeHead(503); return res.end('{}'); }
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
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto(`${base}/?speed=0.03`);
  const idle = () => page.evaluate(() => window.moss.app.whenIdle());
  const say = async (t) => { await page.evaluate((x) => window.moss.app.send(x), t); await idle(); };

  // which messages count as "redesign this site"
  const sites = await page.evaluate(() => ['Mock up joesplumbing.com', 'redesign joes plumbing dot com', 'https://www.acme.co.uk/about', 'can you make a better version of bobsbakery.net', 'I sell coffee and my domain is beans.com', 'add a FAQ'].map((t) => window.moss.agent ? window.moss.agent.siteIn(t) : null));
  check('spots a site to redesign ("mock up x.com", "dot com", a bare URL, "make a better version")', sites[0] === 'joesplumbing.com' && sites[1] === 'joesplumbing.com' && sites[2] === 'https://www.acme.co.uk/about' && sites[3] === 'bobsbakery.net', JSON.stringify(sites));
  check('…but not a domain mentioned in passing, or normal requests', sites[4] === null && sites[5] === null);

  await say('Mock up joesplumbing.com');
  check('reads the site first', seen.scrape[0] === 'joesplumbing.com');
  const req = seen.agent[0] || {};
  check('then asks Moss in mock mode with the scraped facts', req.mode === 'mock' && req.scraped && req.scraped.name === "Joe's Plumbing");
  const st = await page.evaluate(() => { const s = window.moss.pageModel.get(); return { name: s.business && s.business.name, secs: s.pages[0] && s.pages[0].sections.map((x) => x.type), mocks: s.mocks, dir: s.design && s.design.direction }; });
  check('builds the redesign from the real content', st.name === "Joe's Plumbing" && JSON.stringify(st.secs) === '["hero","features","callStrip","footer"]', JSON.stringify(st.secs));
  check('section fields sent without "data" are kept, not replaced by defaults', (await page.evaluate(() => window.moss.pageModel.get().pages[0].sections.find((x) => x.type === 'callStrip').data.phone)) === '512-555-0142');
  check('three looks, unknown directions dropped, look A applied (not the stray setDesign)', st.mocks && st.mocks.looks.length === 3 && st.mocks.active === 0 && st.dir === 'trade', JSON.stringify(st.mocks && st.mocks.looks.map((x) => x.direction)));
  const bar = await page.evaluate(() => ({ hidden: document.querySelector('#mockBar').hidden, buttons: [...document.querySelectorAll('#mockBar button[data-say]')].map((b) => b.textContent), pressed: document.querySelector('#mockBar [aria-pressed="true"]').textContent }));
  check('the A/B/C switcher shows in the frame bar', !bar.hidden && bar.buttons.length === 4 && /^A/.test(bar.pressed), JSON.stringify(bar));
  await page.waitForTimeout(1500); await page.screenshot({ path: path.join(ROOT, 'screenshots', 'mocks-a.png') });

  const calls = seen.agent.length;
  await page.click('#mockBar button[data-say="Show me B"]'); await idle();
  const b = await page.evaluate(() => ({ dir: window.moss.pageModel.get().design.direction, active: window.moss.pageModel.get().mocks.active, site: document.querySelector('#site').dataset.direction }));
  check('B re-skins the same sections', b.dir === 'swiss' && b.active === 1 && b.site === 'swiss', JSON.stringify(b));
  await page.waitForTimeout(1500); await page.screenshot({ path: path.join(ROOT, 'screenshots', 'mocks-b.png') });
  await say('C');
  check('saying "C" shows look C', (await page.evaluate(() => window.moss.pageModel.get().design.direction)) === 'playful');
  check('…and switching looks never calls the model', seen.agent.length === calls);
  await say('go with B');
  const kept = await page.evaluate(() => ({ dir: window.moss.pageModel.get().design.direction, mocks: window.moss.pageModel.get().mocks, hidden: document.querySelector('#mockBar').hidden }));
  check('"go with B" picks B and closes the switcher', kept.dir === 'swiss' && kept.mocks === null && kept.hidden);
  await say('undo');
  check('undo brings the switcher back', (await page.evaluate(() => !!window.moss.pageModel.get().mocks && !document.querySelector('#mockBar').hidden)));
  check('still no model calls', seen.agent.length === calls);

  // a site that can't be read
  scrapeFail = true;
  await say('redesign brokensite.com');
  check('a site that can\'t be read gets a friendly answer and changes nothing', /couldn.t read brokensite\.com/i.test(await page.locator('.msg.agent').last().innerText()) && seen.agent.length === calls && (await page.evaluate(() => window.moss.pageModel.get().business.name)) === "Joe's Plumbing");
  scrapeFail = false;
  const n = await page.evaluate(() => window.moss.agent.normalize({ reply: 'x', ops: [{ op: 'setMocks', looks: [{ direction: 'trade', hue: 254 }, { direction: 'brutalist', hue: 254 }, { direction: 'minimal', hue: 250 }, { direction: 'trade', hue: 10 }] }] }, window.moss.pageModel.get(), 'x').ops[0]);
  check('near-miss direction names map to real ones, and B/C get their own hues', n && n.looks.map((l) => l.direction).join() === 'trade,brutal,swiss' && n.looks[1].hue !== 254 && n.looks[2].hue !== 250, JSON.stringify(n && n.looks.map((l) => [l.direction, l.hue])));
  check('no console/page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();

  // offline (no Moss): the builder still makes mocks from the scraped facts, without inventing reviews or prices
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx2.route('**/api/agent', (r) => r.fulfill({ status: 503, body: '{"error":"not configured"}' }));
  const p2 = await ctx2.newPage(); const err2 = []; p2.on('pageerror', (e) => err2.push(e.message));
  await p2.goto(`${base}/?speed=0.03`);
  await p2.evaluate(() => window.moss.app.send('mock up joesplumbing.com')); await p2.evaluate(() => window.moss.app.whenIdle());
  const off = await p2.evaluate(() => { const s = window.moss.pageModel.get(); const home = s.pages[0]; const get = (t) => home.sections.find((x) => x.type === t); return { name: s.business.name, types: home.sections.map((x) => x.type), hero: get('hero').data.headline, feats: get('features') && get('features').data.items.map((i) => i[1]), quote: get('testimonials') && get('testimonials').data.items.length, phone: get('callStrip') && get('callStrip').data.phone, looks: s.mocks && s.mocks.looks.map((l) => l.hue) }; });
  check('offline mock uses the real headline, services and phone', off.name === "Joe's Plumbing" && off.hero === 'Leaks fixed and drains cleared today' && JSON.stringify(off.feats) === JSON.stringify(SCRAPED.items) && off.phone === '512-555-0142', JSON.stringify(off));
  check('…only the real review, and no made-up pricing or FAQ', off.quote === 1 && !off.types.includes('pricing') && !off.types.includes('faq'), JSON.stringify(off.types));
  check('…look A keeps their brand hue', off.looks && off.looks.length === 3 && off.looks[0] === 216);
  check('no page errors offline', err2.length === 0, err2.join(' | '));
  await ctx2.close();

  await browser.close(); server.close();
  const failed = results.filter((x) => !x).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); server.close(); process.exit(1); });
