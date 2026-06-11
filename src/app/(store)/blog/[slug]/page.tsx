import { notFound } from "next/navigation";
import BlogDetailClient from "@/components/blog/BlogDetailClient";
import { fetchBlogBySlugServer, plainBlogExcerpt } from "@/lib/blogServer";
import { getSiteUrl } from "@/lib/siteUrl";

const SITE_URL = getSiteUrl();

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;
  const data = await fetchBlogBySlugServer(slug);
  if (!data?.blog) notFound();

  const postUrl = `${SITE_URL}/blog/${encodeURIComponent(data.blog.slug)}`;
  const plainWords = plainBlogExcerpt(data.blog.content, 50000)
    .split(/\s+/)
    .filter(Boolean).length;

  const relatedProducts = (data.blog.relatedProductIds || []).filter(
    (p): p is { _id: string; name: string; slug: string } =>
      typeof p === "object" && p !== null && "slug" in p && Boolean(p.slug),
  );

  const blogPostingLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${postUrl}#article`,
    headline: data.blog.seoTitle || data.blog.title,
    description:
      data.blog.seoDescription ||
      data.blog.excerpt ||
      plainBlogExcerpt(data.blog.content, 180),
    image: (data.blog.images || []).map((img) => img.url).filter(Boolean),
    datePublished: data.blog.createdAt,
    dateModified: data.blog.updatedAt || data.blog.createdAt,
    author: {
      "@type": "Person",
      name: data.blog.author?.name || "The House of Rani",
    },
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "The House of Rani",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logoNew.png`,
      },
    },
    mainEntityOfPage: postUrl,
    url: postUrl,
    keywords: [...(data.blog.keywords || []), ...(data.blog.tags || [])].join(", "),
    articleSection: data.blog.category || "Journal",
    wordCount: plainWords,
    inLanguage: "en-IN",
    ...(relatedProducts.length > 0 ?
      {
        about: relatedProducts.slice(0, 4).map((p) => ({
          "@type": "Product",
          name: p.name,
          url: `${SITE_URL}/shop/${encodeURIComponent(p.slug)}`,
        })),
      }
    : {}),
  };

  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingLd) }}
      />
      <BlogDetailClient slug={slug} initialData={data} />
    </>
  );
}
