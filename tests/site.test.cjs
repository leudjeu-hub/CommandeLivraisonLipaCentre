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

test('index.html : pas de code en ligne ni de script externe', () => {
  assert.doesNotMatch(html, /\son[a-z]+=/i, 'pas de gestionnaire onclick=…');
  assert.doesNotMatch(html, /\sstyle=/i, "pas d'attribut style (CSP)");
  assert.doesNotMatch(html, /<style\b/i, 'CSS dans css/style.css');
  for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    assert.match(attrs, /src="/, 'script en ligne interdit');
    assert.equal(body.trim(), '');
  }
});

test('index.html : toutes les ressources locales existent', () => {
  for (const [, ref] of html.matchAll(/<(?:script|link|img|source)\b[^>]*(?:src|href)="([^"]+)"/g)) {
    assert.doesNotMatch(ref, /^(https?:)?\/\//, `ressource externe : ${ref}`);
  }
});

test('dépôt : aucun secret ni fichier sensible committé', () => {
  assert.ok(!fs.existsSync('.env'), 'fichier .env présent');
  assert.match(fs.readFileSync('.gitignore', 'utf8'), /^node_modules\/$/m);
});

test('catalogue : données valides dans src/data/catalogue.ts', () => {
  const src = fs.readFileSync('src/data/catalogue.ts', 'utf8');
  assert.match(src, /export const PRODUCTS/);
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

test('build : dist/ existe avec index.html', () => {
  assert.ok(fs.existsSync('dist/index.html'), 'dist/index.html manquant — lancez npm run build');
});
