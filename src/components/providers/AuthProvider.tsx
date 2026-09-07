'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartSync } from '@/hooks/useCartSync';
import { useCartQuery } from '@/hooks/useCartQuery';
import { useWishlistQuery } from '@/hooks/useWishlistQuery';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useCartSync();
  // Sync cart + wishlist from server into Zustand when authenticated
  useCartQuery();
  useWishlistQuery();

  useEffect(() => {
    try {
      localStorage.removeItem('token');
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    useAuthStore.getState().fetchUser();
  }, []);

  return <>{children}</>;
}
