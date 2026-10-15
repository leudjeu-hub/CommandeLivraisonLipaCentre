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
