export interface Product {
  id: number;
  cat: string;
  price: number | null;
  color: string;
  name: string;
  desc: string;
  label: string;
  family?: string;
  image?: string;
  en?: {
    name: string;
    desc: string;
    label: string;
  };
}

export interface DeliveryZone {
  zone: number;
  name: string;
  fee: number;
  delay: string;
  areas: string[];
  en: {
    name: string;
    delay: string;
  };
}

export interface DeliveryRules {
  freeFrom: number;
  freeZones: number[];
  minOrder: number;
}

export const CATEGORIES = ['Tout', 'Scolaire', 'Bureau', 'Livres'];

export const SHOP = {
  whatsapp: '237693240396',
};

export const DELIVERY_RULES: DeliveryRules = {
  freeFrom: 25000,
  freeZones: [1, 2],
  minOrder: 2000,
};

export const PRODUCTS: Product[] = [
  { id: 1, cat: 'Scolaire', price: 1500, color: '#31574b', name: 'Cahier A4 · 200 pages', desc: 'Quadrillé, pour les cours et les exercices.', label: 'CAHIER\n200 PAGES', image: 'img/produits/cahier-a4-200.webp', en: { name: 'A4 notebook · 200 pages', desc: 'Squared paper, for lessons and exercises.', label: 'NOTEBOOK\n200 PAGES' } },
  { id: 2, cat: 'Scolaire', price: 1000, color: '#627e9c', name: 'Lot de 10 stylos bleus', desc: "L'essentiel pour écrire au quotidien.", label: 'STYLOS\nBLEUS', image: 'img/produits/lot-de-10.webp', en: { name: 'Pack of 10 blue pens', desc: 'The essentials for everyday writing.', label: 'BLUE\nPENS' } },
  { id: 3, cat: 'Scolaire', price: 2500, color: '#a76b4c', name: 'Kit de géométrie', desc: 'Règle, équerre, rapporteur et compas.', label: 'GÉOMÉTRIE', image: 'img/produits/kit-de-geometrie.webp', en: { name: 'Geometry set', desc: 'Ruler, set square, protractor and compass.', label: 'GEOMETRY' } },
  { id: 4, cat: 'Bureau', price: 4000, color: '#c6a157', name: 'Ramette de papier A4', desc: '500 feuilles · grammage à confirmer.', label: 'PAPIER A4\n500 FEUILLES', image: 'img/produits/ramette-de-papier.webp', en: { name: 'Ream of A4 paper', desc: '500 sheets · paper weight to be confirmed.', label: 'A4 PAPER\n500 SHEETS' } },
  { id: 5, cat: 'Bureau', price: 2500, color: '#53634e', name: 'Classeur à levier', desc: 'Pour organiser et conserver vos documents.', label: 'ARCHIVES', image: 'img/produits/classeur-a-levier.webp', en: { name: 'Lever arch file', desc: 'To organise and store your documents.', label: 'ARCHIVES' } },
  { id: 6, cat: 'Bureau', price: 750, color: '#8b6f47', name: 'Notes adhésives', desc: 'Bloc de feuilles repositionnables.', label: 'NOTES\nADHÉSIVES', image: 'img/produits/notes-adhesives.webp', en: { name: 'Sticky notes', desc: 'Repositionable note pad.', label: 'STICKY\nNOTES' } },
  { id: 7, cat: 'Livres', price: 8500, color: '#a95540', name: 'Dictionnaire de français', desc: 'Édition récente — à confirmer.', label: 'DICTIONNAIRE', image: 'img/produits/dictionnaire-de-francais.webp', en: { name: 'French dictionary', desc: 'Recent edition — to be confirmed.', label: 'DICTIONARY' } },
  { id: 8, cat: 'Livres', price: null, color: '#486473', name: 'Livre scolaire sur demande', desc: 'Titre, auteur et édition à préciser.', label: 'LIVRE\nSCOLAIRE', image: 'img/produits/livre-scolaire-sur.webp', en: { name: 'School book on request', desc: 'Title, author and edition to be specified.', label: 'SCHOOL\nBOOK' } },
];

export const DELIVERY: DeliveryZone[] = [
  { zone: 1, name: 'Centre', fee: 1000, delay: 'Le jour même', areas: ['Centre-ville', 'Hippodrome', 'Elig-Essono', 'Mvog-Ada', 'Briqueterie', 'Mokolo', 'Nlongkak', 'Tsinga'], en: { name: 'Centre', delay: 'Same day' } },
  { zone: 2, name: 'Proche', fee: 2000, delay: 'Le jour même', areas: ['Bastos', 'Essos', 'Melen', 'Ngoa-Ekellé', 'Etoa-Meki', 'Nkolndongo', 'Ekounou', 'Omnisport'], en: { name: 'Nearby', delay: 'Same day' } },
  { zone: 3, name: 'Éloigné', fee: 3000, delay: 'Sous 24 h', areas: ['Biyem-Assi', 'Mimboman', 'Emana', 'Mendong', 'Nkolbisson', 'Damas', 'Ekié', 'Nsimeyong'], en: { name: 'Further out', delay: 'Within 24 h' } },
  { zone: 4, name: 'Périphérie', fee: 5000, delay: 'À convenir', areas: ['Odza', 'Olembe', 'Simbock', 'Messamendongo', 'Nkometou', 'Soa'], en: { name: 'Outskirts', delay: 'To be arranged' } },
];

export function isFree(zone: DeliveryZone, subtotal: number, rules: DeliveryRules): boolean {
  return rules.freeFrom > 0 && rules.freeZones.includes(zone.zone) && subtotal >= rules.freeFrom;
}

export function feeFor(zone: DeliveryZone, subtotal: number, rules: DeliveryRules, quote: boolean): number {
  return !quote && isFree(zone, subtotal, rules) ? 0 : zone.fee;
}

export function zoneOfArea(area: string): DeliveryZone | undefined {
  return DELIVERY.find((z) => z.areas.includes(area));
}

export function money(n: number, locale: string = 'fr-FR'): string {
  return n.toLocaleString(locale) + ' FCFA';
}
