// Construit le site de production dans dist/ : copie src/ puis public/.
// Aucune dépendance externe : Node.js >= 22 suffit.
const fs = require('node:fs');
const path = require('node:path');

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dest);
    else if (entry.isFile()) fs.copyFileSync(src, dest);
  }
}

try {
  fs.rmSync('dist', { recursive: true, force: true });
} catch (e) {
  console.warn('Impossible de vider dist/ (' + e.code + ') : les fichiers seront écrasés.');
}
copyDir('src', 'dist');
copyDir('public', 'dist');
console.log('Build terminé → dist/');
