// Tests statiques (sans navigateur) : npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync('src/index.html', 'utf8');

test('index.html : structure accessible et SEO de base', () => {
  assert.match(html, /<html lang="fr">/);
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, 'un seul <h1>');
  assert.match(html, /<main\b/);
  assert.match(html, /name="description"/);
  assert.match(html, /name="viewport"/);
});

test('index.html : pas de code en ligne ni de script externe', () => {
  assert.doesNotMatch(html, /\son[a-z]+=/i, 'pas de gestionnaire onclick=…');
  assert.doesNotMatch(html, /\sstyle=/i, 'pas d’attribut style (CSP)');
  assert.doesNotMatch(html, /<style\b/i, 'CSS dans css/style.css');
  for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    assert.match(attrs, /src="/, 'script en ligne interdit');
    assert.equal(body.trim(), '');
  }
  assert.doesNotMatch(html, /chatgpt|cdn-cgi|_sites\//i, 'restes de l’export ChatGPT');
});

test('index.html : toutes les ressources locales existent', () => {
  for (const [, ref] of html.matchAll(/<(?:script|link|img|source)\b[^>]*(?:src|href)="([^"]+)"/g)) {
    assert.doesNotMatch(ref, /^(https?:)?\/\//, `ressource externe : ${ref}`);
    assert.ok(fs.existsSync(path.resolve('src', ref)), `fichier manquant : ${ref}`);
  }
});

test('index.html : identifiants uniques et ancres valides', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(ids.length, new Set(ids).size, 'identifiant en double');
  for (const [, ref] of html.matchAll(/href="#([^"]+)"/g)) {
    assert.ok(ids.includes(ref), `ancre introuvable : #${ref}`);
  }
});

test('js/products.js : catalogue valide', () => {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync('src/js/config.js', 'utf8'), sandbox);
  vm.runInNewContext(fs.readFileSync('src/js/products.js', 'utf8'), sandbox);
  const { PRODUCTS, CATEGORIES, SHOP } = sandbox.window;
  assert.match(SHOP.whatsapp, /^[1-9][0-9]{7,14}$/, 'numéro WhatsApp : format international, chiffres uniquement');
  assert.ok(Array.isArray(PRODUCTS) && PRODUCTS.length > 0);
  const ids = PRODUCTS.map((p) => p.id);
  assert.equal(ids.length, new Set(ids).size, 'id produit en double');
  for (const p of PRODUCTS) {
    assert.ok(Number.isInteger(p.id), `id invalide : ${p.name}`);
    assert.ok(p.name && p.desc && p.label, `texte manquant : ${p.id}`);
    assert.ok(CATEGORIES.includes(p.cat), `catégorie inconnue : ${p.cat}`);
    assert.ok(p.price === null || (Number.isInteger(p.price) && p.price > 0), `prix invalide : ${p.name}`);
    assert.match(p.color, /^#[0-9a-f]{6}$/i);
  }
});

test('dépôt : aucun secret ni fichier sensible committé', () => {
  assert.ok(!fs.existsSync('.env'), 'fichier .env présent');
  assert.match(fs.readFileSync('.gitignore', 'utf8'), /^node_modules\/$/m);
});

test('js/script.js : tout innerHTML avec données produit est échappé', () => {
  const js = fs.readFileSync('src/js/script.js', 'utf8');
  for (const field of ['name', 'desc', 'cat']) {
    assert.doesNotMatch(js, new RegExp('\\$\\{p\\.' + field + '\\}'), `p.${field} inséré sans escapeHtml`);
  }
});

test('traductions : aucune clé manquante', () => {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync('src/js/config.js', 'utf8'), sandbox);
  vm.runInNewContext(fs.readFileSync('src/js/products.js', 'utf8'), sandbox);
  vm.runInNewContext(fs.readFileSync('src/js/i18n.js', 'utf8'), sandbox);
  const { I18N, PRODUCTS, CATEGORIES } = sandbox.window;
  const langs = Object.keys(I18N.LANGUAGES).filter((l) => l !== I18N.DEFAULT);

  const markup = html.replace(/<!--[\s\S]*?-->/g, ''); // ignore les exemples en commentaire
  const keys = new Set([...markup.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1]));
  for (const [, spec] of markup.matchAll(/data-i18n-attr="([^"]+)"/g)) {
    for (const pair of spec.split(';')) keys.add(pair.split(':')[1].trim());
  }
  const fr = Object.keys(I18N.UI[I18N.DEFAULT]);
  for (const lang of langs) {
    for (const key of keys) assert.ok(key in I18N.PAGE[lang], `${lang} : clé de page manquante « ${key} »`);
    for (const key of fr) assert.ok(key in I18N.UI[lang], `${lang} : clé d’interface manquante « ${key} »`);
    for (const c of CATEGORIES) assert.ok(('cat.' + c) in I18N.UI[lang], `${lang} : catégorie ${c}`);
    // Traduction des articles facultative (repli sur le français) ; si présente, elle doit être complète
    for (const p of PRODUCTS) {
      if (p[lang]) for (const field of ['name', 'desc', 'label']) assert.ok(p[lang][field], `${lang} : produit ${p.id}, champ ${field}`);
    }
  }
});

