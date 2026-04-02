/**
 * Cookie / Google Consent Mode helpers (client-only).
 * Keep in sync with the inline default-consent script in `app/layout.tsx`.
 */

export const COOKIE_CONSENT_STORAGE_KEY = "hor_cookie_consent_v1";

export type CookieConsentChoice = "accepted_all" | "essential_only";

export const COOKIE_CONSENT_EVENT = "hor:cookie-consent";

export function getStoredConsent(): CookieConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (raw === "accepted_all" || raw === "essential_only") return raw;
    return null;
  } catch {
    return null;
  }
}

export function setStoredConsent(choice: CookieConsentChoice): void {
  try {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, choice);
  } catch {
    /* private mode / quota */
  }
}

/** Push Consent Mode update to gtag when present (GA4 / GTM). */
export function pushGtagConsent(choice: CookieConsentChoice): void {
  if (typeof window === "undefined") return;
  const w = window as Window & { gtag?: (...args: unknown[]) => void };
  const granted = choice === "accepted_all";
  if (typeof w.gtag === "function") {
    w.gtag("consent", "update", {
      analytics_storage: granted ? "granted" : "denied",
      ad_storage: granted ? "granted" : "denied",
      ad_user_data: granted ? "granted" : "denied",
      ad_personalization: granted ? "granted" : "denied",
    });
  }
  try {
    window.dispatchEvent(
      new CustomEvent<CookieConsentChoice>(COOKIE_CONSENT_EVENT, { detail: choice }),
    );
  } catch {
    /* CustomEvent unsupported — ignore */
  }
}

/**
 * Re-apply stored consent after gtag loads (e.g. deferred GA script).
 * Call from a short-lived listener or when injecting analytics.
 */
export function reapplyStoredConsentIfAny(): void {
  const stored = getStoredConsent();
  if (stored) pushGtagConsent(stored);
}
