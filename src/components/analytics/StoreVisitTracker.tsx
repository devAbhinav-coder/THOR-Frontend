'use client';

import { useEffect, useRef } from 'react';
import { storefrontApi } from '@/lib/api';
import {
  captureMarketingAttributionFromUrl,
  getStoredMarketingAttribution,
} from '@/lib/marketingAttribution';
import { getShopSessionKey } from '@/lib/shopSession';

/** Counts one website visit per browser tab session (IST day). Fires on any storefront page load. */
export default function StoreVisitTracker() {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    const sessionId = getShopSessionKey();
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
