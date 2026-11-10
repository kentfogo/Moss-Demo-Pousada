// Captures the fixed, comparable design state used every iteration (PROMPT.md, Section 8).
// Usage: node tests/screenshot.cjs <out.png> [--dark] [--flow]
// State: light mode, 1440x900, first example prompt built on Home, fixed scroll offset,
// scrolled so the iso scene, chat panel and hero/features/testimonials are all visible.
const { chromium } = require('playwright');
const path = require('path');

const out = process.argv[2] || 'screenshots/iter.png';
const dark = process.argv.includes('--dark');
const flow = process.argv.includes('--flow');
const URL = 'file://' + path.resolve(__dirname, '..', 'moss-builder.html') + '?speed=0.05';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, colorScheme: dark ? 'dark' : 'light' });
  const page = await ctx.newPage();
  await page.goto(URL);
  await page.click('#examples .chip >> nth=0');
  await page.waitForTimeout(50);
  await page.evaluate(() => window.moss.app.whenIdle());
  if (flow) {
    await page.evaluate(async () => { await window.moss.app.send('Add an About page and a Booking page'); });
    await page.evaluate(async () => { await window.moss.app.send('map the booking flow'); });
    await page.evaluate(() => window.moss.app.whenIdle());
  }
  // Fixed scroll: Features section starts 430px from the top of the viewport, so the end of the hero,
  // all of Features and the start of Testimonials sit under the sticky iso scene.
  await page.evaluate(() => {
    const pv = document.querySelector('#pageView'); pv.style.scrollBehavior = 'auto'; pv.scrollTop = 0;
    const f = document.querySelector('#siteSections [data-type="features"]');
    if (f) pv.scrollTop = Math.max(0, f.getBoundingClientRect().top - 430);
  });
  await page.mouse.move(0, 0);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: out });
  await browser.close();
  console.log('saved', out);
})().catch((e) => { console.error(e); process.exit(1); });
