// Parallel build: the worker plans the page (business, page, and each section as a type, layout and short brief) and
// writers fill it in at the same time: one per section, plus one for the look (setDesign) and one for what to build
// next (suggestNext) on a first build. Each writer starts the moment what it needs arrives in the planner's stream.
//
// Why: a full build was ~1,500 output tokens in one serial stream (~11 s at ~130 tokens/s). Split, the planner writes
// a few hundred tokens and each writer ~100–300, so the page is done in about the planner's time plus one section.
// Every writer reuses the cached system prompt; only its short tail is new.
// Ops reach the page in planned order: the look goes right after setBusiness, a finished section waits for the ones
// above it, and suggestNext goes after the last section.

/** Turns that build several sections at once: "just build it", and edits that ask for a new page or a rebuild. */
const MULTI_SECTION = /\b(add|create|make|build|new|set up)\b[^.?!]*\bpages?\b|\b(start over|from scratch|rebuild|redo the (whole|site|page))\b/i;
export function fanoutApplies(phase, message, env = process.env) {
  if (env.MOSS_FANOUT === 'off') return false;
  return phase === 'autobuild' || (phase === 'edit' && MULTI_SECTION.test(message || ''));
}

/** Told to the planner (added before STATE). firstBuild: the look and suggestNext are written separately too. */
export function plannerNote(firstBuild) {
  return `PARALLEL BUILD: for every addSection op, send only {"op":"addSection","page":pageId,"section":{"type":SectionType,"variant"?:layout,"brief":string}} with NO "data". The brief is at most 18 words: only the facts the section must use (names, prices, numbers, places), no full sentences. Separate writers fill in each section from your brief, in parallel, so send the addSection ops as early as you can.${firstBuild ? ' Do NOT send setDesign or suggestNext: they are written separately too. Send setBusiness first, then addPage, then the sections.' : ''} Everything else (reply, after, suggestions, other ops) as usual.\n\n`;
}

export const MAX_WRITERS = 8; // Moss allows a burst of 10 requests on fastlane-1 (then 2/s); the talker and planner use 2. 429s retry once.
export const WRITER_TOKENS = 1200; // the ceiling; each type gets its own cap below
/** Output cap per section type: about twice a full section, so a writer that loops fails fast and falls back. */
export const SECTION_TOKENS = { hero: 500, features: 550, testimonials: 500, pricing: 650, faq: 900, cta: 250, footer: 400, text: 600, stats: 250, contact: 350, booking: 400, steps: 450, gallery: 400, logos: 120, callStrip: 250 };
export const tokensFor = (type) => SECTION_TOKENS[type] || 600;

const tail = (...parts) => parts.filter(Boolean).join('\n\n');

/** The tail a section writer sends after the shared system prompt. */
export function writerTail({ business, page, section, plan }) {
  const others = plan.filter((s) => s !== section).map((s) => `${s.type}: ${s.brief || ''}`.trim());
  return tail(
    'CURRENT PHASE: section writer',
    'SECTION WRITER: you write ONE section of a page that is being built right now. Return {"reply":"","ops":[ONE addSection op]} for exactly the section below, with complete "data" for its type (see SECTION TYPES), specific, believable copy for this business. Do not add other ops.',
    `BUSINESS: ${JSON.stringify(business || {})}`,
    `PAGE: ${page}`,
    `SECTION: ${JSON.stringify({ type: section.type, variant: section.variant, brief: section.brief })}`,
    others.length ? `THE REST OF THE PAGE (written by others; don't repeat their content):\n- ${others.join('\n- ')}` : '',
  );
}
/** The tail for the look writer (first build). */
export function designTail({ business, recent, plan }) {
  return tail(
    'CURRENT PHASE: look writer',
    'LOOK WRITER: Return {"reply":"","ops":[ONE setDesign op]}: the first-build look for this business (see setDesign, DESIGN and DIRECTIONS). Nothing else.',
    `BUSINESS: ${JSON.stringify(business || {})}`,
    plan ? `PLAN (use its chosen look): ${JSON.stringify(plan).slice(0, 1500)}` : '',
    recent && recent.length ? `RECENT DIRECTIONS (avoid unless asked): ${recent.join(', ')}` : '',
  );
}
/** The tail for the what-to-build-next writer (first build). */
export function nextTail({ business, plan }) {
  return tail(
    'CURRENT PHASE: next pages writer',
    'NEXT PAGES WRITER: Return {"reply":"","ops":[ONE suggestNext op]}: 3–5 pages this business needs after Home, and its key journeys. Nothing else.',
    `BUSINESS: ${JSON.stringify(business || {})}`,
    plan.length ? `HOME SECTIONS: ${plan.map((s) => s.type).join(', ')}` : '',
  );
}

