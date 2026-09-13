import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/siteUrl";
import { getBuildSafeApiBase } from "@/lib/buildApiBase";
import { fetchAllMerchantFeedProducts } from "@/lib/merchantFeedProducts";

export const revalidate = 3600;

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
      const res = await fetch(`${apiUrl}/feeds/products-rss.xml`, {
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
      // Fallback
    }
  }

  // Fallback RSS 2.0 generation for products
  try {
    const products = await fetchAllMerchantFeedProducts();

    let itemsXml = "";
    for (const p of products) {
      let link = "";
      if (p.isPremium && p.premiumSlug) {
        link = `${siteUrl}/premium/${encodeURIComponent(p.premiumSlug)}`;
      } else if (p.slug) {
        link = `${siteUrl}/shop/${encodeURIComponent(p.slug)}`;
      } else {
        continue;
      }

      let imageLink =
        p.isPremium && p.premiumHeroImage?.url ?
          p.premiumHeroImage.url
        : p.images?.[0]?.url || "";

      if (imageLink && imageLink.startsWith("/")) {
        imageLink = `${siteUrl}${imageLink}`;
      }
      if (!imageLink) continue;

      const rawTitle = p.name || "Saree Product";
      const titleText = p.isPremium && p.premiumSubtitle ? `${rawTitle} — ${p.premiumSubtitle}` : rawTitle;
      const title = escapeXml(titleText);

      let rawDesc = stripHtml(p.seoDescription || p.shortDescription || p.description || p.name || "");
      if (p.isPremium) {
        const extra: string[] = [];
        if (p.craftNote) extra.push(`Craft Note: ${p.craftNote}`);
        if (p.weaveHours) extra.push(`Artisan Weave Time: ${p.weaveHours} Hours`);
        if (extra.length > 0) rawDesc = `${extra.join(" | ")}. ${rawDesc}`;
      }

      const priceVal = Number(p.price || 0);
      const formattedPrice = `₹${priceVal.toLocaleString("en-IN")} INR`;
      const description = escapeXml(`${rawDesc.slice(0, 400)} — Price: ${formattedPrice}`);
      const audienceTag = String(p.audience || "women").toLowerCase();

      const catParts: string[] = [];
      if (p.isPremium) catParts.push("Premium Edit");
      if (p.category) catParts.push(p.category);
      if (p.subcategory) catParts.push(p.subcategory);
      if (p.fabric) catParts.push(p.fabric);
      catParts.push(`Audience: ${audienceTag}`);
      const category = escapeXml(catParts.join(" | "));

      itemsXml += `    <item>
      <title>${title}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <description>${description}</description>
      <content:encoded><![CDATA[<h3>${escapeXml(titleText)}</h3><p>${escapeXml(rawDesc)}</p><p><strong>Price:</strong> ${formattedPrice}</p>]]></content:encoded>
      <media:content url="${escapeXml(imageLink)}" medium="image" />
      <enclosure url="${escapeXml(imageLink)}" type="image/jpeg" length="0" />
      <dc:creator>The House of Rani</dc:creator>
      <category>${category}</category>
    </item>\n`;
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The House of Rani - New Products &amp; Premium Arrivals</title>
    <link>${escapeXml(siteUrl)}/shop/collections</link>
    <description>Latest ethnic wear launches, hand painted sarees, pure silk collections, and new arrivals from The House of Rani.</description>
    <language>en-in</language>
    <atom:link href="${escapeXml(siteUrl)}/feeds/products-rss.xml" rel="self" type="application/rss+xml" />
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
    console.error("Products RSS feed generation error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
