"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { blogApi } from "@/lib/api";
import type { Blog } from "@/types";
import { blogExcerpt, categoryLabel } from "@/lib/blogHelpers";

type Props = { slug: string };

export default function BlogRelatedPosts({ slug }: Props) {
  const { data } = useQuery({
    queryKey: ["blog-related", slug],
    queryFn: async () => {
      const res = await blogApi.getRelated(slug);
      return (res.data?.blogs ?? []) as Blog[];
    },
    enabled: !!slug,
    staleTime: 120_000,
  });

  const related = (data || []).slice(0, 3);
  if (related.length === 0) return null;

  return (
    <section className="max-w-account-container mx-auto px-account-margin-mobile md:px-account-margin-desktop mt-account-stack-lg pt-account-stack-lg border-t border-account-outline-variant/30">
      <h2 className="font-serif text-3xl md:text-4xl text-account-primary mb-account-stack-lg text-center">
        Continue the Journey
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-account-gutter">
        {related.map((post) => (
          <Link
            key={post._id}
            href={`/blog/${post.slug}`}
            className="group cursor-pointer"
          >
            <div className="aspect-[4/5] overflow-hidden mb-6 relative">
              {post.images?.[0]?.url ?
                <Image
                  src={post.images[0].url}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              : <div className="absolute inset-0 bg-account-surface-container" />}
            </div>
            <p className="text-xs font-semibold text-account-secondary uppercase mb-2">
              {categoryLabel(post.category)}
            </p>
            <h3 className="font-serif text-2xl mb-2 group-hover:text-account-secondary transition-colors text-account-primary">
              {post.title}
            </h3>
            <p className="text-sm text-account-on-surface-variant/70 leading-relaxed">
              {blogExcerpt(post.excerpt, post.content, 100)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
