export type MarketingAttribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  fbclid?: string;
  landingPath?: string;
  capturedAt?: string;
};

const STORAGE_KEY = "hor_marketing_attribution_v1";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const FBC_COOKIE_MAX_AGE_SEC = 90 * 24 * 60 * 60;

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const prefix = `${encodeURIComponent(name)}=`;
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : undefined;
}

/** Meta `_fbc` cookie: fb.{subdomainIndex}.{creationTime}.{fbclid} */
export function readFbclidFromMetaCookie(): string | undefined {
  const fbc = readCookie("_fbc");
  if (!fbc) return undefined;
  const match = /^fb\.\d+\.\d+\.(.+)$/.exec(fbc.trim());
  const fbclid = match?.[1]?.trim();
  if (!fbclid) return undefined;
  return fbclid.slice(0, 200);
}

function mergeFbclidFromCookie(
  attribution: MarketingAttribution,
): MarketingAttribution {
  if (attribution.fbclid?.trim()) return attribution;
  const fromCookie = readFbclidFromMetaCookie();
  if (!fromCookie) return attribution;
  return { ...attribution, fbclid: fromCookie };
}

function persistAttribution(payload: MarketingAttribution): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* private mode */
  }
}

/** Meta Click ID cookie - only set when the pixel has not already written `_fbc`. */
export function writeMetaFbcCookie(
  fbclid: string,
  capturedAtMs?: number,
): void {
  if (typeof document === "undefined" || !fbclid.trim()) return;
  if (readCookie("_fbc")) return;
  const timestamp =
    Number.isFinite(capturedAtMs) ? Number(capturedAtMs) : Date.now();
  const value = `fb.1.${timestamp}.${fbclid.trim()}`;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `_fbc=${encodeURIComponent(value)}; max-age=${FBC_COOKIE_MAX_AGE_SEC}; path=/; SameSite=Lax${secure}`;
}

function trim(
  value: string | null | undefined,
  max: number,
): string | undefined {
  const v = value?.trim();
  if (!v) return undefined;
  return v.slice(0, max);
}

function readStored(): MarketingAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MarketingAttribution;
    if (!parsed?.capturedAt) return null;
    const age = Date.now() - new Date(parsed.capturedAt).getTime();
    if (!Number.isFinite(age) || age > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** First-touch UTM; still attach fbclid later if a Meta ad click arrives. */
export function captureMarketingAttributionFromUrl(): MarketingAttribution | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const fbclid = trim(params.get("fbclid"), 200);
  const existing = readStored();

  if (existing) {
    if (fbclid && !existing.fbclid) {
      const updated: MarketingAttribution = { ...existing, fbclid };
      persistAttribution(updated);
      const capturedAtMs =
        updated.capturedAt ?
          new Date(updated.capturedAt).getTime()
        : Date.now();
      writeMetaFbcCookie(fbclid, capturedAtMs);
      return updated;
    }
    const fromCookie = mergeFbclidFromCookie(existing);
    if (fromCookie.fbclid && !existing.fbclid) {
      persistAttribution(fromCookie);
    }
    if (fromCookie.fbclid) {
      const capturedAtMs =
        fromCookie.capturedAt ?
          new Date(fromCookie.capturedAt).getTime()
        : undefined;
      writeMetaFbcCookie(fromCookie.fbclid, capturedAtMs);
    }
    return fromCookie;
  }

  let payload: MarketingAttribution = {
    utmSource: trim(params.get("utm_source"), 120),
    utmMedium: trim(params.get("utm_medium"), 120),
    utmCampaign: trim(params.get("utm_campaign"), 200),
    utmContent: trim(params.get("utm_content"), 200),
    utmTerm: trim(params.get("utm_term"), 200),
    fbclid,
    landingPath: window.location.pathname.slice(0, 200),
    capturedAt: new Date().toISOString(),
  };

  payload = mergeFbclidFromCookie(payload);

  const hasSignal = Boolean(
    payload.utmSource ||
    payload.utmMedium ||
    payload.utmCampaign ||
    payload.utmContent ||
    payload.utmTerm ||
    payload.fbclid,
  );
  if (!hasSignal) return null;

  persistAttribution(payload);

  if (payload.fbclid) {
    const capturedAtMs =
      payload.capturedAt ? new Date(payload.capturedAt).getTime() : Date.now();
    writeMetaFbcCookie(payload.fbclid, capturedAtMs);
  }

  return payload;
}

export function getStoredMarketingAttribution(): MarketingAttribution | null {
  const stored = readStored();
  if (!stored) return null;
  const merged = mergeFbclidFromCookie(stored);
  if (merged.fbclid && !stored.fbclid) {
    persistAttribution(merged);
  }
  if (merged.fbclid) {
    const capturedAtMs =
      merged.capturedAt ? new Date(merged.capturedAt).getTime() : undefined;
    writeMetaFbcCookie(merged.fbclid, capturedAtMs);
  }
  return merged;
}

/** Payload for checkout API - omits empty fields. */
export function getMarketingAttributionForCheckout():
  | MarketingAttribution
  | undefined {
  captureMarketingAttributionFromUrl();
  const stored = getStoredMarketingAttribution();
  if (!stored) return undefined;
  const { capturedAt, landingPath, ...rest } = stored;
  const hasValue = Object.values(rest).some(Boolean);
  if (!hasValue) return undefined;
  return {
    ...rest,
    ...(landingPath ? { landingPath } : {}),
    ...(capturedAt ? { capturedAt } : {}),
  };
}

export function formatMarketingAttributionSummary(
  attribution?: MarketingAttribution | null,
): string | null {
  if (!attribution) return null;
  const parts = [
    attribution.utmSource,
    attribution.utmCampaign,
    attribution.utmContent,
  ].filter(Boolean);
  if (parts.length) return parts.join(" · ");
  if (attribution.fbclid) return "Meta ad (fbclid)";
  if (attribution.utmMedium) return attribution.utmMedium;
  return null;
}
