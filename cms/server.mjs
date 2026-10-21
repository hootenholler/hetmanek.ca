// Local CMS for hetmanek.ca. Run with `npm run cms` (or double-click start-cms.command).
// Serves the site from /src with an editing bar, plus an editor that writes src/js/content.js
// and uploads images into src/assets. Nothing in /cms is deployed. Uses only Node's standard library.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const CMS = path.join(ROOT, 'cms');
const CONTENT = path.join(SRC, 'js', 'content.js');
const ASSETS = path.join(SRC, 'assets');
const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT) || 4321;
const MAX_UPLOAD = 15 * 1024 * 1024;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif',
  '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8'
};
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg']);
const CMS_FILES = new Set(['cms.js', 'cms.css', 'editor.js']);
const REWRITES = [[/^\/(work|casestudies|letters)\/[^/]+\/?$/, '/$1/index.html']];

// Added to every site page so it knows it's in CMS mode (drafts visible, editing bar shown).
const INJECT = '<script>window.CMS_MODE = true;</script><link rel="stylesheet" href="/__cms/cms.css"><script src="/__cms/cms.js" defer></script>';

// ---------- content file ----------
const MARKER = 'window.SITE =';
const MARKER_LINE = /^window\.SITE\s*=/m; // the real assignment, at the start of a line (not a mention in a comment)
function readContent() {
  const text = fs.readFileSync(CONTENT, 'utf8');
  const m = MARKER_LINE.exec(text);
  if (!m) throw new Error('content.js is missing the line starting "window.SITE ="');
  const at = m.index;
  const json = text.slice(text.indexOf('{', at), text.lastIndexOf('}') + 1);
  return { header: text.slice(0, at), data: JSON.parse(json) };
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
function validate(d) {
  const errs = [];
  for (const key of ['work', 'buildlog', 'casestudies', 'letters']) {
    if (!Array.isArray(d[key])) { errs.push(key + ' must be a list'); continue; }
    const seen = new Set();
    d[key].forEach((e, i) => {
      const where = key + ' #' + (i + 1) + (e && e.title ? ' (' + e.title + ')' : '');
      if (!e || typeof e !== 'object') return errs.push(where + ' is not an entry');
      const idOk = key === 'buildlog' ? /^\d{4}-\d{2}-\d{2}(-\d+)?$/.test(e.id) : SLUG.test(e.id);
      if (!idOk) errs.push(where + ': invalid id "' + e.id + '"');
      if (seen.has(e.id)) errs.push(where + ': duplicate id "' + e.id + '"');
      seen.add(e.id);
      if (key !== 'buildlog' && !String(e.title || '').trim()) errs.push(where + ': title is required');
      for (const f of ['date', 'updated']) if (e[f] && !ISO.test(e[f])) errs.push(where + ': ' + f + ' must be YYYY-MM-DD');
      if ((key === 'buildlog' || key === 'letters') && !ISO.test(e.date || '')) errs.push(where + ': date is required');
    });
  }
  if (d.buildlog && d.buildlog.filter((p) => p.pinned).length > 1) errs.push('Only one Build Log post can be pinned');
  return errs;
}

function writeContent(data) {
  const { header } = readContent();
  const text = header + MARKER + ' ' + JSON.stringify(data, null, 2) + ';\n';
  const tmp = CONTENT + '.tmp';
  fs.writeFileSync(tmp, text);
  fs.renameSync(tmp, CONTENT);
}

// ---------- uploads: src/assets/<folder>/<name>, lowercase-hyphenated, never overwriting ----------
const clean = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\w.\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^[-.]+|[-.]+$/g, '');
function saveUpload(folder, name, buf) {
  const ext = path.extname(name).toLowerCase();
  if (!IMAGE_EXT.has(ext)) throw new Error('Only image files can be uploaded (' + [...IMAGE_EXT].join(', ') + ')');
  const parts = String(folder || 'uploads').split('/').map(clean).filter(Boolean);
  const dir = path.join(ASSETS, ...parts);
  if (!dir.startsWith(ASSETS + path.sep) && dir !== ASSETS) throw new Error('Bad folder');
  fs.mkdirSync(dir, { recursive: true });
  const base = clean(path.basename(name, path.extname(name))) || 'image';
  let file = base + ext, n = 2;
  while (fs.existsSync(path.join(dir, file))) file = base + '-' + n++ + ext;
  fs.writeFileSync(path.join(dir, file), buf);
  return '/' + path.relative(SRC, path.join(dir, file)).split(path.sep).join('/');
}

