// Petit serveur local avec les mêmes en-têtes de sécurité qu'en production.
// Usage : node scripts/serve.cjs [dossier]   (par défaut : dist)
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(process.argv[2] || 'dist');
const port = Number(process.env.PORT) || 4200;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8'
};
const csp = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

if (!fs.existsSync(root)) {
  console.error(`Dossier introuvable : ${root}. Lancez d'abord "npm run build".`);
  process.exit(1);
}

http.createServer((req, res) => {
  let filename;
  try {
    filename = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  } catch {
    res.writeHead(400).end();
    return;
  }
  if (filename === root || filename === root + path.sep) filename = path.join(root, 'index.html');
  if (!filename.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  if (!fs.existsSync(filename) || !fs.statSync(filename).isFile()) { res.writeHead(404).end(); return; }

  const ext = path.extname(filename);
  res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
  res.setHeader('Content-Security-Policy', csp);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  // HTML ne se met jamais en cache (catalogue et prix toujours à jour).
  // JS et CSS sont rechargés à chaque visite pour éviter de servir un catalogue périmé ;
  // les images (nommées, immuables) peuvent être mises en cache par le navigateur.
  res.setHeader('Cache-Control', ext === '.html' || ext === '.js' || ext === '.css' ? 'no-cache' : 'public, max-age=3600');
  fs.createReadStream(filename).pipe(res);
}).listen(port, '127.0.0.1', () => {
  console.log(`Site servi depuis ${path.relative(process.cwd(), root) || '.'} → http://127.0.0.1:${port}`);
});
