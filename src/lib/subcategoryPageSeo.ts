import type { Metadata } from "next";
import { templatedPageTitle } from "@/lib/pageSeo";
import { BRAND_NAME } from "@/lib/brandSeo";

export function buildSubcategoryPageTitle(
  subcategoryName: string,
  categoryName: string,
  metaTitle?: string | null,
): Metadata["title"] {
  const custom = metaTitle?.trim();
  if (custom) {
    return custom.includes(BRAND_NAME) ?
        { absolute: custom }
      : templatedPageTitle(custom);
  }
  return templatedPageTitle(
    `${subcategoryName} ${categoryName} — Shop Online India`,
  );
}

export function buildSubcategoryMetaDescription(
  subcategoryName: string,
  categoryName: string,
  metaDescription?: string | null,
): string {
  const custom = metaDescription?.trim();
  if (custom) return custom.slice(0, 160);
  return `Browse ${subcategoryName} ${categoryName} at The House of Rani — premium Indian ethnic wear, free delivery over ₹1,099, secure checkout, and 5-day returns across India.`.slice(
    0,
    160,
  );
}
