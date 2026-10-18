import { useEffect, useState } from 'react';
import { PRODUCTS, type Product } from './catalogue';
import { listProducts, type ApiProduct } from './productsApi';

// Les articles viennent de l'API (GET /products/ : API locale en développement, Render sur le site
// publié). En attendant sa réponse (jusqu'à ~40 s si le serveur Render est en veille) ou si elle
// échoue, le site affiche PRODUCTS (src/data/catalogue.ts).

const DEFAULT_COLORS: Record<string, string> = { Scolaire: '#31574b', Bureau: '#c6a157', Livres: '#a95540' };

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
  if (p.name_en && p.description_en) {
    product.en = { name: p.name_en, desc: p.description_en, label: label(p.label_en, p.name_en) };
  }
  return product;
}

let apiProducts: Promise<Product[]> | null = null;

function loadFromApi(): Promise<Product[]> {
  apiProducts ??= listProducts()
    .then((list) => list.filter((p) => p.available !== false).map(fromApi).sort((a, b) => a.id - b.id))
    .catch((err) => {
      console.warn(`Catalogue : ${err.message} Articles de src/data/catalogue.ts utilisés.`);
      return PRODUCTS;
    });
  return apiProducts;
}

// Après une création, modification ou suppression : relire l'API au prochain affichage
export function invalidateProducts() {
  apiProducts = null;
}

export function useProducts(): Product[] {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  useEffect(() => {
    let active = true;
    loadFromApi().then((list) => active && setProducts(list));
    return () => {
      active = false;
    };
  }, []);
  return products;
}
