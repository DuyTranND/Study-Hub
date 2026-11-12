const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.md':'text/markdown; charset=utf-8','.ttf':'font/ttf','.svg':'image/svg+xml','.png':'image/png'};
http.createServer((req,res)=>{
  let pathname; try { pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch { res.writeHead(400); return res.end(); }
  if(pathname === '/_vercel/insights/script.js'){res.writeHead(200,{'Content-Type':'text/javascript'});return res.end('/* Analytics disabled for local copy. */');}
  if(pathname === '/') pathname = '/offline.html';
  let file = path.resolve(root, '.' + pathname);
  if(!file.startsWith(root + path.sep)){res.writeHead(403);return res.end();}
  if(!fs.existsSync(file) && !path.extname(pathname)) file=path.join(root,'offline.html');
  fs.stat(file,(err,stat)=>{
    if(err || !stat.isFile()){res.writeHead(404);return res.end('Not found');}
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    fs.createReadStream(file).pipe(res);
  });
}).listen(8766,'127.0.0.1',()=>console.log('AI Vin20K local: http://127.0.0.1:8766/'));