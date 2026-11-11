// The Deepgram voice path in the browser, with fakes for the mic, MediaRecorder, Deepgram's WebSocket and audio playback.
// A local server stands in for /api/voice-token and /api/speak. Run: node tests/voice-deepgram.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const results = [];
const check = (name, ok, detail = '') => { results.push(!!ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
const spoken = []; let speakFail = false;

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/api/voice-token') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ token: 'jwt-test', model: 'nova-3', voice: 'aura-2-thalia-en', listenUrl: 'wss://deepgram.test/v1/listen' })); }
  if (url === '/api/speak') {
    let body = ''; req.on('data', (c) => (body += c));
    req.on('end', () => { spoken.push(JSON.parse(body).text); if (speakFail) { res.writeHead(500); return res.end('{}'); } res.writeHead(200, { 'content-type': 'audio/mpeg' }); res.end(Buffer.from([0xff, 0xfb, 0x90, 0x00])); });
    return;
  }
  if (url === '/api/agent') { res.writeHead(404); return res.end(); } // no Moss here: the offline agent answers
  const file = url === '/' ? 'moss-builder.html' : decodeURIComponent(url).replace(/^\/+/, '');
  const full = path.join(ROOT, file);
  if (!full.startsWith(ROOT) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) { res.writeHead(404); return res.end(); }
  const TYPES = { html: 'text/html', js: 'text/javascript', css: 'text/css', woff2: 'font/woff2' };
  res.writeHead(200, { 'content-type': TYPES[file.split('.').pop()] || 'application/octet-stream' }); fs.createReadStream(full).pipe(res);
});

function fakes() {
  if (!window.__usePcm) { window.AudioWorkletNode = undefined; } // this context exercises the MediaRecorder fallback
  window.__ws = []; window.__plays = []; window.__pauses = 0; window.__tracksStopped = 0; window.__browserSpoken = [];
  navigator.mediaDevices.getUserMedia = async (c) => { window.__constraints = c; return { getTracks: () => [{ stop: () => window.__tracksStopped++ }] }; };
  window.MediaRecorder = class { static isTypeSupported(m) { return m === 'audio/webm;codecs=opus'; } constructor(st, o) { this.opts = o; this.state = 'inactive'; } start(ms) { this.state = 'recording'; window.__recTimeslice = ms; this.t = setInterval(() => this.ondataavailable && this.ondataavailable({ data: { size: 100 } }), 100); } stop() { this.state = 'inactive'; clearInterval(this.t); } };
  window.WebSocket = class {
    constructor(url, protocols) { this.url = url; this.protocols = protocols; this.readyState = 0; this.sent = []; window.__ws.push(this); setTimeout(() => { this.readyState = 1; this.onopen && this.onopen(); }, 20); }
    send(d) { this.sent.push(typeof d === 'string' ? d : '<audio>'); }
    close() { if (this.readyState === 3) return; this.readyState = 3; setTimeout(() => this.onclose && this.onclose(), 10); }
  };
  // Deepgram messages: interim / final transcripts and the end-of-utterance event
  window.__dg = {
    ws: () => window.__ws[window.__ws.length - 1],
    send: (m) => { const w = window.__dg.ws(); w.onmessage && w.onmessage({ data: JSON.stringify(m) }); },
    interim: (t) => window.__dg.send({ type: 'Results', is_final: false, channel: { alternatives: [{ transcript: t }] } }),
    final: (t) => window.__dg.send({ type: 'Results', is_final: true, speech_final: true, channel: { alternatives: [{ transcript: t }] } }),
    end: () => window.__dg.send({ type: 'UtteranceEnd' }),
    drop: () => { const w = window.__dg.ws(); w.readyState = 3; w.onclose && w.onclose(); },
  };
  window.Audio = class { constructor(src) { this.src = src; } play() { window.__plays.push(this.src); this.playing = true; this.t = setTimeout(() => { this.playing = false; this.onended && this.onended(); }, 600); return Promise.resolve(); } pause() { window.__pauses++; clearTimeout(this.t); this.playing = false; } };
  window.SpeechSynthesisUtterance = function (t) { this.text = t; };
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { speaking: false, speak: (u) => window.__browserSpoken.push(u.text), cancel() {}, getVoices: () => [], addEventListener() {} } });
}

// a fake AudioWorklet pipeline: the test feeds 100 ms PCM frames with a chosen loudness
function fakePcm() {
  window.__usePcm = true; window.__pcmNode = null;
  window.AudioContext = class { constructor(o) { this.sampleRate = (o && o.sampleRate) || 48000; this.state = 'running'; this.destination = {}; this.audioWorklet = { addModule: async () => {} }; } createMediaStreamSource() { return { connect() {}, disconnect() {} }; } createGain() { return { gain: { value: 1 }, connect() {} }; } resume() { return Promise.resolve(); } close() { window.__ctxClosed = (window.__ctxClosed || 0) + 1; return Promise.resolve(); } };
  window.AudioWorkletNode = class { constructor() { this.port = { onmessage: null }; window.__pcmNode = this; } connect() {} };
  window.__frames = (n, rms) => { for (let i = 0; i < n; i++) { const nd = window.__pcmNode; nd && nd.port.onmessage && nd.port.onmessage({ data: { pcm: new ArrayBuffer(3200), rms } }); } };
}