// ---------- http ----------
const send = (res, status, body, type) => {
  res.writeHead(status, { 'Content-Type': type || 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
};
const json = (res, status, obj) => send(res, status, JSON.stringify(obj), 'application/json');

const readBody = (req, limit) => new Promise((resolve, reject) => {
  const chunks = []; let size = 0;
  req.on('data', (c) => { size += c.length; if (size > limit) { reject(new Error('Too large (max ' + Math.round(limit / 1048576) + ' MB)')); req.destroy(); } else chunks.push(c); });
  req.on('end', () => resolve(Buffer.concat(chunks)));
  req.on('error', reject);
});

function serveFile(res, file, status) {
  const ext = path.extname(file).toLowerCase();
  let body = fs.readFileSync(file);
  if (ext === '.html' && file.startsWith(SRC)) body = body.toString('utf8').replace('</head>', INJECT + '</head>');
  send(res, status || 200, body, MIME[ext] || 'application/octet-stream');
}

function serveSite(res, pathname) {
  for (const [rx, to] of REWRITES) if (rx.test(pathname)) { pathname = pathname.replace(rx, to); break; }
  let file = path.join(SRC, decodeURIComponent(pathname));
  if (file !== SRC && !file.startsWith(SRC + path.sep)) return send(res, 403, 'Forbidden');
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) return serveFile(res, path.join(SRC, '404.html'), 404);
  serveFile(res, file);
}

// Only answer requests addressed to this machine, and only accept writes from the CMS's own pages.
const localHost = (h) => /^(127\.0\.0\.1|localhost)(:\d+)?$/.test(h || '');
const sameOrigin = (req) => !req.headers.origin || localHost(req.headers.origin.replace(/^https?:\/\//, ''));

const server = http.createServer(async (req, res) => {
  try {
    if (!localHost(req.headers.host)) return send(res, 403, 'Forbidden');
    const u = new URL(req.url, 'http://' + req.headers.host);
    const p = u.pathname;

    if (p === '/__cms/api/content') {
      if (req.method === 'GET') return json(res, 200, readContent().data);
      if (req.method === 'PUT') {
        if (!sameOrigin(req)) return send(res, 403, 'Forbidden');
        let data;
        try { data = JSON.parse((await readBody(req, 5 * 1048576)).toString('utf8')); } catch { return json(res, 400, { errors: ['Could not read the content sent'] }); }
        const errors = validate(data);
        if (errors.length) return json(res, 400, { errors });
        writeContent(data);
        return json(res, 200, { ok: true });
      }
      return send(res, 405, 'Method not allowed');
    }
    if (p === '/__cms/api/upload' && req.method === 'POST') {
      if (!sameOrigin(req)) return send(res, 403, 'Forbidden');
      try {
        const buf = await readBody(req, MAX_UPLOAD);
        return json(res, 200, { src: saveUpload(u.searchParams.get('folder'), u.searchParams.get('name') || 'image.jpg', buf) });
      } catch (e) { return json(res, 400, { errors: [e.message] }); }
    }
    if (p === '/__cms/new' || p === '/__cms/edit') return serveFile(res, path.join(CMS, 'editor.html'));
    if (p.startsWith('/__cms/')) {
      const name = p.slice('/__cms/'.length);
      return CMS_FILES.has(name) ? serveFile(res, path.join(CMS, name)) : send(res, 404, 'Not found');
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
    serveSite(res, p);
  } catch (e) {
    console.error(e);
    send(res, 500, 'Server error: ' + e.message);
  }
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') console.error('Port ' + PORT + ' is busy. Is the CMS already running? Try http://127.0.0.1:' + PORT);
  else console.error(e);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  const url = 'http://127.0.0.1:' + PORT;
  console.log('\n  hetmanek.ca CMS running at ' + url + '\n  Edits are saved to src/. Commit and push them in GitHub Desktop.\n  Press Ctrl+C to stop.\n');
  if (!process.argv.includes('--no-open')) exec((process.platform === 'darwin' ? 'open ' : process.platform === 'win32' ? 'start ' : 'xdg-open ') + url);
});
