// Case Study: /casestudies/<id>

(function () {
  const { esc, casestudies, pills, image } = window.H;
  const main = document.getElementById('main');
  const c = casestudies.find((x) => x.id === H.routeId());
  if (!c) return H.notFound(main, 'Case study');

  document.title = c.title + ' · James Hetmanek';

  main.innerHTML =
    '<article class="case">' +
      '<div>' +
        '<div class="case__eyebrow">Case Study</div>' +
        '<h1 class="page-title">' + esc(c.title) + H.draftTag(c) + '</h1>' +
      '</div>' +
      pills(c.skills, true) +
      (c.sections || []).map((s) =>
        '<section class="case__section">' +
          '<h2 class="case__label">' + esc(s.label) + '</h2>' +
          '<div class="case__body">' +
            '<div class="prose">' + MD.render(s.body) + '</div>' +
            (s.image ? '<div class="case__figure">' + image(s.image) + '</div>' : '') +
          '</div>' +
        '</section>').join('') +
    '</article>';
})();
