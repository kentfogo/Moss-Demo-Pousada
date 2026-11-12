// Moss indexes (retrieval) for the agent: the intent router and per-site knowledge.
// The client loads an index once per warm function instance and queries it in memory (sub-millisecond search; the
// query is embedded on this machine). Index files and the embedding model are cached under /tmp (the only writable
// path on Vercel). Credentials are the same Moss project id and key used for inference.
import { INTENTS, INTENT_INDEX, intentDocs, eligible } from './_intents.js';

let clientP = null;
const loaded = new Map(); // index name → Promise (loaded once per instance)

export function mossCreds(env = process.env) {
  let id = env.MOSS_PROJECT_ID || env.MOSS_PROJECT || '';
  let key = env.MOSS_PROJECT_KEY || env.MOSS_API_KEY || '';
  if (!id && key.includes(':')) [id, key] = key.split(':');
  return { id, key };
}

/** The Moss client, or null when not configured. Tests can replace it with setClient(). */
export async function client(env = process.env) {
  if (clientP) return clientP;
  const { id, key } = mossCreds(env);
  if (!id || !key) return null;
  clientP = (async () => {
    const hf = await import('@huggingface/transformers').catch(() => null);
    if (hf && hf.env) { hf.env.cacheDir = '/tmp/moss-models'; } // read-only filesystem except /tmp
    const { MossClient } = await import('@inferedge/moss');
    return new MossClient(id, key);
  })();
  clientP.catch(() => { clientP = null; });
  return clientP;
}
export function setClient(c) { clientP = c ? Promise.resolve(c) : null; loaded.clear(); }

/** Load an index into memory, creating it from docs() if it doesn't exist yet. Spans: index.load, index.build. */
export function ensureIndex(c, name, docs, tr, span = 'index.load') {
  if (loaded.has(name)) return loaded.get(name);
  const p = (async () => {
    const end = tr && tr.start(span, { index: name });
    const load = () => c.loadIndex(name, { cachePath: '/tmp/moss-indexes' });
    try { await load(); }
    catch (e) {
      if (!/not.?found|does not exist|404|no such index|unknown index/i.test(String(e && e.message))) throw e;
      const b = tr && tr.start('index.build', { index: name });
      try { await c.createIndex(name, docs()); }
      catch (e2) { if (!/already exists|409|conflict/i.test(String(e2 && e2.message))) throw e2; } // another instance built it
      if (b) b({ docs: docs().length });
      await load();
    }
    if (end) end({ cold: true });
  })();
  loaded.set(name, p);
  p.catch(() => loaded.delete(name));
  return p;
}
export const isLoaded = (name) => loaded.has(name);

/* ------------------------------------------------------------ intent router */
export const THRESHOLDS = { high: 0.65, mid: 0.5, margin: 0.03, coldBudgetMs: 250 }; // from data/router-eval.md
export function thresholds(env = process.env) {
  return { high: Number(env.ROUTER_HIGH) || THRESHOLDS.high, mid: Number(env.ROUTER_MID) || THRESHOLDS.mid, margin: THRESHOLDS.margin, coldBudgetMs: THRESHOLDS.coldBudgetMs };
}

/** Best score per command, from the top matches; with a message, commands it contradicts are dropped (hybrid: semantic + keyword guards). */
export function rank(docs, message) {
  const best = new Map();
  (docs || []).forEach((d) => { const c = d.metadata && d.metadata.canonical; if (c && (message == null || eligible(c, message)) && (!best.has(c) || best.get(c) < d.score)) best.set(c, d.score); });
  return [...best.entries()].map(([canonical, score]) => ({ canonical, score })).sort((a, b) => b.score - a.score);
}
/** high: run the command without the LLM · mid: give the LLM hints · low: nothing. Near-ties drop to mid. */
export function decide(ranked, th) {
  const [a, b] = ranked;
  if (!a || a.score < th.mid) return { decision: 'low', top: ranked.slice(0, 3) };
  if (a.score >= th.high && !(b && a.score - b.score < th.margin)) return { decision: 'high', canonical: a.canonical, score: a.score, top: ranked.slice(0, 3) };
  return { decision: 'mid', top: ranked.slice(0, 3) };
}

/** Warm the router (model + index) without routing anything. */
export async function warm(tr, env = process.env) {
  const c = await client(env); if (!c) return false;
  await ensureIndex(c, INTENT_INDEX, intentDocs, tr, 'router.load');
  return true;
}
export async function route(message, tr, env = process.env) {
  const c = await client(env); if (!c) return null;
  const th = thresholds(env);
  // a cold instance needs seconds to load the model and index: don't make this turn wait; it loads meanwhile
  const ready = ensureIndex(c, INTENT_INDEX, intentDocs, tr, 'router.load');
  const loadedNow = await Promise.race([ready.then(() => true), new Promise((r) => setTimeout(() => r(false), th.coldBudgetMs))]);
  if (!loadedNow) { ready.catch(() => {}); if (tr) tr.add('router.cold', tr.now(), tr.now(), { skipped: true }); return { decision: 'cold', top: [] }; }
  const end = tr && tr.start('router.query');
  const res = await c.query(INTENT_INDEX, message, { topK: 8 });
  const d = decide(rank(res.docs, message), th);
  if (end) end({ score: d.top[0] ? Math.round(d.top[0].score * 1000) / 1000 : null, decision: d.decision, best: d.top[0] && d.top[0].canonical });
  return d;
}
export { INTENTS, INTENT_INDEX };
