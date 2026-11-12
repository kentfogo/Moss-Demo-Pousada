// Site knowledge (Moss index #2): the passages of a scraped site, one index per site, reused for 24 hours.
// Mocks and later edits retrieve only the passages that matter instead of sending the whole scrape to the model.
import { client, ensureIndex } from './_moss.js';

export const KNOWLEDGE = { maxAgeMs: 24 * 3600e3, maxIndexes: 50, minScore: 0.35, uploadWaitMs: 7000 };
export const siteIndexName = (host) => 'site-' + String(host || '').toLowerCase().replace(/^www\./, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const ready = new Map(); // index name → true once Moss reports it Ready (per instance)

/** Is there a fresh (under 24 h) index for this site? Returns { name, fresh, info } or null. */
export async function lookup(host, tr, env = process.env) {
  const c = await client(env); if (!c) return null;
  const name = siteIndexName(host);
  const end = tr && tr.start('knowledge.lookup', { index: name });
  let info = null;
  try { info = await c.getIndex(name); } catch { info = null; }
  const age = info ? Date.now() - Date.parse(info.updatedAt || info.createdAt) : null;
  const fresh = !!info && info.status !== 'Failed' && age < KNOWLEDGE.maxAgeMs;
  if (info && info.status === 'Ready') ready.set(name, true);
  if (end) end({ exists: !!info, fresh, status: info && info.status, ageMin: age != null ? Math.round(age / 60000) : null });
  return { name, fresh, info };
}

/** The summary stored with the index (so a cached site skips the crawl). */
export async function cachedSummary(name, env = process.env) {
  const c = await client(env); if (!c) return null;
  try { const [m] = await c.getDocs(name, { docIds: ['__meta'] }); const raw = m && m.text && m.text.startsWith('{') ? m.text : m && m.metadata && m.metadata.summary; return raw ? JSON.parse(raw) : null; } catch { return null; }
}

/**
 * (Re)build a site's index from its passages. Waits until the upload is done (Moss then finishes the build on its
 * own), or KNOWLEDGE.uploadWaitMs, whichever is first. Keeps at most ~50 site indexes, deleting the oldest.
 */
export async function build(host, passages, summary, tr, env = process.env) {
  const c = await client(env); if (!c) return null;
  const name = siteIndexName(host);
  const end = tr && tr.start('index.build', { index: name, passages: passages.length });
  try { await c.deleteIndex(name); } catch {} // stale or missing: either way start fresh
  ready.delete(name);
  // cap: delete the oldest site indexes beyond the limit
  try {
    const all = (await c.listIndexes()).filter((x) => /^site-/.test(x.name) && x.name !== name).sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
    const extra = all.length - (KNOWLEDGE.maxIndexes - 1);
    for (const x of all.slice(0, Math.max(0, extra))) { try { await c.deleteIndex(x.name); } catch {} }
  } catch {}
  const docs = passages.map((p, i) => ({ id: `p${i}`, text: p.text, metadata: { kind: p.kind, page: p.page } }));
  docs.push({ id: '__meta', text: JSON.stringify(summary).slice(0, 8000), metadata: { kind: 'meta' } }); // the summary, so a cached site skips the crawl
  let uploaded = false, done = false, error = null, phase = null;
  const job = c.createIndex(name, docs, { onProgress: (p) => { phase = p && (p.currentPhase || p.status); if (p && p.status && p.status !== 'pending_upload' && p.status !== 'uploading') uploaded = true; } })
    .then(() => { done = true; ready.set(name, true); }, (e) => { error = String(e && e.message).slice(0, 200); });
  // keep the build going after the response is sent (Vercel would otherwise freeze the function)
  let background = false;
  try { const { waitUntil } = await import('@vercel/functions'); waitUntil(job); background = !!process.env.VERCEL; } catch {}
  // on Vercel the build carries on after the response: don't make the first mock wait for it (it uses the passages
  // directly; later edits use the index). Elsewhere, wait until the upload is done.
  const t0 = Date.now(); const waitMs = background ? 300 : KNOWLEDGE.uploadWaitMs;
  while (!done && !error && !uploaded && Date.now() - t0 < waitMs) { await new Promise((r) => setTimeout(r, 50)); }
  if (end) end({ ready: done, uploaded: uploaded || done, phase, background, ...(error ? { error } : {}) });
  if (error) throw new Error(error);
  return { name, ready: done, passages: passages.length };
}

/** Retrieve passages for one or more queries. Returns [] when the index isn't ready yet. Span: knowledge.query. */
export async function retrieve(name, queries, tr, env = process.env, topK = 3) {
  const c = await client(env); if (!c || !name) return [];
  if (!ready.get(name)) {
    try { const info = await c.getIndex(name); if (info.status !== 'Ready') { if (tr) tr.add('knowledge.pending', tr.now(), tr.now(), { index: name, status: info.status }); return []; } ready.set(name, true); }
    catch { return []; }
  }
  await ensureIndex(c, name, () => [], tr, 'knowledge.load');
  const end = tr && tr.start('knowledge.query', { index: name, queries: queries.length });
  const results = await Promise.all(queries.map((q) => c.query(name, q, { topK }).catch(() => ({ docs: [] }))));
  const seen = new Set(); const out = [];
  results.forEach((r) => (r.docs || []).forEach((d) => { if (d.id === '__meta' || seen.has(d.id) || d.score < KNOWLEDGE.minScore) return; seen.add(d.id); out.push({ text: d.text, kind: d.metadata && d.metadata.kind, score: Math.round(d.score * 1000) / 1000 }); }));
  if (end) end({ passages: out.length, best: out[0] ? out[0].score : null });
  return out;
}

/** Without an index (still building): pick passages by kind straight from the scrape. */
export function byKind(passages, kinds = ['service', 'hours', 'review', 'contact', 'price', 'about', 'faq'], per = 2) {
  const out = [];
  kinds.forEach((k) => (passages || []).filter((p) => p.kind === k).slice(0, per).forEach((p) => out.push({ text: p.text, kind: p.kind })));
  return out;
}

export const factsBlock = (facts) => (facts && facts.length ? `SITE FACTS (retrieved from their real site; use them, don't invent beyond them):\n${facts.map((f) => `- [${f.kind}] ${f.text}`).join('\n')}\n\n` : '');
