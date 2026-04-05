import { fetchStorefrontSettingsGifting } from "@/lib/storefrontServer";
import GiftingPageClient from "./GiftingPageClient";

export default async function GiftingPage() {
  const initialStorefront = await fetchStorefrontSettingsGifting();
  return <GiftingPageClient initialStorefront={initialStorefront} />;
}
