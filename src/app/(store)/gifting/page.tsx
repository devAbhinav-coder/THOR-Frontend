import {
  fetchGiftingCategoriesServer,
  fetchGiftingProductsFirstPageServer,
} from "@/lib/storePrefetch";
import { fetchStorefrontSettingsGifting } from "@/lib/storefrontServer";
import { giftingApi } from "@/lib/api";
import GiftingPageClient from "./GiftingPageClient";

export default async function GiftingPage() {
  const [initialStorefront, initialGiftingCategories, initialGiftingProductsPage] =
    await Promise.all([
      fetchStorefrontSettingsGifting(),
      fetchGiftingCategoriesServer(),
      fetchGiftingProductsFirstPageServer(),
    ]);
  return (
    <GiftingPageClient
      initialStorefront={initialStorefront}
      initialGiftingCategories={
        initialGiftingCategories as Awaited<
          ReturnType<typeof giftingApi.getCategories>
        > | null
      }
      initialGiftingProductsPage={
        initialGiftingProductsPage as Awaited<
          ReturnType<typeof giftingApi.getProducts>
        > | null
      }
    />
  );
}
