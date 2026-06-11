import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import { getBuildSafeApiBase } from "@/lib/buildApiBase";

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const apiUrl = await getBuildSafeApiBase();
  const appUrl = getSiteUrl();
  const safeSlug = encodeURIComponent(slug);

  if (!apiUrl) {
    return {
      title: "Journal Story",
      alternates: { canonical: `/blog/${safeSlug}` },
    };
  }

  try {
    const res = await fetch(`${apiUrl}/blogs/${safeSlug}`, {
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      return {
        title: "Journal Story",
        alternates: { canonical: `/blog/${safeSlug}` },
        robots: { index: false, follow: true },
      };
    }

    const data = await res.json();
    const blog = data?.data?.blog;
    const title = blog?.seoTitle || blog?.title || "Journal Story";
    const description = (
      blog?.seoDescription ||
      blog?.excerpt ||
      (blog?.content || "").replace(/<[^>]*>?/gm, "").trim()
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
      description:
        description || "Read this story from The House of Rani Journal.",
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
      title: "Journal Story",
      alternates: { canonical: `/blog/${safeSlug}` },
    };
  }
}

export default function BlogSlugLayout({ children }: Props) {
  return children;
}
