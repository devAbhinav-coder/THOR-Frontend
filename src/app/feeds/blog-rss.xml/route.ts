import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/siteUrl";
import { getBuildSafeApiBase } from "@/lib/buildApiBase";
import { fetchAllBlogFeedPosts } from "@/lib/blogFeedData";
import { blogMetaDescription, blogOgImageUrl } from "@/lib/blogSeo";
import { plainBlogExcerpt } from "@/lib/blogServer";

export const revalidate = 3600;

function escapeXml(value: string): string {
  return (value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc822(dateStr?: string): string {
  try {
    return dateStr ? new Date(dateStr).toUTCString() : new Date().toUTCString();
  } catch {
    return new Date().toUTCString();
  }
}

export async function GET() {
  const siteUrl = getSiteUrl();
  const apiUrl = await getBuildSafeApiBase();

  // Try fetching directly from Express backend
  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl}/feeds/blog-rss.xml`, {
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
      // Fallback if backend API call fails
    }
  }

  // Fallback RSS 2.0 generation
  try {
    const posts = await fetchAllBlogFeedPosts();

    let itemsXml = "";
    for (const post of posts) {
      if (!post.slug || !post.title) continue;

      const link = `${siteUrl}/blog/${encodeURIComponent(post.slug)}`;
      const description = escapeXml(blogMetaDescription(post));
      const image = blogOgImageUrl(post);
      const pubDate = toRfc822(post.updatedAt || post.createdAt);
      const category = escapeXml(post.category || "saree-styling");

      itemsXml += `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
      <content:encoded><![CDATA[${post.content || plainBlogExcerpt(post.content, 500)}]]></content:encoded>
      ${image ? `<media:content url="${escapeXml(image)}" medium="image" />\n      <enclosure url="${escapeXml(image)}" type="image/jpeg" length="0" />` : ""}
      <dc:creator>The House of Rani</dc:creator>
      <category>${category}</category>
    </item>\n`;
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The House of Rani - Journal &amp; Stories</title>
    <link>${escapeXml(siteUrl)}/blog</link>
    <description>Discover ethnic wear styling guides, heritage saree stories, and fashion insights from The House of Rani.</description>
    <language>en-in</language>
    <atom:link href="${escapeXml(siteUrl)}/feeds/blog-rss.xml" rel="self" type="application/rss+xml" />
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
    console.error("Blog RSS feed generation error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
