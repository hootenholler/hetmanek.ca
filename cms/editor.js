// Local CMS editor: /__cms/new (pick a type), /__cms/new?type=<type>, /__cms/edit?type=<type>&id=<id>.
// Reads and writes the whole content file through the local server's /__cms/api/content.

(function () {
  const root = document.getElementById('editor');
  const params = new URLSearchParams(location.search);
  const mode = location.pathname === '/__cms/edit' ? 'edit' : 'new';
  const type = params.get('type');
  const IS_MAC = /Mac|iPhone|iPad/.test(navigator.platform);
  const MOD = IS_MAC ? '⌘' : 'Ctrl+';

  const TYPES = {
    work: { label: 'Work', noun: 'Work entry', blurb: 'A project, role or engagement. Gets its own page and a row in the Work table.' },
    buildlog: { label: 'Build Log post', noun: 'Build Log post', blurb: 'A dated note. Appears on the Build Log, on Home, and on related Work pages.' },
    casestudies: { label: 'Case Study', noun: 'Case Study', blurb: 'Opportunity, Solution, Wins and Learning, with a one-line description.' },
    letters: { label: 'Letter or Article', noun: 'Letter', blurb: 'Long-form writing with a date, summary and cover image.' }
  };
  const SECTIONS = ['Opportunity', 'Solution', 'Wins', 'Learning'];
  const STATUSES = ['Alive', 'Active', 'In Dev', 'In Design', 'Done'];

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const slugify = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const ISO = /^\d{4}-\d{2}-\d{2}$/;
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const uniq = (xs) => Array.from(new Set(xs.filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const clone = (x) => JSON.parse(JSON.stringify(x));

  let content, entry, originalId = null, originalDate = null, slugTouched = false, dirty = false;

  // ---------- data ----------
  async function fetchContent() {
    const r = await fetch('/__cms/api/content', { cache: 'no-store' });
    if (!r.ok) throw new Error('Could not load content (' + r.status + ')');
    return r.json();
  }
  async function putContent(data) {
    const r = await fetch('/__cms/api/content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error((d.errors || ['Save failed (' + r.status + ')']).join('\n')); }
  }
  async function upload(file) {
    const folder = type + '/' + (type === 'buildlog' ? entry.date : entry.id || slugify(entry.title) || 'new');
    const r = await fetch('/__cms/api/upload?folder=' + encodeURIComponent(folder) + '&name=' + encodeURIComponent(file.name), { method: 'POST', body: file });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((d.errors || ['Upload failed']).join(' '));
    return d.src;
  }

  const blank = () => ({
    work: { id: '', title: '', type: '', status: '', desc: '', skills: [], updated: today(), body: '', gallery: [] },
    buildlog: { id: '', date: today(), engagements: [], skills: [], body: '' },
    casestudies: { id: '', title: '', description: '', skills: [], order: Math.max(0, ...content.casestudies.map((c) => c.order || 0)) + 1, sections: SECTIONS.map((label) => ({ label, body: '', image: null })) },
    letters: { id: '', title: '', date: today(), summary: '', skills: [], image: null, body: '' }
  })[type];

  const PREFIX = { work: '/work/', casestudies: '/casestudies/', letters: '/letters/' };
  const pageUrl = (e) => (PREFIX[type] ? PREFIX[type] + e.id : '/buildlog#' + e.id);

  // key paths like "sections.0.body" or "image.alt"
  const getPath = (obj, key) => key.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  const setPath = (obj, key, val) => { const ks = key.split('.'); const last = ks.pop(); ks.reduce((o, k) => o[k], obj)[last] = val; };

  // ---------- field markup ----------
  let uid = 0;
  const fid = () => 'f' + ++uid;
  const help = (text) => (text ? '<span class="f__help">' + text + '</span>' : '');
  const req = (on) => (on ? ' <span class="f__req" aria-hidden="true">required</span>' : '');

  function text(key, label, opts) {
    const o = opts || {}, id = fid();
    return '<div class="f"><label class="f__label" for="' + id + '">' + label + req(o.required) + '</label>' +
      '<input class="f__input" id="' + id + '" type="' + (o.type || 'text') + '" data-key="' + key + '" value="' + esc(getPath(entry, key)) + '"' +
        (o.list ? ' list="' + id + '-list"' : '') + (o.required ? ' required aria-required="true"' : '') + (o.placeholder ? ' placeholder="' + esc(o.placeholder) + '"' : '') + '>' +
      (o.list ? '<datalist id="' + id + '-list">' + o.list.map((v) => '<option value="' + esc(v) + '">').join('') + '</datalist>' : '') +
      help(o.help) + '</div>';
  }
  function area(key, label, opts) {
    const o = opts || {}, id = fid();
    return '<div class="f"><label class="f__label" for="' + id + '">' + label + '</label>' +
      '<textarea class="f__input" id="' + id + '" rows="' + (o.rows || 3) + '" data-key="' + key + '">' + esc(getPath(entry, key)) + '</textarea>' + help(o.help) + '</div>';
  }
  function slugField() {
    const id = fid(), prefix = PREFIX[type];
    return '<div class="f"><label class="f__label" for="' + id + '">Page address' + req(true) + '</label>' +
      '<div class="slug"><span class="slug__prefix">hetmanek.ca' + prefix + '</span><input class="f__input" id="' + id + '" data-key="id" data-slug value="' + esc(entry.id) + '" required aria-required="true"></div>' +
      help(mode === 'edit' ? 'Changing this changes the page’s address, and links to the old address will stop working.' : 'Made from the title. Lowercase letters, numbers and hyphens.') + '</div>';
  }
  function checkbox(key, label, helpText) {
    const id = fid();
    return '<div class="f f--check"><input type="checkbox" id="' + id + '" data-key="' + key + '"' + (getPath(entry, key) ? ' checked' : '') + '>' +
      '<label for="' + id + '">' + label + '</label>' + help(helpText) + '</div>';
  }
  function select(key, label, options, helpText) {
    const id = fid(), cur = getPath(entry, key) || '';
    return '<div class="f"><label class="f__label" for="' + id + '">' + label + '</label>' +
      '<select class="f__input" id="' + id + '" data-key="' + key + '">' +
        options.map((o) => '<option value="' + esc(o.value) + '"' + (o.value === cur ? ' selected' : '') + '>' + esc(o.label) + '</option>').join('') +
      '</select>' + help(helpText) + '</div>';
  }

  // Toggle pills (skills, engagements). options: [{ value, label }]
  const tagGroups = {};
  function tags(key, label, options, opts) {
    tagGroups[key] = { options, addable: opts && opts.addable };
    return '<div class="f" role="group" aria-labelledby="lbl-' + key + '"><span class="f__label" id="lbl-' + key + '">' + label + '</span>' +
      '<div class="tags" id="tags-' + key + '">' + tagsInner(key) + '</div>' + help(opts && opts.help) + '</div>';
  }
  function tagsInner(key) {
    const g = tagGroups[key], sel = getPath(entry, key) || [];
    const opts = g.addable ? uniq(g.options.map((o) => o.value).concat(sel)).map((v) => ({ value: v, label: v })) : g.options;
    return opts.map((o) => '<button type="button" class="filter-option" data-toggle="' + key + '" data-value="' + esc(o.value) + '" aria-pressed="' + (sel.indexOf(o.value) >= 0) + '">' + esc(o.label) + '</button>').join('') +
      (g.addable ? '<input class="f__input tag-new" data-tag-new="' + key + '" placeholder="Add new…" aria-label="Add a new ' + key.replace(/s$/, '') + ', then press Enter">' : '') +
      (opts.length || g.addable ? '' : '<span class="f__help">None yet.</span>');
  }

  // Markdown body with live preview and image insert.
  function markdown(key, label, opts) {
    const o = opts || {}, id = fid();
    return '<div class="f f--md">' +
      '<div class="f__head"><label class="f__label" for="' + id + '">' + label + req(o.required) + '</label>' +
        '<label class="cms-link">Insert image<input type="file" accept="image/*" class="visually-hidden" data-md-image="' + id + '"></label></div>' +
      '<div class="md">' +
        '<textarea class="f__input md__input" id="' + id + '" rows="' + (o.rows || 14) + '" data-key="' + key + '" data-preview="' + id + '-pv">' + esc(getPath(entry, key)) + '</textarea>' +
        '<div class="md__preview" aria-label="Preview"><span class="md__preview-label">PREVIEW</span><div class="prose" id="' + id + '-pv">' + MD.render(getPath(entry, key)) + '</div></div>' +
      '</div>' +
      '<details class="md-help"><summary>Formatting help</summary><table>' +
        [['## Heading', 'Section heading', 'Alt+2'], ['**bold**  *italic*', 'Bold, italic', 'B, I'], ['[link text](https://…)', 'Link', 'K'], ['> Quote', 'Pull quote', 'Shift+9'],
         ['- item', 'Bulleted list (1. for numbered)', 'Shift+8, Shift+7'], ['![description](/assets/…)', 'Image (use Insert image)'], ['https://youtu.be/…', 'YouTube video, on its own line'],
         ['| A | B |\n|---|---|\n| 1 | 2 |', 'Table (a header row, a --- divider row, then rows)'], ['A blank line', 'Starts a new paragraph']].map((r) =>
          '<tr><td><code>' + esc(r[0]) + '</code></td><td>' + r[1] + '</td><td class="md-help__keys">' + (r[2] ? r[2].split(', ').map((k) => '<kbd>' + MOD + k + '</kbd>').join(' ') : '') + '</td></tr>').join('') +
      '</table></details>' + help(o.help) + '</div>';
  }

  // Single image: key points at an { src, alt } object or null.
  function imageField(key, label, helpText) {
    return '<div class="f"><span class="f__label">' + label + '</span><div class="img-field" id="img-' + key.replace(/\./g, '-') + '">' + imageInner(key) + '</div>' + help(helpText) + '</div>';
  }
  function imageInner(key) {
    const img = getPath(entry, key), id = fid();
    return (img ? (img.src ? '<img class="img-field__thumb" src="' + esc(img.src) + '" alt="">' : '<div class="ph img-field__thumb">PLACEHOLDER</div>') : '') +
      '<div class="img-field__controls">' +
        '<label class="cms-btn cms-btn--light">' + (img && img.src ? 'Replace image' : 'Upload image') + '<input type="file" accept="image/*" class="visually-hidden" data-image="' + key + '"></label>' +
        (img ? '<button type="button" class="cms-link cms-link--danger" data-remove-image="' + key + '">Remove</button>' +
          '<label class="f__label" for="' + id + '">Description (alt text)</label><input class="f__input" id="' + id + '" data-key="' + key + '.alt" value="' + esc(img.alt) + '" placeholder="What the image shows, for screen readers">' : '') +
      '</div>';
  }
  function galleryField(key, label, helpText) {
    return '<div class="f"><span class="f__label">' + label + '</span><div class="gallery-field" id="gal-' + key + '">' + galleryInner(key) + '</div>' + help(helpText) + '</div>';
  }
  function galleryInner(key) {
    const list = getPath(entry, key) || [];
    return list.map((img, i) => '<div class="img-field">' + imageInner(key + '.' + i) + '</div>').join('') +
      '<label class="cms-btn cms-btn--light">Add images<input type="file" accept="image/*" multiple class="visually-hidden" data-gallery="' + key + '"></label>';
  }

  // ---------- forms ----------
  function formFields() {
    const allSkills = uniq([].concat(...['work', 'buildlog', 'casestudies', 'letters'].map((k) => [].concat(...content[k].map((x) => x.skills || []))))).map((v) => ({ value: v, label: v }));
    const workOptions = content.work.map((w) => ({ value: w.id, label: w.title }));
    const skills = tags('skills', 'Skills', allSkills, { addable: true, help: 'Click to select. Type a new one and press Enter to add it.' });

    if (type === 'work') return [
      text('title', 'Title', { required: true }), slugField(),
      text('desc', 'One-line description', { help: 'Shown under the title and in the Work table on Home.' }),
      '<div class="f-row">' +
        text('status', 'Status', { list: uniq(STATUSES.concat(content.work.map((w) => w.status))), placeholder: 'e.g. In Dev' }) +
        text('type', 'Type', { list: uniq(content.work.map((w) => w.type)), placeholder: 'e.g. Project' }) +
        text('updated', 'Last updated', { type: 'date', help: 'The site shows this, or the newest Build Log post about it if that’s later.' }) +
      '</div>',
      skills,
      markdown('body', 'Page body'),
      galleryField('gallery', 'Gallery', 'Shown under the body. Three images looks best.')
    ];
    if (type === 'buildlog') return [
      text('date', 'Date', { type: 'date', required: true }),
      tags('engagements', 'Engagements', workOptions, { help: 'Which Work entries this post is about. They become hashtags and link the post from those pages.' }),
      skills,
      markdown('body', 'Post', { required: true, rows: 12 }),
      checkbox('pinned', 'Pin to the top of Home', 'Only one post can be pinned. Pinning this one unpins the other.'),
      area('excerpt', 'Excerpt (optional)', { help: 'Shown on Home and in tables. Leave empty to use the start of the first paragraph.' })
    ];
    if (type === 'casestudies') return [
      text('title', 'Title', { required: true }), slugField(),
      text('description', 'Description', { required: true, help: 'One line, shown in the Case Studies table on Home.' }),
      text('order', 'Order', { type: 'number', help: 'Lower numbers come first in the Case Studies table.' }),
      skills
    ].concat(entry.sections.map((s, i) =>
      '<fieldset class="section-fs"><legend>' + esc(s.label) + '</legend>' +
        markdown('sections.' + i + '.body', s.label, { rows: 8 }) +
        imageField('sections.' + i + '.image', 'Image (optional)', 'Shown right-aligned under this section.') +
      '</fieldset>'));
    if (type === 'letters') return [
      text('title', 'Title', { required: true }), slugField(),
      text('date', 'Date', { type: 'date', required: true }),
      text('summary', 'Summary', { help: 'One line, shown under the title and in the Letters & Articles table.' }),
      skills,
      imageField('image', 'Cover image', '3:2 landscape looks best.'),
      markdown('body', 'Body', { rows: 18 })
    ];
  }

  function renderForm() {
    const isEdit = mode === 'edit';
    const published = isEdit && !entry.draft;
    document.title = (isEdit ? 'Edit ' : 'New ') + TYPES[type].noun + ' · hetmanek.ca CMS';
    root.innerHTML =
      '<div class="editor">' +
        '<p class="mono-label"><a href="/__cms/new">ADD NEW CONTENT</a> / ' + esc(TYPES[type].label.toUpperCase()) + '</p>' +
        '<h1 class="page-title editor__title">' + (isEdit ? 'Edit ' : 'New ') + esc(TYPES[type].noun) +
          (isEdit ? (entry.draft ? ' <span class="draft-tag">Draft</span>' : ' <span class="live-tag">Published</span>') : '') + '</h1>' +
        '<form class="editor__form" novalidate>' + formFields().join('') +
          '<div class="editor__errors" role="alert" id="errors"></div>' +
          '<div class="editor__actions">' +
            '<button type="submit" class="cms-btn" data-save="publish">' + (published ? 'Save changes' : 'Publish') + '</button>' +
            '<button type="button" class="cms-btn cms-btn--light" data-save="draft">' + (published ? 'Unpublish (save as draft)' : 'Save draft & preview') + '</button>' +
            '<a class="cms-link" href="' + (isEdit ? pageUrl({ id: originalId }) : '/') + '">Cancel</a>' +
            (isEdit ? '<button type="button" class="cms-link cms-link--danger editor__delete" data-delete>Delete</button>' : '') +
            '<span class="editor__status" id="status" role="status"></span>' +
          '</div>' +
        '</form>' +
      '</div>';
  }

  function renderPicker() {
    document.title = 'Add new content · hetmanek.ca CMS';
    root.innerHTML =
      '<div class="editor">' +
        '<h1 class="page-title editor__title">Add new content</h1>' +
        '<p class="editor__lede">What kind of page are you making?</p>' +
        '<ul class="picker">' + Object.keys(TYPES).map((k) =>
          '<li><a class="picker__card" href="/__cms/new?type=' + k + '"><span class="picker__name">' + esc(TYPES[k].label) + '</span><span class="picker__blurb">' + esc(TYPES[k].blurb) + '</span></a></li>'
        ).join('') + '</ul>' +
      '</div>';
  }

  // ---------- events ----------
  function markDirty() { dirty = true; const s = document.getElementById('status'); if (s) s.textContent = 'Unsaved changes'; }

  root.addEventListener('input', (e) => {
    const el = e.target, key = el.dataset && el.dataset.key;
    if (!key) return;
    let val = el.type === 'checkbox' ? el.checked : el.value;
    if (el.type === 'number') val = el.value === '' ? '' : Number(el.value);
    if (el.hasAttribute('data-slug')) { slugTouched = true; }
    setPath(entry, key, val);
    if (key === 'title' && mode === 'new' && !slugTouched) {
      entry.id = slugify(val);
      const slug = root.querySelector('[data-slug]');
      if (slug) slug.value = entry.id;
    }
    if (el.dataset.preview) document.getElementById(el.dataset.preview).innerHTML = MD.render(val);
    markDirty();
  });
  // ---------- formatting shortcuts in Markdown fields ----------
  // Replaces start..end with text through execCommand so ⌘Z still works; it also fires 'input', which updates the preview.
  function replaceRange(ta, start, end, text, selStart, selEnd) {
    ta.focus();
    ta.setSelectionRange(start, end);
    if (!document.execCommand('insertText', false, text)) {
      ta.setRangeText(text, start, end);
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
    ta.setSelectionRange(start + selStart, start + selEnd);
  }

  // Bold (**) and italic (*) toggle on the selection. Stars around it: 1 = italic, 2 = bold, 3 = both.
  function toggleWrap(ta, mark) {
    const v = ta.value;
    let s = ta.selectionStart, e = ta.selectionEnd;
    while (s < e && /\s/.test(v[s])) s++;
    while (e > s && /\s/.test(v[e - 1])) e--;
    const run = (i, dir) => { let n = 0; while (v[i + dir * n + (dir < 0 ? -1 : 0)] === '*') n++; return n; };
    const has = (n) => (mark.length === 2 ? n >= 2 : n % 2 === 1);
    const inner = v.slice(s, e);
    if (inner.length > 2 * mark.length && has(run(s, 1)) && has(run(e, -1))) {
      return replaceRange(ta, s, e, inner.slice(mark.length, -mark.length), 0, inner.length - 2 * mark.length);
    }
    if (has(run(s, -1)) && has(run(e, 1))) {
      return replaceRange(ta, s - mark.length, e + mark.length, inner, 0, inner.length);
    }
    replaceRange(ta, s, e, mark + inner + mark, mark.length, mark.length + inner.length);
  }

  // Link: wraps the selection as [text](url) and selects "url" to type over.
  function insertLink(ta) {
    const text = ta.value.slice(ta.selectionStart, ta.selectionEnd) || 'link text';
    replaceRange(ta, ta.selectionStart, ta.selectionEnd, '[' + text + '](url)', text.length + 3, text.length + 6);
  }

  // Line formats toggle on every selected line; a new one replaces any other line format.
  const LINE_FORMATS = { heading: /^## /, bullet: /^- /, number: /^\d+\. /, quote: /^> / };
  const LINE_PREFIX = { heading: () => '## ', bullet: () => '- ', number: (i) => (i + 1) + '. ', quote: () => '> ' };
  function toggleLines(ta, kind) {
    const v = ta.value;
    const start = v.lastIndexOf('\n', ta.selectionStart - 1) + 1;
    let end = v.indexOf('\n', Math.max(ta.selectionEnd - (ta.selectionEnd > ta.selectionStart && v[ta.selectionEnd - 1] === '\n' ? 1 : 0), start));
    if (end < 0) end = v.length;
    const lines = v.slice(start, end).split('\n');
    const on = lines.every((l) => !l.trim() || LINE_FORMATS[kind].test(l));
    const strip = (l) => Object.keys(LINE_FORMATS).reduce((acc, k) => acc.replace(LINE_FORMATS[k], ''), l);
    let n = 0;
    const out = lines.map((l) => (!l.trim() ? l : on ? strip(l) : LINE_PREFIX[kind](n++) + strip(l))).join('\n');
    replaceRange(ta, start, end, out, 0, out.length);
  }

  // ⌘ on a Mac, Ctrl elsewhere. Shifted digits are read from e.code, since Shift changes e.key.
  const SHORTCUTS = {
    'KeyB': (ta) => toggleWrap(ta, '**'),
    'KeyI': (ta) => toggleWrap(ta, '*'),
    'KeyK': insertLink,
    'Shift+Digit7': (ta) => toggleLines(ta, 'number'),
    'Shift+Digit8': (ta) => toggleLines(ta, 'bullet'),
    'Shift+Digit9': (ta) => toggleLines(ta, 'quote'),
    'Alt+Digit2': (ta) => toggleLines(ta, 'heading')
  };
  root.addEventListener('keydown', (e) => {
    const ta = e.target.closest('.md__input');
    if (!ta || !(IS_MAC ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey)) return;
    const run = SHORTCUTS[(e.shiftKey ? 'Shift+' : '') + (e.altKey ? 'Alt+' : '') + e.code];
    if (!run) return;
    e.preventDefault();
    run(ta);
  });

  root.addEventListener('change', (e) => { if (e.target.matches('select[data-key], input[type=checkbox][data-key]')) e.target.dispatchEvent(new Event('input', { bubbles: true })); });

  function refreshTags(key, focusValue) {
    const box = document.getElementById('tags-' + key);
    box.innerHTML = tagsInner(key);
    const btn = focusValue != null && Array.from(box.querySelectorAll('[data-value]')).find((b) => b.dataset.value === focusValue);
    if (btn) btn.focus(); else if (focusValue === null) box.querySelector('.tag-new').focus();
  }
  const refreshImage = (key) => { document.getElementById('img-' + key.replace(/\./g, '-')).innerHTML = imageInner(key); };
  const refreshGallery = (key) => { document.getElementById('gal-' + key).innerHTML = galleryInner(key); };

  root.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-toggle], [data-remove-image], [data-save], [data-delete]');
    if (!t) return;
    if (t.dataset.toggle) {
      const key = t.dataset.toggle, v = t.dataset.value, list = getPath(entry, key);
      setPath(entry, key, list.indexOf(v) >= 0 ? list.filter((x) => x !== v) : list.concat([v]));
      refreshTags(key, v); markDirty();
    } else if (t.dataset.removeImage) {
      const key = t.dataset.removeImage, m = key.match(/^(\w+)\.(\d+)$/);
      if (m && Array.isArray(entry[m[1]])) { entry[m[1]].splice(Number(m[2]), 1); refreshGallery(m[1]); }
      else { setPath(entry, key, null); refreshImage(key); }
      markDirty();
    } else if (t.dataset.save) {
      e.preventDefault();
      save(t.dataset.save === 'publish');
    } else if (t.hasAttribute('data-delete')) {
      remove();
    }
  });
  root.addEventListener('submit', (e) => { e.preventDefault(); save(true); });

  root.addEventListener('keydown', (e) => {
    const input = e.target.closest('[data-tag-new]');
    if (!input || (e.key !== 'Enter' && e.key !== ',')) return;
    e.preventDefault();
    const key = input.dataset.tagNew, v = input.value.trim().replace(/,$/, '');
    if (!v) return;
    const list = getPath(entry, key);
    if (list.indexOf(v) < 0) setPath(entry, key, list.concat([v]));
    refreshTags(key, null); markDirty();
  });

  root.addEventListener('change', async (e) => {
    const input = e.target;
    if (!input.files || !input.files.length) return;
    const files = Array.from(input.files);
    const status = document.getElementById('status');
    status.textContent = 'Uploading…';
    try {
      if (input.dataset.image) {
        const key = input.dataset.image, src = await upload(files[0]);
        const cur = getPath(entry, key);
        setPath(entry, key, { src, alt: (cur && cur.alt) || '' });
        refreshImage(key);
      } else if (input.dataset.gallery) {
        const key = input.dataset.gallery;
        for (const f of files) entry[key].push({ src: await upload(f), alt: '' });
        refreshGallery(key);
      } else if (input.dataset.mdImage) {
        const ta = document.getElementById(input.dataset.mdImage), src = await upload(files[0]);
        const at = ta.selectionStart || ta.value.length;
        const snippet = (at && ta.value[at - 1] !== '\n' ? '\n\n' : '') + '![Describe the image](' + src + ')\n\n';
        ta.value = ta.value.slice(0, at) + snippet + ta.value.slice(at);
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        ta.focus();
        ta.setSelectionRange(at + snippet.indexOf('[') + 1, at + snippet.indexOf(']'));
      }
      status.textContent = 'Uploaded. Remember to save.';
      dirty = true;
    } catch (err) {
      status.textContent = '';
      showErrors([err.message]);
    }
    input.value = '';
  });

  window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  // ---------- validate, save, delete ----------
  function showErrors(errs) {
    const box = document.getElementById('errors');
    box.innerHTML = errs.length ? '<p>Please fix:</p><ul>' + errs.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '';
    if (errs.length) box.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function check(list) {
    const errs = [];
    if (type !== 'buildlog') {
      if (!String(entry.title || '').trim()) errs.push('Add a title.');
      if (!SLUG.test(entry.id || '')) errs.push('The page address can only use lowercase letters, numbers and single hyphens.');
      else if (list.some((x) => x.id === entry.id && x.id !== originalId)) errs.push('Another ' + TYPES[type].noun + ' already uses the address “' + entry.id + '”.');
    }
    if ((type === 'buildlog' || type === 'letters') && !ISO.test(entry.date || '')) errs.push('Add a date.');
    if (type === 'buildlog' && !String(entry.body || '').trim()) errs.push('Write the post.');
    return errs;
  }

  function uniqueLogId(list, date) {
    const taken = new Set(list.filter((p) => p.id !== originalId).map((p) => p.id));
    if (!taken.has(date)) return date;
    let n = 2;
    while (taken.has(date + '-' + n)) n++;
    return date + '-' + n;
  }

  async function save(publish) {
    const status = document.getElementById('status');
    try {
      const fresh = await fetchContent(); // re-read so hand edits made meanwhile aren't overwritten
      const list = fresh[type];
      const errs = check(list);
      showErrors(errs);
      if (errs.length) return;

      const e = clone(entry);
      for (const k of Object.keys(e)) if (typeof e[k] === 'string') e[k] = e[k].trim();
      if (type === 'buildlog') {
        if (!e.id || e.date !== originalDate) e.id = uniqueLogId(list, e.date);
        if (e.pinned) list.forEach((p) => { delete p.pinned; }); else delete e.pinned;
        if (!e.excerpt) delete e.excerpt;
      }
      if (type === 'casestudies' && e.order === '') delete e.order;

      // Renaming a Work entry: keep Build Log posts pointing at it.
      if (type === 'work' && mode === 'edit' && e.id !== originalId) {
        fresh.buildlog.forEach((p) => { p.engagements = (p.engagements || []).map((x) => (x === originalId ? e.id : x)); });
      }

      // The working copy started as a full copy of the entry, so it replaces it outright.
      const saved = e;
      if (publish) delete saved.draft; else saved.draft = true;
      const idx = mode === 'edit' ? list.findIndex((x) => x.id === originalId) : -1;
      if (idx >= 0) list[idx] = saved;
      else if (type === 'work') list.unshift(saved);
      else list.push(saved);

      status.textContent = 'Saving…';
      await putContent(fresh);
      dirty = false;
      status.textContent = 'Saved.';
      location.href = pageUrl(saved);
    } catch (err) {
      status.textContent = '';
      showErrors(err.message.split('\n'));
    }
  }

  async function remove() {
    const name = entry.title || entry.date;
    if (!confirm('Delete “' + name + '”?\n\nIt’s removed from content.js. Until you commit, you can bring it back by discarding the change in GitHub Desktop.')) return;
    try {
      const fresh = await fetchContent();
      fresh[type] = fresh[type].filter((x) => x.id !== originalId);
      if (type === 'work') {
        fresh.buildlog.forEach((p) => { p.engagements = (p.engagements || []).filter((x) => x !== originalId); });
      }
      await putContent(fresh);
      dirty = false;
      location.href = '/';
    } catch (err) {
      showErrors(err.message.split('\n'));
    }
  }

  // ---------- start ----------
  (async function start() {
    try {
      content = await fetchContent();
    } catch (err) {
      root.innerHTML = '<div class="editor"><h1 class="page-title editor__title">Can’t load content</h1><p class="editor__lede">' + esc(err.message) + '</p></div>';
      return;
    }
    if (!TYPES[type]) return renderPicker();
    if (mode === 'edit') {
      const found = content[type].find((x) => x.id === params.get('id'));
      if (!found) {
        root.innerHTML = '<div class="editor"><h1 class="page-title editor__title">Not found</h1><p class="editor__lede">There’s no ' + esc(TYPES[type].noun) + ' with that address. <a href="/">Back to site</a></p></div>';
        return;
      }
      entry = clone(found);
      originalId = found.id;
      originalDate = found.date || null;
      if (type === 'work') { entry.skills = entry.skills || []; entry.gallery = entry.gallery || []; entry.body = entry.body || ''; }
      if (type === 'buildlog') { entry.engagements = entry.engagements || []; entry.skills = entry.skills || []; }
      if (type === 'casestudies') {
        entry.skills = entry.skills || [];
        entry.sections = SECTIONS.map((label) => (entry.sections || []).find((s) => s.label === label) || { label, body: '', image: null });
      }
      if (type === 'letters') entry.skills = entry.skills || [];
    } else {
      entry = blank();
    }
    renderForm();
  })();
})();
