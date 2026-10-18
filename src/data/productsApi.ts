// Accès à l'API du catalogue (développement uniquement : /products/ est relayé par Vite
// vers http://localhost:8000, voir vite.config.ts). Le site publié n'appelle pas l'API.

export const API_CATEGORIES = ['Scolaire', 'Bureau', 'Livres'] as const;

export interface ApiProduct {
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
  status: string | null;
  image: string | null;
  stock: number;
}

// Champs envoyés à la création et à la modification (PUT est partiel ; null efface le champ)
export type ProductInput = Omit<ApiProduct, 'id'>;

export class ApiError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json' } });
  } catch {
    throw new ApiError('API injoignable (http://localhost:8000). Est-elle démarrée ?');
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    // FastAPI : { detail: "texte" } ou { detail: [{ loc: [..., "champ"], msg }] }
    const detail = body?.detail;
    const message = Array.isArray(detail)
      ? detail.map((d: { loc?: string[]; msg: string }) => `${d.loc?.at(-1) ?? ''} : ${d.msg}`).join(' · ')
      : typeof detail === 'string' ? detail : `Erreur HTTP ${res.status}`;
    throw new ApiError(message);
  }
  return body as T;
}

export const listProducts = () => request<ApiProduct[]>('/products/');

export const createProduct = (input: ProductInput) =>
  request<ApiProduct>('/products/', { method: 'POST', body: JSON.stringify(input) });

export const updateProduct = (id: number, input: ProductInput) =>
  request<ApiProduct>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(input) });

export const deleteProduct = (id: number) => request<void>(`/products/${id}`, { method: 'DELETE' });
