'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { storefrontApi } from '@/lib/api';
import {
  captureMarketingAttributionFromUrl,
  getStoredMarketingAttribution,
} from '@/lib/marketingAttribution';
import { getShopSessionKey } from '@/lib/shopSession';
import { useAuthStore } from '@/store/useAuthStore';

function sendVisit(payload: {
  sessionKey: string;
  kind: 'session' | 'pageview';
  path: string;
  userId?: string;
}) {
  captureMarketingAttributionFromUrl();
  const attribution = getStoredMarketingAttribution();
  storefrontApi
    .recordVisit({
      sessionKey: payload.sessionKey,
      kind: payload.kind,
      path: payload.path,
      referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
      userId: payload.userId,
      ...(attribution ? { marketingAttribution: attribution } : {}),
    })
    .catch(() => {});
}

/** Session visit once per IST day; pageview on each route change. */
export default function StoreVisitTracker() {
  const pathname = usePathname();
  const sessionSent = useRef(false);
  const lastPagePath = useRef<string | null>(null);
  const userId = useAuthStore((s) => s.user?._id);

  useEffect(() => {
    const sessionId = getShopSessionKey();
    if (!sessionId) return;
    if (sessionSent.current) return;
    sessionSent.current = true;
    const path = pathname || '/';
    lastPagePath.current = path;
    sendVisit({ sessionKey: sessionId, kind: 'session', path, userId });
  }, [pathname, userId]);

  useEffect(() => {
    const sessionId = getShopSessionKey();
    if (!sessionId) return;
    const path = pathname || '/';
    if (lastPagePath.current === path) return;
    lastPagePath.current = path;
    sendVisit({ sessionKey: sessionId, kind: 'pageview', path, userId });
  }, [pathname, userId]);

  return null;
}
