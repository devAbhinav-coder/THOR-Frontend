import type { Metadata } from "next";
import PremiumCollectionClient from "@/components/premium/PremiumCollectionClient";
import { mapApiProductsToPremiumViews } from "@/lib/premiumProductMapper";
import { PREMIUM_PRODUCTS } from "@/lib/premiumCollectionData";
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

  const products =
    apiProducts && apiProducts.length > 0 ?
      mapApiProductsToPremiumViews(apiProducts)
    : PREMIUM_PRODUCTS.map((p) => ({
        ...p,
        _id: p.slug,
        variants: [{ sku: p.slug, stock: 5 }],
        totalStock: 5,
        isActive: true,
      }));

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
        type='application/ld+json'
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
