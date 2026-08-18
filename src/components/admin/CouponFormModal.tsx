'use client';

import { useEffect, useState } from 'react';
import {
  Tag,
  Eye,
  EyeOff,
  Percent,
  Calendar,
  Users,
  ShoppingBag,
  ImageIcon,
} from 'lucide-react';
import { Coupon, Category, SubCategory, Product, PromoScopeType } from '@/types';
import { couponApi, adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ImageUploader from '@/components/ui/ImageUploader';
import toast from 'react-hot-toast';
import { UPLOAD_MAX_MB } from '@/lib/uploadLimits';
import {
  AdminOfferModal,
  AdminOfferSection,
  AdminOfferField,
  AdminOfferSelect,
  AdminOfferDateTime,
  AdminOfferToggleCards,
  AdminOfferSwitch,
  AdminOfferInfoBox,
} from '@/components/admin/shared/AdminOfferFormUi';
import PromoScopePicker from '@/components/admin/shared/PromoScopePicker';

interface Props {
  coupon: Coupon | null;
  onClose: () => void;
  onSave: () => void;
}

export default function CouponFormModal({ coupon, onClose, onSave }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [productQuery, setProductQuery] = useState('');
  const [productHits, setProductHits] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
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
    const ids = (coupon?.applicableProductIds || []).map(String);
    if (!ids.length) {
      setSelectedProducts([]);
      return;
    }
    Promise.all(
      ids.map((id) =>
        adminApi.getProductById(id).then((res) => (res.data?.product as Product) ?? null).catch(() => null),
      ),
    ).then((products) => setSelectedProducts(products.filter(Boolean) as Product[]));
  }, [coupon?._id, coupon?.applicableProductIds]);

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
    <AdminOfferModal
      accent="coupon"
      eyebrow="Offers"
      title={coupon ? 'Edit coupon' : 'New coupon'}
      subtitle="Create discount codes — public for storefront or hidden for influencers."
      onClose={onClose}
      maxWidth="2xl"
      footer={
        <>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="brand"
            className="flex-1"
            loading={isSaving}
            onClick={handleSubmit as unknown as React.MouseEventHandler}
          >
            {coupon ? 'Save changes' : 'Create coupon'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AdminOfferSection
          title="Visibility"
          description="Who can discover this code in the store"
          icon={formData.showOnStorefront ? Eye : EyeOff}
        >
          <AdminOfferToggleCards
            value={formData.showOnStorefront}
            onChange={(v) => setFormData({ ...formData, showOnStorefront: v as boolean })}
            options={[
              {
                value: true,
                title: 'Public offer',
                description: 'Shown on visit popup, cart & checkout offer lists, and shop filters.',
              },
              {
                value: false,
                title: 'Code only',
                description: 'Hidden everywhere — shoppers must type the code manually.',
              },
            ]}
          />
          {!formData.showOnStorefront ? (
            <AdminOfferInfoBox tone="amber">
              This code will <strong>not</strong> appear in popups, cart offers, or shop filters.
              Share it only with people you intend (e.g. influencer audience).
            </AdminOfferInfoBox>
          ) : null}
        </AdminOfferSection>

        {formData.showOnStorefront ? (
          <AdminOfferSection
            title="Offer image"
            description="Shown on visit popup — 3:4 crop frame"
            icon={ImageIcon}
          >
            <ImageUploader
              maxFiles={1}
              aspectRatio="3:4"
              maxSizeMB={UPLOAD_MAX_MB.coupon}
              label="Visit popup banner"
              hint="Keep important text and product inside the crop box."
              existingImages={imageFile ? [] : existingImageUrl ? [existingImageUrl] : []}
              onRemoveExisting={removeImage}
              onChange={onPickImage}
            />
          </AdminOfferSection>
        ) : null}

        <AdminOfferSection title="Coupon details" description="Code, discount & display info" icon={Tag}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Input
                label="Coupon code *"
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
            <AdminOfferField label="Discount type" required>
              <AdminOfferSelect
                value={formData.discountType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountType: e.target.value as 'percentage' | 'flat' | 'fixed',
                  })
                }
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat off (₹)</option>
                <option value="fixed">Direct price (₹)</option>
              </AdminOfferSelect>
            </AdminOfferField>
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
              <p className="sm:col-span-2 text-xs text-gray-500 bg-gray-50/80 rounded-lg px-3 py-2 border border-gray-100">
                {formData.scopeType === 'all'
                  ? 'Whole eligible cart pays this price (e.g. ₹1150). Extra above that is the discount.'
                  : 'Each matching product unit is charged at this price — 5 products ≠ cart at ₹1150.'}
              </p>
            ) : null}
          </div>
        </AdminOfferSection>

        <AdminOfferSection title="Schedule & limits" description="When the coupon is valid" icon={Calendar}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AdminOfferField label="Starts" required>
              <AdminOfferDateTime
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </AdminOfferField>
            <AdminOfferField label="Expires" required>
              <AdminOfferDateTime
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                required
              />
            </AdminOfferField>
            <Input
              label="Total uses"
              type="number"
              value={formData.usageLimit}
              onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
              placeholder="Unlimited"
            />
            <Input
              label="Per user limit"
              type="number"
              value={formData.userUsageLimit}
              onChange={(e) =>
                setFormData({ ...formData, userUsageLimit: parseInt(e.target.value) || 1 })
              }
            />
          </div>
        </AdminOfferSection>

        <AdminOfferSection title="Eligibility" description="Who can redeem this coupon" icon={Users}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AdminOfferField label="Who can use">
              <AdminOfferSelect
                value={formData.eligibilityType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    eligibilityType: e.target.value as 'all' | 'first_order' | 'returning',
                  })
                }
              >
                <option value="all">Everyone</option>
                <option value="first_order">First order only</option>
                <option value="returning">Returning customers only</option>
              </AdminOfferSelect>
            </AdminOfferField>
            <Input
              label="Min completed orders"
              type="number"
              value={formData.minCompletedOrders}
              onChange={(e) =>
                setFormData({ ...formData, minCompletedOrders: parseInt(e.target.value) || 0 })
              }
            />
          </div>
        </AdminOfferSection>

        <AdminOfferSection title="Applies to" description="Which items get the discount" icon={ShoppingBag}>
          <PromoScopePicker
            scopeType={formData.scopeType}
            onScopeTypeChange={(type) => setFormData({ ...formData, scopeType: type })}
            categories={categories}
            subcategories={subcategories}
            categoryIds={formData.applicableCategoryIds}
            subcategoryIds={formData.applicableSubcategoryIds}
            productIds={formData.applicableProductIds}
            onToggleCategory={(id) => toggleId('applicableCategoryIds', id)}
            onToggleSubcategory={(id) => toggleId('applicableSubcategoryIds', id)}
            onToggleProduct={(id) => toggleId('applicableProductIds', id)}
            productQuery={productQuery}
            onProductQueryChange={setProductQuery}
            productHits={productHits}
            selectedProducts={selectedProducts}
            onAddProduct={(p) =>
              setSelectedProducts((prev) => (prev.some((x) => x._id === p._id) ? prev : [...prev, p]))
            }
            onRemoveProduct={(id) => setSelectedProducts((prev) => prev.filter((x) => x._id !== id))}
            allLabel="Entire cart"
          />
        </AdminOfferSection>

        <AdminOfferSection title="Description & status" icon={Percent} variant="muted">
          <Input
            label="Short description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Shown under the offer card"
          />
          <AdminOfferSwitch
            checked={formData.isActive}
            onChange={(v) => setFormData({ ...formData, isActive: v })}
            label="Active"
            description="Coupon can be applied when all rules pass"
          />
        </AdminOfferSection>
      </form>
    </AdminOfferModal>
  );
}
