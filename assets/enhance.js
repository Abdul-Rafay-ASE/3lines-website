/* 3lines clone enhancements:
   1) Make the header "More" dropdown open on CLICK (Radix NavigationMenu only
      opens on hover; we add a reliable click-driven panel built from footer links).
   2) Compact the footer (3 columns from >=1024px instead of >=1280px + less padding). */
(function () {
  function isMore(btn) {
    if (!btn || btn.tagName !== 'BUTTON') return false;
    var t = (btn.textContent || '').trim();
    return t === 'More' || t === 'المزيد';
  }

  var WANTED = ['about', 'certificates', 'partners-and-clients', 'contact', 'pages-index',
                'legal/privacy-policy', 'legal/terms-and-conditions', 'legal/cookie-policy'];

  function buildPanel(btn) {
    var li = btn.closest('li') || btn.parentElement;
    if (!li) return null;
    var existing = li.querySelector('.cln-more-panel');
    if (existing) return existing;
    if (getComputedStyle(li).position === 'static') li.style.position = 'relative';

    var footer = document.querySelector('footer');
    var rtl = (document.documentElement.getAttribute('dir') === 'rtl');
    var items = [];
    if (footer) {
      WANTED.forEach(function (slug) {
        var a = [].slice.call(footer.querySelectorAll('a[href]')).find(function (x) {
          var h = (x.getAttribute('href') || '').replace(/\.html$/, '').replace(/\/$/, '');
          return h.endsWith('/' + slug) || h.endsWith(slug);
        });
        if (a && a.textContent.trim()) items.push({ href: a.getAttribute('href'), text: a.textContent.trim() });
      });
    }
    if (!items.length) return null;

    var panel = document.createElement('div');
    panel.className = 'cln-more-panel';
    panel.style.cssText = [
      'position:absolute', 'top:calc(100% + 8px)', (rtl ? 'right:0' : 'left:0'),
      'min-width:220px', 'background:#0b0f1a', 'border:1px solid rgba(255,255,255,.1)',
      'border-radius:12px', 'padding:6px', 'box-shadow:0 20px 40px -12px rgba(0,0,0,.7)',
      'z-index:60', 'display:none'
    ].join(';');
    items.forEach(function (it) {
      var a = document.createElement('a');
      a.href = it.href;
      a.textContent = it.text;
      a.style.cssText = 'display:block;padding:9px 12px;border-radius:8px;color:#d4d4d8;font-size:.9rem;text-decoration:none;white-space:nowrap;transition:background .15s,color .15s;';
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
      e.preventDefault();
      e.stopPropagation();
      var panel = buildPanel(btn);
      if (panel) panel.style.display = (panel.style.display === 'none') ? 'block' : 'none';
      return;
    }
    // outside click closes any open panel
    if (!(e.target.closest && e.target.closest('.cln-more-panel'))) {
      var open = document.querySelector('.cln-more-panel');
      if (open) open.style.display = 'none';
    }
  }, true);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var open = document.querySelector('.cln-more-panel');
      if (open) open.style.display = 'none';
    }
  });

  // Footer compaction
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
})();