const hasData = (sec) => sec && sec.data && typeof sec.data === 'object' && Object.keys(sec.data).length > 0;

/**
 * Wraps the planner's op stream. push(op) for each op as it arrives; await finish() once the planner is done.
 * emit(op) receives the ops in planned order, with sections filled in.
 * write({ tail, section, page }) → the section's data. writeDesign / writeNext ({ tail }) → a setDesign / suggestNext
 * op; leave them out to have the planner write those itself.
 */
export function createFanout({ state = {}, emit, write, writeDesign, writeNext, recentDirections, tr, maxWriters = MAX_WRITERS }) {
  let business = state.business || null;
  const plan = []; // the section skeletons, in order, so writers know the rest of the page
  const slots = []; // { ready, op } in the order they go to the page
  let running = 0; const waiting = [];
  let finished = false; let resolveDrained; const drained = new Promise((r) => (resolveDrained = r));
  const stats = { sections: 0, writers: 0, failed: 0, passedThrough: 0 };
  const sentByPlanner = new Set();

  const flush = () => {
    while (slots.length && slots[0].ready) { const s = slots.shift(); if (s.op) emit(s.op); }
    if (finished && !slots.length) resolveDrained(stats);
  };
  const acquire = () => (running < maxWriters ? (running++, Promise.resolve()) : new Promise((r) => waiting.push(r)));
  const release = () => { const next = waiting.shift(); if (next) next(); else running--; };
  /** Run a writer under the concurrency cap, with a span; resolves to its result or null. */
  const run = async (name, fn) => {
    await acquire(); const t0 = tr ? tr.now() : 0;
    try { const v = await fn(); if (tr) tr.add(name, t0, tr.now()); return v; }
    catch (e) { stats.failed++; if (tr) tr.add(name, t0, tr.now(), { error: String(e && e.message || e).slice(0, 120) }); return null; }
    finally { release(); }
  };

  // helper writers (first build): started when the business is known
  let nextP = null, designSlot = null;
  const startHelpers = () => {
    if (!business || !business.name) return;
    if (writeDesign && !designSlot) {
      designSlot = { ready: false, op: null }; slots.push(designSlot); // right after setBusiness
      run('design.writer', () => writeDesign({ tail: designTail({ business, recent: recentDirections, plan: state.plan }) })).then((op) => {
        designSlot.op = !sentByPlanner.has('setDesign') && op && op.op === 'setDesign' ? op : null; designSlot.ready = true; flush();
      });
    }
    if (writeNext && !nextP) nextP = run('next.writer', () => writeNext({ tail: nextTail({ business, plan }) }));
  };

  function push(op) {
    if (!op || typeof op !== 'object') return;
    sentByPlanner.add(op.op);
    if (op.op !== 'addSection' || !op.section || !op.section.type) {
      slots.push({ ready: true, op }); if (op.op === 'setBusiness' && op.business) { business = { ...(business || {}), ...op.business }; startHelpers(); }
      return flush();
    }
    stats.sections++;
    const section = op.section;
    if (hasData(section)) { stats.passedThrough++; const { brief, ...rest } = section; slots.push({ ready: true, op: { ...op, section: rest } }); return flush(); }
    plan.push(section);
    const slot = { ready: false, op: null }; slots.push(slot);
    const page = op.page || 'home';
    stats.writers++;
    run(`section.${section.type}`, () => write({ tail: writerTail({ business, page, section, plan }), section, page, maxTokens: tokensFor(section.type) })).then((data) => {
      // a failed writer still leaves a section: the page fills in safe defaults, the brief becomes its title
      const out = data && typeof data === 'object' ? { ...data } : { title: section.brief || '' };
      if (section.variant && !out.variant) out.variant = section.variant;
      slot.op = { op: 'addSection', page, ...(op.index != null ? { index: op.index } : {}), section: { type: section.type, data: out } };
      slot.ready = true; flush();
    });
  }
  function finish() {
    if (nextP) { // after every section; dropped if the planner sent its own anyway
      const slot = { ready: false, op: null }; slots.push(slot);
      nextP.then((op) => { slot.op = !sentByPlanner.has('suggestNext') && op && op.op === 'suggestNext' ? op : null; slot.ready = true; flush(); });
    }
    finished = true; flush(); return drained;
  }
  return { push, finish, stats: () => stats };
}
