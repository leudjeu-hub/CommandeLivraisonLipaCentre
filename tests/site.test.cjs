// Tests statiques (sans navigateur) : npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync('index.html', 'utf8');

test('index.html : structure accessible et SEO de base', () => {
  assert.match(html, /<html lang="fr">/);
  assert.match(html, /<div id="root">/);
  assert.match(html, /name="description"/);
  assert.match(html, /name="viewport"/);
});

test('index.html : site ouvert aux moteurs de recherche, fiche de la boutique valide', () => {
  assert.doesNotMatch(html, /name="robots"/, 'noindex retiré : le site est ouvert au public');
  assert.match(html, /<link rel="canonical" href="https:\/\/leudjeu-hub\.github\.io\/CommandeLivraisonLipaCentre\/"/);
  const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(ld, 'JSON-LD absent');
  const store = JSON.parse(ld[1]);
  assert.equal(store['@type'], 'Store');
  assert.equal(store.telephone, '+237693240396');
  assert.match(store.address.streetAddress, /Carrefour Abbia/);
});

test('index.html : pas de code en ligne ni de script externe', () => {
  assert.doesNotMatch(html, /\son[a-z]+=/i, 'pas de gestionnaire onclick=…');
  assert.doesNotMatch(html, /\sstyle=/i, "pas d'attribut style (CSP)");
  assert.doesNotMatch(html, /<style\b/i, 'CSS dans css/style.css');
  for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    // Données structurées (JSON-LD) : jamais exécutées, donc permises par la CSP
    if (/type="application\/ld\+json"/.test(attrs)) continue;
    assert.match(attrs, /src="/, 'script en ligne interdit');
    assert.equal(body.trim(), '');
  }
});

test('index.html : toutes les ressources locales existent', () => {
  for (const [tag, ref] of html.matchAll(/<(?:script|link|img|source)\b[^>]*(?:src|href)="([^"]+)"/g)) {
    // L'adresse canonique n'est pas une ressource chargée par le navigateur
    if (/rel="canonical"/.test(tag)) continue;
    assert.doesNotMatch(ref, /^(https?:)?\/\//, `ressource externe : ${ref}`);
  }
});

test('dépôt : aucun secret ni fichier sensible committé', () => {
  assert.ok(!fs.existsSync('.env'), 'fichier .env présent');
  assert.match(fs.readFileSync('.gitignore', 'utf8'), /^node_modules\/$/m);
});

test('catalogue : données valides dans src/data/catalogue.ts', () => {
  const src = fs.readFileSync('src/data/catalogue.ts', 'utf8');
  assert.doesNotMatch(src, /export const PRODUCTS/, 'pas d’articles inventés : le catalogue vient de l’API');
  assert.match(src, /export const DELIVERY/);
  assert.match(src, /export const CATEGORIES/);
  assert.match(src, /export const SHOP/);
  assert.match(src, /whatsapp: '237693240396'/);
});

test('traductions : clés FR et EN présentes', () => {
  const fr = JSON.parse(fs.readFileSync('src/locales/fr.json', 'utf8'));
  const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
  const frKeys = Object.keys(fr).sort();
  const enKeys = Object.keys(en).sort();
  assert.deepEqual(frKeys, enKeys, 'clés de traduction différentes entre FR et EN');
  for (const key of frKeys) {
    assert.ok(fr[key] && en[key], `traduction manquante : ${key}`);
  }
});

test('build : une page HTML par route (code 200 sur GitHub Pages), titres propres, noindex sur les pages privées', () => {
  const page = (route) => fs.readFileSync(`dist/${route}.html`, 'utf8');
  assert.match(page('livraison'), /<title>Livraison à Yaoundé/);
  assert.match(page('livraison'), /rel="canonical" href="[^"]+\/livraison"/);
  assert.match(page('catalogue'), /<title>Catalogue/);
  for (const route of ['panier', 'commander', 'connexion', 'inscription', 'compte', 'gestion']) {
    assert.match(page(route), /name="robots" content="noindex"/, route);
    assert.doesNotMatch(page(route), /rel="canonical"/, route);
  }
  assert.match(fs.readFileSync('dist/404.html', 'utf8'), /name="robots" content="noindex"/);
});

test('build : sitemap.xml = accueil + pages indexables, aux adresses de leur balise canonical', () => {
  const sitemap = fs.readFileSync('dist/sitemap.xml', 'utf8');
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const canonical = (file) => fs.readFileSync(`dist/${file}`, 'utf8').match(/rel="canonical" href="([^"]+)"/)?.[1];
  assert.deepEqual(locs, [canonical('index.html'), canonical('catalogue.html'), canonical('livraison.html')]);
  for (const route of ['panier', 'commander', 'connexion', 'inscription', 'compte', 'gestion']) {
    assert.ok(!locs.some((loc) => loc.endsWith(`/${route}`)), route);
  }
});

test('build : dist/ existe avec index.html', () => {
  assert.ok(fs.existsSync('dist/index.html'), 'dist/index.html manquant — lancez npm run build');
});

test('build : le site publié appelle l’API Render et rien d’autre', () => {
  const built = fs.readFileSync('dist/index.html', 'utf8');
  const csp = built.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  assert.match(csp, /connect-src 'self' https:\/\/papeterie-api-kshr\.onrender\.com;/);
  const js = fs.readdirSync('dist/assets').filter((f) => f.endsWith('.js'))
    .map((f) => fs.readFileSync(path.join('dist/assets', f), 'utf8')).join('\n');
  assert.match(js, /https:\/\/papeterie-api-kshr\.onrender\.com/);
  assert.doesNotMatch(js, /localhost:8000/, 'adresse de l’API locale dans le build');
});

test('copie du catalogue : vide dans le dépôt (remplie au déploiement seulement)', () => {
  assert.deepEqual(JSON.parse(fs.readFileSync('public/catalogue.json', 'utf8')), []);
  const deploy = fs.readFileSync('.github/workflows/deploy.yml', 'utf8');
  assert.match(deploy, /node scripts\/catalogue-snapshot\.mjs dist/);
});
