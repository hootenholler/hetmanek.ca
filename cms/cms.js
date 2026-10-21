// Editing bar added to every site page by the local CMS server (not part of the public site).

(function () {
  const H = window.H || { work: [], casestudies: [], letters: [] }; // the 404 page has no content scripts
  const path = location.pathname.replace(/\/+$/, '') || '/';
  const seg = path.split('/').filter(Boolean);
  const TYPES = { work: 'work', casestudies: 'casestudies', letters: 'letters' };
  const LABELS = { work: 'Work entry', casestudies: 'case study', letters: 'letter' };

  // Which entry is this page showing?
  let edit = null;
  if (seg.length === 2 && TYPES[seg[0]]) {
    const list = { work: H.work, casestudies: H.casestudies, letters: H.letters }[seg[0]];
    const entry = list.find((x) => x.id === decodeURIComponent(seg[1]));
    if (entry) edit = { type: seg[0], id: entry.id, label: LABELS[seg[0]], draft: !!entry.draft };
  }

  const editHref = (type, id) => '/__cms/edit?type=' + type + '&id=' + encodeURIComponent(id);

  const bar = document.createElement('div');
  bar.className = 'cms-bar';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Content editor');
  bar.innerHTML =
    '<div class="cms-bar__inner">' +
      '<span class="cms-bar__badge">Local CMS</span>' +
      '<span class="cms-bar__note">Saved changes go live when you commit and push in GitHub Desktop.</span>' +
      '<span class="cms-bar__actions">' +
        (edit
          ? (edit.draft ? '<span class="draft-tag">Draft</span>' : '') +
            '<a class="cms-btn cms-btn--light" href="' + editHref(edit.type, edit.id) + '">Edit this ' + edit.label + '</a>'
          : '') +
        '<a class="cms-btn" href="/__cms/new">+ Add new content</a>' +
      '</span>' +
    '</div>';
  document.body.insertBefore(bar, document.body.firstChild);

  // Build Log: an Edit link beside each post's date (posts re-render as they load and filter).
  const posts = document.getElementById('posts');
  if (posts) {
    const addLinks = () => posts.querySelectorAll('.post').forEach((post) => {
      if (post.querySelector('.cms-post-edit')) return;
      const a = document.createElement('a');
      a.className = 'cms-post-edit';
      a.href = editHref('buildlog', post.id);
      a.textContent = 'Edit post';
      post.firstElementChild.appendChild(a);
    });
    new MutationObserver(addLinks).observe(posts, { childList: true });
    addLinks();
  }
})();
