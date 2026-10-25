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
  // timedOut : abandon après le délai (serveur figé ou en train de démarrer)
  constructor(message: string, readonly status = 0, readonly timedOut = false) {
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

// Délai par défaut (ms) : au-delà, la requête est abandonnée (sans délai, une connexion figée en 3G
// laisserait « Chargement… » affiché indéfiniment). Le serveur Render en veille met ~40 s à répondre :
// la première requête le réveille même abandonnée, et « Réessayer » aboutit une fois qu'il a démarré.
export const DEFAULT_TIMEOUT = 15_000;

export interface RequestOptions extends RequestInit {
  // ms ; 0 = aucun délai
  timeout?: number;
  // false : sans jeton (lecture publique, évite la requête préalable CORS « OPTIONS »)
  auth?: boolean;
}

export async function request<T>(path: string, init?: RequestOptions): Promise<T> {
  // Content-Type seulement s'il y a un corps : sur une lecture, cet en-tête imposerait au navigateur
  // une requête préalable OPTIONS (CORS) avant chaque GET
  const headers: Record<string, string> = {};
  if (init?.body) headers['Content-Type'] = 'application/json';
  const { timeout = DEFAULT_TIMEOUT, auth = true, ...options } = init ?? {};
  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;
  // AbortController + setTimeout plutôt qu'AbortSignal.timeout(), absent des navigateurs un peu anciens
  const controller = timeout ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeout) : undefined;
  let res: Response;
  try {
    res = await fetch(import.meta.env.VITE_API_URL + path, controller ? { ...options, headers, signal: controller.signal } : { ...options, headers });
  } catch {
    clearTimeout(timer);
    const timedOut = !!controller?.signal.aborted;
    throw new ApiError(
      import.meta.env.DEV
        ? 'API injoignable (http://localhost:8000). Est-elle démarrée ?'
        : timedOut
          ? 'Le serveur ne répond pas. S\'il était en veille, il démarre (jusqu\'à une minute) : réessayez dans quelques secondes.'
          : 'Serveur injoignable. Vérifiez votre connexion et réessayez.',
      0,
      timedOut
    );
  }
  clearTimeout(timer);
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

// Une minute : le serveur Render en veille met ~40 s à répondre (message « Chargement… » du catalogue)
export const PRODUCTS_TIMEOUT = 60_000;
// Lecture publique sans jeton : requête « simple », sans OPTIONS préalable, même connecté.
// fresh : ignorer le cache HTTP du navigateur (l'API autorise 60 s), après une modification d'article
export const listProducts = (fresh = false) =>
  request<ApiProduct[]>('/products/', { timeout: PRODUCTS_TIMEOUT, auth: false, cache: fresh ? 'no-cache' : 'default' });

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
