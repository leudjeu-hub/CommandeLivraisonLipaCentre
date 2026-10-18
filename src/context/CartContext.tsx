import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface CartItem {
  productId: number;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (productId: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'centre-cart';

const validQuantity = (q: unknown): q is number => Number.isInteger(q) && (q as number) >= 1 && (q as number) <= 99;

// Le panier enregistré peut venir d'une ancienne version du site ({ "id": quantité })
// ou être corrompu : on ne garde que les lignes valides, sinon la page plante au démarrage.
function parseStoredCart(stored: unknown): CartItem[] {
  if (Array.isArray(stored)) {
    return stored.filter(
      (i): i is CartItem => !!i && Number.isInteger(i.productId) && validQuantity(i.quantity)
    );
  }
  if (stored && typeof stored === 'object') {
    return Object.entries(stored)
      .filter(([id, q]) => Number.isInteger(Number(id)) && validQuantity(q))
      .map(([id, q]) => ({ productId: Number(id), quantity: q as number }));
  }
  return [];
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      return parseStoredCart(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // stockage indisponible (navigation privée…) : le panier reste en mémoire
    }
  }, [items]);

  const addItem = (productId: number) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: Math.min(99, i.quantity + 1) } : i
        );
      }
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: Math.min(99, quantity) } : i))
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
