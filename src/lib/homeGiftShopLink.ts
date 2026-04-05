import type { HomeGiftShowcaseCard } from "@/types";

export function buildGiftingBrowsePath(args: {
  occasion?: string | null;
  productCategory?: string | null;
  search?: string | null;
}): string {
  const q = new URLSearchParams();
  const occ = args.occasion?.trim();
  const pc = args.productCategory?.trim();
  const s = args.search?.trim();
  if (occ && occ !== "all") q.set("occasion", occ);
  if (pc && pc !== "all") q.set("productCategory", pc);
  if (s) q.set("search", s);
  const qs = q.toString();
  return qs ? `/gifting?${qs}` : "/gifting";
}

export type ResolvedHomeGiftShop =
  | { kind: "link"; href: string; label: string }
  | { kind: "coming_soon"; label: string };

function normalizeInternalPath(path: string): string | null {
  let t = path.trim();
  if (!t) return null;
  if (!t.startsWith("/")) t = `/${t}`;
  if (/^https?:\/\//i.test(t)) return null;
  return t.slice(0, 280);
}

/** Resolves the homepage gifting card primary CTA (was “shop” link). */
export function resolveHomeGiftShopButton(
  card: HomeGiftShowcaseCard,
): ResolvedHomeGiftShop | null {
  const mode = card.shopLinkMode;
  const defaultBrowse = (card.shopButtonText || "").trim() || "Browse gifts";

  if (mode === "coming_soon") {
    return {
      kind: "coming_soon",
      label: (card.shopButtonText || "").trim() || "Coming soon",
    };
  }

  if (mode === "product") {
    const p = normalizeInternalPath(card.directProductPath || "");
    if (p) {
      return {
        kind: "link",
        href: p,
        label: (card.shopButtonText || "").trim() || "View product",
      };
    }
    return {
      kind: "link",
      href: "/gifting",
      label: defaultBrowse,
    };
  }

  if (mode === "gifting") {
    return {
      kind: "link",
      href: buildGiftingBrowsePath({
        occasion: card.giftingOccasion,
        productCategory: card.giftingProductCategory,
        search: card.giftingSearch,
      }),
      label: defaultBrowse,
    };
  }

  const legacy = (card.shopButtonLink || "").trim();
  if (legacy) {
    return { kind: "link", href: legacy, label: defaultBrowse };
  }

  return { kind: "link", href: "/gifting", label: defaultBrowse };
}
