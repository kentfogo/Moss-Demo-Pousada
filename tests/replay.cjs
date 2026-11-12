// Replays play back with no server: a static file server only (like GitHub Pages), no /api requests reach the network.
// Run: node tests/replay.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const results = [];
const check = (name, ok, detail = '') => { results.push(!!ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2' };

const apiHits = [];
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.startsWith('/api/')) { apiHits.push(p); res.writeHead(404); return res.end(); }
  const f = path.join(ROOT, p === '/' ? 'moss-builder.html' : p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const rec = JSON.parse(fs.readFileSync(path.join(ROOT, 'replays', 'pousada.json'), 'utf8'));
  check('recording: has messages and streamed server calls', rec.messages.length >= 3 && rec.calls.length >= 2 && rec.calls.every((c) => c.chunks.length && c.status === 200));
  check('recording: holds no keys', !/MOSS_PROJECT|Bearer |authorization/i.test(JSON.stringify(rec)));

  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`${base}/moss-builder.html?replay=pousada`);
  await page.waitForFunction(() => /Every delay is real/.test(document.querySelector('#replayBar .txt').textContent), null, { timeout: 10000 });
  check('replay: the bar says it is a recording', true);
  await page.click('#replayGo');
  await page.waitForFunction(() => document.querySelectorAll('.msg.user').length >= 2, null, { timeout: 60000 });
  await page.evaluate(() => window.moss.app.whenIdle());
  const s = await page.evaluate(() => ({ sections: window.moss.pageModel.get().pages.reduce((n, p) => n + p.sections.length, 0), user: [...document.querySelectorAll('.msg.user')].map((e) => e.innerText.trim()) }));
  check('replay: the first build is replayed onto the page', s.sections >= 4, `${s.sections} sections`);
  check('replay: messages are typed as recorded', s.user[0] === rec.messages[0].text && s.user[1] === rec.messages[1].text);
  await page.waitForSelector('#latBadge', { timeout: 5000 });
  check('replay: the latency badge shows Moss time to first token', /Moss first token \d+ ms/.test(await page.locator('#latBadge').innerText()), await page.locator('#latBadge').innerText());
  check('replay: nothing reached /api on the network', apiHits.length === 0, apiHits.join(', '));
  check('replay: no page errors', errors.length === 0, errors.join(' | '));

  const page2 = await browser.newPage();
  await page2.goto(`${base}/moss-builder.html?replay=missing`);
  await page2.waitForFunction(() => /Couldn/.test(document.querySelector('#replayBar .txt').textContent), null, { timeout: 10000 });
  check('replay: a missing recording says so', true);

  await browser.close(); server.close();
  const failed = results.filter((x) => !x).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
