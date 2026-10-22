// Vérifie que chaque photo de famille (src/data/photosFamilles.ts) existe et garde son crédit.
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { FAMILY_PHOTOS, familyImage } = require('../src/data/photosFamilles.ts');

test('photos de famille : 11 familles, fichiers présents, crédits renseignés', () => {
  assert.equal(FAMILY_PHOTOS.length, 11);
  assert.equal(new Set(FAMILY_PHOTOS.map((p) => p.family)).size, 11);
  for (const p of FAMILY_PHOTOS) {
    const file = path.join(__dirname, '..', 'public', p.image);
    assert.ok(fs.existsSync(file), `${p.image} manquant`);
    assert.ok(fs.statSync(file).size < 60_000, `${p.image} trop lourd`);
    assert.ok(p.photographer.length > 0);
    assert.match(p.url, /^https:\/\/unsplash\.com\/photos\//);
  }
});

test('familyImage : famille connue, inconnue ou vide', () => {
  assert.equal(familyImage('Papier'), 'img/produits/famille-papier.webp');
  assert.equal(familyImage('Inconnue'), undefined);
  assert.equal(familyImage(undefined), undefined);
});
