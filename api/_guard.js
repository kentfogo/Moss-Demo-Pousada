// Shared request guards for the API functions (files starting with "_" are not deployed as functions).
// Keeps a public link from being used to spend Moss / Deepgram credit from other sites or in bulk.

/** Only the site itself may call these endpoints. Browsers always send Origin on cross-site requests. */
export function sameOrigin(req) {
  const origin = req.headers && (req.headers.origin || req.headers.referer);
  const host = req.headers && (req.headers['x-forwarded-host'] || req.headers.host);
  if (!origin) return true; // same-origin GETs may omit it
  try { return new URL(origin).host === host; } catch { return false; }
}

export function clientIp(req) {
  const h = (req && req.headers) || {};
  const fwd = String(h['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || String(h['x-real-ip'] || '') || (req.socket && req.socket.remoteAddress) || 'unknown';
}

/** Per-IP limits, per function instance. Not a hard global cap (add a Vercel Firewall rule for that), but it stops a single tab or script looping. */
export const LIMITS = {
  agent: { limit: 40, windowMs: 10 * 60e3 },
  speak: { limit: 240, windowMs: 10 * 60e3 },
  token: { limit: 60, windowMs: 10 * 60e3 },
  scrape: { limit: 10, windowMs: 10 * 60e3 },
};
const hits = new Map();
export function rateLimited(req, bucket, now = Date.now()) {
  const { limit, windowMs } = LIMITS[bucket];
  const key = bucket + ':' + clientIp(req);
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (list.length >= limit) { hits.set(key, list); return true; }
  list.push(now); hits.set(key, list);
  if (hits.size > 5000) hits.clear(); // keep memory bounded on a warm instance
  return false;
}
export function resetLimits() { hits.clear(); }

/** Common front door: method, origin and rate limit. Returns true when the request was already answered. */
export function guard(req, res, { methods, bucket }) {
  if (!methods.includes(req.method)) { res.setHeader('allow', methods.join(', ')); res.status(405).json({ error: methods.join(' or ') + ' only' }); return true; }
  if (!sameOrigin(req)) { res.status(403).json({ error: 'forbidden' }); return true; }
  if (bucket && rateLimited(req, bucket)) { res.setHeader('retry-after', '60'); res.status(429).json({ error: 'Too many requests. Give it a minute.' }); return true; }
  return false;
}
