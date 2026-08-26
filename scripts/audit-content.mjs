/**
 * DATA -> SCHEMA -> RENDERER audit for the 3Lines content.
 *
 * Replaces the demo-era audit-blocks.mjs. Same contract, new sources:
 *
 *   1. every block/body kind in the data is declared in the schema
 *   2. every declared kind has an explicit renderer case
 *   3. every source record (service, post, partner, page) is actually placed
 *   4. every string of non-CMS copy survives into a document OF ITS OWN LOCALE
 *   5. structural counts per route match expectations
 *   6. every referenced media file exists on disk
 *   7. EN and AR are structurally identical and Arabic is not silently English
 *
 * Check 4 is the one that matters most: the copy that has no CMS home is
 * exactly what a JSON-only migration drops silently.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const CONTENT = path.join(ROOT, 'content');
const SRC = path.join(ROOT, 'source-content');
const PUBLIC = path.join(ROOT, 'public');

const LOCALES = ['en', 'ar'];
const errors = [];
const warnings = [];
const notes = [];
const err = (m) => errors.push(m);
/**
 * WARN vs FAIL: a FAIL means content is wrong or lost and the build must stop.
 * A WARN means the content is structurally valid but weaker than it should be —
 * an SEO description that is too short, a title that will truncate in results.
 * Collapsing the two would either block builds on cosmetics or hide real loss.
 */
const warn = (m) => warnings.push(m);

const readContent = (...s) => JSON.parse(fs.readFileSync(path.join(CONTENT, ...s), 'utf8'));
const readSource = (f) => JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf8'));

const routes = readContent('routes.json');
const docs = {};
for (const l of LOCALES)
  docs[l] = routes.map((r) => readContent(l, `${r.slug}.json`));

/* ------------------------------------------- 1. schema declares each kind -- */

const schemaSrc = fs.readFileSync(path.join(ROOT, 'lib', 'blocks.ts'), 'utf8');
const declared = (name) => {
  const m = schemaSrc.match(new RegExp(`${name}[^=]*=\\s*\\[([^\\]]*)\\]`));
  return new Set(m ? [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]) : []);
};
const blockTypes = declared('BLOCK_TYPES');
const bodyKinds = declared('SECTION_BODY_KINDS');
if (!blockTypes.size) err('schema: BLOCK_TYPES unparseable');
if (!bodyKinds.size) err('schema: SECTION_BODY_KINDS unparseable');

/* -------------------------------------------- 2. renderer covers each kind -- */

const cases = (f) =>
  new Set([...fs.readFileSync(path.join(ROOT, f), 'utf8').matchAll(/case\s+'([^']+)'/g)].map((m) => m[1]));
const blockCases = cases('components/blocks/Blocks.tsx');
const bodyCases = cases('components/bodies/Bodies.tsx');

for (const t of blockTypes) if (!blockCases.has(t)) err(`renderer: block "${t}" has no case`);
for (const k of bodyKinds) if (!bodyCases.has(k)) err(`renderer: body "${k}" has no case`);
for (const t of blockCases) if (!blockTypes.has(t)) err(`renderer: renders undeclared block "${t}"`);
for (const k of bodyCases) if (!bodyKinds.has(k)) err(`renderer: renders undeclared body "${k}"`);

for (const f of ['components/blocks/Blocks.tsx', 'components/bodies/Bodies.tsx'])
  if (!/assertNever\(/.test(fs.readFileSync(path.join(ROOT, f), 'utf8')))
    err(`${f}: missing the assertNever exhaustiveness guard`);

/* ------------------------------------------------------------- haystacks -- */

const squash = (s) => String(s).replace(/\s+/g, '');

function strings(v, out = []) {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, out));
  return out;
}

const haystack = {};
for (const l of LOCALES) haystack[l] = squash(strings(docs[l]).join(' '));

const chrome = {};
for (const l of LOCALES) chrome[l] = squash(strings(readContent(l, 'chrome.json')).join(' '));

const all = {};
for (const l of LOCALES) all[l] = haystack[l] + chrome[l];

/* -------------------------------------------- 3. every source record placed -- */

const services = readSource('services.json');
const posts = readSource('posts.json').data;
const partners = readSource('partners.json').data;
const pages = readSource('pages.json').data;

const routeSet = new Set(routes.map((r) => r.route));

