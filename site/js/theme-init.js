// Runs before first paint (loaded synchronously in <head>) to avoid a theme flash.
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
})();
