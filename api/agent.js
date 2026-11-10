// Vercel serverless function: POST /api/agent
// Turns one chat message plus the builder's current page state into a reply and a list of page ops,
// using Moss inference through its OpenAI-compatible chat completions API.
//
// Environment (set in Vercel → Project → Settings → Environment Variables):
//   MOSS_PROJECT_ID   required  Moss project id
//   MOSS_PROJECT_KEY  required  Moss project key (MOSS_API_KEY also accepted); sent as "Bearer <id>:<key>", never to the browser
//   MOSS_MODEL        optional  default "moss/fastlane-1"
//   MOSS_BASE_URL     optional  default "https://inference.moss.dev/v1" ("/chat/completions" is appended)
//   MOSS_TEMPERATURE  optional  default 0.4

export const config = { maxDuration: 60 };

export const DEFAULT_BASE_URL = 'https://inference.moss.dev/v1';
export const DEFAULT_MODEL = 'moss/fastlane-1';

export function mossSettings(env = process.env) {
  // Moss expects "Bearer <project id>:<project key>". Accept the key as MOSS_PROJECT_KEY or MOSS_API_KEY;
  // a value that already contains ":" is treated as the full token.
  const id = env.MOSS_PROJECT_ID || env.MOSS_PROJECT || '';
  const key = env.MOSS_PROJECT_KEY || env.MOSS_API_KEY || '';
  const token = key.includes(':') ? key : id && key ? `${id}:${key}` : '';
  return { token, base: (env.MOSS_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, ''), model: env.MOSS_MODEL || DEFAULT_MODEL };
}

const MAX_MESSAGE = 2000;
const MAX_STATE = 80_000;

export const SYSTEM_PROMPT = `You are Moss, an agent that builds a landing page live while the user chats with you.
You never write HTML. You reply with ONE JSON object and nothing else:
{"reply": string, "ops": Op[], "after"?: string, "suggestions"?: string[]}

- reply: 1–2 short sentences, plain text, said BEFORE the ops run. Mention pages as @Name (e.g. @Home). Use @ only for page names, never for the business or anything else.
- after: optional 1 sentence said after the ops finish.
- suggestions: 2–4 short follow-up requests the user could click (each under 40 characters).

The user sends their message plus STATE: the business, the pages, each page's sections (id, type, data), the current page, the palette, links and flow names.

OPS (applied in order):
- {"op":"setBusiness","business":{"name":string,"kind":string,"place":string|null,"announce":{"tag":string,"text":string},"primary":string}}
    Use once, on the first message, before anything else. "primary" is the main call to action label used in the site nav.
- {"op":"addPage","page":{"id":slug,"name":string},"navigate":true}   slug: lowercase letters, digits, dashes. The first page is {"id":"home","name":"Home"}.
- {"op":"addSection","page":pageId,"section":{"type":SectionType,"data":{...}},"index"?:number}   omit index to append.
- {"op":"updateSection","page":pageId,"id":sectionId,"patch":{...fields to replace...},"note":"rewrote headline"}
- {"op":"setOrder","page":pageId,"order":[every section id on that page, in the new order]}
- {"op":"deleteSection","page":pageId,"id":sectionId}
- {"op":"deletePage","page":pageId}   never delete "home".
- {"op":"setPalette","palette":"ice"|"warm"|"sage"|"ink"}   ice = cool teal, warm = terracotta and sand, sage = soft green, ink = monochrome.
- {"op":"addLink","from":pageId,"section":sectionId,"to":pageId}   also send an updateSection that sets that cta's "href" to "#/<to>".
- {"op":"addFlow","flow":{"name":string,"nodes":[{"id":string,"label":string,"kind":"start"|"step"|"decision"|"end"}],"edges":[{"from":id,"to":id,"label"?:"yes"|"no"|string}]}}
    5–10 nodes, exactly one start, at least one end, labels under 28 characters. Layout is automatic.
- {"op":"setView","view":"page"|"flow"}   send setView "flow" before addFlow.
- {"op":"navigate","page":pageId}

SECTION TYPES and their data (all text plain, no markdown, no emoji):
- hero: {"variant":"split"|"centered","eyebrow","headline","sub","primary","secondary","card"?:{"title","tag","rows":[[label,value],[label,value],[label,value]],"cta","note"}}
    Home uses "split" with a card that suits the business (a booking widget, this week's product, an account summary). Other pages use "centered" without a card.
- features: {"eyebrow","title","lede","items":[[icon,title,text] ×4]}   icon ∈ leaf, bed, wave, compass, cup, box, chart, shield, bolt, clock
- testimonials: {"eyebrow","title","items":[[quote,name,role] ×3],"logos"?:string}   logos is a short label like "As featured in".
- pricing: {"eyebrow","title","lede","unit","cta","plans":[[name,price,[feature,feature,feature],featured:boolean] ×3]}   exactly one featured.
- faq: {"eyebrow","title","items":[[question,answer] ×4]}
- cta: {"eyebrow","title","sub","button","href":"#/<pageId>"}
- footer: {"name","blurb","cols":[[heading,[link,link,link]] ×3],"base"}
- text: {"eyebrow","title","body":[paragraph,paragraph]}
- stats: {"items":[[value,label] ×3]}
- contact: {"eyebrow","headline","sub","details":[[label,value] ×3]}
- booking: {"eyebrow","headline","sub","rooms":[[name,price] ×3]}

RULES
- First message (STATE has no pages): setBusiness, addPage home, then addSection on "home" for hero, features, testimonials, pricing, faq, cta, footer, in that order, each with complete data.
- New pages: addPage, then 3–5 fitting sections ending with footer (about: hero centered, text, stats, cta, footer; contact: hero centered, contact, footer; booking: hero centered, booking, faq, footer; pricing: hero centered, pricing, faq, cta, footer).
- Edits: change only what was asked. Use updateSection with just the changed fields. Use the real section ids from STATE.
- "@Name" refers to a page by name or a section on the current page by type (e.g. @Hero).
- Write specific, believable copy for this business: concrete details, short sentences, sentence case headlines. No placeholder text, no lorem ipsum, no "Lorem", no exclamation marks.
- If the request is unclear or impossible, return "ops": [] and ask one short question in reply.
- Undo is handled by the app; never emit an undo op.
Return only the JSON object.`;

