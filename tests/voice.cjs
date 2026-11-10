// Voice tests with a controllable fake SpeechRecognition / speechSynthesis (headless Chromium has no mic).
// Run: node tests/voice.cjs
const { chromium } = require('playwright');
const path = require('path');

const FILE = 'file://' + path.resolve(__dirname, '..', 'moss-builder.html');
const results = [];
const check = (name, ok, detail = '') => { results.push(!!ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

// Fake recognizer. Live sessions are driven by window.__say(text) and window.__drop();
// push-to-talk (non-continuous) sessions "hear" window.__pttPhrase once.
function fakeSpeech() {
  window.__spoken = []; window.__cancels = 0; window.__starts = 0;
  class FakeSR {
    start() {
      window.__starts++; this.running = true; window.__rec = this;
      if (!this.continuous && window.__pttPhrase) {
        const p = window.__pttPhrase; window.__pttPhrase = '';
        setTimeout(() => { this.emit(p.split(' ').slice(0, 2).join(' '), false); setTimeout(() => { this.emit(p, true); setTimeout(() => this.end(), 20); }, 40); }, 40);
      }
    }
    emit(text, isFinal) { if (this.running && this.onresult) this.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: text }], { isFinal })] }); }
    end() { if (!this.running) return; this.running = false; this.onend && this.onend(); }
    stop() { setTimeout(() => this.end(), 10); }
    abort() { this.end(); }
  }
  window.__say = (text) => { const r = window.__rec; if (!r || !r.running) return false; r.emit(text.split(' ').slice(0, 2).join(' '), false); setTimeout(() => r.emit(text, true), 30); return true; };
  window.__drop = () => window.__rec && window.__rec.end(); // Chrome ends sessions on its own after silence
  window.__interim = (text) => window.__rec && window.__rec.emit(text, false);
  window.SpeechRecognition = FakeSR; window.webkitSpeechRecognition = FakeSR;
  window.SpeechSynthesisUtterance = function (t) { this.text = t; };
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { speaking: false, speak: (u) => { window.__spoken.push(u.text); }, cancel: () => window.__cancels++, getVoices: () => [], addEventListener() {} } });
}

async function open(browser, speed) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(fakeSpeech);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`${FILE}?speed=${speed}`);
  return { ctx, page, errors };
}

