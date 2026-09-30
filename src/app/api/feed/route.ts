import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/siteUrl";
import {
  fetchAllMerchantFeedProducts,
  merchantAdditionalImageUrls,
  merchantCatalogAgeGroup,
  merchantCatalogGender,
  merchantProductStorefrontUrl,
  merchantProductTypeLabel,
  merchantVariantImageUrl,
  truncateFeedText,
  type MerchantFeedProduct,
} from "@/lib/merchantFeedProducts";
import {
  getMetaCatalogItemId,
  getMetaItemGroupId,
} from "@/lib/metaCatalogId";

export const revalidate = 3600;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function productDescription(p: MerchantFeedProduct): string {
  let raw =
    p.seoDescription ||
    p.shortDescription ||
    p.description ||
    p.name ||
    "";
  if (p.isPremium) {
    const extra: string[] = [];
    if (p.craftNote) extra.push(`Craft Note: ${p.craftNote}`);
    if (p.weaveHours)
      extra.push(`Artisan Weave Time: ${p.weaveHours} Hours`);
    if (extra.length > 0) raw = `${extra.join(" | ")} - ${raw}`;
  }
  return escapeXml(
    truncateFeedText(raw.replace(/<[^>]*>?/gm, ""), 4990),
  );
}

function variantTitle(
  p: MerchantFeedProduct,
  variant: NonNullable<MerchantFeedProduct["variants"]>[number],
): string {
  const titleBase = p.name || "Product";
  const titleSuffix =
    p.isPremium && p.premiumSubtitle ?
      `${titleBase} - ${p.premiumSubtitle}`
    : titleBase;
  return truncateFeedText(
    `${titleSuffix} - ${variant.color || "Multicolor"} - ${variant.size || "Free Size"}`,
    200,
  );
}

function appendFeedItem(
  xmlParts: string[],
  p: MerchantFeedProduct,
  siteUrl: string,
  variant: NonNullable<MerchantFeedProduct["variants"]>[number],
) {
  const link =
    merchantProductStorefrontUrl(p, siteUrl, variant.color) ||
    merchantProductStorefrontUrl(p, siteUrl);
  if (!link) return;

  const itemId = getMetaCatalogItemId(String(p._id), variant);
  const itemGroupId = getMetaItemGroupId(String(p._id));
  const itemAvailability =
    (variant.stock || 0) > 0 ? "in stock" : "out of stock";
  const price = variant.price || p.price || 0;
  const comparePrice = variant.comparePrice || p.comparePrice || price;
  const mainImage = merchantVariantImageUrl(p, variant.color, siteUrl);
  const additional = merchantAdditionalImageUrls(
    p,
    variant.color,
    siteUrl,
    mainImage,
  );
  const gender = merchantCatalogGender(p.audience);
  const ageGroup = merchantCatalogAgeGroup(p.audience);
  const productType = merchantProductTypeLabel(p);

  let itemXml = `
    <item>
      <g:id>${escapeXml(String(itemId))}</g:id>
      <g:item_group_id>${escapeXml(itemGroupId)}</g:item_group_id>
      <g:title>${escapeXml(variantTitle(p, variant))}</g:title>
      <g:description>${productDescription(p)}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(mainImage)}</g:image_link>`;

  for (const addImg of additional) {
    itemXml += `\n      <g:additional_image_link>${escapeXml(addImg)}</g:additional_image_link>`;
  }

  itemXml += `
      <g:brand>The House of Rani</g:brand>
      <g:condition>new</g:condition>
      <g:availability>${itemAvailability}</g:availability>
      <g:price>${comparePrice.toFixed(2)} INR</g:price>
      ${comparePrice > price ? `<g:sale_price>${price.toFixed(2)} INR</g:sale_price>` : ""}
      <g:identifier_exists>false</g:identifier_exists>
      <g:color>${escapeXml(variant.color || "Multicolor")}</g:color>
      <g:size>${escapeXml(variant.size || "Free Size")}</g:size>
      <g:gender>${gender}</g:gender>
      <g:age_group>${ageGroup}</g:age_group>
      <g:google_product_category>2271</g:google_product_category>
      <g:product_type>${escapeXml(productType)}</g:product_type>
      <g:custom_label_0>${escapeXml(p.isPremium ? "Premium Edit" : p.category || "")}</g:custom_label_0>
      <g:custom_label_1>${escapeXml(p.fabric || "")}</g:custom_label_1>
      <g:custom_label_2>${escapeXml(String(p.audience || "women"))}</g:custom_label_2>
    </item>`;

  xmlParts.push(itemXml);
}

function appendFallbackFeedItem(
  xmlParts: string[],
  p: MerchantFeedProduct,
  siteUrl: string,
) {
  const link = merchantProductStorefrontUrl(p, siteUrl);
  if (!link) return;

  const itemId = getMetaCatalogItemId(String(p._id), null);
  const price = p.price || 0;
  const comparePrice = p.comparePrice || price;
  const totalStock = (p.variants || []).reduce(
    (sum, variant) => sum + (variant.stock || 0),
    0,
  );
  const mainImage = merchantVariantImageUrl(p, undefined, siteUrl);
  const gender = merchantCatalogGender(p.audience);
  const ageGroup = merchantCatalogAgeGroup(p.audience);

  xmlParts.push(`
    <item>
      <g:id>${escapeXml(String(itemId))}</g:id>
      <g:item_group_id>${escapeXml(getMetaItemGroupId(String(p._id)))}</g:item_group_id>
      <g:title>${escapeXml(truncateFeedText(p.name || "Product", 200))}</g:title>
      <g:description>${productDescription(p)}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(mainImage)}</g:image_link>
      <g:brand>The House of Rani</g:brand>
      <g:condition>new</g:condition>
      <g:availability>${totalStock > 0 ? "in stock" : "out of stock"}</g:availability>
      <g:price>${comparePrice.toFixed(2)} INR</g:price>
      ${comparePrice > price ? `<g:sale_price>${price.toFixed(2)} INR</g:sale_price>` : ""}
      <g:identifier_exists>false</g:identifier_exists>
      <g:gender>${gender}</g:gender>
      <g:age_group>${ageGroup}</g:age_group>
      <g:google_product_category>2271</g:google_product_category>
      <g:product_type>${escapeXml(merchantProductTypeLabel(p))}</g:product_type>
      <g:custom_label_0>${escapeXml(p.isPremium ? "Premium Edit" : p.category || "")}</g:custom_label_0>
      <g:custom_label_1>${escapeXml(p.fabric || "")}</g:custom_label_1>
    </item>`);
}

export async function GET() {
  const siteUrl = getSiteUrl();

  try {
    const products = await fetchAllMerchantFeedProducts();
    const itemXml: string[] = [];

    for (const p of products) {
      if (p.variants?.length) {
        for (const v of p.variants) {
          appendFeedItem(itemXml, p, siteUrl, v);
        }
      } else {
        appendFallbackFeedItem(itemXml, p, siteUrl);
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" xmlns:atom="http://www.w3.org/2005/Atom" version="2.0">
  <channel>
    <title>The House of Rani - Meta &amp; Google Product Catalog</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>Variant-level catalog for Meta Commerce, Advantage+ catalog ads, and Google Merchant Center</description>
    <atom:link href="${escapeXml(siteUrl)}/api/feed" rel="self" type="application/rss+xml" />${itemXml.join("")}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800",
      },
    });
  } catch (error) {
    console.error("Feed generation error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
