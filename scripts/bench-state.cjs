// Builds a realistic page with the offline agent and saves what the browser would send to /api/agent,
// so the benchmark (scripts/bench.mjs) times real prompt sizes. Run: node scripts/bench-state.cjs
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const URL = 'file://' + path.resolve(__dirname, '..', 'moss-builder.html') + '?speed=0.04';
const OUT = path.resolve(__dirname, '..', 'data', 'bench-state.json');

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto(URL);
  await page.fill('#introInput', 'just build a smash burger joint in Brooklyn');
  await page.press('#introInput', 'Enter');
  await page.waitForTimeout(50);
  await page.evaluate(() => window.moss.app.whenIdle());
  const sample = await page.evaluate(() => ({
    state: window.moss.agent.slimState(window.moss.pageModel.get()),
    directions: window.MossSite ? window.MossSite.library() : [],
  }));
  await browser.close();
  const sections = (sample.state.pages || []).reduce((n, p) => n + (p.sections || []).length, 0);
  if (!sections) throw new Error('the offline build produced no sections');
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(sample, null, 1) + '\n');
  console.log(`saved ${path.relative(process.cwd(), OUT)}: ${sections} sections, ${sample.directions.length} directions, ${JSON.stringify(sample).length} chars`);
})().catch((e) => { console.error(e); process.exit(1); });
