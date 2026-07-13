import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  phone: string;
  shopName: string;
  ownerName: string;
  city?: string;
  address?: string;
  businessType?: string;
}

// Demo user for UI preview when backend is unavailable
const DEMO_USER: User = {
  id: 'demo-001',
  phone: 'akramlatibagar68@gmail.com',
  shopName: 'Zynq',
  ownerName: 'Ali',
  city: 'Karachi',
  address: 'Block 5, Gulshan-e-Iqbal',
  businessType: 'General Store',
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      // Auto-login with demo user so the UI is viewable without backend
      user: DEMO_USER,
      isAuthenticated: true,
      login: (user: User) => set({ user, isAuthenticated: true }),
      updateUser: (updates: Partial<User>) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : state.user,
        })),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'zynq-auth', // name of the item in the storage (must be unique)
    }
  )
);
