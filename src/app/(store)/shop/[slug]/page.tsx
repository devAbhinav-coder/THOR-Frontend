import { Metadata } from 'next';
import ProductDetailClient from '@/components/product/ProductDetailClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
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
      openGraph: {
        title: product.name,
        description: product.shortDescription || product.description.slice(0, 160),
        images: [{ url: product.images[0]?.url, alt: product.name }],
        type: 'article',
      },
    };
  } catch {
    return { title: 'Product | The House of Rani' };
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  return <ProductDetailClient slug={slug} />;
}
