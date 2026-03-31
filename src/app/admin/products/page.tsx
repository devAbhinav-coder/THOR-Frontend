'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Plus, Pencil, Trash2, AlertTriangle, Sparkles, CheckCircle2, EyeOff, LayoutGrid, List } from 'lucide-react';
import { productApi } from '@/lib/api';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { sumVariantStock, variantStockSummary } from '@/lib/productStock';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchField } from '@/components/ui/SearchField';
import ProductFormModal from '@/components/admin/ProductFormModal';
import toast from 'react-hot-toast';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 420);
  const [quickFilter, setQuickFilter] = useState<'all' | 'featured' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'-createdAt' | '-viewCount' | 'viewCount' | '-soldCount' | 'soldCount'>('-createdAt');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalProducts: 0 });

  const fetchProducts = useCallback(async (page = 1, query = '', sort = '-createdAt') => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20, sort };
      if (query) params.search = query;
      const res = await productApi.getAll(params);
      setProducts(res.data.products);
      const p = res.pagination;
      setPagination({
        currentPage: p?.currentPage ?? 1,
        totalPages: p?.totalPages ?? 1,
        totalProducts: p?.totalProducts ?? p?.total ?? 0,
      });
    } catch {
      // silent fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(1, debouncedSearch, sortBy);
  }, [debouncedSearch, sortBy, fetchProducts]);

  const filtered = products.filter((p) => {
    if (quickFilter === 'featured') return !!p.isFeatured;
    if (quickFilter === 'active') return !!p.isActive;
    if (quickFilter === 'inactive') return !p.isActive;
    return true;
  });

  const handleDelete = async (id: string) => {
    try {
      await productApi.delete(id);
      toast.success('Product deleted');
      setDeleteConfirm(null);
      fetchProducts(1, debouncedSearch, sortBy);
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to delete product');
    }
  };

  const handleSave = () => {
    setIsModalOpen(false);
    setEditProduct(null);
    fetchProducts(1, debouncedSearch, sortBy);
  };

  const stockMeta = (p: Product) => {
    const total = sumVariantStock(p);
    const breakdown = variantStockSummary(p);
    return { total, breakdown };
  };

  const stockClass = (total: number) => {
    if (total === 0) return 'text-red-600';
    if (total <= 2) return 'text-amber-700';
    if (total <= 5) return 'text-amber-600';
    return 'text-green-600';
  };

  return (
    <div className="p-6 xl:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm">{pagination.totalProducts} products total</p>
        </div>
        <Button variant="brand" onClick={() => { setEditProduct(null); setIsModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Product
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
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
                      'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors',
                      active
                        ? 'bg-brand-600 text-white border-brand-600'
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
        </div>

        {/* Desktop table */}
        {viewMode === 'table' && <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Price</th>
                <th className="text-left px-4 py-3">Stock</th>
                <th className="text-left px-4 py-3">Metrics</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
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
                <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      {/* Portrait 3:4 thumbnail */}
                      <div className="relative w-10 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100" style={{ aspectRatio: '3/4' }}>
                        <Image
                          src={product.images[0]?.url || '/placeholder.jpg'}
                          alt={product.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{product.name}</p>
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          {product.isFeatured && <Badge variant="brand" className="text-xs">Featured</Badge>}
                          {product.fabric && <span className="text-xs text-gray-400">{product.fabric}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">{product.category}</span>
                    {product.fabric && <p className="text-xs text-gray-400">{product.fabric}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900">{formatPrice(product.price)}</p>
                    {product.comparePrice && (
                      <p className="text-xs text-gray-400 line-through">{formatPrice(product.comparePrice)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className={`text-sm font-medium ${stockClass(sm.total)}`}>
                        {sm.total === 0 ? 'Out' : sm.total}
                      </span>
                      {sm.breakdown && (
                        <p className="text-[10px] text-gray-400 mt-0.5 max-w-[140px]" title="Stock per variant row (same order as in editor)">
                          By variant: {sm.breakdown}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-600 px-2 py-0.5 rounded font-medium border border-gray-100">
                        <List className="h-3 w-3" /> {product.soldCount || 0} sold
                      </span>
                      <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-medium border border-indigo-100">
                        <EyeOff className="h-3 w-3 hidden" /><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" /></svg>
                        {product.viewCount || 0} views
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={product.isActive ? 'success' : 'error'} className="text-xs">
                      {product.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEditProduct(product); setIsModalOpen(true); }}
                        className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(product._id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
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
        </div>}

        {viewMode === 'grid' && (
          <div className="hidden lg:grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 p-4">
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <div key={i} className="h-72 rounded-2xl bg-gray-100 animate-pulse" />
              ))
            ) : filtered.map((product) => {
              const sm = stockMeta(product);
              return (
              <div key={product._id} className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="relative w-full bg-gray-100" style={{ aspectRatio: '3/4' }}>
                  <Image src={product.images[0]?.url || '/placeholder.jpg'} alt={product.name} fill sizes="320px" className="object-cover" />
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2">{product.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-900">{formatPrice(product.price)}</p>
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

        {/* Mobile cards */}
        <div className="lg:hidden divide-y divide-gray-100">
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
                  <div className="relative w-16 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100" style={{ aspectRatio: '3/4' }}>
                    <Image
                      src={product.images[0]?.url || '/placeholder.jpg'}
                      alt={product.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {product.category}{product.fabric ? ` · ${product.fabric}` : ''}
                    </p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {product.isFeatured && <Badge variant="brand" className="text-[11px]">Featured</Badge>}
                      <Badge variant={product.isActive ? 'success' : 'error'} className="text-[11px]">
                        {product.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="text-xs font-semibold text-gray-900">{formatPrice(product.price)}</span>
                      <span className={`text-xs font-semibold ${stockClass(sm.total)}`}>
                        {sm.total === 0 ? 'Out of stock' : `${sm.total} in stock`}
                        {sm.breakdown && (
                          <span className="block font-normal text-gray-400 text-[10px]">Variants: {sm.breakdown}</span>
                        )}
                      </span>
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

        {!isLoading && filtered.length === 0 && (
          <div className="py-12 text-center text-gray-500 text-sm">
            No products found. <button onClick={() => setIsModalOpen(true)} className="text-brand-600">Add one?</button>
          </div>
        )}
      </div>

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
