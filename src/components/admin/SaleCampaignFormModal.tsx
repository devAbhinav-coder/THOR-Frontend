'use client';

import { useEffect, useState } from 'react';
import { Percent, Calendar, ShoppingBag, ImageIcon, Megaphone } from 'lucide-react';
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
import { UPLOAD_MAX_MB } from '@/lib/uploadLimits';
import {
  AdminOfferModal,
  AdminOfferSection,
  AdminOfferField,
  AdminOfferSelect,
  AdminOfferDateTime,
  AdminOfferSwitch,
  AdminOfferInfoBox,
} from '@/components/admin/shared/AdminOfferFormUi';
import PromoScopePicker from '@/components/admin/shared/PromoScopePicker';

interface Props {
  campaign: SaleCampaign | null;
  onClose: () => void;
  onSave: () => void;
}

type DiscountType = 'percentage' | 'flat' | 'fixed';

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
    <AdminOfferModal
      accent="sale"
      eyebrow="Catalog pricing"
      title={campaign ? 'Edit sale' : 'Create sale'}
      subtitle="Put products on sale — prices update on shop & PDP while live."
      onClose={onClose}
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
            {campaign ? 'Update sale' : 'Create sale'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AdminOfferSection
          title="Sale popup image"
          description="Optional banner for storefront visit popup"
          icon={ImageIcon}
        >
          <ImageUploader
            maxFiles={1}
            aspectRatio="3:4"
            maxSizeMB={UPLOAD_MAX_MB.sale}
            label="Popup banner"
            hint="Keep key text and product inside the 3:4 crop box."
            existingImages={imageFile ? [] : existingImageUrl ? [existingImageUrl] : []}
            onRemoveExisting={removeImage}
            onChange={onPickImage}
          />
        </AdminOfferSection>

        <AdminOfferSection title="Sale details" description="Name, badge & discount" icon={Percent}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <AdminOfferField label="Discount type" required>
              <AdminOfferSelect
                value={formData.discountType}
                onChange={(e) =>
                  setFormData({ ...formData, discountType: e.target.value as DiscountType })
                }
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat off (₹)</option>
                <option value="fixed">Direct sell price (₹)</option>
              </AdminOfferSelect>
            </AdminOfferField>
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
          </div>
          {formData.discountType === 'fixed' ? (
            <AdminOfferInfoBox tone="blue">
              Products in this sale will sell at this price (e.g. ₹1150) when MRP is higher.
            </AdminOfferInfoBox>
          ) : null}
        </AdminOfferSection>

        <AdminOfferSection title="Schedule" description="When the sale is live" icon={Calendar}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AdminOfferField label="Start" required>
              <AdminOfferDateTime
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </AdminOfferField>
            <AdminOfferField label="End" required>
              <AdminOfferDateTime
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </AdminOfferField>
          </div>
        </AdminOfferSection>

        <AdminOfferSection title="Apply sale to" description="Which products get the discount" icon={ShoppingBag}>
          <PromoScopePicker
            scopeType={formData.scopeType}
            onScopeTypeChange={(type) => setFormData({ ...formData, scopeType: type })}
            categories={categories}
            subcategories={subcategories}
            categoryIds={formData.categoryIds}
            subcategoryIds={formData.subcategoryIds}
            productIds={formData.productIds}
            onToggleCategory={(id) => toggleId('categoryIds', id)}
            onToggleSubcategory={(id) => toggleId('subcategoryIds', id)}
            onToggleProduct={(id) => toggleId('productIds', id)}
            productQuery={productQuery}
            onProductQueryChange={setProductQuery}
            productHits={productHits}
            selectedProducts={selectedProducts}
            onAddProduct={(p) =>
              setSelectedProducts((prev) => (prev.some((x) => x._id === p._id) ? prev : [...prev, p]))
            }
            onRemoveProduct={(id) => setSelectedProducts((prev) => prev.filter((x) => x._id !== id))}
            previewCount={previewCount}
            onPreview={refreshPreview}
            allLabel="All products"
          />
        </AdminOfferSection>

        <AdminOfferSection title="Storefront & status" icon={Megaphone} variant="muted">
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional internal note"
          />
          <div className="space-y-3 pt-1">
            <AdminOfferSwitch
              checked={formData.showOnStorefront}
              onChange={(v) => setFormData({ ...formData, showOnStorefront: v })}
              label="Show on storefront visit popup"
              description="Display popup banner when customers visit the shop"
            />
            <AdminOfferSwitch
              checked={formData.isActive}
              onChange={(v) => setFormData({ ...formData, isActive: v })}
              label="Active"
              description="Sale prices apply while live and within date range"
            />
          </div>
        </AdminOfferSection>
      </form>
    </AdminOfferModal>
  );
}
