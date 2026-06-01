// Single dynamic handler for all public /api/v1/* read endpoints.
// Reads from GitHub-backed Blob if available; falls back to embedded seed data.
const { readSection, corsJSON } = require('../cms/_lib');
const seeds = require('../cms/_seeds');

const SECTIONS = {
  posts:      { editable: true,  envelope: false },
  partners:   { editable: true,  envelope: false },
  constants:  { editable: true,  envelope: false },
  services:   { editable: true,  envelope: true  }, // wrap as {data}
  'site-info':{ editable: true,  envelope: true, seedKey: 'siteInfo' },
  tags:       { editable: false, envelope: false, seedKey: 'tags' },
  pages:      { editable: false, envelope: false, seedKey: 'pages' },
  slides:     { editable: false, envelope: false, seedKey: 'slides' },
};

module.exports = async (req, res) => {
  const name = (req.query.section || '').toString();
  const meta = SECTIONS[name];
  if (!meta) { res.status(404).json({ error: 'unknown section' }); return; }
  corsJSON(res);
  res.setHeader('Cache-Control', 'public, max-age=10, s-maxage=30, stale-while-revalidate=60');
  const seedKey = meta.seedKey || name;
  let data = null;
  if (meta.editable) data = await readSection(seedKey);
  if (data == null) data = seeds[seedKey];
  if (meta.envelope) res.json({ data });
  else res.json(data);
};
