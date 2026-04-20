"use server";

import { revalidateTag } from "next/cache";
import { STOREFRONT_SETTINGS_CACHE_TAG } from "@/lib/cacheTags";

/** Call after admin storefront saves so home/gifting SSR picks up new image URLs (old CDN assets may be deleted). */
export async function revalidateStorefrontCache(): Promise<void> {
  revalidateTag(STOREFRONT_SETTINGS_CACHE_TAG);
}
