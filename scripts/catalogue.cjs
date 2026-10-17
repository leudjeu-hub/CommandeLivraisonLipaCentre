// Génère src/js/products.js à partir du tableau catalogue/catalogue.csv,
// et src/js/delivery.js à partir de la grille catalogue/livraison.csv.
//
// Usage : node scripts/catalogue.cjs [catalogue.csv] [products.js] [livraison.csv] [delivery.js]
// (sans argument : les fichiers du projet ; avec seulement les 2 premiers : pas de grille de livraison)
// Lancé automatiquement par `npm test` et `npm run build` : il suffit de modifier le tableau.
// En cas d’erreur dans le tableau, le script s’arrête avec un message indiquant la ligne,
// ce qui bloque la mise en ligne au lieu de publier un catalogue faux.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const csvPath = process.argv[2] || 'catalogue/catalogue.csv';
const outPath = process.argv[3] || 'src/js/products.js';
const configPath = 'src/js/config.js';
const deliveryCsv = process.argv[4] || (process.argv[2] ? null : 'catalogue/livraison.csv');
const deliveryOut = process.argv[5] || 'src/js/delivery.js';
let currentFile = csvPath;

// Couleur de vignette par défaut selon la catégorie (si la colonne « couleur » est vide)
const DEFAULT_COLORS = { Scolaire: '#31574b', Bureau: '#c6a157', Livres: '#a95540' };
const REQUIRED = ['id', 'categorie', 'prix', 'nom', 'description'];
const OPTIONAL = ['vignette', 'nom_en', 'description_en', 'vignette_en', 'couleur', 'disponible', 'statut', 'image', 'credit_photo'];

function fail(message) {
  console.error('\n✖ Tableau invalide (' + currentFile + ')\n  ' + message + '\n');
  process.exit(1);
}

// Lecture CSV : séparateur « ; » (Excel en français) ou « , » (Google Sheets), guillemets, retours à la ligne
function parseCsv(text) {
  text = text.replace(/^﻿/, '');
  const firstLine = text.split(/\r?\n/, 1)[0];
  const sep = (firstLine.match(/;/g) || []).length >= (firstLine.match(/,/g) || []).length ? ';' : ',';
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim() !== ''));
}

// Vignette automatique : nom en majuscules sur 2 lignes de ~12 caractères
function autoLabel(name) {
  const words = name.toLocaleUpperCase('fr').replace(/[·,]/g, ' ').split(/\s+/).filter(Boolean);
  const lines = [''];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if (cur && (cur + ' ' + w).length > 12) {
      if (lines.length === 2) break;
      lines.push(w);
    } else lines[lines.length - 1] = cur ? cur + ' ' + w : w;
  }
  return lines.join('\n');
}

const label = (value) => value.split('/').map((s) => s.trim()).filter(Boolean).join('\n');

// Catégories autorisées : celles de src/js/config.js
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(configPath, 'utf8'), sandbox);
const categories = (sandbox.window.CATEGORIES || []).filter((c) => c !== 'Tout');

if (!fs.existsSync(csvPath)) fail('fichier introuvable.');
const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
if (rows.length < 2) fail('le tableau est vide.');

const header = rows[0].map((h) => h.trim().toLowerCase());
for (const col of REQUIRED) if (!header.includes(col)) fail(`colonne obligatoire manquante : « ${col} ».`);
for (const col of header) {
  if (col && !REQUIRED.includes(col) && !OPTIONAL.includes(col)) fail(`colonne inconnue : « ${col} ». Colonnes possibles : ${[...REQUIRED, ...OPTIONAL].join(', ')}.`);
}

const products = [];
const seen = new Set();
let missingEn = 0;
let hidden = 0;

