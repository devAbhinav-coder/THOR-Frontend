'use client';

import { useEffect, useRef } from 'react';
import { env } from '@/lib/env';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';

/**
 * Subscribes to `GET /cart/sync` (SSE). Refreshes cart when another tab/device mutates the cart.
 */
export function useCartSync(): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasSessionChecked = useAuthStore((s) => s.hasSessionChecked);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!hasSessionChecked || !isAuthenticated) return;

    const base = env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
    const url = `${base}/cart/sync`;
    const es = new EventSource(url, { withCredentials: true });
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { type?: string };
        if (data.type === 'cart.changed') {
          void fetchCart();
        }
      } catch {
        /* ignore malformed events */
      }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [hasSessionChecked, isAuthenticated, fetchCart]);
}
