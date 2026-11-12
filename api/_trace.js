// Request tracing for the latency waterfall. Spans are in ms from the start of the request; the browser lines them up
// with its own clock using the server time ("t") carried on every streamed event.
import { performance } from 'node:perf_hooks';

export function trace() {
  const t0 = performance.now();
  const now = () => Math.round((performance.now() - t0) * 10) / 10;
  const tr = {
    spans: [],
    onSpan: null,
    now,
    /** Start a span; call the returned function to end it (optionally adding metadata). */
    start(name, meta) {
      const s = { name, start: now(), ...(meta ? { meta } : {}) };
      return (extra) => {
        s.end = now();
        if (extra) s.meta = Object.assign(s.meta || {}, extra);
        tr.spans.push(s);
        if (tr.onSpan) try { tr.onSpan(s); } catch {}
        return s;
      };
    },
    /** Record a span that already happened (start/end known). */
    add(name, start, end, meta) { const s = { name, start, end, ...(meta ? { meta } : {}) }; tr.spans.push(s); if (tr.onSpan) try { tr.onSpan(s); } catch {} return s; },
  };
  return tr;
}
