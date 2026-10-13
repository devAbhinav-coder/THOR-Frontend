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
import { recordCommerceActivity } from '@/lib/commerceActivity';
import {
  computeScrollPct,
  flushPageEngagement,
} from '@/lib/pageEngagement';
import { clearPdpEngagementContext } from '@/lib/pdpEngagementContext';

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

/** Session visit once per IST day; pageview + measured time-on-page per route. */
export default function StoreVisitTracker() {
  const pathname = usePathname();
  const sessionSent = useRef(false);
  const lastPagePath = useRef<string | null>(null);
  const pageStartedAt = useRef<number>(Date.now());
  const maxScrollPct = useRef(0);
  const activePath = useRef(pathname || '/');
  const lastFlushKey = useRef('');
  const userId = useAuthStore((s) => s.user?._id);

  const flushCurrentPage = () => {
    const key = `${activePath.current}:${pageStartedAt.current}`;
    if (lastFlushKey.current === key) return;
    lastFlushKey.current = key;
    flushPageEngagement({
      path: activePath.current,
      startedAt: pageStartedAt.current,
      maxScrollPct: maxScrollPct.current,
    });
  };

  useEffect(() => {
    const sessionId = getShopSessionKey();
    if (!sessionId) return;
    if (sessionSent.current) return;
    sessionSent.current = true;
    const path = pathname || '/';
    lastPagePath.current = path;
    activePath.current = path;
    pageStartedAt.current = Date.now();
    maxScrollPct.current = computeScrollPct();
    sendVisit({ sessionKey: sessionId, kind: 'session', path, userId });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one session ping per tab load
  }, []);

  useEffect(() => {
    const sessionId = getShopSessionKey();
    if (!sessionId) return;
    const path = pathname || '/';
    if (lastPagePath.current !== null && lastPagePath.current !== path) {
      flushPageEngagement({
        path: lastPagePath.current,
        startedAt: pageStartedAt.current,
        maxScrollPct: maxScrollPct.current,
      });
      if (
        !lastPagePath.current.startsWith('/shop/') &&
        !lastPagePath.current.startsWith('/premium/')
      ) {
        clearPdpEngagementContext();
      }
    }
    if (lastPagePath.current === path) return;
    lastPagePath.current = path;
    activePath.current = path;
    pageStartedAt.current = Date.now();
    maxScrollPct.current = computeScrollPct();
    sendVisit({ sessionKey: sessionId, kind: 'pageview', path, userId });
  }, [pathname, userId]);

  useEffect(() => {
    const onScroll = () => {
      maxScrollPct.current = Math.max(
        maxScrollPct.current,
        computeScrollPct(),
      );
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  useEffect(() => {
    const onExit = () => {
      const path = pathname || '/';
      flushCurrentPage();
      recordCommerceActivity({ eventType: 'session_exit', path });
    };
    window.addEventListener('pagehide', onExit);
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        flushCurrentPage();
      } else {
        pageStartedAt.current = Date.now();
        maxScrollPct.current = computeScrollPct();
        lastFlushKey.current = '';
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('pagehide', onExit);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [pathname]);

  return null;
}