/** Compact the client state so the prompt stays small: no copy library, just what the model needs. */
export function compactState(state = {}) {
  const pages = Array.isArray(state.pages) ? state.pages : [];
  return {
    business: state.business ? { name: state.business.name, kind: state.business.kind, place: state.business.place } : null,
    currentPage: state.currentPage || 'home',
    palette: state.palette || 'ice',
    pages: pages.map((p) => ({ id: p.id, name: p.name, sections: (p.sections || []).map((s) => ({ id: s.id, type: s.type, data: stripLocal(s.data) })) })),
    links: Array.isArray(state.links) ? state.links : [],
    flows: (Array.isArray(state.flows) ? state.flows : []).map((f) => f.name),
  };
}
function stripLocal(data) {
  if (!data || typeof data !== 'object') return data;
  const { punchy, punchIx, subShort, titles, titleIx, ...rest } = data; // local-only helpers of the scripted agent
  return rest;
}

/** Pull the first JSON object out of a model reply (tolerates code fences and stray prose). */
export function extractJSON(text) {
  if (typeof text !== 'string') throw new Error('empty completion');
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('{'), end = body.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('no JSON object in completion');
  return JSON.parse(body.slice(start, end + 1));
}

export function buildMessages({ message, state, history }) {
  const turns = (Array.isArray(history) ? history : []).slice(-8)
    .filter((t) => t && (t.role === 'user' || t.role === 'assistant') && typeof t.content === 'string')
    .map((t) => ({ role: t.role, content: t.content.slice(0, 1500) }));
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    ...turns,
    { role: 'user', content: `STATE:\n${JSON.stringify(compactState(state))}\n\nMESSAGE:\n${message}` },
  ];
}

export async function callMoss({ message, state, history }, env = process.env, fetchImpl = fetch) {
  const { token, base, model } = mossSettings(env);
  if (!token) {
    // Names only (never values), so a misnamed or wrongly scoped variable is easy to spot.
    const seen = Object.keys(env).filter((k) => /moss/i.test(k)).sort();
    throw Object.assign(new Error(`Moss inference is not configured (set MOSS_PROJECT_ID and MOSS_PROJECT_KEY). Moss variables visible to this deployment: ${seen.length ? seen.join(', ') : 'none'}`), { status: 503 });
  }
  const payload = { model, messages: buildMessages({ message, state, history }), temperature: Number(env.MOSS_TEMPERATURE ?? 0.4), response_format: { type: 'json_object' } };
  const post = (body) => fetchImpl(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  let r = await post(payload);
  if (r.status === 400 || r.status === 422) { // some OpenAI-compatible servers reject response_format; retry without it
    const { response_format, ...plain } = payload;
    r = await post(plain);
  }
  if (!r.ok) {
    const detail = (await r.text().catch(() => '')).slice(0, 300);
    throw Object.assign(new Error(`Moss inference returned ${r.status}${detail ? ': ' + detail : ''}`), { status: 502 });
  }
  const json = await r.json();
  const content = json?.choices?.[0]?.message?.content;
  const out = extractJSON(content);
  return {
    reply: typeof out.reply === 'string' ? out.reply : '',
    ops: Array.isArray(out.ops) ? out.ops : [],
    after: typeof out.after === 'string' ? out.after : undefined,
    suggestions: Array.isArray(out.suggestions) ? out.suggestions.filter((s) => typeof s === 'string').slice(0, 4) : undefined,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('allow', 'POST'); return res.status(405).json({ error: 'POST only' }); }
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'invalid JSON' }); } }
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  if (!message) return res.status(400).json({ error: 'message is required' });
  if (message.length > MAX_MESSAGE) return res.status(413).json({ error: 'message too long' });
  if (JSON.stringify(body.state || {}).length > MAX_STATE) return res.status(413).json({ error: 'state too large' });
  try {
    const result = await callMoss({ message, state: body.state, history: body.history });
    res.setHeader('cache-control', 'no-store');
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'agent failed' });
  }
}
