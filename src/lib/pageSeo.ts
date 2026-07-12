import type { Metadata } from "next";
import { BRAND_NAME } from "@/lib/brandSeo";

export type ProductSeoContext = {
  category?: string | null;
  subcategory?: string | null;
  fabric?: string | null;
  price?: number | null;
};

/** Root layout uses `template: "%s | The House of Rani"` — use absolute when the full SERP title is intentional. */
export function absolutePageTitle(title: string): Metadata["title"] {
  return { absolute: title };
}

/** Segment only — Next.js appends `| The House of Rani` via root metadata template. */
export function templatedPageTitle(segment: string): string {
  return segment.trim();
}

export function resolveAdminSeoTitle(
  customTitle: string | null | undefined,
  fallbackSegment: string,
): Metadata["title"] {
  const custom = customTitle?.trim();
  if (custom) {
    return custom.includes(BRAND_NAME) ?
        absolutePageTitle(custom)
      : templatedPageTitle(custom);
  }
  return templatedPageTitle(fallbackSegment);
}

/** Plain string for Open Graph / Twitter when metadata.title may be absolute. */
export function resolveSerpTitleString(
  title: Metadata["title"],
  fallbackSegment?: string,
): string {
  if (typeof title === "string") {
    return title.includes(BRAND_NAME) ? title : `${title} | ${BRAND_NAME}`;
  }
  if (
    title &&
    typeof title === "object" &&
    "absolute" in title &&
    typeof title.absolute === "string"
  ) {
    return title.absolute;
  }
  if (fallbackSegment?.trim()) {
    const segment = fallbackSegment.trim();
    return segment.includes(BRAND_NAME) ?
        segment
      : `${segment} | ${BRAND_NAME}`;
  }
  return BRAND_NAME;
}

function formatInr(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

function productAttributeHint(context?: ProductSeoContext): string {
  const parts = [context?.fabric, context?.subcategory, context?.category]
    .map((v) => v?.trim())
    .filter(Boolean) as string[];
  return parts.length ? ` — ${parts.join(" · ")}` : "";
}

export function buildProductPageTitle(
  productName: string,
  seoTitle?: string | null,
  context?: ProductSeoContext,
): Metadata["title"] {
  const custom = seoTitle?.trim();
  if (custom) {
    return custom.includes(BRAND_NAME) ?
        absolutePageTitle(custom)
      : templatedPageTitle(custom);
  }
  const name = productName.trim();
  const hint = productAttributeHint(context);
  return templatedPageTitle(`Buy ${name}${hint} Online in India`);
}

export function buildProductMetaDescription(
  seoDescription?: string | null,
  shortDescription?: string | null,
  description?: string | null,
  context?: ProductSeoContext & { name?: string | null },
): string {
  const custom = seoDescription?.trim();
  if (custom) return custom.slice(0, 160);

  const short = shortDescription?.trim();
  if (short && short.length >= 50) return short.slice(0, 160);

  const stripped = String(description || "")
    .replace(/<[^>]*>?/gm, "")
    .trim();
  if (stripped.length >= 50) return stripped.slice(0, 160);

  const name = context?.name?.trim() || "this style";
  const attrs = [context?.fabric, context?.subcategory, context?.category]
    .map((v) => v?.trim())
    .filter(Boolean) as string[];
  const priceBit =
    typeof context?.price === "number" && context.price > 0 ?
      ` from ${formatInr(context.price)}`
    : "";
  const attrBit = attrs.length ? ` — ${attrs.join(" · ")}` : "";

  return `Shop ${name}${attrBit}${priceBit} at The House of Rani. Premium Indian ethnic wear with free delivery over ₹1,099 and 7-day returns across India.`.slice(
    0,
    160,
  );
}
