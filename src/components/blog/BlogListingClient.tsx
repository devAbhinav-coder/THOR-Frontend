"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ChevronRight, Eye, Sparkles } from "lucide-react";
import { blogApi } from "@/lib/api";
import type { Blog } from "@/types";
import { Skeleton } from "@/components/ui/SkeletonLoader";
import { plainBlogExcerpt } from "@/lib/blogServer";
import type { BlogsPagination } from "@/lib/blogServer";
import { BLOG_H1 } from "@/lib/pageHeadings";

type Props = {
  initialBlogs?: Blog[];
  initialPagination?: BlogsPagination | null;
};

export default function BlogListingClient({
  initialBlogs = [],
  initialPagination = null,
}: Props) {
  const [blogs, setBlogs] = useState<Blog[]>(initialBlogs);
  const [, setPage] = useState(initialBlogs.length > 0 ? 2 : 1);
  const [hasMore, setHasMore] = useState(() => {
    if (initialPagination) {
      if (typeof initialPagination.hasNextPage === "boolean") {
        return initialPagination.hasNextPage;
      }
      const cur = initialPagination.currentPage ?? 1;
      const tp = Math.max(1, initialPagination.totalPages ?? 1);
      return cur < tp;
    }
    return initialBlogs.length >= 6;
  });
  const [isLoading, setIsLoading] = useState(initialBlogs.length === 0);

  const observerTarget = useRef<HTMLDivElement>(null);
  const seeded = initialBlogs.length > 0;

  const fetchBlogs = async (pageParam: number) => {
    try {
      setIsLoading(true);
      const res = await blogApi.getAll({ page: pageParam, limit: 6 });

      if (res.data?.blogs) {
        if (pageParam === 1) {
          setBlogs(res.data.blogs);
        } else {
          setBlogs((prev) => [...prev, ...res.data!.blogs]);
        }
        const p = res.pagination;
        const cur = p?.currentPage ?? pageParam;
        const tp = Math.max(1, p?.totalPages ?? 1);
        const more =
          typeof p?.hasNextPage === "boolean" ? p.hasNextPage : cur < tp;
        setHasMore(more);
      } else {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!seeded) {
      fetchBlogs(1);
    }
  }, [seeded]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setPage((prev) => {
            const next = prev + 1;
            fetchBlogs(next);
            return next;
          });
        }
      },
      { threshold: 0.1 },
    );

    const el = observerTarget.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMore, isLoading]);

  return (
    <div className='relative min-h-screen bg-navy-950 overflow-x-clip pt-5 pb-10 selection:bg-brand-500/30'>
      <div className='absolute top-0 right-0 -mr-32 -mt-32 w-[50rem] h-[50rem] bg-brand-600/10 rounded-full blur-[128px] pointer-events-none' />
      <div className='absolute bottom-0 left-0 -ml-32 -mb-32 w-[50rem] h-[50rem] bg-gold-600/10 rounded-full blur-[128px] pointer-events-none' />

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10'>
        <header className='text-center max-w-4xl mx-auto mb-8'>
          <div className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-bold tracking-widest uppercase mb-4 shadow-[0_0_20px_-5px_rgba(232,96,76,0.3)]'>
            <Sparkles className='w-4 h-4' />
            The House of Rani Journal
          </div>
          <h1 className='text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-4 drop-shadow-lg'>
            {BLOG_H1}
          </h1>
          <p className='text-lg md:text-xl text-white/60 leading-relaxed font-light max-w-2xl mx-auto'>
            Saree styling guides, bridal inspiration, fabric care tips, and
            stories from our Indian ethnic wear atelier — written for shoppers
            across India.
          </p>
        </header>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10'>
          {isLoading && blogs.length === 0 ?
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className='flex flex-col bg-navy-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] overflow-hidden relative isolate'
              >
                <div className='relative aspect-[4/3] w-full overflow-hidden bg-navy-900/40'>
                  <Skeleton className='absolute inset-0 bg-white/10' />
                </div>
                <div className='flex flex-col flex-1 p-6 sm:p-8 bg-[#0e172a]/20 space-y-4'>
                  <Skeleton className='h-7 w-full rounded-lg bg-white/10' />
                  <Skeleton className='h-4 w-full rounded bg-white/10' />
                </div>
              </div>
            ))
          : blogs.map((blog) => (
              <article key={blog._id}>
                <Link
                  href={`/blog/${blog.slug}`}
                  className='group flex flex-col bg-navy-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] overflow-hidden md:hover:border-gold-500/30 transition-all duration-500 md:hover:-translate-y-1.5 md:hover:shadow-[0_20px_50px_-12px_rgba(234,179,8,0.15)] relative transform-gpu isolate h-full'
                >
                  <div className='relative aspect-[4/3] w-full overflow-hidden bg-navy-900/40 z-10 transform-gpu'>
                    {blog.images?.[0]?.url ?
                      <Image
                        src={blog.images[0].url}
                        alt={blog.title}
                        fill
                        className='object-cover transition-transform duration-700 md:group-hover:scale-[1.03] transform-gpu will-change-transform'
                      />
                    : <div className='absolute inset-0 flex items-center justify-center text-white/10 uppercase tracking-widest text-sm font-bold bg-navy-900'>
                        The House of Rani
                      </div>
                    }
                    <div className='absolute inset-x-0 -bottom-2 h-[60%] bg-gradient-to-t from-[#0e172a] via-[#0e172a]/60 to-transparent opacity-90 z-20 pointer-events-none' />
                    <div className='absolute bottom-5 left-5 flex gap-3 text-xs font-bold text-white z-30'>
                      <div className='flex items-center gap-1.5 bg-black/50 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/20'>
                        <Heart className='w-4 h-4 text-brand-400 fill-brand-400' />
                        <span>{blog.likes?.length || 0}</span>
                      </div>
                      <div className='flex items-center gap-1.5 bg-black/50 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/20'>
                        <Eye className='w-4 h-4 text-blue-300' />
                        <span>{blog.viewCount || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className='flex flex-col flex-1 p-6 sm:p-8 relative z-10 bg-[#0e172a]/20'>
                    <div className='flex items-center gap-2 text-xs text-brand-300 font-bold tracking-widest uppercase mb-4'>
                      <time dateTime={blog.createdAt}>
                        {new Date(blog.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </time>
                      <span className='text-white/20'>•</span>
                      <span>{blog.author?.name || "Editorial"}</span>
                    </div>
                    <h2 className='text-2xl font-bold text-white mb-4 line-clamp-2 leading-snug md:group-hover:text-gold-300 transition-colors'>
                      {blog.title}
                    </h2>
                    <p className='text-base text-white/50 line-clamp-3 mb-8 flex-1 font-light leading-relaxed'>
                      {plainBlogExcerpt(blog.content, 220)}
                    </p>
                    <div className='flex items-center w-full justify-between mt-auto pt-5 border-t border-white/5'>
                      <span className='text-sm font-bold tracking-wide text-brand-400 flex items-center gap-2 md:group-hover:text-gold-400 transition-colors'>
                        Read the Story
                        <ChevronRight className='w-4 h-4 md:group-hover:translate-x-1 transition-transform' />
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            ))
          }
        </div>

        <div ref={observerTarget} className='py-20 flex justify-center items-center'>
          {isLoading && blogs.length > 0 ?
            <div className='flex flex-col items-center gap-5'>
              <div className='w-10 h-10 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin' />
              <span className='text-xs text-white/40 font-bold tracking-[0.2em] uppercase'>
                Loading more stories…
              </span>
            </div>
          : !hasMore && blogs.length > 0 ?
            <p
              data-nosnippet
              className='text-xs text-white/30 font-bold tracking-widest uppercase'
              aria-hidden='true'
            >
              All stories loaded
            </p>
          : !isLoading && blogs.length === 0 ?
            <div className='text-center w-full py-24 bg-navy-900/20 rounded-3xl border border-white/5 border-dashed'>
              <p className='text-white/40 text-lg font-light'>
                New journal entries coming soon. Browse our{" "}
                <Link href='/shop' className='text-brand-400 hover:underline'>
                  saree collection
                </Link>{" "}
                in the meantime.
              </p>
            </div>
          : null}
        </div>
      </div>
    </div>
  );
}
