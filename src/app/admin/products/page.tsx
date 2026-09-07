'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, AlertTriangle, Sparkles, CheckCircle2, EyeOff, LayoutGrid, List, RefreshCw, Eye, Crown } from 'lucide-react';
import { adminApi, productApi } from '@/lib/api';
import { fetchAdminCatalogCategories } from '@/lib/adminCatalog';
import { Product } from '@/types';
import { sumVariantStock, variantStockSummary } from '@/lib/productStock';
import { adminProductListThumbnail } from '@/lib/adminProductDisplay';
import OrderLineThumbnail from '@/components/orders/OrderLineThumbnail';
import { getProductPriceDisplay } from '@/lib/productPricing';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchField } from '@/components/ui/SearchField';
import ProductFormModal from '@/components/admin/ProductFormModal';
import AdminPremiumBadge, { isAdminPremiumProduct } from '@/components/admin/AdminPremiumBadge';
import toast from 'react-hot-toast';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { LOW_STOCK_ALERT_EXCLUSIVE_MAX } from '@/lib/inventoryConstants';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminErrorState from '@/components/admin/AdminErrorState';

type QuickFilter = 'all' | 'featured' | 'active' | 'inactive' | 'premium';

const PAGE_LIMIT = 20;

type ProductsPageData = {
  products: Product[];
  pagination: { currentPage: number; totalPages: number; totalProducts: number };
};

