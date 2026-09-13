import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/siteUrl";
import { getBuildSafeApiBase } from "@/lib/buildApiBase";
import { fetchAllMerchantFeedProducts } from "@/lib/merchantFeedProducts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function escapeXml(value: string): string {
  return (value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET() {
  const siteUrl = getSiteUrl();
  const apiUrl = await getBuildSafeApiBase();

  // Try fetching directly from backend Express feed controller
  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl}/feeds/pinterest-catalog.xml`, {
        next: { revalidate: 3600 },
      });
      if (res.ok) {
        const xmlText = await res.text();
        return new NextResponse(xmlText, {
          status: 200,
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        });
      }
    } catch {
      // Fallback to local XML generation if backend fetch fails
    }
  }

  // Fallback generation logic for static build or offline backend
  try {
    const products = await fetchAllMerchantFeedProducts();

    let itemsXml = "";
    for (const p of products) {
      let link = "";
      if (p.isPremium && p.premiumSlug) {
        link = `${siteUrl}/premium/${encodeURIComponent(p.premiumSlug)}`;
      } else if (p.slug) {
        link = `${siteUrl}/shop/${encodeURIComponent(p.slug)}`;
      } else if (p._id) {
        link = `${siteUrl}/shop/${encodeURIComponent(String(p._id))}`;
      } else {
        continue;
      }

      let rawImg = p.isPremium && p.premiumHeroImage?.url ? p.premiumHeroImage.url : p.images?.[0]?.url || "";
      if (typeof rawImg === "object" && rawImg !== null && "url" in rawImg) {
        rawImg = String((rawImg as { url?: string }).url || "");
      }
      let imageLink = String(rawImg || "").trim();

      if (imageLink && imageLink.startsWith("/")) {
        imageLink = `${siteUrl}${imageLink}`;
      }
      if (!imageLink) {
        imageLink = `${siteUrl}/images/hero-bg.jpg`;
      }

      const rawTitle = p.name || "Saree Product";
      const titleText = p.isPremium && p.premiumSubtitle ? `${rawTitle} — ${p.premiumSubtitle}` : rawTitle;
      const title = escapeXml(titleText);

      let rawDesc = p.seoDescription || p.shortDescription || p.description || p.name || "";
      if (p.isPremium) {
        const extra: string[] = [];
        if (p.craftNote) extra.push(`Craft Note: ${p.craftNote}`);
        if (p.weaveHours) extra.push(`Artisan Weave Time: ${p.weaveHours} Hours`);
        if (extra.length > 0) rawDesc = `${extra.join(" | ")} — ${rawDesc}`;
      }

      const desc = escapeXml(stripHtml(rawDesc).slice(0, 4900));
      const priceVal = Number(p.price || 0);
      const compareVal = p.comparePrice && Number(p.comparePrice) > priceVal ? Number(p.comparePrice) : null;
      const availability = "in stock";
      const audienceTag = String(p.audience || "women").toLowerCase();
      const customLabel0 = p.isPremium ? "Premium Edit" : "Regular Storefront";
      const customLabel1 = p.category || "Shop";
      const customLabel2 = audienceTag;
      const customLabel3 = p.weaveHours ? `${p.weaveHours} Hrs Weave` : "In Stock";
      const customLabel4 = compareVal ? "On Sale" : "Full Price";
      const productType = p.isPremium
        ? `Premium Edit > ${audienceTag.toUpperCase()} > ${p.category || "Sarees"}`
        : `${audienceTag.toUpperCase()} > ${p.category || "Apparel"}${p.subcategory ? ` > ${p.subcategory}` : ""}`;

      itemsXml += `    <item>
      <g:id>${escapeXml(String(p._id))}</g:id>
      <g:title>${title}</g:title>
      <g:description>${desc}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(imageLink)}</g:image_link>
      <g:price>${(compareVal || priceVal).toFixed(2)} INR</g:price>
      ${compareVal ? `<g:sale_price>${priceVal.toFixed(2)} INR</g:sale_price>` : ""}
      <g:availability>${availability}</g:availability>
      <g:condition>new</g:condition>
      <g:brand>The House of Rani</g:brand>
      <g:google_product_category>Apparel &amp; Accessories &gt; Clothing</g:google_product_category>
      <g:product_type>${escapeXml(productType)}</g:product_type>
      <g:custom_label_0>${escapeXml(customLabel0)}</g:custom_label_0>
      <g:custom_label_1>${escapeXml(customLabel1)}</g:custom_label_1>
      <g:custom_label_2>${escapeXml(customLabel2)}</g:custom_label_2>
      <g:custom_label_3>${escapeXml(customLabel3)}</g:custom_label_3>
      <g:custom_label_4>${escapeXml(customLabel4)}</g:custom_label_4>
    </item>\n`;
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>The House of Rani - Pinterest Product Catalog</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>Official product catalog feed for Pinterest Shopping and Auto Pinning</description>
${itemsXml}  </channel>
</rss>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Pinterest catalog feed generation error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
