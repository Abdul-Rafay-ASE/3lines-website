// Production server for self-hosting the 3lines site without Vercel.
// Reproduces the vercel.json behaviors and mounts the Vercel-style (req,res)
// handlers under api/ on a plain Express app.
//
//   - redirect  /            -> /en              (302, like vercel.json redirects)
//   - cleanUrls  /en         -> en.html, /en/about -> en/about.html, etc.
//   - rewrite   /cms-assets/* -> api/cms-asset (path passed as ?path=)
//   - header    Access-Control-Allow-Origin: *  on /api/v1/*
//   - static    /build, /assets, /cms, ... served from disk
//
// Storage stays in LOCAL_MODE (see api/cms/_lib.js) as long as GITHUB_TOKEN /
// GH_REPO are unset, so all CMS edits + uploads persist to ./content on disk.

const express = require('express');
const fs = require('fs');
const nodePath = require('path');

const REPO_ROOT = __dirname;

/* ---------- load .env.local FIRST (vercel dev does this automatically) ---------- */
// Must run before we read PORT/HOST/secrets so the file's values take effect.
(function loadEnv() {
  try {
    const raw = fs.readFileSync(nodePath.join(REPO_ROOT, '.env.local'), 'utf-8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;                       // skip blanks / comments
      const key = m[1];
      if (key in process.env) continue;       // real env wins over the file
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
      process.env[key] = val;
    }
  } catch { /* no .env.local — rely on the real environment */ }
})();

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '127.0.0.1';

const { LOCAL_MODE } = require('./api/cms/_lib');

const app = express();
app.disable('x-powered-by');
// gzip every response — the build JS/CSS (e.g. the ~2.4MB hero globe) ships uncompressed
// otherwise; gzip cuts it ~3-4x for a much faster first load.
try { const compression = require('compression'); app.use(compression()); } catch (e) { /* optional dep */ }
app.use(express.json({ limit: '12mb' })); // CMS uploads are base64 data URLs (<= ~11MB)

// Wrap a Vercel-style async handler so a thrown error becomes a clean 500.
const h = (fn) => (req, res) =>
  Promise.resolve(fn(req, res)).catch((e) => {
    if (!res.headersSent) res.status(500).json({ error: String((e && e.message) || e) });
  });

/* ---------- API routes (must come before static) ---------- */
// CORS header on the public read API, matching vercel.json.
app.use('/api/v1', (req, res, next) => { res.setHeader('Access-Control-Allow-Origin', '*'); next(); });

const sectionHandler = require('./api/v1/[section].js');
app.all('/api/v1/:section', (req, res) => { req.query.section = req.params.section; return h(sectionHandler)(req, res); });

app.all('/api/cms/login',  h(require('./api/cms/login.js')));
app.all('/api/cms/logout', h(require('./api/cms/logout.js')));
app.all('/api/cms/content', h(require('./api/cms/content.js')));
app.all('/api/cms/upload', h(require('./api/cms/upload.js')));

// /cms-assets/<file> -> api/cms-asset (vercel.json rewrite). Filenames are flat.
const assetHandler = require('./api/cms-asset.js');
app.get('/cms-assets/*', (req, res) => { req.query.path = req.params[0]; return h(assetHandler)(req, res); });
app.all('/api/cms-asset', h(assetHandler));

/* ---------- redirect / health ---------- */
app.get('/', (req, res) => res.redirect(302, '/en'));
app.get('/healthz', (req, res) => res.json({ ok: true, localMode: LOCAL_MODE }));

/* ---------- trailing slash -> no slash (reproduces vercel.json trailingSlash:false) ----------
   The React header builds some links with a trailing slash (e.g. the Home/logo link ->
   "/en/"), which otherwise falls through to a 404. Strip it so "/en/" -> "/en". */
