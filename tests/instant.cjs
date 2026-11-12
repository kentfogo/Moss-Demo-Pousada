// Instant commands in the live app: navigation, undo and quick styles are answered in the browser with no server
// call and no artificial pause, shown as "On the page" (not retrieval). Run: node tests/instant.cjs
const { chromium } = require('playwright'); const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const results = [];
const check = (name, ok, detail = '') => { results.push(!!ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
const site = { reply: 'Built.', ops: [
  { op: 'setBusiness', business: { name: 'Crumb', kind: 'bakery', place: 'Leeds', primary: 'Order' } },
  { op: 'addPage', page: { id: 'home', name: 'Home' }, navigate: true }, { op: 'addSection', page: 'home', section: { type: 'hero', data: { headline: 'Bread' } } },
  { op: 'addPage', page: { id: 'opening-hours', name: 'Opening hours' } }, { op: 'addSection', page: 'opening-hours', section: { type: 'hero', data: { headline: 'Hours' } } },
  { op: 'addPage', page: { id: 'menu', name: 'Menu' } }, { op: 'addSection', page: 'menu', section: { type: 'hero', data: { headline: 'Menu' } } },
] };
let agentCalls = 0;
const srv = http.createServer((req, res) => {
  const u = req.url.split('?')[0];
  if (u === '/api/agent') { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => { const j = JSON.parse(b); res.writeHead(200, { 'content-type': 'application/json' }); if (j.warm) return res.end('{}'); agentCalls++; res.end(JSON.stringify(site)); }); return; }
  if (u.startsWith('/api/')) { res.writeHead(404); return res.end(); }
  const f = path.join(ROOT, u === '/' ? 'moss-builder.html' : decodeURIComponent(u).slice(1));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html' : f.endsWith('.css') ? 'text/css' : f.endsWith('.woff2') ? 'font/woff2' : 'text/javascript' }); fs.createReadStream(f).pipe(res);
});
srv.listen(0, async () => {
  const browser = await chromium.launch(); const p = await browser.newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(`http://127.0.0.1:${srv.address().port}/?speed=0.03&nostream&debug`);
  const say = async (t) => { await p.evaluate((m) => window.moss.app.send(m), t); await p.waitForTimeout(30); await p.evaluate(() => window.moss.app.whenIdle()); };
  const last = () => p.evaluate(() => { const t = window.moss.latency.turns().at(-1); const s = window.moss.latency.summary(t); return { page: window.moss.pageModel.get().currentPage, local: s.local, retrieval: s.retrieval }; });
  await say('build it');
  const cases = [['take me to hours page', 'opening-hours'], ['go to home', 'home'], ['takeme to the menu page', 'menu'], ['open the home page', 'home'], ['take me to opening-hours', 'opening-hours']];
  for (const [t, want] of cases) {
    const c0 = agentCalls; await say(t); const r = await last();
    check(`"${t}" goes to ${want} on the page, with no server call and no pause`, r.page === want && agentCalls === c0 && r.local != null && r.local < 60 && r.retrieval == null, JSON.stringify(r));
  }
  const tiles = await p.locator('#latTurns .lat-turn[open] .lat-tiles').innerText();
  check('the waterfall says "On the page", not retrieval', /On the page/.test(tiles) && /no server call/.test(tiles), tiles.replace(/\s+/g, ' ').slice(0, 120));
  const c1 = agentCalls; await say('go to the about page');
  check('a page that does not exist goes to Moss as usual', agentCalls === c1 + 1);
  check('no page errors', errors.length === 0, errors.join(' | '));
  await browser.close(); srv.close();
  const failed = results.filter((x) => !x).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
});
