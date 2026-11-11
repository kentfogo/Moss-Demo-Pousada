// Vercel function: GET /api/voice-token
// Mints a short-lived Deepgram token (about 30 s) so the browser can open a live transcription
// WebSocket without ever seeing DEEPGRAM_API_KEY. The token only needs to be valid when connecting.
//
// Environment: DEEPGRAM_API_KEY (required), DEEPGRAM_STT_MODEL (default nova-3), DEEPGRAM_VOICE (default aura-2-thalia-en)

export const DEFAULTS = { model: 'nova-3', voice: 'aura-2-thalia-en' };

/** Only the site itself may use these endpoints (blocks other sites spending your Deepgram credit from a browser). */
export function sameOrigin(req) {
  const origin = req.headers && (req.headers.origin || req.headers.referer);
  const host = req.headers && (req.headers['x-forwarded-host'] || req.headers.host);
  if (!origin) return true; // same-origin GETs may omit it; browsers always send Origin cross-site
  try { return new URL(origin).host === host; } catch { return false; }
}

export async function grant(env = process.env, fetchImpl = fetch) {
  const key = env.DEEPGRAM_API_KEY;
  if (!key) throw Object.assign(new Error('Deepgram is not configured (set DEEPGRAM_API_KEY)'), { status: 503 });
  const r = await fetchImpl('https://api.deepgram.com/v1/auth/grant', { method: 'POST', headers: { authorization: `Token ${key}` } });
  // 401/403: the key works but its role can't issue tokens (needs Member or higher). Speech (/api/speak) still works.
  if (!r.ok) throw Object.assign(new Error(`Deepgram token request failed (${r.status})${r.status === 401 || r.status === 403 ? ': give the key the Member role or higher' : ''}`), { status: 502, speak: true });
  const j = await r.json();
  if (!j.access_token) throw Object.assign(new Error('Deepgram returned no token'), { status: 502 });
  return { token: j.access_token, expiresIn: j.expires_in || 30, model: env.DEEPGRAM_STT_MODEL || DEFAULTS.model, voice: env.DEEPGRAM_VOICE || DEFAULTS.voice, ...(env.DEEPGRAM_LISTEN_URL ? { listenUrl: env.DEEPGRAM_LISTEN_URL } : {}) };
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') { res.setHeader('allow', 'GET, POST'); return res.status(405).json({ error: 'GET only' }); }
  if (!sameOrigin(req)) return res.status(403).json({ error: 'forbidden' });
  try {
    const out = await grant();
    res.setHeader('cache-control', 'no-store');
    return res.status(200).json(out);
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message, ...(e.speak ? { speak: true } : {}) });
  }
}
