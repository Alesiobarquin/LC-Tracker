// Run before the app and its styles load, so a saved dark theme never flashes light.
(function () {
  var preference = 'system';
  try {
    var saved = localStorage.getItem('lc-tracker-theme');
    if (saved === 'light' || saved === 'dark') preference = saved;
  } catch (_) {
    // Restricted storage still follows the browser's color preference.
  }
  var dark = preference === 'dark' || (
    preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  var theme = dark ? 'dark' : 'light';
  var canvas = dark ? '#0e1419' : '#f6f8fa';
  var root = document.documentElement;
  root.dataset.theme = theme;
  root.dataset.themePreference = preference;
  root.style.colorScheme = theme;
  root.style.backgroundColor = 'var(--palette-canvas, ' + canvas + ')';
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', canvas);
})();
