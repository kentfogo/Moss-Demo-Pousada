// Vercel function: GET /api/scrape?url=example.com
// Reads one public web page and returns the facts a redesign needs (name, headings, services, contact, prices,
// quotes, brand colour) as compact JSON. Used by "mock up joesplumbing.com".
//
// Safety: http(s) on ports 80/443 only; every DNS answer is checked inside the socket's own lookup, so private,
// loopback, link-local and cloud-metadata addresses are refused even after redirects or DNS rebinding.
// 8 s timeout, 1.5 MB cap, HTML only, at most 3 redirects. Results are cached on Vercel's CDN for an hour.
import http from 'node:http';
import https from 'node:https';
import dns from 'node:dns';
import zlib from 'node:zlib';
import net from 'node:net';
import { guard } from './_guard.js';
import { trace } from './_trace.js';
import * as knowledge from './_knowledge.js';

export const config = { maxDuration: 30 };
export const LIMITS = { timeoutMs: 8000, maxBytes: 1.5e6, maxRedirects: 3, cssBytes: 300e3 };

/* ------------------------------------------------------------ address checks */
function v4parts(ip) { const p = ip.split('.').map(Number); return p.length === 4 && p.every((n) => Number.isInteger(n) && n >= 0 && n <= 255) ? p : null; }
export function isPrivateAddress(ip) {
  if (typeof ip !== 'string') return true;
  ip = ip.trim().toLowerCase().replace(/^\[|\]$/g, '').replace(/%.*$/, '');
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/); if (mapped) ip = mapped[1];
  if (net.isIPv4(ip)) {
    const [a, b, c] = v4parts(ip);
    return a === 0 || a === 10 || a === 127 || a >= 224 // this-network, private, loopback, multicast/reserved
      || (a === 100 && b >= 64 && b <= 127) // carrier-grade NAT
      || (a === 169 && b === 254) // link-local, cloud metadata
      || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
      || (a === 192 && b === 0 && c === 0) || (a === 198 && (b === 18 || b === 19));
  }
  if (net.isIPv6(ip)) {
    if (ip === '::' || ip === '::1') return true;
    const first = parseInt(ip.split(':')[0] || '0', 16);
    if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
    if ((first & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
    if ((first & 0xff00) === 0xff00) return true; // multicast
    if (/^::ffff:/.test(ip) || /^64:ff9b:/.test(ip)) return true; // other embedded-v4 forms: refuse rather than parse
    return false;
  }
  return true; // not an IP at all
}

/** dns.lookup replacement used by the socket itself: refuses the connection if any answer is private. */
export function safeLookup(hostname, options, cb) {
  if (typeof options === 'function') { cb = options; options = {}; }
  dns.lookup(hostname, { all: true }, (err, addrs) => {
    if (err) return cb(err);
    if (!addrs.length || addrs.some((a) => isPrivateAddress(a.address))) return cb(Object.assign(new Error('That address is not public.'), { code: 'EBLOCKED', status: 422 }));
    if (options && options.all) return cb(null, addrs);
    cb(null, addrs[0].address, addrs[0].family);
  });
}

/** Normalise what the user said ("Joes Plumbing dot com", "www.x.com/about") into a URL, or null. */
export function toUrl(input) {
  let s = String(input || '').trim().replace(/\s+dot\s+/gi, '.').replace(/\s+/g, '');
  if (!s) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = 'https://' + s;
  let u; try { u = new URL(s); } catch { return null; }
  if (!['http:', 'https:'].includes(u.protocol)) return null;
  if (u.port && !['80', '443'].includes(u.port)) return null;
  if (u.username || u.password) return null;
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(host) ? isPrivateAddress(host) : !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(host) || /(^|\.)(localhost|local|internal|lan|home|corp)$/i.test(host)) return null;
  u.hash = '';
  return u;
}

