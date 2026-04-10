export type StoreSearchScope = "shop" | "gifting";

const EMPTY_HREF: Record<StoreSearchScope, string> = {
  shop: "/shop",
  gifting: "/gifting",
};

/** Builds `/shop?search=` or `/gifting?search=` (or empty collection path when query is blank). */
export function buildStoreSearchHref(
  scope: StoreSearchScope,
  query: string,
  maxLen: number,
): string {
  const q = query.trim().slice(0, maxLen);
  if (!q.length) return EMPTY_HREF[scope];
  const enc = encodeURIComponent(q);
  return scope === "gifting" ? `/gifting?search=${enc}` : `/shop?search=${enc}`;
}
