
"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface User {
  id: number;
  phone: string;
  name: string;
  email?: string | null;
  role: "farmer" | "buyer" | "logistics" | "admin";
  language: string;
  location?: string | null;
  latitude?: number;
  longitude?: number;
  village?: string | null;
  district?: string | null;
  state?: string | null;
  upi_id?: string | null;
  total_farm_size_hectares?: number;
  primary_crops?: string[];
  created_at?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
  hasHydrated: boolean;
  login: (identifier: string, password: string) => Promise<boolean>;
  register: (payload: {
    phone: string;
    name: string;
    password: string;
    email?: string;
    language?: string;
    role?: "farmer" | "buyer" | "logistics" | "admin";
    location?: string;
    company_name?: string;
  }) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
  setHasHydrated: (hydrated: boolean) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
      hasHydrated: false,

      async login(identifier, password) {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `username=${encodeURIComponent(identifier)}&password=${encodeURIComponent(password)}`,
          });
          
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Login failed");
          }
          
          const data = await res.json();
          if (typeof window !== "undefined") {
            localStorage.setItem("access_token", data.access_token);
          }
          set({
            isAuthenticated: true,
            isLoading: false,
            user: data.user,
          });
          return true;
        } catch (error) {
          set({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            error: error instanceof Error ? error.message : "Login failed.",
          });
          return false;
        }
      },

      async register(payload) {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`${API_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Registration failed");
          }
          
          const data = await res.json();
          if (typeof window !== "undefined") {
            localStorage.setItem("access_token", data.access_token);
          }
          set({
            isAuthenticated: true,
            isLoading: false,
            user: data.user,
          });
          return true;
        } catch (error) {
          set({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            error: error instanceof Error ? error.message : "Registration failed.",
          });
          return false;
        }
      },

      logout() {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
        }
        set({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: null,
        });
      },

      async checkAuth() {
        if (typeof window === "undefined") return;
        
        const token = localStorage.getItem("access_token");
        if (!token) {
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`${API_URL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (!res.ok) {
            throw new Error("Session expired");
          }
          
          const profile = await res.json();
          set({
            user: profile,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("access_token");
          }
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : "Session expired.",
          });
        }
      },

      setUser(user) {
        set({
          user,
          isAuthenticated: Boolean(user),
        });
      },

      clearError() {
        set({ error: null });
      },

      setHasHydrated(hydrated) {
        set({ hasHydrated: hydrated });
      },
    }),
    {
      name: "kisan-os-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
