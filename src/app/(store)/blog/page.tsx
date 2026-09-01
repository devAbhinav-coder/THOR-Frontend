import BlogListingClient from "@/components/blog/BlogListingClient";
import { fetchAllBlogFeedPosts } from "@/lib/blogFeedData";
import { fetchBlogsListingServer, plainBlogExcerpt } from "@/lib/blogServer";
import {
  blogListingBreadcrumbJsonLd,
  blogListingJsonLd,
} from "@/lib/blogSeo";
import { getSiteUrl } from "@/lib/siteUrl";

const SITE_URL = getSiteUrl();

export default async function BlogListingPage() {
  const [listing, allPosts] = await Promise.all([
    fetchBlogsListingServer(1, 8),
    fetchAllBlogFeedPosts(),
  ]);
  const blogs = listing?.blogs ?? [];
  const itemListPosts = allPosts.length > 0 ? allPosts : blogs;

  const blogListingLd = blogListingJsonLd(SITE_URL);
  const breadcrumbLd = blogListingBreadcrumbJsonLd(SITE_URL);

  const itemListLd =
    itemListPosts.length > 0 ?
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "@id": `${SITE_URL}/blog#itemlist`,
        name: "The House of Rani Journal — Latest Stories",
        url: `${SITE_URL}/blog`,
        numberOfItems: itemListPosts.length,
        itemListElement: itemListPosts.map((b, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          url: `${SITE_URL}/blog/${encodeURIComponent(b.slug)}`,
          name: b.title,
          description: b.excerpt || plainBlogExcerpt(b.content, 160),
        })),
      }
    : null;

  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListingLd) }}
      />
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {itemListLd && (
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
        />
      )}
      <BlogListingClient
        initialBlogs={blogs}
        initialPagination={listing?.pagination ?? null}
      />
    </>
  );
}
