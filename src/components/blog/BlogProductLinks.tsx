"use client";

import Image from "next/image";
import Link from "next/link";
import type { BlogRelatedProduct } from "@/types";
import { blogApi } from "@/lib/api";

type Props = { products: BlogRelatedProduct[]; blogSlug: string };

export default function BlogProductLinks({ products, blogSlug }: Props) {
  const list = products.filter((p) => p && typeof p === "object" && p.slug);
  if (list.length === 0) return null;

  const track = (productSlug: string) => {
    blogApi.trackShopClick(blogSlug, productSlug).catch(() => {});
  };

  return (
    <aside className="my-account-stack-lg border border-account-secondary/30 bg-account-surface-container-low p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-account-secondary mb-4">
        Shop the Story
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {list.slice(0, 4).map((product) => {
          const img = product.images?.[0]?.url;
          return (
            <Link
              key={product._id}
              href={`/shop/${encodeURIComponent(product.slug)}?utm_source=blog&utm_medium=journal&utm_campaign=${encodeURIComponent(blogSlug)}`}
              onClick={() => track(product.slug)}
              className="group flex items-center gap-3 border border-account-outline-variant/30 bg-white p-3 hover:border-account-secondary transition-colors"
            >
              <div className="relative w-16 h-16 overflow-hidden bg-account-surface-container shrink-0">
                {img ?
                  <Image src={img} alt={product.name} fill className="object-cover" />
                : null}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-account-primary line-clamp-2 group-hover:text-account-secondary transition-colors">
                  {product.name}
                </p>
                {product.price != null && (
                  <p className="text-xs text-account-on-surface-variant mt-0.5">
                    From ₹{product.price.toLocaleString("en-IN")}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
