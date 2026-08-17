'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  SaleCampaign,
  Category,
  SubCategory,
  Product,
  PromoScopeType,
} from '@/types';
import { saleCampaignApi, adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ImageUploader from '@/components/ui/ImageUploader';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { UPLOAD_MAX_MB } from '@/lib/uploadLimits';

interface Props {
  campaign: SaleCampaign | null;
  onClose: () => void;
  onSave: () => void;
}

type DiscountType = 'percentage' | 'flat' | 'fixed';

const selectClass =
  'w-full h-10 px-3 rounded-xl text-sm bg-white/60 border border-white/40 focus:outline-none focus:ring-2 focus:ring-brand-500/40 backdrop-blur-sm';

function valueLabel(type: DiscountType) {
  if (type === 'percentage') return 'Discount (%) *';
  if (type === 'fixed') return 'Sell at price (₹) *';
  return 'Flat off (₹) *';
}

function scopeValidationError(data: {
  scopeType: PromoScopeType;
  categoryIds: string[];
  subcategoryIds: string[];
  productIds: string[];
}): string | null {
  if (data.scopeType === 'categories' && data.categoryIds.length === 0) {
    return 'Select at least one category';
  }
  if (data.scopeType === 'subcategories' && data.subcategoryIds.length === 0) {
    return 'Select at least one subcategory';
  }
  if (data.scopeType === 'products' && data.productIds.length === 0) {
    return 'Select at least one product';
  }
  return null;
}

export default function SaleCampaignFormModal({ campaign, onClose, onSave }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [productQuery, setProductQuery] = useState('');
  const [productHits, setProductHits] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [clearImage, setClearImage] = useState(false);
  const existingImageUrl = clearImage ? null : campaign?.imageUrl || null;
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    description: campaign?.description || '',
    badgeText: campaign?.badgeText || 'Sale',
    discountType: (campaign?.discountType || 'percentage') as DiscountType,
    discountValue: campaign?.discountValue?.toString() || '',
    maxDiscountPerItem: campaign?.maxDiscountPerItem?.toString() || '',
    showOnStorefront: campaign?.showOnStorefront !== false,
    scopeType: (campaign?.scopeType || 'all') as PromoScopeType,
    categoryIds: (campaign?.categoryIds || []).map(String),
    subcategoryIds: (campaign?.subcategoryIds || []).map(String),
    productIds: (campaign?.productIds || []).map(String),
    startDate: campaign?.startDate
      ? new Date(campaign.startDate).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    endDate: campaign ? new Date(campaign.endDate).toISOString().slice(0, 16) : '',
    isActive: campaign?.isActive !== undefined ? campaign.isActive : true,
  });

  useEffect(() => {
    Promise.all([adminApi.getCategories({ active: false }), adminApi.getSubcategories()])
      .then(([catRes, subRes]) => {
        setCategories(catRes.data?.categories || []);
        setSubcategories(subRes.data?.subcategories || []);
      })
      .catch(() => {});
  }, []);

  // Pre-load selected products when editing a product-scoped sale
  useEffect(() => {
    const ids = (campaign?.productIds || []).map(String);
    if (!ids.length) {
      setSelectedProducts([]);
      return;
    }
    Promise.all(
      ids.map((id) =>
        adminApi.getProductById(id).then((res) => (res.data?.product as Product) ?? null).catch(() => null),
      ),
    ).then((products) => setSelectedProducts(products.filter(Boolean) as Product[]));
  }, [campaign?._id, campaign?.productIds]);

  useEffect(() => {
    if (formData.scopeType !== 'products' || productQuery.trim().length < 2) {
      setProductHits([]);
      return;
    }
    const t = window.setTimeout(() => {
      adminApi
        .searchProducts({ q: productQuery.trim(), limit: 12 })
        .then((res) => setProductHits((res.data?.products || []) as Product[]))
        .catch(() => setProductHits([]));
    }, 250);
    return () => window.clearTimeout(t);
  }, [productQuery, formData.scopeType]);

  const toggleId = (
    field: 'categoryIds' | 'subcategoryIds' | 'productIds',
    id: string,
  ) => {
    setFormData((prev) => {
      const set = new Set(prev[field]);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...prev, [field]: Array.from(set) };
    });
  };

  const onPickImage = (files: File[]) => {
    const file = files[0] ?? null;
    setImageFile(file);
    if (file) setClearImage(false);
  };

  const removeImage = () => {
    setImageFile(null);
    setClearImage(true);
  };

  const refreshPreview = async () => {
    try {
      const res = await saleCampaignApi.preview({
        scopeType: formData.scopeType,
        categoryIds: formData.scopeType === 'categories' ? formData.categoryIds : [],
        subcategoryIds:
          formData.scopeType === 'subcategories' ? formData.subcategoryIds : [],
        productIds: formData.scopeType === 'products' ? formData.productIds : [],
      });
      setPreviewCount(Number((res.data as { count?: number })?.count ?? 0));
    } catch {
      setPreviewCount(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter a sale name');
      return;
    }
    if (!formData.discountValue || Number(formData.discountValue) <= 0) {
      toast.error('Please enter a valid discount value');
      return;
    }
    if (!formData.endDate) {
      toast.error('Please set an end date');
      return;
    }
    const scopeErr = scopeValidationError(formData);
    if (scopeErr) {
      toast.error(scopeErr);
      return;
    }
    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', formData.name.trim());
      if (formData.description) fd.append('description', formData.description);
      fd.append('badgeText', formData.badgeText || 'Sale');
      fd.append('discountType', formData.discountType);
      fd.append('discountValue', String(Number(formData.discountValue)));
      if (formData.discountType === 'percentage' && formData.maxDiscountPerItem) {
        fd.append('maxDiscountPerItem', String(Number(formData.maxDiscountPerItem)));
      }
      fd.append('showOnStorefront', String(formData.showOnStorefront));
      fd.append('scopeType', formData.scopeType);
      fd.append(
        'categoryIds',
        JSON.stringify(formData.scopeType === 'categories' ? formData.categoryIds : []),
      );
      fd.append(
        'subcategoryIds',
        JSON.stringify(formData.scopeType === 'subcategories' ? formData.subcategoryIds : []),
      );
      fd.append(
        'productIds',
        JSON.stringify(formData.scopeType === 'products' ? formData.productIds : []),
      );
      fd.append('startDate', new Date(formData.startDate).toISOString());
      fd.append('endDate', new Date(formData.endDate).toISOString());
      fd.append('isActive', String(formData.isActive));
      if (imageFile) fd.append('image', imageFile);
      if (clearImage && !imageFile) fd.append('clearImage', 'true');

      if (campaign) {
        await saleCampaignApi.update(campaign._id, fd);
        toast.success('Sale updated');
      } else {
        await saleCampaignApi.create(fd);
        toast.success('Sale created');
      }
      onSave();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to save sale');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/55 backdrop-blur-sm p-3 sm:p-6">
      <div
        className={cn(
          'w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-3xl',
          'bg-white/75 backdrop-blur-xl border border-white/50 shadow-2xl shadow-navy-900/20',
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/40 bg-gradient-to-r from-navy-900/90 to-brand-700/90 text-white">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 font-semibold">Catalog</p>
            <h2 className="text-lg font-serif font-bold">
              {campaign ? 'Edit Sale' : 'Create Sale'}
            </h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white rounded-full p-1.5 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[calc(92vh-8rem)] overflow-y-auto">
          <div>
            <ImageUploader
              maxFiles={1}
              aspectRatio="3:4"
              maxSizeMB={UPLOAD_MAX_MB.sale}
              label="Sale popup image"
              hint="Crop frame = what shoppers see on the visit popup. Keep key text and product inside the box."
              existingImages={imageFile ? [] : existingImageUrl ? [existingImageUrl] : []}
              onRemoveExisting={removeImage}
              onChange={onPickImage}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Sale name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Monsoon Sale"
              />
            </div>
            <Input
              label="Badge text"
              value={formData.badgeText}
              onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
              placeholder="Sale"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount type *</label>
              <select
                value={formData.discountType}
                onChange={(e) =>
                  setFormData({ ...formData, discountType: e.target.value as DiscountType })
                }
                className={selectClass}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat off (₹)</option>
                <option value="fixed">Direct sell price (₹)</option>
              </select>
            </div>
            <Input
              label={valueLabel(formData.discountType)}
              type="number"
              value={formData.discountValue}
              onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
              required
              placeholder={formData.discountType === 'fixed' ? '1150' : undefined}
            />
            {formData.discountType === 'percentage' ? (
              <Input
                label="Max discount per item (₹)"
                type="number"
                value={formData.maxDiscountPerItem}
                onChange={(e) => setFormData({ ...formData, maxDiscountPerItem: e.target.value })}
              />
            ) : null}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start *</label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className={selectClass}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End *</label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className={selectClass}
                required
              />
            </div>
          </div>

          {formData.discountType === 'fixed' ? (
            <p className="text-xs text-gray-500 rounded-xl bg-white/50 px-3 py-2 border border-white/60">
              Products in this sale will sell at this price (e.g. ₹1150) when MRP is higher.
            </p>
          ) : null}

          <div className="rounded-2xl bg-white/50 border border-white/60 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-800">Apply sale to</p>
              <button
                type="button"
                onClick={refreshPreview}
                className="text-xs font-medium text-brand-700 hover:underline"
              >
                Preview count{previewCount != null ? `: ${previewCount}` : ''}
              </button>
            </div>
            <select
              value={formData.scopeType}
              onChange={(e) => setFormData({ ...formData, scopeType: e.target.value as PromoScopeType })}
              className={selectClass}
            >
              <option value="all">All products</option>
              <option value="categories">Categories</option>
              <option value="subcategories">Subcategories</option>
              <option value="products">Specific products</option>
            </select>

            {formData.scopeType === 'categories' ? (
              <div className="max-h-40 overflow-y-auto space-y-1.5">
                {categories.map((c) => (
                  <label key={c._id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.categoryIds.includes(c._id)}
                      onChange={() => toggleId('categoryIds', c._id)}
                      className="rounded text-brand-600"
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            ) : null}

            {formData.scopeType === 'subcategories' ? (
              <div className="max-h-40 overflow-y-auto space-y-1.5">
                {subcategories.map((s) => (
                  <label key={s._id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.subcategoryIds.includes(s._id)}
                      onChange={() => toggleId('subcategoryIds', s._id)}
                      className="rounded text-brand-600"
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            ) : null}

            {formData.scopeType === 'products' ? (
              <div className="space-y-2">
                {formData.productIds.length > 0 ? (
                  <div className="rounded-lg bg-brand-50/60 border border-brand-100 px-3 py-2 space-y-1">
                    <p className="text-xs font-semibold text-brand-800">
                      Selected ({formData.productIds.length})
                    </p>
                    <div className="max-h-28 overflow-y-auto space-y-1">
                      {selectedProducts.map((p) => (
                        <label key={p._id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.productIds.includes(p._id)}
                            onChange={() => {
                              toggleId('productIds', p._id);
                              if (formData.productIds.includes(p._id)) {
                                setSelectedProducts((prev) => prev.filter((x) => x._id !== p._id));
                              }
                            }}
                            className="rounded text-brand-600"
                          />
                          <span className="truncate">{p.name}</span>
                        </label>
                      ))}
                      {selectedProducts.length < formData.productIds.length ? (
                        <p className="text-xs text-gray-400 pl-6">
                          {formData.productIds.length - selectedProducts.length} product(s) loading…
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                <Input
                  label="Search products"
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Type name to add more…"
                />
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {productHits
                    .filter((p) => !formData.productIds.includes(p._id))
                    .map((p) => (
                      <label key={p._id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={() => {
                            toggleId('productIds', p._id);
                            setSelectedProducts((prev) =>
                              prev.some((x) => x._id === p._id) ? prev : [...prev, p],
                            );
                          }}
                          className="rounded text-brand-600"
                        />
                        <span className="truncate">{p.name}</span>
                      </label>
                    ))}
                </div>
              </div>
            ) : null}
          </div>

          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.showOnStorefront}
              onChange={(e) => setFormData({ ...formData, showOnStorefront: e.target.checked })}
              className="rounded text-brand-600"
            />
            <span className="text-sm text-gray-700">Show on storefront visit popup</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded text-brand-600"
            />
            <span className="text-sm text-gray-700">Active</span>
          </label>
        </form>

        <div className="flex gap-3 p-5 border-t border-white/40 bg-white/40">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="brand"
            className="flex-1"
            loading={isSaving}
            onClick={handleSubmit as unknown as React.MouseEventHandler}
          >
            {campaign ? 'Update Sale' : 'Create Sale'}
          </Button>
        </div>
      </div>
    </div>
  );
}
