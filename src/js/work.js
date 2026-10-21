// Work entry: /work/<id>

(function () {
  const { esc, date, workById, posts, casestudies, url, pills, image, truncate, plain } = window.H;
  const main = document.getElementById('main');
  const w = workById[H.routeId()];
  if (!w) return H.notFound(main, 'Work entry');

  document.title = w.title + ' · James Hetmanek';

  const meta =
    '<dl class="meta">' +
      [['TYPE', esc(w.type || '—')],
       ['STATUS', esc(w.status || '—')],
       ['LAST UPDATE', w.lastUpdate ? date.table(w.lastUpdate) : '—'],
       ['SKILLS', pills(w.skills, true) || '—']
      ].map((r) => '<div class="meta__row"><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>').join('') +
    '</dl>';

  const logPosts = posts.filter((p) => (p.engagements || []).indexOf(w.id) >= 0);
  const cases = casestudies.filter((c) => c.engagement === w.id);

  const logSection = logPosts.length
    ? '<section class="related" aria-labelledby="related-log"><h2 class="mono-label" id="related-log">BUILD LOG</h2><ul class="related__list">' +
        logPosts.map((p) =>
          '<li><a class="related__item" href="' + url.post(p.id) + '">' +
            '<div class="related__item-date">' + date.long(p.date) + '</div>' +
            '<div class="related__item-text">' + esc(truncate(p.excerpt || plain(p.paras[0]), 140)) + '</div>' +
          '</a></li>').join('') +
      '</ul></section>'
    : '';
  const caseSection = cases.length
    ? '<section class="related" aria-labelledby="related-cases"><h2 class="mono-label" id="related-cases">CASE STUDIES</h2><ul class="related__list">' +
        cases.map((c) => '<li><a class="related__item related__item--case" href="' + url.caseStudy(c.id) + '">' + esc(c.title) + '&nbsp;<span aria-hidden="true">→</span></a></li>').join('') +
      '</ul></section>'
    : '';

  main.innerHTML =
    '<article class="work">' +
      '<div class="work__main">' +
        '<div><h1 class="page-title">' + esc(w.title) + '</h1><div class="work__desc">' + esc(w.desc || '') + '</div></div>' +
        '<div class="only-mobile">' + meta + '</div>' +
        (w.body ? '<div class="prose">' + w.body + '</div>' : '') +
        (w.gallery && w.gallery.length
          ? '<div class="gallery">' + w.gallery.map((img, i) => image(img, 'IMAGE ' + (i + 1))).join('') + '</div>'
          : '') +
      '</div>' +
      '<aside class="work__aside" aria-label="Details">' +
        '<div class="only-desktop">' + meta + '</div>' + logSection + caseSection +
      '</aside>' +
    '</article>';
})();
