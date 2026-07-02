// Single dynamic handler for all public /api/v1/* read endpoints.
// Reads from GitHub-backed Blob if available; falls back to embedded seed data.
// Also hosts the one PUBLIC WRITE path: POST /api/v1/subscribe (newsletter capture),
// kept here so no extra serverless function is needed (Vercel Hobby 12-function cap).
const { readSection, writeSection, corsJSON } = require('../cms/_lib');
const seeds = require('../cms/_seeds');

// POST /api/v1/subscribe { email, lang } -> appends to content/subscribers.json
// (mode-agnostic via writeSection: local disk self-hosted, GitHub on Vercel). Public,
// unauthenticated (correct for a signup) with a honeypot; captures only — sends no email.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
async function handleSubscribe(req, res) {
  corsJSON(res); // application/json + Cache-Control: no-store
  if (req.method !== 'POST') { res.status(405).json({ error: 'method not allowed' }); return; }
  const body = (req.body && typeof req.body === 'object') ? req.body : {};
  if (body.company) { res.json({ ok: true }); return; } // honeypot filled -> silently drop (bot)
  const email = (body.email || '').toString().trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) { res.status(400).json({ error: 'invalid email' }); return; }
  let list = await readSection('subscribers');
  if (!Array.isArray(list)) list = [];
  if (!list.some((s) => (s && s.email || '').toString().toLowerCase() === email)) {
    list.push({ email, lang: (body.lang || '').toString().slice(0, 5), at: new Date().toISOString() });
    await writeSection('subscribers', list);
  }
  res.json({ ok: true }); // idempotent: re-subscribing is a silent success
}

// POST /api/v1/contact { name, email, message, lang } -> appends to content/contact-messages.json
// (mode-agnostic via writeSection). Public + honeypot-guarded; captures the enquiry only (sends no mail).
async function handleContact(req, res) {
  corsJSON(res);
  if (req.method !== 'POST') { res.status(405).json({ error: 'method not allowed' }); return; }
  const body = (req.body && typeof req.body === 'object') ? req.body : {};
  if (body.company) { res.json({ ok: true }); return; } // honeypot filled -> silently drop (bot)
  const name = (body.name || '').toString().trim().slice(0, 120);
  const email = (body.email || '').toString().trim().toLowerCase();
  const message = (body.message || '').toString().trim().slice(0, 4000);
  if (!name || !EMAIL_RE.test(email) || email.length > 254 || message.length < 2) {
    res.status(400).json({ error: 'invalid input' }); return;
  }
  let list = await readSection('contact-messages');
  if (!Array.isArray(list)) list = [];
  list.push({ name, email, message, lang: (body.lang || '').toString().slice(0, 5), at: new Date().toISOString() });
  await writeSection('contact-messages', list);
  res.json({ ok: true });
}

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
  if (name === 'subscribe') return handleSubscribe(req, res);
  if (name === 'contact') return handleContact(req, res);
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
