'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Coupon, Category, SubCategory, Product, PromoScopeType } from '@/types';
import { couponApi, adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ImageUploader from '@/components/ui/ImageUploader';
import toast from 'react-hot-toast';
import { UPLOAD_MAX_MB } from '@/lib/uploadLimits';

interface Props {
  coupon: Coupon | null;
  onClose: () => void;
  onSave: () => void;
}

const field =
  'w-full h-10 px-3 rounded-lg text-sm bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-900/15 focus:border-navy-900/30';

export default function CouponFormModal({ coupon, onClose, onSave }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [productQuery, setProductQuery] = useState('');
  const [productHits, setProductHits] = useState<Product[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [clearImage, setClearImage] = useState(false);
  const existingImageUrl = clearImage ? null : coupon?.imageUrl || null;

  const [formData, setFormData] = useState({
    code: coupon?.code || '',
    description: coupon?.description || '',
    displayTitle: coupon?.displayTitle || '',
    showOnStorefront: coupon?.showOnStorefront !== false,
    discountType: coupon?.discountType || ('percentage' as 'percentage' | 'flat' | 'fixed'),
    discountValue: coupon?.discountValue?.toString() || '',
    minOrderAmount: coupon?.minOrderAmount?.toString() || '',
    maxDiscountAmount: coupon?.maxDiscountAmount?.toString() || '',
    usageLimit: coupon?.usageLimit?.toString() || '',
    userUsageLimit: coupon?.userUsageLimit || 1,
    eligibilityType: coupon?.eligibilityType || ('all' as 'all' | 'first_order' | 'returning'),
    minCompletedOrders: coupon?.minCompletedOrders || 0,
    maxCompletedOrders: coupon?.maxCompletedOrders?.toString() || '',
    startDate: coupon?.startDate
      ? new Date(coupon.startDate).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    expiryDate: coupon ? new Date(coupon.expiryDate).toISOString().slice(0, 16) : '',
    isActive: coupon?.isActive !== undefined ? coupon.isActive : true,
    scopeType: (coupon?.scopeType || 'all') as PromoScopeType,
    applicableCategoryIds: (coupon?.applicableCategoryIds || []).map(String),
    applicableSubcategoryIds: (coupon?.applicableSubcategoryIds || []).map(String),
    applicableProductIds: (coupon?.applicableProductIds || []).map(String),
  });

  useEffect(() => {
    Promise.all([adminApi.getCategories({ active: false }), adminApi.getSubcategories()])
      .then(([catRes, subRes]) => {
        setCategories(catRes.data?.categories || []);
        setSubcategories(subRes.data?.subcategories || []);
      })
      .catch(() => {});
  }, []);

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
    fieldName: 'applicableCategoryIds' | 'applicableSubcategoryIds' | 'applicableProductIds',
    id: string,
  ) => {
    setFormData((prev) => {
      const set = new Set(prev[fieldName]);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...prev, [fieldName]: Array.from(set) };
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.expiryDate) {
      toast.error('Please set an expiry date');
      return;
    }
    if (formData.scopeType === 'categories' && !formData.applicableCategoryIds.length) {
      toast.error('Select at least one category');
      return;
    }
    if (formData.scopeType === 'subcategories' && !formData.applicableSubcategoryIds.length) {
      toast.error('Select at least one subcategory');
      return;
    }
    if (formData.scopeType === 'products' && !formData.applicableProductIds.length) {
      toast.error('Select at least one product');
      return;
    }

    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append('code', formData.code.toUpperCase());
      if (formData.description) fd.append('description', formData.description);
      if (formData.displayTitle) fd.append('displayTitle', formData.displayTitle);
      fd.append('showOnStorefront', String(formData.showOnStorefront));
      fd.append('discountType', formData.discountType);
      fd.append('discountValue', String(Number(formData.discountValue)));
      if (formData.minOrderAmount) fd.append('minOrderAmount', String(Number(formData.minOrderAmount)));
      if (formData.maxDiscountAmount) {
        fd.append('maxDiscountAmount', String(Number(formData.maxDiscountAmount)));
      }
      if (formData.usageLimit) fd.append('usageLimit', String(Number(formData.usageLimit)));
      fd.append('userUsageLimit', String(Number(formData.userUsageLimit)));
      fd.append('eligibilityType', formData.eligibilityType);
      fd.append('minCompletedOrders', String(Number(formData.minCompletedOrders || 0)));
      if (formData.maxCompletedOrders !== '') {
        fd.append('maxCompletedOrders', String(Number(formData.maxCompletedOrders)));
      }
      fd.append('startDate', new Date(formData.startDate).toISOString());
      fd.append('expiryDate', new Date(formData.expiryDate).toISOString());
      fd.append('isActive', String(formData.isActive));
      fd.append('scopeType', formData.scopeType);
      fd.append(
        'applicableCategoryIds',
        JSON.stringify(formData.scopeType === 'categories' ? formData.applicableCategoryIds : []),
      );
      fd.append(
        'applicableSubcategoryIds',
        JSON.stringify(
          formData.scopeType === 'subcategories' ? formData.applicableSubcategoryIds : [],
        ),
      );
      fd.append(
        'applicableProductIds',
        JSON.stringify(formData.scopeType === 'products' ? formData.applicableProductIds : []),
      );
      if (imageFile) fd.append('image', imageFile);
      if (clearImage && !imageFile) fd.append('clearImage', 'true');

      if (coupon) {
        await couponApi.update(coupon._id, fd);
        toast.success('Coupon updated');
      } else {
        await couponApi.create(fd);
        toast.success('Coupon created');
      }
      onSave();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to save coupon');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="w-full sm:max-w-xl max-h-[94vh] overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400 font-semibold">Offers</p>
            <h2 className="text-lg font-serif font-semibold text-navy-900">
              {coupon ? 'Edit coupon' : 'New coupon'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {/* Banner upload — crop matches visit popup (3:4) */}
          <div>
            <ImageUploader
              maxFiles={1}
              aspectRatio="3:4"
              maxSizeMB={UPLOAD_MAX_MB.coupon}
              label="Offer image (visit popup)"
              hint="Crop frame = what shoppers see on the visit popup. Keep important content inside the box."
              existingImages={imageFile ? [] : existingImageUrl ? [existingImageUrl] : []}
              onRemoveExisting={removeImage}
              onChange={onPickImage}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Input
                label="Code *"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="SAVE20"
                required
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            <Input
              label="Title on card"
              value={formData.displayTitle}
              onChange={(e) => setFormData({ ...formData, displayTitle: e.target.value })}
              placeholder="Festive offer"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select
                value={formData.discountType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountType: e.target.value as 'percentage' | 'flat' | 'fixed',
                  })
                }
                className={field}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat off (₹)</option>
                <option value="fixed">Direct price (₹)</option>
              </select>
            </div>
            <Input
              label={
                formData.discountType === 'percentage'
                  ? 'Value (%) *'
                  : formData.discountType === 'fixed'
                    ? 'Pay / cart at (₹) *'
                    : 'Value (₹) *'
              }
              type="number"
              value={formData.discountValue}
              onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
              required
              placeholder={formData.discountType === 'fixed' ? '1150' : undefined}
            />
            <Input
              label="Min order (₹)"
              type="number"
              value={formData.minOrderAmount}
              onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
              placeholder="0"
            />
            {formData.discountType === 'percentage' && (
              <Input
                label="Max discount (₹)"
                type="number"
                value={formData.maxDiscountAmount}
                onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                placeholder="No limit"
              />
            )}
            {formData.discountType === 'fixed' ? (
              <p className="sm:col-span-2 text-xs text-gray-500">
                Eligible cart amount will be charged at this price (e.g. ₹1150). Extra above that is
                the discount.
              </p>
            ) : null}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Starts *</label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className={field}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expires *</label>
              <input
                type="datetime-local"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className={field}
                required
              />
            </div>
            <Input
              label="Total uses"
              type="number"
              value={formData.usageLimit}
              onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
              placeholder="Unlimited"
            />
            <Input
              label="Per user"
              type="number"
              value={formData.userUsageLimit}
              onChange={(e) =>
                setFormData({ ...formData, userUsageLimit: parseInt(e.target.value) || 1 })
              }
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Who can use</label>
              <select
                value={formData.eligibilityType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    eligibilityType: e.target.value as 'all' | 'first_order' | 'returning',
                  })
                }
                className={field}
              >
                <option value="all">Everyone</option>
                <option value="first_order">First order only</option>
                <option value="returning">Returning only</option>
              </select>
            </div>
            <Input
              label="Min completed orders"
              type="number"
              value={formData.minCompletedOrders}
              onChange={(e) =>
                setFormData({ ...formData, minCompletedOrders: parseInt(e.target.value) || 0 })
              }
            />
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Applies to</p>
            <select
              value={formData.scopeType}
              onChange={(e) => setFormData({ ...formData, scopeType: e.target.value as PromoScopeType })}
              className={field}
            >
              <option value="all">Entire cart</option>
              <option value="categories">Categories</option>
              <option value="subcategories">Subcategories</option>
              <option value="products">Products</option>
            </select>

            {formData.scopeType === 'categories' ?
              <div className="max-h-36 overflow-y-auto space-y-1.5 pt-1">
                {categories.map((c) => (
                  <label key={c._id} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.applicableCategoryIds.includes(c._id)}
                      onChange={() => toggleId('applicableCategoryIds', c._id)}
                      className="rounded border-gray-300 text-navy-900"
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            : null}

            {formData.scopeType === 'subcategories' ?
              <div className="max-h-36 overflow-y-auto space-y-1.5 pt-1">
                {subcategories.map((s) => (
                  <label key={s._id} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.applicableSubcategoryIds.includes(s._id)}
                      onChange={() => toggleId('applicableSubcategoryIds', s._id)}
                      className="rounded border-gray-300 text-navy-900"
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            : null}

            {formData.scopeType === 'products' ?
              <div className="space-y-2 pt-1">
                <Input
                  label="Search products"
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Type name…"
                />
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {productHits.map((p) => (
                    <label key={p._id} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={formData.applicableProductIds.includes(p._id)}
                        onChange={() => toggleId('applicableProductIds', p._id)}
                        className="rounded border-gray-300 text-navy-900"
                      />
                      <span className="truncate">{p.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            : null}
          </div>

          <Input
            label="Short description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Shown under the offer"
          />

          <div className="flex flex-wrap gap-4 text-sm text-gray-700">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-navy-900"
              />
              Active
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.showOnStorefront}
                onChange={(e) => setFormData({ ...formData, showOnStorefront: e.target.checked })}
                className="rounded border-gray-300 text-navy-900"
              />
              Show on visit popup
            </label>
          </div>
        </form>

        <div className="flex gap-2 p-4 border-t border-gray-100 bg-white shrink-0">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="brand"
            className="flex-1"
            loading={isSaving}
            onClick={handleSubmit as unknown as React.MouseEventHandler}
          >
            {coupon ? 'Save' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  );
}
