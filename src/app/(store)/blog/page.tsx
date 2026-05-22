import BlogListingClient from "@/components/blog/BlogListingClient";
import { fetchBlogsListingServer, plainBlogExcerpt } from "@/lib/blogServer";
import { getSiteUrl } from "@/lib/siteUrl";

const SITE_URL = getSiteUrl();

export default async function BlogListingPage() {
  const listing = await fetchBlogsListingServer(1, 12);
  const blogs = listing?.blogs ?? [];

  const itemListLd =
    blogs.length > 0 ?
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "@id": `${SITE_URL}/blog#itemlist`,
        name: "The House of Rani Journal — Latest Stories",
        url: `${SITE_URL}/blog`,
        numberOfItems: blogs.length,
        itemListElement: blogs.map((b, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          url: `${SITE_URL}/blog/${encodeURIComponent(b.slug)}`,
          name: b.title,
          description: plainBlogExcerpt(b.content, 160),
        })),
      }
    : null;

  return (
    <>
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
