"use client";

import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import {
  Crown,
  ExternalLink,
  Eye,
  Loader2,
  Package,
  Pencil,
  Plus,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { sumVariantStock } from "@/lib/productStock";
import type { Product } from "@/types";
import ProductFormModal from "@/components/admin/ProductFormModal";
import AdminPremiumBadge from "@/components/admin/AdminPremiumBadge";

export default function AdminPremiumPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [defaultIsPremium, setDefaultIsPremium] = useState(true);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "premium-products"],
    queryFn: async () => {
      const res = await adminApi.getProducts({
        isPremium: "true",
        limit: 200,
        page: 1,
        sort: "-updatedAt",
      });
      const rows = (res.data?.products ?? []) as Product[];
      return rows.filter((p) => p.isPremium === true);
    },
  });

  const products = data ?? [];

  const openCreate = () => {
    setEditProduct(null);
    setDefaultIsPremium(true);
    setIsModalOpen(true);
  };

  const openEdit = useCallback(async (p: Product) => {
    setDefaultIsPremium(true);
    setEditProduct(p);
    setIsModalOpen(true);
    try {
      const res = await adminApi.getProductById(p._id);
      if (res.data?.product) setEditProduct(res.data.product as Product);
    } catch {
      // List row is enough to open; full fetch is best-effort.
    }
  }, []);

  const handleSave = () => {
    setIsModalOpen(false);
    setEditProduct(null);
    void queryClient.invalidateQueries({ queryKey: ["admin", "premium-products"] });
    void refetch();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-brand-700">
            <Crown className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">
              Premium Edit
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Premium collection
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            Manage hand painted &amp; pure silk pieces for{" "}
            <Link href="/premium" className="text-brand-600 underline">
              /premium
            </Link>
            . Stock, orders, inventory, analytics, and revenue stay shared with
            the main catalog — Premium Edit is a storefront surface, not a
            separate warehouse.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/products?filter=premium"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:border-brand-300"
          >
            All products view
          </Link>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Add premium product
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading premium products…
        </div>
      )}

      {isError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load premium products. Confirm the API is running, then
          refresh.
        </p>
      )}

      {!isLoading && !isError && products.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
          <Package className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-4 font-medium text-gray-700">No premium products yet</p>
          <p className="mt-2 text-sm text-gray-500">
            Create one here, or turn on{" "}
            <strong>Premium Edit</strong> on any product in Products.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Add premium product
          </button>
        </div>
      )}

      {products.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Premium URL</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Views</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => {
                const slug = p.premiumSlug || p.slug;
                const stock = sumVariantStock(p);
                const thumb = p.images?.[0]?.url;
                return (
                  <tr key={p._id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-10 overflow-hidden rounded bg-gray-100">
                          {thumb ?
                            <Image
                              src={thumb}
                              alt={p.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          : null}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-gray-900 truncate">
                              {p.name}
                            </p>
                            <AdminPremiumBadge compact />
                          </div>
                          <p className="text-xs text-gray-400 truncate">
                            {p.fabric || p.category || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      /premium/{slug}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {formatPrice(p.price)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Eye className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                        {p.viewCount || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{stock}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          p.isActive ?
                            "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                          : "rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500"
                        }
                      >
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void openEdit(p)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:border-brand-300 hover:bg-brand-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <Link
                          href={`/premium/${encodeURIComponent(slug)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:border-brand-300 hover:bg-brand-50"
                        >
                          View
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <ProductFormModal
          product={editProduct}
          defaultIsPremium={defaultIsPremium}
          onClose={() => {
            setIsModalOpen(false);
            setEditProduct(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
