// Voice tests with a fake SpeechRecognition / speechSynthesis (headless Chromium has no mic).
// Run: node tests/voice.cjs
const { chromium } = require('playwright');
const path = require('path');

const URL = 'file://' + path.resolve(__dirname, '..', 'moss-builder.html') + '?speed=0.04';
const results = [];
const check = (name, ok, detail = '') => { results.push(!!ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

// Fake recognizer: on start() it "hears" window.__nextPhrase (interim, then final) and ends.
function fakeSpeech() {
  window.__spoken = []; window.__cancels = 0; window.__interims = [];
  class FakeSR {
    start() {
      const phrase = window.__nextPhrase || '';
      setTimeout(() => {
        this.onresult && this.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: phrase.split(' ').slice(0, 2).join(' ') }], { isFinal: false })] });
        window.__interims.push(document.activeElement && document.activeElement.value);
        setTimeout(() => {
          this.onresult && this.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: phrase }], { isFinal: true })] });
          setTimeout(() => this.onend && this.onend(), 20);
        }, 40);
      }, 40);
    }
    stop() {}
    abort() { this.onend && this.onend(); }
  }
  window.SpeechRecognition = FakeSR; window.webkitSpeechRecognition = FakeSR;
  window.SpeechSynthesisUtterance = function (t) { this.text = t; };
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { speak: (u) => window.__spoken.push(u.text), cancel: () => window.__cancels++, getVoices: () => [], addEventListener() {} } });
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(fakeSpeech);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(URL);
  const idle = async () => { await page.waitForTimeout(120); await page.evaluate(() => window.moss.app.whenIdle()); };
  const spoken = () => page.evaluate(() => window.__spoken.slice());
  const hear = (phrase) => page.evaluate((p) => { window.__nextPhrase = p; }, phrase);

  check('mic is the primary control on the start screen', await page.locator('#introMic').isVisible());
  check('hint about holding Space is shown', await page.locator('.voice-hint').isVisible());

  // 1. tap the mic, speak the business, page builds, reply is spoken
  await hear('a seaside pousada in Trancoso with nine rooms');
  await page.click('#introMic');
  await page.waitForTimeout(60);
  check('mic shows listening state', (await page.getAttribute('#introMic', 'aria-pressed')) === 'true');
  await idle();
  const types = await page.$$eval('#siteSections > section', (els) => els.map((e) => e.dataset.type));
  check('spoken description builds the page', types.length === 7, types.join(','));
  check('user bubble shows what was heard', (await page.locator('.msg.user').first().innerText()).startsWith('A seaside pousada in Trancoso'));
  const s1 = await spoken();
  check('Moss speaks its reply and the follow-up', s1.some((t) => t.includes('boutique pousada')) && s1.some((t) => t.includes('Seven sections are live')), JSON.stringify(s1).slice(0, 160));
  check('spoken text drops the @ from mentions', s1.every((t) => !t.includes('@')), JSON.stringify(s1.filter((t) => t.includes('@'))));
  check('mic resets after sending', (await page.getAttribute('#micBtn', 'aria-pressed')) === 'false');

  // 2. typed messages are not spoken
  const n = (await spoken()).length;
  await page.fill('#chatInput', 'warmer colors'); await page.press('#chatInput', 'Enter'); await idle();
  check('typed message gets no spoken reply', (await spoken()).length === n && (await page.getAttribute('#site', 'data-palette')) === 'warm');

  // 3. hold Space to talk (focus outside text fields)
  await hear('move testimonials above features');
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  await page.keyboard.down('Space'); await page.waitForTimeout(150); await page.keyboard.up('Space');
  await idle();
  const order = await page.$$eval('#siteSections > section', (els) => els.map((e) => e.dataset.type));
  check('hold Space to talk', order.indexOf('testimonials') < order.indexOf('features') && (await spoken()).length > n, order.join(','));

  // 4. Space inside the text box still types a space
  await page.fill('#chatInput', 'hello'); await page.focus('#chatInput'); await page.keyboard.press('Space');
  check('Space types normally in the chat box', (await page.inputValue('#chatInput')) === 'hello ' && !(await page.evaluate(() => window.moss.voice.isListening())));
  await page.fill('#chatInput', '');

  // 5. spoken page references become @mentions
  await hear('add an about page'); await page.click('#micBtn'); await idle();
  await hear('go to at home'); await page.click('#micBtn'); await idle();
  const cur = await page.evaluate(() => window.moss.pageModel.get().currentPage);
  check('"at home" is heard as @Home', cur === 'home' && (await page.locator('.msg.user').last().innerHTML()).includes('mention'), cur);
  check('fromSpeech keeps "on" for links', (await page.evaluate(() => window.moss.app.fromSpeech('link this to the CTA on the home page'))) === 'Link this to the CTA on @Home');

  // 6. barge-in: starting the mic cancels speech
  const c0 = await page.evaluate(() => window.__cancels);
  await hear(''); await page.click('#micBtn'); await page.waitForTimeout(200);
  check('talking over Moss stops its speech', (await page.evaluate(() => window.__cancels)) > c0);
  check('silence sends nothing', (await page.locator('.msg.user').count()) === 5);

  // 7. mute silences spoken replies
  await page.click('#soundBtn');
  const m0 = (await spoken()).length;
  await hear('make the headline punchier'); await page.click('#micBtn'); await idle();
  check('muted: no spoken reply', (await spoken()).length === m0);
  await page.click('#soundBtn');

  check('no console/page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();

  // 8. browsers without speech recognition hide the mic
  const ctx2 = await browser.newContext();
  await ctx2.addInitScript(() => { delete window.SpeechRecognition; delete window.webkitSpeechRecognition; Object.defineProperty(window, 'webkitSpeechRecognition', { value: undefined, configurable: true }); });
  const p2 = await ctx2.newPage(); await p2.goto(URL);
  check('no speech recognition: mic hidden, typing hint shown', !(await p2.locator('#introMic').isVisible()) && (await p2.evaluate(() => document.body.classList.contains('no-voice'))));
  await ctx2.close();

  await browser.close();
  const failed = results.filter((x) => !x).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
