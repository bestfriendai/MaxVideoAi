'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'canceled' | 'expired' | 'trial';
  credits: number;
  credits_used: number;
  period_start: string;
  period_end: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultEngine: string;
  defaultAspectRatio: string;
  emailNotifications: boolean;
  autoSave: boolean;
}

interface UserState {
  // User data
  user: User | null;
  subscription: Subscription | null;
  preferences: UserPreferences;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setSubscription: (subscription: Subscription | null) => void;
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  updateCredits: (credits: number) => void;
  useCredits: (amount: number) => boolean;
  logout: () => void;
  reset: () => void;
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  defaultEngine: 'kling',
  defaultAspectRatio: '16:9',
  emailNotifications: true,
  autoSave: true,
};

const initialState = {
  user: null,
  subscription: null,
  preferences: defaultPreferences,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
          error: null,
        });
      },

      setSubscription: (subscription) => {
        set({ subscription });
      },

      setPreferences: (newPreferences) => {
        set((state) => ({
          preferences: { ...state.preferences, ...newPreferences },
        }));
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      setError: (error) => {
        set({ error });
      },

      updateCredits: (credits) => {
        const { subscription } = get();
        if (subscription) {
          set({
            subscription: { ...subscription, credits },
          });
        }
      },

      useCredits: (amount) => {
        const { subscription } = get();
        if (!subscription) return false;

        const availableCredits = subscription.credits - subscription.credits_used;
        if (availableCredits < amount) return false;

        set({
          subscription: {
            ...subscription,
            credits_used: subscription.credits_used + amount,
          },
        });
        return true;
      },

      logout: () => {
        set({
          ...initialState,
          preferences: get().preferences, // Keep preferences
        });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        preferences: state.preferences,
        // Don't persist sensitive data
      }),
    }
  )
);

// Selectors for common use cases
export const selectUser = (state: UserState) => state.user;
export const selectSubscription = (state: UserState) => state.subscription;
export const selectIsAuthenticated = (state: UserState) => state.isAuthenticated;
export const selectCredits = (state: UserState) => {
  const sub = state.subscription;
  if (!sub) return { total: 0, used: 0, available: 0 };
  return {
    total: sub.credits,
    used: sub.credits_used,
    available: sub.credits - sub.credits_used,
  };
};
export const selectPlan = (state: UserState) => state.subscription?.plan ?? 'free';
