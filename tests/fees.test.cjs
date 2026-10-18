// Tests unitaires des règles de frais de livraison (src/data/catalogue.ts, utilisé par l'application).
const assert = require('node:assert');
const { test } = require('node:test');
const { isFree, feeFor } = require('../src/data/catalogue.ts');

const rules = { freeFrom: 25000, freeZones: [1, 2], minOrder: 2000 };

const zone1 = { zone: 1, name: 'Proche', fee: 1000 };
const zone2 = { zone: 2, name: 'Moyenne', fee: 2500 };
const zone3 = { zone: 3, name: 'Lointaine', fee: 5000 };

test('isFree : zone hors grille de gratuité', () => {
  assert.equal(isFree(zone3, 30000, rules), false);
});

test('isFree : montant en dessous du seuil', () => {
  assert.equal(isFree(zone1, 10000, rules), false);
});

test('isFree : zone gratuite et montant atteint', () => {
  assert.equal(isFree(zone1, 25000, rules), true);
  assert.equal(isFree(zone2, 25000, rules), true);
});

test('isFree : freeFrom à 0 désactive la gratuité', () => {
  const gratuitementDesactive = { freeFrom: 0, freeZones: [1, 2], minOrder: 0 };
  assert.equal(isFree(zone1, 100000, gratuitementDesactive), false);
});

test('feeFor : commande, zone gratuite, seuil atteint -> 0', () => {
  assert.equal(feeFor(zone1, 30000, rules, false), 0);
});

test('feeFor : commande, zone non-gratuite -> frais zone', () => {
  assert.equal(feeFor(zone3, 100000, rules, false), 5000);
});

test('feeFor : devis -> toujours les frais de la zone, même gratuits', () => {
  assert.equal(feeFor(zone1, 30000, rules, true), 1000);
  assert.equal(feeFor(zone2, 100000, rules, true), 2500);
});

test('feeFor : règles vides -> jamais gratuit, frais de la zone', () => {
  const vide = { freeFrom: 0, freeZones: [], minOrder: 0 };
  assert.equal(feeFor(zone1, 999999, vide, false), 1000);
});
