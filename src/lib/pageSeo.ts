import type { Metadata } from "next";
import { BRAND_NAME } from "@/lib/brandSeo";

/** Root layout uses `template: "%s | The House of Rani"` — use absolute when the full SERP title is intentional. */
export function absolutePageTitle(title: string): Metadata["title"] {
  return { absolute: title };
}

/** Segment only — Next.js appends `| The House of Rani` via root metadata template. */
export function templatedPageTitle(segment: string): string {
  return segment.trim();
}

export function buildProductPageTitle(
  productName: string,
  seoTitle?: string | null,
): Metadata["title"] {
  const custom = seoTitle?.trim();
  if (custom) {
    return custom.includes(BRAND_NAME) ?
        absolutePageTitle(custom)
      : templatedPageTitle(custom);
  }
  return templatedPageTitle(`Buy ${productName.trim()} Online in India`);
}

export function buildProductMetaDescription(
  seoDescription?: string | null,
  shortDescription?: string | null,
  description?: string | null,
): string {
  const custom = seoDescription?.trim();
  if (custom) return custom.slice(0, 160);
  const short = shortDescription?.trim();
  if (short) return short.slice(0, 160);
  return String(description || "")
    .replace(/<[^>]*>?/gm, "")
    .trim()
    .slice(0, 160);
}
