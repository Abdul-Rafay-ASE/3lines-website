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

  // ---- List endpoints: honor ?filter[tags], ?page, ?per_page so the News tag filters and
  //      the Pages Index "Next" button actually work (the client reads meta.last_page). ----
  if (name === 'posts' || name === 'pages') {
    let items = Array.isArray(data) ? data.slice()
      : (data && Array.isArray(data.data) ? data.data.slice() : []);

    // tag filter (posts only): ?filter[tags]=slug1,slug2  -> posts having ANY of those tags
    if (name === 'posts') {
      const f = (req.query.filter && req.query.filter.tags) || req.query['filter[tags]'] || '';
      const wanted = f.toString().split(',').map(s => s.trim()).filter(Boolean);
      if (wanted.length) {
        items = items.filter(p => Array.isArray(p.tags) && p.tags.some(t => t && wanted.indexOf(t.slug) !== -1));
      }
    }

    const total = items.length;
    let perPage = parseInt(req.query.per_page, 10);
    if (!perPage || perPage < 1) perPage = total || 1;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    let page = parseInt(req.query.page, 10) || 1;
    if (page < 1) page = 1;
    if (page > lastPage) page = lastPage;
    const start = (page - 1) * perPage;
    const paged = items.slice(start, start + perPage);
    res.json({
      data: paged,
      meta: { current_page: page, last_page: lastPage, per_page: perPage, total, from: total ? start + 1 : 0, to: start + paged.length },
    });
    return;
  }

  if (meta.envelope) res.json({ data });
  else res.json(data);
};
