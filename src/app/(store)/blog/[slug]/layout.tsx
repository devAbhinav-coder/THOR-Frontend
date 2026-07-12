import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import { getBuildSafeApiBase } from "@/lib/buildApiBase";
import { templatedPageTitle } from "@/lib/pageSeo";

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
    const blog = data?.data?.blog;
    const title = blog?.seoTitle || blog?.title || fallbackTitle;
    const description = (
      blog?.seoDescription ||
      blog?.excerpt ||
      (blog?.content || "").replace(/<[^>]*>?/gm, "").trim() ||
      `Read ${title} on The House of Rani Journal — saree styling and Indian ethnic wear inspiration.`
    ).slice(0, 165);
    const image = blog?.images?.[0]?.url;
    const blogKeywords = [
      ...(Array.isArray(blog?.keywords) ? blog.keywords : []),
      ...(Array.isArray(blog?.tags) ? blog.tags : []),
      blog?.title,
      "The House of Rani",
      "saree styling",
      "Indian ethnic wear",
    ]
      .filter(Boolean)
      .join(", ");

    return {
      title: title,
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
        title: `${title} | The House of Rani Journal`,
        description:
          description || "Read this story from The House of Rani Journal.",
        url: `${appUrl}/blog/${safeSlug}`,
        images: image ?
          [{ url: image, alt: title, width: 1200, height: 630 }]
        : [{ url: `${appUrl}/ogimage.png`, alt: title, width: 1200, height: 630 }],
        type: "article",
        siteName: "The House of Rani",
        locale: "en_IN",
        tags: [
          ...(Array.isArray(blog?.tags) ? blog.tags : []),
          ...(Array.isArray(blog?.keywords) ? blog.keywords.slice(0, 4) : []),
          blog?.category,
        ].filter(Boolean) as string[],
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | The House of Rani Journal`,
        description:
          description || "Read this story from The House of Rani Journal.",
        images: image ? [image] : [`${appUrl}/ogimage.png`],
      },
    };
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
