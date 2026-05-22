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
  const blogPostingLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${postUrl}#article`,
    headline: data.blog.title,
    description: plainBlogExcerpt(data.blog.content, 180),
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
    inLanguage: "en-IN",
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
