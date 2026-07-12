import {
  parseSearchQueryIntent,
  type ParsedSearchIntent,
} from "./searchQueryParser";

export type StoreSearchScope = "shop" | "gifting";

const EMPTY_HREF: Record<StoreSearchScope, string> = {
  shop: "/shop",
  gifting: "/gifting",
};

function appendPriceParams(
  params: URLSearchParams,
  intent: ParsedSearchIntent,
): void {
  if (intent.maxPrice !== undefined) {
    params.set("maxPrice", String(intent.maxPrice));
  }
  if (intent.minPrice !== undefined) {
    params.set("minPrice", String(intent.minPrice));
  }
}

/** Builds `/shop?search=` or `/gifting?search=` with smart price params when parsed. */
export function buildStoreSearchHref(
  scope: StoreSearchScope,
  query: string,
  maxLen: number,
): string {
  const q = query.trim().slice(0, maxLen);
  if (!q.length) return EMPTY_HREF[scope];
  const intent = parseSearchQueryIntent(q);
  const params = new URLSearchParams();
  params.set("search", q);
  appendPriceParams(params, intent);
  const qs = params.toString();
  return scope === "gifting" ? `/gifting?${qs}` : `/shop?${qs}`;
}
