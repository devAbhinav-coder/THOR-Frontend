import { getBuildSafeApiBase } from "@/lib/buildApiBase";
import type { Blog } from "@/types";

const PAGE_SIZE = 50;
const MAX_PAGES = 20;

async function fetchBlogSlugs(apiUrl: string): Promise<{ slug: string }[]> {
  const all: { slug: string }[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= MAX_PAGES) {
    const res = await fetch(
      `${apiUrl}/blogs?limit=${PAGE_SIZE}&page=${page}&sort=-createdAt`,
      { next: { revalidate: 3600 }, headers: { Accept: "application/json" } },
    );
    if (!res.ok) break;

    const json = (await res.json()) as {
      data?: { blogs?: { slug?: string }[] };
      pagination?: { totalPages?: number; hasNextPage?: boolean };
    };
    const chunk = json?.data?.blogs;
    if (Array.isArray(chunk)) {
      for (const b of chunk) {
        if (b?.slug) all.push({ slug: b.slug });
      }
    }

    totalPages = Math.max(1, Number(json?.pagination?.totalPages || 1));
    const hasNext = json?.pagination?.hasNextPage ?? page < totalPages;
    if (!hasNext) break;
    page += 1;
  }

  return all;
}

/** Published blogs with full content for RSS (newest first). */
export async function fetchAllBlogFeedPosts(): Promise<Blog[]> {
  const apiUrl = await getBuildSafeApiBase();
  if (!apiUrl) return [];

  const slugs = await fetchBlogSlugs(apiUrl);
  if (slugs.length === 0) return [];

  const posts = await Promise.all(
    slugs.map(async ({ slug }) => {
      try {
        const res = await fetch(`${apiUrl}/blogs/${encodeURIComponent(slug)}`, {
          next: { revalidate: 3600 },
          headers: { Accept: "application/json" },
        });
        if (!res.ok) return null;
        const json = (await res.json()) as { data?: { blog?: Blog } };
        return json?.data?.blog ?? null;
      } catch {
        return null;
      }
    }),
  );

  return posts.filter((p): p is Blog => Boolean(p?.slug));
}
