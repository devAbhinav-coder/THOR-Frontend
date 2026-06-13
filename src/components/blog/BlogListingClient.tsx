"use client";

import { HorizontalScrollSurface } from "@/components/ui/HorizontalScrollSurface";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInfiniteScrollTrigger } from "@/hooks/useInfiniteScrollTrigger";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Loader2, Search, X } from "lucide-react";
import { blogApi } from "@/lib/api";
import type { Blog } from "@/types";
import { Skeleton } from "@/components/ui/SkeletonLoader";
import type { BlogsPagination } from "@/lib/blogServer";
import {
  BLOG_CATEGORIES,
  blogExcerpt,
  categoryLabel,
} from "@/lib/blogHelpers";
import {
  gridColSpan,
  gridVariantForIndex,
  listingImageAspect,
} from "@/lib/blogGridLayouts";
import BlogNewsletter from "@/components/blog/BlogNewsletter";
import { getCoverImage } from "@/lib/blogArticleCompose";
import { cn } from "@/lib/utils";

const PAGE_LIMIT = 8;
const SEARCH_DEBOUNCE_MS = 320;
const SEARCH_MAX_LEN = 80;

type Props = {
  initialBlogs?: Blog[];
  initialPagination?: BlogsPagination | null;
};

function FeaturedHero({ blog }: { blog: Blog }) {
  const img = getCoverImage(blog.images || []);
  return (
    <section className="relative w-full h-[870px] max-h-[85vh] overflow-hidden">
      {img?.url ?
        <Image
          src={img.url}
          alt={blog.title}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      : <div className="absolute inset-0 bg-account-primary" />}
      <div className="absolute inset-0 journal-editorial-overlay flex flex-col justify-end p-account-margin-mobile md:p-account-margin-desktop text-white">
        <div className="max-w-4xl journal-animate-reveal">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] mb-account-stack-sm block text-[#ffdea5]">
            Feature • {categoryLabel(blog.category)}
          </span>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-[4rem] font-bold mb-6 leading-[1.05] tracking-tight">
            {blog.title}
          </h1>
          <p className="text-base md:text-lg mb-account-stack-lg max-w-2xl opacity-90 leading-relaxed">
            {blogExcerpt(blog.excerpt, blog.content, 220)}
          </p>
          <Link
            href={`/blog/${blog.slug}`}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase border-b-2 border-[#ffdea5] pb-1 hover:text-[#ffdea5] transition-all duration-300 group"
          >
            Read the Article
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function GridCard({ blog, index }: { blog: Blog; index: number }) {
  const variant = gridVariantForIndex(index);
  const img = getCoverImage(blog.images || []) || blog.images?.[0];
  const aspect = listingImageAspect(img?.layout, variant);

  if (variant === "horizontal") {
    return (
      <article className={`${gridColSpan(variant)} flex flex-col md:flex-row gap-8 journal-hover-lift group`}>
        <Link
          href={`/blog/${blog.slug}`}
          className="md:w-1/2 overflow-hidden aspect-square md:aspect-auto md:min-h-[300px] relative block"
        >
          {img?.url ?
            <Image
              src={img.url}
              alt={blog.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 40vw"
            />
          : <div className="absolute inset-0 bg-account-surface-container" />}
        </Link>
        <div className="md:w-1/2 flex flex-col justify-center">
          <span className="text-xs font-semibold text-account-secondary uppercase tracking-[0.12em] block mb-2">
            {categoryLabel(blog.category)}
          </span>
          <Link href={`/blog/${blog.slug}`}>
            <h3 className="font-serif text-2xl font-medium text-account-primary mb-6 group-hover:text-account-secondary transition-colors leading-snug">
              {blog.title}
            </h3>
          </Link>
          <p className="text-base text-account-on-surface-variant mb-6 leading-relaxed">
            {blogExcerpt(blog.excerpt, blog.content, 160)}
          </p>
          <Link
            href={`/blog/${blog.slug}`}
            className="text-xs font-semibold text-account-primary uppercase tracking-[0.1em] border-b border-account-primary self-start pb-1 hover:border-account-secondary transition-colors"
          >
            Read More
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article className={`${gridColSpan(variant)} journal-hover-lift group`}>
      <Link href={`/blog/${blog.slug}`} className="block">
        <div className={`overflow-hidden ${aspect} mb-2 relative`}>
          {img?.url ?
            <Image
              src={img.url}
              alt={blog.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          : <div className="absolute inset-0 bg-account-surface-container" />}
        </div>
        <span className="text-xs font-semibold text-account-secondary uppercase tracking-[0.12em] block mb-2">
          {categoryLabel(blog.category)}
        </span>
        <h3 className="font-serif text-2xl font-medium text-account-primary mb-2 group-hover:text-account-secondary transition-colors leading-snug">
          {blog.title}
        </h3>
        <p className="text-base text-account-on-surface-variant leading-relaxed max-w-xl">
          {blogExcerpt(blog.excerpt, blog.content, 140)}
        </p>
      </Link>
    </article>
  );
}

function GridSkeleton() {
  return (
    <div className="md:col-span-4 space-y-3">
      <Skeleton className="aspect-[4/5] w-full rounded-none bg-account-surface-container" />
      <Skeleton className="h-4 w-24 bg-account-surface-container" />
      <Skeleton className="h-8 w-full bg-account-surface-container" />
    </div>
  );
}

function resolveHasMore(
  pagination: BlogsPagination | null | undefined,
  pageParam: number,
  batchSize: number,
): boolean {
  if (pagination) {
    if (typeof pagination.hasNextPage === "boolean") {
      return pagination.hasNextPage;
    }
    const cur = pagination.currentPage ?? pageParam;
    const tp = Math.max(1, pagination.totalPages ?? 1);
    return cur < tp;
  }
  return batchSize >= PAGE_LIMIT;
}

export default function BlogListingClient({
  initialBlogs = [],
  initialPagination = null,
}: Props) {
  const [blogs, setBlogs] = useState<Blog[]>(initialBlogs);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(
    searchInput.trim().slice(0, SEARCH_MAX_LEN),
    SEARCH_DEBOUNCE_MS,
  );
  const [totalResults, setTotalResults] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(() =>
    resolveHasMore(initialPagination, 1, initialBlogs.length),
  );
  const [isLoading, setIsLoading] = useState(initialBlogs.length === 0);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const nextPageRef = useRef(initialBlogs.length > 0 ? 2 : 1);
  const hasInteractedRef = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  /** Site-wide latest — stays in the hero banner even when category filters change. */
  const [featuredBlog] = useState<Blog | null>(() => initialBlogs[0] ?? null);

  const isSearching = searchInput.trim() !== debouncedSearch;
  const hasActiveFilters =
    activeCategory !== "all" || debouncedSearch.length > 0;

  const showFeaturedBanner = Boolean(featuredBlog) && !debouncedSearch;

  const gridBlogs =
    showFeaturedBanner && featuredBlog ?
      blogs.filter((b) => b._id !== featuredBlog._id)
    : blogs;

  const fetchBlogs = useCallback(
    async (pageParam: number, reset = false) => {
      try {
        if (reset || pageParam === 1) {
          setIsLoading(true);
        } else {
          setIsFetchingNextPage(true);
        }
        const params: Record<string, string | number> = {
          page: pageParam,
          limit: PAGE_LIMIT,
          sort: "-createdAt",
        };
        if (activeCategory !== "all") params.category = activeCategory;
        if (debouncedSearch) params.search = debouncedSearch;

        const res = await blogApi.getAll(params);

        if (res.data?.blogs) {
          const batch = res.data.blogs;
          if (reset || pageParam === 1) {
            setBlogs(batch);
            nextPageRef.current = 2;
          } else {
            setBlogs((prev) => [...prev, ...batch]);
            nextPageRef.current = pageParam + 1;
          }
          setTotalResults(
            typeof res.pagination?.total === "number" ?
              res.pagination.total
            : null,
          );
          setHasMore(resolveHasMore(res.pagination, pageParam, batch.length));
        } else {
          if (reset || pageParam === 1) {
            setBlogs([]);
            setTotalResults(0);
          }
          setHasMore(false);
        }
      } catch {
        if (reset || pageParam === 1) {
          setBlogs([]);
          setTotalResults(null);
        }
        setHasMore(false);
      } finally {
        setIsLoading(false);
        setIsFetchingNextPage(false);
      }
    },
    [activeCategory, debouncedSearch],
  );

  useEffect(() => {
    const skipInitialFetch =
      !hasInteractedRef.current &&
      initialBlogs.length > 0 &&
      activeCategory === "all" &&
      !debouncedSearch;

    if (skipInitialFetch) return;
    fetchBlogs(1, true);
  }, [activeCategory, debouncedSearch, fetchBlogs, initialBlogs.length]);

  const handleCategory = (cat: string) => {
    if (cat === activeCategory) return;
    hasInteractedRef.current = true;
    setActiveCategory(cat);
    setHasMore(true);
    nextPageRef.current = 1;
  };

  const handleSearchChange = (value: string) => {
    hasInteractedRef.current = true;
    setSearchInput(value.slice(0, SEARCH_MAX_LEN));
  };

  const clearSearch = () => {
    hasInteractedRef.current = true;
    setSearchInput("");
    searchInputRef.current?.focus();
  };

  const clearAllFilters = () => {
    hasInteractedRef.current = true;
    setSearchInput("");
    setActiveCategory("all");
    setHasMore(true);
    nextPageRef.current = 1;
  };

  const loadMore = useCallback(() => {
    if (!hasMore || isLoading || isFetchingNextPage) return Promise.resolve();
    return fetchBlogs(nextPageRef.current, false);
  }, [hasMore, isLoading, isFetchingNextPage, fetchBlogs]);

  const { sentinelRef } = useInfiniteScrollTrigger({
    hasNextPage: hasMore,
    isFetchingNextPage,
    isPending: isLoading && blogs.length === 0,
    fetchNextPage: loadMore,
    enabled: blogs.length > 0 && hasMore,
  });

  const filterOptions = [
    { value: "all", label: "Latest" },
    ...BLOG_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
  ];

  const statusLabel = (() => {
    if (isLoading && blogs.length === 0) return "Searching the archives…";
    if (isSearching || (isLoading && blogs.length > 0)) return "Updating results…";
    if (debouncedSearch) {
      const count = totalResults ?? blogs.length;
      return `${count} ${count === 1 ? "story" : "stories"} for “${debouncedSearch}”`;
    }
    if (activeCategory !== "all") {
      const label = categoryLabel(activeCategory);
      const count = totalResults ?? blogs.length;
      return `${count} ${count === 1 ? "story" : "stories"} in ${label}`;
    }
    return null;
  })();

  return (
    <div className="bg-account-surface text-account-on-surface overflow-x-hidden">
      {showFeaturedBanner && featuredBlog && <FeaturedHero blog={featuredBlog} />}

      <section className="max-w-account-container mx-auto px-account-margin-mobile md:px-account-margin-desktop py-account-stack-lg">
        <div className="flex flex-col gap-account-stack-md mb-account-stack-lg border-b border-account-outline-variant/30 pb-account-stack-sm">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-account-primary">
              The Journal Archives
            </h2>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="self-start md:self-auto text-xs font-semibold uppercase tracking-[0.1em] text-account-secondary hover:text-account-primary transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>

          <HorizontalScrollSurface
            className="flex gap-2 pb-1 -mx-1 px-1 scrollbar-hide"
            role="tablist"
            aria-label="Filter stories by category"
          >
            {filterOptions.map((option) => {
              const isActive = activeCategory === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleCategory(option.value)}
                  className={cn(
                    "shrink-0 px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] rounded-full border transition-all duration-300",
                    isActive ?
                      "bg-account-primary text-white border-account-primary shadow-sm"
                    : "bg-transparent text-account-on-surface-variant border-account-outline-variant/50 hover:border-account-primary hover:text-account-primary",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </HorizontalScrollSurface>
        </div>

        <form
          className="relative max-w-xl mb-account-stack-lg"
          onSubmit={(e) => e.preventDefault()}
          role="search"
        >
          <Search
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300",
              searchInput ? "text-account-primary" : "text-account-on-surface-variant/50",
            )}
            aria-hidden
          />
          <input
            ref={searchInputRef}
            type="search"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by title, topic, or keyword…"
            maxLength={SEARCH_MAX_LEN}
            aria-label="Search journal stories"
            className="w-full pl-8 pr-16 py-3 bg-transparent border-b border-account-outline-variant text-sm focus:outline-none focus:border-account-primary placeholder:text-account-on-surface-variant/40 transition-colors duration-300"
          />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {(isSearching || (isLoading && debouncedSearch.length > 0)) && (
              <Loader2
                className="w-4 h-4 animate-spin text-account-secondary"
                aria-hidden
              />
            )}
            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                className="p-1 rounded-full text-account-on-surface-variant/60 hover:text-account-primary hover:bg-account-surface-container transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {statusLabel && (
          <p
            className={cn(
              "text-xs uppercase tracking-[0.12em] mb-account-stack-md transition-opacity duration-300",
              isLoading || isSearching ?
                "text-account-on-surface-variant/60"
              : "text-account-on-surface-variant",
            )}
            aria-live="polite"
          >
            {statusLabel}
          </p>
        )}

        <div
          className={cn(
            "grid grid-cols-1 md:grid-cols-12 gap-account-gutter transition-opacity duration-300",
            isLoading && blogs.length > 0 && "opacity-50 pointer-events-none",
          )}
        >
          {isLoading && blogs.length === 0 ?
            Array.from({ length: 4 }).map((_, i) => <GridSkeleton key={i} />)
          : gridBlogs.map((blog, idx) => (
              <GridCard key={blog._id} blog={blog} index={idx} />
            ))
          }
          {isFetchingNextPage &&
            Array.from({ length: 2 }).map((_, i) => <GridSkeleton key={`more-${i}`} />)}
        </div>

        {!isLoading && !isSearching && blogs.length === 0 && (
          <div className="text-center py-24 border border-dashed border-account-outline-variant/40">
            <p className="text-account-on-surface-variant text-lg mb-4">
              {debouncedSearch ?
                `No stories match “${debouncedSearch}”.`
              : activeCategory !== "all" ?
                `No stories in ${categoryLabel(activeCategory)} yet.`
              : "No stories published yet."}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-sm font-semibold uppercase tracking-[0.1em] text-account-secondary hover:text-account-primary transition-colors"
              >
                View all latest stories
              </button>
            )}
            {!hasActiveFilters && (
              <p className="text-account-on-surface-variant/80">
                Browse our{" "}
                <Link href="/shop" className="text-account-secondary hover:underline">
                  collection
                </Link>{" "}
                in the meantime.
              </p>
            )}
          </div>
        )}

        {blogs.length > 0 && (
          <div className="mt-12 flex flex-col items-center gap-4">
            <p className="text-xs text-account-on-surface-variant/60 uppercase tracking-[0.12em]">
              {gridBlogs.length} {gridBlogs.length === 1 ? "story" : "stories"} in archives
              {showFeaturedBanner ? " · 1 featured" : ""}
            </p>
            {hasMore && (
              <>
                <div ref={sentinelRef} className="h-1 w-full" aria-hidden />
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={isFetchingNextPage}
                  className="px-12 py-4 border border-account-primary text-account-primary text-xs font-semibold uppercase tracking-[0.1em] hover:bg-account-primary hover:text-white transition-all duration-300 disabled:opacity-50"
                >
                  {isFetchingNextPage ? "Loading…" : "Load Older Entries"}
                </button>
              </>
            )}
          </div>
        )}
      </section>

      <BlogNewsletter />
    </div>
  );
}
