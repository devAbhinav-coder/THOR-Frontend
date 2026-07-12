import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/siteUrl";
import { fetchAllMerchantFeedProducts } from "@/lib/merchantFeedProducts";
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

export async function GET() {
  const siteUrl = getSiteUrl();

  try {
    const products = await fetchAllMerchantFeedProducts();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>The House of Rani</title>
    <link>${siteUrl}</link>
    <description>Premium Indian Ethnic Wear, Salwar Suits, Sarees &amp; Gifting</description>`;

    for (const p of products) {
      if (!p.variants || p.variants.length === 0) continue;

      const link = `${siteUrl}/shop/${p.slug}`;
      let imageLink = p.images?.[0]?.url || "";
      if (imageLink && imageLink.startsWith("/")) {
        imageLink = `${siteUrl}${imageLink}`;
      }
      const condition = "new";
      const brand = "The House of Rani";

      const desc = escapeXml(
        (p.seoDescription || p.shortDescription || p.description || p.name || "")
          .replace(/<[^>]*>?/gm, ""),
      );

      for (const v of p.variants) {
        const itemId = getMetaCatalogItemId(String(p._id), v);
        const itemGroupId = getMetaItemGroupId(String(p._id));
        const itemAvailability = (v.stock || 0) > 0 ? "in stock" : "out of stock";
        const price = v.price || p.price || 0;
        const comparePrice = v.comparePrice || p.comparePrice || price;
        const color = escapeXml(v.color || "Multicolor");
        const size = escapeXml(v.size || "Free Size");

        xml += `
    <item>
      <g:id>${escapeXml(String(itemId))}</g:id>
      <g:item_group_id>${escapeXml(itemGroupId)}</g:item_group_id>
      <g:title>${escapeXml(`${p.name || ""} - ${v.color || "Multicolor"} - ${v.size || "Free Size"}`)}</g:title>
      <g:description>${desc}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${escapeXml(imageLink)}</g:image_link>
      <g:brand>${brand}</g:brand>
      <g:condition>${condition}</g:condition>
      <g:availability>${itemAvailability}</g:availability>
      <g:price>${comparePrice.toFixed(2)} INR</g:price>
      ${comparePrice > price ? `<g:sale_price>${price.toFixed(2)} INR</g:sale_price>` : ""}
      <g:color>${color}</g:color>
      <g:size>${size}</g:size>
      <g:google_product_category>2271</g:google_product_category>
      <g:custom_label_0>${escapeXml(p.category || "")}</g:custom_label_0>
      <g:custom_label_1>${escapeXml(p.fabric || "")}</g:custom_label_1>
    </item>`;
      }
    }

    xml += `
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
