"use client";

import Script from "next/script";
import { reapplyStoredConsentIfAny } from "@/lib/cookieConsent";
import { getGaMeasurementId } from "@/lib/gaConfig";

const GA_ID = getGaMeasurementId();

/**
 * Loads GA4 after hydration. Consent defaults (denied) are set in `app/layout.tsx` `<head>`;
 * `CookieConsentBanner` updates consent when the user chooses. After this script loads we
 * re-apply any choice already stored (returning visitors).
 *
 * No SRI: gtag is unversioned and rotates; integrity+crossOrigin breaks analytics the same way
 * as Meta Pixel / Razorpay. CSP still restricts script origins.
 */
export default function GoogleAnalytics() {
  if (!GA_ID) return null;

  return (
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`}
      strategy="afterInteractive"
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
