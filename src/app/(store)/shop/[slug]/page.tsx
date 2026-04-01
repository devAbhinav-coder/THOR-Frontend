import { Metadata } from 'next';
import ProductDetailClient from '@/components/product/ProductDetailClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/products/${slug}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return { title: 'Product Not Found' };
    const data = await res.json();
    const product = data.data.product;

    return {
      title: product.seoTitle || product.name,
      description: product.seoDescription || product.shortDescription || product.description.slice(0, 160),
      alternates: {
        canonical: `/shop/${slug}`,
      },
      openGraph: {
        title: product.name,
        description: product.shortDescription || product.description.slice(0, 160),
        images: [{ url: product.images[0]?.url, alt: product.name }],
        type: 'article',
        url: `${appUrl}/shop/${slug}`,
      },
    };
  } catch {
    return { title: 'Product | The House of Rani' };
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  let productLd: Record<string, unknown> | null = null;
  let breadcrumbLd: Record<string, unknown> | null = null;

  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl}/products/${slug}`, {
        next: { revalidate: 3600 },
      });
      if (res.ok) {
        const data = await res.json();
        const product = data?.data?.product;
        if (product) {
          breadcrumbLd = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: `${appUrl}/`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Shop",
                item: `${appUrl}/shop`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: product.name,
                item: `${appUrl}/shop/${slug}`,
              },
            ],
          };
          productLd = {
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description:
              product.seoDescription ||
              product.shortDescription ||
              String(product.description || "").slice(0, 200),
            image: (product.images || []).map((img: { url?: string }) => img.url).filter(Boolean),
            sku: product?.variants?.[0]?.sku,
            brand: { "@type": "Brand", name: "The House of Rani" },
            offers: {
              "@type": "Offer",
              url: `${appUrl}/shop/${slug}`,
              priceCurrency: "INR",
              price: String(product.price || 0),
              availability:
                Number(product.totalStock || 0) > 0
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
            },
            aggregateRating:
              Number(product?.ratings?.count || 0) > 0
                ? {
                    "@type": "AggregateRating",
                    ratingValue: String(product.ratings.average || 0),
                    reviewCount: String(product.ratings.count || 0),
                  }
                : undefined,
          };
        }
      }
    } catch {
      productLd = null;
    }
  }

  return (
    <>
      {productLd && (
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
        />
      )}
      {breadcrumbLd && (
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
      )}
      <ProductDetailClient slug={slug} />
    </>
  );
}
