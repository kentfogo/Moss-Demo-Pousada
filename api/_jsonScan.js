// Incremental scanner for the agent's JSON reply ({"reply": "...", "ops": [ {...}, {...} ], ...}) as it streams in.
// Emits the reply the moment its string closes, and each op the moment its object closes, so the browser can start
// speaking and building before the model has finished writing. Prose or ```json fences before the object are skipped.
// While the reply is still being written it also emits replyPart: the text so far, up to the last whole word.

export function createScanner() {
  let buf = '';
  let i = 0;
  let started = false;
  let depth = 0;
  let inStr = false, esc = false, strStart = -1;
  let lastStr = null, key = null, expectingValue = false;
  let inOps = false, opStart = -1;
  let replySent = false, finished = false, partSent = '';
  const out = [];
  /** The reply's words so far, while its string is still open (cut at the last space, so no half words). */
  function replyPart() {
    if (!(inStr && depth === 1 && expectingValue && key === 'reply' && !replySent)) return;
    let raw = buf.slice(strStart + 1);
    const cut = raw.lastIndexOf(' '); if (cut <= 0) return;
    raw = raw.slice(0, cut);
    let text; try { text = JSON.parse('"' + raw + '"'); } catch { return; } // an escape split across chunks: next time
    if (text.trim() && text.length > partSent.length) { partSent = text; out.push({ type: 'replyPart', text }); }
  }

  function push(chunk) {
    buf += chunk;
    if (finished) return out.splice(0);
    for (; i < buf.length; i++) {
      const c = buf[i];
      if (!started) { if (c === '{') { started = true; depth = 1; } continue; }
      if (inStr) {
        if (esc) { esc = false; continue; }
        if (c === '\\') { esc = true; continue; }
        if (c === '"') {
          inStr = false;
          if (depth === 1) {
            const s = buf.slice(strStart, i + 1);
            if (expectingValue) {
              if (key === 'reply' && !replySent) { try { out.push({ type: 'reply', text: JSON.parse(s) }); replySent = true; } catch {} }
              expectingValue = false;
            } else lastStr = s;
          }
        }
        continue;
      }
      if (c === '"') { inStr = true; strStart = i; continue; }
      if (depth === 1 && c === ':') { try { key = JSON.parse(lastStr); } catch { key = null; } expectingValue = true; continue; }
      if (depth === 1 && c === ',') { expectingValue = false; continue; }
      if (c === '{' || c === '[') {
        if (depth === 1) { expectingValue = false; if (key === 'ops' && c === '[') inOps = true; }
        else if (inOps && depth === 2 && c === '{') opStart = i;
        depth++;
        continue;
      }
      if (c === '}' || c === ']') {
        depth--;
        if (inOps && depth === 2 && c === '}' && opStart >= 0) { try { out.push({ type: 'op', op: JSON.parse(buf.slice(opStart, i + 1)) }); } catch {} opStart = -1; }
        if (inOps && depth === 1) inOps = false;
        if (depth === 0) { finished = true; i++; break; } // the object is complete; ignore anything after it
        continue;
      }
    }
    replyPart();
    return out.splice(0);
  }
  return { push, text: () => buf, replySent: () => replySent };
}
