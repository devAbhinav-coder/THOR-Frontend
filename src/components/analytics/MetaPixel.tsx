"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import {
  META_PIXEL_ID,
  initPixel,
  refreshMetaAdvancedMatching,
  trackPageView,
} from "@/lib/metaPixel";
import { captureMarketingAttributionFromUrl } from "@/lib/marketingAttribution";
import { useAuthStore } from "@/store/useAuthStore";

function isStorefrontPath(pathname: string | null): boolean {
  if (!pathname) return true;
  return !pathname.startsWith("/admin");
}

export default function MetaPixel() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);
  const user = useAuthStore((state) => state.user);
  const storefront = isStorefrontPath(pathname);

  useEffect(() => {
    if (!storefront) return;
    captureMarketingAttributionFromUrl();
  }, [storefront]);

  useEffect(() => {
    if (!META_PIXEL_ID || !storefront) return;
    initPixel();
  }, [storefront]);

  useEffect(() => {
    if (!META_PIXEL_ID || !user || !storefront) return;
    refreshMetaAdvancedMatching();
  }, [storefront, user?._id, user?.email, user?.phone]);

  useEffect(() => {
    if (!META_PIXEL_ID || !storefront || !pathname) return;
    if (typeof window === "undefined" || !window.fbq) return;
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;
    trackPageView();
  }, [pathname, storefront]);

  if (!META_PIXEL_ID) {
    return null;
  }

  return (
    <>
      <Script
        id="facebook-fbevents"
        src="https://connect.facebook.net/en_US/fbevents.js"
        strategy="afterInteractive"
        onLoad={() => {
          captureMarketingAttributionFromUrl();
          initPixel();
          const path = window.location.pathname;
          if (!isStorefrontPath(path)) return;
          if (lastTrackedPath.current === path) return;
          lastTrackedPath.current = path;
          trackPageView();
        }}
      />
      {storefront ?
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      : null}
    </>
  );
}
