// Shared helpers: HMAC-signed cookie auth + GitHub Contents API as storage.
const crypto = require('crypto');

const SECRET = process.env.SESSION_SECRET || 'insecure-change-me';
const PASSWORD = process.env.CMS_PASSWORD || '';
const GH_TOKEN = process.env.GITHUB_TOKEN;
const GH_REPO = process.env.GH_REPO; // "owner/repo"
const GH_BRANCH = process.env.GH_BRANCH || 'master';

/* ---------- Auth ---------- */
function sign(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}
function verify(token) {
  if (!token || typeof token !== 'string') return null;
  const i = token.lastIndexOf('.');
  if (i < 1) return null;
  const data = token.slice(0, i), sig = token.slice(i + 1);
  const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  if (expected.length !== sig.length ||
      !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  try {
    const p = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (p.exp && p.exp < Date.now()) return null;
    return p;
  } catch { return null; }
}
function parseCookies(req) {
  const c = req.headers.cookie || '';
  const out = {};
  c.split(';').forEach(kv => {
    const [k, ...rest] = kv.trim().split('=');
    if (k) out[k] = decodeURIComponent(rest.join('='));
  });
  return out;
}
function getSession(req) { return verify(parseCookies(req).cms_session); }
function requireAuth(req, res) {
  const s = getSession(req);
  if (!s) { res.status(401).json({ error: 'unauthorized' }); return null; }
  return s;
}
function sessionCookie(token, maxAge) {
  return `cms_session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${process.env.VERCEL ? '; Secure' : ''}`;
}

/* ---------- GitHub Contents API ---------- */
function ghHeaders() {
  return {
    Authorization: `Bearer ${GH_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': '3lines-cms',
  };
}
async function ghGet(path) {
  if (!GH_TOKEN || !GH_REPO) throw new Error('GitHub env vars missing');
  const url = `https://api.github.com/repos/${GH_REPO}/contents/${encodeURI(path)}?ref=${encodeURIComponent(GH_BRANCH)}`;
  const r = await fetch(url, { headers: ghHeaders() });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GitHub GET ${path}: ${r.status} ${await r.text()}`);
  return await r.json(); // { content (base64), sha, ... }
}
async function ghPut(path, contentBuffer, message) {
  if (!GH_TOKEN || !GH_REPO) throw new Error('GitHub env vars missing');
  const existing = await ghGet(path);
  const body = {
    message: message || `CMS: update ${path}`,
    content: contentBuffer.toString('base64'),
    branch: GH_BRANCH,
  };
  if (existing && existing.sha) body.sha = existing.sha;
  const url = `https://api.github.com/repos/${GH_REPO}/contents/${encodeURI(path)}`;
  const r = await fetch(url, { method: 'PUT', headers: { ...ghHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`GitHub PUT ${path}: ${r.status} ${await r.text()}`);
  return await r.json();
}
async function ghGetRaw(path) {
  const meta = await ghGet(path);
  if (!meta) return null;
  return Buffer.from((meta.content || '').replace(/\n/g, ''), 'base64');
}

/* ---------- Section read/write (matches the previous signature) ---------- */
async function readSection(name) {
  try {
    const buf = await ghGetRaw(`content/${name}.json`);
    if (!buf) return null;
    return JSON.parse(buf.toString('utf-8'));
  } catch (e) { return null; }
}
async function writeSection(name, data) {
  const buf = Buffer.from(JSON.stringify(data, null, 2), 'utf-8');
  await ghPut(`content/${name}.json`, buf, `CMS: update ${name}`);
}

/* ---------- Image uploads (committed to repo, served via /cms-assets/* proxy) ---------- */
async function uploadFile(filename, buffer, contentType) {
  // safe filename + random suffix for uniqueness/cache-busting
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60).replace(/^\.+/, '');
  const ext = (safe.match(/\.[a-zA-Z0-9]{1,8}$/) || [''])[0];
  const stem = ext ? safe.slice(0, -ext.length) : safe;
  const rnd = crypto.randomBytes(5).toString('hex');
  const finalName = `${stem || 'file'}-${rnd}${ext}`;
  await ghPut(`content/uploads/${finalName}`, buffer, `CMS: upload ${finalName}`);
  return { name: finalName, path: `cms-assets/${finalName}`, contentType };
}

function corsJSON(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
}

module.exports = {
  sign, verify, getSession, requireAuth, sessionCookie,
  readSection, writeSection, uploadFile, corsJSON,
  ghGetRaw, ghGet,
  PASSWORD,
};
