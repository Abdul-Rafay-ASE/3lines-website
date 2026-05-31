// GET  /api/cms/content -> { section: data, ... } merged with seeds for missing sections.
// POST /api/cms/content -> body { section: data, ... } writes each provided section.
const { requireAuth, readSection, writeSection, corsJSON } = require('./_lib');
const seeds = require('./_seeds');

const SECTIONS = Object.keys(seeds);

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;
  corsJSON(res);
  if (req.method === 'GET') {
    const out = {};
    await Promise.all(SECTIONS.map(async k => {
      const v = await readSection(k);
      out[k] = v == null ? seeds[k] : v;
    }));
    return res.json(out);
  }
  if (req.method === 'POST') {
    const body = req.body || {};
    const keys = Object.keys(body).filter(k => SECTIONS.includes(k));
    if (!keys.length) return res.status(400).json({ ok: false, error: 'no valid sections in body' });
    try {
      for (const k of keys) await writeSection(k, body[k]);
      res.json({ ok: true, saved: keys });
    } catch (e) {
      res.status(500).json({ ok: false, error: String(e.message || e) });
    }
    return;
  }
  res.setHeader('Allow', 'GET, POST');
  res.status(405).end();
};
