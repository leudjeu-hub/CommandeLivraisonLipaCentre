import { useCallback, useEffect, useState } from 'react';
import { type Product } from './catalogue';
import { listProducts, type ApiProduct } from './productsApi';

// Les articles viennent de l'API (GET /products/ : API locale en développement, Render sur le site
// publié). La dernière liste reçue est gardée dans le navigateur : au retour, le catalogue s'affiche
// tout de suite (puis se met à jour), même si le serveur Render est en veille (~40 s) ou injoignable.
// Première visite sans réponse : « chargement ». API injoignable et rien en mémoire : « indisponible »
// (message avec WhatsApp), jamais d'articles inventés.

// 'loading' : rien encore ; 'cache' : liste de la visite précédente ; 'api' : liste à jour ;
// 'unavailable' : API injoignable et aucune liste en mémoire
export type CatalogueStatus = 'loading' | 'cache' | 'api' | 'unavailable';

export interface Catalogue {
  products: Product[];
  status: CatalogueStatus;
}

const DEFAULT_COLORS: Record<string, string> = { Scolaire: '#31574b', Bureau: '#c6a157', Livres: '#a95540' };
const CACHE_KEY = 'centre-catalogue';

// « CAHIER / 200 PAGES » → « CAHIER\n200 PAGES » ; sans vignette : le nom en majuscules
const label = (value: string | null, name: string) =>
  value ? value.split('/').map((s) => s.trim()).filter(Boolean).join('\n') : name.toLocaleUpperCase('fr');

export function fromApi(p: ApiProduct): Product {
  const product: Product = {
    id: p.id,
    cat: p.category,
    price: p.price === null ? null : Math.round(p.price),
    color: p.color || DEFAULT_COLORS[p.category] || '#486473',
    name: p.name,
    desc: p.description,
    label: label(p.label, p.name),
  };
  if (p.image) product.image = p.image;
  if (p.family) product.family = p.family;
  if (p.name_en && p.description_en) {
    product.en = { name: p.name_en, desc: p.description_en, label: label(p.label_en, p.name_en) };
  }
  return product;
}

// Lu une seule fois (la liste complète pèse plusieurs centaines de Ko)
let cached: Product[] | null | undefined;
function readCache(): Product[] | null {
  if (cached === undefined) {
    try {
      const list = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      cached = Array.isArray(list) && list.length > 0 ? list : null;
    } catch {
      cached = null;
    }
  }
  return cached;
}

function writeCache(list: Product[]) {
  cached = list.length > 0 ? list : null;
  try {
    if (cached) localStorage.setItem(CACHE_KEY, JSON.stringify(list));
    else localStorage.removeItem(CACHE_KEY);
  } catch {
    // stockage plein ou indisponible : le catalogue sera rechargé à la prochaine visite
  }
}

let loaded: Catalogue | null = null;
let pending: Promise<Catalogue> | null = null;

function loadFromApi(): Promise<Catalogue> {
  pending ??= listProducts()
    .then((list) => {
      const products = list.filter((p) => p.available !== false).map(fromApi).sort((a, b) => a.id - b.id);
      writeCache(products);
      return { products, status: 'api' as const };
    })
    .catch((err) => {
      const previous = readCache();
      console.warn(`Catalogue : ${err.message} ${previous ? 'Liste de la visite précédente utilisée.' : 'Catalogue indisponible.'}`);
      return previous ? { products: previous, status: 'cache' as const } : { products: [], status: 'unavailable' as const };
    })
    .then((result) => (loaded = result));
  return pending;
}

// Après une création, modification ou suppression : relire l'API au prochain affichage
export function invalidateProducts() {
  loaded = null;
  pending = null;
}

function initial(): Catalogue {
  if (loaded) return loaded;
  const previous = readCache();
  return previous ? { products: previous, status: 'cache' } : { products: [], status: 'loading' };
}

export function useCatalogue(): Catalogue & { retry: () => void } {
  const [catalogue, setCatalogue] = useState<Catalogue>(initial);
  useEffect(() => {
    let active = true;
    loadFromApi().then((result) => active && setCatalogue(result));
    return () => {
      active = false;
    };
  }, []);
  // Catalogue indisponible : nouvel essai à la demande (bouton « Réessayer »)
  const retry = useCallback(() => {
    invalidateProducts();
    setCatalogue({ products: [], status: 'loading' });
    loadFromApi().then(setCatalogue);
  }, []);
  return { ...catalogue, retry };
}

export function useProducts(): Product[] {
  return useCatalogue().products;
}
