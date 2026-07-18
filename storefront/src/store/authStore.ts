import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Customer {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  loyalty_tier: string;
  loyalty_points: number;
}

interface AuthState {
  customer: Customer | null;
  token: string | null;
  setAuth: (customer: Customer, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      customer: null,
      token: null,
      setAuth: (customer, token) => {
        set({ customer, token });
      },
      logout: () => {
        set({ customer: null, token: null });
      },
    }),
    {
      name: 'pommastore-customer-auth',
    }
  )
);
