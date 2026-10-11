"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import {
  SITEMAP_CACHE_TAG,
  STOREFRONT_SETTINGS_CACHE_TAG,
} from "@/lib/cacheTags";

/** Call after admin storefront saves so home/gifting SSR picks up new image URLs (old CDN assets may be deleted). */
export async function revalidateStorefrontCache(): Promise<void> {
  revalidateTag(STOREFRONT_SETTINGS_CACHE_TAG);
  revalidateTag(SITEMAP_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/premium");
  revalidatePath("/shop/collections");
  revalidatePath("/shop/edits", "layout");
  revalidatePath("/sitemap.xml");
}
