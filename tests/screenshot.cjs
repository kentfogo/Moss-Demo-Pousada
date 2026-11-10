// Captures the fixed, comparable design state used every iteration (PROMPT.md, Section 8).
// Usage: node tests/screenshot.cjs <out.png> [--dark] [--flow]
// State: light mode, 1440x900, first example prompt built on Home, fixed scroll offset (see below).
const { chromium } = require('playwright');
const path = require('path');

const out = process.argv[2] || 'screenshots/iter.png';
const dark = process.argv.includes('--dark');
const flow = process.argv.includes('--flow');
const base = 'file://' + path.resolve(__dirname, '..', 'moss-builder.html') + '?speed=0.05';
// From iteration 8 the isometric scene is a build stage shown only while Moss is building, so the fixed
// state is a real mid-build frame: the first build is paused after its 3rd section (hero, features, testimonials).
const URL = flow ? base : base + '&pauseAfter=3';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, colorScheme: dark ? 'dark' : 'light' });
  const page = await ctx.newPage();
  await page.goto(URL);
  await page.click('#examples .chip >> nth=0');
  await page.waitForTimeout(50);
  if (flow) await page.evaluate(() => window.moss.app.whenIdle());
  else await page.waitForFunction(() => window.__mossPaused === true);
  if (flow) {
    await page.evaluate(async () => { await window.moss.app.send('Add an About page and a Booking page'); });
    await page.evaluate(async () => { await window.moss.app.send('map the booking flow'); });
    await page.evaluate(() => window.moss.app.whenIdle());
  }
  // Fixed scroll (from iteration 4): the hero eyebrow sits 16px below the top of the page view (from iteration 5 the iso scene is a left rail), so the
  // hero headline, all of Features and the start of Testimonials are in view.
  await page.waitForTimeout(1000); // let the app's own smooth auto-scroll finish first
  await page.evaluate(() => {
    const pv = document.querySelector('#pageView'); pv.style.scrollBehavior = 'auto'; pv.scrollTop = 0;
    const e = document.querySelector('#siteSections .sec-hero .eyebrow');
    const sceneBottom = document.querySelector('#pageView').getBoundingClientRect().top;
    if (e) pv.scrollTop = Math.max(0, e.getBoundingClientRect().top - sceneBottom - 16);
  });
  await page.mouse.move(0, 0);
  await page.waitForTimeout(1200);
  if (process.env.MEASURE) console.log(await page.evaluate(() => [...document.querySelectorAll("#siteSections > section")].map((e) => e.dataset.type + ":" + Math.round(e.getBoundingClientRect().top)).join(" ")));
  await page.screenshot({ path: out });
  await browser.close();
  console.log('saved', out);
})().catch((e) => { console.error(e); process.exit(1); });
