'use client';

import { useEffect, useState } from 'react';
import {
  Sparkles,
  Percent,
  Calendar,
  ShoppingBag,
  ImageIcon,
  Zap,
  FileText,
  Info,
} from 'lucide-react';
import {
  Promotion,
  Category,
  SubCategory,
  Product,
  PromoScopeType,
  PromotionType,
} from '@/types';
import { promotionApi, adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ImageUploader from '@/components/ui/ImageUploader';
import toast from 'react-hot-toast';
import { UPLOAD_MAX_MB } from '@/lib/uploadLimits';
import { AdminAiPromotionTermsButton } from '@/components/admin/ai/AdminAiPromotionTermsButton';
import {
  AdminOfferModal,
  AdminOfferSection,
  AdminOfferField,
  AdminOfferSelect,
  AdminOfferDateTime,
  AdminOfferSwitch,
  AdminOfferPresetPills,
  AdminOfferTextarea,
  AdminOfferInfoBox,
} from '@/components/admin/shared/AdminOfferFormUi';
import PromoScopePicker from '@/components/admin/shared/PromoScopePicker';

interface Props {
  promotion: Promotion | null;
  onClose: () => void;
  onSave: () => void;
}

type PresetKey =
  | 'b1g1'
  | 'b2g1'
  | 'b2g2'
  | 'b5g2'
  | 'buy2_200'
  | 'buy1_100'
  | 'buy5_500'
  | 'pct10'
  | 'custom';

const PRESETS: Array<{ key: PresetKey; label: string; type: PromotionType }> = [
  { key: 'b1g1', label: 'Buy 1 Get 1 Free', type: 'bogo' },
  { key: 'b2g1', label: 'Buy 2 Get 1 Free', type: 'bogo' },
  { key: 'b2g2', label: 'Buy 2 Get 2 Free', type: 'bogo' },
  { key: 'b5g2', label: 'Buy 5 Get 2 Free', type: 'bogo' },
  { key: 'buy2_200', label: 'Buy 2 · ₹200 off', type: 'flat' },
  { key: 'buy1_100', label: 'Buy 1 · ₹100 off', type: 'flat' },
  { key: 'buy5_500', label: 'Buy 5 · ₹500 off', type: 'flat' },
  { key: 'pct10', label: 'Buy 3+ · 10% off', type: 'percentage' },
  { key: 'custom', label: 'Custom', type: 'bogo' },
];

function applyPreset(key: PresetKey): Partial<ReturnType<typeof defaultForm>> {
  switch (key) {
    case 'b1g1':
      return { promotionType: 'bogo', buyQuantity: 1, getQuantity: 1, getDiscountPercent: 100 };
    case 'b2g1':
      return { promotionType: 'bogo', buyQuantity: 2, getQuantity: 1, getDiscountPercent: 100 };
    case 'b2g2':
      return { promotionType: 'bogo', buyQuantity: 2, getQuantity: 2, getDiscountPercent: 100 };
    case 'b5g2':
      return { promotionType: 'bogo', buyQuantity: 5, getQuantity: 2, getDiscountPercent: 100 };
    case 'buy2_200':
      return { promotionType: 'flat', buyQuantity: 2, discountValue: '200' };
    case 'buy1_100':
      return { promotionType: 'flat', buyQuantity: 1, discountValue: '100' };
    case 'buy5_500':
      return { promotionType: 'flat', buyQuantity: 5, discountValue: '500' };
    case 'pct10':
      return { promotionType: 'percentage', buyQuantity: 3, discountValue: '10' };
    default:
      return {};
  }
}

function defaultForm(promotion: Promotion | null) {
  return {
    name: promotion?.name || '',
    description: promotion?.description || '',
    termsAndConditions: promotion?.termsAndConditions || '',
    displayTitle: promotion?.displayTitle || '',
    badgeText: promotion?.badgeText || 'Offer',
    promotionType: (promotion?.promotionType || 'bogo') as PromotionType,
    buyQuantity: promotion?.buyQuantity ?? 1,
    getQuantity: promotion?.getQuantity ?? 1,
    getDiscountPercent: promotion?.getDiscountPercent ?? 100,
    discountValue: promotion?.discountValue?.toString() || '',
    maxDiscountAmount: promotion?.maxDiscountAmount?.toString() || '',
    minOrderAmount: promotion?.minOrderAmount?.toString() || '',
    showOnStorefront: promotion?.showOnStorefront !== false,
    scopeType: (promotion?.scopeType || 'all') as PromoScopeType,
    categoryIds: (promotion?.categoryIds || []).map(String),
    subcategoryIds: (promotion?.subcategoryIds || []).map(String),
    productIds: (promotion?.productIds || []).map(String),
    startDate:
      promotion?.startDate ?
        new Date(promotion.startDate).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    endDate:
      promotion ? new Date(promotion.endDate).toISOString().slice(0, 16) : '',
    isActive: promotion?.isActive !== undefined ? promotion.isActive : true,
    priority: promotion?.priority ?? 0,
    preset: 'custom' as PresetKey,
  };
}

function scopeValidationError(data: {
  scopeType: PromoScopeType;
  categoryIds: string[];
  subcategoryIds: string[];
  productIds: string[];
}): string | null {
  if (data.scopeType === 'categories' && !data.categoryIds.length)
    return 'Select at least one category';
  if (data.scopeType === 'subcategories' && !data.subcategoryIds.length) {
    return 'Select at least one subcategory';
  }
  if (data.scopeType === 'products' && !data.productIds.length)
    return 'Select at least one product';
  return null;
}

export default function PromotionFormModal({ promotion, onClose, onSave }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [productQuery, setProductQuery] = useState('');
  const [productHits, setProductHits] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [clearImage, setClearImage] = useState(false);
  const existingImageUrl = clearImage ? null : promotion?.imageUrl || null;
  const [formData, setFormData] = useState(defaultForm(promotion));

  useEffect(() => {
    Promise.all([
      adminApi.getCategories({ active: false }),
      adminApi.getSubcategories(),
    ])
      .then(([catRes, subRes]) => {
        setCategories(catRes.data?.categories || []);
        setSubcategories(subRes.data?.subcategories || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const ids = (promotion?.productIds || []).map(String);
    if (!ids.length) {
      setSelectedProducts([]);
      return;
    }
    Promise.all(
      ids.map((id) =>
        adminApi
          .getProductById(id)
          .then((res) => (res.data?.product as Product) ?? null)
          .catch(() => null),
      ),
    ).then((products) =>
      setSelectedProducts(products.filter(Boolean) as Product[]),
    );
  }, [promotion?._id, promotion?.productIds]);

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
    fieldName: 'categoryIds' | 'subcategoryIds' | 'productIds',
    id: string,
  ) => {
    setFormData((prev) => {
      const set = new Set(prev[fieldName]);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...prev, [fieldName]: Array.from(set) };
    });
  };

  const applyPresetKey = (key: PresetKey) => {
    const preset = PRESETS.find((p) => p.key === key);
    const patch = applyPreset(key);
    setFormData((prev) => ({
      ...prev,
      preset: key,
      ...(preset ? { promotionType: preset.type } : {}),
      ...patch,
    }));
  };

  const refreshPreview = async () => {
    try {
      const res = await promotionApi.preview({
        scopeType: formData.scopeType,
        categoryIds:
          formData.scopeType === 'categories' ? formData.categoryIds : [],
        subcategoryIds:
          formData.scopeType === 'subcategories' ? formData.subcategoryIds : [],
        productIds:
          formData.scopeType === 'products' ? formData.productIds : [],
      });
      setPreviewCount(Number((res.data as { count?: number })?.count ?? 0));
    } catch {
      setPreviewCount(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter a name');
      return;
    }
    if (!formData.endDate) {
      toast.error('Please set an end date');
      return;
    }
    if (
      formData.promotionType !== 'bogo' &&
      (!formData.discountValue || Number(formData.discountValue) <= 0)
    ) {
      toast.error('Please enter a valid discount value');
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
      if (formData.termsAndConditions)
        fd.append('termsAndConditions', formData.termsAndConditions);
      if (formData.displayTitle)
        fd.append('displayTitle', formData.displayTitle);
      fd.append('badgeText', formData.badgeText || 'Offer');
      fd.append('promotionType', formData.promotionType);
      fd.append('buyQuantity', String(Number(formData.buyQuantity) || 1));
      fd.append('showOnStorefront', String(formData.showOnStorefront));
      fd.append('scopeType', formData.scopeType);
      fd.append(
        'categoryIds',
        JSON.stringify(
          formData.scopeType === 'categories' ? formData.categoryIds : [],
        ),
      );
      fd.append(
        'subcategoryIds',
        JSON.stringify(
          formData.scopeType === 'subcategories' ? formData.subcategoryIds : [],
        ),
      );
      fd.append(
        'productIds',
        JSON.stringify(
          formData.scopeType === 'products' ? formData.productIds : [],
        ),
      );
      fd.append('startDate', new Date(formData.startDate).toISOString());
      fd.append('endDate', new Date(formData.endDate).toISOString());
      fd.append('isActive', String(formData.isActive));
      fd.append('priority', String(Number(formData.priority) || 0));

      if (formData.promotionType === 'bogo') {
        fd.append('getQuantity', String(Number(formData.getQuantity) || 1));
        fd.append(
          'getDiscountPercent',
          String(Number(formData.getDiscountPercent) || 100),
        );
      } else {
        fd.append('discountValue', String(Number(formData.discountValue)));
        if (
          formData.promotionType === 'percentage' &&
          formData.maxDiscountAmount
        ) {
          fd.append(
            'maxDiscountAmount',
            String(Number(formData.maxDiscountAmount)),
          );
        }
      }
      if (formData.minOrderAmount) {
        fd.append('minOrderAmount', String(Number(formData.minOrderAmount)));
      }
      if (imageFile) fd.append('image', imageFile);
      if (clearImage && !imageFile) fd.append('clearImage', 'true');

      if (promotion) {
        await promotionApi.update(promotion._id, fd);
        toast.success('Offer updated');
      } else {
        await promotionApi.create(fd);
        toast.success('Offer created — applies automatically in cart');
      }
      onSave();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to save offer');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminOfferModal
      accent="promotion"
      eyebrow="Auto offers"
      title={promotion ? 'Edit auto offer' : 'New auto offer'}
      subtitle="No coupon code — applies automatically when matching items are in cart."
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
            {promotion ? 'Save changes' : 'Create offer'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AdminOfferSection
          title="Quick preset"
          description="Pick a common offer or customize below"
          icon={Zap}
          variant="highlight"
        >
          <AdminOfferPresetPills
            options={PRESETS.map((p) => ({ key: p.key, label: p.label }))}
            selected={formData.preset}
            onSelect={(key) => applyPresetKey(key as PresetKey)}
          />
        </AdminOfferSection>

        {formData.showOnStorefront ? (
          <AdminOfferSection
            title="Popup & PDP image"
            description="Optional — shown on visit popup and product page"
            icon={ImageIcon}
          >
            <ImageUploader
              maxFiles={1}
              aspectRatio="3:4"
              maxSizeMB={UPLOAD_MAX_MB.sale}
              label="Offer banner"
              hint="Same 3:4 crop as sale popup."
              existingImages={
                imageFile ? []
                : existingImageUrl ?
                  [existingImageUrl]
                : []
              }
              onRemoveExisting={() => {
                setImageFile(null);
                setClearImage(true);
              }}
              onChange={(files) => {
                const file = files[0] ?? null;
                setImageFile(file);
                if (file) setClearImage(false);
              }}
            />
          </AdminOfferSection>
        ) : null}

        <AdminOfferSection title="Offer details" description="Name, badge & type" icon={Sparkles}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Input
                label="Internal name *"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Chanderi B1G1"
                required
              />
            </div>
            <Input
              label="Title on PDP / cart"
              value={formData.displayTitle}
              onChange={(e) =>
                setFormData({ ...formData, displayTitle: e.target.value })
              }
              placeholder="Buy 1 Get 1 Free"
            />
            <Input
              label="Badge text"
              value={formData.badgeText}
              onChange={(e) =>
                setFormData({ ...formData, badgeText: e.target.value })
              }
              placeholder="Offer"
            />
            <AdminOfferField label="Offer type" required>
              <AdminOfferSelect
                value={formData.promotionType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    promotionType: e.target.value as PromotionType,
                    preset: 'custom',
                  })
                }
              >
                <option value="bogo">Buy X Get Y (BOGO)</option>
                <option value="flat">Flat ₹ off (min qty)</option>
                <option value="percentage">Percentage off (min qty)</option>
              </AdminOfferSelect>
            </AdminOfferField>
            <Input
              label="Priority (tie-breaker)"
              type="number"
              value={formData.priority}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  priority: parseInt(e.target.value) || 0,
                })
              }
              hint="Higher wins only when savings are equal"
            />
          </div>
        </AdminOfferSection>

        <AdminOfferSection title="Priority guide" icon={Info} variant="muted">
          <AdminOfferInfoBox tone="amber">
            <p className="font-semibold mb-1.5">Priority kaise kaam karti hai?</p>
            <p className="mb-2">
              <strong>Ek cart pe sirf 1 auto offer</strong> lagta hai. Jab 2+ offers match karein:
            </p>
            <ol className="list-decimal list-inside space-y-1 mb-2">
              <li>
                Pehle dekha jata hai <strong>kaun zyada ₹ bachaata hai</strong> — wahi lagta hai.
              </li>
              <li>
                Agar dono <strong>same ₹ save</strong> karein, tab{' '}
                <strong>bada priority number</strong> jeetta hai.
              </li>
            </ol>
            <p>
              Example: B1G1 (₹800 off, priority 0) vs ₹200 off (priority 100) →{' '}
              <strong>B1G1 lagta hai</strong> kyunki zyada saving.
            </p>
          </AdminOfferInfoBox>
        </AdminOfferSection>

        <AdminOfferSection title="Offer rules" description="Quantities & discount values" icon={Percent}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Input
              label="Min buy qty *"
              type="number"
              value={formData.buyQuantity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  buyQuantity: parseInt(e.target.value) || 1,
                  preset: 'custom',
                })
              }
              min={1}
            />
            {formData.promotionType === 'bogo' ?
              <>
                <Input
                  label="Get qty *"
                  type="number"
                  value={formData.getQuantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      getQuantity: parseInt(e.target.value) || 1,
                      preset: 'custom',
                    })
                  }
                  min={1}
                />
                <Input
                  label="Get item discount %"
                  type="number"
                  value={formData.getDiscountPercent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      getDiscountPercent: parseInt(e.target.value) || 100,
                      preset: 'custom',
                    })
                  }
                  min={0}
                  max={100}
                />
              </>
            : <>
                <Input
                  label={
                    formData.promotionType === 'percentage' ?
                      'Discount % *'
                    : 'Discount ₹ *'
                  }
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountValue: e.target.value,
                      preset: 'custom',
                    })
                  }
                  required
                />
                {formData.promotionType === 'percentage' ?
                  <Input
                    label="Max discount ₹"
                    type="number"
                    value={formData.maxDiscountAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxDiscountAmount: e.target.value,
                      })
                    }
                  />
                : null}
              </>
            }
            <Input
              label="Min order ₹ (optional)"
              type="number"
              value={formData.minOrderAmount}
              onChange={(e) =>
                setFormData({ ...formData, minOrderAmount: e.target.value })
              }
            />
          </div>
        </AdminOfferSection>

        <AdminOfferSection title="Applies to" description="Which products qualify" icon={ShoppingBag}>
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
              setSelectedProducts((prev) =>
                prev.some((x) => x._id === p._id) ? prev : [...prev, p],
              )
            }
            onRemoveProduct={(id) =>
              setSelectedProducts((prev) => prev.filter((x) => x._id !== id))
            }
            previewCount={previewCount}
            onPreview={refreshPreview}
            allLabel="Entire cart"
          />
        </AdminOfferSection>

        <AdminOfferSection title="Schedule" icon={Calendar}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AdminOfferField label="Starts" required>
              <AdminOfferDateTime
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                required
              />
            </AdminOfferField>
            <AdminOfferField label="Ends" required>
              <AdminOfferDateTime
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                required
              />
            </AdminOfferField>
          </div>
        </AdminOfferSection>

        <AdminOfferSection title="Description & terms" icon={FileText} variant="muted">
          <Input
            label="Short description (optional)"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Shown on popup and product page"
          />
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Terms &amp; conditions
              </label>
              <AdminAiPromotionTermsButton
                name={formData.name}
                displayTitle={formData.displayTitle}
                description={formData.description}
                promotionType={formData.promotionType}
                buyQuantity={formData.buyQuantity}
                getQuantity={formData.getQuantity}
                getDiscountPercent={formData.getDiscountPercent}
                discountValue={formData.discountValue}
                minOrderAmount={formData.minOrderAmount}
                scopeType={formData.scopeType}
                onTerms={(text) =>
                  setFormData({ ...formData, termsAndConditions: text })
                }
              />
            </div>
            <AdminOfferTextarea
              value={formData.termsAndConditions}
              onChange={(e) =>
                setFormData({ ...formData, termsAndConditions: e.target.value })
              }
              placeholder="Customer-facing conditions — or use AI generate"
              rows={4}
            />
          </div>
        </AdminOfferSection>

        <AdminOfferSection title="Visibility & status" variant="muted">
          <div className="space-y-3">
            <AdminOfferSwitch
              checked={formData.showOnStorefront}
              onChange={(v) => setFormData({ ...formData, showOnStorefront: v })}
              label="Show on storefront"
              description="Visit popup + product page banner"
            />
            <AdminOfferSwitch
              checked={formData.isActive}
              onChange={(v) => setFormData({ ...formData, isActive: v })}
              label="Active"
              description="Offer applies automatically in cart when rules pass"
            />
          </div>
        </AdminOfferSection>
      </form>
    </AdminOfferModal>
  );
}
