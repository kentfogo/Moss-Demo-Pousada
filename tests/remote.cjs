// Drives moss-builder.html over http against a mock /api/agent that returns realistic (imperfect) model
// output, to check the client-side normalizer, rendering, flow layout and offline fallback.
// Run: node tests/remote.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const results = [];
const check = (name, ok, detail = '') => { results.push(!!ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

const requests = [];
const REPLIES = {
  build: {
    reply: 'Miradouro, a rooftop bar in Porto. Laying out @Home for @Miradouro now.',
    ops: [
      { op: 'setBusiness', business: { name: 'Miradouro', kind: 'rooftop cocktail bar', place: 'Porto', announce: { tag: 'New', text: 'Sunset sessions every Friday' }, primary: 'Book a table' } },
      { op: 'addPage', page: { id: 'home', name: 'Home' }, navigate: true },
      { op: 'addSection', page: 'home', section: { type: 'hero', data: { variant: 'split', eyebrow: 'Rooftop bar · Porto', headline: 'The best seat in Porto is up here.', sub: 'Cocktails built on Portuguese spirits, served six floors above the Ribeira.', primary: 'Book a table', secondary: 'See the menu',
        card: { title: 'Tonight', tag: 'Open', rows: [{ label: 'Sunset', value: '20:41' }, { label: 'Tables left', value: '6' }, { label: 'DJ', value: 'from 22:00' }], cta: 'Book a table', note: 'Walk-ins welcome until 19:00' } } } },
      { op: 'addSection', page: 'home', section: { type: 'features', data: { eyebrow: 'Why come up', title: 'Built for long evenings.', lede: 'Small menu, big view.', items: [{ icon: 'cup', title: 'Port tonic, reworked', text: 'Our house white port with yuzu.' }, { icon: 'wave', title: 'River views', text: 'Every table faces the Douro.' }, { icon: 'clock', title: 'Open late', text: 'Until 2am on weekends.' }, { icon: 'shield', title: 'Heated terrace', text: 'Warm even in November.' }] } } },
      { op: 'addSection', page: 'home', section: { type: 'testimonials', data: { eyebrow: 'Guests', title: 'Overheard upstairs.', items: [['Best sunset in the city.', 'Ana', 'Lisbon'], ['The port tonic converted me.', 'Tom', 'London'], ['We stayed four hours.', 'Inês', 'Porto']] } } },
      { op: 'addSection', page: 'home', section: { type: 'stats', data: { items: 'nope' } } },
      { op: 'addSection', page: 'home', section: { type: 'cta', data: { eyebrow: 'Tonight', title: 'Come up for sunset.', sub: 'Tables go fast on Fridays.', button: 'Book a table', href: 'javascript:alert(1)' } } },
      { op: 'addSection', page: 'home', section: { type: 'footer', data: { name: 'Miradouro', blurb: 'Six floors up.', cols: [['Visit', ['Menu', 'Book']], ['Follow', ['Instagram']], ['Info', ['Contact']]], base: '© 2026 Miradouro' } } },
      { op: 'explode', page: 'home' },
      { op: 'addSection', page: 'nowhere', section: { type: 'faq', data: {} } },
    ],
    suggestions: ['Make the headline punchier', 'Map the reservation flow'],
  },
  punchier: { reply: 'Shorter and sharper.', ops: [{ op: 'updateSection', page: 'home', id: 'hero', patch: { headline: 'Porto, from above.' }, note: 'rewrote headline' }] },
  reorder: { reply: 'Testimonials now lead.', ops: [{ op: 'setOrder', page: 'home', order: ['hero', 'testimonials', 'features', 'stats', 'cta', 'footer'] }] },
  flow: { reply: 'Mapping reservations.', ops: [{ op: 'setView', view: 'flow' }, { op: 'addFlow', flow: { name: 'Reservation flow', nodes: [{ id: 'a', label: 'Guest opens site', kind: 'start' }, { id: 'b', label: 'Picks a time', kind: 'step' }, { id: 'c', label: 'Table free?', kind: 'decision' }, { id: 'd', label: 'Confirms booking', kind: 'step' }, { id: 'e', label: 'Joins waitlist', kind: 'step' }, { id: 'f', label: 'Gets confirmation', kind: 'end' }], edges: [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }, { from: 'c', to: 'd', label: 'yes' }, { from: 'c', to: 'e', label: 'no' }, { from: 'd', to: 'f' }, { from: 'e', to: 'b' }, { from: 'zz', to: 'a' }] } }] },
  bakery: { reply: 'Let us plan it. What do you want to be known for?', ops: [{ op: 'setBusiness', business: { name: 'Crumb', kind: 'bakery', place: 'Leeds', primary: 'Order' } }, { op: 'startPlan', brief: { business: 'Crumb, a bakery in Leeds' } }, { op: 'askQuestion', id: 'offer', question: 'What do you want people to know you for?', options: ['Sourdough', 'Pastries', 'Cakes'], why: 'Headline' }] },
  sourdough: { reply: 'Here is the plan. Which look?', ops: [{ op: 'setBrief', patch: { offer: 'Sourdough baked at 4am' } }, { op: 'setPlan', summary: 'Crumb sells sourdough.', sections: [{ type: 'hero', variant: 'bigtype', intent: 'Lead with the bread' }, { type: 'gallery', intent: 'Loaves' }, { type: 'callstrip', intent: 'Order by phone' }, { type: 'nonsense' }, { type: 'footer', intent: 'Links' }], directions: [{ direction: 'editorial', name: 'Paper and flour', why: 'Warm', hue: 30 }, { direction: 'brutal', name: 'Loud loaf', why: 'Bold', hue: 350 }, { direction: 'made-up', name: 'Nope' }] }] },
  wipeAbout: { reply: 'Removing @About.', ops: [{ op: 'deleteSection', page: 'about-us', id: 'hero' }, { op: 'deleteSection', page: 'about-us', id: 'footer' }] },
  restyleDark: { reply: 'Going dark.', ops: [{ op: 'setDesign', design: { direction: 'darktech', colors: { bg: '#07090c', surface: '#10151b', ink: '#e8edf2', muted: '#98a4b0', accent: '#5ccfee', accent2: '#1a2a33', inverse: '#10151b' } } }] },
  startOver: { reply: 'Starting over.', ops: [{ op: 'resetSite' }, { op: 'setBusiness', business: { name: 'Miradouro', kind: 'rooftop bar', place: 'Porto', primary: 'Book' } }, { op: 'setDesign', design: { direction: 'swiss', hue: 200 } }, { op: 'addPage', page: { id: 'home', name: 'Home' } }, { op: 'addSection', page: 'home', section: { type: 'hero', data: { headline: 'Porto, *six floors up*.', sub: 'Cocktails with a view.', primary: 'Book', secondary: 'Menu', eyebrow: 'Rooftop bar' } } }] },
  about: { reply: 'Adding @About.', ops: [{ op: 'setView', view: 'page' }, { op: 'addPage', page: { id: 'About Us', name: 'About' } }, { op: 'addSection', page: 'about-us', section: { type: 'hero', data: { variant: 'centered', eyebrow: 'About', headline: 'Two bartenders and a very good view.', sub: 'Opened in 2021.' } } }, { op: 'addSection', page: 'about-us', section: { type: 'footer', data: {} } }] },
};

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/voice-token')) { res.writeHead(503, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ error: 'Deepgram is not configured (set DEEPGRAM_API_KEY)' })); } // like a deploy without a key
  if (req.method === 'POST' && req.url === '/api/agent') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const json = JSON.parse(body); if (json.warm) { res.writeHead(200, { 'content-type': 'application/json' }); return res.end('{}'); } requests.push(json);
      const m = json.message.toLowerCase();
      if (m.includes('slow')) { setTimeout(() => { try { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(REPLIES.about)); } catch (e) {} }, 2500); return; }
      if (m.includes('fail')) { res.writeHead(500, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ error: 'Moss inference returned 500' })); }
      const key = m.includes('bakery') ? 'bakery' : m.includes('sourdough') ? 'sourdough' : m.includes('everything off') ? 'wipeAbout' : m.includes('dark') ? 'restyleDark' : m.includes('start over') ? 'startOver' : m.includes('rooftop') ? 'build' : m.includes('punch') ? 'punchier' : m.includes('move') ? 'reorder' : m.includes('flow') ? 'flow' : 'about';
      res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(REPLIES[key]));
    });
    return;
  }
  const pathname = decodeURIComponent(req.url.split('?')[0]);
  const file = pathname === '/' ? 'moss-builder.html' : pathname.replace(/^\/+/, '');
  const full = path.join(ROOT, file);
  if (!full.startsWith(ROOT) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) { res.writeHead(404); return res.end(); }
  const TYPES = { html: 'text/html', js: 'text/javascript', css: 'text/css', woff2: 'font/woff2', json: 'application/json', png: 'image/png' };
  res.writeHead(200, { 'content-type': TYPES[file.split('.').pop()] || 'application/octet-stream' }); fs.createReadStream(full).pipe(res);
});

