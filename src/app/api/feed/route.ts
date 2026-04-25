import { NextResponse } from "next/server";
import { getBuildSafeApiBase } from "@/lib/buildApiBase";
import { getSiteUrl } from "@/lib/siteUrl";

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  const apiUrl = await getBuildSafeApiBase();
  const siteUrl = getSiteUrl();

  if (!apiUrl) {
    return new NextResponse("API URL not configured", { status: 500 });
  }

  try {
    const res = await fetch(`${apiUrl}/products?limit=1000`, {
      next: { revalidate: 3600 },
    });
    
    if (!res.ok) {
      throw new Error("Failed to fetch products");
    }

    const { data } = await res.json();
    const products = data?.products || [];

    // Build the RSS 2.0 XML strictly following Meta/Google Merchant specs
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>The House of Rani</title>
    <link>${siteUrl}</link>
    <description>Premium Indian Ethnic Wear &amp; Gifting</description>`;

    for (const p of products) {
      if (!p.variants || p.variants.length === 0) continue;

      const link = `${siteUrl}/shop/${p.slug}`;
      let imageLink = p.images?.[0]?.url || "";
      if (imageLink && imageLink.startsWith("/")) {
        imageLink = `${siteUrl}${imageLink}`;
      }
      const condition = "new";
      
      // Calculate total stock
      const totalStock = p.variants.reduce((acc: number, v: any) => acc + (v.stock || 0), 0);
      const availability = totalStock > 0 ? "in stock" : "out of stock";
      const brand = "The House of Rani";
      
      // Clean up description (strip html and special chars)
      const desc = (p.seoDescription || p.shortDescription || p.description || p.name)
        .replace(/<[^>]*>?/gm, '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Output either item-level or variant-level depending on catalog strategy
      // Simplest robust method for Meta is one item per product, or one per variant
      for (const v of p.variants) {
        // Standard ID format: PRODUCTID_VARIANTID or SKU
        const itemId = v.sku || `${p._id}_${v._id || v.sku}`;
        const itemAvailability = v.stock > 0 ? "in stock" : "out of stock";
        const price = v.price || p.price || 0;
        const comparePrice = v.comparePrice || p.comparePrice || price;
        const color = (v.color || "Multicolor").replace(/&/g, '&amp;');
        const size = (v.size || "Free Size").replace(/&/g, '&amp;');

        xml += `
    <item>
      <g:id>${itemId}</g:id>
      <g:item_group_id>${p._id}</g:item_group_id>
      <g:title>${p.name.replace(/&/g, '&amp;')} - ${color} - ${size}</g:title>
      <g:description>${desc}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageLink}</g:image_link>
      <g:brand>${brand}</g:brand>
      <g:condition>${condition}</g:condition>
      <g:availability>${itemAvailability}</g:availability>
      <g:price>${comparePrice.toFixed(2)} INR</g:price>
      ${comparePrice > price ? `<g:sale_price>${price.toFixed(2)} INR</g:sale_price>` : ''}
      <g:color>${color}</g:color>
      <g:size>${size}</g:size>
      <g:google_product_category>2271</g:google_product_category>
      <g:custom_label_0>${p.category || ""}</g:custom_label_0>
      <g:custom_label_1>${p.fabric || ""}</g:custom_label_1>
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
