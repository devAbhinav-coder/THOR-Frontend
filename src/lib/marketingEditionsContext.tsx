"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MarketingEdition } from "@/types";
import { listLiveMarketingEditions } from "@/lib/marketingEditions";
import { storefrontApi } from "@/lib/api";

export { MARKETING_EDITION_ACCENT_CLASS, resolveProductMarketingEdition } from "@/lib/marketingEditions";

const MarketingEditionsContext = createContext<MarketingEdition[]>([]);

export function MarketingEditionsProvider({
  editions,
  children,
}: {
  editions?: MarketingEdition[] | null;
  children: ReactNode;
}) {
  const [clientEditions, setClientEditions] = useState<
    MarketingEdition[] | null
  >(null);

  useEffect(() => {
    if (editions !== undefined && editions !== null) return;
    let cancelled = false;
    storefrontApi
      .getSettings()
      .then((res) => {
        if (cancelled) return;
        setClientEditions(
          listLiveMarketingEditions(res.data?.settings?.marketingEditions ?? []),
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [editions]);

  const value = useMemo(() => {
    const fromClient = clientEditions ?? [];
    const fromServer = listLiveMarketingEditions(editions ?? []);
    return fromClient.length > 0 ? fromClient : fromServer;
  }, [editions, clientEditions]);

  return (
    <MarketingEditionsContext.Provider value={value}>
      {children}
    </MarketingEditionsContext.Provider>
  );
}

export function useMarketingEditions(): MarketingEdition[] {
  return useContext(MarketingEditionsContext);
}
