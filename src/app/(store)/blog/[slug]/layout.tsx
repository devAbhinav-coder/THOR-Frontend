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
    const title = blog?.title || "Journal Story";
    const description = (blog?.content || "")
      .replace(/<[^>]*>?/gm, "")
      .trim()
      .slice(0, 160);
    const image = blog?.images?.[0]?.url;

    return {
      title,
      description:
        description || "Read this story from The House of Rani Journal.",
      alternates: {
        canonical: `/blog/${safeSlug}`,
      },
      openGraph: {
        title,
        description:
          description || "Read this story from The House of Rani Journal.",
        url: `${appUrl}/blog/${safeSlug}`,
        images: image ? [{ url: image, alt: title }] : undefined,
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description:
          description || "Read this story from The House of Rani Journal.",
        images: image ? [image] : undefined,
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
