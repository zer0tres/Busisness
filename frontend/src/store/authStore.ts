import { create } from 'zustand';
import type { User, Company } from '../types';

interface AuthState {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  setAuth: (user: User, company: Company, accessToken: string, refreshToken: string) => void;
  updateCompany: (data: Partial<Company>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  company: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  
  setAuth: (user, company, accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    set({ user, company, isAuthenticated: true });
  },
  
  updateCompany: (data) => {
    set((state) => ({ company: state.company ? { ...state.company, ...data } : null }));
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, company: null, isAuthenticated: false });
  },
}));