(async () => {
  await new Promise((r) => server.listen(0, r));
  const url = `http://127.0.0.1:${server.address().port}/?speed=0.03`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // The deliberate 500 below makes the browser log a failed resource; anything else is a real error.
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource: .*(500|503)/.test(m.text())) errors.push(m.text()); });
  let alerted = false; page.on('dialog', (d) => { alerted = true; d.dismiss(); });
  await page.goto(url);
  const say = async (t) => {
    const sel = (await page.locator('#chatInput').isVisible()) ? '#chatInput' : '#introInput';
    await page.fill(sel, t); await page.press(sel, 'Enter'); await page.waitForTimeout(60);
    await page.evaluate(() => window.moss.app.whenIdle());
  };
  const types = () => page.$$eval('#siteSections > section', (els) => els.map((e) => e.dataset.type));

  check('remote mode on over http', await page.evaluate(() => window.moss.agent.isRemote()));
  await say('A rooftop bar in Porto called Miradouro');
  check('request carried the message and a slim state', requests[0] && requests[0].message.includes('rooftop') && Array.isArray(requests[0].state.pages) && Array.isArray(requests[0].history));
  const t1 = await types();
  check('model sections rendered; bad page and unknown op dropped', JSON.stringify(t1) === JSON.stringify(['hero', 'features', 'testimonials', 'stats', 'cta', 'footer']), t1.join(','));
  check('model copy used', (await page.locator('.sec-hero h1').innerText()) === 'The best seat in Porto is up here.');
  const r1 = await page.locator('.msg.agent .text:not(.after)').first().innerText();
  check('@ kept for pages, dropped for the business name', r1.includes('@Home') && r1.includes('for Miradouro'), r1);
  check('object-shaped items accepted (features, card rows)', (await page.locator('.feat h3').first().innerText()) === 'Port tonic, reworked' && (await page.locator('.hero-card dd').first().innerText()) === '20:41');
  check('junk stats data falls back to defaults', (await page.locator('.stat').count()) === 3);
  const href = await page.getAttribute('.cta-band a.btn', 'href');
  check('javascript: href stripped', href === '#/home', href);
  check('business name and primary CTA in site nav', (await page.locator('.s-brand').first().innerText()).includes('Miradouro') && (await page.locator('.s-nav .btn').innerText()) === 'Book a table');
  check('model suggestions shown', (await page.locator('#suggest .chip').count()) === 2);

  await say('make the headline punchier');
  check('updateSection by type reference', (await page.locator('.sec-hero h1').innerText()) === 'Porto, from above.');
  check('history sent on later turns', requests.at(-1).history.length >= 2 && requests.at(-1).state.business && !requests.at(-1).state.business.copy);

  await say('move testimonials above features');
  const t2 = await types();
  check('setOrder by type references', t2[1] === 'testimonials' && t2[2] === 'features', t2.join(','));

  await say('map the reservation flow');
  const flow = await page.evaluate(() => {
    const f = window.moss.pageModel.get().flows[0];
    const boxes = [...document.querySelectorAll('#nodeLayer .fnode')].map((e) => [e.offsetLeft, e.offsetTop, e.offsetWidth, e.offsetHeight]);
    let overlap = false;
    boxes.forEach((a, i) => boxes.forEach((b, j) => { if (i < j && a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3]) overlap = true; }));
    return { nodes: f.nodes.length, edges: f.edges.length, overlap, view: window.moss.app.view() };
  });
  check('freeform flow laid out without overlaps', flow.nodes === 6 && flow.edges === 6 && !flow.overlap && flow.view === 'flow', JSON.stringify(flow));

  const wrap = await page.evaluate(() => {
    const nodes = Array.from({ length: 8 }, (_, i) => ({ id: 'n' + i, label: 'Step ' + i, kind: i === 0 ? 'start' : i === 7 ? 'end' : 'step' }));
    const edges = nodes.slice(1).map((n, i) => ({ from: 'n' + i, to: n.id }));
    window.moss.agent.layoutFlow(nodes, edges);
    return nodes.map((n) => [n.x, n.y]);
  });
  check('long flows wrap straight down, then run right to left', wrap[5][0] === wrap[4][0] && wrap[5][1] > wrap[4][1] && wrap[6][0] < wrap[5][0], JSON.stringify(wrap));

  await say('add an about page');
  const pages = await page.evaluate(() => window.moss.pageModel.get().pages.map((p) => p.id + ':' + p.sections.length));
  check('page id slugged, sections filled', pages.includes('about-us:2'), pages.join(','));

  // one-step page removal: per-section deletes that empty a page collapse into a single deletePage
  const logBefore = await page.locator('.log li').count();
  await say('take everything off the about page');
  const afterWipe = await page.evaluate(() => window.moss.pageModel.get().pages.map((p) => p.id));
  const wipeLog = await page.locator('.msg.agent').last().locator('.log li').allInnerTexts();
  check('emptying a page section by section becomes one deletePage', !afterWipe.includes('about-us') && wipeLog.length === 1 && /removed/.test(wipeLog[0]), wipeLog.join(' | '));
  await say('undo');

  // a direction's sample palette sent back unchanged is re-derived, so sites don't share a scheme
  await say('make it dark');
  const dark = await page.evaluate(() => { const d = window.moss.pageModel.get().design; return { direction: d.direction, colors: d.colors, readable: MossSite.ratio(d.colors.ink, d.colors.bg) >= 4.5 }; });
  check('copied sample colours are replaced by a generated palette', dark.direction === 'darktech' && dark.colors.accent !== '#5ccfee' && dark.readable, JSON.stringify(dark.colors));
  await say('undo');

  await say('undo');
  check('undo stays local (no request)', !requests.at(-1).message.includes('undo'));

  const before = requests.length;
  await say('please fail now');
  const lastReply = await page.locator('.msg.agent .text:not(.after)').last().innerText();
  check('endpoint error falls back to offline agent with a notice', lastReply.includes('offline demo agent') && requests.length === before + 1, lastReply.slice(0, 90));
  await say('make the headline punchier');
  check('remote retried on the next message after a 500', requests.length === before + 2 && (await page.evaluate(() => window.moss.agent.isRemote())));

  // interrupting while Moss is thinking aborts the request: no ops, no offline fallback, and Moss is told
  const pagesBefore = await page.evaluate(() => window.moss.pageModel.get().pages.length);
  const userBefore = await page.locator('.msg.user').count();
  page.evaluate(() => window.moss.app.send('slow: add a gallery page'));
  await page.waitForTimeout(400);
  await page.evaluate(() => window.moss.app.interrupt());
  await page.waitForTimeout(2600);
  const stopped = await page.locator('.msg.agent').last().innerText();
  check('interrupt while thinking aborts the request cleanly', (await page.evaluate(() => window.moss.pageModel.get().pages.length)) === pagesBefore && stopped.includes('before any changes') && !stopped.includes('offline demo agent'), stopped.replace(/\s+/g, ' ').slice(0, 80));
  await say('make the headline punchier');
  check('the next request tells Moss it was interrupted', JSON.stringify(requests.at(-1).history).includes('[Interrupted by the user before any changes.]') && (await page.locator('.msg.user').count()) === userBefore + 2);

  // "start over" clears everything in one step, then rebuilds
  await say('start over please');
  const fresh = await page.evaluate(() => { const s = window.moss.pageModel.get(); return { pages: s.pages.map((p) => p.id + ':' + p.sections.length), dir: s.design && s.design.direction, hue: s.design && s.design.hue, flows: s.flows.length }; });
  check('resetSite then rebuild leaves only the new site', JSON.stringify(fresh.pages) === '["home:1"]' && fresh.dir === 'swiss' && fresh.hue === 200 && fresh.flows === 0, JSON.stringify(fresh));
  check('accent words in headlines render', (await page.locator('.sec-hero h1 em.acc').innerText()) === 'six floors up');

  // plan mode on Moss: interview ops are cleaned and shown on the board
  await page.goto(url);
  await say('Help me build a site for my bakery');
  check('plan mode is sent to Moss for a new site', requests.at(-1).mode === 'plan');
  check('Moss\'s question appears on the Brief board with its options', (await page.locator('.pb-q p').innerText()).includes('know you for') && (await page.locator('.pb-q .chip').count()) === 4);
  await say('Sourdough baked at 4am');
  const mp = await page.evaluate(() => window.moss.pageModel.get().plan);
  check('setPlan from Moss is cleaned (types fixed, junk dropped)', mp.phase === 'proposed' && JSON.stringify(mp.sections.map((x) => x.type)) === '["hero","gallery","callStrip","footer"]' && mp.directions.length === 2 && mp.brief.offer === 'Sourdough baked at 4am', JSON.stringify(mp.sections.map((x) => x.type)));
  check('the look cards render', (await page.locator('.pb-dir').count()) === 2);

  check('no alert fired', !alerted);
  check('no console/page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close(); server.close();
  const failed = results.filter((x) => !x).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); server.close(); process.exit(1); });
