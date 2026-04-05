import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { authApi } from '@/lib/api';

/** Set after persist rehydrates — avoids TDZ if referenced before `useAuthStore` is assigned */
let markAuthHydrated: () => void;

interface AuthState {
  user: User | null;
  /** Kept null — access token lives in httpOnly cookie only (no localStorage). */
  token: null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** After zustand persist finishes reading localStorage — avoids admin redirect race on full page load */
  _hasHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signupStart: (data: { name: string; email: string; password: string; phone: string }) => Promise<void>;
  signupVerify: (email: string, otp: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  /** Passwordless login after `/auth/verify-otp` with type `login`. */
  loginWithOtp: (email: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      markAuthHydrated = () => set({ _hasHydrated: true });
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        _hasHydrated: false,

        login: async (email, password) => {
          set({ isLoading: true });
          try {
            const body = await authApi.login({ email, password });
            set({ user: body.data.user, token: null, isAuthenticated: true });
          } finally {
            set({ isLoading: false });
          }
        },

        signupStart: async (data) => {
          set({ isLoading: true });
          try {
            await authApi.signupStart(data);
          } finally {
            set({ isLoading: false });
          }
        },

        signupVerify: async (email, otp) => {
          set({ isLoading: true });
          try {
            const body = await authApi.verifyOtpSignup({ email, otp });
            set({ user: body.data.user, token: null, isAuthenticated: true });
          } finally {
            set({ isLoading: false });
          }
        },

        loginWithGoogle: async (credential) => {
          set({ isLoading: true });
          try {
            const body = await authApi.google({ credential });
            set({ user: body.data.user, token: null, isAuthenticated: true });
          } finally {
            set({ isLoading: false });
          }
        },

        loginWithOtp: async (email, otp) => {
          set({ isLoading: true });
          try {
            const body = await authApi.verifyOtpLogin({ email, otp });
            set({ user: body.data.user, token: null, isAuthenticated: true });
          } finally {
            set({ isLoading: false });
          }
        },

        logout: async () => {
          try {
            await authApi.logout();
          } catch {
            /* ignore */
          } finally {
            set({ user: null, token: null, isAuthenticated: false });
          }
        },

        fetchUser: async () => {
          const tryMe = async () => {
            const body = await authApi.getMe();
            set({ user: body.data.user, isAuthenticated: true, token: null });
          };
          try {
            await tryMe();
          } catch {
            const { refreshAccessToken } = await import('@/lib/authRefresh');
            const ok = await refreshAccessToken();
            if (!ok) {
              set({ user: null, token: null, isAuthenticated: false });
              return;
            }
            try {
              await tryMe();
            } catch {
              set({ user: null, token: null, isAuthenticated: false });
            }
          }
        },

        setUser: (user) => set({ user }),
      };
    },
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<AuthState> | undefined;
        if (!p) return current;
        return {
          ...current,
          ...p,
          token: null,
        };
      },
      onRehydrateStorage: () => () => {
        markAuthHydrated?.();
      },
    }
  )
);
