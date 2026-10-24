import { request } from './productsApi';

// Commandes (API : /orders/…). Le formulaire enregistre chaque commande ou demande de devis
// (POST /orders/submit, public) ; le client l'envoie toujours par WhatsApp ou e-mail.
// Liste et statuts : administrateurs (Gestion > Commandes).

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

// keepalive : l'envoi aboutit même si le client quitte la page pour WhatsApp ou l'e-mail
export const submitOrder = (order: OrderSubmit) =>
  request<Order>('/orders/submit', { method: 'POST', body: JSON.stringify(order), keepalive: true });

export const listOrders = () => request<Order[]>('/orders/');

export const setOrderStatus = (id: number, status: OrderStatus) =>
  request<Order>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

// Lien WhatsApp vers le client : numéro saisi librement (+237 6…, 6…, 00237…)
export function customerWhatsApp(phone: string): string | null {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 9) digits = '237' + digits;
  return digits.length >= 11 ? `https://wa.me/${digits}` : null;
}
