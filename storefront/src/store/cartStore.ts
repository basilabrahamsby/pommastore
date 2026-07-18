import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string; // variant_id
  productId: string;
  slug?: string; // product slug for navigation
  name: string;
  variantName: string;
  price: number;
  image: string;
  quantity: number;
  sizeMl?: number;
  loyaltyPoints?: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
  totalLoyaltyPoints: () => number;
  setItems: (items: CartItem[]) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const items = get().items;
        const existing = items.find((i) => i.id === item.id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
            ),
          });
        } else {
          set({ items: [...items, item] });
        }
      },
      removeItem: (variantId) => {
        set({ items: get().items.filter((i) => i.id !== variantId) });
      },
      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.id === variantId ? { ...i, quantity } : i
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
      totalPrice: () => get().items.reduce((acc, i) => acc + i.price * i.quantity, 0),
      totalLoyaltyPoints: () => get().items.reduce((acc, i) => acc + (i.loyaltyPoints || 0) * i.quantity, 0),
      setItems: (items: CartItem[]) => set({ items }),
    }),
    {
      name: 'pommastore-cart',
    }
  )
);

import api from '@/services/api';
import { useAuthStore } from './authStore';

// Optional helper to sync/merge on login
export const syncCartWithServer = async () => {
  const localItems = useCartStore.getState().items;
  try {
    const res = await api.get('/account/cart');
    const serverItems = res.data || [];
    
    // Merge
    const itemMap = new Map<string, CartItem>();
    serverItems.forEach((i: CartItem) => itemMap.set(i.id, i));
    localItems.forEach(i => {
      if (itemMap.has(i.id)) {
        itemMap.get(i.id)!.quantity += i.quantity;
      } else {
        itemMap.set(i.id, i);
      }
    });
    
    const merged = Array.from(itemMap.values());
    useCartStore.setState({ items: merged });
    
    // Push back merged state
    await api.put('/account/cart', merged);
  } catch (err) {
    console.error("Failed to sync cart on login", err);
  }
};

export const syncCartItemPrices = async () => {
  const items = useCartStore.getState().items;
  if (items.length === 0) return;
  
  try {
    const variantIds = items.map(i => i.id);
    const res = await api.post('/products/sync-prices', variantIds);
    const priceMap = res.data || {};
    
    let changed = false;
    const updated = items.map(item => {
      const serverPrice = priceMap[item.id];
      if (serverPrice !== undefined && serverPrice !== item.price) {
        changed = true;
        return { ...item, price: serverPrice };
      }
      return item;
    });
    
    if (changed) {
      useCartStore.setState({ items: updated });
    }
  } catch (err) {
    console.warn("Failed to sync cart item prices with server", err);
  }
};

// Global subscriber to push changes to backend whenever local cart changes
if (typeof window !== 'undefined') {
  useCartStore.subscribe((state, prevState) => {
    if (state.items !== prevState.items) {
      const token = useAuthStore.getState().token;
      if (token) {
        api.put('/account/cart', state.items).catch(err => {
          if (err.response?.status !== 401) {
            console.error("Failed to sync cart update", err);
          } else {
            console.warn("Cart sync skipped: session unauthorized (401).");
          }
        });
      }
    }
  });
}
