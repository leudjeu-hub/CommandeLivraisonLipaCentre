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
