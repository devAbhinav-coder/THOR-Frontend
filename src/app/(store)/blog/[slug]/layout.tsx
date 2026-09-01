import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import { getBuildSafeApiBase } from "@/lib/buildApiBase";
import {
  resolveAdminSeoTitle,
  resolveSerpTitleString,
  templatedPageTitle,
} from "@/lib/pageSeo";
import { blogMetaDescription, blogOgImageUrl } from "@/lib/blogSeo";
import type { Blog } from "@/types";

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

function humanizeBlogSlug(slug: string): string {
  const decoded = decodeURIComponent(String(slug || "").trim());
  if (!decoded) return "Journal Story";
  return decoded
    .replace(/[-_]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function buildMetadataFromBlog(blog: Blog, safeSlug: string, appUrl: string) {
  const fallbackTitle = blog.title || humanizeBlogSlug(safeSlug);
  const pageTitle = resolveAdminSeoTitle(blog.seoTitle, fallbackTitle);
  const description = blogMetaDescription(blog);
  const image = blogOgImageUrl(blog);
  const serpTitle = resolveSerpTitleString(pageTitle, fallbackTitle);
  const authorName = blog.author?.name || "The House of Rani";
  const published = blog.createdAt;
  const modified = blog.updatedAt || blog.createdAt;

  const blogKeywords = [
    ...(Array.isArray(blog.keywords) ? blog.keywords : []),
    ...(Array.isArray(blog.tags) ? blog.tags : []),
    blog.category,
    "The House of Rani",
    "saree styling",
    "Indian ethnic wear",
  ]
    .filter(Boolean)
    .join(", ");

  return {
    title: pageTitle,
    description,
    keywords: blogKeywords,
    alternates: {
      canonical: `/blog/${safeSlug}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large" as const,
      },
    },
    openGraph: {
      title: serpTitle,
      description,
      url: `${appUrl}/blog/${safeSlug}`,
      images: image ?
        [{ url: image, alt: fallbackTitle, width: 1200, height: 630 }]
      : [{ url: `${appUrl}/ogimage.png`, alt: fallbackTitle, width: 1200, height: 630 }],
      type: "article" as const,
      siteName: "The House of Rani",
      locale: "en_IN",
      publishedTime: published,
      modifiedTime: modified,
      authors: [authorName],
      section: blog.category || "Journal",
      tags: [
        ...(Array.isArray(blog.tags) ? blog.tags : []),
        ...(Array.isArray(blog.keywords) ? blog.keywords.slice(0, 4) : []),
      ].filter(Boolean) as string[],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: serpTitle,
      description,
      images: image ? [image] : [`${appUrl}/ogimage.png`],
    },
  } satisfies Metadata;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const apiUrl = await getBuildSafeApiBase();
  const appUrl = getSiteUrl();
  const safeSlug = encodeURIComponent(slug);
  const fallbackTitle = humanizeBlogSlug(slug);

  if (!apiUrl) {
    return {
      title: templatedPageTitle(fallbackTitle),
      description: `Read ${fallbackTitle} on The House of Rani Journal — saree styling, ethnic wear tips, and celebration inspiration.`,
      alternates: { canonical: `/blog/${safeSlug}` },
    };
  }

  try {
    const res = await fetch(`${apiUrl}/blogs/${safeSlug}`, {
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      return {
        title: templatedPageTitle(fallbackTitle),
        description: `Read ${fallbackTitle} on The House of Rani Journal.`,
        alternates: { canonical: `/blog/${safeSlug}` },
        robots: { index: false, follow: true },
      };
    }

    const data = await res.json();
    const blog = data?.data?.blog as Blog | undefined;
    if (!blog?.slug) {
      return {
        title: templatedPageTitle(fallbackTitle),
        description: `Read ${fallbackTitle} on The House of Rani Journal.`,
        alternates: { canonical: `/blog/${safeSlug}` },
        robots: { index: false, follow: true },
      };
    }

    return buildMetadataFromBlog(blog, safeSlug, appUrl);
  } catch {
    return {
      title: templatedPageTitle(fallbackTitle),
      description: `Read ${fallbackTitle} on The House of Rani Journal.`,
      alternates: { canonical: `/blog/${safeSlug}` },
    };
  }
}

export default function BlogSlugLayout({ children }: Props) {
  return children;
}
