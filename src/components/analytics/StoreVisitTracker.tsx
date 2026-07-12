'use client';

import { useEffect, useRef } from 'react';
import { storefrontApi } from '@/lib/api';
import {
  captureMarketingAttributionFromUrl,
  getStoredMarketingAttribution,
} from '@/lib/marketingAttribution';

const SESSION_KEY = 'hor_sv';

function getOrCreateSessionId(): string | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID ?
        crypto.randomUUID()
      : `v_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return null;
  }
}

/** Counts one website visit per browser tab session (IST day). Fires on any storefront page load. */
export default function StoreVisitTracker() {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    const sessionId = getOrCreateSessionId();
    if (!sessionId) return;
    sent.current = true;

    captureMarketingAttributionFromUrl();
    const attribution = getStoredMarketingAttribution();

    storefrontApi
      .recordVisit({
        sessionKey: sessionId,
        path: window.location.pathname,
        referrer: document.referrer || undefined,
        ...(attribution ? { marketingAttribution: attribution } : {}),
      })
      .catch(() => {});
  }, []);

  return null;
}