(async () => {
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(fakes);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource: .*(404|500)/.test(m.text())) errors.push(m.text()); });
  await page.goto(`${base}/?speed=0.03`);
  await page.waitForFunction(() => document.body.dataset.voice);
  const idle = () => page.evaluate(() => window.moss.app.whenIdle());

  check('Deepgram is used when /api/voice-token works', (await page.evaluate(() => window.moss.voice.backend())) === 'deepgram');
  await page.click('#introMic'); await page.waitForTimeout(120);
  const ws = await page.evaluate(() => ({ url: window.__dg.ws().url, protocols: window.__dg.ws().protocols, sent: window.__dg.ws().sent.length, ec: window.__constraints.audio.echoCancellation }));
  check('the live connection uses the short-lived token, never the key', JSON.stringify(ws.protocols) === '["bearer","jwt-test"]');
  check('…streams to nova-3 with interim results and end-of-utterance events', /model=nova-3/.test(ws.url) && /interim_results=true/.test(ws.url) && /utterance_end_ms=1000/.test(ws.url));
  check('the mic is opened with echo cancellation and audio is streaming', ws.ec === true && ws.sent > 0);
  check('status says Live · Deepgram', /deepgram/i.test(await page.locator('#status').textContent()), await page.locator('#status').textContent());

  // end of turn comes from Deepgram, so it's quick
  await page.evaluate(() => { window.__dg.interim('just build a smash burger'); });
  check('interim words show in the box', (await page.inputValue('#introInput')) === 'just build a smash burger');
  const t0 = Date.now();
  await page.evaluate(() => { window.__dg.final('just build a smash burger joint in Brooklyn'); window.__dg.end(); });
  await page.waitForFunction(() => document.querySelectorAll('.msg.user').length === 1, null, { timeout: 3000 });
  check('Deepgram\'s end-of-utterance sends right away (no 1.4 s wait)', Date.now() - t0 < 900, `${Date.now() - t0} ms`);
  await idle();
  check('…and the page builds', (await page.evaluate(() => window.moss.pageModel.page('home').sections.length)) === 7);
  check('the input is empty afterwards', (await page.inputValue('#chatInput')) === '');

  // Moss speaks with the Aura voice through the page
  await page.waitForTimeout(1500);
  check('Moss\'s reply is spoken with Deepgram Aura, sentence by sentence', spoken.length >= 2 && spoken.some((t) => /smash burger|Brooklyn|Patty|burger/i.test(t)) && (await page.evaluate(() => window.__plays.length)) >= 1, spoken.slice(0, 2).join(' | '));
  check('…not the browser voice', (await page.evaluate(() => window.__browserSpoken.length)) === 0);

  // an unfinished sentence waits even if Deepgram says the utterance ended
  const n0 = await page.locator('.msg.user').count();
  await page.evaluate(() => { window.__dg.final('make the headline punchier and'); window.__dg.end(); });
  await page.waitForTimeout(700);
  check('"…and" + utterance end still waits for the rest', (await page.locator('.msg.user').count()) === n0);
  await page.evaluate(() => { window.__dg.final('warmer colors'); window.__dg.end(); });
  await page.waitForFunction((n) => document.querySelectorAll('.msg.user').length === n + 1, n0, { timeout: 4000 });
  check('…then sends both parts together', /punchier and warmer colors/i.test(await page.locator('.msg.user').last().innerText()));
  await idle();

  // barge-in stops the Aura audio at once (echo cancellation: two words are enough)
  await page.evaluate(() => window.moss.voice.speak('Here is a fairly long answer about the menu and the opening hours.'));
  await page.waitForFunction(() => window.__plays.length > 0, null, { timeout: 3000 });
  await page.waitForTimeout(1200);
  const p0 = await page.evaluate(() => window.__pauses);
  await page.evaluate(() => window.__dg.interim('actually wait'));
  check('talking over Moss stops the audio immediately', (await page.evaluate(() => window.__pauses)) > p0);
  await page.evaluate(() => { window.__dg.final('actually wait'); window.__dg.end(); });
  await page.waitForTimeout(500); await idle();

  // the connection reconnects with a fresh token if it drops
  const c0 = await page.evaluate(() => window.__ws.length);
  await page.evaluate(() => window.__dg.drop());
  await page.waitForTimeout(700);
  check('a dropped connection reconnects with a fresh token', (await page.evaluate(() => window.__ws.length)) === c0 + 1 && (await page.evaluate(() => window.moss.app.isLive())));

  // if Aura fails, Moss falls back to the browser voice
  speakFail = true;
  await page.evaluate(() => window.moss.voice.speak('First line. Second line.'));
  await page.waitForTimeout(1500);
  check('if Deepgram speech fails, the browser voice takes over', (await page.evaluate(() => window.__browserSpoken.length)) >= 1);
  speakFail = false;

  // stop listening releases the mic and closes the stream
  await page.evaluate(() => { window.__dg.final('stop listening'); window.__dg.end(); });
  await page.waitForTimeout(400);
  const closed = await page.evaluate(() => ({ live: window.moss.app.isLive(), sent: window.__dg.ws().sent.slice(-1)[0], tracks: window.__tracksStopped }));
  check('"stop listening" closes the stream and releases the mic', !closed.live && /CloseStream/.test(closed.sent) && closed.tracks >= 1, JSON.stringify(closed));
  check('no console/page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();

  // without a Deepgram key the page falls back to browser speech
  const ctx2 = await browser.newContext();
  await ctx2.route('**/api/voice-token', (r) => r.fulfill({ status: 503, body: '{"error":"Deepgram is not configured"}' }));
  const p2 = await ctx2.newPage(); await p2.goto(`${base}/?speed=0.03`);
  await p2.waitForFunction(() => document.body.dataset.voice);
  check('no Deepgram key: browser speech is used', (await p2.evaluate(() => window.moss.voice.backend())) === 'browser');
  await ctx2.close();

  // key set but its role can't mint tokens: browser listening, Aura still speaks
  const ctx3 = await browser.newContext();
  await ctx3.addInitScript(fakes);
  await ctx3.route('**/api/voice-token', (r) => r.fulfill({ status: 502, contentType: 'application/json', body: '{"error":"Deepgram token request failed (403)","speak":true}' }));
  const p3 = await ctx3.newPage(); await p3.goto(`${base}/?speed=0.03`);
  await p3.waitForFunction(() => document.body.dataset.voice);
  const before = spoken.length;
  await p3.evaluate(() => window.moss.voice.speak('Still my own voice.'));
  await p3.waitForTimeout(800);
  check('token refused (403): listens with the browser but still speaks with Aura', (await p3.evaluate(() => window.moss.voice.backend())) === 'browser' && spoken.length > before && (await p3.evaluate(() => window.__browserSpoken.length)) === 0);
  await ctx3.close();

  // spend controls: only speech is streamed (raw PCM through an AudioWorklet), silence sends KeepAlive, the mic stops when idle
  const ctx4 = await browser.newContext();
  await ctx4.addInitScript(fakePcm); await ctx4.addInitScript(fakes);
  const p4 = await ctx4.newPage(); const err4 = []; p4.on('pageerror', (e) => err4.push(e.message));
  await p4.goto(`${base}/?speed=0.03&liveidle=8`);
  await p4.waitForFunction(() => document.body.dataset.voice);
  await p4.click('#introMic'); await p4.waitForFunction(() => window.__ws.length && window.__ws[0].readyState === 1 && window.__pcmNode && window.__pcmNode.port.onmessage, null, { timeout: 3000 });
  const url4 = await p4.evaluate(() => window.__dg.ws().url);
  check('with an AudioWorklet, raw 16 kHz PCM is streamed (linear16)', /encoding=linear16/.test(url4) && /sample_rate=16000/.test(url4), url4.split('?')[1]);
  const audioSent = () => p4.evaluate(() => window.__dg.ws().sent.filter((x) => x === '<audio>').length);
  await p4.evaluate(() => window.__frames(30, 0.002)); // 3 s of a quiet room
  check('silence is not streamed (nothing billed)', (await audioSent()) === 0);
  await p4.evaluate(() => window.__frames(3, 0.09)); // someone speaks for 300 ms
  const afterSpeech = await audioSent();
  check('speech is streamed with 400 ms of pre-roll', afterSpeech === 4 + 3, String(afterSpeech));
  await p4.evaluate(() => window.__frames(40, 0.002)); // then 4 s of silence
  const afterTail = await audioSent();
  check('…then 1.5 s of trailing audio so Deepgram can end the utterance, then nothing', afterTail === 7 + 15, String(afterTail));
  const use = await p4.evaluate(() => window.moss.voice.usage());
  check('usage counts what was skipped', use.pcm && use.skippedMs >= 4000 && use.sentMs === 2200, JSON.stringify(use));
  await p4.waitForTimeout(6500);
  check('KeepAlive keeps the quiet connection open', (await p4.evaluate(() => window.__dg.ws().sent.some((x) => /KeepAlive/.test(x)))));
  await p4.waitForFunction(() => !window.moss.app.isLive(), null, { timeout: 12000 }).catch(() => {});
  check('a forgotten hot mic turns itself off and says so', !(await p4.evaluate(() => window.moss.app.isLive())) && /Mic off after/.test(await p4.locator('#messages').textContent()));
  // repeated lines are spoken from the cache
  const n0s = spoken.length;
  await p4.evaluate(() => window.moss.voice.speak('On it.')); await p4.waitForTimeout(900);
  await p4.evaluate(() => window.moss.voice.speak('On it.')); await p4.waitForTimeout(900);
  check('a repeated sentence is fetched once (audio cache)', spoken.length - n0s === 1 && (await p4.evaluate(() => window.moss.voice.usage().cacheHits)) >= 1, String(spoken.length - n0s));
  check('no page errors (PCM path)', err4.length === 0, err4.join(' | '));
  await ctx4.close();

  await browser.close(); server.close();
  const failed = results.filter((x) => !x).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); server.close(); process.exit(1); });
