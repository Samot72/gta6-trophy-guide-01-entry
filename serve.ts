// serve.ts — a tiny static server for app/ (Node 22, standard library only),
// so the line can be ridden locally with no build step:
//   node serve.ts            → http://localhost:8080
//   node serve.ts --port N   → another port
// It serves only files inside app/, with the MIME types a browser needs.

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./app', import.meta.url)));
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const requested = portIndex === -1 ? 8080 : Number(args[portIndex + 1]);
const port = Number.isInteger(requested) && requested > 0 && requested < 65536 ? requested : 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const rel = normalize(decodeURIComponent(url.pathname)).replace(/^[/\\]+/, '');
  const file = resolve(join(root, rel === '' ? 'index.html' : rel));
  if (file !== root && !file.startsWith(root + sep)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  let target = file;
  try {
    if (statSync(target).isDirectory()) target = join(target, 'index.html');
    const info = statSync(target);
    res.writeHead(200, { 'content-type': MIME[extname(target).toLowerCase()] ?? 'application/octet-stream', 'content-length': info.size });
    createReadStream(target).pipe(res);
  } catch {
    res.writeHead(404).end('not found');
  }
});

server.listen(port, () => {
  console.log(`Route 55 serving app/ at http://localhost:${port}`);
});
