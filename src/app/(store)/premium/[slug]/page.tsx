import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PremiumProductClient from "@/components/premium/PremiumProductClient";
import {
  getPremiumProductBySlug,
  PREMIUM_PRODUCTS,
} from "@/lib/premiumCollectionData";
import {
  mapApiProductToPremiumView,
  mapApiProductsToPremiumViews,
  type PremiumProductView,
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

function toPremiumViewFromMock(
  slug: string,
): PremiumProductView | null {
  const mock = getPremiumProductBySlug(slug);
  if (!mock) return null;
  return {
    ...mock,
    _id: mock.slug,
    variants: [{ sku: mock.slug, stock: 5 }],
    totalStock: 5,
    isActive: true,
  };
}

export async function generateStaticParams() {
  const apiProducts = await fetchPremiumProductsServer();
  if (apiProducts?.length) {
    return mapApiProductsToPremiumViews(apiProducts).map((p) => ({
      slug: p.slug,
    }));
  }
  return PREMIUM_PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const apiProduct = await fetchPremiumProductBySlugServer(slug);
  const product =
    apiProduct ?
      mapApiProductToPremiumView(apiProduct)
    : toPremiumViewFromMock(slug);

  if (!product) {
    return {
      title: "Product Not Found",
      robots: { index: false, follow: true },
    };
  }

  return buildPremiumProductMetadata(product, slug);
}

export default async function PremiumProductPage({ params }: Props) {
  const { slug } = await params;
  const [apiProduct, apiAll] = await Promise.all([
    fetchPremiumProductBySlugServer(slug),
    fetchPremiumProductsServer(),
  ]);

  const product =
    apiProduct ?
      mapApiProductToPremiumView(apiProduct)
    : toPremiumViewFromMock(slug);

  if (!product) notFound();

  const related =
    apiAll && apiAll.length > 0 ?
      mapApiProductsToPremiumViews(apiAll)
        .filter((p) => p.slug !== product.slug)
        .slice(0, 3)
    : PREMIUM_PRODUCTS.filter((p) => p.slug !== product.slug)
        .slice(0, 3)
        .map((p) => ({
          ...p,
          _id: p.slug,
          variants: [{ sku: p.slug, stock: 5 }],
          totalStock: 5,
          isActive: true,
        }));

  const jsonLd = buildPremiumProductJsonLd(product, slug);

  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PremiumProductClient product={product} related={related} />
    </>
  );
}
