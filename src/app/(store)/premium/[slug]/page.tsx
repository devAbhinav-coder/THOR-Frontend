import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PremiumProductClient from "@/components/premium/PremiumProductClient";
import {
  mapApiProductToPremiumView,
  mapApiProductsToPremiumViews,
} from "@/lib/premiumProductMapper";
import {
  buildPremiumProductBreadcrumbJsonLd,
  buildPremiumProductJsonLd,
  buildPremiumProductMetadata,
  mapPremiumReviewsToJsonLd,
} from "@/lib/premiumSeo";
import { getBuildSafeApiBase } from "@/lib/buildApiBase";
import {
  fetchPremiumProductBySlugServer,
  fetchPremiumProductsServer,
} from "@/lib/storePrefetch";

type Props = {
  params: Promise<{ slug: string }>;
};

type ProductReviewLite = {
  rating?: number;
  title?: string;
  comment?: string;
  createdAt?: string;
  user?: { name?: string };
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

  let reviewEntries: Array<Record<string, unknown>> = [];
  const apiUrl = await getBuildSafeApiBase();
  if (apiUrl && product._id) {
    try {
      const reviewsRes = await fetch(
        `${apiUrl}/reviews/product/${encodeURIComponent(product._id)}?limit=3&page=1`,
        { next: { revalidate: 1800 } },
      );
      if (reviewsRes.ok) {
        const reviewsJson = (await reviewsRes.json()) as {
          data?: { reviews?: ProductReviewLite[] };
        };
        const reviews =
          Array.isArray(reviewsJson?.data?.reviews) ?
            reviewsJson.data.reviews
          : [];
        reviewEntries = mapPremiumReviewsToJsonLd(reviews);
      }
    } catch {
      reviewEntries = [];
    }
  }

  const productLd = buildPremiumProductJsonLd(product, slug, { reviewEntries });
  const breadcrumbLd = buildPremiumProductBreadcrumbJsonLd(product.name, slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <PremiumProductClient product={product} related={related} />
    </>
  );
}
