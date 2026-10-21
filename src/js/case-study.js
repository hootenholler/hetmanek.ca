// Case Study: /casestudies/<id>

(function () {
  const { esc, workById, casestudies, url, pills, image } = window.H;
  const main = document.getElementById('main');
  const c = casestudies.find((x) => x.id === H.routeId());
  if (!c) return H.notFound(main, 'Case study');

  document.title = c.title + ' · James Hetmanek';
  const eng = workById[c.engagement];

  main.innerHTML =
    '<article class="case">' +
      '<div>' +
        '<h1 class="page-title">' + esc(c.title) + '</h1>' +
        '<div class="case__from">' + (eng ? 'Case Study from <a href="' + url.work(eng.id) + '">' + esc(eng.title) + '</a>' : 'Case Study') + '</div>' +
      '</div>' +
      pills(c.skills, true) +
      (c.sections || []).map((s) =>
        '<section class="case__section">' +
          '<h2 class="case__label">' + esc(s.label) + '</h2>' +
          '<div class="case__body">' +
            '<div class="prose">' + s.html + '</div>' +
            (s.image ? '<div class="case__figure">' + image(s.image === true ? null : s.image) + '</div>' : '') +
          '</div>' +
        '</section>').join('') +
    '</article>';
})();
