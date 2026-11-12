// Moss Builder server: the page plus the api/ handlers, as one long-running Node process (no Vercel needed).
// Run: npm start   (reads .env if present; PORT defaults to 3000)
//
// Why one long-lived process: it keeps the HTTPS connection to Moss open between turns (about 60 ms saved per turn),
// keeps the router's model and index in memory, and the page's warm-up ping keeps Moss's prompt cache primed
// (about 290 ms saved on the first edit). Scale-to-zero hosting loses all three.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Agent, EnvHttpProxyAgent, setGlobalDispatcher } from 'undici';

const ROOT = path.dirname(fileURLToPath(import.meta.url));

// .env (KEY=value lines), without overriding variables that are already set
if (existsSync(path.join(ROOT, '.env'))) {
  for (const line of readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

// Long keep-alive for every outgoing fetch (Node's default drops idle connections after 4 s). Honour HTTPS_PROXY if set.
const keep = { keepAliveTimeout: 60_000, keepAliveMaxTimeout: 600_000, connections: 32 };
setGlobalDispatcher(process.env.HTTPS_PROXY || process.env.https_proxy ? new EnvHttpProxyAgent(keep) : new Agent(keep));

// MOSS_DEBUG=connections logs every new outgoing connection (each one costs a TCP + TLS handshake)
if (process.env.MOSS_DEBUG === 'connections') {
  const dc = await import('node:diagnostics_channel');
  dc.subscribe('undici:client:connected', ({ connectParams }) => console.log(`${new Date().toISOString().slice(11, 23)} new connection to ${connectParams.host}`));
}

const API = ['agent', 'scrape', 'speak', 'voice-token', 'router-eval'];
const handlers = {};
for (const name of API) handlers[name] = (await import(pathToFileURL(path.join(ROOT, 'api', `${name}.js`)).href)).default;

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.gif': 'image/gif', '.ico': 'image/x-icon', '.md': 'text/markdown; charset=utf-8' };
const PUBLIC = /^\/(moss-builder\.html|site\/|fonts\/|replays\/|screenshots\/)/; // only these are served; never .env, api/ source or data/

/** The small part of Vercel's request/response helpers the handlers use. */
function adapt(req, res, url, body) {
  req.query = Object.fromEntries(url.searchParams);
  const type = req.headers['content-type'] || '';
  req.body = /json/.test(type) && body.length ? (() => { try { return JSON.parse(body); } catch { return body.toString(); } })() : body.length ? body.toString() : undefined;
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => { if (!res.getHeader('content-type')) res.setHeader('content-type', 'application/json; charset=utf-8'); res.end(JSON.stringify(obj)); return res; };
  res.send = (data) => { if (typeof data === 'object' && !Buffer.isBuffer(data)) return res.json(data); res.end(data); return res; };
}

const readBody = (req) => new Promise((resolve, reject) => {
  const chunks = []; let size = 0;
  req.on('data', (c) => { size += c.length; if (size > 1_000_000) { reject(Object.assign(new Error('body too large'), { status: 413 })); req.destroy(); } else chunks.push(c); });
  req.on('end', () => resolve(Buffer.concat(chunks))); req.on('error', reject);
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://local');
  try {
    const api = url.pathname.match(/^\/api\/([\w-]+)$/);
    if (api) {
      const handler = handlers[api[1]];
      if (!handler) { res.statusCode = 404; return res.end('not found'); }
      adapt(req, res, url, await readBody(req));
      if (!/^\/api\/(scrape|speak)$/.test(url.pathname)) res.setHeader('cache-control', 'no-store');
      return await handler(req, res);
    }
    const file = url.pathname === '/' ? '/moss-builder.html' : decodeURIComponent(url.pathname);
    if (!PUBLIC.test(file) || file.includes('..')) { res.statusCode = 404; return res.end('not found'); }
    const full = path.join(ROOT, file);
    if (!(await stat(full).catch(() => null))?.isFile()) { res.statusCode = 404; return res.end('not found'); }
    res.setHeader('content-type', TYPES[path.extname(full)] || 'application/octet-stream');
    res.setHeader('cache-control', /\/(fonts|site)\//.test(file) ? 'public, max-age=3600' : 'no-cache');
    res.end(await readFile(full));
  } catch (err) {
    if (!res.headersSent) { res.statusCode = err.status || 500; res.setHeader('content-type', 'application/json'); }
    res.end(JSON.stringify({ error: err.message || 'server error' }));
  }
});

server.keepAliveTimeout = 65_000; // outlive typical load-balancer idle timeouts, so browser connections are reused too
const port = Number(process.env.PORT || 3000);
server.listen(port, () => {
  const ready = process.env.MOSS_PROJECT_ID && process.env.MOSS_PROJECT_KEY;
  console.log(`Moss Builder on http://localhost:${port}${ready ? '' : '  (no Moss keys: the offline demo agent answers; see .env.example)'}`);
});
