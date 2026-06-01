// Public image proxy for files stored in the private repo at content/uploads/*.
// URL format: /cms-assets/<filename>  (rewritten via vercel.json to /api/cms-asset?path=<filename>)
const { ghGetRaw } = require('./cms/_lib');

const TYPES = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
  svg: 'image/svg+xml', gif: 'image/gif', ico: 'image/x-icon', avif: 'image/avif',
};

module.exports = async (req, res) => {
  const p = (req.query.path || '').toString();
  if (!p || p.includes('..') || p.startsWith('/')) {
    res.status(400).send('bad path'); return;
  }
  try {
    const buf = await ghGetRaw(`content/uploads/${p}`);
    if (!buf) { res.status(404).send('not found'); return; }
    const ext = (p.split('.').pop() || '').toLowerCase();
    res.setHeader('Content-Type', TYPES[ext] || 'application/octet-stream');
    // Uploaded filenames include a random suffix so they're effectively immutable
    res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
    res.status(200).send(buf);
  } catch (e) {
    res.status(500).send('proxy error: ' + (e.message || e));
  }
};
