// POST /api/cms/upload  body: { name, dataUrl }   ->  { url }
// Accepts base64 data URLs (e.g. "data:image/png;base64,...") for simplicity (no multipart).
const { requireAuth, uploadFile } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  if (!requireAuth(req, res)) return;
  const { name, dataUrl } = req.body || {};
  if (!dataUrl || typeof dataUrl !== 'string') return res.status(400).json({ error: 'dataUrl required' });
  const m = dataUrl.match(/^data:([^;,]+)(?:;base64)?,(.+)$/);
  if (!m) return res.status(400).json({ error: 'Invalid data URL' });
  const contentType = m[1];
  const isB64 = /;base64,/.test(dataUrl);
  const buffer = isB64 ? Buffer.from(m[2], 'base64') : Buffer.from(decodeURIComponent(m[2]), 'utf8');
  if (buffer.length > 8 * 1024 * 1024) return res.status(413).json({ error: 'File too large (max 8MB)' });
  const safeName = (name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  try {
    const url = await uploadFile(safeName, buffer, contentType);
    res.json({ ok: true, url, contentType, size: buffer.length });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
};
