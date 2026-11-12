// Vercel function: POST /api/speak {text}
// Turns one sentence of Moss's reply into speech with a Deepgram Aura voice and returns MP3.
// The audio is played by the page itself, so the mic's echo cancellation can remove it (no self-interruption on speakers).
//
// Environment: DEEPGRAM_API_KEY (required), DEEPGRAM_VOICE (default aura-2-thalia-en)
import { DEFAULTS } from './voice-token.js';
import { guard } from './_guard.js';

export const MAX_TEXT = 600;

export async function synthesize(text, env = process.env, fetchImpl = fetch) {
  const key = env.DEEPGRAM_API_KEY;
  if (!key) throw Object.assign(new Error('Deepgram is not configured (set DEEPGRAM_API_KEY)'), { status: 503 });
  const voice = env.DEEPGRAM_VOICE || DEFAULTS.voice;
  const r = await fetchImpl(`https://api.deepgram.com/v1/speak?model=${encodeURIComponent(voice)}&encoding=mp3`, {
    method: 'POST', headers: { authorization: `Token ${key}`, 'content-type': 'application/json' }, body: JSON.stringify({ text }),
  });
  if (!r.ok) throw Object.assign(new Error(`Deepgram speech failed (${r.status})`), { status: 502 });
  return Buffer.from(await r.arrayBuffer());
}

/** Start Aura synthesis and return Deepgram's response (its body streams MP3 as it is generated). */
export async function synthesizeStream(text, env = process.env, fetchImpl = fetch) {
  const key = env.DEEPGRAM_API_KEY;
  if (!key) throw Object.assign(new Error('Deepgram is not configured (set DEEPGRAM_API_KEY)'), { status: 503 });
  const voice = env.DEEPGRAM_VOICE || DEFAULTS.voice;
  const r = await fetchImpl(`https://api.deepgram.com/v1/speak?model=${encodeURIComponent(voice)}&encoding=mp3`, {
    method: 'POST', headers: { authorization: `Token ${key}`, 'content-type': 'application/json' }, body: JSON.stringify({ text }),
  });
  if (!r.ok) throw Object.assign(new Error(`Deepgram speech failed (${r.status})`), { status: 502 });
  return r;
}

/**
 * GET /api/speak?text=… streams the audio through as Deepgram produces it, so the page's <audio> starts playing on
 * the first bytes (and the browser caches repeated sentences). POST {text} returns the whole MP3 (kept for clients
 * that fetch a blob).
 */
export default async function handler(req, res) {
  if (guard(req, res, { methods: ['GET', 'POST'], bucket: 'speak' })) return;
  let text = '';
  if (req.method === 'GET') {
    const q = (req.query && req.query.text) || new URL(req.url, 'http://x').searchParams.get('text') || '';
    text = String(q).replace(/\s+/g, ' ').trim();
  } else {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'invalid JSON' }); } }
    text = typeof body?.text === 'string' ? body.text.replace(/\s+/g, ' ').trim() : '';
  }
  if (!text) return res.status(400).json({ error: 'text is required' });
  if (text.length > MAX_TEXT) return res.status(413).json({ error: 'text too long' });
  try {
    if (req.method === 'POST') {
      const audio = await synthesize(text);
      res.setHeader('content-type', 'audio/mpeg');
      res.setHeader('cache-control', 'no-store');
      res.status(200);
      return res.end(audio);
    }
    const r = await synthesizeStream(text);
    res.statusCode = 200;
    res.setHeader('content-type', 'audio/mpeg');
    res.setHeader('cache-control', 'private, max-age=86400'); // the same sentence again costs nothing
    if (res.flushHeaders) res.flushHeaders();
    for await (const chunk of r.body) res.write(chunk);
    return res.end();
  } catch (e) {
    if (res.headersSent) return res.end();
    return res.status(e.status || 500).json({ error: e.message });
  }
}
