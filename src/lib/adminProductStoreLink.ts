/** Admin analytics → live storefront PDP link (shop vs premium). */
export function adminProductStoreHref(product: {
  slug: string;
  premiumSlug?: string;
  isPremium?: boolean;
}): string {
  const premium = product.isPremium === true;
  const routeSlug = premium ? product.premiumSlug || product.slug : product.slug;
  return premium ?
      `/premium/${encodeURIComponent(routeSlug)}`
    : `/shop/${encodeURIComponent(product.slug)}`;
}
