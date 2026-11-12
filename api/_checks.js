// Startup checks for server.mjs: are the Moss keys accepted, and can the Deepgram key mint listening tokens?
// A Deepgram key below the Member role still speaks (Aura) but can't mint tokens, so listening silently falls back to
// the browser's recognizer, which has no echo cancellation for Moss's voice (Moss then hears itself on speakers).
import { mossSettings } from './agent.js';
import { grant } from './voice-token.js';

/** Returns one line per service: { name, ok, text }. Never prints a key or a token. */
export async function checkServices(env = process.env, fetchImpl = fetch) {
  const lines = [];
  const { token, base, model } = mossSettings(env);
  if (!token) lines.push({ name: 'Moss', ok: false, text: 'no keys (set MOSS_PROJECT_ID and MOSS_PROJECT_KEY): the offline demo agent answers' });
  else {
    try { // GET /v1/models answers 200 with no key or a wrong one, so this is a real 1-token call (about 90 tokens)
      const r = await fetchImpl(`${base}/chat/completions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ model, messages: [{ role: 'user', content: 'ok' }], max_tokens: 1 }) });
      lines.push(r.ok ? { name: 'Moss', ok: true, text: 'keys accepted' } : { name: 'Moss', ok: false, text: `the keys were refused (${r.status})${r.status === 401 ? ': check MOSS_PROJECT_ID and MOSS_PROJECT_KEY' : ''}` });
    } catch (e) { lines.push({ name: 'Moss', ok: false, text: `couldn't reach ${base} (${e.cause?.code || e.message})` }); }
  }
  if (!env.DEEPGRAM_API_KEY) lines.push({ name: 'Deepgram', ok: false, text: 'no key: voice uses the browser (no echo cancellation on speakers; use headphones)' });
  else {
    try { await grant(env, fetchImpl); lines.push({ name: 'Deepgram', ok: true, text: 'listening and speech OK' }); }
    catch (e) { lines.push({ name: 'Deepgram', ok: false, text: /role/.test(e.message) ? 'this key can speak but can\'t create listening tokens: give it the Member role or higher, or listening falls back to the browser and Moss may hear itself' : /fetch failed|ENOTFOUND|ECONN/i.test(e.message + (e.cause?.code || '')) ? 'couldn\'t reach api.deepgram.com' : e.message }); }
  }
  return lines;
}
