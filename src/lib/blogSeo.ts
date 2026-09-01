import type { Blog } from "@/types";
import { getCoverImage } from "@/lib/blogArticleCompose";
import { plainBlogExcerpt } from "@/lib/blogServer";
import { getSiteUrl } from "@/lib/siteUrl";

export function blogMetaDescription(blog: Blog): string {
  return (
    blog.seoDescription ||
    blog.excerpt ||
    plainBlogExcerpt(blog.content, 165) ||
    `Read ${blog.title} on The House of Rani Journal — saree styling and Indian ethnic wear inspiration.`
  ).slice(0, 165);
}

export function blogOgImageUrl(blog: Blog): string | undefined {
  const cover = getCoverImage(blog.images || []);
  if (cover?.url) return cover.url;
  return blog.images?.find((i) => i.url)?.url;
}

export function blogArticleImages(blog: Blog): string[] {
  return (blog.images || []).map((img) => img.url).filter(Boolean);
}

export function blogPostingJsonLd(blog: Blog, siteUrl = getSiteUrl()) {
  const postUrl = `${siteUrl}/blog/${encodeURIComponent(blog.slug)}`;
  const plainWords = plainBlogExcerpt(blog.content, 50000)
    .split(/\s+/)
    .filter(Boolean).length;

  const relatedProducts = (blog.relatedProductIds || []).filter(
    (p): p is { _id: string; name: string; slug: string } =>
      typeof p === "object" && p !== null && "slug" in p && Boolean(p.slug),
  );

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${postUrl}#article`,
    headline: blog.seoTitle || blog.title,
    description: blogMetaDescription(blog),
    image: blogArticleImages(blog),
    datePublished: blog.createdAt,
    dateModified: blog.updatedAt || blog.createdAt,
    author: {
      "@type": "Person",
      name: blog.author?.name || "The House of Rani",
      ...(blog.author?.avatar ? { image: blog.author.avatar } : {}),
    },
    publisher: {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "The House of Rani",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logoNew.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    url: postUrl,
    keywords: [...(blog.keywords || []), ...(blog.tags || [])].join(", "),
    articleSection: blog.category || "Journal",
    wordCount: plainWords,
    inLanguage: "en-IN",
    ...(relatedProducts.length > 0 ?
      {
        about: relatedProducts.slice(0, 4).map((p) => ({
          "@type": "Product",
          name: p.name,
          url: `${siteUrl}/shop/${encodeURIComponent(p.slug)}`,
        })),
      }
    : {}),
  };
}

export function blogDetailBreadcrumbJsonLd(blog: Blog, siteUrl = getSiteUrl()) {
  const postUrl = `${siteUrl}/blog/${encodeURIComponent(blog.slug)}`;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
      { "@type": "ListItem", position: 2, name: "Journal", item: `${siteUrl}/blog` },
      {
        "@type": "ListItem",
        position: 3,
        name: blog.title,
        item: postUrl,
      },
    ],
  };
}

export function blogListingJsonLd(siteUrl = getSiteUrl()) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${siteUrl}/blog#blog`,
    name: "The House of Rani Journal",
    description:
      "Saree styling tips, bridal inspiration, gifting ideas, and behind-the-scenes stories from The House of Rani.",
    url: `${siteUrl}/blog`,
    publisher: {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "The House of Rani",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logoNew.png`,
      },
    },
    inLanguage: "en-IN",
  };
}

export function blogListingBreadcrumbJsonLd(siteUrl = getSiteUrl()) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
      { "@type": "ListItem", position: 2, name: "Journal", item: `${siteUrl}/blog` },
    ],
  };
}
