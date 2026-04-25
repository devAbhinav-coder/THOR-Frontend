"use client";

import Script from "next/script";
import { reapplyStoredConsentIfAny } from "@/lib/cookieConsent";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

/**
 * Loads GA4 after hydration. Consent defaults (denied) are set in `app/layout.tsx` `<head>`;
 * `CookieConsentBanner` updates consent when the user chooses. After this script loads we
 * re-apply any choice already stored (returning visitors).
 */
export default function GoogleAnalytics() {
  if (!GA_ID) return null;

  return (
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`}
      strategy='afterInteractive'
      onLoad={() => {
        const w = window as Window & { gtag?: (...args: unknown[]) => void };
        if (typeof w.gtag === "function") {
          w.gtag("js", new Date());
          w.gtag("config", GA_ID, { send_page_view: true });
        }
        reapplyStoredConsentIfAny();
      }}
    />
  );
}
