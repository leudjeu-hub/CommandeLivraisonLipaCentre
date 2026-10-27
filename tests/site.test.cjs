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
  assert.deepEqual(locs, [canonical('index.html'), canonical('catalogue.html'),
    canonical('fournitures-scolaires.html'), canonical('fournitures-de-bureau.html'), canonical('livres-scolaires.html'), canonical('livraison.html'), canonical('confidentialite.html')]);
  // Fichier de vérification Google Search Console (propriété « Préfixe d'URL ») : à garder en ligne
  for (const file of ['google22b032c38b924131.html', 'google0fc62c3005d6e561.html']) {
    assert.equal(fs.readFileSync(`dist/${file}`, 'utf8').trim(), `google-site-verification: ${file}`);
  }
  for (const route of ['panier', 'commander', 'connexion', 'inscription', 'compte', 'gestion']) {
    assert.ok(!locs.some((loc) => loc.endsWith(`/${route}`)), route);
  }
});

test('build : accueil lisible sans JavaScript (texte complet dans dist/index.html), pas sur les autres pages', () => {
  const home = fs.readFileSync('dist/index.html', 'utf8');
  assert.equal((home.match(/<h1>/g) || []).length, 1);
  assert.ok((home.match(/<h2>/g) || []).length >= 5, 'sections de l’accueil');
  assert.match(home, /<h3>Combien coûte la livraison à Yaoundé \?<\/h3>/);
  assert.match(home, /Oui : 2\s000 FCFA d'articles\./);
  assert.doesNotMatch(home, /\{\{|\$1/, 'variable non remplacée');
  assert.match(home, /<\/div>\s*<\/body>/);
  for (const route of ['catalogue', 'livraison', '404']) {
    assert.doesNotMatch(fs.readFileSync(`dist/${route}.html`, 'utf8'), /Combien coûte la livraison/, route);
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

test('sélection de l’accueil : vide dans le dépôt (remplie au déploiement seulement)', () => {
  assert.deepEqual(JSON.parse(fs.readFileSync('public/selection.json', 'utf8')), []);
});

test('déploiement : articles écrits dans le catalogue et les pages de catégorie publiés', async () => {
  const { writeStaticCatalogue } = await import('../scripts/catalogue-statique.mjs');
  const dir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'statique-'));
  const shell = '<h1>Librairie</h1><p class="shell-info">WhatsApp</p>';
  for (const route of ['catalogue', 'fournitures-scolaires', 'fournitures-de-bureau', 'livres-scolaires']) {
    fs.writeFileSync(path.join(dir, `${route}.html`), shell);
  }
  writeStaticCatalogue(dir, [
    { id: 3, category: 'Bureau', family: 'Papier', name: 'Rame A4', price: 4000 },
    { id: 1, category: 'Scolaire', family: 'Sacs et cartables', name: 'Cartable <rouge>', price: null },
    { id: 2, category: 'Scolaire', family: 'Cahiers, blocs et registres', name: 'Cahier 200 pages', price: 1500 },
  ]);
  const scolaire = fs.readFileSync(path.join(dir, 'fournitures-scolaires.html'), 'utf8');
  assert.match(scolaire, /<h1>Fournitures scolaires à Yaoundé<\/h1>/);
  // Ordre des familles de la rentrée, texte échappé, « Sur devis » sans prix
  assert.ok(scolaire.indexOf('<h2>Cahiers, blocs et registres</h2>') < scolaire.indexOf('<h2>Sacs et cartables</h2>'));
  assert.match(scolaire, /Cartable &lt;rouge&gt; : <strong>Sur devis<\/strong>/);
  assert.match(scolaire, /Cahier 200 pages : <strong>1 500 FCFA<\/strong>/);
  assert.doesNotMatch(scolaire, /Rame A4/);
  // Les coordonnées restent avant la liste
  assert.ok(scolaire.indexOf('shell-info') < scolaire.indexOf('shell-list'));
  assert.match(fs.readFileSync(path.join(dir, 'catalogue.html'), 'utf8'), /Cahier 200 pages[\s\S]*Rame A4/);
  // Accueil : articles avec un prix, par numéro
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, 'selection.json'), 'utf8')).map((p) => p.id), [2, 3]);
  fs.rmSync(dir, { recursive: true });
});
