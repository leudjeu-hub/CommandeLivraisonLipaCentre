/*
 * Frais de livraison : fonctions pures, indépendantes de l'interface.
 * - Node (tests) : `const { isFree, feeFor } = require('.../js/fees.cjs');`
 * - Navigateur   : chargé par <script src="js/fees.cjs" defer>, exposé sur `window.fees`.
 * Compatible `file://`, aucun bundler, aucune dépendance.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();            // Node / tests unitaires
  } else {
    root.fees = factory();                 // navigateur (pas de bundler)
  }
})(this, function () {
  'use strict';

  // Livraison offerte si : seuil configuré, zone concernée, et montant atteint.
  // (commande réelle, pas devis — géré par l'appelant via le paramètre `quote` de feeFor)
  function isFree(zone, subtotal, rules) {
    return (
      rules.freeFrom > 0 &&
      rules.freeZones.includes(zone.zone) &&
      subtotal >= rules.freeFrom
    );
  }

  // Frais pour une zone : 0 si livraison offerte (commande, pas devis),
  // sinon le tarif de la zone.
  function feeFor(zone, subtotal, rules, quote) {
    return !quote && isFree(zone, subtotal, rules) ? 0 : zone.fee;
  }

  return { isFree, feeFor };
});
