// Shared helpers: HMAC-signed cookie auth + Vercel Blob storage.
const crypto = require('crypto');
const { list, put, del } = require('@vercel/blob');

const SECRET = process.env.SESSION_SECRET || 'insecure-change-me';
const PASSWORD = process.env.CMS_PASSWORD || '';
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

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

// Single-blob-per-section storage. addRandomSuffix:false keeps the URL pathname stable.
async function readSection(name) {
  if (!TOKEN) return null;
  try {
    const { blobs } = await list({ prefix: `content/${name}.json`, token: TOKEN });
    const b = blobs.find(x => x.pathname === `content/${name}.json`);
    if (!b) return null;
    const r = await fetch(b.url, { cache: 'no-store' });
    if (!r.ok) return null;
    return await r.json();
  } catch (e) { return null; }
}
async function writeSection(name, data) {
  if (!TOKEN) throw new Error('No blob token');
  await put(`content/${name}.json`, JSON.stringify(data, null, 2), {
    access: 'public',
    contentType: 'application/json; charset=utf-8',
    allowOverwrite: true,
    addRandomSuffix: false,
    token: TOKEN,
  });
}
async function uploadFile(filename, buffer, contentType) {
  if (!TOKEN) throw new Error('No blob token');
  const r = await put(`uploads/${filename}`, buffer, {
    access: 'public',
    contentType: contentType || 'application/octet-stream',
    addRandomSuffix: true,
    token: TOKEN,
  });
  return r.url;
}

function corsJSON(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
}

module.exports = {
  sign, verify, getSession, requireAuth, sessionCookie,
  readSection, writeSection, uploadFile, corsJSON,
  PASSWORD,
};
