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

  /* ----- 1c) Remove the useless "Share this page" social bar -----
     A faded (opacity-40) row of share buttons appears on about/contact/service/news/legal
     pages — a grey bar that adds nothing on a corporate site. Strip the whole block. */
  (function () {
    function killShare() {
      var btn = document.querySelector('.dshare'); if (!btn) return;
      var sec = btn.closest('[class*="pt-20"]') || (btn.parentElement && btn.parentElement.parentElement);
      if (sec && sec.parentNode) sec.parentNode.removeChild(sec);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', killShare);
    else killShare();
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
    'footer .bg-logo img{height:4.5rem !important;width:auto !important;}' +
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
    /* 16) Partner/client logos: a uniform grey strip at REST that pops to each logo's TRUE brand
           colour on HOVER (restores the original group-hover:grayscale-0 intent -- e.g. Airbus going
           blue). Light mode inverts at rest so the dark-card-built logos stay visible on white, then
           drops the filter on hover to show real colour. The few flat-WHITE logos (Airbus, NPCO,
           Optokon ...) have no colour to reveal -- they're tagged `cln-mono-logo` at runtime (16b)
           and kept inverted-dark on hover in light mode so they don't go white-on-white and vanish. */
    '.ml-light img[class*="group-hover:grayscale-0"]{filter:invert(1) grayscale(1) brightness(.5) contrast(1.15) !important;opacity:.82 !important;}' +
    '.ml-light img[class*="group-hover:grayscale-0"]:hover{filter:none !important;opacity:1 !important;transform:scale(1.08) !important;}' +
    'html.ml-light img.cln-mono-logo:hover{filter:invert(1) grayscale(1) brightness(.3) contrast(1.2) !important;}' +
    '.dark img[class*="group-hover:grayscale-0"]{filter:grayscale(1) !important;opacity:.82 !important;}' +
    '.dark img[class*="group-hover:grayscale-0"]:hover{filter:none !important;opacity:1 !important;transform:scale(1.08) !important;}' +
    'img[class*="group-hover:grayscale-0"]{transition:filter .25s ease,opacity .22s ease,transform .22s ease !important;}' +
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
    'header[class*="fixed"]{transform:none !important;translate:none !important;}';
  (document.head || document.documentElement).appendChild(perfCss);

  /* ----- 16b) Tag monochrome (white) partner logos -----
     The partner strip (rule 16) greys logos at rest and reveals their TRUE colour on hover. A few
     logos are flat WHITE assets (Airbus, NPCO, Optokon ...) with no colour to reveal -- in light
     mode `filter:none` on hover would make them white-on-white and vanish. Sample each logo's
     pixels; if it carries no real colour (near-zero saturation), tag it `cln-mono-logo` so the CSS
     keeps it inverted-dark on hover instead. Same-origin assets, so the canvas isn't tainted. */
  (function tagMonoLogos() {
    function sample(im) {
      try {
        var w = 24, h = 24, c = document.createElement('canvas'); c.width = w; c.height = h;
        var x = c.getContext('2d'); x.drawImage(im, 0, 0, w, h);
        var d = x.getImageData(0, 0, w, h).data, maxSat = 0;
        for (var i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 30) continue; // ignore transparent pixels
          var r = d[i], g = d[i + 1], b = d[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b);
          var s = mx ? (mx - mn) / mx : 0; if (s > maxSat) maxSat = s;
        }
        if (maxSat < 0.15) im.classList.add('cln-mono-logo');
      } catch (e) { /* tainted/unsupported -> leave untagged (still greys + lifts on hover) */ }
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
                sec.innerHTML = '<h1 class="relative pb-12 mx-auto max-w-4xl text-center text-2xl font-bold text-zinc-100 md:text-4xl">' + (HEAD[page][L] || HEAD[page].en) + '</h1>';
                var holder = document.createElement('div'); holder.className = 'mx-auto max-w-7xl px-6 lg:px-8 cln-merged-body';
                holder.appendChild(document.importNode(wrap, true));
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
        var cache = null, fetching = false;
        function gridEl() { var s = document.getElementById('services'); return s ? s.querySelector('[class*="grid-cols"]') : null; }
        function slugOf(a) { var m = (a.getAttribute('href') || '').match(/services\/([a-z0-9-]+)\.html/); return m ? m[1] : null; }
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
        var n = 0, iv = setInterval(function () { if (++n > 15) return clearInterval(iv); ensure(); }, 250);
      }
      /* Add the "Share this page" social row above the footer on the landing page. The static
         markup can't live in en.html (React reconciles unknown static nodes out on first render),
         so we clone the share block from contact.html AFTER React renders — same pattern as the
         merged sections, which persist. Share targets are retargeted from /en/contact to the home page. */
      function injectShare() {
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
            var sec = document.createElement('div');
            sec.className = 'cln-share mx-auto max-w-7xl px-6';
            sec.appendChild(document.importNode(box, true));
            footer.parentNode.insertBefore(sec, footer);
          } catch (e) {}
        }).catch(function () {});
      }
      function run() { injectPage('about', 'about-info'); injectPage('contact', 'contact'); expandServices(); injectShare(); }
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();

      /* Reorder the landing sections to follow the nav order: Hero + feature cards stay on top as
         the "Home" intro, then About -> Services -> News -> Partners -> Contact -> Share -> footer.
         Runs once the injected About/Contact/Share sections exist. (Two elements share id="services"
         in the source HTML, so disambiguate by content.) */
      function reorderSections() {
        var footer = document.querySelector('footer'); if (!footer || !footer.parentNode) return;
        var parent = footer.parentNode;
        var svc = [].slice.call(document.querySelectorAll('[id="services"]'));
        var servicesSec = svc.filter(function (s) { return s.querySelector('a[class*="min-h-[10rem]"]'); })[0];
        var partnersSec = svc.filter(function (s) { return s.querySelector('#mini-slider-partners'); })[0];
        var seq = [document.getElementById('about-info'), servicesSec, document.getElementById('news'), partnersSec, document.getElementById('contact'), document.querySelector('.cln-share')];
        seq.forEach(function (sec) { if (sec && sec !== footer && sec.parentNode) parent.insertBefore(sec, footer); });
      }
      var rtries = 0;
      var riv = setInterval(function () {
        var ready = document.getElementById('about-info') && document.getElementById('contact') && document.querySelector('.cln-share');
        if (ready || ++rtries > 60) { if (ready) reorderSections(); clearInterval(riv); }
      }, 150);

      /* Add a 4th "Cybersecurity" feature card and rebalance the bento to a 2x2 on the left:
         Defense shrinks from col-span-2 to col-span-1, and the new card sits beside it
         (so the left becomes Defense + Cybersecurity / Optokon + ATV, with XR tall on the right). */
      function addBentoCard() {
        var h3s = [].slice.call(document.querySelectorAll('h3'));
        function cardByTitle(re) {
          var h = h3s.find(function (x) { return re.test(x.textContent.trim()); }); if (!h) return null;
          var c = h; while (c && !/rounded-xl/.test((c.getAttribute && c.getAttribute('class')) || '')) c = c.parentElement; return c;
        }
        var defense = cardByTitle(/^Defense Technology/);
        var optokon = cardByTitle(/^Optokon Middle East/);
        if (!defense || !optokon) return false;
        var grid = optokon.parentElement; if (!grid) return false;
        if (grid.querySelector('[data-cln-bento]')) return true; // idempotent
        var clone = optokon.cloneNode(true);
        clone.setAttribute('data-cln-bento', '1');
        var logoBg = clone.querySelector('[style*="background-image"]'); if (logoBg && logoBg.parentNode) logoBg.parentNode.removeChild(logoBg);
        var icon = clone.querySelector('svg');
        if (icon) {
          icon.setAttribute('viewBox', '0 0 24 24'); icon.setAttribute('fill', 'none'); icon.setAttribute('stroke', 'currentColor');
          icon.setAttribute('stroke-width', '2'); icon.setAttribute('stroke-linecap', 'round'); icon.setAttribute('stroke-linejoin', 'round');
          icon.setAttribute('class', ((icon.getAttribute('class') || '').replace(/fill-zinc-\d+/g, '')).replace(/\s+/g, ' ').trim());
          icon.innerHTML = '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>';
        }
        var h3 = clone.querySelector('h3'); if (h3) h3.textContent = 'Cybersecurity';
        var p = clone.querySelector('p'); if (p) p.textContent = 'Securing critical defense and aviation systems';
        [].slice.call(clone.querySelectorAll('a')).forEach(function (a) { if (a.parentNode) a.parentNode.removeChild(a); });
        if (defense.nextSibling) grid.insertBefore(clone, defense.nextSibling); else grid.appendChild(clone);
        defense.setAttribute('class', defense.getAttribute('class').replace(/md:col-span-2/g, 'md:col-span-1').replace(/lg:col-span-2/g, 'lg:col-span-1'));
        return true;
      }
      var btries = 0;
      var biv = setInterval(function () { if (addBentoCard() || ++btries > 60) clearInterval(biv); }, 150);
    }
  })();
})();
