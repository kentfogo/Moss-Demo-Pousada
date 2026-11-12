// Records a live session against a running server (npm start) and saves it as a replay.
// Run: node scripts/record.cjs [name] [base url]    e.g. node scripts/record.cjs pousada http://localhost:3000
// The script types into the real page with ?record, waits for each turn, then writes replays/<name>.json.
// Watch it later at /?replay=<name>.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const NAME = process.argv[2] || 'pousada';
const BASE = (process.argv[3] || process.env.BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
const SCRIPT = {
  pousada: [
    'Just build a landing page for Pousada Maré, a 9-room guesthouse on the beach in Paraty, Brazil',
    'make the headline punchier',
    'make it pop',
    'add a FAQ about getting here from Rio',
    'move the testimonials above the features',
    'make the buttons bigger',
    'add a page for our rooms',
  ],
}[NAME];
if (!SCRIPT) { console.error(`no script named ${NAME}`); process.exit(1); }

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto(`${BASE}/?record`);
  await page.waitForTimeout(4000); // the warm-up ping: router loaded, Moss connection open, prompt cached
  for (const [i, text] of SCRIPT.entries()) {
    const input = i === 0 ? '#introInput' : '#chatInput';
    await page.fill(input, text);
    await page.press(input, 'Enter');
    await page.waitForTimeout(100);
    await page.evaluate(() => window.moss.app.whenIdle());
    const s = await page.evaluate(() => { const t = window.moss.latency.turns().at(-1); const d = (n) => { const x = t.spans.find((y) => y.name === n); return x ? Math.round(x.end - x.start) : null; }; const m = t.marks.find((y) => y.name === 'reply shown'); return { talker: d('talker.ttft'), worker: d('inference.ttft'), router: d('router.query'), shown: m ? Math.round(m.at - t.t0) : null }; });
    console.log(`${i + 1}. ${text.slice(0, 48).padEnd(48)} talker ${s.talker ?? '–'} · worker ${s.worker ?? '–'} · router ${s.router ?? '–'} · on screen ${s.shown ?? '–'} ms`);
    await page.waitForTimeout(800);
  }
  const data = await page.evaluate(() => window.moss.recorder.data());
  data.note = process.env.REPLAY_NOTE || '';
  await browser.close();
  const out = path.resolve(__dirname, '..', 'replays', `${NAME}.json`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(data) + '\n');
  console.log(`saved ${path.relative(process.cwd(), out)}: ${data.messages.length} messages, ${data.calls.length} server calls, ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
})().catch((e) => { console.error(e); process.exit(1); });
