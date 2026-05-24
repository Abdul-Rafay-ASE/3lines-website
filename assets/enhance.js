/* 3lines clone enhancements: make the desktop "More" nav dropdown open on click
   (Radix NavigationMenu only opens on hover by default). */
(function () {
  function isMoreTrigger(btn) {
    if (!btn || btn.tagName !== 'BUTTON') return false;
    var t = (btn.textContent || '').trim();
    return t === 'More' || t === 'المزيد';
  }
  function fire(el, types) {
    types.forEach(function (t) {
      el.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, pointerType: 'mouse' }));
    });
  }
  function closeAll() {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  }
  // Toggle the dropdown on click of the "More" trigger.
  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('button') : null;
    if (!isMoreTrigger(btn)) return;
    e.preventDefault();
    if (btn.getAttribute('data-state') === 'open') {
      closeAll();
    } else {
      fire(btn, ['pointerenter', 'pointermove', 'pointerover']);
    }
  }, true);
  // Close an open dropdown when clicking elsewhere.
  document.addEventListener('click', function (e) {
    var open = document.querySelector('button[data-state="open"]');
    if (!open) return;
    var onTrigger = e.target.closest && e.target.closest('button[data-state="open"]');
    var inMenu = e.target.closest && e.target.closest('[data-radix-navigation-menu-viewport], [role="menu"], nav ul');
    if (!onTrigger && !inMenu) closeAll();
  });
})();
