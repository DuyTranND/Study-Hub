const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.png': 'image/png', '.ico': 'image/x-icon' };
const port = Number(process.env.PORT) || 8768;

http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); return res.end('Bad request'); }
  if (pathname === '/_vercel/insights/script.js') { res.writeHead(200, { 'Content-Type': 'text/javascript' }); return res.end(''); }
  if (pathname === '/') pathname = '/index.html';
  // Original Vin20K Vite bundle expects root-relative asset URLs.
  if (/^\/(assets|vendor\/fonts|course)\//.test(pathname)) pathname = '/sources/vin20k-ai-phase1-quiz' + pathname;
  if (pathname === '/vin20k') pathname = '/sources/vin20k-ai-phase1-quiz/offline.html';
  if (pathname === '/ai20k') pathname = '/sources/ai20k-exam-prep/offline.html';
  if (pathname === '/hirin') { res.writeHead(302, { Location: '/hirin/' }); return res.end(); }
  if (pathname.startsWith('/hirin/')) pathname = '/sources/ai-quiz/' + (pathname.slice('/hirin/'.length) || 'index.html');
  const absolute = path.resolve(root, '.' + pathname.replaceAll('/', path.sep));
  if (absolute !== root && !absolute.startsWith(root + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.stat(absolute, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': mime[path.extname(absolute).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    fs.createReadStream(absolute).pipe(res);
  });
}).listen(port, '127.0.0.1', () => console.log('AI20K All-in-One running: http://127.0.0.1:' + port + '/'));
