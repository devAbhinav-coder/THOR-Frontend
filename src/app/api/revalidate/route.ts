import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import {
  CATALOG_PRODUCTS_CACHE_TAG,
  MEGA_MENU_CACHE_TAG,
  PREMIUM_CATALOG_CACHE_TAG,
  productPageCacheTag,
  SITEMAP_CACHE_TAG,
} from "@/lib/cacheTags";

type RevalidateBody = {
  secret?: string;
  paths?: string[];
  tags?: string[];
  /** When true, always refresh sitemap + catalog list caches (product save). */
  catalog?: boolean;
  /** Shop or premium slug for product PDP cache tag. */
  productSlug?: string;
};

function isSafeRevalidatePath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.includes("..")) return false;
  return true;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const expectedSecret = process.env.REVALIDATE_SECRET?.trim();
  if (!expectedSecret) {
    return NextResponse.json(
      { ok: false, error: "Revalidation is not configured" },
      { status: 503 },
    );
  }

  let body: RevalidateBody;
  try {
    body = (await request.json()) as RevalidateBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (body.secret !== expectedSecret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const revalidatedPaths: string[] = [];
  const revalidatedTags: string[] = [];

  const tagSet = new Set<string>();
  if (body.catalog) {
    tagSet.add(SITEMAP_CACHE_TAG);
    tagSet.add(CATALOG_PRODUCTS_CACHE_TAG);
    tagSet.add(MEGA_MENU_CACHE_TAG);
    tagSet.add(PREMIUM_CATALOG_CACHE_TAG);
  }
  for (const raw of body.tags ?? []) {
    const tag = String(raw || "").trim();
    if (tag) tagSet.add(tag);
  }
  const slug = String(body.productSlug || "").trim();
  if (slug) tagSet.add(productPageCacheTag(slug));

  for (const tag of Array.from(tagSet)) {
    revalidateTag(tag);
    revalidatedTags.push(tag);
  }

  const pathSet = new Set<string>();
  if (body.catalog) {
    pathSet.add("/sitemap.xml");
    pathSet.add("/shop/collections");
    pathSet.add("/premium");
  }
  for (const raw of body.paths ?? []) {
    const path = String(raw || "").trim();
    if (isSafeRevalidatePath(path)) pathSet.add(path);
  }

  for (const path of Array.from(pathSet)) {
    revalidatePath(path);
    revalidatedPaths.push(path);
  }

  return NextResponse.json({
    ok: true,
    revalidated: true,
    paths: revalidatedPaths,
    tags: revalidatedTags,
  });
}