rows.slice(1).forEach((cells, index) => {
  const line = index + 2; // numéro de ligne dans le tableur (ligne 1 = en-têtes)
  const get = (col) => (cells[header.indexOf(col)] ?? '').trim();
  const where = `ligne ${line}`;

  const dispo = get('disponible').toLowerCase();
  if (dispo && !['oui', 'non'].includes(dispo)) fail(`${where} : « disponible » doit valoir oui ou non (vide = oui).`);
  if (dispo === 'non') { hidden++; return; }

  const id = Number(get('id'));
  if (!Number.isInteger(id) || id < 1) fail(`${where} : « id » doit être un nombre entier positif (reçu : « ${get('id')} »).`);
  if (seen.has(id)) fail(`${where} : l’id ${id} est déjà utilisé par un autre article.`);
  seen.add(id);

  const cat = get('categorie');
  const catMatch = categories.find((c) => c.toLowerCase() === cat.toLowerCase());
  if (!catMatch) fail(`${where} : catégorie « ${cat} » inconnue. Possibles : ${categories.join(', ')}.`);

  const rawPrice = get('prix').replace(/[\s  .]/g, '').replace(/fcfa$/i, '');
  let price = null;
  if (rawPrice !== '') {
    price = Number(rawPrice);
    if (!Number.isInteger(price) || price <= 0) fail(`${where} : prix « ${get('prix')} » invalide (nombre entier en FCFA, ou vide pour « sur devis »).`);
  }

  const name = get('nom');
  const desc = get('description');
  if (!name) fail(`${where} : « nom » est vide.`);
  if (!desc) fail(`${where} : « description » est vide.`);

  const color = get('couleur') || DEFAULT_COLORS[catMatch] || '#486473';
  if (!/^#[0-9a-f]{6}$/i.test(color)) fail(`${where} : couleur « ${color} » invalide (format #RRGGBB, ex. #31574b).`);

  const product = {
    id,
    cat: catMatch,
    price,
    color,
    name,
    desc,
    label: get('vignette') ? label(get('vignette')) : autoLabel(name)
  };

  const nameEn = get('nom_en');
  const descEn = get('description_en');
  if (nameEn && descEn) {
    product.en = {
      name: nameEn,
      desc: descEn,
      label: get('vignette_en') ? label(get('vignette_en')) : autoLabel(nameEn)
    };
  } else missingEn++;

  products.push(product);
});

if (!products.length) fail('aucun article disponible.');

const out =
  '/*\n' +
  ' * FICHIER GÉNÉRÉ AUTOMATIQUEMENT — ne pas modifier à la main.\n' +
  ' * Source : catalogue/catalogue.csv (voir catalogue/LISEZMOI.md).\n' +
  ' * Régénéré par `npm test`, `npm run build` ou `npm run catalogue`.\n' +
  ' */\n' +
  'window.PRODUCTS = ' + JSON.stringify(products, null, 2) + ';\n';
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out);

let msg = `✔ Catalogue : ${products.length} article(s) → ${outPath}`;
if (hidden) msg += `, ${hidden} masqué(s) (disponible = non)`;
console.log(msg);
if (missingEn) console.warn(`  ⚠ ${missingEn} article(s) sans traduction anglaise : le texte français sera affiché en anglais.`);

// ---------- Grille de livraison (catalogue/livraison.csv) ----------
if (deliveryCsv) {
  currentFile = deliveryCsv;
  if (!fs.existsSync(deliveryCsv)) fail('fichier introuvable.');
  const drows = parseCsv(fs.readFileSync(deliveryCsv, 'utf8'));
  if (drows.length < 2) fail('la grille est vide.');
  const dh = drows[0].map((h) => h.trim().toLowerCase());
  const DREQ = ['zone', 'nom', 'frais', 'quartiers'];
  const DOPT = ['nom_en', 'delai', 'delai_en'];
  for (const col of DREQ) if (!dh.includes(col)) fail(`colonne obligatoire manquante : « ${col} ».`);
  for (const col of dh) if (col && !DREQ.includes(col) && !DOPT.includes(col)) fail(`colonne inconnue : « ${col} ». Colonnes possibles : ${[...DREQ, ...DOPT].join(', ')}.`);

  const zones = [];
  const areaSeen = new Map();
  drows.slice(1).forEach((cells, index) => {
    const where = `ligne ${index + 2}`;
    const get = (col) => (cells[dh.indexOf(col)] ?? '').trim();
    const zone = Number(get('zone'));
    if (!Number.isInteger(zone) || zone < 1) fail(`${where} : « zone » doit être un nombre entier positif.`);
    if (zones.some((z) => z.zone === zone)) fail(`${where} : la zone ${zone} existe déjà.`);
    const fee = Number(get('frais').replace(/[\s\u00a0\u202f.]/g, '').replace(/fcfa$/i, ''));
    if (get('frais') === '' || !Number.isInteger(fee) || fee < 0) fail(`${where} : frais « ${get('frais')} » invalides (nombre entier en FCFA, 0 = gratuit).`);
    if (!get('nom')) fail(`${where} : « nom » est vide.`);
    const areas = get('quartiers').split(',').map((a) => a.trim()).filter(Boolean);
    if (!areas.length) fail(`${where} : aucun quartier (séparer les quartiers par des virgules).`);
    for (const a of areas) {
      const key = a.toLocaleLowerCase('fr');
      if (areaSeen.has(key)) fail(`${where} : le quartier « ${a} » est déjà dans la zone ${areaSeen.get(key)}.`);
      areaSeen.set(key, zone);
    }
    zones.push({
      zone,
      name: get('nom'),
      fee,
      delay: get('delai'),
      areas,
      en: { name: get('nom_en') || get('nom'), delay: get('delai_en') || get('delai') }
    });
  });
  zones.sort((a, b) => a.zone - b.zone);
  fs.writeFileSync(deliveryOut,
    '/*\n * FICHIER GÉNÉRÉ AUTOMATIQUEMENT — ne pas modifier à la main.\n' +
    ' * Source : catalogue/livraison.csv. Règles (seuil de gratuité, minimum) : src/js/config.js.\n */\n' +
    'window.DELIVERY = ' + JSON.stringify(zones, null, 2) + ';\n');
  console.log(`✔ Livraison : ${zones.length} zone(s), ${areaSeen.size} quartier(s) → ${deliveryOut}`);
}
