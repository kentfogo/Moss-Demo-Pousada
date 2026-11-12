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

import { guard } from './_guard.js';
import { trace } from './_trace.js';
import { createScanner } from './_jsonScan.js';
import { route } from './_moss.js';

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
- {"op":"deletePage","page":pageId}   removes a whole page in one step. Never delete "home".
- {"op":"resetPage","page":pageId}   clears every section of a page in one step (use for "clear/redo the home page"), then addSection the new ones.
- {"op":"resetSite"}   clears everything (use for "start over", "redo the whole thing", "scrap it"); follow it with the full first-build sequence (setBusiness, setDesign, addPage home, sections) unless the user wants to plan first.
- {"op":"setDesign","design":{"direction":directionId,"hue":0-359,"hue2"?:0-359,"name"?:string,"colors"?:{"bg","surface","ink","muted","accent","accent2","inverse"},"swatches"?:{name:hex},"type"?:{"display","body","mono","case":"none"|"uppercase","weight","tracking","scale"},"shape"?:{"radius","button":"pill"|"square"|"brutal"|"outline"|"accent","border":"none"|"hairline"|"heavy","shadow":"none"|"soft"|"hard"},"density"?:"airy"|"regular"|"compact","texture"?:"none"|"grain"|"dotgrid"|"lines","variants"?:{sectionType:variant},"art"?:artKind,"motion"?:"none"|"calm"|"lively","button"?:{"style":"solid"|"outline"|"soft"|"ghost","size":"s"|"m"|"l","hover":"lift"|"glow"|"fill"|"underline"},"nav"?:{"style":"bar"|"floating"|"minimal"|"centered","sticky":boolean}}}
    The site's whole design system. "motion" is the home page animation level (headline reveal, sections rising in, drifting art); "colors" values may also be a swatch name. Start from a DIRECTION (listed under DIRECTIONS) and override only what makes it right for this business: fonts from the font list, shape, layouts. Only send fields you change; the app keeps the rest and fixes contrast.
    COLOUR: each direction gives a palette STRATEGY, not colours. Pick "hue" (the brand accent hue in degrees, e.g. 210 for a trustworthy blue, 15 for terracotta, 145 for green) and optionally "hue2"; the app builds the palette from the strategy. Send "colors" only when the user names colours ("navy and orange"). Never copy colours from any reference or another site.
    Use it on the first build (right after setBusiness), and for any style request: "make it bold", "navy and orange", "square buttons with a hard shadow", "uppercase headings", "use Fraunces".
- {"op":"setSectionStyle","page":pageId,"id":sectionId,"style":{"fill"?:"bg"|"surface"|"accent"|"inverse"|swatchName,"padding"?:"tight"|"normal"|"roomy","radius"?:0-40,"align"?:"left"|"center"}}   one section's look ("make the FAQ dark", "more space around the pricing").
- {"op":"setPalette","palette":"ice"|"warm"|"sage"|"ink"}   quick preset colours only; prefer setDesign with explicit colours.
- {"op":"addLink","from":pageId,"section":sectionId,"to":pageId}   also send an updateSection that sets that cta's "href" to "#/<to>".
- {"op":"addFlow","flow":{"name":string,"nodes":[{"id":string,"label":string,"kind":"start"|"step"|"decision"|"end"}],"edges":[{"from":id,"to":id,"label"?:"yes"|"no"|string}]}}
    5–10 nodes, exactly one start, at least one end, labels under 28 characters. Layout is automatic.
- {"op":"setView","view":"page"|"flow"}   send setView "flow" before addFlow.
- {"op":"navigate","page":pageId}
PLANNING OPS (see PHASE):
- {"op":"setBusiness",...}   as above; send it as soon as you know the business name.
- {"op":"startPlan","brief":{"business":string}}   once, at the start of an interview.
- {"op":"askQuestion","id":briefKey,"question":string,"options":[2–3 short answers],"why"?:string}   exactly one per turn while interviewing.
- {"op":"setBrief","patch":{briefKey:string}}   record what the user just told you. briefKey ∈ business, offer, audience, action, proof, tone, colors, must, facts.
- {"op":"setPlan","summary":string,"sections":[{"type","variant"?,"intent"}],"directions":[{"direction":directionId,"name":string,"why":string,"hue":0-359} ×3]}   the Home page plan and three clearly different looks.
- {"op":"chooseDirection","index":0|1|2}   the user picked a look.
- {"op":"suggestNext","pages":[{"id":slug,"name","why","sections":[types]} ×3–5],"journeys":[{"name","steps":[short labels]}]}   what to build after Home; shown as draft pages on the Flow canvas.
- {"op":"dismissDrafts"}   the user doesn't want the remaining suggestions.
- {"op":"setMocks","source":string,"looks":[{"direction":directionId,"name":string,"why":string,"hue":0-359,"hue2"?:0-359,"variants"?:{sectionType:variant},"motion"?:string} ×3]}   redesign mocks of a scraped site: the same sections in three looks the user flips between (A/B/C).

