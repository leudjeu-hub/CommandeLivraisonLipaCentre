/*
 * Réglages de la boutique (modifiables à la main).
 * Les articles, eux, se gèrent dans catalogue/catalogue.csv.
 */

/* Catégories (filtres). Ajouter une catégorie ici demande aussi sa traduction
   dans src/js/i18n.js (UI.fr et UI.en : 'cat.<Nom>') — `npm test` le vérifie. */
window.CATEGORIES = ['Tout', 'Scolaire', 'Bureau', 'Livres'];

/* Coordonnées de la librairie. Numéro WhatsApp au format international, chiffres uniquement. */
window.SHOP = {
  whatsapp: '237693240396'
};

/* Règles de livraison. La grille (zones, quartiers, frais) est dans catalogue/livraison.csv. */
window.DELIVERY_RULES = {
  freeFrom: 25000,      // livraison offerte à partir de ce montant d’articles (FCFA)…
  freeZones: [1, 2],    // …dans ces zones uniquement
  minOrder: 2000        // montant minimum d’articles pour une commande livrée (FCFA)
};
