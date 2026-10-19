// Preserve an unfinished recall check before pre-rendered reference HTML paints.
// This reads the existing tab's draft without changing or completing it.
(function () {
  var match = window.location.pathname.match(/^\/library\/([^/]+)\/explanation\/?$/);
  if (!match) return;
  try {
    var stored = JSON.parse(sessionStorage.getItem('lc-tracker-active-session') || 'null');
    var recall = stored && stored.state && stored.state.activeRecall;
    if (recall && recall.revealed === false && recall.problemId === decodeURIComponent(match[1])) {
      document.documentElement.dataset.publicRecallProblem = recall.problemId;
    }
  } catch (_) {
    // Invalid or unavailable storage must not block ordinary public references.
  }
})();
