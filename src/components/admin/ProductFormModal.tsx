'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Product, Category } from '@/types';
import { productApi, categoryApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ImageUploader from '@/components/ui/ImageUploader';
import toast from 'react-hot-toast';

interface Props {
  product: Product | null;
  onClose: () => void;
  onSave: () => void;
}

const FABRICS = [
  'Silk', 'Cotton', 'Chiffon', 'Georgette', 'Banarasi',
  'Kanjeevaram', 'Linen', 'Crepe', 'Net', 'Velvet', 'Other',
];

const Field = ({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
      {label} {required && <span className="text-brand-500">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all placeholder:text-gray-300';

export default function ProductFormModal({ product, onClose, onSave }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [showSeo, setShowSeo] = useState(false);
  const [productDetails, setProductDetails] = useState<{ key: string; value: string }[]>(
    product?.productDetails || []
  );
  const [variants, setVariants] = useState(
    product?.variants.length
      ? product.variants
      : [{ size: '', color: '', colorCode: '', stock: 0, sku: `SKU-${Date.now()}` }]
  );

  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    shortDescription: product?.shortDescription || '',
    price: product?.price?.toString() || '',
    comparePrice: product?.comparePrice?.toString() || '',
    category: product?.category || '',
    subcategory: product?.subcategory || '',
    fabric: product?.fabric || '',
    tags: product?.tags.join(', ') || '',
    isFeatured: product?.isFeatured ?? false,
    isActive: product?.isActive !== undefined ? product.isActive : true,
    seoTitle: product?.seoTitle || '',
    seoDescription: product?.seoDescription || '',
  });

  useEffect(() => {
    categoryApi.getAll().then((res) => setCategories(res.data.categories || [])).catch(() => {});
  }, []);

  const selectedCategory = categories.find((c) => c.name === form.category);
  const subcategories = selectedCategory?.subcategories || [];

  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addVariant = () =>
    setVariants((v) => [...v, { size: '', color: '', colorCode: '', stock: 0, sku: `SKU-${Date.now()}` }]);

  const removeVariant = (i: number) =>
    setVariants((v) => v.filter((_, idx) => idx !== i));

  const updateVariant = (i: number, field: string, value: string | number) =>
    setVariants((v) => v.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product && newFiles.length === 0) return toast.error('Upload at least one product image');
    if (!form.category) return toast.error('Please select a category');
    if (variants.some((v) => !v.sku.trim())) return toast.error('Every variant needs a SKU');

    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description);
      if (form.shortDescription) fd.append('shortDescription', form.shortDescription);
      fd.append('price', form.price);
      if (form.comparePrice) fd.append('comparePrice', form.comparePrice);
      fd.append('category', form.category);
      if (form.subcategory) fd.append('subcategory', form.subcategory);
      if (form.fabric) fd.append('fabric', form.fabric);
      fd.append('isFeatured', String(form.isFeatured));
      fd.append('isActive', String(form.isActive));
      if (form.seoTitle) fd.append('seoTitle', form.seoTitle);
      if (form.seoDescription) fd.append('seoDescription', form.seoDescription);
      fd.append('variants', JSON.stringify(variants));
      if (form.tags.trim())
        fd.append('tags', JSON.stringify(form.tags.split(',').map((t) => t.trim()).filter(Boolean)));
      fd.append(
        'productDetails',
        JSON.stringify(
          productDetails
            .filter((d) => d.key.trim() && d.value.trim())
            .map((d) => ({ key: d.key.trim(), value: d.value.trim() }))
        )
      );
      newFiles.forEach((f) => fd.append('images', f));

      if (product) {
        await productApi.update(product._id, fd);
        toast.success('Product updated');
      } else {
        await productApi.create(fd);
        toast.success('Product created');
      }
      onSave();
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message || 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl animate-fadeIn overflow-x-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-serif font-bold text-gray-900">
              {product ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {product ? `Editing: ${product.name}` : 'Fill in product details below'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] gap-8 max-h-[78vh] overflow-y-auto overflow-x-hidden min-w-0">

            {/* ── LEFT: Details ── */}
            <div className="space-y-6 min-w-0">

              {/* Basic info */}
              <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Basic Information</h3>
                <Field label="Product Name" required>
                  <input
                    className={inputCls}
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="e.g. Banarasi Silk Saree in Royal Blue"
                    required
                  />
                </Field>
                <Field label="Description" required>
                  <textarea
                    className={`${inputCls} resize-none`}
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    placeholder="Describe fabric, weave, occasion, care instructions..."
                    rows={4}
                    required
                  />
                </Field>
                <Field label="Short Description">
                  <input
                    className={inputCls}
                    value={form.shortDescription}
                    onChange={(e) => set('shortDescription', e.target.value)}
                    placeholder="One-line summary shown in product listings"
                  />
                </Field>
              </div>

              {/* Pricing */}
              <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pricing</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Selling Price (₹)" required>
                    <input
                      type="number" min="0" step="0.01"
                      className={inputCls}
                      value={form.price}
                      onChange={(e) => set('price', e.target.value)}
                      placeholder="1499"
                      required
                    />
                  </Field>
                  <Field label="MRP / Compare Price (₹)">
                    <input
                      type="number" min="0" step="0.01"
                      className={inputCls}
                      value={form.comparePrice}
                      onChange={(e) => set('comparePrice', e.target.value)}
                      placeholder="1999"
                    />
                  </Field>
                </div>
                {form.price && form.comparePrice && Number(form.comparePrice) > Number(form.price) && (
                  <p className="text-xs text-green-600 font-medium">
                    ✓ {Math.round(((Number(form.comparePrice) - Number(form.price)) / Number(form.comparePrice)) * 100)}% discount will be shown
                  </p>
                )}
              </div>

              {/* Categorisation */}
              <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Categorisation</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Category" required>
                    <select
                      className={inputCls}
                      value={form.category}
                      onChange={(e) => set('category', e.target.value)}
                      required
                    >
                      <option value="">Select category</option>
                      {categories
                        .filter((c) => !c.isGiftCategory && c.name.toLowerCase() !== "gifting")
                        .map((c) => (
                        <option key={c._id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                    {categories.length === 0 && (
                      <p className="text-xs text-amber-500 mt-1">Create categories in Admin → Categories first.</p>
                    )}
                  </Field>
                  <Field label="Subcategory">
                    {subcategories.length > 0 ? (
                      <select className={inputCls} value={form.subcategory} onChange={(e) => set('subcategory', e.target.value)}>
                        <option value="">None</option>
                        {subcategories.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input className={inputCls} value={form.subcategory} onChange={(e) => set('subcategory', e.target.value)} placeholder="e.g. Silk Sarees" />
                    )}
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Fabric">
                    <select className={inputCls} value={form.fabric} onChange={(e) => set('fabric', e.target.value)}>
                      <option value="">Select fabric</option>
                      {FABRICS.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </Field>
                  <Field label="Tags (comma separated)">
                    <input className={inputCls} value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="silk, wedding, festive" />
                  </Field>
                </div>
                <div className="flex gap-6 pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <button
                      type="button"
                      onClick={() => set('isFeatured', !form.isFeatured)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${form.isFeatured ? 'bg-brand-500' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isFeatured ? 'translate-x-5' : ''}`} />
                    </button>
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-gold-500" /> Featured
                    </span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <button
                      type="button"
                      onClick={() => set('isActive', !form.isActive)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : ''}`} />
                    </button>
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">Active / Visible</span>
                  </label>
                </div>
              </div>

              {/* Variants */}
              <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Variants <span className="text-brand-500">*</span>
                  </h3>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-full transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Variant
                  </button>
                </div>

                {/* Column labels (desktop) */}
                <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 px-1">
                  {["SKU *", "Size", "Color", "Stock", ""].map((h) => (
                    <span
                      key={h}
                      className="text-xs font-semibold text-gray-400 uppercase tracking-wider"
                    >
                      {h}
                    </span>
                  ))}
                </div>

                <div className="space-y-2">
                  {variants.map((v, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 items-center bg-white rounded-xl p-3 border border-gray-100 min-w-0"
                    >
                      <input
                        placeholder="SKU001"
                        value={v.sku}
                        onChange={(e) => updateVariant(i, 'sku', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-gray-50 w-full min-w-0"
                        required
                      />
                      <input
                        placeholder="Free"
                        value={v.size || ''}
                        onChange={(e) => updateVariant(i, 'size', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-gray-50 w-full min-w-0"
                      />
                      <input
                        placeholder="Red"
                        value={v.color || ''}
                        onChange={(e) => updateVariant(i, 'color', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-gray-50 w-full min-w-0"
                      />
                      <input
                        type="number"
                        placeholder="0"
                        min="0"
                        value={v.stock}
                        onChange={(e) => updateVariant(i, 'stock', parseInt(e.target.value) || 0)}
                        className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-gray-50 w-full min-w-0"
                      />
                      <button
                        type="button"
                        onClick={() => removeVariant(i)}
                        disabled={variants.length === 1}
                        className="h-9 w-9 rounded-xl flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors sm:justify-self-end"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Product Detail Pairs</h3>
                  <button
                    type="button"
                    onClick={() => setProductDetails((p) => [...p, { key: "", value: "" }])}
                    className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-full transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Detail
                  </button>
                </div>
                <p className="text-xs text-gray-400">These appear on product detail page as key/value rows.</p>
                {productDetails.map((d, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 bg-white rounded-xl p-3 border border-gray-100">
                    <input
                      className={inputCls}
                      value={d.key}
                      onChange={(e) => setProductDetails((p) => p.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))}
                      placeholder="Key (e.g. Work Type)"
                    />
                    <input
                      className={inputCls}
                      value={d.value}
                      onChange={(e) => setProductDetails((p) => p.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                      placeholder="Value (e.g. Hand Embroidery)"
                    />
                    <button
                      type="button"
                      onClick={() => setProductDetails((p) => p.filter((_, j) => j !== i))}
                      className="h-10 w-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* SEO collapsible */}
              <div className="bg-gray-50 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowSeo(!showSeo)}
                  className="w-full flex items-center justify-between px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest hover:bg-gray-100 transition-colors"
                >
                  <span>SEO Settings (Optional)</span>
                  {showSeo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {showSeo && (
                  <div className="px-5 pb-5 space-y-4">
                    <Field label="SEO Title">
                      <input className={inputCls} value={form.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} placeholder="Custom page title for search engines" />
                    </Field>
                    <Field label="SEO Description">
                      <textarea className={`${inputCls} resize-none`} value={form.seoDescription} onChange={(e) => set('seoDescription', e.target.value)} rows={2} placeholder="Meta description (max 160 chars)" maxLength={160} />
                    </Field>
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT: Images ── */}
            <div className="space-y-4 min-w-0">
              <div className="bg-gray-50 rounded-2xl p-5 space-y-4 sticky top-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Product Images</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Upload high-quality <strong>portrait photos (3:4)</strong> — front, back, draping shot. White/neutral background recommended.
                </p>

                <ImageUploader
                  maxFiles={5}
                  aspectRatio="3:4"
                  maxSizeMB={5}
                  existingImages={product?.images.map((i) => i.url) || []}
                  onChange={setNewFiles}
                  hint={
                    product
                      ? 'New uploads will be added to existing images.'
                      : 'First image becomes the cover photo.'
                  }
                />

                {/* Tips */}
                <div className="bg-white rounded-xl p-3 border border-gray-100 space-y-1.5">
                  <p className="text-xs font-semibold text-gray-600">📸 Photo Tips</p>
                  {[
                    'Use natural or studio lighting',
                    '3:4 portrait ratio (e.g. 900×1200px)',
                    'Show drape, texture & embroidery',
                    'Include model shots when possible',
                  ].map((tip) => (
                    <p key={tip} className="text-xs text-gray-400 flex gap-1.5">
                      <span className="text-brand-400 flex-shrink-0">·</span> {tip}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 sm:px-8 py-5 border-t border-gray-100 bg-gray-50 rounded-b-3xl">
            <p className="text-xs text-gray-400">
              {product ? 'Changes will be saved immediately.' : '* Required fields'}
            </p>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" variant="brand" loading={isSaving} className="rounded-xl px-8">
                {isSaving ? 'Saving…' : product ? 'Save Changes' : 'Create Product'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
