// Work entry: /work/<id>

(function () {
  const { esc, date, workById, posts, url, pills, image, excerptOf } = window.H;
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

  const logSection = logPosts.length
    ? '<section class="related" aria-labelledby="related-log"><h2 class="mono-label" id="related-log">BUILD LOG</h2><ul class="related__list">' +
        logPosts.map((p) =>
          '<li><a class="related__item" href="' + url.post(p.id) + '">' +
            '<div class="related__item-date">' + date.long(p.date) + '</div>' +
            '<div class="related__item-text">' + esc(excerptOf(p, 140)) + '</div>' +
          '</a></li>').join('') +
      '</ul></section>'
    : '';

  main.innerHTML =
    '<article class="work">' +
      '<div class="work__main">' +
        '<div><h1 class="page-title">' + esc(w.title) + H.draftTag(w) + '</h1><div class="work__desc">' + esc(w.desc || '') + '</div></div>' +
        '<div class="only-mobile">' + meta + '</div>' +
        (w.body ? '<div class="prose">' + MD.render(w.body) + '</div>' : '') +
        (w.gallery && w.gallery.length
          ? '<div class="gallery">' + w.gallery.map((img, i) => image(img, 'IMAGE ' + (i + 1))).join('') + '</div>'
          : '') +
      '</div>' +
      '<aside class="work__aside" aria-label="Details">' +
        '<div class="only-desktop">' + meta + '</div>' + logSection +
      '</aside>' +
    '</article>';
})();
