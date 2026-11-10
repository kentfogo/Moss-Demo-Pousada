// Vercel function: POST /api/speak {text}
// Turns one sentence of Moss's reply into speech with a Deepgram Aura voice and returns MP3.
// The audio is played by the page itself, so the mic's echo cancellation can remove it (no self-interruption on speakers).
//
// Environment: DEEPGRAM_API_KEY (required), DEEPGRAM_VOICE (default aura-2-thalia-en)
import { sameOrigin, DEFAULTS } from './voice-token.js';

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

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('allow', 'POST'); return res.status(405).json({ error: 'POST only' }); }
  if (!sameOrigin(req)) return res.status(403).json({ error: 'forbidden' });
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'invalid JSON' }); } }
  const text = typeof body?.text === 'string' ? body.text.replace(/\s+/g, ' ').trim() : '';
  if (!text) return res.status(400).json({ error: 'text is required' });
  if (text.length > MAX_TEXT) return res.status(413).json({ error: 'text too long' });
  try {
    const audio = await synthesize(text);
    res.setHeader('content-type', 'audio/mpeg');
    res.setHeader('cache-control', 'no-store');
    res.status(200);
    return res.end(audio);
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }
}
