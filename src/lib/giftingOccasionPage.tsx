import {
  buildGiftingOccasionJsonLd,
  buildGiftingOccasionMetadata,
  getGiftingOccasionPreset,
  type GiftingOccasionKey,
} from "@/lib/giftingOccasionSeo";
import { fetchGiftingCategoriesServer } from "@/lib/storePrefetch";
import { fetchStorefrontSettingsGifting } from "@/lib/storefrontServer";
import { giftingApi } from "@/lib/api";
import GiftingPageClient from "@/app/(store)/gifting/GiftingPageClient";

export function buildGiftingOccasionPage(key: GiftingOccasionKey) {
  const preset = getGiftingOccasionPreset(key);
  const jsonLd = buildGiftingOccasionJsonLd(key);

  async function GiftingOccasionPage() {
    const [initialStorefront, initialGiftingCategories] = await Promise.all([
      fetchStorefrontSettingsGifting(),
      fetchGiftingCategoriesServer(),
    ]);

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <GiftingPageClient
          initialStorefront={initialStorefront}
          initialGiftingCategories={
            initialGiftingCategories as Awaited<
              ReturnType<typeof giftingApi.getCategories>
            > | null
          }
          pinnedOccasion={preset.occasionFilter}
          heroH1Override={preset.h1}
        />
      </>
    );
  }

  return {
    metadata: buildGiftingOccasionMetadata(key),
    Page: GiftingOccasionPage,
  };
}
