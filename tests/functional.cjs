// Functional tests for moss-builder.html (PROMPT.md, Section 7).
// Run: node tests/functional.cjs
const { chromium } = require('playwright');
const path = require('path');

const URL = 'file://' + path.resolve(__dirname, '..', 'moss-builder.html') + '?speed=0.04';
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

async function say(page, text) {
  await page.fill('#chatInput', text);
  await page.press('#chatInput', 'Enter');
  await page.waitForTimeout(50);
  await page.evaluate(() => window.moss.app.whenIdle());
}
const sectionTypes = (page) => page.$$eval('#siteSections > section', (els) => els.map((e) => e.dataset.type));

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(URL);

  // 1. Build from scratch
  check('intro shows prompt + 3 examples', (await page.locator('#introInput').isVisible()) && (await page.locator('#examples .chip').count()) === 3);
  await page.click('#examples .chip >> nth=0');
  await page.waitForTimeout(50);
  await page.evaluate(() => window.moss.app.whenIdle());
  let types = await sectionTypes(page);
  check('1. full landing page built via chat', JSON.stringify(types) === JSON.stringify(['hero', 'features', 'testimonials', 'pricing', 'faq', 'cta', 'footer']), types.join(','));
  check('1. iso scene has a module per section', (await page.locator('#isoMods .mod').count()) === 7);
  check('1. chat streamed agent reply', (await page.locator('.msg.agent .text').first().innerText()).length > 20);

  // 2. Edit / reorder / restyle / delete / undo
  const h0 = await page.locator('.sec-hero h1').innerText();
  await say(page, 'make the headline punchier');
  const h1 = await page.locator('.sec-hero h1').innerText();
  check('2. edit copy (headline)', h1 !== h0, `${h0} → ${h1}`);
  await say(page, 'move testimonials above features');
  types = await sectionTypes(page);
  check('2. reorder sections', types.indexOf('testimonials') < types.indexOf('features'), types.join(','));
  await say(page, 'warmer colors');
  check('2. restyle palette', (await page.getAttribute('#site', 'data-palette')) === 'warm');
  await say(page, 'delete the FAQ');
  types = await sectionTypes(page);
  check('2. delete section', !types.includes('faq'), types.join(','));
  await say(page, 'undo');
  types = await sectionTypes(page);
  check('2. undo restores section', types.includes('faq'), types.join(','));
  await say(page, 'add a stats section after the hero');
  types = await sectionTypes(page);
  check('2. create section at position', types[1] === 'stats', types.join(','));

  // 3. Pages + @references
  await say(page, 'Add an About page and a Pricing page');
  const pages = await page.evaluate(() => window.moss.pageModel.get().pages.map((p) => p.id));
  check('3. two extra pages created', pages.includes('about') && pages.includes('pricing'), pages.join(','));
  check('3. hash route follows page', (await page.evaluate(() => location.hash)) === '#/pricing');
  await page.fill('#chatInput', '');
  await page.type('#chatInput', '@Pri');
  const menuVisible = await page.locator('#mentionMenu').isVisible();
  const menuText = menuVisible ? await page.locator('#mentionMenu').innerText() : '';
  check('3. @ autocomplete menu', menuVisible && /Pricing/.test(menuText), menuText.replace(/\s+/g, ' '));
  await page.keyboard.press('Enter');
  check('3. autocomplete inserts mention', (await page.inputValue('#chatInput')) === '@Pricing ');
  await page.type('#chatInput', 'link this to the CTA on @Home');
  await page.press('#chatInput', 'Enter');
  await page.waitForTimeout(50);
  await page.evaluate(() => window.moss.app.whenIdle());
  const link = await page.evaluate(() => { const s = window.moss.pageModel.get(); const cta = s.pages.find((p) => p.id === 'home').sections.find((x) => x.type === 'cta'); return { links: s.links, href: cta.data.href }; });
  check('3. @Pricing linked to CTA on @Home', link.href === '#/pricing' && link.links.length === 1, JSON.stringify(link.links));
  check('3. mentions render as pills', (await page.locator('.msg.user .mention').count()) >= 2);
  await say(page, "go to @Home");
  await say(page, "match @About's hero style");
  const variant = await page.evaluate(() => window.moss.pageModel.findByType('home', 'hero').data.variant);
  check("3. match @About's hero style", variant === 'centered' && (await page.locator('.sec-hero.centered').count()) === 1);

  // 4. Flowchart + drag
  await say(page, 'map the booking flow');
  check('4. switched to Flow view', (await page.evaluate(() => window.moss.app.view())) === 'flow');
  const nNodes = await page.locator('#nodeLayer .fnode').count();
  const nDec = await page.locator('#nodeLayer .fnode.decision').count();
  const nEdges = await page.locator('#edgeLayer g[data-flow]').count();
  check('4. flowchart nodes, decision, connectors', nNodes === 8 && nDec === 1 && nEdges === 8, `${nNodes} nodes, ${nDec} decisions, ${nEdges} edges`);
  const node = page.locator('#nodeLayer .fnode[data-node="n3"]');
  const edgeSel = '#edgeLayer g[data-flow] path';
  const dBefore = await page.$$eval(edgeSel, (ps) => ps.map((p) => p.getAttribute('d')));
  const bb = await node.boundingBox();
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await page.mouse.down();
  await page.mouse.move(bb.x + bb.width / 2 + 60, bb.y + bb.height / 2 + 110, { steps: 8 });
  await page.mouse.up();
  const bb2 = await node.boundingBox();
  const dAfter = await page.$$eval(edgeSel, (ps) => ps.map((p) => p.getAttribute('d')));
  const changed = dBefore.filter((d, i) => d !== dAfter[i]).length;
  check('4. node dragged', Math.abs(bb2.y - bb.y) > 50, `dy=${Math.round(bb2.y - bb.y)}`);
  check('4. connectors follow dragged node', changed === 2, `${changed} connectors changed (n2→n3, n3→n4)`);
  // endpoint of n2→n3 edge should touch the node
  const touch = await page.evaluate(() => {
    const p = document.querySelector('#edgeLayer g[data-edge$="-e2"] path'); const n = document.querySelector('[data-node="n3"]');
    const end = p.getPointAtLength(p.getTotalLength());
    return { ex: end.x, ey: end.y, l: n.offsetLeft, t: n.offsetTop, w: n.offsetWidth, h: n.offsetHeight };
  });
  const onEdge = touch.ex >= touch.l - 2 && touch.ex <= touch.l + touch.w + 2 && touch.ey >= touch.t - 2 && touch.ey <= touch.t + touch.h + 2;
  check('4. connector endpoint sits on node', onEdge, JSON.stringify(touch));
  await page.click('#viewPage');

  // 4b. Whole-page actions happen in one step
  await say(page, 'delete the about page');
  const del = await page.evaluate(() => ({ pages: window.moss.pageModel.get().pages.map((p) => p.id), log: [...document.querySelectorAll('.msg.agent:last-child .log li')].map((l) => l.innerText.replace(/\s+/g, ' ')) }));
  check('4b. delete a page in one step', !del.pages.includes('about') && del.log.length === 1, del.log.join(' | '));
  await say(page, 'redo the home page');
  types = await sectionTypes(page);
  check('4b. redo a page: one clear, then a fresh build', (await page.evaluate(() => window.moss.pageModel.get().currentPage)) === 'home' && types.length === 7 && types[0] === 'hero', types.join(','));
  await say(page, 'start over');
  const so = await page.evaluate(() => { const s = window.moss.pageModel.get(); return { pages: s.pages.map((p) => p.id), flows: s.flows.length, links: s.links.length, business: s.business && s.business.name }; });
  check('4b. "start over" clears everything, then rebuilds', JSON.stringify(so.pages) === '["home"]' && so.flows === 0 && so.links === 0 && so.business === 'Pousada Maré', JSON.stringify(so));
  await say(page, 'undo');
  check('4b. undo brings the previous site back', (await page.evaluate(() => window.moss.pageModel.get().pages.length)) >= 2);

  // 5. Theme
  const bg0 = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.click('#themeBtn');
  await page.waitForTimeout(500);
  const t1 = await page.evaluate(() => document.documentElement.dataset.theme);
  const bg1 = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  check('5. dark mode toggles', t1 === 'dark' && bg0 !== bg1, `${bg0} → ${bg1}`);
  await page.click('#themeBtn');
  check('5. back to light', (await page.evaluate(() => document.documentElement.dataset.theme)) === 'light');

  // 6. Sound
  const s0 = await page.evaluate(() => ({ on: window.moss.sound.isEnabled(), unlocked: window.moss.sound.isUnlocked() }));
  await page.click('#soundBtn');
  const s1 = await page.evaluate(() => window.moss.sound.isEnabled());
  const aria1 = await page.getAttribute('#soundBtn', 'aria-pressed');
  await page.click('#soundBtn');
  const s2 = await page.evaluate(() => window.moss.sound.isEnabled());
  check('6. sound unlocked after interaction', s0.unlocked);
  check('6. sound toggles off/on', s0.on && !s1 && aria1 === 'false' && s2);

  // keyboard: chat reachable by Tab
  await page.focus('#chatInput');
  check('a11y. chat input focusable', await page.evaluate(() => document.activeElement.id === 'chatInput'));
  await ctx.close();

  // Sound must be silent before first interaction
  const ctx0 = await browser.newContext();
  const p0 = await ctx0.newPage();
  await p0.goto(URL);
  check('6. audio stays off before first interaction', !(await p0.evaluate(() => window.moss.sound.isUnlocked())));
  await ctx0.close();

  // 7. Mobile 375
  const mctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const m = await mctx.newPage();
  m.on('pageerror', (e) => errors.push('mobile: ' + e.message));
  await m.goto(URL);
  const introOverflow = await m.evaluate(() => document.documentElement.scrollWidth);
  await m.click('#examples .chip >> nth=1');
  await m.waitForTimeout(50);
  await m.evaluate(() => window.moss.app.whenIdle());
  const mobile = await m.evaluate(() => {
    const chat = document.querySelector('#chat').getBoundingClientRect();
    const frame = document.querySelector('#frame').getBoundingClientRect();
    const over = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.right > window.innerWidth + 1 && !e.closest('.tabs,.suggest,.flowview,.iso,.scene-panel'); }).map((e) => e.className).slice(0, 5);
    return { sw: document.documentElement.scrollWidth, chatBottom: Math.round(chat.bottom), chatTop: Math.round(chat.top), chatW: Math.round(chat.width), frameW: Math.round(frame.width), over, sections: document.querySelectorAll('#siteSections > section').length };
  });
  check('7. no horizontal scroll at 375 (intro)', introOverflow <= 375, `scrollWidth=${introOverflow}`);
  check('7. no horizontal overflow at 375 (built)', mobile.sw <= 375 && mobile.over.length === 0, JSON.stringify(mobile.over));
  check('7. chat is a bottom sheet', mobile.chatBottom === 812 && mobile.chatW === 375 && mobile.chatTop > 300, JSON.stringify(mobile));
  check('7. site builds on mobile', mobile.sections === 7 && mobile.frameW <= 375);
  await m.screenshot({ path: path.resolve(__dirname, '..', 'screenshots', 'test-mobile.png') });
  await mctx.close();

  check('no console/page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
