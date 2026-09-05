import type { Metadata } from "next";
import PremiumCollectionClient from "@/components/premium/PremiumCollectionClient";
import { mapApiProductsToPremiumViews } from "@/lib/premiumProductMapper";
import {
  buildPremiumCollectionJsonLd,
  buildPremiumCollectionMetadata,
  type PremiumAudienceSeoId,
} from "@/lib/premiumSeo";
import { fetchPremiumProductsServer } from "@/lib/storePrefetch";
import { fetchStorefrontSettingsHome } from "@/lib/storefrontServer";

async function PremiumAudiencePage({
  audience,
}: {
  audience: PremiumAudienceSeoId;
}) {
  const [apiProducts, storefrontSettings] = await Promise.all([
    fetchPremiumProductsServer(audience),
    fetchStorefrontSettingsHome(),
  ]);

  // API-only — never seed static mock products.
  const products = mapApiProductsToPremiumViews(apiProducts ?? []);

  const jsonLd = buildPremiumCollectionJsonLd(
    audience,
    products.map((p) => ({
      name: p.name,
      slug: p.slug,
      heroImage: p.heroImage,
    })),
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PremiumCollectionClient
        products={products}
        activeAudience={audience}
        banners={storefrontSettings?.premiumAudienceBanners || []}
        settings={storefrontSettings}
      />
    </>
  );
}

export function buildPremiumAudiencePage(audience: PremiumAudienceSeoId) {
  return {
    metadata: buildPremiumCollectionMetadata(audience) as Metadata,
    Page: async function Page() {
      return <PremiumAudiencePage audience={audience} />;
    },
  };
}
