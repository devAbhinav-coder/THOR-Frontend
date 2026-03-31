'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { adminApi } from '@/lib/api';
import { Category } from '@/types';
import ImageUploader from '@/components/ui/ImageUploader';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Tag, X, Check, Loader2, LayoutGrid, List } from 'lucide-react';

const inputCls =
  'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all placeholder:text-gray-300';

/** Normalize subcategories — handles string/JSON-string/array from DB */
function getSubs(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) return p.map(String).filter(Boolean);
    } catch { /* ignore */ }
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [newImageFile, setNewImageFile] = useState<File | null>(null);

  const emptyForm = {
    name: '',
    description: '',
    subcategories: '',
    isActive: true,
    isGiftCategory: false,
    giftType: '',
    minOrderQty: '1',
  };
  const [form, setForm] = useState(emptyForm);
  const set = (k: keyof typeof emptyForm, v: string | boolean) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCategories({ active: false });
      setCategories(res.data.categories);
    } catch { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setNewImageFile(null);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setForm({
      name: cat.name,
      description: cat.description || '',
      subcategories: getSubs(cat.subcategories).join(', '),
      isActive: cat.isActive,
      isGiftCategory: Boolean(cat.isGiftCategory),
      giftType: cat.giftType || '',
      minOrderQty: String(cat.minOrderQty || 1),
    });
    setNewImageFile(null);
    setEditingId(cat._id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Category name required');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      if (form.description) fd.append('description', form.description);
      fd.append('subcategories', JSON.stringify(form.subcategories.split(',').map((s) => s.trim()).filter(Boolean)));
      fd.append('isActive', String(form.isActive));
      fd.append('isGiftCategory', String(form.isGiftCategory));
      if (form.giftType) fd.append('giftType', form.giftType);
      fd.append('minOrderQty', form.minOrderQty || '1');
      if (newImageFile) fd.append('avatar', newImageFile);

      if (editingId) {
        await adminApi.updateCategory(editingId, fd);
        toast.success('Category updated');
      } else {
        await adminApi.createCategory(fd);
        toast.success('Category created');
      }
      setShowForm(false);
      fetchCategories();
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? Products using this category must be reassigned first.`)) return;
    try {
      await adminApi.deleteCategory(id);
      toast.success('Deleted');
      fetchCategories();
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message || 'Cannot delete');
    }
  };

  const editingCat = categories.find((c) => c._id === editingId);

  return (
    <div className="p-6 xl:p-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-0.5">{categories.length} categories · manage product organisation</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}><List className="w-4 h-4" /></button>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-3'}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={viewMode === 'grid' ? 'rounded-2xl overflow-hidden bg-gray-100 animate-pulse' : 'h-16 rounded-xl bg-gray-100 animate-pulse'}>
              {viewMode === 'grid' && <div style={{ aspectRatio: '3/4' }} />}
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl py-20 text-center">
          <Tag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No categories yet</p>
          <button onClick={openCreate} className="mt-3 text-sm text-brand-600 hover:underline">Create your first category →</button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <div key={cat._id} className="group bg-white rounded-2xl border border-gray-100 hover:border-brand-200 hover:shadow-lg transition-all duration-200">
              {/* Image — portrait 3:4, full image no crop */}
              <div className="relative overflow-hidden rounded-t-2xl" style={{ aspectRatio: '3/4', background: '#f0ebe4' }}>
                {cat.image ? (
                  <Image src={cat.image} alt={cat.name} fill sizes="300px" className="object-contain" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Tag className="w-10 h-10 text-navy-200" />
                  </div>
                )}
                {/* Status pill */}
                <div className="absolute top-2 left-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cat.isActive ? 'bg-green-500/90 text-white' : 'bg-gray-500/80 text-white'}`}>
                    {cat.isActive ? 'Active' : 'Off'}
                  </span>
                </div>
                {/* Action buttons on hover */}
                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(cat)} className="h-7 w-7 rounded-full bg-white/90 hover:bg-white text-gray-700 flex items-center justify-center shadow-sm">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(cat._id, cat.name)} className="h-7 w-7 rounded-full bg-red-500/90 hover:bg-red-600 text-white flex items-center justify-center shadow-sm">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-sm text-gray-900 truncate">{cat.name}</p>
                  {cat.isGiftCategory && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gold-100 text-gold-700 border border-gold-200">
                      Gift
                    </span>
                  )}
                </div>
                {getSubs(cat.subcategories).length > 0 && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                    {getSubs(cat.subcategories).slice(0, 3).join(' · ')}
                    {getSubs(cat.subcategories).length > 3 && ` +${getSubs(cat.subcategories).length - 3}`}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List view */
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wider">
                <th className="text-left px-5 py-3">Category</th>
                <th className="text-left px-5 py-3">Subcategories</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-right px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map((cat) => (
                <tr key={cat._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-11 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {cat.image
                          ? <Image src={cat.image} alt={cat.name} fill sizes="44px" className="object-cover object-top" />
                          : <div className="absolute inset-0 flex items-center justify-center"><Tag className="w-5 h-5 text-gray-300" /></div>
                        }
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{cat.name}</p>
                        {cat.description && <p className="text-xs text-gray-400 line-clamp-1">{cat.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {getSubs(cat.subcategories).slice(0, 3).map((s) => (
                        <span key={s} className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                      {getSubs(cat.subcategories).length > 3 && <span className="text-xs text-gray-400">+{getSubs(cat.subcategories).length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(cat)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(cat._id, cat.name)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Side drawer form ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col overflow-y-auto animate-fadeIn">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-serif font-bold text-gray-900">
                  {editingId ? 'Edit Category' : 'New Category'}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {editingId ? editingCat?.name : 'Fill in the category details below'}
                </p>
              </div>
              <button onClick={() => setShowForm(false)} className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-6">
              {/* Category image */}
              <div>
                <ImageUploader
                  maxFiles={1}
                  aspectRatio="3:4"
                  maxSizeMB={2}
                  existingImages={editingCat?.image ? [editingCat.image] : []}
                  onChange={(files) => setNewImageFile(files[0] || null)}
                  label="Category Image"
                  hint="Portrait 3:4 recommended (e.g. 600×800px). Full image will show without cropping."
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Name <span className="text-brand-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. Sarees"
                  className={inputCls}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Short description of this category..."
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Subcategories */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Subcategories <span className="text-gray-300 font-normal normal-case tracking-normal text-xs">(comma separated)</span>
                </label>
                <input
                  type="text"
                  value={form.subcategories}
                  onChange={(e) => set('subcategories', e.target.value)}
                  placeholder="Silk Sarees, Cotton Sarees, Banarasi Sarees"
                  className={inputCls}
                />
                {form.subcategories && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.subcategories.split(',').map((s) => s.trim()).filter(Boolean).map((s) => (
                      <span key={s} className="text-xs bg-brand-50 text-brand-600 px-2.5 py-1 rounded-full font-medium">{s}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Active toggle */}
              <label className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-900">Active</p>
                  <p className="text-xs text-gray-400">Visible in shop and home page</p>
                </div>
                <div
                  onClick={() => set('isActive', !form.isActive)}
                  className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${form.isActive ? 'bg-brand-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </label>

              {/* Gift category settings */}
              <label className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-900">Show in gifting categories</p>
                  <p className="text-xs text-gray-400">This category will appear on `/gifting` top image strip.</p>
                </div>
                <div
                  onClick={() => set('isGiftCategory', !form.isGiftCategory)}
                  className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${form.isGiftCategory ? 'bg-brand-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isGiftCategory ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </label>

              {form.isGiftCategory && (
                <div className="space-y-3 p-4 bg-brand-50/40 border border-brand-100 rounded-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                        Gift Type
                      </label>
                      <select
                        value={form.giftType}
                        onChange={(e) => set('giftType', e.target.value)}
                        className={inputCls}
                      >
                        <option value="">Select type</option>
                        <option value="corporate">Corporate</option>
                        <option value="wedding">Wedding</option>
                        <option value="festive">Festive</option>
                        <option value="seasonal">Seasonal</option>
                        <option value="personal">Personal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                        Min Order Qty
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={form.minOrderQty}
                        onChange={(e) => set('minOrderQty', e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              )}
            </form>

            {/* Drawer footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 sticky bottom-0">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 bg-white text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingId ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