async function fetchAdminProductsPage(args: {
  page: number;
  query: string;
  sort: string;
  filter: QuickFilter;
  categoryFilter: string;
}): Promise<ProductsPageData> {
  const { page, query, sort, filter, categoryFilter } = args;
  const params: Record<string, string | number> = {
    page,
    limit: PAGE_LIMIT,
    sort,
  };
  if (filter === 'featured') params.isFeatured = 'true';
  if (filter === 'active') params.isActive = 'true';
  if (filter === 'inactive') params.isActive = 'false';
  if (filter === 'premium') params.isPremium = 'true';
  if (categoryFilter) params.category = categoryFilter;

  try {
    if (query) {
      const searchRes = await adminApi.searchProducts({
        q: query,
        page,
        limit: PAGE_LIMIT,
        sortBy: sort,
        ...params,
      });
      const p = searchRes.pagination;
      return {
        products: searchRes.data.products,
        pagination: {
          currentPage: p?.currentPage ?? 1,
          totalPages: p?.totalPages ?? 1,
          totalProducts: p?.totalProducts ?? p?.total ?? 0,
        },
      };
    }
    const res = await adminApi.getProducts(params);
    const p = res.pagination;
    return {
      products: res.data.products,
      pagination: {
        currentPage: p?.currentPage ?? 1,
        totalPages: p?.totalPages ?? 1,
        totalProducts: p?.totalProducts ?? p?.total ?? 0,
      },
    };
  } catch {
    const fallback: Record<string, string | number> = {
      page,
      limit: PAGE_LIMIT,
      sort,
    };
    if (query) fallback.search = query;
    if (categoryFilter) fallback.category = categoryFilter;
    if (filter === 'featured') fallback.isFeatured = 'true';
    if (filter === 'active') fallback.isActive = 'true';
    if (filter === 'inactive') fallback.isActive = 'false';
    if (filter === 'premium') fallback.isPremium = 'true';
    const res = await adminApi.getProducts(fallback);
    const p = res.pagination;
    return {
      products: res.data.products,
      pagination: {
        currentPage: p?.currentPage ?? 1,
        totalPages: p?.totalPages ?? 1,
        totalProducts: p?.totalProducts ?? p?.total ?? 0,
      },
    };
  }
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 420);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState<'-createdAt' | '-viewCount' | 'viewCount' | '-soldCount' | 'soldCount'>('-createdAt');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const f = new URLSearchParams(window.location.search).get('filter');
      if (f === 'premium' || f === 'featured' || f === 'active' || f === 'inactive') {
        setQuickFilter(f);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const productsQueryKey = ['admin-products', debouncedSearch, sortBy, categoryFilter, quickFilter] as const;

  const {
    data,
    isLoading,
    isError: loadError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: productsQueryKey,
    queryFn: ({ pageParam = 1 }) =>
      fetchAdminProductsPage({
        page: pageParam,
        query: debouncedSearch,
        sort: sortBy,
        filter: quickFilter,
        categoryFilter,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const { currentPage, totalPages } = last.pagination;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
  });

  const products = data?.pages.flatMap((p) => p.products) ?? [];
  const pagination = data?.pages.at(-1)?.pagination ?? {
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
  };
  const isRefreshing = isRefetching && !isFetchingNextPage;

  useEffect(() => {
    if (!hasNextPage || isLoading || isFetchingNextPage || !loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: '240px' },
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isLoading, isFetchingNextPage, fetchNextPage]);

  const { data: catalogCategories = [] } = useQuery({
    queryKey: ['admin-catalog-categories'],
    queryFn: async () => {
      try {
        return await fetchAdminCatalogCategories();
      } catch {
        return [];
      }
    },
  });

  const productCategoryOptions = catalogCategories
    .filter((c) => !c.isGiftCategory && c.name.toLowerCase() !== 'gifting')
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  const filtered = products;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productApi.delete(id),
    onSuccess: () => {
      toast.success('Product deleted');
      setDeleteConfirm(null);
      void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to delete product');
    },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleSave = (savedProduct?: Product) => {
    setIsModalOpen(false);
    setEditProduct(null);
    if (savedProduct?._id) {
      queryClient.setQueriesData(
        { queryKey: ['admin-products'] },
        (old: unknown) => {
          if (!old || typeof old !== 'object' || !('pages' in old)) return old;
          const typed = old as {
            pages: ProductsPageData[];
            pageParams: unknown[];
          };
          let found = false;
          const pages = typed.pages.map((page) => {
            const idx = page.products.findIndex((p) => p._id === savedProduct._id);
            if (idx < 0) return page;
            found = true;
            const next = [...page.products];
            next[idx] = { ...page.products[idx], ...savedProduct };
            return { ...page, products: next };
          });
          if (found) return { ...typed, pages };
          const [first, ...rest] = typed.pages;
          if (!first) {
            return {
              ...typed,
              pages: [
                {
                  products: [savedProduct],
                  pagination: { currentPage: 1, totalPages: 1, totalProducts: 1 },
                },
              ],
            };
          }
          return {
            ...typed,
            pages: [
              {
                ...first,
                products: [savedProduct, ...first.products],
                pagination: {
                  ...first.pagination,
                  totalProducts: first.pagination.totalProducts + 1,
                },
              },
              ...rest,
            ],
          };
        },
      );
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
  };

  const stockMeta = (p: Product) => {
    const total = sumVariantStock(p);
    const breakdown = variantStockSummary(p);
    return { total, breakdown };
  };

  const stockClass = (total: number) => {
    if (total === 0) return 'text-red-600';
    if (total < LOW_STOCK_ALERT_EXCLUSIVE_MAX) return 'text-amber-600';
    return 'text-green-600';
  };

  const renderPrice = (product: Product) => {
    const d = getProductPriceDisplay(product);
    return (
      <>
        <p className="text-sm font-bold text-gray-900 leading-tight">{d.sellLabel}</p>
        {d.mrpLabel && (
          <p className="text-[11px] font-semibold text-gray-400 line-through mt-0.5">
            MRP {d.mrpLabel}
          </p>
        )}
        {d.spreadNote && (
          <p className="text-[10px] font-medium text-brand-600 mt-0.5">{d.spreadNote}</p>
        )}
      </>
    );
  };

  const handleRefresh = () => {
    void refetch();
  };

  return (
    <div className="p-4 sm:p-6 xl:p-8 max-w-[1600px] mx-auto space-y-6">
      <AdminPageHeader
        title="Products"
        description="Search, filter by category or status, sort by views or sales — edits sync with the storefront when active."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl border-gray-200"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link
              href="/shop"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:border-brand-300 hover:bg-brand-50/50 transition-colors"
            >
              <Eye className="h-4 w-4 text-brand-600" />
              View store
            </Link>
            <Button variant="brand" className="rounded-xl" onClick={() => { setEditProduct(null); setIsModalOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Add product
            </Button>
          </>
        }
      />

      {loadError && !isLoading && (
        <AdminErrorState
          title="Couldn’t load products"
          message="Verify the API is reachable and you are signed in as admin."
          onRetry={() => void refetch()}
        />
      )}

      {!loadError && (
      <section className="rounded-2xl border border-gray-200/80 bg-white shadow-[0_20px_50px_-28px_rgba(15,23,42,0.18)] flex flex-col">
        <div className="sticky top-0 z-20 px-4 sm:px-6 py-4 border-b border-gray-100 bg-white/95 backdrop-blur-md flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm rounded-t-2xl">
          <SearchField
              value={search}
              onChange={setSearch}
              placeholder="Search products by name, SKU, tags…"
              isLoading={isLoading && search.trim() !== debouncedSearch}
              className="flex-1"
              aria-label="Search products"
            />

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-9 min-w-[9.5rem] max-w-[14rem] px-3 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                aria-label="Filter by category"
              >
                <option value="">All categories</option>
                {productCategoryOptions.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-9 px-3 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="-createdAt">Newest First</option>
                <option value="-soldCount">Top Sold</option>
                <option value="soldCount">Least Sold</option>
                <option value="-viewCount">Most Viewed</option>
                <option value="viewCount">Least Viewed</option>
              </select>
              <span className='hidden sm:flex items-center rounded-lg bg-white border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-500'>
                {filtered.length} / {pagination.totalProducts || products.length} shown
              </span>

              <div className="flex items-center rounded-xl border border-gray-200 overflow-hidden bg-white mr-1">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`h-9 px-2.5 grid place-items-center ${viewMode === 'table' ? 'bg-navy-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                  title="Table view"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`h-9 px-2.5 grid place-items-center ${viewMode === 'grid' ? 'bg-navy-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                  title="Grid view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
              {[
                { id: 'all', label: 'All' },
                { id: 'premium', label: 'Premium', icon: Crown },
                { id: 'featured', label: 'Featured', icon: Sparkles },
                { id: 'active', label: 'Active', icon: CheckCircle2 },
                { id: 'inactive', label: 'Inactive', icon: EyeOff },
              ].map((f) => {
                const Icon = (f as any).icon as any;
                const active = quickFilter === (f as any).id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setQuickFilter(f.id as any)}
                    className={[
                      'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-200',
                      active
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-brand-300 hover:bg-brand-50',
                    ].join(' ')}
                  >
                    {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                    {f.label}
                  </button>
                );
              })}
            </div>
        </div>

        {/* Desktop / Tablet — List View */}
        {viewMode === 'table' && (
        <div className="hidden md:block overflow-x-auto overflow-y-hidden">
          <table className="w-full min-w-[700px] text-sm border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50/80 to-white text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="text-left px-5 py-4 font-bold">Product</th>
                <th className="text-left px-4 py-4 font-bold">Category</th>
                <th className="text-left px-4 py-4 font-bold">Price</th>
                <th className="text-left px-4 py-4 font-bold">Stock</th>
                <th className="text-left px-4 py-4 font-bold">Metrics</th>
                <th className="text-left px-4 py-4 font-bold">Status</th>
                <th className="text-right px-5 py-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.map((product) => {
                const sm = stockMeta(product);
                return (
                <tr key={product._id} className="group hover:bg-brand-50/40 transition-all hover:shadow-[inset_4px_0_0_0_#0284c7] hover:bg-gradient-to-r hover:from-brand-50/50 hover:to-transparent">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 flex-shrink-0" style={{ aspectRatio: '3/4' }}>
                        <OrderLineThumbnail
                          image={adminProductListThumbnail(product)}
                          name={product.name}
                          className="h-full w-full rounded-lg shadow-sm group-hover:shadow transition-shadow"
                          sizes="40px"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate max-w-[200px] group-hover:text-brand-700 transition-colors">{product.name}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {isAdminPremiumProduct(product) && <AdminPremiumBadge compact />}
                          {product.isFeatured && <Badge variant="brand" className="text-[10px] px-1.5 py-0">Featured</Badge>}
                          {product.fabric && <span className="text-xs font-semibold text-gray-500">{product.fabric}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">{product.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    {renderPrice(product)}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className={`text-sm font-bold ${stockClass(sm.total)}`}>
                        {sm.total === 0 ? 'Out of stock' : `${sm.total} in stock`}
                      </span>
                      {sm.breakdown && (
                        <p className="text-[10px] font-semibold text-gray-500 mt-0.5 max-w-[140px]" title="Stock per variant">
                          {sm.breakdown}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="inline-flex items-center gap-1 bg-white text-gray-600 px-2 py-0.5 rounded-md font-bold border border-gray-200 shadow-sm">
                        <List className="h-3 w-3 text-gray-400" /> {product.soldCount || 0} sold
                      </span>
                      <span className="inline-flex items-center gap-1 bg-indigo-50/50 text-indigo-700 px-2 py-0.5 rounded-md font-bold border border-indigo-100 shadow-sm">
                        <Eye className="h-3 w-3 text-indigo-400" />
                        {product.viewCount || 0} views
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={product.isActive ? 'success' : 'error'} className="text-[11px] font-bold">
                      {product.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditProduct(product); setIsModalOpen(true); }}
                        className="p-2 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors border border-transparent hover:border-brand-200 shadow-sm"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(product._id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200 shadow-sm"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
        )}

        {viewMode === 'grid' && (
          <div className="hidden md:grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 p-4">
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <div key={i} className="h-72 rounded-2xl bg-gray-100 animate-pulse" />
              ))
            ) : filtered.map((product) => {
              const sm = stockMeta(product);
              return (
              <div key={product._id} className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="relative w-full bg-gray-100" style={{ aspectRatio: '3/4' }}>
                  <OrderLineThumbnail
                    image={adminProductListThumbnail(product)}
                    name={product.name}
                    className="h-full w-full rounded-none border-0"
                    sizes="320px"
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2">{product.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                  <div className="mt-2 flex items-center justify-between">
                    {renderPrice(product)}
                    <Badge variant={product.isActive ? 'success' : 'error'} className="text-[11px]">
                      {product.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className={`text-xs font-semibold mt-1.5 ${stockClass(sm.total)}`}>
                    {sm.total === 0 ? 'Out of stock' : `${sm.total} in stock`}
                    {sm.breakdown && (
                      <span className="block font-normal text-gray-400 text-[10px]">Variants: {sm.breakdown}</span>
                    )}
                  </p>
                  <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs font-medium text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" /></svg>
                      {product.viewCount || 0}
                    </span>
                    <span className="text-navy-700 bg-navy-50 px-2.5 py-0.5 rounded-full">{product.soldCount || 0} sold</span>
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button onClick={() => { setEditProduct(product); setIsModalOpen(true); }} className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleteConfirm(product._id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}

        {/* Mobile cards - respect selected list/grid mode */}
        {viewMode === 'table' && (
          <div className="md:hidden divide-y divide-gray-100">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="p-4">
                  <div className="h-4 bg-gray-100 rounded animate-pulse" />
                </div>
              ))
            ) : (
              filtered.map((product) => {
                const sm = stockMeta(product);
                return (
                <div key={product._id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-16 flex-shrink-0" style={{ aspectRatio: '3/4' }}>
                      <OrderLineThumbnail
                        image={adminProductListThumbnail(product)}
                        name={product.name}
                        className="h-full w-full rounded-xl"
                        sizes="64px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {product.category}{product.fabric ? ` · ${product.fabric}` : ''}
                      </p>
                      <div className="mt-2 space-y-0.5">
                        {renderPrice(product)}
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                        {isAdminPremiumProduct(product) && <AdminPremiumBadge compact />}
                        {product.isFeatured && <Badge variant="brand" className="text-[11px]">Featured</Badge>}
                        <Badge variant={product.isActive ? 'success' : 'error'} className="text-[11px]">
                          {product.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className={`text-xs font-semibold ${stockClass(sm.total)}`}>
                          {sm.total === 0 ? 'Out of stock' : `${sm.total} in stock`}
                          {sm.breakdown && (
                            <span className="block font-normal text-gray-400 text-[10px]">Variants: {sm.breakdown}</span>
                          )}
                        </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditProduct(product); setIsModalOpen(true); }}
                        className="h-9 w-9 rounded-xl border border-gray-200 bg-white hover:bg-brand-50 hover:border-brand-200 text-gray-600 hover:text-brand-700 transition-colors grid place-items-center"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(product._id)}
                        className="h-9 w-9 rounded-xl border border-gray-200 bg-white hover:bg-red-50 hover:border-red-200 text-gray-600 hover:text-red-700 transition-colors grid place-items-center"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
              })
            )}
          </div>
        )}

        {viewMode === 'grid' && (
          <div className="md:hidden grid grid-cols-2 gap-3 p-3">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
              ))
            ) : (
              filtered.map((product) => {
                const sm = stockMeta(product);
                return (
                  <div key={product._id} className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
                    <div className="relative w-full bg-gray-100" style={{ aspectRatio: '3/4' }}>
                      <OrderLineThumbnail
                        image={adminProductListThumbnail(product)}
                        name={product.name}
                        className="h-full w-full rounded-none border-0"
                        sizes="180px"
                      />
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-semibold text-gray-900 line-clamp-2">{product.name}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{product.category}</p>
                      <div className="mt-1.5">
                        {renderPrice(product)}
                        <div className="mt-1 flex items-center justify-between gap-2">
                        <Badge variant={product.isActive ? 'success' : 'error'} className="text-[10px]">
                          {product.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        </div>
                      </div>
                      <p className={`mt-1 text-[10px] font-semibold ${stockClass(sm.total)}`}>
                        {sm.total === 0 ? 'Out of stock' : `${sm.total} in stock`}
                      </p>
                      <div className="mt-2 flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => { setEditProduct(product); setIsModalOpen(true); }}
                          className="h-8 w-8 rounded-lg border border-gray-200 bg-white text-gray-600 grid place-items-center"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(product._id)}
                          className="h-8 w-8 rounded-lg border border-gray-200 bg-white text-gray-600 grid place-items-center"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {!isLoading && filtered.length === 0 && !loadError && (
          <div className="py-12 text-center text-gray-500 text-sm px-4">
            No products match your filters.{' '}
            <button type="button" onClick={() => setIsModalOpen(true)} className="font-semibold text-brand-600 hover:underline">
              Add a product
            </button>
          </div>
        )}
        <div ref={loadMoreRef} className="h-px" aria-hidden />
      </section>
      )}

      {isFetchingNextPage && (
        <div className="py-6 flex justify-center">
          <div className="h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4 text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
            <p className="font-semibold text-gray-900">Delete this product?</p>
            <p className="text-sm text-gray-500">This action cannot be undone. All images will be removed from Cloudinary.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={() => handleDelete(deleteConfirm)}>Delete</Button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <ProductFormModal
          product={editProduct}
          onClose={() => { setIsModalOpen(false); setEditProduct(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
