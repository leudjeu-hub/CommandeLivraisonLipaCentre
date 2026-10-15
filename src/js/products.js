/*
 * Catalogue de démonstration — Librairie Papeterie du Centre.
 *
 * Pour modifier les articles, éditez uniquement ce tableau.
 *   id     : nombre entier unique
 *   cat    : 'Scolaire' | 'Bureau' | 'Livres' (doit correspondre à un filtre)
 *   price  : prix en FCFA, ou null pour un article « sur devis »
 *   color  : couleur de la vignette
 *   label  : texte de la vignette (\n = retour à la ligne)
 */
window.PRODUCTS = [
  { id: 1, name: 'Cahier A4 · 200 pages', cat: 'Scolaire', desc: 'Quadrillé, pour les cours et les exercices.', price: 1500, color: '#31574b', label: 'CAHIER\n200 PAGES' },
  { id: 2, name: 'Lot de 10 stylos bleus', cat: 'Scolaire', desc: 'L’essentiel pour écrire au quotidien.', price: 1000, color: '#627e9c', label: 'STYLOS\nBLEUS' },
  { id: 3, name: 'Kit de géométrie', cat: 'Scolaire', desc: 'Règle, équerre, rapporteur et compas.', price: 2500, color: '#a76b4c', label: 'GÉOMÉTRIE' },
  { id: 4, name: 'Ramette de papier A4', cat: 'Bureau', desc: '500 feuilles · grammage à confirmer.', price: 4000, color: '#c6a157', label: 'PAPIER A4\n500 FEUILLES' },
  { id: 5, name: 'Classeur à levier', cat: 'Bureau', desc: 'Pour organiser et conserver vos documents.', price: 2500, color: '#53634e', label: 'ARCHIVES' },
  { id: 6, name: 'Notes adhésives', cat: 'Bureau', desc: 'Un bloc pour vos rappels et vos idées.', price: 750, color: '#d3ae5d', label: 'MES NOTES' },
  { id: 7, name: 'Dictionnaire de français', cat: 'Livres', desc: 'Référence illustrative · édition à confirmer.', price: 8500, color: '#a95540', label: 'DICTIONNAIRE\nFRANÇAIS' },
  { id: 8, name: 'Livre scolaire sur demande', cat: 'Livres', desc: 'Précisez le titre, la classe et l’édition.', price: null, color: '#486473', label: 'APPRENDRE' }
];

window.CATEGORIES = ['Tout', 'Scolaire', 'Bureau', 'Livres'];

/* Coordonnées de la librairie. Numéro WhatsApp au format international, chiffres uniquement. */
window.SHOP = {
  whatsapp: '237693240396'
};
