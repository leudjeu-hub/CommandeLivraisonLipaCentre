// Photos d'illustration par famille d'articles (une par famille, pas une par article).
// Source : Unsplash (licence Unsplash : usage gratuit, crédit non obligatoire mais conservé ici).
// Fichiers : public/img/produits/famille-*.webp (480 × 480). Le CSV d'import du catalogue
// les reprend dans la colonne « image » pour les articles sans photo propre.

export interface FamilyPhoto {
  family: string;
  image: string;
  photographer: string;
  url: string;
}

export const FAMILY_PHOTOS: FamilyPhoto[] = [
  { family: 'Cahiers, blocs et registres', image: 'img/produits/famille-cahiers.webp', photographer: 'Marissa Grootes', url: 'https://unsplash.com/photos/vdaJJbls3xE' },
  { family: 'Stylos, crayons et feutres', image: 'img/produits/famille-stylos.webp', photographer: 'Dan Dennis', url: 'https://unsplash.com/photos/XdIZXENcZ-o' },
  { family: 'Géométrie et petit matériel', image: 'img/produits/famille-geometrie.webp', photographer: 'Nic Rosenau', url: 'https://unsplash.com/photos/J_galDuu4kc' },
  { family: 'Sacs et cartables', image: 'img/produits/famille-sacs.webp', photographer: 'Rachel Beck', url: 'https://unsplash.com/photos/GWzW-NVmSPY' },
  { family: 'Arts et loisirs', image: 'img/produits/famille-arts.webp', photographer: 'Kelli Tungay', url: 'https://unsplash.com/photos/Sj0nhVIb4eY' },
  { family: 'Accessoires de bureau', image: 'img/produits/famille-bureau.webp', photographer: 'Mike Meyers', url: 'https://unsplash.com/photos/_1HlXH4LI7A' },
  { family: 'Classement et protection', image: 'img/produits/famille-classement.webp', photographer: 'Jonas Augustin', url: 'https://unsplash.com/photos/MTqaqBY6lfA' },
  { family: 'Papier', image: 'img/produits/famille-papier.webp', photographer: 'ron dyar', url: 'https://unsplash.com/photos/V29UWcALNko' },
  { family: 'Informatique et piles', image: 'img/produits/famille-informatique.webp', photographer: 'Brina Blum', url: 'https://unsplash.com/photos/Bb_X4JgSqIM' },
  { family: 'Livres scolaires', image: 'img/produits/famille-livres-scolaires.webp', photographer: 'Element5 Digital', url: 'https://unsplash.com/photos/OyCl7Y4y0Bk' },
  { family: 'Livres et dictionnaires', image: 'img/produits/famille-dictionnaires.webp', photographer: 'Pisit Heng', url: 'https://unsplash.com/photos/FQvadXmA524' },
];

/** Image de la famille, ou undefined si la famille n'a pas de photo. */
export function familyImage(family: string | undefined): string | undefined {
  return FAMILY_PHOTOS.find((p) => p.family === family)?.image;
}

/** La photo de famille sert d'illustration : pas une photo de l'article lui-même. */
export function isFamilyPhoto(image: string | undefined): boolean {
  return !!image && FAMILY_PHOTOS.some((p) => p.image === image);
}

// Ordre des familles dans le catalogue : ce que les parents cherchent d'abord à la rentrée, le bureau
// ensuite. Une famille absente de cette liste vient après, par ordre alphabétique.
export const FAMILY_ORDER = [
  'Cahiers, blocs et registres',
  'Stylos, crayons et feutres',
  'Géométrie et petit matériel',
  'Livres scolaires',
  'Livres et dictionnaires',
  'Sacs et cartables',
  'Arts et loisirs',
  'Papier',
  'Classement et protection',
  'Accessoires de bureau',
  'Informatique et piles',
];

/** Comparaison de deux familles selon FAMILY_ORDER, puis par nom. */
export function byFamilyOrder(a: string, b: string): number {
  const rank = (f: string) => (FAMILY_ORDER.includes(f) ? FAMILY_ORDER.indexOf(f) : FAMILY_ORDER.length);
  return rank(a) - rank(b) || a.localeCompare(b, 'fr');
}
