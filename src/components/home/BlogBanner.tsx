"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { blogApi } from "@/lib/api";
import type { Blog } from "@/types";
import { cn } from "@/lib/utils";
import cloudinaryLoader from "@/lib/cloudinaryLoader";
import { plainBlogExcerpt } from "@/lib/blogServer";
import { homeSectionStyles } from "@/lib/homeSectionStyles";

type Props = {
  /** SSR-prefetched latest blogs — section hidden when empty. */
  initialBlogs?: Blog[] | null;
};

function blogImage(blog: Blog): string {
  return blog.images?.[0]?.url?.trim() || "";
}

function blogLabel(blog: Blog): string {
  const cat = blog.category?.trim();
  if (cat) return cat.toUpperCase();
  const tag = blog.tags?.find((t) => t.trim())?.trim();
  if (tag) return tag.toUpperCase();
  return "HERITAGE CRAFT";
}

function blogExcerpt(blog: Blog): string {
  if (blog.excerpt?.trim()) return blog.excerpt.trim();
  return plainBlogExcerpt(blog.content, 120);
}

function HeritageStoryCard({
  blog,
  variant,
}: {
  blog: Blog;
  variant: "featured" | "compact";
}) {
  const img = blogImage(blog);
  const href = `/blog/${encodeURIComponent(blog.slug)}`;

  if (variant === "featured") {
    return (
      <article className="flex h-full flex-col">
        {img ?
          <Link href={href} className="group relative mb-5 block aspect-[16/10] overflow-hidden bg-gray-100 sm:mb-6">
            <Image
              src={img}
              alt={blog.title}
              fill
              loader={cloudinaryLoader}
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              loading="lazy"
              quality={72}
            />
          </Link>
        : null}
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#c5a059] sm:text-[11px]">
          {blogLabel(blog)}
        </p>
        <h3 className="mt-2 font-serif text-xl font-medium leading-snug text-navy-900 sm:text-2xl lg:text-3xl">
          <Link href={href} className="hover:text-navy-700">
            {blog.title}
          </Link>
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-500 sm:text-base">
          {blogExcerpt(blog)}
        </p>
        <Link
          href={href}
          className="mt-4 inline-block text-[11px] font-semibold uppercase tracking-[0.2em] text-navy-900 underline decoration-navy-900/30 underline-offset-[5px] transition-colors hover:decoration-navy-900 sm:text-xs"
        >
          Read Story
        </Link>
      </article>
    );
  }

  return (
    <article className="flex gap-4 border-t border-gray-200/80 pt-5 first:border-t-0 first:pt-0 sm:gap-5">
      {img ?
        <Link
          href={href}
          className="group relative h-20 w-20 shrink-0 overflow-hidden bg-gray-100 sm:h-24 sm:w-24"
        >
          <Image
            src={img}
            alt={blog.title}
            fill
            loader={cloudinaryLoader}
            sizes="96px"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
            loading="lazy"
            quality={68}
          />
        </Link>
      : null}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#c5a059]">
          {blogLabel(blog)}
        </p>
        <h3 className="mt-1 line-clamp-2 font-serif text-base font-medium leading-snug text-navy-900 sm:text-lg">
          <Link href={href} className="hover:text-navy-700">
            {blog.title}
          </Link>
        </h3>
        <Link
          href={href}
          className="mt-2 inline-block text-[10px] font-semibold uppercase tracking-[0.18em] text-navy-900/70 hover:text-navy-900 sm:text-[11px]"
        >
          Read Story
        </Link>
      </div>
    </article>
  );
}

export default function BlogBanner({ initialBlogs }: Props = {}) {
  const [blogs, setBlogs] = useState<Blog[]>(() =>
    Array.isArray(initialBlogs) ? initialBlogs : [],
  );
  const [isLoading, setIsLoading] = useState(
    () => !Array.isArray(initialBlogs),
  );

  useEffect(() => {
    if (Array.isArray(initialBlogs)) {
      setBlogs(initialBlogs);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    blogApi
      .getAll({ limit: 3, page: 1, sort: "-createdAt" })
      .then((res) => {
        if (cancelled) return;
        const list = (res.data?.blogs || []).filter(
          (b) => b?.slug && b?.title && b.isPublished !== false,
        );
        setBlogs(list);
      })
      .catch(() => setBlogs([]))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initialBlogs]);

  if (isLoading) return null;
  if (blogs.length === 0) return null;

  const [featured, ...rest] = blogs;

  return (
    <section
      className={cn(homeSectionStyles.pageBg, "bg-gray-50/50 py-14 sm:py-20 lg:py-24")}
      aria-labelledby="heritage-stories-heading"
    >
      <div className={homeSectionStyles.container}>
        <div className="mb-10 text-center sm:mb-14">
          <h2
            id="heritage-stories-heading"
            className="font-serif text-3xl font-medium leading-tight text-navy-900 sm:text-4xl lg:text-[2.75rem]"
          >
            Heritage{" "}
            <span className="italic text-navy-900">Stories</span>
          </h2>
        </div>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          <HeritageStoryCard blog={featured} variant="featured" />

          {rest.length > 0 ?
            <div className="flex flex-col justify-center gap-5 lg:gap-6">
              {rest.map((blog) => (
                <HeritageStoryCard key={blog._id} blog={blog} variant="compact" />
              ))}
            </div>
          : null}
        </div>
      </div>
    </section>
  );
}