/* ------------------------------------------------------------ fetching */
function getOnce(u, { maxBytes, timeoutMs, accept, lookup }) {
  return new Promise((resolve, reject) => {
    const mod = u.protocol === 'https:' ? https : http;
    const req = mod.get(u, { lookup: lookup || safeLookup, timeout: timeoutMs, headers: { 'user-agent': 'Mozilla/5.0 (compatible; MossBuilder/1.0; site redesign preview)', accept, 'accept-encoding': 'gzip, deflate, br', 'accept-language': 'en' } }, (res) => {
      const status = res.statusCode || 0;
      if (status >= 300 && status < 400 && res.headers.location) { res.resume(); return resolve({ redirect: new URL(res.headers.location, u) }); }
      if (status >= 400) { res.resume(); return reject(Object.assign(new Error(`The site answered ${status}.`), { status: 502 })); }
      const enc = String(res.headers['content-encoding'] || '').toLowerCase();
      const stream = enc === 'gzip' ? res.pipe(zlib.createGunzip()) : enc === 'deflate' ? res.pipe(zlib.createInflate()) : enc === 'br' ? res.pipe(zlib.createBrotliDecompress()) : res;
      const chunks = []; let size = 0;
      stream.on('data', (c) => { size += c.length; if (size > maxBytes) { req.destroy(); stream.destroy(); reject(Object.assign(new Error('That page is too large to read.'), { status: 413 })); } else chunks.push(c); });
      stream.on('end', () => resolve({ type: String(res.headers['content-type'] || ''), body: Buffer.concat(chunks).toString('utf8'), url: u }));
      stream.on('error', (e) => reject(Object.assign(e, { status: 502 })));
    });
    req.on('timeout', () => req.destroy(Object.assign(new Error('The site took too long to answer.'), { status: 504 })));
    req.on('error', (e) => reject(Object.assign(e, { status: e.status || (e.code === 'ENOTFOUND' ? 404 : 502), message: e.code === 'ENOTFOUND' ? 'That site could not be found.' : e.message })));
  });
}

/** opts.lookup exists only for tests (to reach a local fixture server); the handler never passes it. */
export async function fetchPage(u, opts = {}) {
  const o = Object.assign({ maxBytes: LIMITS.maxBytes, timeoutMs: LIMITS.timeoutMs, accept: 'text/html,application/xhtml+xml', html: true }, opts);
  for (let hop = 0; hop <= LIMITS.maxRedirects; hop++) {
    const out = await getOnce(u, o);
    if (out.redirect) { const next = out.redirect.origin === u.origin ? out.redirect : toUrl(out.redirect.href); /* same site is fine: the lookup still checks the address */ if (!next) throw Object.assign(new Error('That page redirects somewhere I can\'t read.'), { status: 422 }); u = next; continue; }
    if (o.html && !/text\/html|application\/xhtml/i.test(out.type)) throw Object.assign(new Error('That link is not a web page.'), { status: 422 });
    return out;
  }
  throw Object.assign(new Error('Too many redirects.'), { status: 422 });
}