app.use((req, res, next) => {
  if ((req.method === 'GET' || req.method === 'HEAD') && req.path.length > 1 && req.path.endsWith('/')) {
    // Exception: a real directory that has its own index.html (e.g. /cms/) is a
    // directory-index route served by express.static below. Stripping its slash
    // would fight static's own "add slash to serve index" redirect, producing an
    // infinite 308<->301 loop. Leave those alone; only strip page routes
    // (e.g. /en/ -> /en -> en.html, where the en/ folder has no index.html).
    let dirAbs = null;
    try { dirAbs = nodePath.normalize(nodePath.join(REPO_ROOT, decodeURIComponent(req.path))); } catch { /* bad encoding -> treat as non-dir, strip below */ }
    const isIndexedDir = dirAbs &&
      (dirAbs === REPO_ROOT || dirAbs.startsWith(REPO_ROOT + nodePath.sep)) &&
      fs.existsSync(nodePath.join(dirAbs, 'index.html'));
    if (!isIndexedDir) {
      const qs = req.originalUrl.slice(req.path.length); // preserve ?query
      return res.redirect(308, req.path.replace(/\/+$/, '') + qs);
    }
  }
  next();
});

/* ---------- block sensitive paths from ever being served statically ---------- */
const BLOCKED = [/^\/api(\/|$)/, /^\/content(\/|$)/, /^\/node_modules(\/|$)/,
                 /^\/server\.js$/, /^\/package(-lock)?\.json$/, /^\/vercel\.json$/];
app.use((req, res, next) => {
  let p;
  try { p = decodeURIComponent(req.path); } catch { return res.status(400).end(); }
  if (p.includes('\0')) return res.status(400).end();
  // dotfiles / dotdirs: .git, .env.local, .gitignore, ...
  if (p.split('/').some((seg) => seg.length > 1 && seg[0] === '.')) return res.status(404).end();
  if (BLOCKED.some((re) => re.test(p))) return res.status(404).end();
  next();
});

/* ---------- cleanUrls: serve <path>.html (handles /en, /en/about, /ar, ...) ---------- */
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  let p;
  try { p = decodeURIComponent(req.path); } catch { return next(); }
  if (nodePath.extname(p)) return next(); // real asset (.js/.css/.png) -> static
  const abs = nodePath.normalize(nodePath.join(REPO_ROOT, p + '.html'));
  if (abs !== REPO_ROOT && !abs.startsWith(REPO_ROOT + nodePath.sep)) return next();
  if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return res.sendFile(abs);
  next();
});

/* ---------- static assets (build, assets, cms UI, favicons, ...) ---------- */
app.use(express.static(REPO_ROOT, {
  dotfiles: 'ignore', index: 'index.html', redirect: true,
  setHeaders: (res, filePath) => {
    // /build/assets/* filenames carry a content hash -> they are immutable; cache hard so
    // repeat visits never re-download the heavy JS/CSS (incl. the 2.4MB globe).
    if (/[\\/]build[\\/]assets[\\/]/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (/\.(?:png|jpe?g|svg|webp|gif|ico|woff2?|ttf|otf)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=604800'); // images/fonts: 1 week
    } else if (/\.(?:css|js)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'no-cache'); // unhashed css/js (enhance.js, light-theme): revalidate every load so edits show on the next reload (no stale cache)
    }
  },
}));

/* ---------- New service detail pages: these ship via the API (content/services.json) but aren't
   prerendered into their own .html yet. Serve the same-language spare-parts page as a shell; the
   detail-page runtime in assets/enhance.js rewrites the title/description from the API by slug. ---------- */
const NEW_SERVICE_SLUGS = ['procurement', 'engineering', 'ai-solutions', 'cybersecurity'];
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const m = req.path.match(/^\/(en|ar|ja|ko)\/services\/([a-z0-9-]+)\.html$/);
  if (m && NEW_SERVICE_SLUGS.indexOf(m[2]) !== -1) {
    let tpl = nodePath.join(REPO_ROOT, m[1], 'services', 'provide-spare-parts.html');
    if (!fs.existsSync(tpl)) tpl = nodePath.join(REPO_ROOT, 'en', 'services', 'provide-spare-parts.html');
    if (fs.existsSync(tpl)) return res.sendFile(tpl);
  }
  next();
});

/* ---------- KO/JP fallback: pages not yet translated serve their English
   equivalent instead of 404 (existing ko/ja .html files are served above first). ---------- */
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const m = req.path.match(/^\/(ko|ja)(\/.*)?$/);
  if (m) return res.redirect(302, '/en' + (m[2] || ''));
  next();
});

/* ---------- 404 ---------- */
app.use((req, res) => res.status(404).send('Not found'));

app.listen(PORT, HOST, () => {
  console.log(`3lines site listening on http://${HOST}:${PORT}  (storage: ${LOCAL_MODE ? 'LOCAL_MODE -> ./content' : 'GitHub'})`);
});
