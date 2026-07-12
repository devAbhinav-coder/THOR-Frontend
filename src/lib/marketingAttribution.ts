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

function trim(value: string | null | undefined, max: number): string | undefined {
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

/** First-touch: store UTM / fbclid from the landing URL (30-day window). */
export function captureMarketingAttributionFromUrl(): MarketingAttribution | null {
  if (typeof window === "undefined") return null;

  const existing = readStored();
  if (existing) return existing;

  const params = new URLSearchParams(window.location.search);
  const payload: MarketingAttribution = {
    utmSource: trim(params.get("utm_source"), 120),
    utmMedium: trim(params.get("utm_medium"), 120),
    utmCampaign: trim(params.get("utm_campaign"), 200),
    utmContent: trim(params.get("utm_content"), 200),
    utmTerm: trim(params.get("utm_term"), 200),
    fbclid: trim(params.get("fbclid"), 200),
    landingPath: window.location.pathname.slice(0, 200),
    capturedAt: new Date().toISOString(),
  };

  const hasSignal = Boolean(
    payload.utmSource ||
      payload.utmMedium ||
      payload.utmCampaign ||
      payload.utmContent ||
      payload.utmTerm ||
      payload.fbclid,
  );
  if (!hasSignal) return null;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* private mode */
  }
  return payload;
}

export function getStoredMarketingAttribution(): MarketingAttribution | null {
  return readStored();
}

/** Payload for checkout API — omits empty fields. */
export function getMarketingAttributionForCheckout():
  | MarketingAttribution
  | undefined {
  const stored = readStored();
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
