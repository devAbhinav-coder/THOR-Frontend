import { Metadata } from 'next';
import ProductDetailClient from '@/components/product/ProductDetailClient';
import { fetchProductBySlugServer } from '@/lib/storePrefetch';
import { getSiteUrl } from '@/lib/siteUrl';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const safeSlug = encodeURIComponent(slug);
  const appUrl = getSiteUrl();
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/products/${safeSlug}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) {
      return {
        title: 'Product Not Found',
        robots: { index: false, follow: true },
      };
    }
    const data = await res.json();
    const product = data.data.product;
    const descRaw =
      product.seoDescription ||
      product.shortDescription ||
      String(product.description || '').slice(0, 160);
    const ogImage = product.images?.[0]?.url;

    return {
      title: product.seoTitle || product.name,
      description: descRaw,
      alternates: {
        canonical: `/shop/${safeSlug}`,
      },
      robots: { index: true, follow: true },
      openGraph: {
        title: product.name,
        description: descRaw,
        images: ogImage ? [{ url: ogImage, alt: product.name }] : undefined,
        type: 'website',
        url: `${appUrl}/shop/${safeSlug}`,
        siteName: 'The House of Rani',
      },
      twitter: {
        card: 'summary_large_image',
        title: product.name,
        description: descRaw,
        images: ogImage ? [ogImage] : undefined,
      },
    };
  } catch {
    return { title: 'Product | The House of Rani' };
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const initialProduct = await fetchProductBySlugServer(slug);
  const safeSlug = encodeURIComponent(slug);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const appUrl = getSiteUrl();
  let productLd: Record<string, unknown> | null = null;
  let breadcrumbLd: Record<string, unknown> | null = null;

  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl}/products/${safeSlug}`, {
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
                item: `${appUrl}/shop/${safeSlug}`,
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
              url: `${appUrl}/shop/${safeSlug}`,
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
      <ProductDetailClient slug={slug} initialProduct={initialProduct} />
    </>
  );
}
