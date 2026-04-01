import type { Metadata } from "next";

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!apiUrl) {
    return {
      title: "Journal Story",
      alternates: { canonical: `/blog/${slug}` },
    };
  }

  try {
    const res = await fetch(`${apiUrl}/blogs/${slug}`, {
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      return {
        title: "Journal Story",
        alternates: { canonical: `/blog/${slug}` },
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
      description: description || "Read this story from The House of Rani Journal.",
      alternates: {
        canonical: `/blog/${slug}`,
      },
      openGraph: {
        title,
        description: description || "Read this story from The House of Rani Journal.",
        url: `${appUrl}/blog/${slug}`,
        images: image ? [{ url: image, alt: title }] : undefined,
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: description || "Read this story from The House of Rani Journal.",
        images: image ? [image] : undefined,
      },
    };
  } catch {
    return {
      title: "Journal Story",
      alternates: { canonical: `/blog/${slug}` },
    };
  }
}

export default function BlogSlugLayout({ children }: Props) {
  return children;
}
