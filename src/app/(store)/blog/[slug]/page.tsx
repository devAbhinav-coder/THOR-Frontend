import { notFound, redirect } from "next/navigation";
import BlogDetailClient from "@/components/blog/BlogDetailClient";
import { fetchBlogBySlugServer } from "@/lib/blogServer";
import {
  blogDetailBreadcrumbJsonLd,
  blogPostingJsonLd,
} from "@/lib/blogSeo";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;
  const data = await fetchBlogBySlugServer(slug);

  if (data?.redirect?.slug) {
    redirect(`/blog/${encodeURIComponent(data.redirect.slug)}`);
  }

  if (!data?.blog) notFound();

  const blogPostingLd = blogPostingJsonLd(data.blog);
  const breadcrumbLd = blogDetailBreadcrumbJsonLd(data.blog);

  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingLd) }}
      />
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <BlogDetailClient slug={slug} initialData={data} />
    </>
  );
}
