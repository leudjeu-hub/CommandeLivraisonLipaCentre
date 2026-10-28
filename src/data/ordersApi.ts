import { request } from './productsApi';

// Commandes (API : /orders/…). Le formulaire enregistre chaque commande ou demande de devis
// (POST /orders/submit, public) ; le client l'envoie toujours par WhatsApp ou e-mail.
// Liste et statuts : administrateurs (Gestion > Commandes). Envoyée en étant connecté (le jeton part
// avec request()), la commande est liée au compte : le client la retrouve dans Mon compte (/orders/mine).

export type OrderStatus = 'new' | 'confirmed' | 'delivered' | 'cancelled';
export const ORDER_STATUSES: OrderStatus[] = ['new', 'confirmed', 'delivered', 'cancelled'];

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Order {
  id: number;
  kind: 'order' | 'quote';
  customer_name: string;
  phone: string;
  status: OrderStatus;
  // Articles seuls, aux prix du catalogue ; frais de livraison à part (null = à convenir)
  total: number;
  delivery_fee: number | null;
  area: string | null;
  address: string | null;
  slot: string | null;
  payment: string | null;
  notes: string | null;
  created_at: string;
  // Dernier changement de statut : une commande annulée est supprimée 30 jours après
  status_changed_at: string | null;
  items: OrderItem[];
  // Remarque interne de la boutique : listes de la Gestion seulement, jamais renvoyée au client
  admin_notes?: string | null;
  // Réponse à un envoi sans compte seulement : code pour rattacher la commande au compte plus tard
  claim_code?: string | null;
}

export interface OrderSubmit {
  kind: 'order' | 'quote';
  customer_name: string;
  phone: string;
  area: string;
  address: string;
  slot: string;
  payment: string;
  notes: string;
  delivery_fee: number | null;
  items: { product_id: number; quantity: number }[];
}

// keepalive : l'envoi aboutit même si le client quitte la page pour WhatsApp ou l'e-mail.
// Aucun délai : envoi sans attente ni nouvel essai (CheckoutPage) ; l'abandonner au bout de 15 s,
// pendant le réveil du serveur (~40 s), perdrait la commande au lieu d'éviter un doublon.
export const submitOrder = (order: OrderSubmit) =>
  request<Order>('/orders/submit', { method: 'POST', body: JSON.stringify(order), keepalive: true, timeout: 0 });

export const listOrders = () => request<Order[]>('/orders/');

// Les commandes du compte connecté, et seulement les siennes (filtrées par l'API sur le jeton)
export const listMyOrders = () => request<Order[]>('/orders/mine');

// Commandes envoyées sans compte : l'API donne un code à usage unique, gardé dans ce navigateur.
// Une fois connecté, Mes commandes les rattache au compte (POST /orders/claim) puis les oublie.
const CLAIMS_KEY = 'centre-commandes-a-rattacher';

export function pendingClaims(): string[] {
  try {
    const codes = JSON.parse(localStorage.getItem(CLAIMS_KEY) || '[]');
    return Array.isArray(codes) ? codes.filter((c) => typeof c === 'string') : [];
  } catch {
    return [];
  }
}

function setPendingClaims(codes: string[]) {
  try {
    if (codes.length) localStorage.setItem(CLAIMS_KEY, JSON.stringify(codes.slice(-20)));
    else localStorage.removeItem(CLAIMS_KEY);
  } catch {
    // stockage indisponible : la commande ne pourra pas être rattachée au compte
  }
}

export const savePendingClaim = (code: string) => setPendingClaims([...pendingClaims(), code]);

// Rattache les commandes en attente ; les codes sont oubliés dès que l'API a répondu (un code déjà
// utilisé ou inconnu ne sert plus à rien), gardés si elle est injoignable
// (un seul envoi à la fois : Mes commandes peut se recharger pendant la requête)
let claiming: Promise<void> | null = null;
export function claimPendingOrders(): Promise<void> {
  const codes = pendingClaims();
  if (!codes.length) return Promise.resolve();
  claiming ??= request<{ claimed: number }>('/orders/claim', { method: 'POST', body: JSON.stringify({ codes }) })
    .then(() => setPendingClaims(pendingClaims().filter((c) => !codes.includes(c))))
    .finally(() => (claiming = null));
  return claiming;
}

// Référence client « LC-2510-4821 » : écrite par le formulaire en tête des remarques (CheckoutPage),
// c'est elle que le client cite sur WhatsApp. Les commandes plus anciennes n'en ont pas.
const REF = /^\s*[^\n]*?(LC-\d{4}-\d{4})[^\n]*\n?/;
export const clientRef = (o: Order) => o.notes?.match(REF)?.[1] ?? null;
export const notesWithoutRef = (o: Order) => (clientRef(o) ? o.notes!.replace(REF, '').trim() || null : o.notes);

export const setOrderStatus = (id: number, status: OrderStatus) =>
  request<Order>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

export const setOrderAdminNotes = (id: number, admin_notes: string) =>
  request<Order>(`/orders/${id}/admin-notes`, { method: 'PATCH', body: JSON.stringify({ admin_notes }) });

// Lien WhatsApp vers le client : numéro saisi librement (+237 6…, 6…, 00237…)
export function customerWhatsApp(phone: string): string | null {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 9) digits = '237' + digits;
  return digits.length >= 11 ? `https://wa.me/${digits}` : null;
}
