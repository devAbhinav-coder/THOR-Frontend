import type { Blog, BlogComment } from "@/types";
import { getBuildSafeApiBase } from "@/lib/buildApiBase";

export type BlogsPagination = {
  currentPage?: number;
  totalPages?: number;
  hasNextPage?: boolean;
};

export type BlogsListServerResult = {
  blogs: Blog[];
  pagination: BlogsPagination | null;
};

export type BlogDetailServerResult = {
  blog: Blog;
  comments: BlogComment[];
};

export async function fetchBlogsListingServer(
  page = 1,
  limit = 12,
): Promise<BlogsListServerResult | null> {
  const base = await getBuildSafeApiBase();
  if (!base) return null;
  try {
    const res = await fetch(
      `${base}/blogs?limit=${limit}&page=${page}&sort=-createdAt`,
      { next: { revalidate: 600 }, headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: { blogs?: Blog[] };
      pagination?: BlogsPagination;
    };
    const blogs = Array.isArray(json?.data?.blogs) ? json.data.blogs : [];
    return { blogs, pagination: json.pagination ?? null };
  } catch {
    return null;
  }
}

export async function fetchBlogBySlugServer(
  slug: string,
): Promise<BlogDetailServerResult | null> {
  const base = await getBuildSafeApiBase();
  if (!base) return null;
  const safe = encodeURIComponent(slug);
  try {
    const res = await fetch(`${base}/blogs/${safe}`, {
      next: { revalidate: 600 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: { blog?: Blog; comments?: BlogComment[] };
    };
    const blog = json?.data?.blog;
    if (!blog?.slug) return null;
    return {
      blog,
      comments: Array.isArray(json?.data?.comments) ? json.data.comments : [],
    };
  } catch {
    return null;
  }
}

export function plainBlogExcerpt(content: string, max = 200): string {
  return String(content || "")
    .replace(/<[^>]*>?/gm, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}
