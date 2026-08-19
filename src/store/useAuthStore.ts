import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { authApi } from '@/lib/api';

/** Set after persist rehydrates — avoids TDZ if referenced before `useAuthStore` is assigned */
let markAuthHydrated: () => void;

export type LoginResult =
  | { requiresAdmin2FA: false }
  | {
      requiresAdmin2FA: true;
      pendingToken: string;
      email?: string;
      name?: string;
    };

export type Admin2FAPending = {
  pendingToken: string;
  email?: string;
  name?: string;
};

function loginResultFromBody(
  body: {
    data?: {
      user?: unknown;
      requiresAdmin2FA?: boolean;
      pendingToken?: string;
    };
  },
  setPending: (pending: Admin2FAPending | null) => void,
): LoginResult {
  if (body.data?.requiresAdmin2FA && body.data.pendingToken) {
    const preview = body.data.user as { email?: string; name?: string } | undefined;
    const pending: Admin2FAPending = {
      pendingToken: body.data.pendingToken,
      email: preview?.email,
      name: preview?.name,
    };
    setPending(pending);
    return { requiresAdmin2FA: true, ...pending };
  }
  setPending(null);
  return { requiresAdmin2FA: false };
}

interface AuthState {
  user: User | null;
  /** Kept null — access token lives in httpOnly cookie only (no localStorage). */
  token: null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** True after the initial cookie-based session probe completes once. */
  hasSessionChecked: boolean;
  /** After zustand persist finishes reading localStorage — avoids admin redirect race on full page load */
  _hasHydrated: boolean;
  /** Admin TOTP step — in-memory only (not persisted). */
  admin2faPending: Admin2FAPending | null;
  clearAdmin2faPending: () => void;
  login: (email: string, password: string, turnstileToken?: string) => Promise<LoginResult>;
  verifyAdmin2FA: (pendingToken: string, code: string) => Promise<void>;
  signupStart: (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    turnstileToken?: string;
  }) => Promise<void>;
  signupVerify: (email: string, otp: string, turnstileToken?: string) => Promise<void>;
  loginWithGoogle: (credential: string, turnstileToken?: string) => Promise<LoginResult>;
  /** Passwordless login after `/auth/verify-otp` with type `login`. */
  loginWithOtp: (email: string, otp: string, turnstileToken?: string) => Promise<void>;
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
        hasSessionChecked: false,
        _hasHydrated: false,
        admin2faPending: null,

        clearAdmin2faPending: () => set({ admin2faPending: null }),

        login: async (email, password, turnstileToken) => {
          set({ isLoading: true });
          try {
            const body = await authApi.login({ email, password, turnstileToken });
            const result = loginResultFromBody(body, (pending) =>
              set({ admin2faPending: pending }),
            );
            if (result.requiresAdmin2FA) return result;
            set({
              user: body.data.user,
              token: null,
              isAuthenticated: true,
              hasSessionChecked: true,
              admin2faPending: null,
            });
            return result;
          } finally {
            set({ isLoading: false });
          }
        },

        verifyAdmin2FA: async (pendingToken, code) => {
          set({ isLoading: true });
          try {
            const body = await authApi.verifyAdmin2FA({ pendingToken, code });
            set({
              user: body.data.user,
              token: null,
              isAuthenticated: true,
              hasSessionChecked: true,
              admin2faPending: null,
            });
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

        signupVerify: async (email, otp, turnstileToken) => {
          set({ isLoading: true });
          try {
            const body = await authApi.verifyOtpSignup({ email, otp, turnstileToken });
            set({
              user: body.data.user,
              token: null,
              isAuthenticated: true,
              hasSessionChecked: true,
            });
          } finally {
            set({ isLoading: false });
          }
        },

        loginWithGoogle: async (credential, turnstileToken) => {
          set({ isLoading: true });
          try {
            const body = await authApi.google({ credential, turnstileToken });
            const result = loginResultFromBody(body, (pending) =>
              set({ admin2faPending: pending }),
            );
            if (result.requiresAdmin2FA) return result;
            set({
              user: body.data.user,
              token: null,
              isAuthenticated: true,
              hasSessionChecked: true,
              admin2faPending: null,
            });
            return result;
          } finally {
            set({ isLoading: false });
          }
        },

        loginWithOtp: async (email, otp, turnstileToken) => {
          set({ isLoading: true });
          try {
            const body = await authApi.verifyOtpLogin({ email, otp, turnstileToken });
            set({
              user: body.data.user,
              token: null,
              isAuthenticated: true,
              hasSessionChecked: true,
            });
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
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              hasSessionChecked: true,
              admin2faPending: null,
            });
          }
        },

        fetchUser: async () => {
          const quiet = get().isAuthenticated;
          if (!quiet) set({ isLoading: true });
          const tryMe = async () => {
            const body = await authApi.getMe();
            set({
              user: body.data.user,
              isAuthenticated: true,
              token: null,
              hasSessionChecked: true,
            });
          };
          try {
            await tryMe();
          } catch {
            const { refreshAccessToken } = await import('@/lib/authRefresh');
            const ok = await refreshAccessToken();
            if (!ok) {
              set({
                user: null,
                token: null,
                isAuthenticated: false,
                hasSessionChecked: true,
              });
              return;
            }
            try {
              await tryMe();
            } catch {
              set({
                user: null,
                token: null,
                isAuthenticated: false,
                hasSessionChecked: true,
              });
            }
          } finally {
            set({ isLoading: false, hasSessionChecked: true });
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
