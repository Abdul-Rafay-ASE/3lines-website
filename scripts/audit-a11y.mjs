/**
 * Accessibility audit.
 *
 * Hand-rolled rather than pulling in a scanner, for the same reason the rest of
 * this suite is: every check here is one I can explain, and a failure names the
 * element it found. It covers the WCAG failures that actually occur in a
 * content-driven site — missing accessible names, unlabelled inputs, broken
 * heading order, invisible focus, and insufficient contrast — and computes
 * contrast ratios properly rather than eyeballing the palette.
 *
 * FAIL blocks the build. WARN is recorded but does not.
 */
import fs from 'node:fs';
import path from 'node:path';
import { launch, preparePage, settle, ROUTES } from './lib/browser.mjs';

const BASE = process.env.AUDIT_BASE || 'http://127.0.0.1:3200';
const RUN_DIR = process.env.AUDIT_RUN_DIR || path.join('audit-runs', `a11y-${Date.now()}`);

const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '390x844', width: 390, height: 844 },
];

const errors = [];
const warnings = [];
const stats = { pages: 0, elements: 0, contrastChecked: 0 };

/** Runs in the page. Returns findings as plain data. */
const AUDIT = () => {
  const fail = [];
  const warn = [];
  let elements = 0;
  let contrastChecked = 0;

  const label = (el) => (el.className || el.tagName || '').toString().slice(0, 45);

  /* --- accessible names ------------------------------------------------- */
  const named = (el) => {
    const aria = el.getAttribute('aria-label');
    if (aria && aria.trim()) return true;
    if (el.getAttribute('aria-labelledby')) return true;
    if ((el.textContent || '').trim()) return true;
    const img = el.querySelector('img[alt]');
    if (img && img.getAttribute('alt').trim()) return true;
    const t = el.getAttribute('title');
    return !!(t && t.trim());
  };

  for (const el of document.querySelectorAll('a[href], button')) {
    elements++;
    if (!named(el)) fail.push(`${el.tagName.toLowerCase()} has no accessible name — ${label(el)}`);
  }

  /* --- images ------------------------------------------------------------ */
  for (const img of document.querySelectorAll('img')) {
    elements++;
    if (img.getAttribute('alt') === null)
      fail.push(`img has no alt attribute — ${img.getAttribute('src') || label(img)}`);
  }

  /* --- form controls ----------------------------------------------------- */
  for (const c of document.querySelectorAll('input, textarea, select')) {
    elements++;
    if (c.type === 'hidden') continue;
    const id = c.getAttribute('id');
    const hasLabel = id && document.querySelector(`label[for="${CSS.escape(id)}"]`);
    const wrapped = c.closest('label');
    const aria = c.getAttribute('aria-label') || c.getAttribute('aria-labelledby');
    if (!hasLabel && !wrapped && !aria)
      fail.push(`form control has no label — ${c.name || label(c)}`);
  }

  /* --- heading order ----------------------------------------------------- */
  const heads = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')];
  const h1s = heads.filter((h) => h.tagName === 'H1');
  if (h1s.length === 0) fail.push('page has no <h1>');
  if (h1s.length > 1) fail.push(`page has ${h1s.length} <h1> elements`);
  let prev = 0;
  for (const h of heads) {
    const lvl = Number(h.tagName[1]);
    if (prev && lvl > prev + 1)
      warn.push(`heading order skips h${prev} -> h${lvl} ("${(h.textContent || '').trim().slice(0, 40)}")`);
    prev = lvl;
  }

  /* --- landmarks --------------------------------------------------------- */
  if (!document.querySelector('main')) fail.push('no <main> landmark');
  if (!document.querySelector('header')) warn.push('no <header> landmark');
  if (!document.querySelector('footer')) warn.push('no <footer> landmark');

  /* --- duplicate ids ----------------------------------------------------- */
  const ids = new Map();
  for (const el of document.querySelectorAll('[id]')) {
    const id = el.id;
    ids.set(id, (ids.get(id) || 0) + 1);
  }
  for (const [id, n] of ids) if (n > 1) fail.push(`duplicate id "${id}" (${n} elements)`);

  /* --- focus visibility --------------------------------------------------- */
  for (const el of document.querySelectorAll('a[href], button, input, textarea')) {
    const cs = getComputedStyle(el);
    if (cs.outlineStyle === 'none' && cs.outlineWidth === '0px') {
      // Only a problem if nothing else could show focus.
      const hasAlt = cs.boxShadow !== 'none' || cs.borderStyle !== 'none';
      if (!hasAlt) warn.push(`focus may be invisible (outline:none, no fallback) — ${label(el)}`);
    }
  }

  /* --- colour contrast (WCAG 2.1 AA) -------------------------------------- */
  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(',').map((n) => parseFloat(n));
    return { r, g, b, a };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const effectiveBg = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0.5) return c;
      n = n.parentElement;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };

  for (const el of document.querySelectorAll('p, h1, h2, h3, h4, li, a, span, td, label, button')) {
    if (el.children.length) continue;
    const text = (el.textContent || '').trim();
    if (!text) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.5) continue;

    const fg = parse(cs.color);
    if (!fg || fg.a < 0.5) continue;
    const bg = effectiveBg(el);
    contrastChecked++;

    const L1 = lum(fg);
    const L2 = lum(bg);
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);

    const size = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const large = size >= 24 || (size >= 18.66 && bold);
    const required = large ? 3 : 4.5;

    if (ratio < required)
      fail.push(
        `contrast ${ratio.toFixed(2)}:1 below ${required}:1 — "${text.slice(0, 30)}" (${label(el)}, ${cs.fontSize})`
      );
  }

  /* --- tap targets (mobile only, checked by the caller) -------------------- */
  const small = [];
  for (const el of document.querySelectorAll('a[href], button')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.width < 24 || r.height < 24)
      small.push(`${Math.round(r.width)}x${Math.round(r.height)} — ${label(el)}`);
  }

  return { fail, warn, elements, contrastChecked, small };
};

