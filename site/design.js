/* Moss Builder: per-site design system.
   Fonts (self-hosted, loaded on demand), the art-direction library, design tokens -> CSS variables,
   a contrast guard, generated art, and extra section layouts (variants) plus new section types.
   Classic script (works from file:// and on Vercel). Exposes window.MossSite.
   Uses esc() and icon() from the main page script at render time. */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- fonts */
  const FONTS = {"Fraunces":{"role":"display","faces":[[400,"normal","fraunces-400-normal.woff2"],[400,"italic","fraunces-400-italic.woff2"],[600,"normal","fraunces-600-normal.woff2"]]},"DM Serif Display":{"role":"display","faces":[[400,"normal","dm-serif-display-400-normal.woff2"],[400,"italic","dm-serif-display-400-italic.woff2"]]},"Instrument Serif":{"role":"display","faces":[[400,"normal","instrument-serif-400-normal.woff2"],[400,"italic","instrument-serif-400-italic.woff2"]]},"Space Grotesk":{"role":"sans","faces":[[400,"normal","space-grotesk-400-normal.woff2"],[500,"normal","space-grotesk-500-normal.woff2"],[700,"normal","space-grotesk-700-normal.woff2"]]},"Archivo":{"role":"sans","faces":[[400,"normal","archivo-400-normal.woff2"],[600,"normal","archivo-600-normal.woff2"],[800,"normal","archivo-800-normal.woff2"]]},"Bebas Neue":{"role":"display","faces":[[400,"normal","bebas-neue-400-normal.woff2"]]},"Bowlby One":{"role":"display","faces":[[400,"normal","bowlby-one-400-normal.woff2"]]},"Nunito":{"role":"sans","faces":[[400,"normal","nunito-400-normal.woff2"],[700,"normal","nunito-700-normal.woff2"],[800,"normal","nunito-800-normal.woff2"]]},"Inter":{"role":"sans","faces":[[400,"normal","inter-400-normal.woff2"],[500,"normal","inter-500-normal.woff2"],[600,"normal","inter-600-normal.woff2"],[700,"normal","inter-700-normal.woff2"]]},"JetBrains Mono":{"role":"mono","faces":[[400,"normal","jetbrains-mono-400-normal.woff2"],[500,"normal","jetbrains-mono-500-normal.woff2"]]},"IBM Plex Mono":{"role":"mono","faces":[[400,"normal","ibm-plex-mono-400-normal.woff2"],[500,"normal","ibm-plex-mono-500-normal.woff2"]]}};
  const FALLBACK = { display: 'Georgia, "Times New Roman", serif', sans: 'system-ui, -apple-system, "Segoe UI", sans-serif', mono: 'ui-monospace, Menlo, monospace' };
  const fontBase = (() => { const s = document.currentScript && document.currentScript.src; return s ? s.replace(/site\/design\.js.*$/, 'fonts/') : 'fonts/'; })();
  const loaded = new Set();
  function ensureFont(family) {
    if (!FONTS[family] || loaded.has(family) || typeof FontFace === 'undefined') return;
    loaded.add(family);
    FONTS[family].faces.forEach(([weight, style, file]) => {
      try {
        const ff = new FontFace(family, `url(${fontBase}${file}) format("woff2")`, { weight: String(weight), style, display: 'swap' });
        document.fonts.add(ff); ff.load().catch(() => {});
      } catch (e) { /* font loading is best effort */ }
    });
  }
  const stack = (family, role) => `"${family}", ${FALLBACK[role === 'display' && FONTS[family] && FONTS[family].role !== 'display' ? 'sans' : role] || FALLBACK.sans}`;

  /* ---------------------------------------------------------------- directions */
  const T = (display, body, mono, extra) => Object.assign({ display, body, mono, case: 'none', weight: 400, tracking: -0.01, scale: 1 }, extra || {});
  const DIRECTIONS = [
    { id: 'editorial', name: 'Editorial Serif', mood: 'Magazine-like: big literary serif, warm paper, generous space.', fits: 'hospitality, food, culture, studios, boutiques',
      colors: { bg: '#f6f1ea', surface: '#fffdf8', ink: '#1d1a16', muted: '#5f574d', accent: '#b04a2f', accent2: '#e9c9a6', inverse: '#1d1a16' },
      type: T('Fraunces', 'Inter', 'IBM Plex Mono', { tracking: -0.02, scale: 1.12 }), shape: { radius: 4, button: 'square', border: 'hairline', shadow: 'none' }, density: 'airy', texture: 'grain', mode: 'light',
      variants: { hero: 'editorial', features: 'list', testimonials: 'single', pricing: 'cards', faq: 'split', cta: 'minimal', footer: 'wordmark' }, art: 'frame' },
    { id: 'swiss', name: 'Swiss Minimal', mood: 'Strict grid, heavy grotesk, black and white with one signal colour.', fits: 'agencies, software, architecture, consultancies',
      colors: { bg: '#ffffff', surface: '#f3f3f1', ink: '#111111', muted: '#575757', accent: '#e4322b', accent2: '#111111', inverse: '#111111' },
      type: T('Inter', 'Inter', 'JetBrains Mono', { weight: 700, tracking: -0.045, scale: 1.05 }), shape: { radius: 0, button: 'square', border: 'hairline', shadow: 'none' }, density: 'regular', texture: 'lines', mode: 'light',
      variants: { hero: 'bigtype', features: 'cards', testimonials: 'grid', pricing: 'table', faq: 'split', cta: 'split', footer: 'columns' }, art: 'shapes' },
    { id: 'brutal', name: 'Neo-Brutalist', mood: 'Loud display type, flat bold fills, square buttons with hard shadows.', fits: 'burgers, bars, streetwear, events, indie brands',
      colors: { bg: '#f3e7d3', surface: '#ffffff', ink: '#1a1a1a', muted: '#3d3934', accent: '#7b5cff', accent2: '#b9e57a', inverse: '#1a1a1a' },
      type: T('Bowlby One', 'Archivo', 'JetBrains Mono', { case: 'uppercase', tracking: 0, scale: 0.9 }), shape: { radius: 0, button: 'brutal', border: 'heavy', shadow: 'hard' }, density: 'regular', texture: 'none', mode: 'light',
      variants: { hero: 'bigtype', features: 'cards', testimonials: 'marquee', pricing: 'cards', faq: 'centered', cta: 'band', footer: 'wordmark' }, art: 'shapes' },
    { id: 'darktech', name: 'Dark Tech', mood: 'Near-black canvas, crisp grotesk, a cyan signal colour and dot-grid visuals.', fits: 'developer tools, AI, SaaS, security, infrastructure',
      colors: { bg: '#07090c', surface: '#10151b', ink: '#e8edf2', muted: '#98a4b0', accent: '#5ccfee', accent2: '#1a2a33', inverse: '#10151b' },
      type: T('Inter', 'Inter', 'JetBrains Mono', { weight: 500, tracking: -0.035, scale: 1 }), shape: { radius: 8, button: 'accent', border: 'hairline', shadow: 'none' }, density: 'regular', texture: 'dotgrid', mode: 'dark',
      variants: { hero: 'spotlight', features: 'bento', testimonials: 'grid', pricing: 'cards', faq: 'centered', cta: 'minimal', footer: 'columns' }, art: 'dotgrid' },
    { id: 'hospitality', name: 'Warm Hospitality', mood: 'Soft serif, sand and terracotta, rounded cards and a gentle glow.', fits: 'hotels, guesthouses, spas, cafes, wellness',
      colors: { bg: '#fbf6ef', surface: '#ffffff', ink: '#2a211b', muted: '#665850', accent: '#a8542c', accent2: '#ead3ba', inverse: '#2a211b' },
      type: T('Instrument Serif', 'Inter', 'JetBrains Mono', { tracking: -0.005, scale: 1.05 }), shape: { radius: 16, button: 'pill', border: 'hairline', shadow: 'soft' }, density: 'airy', texture: 'grain', mode: 'light',
      variants: { hero: 'split', features: 'list', testimonials: 'grid', pricing: 'cards', faq: 'split', cta: 'band', footer: 'columns' }, art: 'orb' },
    { id: 'playful', name: 'Playful Rounded', mood: 'Chunky rounded type, sunny colours, big friendly shapes.', fits: 'kids, pets, education, apps, community',
      colors: { bg: '#fff8ec', surface: '#ffffff', ink: '#1f2a44', muted: '#515c75', accent: '#ff6b4a', accent2: '#ffd166', inverse: '#1f2a44' },
      type: T('Nunito', 'Nunito', 'JetBrains Mono', { weight: 800, tracking: -0.025, scale: 1 }), shape: { radius: 24, button: 'pill', border: 'none', shadow: 'soft' }, density: 'regular', texture: 'none', mode: 'light',
      variants: { hero: 'split', features: 'icons', testimonials: 'single', pricing: 'cards', faq: 'centered', cta: 'split', footer: 'columns' }, art: 'shapes' },
    { id: 'mono', name: 'Mono Grid', mood: 'Grey paper, visible grid lines, grotesk headlines and mono details.', fits: 'portfolios, photographers, designers, galleries',
      colors: { bg: '#ecece9', surface: '#f6f6f3', ink: '#121212', muted: '#575754', accent: '#121212', accent2: '#c7c7c2', inverse: '#121212' },
      type: T('Space Grotesk', 'Space Grotesk', 'IBM Plex Mono', { weight: 500, tracking: -0.045, scale: 1.1 }), shape: { radius: 2, button: 'outline', border: 'hairline', shadow: 'none' }, density: 'regular', texture: 'lines', mode: 'light',
      variants: { hero: 'editorial', features: 'list', testimonials: 'grid', pricing: 'table', faq: 'split', cta: 'minimal', footer: 'wordmark' }, art: 'pattern' },
    { id: 'luxury', name: 'Quiet Luxury', mood: 'Deep charcoal, gold hairlines, refined serif, lots of air.', fits: 'jewellery, fine dining, real estate, private clinics, law',
      colors: { bg: '#12110f', surface: '#1b1916', ink: '#efe9df', muted: '#a69e91', accent: '#c8a96a', accent2: '#2a2620', inverse: '#1b1916' },
      type: T('DM Serif Display', 'Inter', 'IBM Plex Mono', { tracking: -0.01, scale: 1.05 }), shape: { radius: 0, button: 'outline', border: 'hairline', shadow: 'none' }, density: 'airy', texture: 'grain', mode: 'dark',
      variants: { hero: 'centered', features: 'cards', testimonials: 'single', pricing: 'cards', faq: 'split', cta: 'minimal', footer: 'wordmark' }, art: 'orb' },
    { id: 'trade', name: 'Trade Bold', mood: 'Condensed uppercase headlines, navy and safety orange, direct and practical.', fits: 'plumbers, electricians, builders, movers, gyms, auto',
      colors: { bg: '#ffffff', surface: '#f1f4f8', ink: '#0d1b2a', muted: '#475667', accent: '#ff5a1f', accent2: '#0d1b2a', inverse: '#0d1b2a' },
      type: T('Bebas Neue', 'Inter', 'JetBrains Mono', { case: 'uppercase', tracking: 0.01, scale: 1.25 }), shape: { radius: 6, button: 'square', border: 'none', shadow: 'none' }, density: 'compact', texture: 'none', mode: 'light',
      variants: { hero: 'split', features: 'icons', testimonials: 'grid', pricing: 'cards', faq: 'split', cta: 'band', footer: 'columns' }, art: 'shapes' },
  ];
  const byId = (id) => DIRECTIONS.find((d) => d.id === id);

  const VARIANTS = {
    hero: ['split', 'centered', 'editorial', 'bigtype', 'spotlight'],
    features: ['list', 'cards', 'bento', 'icons'],
    testimonials: ['grid', 'single', 'marquee'],
    pricing: ['cards', 'table'],
    faq: ['split', 'centered'],
    cta: ['band', 'split', 'minimal'],
    footer: ['columns', 'wordmark'],
  };
  const ART_KINDS = ['orb', 'dotgrid', 'shapes', 'pattern', 'frame', 'iso'];
  // Motion, global button and nav styles (refine controls). Bold directions animate more by default.
  const MOTION = ['none', 'calm', 'lively'];
  const LIVELY = ['brutal', 'playful', 'darktech'];
  const BTN = { style: ['auto', 'solid', 'outline', 'soft', 'ghost'], size: ['s', 'm', 'l'], hover: ['auto', 'lift', 'glow', 'fill', 'underline'] }; // auto: the direction's own look
  const NAV = { style: ['bar', 'floating', 'minimal', 'centered'] };
  const swatchKey = (n) => String(n || '').toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, ' ').trim().slice(0, 24);
  const ENUMS = { case: ['none', 'uppercase'], button: ['pill', 'square', 'brutal', 'outline', 'accent'], border: ['none', 'hairline', 'heavy'], shadow: ['none', 'soft', 'hard'], density: ['airy', 'regular', 'compact'], texture: ['none', 'grain', 'dotgrid', 'lines'], mode: ['light', 'dark'] };

  /* ---------------------------------------------------------------- colour + contrast */
  const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
  function hex(v) { if (typeof v !== 'string' || !HEX.test(v.trim())) return null; let h = v.trim().slice(1); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); return '#' + h.toLowerCase(); }
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const toHex = (c) => '#' + c.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
  function lum(h) { return rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0); }
  function ratio(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  const mix = (a, b, t) => toHex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * t));
  function readable(fg, bg, min) { // nudge fg toward black or white until it reaches the ratio
    if (ratio(fg, bg) >= min) return fg;
    const target = lum(bg) > 0.4 ? '#000000' : '#ffffff';
    for (let t = 0.1; t <= 1.001; t += 0.1) { const c = mix(fg, target, t); if (ratio(c, bg) >= min) return c; }
    return target;
  }
  const onColor = (bg) => (ratio('#ffffff', bg) >= ratio('#111111', bg) ? '#ffffff' : '#111111');

  /** Contrast guard: body text >= 7:1 is the goal, never below 4.5; muted >= 4.5; accent used for large text >= 3. */
  function guard(c) {
    const out = Object.assign({}, c);
    out.ink = readable(out.ink, out.bg, 7);
    if (ratio(out.ink, out.surface) < 4.5) out.surface = mix(out.surface, out.bg, 0.6);
    out.muted = readable(out.muted, out.bg, 4.5);
    out.accent = readable(out.accent, out.bg, 3);
    return out;
  }


  /* ---------------------------------------------------------------- generated palettes
     Each direction has a colour STRATEGY (how light, how saturated, how the accent relates to the base),
     not a fixed palette. paletteFor() turns a strategy + brand hue into colours, so two sites in the same
     direction get different schemes. h: hue offset from the brand hue (null = neutral grey), s: saturation %, l: lightness %. */
  const STRATEGY = {
    editorial:   { desc: 'warm paper base tinted toward the brand, near-black ink, one rich accent', bg: [25, 20, 94], surface: [25, 25, 98], ink: [0, 25, 10], muted: [0, 10, 36], accent: [0, 62, 40], accent2: [30, 50, 82] },
    swiss:       { desc: 'pure white, black ink, one loud signal colour', bg: [null, 0, 100], surface: [null, 0, 95], ink: [null, 0, 7], muted: [null, 0, 34], accent: [0, 82, 48], accent2: [null, 0, 7] },
    brutal:      { desc: 'pastel base, black outlines, a saturated accent plus a contrasting second colour', bg: [150, 55, 88], surface: [150, 30, 98], ink: [null, 0, 10], muted: [null, 0, 23], accent: [0, 78, 56], accent2: [120, 65, 68] },
    darktech:    { desc: 'near-black base with a cool cast, one luminous accent, grey text', bg: [0, 25, 4.5], surface: [0, 22, 8.5], ink: [0, 18, 92], muted: [0, 10, 64], accent: [0, 80, 62], accent2: [0, 35, 17] },
    hospitality: { desc: 'soft sand base, deep warm ink, an earthy accent and a pale companion', bg: [15, 45, 96], surface: [15, 60, 99], ink: [10, 25, 13], muted: [10, 12, 37], accent: [0, 55, 40], accent2: [10, 50, 84] },
    playful:     { desc: 'creamy bright base, deep ink, a vivid accent and a sunny second colour', bg: [40, 90, 97], surface: [40, 60, 100], ink: [200, 40, 18], muted: [200, 18, 40], accent: [0, 88, 60], accent2: [45, 95, 68] },
    mono:        { desc: 'grey paper, black ink, accent kept almost neutral', bg: [null, 3, 92], surface: [null, 3, 96], ink: [null, 0, 7], muted: [null, 0, 34], accent: [0, 12, 12], accent2: [null, 3, 78] },
    luxury:      { desc: 'deep warm charcoal, ivory text, one metallic accent', bg: [0, 10, 6.5], surface: [0, 10, 10], ink: [0, 25, 91], muted: [0, 8, 62], accent: [0, 45, 60], accent2: [0, 15, 16] },
    trade:       { desc: 'clean white, deep brand-tinted navy ink, one safety-bright accent', bg: [null, 0, 100], surface: [180, 25, 96], ink: [180, 55, 11], muted: [180, 18, 34], accent: [0, 95, 54], accent2: [180, 55, 11] },
  };
  function hsl(h, sat, l) {
    sat /= 100; l /= 100; const k = (n) => (n + h / 30) % 12; const a = sat * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return toHex([f(0) * 255, f(8) * 255, f(4) * 255]);
  }
  const hashHue = (seed) => { let a = 7; for (const ch of String(seed || 'moss')) a = (a * 33 + ch.charCodeAt(0)) >>> 0; return a % 360; };
  function paletteFor(directionId, hue, hue2) {
    const st = STRATEGY[directionId] || STRATEGY.hospitality;
    const H = ((Number(hue) % 360) + 360) % 360;
    const out = {};
    Object.keys(st).forEach((k) => {
      if (k === 'desc') return;
      const [off, sat, l] = st[k];
      let h = off == null ? H : (H + off) % 360;
      if (k === 'accent2' && Number.isFinite(Number(hue2))) h = ((Number(hue2) % 360) + 360) % 360;
      out[k] = hsl(h, off == null ? sat : sat, l);
    });
    out.inverse = lum(out.bg) < 0.2 ? out.surface : out.ink;
    return guard(out);
  }
  const dist = (a, b) => { const x = rgb(a), y = rgb(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); };
  /** True when colours are (nearly) a direction's sample palette, i.e. copied rather than designed. */
  function isSample(colors, dir) {
    const bg = hex(colors && colors.bg), ac = hex(colors && colors.accent);
    return !!(dir && ((bg && dist(bg, dir.colors.bg) < 22) || !bg) && ac && dist(ac, dir.colors.accent) < 40);
  }

  /* ---------------------------------------------------------------- design normalisation */
  function sanitizeDesign(raw, current, opts = {}) {
    raw = raw && typeof raw === 'object' ? raw : {};
    // colour roles may name a swatch ("use Ocean for the accent")
    if (raw.colors && typeof raw.colors === 'object') {
      const sw = Object.assign({}, (current && current.swatches) || {}, raw.swatches && typeof raw.swatches === 'object' ? raw.swatches : {});
      raw = Object.assign({}, raw, { colors: Object.fromEntries(Object.entries(raw.colors).map(([k, v]) => [k, hex(v) || hex(sw[swatchKey(v)]) || v])) });
    }
    const base = byId(raw.direction) || (current && byId(current.direction)) || byId('hospitality');
    const prev = current && current.direction === base.id ? current : JSON.parse(JSON.stringify(base));
    const d = { direction: base.id, name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 40) : (prev.name || base.name) };
    // Colours: keep the current palette for small patches; otherwise generate one from the brand hue.
    // Explicit colours (the user named them) win, unless they are just the direction's sample copied back.
    const sameDir = current && current.direction === base.id;
    const hue = Number.isFinite(Number(raw.hue)) && raw.hue !== null && raw.hue !== '' ? Number(raw.hue) : null;
    const explicit = raw.colors && typeof raw.colors === 'object' && Object.keys(base.colors).some((k) => hex(raw.colors[k])) && !isSample(raw.colors, base);
    let colors = sameDir && hue == null && current.colors ? Object.assign({}, current.colors) : paletteFor(base.id, hue != null ? hue : hashHue(opts.seed || (current && current.name) || base.id), raw.hue2);
    if (explicit) Object.keys(base.colors).forEach((k) => { const h = hex(raw.colors[k]); if (h) colors[k] = h; });
    d.colors = guard(colors);
    d.hue = hue != null ? ((hue % 360) + 360) % 360 : (sameDir && current.hue != null ? current.hue : null);
    d.swatches = Object.assign({}, prev.swatches || {});
    if (raw.swatches && typeof raw.swatches === 'object') Object.keys(raw.swatches).slice(0, 12).forEach((n) => { const h = hex(raw.swatches[n]); const name = swatchKey(n); if (h && name) d.swatches[name] = h; });
    const t = Object.assign({}, base.type, prev.type, raw.type && typeof raw.type === 'object' ? raw.type : {});
    ['display', 'body', 'mono'].forEach((k) => { if (!FONTS[t[k]]) t[k] = (prev.type && FONTS[prev.type[k]]) ? prev.type[k] : base.type[k]; });
    if (!ENUMS.case.includes(t.case)) t.case = base.type.case;
    t.weight = [300, 400, 500, 600, 700, 800].includes(Number(t.weight)) ? Number(t.weight) : base.type.weight;
    t.tracking = Math.max(-0.06, Math.min(0.08, Number(t.tracking) || 0));
    t.scale = Math.max(0.75, Math.min(1.4, Number(t.scale) || 1));
    d.type = { display: t.display, body: t.body, mono: t.mono, case: t.case, weight: t.weight, tracking: t.tracking, scale: t.scale, navCase: ENUMS.case.includes(t.navCase) ? t.navCase : t.case };
    const s = Object.assign({}, base.shape, prev.shape, raw.shape && typeof raw.shape === 'object' ? raw.shape : {});
    d.shape = { radius: Math.max(0, Math.min(40, Number(s.radius) || 0)), button: ENUMS.button.includes(s.button) ? s.button : base.shape.button, border: ENUMS.border.includes(s.border) ? s.border : base.shape.border, shadow: ENUMS.shadow.includes(s.shadow) ? s.shadow : base.shape.shadow };
    ['density', 'texture', 'mode'].forEach((k) => { d[k] = ENUMS[k].includes(raw[k]) ? raw[k] : (prev[k] || base[k]); });
    d.mode = lum(d.colors.bg) < 0.25 ? 'dark' : 'light';
    d.variants = Object.assign({}, base.variants, prev.variants);
    if (raw.variants && typeof raw.variants === 'object') Object.keys(VARIANTS).forEach((k) => { if (VARIANTS[k].includes(raw.variants[k])) d.variants[k] = raw.variants[k]; });
    d.art = ART_KINDS.includes(raw.art) ? raw.art : (prev.art || base.art);
    d.motion = MOTION.includes(raw.motion) ? raw.motion : (MOTION.includes(current && current.motion) ? current.motion : (LIVELY.includes(base.id) ? 'lively' : 'calm'));
    const b = Object.assign({ style: 'auto', size: 'm', hover: 'auto' }, (current && current.button) || {}, raw.button && typeof raw.button === 'object' ? raw.button : {});
    d.button = { style: BTN.style.includes(b.style) ? b.style : 'auto', size: BTN.size.includes(b.size) ? b.size : 'm', hover: BTN.hover.includes(b.hover) ? b.hover : 'auto' };
    const nv = Object.assign({ style: 'bar', sticky: false }, (current && current.nav) || {}, raw.nav && typeof raw.nav === 'object' ? raw.nav : {});
    d.nav = { style: NAV.style.includes(nv.style) ? nv.style : 'bar', sticky: nv.sticky === true || nv.sticky === 'true' };
    return d;
  }
  const fromDirection = (id, seed) => sanitizeDesign({ direction: id }, null, { seed: seed || id });

  /* ---------------------------------------------------------------- apply to the page */
  const DENSITY = { airy: 1.2, regular: 1, compact: 0.8 };
  function apply(el, d) {
    if (!el) return;
    if (!d) { el.removeAttribute('style'); ['button', 'border', 'shadow', 'texture', 'mode', 'direction', 'motion', 'btnStyle', 'btnSize', 'btnHover', 'nav', 'navSticky'].forEach((k) => delete el.dataset[k]); return; }
    [d.type.display, d.type.body, d.type.mono].forEach(ensureFont);
    const c = d.colors;
    const line = mix(c.bg, c.ink, d.mode === 'dark' ? 0.16 : 0.11);
    const tint = mix(c.bg, c.ink, d.mode === 'dark' ? 0.05 : 0.035);
    const vars = {
      '--s-bg': c.bg, '--s-card': c.surface, '--s-ink': c.ink, '--s-ink-2': c.muted, '--s-accent': c.accent, '--s-glow': c.accent2 && c.accent2 !== c.ink ? c.accent2 : c.accent,
      '--s-dark': c.inverse, '--s-on-dark': onColor(c.inverse), '--s-on-accent': onColor(c.accent), '--s-tint': tint, '--s-line': line,
      '--s-display': stack(d.type.display, 'display'), '--s-body': stack(d.type.body, 'sans'), '--s-mono': stack(d.type.mono, 'mono'),
      '--s-case': d.type.case, '--s-nav-case': d.type.navCase, '--s-weight': d.type.weight, '--s-track': d.type.tracking + 'em', '--s-scale': d.type.scale,
      '--s-radius': d.shape.radius + 'px', '--s-btn-radius': d.shape.button === 'pill' ? '999px' : Math.min(d.shape.radius, 10) + 'px', '--s-density': DENSITY[d.density],
    };
    Object.keys(d.swatches || {}).forEach((n) => { vars['--sw-' + n.replace(/\s+/g, '-')] = d.swatches[n]; });
    el.setAttribute('style', Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';'));
    Object.assign(el.dataset, { button: d.shape.button, border: d.shape.border, shadow: d.shape.shadow, texture: d.texture, mode: d.mode, direction: d.direction,
      motion: d.motion || 'calm', btnStyle: (d.button || {}).style || 'auto', btnSize: (d.button || {}).size || 'm', btnHover: (d.button || {}).hover || 'auto', nav: (d.nav || {}).style || 'bar', navSticky: String(!!(d.nav || {}).sticky) });
  }

  /* ---------------------------------------------------------------- generated art (SVG, seeded) */
  function rng(seed) { let a = 0; for (const ch of String(seed || 'moss')) a = (a * 31 + ch.charCodeAt(0)) >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function art(kind, seed, d, label) {
    const c = (d && d.colors) || { bg: '#f4f1ec', surface: '#ffffff', ink: '#1b1c20', muted: '#666', accent: '#0d7480', accent2: '#cfe9ec', inverse: '#1b1c20' };
    const r = rng(seed + kind); const W = 800, H = 600; const id = 'g' + Math.floor(r() * 1e9).toString(36);
    let body = '';
    if (kind === 'orb') {
      body = `<defs><radialGradient id="${id}a" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="${c.accent2}"/><stop offset=".55" stop-color="${c.accent}"/><stop offset="1" stop-color="${c.inverse}"/></radialGradient><radialGradient id="${id}b" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${c.surface}" stop-opacity=".9"/><stop offset="1" stop-color="${c.surface}" stop-opacity="0"/></radialGradient></defs>
        <rect width="${W}" height="${H}" fill="${mix(c.bg, c.accent2, 0.35)}"/>
        <circle cx="${380 + r() * 80}" cy="${300 + r() * 40}" r="${210 + r() * 40}" fill="url(#${id}a)"/>
        <circle cx="${280 + r() * 60}" cy="${210 + r() * 40}" r="${90 + r() * 30}" fill="url(#${id}b)"/>
        <ellipse cx="400" cy="${H - 40}" rx="300" ry="26" fill="${c.ink}" opacity=".08"/>`;
    } else if (kind === 'dotgrid') {
      const cols = 17, rows = 12, hi = 8; // signal column centred so the square crop keeps the frame
      body = `<rect width="${W}" height="${H}" fill="${c.bg}"/>`;
      const frame = `<rect x="${48 + (hi - 3.5) * 44}" y="${60 + 2 * 44 - 22}" width="${7 * 44}" height="${7 * 44}" rx="16" fill="${c.surface}" fill-opacity=".35" stroke="${c.muted}" stroke-opacity=".6" stroke-width="1.5"/>`;
      body += frame;
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const on = x === hi && y > 2 && y < 9; const cx = 48 + x * 44, cy = 60 + y * 44;
        const fade = 1 - Math.min(1, Math.hypot(x - hi, y - 5.5) / 9); // brighter toward the signal column
        body += on ? `<circle cx="${cx}" cy="${cy}" r="9" fill="${c.accent}" opacity=".18"/><circle cx="${cx}" cy="${cy}" r="4.2" fill="${c.accent}"/>`
          : `<circle cx="${cx}" cy="${cy}" r="2.6" fill="${c.muted}" opacity="${(0.18 + fade * 0.5).toFixed(2)}"/>`;
      }
    } else if (kind === 'shapes') {
      const pal = [c.accent, c.accent2, c.ink, mix(c.accent, c.bg, 0.5)];
      body = `<rect width="${W}" height="${H}" fill="${mix(c.bg, c.accent2, 0.25)}"/>`;
      for (let i = 0; i < 6; i++) {
        const f = pal[i % pal.length], x = 80 + r() * 560, y = 60 + r() * 400, s = 90 + r() * 170, k = Math.floor(r() * 3);
        const stroke = d && d.shape && d.shape.border === 'heavy' ? ` stroke="${c.ink}" stroke-width="5"` : '';
        if (k === 0) body += `<circle cx="${x}" cy="${y}" r="${s / 2}" fill="${f}"${stroke}/>`;
        else if (k === 1) body += `<rect x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s * 0.8}" rx="${d ? d.shape.radius : 8}" fill="${f}"${stroke} transform="rotate(${(r() - 0.5) * 24} ${x} ${y})"/>`;
        else body += `<path d="M${x - s / 2} ${y + s / 3} A${s / 2} ${s / 2} 0 0 1 ${x + s / 2} ${y + s / 3} Z" fill="${f}"${stroke}/>`;
      }
    } else if (kind === 'pattern') {
      body = `<rect width="${W}" height="${H}" fill="${c.surface}"/>`;
      const n = 18 + Math.floor(r() * 10);
      for (let i = 0; i < n; i++) { const y = (i + 0.5) * (H / n); const a = 18 + r() * 30; body += `<path d="M0 ${y} C ${W * 0.25} ${y - a}, ${W * 0.5} ${y + a}, ${W} ${y - a / 2}" fill="none" stroke="${i % 5 === 2 ? c.accent : c.ink}" stroke-opacity="${i % 5 === 2 ? 0.9 : 0.25}" stroke-width="${i % 5 === 2 ? 3 : 1.2}"/>`; }
    } else if (kind === 'iso') {
      body = `<rect width="${W}" height="${H}" fill="${mix(c.bg, c.surface, 0.5)}"/>`;
      const box = (x, y, s, top, left, right) => `<polygon points="${x},${y} ${x + s},${y + s / 2} ${x},${y + s} ${x - s},${y + s / 2}" fill="${top}"/><polygon points="${x - s},${y + s / 2} ${x},${y + s} ${x},${y + s * 1.5} ${x - s},${y + s}" fill="${left}"/><polygon points="${x},${y + s} ${x + s},${y + s / 2} ${x + s},${y + s} ${x},${y + s * 1.5}" fill="${right}"/>`;
      for (let i = 0; i < 5; i++) body += box(220 + i * 90 + r() * 20, 140 + (i % 2) * 90 + r() * 30, 70, c.surface, mix(c.surface, c.ink, 0.12), mix(c.surface, c.ink, 0.2));
      body += box(400, 250, 80, mix(c.accent, c.surface, 0.2), c.accent, mix(c.accent, c.ink, 0.25));
    } else { // frame: a calm photographic placeholder
      body = `<defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(c.accent2, c.surface, 0.3)}"/><stop offset=".62" stop-color="${mix(c.accent2, c.accent, 0.35)}"/><stop offset=".62" stop-color="${mix(c.accent, c.ink, 0.2)}"/><stop offset="1" stop-color="${mix(c.accent, c.ink, 0.45)}"/></linearGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#${id}s)"/>
        <circle cx="${520 + r() * 120}" cy="${170 + r() * 60}" r="${46 + r() * 20}" fill="${c.surface}" opacity=".75"/>
        <path d="M0 ${H * 0.62} Q ${W * 0.3} ${H * 0.55} ${W * 0.55} ${H * 0.6} T ${W} ${H * 0.58} V ${H} H 0 Z" fill="${mix(c.accent, c.ink, 0.3)}" opacity=".55"/>`;
    }
    const cap = label ? `<span class="art-cap">${esc(label)}</span>` : '';
    return `<div class="art art-${kind}" aria-hidden="true"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${body}</svg>${cap}</div>`;
  }

  /* ---------------------------------------------------------------- section variants + new types */
  const rich = (t) => esc(t).replace(/\*([^*]{1,80})\*/g, '<em class="acc">$1</em>');
  const btn = (label, href, kind = 'primary') => `<a class="btn btn-${kind}" href="${esc(href || '#/home')}">${esc(label)}</a>`;
  const logos = (label) => label ? `<div class="logo-row"><span class="lbl">${esc(label)}</span><div class="logos">${[58, 46, 64, 52, 44].map((w, i) => `<span class="ph-logo" aria-hidden="true"><i style="width:${[16, 15, 15, 18, 7][i]}px;height:${[16, 15, 15, 9, 16][i]}px;border-radius:${['50%', '4px', '2px', '9px 9px 0 0', '2px'][i]}"></i><b style="width:${w}px"></b></span>`).join('')}</div></div>` : '';
  const head = (d, center) => `<div class="s-head ${center ? 'center' : ''}"><div><span class="eyebrow">${esc(d.eyebrow || '')}</span><h2>${rich(d.title || '')}</h2></div>${d.lede ? `<p>${esc(d.lede)}</p>` : '<p></p>'}</div>`;
  /** An uploaded photo replaces the generated art in the same slot. Only data:image URLs are accepted. */
  const photo = (src, alt) => (typeof src === 'string' && /^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(src) ? `<div class="art art-photo"><img src="${src}" alt="${esc(alt || '')}"></div>` : null);
  const artOf = (dt, design, fallbackKind) => photo(dt.image, dt.imageAlt || dt.headline || dt.title) || art((dt.art && dt.art.kind) || (design && design.art) || fallbackKind, (dt.art && dt.art.seed) || dt.headline || dt.title || 'moss', design, dt.art && dt.art.label);
  const items = (a) => (Array.isArray(a) ? a : []);

  const V = {
    hero: {
      editorial: (d, ds) => `<div class="wrap"><div class="ed-grid"><div class="ed-meta"><span class="eyebrow">${esc(d.eyebrow)}</span><p class="sub">${esc(d.sub)}</p><div class="actions">${btn(d.primary, d.primaryHref || '#/booking')}${btn(d.secondary || 'Learn more', '#/home', 'secondary')}</div></div><h1>${rich(d.headline)}</h1></div><div class="ed-art">${artOf(d, ds, 'frame')}</div></div>`,
      bigtype: (d, ds) => `<div class="wrap"><span class="eyebrow">${esc(d.eyebrow)}</span><h1>${rich(d.headline)}</h1><div class="bt-row"><p class="sub">${esc(d.sub)}</p><div class="actions">${btn(d.primary, d.primaryHref || '#/booking')}${btn(d.secondary || 'Learn more', '#/home', 'secondary')}</div></div><div class="bt-art">${artOf(d, ds, 'shapes')}</div></div>`,
      spotlight: (d, ds) => `<div class="wrap"><div class="sp-art">${artOf(d, ds, 'dotgrid')}</div><span class="eyebrow">${esc(d.eyebrow)}</span><h1>${rich(d.headline)}</h1><p class="sub">${esc(d.sub)}</p><div class="actions">${btn(d.primary, d.primaryHref || '#/booking')}${btn(d.secondary || 'Learn more', '#/home', 'secondary')}</div></div>`,
    },
    features: {
      cards: (d) => `<div class="wrap">${head(d)}<div class="fc-grid">${items(d.items).slice(0, 6).map(([ic, t, p]) => `<article class="fc"><span class="ic">${icon(ic)}</span><h3>${esc(t)}</h3><p>${esc(p)}</p></article>`).join('')}</div></div>`,
      bento: (d, ds) => { const it = items(d.items); return `<div class="wrap">${head(d)}<div class="bento">${it.slice(0, 4).map(([ic, t, p], i) => `<article class="bx bx-${i}">${i === 0 ? artOf({ art: { kind: (ds && ds.art) || 'iso', seed: t } }, ds, 'iso') : `<span class="ic">${icon(ic)}</span>`}<div><h3>${esc(t)}</h3><p>${esc(p)}</p></div></article>`).join('')}</div></div>`; },
      icons: (d) => `<div class="wrap">${head(d, true)}<div class="fi-row">${items(d.items).slice(0, 4).map(([ic, t, p]) => `<div class="fi"><span class="ic">${icon(ic)}</span><h3>${esc(t)}</h3><p>${esc(p)}</p></div>`).join('')}</div></div>`,
    },
    testimonials: {
      single: (d) => { const [q, n, r] = items(d.items)[0] || ['', '', '']; const rest = items(d.items).slice(1, 3); return `<div class="wrap ts-single"><span class="eyebrow">${esc(d.eyebrow)}</span><blockquote>“${esc(q)}”</blockquote><p class="who"><b>${esc(n)}</b> · ${esc(r)}</p>${rest.length ? `<div class="ts-more">${rest.map(([q2, n2]) => `<p>“${esc(q2)}” <span>${esc(n2)}</span></p>`).join('')}</div>` : ''}${logos(d.logos)}</div>`; },
      marquee: (d) => { const row = items(d.items).map(([q, n]) => `<span class="mq-item">“${esc(q)}” <b>${esc(n)}</b></span>`).join('<span class="mq-dot">✦</span>'); return `<div class="wrap">${head(d)}</div><div class="mq" aria-label="Testimonials"><div class="mq-track">${row}<span class="mq-dot">✦</span>${row}</div></div><div class="wrap">${logos(d.logos)}</div>`; },
    },
    pricing: {
      table: (d) => { const plans = items(d.plans).slice(0, 4); const feats = [...new Set(plans.flatMap((p) => items(p[2])))].slice(0, 8); return `<div class="wrap">${head(d)}<div class="pt"><div class="pt-row pt-h"><span></span>${plans.map(([n, p, , f]) => `<div class="${f ? 'feat' : ''}"><b>${esc(n)}</b><span class="pr"><b>${esc(p)}</b> ${esc(d.unit || '')}</span></div>`).join('')}</div>${feats.map((f) => `<div class="pt-row"><span>${esc(f)}</span>${plans.map((p) => `<div>${items(p[2]).includes(f) ? icon('check') : '<i>—</i>'}</div>`).join('')}</div>`).join('')}<div class="pt-row pt-f"><span></span>${plans.map(([, , , f]) => `<div>${btn(d.cta || 'Choose', '#/booking', f ? 'primary' : 'secondary')}</div>`).join('')}</div></div></div>`; },
    },
    faq: {
      centered: (d) => `<div class="wrap faq-c">${head(d, true)}<div class="faq-list">${items(d.items).map(([q, a], i) => `<details ${i === 0 ? 'open' : ''}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div></div>`,
    },
    cta: {
      split: (d, ds) => `<div class="wrap"><div class="cta-split"><div><span class="eyebrow">${esc(d.eyebrow)}</span><h2>${rich(d.title)}</h2><p>${esc(d.sub)}</p>${btn(d.button, d.href || '#/home')}</div>${artOf(d, ds, 'orb')}</div></div>`,
      minimal: (d) => `<div class="wrap cta-min"><h2>${rich(d.title)}</h2><div>${d.sub ? `<p>${esc(d.sub)}</p>` : ''}${btn(d.button, d.href || '#/home')}</div></div>`,
    },
    footer: {
      wordmark: (d) => `<div class="wrap"><div class="fw-top">${items(d.cols).map(([h, l]) => `<div><h4>${esc(h)}</h4><ul>${items(l).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}<p>${esc(d.blurb || '')}</p></div><div class="fw-mark">${esc(d.name || '')}</div><div class="foot-base"><span>${esc(d.base || '')}</span><span>Built with Moss</span></div></div>`,
    },
  };

  /* New section types: defaults (used when the model omits fields) + renderers. */
  const NEW_TYPES = {
    steps: { label: 'Steps', icon: 'bars', cls: 'sec-pad', defaults: (c) => ({ eyebrow: 'How it works', title: 'Three steps, no surprises.', items: [['Tell us what you need', 'A two-minute form or a quick call.'], ['Get a clear quote', 'Fixed price before any work starts.'], ['Sit back', `${c && c.name ? c.name : 'We'} handle the rest and keep you posted.`]] }),
      render: (d) => `<div class="wrap">${head(d)}<ol class="steps">${items(d.items).slice(0, 5).map(([t, p], i) => `<li><span class="n">${String(i + 1).padStart(2, '0')}</span><h3>${esc(t)}</h3><p>${esc(p)}</p></li>`).join('')}</ol></div>` },
    gallery: { label: 'Gallery', icon: 'grid', cls: 'sec-pad', defaults: () => ({ eyebrow: 'Gallery', title: 'A closer look.', items: [['Morning', 'frame'], ['Detail', 'pattern'], ['Space', 'orb'], ['Craft', 'shapes'], ['Evening', 'frame'], ['People', 'orb']] }),
      render: (d, ds) => `<div class="wrap">${head(d)}<div class="gal">${items(d.items).slice(0, 6).map(([cap, kind], i) => `<figure class="g-${i}">${(i === 0 && photo(d.image, cap)) || art(ART_KINDS.includes(kind) ? kind : (ds && ds.art) || 'frame', (d.title || '') + i, ds)}<figcaption>${esc(cap)}</figcaption></figure>`).join('')}</div></div>` },
    logos: { label: 'Logos', icon: 'stack', cls: 'sec-logos', defaults: () => ({ label: 'Trusted by' }), render: (d) => `<div class="wrap">${logos(d.label || 'Trusted by')}</div>` },
    callStrip: { label: 'Call strip', icon: 'bolt', cls: 'sec-call', defaults: (c) => ({ title: 'Need help today?', sub: 'Same-day appointments, seven days a week.', button: 'Call now', phone: '(555) 010-0199' }),
      render: (d) => `<div class="wrap call"><div><h2>${rich(d.title)}</h2><p>${esc(d.sub || '')}</p></div><div class="call-r"><span class="phone">${esc(d.phone || '')}</span>${btn(d.button || 'Call now', d.href || '#/home')}</div></div>` },
  };

  function variantOf(sec, design) {
    const list = VARIANTS[sec.type];
    if (!list) return null;
    const v = sec.data && sec.data.variant;
    if (list.includes(v)) return v;
    return (design && design.variants && list.includes(design.variants[sec.type])) ? design.variants[sec.type] : list[0];
  }
  /** Render a variant or new type; returns null to let the page's default template handle it. */
  function render(sec, design) {
    if (NEW_TYPES[sec.type]) return NEW_TYPES[sec.type].render(sec.data || {}, design);
    const v = variantOf(sec, design);
    const fn = v && V[sec.type] && V[sec.type][v];
    return fn ? fn(sec.data || {}, design) : null;
  }
  /** Compact library for the model's prompt. */
  // Sent to the model: colour STRATEGIES, never sample hex values, so it invents a palette per brand.
  const library = () => DIRECTIONS.map((d) => ({ id: d.id, name: d.name, mood: d.mood, fits: d.fits, palette: STRATEGY[d.id].desc, type: { display: d.type.display, body: d.type.body, case: d.type.case }, shape: d.shape, mode: d.mode, variants: d.variants, art: d.art }));

  /** Which layouts of a section type have an art slot that a photo can fill. */
  const PHOTO_VARIANTS = { hero: ['editorial', 'bigtype', 'spotlight'], cta: ['split'], features: ['bento'] };
  const hasPhotoSlot = (sec, design) => sec.type === 'gallery' || (PHOTO_VARIANTS[sec.type] || []).includes(variantOf(sec, design));
  window.MossSite = { MOTION, BTN, NAV, swatchKey, photo, onColor, PHOTO_VARIANTS, hasPhotoSlot, paletteFor, isSample, hashHue, STRATEGY, FONTS, DIRECTIONS, VARIANTS, ART_KINDS, NEW_TYPES, byId, fromDirection, sanitizeDesign, apply, art, render, variantOf, rich, ratio, guard, library, ensureFont };
})();
