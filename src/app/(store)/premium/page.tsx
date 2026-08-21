import type { Metadata } from "next";
import PremiumCollectionClient from "@/components/premium/PremiumCollectionClient";
import { buildInfoPageMetadata } from "@/lib/infoPagesSeo";
import { mapApiProductsToPremiumViews } from "@/lib/premiumProductMapper";
import { PREMIUM_PRODUCTS } from "@/lib/premiumCollectionData";
import { fetchPremiumProductsServer } from "@/lib/storePrefetch";

export const metadata: Metadata = {
  ...buildInfoPageMetadata({
    path: "/premium",
    title: "Premium Collection — The Rani Edit",
    description:
      "The Rani Premium Edit — handwoven silk sarees, Banarasi brocade, and heritage Kanjeevaram pieces curated for the discerning few.",
    priority: "support",
  }),
};

export default async function PremiumCollectionPage() {
  const apiProducts = await fetchPremiumProductsServer();
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

  return <PremiumCollectionClient products={products} />;
}