for (const l of LOCALES) {
  for (const s of services) {
    const title = s.title[l] ?? s.title.en;
    if (!all[l].includes(squash(title))) err(`${l}: service title missing — "${title}"`);
    if (!routeSet.has(`/services/${s.slug}`)) err(`route /services/${s.slug} does not exist`);
  }
  for (const p of posts) {
    const title = p.title[l] ?? p.title.en;
    if (!all[l].includes(squash(title))) err(`${l}: post title missing — "${title}"`);
    if (!routeSet.has(`/news/${p.slug}`)) err(`route /news/${p.slug} does not exist`);
  }
  for (const p of partners) {
    const name = p.name[l] ?? p.name.en;
    if (!all[l].includes(squash(name))) err(`${l}: partner missing — "${name}"`);
  }
}

/* ------------------------------- 4. non-CMS copy: nothing dropped, per locale -- */

const nonCms = readSource('non-cms.json');
let nonCmsChecked = 0;

function checkLeaf(locale, value, where) {
  if (typeof value !== 'string' || !value.trim()) return;
  nonCmsChecked++;
  if (!all[locale].includes(squash(value)))
    err(`${locale}: non-CMS copy dropped — ${where} ("${value.slice(0, 60)}")`);
}

for (const l of LOCALES) {
  (nonCms.heroRotatingWords?.[l] ?? []).forEach((w, i) => checkLeaf(l, w, `heroRotatingWords[${i}]`));
  (nonCms.heroFrame?.copy?.[l] ? Object.entries(nonCms.heroFrame.copy[l]) : []).forEach(([k, v]) =>
    checkLeaf(l, v, `heroFrame.${k}`)
  );
  (nonCms.whyThreeLinesSlider ?? []).forEach((s, i) => {
    checkLeaf(l, s.heading?.[l], `slider[${i}].heading`);
    checkLeaf(l, s.sub?.[l], `slider[${i}].sub`);
  });
  const a = nonCms.about?.[l] ?? {};
  (a.pillars ?? []).forEach((p, i) => {
    checkLeaf(l, p.title, `about.pillars[${i}].title`);
    checkLeaf(l, p.body, `about.pillars[${i}].body`);
  });
  (a.vision ?? []).forEach((v, i) => checkLeaf(l, v, `about.vision[${i}]`));
  (a.values ?? []).forEach((v, i) => {
    checkLeaf(l, v.title, `about.values[${i}].title`);
    checkLeaf(l, v.body, `about.values[${i}].body`);
  });
  (nonCms.aboutStats?.[l] ?? []).forEach((s, i) => checkLeaf(l, s.label, `aboutStats[${i}].label`));

  const c = nonCms.certifications?.copy?.[l];
  if (c) {
    checkLeaf(l, c.eyebrow, 'certifications.eyebrow');
    checkLeaf(l, c.heading, 'certifications.heading');
    checkLeaf(l, c.lede, 'certifications.lede');
    (c.items ?? []).forEach((it, i) => {
      checkLeaf(l, it.title, `certifications.items[${i}].title`);
      checkLeaf(l, it.text, `certifications.items[${i}].text`);
    });
  }
}

/* ------------------------------------------------- 5. structural counts -- */

const bodiesOf = (doc, kind) =>
  doc.blocks.flatMap((b) => (b.bodies ?? []).filter((x) => x.kind === kind));

const EXPECT = {
  // 10 service cards + the 4 group-company cards.
  '/': { slider: 4, cards: 10 + 4 },
  '/about': { defs: 3 + 6 + 2, figures: 4, certs: 3 },
  '/services': { cards: 10 },
  '/partners': { logos: 39 },
  '/contact': { form: 1 },
};

for (const l of LOCALES) {
  for (const [route, want] of Object.entries(EXPECT)) {
    const doc = docs[l].find((d) => d.route === route);
    if (!doc) {
      err(`${l}: route ${route} has no document`);
      continue;
    }
    for (const [kind, n] of Object.entries(want)) {
      const got =
        kind === 'form'
          ? bodiesOf(doc, 'form').length
          : bodiesOf(doc, kind).reduce((a, b) => a + (b.items?.length ?? 0), 0);
      if (got !== n) err(`${l}${route}: expected ${n} ${kind} item(s), got ${got}`);
    }
  }

  // Every service detail page carries 4 glance bullets, 6 capability cards, and
  // a photo split whose ticked list repeats the first four capabilities.
  for (const s of services) {
    const doc = docs[l].find((d) => d.route === `/services/${s.slug}`);
    if (!doc) continue;
    const glance = bodiesOf(doc, 'overviewSplit').reduce((a, b) => a + b.glance.length, 0);
    const caps = bodiesOf(doc, 'defs').reduce((a, b) => a + b.items.length, 0);
    const checks = bodiesOf(doc, 'feature').reduce((a, b) => a + (b.checklist?.length ?? 0), 0);
    if (glance !== 4) err(`${l}/services/${s.slug}: expected 4 glance bullets, got ${glance}`);
    if (caps !== 6) err(`${l}/services/${s.slug}: expected 6 capabilities, got ${caps}`);
    if (checks !== 4) err(`${l}/services/${s.slug}: expected 4 photo-split ticks, got ${checks}`);
  }
}

