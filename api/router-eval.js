// Vercel function: GET /api/router-eval
// Runs the held-out phrases (api/_router-eval-set.js) through the intent router's Moss index and reports, for a range of
// thresholds, how many commands would run instantly, how many would wrongly fire, and the query timings. Used to tune
// ROUTER_HIGH / ROUTER_MID. Same-origin and rate-limited like the other functions.
import { guard } from './_guard.js';
import { trace } from './_trace.js';
import { client, ensureIndex, rank, INTENT_INDEX } from './_moss.js';
import { intentDocs } from './_intents.js';
import { EVAL } from './_router-eval-set.js';
import { performance } from 'node:perf_hooks';

export const config = { maxDuration: 60 };

export function evaluate(rows, highs = [0.6, 0.65, 0.7, 0.75, 0.8, 0.82, 0.85, 0.9]) {
  return highs.map((h) => {
    let hit = 0, wrong = 0, falseFire = 0, pos = 0, neg = 0;
    rows.forEach((r) => {
      const fires = r.top && r.top.score >= h && !(r.second && r.top.score - r.second.score < 0.03);
      if (r.expect) { pos++; if (fires && r.top.canonical === r.expect) hit++; else if (fires) wrong++; }
      else { neg++; if (fires) falseFire++; }
    });
    return { high: h, instant: `${hit}/${pos}`, wrongCommand: wrong, falseFire: `${falseFire}/${neg}` };
  });
}

export default async function handler(req, res) {
  if (guard(req, res, { methods: ['GET'], bucket: 'scrape' })) return;
  const tr = trace();
  try {
    const c = await client(); if (!c) return res.status(503).json({ error: 'Moss is not configured' });
    await ensureIndex(c, INTENT_INDEX, intentDocs, tr, 'router.load');
    const rows = [];
    for (const [q, expect] of EVAL) {
      const t0 = performance.now();
      const r = await c.query(INTENT_INDEX, q, { topK: 6 });
      const ms = performance.now() - t0;
      const ranked = rank(r.docs);
      rows.push({ q, expect, top: ranked[0], second: ranked[1], ms: Math.round(ms * 10) / 10 });
    }
    const times = rows.map((r) => r.ms).sort((a, b) => a - b);
    res.setHeader('cache-control', 'no-store');
    return res.status(200).json({
      index: INTENT_INDEX, spans: tr.spans,
      queryMs: { p50: times[Math.floor(times.length / 2)], p95: times[Math.floor(times.length * 0.95)], max: times.at(-1) },
      byThreshold: evaluate(rows),
      positives: rows.filter((r) => r.expect).map((r) => ({ q: r.q, expect: r.expect, got: r.top && r.top.canonical, score: r.top && Math.round(r.top.score * 1000) / 1000 })),
      negatives: rows.filter((r) => !r.expect).map((r) => ({ q: r.q, got: r.top && r.top.canonical, score: r.top && Math.round(r.top.score * 1000) / 1000 })),
    });
  } catch (e) {
    return res.status(500).json({ error: e.message, spans: tr.spans });
  }
}