SECTION TYPES and their data (plain text, no markdown, no emoji). Wrap 1–3 words of a headline or title in *asterisks* to set them in the accent colour.
Any section may carry "variant" (a layout) and visual sections may carry "art":{"kind":artKind,"seed":string,"label"?:string}. artKind ∈ orb, dotgrid, shapes, pattern, frame, iso (generated to match the palette).
LAYOUTS (variant) per type — omit to use the design's default:
  hero: split (copy + a card), centered, editorial (huge headline right, meta left, wide art below), bigtype (giant headline, art band below), spotlight (art above a centered headline)
  features: list, cards, bento, icons · testimonials: grid, single, marquee · pricing: cards, table · faq: split, centered · cta: band, split, minimal · footer: columns, wordmark
- hero: {"variant"?,"eyebrow","headline","sub","primary","secondary","card"?:{"title","tag","rows":[[label,value],[label,value],[label,value]],"cta","note"},"art"?}
    The split layout shows the card (a booking widget, this week's special, an account summary); the other layouts show art. Other pages use "centered" without a card.
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
- steps: {"eyebrow","title","lede"?,"items":[[title,text] ×3–4]}   how it works.
- gallery: {"eyebrow","title","items":[[caption,artKind] ×6]}   menu, rooms, before-and-after, work.
- logos: {"label"}   a row of client or press marks.
- callStrip: {"title","sub","phone","button","href"?}   urgent call-to-action strip for local services.

RULES
- Sections chosen FOR THIS BUSINESS (not always the same set): hero first and footer last; pick from features, steps, gallery, testimonials, logos, pricing, faq, callStrip, cta, stats. A plumber wants steps + callStrip; a burger bar wants gallery + menu-like pricing; a SaaS wants logos + features + pricing.
- DESIGN: every business gets its own look. Choose the direction whose "fits" matches best, avoid RECENT directions unless the user asked for one, then customise colours, fonts and layouts so it feels made for this business. Vary section layouts down the page (do not use the same layout twice in a row when an alternative fits).
- New pages: addPage, then 3–5 fitting sections ending with footer (about: hero centered, text, stats, cta, footer; contact: hero centered, contact, footer; booking: hero centered, booking, faq, footer; pricing: hero centered, pricing, faq, cta, footer).
- Edits: change only what was asked. Use updateSection with just the changed fields. Use the real section ids from STATE.
- Whole-page actions are ONE op: removing a page is deletePage, clearing or redoing a page is resetPage, starting over is resetSite. Never send a deleteSection per section to empty a page.
- "@Name" refers to a page by name or a section on the current page by type (e.g. @Hero).
- Write specific, believable copy for this business: concrete details, short sentences, sentence case headlines. No placeholder text, no lorem ipsum, no "Lorem", no exclamation marks.
- If the request is unclear or impossible, return "ops": [] and ask one short question in reply.
- Undo is handled by the app; never emit an undo op.
Return only the JSON object.`;


export const PHASES = {
  autobuild: `PHASE: BUILD NOW (the user asked you to just build it). Send setBusiness, setDesign, addPage home, then 6–8 addSection ops on "home", each with complete data. If STATE.plan exists, build its sections in order with its chosen look. After the last section, send suggestNext (shown as a card; stay on the page).`,
  interview: `PHASE: INTERVIEW. You are planning this site WITH the user, like a sharp product designer mapping it out together. Do not build anything yet: no addPage, no addSection.
- First turn: setBusiness (if you can name it), startPlan, then askQuestion. The reply opens with "Let's plan this out together." (or "Let's map this out.") and ENDS with the question itself. Never use the word "grill".
- Every turn: setBrief with what they just said (map "the first/second one" to STATE.plan.question.options), then askQuestion with the next most important open question, and END the reply with that question (it is read aloud). Exactly ONE question per turn, under 20 words, with 2–3 concrete suggested answers that fit this business.
- Push for clarity: if an answer is vague ("not sure", "everyone", "good quality"), do NOT record it: push back with a sharper follow-up or offer a concrete default, instead of moving on. Never ask what you already know.
- Cover, in order of importance: what they want to be known for (offer and difference), who the customer is, the one action a visitor should take, proof they have, how it should feel (and colours they love or hate), must-have sections, hard facts (phone, area, prices, hours).
- Stop when you understand enough (usually 5–8 answers) or when the user says "that's enough", "build it" or similar: send setPlan (summary of 2 sentences, 6–9 Home sections with a layout and a one-line intent each, and 3 clearly different directions with a brand hue each), and in reply summarise in one sentence and ask which look they want.`,
  review: `PHASE: PLAN REVIEW. STATE.plan has sections and three looks. The user may change the plan (send a full setPlan with the change), pick a look (chooseDirection), or say start. Picking a look is NOT starting: send only chooseDirection, and reply with the look's name and "Shall I start with the hero?". When they say start, "let's go" or similar: chooseDirection if none is chosen, then setDesign is NOT needed (the app applies the look), addPage home, and build ONLY the first planned section (one addSection, with the planned layout). "reply" says what you are building (one short sentence); "after" is exactly "Keep it, or change something?". If they say "build it all" or "build the rest", build every planned section, then suggestNext.`,
  guided: `PHASE: GUIDED BUILD. You build Home together, one section at a time. STATE.plan.next is the next planned section.
- "next", "keep going", "looks good", "yes": build ONLY STATE.plan.next (one addSection with its planned type and layout, complete data). "reply": one short sentence on what you are building; "after": "Keep it, or change something?" (or, after the last section, ask which suggested page to build next).
- A change request: edit what is already built (updateSection / setDesign / setOrder…). Do not add the next section in the same turn.
- "build the rest": addSection for every remaining planned section, in order.
- After the last planned section is built, also send suggestNext (3–5 pages that fit this business, each with why and sections, and one visitor journey). Do NOT switch to flow view: the user stays on the finished page and sees the suggestions as a card. "after": "Home is done. Want to look it over, or plan the next pages?"`,
  mock: `PHASE: REDESIGN MOCKS. The user wants their existing site (SCRAPED SITE) redesigned. Build it now in one turn, with no questions:
- Ops in this order: setBusiness (scraped name and kind, place if known), addPage home, ONE setMocks, then 6–8 addSection ops on "home".
- setMocks: three clearly different looks. A keeps their brand hue (SCRAPED brandHue when given) in a fitting direction; B and C use other directions and hues, with different hero and feature layouts in "variants". Do not send setDesign (the app applies look A).
- Sections are {"type":..., "data":{...fields...}} (fields go inside "data"), written from the scraped facts: their real services, phone, area, prices, hours and testimonials. Sharpen the copy (clearer headline, benefit-led features) but never invent facts, numbers, reviews or prices; leave a field or a section out rather than make it up.
- "reply": one sentence naming the three looks; "after": "Say A, B or C to compare, or 'go with B'."`,
  edit: `PHASE: EDITING. Change only what was asked. Building suggested pages: addPage + sections for each page the user picks (their drafts are in STATE.drafts), and link them from Home's nav/CTA where it helps. If they ask what else to build, send suggestNext.`,
};
export function phaseOf(state = {}, mode) {
  const pages = Array.isArray(state.pages) ? state.pages : [];
  const home = pages.find((p) => p.id === 'home');
  const plan = state.plan && typeof state.plan === 'object' ? state.plan : null;
  if (mode === 'mock') return 'mock';
  if (mode === 'autopilot' && !(home && home.sections && home.sections.length) ) return 'autobuild';
  if (plan && plan.phase === 'interview') return 'interview';
  if (plan && plan.phase === 'proposed') return mode === 'autopilot' ? 'autobuild' : 'review';
  if (plan && plan.phase === 'building') return 'guided';
  if (!pages.length) return mode === 'autopilot' ? 'autobuild' : 'interview';
  return 'edit';
}

