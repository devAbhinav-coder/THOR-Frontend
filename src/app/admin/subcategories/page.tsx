'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { fetchAdminCatalogCategories } from '@/lib/adminCatalog';
import { Category, SubCategory } from '@/types';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Tag, X, Check, Loader2, LayoutGrid, List } from 'lucide-react';
import ImageUploader from '@/components/ui/ImageUploader';
import Image from 'next/image';

const inputCls =
  'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all placeholder:text-gray-300';

export default function AdminSubCategoriesPage() {
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newImageFile, setNewImageFile] = useState<File | null>(null);

  const emptyForm = {
    name: '',
    categoryId: '',
    description: '',
    sortOrder: '0',
    isActive: true,
  };
  const [form, setForm] = useState(emptyForm);
  const set = (k: keyof typeof emptyForm, v: string | boolean) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catsRes, subsRes] = await Promise.all([
        fetchAdminCatalogCategories().then((categories) => ({ data: { categories } })),
        adminApi.getSubcategories()
      ]);
      setCategories(catsRes.data?.categories || []);
      setSubcategories(subsRes.data?.subcategories || []);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setForm({ ...emptyForm, categoryId: categories[0]?._id || '' });
    setNewImageFile(null);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (sub: SubCategory) => {
    setForm({
      name: sub.name,
      categoryId: typeof sub.categoryId === 'string' ? sub.categoryId : sub.categoryId._id,
      description: sub.description || '',
      sortOrder: String(sub.sortOrder || 0),
      isActive: sub.isActive,
    });
    setNewImageFile(null);
    setEditingId(sub._id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Subcategory name required');
    if (!form.categoryId) return toast.error('Parent Category required');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('categoryId', form.categoryId);
      if (form.description) fd.append('description', form.description);
      fd.append('sortOrder', String(parseInt(form.sortOrder, 10) || 0));
      fd.append('isActive', String(form.isActive));
      if (newImageFile) fd.append('avatar', newImageFile);

      if (editingId) {
        await adminApi.updateSubcategory(editingId, fd);
        toast.success('Subcategory updated');
      } else {
        await adminApi.createSubcategory(fd);
        toast.success('Subcategory created');
      }
      
      setShowForm(false);
      fetchData();
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete subcategory "${name}"? Products using this must be reassigned.`)) return;
    try {
      await adminApi.deleteSubcategory(id);
      toast.success('Deleted');
      setSubcategories((prev) => prev.filter((c) => c._id !== id));
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message || 'Cannot delete');
    }
  };

  const editingSub = subcategories.find((c) => c._id === editingId);

  return (
    <div className="p-6 xl:p-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Subcategories</h1>
          <p className="text-sm text-gray-500 mt-0.5">{subcategories.length} subcategories · manage product organisation</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openCreate} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add Subcategory
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : subcategories.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl py-20 text-center">
          <Tag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No subcategories yet</p>
          <button onClick={openCreate} className="mt-3 text-sm text-brand-600 hover:underline">Create your first subcategory →</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wider">
                <th className="text-left px-5 py-3">Subcategory</th>
                <th className="text-left px-5 py-3">Parent Category</th>
                <th className="text-left px-5 py-3">Sort Order</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-right px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {subcategories.map((sub) => {
                const parentCat = categories.find(c => c._id === (typeof sub.categoryId === 'string' ? sub.categoryId : sub.categoryId?._id));
                return (
                <tr key={sub._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-11 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {sub.image
                          ? <Image src={sub.image} alt={sub.name} fill sizes="44px" className="object-cover object-top" />
                          : <div className="absolute inset-0 flex items-center justify-center"><Tag className="w-5 h-5 text-gray-300" /></div>
                        }
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{sub.name}</p>
                        {sub.description && <p className="text-xs text-gray-400 line-clamp-1">{sub.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm font-medium text-gray-700">{parentCat?.name || sub.categorySlug}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-gray-500">{sub.sortOrder}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sub.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {sub.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(sub)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(sub._id, sub.name)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              )})}
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
                  {editingId ? 'Edit Subcategory' : 'New Subcategory'}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {editingId ? editingSub?.name : 'Fill in the details below'}
                </p>
              </div>
              <button onClick={() => setShowForm(false)} className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-6">
              {/* Image Upload */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                <ImageUploader
                  maxFiles={1}
                  aspectRatio="3:4"
                  maxSizeMB={2}
                  existingImages={editingSub?.image ? [editingSub.image] : []}
                  onChange={(files) => setNewImageFile(files[0] || null)}
                  label="Subcategory Image"
                  hint="Recommended: 600x800px, max 2MB."
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
                  placeholder="e.g. Banarasi"
                  className={inputCls}
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Parent Category <span className="text-brand-500">*</span>
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => set('categoryId', e.target.value)}
                  className={inputCls}
                  required
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Short description..."
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => set('sortOrder', e.target.value)}
                  className={inputCls}
                />
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
                {editingId ? 'Save Changes' : 'Create Subcategory'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
