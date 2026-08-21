"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { Crown, ExternalLink, Loader2, Package, Plus } from "lucide-react";
import { adminApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { sumVariantStock } from "@/lib/productStock";
import type { Product } from "@/types";

export default function AdminPremiumPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "premium-products"],
    queryFn: async () => {
      const res = await adminApi.getProducts({
        isPremium: "true",
        simple: "true",
        limit: 100,
        page: 1,
      });
      return (res.data?.products ?? []) as Product[];
    },
  });

  const products = data ?? [];

  return (
    <div className='mx-auto max-w-6xl px-4 py-8 md:px-6'>
      <div className='mb-8 flex flex-wrap items-start justify-between gap-4'>
        <div>
          <div className='mb-2 flex items-center gap-2 text-brand-700'>
            <Crown className='h-5 w-5' />
            <span className='text-xs font-semibold uppercase tracking-[0.18em]'>
              Premium Edit
            </span>
          </div>
          <h1 className='text-2xl font-semibold text-gray-900'>
            Premium collection
          </h1>
          <p className='mt-2 max-w-2xl text-sm text-gray-500'>
            Premium pieces are regular products with{" "}
            <code className='rounded bg-gray-100 px-1'>isPremium</code> enabled.
            They appear on{" "}
            <Link href='/premium' className='text-brand-600 underline'>
              /premium
            </Link>
            , share inventory, orders, analytics, and revenue with the main
            catalog.
          </p>
        </div>
        <Link
          href='/admin/products'
          className='inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700'
        >
          <Plus className='h-4 w-4' />
          Add via Products
        </Link>
      </div>

      {isLoading && (
        <div className='flex items-center gap-2 text-gray-500'>
          <Loader2 className='h-5 w-5 animate-spin' />
          Loading premium products…
        </div>
      )}

      {isError && (
        <p className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
          Could not load premium products. Run{" "}
          <code className='font-mono'>npm run seed:premium-catalog</code> in
          backend, then refresh.
        </p>
      )}

      {!isLoading && !isError && products.length === 0 && (
        <div className='rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center'>
          <Package className='mx-auto h-10 w-10 text-gray-300' />
          <p className='mt-4 font-medium text-gray-700'>No premium products yet</p>
          <p className='mt-2 text-sm text-gray-500'>
            Seed the catalog:{" "}
            <code className='rounded bg-white px-1.5 py-0.5 font-mono text-xs'>
              cd backend && npm run seed:premium-catalog
            </code>
          </p>
        </div>
      )}

      {products.length > 0 && (
        <div className='overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm'>
          <table className='min-w-full divide-y divide-gray-100 text-sm'>
            <thead className='bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500'>
              <tr>
                <th className='px-4 py-3'>Product</th>
                <th className='px-4 py-3'>Premium URL</th>
                <th className='px-4 py-3'>Price</th>
                <th className='px-4 py-3'>Stock</th>
                <th className='px-4 py-3'>Status</th>
                <th className='px-4 py-3' />
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {products.map((p) => {
                const slug = p.premiumSlug || p.slug;
                const stock = sumVariantStock(p);
                const thumb = p.images?.[0]?.url;
                return (
                  <tr key={p._id} className='hover:bg-gray-50/80'>
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-3'>
                        <div className='relative h-12 w-10 overflow-hidden rounded bg-gray-100'>
                          {thumb ?
                            <Image
                              src={thumb}
                              alt={p.name}
                              fill
                              className='object-cover'
                              sizes='40px'
                            />
                          : null}
                        </div>
                        <div>
                          <p className='font-medium text-gray-900'>{p.name}</p>
                          <p className='text-xs text-gray-400'>{p.fabric}</p>
                        </div>
                      </div>
                    </td>
                    <td className='px-4 py-3 font-mono text-xs text-gray-600'>
                      /premium/{slug}
                    </td>
                    <td className='px-4 py-3 tabular-nums'>
                      {formatPrice(p.price)}
                    </td>
                    <td className='px-4 py-3 tabular-nums'>{stock}</td>
                    <td className='px-4 py-3'>
                      <span
                        className={
                          p.isActive ?
                            "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                          : "rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500"
                        }
                      >
                        {p.isActive ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className='px-4 py-3 text-right'>
                      <Link
                        href={`/premium/${encodeURIComponent(slug)}`}
                        target='_blank'
                        className='inline-flex items-center gap-1 text-brand-600 hover:underline'
                      >
                        View
                        <ExternalLink className='h-3.5 w-3.5' />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
