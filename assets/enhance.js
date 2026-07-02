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
  var WANTED = ['about','partners-and-clients','contact','pages-index',
                'legal/privacy-policy','legal/terms-and-conditions','legal/cookie-policy'];
  var APPEARANCE = {
    title:  { en: 'Appearance', ar: 'المظهر', ko: '화면 모드', ja: '外観' },
    light:  { en: 'Light', ar: 'فاتح', ko: '라이트', ja: 'ライト' },
    dark:   { en: 'Dark', ar: 'داكن', ko: '다크', ja: 'ダーク' },
    system: { en: 'System', ar: 'النظام', ko: '시스템', ja: 'システム' }
  };
  function trA(k) { var L = (typeof lang === 'function') ? lang() : 'en'; return (APPEARANCE[k][L] || APPEARANCE[k].en); }
  function paintMoreAppearance() {
    var panel = document.querySelector('.cln-more-panel'); if (!panel) return;
    var mode = (typeof getMode === 'function') ? getMode() : 'dark';
    [].slice.call(panel.querySelectorAll('.cln-appearance')).forEach(function (a) {
      var on = a.getAttribute('data-mode') === mode;
      var chk = a.querySelector('.cln-check'); if (chk) chk.style.visibility = on ? 'visible' : 'hidden';
      a.style.color = on ? '#5cc0ff' : '#d4d4d8';
    });
  }
  function buildPanel(btn) {
    var li = btn.closest('li') || btn.parentElement; if (!li) return null;
    var existing = li.querySelector('.cln-more-panel'); if (existing) return existing;
    if (getComputedStyle(li).position === 'static') li.style.position = 'relative';
    var footer = document.querySelector('footer'), items = [];
    var rtl = document.documentElement.getAttribute('dir') === 'rtl';
    // Match footer links by their LAST path segment so the items are consistent on every page
    // depth (on legal pages the footer's legal links are relative, e.g. privacy-policy.html).
    if (footer) WANTED.forEach(function (slug) {
      var seg = slug.split('/').pop();
      var a = [].slice.call(footer.querySelectorAll('a[href]')).find(function (x) {
        var h = (x.getAttribute('href') || '').replace(/[?#].*$/, '').replace(/\.html$/, '').replace(/\/$/, '');
        return h.split('/').pop() === seg;
      });
      if (a && a.textContent.trim()) items.push({ href: a.getAttribute('href'), text: a.textContent.trim() });
    });
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
    // --- Appearance switcher: Light / Dark / System ---
    var sep = document.createElement('div');
    sep.style.cssText = 'height:1px;margin:6px 8px;background:rgba(255,255,255,.12);';
    panel.appendChild(sep);
    var lbl = document.createElement('div');
    lbl.textContent = trA('title');
    lbl.style.cssText = 'padding:4px 12px 2px;font-size:.66rem;text-transform:uppercase;letter-spacing:.07em;color:#8b97a8;';
    panel.appendChild(lbl);
    ['light', 'dark', 'system'].forEach(function (m) {
      var a = document.createElement('a');
      a.href = '#'; a.className = 'cln-appearance'; a.setAttribute('data-mode', m);
      a.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 12px;border-radius:8px;color:#d4d4d8;font-size:.88rem;text-decoration:none;white-space:nowrap;';
      a.innerHTML = '<span>' + trA(m) + '</span><span class="cln-check" style="visibility:hidden;color:#5cc0ff;">✓</span>';
      a.addEventListener('mouseenter', function () { a.style.background = 'rgba(255,255,255,.06)'; });
      a.addEventListener('mouseleave', function () { a.style.background = 'transparent'; });
      a.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); if (typeof setMode === 'function') setMode(m); });
      panel.appendChild(a);
    });
    li.appendChild(panel);
    paintMoreAppearance();
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

  /* ----- 1a) Single-page nav: promote the "More" items to top-level buttons -----
     On this single-page build, the "More" dropdown's main entries (About, Partners and Clients,
     Contact) are real on-page sections, so surface them as direct nav buttons next to
     Home/Services/News and drop the "More" dropdown. Legal links stay in the footer and the
     theme keeps its floating toggle, so nothing is lost. New links are cloned from an existing
     nav link (exact styling) with localized labels read from the footer; the "More" trigger is
     hidden via CSS (perfCss rule 7). The single-page click handler (section 6) turns these hrefs
     into smooth in-page scrolls. The React nav mounts after this script runs, so poll briefly. */
  (function () {
    var MORE = ['More', 'المزيد', '더보기', 'その他'];
    var SLUGS = ['about', 'partners-and-clients', 'contact'];
    var done = false;
    function promote() {
      if (done) return;
      var hdr = document.querySelector('#header') || document.querySelector('header'); if (!hdr) return;
      // The "More" trigger is the only navigation-menu-trigger button -- match it by that
      // (language-agnostic; its label is localized and sometimes truncated, e.g. ko shows "더").
      var moreBtn = hdr.querySelector('li button[data-slot="navigation-menu-trigger"]') ||
        [].slice.call(hdr.querySelectorAll('button')).find(function (b) { return MORE.indexOf((b.textContent || '').trim()) !== -1; });
      var moreLi = moreBtn ? moreBtn.closest('li') : null; if (!moreLi) return;
      var tmplA = [].slice.call(hdr.querySelectorAll('li a[href]')).find(function (a) { return /\/services$/.test(a.getAttribute('href') || ''); });
      var tmplLi = tmplA ? tmplA.closest('li') : null; if (!tmplLi) return;
      var footer = document.querySelector('footer'); if (!footer) return;
      var items = [];
      SLUGS.forEach(function (slug) {
        var a = [].slice.call(footer.querySelectorAll('a[href]')).find(function (x) {
          var h = (x.getAttribute('href') || '').replace(/[?#].*$/, '').replace(/\.html$/, '').replace(/\/$/, '');
          return h.split('/').pop() === slug;
        });
        if (a && a.textContent.trim()) items.push({ href: a.getAttribute('href'), text: a.textContent.trim() });
      });
      if (!items.length) return;
      items.forEach(function (it) {
        var li = tmplLi.cloneNode(true);
        var a = li.querySelector('a');
        a.setAttribute('href', it.href);
        a.textContent = it.text;
        a.removeAttribute('data-active'); a.removeAttribute('aria-current');
        li.setAttribute('data-cln-navitem', '1');
        moreLi.parentNode.insertBefore(li, moreLi);
      });
      // Reorder the nav to a fixed order on every page/language: Home, About, Services, News,
      // Partners and Clients, Contact. Keyed by href (language-agnostic); the hidden "More" and
      // anything unmatched go last.
      (function () {
        var ul = tmplLi.parentNode; if (!ul) return;
        var ORDER = ['home', 'about', 'services', 'news', 'partners-and-clients', 'contact'];
        function keyOf(li) {
          var a = li.querySelector ? li.querySelector('a[href]') : null; if (!a) return null;
          var h = (a.getAttribute('href') || '').replace(/[?#].*$/, '').replace(/\.html$/, '').replace(/\/+$/, '');
          var last = h.split('/').pop();
          if (last === '' || /^(en|ar|ko|ja)$/.test(last)) return 'home';
          if (/partners-and-clients/.test(last)) return 'partners-and-clients';
          if (/services/.test(last)) return 'services';
          if (/news/.test(last)) return 'news';
          if (/about/.test(last)) return 'about';
          if (/contact/.test(last)) return 'contact';
          return null;
        }
        var lis = [].slice.call(ul.children).filter(function (li) { return li.tagName === 'LI'; });
        var byKey = {};
        lis.forEach(function (li) { var k = keyOf(li); if (k && !byKey[k]) byKey[k] = li; });
        ORDER.forEach(function (k) { if (byKey[k]) ul.appendChild(byKey[k]); });
        lis.forEach(function (li) { if (ORDER.indexOf(keyOf(li)) === -1) ul.appendChild(li); });
        // Make Contact the nav's filled CTA (rule 15i). Desktop nav only; styling in cln-nav-cta.
        if (byKey.contact) { var ca = byKey.contact.querySelector('a[href]'); if (ca) ca.classList.add('cln-nav-cta'); }
      })();
      done = true;
    }
    var tries = 0;
    var iv = setInterval(function () { if (done || ++tries > 60) { clearInterval(iv); return; } promote(); }, 100);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', promote); else promote();
  })();

  /* ----- 1b) Cookie consent: REMEMBER the dismissal -----
     The banner is static HTML on every page and its "Got it!" only hides it client-side with
     no persistence, so it reappears on every page (e.g. again on the Services page). Persist
     the choice and remove the banner up-front on later pages. */
  (function () {
    var KEY = 'ml-cookie-ok';
    function accepted() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
    function kill() { var el = document.getElementById('d-cookie-consent'); if (el && el.parentNode) el.parentNode.removeChild(el); }
    if (accepted()) kill();
    document.addEventListener('DOMContentLoaded', function () { if (accepted()) kill(); });
    document.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('#d-cookie-consent-agree') : null;
      if (t) { try { localStorage.setItem(KEY, '1'); } catch (e) {} }
    }, true);
  })();

  /* ----- 1c) "Share this page" social row: keep it, trim to WhatsApp + LinkedIn, pin above the footer -----
     Inner pages (about/contact/service/news/legal) ship a static .dshare row inside a
     `.relative.pt-20.pb-8` wrapper; the homepage gets an equivalent one cloned in by injectShare.
     On EVERY page we want the same compact bar — WhatsApp + LinkedIn only — sitting at the very
     end, right above the footer. (ar/ja/ko source still ships the full 7-icon set, so trim here too.)
     The homepage has no static .dshare, so this no-ops there and injectShare owns the home bar. */
  (function () {
    function placeShare() {
      // "Share this page" row removed site-wide (per client). Strip the static .dshare wrapper that
      // ships on inner pages (about/contact/service/news/legal). The homepage version is never
      // injected (injectShare is disabled), and any already-placed .cln-share is removed too.
      [].slice.call(document.querySelectorAll('.cln-share')).forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
      var first = document.querySelector('.dshare');
      if (!first) return;
      var box = first;
      while (box && !/\bpt-20\b/.test(box.className || '')) box = box.parentElement;
      box = box || first.closest('[class*="pt-20"]') || (first.parentElement && first.parentElement.parentElement) || first;
      if (box && box.parentNode) box.parentNode.removeChild(box);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', placeShare);
    else placeShare();
  })();

  /* ----- 2) Footer compaction ----- */
  var css = document.createElement('style');
  css.textContent =
    /* The header "More" button opens our own solid click-dropdown (section 1).
       Radix also opens a native hover mega-menu whose viewport renders with a
       transparent background and overlaps the page (looks broken). It mounts
       only while open, carrying a --radix-navigation-menu-viewport-* inline
       style — suppress just that element so "More" shows a single clean menu. */
    '#header [style*="--radix-navigation-menu-viewport"]{display:none !important;}' +
    /* belt-and-suspenders: hide every Radix navigation-menu surface so the React mega-menu can
       never appear alongside our own .cln-more-panel ("two menus open" bug) */
    '#header [data-radix-navigation-menu-viewport],#header [class*="NavigationMenuViewport"],' +
    '#header [class*="navigation-menu-viewport"],#header div[data-state="open"][id^="radix-"]{display:none !important;}' +
    'footer .pt-16,footer .sm\\:pt-24{padding-top:2.5rem !important;}' +
    'footer .pb-8{padding-bottom:1.25rem !important;}' +
    'footer .mt-16,footer .sm\\:mt-20{margin-top:1.5rem !important;}' +
    'footer .space-y-8>*+*{margin-top:1rem !important;}' +
    /* desktop top/bottom padding (lg:pt-32 = 128px, lg:mt-24) was not reduced -> shrink it */
    'footer .lg\\:pt-32{padding-top:2rem !important;}' +
    'footer .lg\\:mt-24{margin-top:1.25rem !important;}' +
    'footer .pt-8{padding-top:1.25rem !important;}' +
    /* the new logo is a tall portrait lockup — give the FOOTER logo good presence */
    'footer .bg-logo img{height:9.5rem !important;width:auto !important;margin-bottom:.5rem !important;}' +
    'footer .bg-logo{height:auto !important;display:inline-block !important;}' +
    /* keep the brand text column readable, not stretched too wide */
    'footer .space-y-8>p{max-width:34rem !important;}' +
    /* bottom bar: copyright on the left, social on the right, one clean line */
    'footer .border-t{display:flex !important;align-items:center !important;justify-content:space-between !important;flex-wrap:wrap !important;gap:1rem !important;}' +
    /* address lifted out of the brand column → compact full-width strip above the copyright bar */
    'footer .cln-foot-addr{max-width:none !important;margin:0 !important;padding-top:1.5rem !important;margin-top:1.5rem !important;border-top:1px solid rgba(255,255,255,.08);font-size:.8rem !important;line-height:1.7 !important;}' +
    'footer .cln-foot-addr small{margin-right:.15rem !important;}' +
    /* keep the social clear of the floating theme-toggle button (fixed bottom-right) */
    'footer .cln-foot-social{display:flex !important;align-items:center !important;gap:1rem !important;margin-right:3.75rem !important;}' +
    'footer .cln-foot-social a{display:inline-flex !important;align-items:center !important;}' +
    /* corporate column headings: small uppercase, letter-spaced */
    'footer h3{text-transform:uppercase !important;letter-spacing:.07em !important;font-size:.72rem !important;font-weight:600 !important;opacity:.92;}' +
    /* smooth, slightly slidable link hover */
    'footer ul a{transition:color .18s ease,padding-left .18s ease !important;}' +
    'footer ul li a:hover{padding-left:.2rem !important;}' +
    /* "Get in touch" contact column (email + phone, injected) */
    'footer .cln-foot-contact a{display:inline-flex !important;align-items:center !important;gap:.45rem !important;}' +
    'footer .cln-foot-contact svg{width:14px !important;height:14px !important;flex:none !important;opacity:.7;}' +
    /* flatten ONLY the nested md:grid wrappers (not the injected contact column) at ALL
       widths, so Resources / Company / Legal / Get in touch are siblings: a clean 2x2 grid
       on mobile, an even 4-col row on desktop */
    'footer [class*="xl:col-span-2"]>div[class*="md:grid"]{display:contents !important;}' +
    'footer [class*="xl:col-span-2"]>div>div,footer .cln-foot-contact{margin-top:0 !important;}' +
    '@media(min-width:1024px){' +
      /* balanced grid: brand (wider) | Resources | Company | Legal | Get in touch */
      'footer [class*="xl:grid"]{display:grid !important;grid-template-columns:1.6fr 1fr 1fr 1fr 1fr !important;column-gap:2.25rem !important;align-items:start !important;}' +
      'footer [class*="xl:col-span-2"]{grid-column:span 4/span 4 !important;margin-top:0 !important;display:flex !important;gap:2.25rem !important;}' +
      'footer [class*="xl:col-span-2"]>div>div,footer .cln-foot-contact{flex:1 1 0 !important;}' +
      'footer [class*="xl:mt-0"]{margin-top:0 !important;}' +
    '}';
  (document.head || document.documentElement).appendChild(css);

  /* ----- 2a) Performance + card polish -----
     (1) PERF: backdrop-filter:blur on the ~40 carousel/feature figures + the fixed header is
         the #1 scroll-jank cost (re-blurs every frame). Drop it and give the figures a solid
         surface instead. (2) FRAMES: stronger borders + visible surface + shadow so cards
         stand out, esp. in dark mode. (3) HOVER: one uniform subtle lift on every card, and
         the XR spotlight card's "Learn more" CTA is shown permanently (no hover-only reveal). */
  var perfCss = document.createElement('style'); perfCss.id = 'cln-perf-css';
  perfCss.textContent =
    /* 1) kill the expensive backdrop blurs */
    'figure[class*="min-h-40"]{backdrop-filter:none !important;-webkit-backdrop-filter:none !important;}' +
    'header.fixed,header[class*="fixed"]{backdrop-filter:none !important;-webkit-backdrop-filter:none !important;}' +
    /* 2) dark-mode frame emphasis: surface + stronger border + shadow */
    '.dark figure[class*="min-h-40"],.dark a[class*="min-h-[10rem]"],.dark [class*="group/spotlight"]{' +
      'background-color:rgba(255,255,255,.05) !important;border-color:rgba(255,255,255,.22) !important;' +
      'box-shadow:0 1px 2px rgba(0,0,0,.5),0 14px 30px -14px rgba(0,0,0,.7),0 -20px 80px -20px #ffffff24 inset !important;}' +
    '.dark header.fixed,.dark header[class*="fixed"]{background-color:rgba(9,12,18,.9) !important;}' +
    /* 3) uniform subtle hover lift on all cards (both themes) */
    'figure[class*="min-h-40"],a[class*="min-h-[10rem]"],[class*="group/spotlight"]{transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease,background-color .25s ease !important;}' +
    'figure[class*="min-h-40"]:hover,a[class*="min-h-[10rem]"]:hover,[class*="group/spotlight"]:hover{transform:translateY(-4px) !important;}' +
    '.dark figure[class*="min-h-40"]:hover,.dark a[class*="min-h-[10rem]"]:hover,.dark [class*="group/spotlight"]:hover{border-color:rgba(255,255,255,.30) !important;box-shadow:0 10px 22px rgba(0,0,0,.5),0 20px 44px -18px rgba(0,0,0,.7),0 -20px 80px -20px #ffffff2e inset !important;}' +
    /* 4) XR spotlight card: on hover its content slid up and a "Learn more" CTA appeared —
          the sibling division cards (Defense/Optokon/ATV) don't do that, which is the
          inconsistency that stood out. The whole card is already clickable (onclick ->
          xr.3lines.com.sa). So: (a) hide the hover-only "Learn more" button (the ABSOLUTE
          translate-y-10 layer), and (b) lock the title/description block (the non-absolute
          translate-y-10 layer) in its resting position so it doesn't slide on hover. XR now
          looks/behaves like its siblings (icon + title + desc) and, like every card, just lifts. */
    '[class*="group/spotlight"] [class*="translate-y-10"][class*="absolute"]{display:none !important;}' +
    '[class*="group/spotlight"] [class*="translate-y-10"]:not([class*="absolute"]){translate:0 0 !important;transform:none !important;}' +
    /* 5) XR spotlight card: on hover, ONE "spotlight" wrapper faded in carrying three dark things
          at once -- a near-black rgb(38,38,38) radial glow, a from-gray-950 gradient, and a
          pixel-static <canvas> -- which together washed the card dark/black on hover. Hide that
          whole wrapper on the XR card (kills all three), and also neutralize the faint dark tint
          overlay, so hovering XR leaves its resting VR image clean with no darkening. Scoped via
          the VR-image layer so the other spotlight cards keep their normal hover. */
    '[class*="group/spotlight"]:has([style*="xr-DpDqB5hg"]) [class*="group-hover/spotlight"],[class*="group/spotlight"]:has([style*="xr2-DU5w3"]) [class*="group-hover/spotlight"]{display:none !important;}' +
    '[class*="group/spotlight"]:has([style*="xr-DpDqB5hg"]) [class*="group-hover:bg-black"]{background-color:transparent !important;}' +
    /* 6) Latest News: per request, remove the "Filter by tag(s)" box and the "Load more" button.
          (Only 3 posts exist and Load more is already disabled, so no content is lost.) Both are
          React-rendered, so hiding via CSS keeps a re-render from bringing them back. Each rule is
          scoped with :has() to its distinctive contents so nothing else on the site is touched. */
    '[class*="bg-zinc-800/20"]:has(h2){display:none !important;}' +
    '[class*="py-8"]:has(button[class*="text-lg"][class*="font-bold"][class*="rounded-xl"]){display:none !important;}' +
    /* 7) Single-page nav: hide the "More" dropdown trigger (its items are promoted to top-level
          nav buttons by section 1a). The trigger is the only navigation-menu-trigger button. */
    '#header li:has(> button[data-slot="navigation-menu-trigger"]){display:none !important;}' +
    /* 8) Bento feature-card icons (Defense / Optokon / ATV / XR) shipped in mixed greys
          (zinc-700 vs zinc-600). Unify them to the brand accent blue used by the service-card
          icons, in BOTH themes, so all card icons share one colour. They are the title icons
          (the only svgs in the bento that carry the hover-scale "origin-left" class -- the arrow
          CTAs do not), so this never touches the arrows. */
    '[class*="auto-rows-"] svg[class*="origin-left"]{color:#0a73d4 !important;}' +
    /* 9) Unify ALL service-card accents to the one brand blue. The cards shipped per-service
          hues (e.g. an orange "Generators and UPS" that broke the set); recolour the icon, its
          container border and the "Read more" label, overriding both the baked inline colours
          and the live CMS hue overrides, in both themes. */
    'a[class*="min-h-[10rem]"] svg{stroke:#0a73d4 !important;color:#0a73d4 !important;}' +
    'a[class*="min-h-[10rem]"]>span{border-color:#0a73d459 !important;}' +
    'a[class*="min-h-[10rem]"] [style*="font-weight:600"]{color:#0a73d4 !important;}' +
    /* 10) Services grid = 9 cards in a clean 3-3-3 (the off-theme "English Language Training" card
           is dropped -- every other service is aircraft/defense, so it didn't fit). Hiding it
           leaves 9 cards which fill the native 3-col grid evenly, no lonely last card and no
           special layout needed. Applies on the landing and the /services page. */
    'a[class*="min-h-[10rem]"][href*="english-language-training"]{display:none !important;}' +
    /* 10b) Drop the "Certificates" menu item. The label is hard-coded in the React bundle (route:null,
            slug:"certificates") and its page was empty ("nothing shared yet") -> removed. Hide every
            link to it (mobile menu route /{lang}/certificates, any legacy footer link) so nothing
            points at a deleted page. Re-add real certificates later to bring it back. */
    'a[href*="certificates"]{display:none !important;}' +
    /* 11) Two bento icons (Defense, Optokon) are FILLED icons (fill-zinc-400, grey) rather than
           stroked ones, so rule 8's color/stroke left them grey while XR/ATV went blue. Recolour
           the filled icons (and their paths) to the one brand blue, both themes. */
    '[class*="auto-rows-"] svg[class*="fill-zinc"],[class*="auto-rows-"] svg[class*="fill-zinc"] *{fill:#0a73d4 !important;}' +
    /* 12) Stat numbers (and other one-off accents) are hard-coded to a lighter blue #5cc0ff;
           normalise every text-[#5cc0ff] accent to the one brand blue so all cards match. */
    '[class*="text-[#5cc0ff]"]{color:#0a73d4 !important;}' +
    /* 13) Single brand-blue accent (#0a73d4) for the remaining card/section accents, both themes:
           the big section titles (override the light-mode gradient + transparent text-fill), the
           bento "Learn more" external links, and the contact email/phone/LinkedIn links. */
    'h1[class*="max-w-4xl"][class*="text-center"]{color:#0a73d4 !important;-webkit-text-fill-color:#0a73d4 !important;background-image:none !important;}' +
    '[class*="auto-rows-"] a[target="_blank"]{color:#0a73d4 !important;}' +
    '#contact a[href^="mailto"]:not([class*="bg-"]),#contact a[href^="tel"]:not([class*="bg-"]),#contact a[href*="linkedin"]:not([class*="bg-"]){color:#0a73d4 !important;}' +
    /* 14) Dark-mode card surfaces. In light mode every card is white (light-theme rule S). In dark
           mode the stat / contact cards shipped `bg-white/5` (near-transparent -> no card edge) and
           the "Prefer email?" card a blue gradient, so they looked inconsistent next to the other
           cards. Give them ONE consistent elevated dark surface + border (scoped to .dark so light
           mode keeps its white cards). */
    '.dark [class*="bg-white/5"],.dark [class*="from-blue-600/"][class*="to-transparent"]{background-color:rgba(255,255,255,.05) !important;background-image:none !important;border-color:rgba(255,255,255,.10) !important;box-shadow:0 1px 2px rgba(0,0,0,.4),0 10px 26px -16px rgba(0,0,0,.6) !important;}' +
    /* 15) Service cards: the "Read more ->" CTA is position:absolute at bottom-0 and slides up on
           hover, so on cards whose 3-line description reaches the bottom it overlapped that last
           line. Reserve bottom space so the CTA lands BELOW the description with a clear gap (both
           themes). The CTA is ~2.3rem tall, so ~2.6rem of bottom padding clears it. */
    'a[class*="min-h-[10rem]"]{padding-bottom:2.6rem !important;}' +
    /* 16) Partner/client logos: shown in their REAL brand colour, at full opacity, ALL the time (client
           request). The carousel keeps auto-scrolling and pauses on hover (React). Only the flat/LIGHT
           logos -- which would go white-on-white on the light theme -- are inverted-dark in light mode;
           they're detected by average brightness at runtime (16b) and tagged .cln-light-logo. Dark mode
           shows every logo as-is (all read on the dark bg). Hover just lifts slightly. */
    'img[class*="group-hover:grayscale-0"]{filter:none !important;opacity:1 !important;transition:transform .2s ease !important;}' +
    '.ml-light img[class*="group-hover:grayscale-0"].cln-light-logo{filter:invert(1) grayscale(1) brightness(.4) contrast(1.15) !important;}' +
    'img[class*="group-hover:grayscale-0"]:hover{transform:scale(1.06) !important;}' +
    /* 17) Footer brand logo: now that the long blurb paragraph is gone, give the logo a bigger,
           better-proportioned presence in the brand column (both themes). Also clear the anchor's
           redundant bg-logo background so only the <img> shows (no faint duplicate). */
    'footer a[class*="bg-logo"]{background-image:none !important;height:auto !important;display:inline-block !important;}' +
    'footer img[alt*="3Lines"]{height:9.5rem !important;width:auto !important;margin-bottom:.5rem !important;}' +
    /* 18) Header brand logo: the circular "3" mark only (3Lines_logo.png, ~square). Sized as a
           compact ~56px square via background-image override — keeps the header short so it no
           longer overlaps page content on mobile. */
    '#logo{height:3.5rem !important;width:3.5rem !important;background-image:url("/assets/logos/3Lines_logo.png?v=2") !important;}' +
    /* The logo is a header <a>, so the light-mode "header a:hover" rule paints a faint slate
       box behind it on hover. The brand logo should not look like a clickable nav chip — keep it
       clean on hover/focus like the footer logo (its #id beats the header a:hover rule). */
    '#logo:hover,#logo:focus{background-color:transparent !important;box-shadow:none !important;}' +
    /* 19) Keep the header ALWAYS visible. The React nav toggles a `-translate-y-*` class to slide
           the bar off-screen on scroll-down (Tailwind v4 uses the CSS `translate` property, which is
           why it moves even though `transform` stays none). Pin it so it never hides while scrolling
           or after a nav-button jump. */
    'header[class*="fixed"]{transform:none !important;translate:none !important;}' +
    /* 20) Bento card icon+title consistency: the "XR" feature card ships its content wrapper as
           flex-row (icon jammed beside a tiny title), while every other bento card (Defense, Optokon,
           ATV) stacks icon ABOVE the title. Force the icon/title/description block to column on all
           bento cards so XR matches the rest -- icon on top, then title, then blurb. Scoped with
           :has(> h3) so only the title block is affected, never the image/other flex children. */
    '[class*="auto-rows-"] [class*="rounded-xl"] [class*="flex-col"]:has(> h3){flex-direction:column !important;align-items:flex-start !important;}';
  (document.head || document.documentElement).appendChild(perfCss);

  /* ----- 15b) Partner/Client logos: enlarge -----
     The mini-slider bundle caps each logo tile + <img> at max-h-[70px] (min-h-[50px]),
     so the "Partners and Clients" strip reads cramped. Bump the cap in BOTH themes,
     scoped to #mini-slider-partners so nothing else on the page is touched. The h-[86px]
     side edge-fades grow to match so they still cover the taller strip in dark mode. */
  var partnersCss = document.createElement('style'); partnersCss.id = 'cln-partners-size';
  partnersCss.textContent =
    '#mini-slider-partners [class*="max-h-[70px]"]{max-height:112px !important;}' +
    '#mini-slider-partners [class*="min-h-[50px]"]{min-height:80px !important;}' +
    '#mini-slider-partners [class*="h-[86px]"]{height:128px !important;}';
  (document.head || document.documentElement).appendChild(partnersCss);

  /* ----- 15c) XR bento card: put the "XR" label beside the goggles icon -----
     The card's content wrapper stacks icon / "XR" / description in a flex-col. Flip it to a
     row so the goggles icon + "XR" title sit side by side, with the description wrapping
     full-width onto the next line. Scoped via the unique `lucide-rectangle-goggles` icon so
     the other bento cards (Defense / Optokon / ATV / Cybersecurity) stay untouched. */
  var xrCss = document.createElement('style'); xrCss.id = 'cln-xr-inline';
  xrCss.textContent =
    '[class*="flex-col"]:has(> svg.lucide-rectangle-goggles){flex-direction:row !important;flex-wrap:wrap !important;align-items:center !important;column-gap:.5rem !important;}' +
    '[class*="flex-col"]:has(> svg.lucide-rectangle-goggles) > p{flex-basis:100% !important;margin-top:.1rem !important;}' +
    /* On phones the XR card's headset photo (md:hidden, pinned to the bottom) sits right behind
       the title/description/Learn-more and makes them unreadable. It renders ABOVE the card's
       scrim but BELOW the text, so fade the photo itself to a soft backdrop. md:hidden already
       limits this to mobile; scoped to the XR card via the unique goggles icon. */
    '[class*="group/spotlight"]:has(svg.lucide-rectangle-goggles) [class*="md:hidden"][class*="bottom-0"]{opacity:.3 !important;}';
  (document.head || document.documentElement).appendChild(xrCss);

  /* ----- 15d) Contact section: centered, card-less layout -----
     Drive the layout from here (not Tailwind classes) since the prebuilt CSS only ships the
     classes used at build time. Colours stay on the elements via theme-aware classes
     (text-zinc-*, text-[#5cc0ff]); this only does structure, so it's theme-agnostic. Targets
     the .cln-contact wrapper, which exists on both the /contact page and the merged homepage. */
  var contactCss = document.createElement('style'); contactCss.id = 'cln-contact-css';
  contactCss.textContent =
    '.cln-contact{max-width:62rem;margin-inline:auto;text-align:center}' +
    '.cln-contact-lead{max-width:40rem;margin:0 auto;font-size:1.2rem;line-height:1.7}' +
    '.cln-contact-cta{margin-top:2rem;display:flex;flex-direction:column;align-items:center;gap:.85rem}' +
    '.cln-contact-grid{margin-top:3.5rem;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:2.25rem 1.5rem;align-items:start;text-align:center}' +
    '.cln-contact-item{display:flex;flex-direction:column;align-items:center}' +
    '.cln-contact-ico{display:inline-flex;margin-bottom:.6rem}' +
    '.cln-contact-item h3{font-size:.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.12em;margin:0 0 .35rem}' +
    '.cln-contact-item p{font-size:.95rem;line-height:1.6;margin:0}' +
    '.cln-contact-linkedin{display:inline-flex;align-items:center;gap:.4rem;margin-top:2.75rem;font-weight:500}' +
    '@media (max-width:900px){.cln-contact-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:2.5rem 1.5rem}}' +
    '@media (max-width:560px){.cln-contact-grid{grid-template-columns:minmax(0,1fr);gap:2rem}}';
  (document.head || document.documentElement).appendChild(contactCss);

  /* ----- 15e) Footer separation in dark mode -----
     The footer ships a bottom-weighted gradient (from-zinc-800/40 -> transparent) and NO top
     border, so in dark mode its top edge is invisible — you can't tell where the content ends
     and the footer begins. Light mode already has a 1px top border (light-theme.css); give dark
     mode the same: a faint top border + a subtle surface lift so the footer reads as its own band. */
  var footerCss = document.createElement('style'); footerCss.id = 'cln-footer-dark';
  footerCss.textContent =
    '.dark footer{border-top:1px solid rgba(255,255,255,.10) !important;background-color:rgba(255,255,255,.025) !important;}';
  (document.head || document.documentElement).appendChild(footerCss);

  /* ----- 15f) Hero CTA emphasis -----
     The hero's "Who we are" button ships as a near-invisible dark ghost pill (bg = var(--bg),
     border-white/10) that blends into the hero. Reference sites (ai3lines.com etc.) lead with a
     confident accent CTA, so give it a brand-blue border + glow so it reads as the hero's primary
     action. Theme-aware text (the hero is dark in dark mode, light in light mode). Scoped to #hero. */
  var heroCtaCss = document.createElement('style'); heroCtaCss.id = 'cln-hero-cta';
  heroCtaCss.textContent =
    '#hero button[class*="var(--bg)"]{border-color:rgba(58,160,255,.9) !important;border-width:1.5px !important;box-shadow:0 0 0 1px rgba(58,160,255,.22),0 10px 34px -8px rgba(58,160,255,.5) !important;padding-left:2rem !important;padding-right:2rem !important;}' +
    '#hero button[class*="var(--bg)"] *{font-weight:600 !important;letter-spacing:.03em !important;}' +
    /* dark mode: the pill is a dark ghost -> force white label. Light mode already ships a solid
       blue filled CTA (its own white label), so leave its text alone. */
    '.dark #hero button[class*="var(--bg)"],.dark #hero button[class*="var(--bg)"] *{color:#fff !important;}';
  (document.head || document.documentElement).appendChild(heroCtaCss);

  /* ----- 15g) Dark-theme ambient glow -----
     The dark theme ships a flat near-black canvas; reference dark sites (ai3lines.com etc.) get their
     "premium" feel from soft off-screen brand-blue light pools that give the page tonal depth. Add two
     faint radial glows via a viewport-fixed pseudo-element (composited -> smooth on scroll, unlike
     background-attachment:fixed). z-index:-1 keeps it behind all content; the site's sections are
     transparent so the glow reads through them. Dark mode only -- light mode already lifts its own bg. */
  var glowCss = document.createElement('style'); glowCss.id = 'cln-dark-glow';
  glowCss.textContent =
    ".dark body::before{content:'';position:fixed;inset:0;z-index:-1;pointer-events:none;" +
    "background:radial-gradient(1300px 900px at 82% -12%, rgba(45,112,240,.26), transparent 60%)," +
    "radial-gradient(1050px 800px at 6% 112%, rgba(58,160,255,.13), transparent 58%);}";
  (document.head || document.documentElement).appendChild(glowCss);

  /* ----- 15h) Section headers: eyebrow kicker + accent bar -----
     Reference marketing sites frame each section with a small uppercase "eyebrow" label above the
     heading and a short accent underline below it, so sections read as deliberately designed bands
     rather than plain centered titles. The homepage headings ship as bare centered h2s (relative +
     pb-12), so the accent bar drops into the existing bottom padding and the eyebrow prepends inside.
     Eyebrow text is injected per-section in reorderSections() (localized); this is just the styling.
     Arabic drops letter-spacing (it would break the connected script); accent tint follows theme. */
  var secHeadCss = document.createElement('style'); secHeadCss.id = 'cln-sec-head';
  secHeadCss.textContent =
    '.cln-eyebrow{display:block;margin-bottom:.6rem;font-size:.72rem;line-height:1;font-weight:700;text-transform:uppercase;color:#5cc0ff;}' +
    'html:not([lang="ar"]) .cln-eyebrow{letter-spacing:.2em;}' +
    '.ml-light .cln-eyebrow{color:#1f6fd6;}' +
    '.cln-sec-h2::after{content:"";position:absolute;left:50%;transform:translateX(-50%);bottom:1.4rem;width:60px;height:3px;border-radius:3px;background:linear-gradient(90deg,rgba(58,160,255,0),rgba(58,160,255,.9),rgba(58,160,255,0));}';
  (document.head || document.documentElement).appendChild(secHeadCss);

  /* ----- 15i) Header "Contact" as a filled CTA -----
     Reference sites end the nav with a solid accent button so the primary action stands out from the
     text links. The Contact link already ships as an h-9 rounded inline-flex pill inside a flex-centered
     nav, so filling it with the brand gradient aligns perfectly with the other items -- no layout change.
     `background` shorthand (not just -image) so it also clears the theme's hover:bg-accent tint. The
     nav-reorder step tags the link with .cln-nav-cta (desktop nav only). */
  var navCtaCss = document.createElement('style'); navCtaCss.id = 'cln-nav-cta';
  navCtaCss.textContent =
    '.cln-nav-cta{background:linear-gradient(180deg,#2f7dff,#1c5fe0) !important;color:#fff !important;box-shadow:0 6px 18px -7px rgba(47,125,255,.7) !important;transition:transform .2s ease,box-shadow .2s ease !important;}' +
    '.cln-nav-cta:hover,.cln-nav-cta:focus{background:linear-gradient(180deg,#3f8bff,#2668ea) !important;color:#fff !important;box-shadow:0 9px 22px -7px rgba(47,125,255,.85) !important;transform:translateY(-1px) !important;}';
  (document.head || document.documentElement).appendChild(navCtaCss);

  /* ----- 15j) Accessibility contrast fixes (Lighthouse) -----
     Two dark-mode text tokens fail WCAG AA on the near-black canvas: muted `text-zinc-500` body/date
     text (4.1:1) and the `text-zinc-100/30` "Read more" card CTA (2.4:1). Lift both to an accessible
     zinc-400; the Read-more keeps its dim->bright hover reveal via the group-hover rule. Also a
     screen-reader-only utility used by the a11y runtime below (hidden headings / labels). */
  var a11yCss = document.createElement('style'); a11yCss.id = 'cln-a11y-css';
  a11yCss.textContent =
    '.cln-sr-only{position:absolute !important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}' +
    '.dark [class*="text-zinc-500"]{color:#a1a1aa !important;}' +
    '.dark [class*="text-zinc-100/30"]{color:#a1a1aa !important;}' +
    '.dark .group:hover [class*="text-zinc-100/30"]{color:#fafafa !important;}' +
    /* The unified brand accent (#0a73d4, rules 12-13) is 4.18:1 on the near-black dark canvas -- just
       under AA. In dark mode only, lift accent TEXT to #3aa0ff (~6.9:1, same hue as the glow/bars).
       Light mode keeps #0a73d4 (passes on its light bg). Scoped to text so icon/border fills stay. */
    '.dark [class*="text-[#5cc0ff]"]{color:#3aa0ff !important;}' +
    '.dark #contact a[href^="tel"]:not([class*="bg-"]),.dark #contact a[href^="mailto"]:not([class*="bg-"]),.dark #contact a[href*="linkedin"]:not([class*="bg-"]){color:#3aa0ff !important;}';
  (document.head || document.documentElement).appendChild(a11yCss);

  /* ----- 15j-b) Bento card background parity (light mode) -----
     The hero bento cards carry a decorative `bg-linear-180 from-transparent to-background` fade
     overlay meant to blend content into the card bottom. In dark mode that fades to the dark bg
     (fine), but in light mode `to-background` resolves to a ~4% slate tint -> those cards read as
     grey-bottomed while the plain-white About/Services cards don't. Re-point the fade to white in
     light mode so all three sections' cards share the same plain-white background (image cards still
     blend their artwork cleanly to white at the bottom). */
  var cardBgCss = document.createElement('style'); cardBgCss.id = 'cln-card-bg';
  cardBgCss.textContent =
    '.ml-light [class*="bg-linear-180"][class*="to-background"]{background-image:linear-gradient(180deg,transparent,#ffffff) !important;}';
  (document.head || document.documentElement).appendChild(cardBgCss);

  /* ----- 15j-c) About feature-card icon chips -----
     Those cards' icon wrappers use h-11/w-11/bg-[#5cc0ff]/10 -- none of which exist in the prebuilt
     Tailwind CSS -- so the wrapper stretched full-width and justify-center parked the bare icon in the
     card's center, misaligned with the left-aligned title/text. Restore the intended 44px rounded blue
     icon chip pinned top-left (matching the Services/bento cards), so the icon sits above its text. */
  var aboutIconCss = document.createElement('style'); aboutIconCss.id = 'cln-about-icons';
  aboutIconCss.textContent =
    '#about-info [class*="h-11"][class*="w-11"]{width:2.75rem !important;height:2.75rem !important;flex:none !important;background:rgba(58,160,255,.12) !important;border-radius:.7rem !important;}';
  (document.head || document.documentElement).appendChild(aboutIconCss);

  /* ----- 15o) "Why 3Lines" auto-advancing slider (reference: sami/aecl.com) -----
     A rotating value-proposition band after About -- the dynamic, credibility-first carousel peer
     defense sites lead with. Self-contained (built in buildSlider), so no risk to the React content;
     dark/light + RTL aware; autoplay pauses on hover/focus and is disabled under reduced-motion. */
  var sliderCss = document.createElement('style'); sliderCss.id = 'cln-slider-css';
  sliderCss.textContent =
    /* Force LTR carousel mechanics (track/dots/arrows) so a positive RTL translateX never escapes
       the viewport clip and creates horizontal page scroll; slide TEXT stays RTL for Arabic below. */
    /* 75rem + 2rem padding -> a ~1136px panel that matches the About card row's width; arrows overlay
       the panel edges (absolute) instead of eating side space, so the panel spans the full width. */
    '.cln-slider{max-width:75rem;margin:1.5rem auto 0;padding:0 2rem;direction:ltr;overflow:hidden;}' +
    '.cln-slider-frame{position:relative;}' +
    '.cln-slider-viewport{overflow:hidden;border-radius:1rem;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.03);}' +
    '.cln-slider-track{display:flex;transition:transform .55s cubic-bezier(.16,.84,.44,1);}' +
    '@media(prefers-reduced-motion:reduce){.cln-slider-track{transition:none;}}' +
    '.cln-slide{flex:0 0 100%;min-width:100%;box-sizing:border-box;padding:3rem 2rem;min-height:210px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;}' +
    '.cln-slide-eyebrow{font-size:.72rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#3aa0ff;margin-bottom:.75rem;}' +
    'html[lang="ar"] .cln-slide-eyebrow{letter-spacing:normal;}' +
    'html[lang="ar"] .cln-slide{direction:rtl;}' +
    '.cln-slide-head{font-size:1.6rem;font-weight:800;color:#f4f4f5;margin:0 0 .55rem;line-height:1.22;}' +
    '@media(min-width:768px){.cln-slide-head{font-size:2.1rem;}}' +
    '.cln-slide-sub{font-size:1rem;color:#a1a1aa;max-width:44rem;margin:0 auto;line-height:1.55;}' +
    '.cln-slider-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:2;width:2.75rem;height:2.75rem;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(20,22,30,.55);backdrop-filter:blur(4px);color:#e4e4e7;font-size:1.4rem;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:border-color .2s ease,color .2s ease,background .2s ease;}' +
    '.cln-slider-prev{left:.9rem;}.cln-slider-next{right:.9rem;}' +
    '.cln-slider-arrow:hover,.cln-slider-arrow:focus-visible{border-color:rgba(58,160,255,.7);color:#3aa0ff;background:rgba(58,160,255,.14);}' +
    '.cln-slider-dots{display:flex;justify-content:center;gap:.5rem;margin-top:1rem;}' +
    '.cln-slider-dot{width:8px;height:8px;border-radius:999px;border:0;background:rgba(255,255,255,.25);cursor:pointer;padding:0;transition:width .25s ease,background .25s ease;}' +
    '.cln-slider-dot[aria-current="true"]{width:22px;background:#3aa0ff;}' +
    '.ml-light .cln-slider-viewport{border-color:rgba(3,18,44,.12);background:#ffffff;}' +
    '.ml-light .cln-slide-head{color:#0b1220;}.ml-light .cln-slide-sub{color:#52525b;}.ml-light .cln-slide-eyebrow{color:#0a73d4;}' +
    '.ml-light .cln-slider-arrow{border-color:rgba(3,18,44,.12);color:#334155;background:rgba(255,255,255,.85);box-shadow:0 2px 10px rgba(3,18,44,.12);}' +
    '.ml-light .cln-slider-arrow:hover,.ml-light .cln-slider-arrow:focus-visible{border-color:rgba(10,115,212,.6);color:#0a73d4;background:rgba(10,115,212,.06);}' +
    '.ml-light .cln-slider-dot{background:rgba(3,18,44,.2);}.ml-light .cln-slider-dot[aria-current="true"]{background:#0a73d4;}' +
    '@media(max-width:640px){.cln-slider-arrow{display:none;}.cln-slide{padding:2.25rem 1.25rem;min-height:200px;}}';
  (document.head || document.documentElement).appendChild(sliderCss);

  /* ----- 15m) Scroll-reveal -----
     Content blocks fade/rise in as they enter view -- pure feel, so it's opt-in via a JS-added class
     (no-JS keeps everything visible) and uses ONLY opacity/transform (no layout shift -> the CLS work
     is untouched). Disabled under prefers-reduced-motion. */
  var polishCss = document.createElement('style'); polishCss.id = 'cln-polish-css';
  polishCss.textContent =
    '@media (prefers-reduced-motion: no-preference){' +
    '.cln-reveal{opacity:0;transform:translateY(18px);transition:opacity .6s cubic-bezier(.16,.84,.44,1),transform .6s cubic-bezier(.16,.84,.44,1);}' +
    '.cln-reveal.cln-in{opacity:1;transform:none;}}';
  (document.head || document.documentElement).appendChild(polishCss);

  /* ----- 15k) Accessibility DOM fixes (Lighthouse) -----
     (a) Generic "Learn more"/"Read more" links get an aria-label naming their card (link-text/SEO).
     (b) The language switcher ships as an <svg> menu trigger carrying aria-haspopup/aria-expanded,
         which are invalid without a button role -> add role="button" + a localized label.
     (c) The hero bento cards are <h3> straight after the hero <h1> (a skipped level); insert one
         visually-hidden <h2> before the first skipped heading so the outline is sequential. Runs on a
         short retry since news/bento content hydrates async; every step is guarded/idempotent. */
  (function a11yRuntime() {
    var GEN = /^(learn more|read more|もっと見る|続きを読む|자세히 보기|더 보기|اقرأ المزيد|المزيد|اعرف المزيد)$/i;
    var LANGLBL = { en: 'Change language', ar: 'تغيير اللغة', ja: '言語を変更', ko: '언어 변경' };
    var CAP = { en: 'Our Capabilities', ar: 'قدراتنا', ja: '事業領域', ko: '핵심 역량' };
    function loc() { var l = (document.documentElement.getAttribute('lang') || 'en').toLowerCase(); return (l === 'ar' || l === 'ko' || l === 'ja') ? l : 'en'; }
    function run() {
      var L = loc();
      // (a) descriptive link text: append visually-hidden context so the accessible name AND the
      //     textContent Lighthouse reads both become descriptive (aria-label alone doesn't satisfy
      //     the link-text SEO audit, which inspects visible text).
      var ABOUT = { en: ' about ', ar: ' — ', ja: '：', ko: ' — ' };
      [].slice.call(document.querySelectorAll('a')).forEach(function (a) {
        if (a.querySelector('.cln-linkext')) return;
        var t = (a.textContent || '').trim(); if (!GEN.test(t)) return;
        var card = a, h = null;
        for (var i = 0; i < 6 && card; i++) { card = card.parentElement; if (card) { h = card.querySelector('h1,h2,h3,h4'); if (h) break; } }
        if (!h || /cln-sr-heading/.test(h.className || '')) return;
        var name = h.textContent.trim().replace(/\s+/g, ' '); if (!name) return;
        var s = document.createElement('span'); s.className = 'cln-sr-only cln-linkext';
        s.textContent = (ABOUT[L] || ABOUT.en) + name;
        a.appendChild(s);
      });
      // (b) language-switcher svg trigger
      [].slice.call(document.querySelectorAll('svg[aria-haspopup],svg[aria-expanded]')).forEach(function (s) {
        if (!s.getAttribute('role')) s.setAttribute('role', 'button');
        if (!s.getAttribute('aria-label')) s.setAttribute('aria-label', LANGLBL[L] || LANGLBL.en);
      });
      // (c) heading-order: insert a hidden heading before the first skipped level
      if (!document.querySelector('.cln-sr-heading')) {
        var hs = [].slice.call(document.querySelectorAll('h1,h2,h3,h4,h5,h6'));
        for (var j = 0; j < hs.length - 1; j++) {
          var lc = +hs[j].tagName[1], ln = +hs[j + 1].tagName[1];
          if (ln > lc + 1 && hs[j + 1].parentNode) {
            var sh = document.createElement('h' + (lc + 1));
            sh.className = 'cln-sr-only cln-sr-heading'; sh.textContent = CAP[L] || CAP.en;
            hs[j + 1].parentNode.insertBefore(sh, hs[j + 1]);
            break;
          }
        }
      }
    }
    var n = 0, iv = setInterval(function () { run(); if (++n > 20) clearInterval(iv); }, 250);
    if (document.readyState !== 'loading') run();
    document.addEventListener('DOMContentLoaded', run);
  })();

  /* ----- 15n) Scroll-reveal runtime (styling in rule 15m) ----- */
  (function polishRuntime() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Scroll-reveal: fade/rise content blocks in as they enter view (opacity/transform only).
    if (reduce || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('cln-in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    var SELS = ['.cln-sec-h2', '#about-info [class*="rounded-xl"]', '[id="services"] a[class*="min-h-[10rem]"]', '#news [class*="rounded-2xl"]', '#news article', '#contact .cln-contact-item'];
    function collect() {
      SELS.forEach(function (sel) {
        [].slice.call(document.querySelectorAll(sel)).forEach(function (e) {
          if (e.classList.contains('cln-reveal') || e.classList.contains('cln-in')) return;
          if (e.closest('#hero')) return;
          e.classList.add('cln-reveal');
          var idx = e.parentElement ? [].slice.call(e.parentElement.children).indexOf(e) : 0;
          e.style.transitionDelay = (Math.min(Math.max(idx, 0), 8) * 55) + 'ms';
          io.observe(e);
        });
      });
    }
    // No blanket timer here: IntersectionObserver reliably reveals each block as it scrolls into view,
    // and below-fold blocks must STAY hidden until then. (No-IO / reduced-motion already bail out above
    // without ever adding .cln-reveal, so content is never left hidden when the effect is unavailable.)
    function start() {
      var m = 0, iv2 = setInterval(function () { collect(); if (++m > 16) clearInterval(iv2); }, 250);
      if (document.readyState !== 'loading') collect();
      document.addEventListener('DOMContentLoaded', collect);
    }
    // Wait until the homepage CLS gate has revealed (html loses .cln-gate) so we only observe against
    // the SETTLED layout -- otherwise transient intersections during the initial reflow (gate + section
    // reorder + async cards) falsely reveal below-fold blocks. Inner pages have no gate -> starts at once.
    (function waitSettled(tries) {
      if (!document.documentElement.classList.contains('cln-gate') || tries > 100) {
        requestAnimationFrame(function () { requestAnimationFrame(start); });
      } else { setTimeout(function () { waitSettled(tries + 1); }, 60); }
    })(0);
  })();

  /* ----- 15q) Micro-interactions: hero entrance + globe drift, stat count-up, card & button hover -----
     Everything here is composited-only (opacity / transform / box-shadow -> no layout shift, the CLS
     work stays intact) and wrapped in prefers-reduced-motion:no-preference so it disables entirely for
     users who opt out. Card lift/glow and button feedback are pure CSS; the hero entrance is gate-aware
     (it only arms while the homepage CLS gate still hides the page, so the opacity:0 start can never
     flash) and the count-up ticks the first time the stat row scrolls into view. */
  var motionCss = document.createElement('style'); motionCss.id = 'cln-motion-css';
  motionCss.textContent =
    '@media (prefers-reduced-motion: no-preference){' +
    /* hero: one-time fade/rise once the gate lifts, plus a slow ambient drift on the globe canvas */
    '#hero.cln-hero-start{opacity:0;transform:translateY(16px);}' +
    '#hero.cln-hero-start.cln-hero-in{opacity:1;transform:none;transition:opacity .75s cubic-bezier(.16,.84,.44,1),transform .75s cubic-bezier(.16,.84,.44,1);}' +
    /* cards: subtle lift + brand-blue glow on hover (services / news / bento) */
    '#services a[class*="min-h-[10rem]"],#news article{transition:transform .25s cubic-bezier(.16,.84,.44,1),box-shadow .25s ease,border-color .25s ease;}' +
    '#services a[class*="min-h-[10rem]"]:hover,#news article:hover{transform:translateY(-4px);box-shadow:0 14px 34px -12px rgba(45,112,240,.42);}' +
    '.ml-light #services a[class*="min-h-[10rem]"]:hover,.ml-light #news article:hover{box-shadow:0 14px 30px -14px rgba(10,115,212,.3);}' +
    '[class*="auto-rows-"] [class*="rounded-xl"]{transition:transform .25s cubic-bezier(.16,.84,.44,1),box-shadow .25s ease;}' +
    '[class*="auto-rows-"] [class*="rounded-xl"]:hover{transform:translateY(-3px);box-shadow:0 12px 30px -14px rgba(45,112,240,.38);}' +
    '.ml-light [class*="auto-rows-"] [class*="rounded-xl"]:hover{box-shadow:0 12px 26px -16px rgba(10,115,212,.28);}' +
    /* buttons: soft lift + glow (header CTA, hero "Who we are", news read-more) */
    '.cln-nav-cta{transition:transform .18s ease,box-shadow .18s ease!important;}' +
    '.cln-nav-cta:hover{transform:translateY(-1px)!important;box-shadow:0 8px 20px -6px rgba(47,125,255,.55)!important;}' +
    '#hero button{transition:transform .18s ease,box-shadow .18s ease,filter .18s ease;}' +
    '#hero button:hover{transform:translateY(-2px);box-shadow:0 12px 26px -8px rgba(47,125,255,.5);}' +
    '#news article a{transition:transform .18s ease;}#news article a:hover{transform:translateY(-1px);}' +
    '}';
  (document.head || document.documentElement).appendChild(motionCss);

  /* ----- 15q-b) Micro-interaction runtime: hero entrance arming + stat count-up ----- */
  (function motionRuntime() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // (a) Hero entrance -- only arm while the page is still gate-hidden so the opacity:0 start-state
    //     can never flash; when the gate lifts, fade/rise it in. If #hero mounts after the gate has
    //     already lifted, we skip the entrance entirely (no flash) rather than hide a visible hero.
    (function armHero(tries) {
      if (!document.documentElement.classList.contains('cln-gate')) return; // gate already lifted -> skip
      var hero = document.getElementById('hero');
      if (hero) {
        hero.classList.add('cln-hero-start');
        var lift = function () { requestAnimationFrame(function () { hero.classList.add('cln-hero-in'); }); };
        if ('MutationObserver' in window) {
          var mo = new MutationObserver(function () {
            if (!document.documentElement.classList.contains('cln-gate')) { mo.disconnect(); lift(); }
          });
          mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
          setTimeout(function () { try { mo.disconnect(); } catch (e) {} hero.classList.add('cln-hero-in'); }, 9000); // failsafe: never leave it hidden
        } else { setTimeout(lift, 600); }
        return;
      }
      if (tries < 40) setTimeout(function () { armHero(tries + 1); }, 80); // #hero not mounted yet, still gated
    })(0);

    // (b) Stat count-up: numbers >= 10 tick from 0 the first time the stat row scrolls into view.
    //     Non-numeric stats ("1st", "∞") are left untouched. The exact original string is restored on
    //     finish so any prefix/suffix ("+", "%") and locale formatting are preserved verbatim.
    if (!('IntersectionObserver' in window)) return;
    function countUp(el) {
      if (el.getAttribute('data-cln-count')) return;
      var raw = (el.textContent || '').trim();
      var m = raw.match(/\d[\d,]*/); if (!m) return;
      var target = parseInt(m[0].replace(/,/g, ''), 10);
      if (!(target >= 10)) return; // counting "1"/tiny values looks pointless -> leave static
      el.setAttribute('data-cln-count', '1');
      var start = null, dur = 1200;
      el.textContent = raw.replace(m[0], '0');
      requestAnimationFrame(function tick(ts) {
        if (start == null) start = ts;
        var p = Math.min((ts - start) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
        el.textContent = raw.replace(m[0], String(Math.round(eased * target)));
        if (p < 1) requestAnimationFrame(tick); else el.textContent = raw; // restore exact original
      });
    }
    var sio = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { countUp(en.target); sio.unobserve(en.target); } });
    }, { threshold: 0.6 });
    function scanStats() {
      [].slice.call(document.querySelectorAll('#about-info [class*="text-3xl"][class*="font-bold"]')).forEach(function (el) {
        if (!el.getAttribute('data-cln-count-seen')) { el.setAttribute('data-cln-count-seen', '1'); sio.observe(el); }
      });
    }
    var sc = 0, siv = setInterval(function () { scanStats(); if (++sc > 16) clearInterval(siv); }, 250);
    if (document.readyState !== 'loading') scanStats();
    document.addEventListener('DOMContentLoaded', scanStats);
  })();

  /* ----- 15s) Ambient motion + UX polish -----
     Motion (hero-glow breathing, accent-bar grow-in on reveal, nav-link underline slide) is
     composited-only and reduced-motion gated. The scroll-progress bar, back-to-top button and
     keyboard focus rings are UX (not decoration) so they stay on regardless of motion preference.
     Card resting depth is added on the LIGHT theme only -- soft shadows read as depth on a pale bg
     but flat/muddy on the dark bg, where the hover glow + borders already carry it. */
  var enhCss = document.createElement('style'); enhCss.id = 'cln-enhance-css';
  enhCss.textContent =
    /* Perf: pause a section's continuous CSS animations while it is scrolled off-screen (added by the
       runtime IntersectionObserver below). The original build stacks many always-on GPU animations
       (aurora hero text, shimmer/spin button, 4 partner marquees) that otherwise repaint every frame
       even when not visible, starving the compositor on integrated GPUs. */
    '.cln-anim-off,.cln-anim-off *{animation-play-state:paused!important;}' +
    '#hero.cln-anim-off canvas{visibility:hidden!important;}' + // drop the WebGL globe's compositing while the hero is scrolled away
    /* Lighten the hero CTA: hide its two most expensive decorative layers -- the -inset-full spinning
       conic-gradient (animate-spin-around, larger than the button) and the shimmer sweep. Both repaint
       every frame for a small visual flourish; the solid button + glow remain. (Globe + aurora text kept.) */
    '#hero [class*="animate-spin-around"],#hero [class*="animate-shimmer-slide"]{display:none!important;}' +
    '@media (prefers-reduced-motion: no-preference){' +
      '.cln-sec-h2::after{transition:width .7s cubic-bezier(.16,.84,.44,1);}' +
      '.cln-sec-h2.cln-reveal:not(.cln-in)::after{width:0;}' + // grows from 0 -> 60px as the heading reveals
      'header a.cln-navlink::after{content:"";position:absolute;left:.75rem;right:.75rem;bottom:.4rem;height:2px;border-radius:2px;background:linear-gradient(90deg,#2f7dff,#5cc0ff);transform:scaleX(0);transform-origin:center;transition:transform .25s cubic-bezier(.16,.84,.44,1);}' +
      'header a.cln-navlink:hover::after,header a.cln-navlink:focus-visible::after{transform:scaleX(1);}' +
    '}' +
    'header a.cln-navlink{position:relative;}' +
    /* scroll-progress bar (brand gradient, driven by transform:scaleX) */
    '#cln-progress{position:fixed;top:0;left:0;right:0;height:3px;transform:scaleX(0);transform-origin:0 50%;background:linear-gradient(90deg,#2f7dff,#3aa0ff,#5cc0ff);z-index:2147483600;pointer-events:none;will-change:transform;}' +
    'html[dir="rtl"] #cln-progress{transform-origin:100% 50%;}' +
    /* back-to-top FAB (sits ABOVE the theme toggle at bottom-right; mirrors to bottom-left in RTL) */
    /* Stack DIRECTLY above the site's theme toggle (which sits at right:1.25rem / bottom:1.25rem, 44px):
       same right offset + same width -> one clean vertical column, in both LTR and RTL (the toggle stays
       on the right in RTL, so the back-to-top must NOT mirror to the left or they'd split apart). */
    '#cln-top{position:fixed;bottom:4.75rem;right:1.25rem;width:2.75rem;height:2.75rem;border-radius:50%;border:1px solid rgba(255,255,255,.16);background:linear-gradient(180deg,#2f7dff,#1c5fe0);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:0;visibility:hidden;transform:translateY(8px);transition:opacity .25s ease,transform .25s ease,visibility .25s;box-shadow:0 10px 24px -8px rgba(20,60,160,.55);z-index:2147483000;}' +
    '#cln-top.cln-show{opacity:1;visibility:visible;transform:none;}' +
    '#cln-top:hover{filter:brightness(1.1);transform:translateY(-2px);}' +
    '#cln-top svg{width:1.15rem;height:1.15rem;}' +
    '.ml-light #cln-top{border-color:rgba(2,12,30,.1);}' +
    /* subtle resting depth on cards -- LIGHT theme only */
    '.ml-light #services a[class*="min-h-[10rem]"],.ml-light #news article,.ml-light [class*="auto-rows-"] [class*="rounded-xl"]{box-shadow:0 4px 14px -9px rgba(16,42,90,.16);}' +
    /* keyboard focus rings (a11y) -- both themes */
    'a:focus-visible,button:focus-visible,[role="button"]:focus-visible,input:focus-visible,summary:focus-visible{outline:2px solid #3aa0ff;outline-offset:2px;border-radius:6px;}' +
    '.ml-light a:focus-visible,.ml-light button:focus-visible,.ml-light [role="button"]:focus-visible{outline-color:#0a73d4;}';
  (document.head || document.documentElement).appendChild(enhCss);

  /* ----- 15s-b) UX runtime: scroll-progress bar, back-to-top button, nav-link tagging ----- */
  (function uxRuntime() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function loc() { var l = (document.documentElement.getAttribute('lang') || 'en').toLowerCase(); return (l === 'ar' || l === 'ja' || l === 'ko') ? l : 'en'; }
    var TOPLBL = { en: 'Back to top', ar: 'العودة إلى الأعلى', ja: 'トップへ戻る', ko: '맨 위로' };
    var bar = document.createElement('div'); bar.id = 'cln-progress';
    var top = document.createElement('button'); top.id = 'cln-top'; top.type = 'button';
    top.setAttribute('aria-label', TOPLBL[loc()] || TOPLBL.en);
    top.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
    function mount() { if (!document.body) return; if (!document.getElementById('cln-progress')) document.body.appendChild(bar); if (!document.getElementById('cln-top')) document.body.appendChild(top); }
    // Cache the max scroll distance so the scroll handler never reads scrollHeight per-frame (that read
    // forces a synchronous layout -> jank while scrolling). Recompute only on resize / after load.
    var maxScroll = 0;
    function recalc() { maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight); }
    var ticking = false;
    function update() {
      ticking = false;
      var st = window.pageYOffset || document.documentElement.scrollTop || 0;
      var f = maxScroll > 0 ? Math.min(Math.max(st / maxScroll, 0), 1) : 0;
      bar.style.transform = 'scaleX(' + f.toFixed(4) + ')';
      if (st > 420) top.classList.add('cln-show'); else top.classList.remove('cln-show');
    }
    function onScroll() { if (ticking) return; ticking = true; requestAnimationFrame(update); }

    // Perf: pause each heavy section's continuous animations while it is off-screen, so only what's
    // actually visible animates (the partner marquees + animated hero effects are the biggest cost).
    var pauseIO = null;
    function armPause() {
      if (pauseIO || !('IntersectionObserver' in window)) return;
      var targets = [document.getElementById('hero'), document.querySelector('#mini-slider-partners')].filter(Boolean);
      if (!targets.length) return;
      pauseIO = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) { en.target.classList.toggle('cln-anim-off', !en.isIntersecting); });
      }, { rootMargin: '150px 0px' });
      targets.forEach(function (t) { pauseIO.observe(t); });
    }
    // Tag the header's text nav links for the underline slide (skip logo, the CTA, and icon-only links).
    function tagNav() {
      [].slice.call(document.querySelectorAll('header a')).forEach(function (a) {
        if (a.id === 'logo' || a.classList.contains('cln-nav-cta') || a.classList.contains('cln-navlink')) return;
        if ((a.textContent || '').trim().length < 2 || a.querySelector('svg,img')) return;
        a.classList.add('cln-navlink');
      });
    }
    mount(); tagNav(); recalc(); armPause();
    var n = 0, iv = setInterval(function () { mount(); tagNav(); recalc(); armPause(); if (++n > 16) clearInterval(iv); }, 250);
    document.addEventListener('DOMContentLoaded', function () { mount(); tagNav(); recalc(); armPause(); update(); });
    window.addEventListener('load', function () { recalc(); update(); });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { recalc(); onScroll(); }, { passive: true });
    setTimeout(function () { recalc(); update(); }, 300);
  })();

  /* ----- 15p) Newsletter signup band (reference: sami/aecl.com) -----
     A site-wide "Stay updated" band directly above the footer. Captures the email to
     content/subscribers.json via POST /api/v1/subscribe (see api/v1/[section].js) -- works
     self-hosted and on Vercel. Localized, dark/light + RTL aware, honeypot + inline status.
     Inserted only AFTER the homepage CLS gate lifts, so the section reorder can't push it to
     the top; inner pages have no gate and get it immediately. */
  (function newsletter() {
    return; // "Stay updated" newsletter band removed site-wide (per client). Re-enable by removing this
            // line; the POST /api/v1/subscribe endpoint stays in place either way.
    var CSS = document.createElement('style'); CSS.id = 'cln-news-css';
    CSS.textContent =
      '.cln-news{max-width:70rem;margin:0 auto;padding:2.5rem 1.5rem 0;}' +
      '.cln-news-inner{border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.03);border-radius:1rem;padding:1.9rem 1.5rem;text-align:center;}' +
      '.cln-news-h{font-size:1.3rem;font-weight:800;color:#f4f4f5;margin:0 0 .35rem;}' +
      '.cln-news-sub{font-size:.9rem;color:#a1a1aa;margin:0 0 1.15rem;}' +
      '.cln-news-form{display:flex;gap:.6rem;justify-content:center;flex-wrap:wrap;max-width:34rem;margin:0 auto;}' +
      '.cln-news-input{flex:1 1 16rem;min-width:0;height:2.9rem;padding:0 1rem;border-radius:.6rem;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.04);color:#f4f4f5;font-size:.95rem;}' +
      '.cln-news-input::placeholder{color:#8b8b93;}' +
      '.cln-news-input:focus{outline:none;border-color:rgba(58,160,255,.7);}' +
      '.cln-news-btn{height:2.9rem;padding:0 1.6rem;border:0;border-radius:.6rem;background:linear-gradient(180deg,#2f7dff,#1c5fe0);color:#fff;font-weight:700;font-size:.95rem;cursor:pointer;transition:transform .2s ease,box-shadow .2s ease;box-shadow:0 6px 18px -7px rgba(47,125,255,.7);}' +
      '.cln-news-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 9px 22px -7px rgba(47,125,255,.85);}' +
      '.cln-news-btn:disabled{opacity:.6;cursor:default;}' +
      '.cln-news-status{min-height:1.2rem;margin-top:.75rem;font-size:.85rem;}' +
      '.cln-news-status.ok{color:#3aa0ff;}.cln-news-status.err{color:#f87171;}' +
      /* clip-based hide (NOT left:-9999px, which extends scrollWidth ~9999px on RTL pages) */
      '.cln-news-hp{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;opacity:0;}' +
      '.ml-light .cln-news-inner{border-color:rgba(3,18,44,.12);background:#ffffff;}' +
      '.ml-light .cln-news-h{color:#0b1220;}.ml-light .cln-news-sub{color:#52525b;}' +
      '.ml-light .cln-news-input{border-color:rgba(3,18,44,.15);background:#fff;color:#0b1220;}' +
      '.ml-light .cln-news-input::placeholder{color:#94a3b8;}' +
      '.ml-light .cln-news-status.ok{color:#0a73d4;}' +
      '@media(max-width:640px){.cln-news-form{flex-direction:column;}.cln-news-btn,.cln-news-input{width:100%;flex:0 0 auto;}}';
    (document.head || document.documentElement).appendChild(CSS);

    function loc() { var l = (document.documentElement.getAttribute('lang') || 'en').toLowerCase(); return (l === 'ar' || l === 'ko' || l === 'ja') ? l : 'en'; }
    var T = {
      h: { en: 'Stay updated', ar: 'ابقَ على اطلاع', ja: '最新情報を受け取る', ko: '최신 소식 받기' },
      sub: { en: 'Get our latest news and updates.', ar: 'احصل على آخر أخبارنا ومستجداتنا.', ja: '最新のニュースとアップデートをお届けします。', ko: '최신 뉴스와 소식을 받아보세요.' },
      ph: { en: 'Email address', ar: 'البريد الإلكتروني', ja: 'メールアドレス', ko: '이메일 주소' },
      btn: { en: 'Subscribe', ar: 'اشترك', ja: '登録', ko: '구독' },
      sending: { en: 'Subscribing…', ar: 'جارٍ الاشتراك…', ja: '登録中…', ko: '구독 중…' },
      ok: { en: "Thanks — you're subscribed.", ar: 'شكراً — تم اشتراكك.', ja: 'ご登録ありがとうございます。', ko: '구독해 주셔서 감사합니다.' },
      bad: { en: 'Please enter a valid email.', ar: 'يرجى إدخال بريد إلكتروني صحيح.', ja: '有効なメールアドレスを入力してください。', ko: '유효한 이메일을 입력해 주세요.' },
      err: { en: 'Something went wrong. Please try again.', ar: 'حدث خطأ ما. حاول مرة أخرى.', ja: 'エラーが発生しました。もう一度お試しください。', ko: '문제가 발생했습니다. 다시 시도해 주세요.' }
    };
    var RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    function inject() {
      if (document.querySelector('.cln-news')) return true;
      var footer = document.querySelector('footer'); if (!footer || !footer.parentNode) return false;
      var L = loc(); function t(k) { return T[k][L] || T[k].en; }
      var sec = document.createElement('section'); sec.className = 'cln-news'; sec.setAttribute('aria-label', t('h'));
      sec.innerHTML =
        '<div class="cln-news-inner">' +
        '<h2 class="cln-news-h">' + t('h') + '</h2>' +
        '<p class="cln-news-sub">' + t('sub') + '</p>' +
        '<form class="cln-news-form" novalidate>' +
        '<label class="cln-sr-only" for="cln-news-email">' + t('ph') + '</label>' +
        '<input id="cln-news-email" class="cln-news-input" type="email" autocomplete="email" placeholder="' + t('ph') + '" required>' +
        '<input class="cln-news-hp" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" name="company">' +
        '<button class="cln-news-btn" type="submit">' + t('btn') + '</button>' +
        '</form>' +
        '<div class="cln-news-status" role="status" aria-live="polite"></div>' +
        '</div>';
      footer.parentNode.insertBefore(sec, footer);
      var form = sec.querySelector('form'), input = sec.querySelector('.cln-news-input'),
        hp = sec.querySelector('.cln-news-hp'), btn = sec.querySelector('.cln-news-btn'), status = sec.querySelector('.cln-news-status');
      form.addEventListener('submit', function (e) {
        e.preventDefault(); status.className = 'cln-news-status';
        var email = (input.value || '').trim();
        if (!RE.test(email)) { status.textContent = t('bad'); status.className = 'cln-news-status err'; return; }
        var origLabel = btn.textContent;
        btn.disabled = true; btn.textContent = t('sending'); // loading state -> clear click feedback
        fetch('/api/v1/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email, lang: L, company: hp.value }) })
          .then(function (r) { return r.ok ? r.json() : Promise.reject(0); })
          .then(function (d) { if (d && d.ok) { status.textContent = t('ok'); status.className = 'cln-news-status ok'; input.value = ''; } else throw 0; })
          .catch(function () { status.textContent = t('err'); status.className = 'cln-news-status err'; })
          .then(function () { btn.disabled = false; btn.textContent = origLabel; });
      });
      return true;
    }
    // Wait for the homepage CLS gate to lift (reorder done) so the band lands above the footer,
    // then insert -- retrying only until the footer is present. Inner pages have no gate.
    (function loop(tries) {
      if (document.documentElement.classList.contains('cln-gate') && tries <= 100) { setTimeout(function () { loop(tries + 1); }, 60); return; }
      if (inject() || tries > 160) return;
      setTimeout(function () { loop(tries + 1); }, 120);
    })(0);
  })();

  /* ----- 15r) Contact info as icon buttons -----
     Present the contact methods as a row of colour-coded icon chips (like a share row) pointing to
     each channel -- Email, Call, WhatsApp, LinkedIn, Location -- with the address + hours kept as a
     small reference line. Replaces the wordier CTA + 4-cell grid; runs on the homepage contact section
     (injected) and the standalone /contact page. Localized, dark/light aware, honours the .cln-contact. */
  (function contactIcons() {
    var CSS = document.createElement('style'); CSS.id = 'cln-cbtn-css';
    CSS.textContent =
      /* Real brand app-icons: full-colour marks (Outlook / Call / WhatsApp / LinkedIn / Google Maps) on
         clean white rounded tiles -- no text labels (the accessible name lives on aria-label/title). */
      '.cln-cbtns{display:flex;flex-wrap:wrap;justify-content:center;gap:1.35rem;margin:1.9rem auto 0;max-width:42rem;}' +
      '.cln-cbtn{display:flex;align-items:center;justify-content:center;text-decoration:none;}' +
      '.cln-cbtn-ico{width:3.5rem;height:3.5rem;border-radius:1.05rem;display:flex;align-items:center;justify-content:center;background:#fff;border:1px solid rgba(0,0,0,.06);box-shadow:0 7px 18px -8px rgba(0,0,0,.5);transition:transform .2s ease,box-shadow .2s ease;}' +
      '.cln-cbtn:hover .cln-cbtn-ico,.cln-cbtn:focus-visible .cln-cbtn-ico{transform:translateY(-3px);box-shadow:0 14px 26px -8px rgba(0,0,0,.55);}' +
      '.ml-light .cln-cbtn-ico{box-shadow:0 7px 18px -9px rgba(16,42,90,.3);border-color:rgba(16,42,90,.10);}' +
      '.cln-cbtn-ico svg{width:2.05rem;height:2.05rem;display:block;}' +
      /* "Begin a conversation" CTA (homepage) -> contact page; the contact page shows the form instead */
      '.cln-cbtn-cta{display:inline-flex;align-items:center;gap:.5rem;margin:2.1rem auto 0;padding:.85rem 1.7rem;border-radius:.75rem;background:linear-gradient(180deg,#2f7dff,#1c5fe0);color:#fff;font-weight:700;font-size:1rem;text-decoration:none;box-shadow:0 10px 24px -8px rgba(47,125,255,.6);transition:transform .18s ease,box-shadow .18s ease;}' +
      '.cln-cbtn-cta:hover{transform:translateY(-2px);box-shadow:0 14px 30px -8px rgba(47,125,255,.75);}' +
      '.cln-cbtn-cta svg{width:1.15rem;height:1.15rem;}' +
      /* keep button text WHITE in both themes -- the light theme recolours <a> to blue, which made the
         gradient button read blue-on-blue (invisible). Force it on the CTA link + the form submit. */
      '.cln-cbtn-cta,.cln-cbtn-cta span,.cln-cbtn-cta:hover,.cln-cbtn-cta:focus,.cln-cf-btn{color:#fff !important;}' +
      '.cln-cbtn-cta svg{stroke:#fff !important;}' +
      '.cln-cbtn-ctawrap{text-align:center;margin-bottom:1rem;}' +
      /* contact-page message form */
      '.cln-cform-wrap{max-width:34rem;margin:2.4rem auto 0;text-align:start;}' +
      '.cln-cform{display:flex;flex-direction:column;gap:.8rem;}' +
      '.cln-cf-in{width:100%;box-sizing:border-box;padding:.8rem 1rem;border-radius:.7rem;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.04);color:#f4f4f5;font-size:.98rem;font-family:inherit;}' +
      '.cln-cf-in::placeholder{color:#8b8b93;}' +
      '.cln-cf-in:focus{outline:none;border-color:rgba(58,160,255,.7);box-shadow:0 0 0 3px rgba(58,160,255,.15);}' +
      '.cln-cf-msg{resize:vertical;min-height:6rem;}' +
      '.cln-cf-btn{align-self:center;margin-top:.3rem;padding:.85rem 2rem;border:0;border-radius:.7rem;background:linear-gradient(180deg,#2f7dff,#1c5fe0);color:#fff;font-weight:700;font-size:1rem;cursor:pointer;box-shadow:0 10px 24px -8px rgba(47,125,255,.6);transition:transform .18s ease,box-shadow .18s ease;}' +
      '.cln-cf-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 14px 30px -8px rgba(47,125,255,.75);}' +
      '.cln-cf-btn:disabled{opacity:.6;cursor:default;}' +
      '.cln-cf-status{min-height:1.2rem;margin:.4rem 0 0;font-size:.9rem;text-align:center;}' +
      '.cln-cf-status.ok{color:#3aa0ff;}.cln-cf-status.err{color:#f87171;}' +
      '.cln-cf-hp{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;opacity:0;}' +
      '.ml-light .cln-cf-in{border-color:rgba(16,42,90,.15);background:#fff;color:#0b1220;}' +
      '.ml-light .cln-cf-in::placeholder{color:#94a3b8;}' +
      '.ml-light .cln-cf-status.ok{color:#0a73d4;}' +
      /* proper breathing room between the contact block and the footer below it (homepage) */
      '.cln-contact{padding-bottom:6.5rem !important;}' +
      /* the contact PAGE wraps the block in an article template with huge py-40 + pb-28 padding, which
         stacked with the above left a big empty gap above AND below the form. Tighten it on that page. */
      '.cln-contact-page .cln-contact{padding-bottom:1.5rem !important;}' +
      '.cln-contact-page [class*="py-40"]:has(.cln-contact){padding-top:3rem !important;padding-bottom:3rem !important;}' +
      '.cln-contact-page [class*="pb-28"]:has(.cln-contact){padding-bottom:1.5rem !important;padding-top:2rem !important;}' +
      /* hide the stray article-template date that renders at the top of the contact page */
      '.cln-cdate-hide{display:none !important;}';
    (document.head || document.documentElement).appendChild(CSS);

    function loc() { var l = (document.documentElement.getAttribute('lang') || 'en').toLowerCase(); return (l === 'ar' || l === 'ko' || l === 'ja') ? l : 'en'; }
    var S = { // real brand marks in their own colours (rendered on white app-icon tiles)
      outlook: '<svg viewBox="0 0 32 32"><rect x="3" y="7" width="17" height="18" rx="2.6" fill="#0F6CBD"/><path fill="#fff" d="M11.5 11.6c-3 0-4.9 2.5-4.9 6.4s1.9 6.4 4.9 6.4 4.9-2.5 4.9-6.4-1.9-6.4-4.9-6.4zm0 10.1c-1.6 0-2.5-1.5-2.5-3.7s.9-3.7 2.5-3.7 2.5 1.5 2.5 3.7-.9 3.7-2.5 3.7z"/><path fill="#28A8EA" d="M20.5 10H29a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-8.5V10z"/><path fill="#fff" d="M30 11.5l-4.7 3.1-4.5-3v-.9l4.5 3 4.7-3.1z" opacity=".85"/></svg>',
      phone: '<svg viewBox="0 0 24 24" fill="#1BAA55"><path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .3l-2.2 2.2c-2.8-1.5-5.2-3.9-6.7-6.7l2.2-2.2c.3-.3.4-.6.3-1-.4-1.1-.6-2.4-.6-3.6 0-.6-.5-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.5 1-1V16.5c0-.5-.4-1-1-1z"/></svg>',
      wa: '<svg viewBox="0 0 24 24" fill="#25D366"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.16-3.48-8.41Z"/></svg>',
      in: '<svg viewBox="0 0 24 24" fill="#0A66C2"><path d="M4.98 3.5c0 1.38-1.11 2.5-2.48 2.5S.02 4.88.02 3.5 1.13 1 2.5 1s2.48 1.12 2.48 2.5zM5 8H0v16h5V8zm7.98 0H8.01v16h4.97v-8.4c0-4.67 6.03-5.05 6.03 0V24H24V13.87c0-7.88-8.92-7.59-11.02-3.71V8z"/></svg>',
      gmaps: '<svg viewBox="0 0 24 24"><path fill="#34A853" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><path fill="#EA4335" d="M12 9 7.76 4.76A6 6 0 0 1 16.24 4.76Z"/><path fill="#FBBC04" d="M12 9 16.24 4.76A6 6 0 0 1 16.24 13.24Z"/><path fill="#4285F4" d="M12 9 7.76 13.24A6 6 0 0 0 7.76 4.76Z"/><circle cx="12" cy="9" r="3" fill="#fff"/><circle cx="12" cy="9" r="1.6" fill="#1A73E8"/></svg>',
      chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
    };
    var mapsQ = encodeURIComponent('3Lines Advanced Technologies Company, Building 2148, King Abdullah Branch Road, Riyadh 13215, Saudi Arabia');
    var BTNS = [
      { c: 'email', href: 'mailto:info@3lines.com.sa', svg: S.outlook, lbl: { en: 'Email', ar: 'البريد', ja: 'メール', ko: '이메일' } },
      { c: 'call', href: 'tel:+966112252433', svg: S.phone, lbl: { en: 'Call', ar: 'اتصل', ja: '電話', ko: '전화' } },
      { c: 'wa', href: 'https://wa.me/966112252433', ext: 1, svg: S.wa, lbl: { en: 'WhatsApp', ar: 'واتساب', ja: 'WhatsApp', ko: 'WhatsApp' } },
      { c: 'in', href: 'https://www.linkedin.com/company/3lines', ext: 1, svg: S.in, lbl: { en: 'LinkedIn', ar: 'لينكدإن', ja: 'LinkedIn', ko: 'LinkedIn' } },
      { c: 'loc', href: 'https://www.google.com/maps/search/?api=1&query=' + mapsQ, ext: 1, svg: S.gmaps, lbl: { en: 'Location', ar: 'الموقع', ja: '所在地', ko: '위치' } }
    ];
    var CTA = { en: 'Begin a conversation', ar: 'ابدأ محادثة', ja: 'お問い合わせを始める', ko: '문의 시작하기' };
    var F = {
      name: { en: 'Your name', ar: 'الاسم', ja: 'お名前', ko: '이름' },
      email: { en: 'Email address', ar: 'البريد الإلكتروني', ja: 'メールアドレス', ko: '이메일 주소' },
      msg: { en: 'How can we help?', ar: 'كيف يمكننا مساعدتك؟', ja: 'ご用件', ko: '무엇을 도와드릴까요?' },
      send: { en: 'Send message', ar: 'إرسال الرسالة', ja: '送信する', ko: '메시지 보내기' },
      sending: { en: 'Sending…', ar: 'جارٍ الإرسال…', ja: '送信中…', ko: '전송 중…' },
      ok: { en: "Thanks — we'll get back to you shortly.", ar: 'شكراً — سنعاود التواصل معك قريباً.', ja: 'ありがとうございます。折り返しご連絡いたします。', ko: '감사합니다. 곧 연락드리겠습니다.' },
      bad: { en: 'Please add your name, a valid email, and a message.', ar: 'يرجى إدخال الاسم وبريد إلكتروني صحيح ورسالة.', ja: 'お名前・有効なメール・メッセージをご入力ください。', ko: '이름, 유효한 이메일, 메시지를 입력해 주세요.' },
      err: { en: 'Something went wrong. Please try again.', ar: 'حدث خطأ ما. حاول مرة أخرى.', ja: 'エラーが発生しました。もう一度お試しください。', ko: '문제가 발생했습니다. 다시 시도해 주세요.' }
    };
    var CRE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    function esc(s) { return (s || '').replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }
    // Homepage (and inner pages): a CTA button that takes visitors to the contact page's form.
    function buildCTA(c, L) {
      if (c.querySelector('.cln-cbtn-cta')) return;
      var wrap = document.createElement('div'); wrap.className = 'cln-cbtn-ctawrap';
      // Link to the .html URL the nav itself uses -- the clean /xx/contact path isn't an SPA route and bounces home.
      var a = document.createElement('a'); a.className = 'cln-cbtn-cta'; a.href = '/' + L + '/contact.html';
      a.innerHTML = S.chat + '<span>' + esc(CTA[L] || CTA.en) + '</span>';
      wrap.appendChild(a); c.appendChild(wrap);
    }
    // Contact page: a real message form -> POST /api/v1/contact (stored server-side, honeypot-guarded).
    function buildForm(c, L) {
      if (c.querySelector('.cln-cform')) return;
      var ph = function (k) { return esc(F[k][L] || F[k].en); };
      var f = document.createElement('form'); f.className = 'cln-cform'; f.setAttribute('novalidate', '');
      f.innerHTML =
        '<input class="cln-cf-hp" type="text" name="company" tabindex="-1" autocomplete="off" aria-hidden="true">' +
        '<input class="cln-cf-in" name="name" type="text" required placeholder="' + ph('name') + '" aria-label="' + ph('name') + '">' +
        '<input class="cln-cf-in" name="email" type="email" required placeholder="' + ph('email') + '" aria-label="' + ph('email') + '">' +
        '<textarea class="cln-cf-in cln-cf-msg" name="message" rows="4" required placeholder="' + ph('msg') + '" aria-label="' + ph('msg') + '"></textarea>' +
        '<button class="cln-cf-btn" type="submit">' + esc(F.send[L] || F.send.en) + '</button>' +
        '<p class="cln-cf-status" aria-live="polite"></p>';
      var wrap = document.createElement('div'); wrap.className = 'cln-cform-wrap'; wrap.appendChild(f); c.appendChild(wrap);
      var status = f.querySelector('.cln-cf-status'), btn = f.querySelector('.cln-cf-btn');
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = f.name.value.trim(), email = f.email.value.trim(), message = f.message.value.trim();
        status.className = 'cln-cf-status';
        if (!name || !CRE.test(email) || message.length < 2) { status.textContent = F.bad[L] || F.bad.en; status.classList.add('err'); return; }
        btn.disabled = true; var old = btn.textContent; btn.textContent = F.sending[L] || F.sending.en;
        fetch('/api/v1/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name, email: email, message: message, lang: L, company: f.company.value }) })
          .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
          .then(function () { status.textContent = F.ok[L] || F.ok.en; status.classList.add('ok'); f.reset(); })
          .catch(function () { status.textContent = F.err[L] || F.err.en; status.classList.add('err'); })
          .then(function () { btn.disabled = false; btn.textContent = old; });
      });
    }
    // The contact page is built from an article template that stamps a published date near the top --
    // nonsensical on a Contact page. Hide short date-looking nodes (weekday names across locales, or a
    // "D Month YYYY" line). Scoped to the contact page, so real dates elsewhere (news) are untouched.
    function hideStrayDate() {
      var wd = /(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|الأحد|الإثنين|الاثنين|الثلاثاء|الأربعاء|الخميس|الجمعة|السبت|日曜|月曜|火曜|水曜|木曜|金曜|土曜|일요일|월요일|화요일|수요일|목요일|금요일|토요일)/;
      var dt = /^\s*\d{1,2}\s+\S+\s+20\d\d\s*$|20\d\d\s*年.*\d{1,2}\s*日|20\d\d\s*[.년]\s*\d{1,2}/;
      [].slice.call(document.querySelectorAll('time, span, p, div, h2, h3')).forEach(function (e) {
        if (e.childElementCount || e.closest('footer') || e.closest('.cln-contact')) return;
        var t = (e.textContent || '').trim();
        if (t.length > 0 && t.length < 40 && /\d/.test(t) && (wd.test(t) || dt.test(t))) e.classList.add('cln-cdate-hide');
      });
    }
    function bodyOf(it, sep) {
      if (!it) return '';
      var cl = it.cloneNode(true);
      var h = cl.querySelector('h3'); if (h) h.remove();
      var ic = cl.querySelector('.cln-contact-ico'); if (ic) ic.remove();
      // break at <br> / block boundaries so multi-line address & hours don't run together
      var tmp = document.createElement('div');
      tmp.innerHTML = cl.innerHTML.replace(/<br\s*\/?>|<\/(p|small|div|li|h[1-6])>/gi, '|||');
      var parts = tmp.textContent.split('|||').map(function (s) { return s.replace(/\s+/g, ' ').trim(); }).filter(Boolean);
      return parts.join(sep || ', ');
    }
    function run() {
      var c = document.querySelector('.cln-contact');
      if (!c || c.querySelector('.cln-cbtns')) return !!c; // idempotent
      var L = loc();
      var row = document.createElement('div'); row.className = 'cln-cbtns';
      BTNS.forEach(function (b) {
        var a = document.createElement('a'); a.className = 'cln-cbtn cln-cbtn-' + b.c; a.href = b.href;
        if (b.ext) { a.target = '_blank'; a.rel = 'noopener'; }
        var lb = b.lbl[L] || b.lbl.en; a.setAttribute('aria-label', lb); a.setAttribute('title', lb);
        a.innerHTML = '<span class="cln-cbtn-ico">' + b.svg + '</span>'; // icons only -- no text labels below
        row.appendChild(a);
      });
      var lead = c.querySelector('.cln-contact-lead');
      if (lead && lead.parentNode === c) c.insertBefore(row, lead.nextSibling); else c.insertBefore(row, c.firstChild);
      // Drop the wordy CTA / grid / linkedin line. The address + business hours are intentionally NOT
      // repeated here (they already live in the footer address strip) -- the Contact section is now just
      // the lead line + the coloured channel buttons, per client request.
      var kill = ['.cln-contact-cta', '.cln-contact-grid', '.cln-contact-linkedin'];
      kill.forEach(function (sel) { var el = c.querySelector(sel); if (el) el.style.display = 'none'; });
      // The contact PAGE gets a real message form; everywhere else gets a CTA button that links to it.
      if (/\/contact(\/|$|\.html)/.test(location.pathname)) { document.documentElement.classList.add('cln-contact-page'); buildForm(c, L); hideStrayDate(); } else buildCTA(c, L);
      return true;
    }
    var n = 0, iv = setInterval(function () { if (run() || ++n > 60) clearInterval(iv); }, 200);
    if (document.readyState !== 'loading') run();
    document.addEventListener('DOMContentLoaded', run);
  })();

  /* ----- 16b) Tag flat/LIGHT partner logos -----
     The partner strip (rule 16) shows every logo in its REAL colour, at full opacity, all the time.
     A few logos are flat WHITE/near-white assets (Airbus, MI, SAMI Advanced ...) -- on the light
     theme's pale bg `filter:none` would make them white-on-white and vanish. Sample each logo's
     pixels: if its visible pixels are mostly bright AND carry little real colour, tag it
     `cln-light-logo` so light mode inverts it dark (coloured/dark logos read fine as-is on both
     backgrounds). Same-origin assets, so the canvas isn't tainted. */
  (function tagMonoLogos() {
    function sample(im) {
      try {
        var w = 24, h = 24, c = document.createElement('canvas'); c.width = w; c.height = h;
        var x = c.getContext('2d'); x.drawImage(im, 0, 0, w, h);
        var d = x.getImageData(0, 0, w, h).data, sumLum = 0, opq = 0, colored = 0, trans = 0, tot = 0;
        for (var i = 0; i < d.length; i += 4) {
          tot++;
          if (d[i + 3] < 30) { trans++; continue; } // transparent pixel
          var r = d[i], g = d[i + 1], b = d[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b);
          sumLum += (0.299 * r + 0.587 * g + 0.114 * b) / 255; opq++;
          if (mx && (mx - mn) / mx > 0.3) colored++; // a clearly-coloured pixel
        }
        if (!opq) return;
        var avgLum = sumLum / opq, colorFrac = colored / opq, transFrac = trans / tot;
        // Only invert TRUE white-on-transparent logos: they must have a genuinely transparent bg
        // (transFrac) -- a logo baked onto an opaque white CARD (e.g. a .jpg) must NOT be inverted or
        // its card turns into a black block. Among those, invert the bright, low-colour ones (they'd
        // go white-on-white on the light theme); very bright logos count even with some edge tint.
        if (transFrac > 0.1 && avgLum > 0.6 && (avgLum > 0.78 || colorFrac < 0.25)) im.classList.add('cln-light-logo');
      } catch (e) { /* tainted/unsupported -> leave untagged (shows real colour) */ }
    }
    function consider(im) {
      if (im.getAttribute('data-cln-mono')) return; // already handled (guard also rides onto clones)
      if (im.complete && im.naturalWidth) { im.setAttribute('data-cln-mono', '1'); sample(im); }
      else im.addEventListener('load', function () { im.setAttribute('data-cln-mono', '1'); sample(im); });
    }
    function scan() {
      var logos = document.querySelectorAll('img[class*="group-hover:grayscale-0"]');
      for (var i = 0; i < logos.length; i++) consider(logos[i]);
    }
    scan();
    // The partner carousel is React-rendered (mounts after hydration; Embla also clones slides for
    // looping), so the logos usually don't exist on first run -- watch for late-added ones, then stop.
    if ('MutationObserver' in window) {
      var pend = false;
      var mo = new MutationObserver(function () {
        if (pend) return; pend = true; setTimeout(function () { pend = false; scan(); }, 120);
      });
      mo.observe(document.body || document.documentElement, { childList: true, subtree: true });
      setTimeout(function () { mo.disconnect(); scan(); }, 6000);
    } else {
      [600, 1500, 3000, 5000].forEach(function (ms) { setTimeout(scan, ms); });
    }
  })();

  /* ----- 2a') Pause the hero globe when it scrolls out of view -----
     The WebGL globe keeps rendering even when offscreen, costing frame time during scroll and
     burning idle CPU. Hide its canvas when #hero leaves the viewport; restore (and nudge a
     resize so the globe re-fits) when it returns. */
  function pauseGlobeOffscreen() {
    var hero = document.querySelector('#hero');
    if (!hero || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      var on = entries[0] && entries[0].isIntersecting;
      var c = hero.querySelector('canvas'); if (!c) return;
      c.style.display = on ? '' : 'none';
      if (on) { try { window.dispatchEvent(new Event('resize')); } catch (e) {} }
    }, { rootMargin: '200px 0px' });
    io.observe(hero);
  }
  // run after the globe has mounted
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(pauseGlobeOffscreen, 1200); });
  else setTimeout(pauseGlobeOffscreen, 1200);

  /* ----- 2c) Interior-page header clearance -----
     The fixed header is ~132px tall after the rebrand's larger logo, but some interior pages reserve
     less top padding than that (service detail pages use pt-24 = 96px), so their breadcrumb/hero
     tucked BEHIND the header when you open the page. On non-landing pages, bump the top content
     wrapper so it clears the LIVE header height. Landing is excluded -- its hero is meant to sit
     under the (transparent) header. Conditional, so pages that already clear it are left untouched. */
  (function clearHeaderOverlap() {
    var p = location.pathname.replace(/\/+$/, '');
    if (/^\/(en|ar|ko|ja)(\.html)?$/.test(p) || p === '' || p === '/index.html') return; // skip landing
    function run() {
      var header = document.querySelector('header[class*="fixed"]');
      if (!header) return;
      var hh = Math.round(header.getBoundingClientRect().height);
      if (hh < 40) return;
      // first content wrapper that isn't inside the header itself
      var wrap = Array.prototype.find.call(document.querySelectorAll('[class*="max-w-7xl"]'), function (el) { return !header.contains(el); });
      if (!wrap) return;
      if (wrap.getBoundingClientRect().top <= hh) { // wrapper starts under/behind the header
        var need = hh + 20;
        if ((parseFloat(getComputedStyle(wrap).paddingTop) || 0) < need) wrap.style.paddingTop = need + 'px';
      }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
    setTimeout(run, 600); // re-check after fonts/layout settle (header height can shift)
  })();

  /* ----- 2d) Polish the simple Service detail pages -----
     The 9 non-redesigned service pages are sparse: a small <h4> title + the description
     buried in huge pt-28/pb-28 padding, with no hierarchy. Without touching content, give
     them a proper hero: an eyebrow, a large title with an accent rule, a readable lead
     paragraph, and sane spacing. (Skips the already-rich "Maintaining & Repairing" page.) */
  (function () {
    if (!/\/services\/[^\/]+\.html$/.test(location.pathname)) return;
    if (document.querySelector('.relative.overflow-hidden.rounded-2xl')) return; // rich page already
    var root = document.documentElement; root.classList.add('cln-svc-detail');
    var EYEBROW = { en: 'Service', ar: 'خدمة', ko: '서비스', ja: 'サービス' };
    var s = document.createElement('style'); s.id = 'cln-svc-css';
    s.textContent =
      '.cln-svc-detail .relative.pt-10{padding-top:1.25rem !important;}' +
      '.cln-svc-detail h4{font-size:clamp(1.9rem,4.2vw,2.7rem) !important;line-height:1.12 !important;letter-spacing:-.015em !important;}' +
      '.cln-svc-detail .flex.pb-28.pt-28{padding-top:1rem !important;padding-bottom:2.5rem !important;}' +
      '.cln-svc-detail .prose-invert{max-width:46rem !important;font-size:1.18rem !important;line-height:1.75 !important;}' +
      '@media(min-width:768px){.cln-svc-detail h4::after{content:"";display:block;width:60px;height:4px;margin-top:1rem;border-radius:2px;background:linear-gradient(90deg,#3aa0ff,#5cc0ff);}}';
    (document.head || document.documentElement).appendChild(s);
    // add a small localized eyebrow above the title
    function addEyebrow() {
      var h = document.querySelector('.cln-svc-detail h4'); if (!h || h.previousElementSibling && h.previousElementSibling.className === 'cln-svc-eyebrow') return;
      var L = (typeof lang === 'function') ? lang() : 'en';
      var eb = document.createElement('div'); eb.className = 'cln-svc-eyebrow';
      eb.textContent = EYEBROW[L] || EYEBROW.en;
      eb.style.cssText = 'font-size:.72rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#5cc0ff;margin-bottom:.4rem;';
      h.parentNode.insertBefore(eb, h);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addEyebrow); else addEyebrow();
  })();

  /* ----- 2b) Footer polish: relocate the social icon from the brand column into the
     bottom bar (right side), so the bottom reads "© ...  ·  [in]" — balanced and tidy,
     instead of an icon dangling alone in a tall left column. ----- */
  function refineFooter() {
    var footer = document.querySelector('footer'); if (!footer) return;
    var bar = footer.querySelector('.border-t'); if (!bar) return;
    if (footer.querySelector('.cln-foot-social')) return; // idempotent
    var social = footer.querySelector('a[href*="linkedin.com"]');
    if (!social) return;
    var holder = social.parentElement; // the .flex.items-center wrapper in the brand column
    var socialWrap = document.createElement('li');
    socialWrap.className = 'cln-foot-social'; // a list item in the "Get in touch" <ul> -> same gap as email/phone
    social.className = 'text-sm/6 text-zinc-400 hover:text-zinc-300 inline-flex items-center gap-2'; // mirror email/phone links (icon + label)
    var lnSvg = social.querySelector('svg'); if (lnSvg) { lnSvg.removeAttribute('class'); lnSvg.setAttribute('width', '16'); lnSvg.setAttribute('height', '16'); }
    var lnTxt = social.querySelector('.sr-only'); // the existing "Linkedin" label -> make it visible so the row has the same height as email/phone
    if (lnTxt) { lnTxt.removeAttribute('class'); lnTxt.textContent = 'LinkedIn'; } else { social.appendChild(document.createTextNode('LinkedIn')); }
    socialWrap.appendChild(social);
    if (holder && !holder.querySelector('a')) holder.style.display = 'none'; // hide now-empty wrapper

    /* Lift the long address line out of the tall brand column into a compact full-width
       strip just above the copyright bar. This balances the main row (brand ≈ link-column
       height) and removes the big empty area on the right — a clean, production-style base. */
    var brandCol = footer.querySelector('.space-y-8');
    if (brandCol) {
      var ps = brandCol.querySelectorAll('p');
      var addr = ps.length >= 1 ? ps[ps.length - 1] : null; // address/registration block (now the only brand <p> after the company blurb was removed)
      if (addr && bar.parentElement && !addr.classList.contains('cln-foot-addr')) {
        addr.classList.add('cln-foot-addr');
        bar.parentElement.insertBefore(addr, bar); // place it directly above the copyright bar
      }
    }

    /* Add a "Get in touch" column (email + phone) so the footer is a balanced 4-column
       grid with real, clickable contact info — production-grade and useful. */
    var region = footer.querySelector('[class*="xl:col-span-2"]');
    if (region && !region.querySelector('.cln-foot-contact')) {
      var L = lang();
      var heading = { en: 'Get in touch', ar: 'تواصل معنا', ko: '문의하기', ja: 'お問い合わせ' }[L] || 'Get in touch';
      var MAIL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>';
      var PHONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
      var col = document.createElement('div');
      col.className = 'cln-foot-contact';
      col.innerHTML =
        '<h3 class="text-sm/6 font-semibold text-white">' + heading + '</h3>' +
        '<ul role="list" class="mt-6 space-y-4">' +
          '<li><a class="text-sm/6 text-zinc-400 hover:text-zinc-300" href="mailto:info@3lines.com.sa">' + MAIL + 'info@3lines.com.sa</a></li>' +
          '<li><a class="text-sm/6 text-zinc-400 hover:text-zinc-300" href="tel:+966112252433" dir="ltr">' + PHONE + '+966 11 225 2433</a></li>' +
        '</ul>';
      region.appendChild(col); // becomes the 4th flex column, after Legal
      (col.querySelector('ul') || col).appendChild(socialWrap); // INSIDE the <ul> so it gets the same space-y-4 gap as email/phone
    }
    if (!socialWrap.parentNode) bar.appendChild(socialWrap); // fallback: keep it if the column wasn't built
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refineFooter);
  else refineFooter();

  /* ----- 3) CMS overrides (service cards + footer text) ----- */
  function lang() {
    var l = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
    return (l === 'ar' || l === 'ko' || l === 'ja') ? l : 'en';
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
    // First paragraph = company description; second = address+reg block (may have been
    // relocated below the grid by refineFooter, so look for it across the whole footer).
    // Footer company-description blurb intentionally NOT injected (removed at the client's
    // request). The brand column is just the logo now; the address strip lives above the
    // copyright bar (relocated by refineFooter) and is refreshed below.
    var addrP = footer.querySelector('.cln-foot-addr') || paras[0];
    if (addrP) {
      // Render the info strip as icon + text segments: location, phone (tel: link), CR, VAT.
      var ar = lang() === 'ar';
      var ic = function (p) { return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex:0 0 auto;opacity:.85;">' + p + '</svg>'; };
      var PIN = ic('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>');
      var PHN = ic('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>');
      var DOC = ic('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>');
      var TAX = ic('<rect width="16" height="20" x="4" y="2" rx="2"/><path d="m15 8-6 6"/><path d="M9 8h.01"/><path d="M15 14h.01"/>');
      var seg = function (icon, text, href, ext) {
        var body = icon + '<span>' + text + '</span>';
        var sty = 'display:inline-flex;align-items:center;gap:.4rem;';
        return href
          ? '<a href="' + href + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + ' style="' + sty + 'color:inherit;text-decoration:none;">' + body + '</a>'
          : '<span style="' + sty + '">' + body + '</span>';
      };
      var segs = [];
      if (info.address) segs.push(seg(PIN, info.address, 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(info.address), true));
      // phone intentionally NOT shown here — it lives in the "Get in touch" column
      if (info.commercialRegNo) segs.push(seg(DOC, (ar ? 'السجل التجاري ' : 'CR No. ') + info.commercialRegNo));
      if (info.vatRegNo) segs.push(seg(TAX, (ar ? 'الرقم الضريبي ' : 'VAT No. ') + info.vatRegNo));
      addrP.innerHTML = segs.join('');
      addrP.style.cssText = 'display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:.45rem 1.4rem;';
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

  /* ----- 3c) Home "News" section -----
     The full News listing is now a native section on the landing page (the React
     latest-news component mounts on <div id="latest-news"> inside <section id="news">,
     added directly in en/ar/ko/ja .html). The News nav button smooth-scrolls to #news
     (see section 6). No JS injection needed here anymore. */

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

  /* ----- 4) Language switcher: all four languages (en/ar/ko/ja) now have pages, so the
     full switcher is shown. Any not-yet-translated ko/ja route still falls back to its
     English equivalent server-side (server.js), so no link 404s. */

  /* ----- 5) Light / dark theme toggle -----
     Dark is the default; light is opt-in. Light mode = the /assets/light-theme.css
     <link> is present (a no-FOUC <head> script injects it early on reload). This
     button adds/removes that link live and remembers the choice in localStorage. */
  var LIGHT_LINK_ID = 'ml-light-theme', THEME_KEY = 'ml-theme';
  var SUN = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
  var MOON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
  var themeBtn = null;
  function isLight() { return !!document.getElementById(LIGHT_LINK_ID); }
  /* Appearance modes: 'light' | 'dark' | 'system' (system follows the OS preference). */
  var mqDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function getMode() { try { var m = localStorage.getItem(THEME_KEY); return (m === 'light' || m === 'system') ? m : 'dark'; } catch (e) { return 'dark'; } }
  function modeIsLight() { var m = getMode(); return m === 'light' || (m === 'system' && !!(mqDark && !mqDark.matches)); }
  function paintThemeBtn() {
    if (!themeBtn) return;
    var light = isLight();
    themeBtn.innerHTML = light ? MOON : SUN; // icon only
    themeBtn.style.background = light ? 'rgba(255,255,255,.95)' : 'rgba(20,26,36,.92)';
    themeBtn.style.color = light ? '#0f172a' : '#e5e7eb';
    themeBtn.style.borderColor = light ? 'rgba(15,23,42,.15)' : 'rgba(92,192,255,.5)';
    themeBtn.title = light ? 'Switch to dark theme' : 'Switch to light theme';
    themeBtn.setAttribute('aria-label', themeBtn.title);
  }
  function applyEffective() {
    var light = modeIsLight();
    var link = document.getElementById(LIGHT_LINK_ID);
    if (light && !link) {
      link = document.createElement('link');
      link.id = LIGHT_LINK_ID; link.rel = 'stylesheet'; link.href = '/assets/light-theme.css';
      document.head.appendChild(link);
      document.documentElement.classList.add('ml-light');
    } else if (!light && link) {
      link.parentNode.removeChild(link);
      document.documentElement.classList.remove('ml-light');
    }
    syncDarkClass();
    paintThemeBtn();
    paintMoreAppearance();
  }
  function setMode(mode) { try { localStorage.setItem(THEME_KEY, mode); } catch (e) {} applyEffective(); }
  function setLight(on) { setMode(on ? 'light' : 'dark'); } // floating button = explicit light/dark
  // when in 'system' mode, follow live OS changes
  if (mqDark && mqDark.addEventListener) mqDark.addEventListener('change', function () { if (getMode() === 'system') applyEffective(); });
  // The page hardcodes <body class="dark">. In light mode we must REMOVE it, otherwise
  // every Tailwind `dark:` variant (e.g. nav buttons' dark hover/active bg) still applies
  // and flashes black on click. Keep it in dark mode.
  function syncDarkClass() {
    var dark = !isLight();
    if (document.body) document.body.classList.toggle('dark', dark);
    document.documentElement.classList.toggle('dark', dark);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyEffective);
  else applyEffective();
  function buildThemeBtn() {
    if (document.getElementById('ml-theme-toggle') || !document.body) return;
    themeBtn = document.createElement('button');
    themeBtn.id = 'ml-theme-toggle';
    themeBtn.type = 'button';
    themeBtn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:2147483000;width:44px;height:44px;border-radius:9999px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:1px solid rgba(92,192,255,.5);box-shadow:0 6px 22px rgba(0,0,0,.4);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);transition:transform .15s ease;';
    themeBtn.addEventListener('mouseenter', function () { themeBtn.style.transform = 'scale(1.08)'; });
    themeBtn.addEventListener('mouseleave', function () { themeBtn.style.transform = 'scale(1)'; });
    themeBtn.addEventListener('click', function () { setLight(!isLight()); });
    document.body.appendChild(themeBtn);
    paintThemeBtn();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildThemeBtn);
  else buildThemeBtn();

  /* ----- 6) Single-page site -----
     The landing carries every main section (hero, services, partners, news, + About & Contact
     pulled in from their pages). A main-nav click smooth-scrolls to its section when we're on
     the landing, and otherwise navigates to the landing + that section's hash — so the whole
     site funnels through one scrolling page and the fixed header never reloads mid-scroll. ----- */
  (function () {
    var LANGS = ['en', 'ar', 'ko', 'ja'];
    function lng() { var l = (document.documentElement.getAttribute('lang') || 'en').toLowerCase(); return LANGS.indexOf(l) >= 0 ? l : 'en'; }
    function homePath() { return '/' + lng(); }
    function isHome() { var p = location.pathname.replace(/\/+$/, ''); return /^\/(en|ar|ko|ja)(\.html)?$/.test(p) || p === '' || p === '/index.html'; }
    var OFFSET = 92; // fallback only; the real clearance is measured from the live fixed header --
                     // it's ~132px tall after the rebrand's larger logo, so a hardcoded 92 left
                     // section headings tucked behind it. See headerOffset().
    function headerOffset() {
      var h = document.querySelector('header[class*="fixed"]') || document.querySelector('#header');
      if (h) { var r = h.getBoundingClientRect(); if (getComputedStyle(h).position === 'fixed' && r.top <= 5 && r.height > 40) return Math.round(r.height) + 16; }
      return OFFSET;
    }

    function sectionFor(href) {
      if (!href) return null;
      var h = href.replace(/[?#].*$/, '').replace(/\/+$/, '');
      if (/(^|\/)(en|ar|ko|ja)$/.test(h) || h === '' || /(^|\/)(en|ar|ko|ja)\.html$/.test(h)) return 'TOP';
      if (/\/services$|services\.html$/.test(h)) return '#services';
      if (/partners-and-clients/.test(h)) return document.getElementById('partners-top') ? '#partners-top' : '#mini-slider-partners';
      if (/(^|\/)news$|\/news\.html$/.test(h)) return '#news';
      if (/(^|\/)about(\.html)?$/.test(h)) return '#about-info'; // React bento already owns #about
      if (/(^|\/)contact(\.html)?$/.test(h)) return '#contact';
      return null;
    }

    var anim = null;
    function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function smoothTo(target) {
      var y = 0;
      if (target !== 'TOP') { var el = document.querySelector(target); if (!el) return false; y = Math.max(0, el.getBoundingClientRect().top + window.pageYOffset - headerOffset()); }
      var startY = window.pageYOffset, dist = y - startY;
      if (Math.abs(dist) < 2) return true;
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { window.scrollTo(0, y); return true; }
      var dur = Math.min(620, Math.max(380, Math.abs(dist) * 0.4)); if (anim) cancelAnimationFrame(anim); var start = null;
      function step(ts) { if (start === null) start = ts; var p = Math.min(1, (ts - start) / dur); window.scrollTo(0, startY + dist * easeInOutCubic(p)); if (p < 1) anim = requestAnimationFrame(step); else anim = null; }
      anim = requestAnimationFrame(step); return true;
    }

    // Some React nav clicks fire the bundle's OWN scroll right after ours, which can overshoot the
    // section (e.g. "Partners and Clients" landing on the footer instead of the logo carousel).
    // Re-assert our target a few times after it settles so we reliably end on the right section.
    function smoothToStable(target) {
      smoothTo(target);
      [160, 400, 760].forEach(function (ms) {
        setTimeout(function () { if (target === 'TOP' || document.querySelector(target)) smoothTo(target); }, ms);
      });
    }

    document.addEventListener('click', function (e) {
      // header nav AND footer nav both funnel to the single landing page (legal / pages-index
      // links don't map to a section, so sectionFor returns null and they navigate normally)
      var a = e.target.closest ? e.target.closest('#header a[href], footer a[href]') : null;
      if (!a) return;
      var target = sectionFor(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault(); e.stopPropagation();
      var panel = document.querySelector('.cln-more-panel'); if (panel) panel.style.display = 'none';
      if (target === 'TOP') { if (isHome()) smoothToStable('TOP'); else location.href = homePath(); return; }
      if (isHome() && document.querySelector(target)) smoothToStable(target);
      else location.href = homePath() + '#' + target.slice(1); // funnel to the single landing page
    }, true);

    /* On the landing: pull About + Contact content in as sections, then honour any #hash. */
    if (isHome()) {
      // enhance.js is alive on the homepage -> cancel the head's short (2.5s) reveal failsafe and set
      // a longer backstop. Otherwise, on a slow device the failsafe fires BEFORE this script finishes
      // assembling the landing (injecting About/Contact/Share, reordering, expanding services), so the
      // raw half-built homepage flashes for a moment. reorderSections still reveals the instant it IS
      // assembled; this 8s timer only fires if assembly never completes. (If enhance.js were blocked
      // entirely this line never runs, so the head's 2.5s failsafe stays in effect as the backstop.)
      try { if (window.__clnGateTimer) { clearTimeout(window.__clnGateTimer); window.__clnGateTimer = setTimeout(window.__clnReveal, 8000); } } catch (e) {}
      // Canonicalise /en.html -> /en in the address bar (no reload) so users never get stuck on
      // the raw .html homepage after a breadcrumb "Home" click or pressing Back. The page now
      // renders identically either way (isHome() matches both), so this is purely cosmetic URL tidy.
      try { if (/\.html$/i.test(location.pathname)) history.replaceState(null, '', homePath() + location.search + location.hash); } catch (e) {}
      var css = document.createElement('style'); css.id = 'cln-merged-css';
      css.textContent =
        '.cln-merged-section{padding:3rem 0 1rem;}' +
        '.cln-merged-body [class*="py-40"]{padding-top:0 !important;padding-bottom:0 !important;}' +
        '.cln-merged-body [class*="pt-28"]{padding-top:.5rem !important;}' +
        '.cln-merged-body [class*="pb-28"]{padding-bottom:0 !important;}' +
        '.cln-merged-body [class*="pt-10"]{padding-top:0 !important;}';
      (document.head || document.documentElement).appendChild(css);
      var HEAD = { about: { en: 'About', ar: 'من نحن', ko: '회사 소개', ja: '会社概要' }, contact: { en: 'Contact', ar: 'تواصل معنا', ko: '문의하기', ja: 'お問い合わせ' } };
      var pending = 2;
      function scrollToHash() {
        var h = location.hash; if (!h || h.length < 2) return;
        var el = document.querySelector(h); if (!el) return;
        smoothTo(h);
        // injected sections change page height after images/React settle — re-anchor a couple times
        setTimeout(function () { if (document.querySelector(h)) smoothTo(h); }, 350);
        setTimeout(function () { if (document.querySelector(h)) smoothTo(h); }, 800);
      }
      // Reorder the landing sections to match the header nav order
      // (Services, News, About, Partners and Clients, Contact). The React bundle renders Partners
      // 2nd -- right after Services -- but the nav lists it AFTER News + About, so move the Partners
      // block to sit just before the (injected) Contact section. Needs BOTH the React carousel
      // (#mini-slider-partners) and the injected #contact to exist, which can race, so retry until
      // the move lands; idempotent once in place.
      function reorderPartnersToNavOrder() {
        var carousel = document.querySelector('#mini-slider-partners');
        if (!carousel) return false;
        function bodyChild(node) { var el = node; while (el && el.parentElement && el.parentElement !== document.body) el = el.parentElement; return (el && el.parentElement === document.body) ? el : null; }
        var pSec = bodyChild(carousel);
        // Expose the section's HEADING as the nav scroll anchor. The Partners nav used to target the
        // carousel itself, so landing put the "Partners and Clients" heading ABOVE the viewport, hidden
        // behind the fixed header -- you'd just see a strip of floating logos with no title. Anchoring
        // on the heading lands it just under the header so the section reads as a proper titled block.
        if (pSec) { var pHd = pSec.querySelector('h1,h2,h3'); if (pHd && !pHd.id) pHd.id = 'partners-top'; }
        var contact = document.querySelector('#contact');
        if (!contact) return false;
        var cSec = bodyChild(contact);
        if (!pSec || !cSec || pSec === cSec) return false;
        if (pSec.nextElementSibling !== cSec) document.body.insertBefore(pSec, cSec);
        return true;
      }
      (function ensureOrder(tries) { if (reorderPartnersToNavOrder() || tries <= 0) return; setTimeout(function () { ensureOrder(tries - 1); }, 250); })(20);
      function done() { if (--pending <= 0) { reorderPartnersToNavOrder(); setTimeout(scrollToHash, 120); } }
      function injectPage(page, id) {
        if (document.getElementById(id)) { done(); return; }
        fetch(homePath() + '/' + page + '.html', { cache: 'no-store' }).then(function (r) { return r.ok ? r.text() : null; }).then(function (html) {
          try {
            if (html && !document.getElementById(id)) {
              var doc = new DOMParser().parseFromString(html, 'text/html');
              var wrap = doc.querySelector('[class*="max-w-7xl"][class*="py-40"]');
              if (wrap) {
                var bc = wrap.querySelector('nav[aria-label="breadcrumb"]'); if (bc) bc.remove();
                var ttl = wrap.querySelector('.relative.pt-10'); if (ttl) ttl.remove();
                var ds = wrap.querySelector('.dshare'); if (ds) { var n = ds; while (n && n.parentElement && n.parentElement !== wrap) n = n.parentElement; if (n) n.remove(); }
                var L = lng();
                var sec = document.createElement('section'); sec.id = id; sec.className = 'cln-merged-section';
                sec.innerHTML = '<h2 class="relative pb-12 mx-auto max-w-4xl text-center text-2xl font-bold text-zinc-100 md:text-4xl">' + (HEAD[page][L] || HEAD[page].en) + '</h2>';
                var holder = document.createElement('div'); holder.className = 'mx-auto max-w-7xl px-6 lg:px-8 cln-merged-body';
                holder.appendChild(document.importNode(wrap, true));
                // The About content ships its own "About us" eyebrow -> redundant with the centered
                // "About" section heading above, so drop it (about only) and "About" appears once.
                if (page === 'about') { var eb = holder.querySelector('p[class*="uppercase"][class*="tracking-wide"]'); if (eb) eb.remove(); }
                sec.appendChild(holder);
                var footer = document.querySelector('footer'); if (footer && footer.parentNode) footer.parentNode.insertBefore(sec, footer);
              }
            }
          } catch (err) {}
          done();
        }).catch(function () { done(); });
      }
      /* Show ALL services on the landing (the grid ships with 6; the other 4 live on
         services.html behind "View all Services"). Pull the missing cards in and drop the
         button, so nothing leaves the single page.
         Robust against the React render race that made it flaky (sometimes the button stayed /
         only 6 showed): the extra cards are fetched ONCE and cached, injection is idempotent
         (only ever adds slugs not already present, only hides the button if shown), and it is
         re-applied via a MutationObserver on #services (so a late mount or a React re-render
         can't leave it half-expanded) plus a few timed retries. */
      function expandServices() {
        var L = lng();
        var cache = null, fetching = false, gaveUp = false;
        function gridEl() { var s = document.getElementById('services'); return s ? s.querySelector('[class*="grid-cols"]') : null; }
        function slugOf(a) { var m = (a.getAttribute('href') || '').match(/services\/([a-z0-9-]+)\.html/); return m ? m[1] : null; }
        // The "View all Services" button + the 4 extra cards are added asynchronously. On a hard
        // reload the CLS gate can reveal the page before services.html loads, flashing the button
        // (with only 6 cards) before it's hidden. So hide it the moment the grid exists — long
        // before any reveal — and only restore it if the fetch ultimately fails (rare fallback).
        function btnWrap() { var s = document.getElementById('services'); var b = s && s.querySelector('a[href$="/services.html"]'); return b ? (b.closest('div') || b) : null; }
        function hideBtn() { if (gaveUp) return; var w = btnWrap(); if (w && w.style.display !== 'none') w.style.display = 'none'; }
        function showBtn() { var w = btnWrap(); if (w) w.style.display = ''; }
        function inject() {
          if (!cache) return;
          var grid = gridEl(); if (!grid) return;
          var have = {};
          [].slice.call(grid.querySelectorAll('a[href]')).forEach(function (a) { var s = slugOf(a); if (s) have[s] = 1; });
          cache.forEach(function (card) {
            var s = slugOf(card);
            if (s && !have[s]) { var c = document.importNode(card, true); c.setAttribute('href', '/' + L + '/services/' + s + '.html'); grid.appendChild(c); have[s] = 1; }
          });
          var sec = document.getElementById('services');
          var btn = sec && sec.querySelector('a[href$="/services.html"]'); // the "View all" link (not a *-services.html slug)
          if (btn) { var wrap = btn.closest('div') || btn; if (wrap.style.display !== 'none') wrap.style.display = 'none'; }
        }
        function ensure() {
          var grid = gridEl(); if (!grid) return;
          hideBtn(); // as soon as the grid is present, before any reveal
          if (cache) { inject(); return; }
          if (fetching) return; fetching = true;
          fetch(homePath() + '/services.html', { cache: 'no-store' }).then(function (r) { return r.ok ? r.text() : null; }).then(function (html) {
            fetching = false; if (!html) return;
            var doc = new DOMParser().parseFromString(html, 'text/html');
            cache = [].slice.call(doc.querySelectorAll('a[class*="min-h-[10rem]"]'));
            inject();
          }).catch(function () { fetching = false; });
        }
        ensure();
        var sec = document.getElementById('services');
        if (sec && 'MutationObserver' in window) {
          var t; new MutationObserver(function () { clearTimeout(t); t = setTimeout(ensure, 80); }).observe(sec, { childList: true, subtree: true });
        }
        var n = 0, iv = setInterval(function () { if (cache) return clearInterval(iv); if (++n > 15) { clearInterval(iv); gaveUp = true; showBtn(); return; } ensure(); }, 250);
      }
      /* Add the "Share this page" social row above the footer on the landing page. The static
         markup can't live in en.html (React reconciles unknown static nodes out on first render),
         so we clone the share block from contact.html AFTER React renders — same pattern as the
         merged sections, which persist. Share targets are retargeted from /en/contact to the home page. */
      function injectShare() {
        return; // "Share this page" row removed site-wide (per client) -- do not inject it on the homepage.
        var footer = document.querySelector('footer');
        if (!footer || !footer.parentNode || document.querySelector('.cln-share')) return;
        fetch(homePath() + '/contact.html', { cache: 'no-store' }).then(function (r) { return r.ok ? r.text() : null; }).then(function (html) {
          try {
            if (!html || document.querySelector('.cln-share')) return;
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var box = doc.querySelector('.dshare');
            while (box && !/\bpt-20\b/.test(box.className || '')) box = box.parentElement; // the "Share this page" wrapper
            if (!box) return;
            box.querySelectorAll('a[href]').forEach(function (a) {
              var h = a.getAttribute('href')
                .replace(/%2Fen%2Fcontact/g, '%2Fen')
                .replace(/(text|title|description)=Contact/g, '$1=3Lines%20Advanced%20Technologies%20Company')
                .replace(/hashtags=[^&]*/, 'hashtags=3lines');
              if (/cdn-cgi\/l\/email-protection/.test(h)) h = 'mailto:?subject=3Lines%20Advanced%20Technologies%20Company&body=https%3A%2F%2F3lines.com.sa%2Fen';
              a.setAttribute('href', h);
            });
            // Keep only WhatsApp + LinkedIn (the English page was already trimmed to these two;
            // the ar/ja/ko source still ships the full 7-icon set, so normalise them here).
            box.querySelectorAll('a.dshare').forEach(function (a) {
              if (!/whatsapp|linkedin/i.test(a.getAttribute('href') || '')) {
                if (a.parentNode) a.parentNode.removeChild(a);
              }
            });
            var sec = document.createElement('div');
            sec.className = 'cln-share mx-auto max-w-7xl px-6';
            sec.appendChild(document.importNode(box, true));
            footer.parentNode.insertBefore(sec, footer);
          } catch (e) {}
        }).catch(function () {});
      }
      function run() { injectPage('about', 'about-info'); injectPage('contact', 'contact'); expandServices(); injectShare(); }
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();

      /* Build (once) the "Why 3Lines" value-prop carousel. Self-contained: markup + autoplay + swipe
         + dots/arrows, localized, dark/light + RTL aware, reduced-motion safe. Styling in rule 15o. */
      function buildSlider() {
        if (document.getElementById('cln-slider')) return document.getElementById('cln-slider');
        var L = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
        if (['ar', 'ko', 'ja'].indexOf(L) < 0) L = 'en';
        var rtl = L === 'ar';
        var EYE = { en: 'WHY 3LINES', ar: 'لماذا ثري لاينز', ja: '3Lines を選ぶ理由', ko: '3Lines를 선택하는 이유' };
        var SLIDES = [
          { h: { en: 'The first licensed Saudi company', ar: 'أول شركة سعودية مرخّصة', ja: 'サウジ初の認可企業', ko: '사우디 최초의 공인 기업' },
            s: { en: 'For aircraft spare parts, ground support equipment & simulators.', ar: 'لتوريد قطع غيار الطائرات ومعدات الدعم الأرضي وأجهزة المحاكاة.', ja: '航空機スペアパーツ・地上支援機器・シミュレーターを供給します。', ko: '항공기 부품, 지상 지원 장비 및 시뮬레이터를 공급합니다.' } },
          { h: { en: '30+ years of aviation expertise', ar: 'خبرة تتجاوز 30 عاماً في الطيران', ja: '30年以上の航空分野の専門知識', ko: '30년 이상의 항공 분야 전문성' },
            s: { en: 'Trusted across civil and military operations.', ar: 'موثوقة في العمليات المدنية والعسكرية.', ja: '民間および軍用の運用で信頼されています。', ko: '민간 및 군용 운용 분야에서 신뢰받습니다.' } },
          { h: { en: 'A global sourcing network', ar: 'شبكة توريد عالمية', ja: 'グローバルな調達ネットワーク', ko: '글로벌 소싱 네트워크' },
            s: { en: 'Genuine parts from the United States and worldwide.', ar: 'قطع غيار أصلية من الولايات المتحدة وحول العالم.', ja: '米国および世界各地から純正部品を調達します。', ko: '미국 및 전 세계에서 정품 부품을 조달합니다.' } },
          { h: { en: 'A professional Saudi team', ar: 'فريق سعودي محترف', ja: 'プロフェッショナルなサウジチーム', ko: '전문 사우디 팀' },
            s: { en: 'Serving operators in the Kingdom and beyond.', ar: 'يخدم المشغّلين في المملكة وخارجها.', ja: '王国内外の事業者にサービスを提供します。', ko: '왕국 내외의 운영자에게 서비스를 제공합니다.' } }
        ];
        function pick(o) { return o[L] || o.en; }
        var sec = document.createElement('section');
        sec.id = 'cln-slider'; sec.className = 'cln-slider';
        sec.setAttribute('aria-roledescription', 'carousel'); sec.setAttribute('aria-label', pick(EYE));
        var slidesHtml = SLIDES.map(function (sl, i) {
          return '<div class="cln-slide" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + ' / ' + SLIDES.length + '">' +
            '<span class="cln-slide-eyebrow">' + pick(EYE) + '</span>' +
            '<h3 class="cln-slide-head">' + pick(sl.h) + '</h3>' +
            '<p class="cln-slide-sub">' + pick(sl.s) + '</p></div>';
        }).join('');
        var dotsHtml = SLIDES.map(function (sl, i) {
          return '<button class="cln-slider-dot" type="button" aria-label="' + pick(sl.h) + '"' + (i === 0 ? ' aria-current="true"' : '') + '></button>';
        }).join('');
        // In RTL the visual prev/next arrows swap sides; the labels stay semantic.
        var prevLbl = rtl ? '‹' : '‹', nextLbl = rtl ? '›' : '›';
        sec.innerHTML =
          '<div class="cln-slider-frame">' +
          '<button class="cln-slider-arrow cln-slider-prev" type="button" aria-label="Previous">' + prevLbl + '</button>' +
          '<div class="cln-slider-viewport"><div class="cln-slider-track">' + slidesHtml + '</div></div>' +
          '<button class="cln-slider-arrow cln-slider-next" type="button" aria-label="Next">' + nextLbl + '</button>' +
          '</div><div class="cln-slider-dots">' + dotsHtml + '</div>';

        var track = sec.querySelector('.cln-slider-track');
        var dots = [].slice.call(sec.querySelectorAll('.cln-slider-dot'));
        var n = SLIDES.length, idx = 0;
        var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        function go(i) {
          idx = (i + n) % n;
          // always negative -- the slider is forced direction:ltr (rule 15o) so this never overflows in RTL
          track.style.transform = 'translateX(-' + (idx * 100) + '%)';
          dots.forEach(function (d, di) { if (di === idx) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
        }
        sec.querySelector('.cln-slider-next').addEventListener('click', function () { go(idx + 1); rest(); });
        sec.querySelector('.cln-slider-prev').addEventListener('click', function () { go(idx - 1); rest(); });
        dots.forEach(function (d, di) { d.addEventListener('click', function () { go(di); rest(); }); });
        // autoplay -- always on (user wants an auto slider); pauses on hover/focus. Under reduced-motion
        // the slide TRANSITION is made instant via CSS (rule 15o) so it advances without a sliding animation.
        var timer = null;
        function play() { if (timer) return; timer = setInterval(function () { go(idx + 1); }, 4500); }
        function stop() { if (timer) { clearInterval(timer); timer = null; } }
        function rest() { stop(); play(); }
        sec.addEventListener('mouseenter', stop); sec.addEventListener('mouseleave', play);
        sec.addEventListener('focusin', stop); sec.addEventListener('focusout', play);
        // swipe (pointer)
        var x0 = null;
        var vp = sec.querySelector('.cln-slider-viewport');
        vp.addEventListener('pointerdown', function (e) { x0 = e.clientX; stop(); });
        vp.addEventListener('pointerup', function (e) {
          if (x0 === null) return; var dx = e.clientX - x0; x0 = null;
          if (Math.abs(dx) > 40) { go(idx + (dx < 0 ? 1 : -1)); } // LTR mechanics: swipe left = next
          play();
        });
        play();
        return sec;
      }

      /* Reorder the landing sections to follow the nav order: Hero + feature cards stay on top as the
         "Home" intro, then About -> Why-3Lines slider -> Services -> News -> Partners -> Contact ->
         Share -> footer. Runs once the injected About/Contact/Share sections exist. (Two elements share
         id="services" in the source HTML, so disambiguate by content.) */
      function reorderSections() {
        var footer = document.querySelector('footer'); if (!footer || !footer.parentNode) return;
        var parent = footer.parentNode;
        var svc = [].slice.call(document.querySelectorAll('[id="services"]'));
        var servicesSec = svc.filter(function (s) { return s.querySelector('a[class*="min-h-[10rem]"]'); })[0];
        var partnersSec = svc.filter(function (s) { return s.querySelector('#mini-slider-partners'); })[0];
        // Section eyebrows (rule 15h) -- localized kicker above each heading, complementing (not
        // repeating) the title below it. Done here, pre-reveal, so the added line never shifts layout.
        var EYE = {
          services: { en: 'What we do', ar: 'ما نقوم به', ja: '事業内容', ko: '우리가 하는 일' },
          partners: { en: 'Trusted by', ar: 'يثقون بنا', ja: '信頼と実績', ko: '신뢰의 파트너십' },
          news: { en: 'Newsroom', ar: 'مستجدات', ja: 'お知らせ', ko: '새 소식' }
        };
        function decorateHeading(sec, key) {
          if (!sec) return; var h2 = sec.querySelector('h2'); if (!h2 || h2.getAttribute('data-cln-eye')) return;
          h2.setAttribute('data-cln-eye', '1'); h2.classList.add('cln-sec-h2');
          var txt = EYE[key] && (EYE[key][lang()] || EYE[key].en); if (!txt) return;
          var e = document.createElement('span'); e.className = 'cln-eyebrow'; e.textContent = txt;
          h2.insertBefore(e, h2.firstChild);
        }
        decorateHeading(servicesSec, 'services');
        decorateHeading(partnersSec, 'partners');
        decorateHeading(document.getElementById('news'), 'news');
        var slider = buildSlider();
        var seq = [document.getElementById('about-info'), slider, servicesSec, document.getElementById('news'), partnersSec, document.getElementById('contact')];
        // insertBefore MOVES existing sections and INSERTS the freshly-built slider (no parentNode yet),
        // so gate only on null/footer -- not on parentNode.
        seq.forEach(function (sec) { if (sec && sec !== footer) parent.insertBefore(sec, footer); });
        // landing layout is now assembled in its final order — reveal it (the head gate hid the
        // page with visibility:hidden so this whole reflow never shows as a jump / counts as CLS).
        // Also wait for the web fonts so the font-swap happens while still hidden (no post-reveal
        // reflow); the head's 2.5s failsafe still reveals regardless if fonts stall.
        if (window.__clnReveal) {
          var doReveal = function () { requestAnimationFrame(function () { requestAnimationFrame(window.__clnReveal); }); };
          if (document.fonts && document.fonts.ready && document.fonts.ready.then) document.fonts.ready.then(doReveal, doReveal);
          else doReveal();
        }
      }
      var rtries = 0;
      var riv = setInterval(function () {
        var ready = document.getElementById('about-info') && document.getElementById('contact');
        if (ready || ++rtries > 60) { if (ready) reorderSections(); clearInterval(riv); }
      }, 150);

      /* The synthetic "Cybersecurity" bento card was removed -- it was a clone with no real service,
         page or link behind it, and only rendered on the English homepage. The bento now shows the
         same real cards in every locale (Defense wide / Optokon + ATV / XR). This just reports when
         the bento has rendered so the watermark pass below can run; Defense keeps its original span. */
      function addBentoCard() {
        return [].slice.call(document.querySelectorAll('[class*="auto-rows-"] [class*="rounded-xl"]'))
          .some(function (c) { return c.querySelector('h3'); });
      }
      /* Give the plain bento cards (Defense Technology, Cybersecurity) the visual weight the others
         carry (Optokon logo / ATV "Soon!" / XR image): a large, faint ghosted clone of the card's OWN
         icon in the top-right corner (overflow-hidden clips it for a peeking-corner effect). Subtle
         (~10% opacity), brand-blue, theme-aware, brightens slightly on card hover. Skips any card that
         already has an image, a logo bg, or the "Soon" watermark. */
      function bentoWatermarks() {
        if (!document.getElementById('cln-bento-wm-css')) {
          var s = document.createElement('style'); s.id = 'cln-bento-wm-css';
          s.textContent =
            '.cln-bento-wm{position:absolute;top:-1.4rem;right:-1.4rem;width:11rem;height:11rem;pointer-events:none;color:#3aa0ff;opacity:.11;transition:opacity .3s ease,transform .3s ease;}' +
            '.cln-bento-wm svg{width:100%;height:100%;display:block;}' +
            '.ml-light .cln-bento-wm{color:#0a73d4;opacity:.085;}' +
            '.group:hover .cln-bento-wm{opacity:.17;transform:scale(1.05) rotate(-4deg);}';
          (document.head || document.documentElement).appendChild(s);
        }
        var cards = [].slice.call(document.querySelectorAll('[class*="auto-rows-"] [class*="rounded-xl"]'))
          .filter(function (c) { return c.querySelector('h3'); });
        cards.forEach(function (c) {
          if (c.querySelector('.cln-bento-wm')) return;                       // idempotent
          if (c.querySelector('img') || c.querySelector('[style*="background-image"]') || /soon/i.test(c.textContent)) return; // only plain cards
          var icon = c.querySelector('svg'); if (!icon) return;
          var wm = document.createElement('div'); wm.className = 'cln-bento-wm'; wm.setAttribute('aria-hidden', 'true');
          var clone = icon.cloneNode(true);
          clone.removeAttribute('width'); clone.removeAttribute('height'); clone.removeAttribute('class');
          wm.appendChild(clone);
          c.insertBefore(wm, c.firstChild);
        });
      }
      var btries = 0;
      var biv = setInterval(function () {
        if (addBentoCard() || ++btries > 60) {
          clearInterval(biv);
          // retry the (idempotent) watermark pass a few times so both plain cards get decorated
          // regardless of when the Cybersecurity clone / icons finish settling.
          var wt = 0, wiv = setInterval(function () { bentoWatermarks(); if (++wt > 15) clearInterval(wiv); }, 250);
        }
      }, 150);
    }
  })();
})();
