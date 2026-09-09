import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: number;
  name?: string;
  username?: string;
  phone: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive' | 'banned';
  sponsor_id: number | null;
  sponsor_phone?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      clearUser: () => set({ user: null, isAuthenticated: false }),
      clearAuth: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'proyojon-auth',
    }
  )
);
