// Copie du catalogue publiée avec le site (dist/catalogue.json) : affichée à la première visite en
// attendant l'API Render (en veille : ~40 s de réveil), ou à sa place si elle est injoignable.
// Lancé par deploy.yml après le build. API injoignable : on garde la copie vide ([]) sans faire
// échouer le déploiement ; le site attend alors l'API comme avant.
// Usage : node scripts/catalogue-snapshot.mjs [dossier]   (par défaut : dist)
import fs from 'node:fs';
import path from 'node:path';

const API = (process.env.PROD_API_URL || 'https://papeterie-api-kshr.onrender.com').replace(/\/$/, '');
const out = path.join(process.argv[2] || 'dist', 'catalogue.json');

async function fetchProducts() {
  // Trois essais de 90 s : le premier réveille souvent le serveur
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${API}/products/`, { signal: AbortSignal.timeout(90_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`Essai ${attempt} : ${err.message}`);
    }
  }
  return null;
}

const list = await fetchProducts();
if (!Array.isArray(list) || list.length === 0) {
  console.log('::warning::Catalogue non récupéré : copie vide publiée, le site attendra l’API.');
  process.exit(0);
}
// Articles disponibles seulement, sans le stock (inutile au site, et à ne pas publier)
const products = list
  .filter((p) => p.available !== false)
  .map(({ stock, status, available, ...p }) => p);
fs.writeFileSync(out, JSON.stringify(products));
console.log(`${products.length} articles écrits dans ${out} (${Math.round(fs.statSync(out).size / 1024)} Ko).`);
