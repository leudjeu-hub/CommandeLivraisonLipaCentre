import { useEffect, useState } from 'react';
import { PRODUCTS, type Product } from './catalogue';

// En développement (`npm run dev`), les articles viennent de l'API (GET /products/,
// relayée par le proxy Vite vers http://localhost:8000). En production, PRODUCTS (catalogue.ts).

interface ApiProduct {
  id: number;
  category: string;
  price: number | null;
  name: string;
  description: string;
  label: string | null;
  name_en: string | null;
  description_en: string | null;
  label_en: string | null;
  color: string | null;
  available: boolean;
  image: string | null;
}

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
  apiProducts ??= fetch('/products/')
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<ApiProduct[]>;
    })
    .then((list) => list.filter((p) => p.available !== false).map(fromApi).sort((a, b) => a.id - b.id))
    .catch((err) => {
      console.warn(`API catalogue injoignable (${err.message}) : articles de src/data/catalogue.ts utilisés.`);
      return PRODUCTS;
    });
  return apiProducts;
}

export function useProducts(): Product[] {
  const [products, setProducts] = useState<Product[]>(import.meta.env.DEV ? [] : PRODUCTS);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    let active = true;
    loadFromApi().then((list) => active && setProducts(list));
    return () => {
      active = false;
    };
  }, []);
  return products;
}
