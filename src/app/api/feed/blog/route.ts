import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/siteUrl";
import { fetchAllBlogFeedPosts } from "@/lib/blogFeedData";
import { blogMetaDescription, blogOgImageUrl } from "@/lib/blogSeo";
import { plainBlogExcerpt } from "@/lib/blogServer";

export const revalidate = 3600;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc822(dateStr: string): string {
  try {
    return new Date(dateStr).toUTCString();
  } catch {
    return new Date().toUTCString();
  }
}

export async function GET() {
  const siteUrl = getSiteUrl();

  try {
    const posts = await fetchAllBlogFeedPosts();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>The House of Rani Journal</title>
    <link>${siteUrl}/blog</link>
    <description>Saree styling, bridal inspiration, gifting ideas, and stories from The House of Rani.</description>
    <language>en-in</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/api/feed/blog" rel="self" type="application/rss+xml" />`;

    for (const post of posts) {
      if (!post.slug || !post.title) continue;

      const link = `${siteUrl}/blog/${encodeURIComponent(post.slug)}`;
      const description = escapeXml(blogMetaDescription(post));
      const image = blogOgImageUrl(post);
      const authorName = escapeXml(post.author?.name || "The House of Rani");
      const pubDate = toRfc822(post.updatedAt || post.createdAt);

      xml += `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${authorName}</author>
      <description>${description}</description>
      <content:encoded><![CDATA[${post.content || plainBlogExcerpt(post.content, 500)}]]></content:encoded>
      ${image ? `<enclosure url="${escapeXml(image)}" type="image/jpeg" />` : ""}
      ${post.category ? `<category>${escapeXml(post.category)}</category>` : ""}
    </item>`;
    }

    xml += `
  </channel>
</rss>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800",
      },
    });
  } catch (error) {
    console.error("Blog RSS feed error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
