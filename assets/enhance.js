/* 3lines clone enhancements:
   1) Header "More" dropdown opens on click (Radix opens on hover only).
   2) Compact footer (3 cols from >=1024px + less padding).
   3) CMS overrides: service cards + footer text read live from /api/v1/services & /api/v1/site-info. */
(function () {
  /* ----- 1) More dropdown ----- */
  function isMore(btn) {
    if (!btn || btn.tagName !== 'BUTTON') return false;
    var t = (btn.textContent || '').trim();
    return t === 'More' || t === 'المزيد';
  }
  var WANTED = ['about','certificates','partners-and-clients','contact','pages-index',
                'legal/privacy-policy','legal/terms-and-conditions','legal/cookie-policy'];
  function buildPanel(btn) {
    var li = btn.closest('li') || btn.parentElement; if (!li) return null;
    var existing = li.querySelector('.cln-more-panel'); if (existing) return existing;
    if (getComputedStyle(li).position === 'static') li.style.position = 'relative';
    var footer = document.querySelector('footer'), items = [];
    var rtl = document.documentElement.getAttribute('dir') === 'rtl';
    if (footer) WANTED.forEach(function (slug) {
      var a = [].slice.call(footer.querySelectorAll('a[href]')).find(function (x) {
        var h = (x.getAttribute('href') || '').replace(/\.html$/, '').replace(/\/$/, '');
        return h.endsWith('/' + slug) || h.endsWith(slug);
      });
      if (a && a.textContent.trim()) items.push({ href: a.getAttribute('href'), text: a.textContent.trim() });
    });
    if (!items.length) return null;
    var panel = document.createElement('div');
    panel.className = 'cln-more-panel';
    panel.style.cssText = ['position:absolute','top:calc(100% + 8px)',(rtl?'right:0':'left:0'),
      'min-width:220px','background:#0b0f1a','border:1px solid rgba(255,255,255,.1)',
      'border-radius:12px','padding:6px','box-shadow:0 20px 40px -12px rgba(0,0,0,.7)',
      'z-index:60','display:none'].join(';');
    items.forEach(function (it) {
      var a = document.createElement('a');
      a.href = it.href; a.textContent = it.text;
      a.style.cssText = 'display:block;padding:9px 12px;border-radius:8px;color:#d4d4d8;font-size:.9rem;text-decoration:none;white-space:nowrap;';
      a.addEventListener('mouseenter', function () { a.style.background = 'rgba(255,255,255,.06)'; a.style.color = '#fff'; });
      a.addEventListener('mouseleave', function () { a.style.background = 'transparent'; a.style.color = '#d4d4d8'; });
      panel.appendChild(a);
    });
    li.appendChild(panel);
    return panel;
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('button') : null;
    if (isMore(btn)) {
      e.preventDefault(); e.stopPropagation();
      var p = buildPanel(btn); if (p) p.style.display = (p.style.display === 'none') ? 'block' : 'none';
      return;
    }
    if (!(e.target.closest && e.target.closest('.cln-more-panel'))) {
      var open = document.querySelector('.cln-more-panel'); if (open) open.style.display = 'none';
    }
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { var p = document.querySelector('.cln-more-panel'); if (p) p.style.display = 'none'; }
  });

  /* ----- 2) Footer compaction ----- */
  var css = document.createElement('style');
  css.textContent =
    'footer .pt-16,footer .sm\\:pt-24{padding-top:2.5rem !important;}' +
    'footer .pb-8{padding-bottom:1.25rem !important;}' +
    'footer .mt-16,footer .sm\\:mt-20{margin-top:1.5rem !important;}' +
    'footer .space-y-8>*+*{margin-top:1rem !important;}' +
    '@media(min-width:1024px){' +
      'footer [class*="xl:grid"]{display:grid !important;grid-template-columns:repeat(3,minmax(0,1fr)) !important;column-gap:2rem !important;}' +
      'footer [class*="xl:col-span-2"]{grid-column:span 2/span 2 !important;margin-top:0 !important;}' +
      'footer [class*="xl:mt-0"]{margin-top:0 !important;}' +
    '}';
  (document.head || document.documentElement).appendChild(css);

  /* ----- 3) CMS overrides (service cards + footer text) ----- */
  function lang() {
    var l = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
    return l === 'ar' ? 'ar' : 'en';
  }
  function pickLang(obj) {
    if (!obj || typeof obj !== 'object') return '';
    var l = lang();
    return obj[l] != null ? obj[l] : (obj.en || obj.ar || '');
  }
  var ICONS = {
    package:'<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    truck:'<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    plane:'<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    monitor:'<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
    gauge:'<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
    zap:'<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
    shield:'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    cap:'<path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    radar:'<path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6h.01"/><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"/><path d="M12 18h.01"/><path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"/><circle cx="12" cy="12" r="2"/><path d="m13.41 10.59 5.66-5.66"/>'
  };
  function iconSVG(name, color){
    var p = ICONS[name] || ICONS.package;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="'+(color||'#5cc0ff')+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>';
  }

  function applyServiceOverrides(services) {
    if (!Array.isArray(services)) return;
    var bySlug = {}; services.forEach(function (s) { bySlug[s.slug] = s; });
    var cards = document.querySelectorAll('a[href*="/services/"]');
    cards.forEach(function (a) {
      var m = (a.getAttribute('href') || '').match(/services\/([a-z0-9-]+)(?:\.html|\/|$)/);
      if (!m) return;
      var s = bySlug[m[1]]; if (!s) return;
      // Only touch cards (skip nav/footer links): require the card class signature.
      if (!/min-h-\[10rem\]/.test(a.className) && !a.querySelector('h3')) return;
      var h3 = a.querySelector('h3'); if (h3) h3.textContent = pickLang(s.title);
      var p = a.querySelector('p');   if (p)  p.textContent = pickLang(s.description);
      var iconHolder = a.querySelector('span > svg'); // first inline icon
      if (iconHolder) iconHolder.outerHTML = iconSVG(s.icon, s.hue);
      // recolor icon container border + accent and update bg-image accent
      var span = a.querySelector('span');
      if (span && span.parentElement === a) {
        span.style.borderColor = s.hue + '59';
      }
      if (s.hue && a.style && a.style.backgroundImage) {
        // we don't rebuild the SVG bg URL — slug is the file name; just keep it.
      }
    });
  }

  function applyFooterOverrides(info) {
    if (!info) return;
    var footer = document.querySelector('footer'); if (!footer) return;
    var brand = footer.querySelector('.space-y-8') || footer;
    var paras = brand.querySelectorAll('p');
    // First paragraph = company description; second (if exists) = address+reg block.
    if (paras[0] && info.companyDescription) {
      paras[0].textContent = pickLang(info.companyDescription);
    }
    if (paras[1]) {
      var lines = [];
      if (info.address) lines.push(info.address);
      if (info.commercialRegNo) lines.push((lang()==='ar'?'السجل التجاري رقم ':'Commercial Registration No. ') + info.commercialRegNo);
      if (info.vatRegNo) lines.push((lang()==='ar'?'الرقم الضريبي ':'VAT Registration No. ') + info.vatRegNo);
      if (lines.length) paras[1].textContent = lines.join('  ·  ');
    }
    if (info.linkedIn) {
      var ln = footer.querySelector('a[href*="linkedin.com"]');
      if (ln) ln.setAttribute('href', info.linkedIn);
    }
    // Copyright year: find <p> with &copy; / © at start, in the bottom bar
    if (info.copyrightYear) {
      var bottom = footer.querySelectorAll('p');
      bottom.forEach(function (p) {
        if (/©|&copy;/.test(p.innerHTML) && /\b\d{4}\b/.test(p.innerHTML)) {
          p.innerHTML = p.innerHTML.replace(/\b\d{4}\b/, info.copyrightYear);
        }
      });
    }
  }

  function loadCMSOverrides() {
    // Don't run inside the CMS page itself
    if (location.pathname.replace(/\/$/,'') === '/cms' || /^\/cms\b/.test(location.pathname)) return;
    fetch('/api/v1/services', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (j && j.data) applyServiceOverrides(j.data);
    }).catch(function(){});
    fetch('/api/v1/site-info', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (j && j.data) applyFooterOverrides(j.data);
    }).catch(function(){});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadCMSOverrides);
  else loadCMSOverrides();
})();
