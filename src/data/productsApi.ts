// Accès à l'API (articles, connexion, comptes). En développement, /products/… est relayé par Vite
// vers l'API locale ; sur le site publié, les appels vont à l'API sur Render (vite.config.ts).

export const API_CATEGORIES = ['Scolaire', 'Bureau', 'Livres'] as const;

export interface ApiProduct {
  id: number;
  category: string;
  price: number | null;
  name: string;
  family: string | null;
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

export class ApiError extends Error {
  constructor(message: string, readonly status = 0) {
    super(message);
  }
}

// Jeton de connexion (POST /auth/login) envoyé avec chaque requête ; voir AuthContext
const TOKEN_KEY = 'centre-auth-token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // stockage indisponible : la session ne survivra pas au rechargement
  }
}

// Appelé quand l'API répond 401 (session expirée ou révoquée) ; branché par AuthContext
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(import.meta.env.VITE_API_URL + path, { ...init, headers });
  } catch {
    throw new ApiError(
      import.meta.env.DEV
        ? 'API injoignable (http://localhost:8000). Est-elle démarrée ?'
        : 'Serveur injoignable. Vérifiez votre connexion et réessayez.'
    );
  }
  if (res.status === 401 && token) onUnauthorized?.();
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    // FastAPI : { detail: "texte" } ou { detail: [{ loc: [..., "champ"], msg }] }
    const detail = body?.detail;
    const message = Array.isArray(detail)
      ? detail.map((d: { loc?: string[]; msg: string }) => `${d.loc?.at(-1) ?? ''} : ${d.msg}`).join(' · ')
      : typeof detail === 'string' ? detail : `Erreur HTTP ${res.status}`;
    throw new ApiError(message, res.status);
  }
  return body as T;
}

export const listProducts = () => request<ApiProduct[]>('/products/');

export const createProduct = (input: ProductInput) =>
  request<ApiProduct>('/products/', { method: 'POST', body: JSON.stringify(input) });

export const updateProduct = (id: number, input: ProductInput) =>
  request<ApiProduct>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(input) });

export const deleteProduct = (id: number) => request<void>(`/products/${id}`, { method: 'DELETE' });

// Import CSV (administrateurs) : dryRun = aperçu sans rien enregistrer ; rien n'est écrit si une ligne est en erreur
export interface ImportProblem {
  line: number;
  code: string;
  column: string | null;
  value: string | null;
}

export interface ImportReport {
  applied: boolean;
  created: number;
  updated: number;
  unchanged: number;
  errors: ImportProblem[];
}

export const importProducts = (content: string, dryRun: boolean) =>
  request<ImportReport>('/products/import', { method: 'POST', body: JSON.stringify({ content, dry_run: dryRun }) });
