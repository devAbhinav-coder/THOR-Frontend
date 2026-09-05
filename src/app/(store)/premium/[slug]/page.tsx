import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PremiumProductClient from "@/components/premium/PremiumProductClient";
import {
  mapApiProductToPremiumView,
  mapApiProductsToPremiumViews,
} from "@/lib/premiumProductMapper";
import {
  buildPremiumProductJsonLd,
  buildPremiumProductMetadata,
} from "@/lib/premiumSeo";
import {
  fetchPremiumProductBySlugServer,
  fetchPremiumProductsServer,
} from "@/lib/storePrefetch";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const apiProducts = await fetchPremiumProductsServer();
  if (!apiProducts?.length) return [];
  return mapApiProductsToPremiumViews(apiProducts).map((p) => ({
    slug: p.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const apiProduct = await fetchPremiumProductBySlugServer(slug);
  if (!apiProduct) {
    return {
      title: "Product Not Found",
      robots: { index: false, follow: true },
    };
  }

  return buildPremiumProductMetadata(
    mapApiProductToPremiumView(apiProduct),
    slug,
  );
}

export default async function PremiumProductPage({ params }: Props) {
  const { slug } = await params;
  const [apiProduct, apiAll] = await Promise.all([
    fetchPremiumProductBySlugServer(slug),
    fetchPremiumProductsServer(),
  ]);

  if (!apiProduct) notFound();

  const product = mapApiProductToPremiumView(apiProduct);

  const related = mapApiProductsToPremiumViews(apiAll ?? [])
    .filter((p) => p.slug !== product.slug)
    .slice(0, 3);

  const jsonLd = buildPremiumProductJsonLd(product, slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PremiumProductClient product={product} related={related} />
    </>
  );
}
