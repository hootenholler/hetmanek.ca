// Letters & Articles entry: /letters/<id>

(function () {
  const { esc, date, letters, pills, image } = window.H;
  const main = document.getElementById('main');
  const l = letters.find((x) => x.id === H.routeId());
  if (!l) return H.notFound(main, 'Letter');

  document.title = l.title + ' · James Hetmanek';

  main.innerHTML =
    '<article class="letter">' +
      '<div class="letter__date"><time datetime="' + esc(l.date) + '">' + date.full(l.date) + '</time></div>' +
      '<h1 class="page-title">' + esc(l.title) + '</h1>' +
      (l.summary ? '<div class="letter__summary">' + esc(l.summary) + '</div>' : '') +
      (l.image ? image(l.image, 'IMAGE PLACEHOLDER · 3:2', 'letter__image') : '') +
      '<div class="prose">' + (l.body || '') + '</div>' +
      pills(l.skills, true) +
    '</article>';
})();