test('style.css : pas de sélecteur cassé (ex. « dialog: :backdrop »)', () => {
  const css = fs.readFileSync('src/css/style.css', 'utf8');
  assert.match(css, /dialog::backdrop\s*\{/, 'fond des fenêtres manquant');
  assert.doesNotMatch(css, /[a-z]: :[a-z]/, 'pseudo-élément mal écrit (« : : »)');
});

test('aperçu de partage (Open Graph) complet', () => {
  for (const prop of ['og:title', 'og:description', 'og:url', 'og:image', 'og:image:width', 'og:image:height']) {
    assert.match(html, new RegExp(`property="${prop}" content="[^"]+"`), `${prop} manquant`);
  }
  const image = html.match(/property="og:image" content="([^"]+)"/)[1];
  assert.match(image, /^https:\/\//, 'og:image doit être une URL absolue');
  const local = 'src/' + image.split('/CommandeLivraisonLipaCentre/')[1];
  assert.ok(fs.existsSync(local), `image de partage introuvable : ${local}`);
  assert.ok(fs.statSync(local).size < 300 * 1024, 'image de partage trop lourde (> 300 Ko)');
});

test('catalogue : le tableau CSV génère products.js et refuse les erreurs', () => {
  const { execFileSync } = require('node:child_process');
  const os = require('node:os');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'catalogue-'));
  const run = (csv) => {
    fs.writeFileSync(path.join(dir, 'c.csv'), csv);
    return execFileSync('node', ['scripts/catalogue.cjs', path.join(dir, 'c.csv'), path.join(dir, 'p.js')], { stdio: 'pipe' }).toString();
  };
  const head = 'id;categorie;prix;nom;description;disponible\n';

  // Cas valide : prix avec espace, sans traduction, article masqué, vignette et couleur automatiques
  run(head + '1;scolaire;1 500;Cahier;Desc;\n2;Livres;;Livre;Desc;oui\n3;Bureau;100;Caché;Desc;non\n');
  const sb = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(dir, 'p.js'), 'utf8'), sb);
  const [a, b] = sb.window.PRODUCTS;
  assert.equal(sb.window.PRODUCTS.length, 2, 'l’article « non » disponible est masqué');
  assert.equal(a.price, 1500);
  assert.equal(a.cat, 'Scolaire');
  assert.equal(b.price, null);
  assert.ok(a.label && /^#[0-9a-f]{6}$/i.test(a.color));

  // Cas invalides : la génération doit échouer
  for (const bad of [
    head + '1;Scolaire;1500;A;D;\n1;Scolaire;900;B;D;\n', // id en double
    head + '1;Scolaire;douze;A;D;\n',                      // prix non numérique
    head + '1;Jouets;1500;A;D;\n',                         // catégorie inconnue
    head + '1;Scolaire;1500;;D;\n',                        // nom vide
    'id;categorie;nom;description\n1;Scolaire;A;D\n'       // colonne prix manquante
  ]) {
    assert.throws(() => run(bad), undefined, bad);
  }
  fs.rmSync(dir, { recursive: true, force: true });
});

test('livraison : grille valide et générateur qui refuse les erreurs', () => {
  const sb = { window: {} };
  vm.runInNewContext(fs.readFileSync('src/js/config.js', 'utf8'), sb);
  vm.runInNewContext(fs.readFileSync('src/js/delivery.js', 'utf8'), sb);
  const { DELIVERY, DELIVERY_RULES } = sb.window;
  assert.ok(Array.isArray(DELIVERY) && DELIVERY.length > 0, 'grille vide');
  for (const z of DELIVERY) {
    assert.ok(Number.isInteger(z.fee) && z.fee >= 0, `frais invalides zone ${z.zone}`);
    assert.ok(z.areas.length > 0, `zone ${z.zone} sans quartier`);
  }
  for (const zone of DELIVERY_RULES.freeZones) assert.ok(DELIVERY.some((z) => z.zone === zone), `zone ${zone} inconnue dans freeZones`);

  const { execFileSync } = require('node:child_process');
  const os = require('node:os');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'livraison-'));
  const run = (csv) => {
    fs.writeFileSync(path.join(dir, 'l.csv'), csv);
    return execFileSync('node', ['scripts/catalogue.cjs', 'catalogue/catalogue.csv', path.join(dir, 'p.js'), path.join(dir, 'l.csv'), path.join(dir, 'd.js')], { stdio: 'pipe' }).toString();
  };
  const head = 'zone;nom;frais;quartiers\n';
  run(head + '1;Centre;1 000;A, B\n2;Proche;2000;C\n');
  for (const bad of [
    head + '1;Centre;1000;A, B\n2;Proche;2000;B\n', // quartier dans deux zones
    head + '1;Centre;mille;A\n',                     // frais non numériques
    head + '1;Centre;1000;\n',                       // aucun quartier
    head + '1;Centre;1000;A\n1;Bis;2000;C\n'        // zone en double
  ]) assert.throws(() => run(bad), undefined, bad);
  fs.rmSync(dir, { recursive: true, force: true });
});
