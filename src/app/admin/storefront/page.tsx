'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { adminApi, categoryApi } from '@/lib/api';
import { Category, HeroSlide, StorefrontSettings } from '@/types';
import ImageUploader from '@/components/ui/ImageUploader';
import toast from 'react-hot-toast';

const inputCls =
  'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all';

const emptySlide: HeroSlide = {
  title: '',
  subtitle: '',
  description: '',
  badge: '',
  image: '',
  ctaText: '',
  ctaLink: '/shop',
  secondaryCtaText: 'View All',
  secondaryCtaLink: '/shop',
  isActive: true,
};

export default function AdminStorefrontPage() {
  const [settings, setSettings] = useState<StorefrontSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [announcementDraft, setAnnouncementDraft] = useState('');
  const [heroImageFiles, setHeroImageFiles] = useState<Record<number, File | null>>({});
  const [promoBgFile, setPromoBgFile] = useState<File | null>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [pendingFocusSlide, setPendingFocusSlide] = useState<number | null>(null);

  useEffect(() => {
    if (pendingFocusSlide === null) return;
    const el = slideRefs.current[pendingFocusSlide];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const firstInput = el.querySelector('input');
    if (firstInput instanceof HTMLInputElement) firstInput.focus();
    setPendingFocusSlide(null);
  }, [pendingFocusSlide, settings?.heroSlides.length]);

  useEffect(() => {
    Promise.all([
      adminApi.getStorefrontSettings(),
      categoryApi.getAll({ active: false }),
    ])
      .then(([settingsRes, categoriesRes]) => {
        setSettings(settingsRes.data?.settings || null);
        setCategories(categoriesRes.data?.categories || []);
      })
      .catch(() => toast.error('Failed to load storefront settings'))
      .finally(() => setIsLoading(false));
  }, []);

  const updateSlide = (index: number, key: keyof HeroSlide, value: string | boolean) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const next = [...prev.heroSlides];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, heroSlides: next };
    });
  };

  const save = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append('settings', JSON.stringify(settings));
      Object.entries(heroImageFiles).forEach(([index, file]) => {
        if (file) fd.append(`heroImage_${index}`, file);
      });
      if (promoBgFile) fd.append('promoBackground', promoBgFile);
      await adminApi.updateStorefrontSettings(fd);
      setHeroImageFiles({});
      setPromoBgFile(null);
      toast.success('Storefront settings updated');
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return <div className="p-8 text-sm text-gray-500">Loading storefront settings...</div>;
  }

  const applyPresetLink = (
    section: 'hero' | 'promo',
    field: 'ctaLink' | 'secondaryCtaLink' | 'primaryButtonLink' | 'secondaryButtonLink',
    value: string
  ) => {
    setSettings((prev) => {
      if (!prev) return prev;
      if (section === 'promo') {
        return { ...prev, promoBanner: { ...prev.promoBanner, [field]: value } };
      }
      return prev;
    });
  };

  return (
    <div className="p-6 xl:p-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Storefront Control</h1>
          <p className="text-sm text-gray-500 mt-1">Control home hero, promo banner, footer and announcement strip.</p>
        </div>
        <button
          onClick={save}
          disabled={isSaving}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-60"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Top Announcement Messages</h2>
        <p className="text-xs text-gray-500">Easy mode: message likho, Add karo. Ye navbar ke neeche auto-rotate hoga.</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className={inputCls}
            value={announcementDraft}
            onChange={(e) => setAnnouncementDraft(e.target.value)}
            placeholder="e.g. Use code WELCOME10 on first order"
          />
          <button
            type="button"
            onClick={() => {
              const value = announcementDraft.trim();
              if (!value) return;
              setSettings((prev) =>
                prev
                  ? { ...prev, announcementMessages: [...prev.announcementMessages, value] }
                  : prev
              );
              setAnnouncementDraft('');
            }}
            className="px-4 py-2 rounded-xl bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800"
          >
            Add
          </button>
        </div>
        <div className="space-y-2">
          {settings.announcementMessages.map((msg, idx) => (
            <div key={`${msg}-${idx}`} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="text-xs text-gray-500 w-5">{idx + 1}.</span>
              <input
                className="flex-1 bg-transparent text-sm text-gray-800 focus:outline-none"
                value={msg}
                onChange={(e) => {
                  const next = [...settings.announcementMessages];
                  next[idx] = e.target.value;
                  setSettings((prev) => (prev ? { ...prev, announcementMessages: next } : prev));
                }}
              />
              <button
                type="button"
                onClick={() =>
                  setSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          announcementMessages: prev.announcementMessages.filter((_, i) => i !== idx),
                        }
                      : prev
                  )
                }
                className="text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Hero Slides</h2>
          <button
            onClick={() => {
              setSettings((prev) => {
                if (!prev) return prev;
                const nextIndex = prev.heroSlides.length;
                setPendingFocusSlide(nextIndex);
                return { ...prev, heroSlides: [...prev.heroSlides, { ...emptySlide }] };
              });
            }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600"
          >
            <Plus className="h-4 w-4" /> Add slide
          </button>
        </div>
        {settings.heroSlides.map((slide, index) => (
          <div
            key={index}
            ref={(el) => {
              slideRefs.current[index] = el;
            }}
            className="rounded-xl border border-gray-200 p-4 space-y-3"
          >
            <div className="flex justify-between">
              <p className="text-sm font-semibold text-gray-800">Slide {index + 1}</p>
              <button
                onClick={() => setSettings((prev) => prev ? { ...prev, heroSlides: prev.heroSlides.filter((_, i) => i !== index) } : prev)}
                className="text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className={inputCls} value={slide.title} onChange={(e) => updateSlide(index, 'title', e.target.value)} placeholder="Title" />
              <input className={inputCls} value={slide.subtitle || ''} onChange={(e) => updateSlide(index, 'subtitle', e.target.value)} placeholder="Subtitle" />
              <input className={inputCls} value={slide.badge || ''} onChange={(e) => updateSlide(index, 'badge', e.target.value)} placeholder="Badge" />
              <input className={inputCls} value={slide.ctaText || ''} onChange={(e) => updateSlide(index, 'ctaText', e.target.value)} placeholder="Primary button text" />
              <input className={inputCls} value={slide.ctaLink || ''} onChange={(e) => updateSlide(index, 'ctaLink', e.target.value)} placeholder="Primary button link" />
              <input className={inputCls} value={slide.secondaryCtaText || ''} onChange={(e) => updateSlide(index, 'secondaryCtaText', e.target.value)} placeholder="Secondary button text" />
              <input className={inputCls} value={slide.secondaryCtaLink || ''} onChange={(e) => updateSlide(index, 'secondaryCtaLink', e.target.value)} placeholder="Secondary button link" />
            </div>
            <ImageUploader
              maxFiles={1}
              aspectRatio="16:9"
              maxSizeMB={5}
              existingImages={heroImageFiles[index] ? [] : (slide.image ? [slide.image] : [])}
              onChange={(files) => setHeroImageFiles((prev) => ({ ...prev, [index]: files[0] || null }))}
              label="Slide background"
            />
            {slide.image && !heroImageFiles[index] && (
              <button
                type="button"
                className="text-xs text-red-600"
                onClick={() =>
                  setSettings((prev) => {
                    if (!prev) return prev;
                    const next = [...prev.heroSlides];
                    next[index] = { ...next[index], image: '', imagePublicId: undefined };
                    return { ...prev, heroSlides: next };
                  })
                }
              >
                Remove current image
              </button>
            )}
            {heroImageFiles[index] && (
              <button
                type="button"
                className="text-xs text-red-600"
                onClick={() => setHeroImageFiles((prev) => ({ ...prev, [index]: null }))}
              >
                Remove new selected image
              </button>
            )}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-gray-500">Quick link:</span>
              <button type="button" onClick={() => updateSlide(index, 'ctaLink', '/shop')} className="px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200">Shop All</button>
              <button type="button" onClick={() => updateSlide(index, 'ctaLink', '/shop?sort=-createdAt')} className="px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200">New Arrivals</button>
              <button type="button" onClick={() => updateSlide(index, 'ctaLink', '/shop?isFeatured=true')} className="px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200">Featured</button>
              <select
                className="h-8 rounded-md border border-gray-200 px-2"
                onChange={(e) => {
                  if (!e.target.value) return;
                  updateSlide(index, 'ctaLink', `/shop?category=${encodeURIComponent(e.target.value)}`);
                }}
                defaultValue=""
              >
                <option value="">Category...</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              rows={2}
              className={inputCls}
              value={slide.description || ''}
              onChange={(e) => updateSlide(index, 'description', e.target.value)}
              placeholder="Slide description"
            />
          </div>
        ))}
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Mid Home Promo Banner</h2>
        <ImageUploader
          maxFiles={1}
          aspectRatio="16:9"
          maxSizeMB={5}
          existingImages={promoBgFile ? [] : (settings.promoBanner.backgroundImage ? [settings.promoBanner.backgroundImage] : [])}
          onChange={(files) => setPromoBgFile(files[0] || null)}
          label="Promo background image"
        />
        {settings.promoBanner.backgroundImage && !promoBgFile && (
          <button
            type="button"
            className="text-xs text-red-600"
            onClick={() =>
              setSettings((prev) =>
                prev
                  ? {
                      ...prev,
                      promoBanner: {
                        ...prev.promoBanner,
                        backgroundImage: '',
                        backgroundImagePublicId: undefined,
                      },
                    }
                  : prev
              )
            }
          >
            Remove current promo image
          </button>
        )}
        {promoBgFile && (
          <button
            type="button"
            className="text-xs text-red-600"
            onClick={() => setPromoBgFile(null)}
          >
            Remove new selected promo image
          </button>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className={inputCls} value={settings.promoBanner.eyebrow || ''} onChange={(e) => setSettings((p) => p ? { ...p, promoBanner: { ...p.promoBanner, eyebrow: e.target.value } } : p)} placeholder="Eyebrow text" />
          <input className={inputCls} value={settings.promoBanner.title || ''} onChange={(e) => setSettings((p) => p ? { ...p, promoBanner: { ...p.promoBanner, title: e.target.value } } : p)} placeholder="Title" />
          <input className={inputCls} value={settings.promoBanner.primaryButtonText || ''} onChange={(e) => setSettings((p) => p ? { ...p, promoBanner: { ...p.promoBanner, primaryButtonText: e.target.value } } : p)} placeholder="Primary button text" />
          <input className={inputCls} value={settings.promoBanner.primaryButtonLink || ''} onChange={(e) => setSettings((p) => p ? { ...p, promoBanner: { ...p.promoBanner, primaryButtonLink: e.target.value } } : p)} placeholder="Primary button link" />
          <input className={inputCls} value={settings.promoBanner.secondaryButtonText || ''} onChange={(e) => setSettings((p) => p ? { ...p, promoBanner: { ...p.promoBanner, secondaryButtonText: e.target.value } } : p)} placeholder="Secondary button text" />
          <input className={inputCls} value={settings.promoBanner.secondaryButtonLink || ''} onChange={(e) => setSettings((p) => p ? { ...p, promoBanner: { ...p.promoBanner, secondaryButtonLink: e.target.value } } : p)} placeholder="Secondary button link" />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-gray-500">Quick link preset:</span>
          <button type="button" onClick={() => applyPresetLink('promo', 'primaryButtonLink', '/shop')} className="px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200">Shop All</button>
          <button type="button" onClick={() => applyPresetLink('promo', 'primaryButtonLink', '/shop?sort=-createdAt')} className="px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200">New Arrivals</button>
          <button type="button" onClick={() => applyPresetLink('promo', 'primaryButtonLink', '/shop?isFeatured=true')} className="px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200">Featured</button>
          <select
            className="h-8 rounded-md border border-gray-200 px-2"
            onChange={(e) => {
              if (!e.target.value) return;
              applyPresetLink('promo', 'primaryButtonLink', `/shop?category=${encodeURIComponent(e.target.value)}`);
            }}
            defaultValue=""
          >
            <option value="">Category...</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <textarea className={inputCls} rows={2} value={settings.promoBanner.description || ''} onChange={(e) => setSettings((p) => p ? { ...p, promoBanner: { ...p.promoBanner, description: e.target.value } } : p)} placeholder="Promo description" />
        <input className={inputCls} value={(settings.promoBanner.perks || []).join(', ')} onChange={(e) => setSettings((p) => p ? { ...p, promoBanner: { ...p.promoBanner, perks: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) } } : p)} placeholder="Perks comma separated" />
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Footer Settings</h2>
        <textarea className={inputCls} rows={2} value={settings.footer.description || ''} onChange={(e) => setSettings((p) => p ? { ...p, footer: { ...p.footer, description: e.target.value } } : p)} placeholder="Footer description" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className={inputCls} value={settings.footer.contactAddress || ''} onChange={(e) => setSettings((p) => p ? { ...p, footer: { ...p.footer, contactAddress: e.target.value } } : p)} placeholder="Contact address" />
          <input className={inputCls} value={settings.footer.contactPhone || ''} onChange={(e) => setSettings((p) => p ? { ...p, footer: { ...p.footer, contactPhone: e.target.value } } : p)} placeholder="Contact phone" />
          <input className={inputCls} value={settings.footer.contactEmail || ''} onChange={(e) => setSettings((p) => p ? { ...p, footer: { ...p.footer, contactEmail: e.target.value } } : p)} placeholder="Contact email" />
          <input className={inputCls} type="number" value={settings.footer.categoryLimit || 7} onChange={(e) => setSettings((p) => p ? { ...p, footer: { ...p.footer, categoryLimit: Number(e.target.value) || 7 } } : p)} placeholder="Category limit" />
        </div>
      </section>
    </div>
  );
}
