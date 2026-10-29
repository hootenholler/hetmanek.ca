// Small Markdown renderer for page bodies, shared by the site, the local CMS editor and the CMS page writer.
// Supports: ## / ### headings, paragraphs, **bold**, *italic*, [links](url), ![images](src),
// > quotes, - and 1. lists, | tables |, and a YouTube link on its own line (embedded). Raw HTML is escaped.

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = (u) => (/^(https?:\/\/|mailto:|\/|#)/i.test(u) ? u : '');

const IMG = /!\[([^\]]*)\]\(([^)\s]+)\)/g;
const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

const inline = (s) => esc(s)
  .replace(IMG, (m, alt, src) => (safeUrl(src) ? '<img src="' + src + '" alt="' + alt + '" loading="lazy">' : ''))
  .replace(LINK, (m, text, href) => (safeUrl(href) ? '<a href="' + href + '">' + text + '</a>' : text))
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?![*\w])/g, '$1<em>$2</em>')
  .replace(/(^|[^\w])_([^_\s][^_]*?)_(?!\w)/g, '$1<em>$2</em>')
  .replace(/\n/g, '<br>');

const youtubeId = (line) => {
  const m = line.match(/^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})\S*$/);
  return m ? m[1] : '';
};

// Blocks are separated by blank lines; headings always stand alone.
const blocks = (md) => String(md || '')
  .replace(/\r\n?/g, '\n')
  .replace(/^(#{1,3} .*)$/gm, '\n$1\n')
  .split(/\n\s*\n/)
  .map((b) => b.trim())
  .filter(Boolean);

const every = (lines, rx) => lines.every((l) => rx.test(l));

// Tables: a header row, a |---|:---:|---:| divider (colons set alignment), then body rows. \| is a literal pipe.
// An escaped \| is swapped for PIPE while a row is split on its real pipes. (A regex lookbehind would do this
// in one step, but Safari before 16.4 can't parse one, and a parse error would stop every page from rendering.)
const PIPE = '\u0000';
const DIVIDER = /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?$/;
const isTable = (lines) => lines.length >= 2 && /\|/.test(lines[0]) && DIVIDER.test(lines[1]);
const cells = (line) => line.trim().replace(/\\\|/g, PIPE).replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim().split(PIPE).join('|'));
const table = (lines) => {
  const align = cells(lines[1]).map((c) => (/^:-+:$/.test(c) ? 'center' : /-:$/.test(c) ? 'right' : ''));
  const row = (line, tag) => '<tr>' + align.map((a, i) =>
    '<' + tag + (a ? ' class="align-' + a + '"' : '') + '>' + inline(cells(line)[i] || '') + '</' + tag + '>').join('') + '</tr>';
  return '<div class="md-table"><table><thead>' + row(lines[0], 'th') + '</thead>' +
    (lines.length > 2 ? '<tbody>' + lines.slice(2).map((l) => row(l, 'td')).join('') + '</tbody>' : '') + '</table></div>';
};

export const render = (md) => blocks(md).map((b) => {
  const lines = b.split('\n');
  let m;
  if ((m = b.match(/^(#{1,3}) (.*)$/))) return m[1].length === 3 ? '<h3>' + inline(m[2]) + '</h3>' : '<h2>' + inline(m[2]) + '</h2>';
  if (every(lines, /^>/)) return '<blockquote>' + inline(lines.map((l) => l.replace(/^>\s?/, '')).join('\n')) + '</blockquote>';
  if (every(lines, /^[-*] /)) return '<ul>' + lines.map((l) => '<li>' + inline(l.slice(2)) + '</li>').join('') + '</ul>';
  if (isTable(lines)) return table(lines);
  if (every(lines, /^\d+[.)] /)) return '<ol>' + lines.map((l) => '<li>' + inline(l.replace(/^\d+[.)] /, '')) + '</li>').join('') + '</ol>';
  const yt = lines.length === 1 && youtubeId(b);
  if (yt) return '<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/' + yt + '" title="YouTube video" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe></div>';
  if (/^!\[[^\]]*\]\([^)\s]+\)$/.test(b)) return inline(b);
  return '<p>' + inline(b) + '</p>';
}).join('');

// Plain text, for excerpts.
export const toText = (md) => String(md || '')
  .replace(IMG, '')
  .replace(LINK, '$1')
  .replace(/\*\*|__/g, '')
  .replace(/(^|\s)[*_](\S)/g, '$1$2').replace(/(\S)[*_](?=\s|$|[.,;:!?])/g, '$1')
  .replace(/^(#{1,3}|>|[-*]|\d+[.)]) ?/gm, '')
  .replace(/^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?$/gm, '')
  .replace(/\\\|/g, PIPE).replace(/\s*\|\s*/g, ' ').split(PIPE).join('|')
  .replace(/\s+/g, ' ')
  .trim();

export const firstParagraph = (md) => {
  const b = blocks(md).find((x) => !/^(#{1,3} |!\[)/.test(x) && !youtubeId(x) && !isTable(x.split('\n')));
  return b ? toText(b) : '';
};
