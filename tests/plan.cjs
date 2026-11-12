// Plan mode end to end with the offline agent: grill-me interview → plan → pick a look → guided build → what's next.
// Run: node tests/plan.cjs
const { chromium } = require('playwright');
const path = require('path');

const URL = 'file://' + path.resolve(__dirname, '..', 'moss-builder.html') + '?speed=0.03';
const results = [];
const check = (name, ok, detail = '') => { results.push(!!ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(URL);
  const say = async (t) => { await page.evaluate((x) => window.moss.app.send(x), t); await page.evaluate(() => window.moss.app.whenIdle()); };
  const plan = () => page.evaluate(() => JSON.parse(JSON.stringify(window.moss.pageModel.get().plan)));
  const homeTypes = () => page.evaluate(() => { const h = window.moss.pageModel.page('home'); return h ? h.sections.map((x) => x.type) : []; });

  // a new site starts an interview, not a build
  await say("Let's build a site for my plumbing business in Austin called Pipeline Plumbing");
  let p = await plan();
  check('a new site starts a grill-me interview', p && p.phase === 'interview' && (await homeTypes()).length === 0);
  check('the Brief board replaces the empty page', await page.locator('#planBoard').isVisible() && !(await page.locator('#frame').isVisible()));
  check('one question at a time, with suggested answers', (await page.locator('.pb-q p').count()) === 1 && (await page.locator('.pb-q .chip').count()) >= 3, await page.locator('.pb-q p').innerText());
  check('suggested answers are also chat chips', (await page.locator('#suggest .chip').count()) >= 3);

  // answers: a chip tap, an ordinal, free text, and a vague answer that gets pushed back on
  await page.locator('.pb-q .chip').first().click(); await page.evaluate(() => window.moss.app.whenIdle());
  p = await plan();
  check('tapping a suggestion records it in the brief', !!p.brief.offer, p.brief.offer);
  await say('the second one');
  check('"the second one" picks that suggestion', (await plan()).brief.audience === 'Businesses', (await plan()).brief.audience);
  await say("I'm not sure");
  check('a vague answer gets a follow-up, not a skip', !(await plan()).brief.action && (await page.locator('.msg.agent .text:not(.after)').last().innerText()).includes("No problem"));
  await say('Call us for same-day repairs');
  check('free-text answers are kept', (await plan()).brief.action === 'Call us for same-day repairs');
  check('the brief fills in live', (await page.locator('.pb-brief .on').count()) >= 4);

  // "that's enough" → the plan with three looks
  await say("that's enough, make the plan");
  p = await plan();
  check('"that\'s enough" produces a section plan', p.phase === 'proposed' && p.sections.length >= 6 && p.sections[0].type === 'hero' && p.sections.at(-1).type === 'footer', p.sections.map((x) => x.type).join(','));
  check('three different looks are proposed', p.directions.length === 3 && new Set(p.directions.map((d) => d.direction)).size === 3, p.directions.map((d) => d.name).join(', '));
  check('the board shows the outline and the look cards', (await page.locator('.pb-outline li').count()) === p.sections.length && (await page.locator('.pb-dir').count()) === 3);

  await say('go with the second one');
  p = await plan();
  check('"the second one" chooses that look and applies it', p.chosen === 1 && (await page.evaluate(() => window.moss.pageModel.get().design.direction)) === p.directions[1].direction);
  check('the chosen card is marked', (await page.locator('.pb-dir[aria-pressed="true"]').count()) === 1);

  // guided build: one section, then check in
  await say("let's start");
  check('"let\'s start" builds only the first section', JSON.stringify(await homeTypes()) === '["hero"]', (await homeTypes()).join(','));
  check('Moss checks in after it', /Keep it, or change something/.test(await page.locator('.msg.agent .text:not(.after)').last().innerText()));
  check('the page replaces the board once building starts', !(await page.locator('#planBoard').isVisible()) && (await page.locator('#frame').isVisible()));
  check('planned sections wait in the rail as ghosts', (await page.locator('.rail li.ghost').count()) === p.sections.length - 1);

  await say('make the headline punchier');
  check('an edit between steps changes the section, not the plan', (await homeTypes()).length === 1 && (await plan()).sections.filter((x) => x.done).length === 1);

  await say('next');
  check('"next" adds exactly one more section', (await homeTypes()).length === 2 && (await homeTypes())[1] === p.sections[1].type, (await homeTypes()).join(','));

  await say('build the rest');
  const built = await homeTypes();
  check('"build the rest" finishes the plan on autopilot', JSON.stringify(built) === JSON.stringify(p.sections.map((x) => x.type)), built.join(','));
  check('the plan is marked done', (await plan()).phase === 'done' && (await page.locator('.rail li.ghost').count()) === 0);

  // what's next: stay on the finished page, suggestions in a chat card, the map on request
  await page.waitForTimeout(900);
  check('after the build you stay on the finished page', (await page.evaluate(() => window.moss.app.view())) === 'page' && (await page.evaluate(() => document.querySelector('#pageView').scrollTop)) < 50);
  check('Moss asks whether to look it over or plan the next pages', /Want to look it over, or plan the next pages/.test(await page.locator('.msg.agent .after').last().innerText()));
  check('a "What\'s next" card lists the suggested pages', (await page.locator('.next-card li').count()) === 3 && (await page.locator('.next-card [data-say="Show the map"]').count()) === 1);
  check('…plus a visitor journey on the map', (await page.evaluate(() => window.moss.pageModel.get().flows.length)) === 1);
  const cardName = await page.locator('.next-card li b').first().innerText();
  await page.locator('.next-card li .chip').first().click(); await page.waitForTimeout(100); await page.evaluate(() => window.moss.app.whenIdle());
  check('"Build" on the card builds that page', (await page.evaluate(() => window.moss.pageModel.get().pages.map((x) => x.name))).includes(cardName) && (await page.locator('.next-card li.built').count()) === 1, cardName);
  await say('show the map');
  check('"show the map" opens Flow with the remaining drafts', (await page.evaluate(() => window.moss.app.view())) === 'flow' && (await page.locator('.pcard.draft').count()) === 2);
  const draftName = await page.locator('.pcard.draft h3').first().innerText();
  const box = await page.locator('.pcard.draft').first().boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + 20);
  await page.waitForTimeout(100); await page.evaluate(() => window.moss.app.whenIdle());
  check('tapping a draft on the map builds that page', (await page.evaluate(() => window.moss.pageModel.get().pages.map((x) => x.name))).includes(draftName), draftName);
  await say('show the map');
  const home = await page.locator('.pcard[data-page="home"]').boundingBox();
  await page.mouse.click(home.x + home.width / 2, home.y + 30); await page.waitForTimeout(300);
  check('clicking a page card on the map opens that page', (await page.evaluate(() => window.moss.app.view())) === 'page' && (await page.evaluate(() => window.moss.pageModel.get().currentPage)) === 'home');
  await say('skip the rest');
  check('"skip the rest" clears the remaining drafts', (await page.evaluate(() => (window.moss.pageModel.get().drafts || []).length)) === 0);
  check('the interview opens with "Let\'s plan this out"', /Let's plan this out together/.test(await page.locator('.msg.agent .text:not(.after)').first().innerText()));

  // autopilot still works: example chips and "just build"
  await page.goto(URL);
  await page.click('#examples .chip >> nth=1'); await page.evaluate(() => window.moss.app.whenIdle());
  check('example chips build straight away', (await homeTypes()).length === 7 && !(await plan()));
  await page.goto(URL);
  await say('just build a bookkeeping app for freelancers');
  check('"just build…" skips the interview', (await homeTypes()).length === 7);

  check('no console/page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  const failed = results.filter((x) => !x).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
