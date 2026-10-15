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
  vm.runInNewContext(fs.readFileSync('src/js/products.js', 'utf8'), sandbox);
  const { PRODUCTS, CATEGORIES } = sandbox.window;
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