(async () => {
  const browser = await chromium.launch();
  const { ctx, page, errors } = await open(browser, 0.04);
  const idle = async () => { await page.waitForTimeout(150); await page.evaluate(() => window.moss.app.whenIdle()); };
  const say = async (t) => { await page.evaluate((x) => window.__say(x), t); await page.waitForTimeout(1750); await idle(); }; // 1.4 s of silence commits
  const spoken = () => page.evaluate(() => window.__spoken.slice());
  const userCount = () => page.locator('.msg.user').count();
  const live = () => page.evaluate(() => window.moss.app.isLive());

  check('mic is the primary control on the start screen', await page.locator('#introMic').isVisible());

  // 1. the mic stays on across turns
  await page.click('#introMic');
  check('tapping the mic starts a live session', (await live()) && (await page.getAttribute('#introMic', 'aria-pressed')) === 'true');
  await say('just build a seaside pousada in Trancoso with nine rooms');
  const types = await page.$$eval('#siteSections > section', (els) => els.map((e) => e.dataset.type));
  check('a spoken description builds the page', types.length === 7, types.join(','));
  check('Moss speaks its reply', (await spoken()).some((t) => t.includes('boutique pousada')));
  check('the mic is still live after the turn', (await live()) && (await page.getAttribute('#micBtn', 'aria-pressed')) === 'true');
  check('status shows the live hint', (await page.locator('#status').innerText()).toLowerCase().includes('stop listening'));

  // 2. Chrome ending the session doesn't turn the mic off
  const s0 = await page.evaluate(() => window.__starts);
  await page.evaluate(() => window.__drop()); await page.waitForTimeout(400);
  check('recognition restarts by itself while live', (await page.evaluate(() => window.__starts)) > s0 && (await live()));

  // 3. Moss's own voice is ignored (echo on speakers)
  await page.evaluate(() => window.moss.voice.speak('Seven sections are live on Home. Ask for any change.'));
  await page.waitForTimeout(900); // Moss starts speaking after a quiet moment
  const u0 = await userCount(); const c0 = await page.evaluate(() => window.__cancels);
  await say('seven sections are live on home');
  check('echo of Moss\'s own words is not sent and does not cut it off', (await userCount()) === u0 && (await page.evaluate(() => window.__cancels)) === c0);

  // 4. barge-in: real speech cuts Moss off and becomes the next turn
  await page.evaluate(() => window.moss.voice.speak('Here is a long answer about the rooms and the garden and the beach.'));
  await page.waitForTimeout(900);
  const c1 = await page.evaluate(() => window.__cancels);
  const h0 = await page.locator('.sec-hero h1').innerText();
  await say('make the headline punchier');
  check('talking over Moss stops its speech', (await page.evaluate(() => window.__cancels)) > c1);
  check('…and your words become the next turn', (await page.locator('.sec-hero h1').innerText()) !== h0);

  // 4b. a pause after "and…" is not the end of your turn
  const uA = await userCount();
  await page.evaluate(() => window.__say('add a gallery section and'));
  await page.waitForTimeout(1700);
  const midway = await userCount();
  await page.evaluate(() => window.__say('a pricing section too'));
  await page.waitForTimeout(1800); await idle();
  const lastUser = await page.locator('.msg.user').last().innerText();
  check('a pause after "and…" waits for the rest of the sentence', midway === uA && (await userCount()) === uA + 1 && /gallery section and a pricing/i.test(lastUser), lastUser);

  // 4c. Moss never starts talking while you are
  const before = (await spoken()).length;
  for (let i = 0; i < 6; i++) {
    await page.evaluate((k) => window.__interim(`well I think maybe ${k}`), i);
    if (i === 1) await page.evaluate(() => window.moss.voice.speak('Here is something I wanted to say.')); // arrives mid-sentence
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(1000);
  const after4c = await spoken();
  check('Moss holds (then drops) a line while you are talking', after4c.length === before && !after4c.includes('Here is something I wanted to say.'));
  await page.evaluate(() => window.moss.voice.speak('Quiet now, so I can speak.'));
  await page.waitForTimeout(900);
  check('…and speaks once you have been quiet', (await spoken()).includes('Quiet now, so I can speak.'));
  await page.waitForTimeout(1600); await idle(); // let the half-heard words above settle

  // 5. spoken page references become @mentions
  await say('add an about page');
  await say('go to at home');
  check('"at home" is heard as @Home', (await page.evaluate(() => window.moss.pageModel.get().currentPage)) === 'home');
  check('fromSpeech keeps "on" for links', (await page.evaluate(() => window.moss.app.fromSpeech('link this to the CTA on the home page'))) === 'Link this to the CTA on @Home');

  // 6. "stop listening" turns the mic off for good
  await say('stop listening');
  check('"stop listening" ends the live session', !(await live()) && (await page.getAttribute('#micBtn', 'aria-pressed')) === 'false');
  const s1 = await page.evaluate(() => window.__starts);
  await page.evaluate(() => window.__drop()); await page.waitForTimeout(400);
  check('…and it stays off', (await page.evaluate(() => window.__starts)) === s1);

  // 7. typed messages are not spoken
  const n = (await spoken()).length;
  await page.fill('#chatInput', 'warmer colors'); await page.press('#chatInput', 'Enter'); await idle();
  check('typed message gets no spoken reply', (await spoken()).length === n);

  // 8. hold Space for push-to-talk when the mic is off
  await page.evaluate(() => { window.__pttPhrase = 'move testimonials above features'; document.activeElement && document.activeElement.blur(); });
  await page.keyboard.down('Space'); await page.waitForTimeout(150); await page.keyboard.up('Space'); await idle();
  const order = await page.$$eval('#siteSections > section', (els) => els.map((e) => e.dataset.type));
  check('hold Space to talk when the mic is off', order.indexOf('testimonials') < order.indexOf('features'), order.join(','));
  await page.fill('#chatInput', 'hello'); await page.focus('#chatInput'); await page.keyboard.press('Space');
  check('Space types normally in the chat box', (await page.inputValue('#chatInput')) === 'hello ');
  await page.fill('#chatInput', '');

  // 9. mute silences spoken replies
  await page.click('#soundBtn');
  await page.click('#micBtn');
  const m0 = (await spoken()).length;
  await say('make the headline punchier');
  check('muted: no spoken reply', (await spoken()).length === m0);
  await page.click('#micBtn'); await page.click('#soundBtn');
  check('the mic button turns live mode off', !(await live()));
  check('no console/page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();

  // 10. interrupting mid-build stops after the current section, and undo restores
  {
    const { ctx: c2, page: p2, errors: e2 } = await open(browser, 0.5);
    await p2.click('#introMic');
    await p2.evaluate(() => window.__say('just build a specialty coffee roaster in Lisbon'));
    await p2.waitForFunction(() => window.moss.pageModel.get().pages[0] && window.moss.pageModel.get().pages[0].sections.length >= 2, null, { timeout: 15000 });
    await p2.evaluate(() => window.__say('stop'));
    await p2.waitForTimeout(1800); await p2.evaluate(() => window.moss.app.whenIdle());
    const built = await p2.evaluate(() => window.moss.pageModel.get().pages[0].sections.length);
    await p2.waitForTimeout(1500);
    const later = await p2.evaluate(() => window.moss.pageModel.get().pages[0].sections.length);
    check('"stop" halts the build part-way', built >= 2 && built < 7 && later === built, `${built} of 7 sections`);
    check('the chat records where it stopped', (await p2.locator('.log .k', { hasText: 'stopped' }).count()) === 1);
    check('Moss acknowledges the stop out loud', (await p2.evaluate(() => window.__spoken)).some((t) => t.startsWith('Stopped')));
    await p2.evaluate(() => window.__say('undo'));
    await p2.waitForTimeout(1800); await p2.evaluate(() => window.moss.app.whenIdle());
    check('undo after an interruption restores the earlier state', (await p2.evaluate(() => window.moss.pageModel.get().pages.length)) === 0);
    check('mic stays live through the interruption', await p2.evaluate(() => window.moss.app.isLive()));
    check('no errors during interruption', e2.length === 0, e2.slice(0, 3).join(' | '));
    await c2.close();
  }

  // 11. browsers without speech recognition hide the mic
  const c3 = await browser.newContext();
  await c3.addInitScript(() => { delete window.SpeechRecognition; Object.defineProperty(window, 'webkitSpeechRecognition', { value: undefined, configurable: true }); });
  const p3 = await c3.newPage(); await p3.goto(FILE);
  check('no speech recognition: mic hidden', !(await p3.locator('#introMic').isVisible()) && (await p3.evaluate(() => document.body.classList.contains('no-voice'))));
  await c3.close();

  await browser.close();
  const failed = results.filter((x) => !x).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