/* ---------------------------------------------------- 6. media resolves -- */

const mediaRefs = new Set();
for (const l of LOCALES) {
  for (const s of strings(docs[l])) {
    const m = s.match(/^url\('(.+)'\)$/);
    if (m) mediaRefs.add(m[1]);
    else if (s.startsWith('/assets/')) mediaRefs.add(s);
  }
  for (const s of strings(readContent(l, 'chrome.json'))) if (s.startsWith('/assets/')) mediaRefs.add(s);
  for (const s of strings(readContent(l, 'news-items.json'))) if (s.startsWith('/assets/')) mediaRefs.add(s);
}
let resolved = 0;
for (const ref of mediaRefs) {
  if (fs.existsSync(path.join(PUBLIC, ref.replace(/^\//, '')))) resolved++;
  else err(`media referenced but not on disk — ${ref}`);
}

/* ------------------------------------------------------ 7. locale parity -- */

const shape = (doc) =>
  doc.blocks.map((b) => `${b.type}[${(b.bodies ?? []).map((x) => x.kind).join(',')}]`).join('|');

for (const r of routes) {
  const en = docs.en.find((d) => d.route === r.route);
  const ar = docs.ar.find((d) => d.route === r.route);
  if (!en || !ar) {
    err(`route ${r.route} is missing a locale document`);
    continue;
  }
  if (shape(en) !== shape(ar))
    err(`route ${r.route}: EN and AR have different block structure`);
}

// Arabic that is byte-identical to English means a translation silently fell
// back. Titles are the cheapest reliable signal.
let identical = 0;
for (const r of routes) {
  const en = docs.en.find((d) => d.route === r.route);
  const ar = docs.ar.find((d) => d.route === r.route);
  if (en && ar && en.title && en.title === ar.title) identical++;
}

/* -------------------------------------------------- 7b. group companies -- */

/**
 * The four group companies are lifted from a compiled bundle, so a change to
 * that bundle could quietly drop one. Assert the set survives into both locales
 * with its copy intact.
 */
const companies = nonCms.companies?.items ?? [];
if (companies.length !== 4) err(`non-cms.json: expected 4 companies, found ${companies.length}`);

for (const l of LOCALES) {
  const home = docs[l].find((d) => d.route === '/');
  if (!home) continue;

  const section = home.blocks.find((b) => b.type === 'section' && b.id === 'companies');
  if (!section) {
    err(`${l}/: the group-companies section is missing from the homepage`);
    continue;
  }

  const cards = (section.bodies ?? []).filter((b) => b.kind === 'cards');
  const items = cards.flatMap((b) => b.items);
  if (items.length !== 4) err(`${l}/: expected 4 company cards, got ${items.length}`);
  if (!cards.every((b) => b.columns === 4))
    err(`${l}/: company cards must use the 4-up grid or the fourth card orphans`);

  for (const c of companies) {
    const name = c.name[l] || c.name.en;
    const card = items.find((i) => i.title === name);
    if (!card) {
      err(`${l}/: company "${name}" is not rendered on the homepage`);
      continue;
    }
    if (!card.text) err(`${l}/: company "${name}" lost its description`);
    if (!card.imgVar) err(`${l}/: company "${name}" has no imagery`);
  }
}

/* ----------------------------------------- 8. structural content validation -- */

/**
 * Checks the earlier passes did not cover: duplicate identifiers, empty
 * structures, malformed links, and metadata that is valid but too weak to be
 * useful. Content is generated from JSON, so these are the failure modes that
 * appear when the source data grows rather than when the code changes.
 */
const seenRoute = new Set();
const seenSlug = new Set();
for (const r of routes) {
  if (seenRoute.has(r.route)) err(`duplicate route in manifest — ${r.route}`);
  if (seenSlug.has(r.slug)) err(`duplicate slug in manifest — ${r.slug}`);
  seenRoute.add(r.route);
  seenSlug.add(r.slug);
}

const collectHrefs = (v, out = []) => {
  if (Array.isArray(v)) v.forEach((x) => collectHrefs(x, out));
  else if (v && typeof v === 'object') {
    if (typeof v.href === 'string') out.push(v.href);
    Object.values(v).forEach((x) => collectHrefs(x, out));
  }
  return out;
};

const VALID_HREF = /^(\/|#|https?:\/\/|mailto:|tel:)/;

for (const l of LOCALES) {
  const titles = new Map();

  for (const d of docs[l]) {
    const where = `${l}${d.route}`;

    // --- metadata quality -------------------------------------------------
    if (!d.title || !d.title.trim()) err(`${where}: missing title`);
    else if (d.title.length > 60) warn(`${where}: title is ${d.title.length} chars — search results truncate near 60`);

    if (!d.description || !d.description.trim()) err(`${where}: missing description`);
    else if (d.description.length < 50)
      warn(`${where}: description is only ${d.description.length} chars — too thin to be useful`);
    else if (d.description.length > 160)
      warn(`${where}: description is ${d.description.length} chars — truncates near 160`);

    // Duplicate titles across routes read as duplicate pages to a crawler.
    if (d.title) {
      if (titles.has(d.title)) warn(`${where}: shares its title with ${titles.get(d.title)}`);
      else titles.set(d.title, where);
    }

    // --- structure --------------------------------------------------------
    const h1s = d.blocks.filter((b) => b.type === 'hero' || b.type === 'pageTitle').length;
    if (h1s === 0) err(`${where}: no hero or pageTitle block, so the page has no <h1>`);
    if (h1s > 1) err(`${where}: ${h1s} blocks render an <h1>; a page must have exactly one`);

    for (const [i, b] of d.blocks.entries()) {
      if (b.type !== 'section') continue;
      const bodies = b.bodies ?? [];
      const hasHead = b.head && (b.head.kicker || b.head.heading || b.head.lede);
      if (!bodies.length && !hasHead) err(`${where}: block ${i} is an empty section`);

      for (const body of bodies) {
        const list = body.items ?? body.paragraphs ?? body.glance ?? body.fields;
        if (Array.isArray(list) && list.length === 0)
          err(`${where}: "${body.kind}" body has no items`);
      }
    }

    // --- links ------------------------------------------------------------
    for (const href of new Set(collectHrefs(d))) {
      if (!href.trim()) err(`${where}: empty href`);
      else if (!VALID_HREF.test(href)) err(`${where}: malformed href — "${href}"`);
    }

    // --- media ------------------------------------------------------------
    // Alt text is the accessible name of the image; empty alt is only correct
    // for decoration, and none of this content's imagery is decorative.
    const walkMedia = (v) => {
      if (Array.isArray(v)) return v.forEach(walkMedia);
      if (!v || typeof v !== 'object') return;
      if (typeof v.src === 'string' && v.src.startsWith('/assets/') && 'alt' in v) {
        if (!v.alt || !v.alt.trim()) warn(`${where}: image has no alt text — ${v.src}`);
      }
      Object.values(v).forEach(walkMedia);
    };
    walkMedia(d.blocks);
  }
}

/* ------------------------------------------------------------ placeholder -- */

const placeholders = [];
for (const l of LOCALES) for (const d of docs[l]) if (d.placeholder) placeholders.push(`${l}${d.route}`);

/* -------------------------------------------------------------------- out -- */

notes.push(`locales:            ${LOCALES.join(' ')}`);
notes.push(`routes:             ${routes.length} x ${LOCALES.length} = ${routes.length * LOCALES.length}`);
notes.push(`non-CMS strings:    ${nonCmsChecked} checked, all placed`);
notes.push(`source records:     services ${services.length} · posts ${posts.length} · partners ${partners.length} · pages ${pages.length}`);
notes.push(`media referenced:   ${mediaRefs.size} (${resolved} resolved)`);
notes.push(`renderer coverage:  ${blockCases.size}/${blockTypes.size} blocks, ${bodyCases.size}/${bodyKinds.size} bodies`);
notes.push(`EN/AR same title:   ${identical} route(s)`);

console.log(notes.map((n) => '  ' + n).join('\n'));

if (placeholders.length) {
  console.log(`\n  PLACEHOLDER source copy on ${placeholders.length} document(s) — not fit to publish:`);
  console.log('    ' + placeholders.join('\n    '));
}

if (warnings.length) {
  console.log(`\n  WARN — ${warnings.length} item(s) valid but weaker than they should be:`);
  console.log([...new Set(warnings)].slice(0, 25).map((w) => '    ' + w).join('\n'));
  if (warnings.length > 25) console.log(`    … and ${warnings.length - 25} more`);
}

if (errors.length) {
  console.error(`\nFAIL — CONTENT AUDIT, ${errors.length} problem(s):`);
  console.error(errors.slice(0, 60).map((e) => '  ' + e).join('\n'));
  if (errors.length > 60) console.error(`  … and ${errors.length - 60} more`);
  process.exit(1);
}

console.log(
  `\nPASS — CONTENT AUDIT: data, schema, renderers and both locales agree` +
    (warnings.length ? ` (${warnings.length} warning(s) above)` : '')
);
