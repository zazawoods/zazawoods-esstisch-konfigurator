// Zaza Woods configurator server:
//  - serves the static site (index.html, ar-generator.html, *.glb)
//  - accepts AR model uploads and serves them back at a real https URL,
//    so Android Scene Viewer / iOS Quick Look can fetch them for native AR.
const express = require('express');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------- Baseline security headers ----------------
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
  // Restrict who can embed us in an iframe (clickjacking defence). We still
  // allow our own railway.app origin so the standalone URL works.
  res.setHeader('Content-Security-Policy',
    "frame-ancestors 'self' https://zazawoods.de https://*.zazawoods.de https://*.myshopify.com");
  next();
});

// ---------------- AR upload store (in-memory, capped) ----------------
const store = new Map(); // file -> { buf, type, exp }
const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const MAX_TOTAL_BYTES = 400 * 1024 * 1024;  // 400 MB total cap
const MAX_ITEMS = 200;
let storeBytes = 0;

function evictOldest(targetBytes) {
  // Evict oldest entries until we're under budget OR within count cap.
  for (const [k, v] of store) {
    if (storeBytes <= targetBytes && store.size <= MAX_ITEMS) break;
    storeBytes -= v.buf.length;
    store.delete(k);
  }
}

// ---------------- Rate limiting (very simple, in-memory) ----------------
const rateBuckets = new Map();  // ip -> { count, resetAt }
function rateLimit(ip, limit, windowMs) {
  const now = Date.now();
  let b = rateBuckets.get(ip);
  if (!b || b.resetAt < now) { b = { count: 0, resetAt: now + windowMs }; rateBuckets.set(ip, b); }
  b.count++;
  return b.count <= limit;
}

// Lazy cleanup of stale rate buckets
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateBuckets) if (v.resetAt < now) rateBuckets.delete(k);
}, 5 * 60 * 1000);

// ---------------- CORS (loose for AR endpoints only) ----------------
function arCors(req, res) {
  // Allow native AR apps and our own site to fetch. We don't expose any
  // credentialed APIs, so a wide-open CORS here is acceptable.
  res.setHeader('Access-Control-Allow-Origin', '*');
}

// ---- AR upload: POST raw binary, get back a fetchable URL ----
app.post('/ar-upload/:ext', express.raw({ type: '*/*', limit: '60mb' }), (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '0';
  if (!rateLimit(ip, 30, 60 * 1000)) return res.status(429).json({ error: 'rate' });

  const ext = req.params.ext === 'usdz' ? 'usdz' : 'glb';
  if (!req.body || !req.body.length) return res.status(400).json({ error: 'empty' });

  const id = crypto.randomUUID();
  const file = id + '.' + ext;
  const type = ext === 'usdz' ? 'model/vnd.usdz+zip' : 'model/gltf-binary';

  storeBytes += req.body.length;
  store.set(file, { buf: req.body, type, exp: Date.now() + TTL_MS });
  // Make room if we're over budget.
  evictOldest(MAX_TOTAL_BYTES);

  arCors(req, res);
  res.json({ url: '/ar/' + file });
});

// ---- AR fetch: native AR apps download the model from here ----
app.get('/ar/:file', (req, res) => {
  // Strict filename validation: <uuid>.glb|usdz
  if (!/^[a-f0-9-]{36}\.(glb|usdz)$/i.test(req.params.file)) return res.status(400).send('bad name');
  const item = store.get(req.params.file);
  if (!item) return res.status(404).send('not found');
  arCors(req, res);
  res.setHeader('Content-Type', item.type);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(item.buf);
});

// Block direct access to internal files BEFORE the static middleware runs.
app.use((req, res, next) => {
  if (/^\/(server\.js|package(-lock)?\.json|serve\.json|\.git|node_modules|nixpacks\.toml|railway\.json)/i.test(req.path)) {
    return res.status(404).send('not found');
  }
  next();
});

// ---- Static site (everything left is public) ----
app.use(express.static(path.join(__dirname), {
  index: 'index.html',
  dotfiles: 'deny',
  setHeaders: (res, p) => { if (p.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache'); }
}));

// Periodic cleanup of expired uploads
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of store) {
    if (v.exp < now) { storeBytes -= v.buf.length; store.delete(k); }
  }
}, 10 * 60 * 1000);

app.listen(PORT, () => console.log('Zaza Woods server on :' + PORT));