/** Compact the client state so the prompt stays small: no copy library, just what the model needs. */
export function compactState(state = {}) {
  const pages = Array.isArray(state.pages) ? state.pages : [];
  return {
    business: state.business ? { name: state.business.name, kind: state.business.kind, place: state.business.place } : null,
    currentPage: state.currentPage || 'home',
    palette: state.palette || 'ice',
    design: state.design && typeof state.design === 'object' ? { direction: state.design.direction, name: state.design.name, colors: state.design.colors, swatches: state.design.swatches, type: state.design.type, shape: state.design.shape, variants: state.design.variants, art: state.design.art } : null,
    pages: pages.map((p) => ({ id: p.id, name: p.name, sections: (p.sections || []).map((s) => ({ id: s.id, type: s.type, data: stripLocal(s.data) })) })),
    links: Array.isArray(state.links) ? state.links : [],
    flows: (Array.isArray(state.flows) ? state.flows : []).map((f) => f.name),
    plan: state.plan && typeof state.plan === 'object' ? (() => {
      const pl = state.plan; const secs = Array.isArray(pl.sections) ? pl.sections : [];
      const next = secs.find((x) => !x.done);
      return { phase: pl.phase, brief: pl.brief || {}, question: pl.question || null, sections: secs.map((x) => ({ type: x.type, variant: x.variant, intent: x.intent, done: !!x.done })), next: next ? { type: next.type, variant: next.variant, intent: next.intent } : null, directions: (pl.directions || []).map((d) => ({ direction: d.direction, name: d.name })), chosen: pl.chosen ?? null };
    })() : null,
    drafts: (Array.isArray(state.drafts) ? state.drafts : []).map((d) => ({ id: d.id, name: d.name })),
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

const FONT_LIST = 'display: Fraunces, DM Serif Display, Instrument Serif, Bebas Neue, Bowlby One, Inter, Space Grotesk, Archivo, Nunito · body: Inter, Archivo, Space Grotesk, Nunito · mono: JetBrains Mono, IBM Plex Mono';
function designContext(directions, recent) {
  const list = (Array.isArray(directions) ? directions : []).slice(0, 12).map((d) => ({ id: d.id, name: d.name, mood: d.mood, fits: d.fits, colors: d.colors, type: d.type, shape: d.shape, variants: d.variants, art: d.art }));
  if (!list.length) return '';
  const rec = (Array.isArray(recent) ? recent : []).filter((x) => typeof x === 'string').slice(0, 4);
  return `DIRECTIONS:\n${JSON.stringify(list)}\nFONTS: ${FONT_LIST}\nRECENT (avoid unless asked): ${rec.join(', ') || 'none'}\n\n`;
}

/** Output budget per phase: interview turns are one question; full builds need room for 8 sections. */
export const MAX_TOKENS = { interview: 350, review: 900, edit: 900, guided: 1200, autobuild: 2500, mock: 3000 };
const STYLE_RE = /\b(colou?rs?|palette|font|type(face)?|look|style|theme|vibe|feel|redesign|direction|darker|lighter|warmer|cooler|modern|minimal|bold|playful|elegant|luxur|retro|brand)\b/i;
/** The design library is the biggest part of the prompt; send it only when the turn can choose or change a look. */
export function needsLibrary(phase, message) { return ['interview', 'review', 'autobuild', 'mock'].includes(phase) || STYLE_RE.test(message || ''); }

export function buildMessages({ message, state, history, directions, recentDirections, live, mode, scraped }) {
  const phase = phaseOf(state, mode);
  const turns = (Array.isArray(history) ? history : []).slice(-6)
    .filter((t) => t && (t.role === 'user' || t.role === 'assistant') && typeof t.content === 'string')
    .map((t) => ({ role: t.role, content: t.content.slice(0, 1500) }));
  return [
    { role: 'system', content: `${SYSTEM_PROMPT}\n\n${PHASES[phase]}` },
    ...turns,
    { role: 'user', content: `${needsLibrary(phase, message) ? designContext(directions, recentDirections) : ''}${scraped && phase === 'mock' ? `SCRAPED SITE (facts to use; never invent beyond them):\n${JSON.stringify(scraped).slice(0, 5000)}\n\n` : ''}${live ? 'VOICE: live spoken conversation. Keep reply under 20 words and "after" under 15 words; they are read aloud. Put detail in the page, not the speech.\n\n' : ''}STATE:\n${JSON.stringify(compactState(state))}\n\nMESSAGE:\n${message}` },
  ];
}

/** Read an OpenAI-style SSE stream and yield the text deltas. */
async function* deltas(body) {
  const reader = body.getReader(); const dec = new TextDecoder(); let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let k;
    while ((k = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, k).trim(); buf = buf.slice(k + 1);
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') return;
      try { const j = JSON.parse(data); const d = j?.choices?.[0]?.delta?.content ?? j?.choices?.[0]?.message?.content; if (d) yield d; } catch {}
    }
  }
}

/**
 * Ask Moss Inference for the reply and ops.
 * opts.stream: ask for a token stream and report reply/ops through opts.onEvent as they complete (falls back to one response).
 * opts.tr: a trace (api/_trace.js) for the latency waterfall. opts.extra: text added before STATE (router hints, site facts).
 */
export async function callMoss({ message, state, history, directions, recentDirections, live, mode, scraped }, env = process.env, fetchImpl = fetch, opts = {}) {
  const { token, base, model } = mossSettings(env);
  if (!token) {
    // Names only (never values), so a misnamed or wrongly scoped variable is easy to spot.
    const seen = Object.keys(env).filter((k) => /moss/i.test(k)).sort();
    throw Object.assign(new Error(`Moss inference is not configured (set MOSS_PROJECT_ID and MOSS_PROJECT_KEY). Moss variables visible to this deployment: ${seen.length ? seen.join(', ') : 'none'}`), { status: 503 });
  }
  const tr = opts.tr; const emit = opts.onEvent || (() => {});
  const messages = buildMessages({ message, state, history, directions, recentDirections, live, mode, scraped });
  if (opts.extra) messages[messages.length - 1].content = opts.extra + messages[messages.length - 1].content;
  const payload = { model, messages, max_tokens: MAX_TOKENS[phaseOf(state, mode)] || 900, temperature: Number(env.MOSS_TEMPERATURE ?? 0.4), response_format: { type: 'json_object' }, ...(opts.stream ? { stream: true } : {}) };
  const post = (body) => fetchImpl(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}`, ...(opts.stream ? { accept: 'text/event-stream' } : {}) },
    body: JSON.stringify(body),
  });
  const endReq = tr ? tr.start('inference.request', { model, promptChars: JSON.stringify(messages).length }) : null;
  const tInf = tr ? tr.now() : 0;
  let r = await post(payload);
  if (r.status === 400 || r.status === 422) { // some OpenAI-compatible servers reject response_format; retry without it
    const { response_format, ...plain } = payload;
    r = await post(plain);
  }
  if (endReq) endReq({ status: r.status });
  if (!r.ok) {
    const detail = (await r.text().catch(() => '')).slice(0, 300);
    throw Object.assign(new Error(`Moss inference returned ${r.status}${detail ? ': ' + detail : ''}`), { status: 502 });
  }
  const streamed = !!opts.stream && /text\/event-stream/i.test(r.headers?.get?.('content-type') || '') && !!r.body;
  let content = '';
  const sent = { reply: false, ops: 0 };
  if (streamed) {
    const scan = createScanner(); let first = true;
    for await (const d of deltas(r.body)) {
      if (first && tr) { tr.add('inference.ttft', tInf, tr.now()); first = false; }
      content += d;
      for (const ev of scan.push(d)) {
        if (ev.type === 'reply') { sent.reply = true; emit('reply', { reply: ev.text }); }
        else { sent.ops++; emit('op', { op: ev.op }); }
      }
    }
  } else {
    const json = await r.json();
    content = json?.choices?.[0]?.message?.content;
  }
  if (tr) tr.add('inference.total', tInf, tr.now(), { streamed, chars: (content || '').length });
  const out = extractJSON(content);
  const result = {
    reply: typeof out.reply === 'string' ? out.reply : '',
    ops: Array.isArray(out.ops) ? out.ops : [],
    after: typeof out.after === 'string' ? out.after : undefined,
    suggestions: Array.isArray(out.suggestions) ? out.suggestions.filter((s) => typeof s === 'string').slice(0, 4) : undefined,
    streamed,
  };
  // anything the scanner could not deliver early (odd formatting) still goes out, in order
  if (opts.onEvent) {
    if (!sent.reply) emit('reply', { reply: result.reply });
    result.ops.slice(sent.ops).forEach((op) => emit('op', { op }));
  }
  return result;
}

/** Turn arguments from the request body. */
function argsOf(body, message) {
  return { message, state: body.state, history: body.history, directions: body.directions, recentDirections: body.recentDirections, live: !!body.live, mode: ['plan', 'autopilot', 'mock'].includes(body.mode) ? body.mode : undefined, noRoute: body.noRoute === true, scraped: body.mode === 'mock' && body.scraped && typeof body.scraped === 'object' ? body.scraped : undefined };
}

/**
 * Work done before inference (the intent router and site knowledge, added in later steps). Returns
 * { route } to answer without the model, or { extra } to add to the prompt. Replaceable in tests.
 */
export const hooks = {
  async prepare(args, tr, env) {
    const out = {};
    // Intent router: only while editing a built site, for short messages, and not when the page already tried it.
    const phase = phaseOf(args.state || {}, args.mode);
    const words = args.message.split(/\s+/).length;
    if (env.MOSS_ROUTER !== 'off' && !args.noRoute && ['edit', 'guided'].includes(phase) && words <= 16) {
      try {
        const r = await route(args.message, tr, env);
        if (r && r.decision === 'high') return { route: { canonical: r.canonical, score: Math.round(r.score * 1000) / 1000 }, meta: { router: 'high' } };
        if (r && r.decision === 'mid') out.extra = `LIKELY COMMANDS (from the intent router; use one only if it fits the message): ${r.top.map((t) => `"${t.canonical}" (${t.score.toFixed(2)})`).join(', ')}. They map to setDesign (motion, button, nav) or setSectionStyle ops.\n\n`;
        out.meta = { router: r ? r.decision : 'off' };
      } catch (e) { tr.add('router.error', tr.now(), tr.now(), { error: String(e && e.message).slice(0, 160) }); }
    }
    return out;
  },
};

export default async function handler(req, res) {
  const tr = trace();
  if (guard(req, res, { methods: ['POST'], bucket: 'agent' })) return;
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'invalid JSON' }); } }
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  if (!message) return res.status(400).json({ error: 'message is required' });
  if (message.length > MAX_MESSAGE) return res.status(413).json({ error: 'message too long' });
  if (JSON.stringify(body.state || {}).length > MAX_STATE) return res.status(413).json({ error: 'state too large' });
  if (!mossSettings().token) { try { await callMoss(argsOf(body, message)); } catch (err) { return res.status(err.status || 500).json({ error: err.message }); } }
  const args = argsOf(body, message);
  const wantsStream = /text\/event-stream/i.test((req.headers && req.headers.accept) || '') && args.mode !== 'mock';
  res.setHeader('cache-control', 'no-store');
  if (!wantsStream) {
    try {
      const pre = await hooks.prepare(args, tr, process.env);
      if (pre.route) return res.status(200).json({ reply: '', ops: [], route: pre.route, timing: tr.spans, serverMs: tr.now() });
      const result = await callMoss(args, process.env, fetch, { tr, extra: pre.extra });
      return res.status(200).json({ ...result, ...(pre.meta ? { meta: pre.meta } : {}), timing: tr.spans, serverMs: tr.now() });
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message || 'agent failed', timing: tr.spans });
    }
  }
  // Server-sent events: span / route / reply / op / done / error, each with "t" (server ms) for the waterfall
  res.statusCode = 200;
  res.setHeader('content-type', 'text/event-stream; charset=utf-8');
  res.setHeader('cache-control', 'no-store, no-transform');
  res.setHeader('x-accel-buffering', 'no');
  if (res.flushHeaders) res.flushHeaders();
  const send = (event, data) => { try { res.write(`event: ${event}\ndata: ${JSON.stringify({ ...data, t: tr.now() })}\n\n`); } catch {} };
  tr.onSpan = (s) => send('span', { span: s });
  send('hello', {});
  try {
    const pre = await hooks.prepare(args, tr, process.env);
    if (pre.meta) send('meta', pre.meta);
    if (pre.route) send('route', pre.route);
    else {
      const out = await callMoss(args, process.env, fetch, { tr, stream: true, extra: pre.extra, onEvent: send });
      send('done', { after: out.after, suggestions: out.suggestions, streamed: out.streamed });
    }
    if (pre.route) send('done', { streamed: false, routed: true });
  } catch (err) {
    send('error', { error: err.message || 'agent failed', status: err.status || 500 });
  }
  res.end();
}