/* -------------------------------------------------------------------- run -- */

fs.mkdirSync(RUN_DIR, { recursive: true });
const browser = await launch();
const report = [];

for (const vp of VIEWPORTS) {
  for (const route of ROUTES) {
    const page = await browser.newPage();
    try {
      await preparePage(page, vp);
      const res = await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 60000 });
      if (!res || ![200, 304].includes(res.status())) {
        errors.push(`${route} @${vp.name}: HTTP ${res ? res.status() : 'none'}`);
        continue;
      }
      await page.evaluate(() => document.fonts.ready);
      await settle(page);

      const r = await page.evaluate(AUDIT);
      stats.pages++;
      stats.elements += r.elements;
      stats.contrastChecked += r.contrastChecked;

      for (const f of r.fail) errors.push(`${route} @${vp.name}: ${f}`);
      for (const w of r.warn) warnings.push(`${route} @${vp.name}: ${w}`);
      // Tap-target minimums only apply to touch viewports.
      if (vp.width < 500) for (const s of r.small) warnings.push(`${route} @${vp.name}: tap target ${s}`);

      report.push({ route, viewport: vp.name, fail: r.fail, warn: r.warn });
    } finally {
      await page.close();
    }
  }
}

await browser.close();

fs.writeFileSync(
  path.join(RUN_DIR, 'a11y.json'),
  JSON.stringify({ base: BASE, viewports: VIEWPORTS.map((v) => v.name), stats, report }, null, 2)
);

console.log(`  pages audited:      ${stats.pages}`);
console.log(`  interactive checked:${stats.elements}`);
console.log(`  contrast samples:   ${stats.contrastChecked}`);
console.log(`  report:             ${path.join(RUN_DIR, 'a11y.json')}`);

const uniq = (a) => [...new Set(a)];

if (warnings.length) {
  console.log(`\n  WARN — ${uniq(warnings).length} distinct:`);
  console.log(uniq(warnings).slice(0, 20).map((w) => '    ' + w).join('\n'));
}

if (errors.length) {
  console.error(`\nFAIL — A11Y AUDIT, ${uniq(errors).length} distinct problem(s):`);
  console.error(uniq(errors).slice(0, 40).map((e) => '  ' + e).join('\n'));
  process.exit(1);
}
console.log('\nPASS — A11Y AUDIT: names, labels, headings, landmarks, ids, contrast.');
