// Apply the saved or system theme before first paint and keep controls working on every route.
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var theme = 'dark';
  try {
    var saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') theme = saved;
    else if (window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches) theme = 'light';
  } catch (e) { /* storage unavailable: keep default */ }
  root.setAttribute('data-theme', theme);

  // A reload should reopen the portfolio at its beginning, even if the browser
  // remembered a section scroll position or the current URL has a section hash.
  var navigation = window.performance && performance.getEntriesByType('navigation')[0];
  var wasReload = navigation ? navigation.type === 'reload' : !!(performance.navigation && performance.navigation.type === 1);
  if (wasReload) {
    history.scrollRestoration = 'manual';
    if (window.location.hash) history.replaceState(history.state, '', window.location.pathname + window.location.search);
    var resetScroll = function () {
      root.style.scrollBehavior = 'auto';
      window.scrollTo(0, 0);
      requestAnimationFrame(function () { root.style.removeProperty('scroll-behavior'); });
    };
    document.addEventListener('DOMContentLoaded', resetScroll, { once: true });
    window.addEventListener('pageshow', function () {
      resetScroll();
      requestAnimationFrame(function () { history.scrollRestoration = 'auto'; });
    }, { once: true });
  }

  function syncThemeControls() {
    var dark = root.getAttribute('data-theme') === 'dark';
    document.querySelectorAll('.theme-toggle').forEach(function (button) {
      button.textContent = dark ? 'Light mode' : 'Dark mode';
      button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    });
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#090d12' : '#e9eee7');
  }
  document.addEventListener('DOMContentLoaded', syncThemeControls);
  document.addEventListener('click', function (event) {
    if (!event.target.closest || !event.target.closest('.theme-toggle')) return;
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
    syncThemeControls();
  });
})();
