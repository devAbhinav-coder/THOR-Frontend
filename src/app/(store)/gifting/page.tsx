import { fetchGiftingCategoriesServer } from "@/lib/storePrefetch";
import { fetchStorefrontSettingsGifting } from "@/lib/storefrontServer";
import { giftingApi } from "@/lib/api";
import GiftingPageClient from "./GiftingPageClient";

export default async function GiftingPage() {
  const [initialStorefront, initialGiftingCategories] = await Promise.all([
    fetchStorefrontSettingsGifting(),
    fetchGiftingCategoriesServer(),
  ]);
  return (
    <GiftingPageClient
      initialStorefront={initialStorefront}
      initialGiftingCategories={
        initialGiftingCategories as Awaited<
          ReturnType<typeof giftingApi.getCategories>
        > | null
      }
    />
  );
}