/* ------------------------------------------------------------ extraction */
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', mdash: '—', ndash: '–', hellip: '…', copy: '©', reg: '®', trade: '™', eacute: 'é' };
const decode = (s) => s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => e[0] === '#' ? (() => { const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : ''; })() : (ENT[e.toLowerCase()] ?? m));
const text = (s) => decode(String(s || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const all = (html, re) => [...html.matchAll(re)];
const uniq = (arr, n, min = 2, max = 300) => { const seen = new Set(); const out = []; for (const x of arr) { const t = (x || '').trim(); const k = t.toLowerCase(); if (t.length < min || t.length > max || seen.has(k)) continue; seen.add(k); out.push(t); if (out.length >= n) break; } return out; };
const meta = (html, key) => { const m = html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${key}["'][^>]*>`, 'i')); const c = m && m[0].match(/content=["']([^"']*)["']/i); return c ? text(c[1]) : ''; };

function hexToHsl(h) {
  let x = h.replace('#', ''); if (x.length === 3) x = x.split('').map((c) => c + c).join('');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16) / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  const hue = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: Math.round(((hue * 60) + 360) % 360), s, l };
}
/** The most used saturated colour in the page's CSS: a fair guess at the brand colour. */
export function brandColor(css) {
  const counts = {};
  for (const m of String(css || '').matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi)) {
    let h = m[1].toLowerCase(); if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const { s, l } = hexToHsl(h); if (s < 0.35 || l < 0.18 || l > 0.85) continue; // skip greys, near-black and near-white
    counts['#' + h] = (counts['#' + h] || 0) + 1;
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : null;
}

export function extract(html, pageUrl, extraCss = '') {
  const raw = String(html || '');
  const styles = all(raw, /<style[^>]*>([\s\S]*?)<\/style>/gi).map((m) => m[1]).join('\n') + all(raw, /style=["']([^"']*)["']/gi).map((m) => m[1]).join(';');
  const h = raw.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<(script|style|noscript|svg|template|iframe)[\s\S]*?<\/\1>/gi, ' ');
  const siteName = meta(h, 'og:site_name');
  const title = text((h.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]);
  const name = (siteName || title.split(/\s[|–—·:-]\s/)[0] || '').slice(0, 60) || (pageUrl ? new URL(pageUrl).hostname.replace(/^www\./, '') : '');
  const headings = (lv) => uniq(all(h, new RegExp(`<h${lv}[^>]*>([\\s\\S]*?)<\\/h${lv}>`, 'gi')).map((m) => text(m[1])), lv === 1 ? 2 : 10, 2, 140);
  const navBlock = (h.match(/<nav[\s\S]*?<\/nav>/i) || [h.match(/<header[\s\S]*?<\/header>/i) || [''], ''])[0];
  const nav = uniq(all(String(navBlock), /<a[^>]*>([\s\S]*?)<\/a>/gi).map((m) => text(m[1])), 10, 2, 30);
  const body = text(h);
  const tel = (h.match(/href=["']tel:([^"']+)["']/i) || [])[1];
  const phone = tel ? decodeURIComponent(tel).trim() : (body.match(/(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/) || [])[0] || '';
  const mail = (h.match(/href=["']mailto:([^"'?]+)/i) || [])[1] || (body.match(/[\w.+-]+@[\w-]+\.[\w.-]+/) || [])[0] || '';
  const address = text((h.match(/<address[^>]*>([\s\S]*?)<\/address>/i) || [])[1]) || [meta(h, 'business:contact_data:street_address'), (raw.match(/"streetAddress"\s*:\s*"([^"]+)"/) || [])[1], (raw.match(/"addressLocality"\s*:\s*"([^"]+)"/) || [])[1]].filter(Boolean).join(', ');
  const hours = uniq((body.match(/\b(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?\s*(?:[-–to]+\s*(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?)?\s*:?\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*[-–to]+\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?/gi) || []), 4, 6, 60);
  const prices = uniq(body.match(/(?:[$€£]\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?(?:\s?(?:\/|per)\s?[a-z]+\b)?|\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s?(?:USD|EUR|GBP))/gi) || [], 8, 2, 30);
  const quotes = uniq([...all(h, /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi).map((m) => text(m[1])), ...(body.match(/[“"][^“”"]{40,280}[”"]/g) || []).map((q) => q.replace(/^[“"]|[”"]$/g, ''))], 4, 30, 300);
  const paragraphs = uniq(all(h, /<p[^>]*>([\s\S]*?)<\/p>/gi).map((m) => text(m[1])), 8, 40, 400);
  const items = uniq(all(h.replace(/<nav[\s\S]*?<\/nav>|<footer[\s\S]*?<\/footer>/gi, ' '), /<li[^>]*>([\s\S]*?)<\/li>/gi).map((m) => text(m[1])), 16, 4, 120);
  const brand = /^#[0-9a-f]{3,6}$/i.test(meta(h, 'theme-color')) && hexToHsl(meta(h, 'theme-color')).s > 0.3 ? meta(h, 'theme-color') : brandColor(styles + '\n' + extraCss);
  const out = {
    url: pageUrl ? String(pageUrl) : undefined, name, title, description: meta(h, 'description') || meta(h, 'og:description'),
    h1: headings(1), headings: [...headings(2), ...headings(3)].slice(0, 14), nav,
    paragraphs, items, contact: { phone, email: mail, address: address.slice(0, 140) }, hours, prices, quotes,
    brandColor: brand || null, brandHue: brand ? hexToHsl(brand).h : null,
  };
  // keep the payload small: trim the longest lists until it fits
  const order = ['items', 'paragraphs', 'headings', 'quotes', 'nav', 'prices'];
  let guardN = 0;
  while (JSON.stringify(out).length > 4000 && guardN++ < 60) { const k = order.find((x) => out[x].length > 2) || 'paragraphs'; if (!out[k].length) break; out[k].pop(); }
  return out;
}

/* ------------------------------------------------------------ passages (for the knowledge index) */
const KIND_RE = [
  ['hours', /\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\b.*\d|\bopen(ing)? hours\b|\b\d{1,2}(:\d{2})?\s?(am|pm)\b/i],
  ['contact', /(\+?\d[\d\s().-]{8,}\d)|@[\w-]+\.\w|\b(call|email|contact|address|visit us|located)\b/i],
  ['price', /[$€£]\s?\d|\b\d+\s?(usd|eur|gbp)\b|\b(price|pricing|cost|rates?|from \$)\b/i],
  ['review', /[“"].{30,}[”"]|\b(review|testimonial|stars?|recommend|customers? say)\b/i],
  ['faq', /\?\s*$/],
  ['service', /\b(service|repair|install|clean|we (do|offer|provide|fix)|menu|treatment|package)/i],
];
const kindOf = (heading, text) => { const t = `${heading} ${text}`; const hit = KIND_RE.find(([, re]) => re.test(t)); return hit ? hit[0] : 'about'; };
/** Split a page into 200–500 character passages grouped under their heading, each tagged with a kind. */
export function passages(html, pageUrl) {
  const h = String(html || '').replace(/<!--[\s\S]*?-->/g, ' ').replace(/<(script|style|noscript|svg|template|iframe|nav|header)[\s\S]*?<\/\1>/gi, ' ');
  const blocks = all(h, /<(h[1-4]|p|li|blockquote|address|dt|dd|td|figcaption)[^>]*>([\s\S]*?)<\/\1>/gi).map((m) => ({ tag: m[1].toLowerCase(), text: text(m[2]) })).filter((b) => b.text.length > 2);
  const out = []; let heading = '', buf = '';
  const page = (() => { try { return new URL(pageUrl).pathname || '/'; } catch { return '/'; } })();
  const flush = () => { const t = buf.trim(); if (t.length >= 40) out.push({ text: (heading ? heading + ': ' : '') + t.slice(0, 500), kind: kindOf(heading, t), page }); buf = ''; };
  for (const b of blocks) {
    if (/^h[1-4]$/.test(b.tag)) { flush(); heading = b.text.slice(0, 80); if (/\?$/.test(heading)) buf = ''; continue; }
    if ((buf + ' ' + b.text).length > 480) flush();
    buf += (buf ? ' ' : '') + b.text;
  }
  flush();
  const seen = new Set();
  return out.filter((p) => { const k = p.text.toLowerCase().slice(0, 120); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 40);
}
const NAV_PRIORITY = [/servic|menu|what-we-do|treatment|offer/i, /about|story|who-we/i, /contact|visit|location|find-us/i, /review|testimonial/i, /pric|rates|cost/i, /faq|questions/i];
/** Up to n same-site pages from the nav, chosen by what usually holds the facts (services, about, contact…). */
export function pickPages(html, base, n = 3) {
  const nav = (String(html).match(/<nav[\s\S]*?<\/nav>/gi) || []).join(' ') || String(html).slice(0, 60000);
  const links = all(nav, /<a[^>]+href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi).map((m) => { try { const u = new URL(m[1], base); return u.hostname === base.hostname && /^https?:$/.test(u.protocol) && !/\.(pdf|jpe?g|png|zip)$/i.test(u.pathname) && u.pathname !== base.pathname ? { u, label: text(m[2]) } : null; } catch { return null; } }).filter(Boolean);
  const picked = []; const seen = new Set([base.pathname.replace(/\/$/, '')]);
  for (const re of NAV_PRIORITY) {
    const hit = links.find((l) => (re.test(l.u.pathname) || re.test(l.label)) && !seen.has(l.u.pathname.replace(/\/$/, '')));
    if (hit) { seen.add(hit.u.pathname.replace(/\/$/, '')); picked.push(hit.u); }
    if (picked.length >= n) break;
  }
  return picked;
}
const mergeLists = (a, b, n) => [...new Set([...(a || []), ...(b || [])])].slice(0, n);

export const CRAWL = { budgetMs: 8000, pages: 3 };
/**
 * Read the home page plus up to 3 nav pages (in parallel, 8 s in total), merge their facts, and split everything
 * into passages. opts.lookup is for tests only. tr records crawl spans for the latency waterfall.
 */
export async function scrape(input, opts = {}) {
  const tr = opts.tr; const t0 = Date.now();
  const u = input instanceof URL && opts.lookup ? input : toUrl(input); // a URL object only in tests (local fixture port)
  if (!u) throw Object.assign(new Error('That doesn\'t look like a public web address.'), { status: 400 });
  const endHome = tr && tr.start('crawl.page', { page: u.pathname || '/' });
  const page = await fetchPage(u, { lookup: opts.lookup });
  if (endHome) endHome({ bytes: page.body.length });
  // up to two same-site stylesheets (brand colour) and three nav pages, all in parallel within the remaining budget
  const left = () => Math.max(1500, CRAWL.budgetMs - (Date.now() - t0));
  const links = all(page.body, /<link[^>]+rel=["']?stylesheet["']?[^>]*>/gi).map((m) => (m[0].match(/href=["']([^"']+)["']/i) || [])[1]).filter(Boolean)
    .map((href) => { try { return new URL(href, page.url); } catch { return null; } }).filter((x) => x && x.hostname === page.url.hostname).slice(0, 2);
  const inner = (opts.pages ?? CRAWL.pages) > 0 ? pickPages(page.body, page.url, opts.pages ?? CRAWL.pages) : [];
  const [cssParts, innerPages] = await Promise.all([
    Promise.all(links.map((l) => fetchPage(l, { html: false, maxBytes: LIMITS.cssBytes, timeoutMs: Math.min(4000, left()), accept: 'text/css', lookup: opts.lookup }).then((r) => r.body).catch(() => ''))),
    Promise.all(inner.map((iu) => { const end = tr && tr.start('crawl.page', { page: iu.pathname }); return fetchPage(iu, { timeoutMs: Math.min(5000, left()), lookup: opts.lookup }).then((r) => { if (end) end({ bytes: r.body.length }); return r; }, (e) => { if (end) end({ error: String(e.message).slice(0, 60) }); return null; }); })),
  ]);
  const summary = extract(page.body, page.url, cssParts.join('\n'));
  const pageList = [{ url: page.url.href, title: summary.title }];
  let pass = passages(page.body, page.url);
  innerPages.filter(Boolean).forEach((p) => {
    const e = extract(p.body, p.url);
    pageList.push({ url: p.url.href, title: e.title });
    summary.items = mergeLists(summary.items, e.items, 16); summary.quotes = mergeLists(summary.quotes, e.quotes, 4); summary.prices = mergeLists(summary.prices, e.prices, 8); summary.hours = mergeLists(summary.hours, e.hours, 4);
    summary.headings = mergeLists(summary.headings, e.headings, 14);
    ['phone', 'email', 'address'].forEach((k) => { if (!summary.contact[k] && e.contact[k]) summary.contact[k] = e.contact[k]; });
    pass = pass.concat(passages(p.body, p.url));
  });
  summary.pages = pageList;
  return { summary, passages: pass.slice(0, 60) };
}

export default async function handler(req, res) {
  if (guard(req, res, { methods: ['GET'], bucket: 'scrape' })) return;
  const tr = trace();
  const q = (req.query && req.query.url) || new URL(req.url, 'http://x').searchParams.get('url');
  try {
    const u = toUrl(q);
    if (!u) throw Object.assign(new Error('That doesn\'t look like a public web address.'), { status: 400 });
    const host = u.hostname;
    // a site read in the last 24 hours: reuse its index and summary, skip the crawl
    const known = await knowledge.lookup(host, tr).catch(() => null);
    if (known && known.fresh) {
      const summary = await knowledge.cachedSummary(known.name);
      if (summary) { res.setHeader('cache-control', 'no-store'); return res.status(200).json({ ...summary, index: { name: known.name, cached: true, ready: known.info.status === 'Ready', status: known.info.status }, timing: tr.spans, serverMs: tr.now() }); }
    }
    const { summary, passages: pass } = await scrape(q, { tr });
    let index = null;
    try { index = await knowledge.build(host, pass, summary, tr); } catch (e) { tr.add('index.error', tr.now(), tr.now(), { error: String(e.message).slice(0, 120) }); }
    res.setHeader('cache-control', 'no-store');
    return res.status(200).json({ ...summary, passages: pass, index: index ? { name: index.name, cached: false, ready: index.ready, passages: index.passages } : null, timing: tr.spans, serverMs: tr.now() });
  } catch (e) {
    return res.status(e.status && e.status >= 400 && e.status < 600 ? e.status : 502).json({ error: e.code === 'EBLOCKED' ? 'That address is not public.' : (e.message || 'Could not read that site.'), timing: tr.spans });
  }
}
