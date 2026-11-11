// Motion and refine controls: motion levels, scroll-in sections, global buttons and nav, swatches, per-section style,
// the Style drawer, the section toolbar and photo uploads. Uses the offline agent (these commands never need the model).
// Run: node tests/style.cjs
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = 'file://' + path.join(ROOT, 'moss-builder.html') + '?speed=0.04';
const results = [];
const check = (name, ok, detail = '') => { results.push(!!ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
// a tiny valid PNG (2x2) for the upload
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDK+mmyAAAAABJRU5ErkJggg==', 'base64');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(URL);
  const idle = () => page.evaluate(() => window.moss.app.whenIdle());
  const say = async (t) => { await page.evaluate((x) => window.moss.app.send(x), t); await idle(); };
  const design = () => page.evaluate(() => window.moss.pageModel.get().design);
  const site = (k) => page.evaluate((key) => document.querySelector('#site').dataset[key], k);
  const css = (sel, prop) => page.evaluate(([s, p]) => { const el = document.querySelector(s); return el ? getComputedStyle(el)[p] : null; }, [sel, prop]);

  await say('just build a smash burger joint in Brooklyn');
  const d0 = await design();
  check('every design has a motion level, and the page shows it', ['calm', 'lively'].includes(d0.motion) && (await site('motion')) === d0.motion, d0.motion);

  // ---- motion
  await say('No animations');
  check('"no animations" turns motion off', (await design()).motion === 'none' && (await site('motion')) === 'none');
  await say('Make it lively');
  await page.waitForTimeout(300);
  const m = await page.evaluate(() => ({ motion: window.moss.pageModel.get().design.motion, play: !!document.querySelector('#siteSections .sec-hero.m-play'), words: document.querySelectorAll('#siteSections .sec-hero h1 .hl-w').length, pre: document.querySelectorAll('#siteSections .sec.m-pre').length, accent: !!document.querySelector('#siteSections .sec-hero h1 em .hl-w, #siteSections .sec-hero h1 .acc .hl-w') || !document.querySelector('#siteSections .sec-hero h1 em') }));
  check('"make it lively" replays: the headline plays word by word', m.motion === 'lively' && m.play && m.words >= 3 && m.accent, JSON.stringify(m));
  check('…and sections below the fold wait to rise in', m.pre >= 2, String(m.pre));
  await page.evaluate(() => document.querySelector('#pageView').scrollTo({ top: 99999 }));
  await page.waitForTimeout(700);
  check('scrolling brings them in', (await page.evaluate(() => document.querySelectorAll('#siteSections .sec.m-in').length)) >= 2 && (await page.evaluate(() => document.querySelectorAll('#siteSections .sec.m-pre').length)) === 0 || (await page.evaluate(() => document.querySelectorAll('#siteSections .sec.m-pre').length)) < m.pre);
  await page.evaluate(() => document.querySelector('#pageView').scrollTo({ top: 0 }));
  await say('Make the headline punchier');
  check('edits never re-hide sections', (await page.evaluate(() => document.querySelectorAll('#siteSections .sec.m-pre').length)) <= m.pre);
  await say('Add some animation');
  check('"add some animation" sets calm motion', (await design()).motion === 'calm');

  // ---- global buttons
  await say('Outline buttons');
  check('"outline buttons" restyles every primary button', (await design()).button.style === 'outline' && (await site('btnStyle')) === 'outline' && (await css('#siteSections .btn-primary', 'backgroundColor')) === 'rgba(0, 0, 0, 0)');
  await say('Bigger buttons');
  check('"bigger buttons" makes them large', (await design()).button.size === 'l' && Math.round(parseFloat(await css('#siteSections .btn', 'height'))) === 58, await css('#siteSections .btn', 'height'));
  await say('Glow on hover');
  check('"glow on hover" sets the hover effect', (await design()).button.hover === 'glow' && (await site('btnHover')) === 'glow');

  // ---- nav
  await say('Floating nav');
  check('"floating nav" turns the nav into a pill', (await design()).nav.style === 'floating' && (await css('.s-nav', 'borderTopLeftRadius')) === '999px');
  await say('Sticky nav');
  check('"sticky nav" keeps it at the top', (await design()).nav.sticky === true && (await css('.s-top', 'position')) === 'sticky');
  await say('Unstick the nav');
  check('"unstick the nav" lets it scroll', (await design()).nav.sticky === false);

  // ---- swatches
  const accent = (await design()).colors.accent;
  await say('Save this colour as Ocean');
  check('"save this colour as Ocean" names the accent', (await design()).swatches.ocean === accent);
  await page.evaluate(() => { window.moss.pageModel.get().design.swatches.sea = '#0a7f6f'; });
  await say('Use sea for the accent');
  const acc2 = (await design()).colors.accent;
  check('"use sea for the accent" applies a named swatch', acc2 !== accent && /^#0[0-9a-f]7/.test(acc2), acc2);

  // ---- one section's look
  await say('Dark background on the FAQ');
  const faq = () => page.evaluate(() => { const s = window.moss.pageModel.page('home').sections.find((x) => x.type === 'faq'); const el = document.querySelector(`#siteSections [data-id="${s.id}"]`); return { style: s.style || {}, fill: el.dataset.fill, pad: el.dataset.pad, radius: el.style.getPropertyValue('--sec-radius'), bg: getComputedStyle(el).backgroundColor }; });
  let f = await faq();
  check('"dark background on the FAQ" fills just that section', f.style.fill === 'inverse' && f.fill === 'inverse');
  await say('More space around the FAQ');
  await say('Round the FAQ corners');
  f = await faq();
  check('…more space and rounded corners', f.style.padding === 'roomy' && f.pad === 'roomy' && f.style.radius === 28 && f.radius === '28px', JSON.stringify(f));
  await say('Ocean background on the pricing');
  check('a named swatch can fill a section', (await page.evaluate(() => { const s = window.moss.pageModel.page('home').sections.find((x) => x.type === 'pricing'); return s.style && s.style.fill === 'ocean' && document.querySelector(`#siteSections [data-id="${s.id}"]`).dataset.fill === 'swatch'; })));
  await say('undo');
  check('undo removes the last section style', (await page.evaluate(() => { const s = window.moss.pageModel.page('home').sections.find((x) => x.type === 'pricing'); return !s.style || !s.style.fill; })));
  check('none of these needed the model (all local)', (await page.evaluate(() => window.moss.agent.quickStyle('outline buttons', window.moss.pageModel.get()) !== null)));

  // ---- Style drawer
  await page.click('#styleBtn');
  check('the Style button opens the drawer', await page.isVisible('#styleDrawer'));
  await page.click('#styleDrawer [data-say="Ghost buttons"]'); await idle();
  check('drawer controls apply (ghost buttons) and show what is on', (await design()).button.style === 'ghost' && (await page.getAttribute('#styleDrawer [data-say="Ghost buttons"]', 'aria-pressed')) === 'true');
  await page.click('#styleDrawer [data-say="Make it lively"]'); await idle();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(ROOT, 'screenshots', 'style-drawer.png') });
  await page.click('#styleDrawer .sd-x');
  check('…and closes', !(await page.isVisible('#styleDrawer')));

  // ---- section toolbar
  const faqId = await page.evaluate(() => window.moss.pageModel.page('home').sections.find((x) => x.type === 'faq').id);
  await page.evaluate((id) => document.querySelector(`#siteSections [data-id="${id}"]`).scrollIntoView(), faqId);
  await page.click(`#siteSections [data-id="${faqId}"] h2`);
  check('clicking a section shows its toolbar', await page.isVisible('#secBar') && /FAQ/i.test(await page.locator('#secBar').innerText()));
  await page.click('#secBar [data-say="Less space around the FAQ"]'); await idle();
  check('toolbar buttons restyle it (tight spacing)', (await faq()).style.padding === 'tight');

  // ---- photos
  const heroId = await page.evaluate(() => window.moss.pageModel.page('home').sections.find((x) => x.type === 'hero').id);
  await page.evaluate(() => document.querySelector('#pageView').scrollTo({ top: 0 }));
  await page.click(`#siteSections [data-id="${heroId}"] .eyebrow`);
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('#secBar [data-photo]')]);
  await chooser.setFiles({ name: 'shop.png', mimeType: 'image/png', buffer: PNG });
  await page.waitForFunction((id) => { const s = window.moss.pageModel.page('home').sections.find((x) => x.id === id); return s.data.image; }, heroId, { timeout: 5000 });
  await idle();
  const ph = await page.evaluate((id) => { const s = window.moss.pageModel.page('home').sections.find((x) => x.id === id); return { img: s.data.image.slice(0, 23), variant: s.data.variant, dom: !!document.querySelector(`#siteSections [data-id="${id}"] .art-photo img`) }; }, heroId);
  check('a photo uploads into the hero (switching to a layout with a photo slot)', ph.img === 'data:image/jpeg;base64,' && (ph.variant === undefined || ['editorial', 'bigtype', 'spotlight'].includes(ph.variant)) && ph.dom, JSON.stringify(ph));
  const slim = await page.evaluate(() => JSON.stringify(window.moss.agent.slimState(window.moss.pageModel.get())));
  check('the photo itself is never sent to Moss', !slim.includes('data:image') && slim.includes('"image":"uploaded"'));
  const picked = await page.evaluate(() => window.moss.agent.quickStyle('add a photo to the hero', window.moss.pageModel.get()));
  check('"add a photo to the hero" asks for one', picked && picked.ops[0].op === 'pickPhoto');
  check('"add a photo gallery" is not a photo upload', !(await page.evaluate(() => { const r = window.moss.agent.quickStyle('add a photo gallery', window.moss.pageModel.get()); return r && r.ops[0].op === 'pickPhoto'; })));
  await say('undo');
  check('undo removes the photo', !(await page.evaluate((id) => window.moss.pageModel.page('home').sections.find((x) => x.id === id).data.image, heroId)));
  check('no console/page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();

  // ---- reduced motion: nothing hides or plays
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p2 = await ctx2.newPage(); await p2.goto(URL);
  await p2.evaluate(() => window.moss.app.send('just build a coffee roaster called Ember')); await p2.evaluate(() => window.moss.app.whenIdle());
  await p2.evaluate(() => window.moss.app.send('Make it lively')); await p2.evaluate(() => window.moss.app.whenIdle());
  await p2.waitForTimeout(200);
  check('with reduced motion, sections are never hidden', (await p2.evaluate(() => document.querySelectorAll('#siteSections .sec.m-pre').length)) === 0);
  await ctx2.close();

  // ---- phone: the drawer fits
  const ctx3 = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const p3 = await ctx3.newPage(); await p3.goto(URL);
  await p3.evaluate(() => window.moss.app.send('just build a coffee roaster called Ember')); await p3.evaluate(() => window.moss.app.whenIdle());
  await p3.evaluate(() => document.querySelector('#styleBtn').click());
  const box = await p3.evaluate(() => { const r = document.querySelector('#styleDrawer').getBoundingClientRect(); return { l: r.left, r: r.right, w: innerWidth }; });
  check('on a phone the Style drawer fits the screen', box.l >= 0 && box.r <= box.w, JSON.stringify(box));
  await ctx3.close();

  await browser.close();
  const failed = results.filter((x) => !x).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
