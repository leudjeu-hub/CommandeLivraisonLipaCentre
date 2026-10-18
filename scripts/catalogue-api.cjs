// Développement : génère src/js/products.js à partir de l’API (GET /products/)
// au lieu de catalogue/catalogue.csv. La grille de livraison reste catalogue/livraison.csv.
//
// Usage : node scripts/catalogue-api.cjs        (API : $CATALOGUE_API, par défaut http://localhost:8000/)
// Lancé par `npm run dev`. `npm test` et `npm run build` utilisent toujours le tableau CSV.
// Les articles de l’API sont convertis en tableau CSV puis passés à scripts/catalogue.cjs :
// mêmes vérifications (id, catégorie, prix, image locale…) que pour le tableau.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const API = process.env.CATALOGUE_API || 'http://localhost:8000/';

// Colonne du tableau ← champ de l’API
const COLUMNS = {
  id: (p) => p.id,
  categorie: (p) => p.category,
  prix: (p) => (p.price == null ? '' : p.price),
  nom: (p) => p.name,
  description: (p) => p.description,
  vignette: (p) => p.label,
  nom_en: (p) => p.name_en,
  description_en: (p) => p.description_en,
  vignette_en: (p) => p.label_en,
  couleur: (p) => p.color,
  disponible: (p) => (p.available === false ? 'non' : 'oui'),
  statut: (p) => p.status,
  image: (p) => p.image
};

const cell = (value) => '"' + String(value ?? '').replace(/"/g, '""') + '"';

function toCsv(products) {
  const lines = [Object.keys(COLUMNS).join(';')];
  for (const p of products) lines.push(Object.values(COLUMNS).map((get) => cell(get(p))).join(';'));
  return lines.join('\n') + '\n';
}

async function main() {
  const url = new URL('products/', API).href;
  let products;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    products = await res.json();
  } catch (err) {
    console.error(`\n✖ API injoignable (${url}) : ${err.message}\n  Démarrer l’API, ou servir le tableau CSV : npm run dev:csv\n`);
    process.exit(1);
  }
  if (!Array.isArray(products)) {
    console.error(`\n✖ Réponse inattendue de ${url} : une liste d’articles était attendue.\n`);
    process.exit(1);
  }
  products.sort((a, b) => a.id - b.id);

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'catalogue-api-'));
  const csv = path.join(dir, 'api.csv');
  try {
    fs.writeFileSync(csv, toCsv(products));
    console.log(`↓ Catalogue lu depuis l’API : ${url}`);
    execFileSync(process.execPath, [path.join(__dirname, 'catalogue.cjs'), csv, 'src/js/products.js', 'catalogue/livraison.csv', 'src/js/delivery.js'], { stdio: 'inherit' });
  } catch {
    process.exit(1); // catalogue.cjs a déjà affiché l’erreur
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

if (require.main === module) main();

module.exports = { toCsv };
