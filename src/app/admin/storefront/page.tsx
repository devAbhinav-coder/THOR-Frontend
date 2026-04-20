'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { adminApi, categoryApi, giftingApi } from '@/lib/api';
import {
  Category,
  HeroSlide,
  HomeGiftShowcaseCard,
  HomeGiftShopLinkMode,
  StorefrontSettings,
} from '@/types';
import ImageUploader from '@/components/ui/ImageUploader';
import { revalidateStorefrontCache } from '@/actions/revalidateStorefrontCache';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronUp } from 'lucide-react';
const inputCls =
  'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all';

/** Narrow updates to `blogBanner` without `as any` (spread keeps optional image fields in sync). */
type BlogBannerFields = StorefrontSettings['blogBanner'];

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
  const [giftOccasionCategories, setGiftOccasionCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [announcementDraft, setAnnouncementDraft] = useState('');
  const [heroImageFiles, setHeroImageFiles] = useState<Record<number, File | null>>({});
  const [promoBgFile, setPromoBgFile] = useState<File | null>(null);
  const [blogMainFile, setBlogMainFile] = useState<File | null>(null);
  const [blogSideFile, setBlogSideFile] = useState<File | null>(null);
  const [shopBannerLeftFile, setShopBannerLeftFile] = useState<File | null>(null);
  const [shopBannerCenterFile, setShopBannerCenterFile] = useState<File | null>(null);
  const [shopBannerRightFile, setShopBannerRightFile] = useState<File | null>(null);
  const [giftingHeroFiles, setGiftingHeroFiles] = useState<Record<number, File | null>>({});
  const [giftingSecondaryFiles, setGiftingSecondaryFiles] = useState<Record<number, File | null>>({});
  const [homeGiftCardFiles, setHomeGiftCardFiles] = useState<Record<number, File | null>>({});
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [pendingFocusSlide, setPendingFocusSlide] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>("announcement");
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
      giftingApi.getCategories().catch(() => ({ data: { categories: [] as Category[] } })),
    ])
      .then(([settingsRes, categoriesRes, giftCatsRes]) => {
        setSettings(settingsRes.data?.settings || null);
        setCategories(categoriesRes.data?.categories || []);
        setGiftOccasionCategories(giftCatsRes.data?.categories || []);
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
      if (blogMainFile) fd.append('blogMainImage', blogMainFile);
      if (blogSideFile) fd.append('blogSideImage', blogSideFile);
      if (shopBannerLeftFile) fd.append('shopBannerLeftImage', shopBannerLeftFile);
      if (shopBannerCenterFile) fd.append('shopBannerCenterImage', shopBannerCenterFile);
      if (shopBannerRightFile) fd.append('shopBannerRightImage', shopBannerRightFile);
      Object.entries(giftingHeroFiles).forEach(([index, file]) => {
        if (file) fd.append(`giftingHeroImage_${index}`, file);
      });
      Object.entries(giftingSecondaryFiles).forEach(([index, file]) => {
        if (file) fd.append(`giftingSecondaryImage_${index}`, file);
      });
      Object.entries(homeGiftCardFiles).forEach(([index, file]) => {
        if (file) fd.append(`homeGiftCardImage_${index}`, file);
      });
      const saved = await adminApi.updateStorefrontSettings(fd);
      if (saved.data?.settings) {
        setSettings(saved.data.settings as StorefrontSettings);
      }
      await revalidateStorefrontCache();
      setHeroImageFiles({});
      setPromoBgFile(null);
      setBlogMainFile(null);
      setBlogSideFile(null);
      setShopBannerLeftFile(null);
      setShopBannerCenterFile(null);
      setShopBannerRightFile(null);
      setGiftingHeroFiles({});
      setGiftingSecondaryFiles({});
      setHomeGiftCardFiles({});
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
  const padHomeGiftCards = (cards: HomeGiftShowcaseCard[] | undefined): HomeGiftShowcaseCard[] => {
    const accents: ('rose' | 'amber' | 'sage')[] = ['rose', 'amber', 'sage'];
    const base = [...(cards || [])];
    while (base.length < 3) {
      base.push({
        title: '',
        description: '',
        image: '',
        shopButtonText: 'Browse gifts',
        shopLinkMode: 'gifting',
        shopButtonLink: '/gifting',
        giftingOccasion: '',
        giftingProductCategory: '',
        giftingSearch: '',
        directProductPath: '',
        giftButtonText: 'Gifting',
        giftButtonLink: '/gifting',
        accent: accents[base.length],
      });
    }
    return base.slice(0, 3);
  };

  const productCategoriesForGiftCard = categories.filter((c) => !c.isGiftCategory);
  const productCategoryOptions =
    productCategoriesForGiftCard.length > 0 ? productCategoriesForGiftCard : categories;

  const ensureShopBanner = (p: StorefrontSettings) => ({
    title: p.shopBanner?.title || "",
    subtitle: p.shopBanner?.subtitle || "",
    leftImage: p.shopBanner?.leftImage || "",
    leftImagePublicId: p.shopBanner?.leftImagePublicId,
    centerImage: p.shopBanner?.centerImage || "",
    centerImagePublicId: p.shopBanner?.centerImagePublicId,
    rightImage: p.shopBanner?.rightImage || "",
    rightImagePublicId: p.shopBanner?.rightImagePublicId,
    isActive: p.shopBanner?.isActive !== false,
  });

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

  <section className="bg-white rounded-2xl border border-gray-100">

  {/* HEADER */}
  <div
    onClick={() =>
      setActiveSection(activeSection === "announcement" ? null : "announcement")
    }
    className="cursor-pointer p-5 flex justify-between items-center"
  >
    <h2 className="font-semibold text-gray-900">
      Top Announcement Messages
    </h2>
    <span>{activeSection === "announcement" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
  </div>

  {/* ✅ CONTENT (IMPORTANT CHANGE) */}
  {activeSection === "announcement" && (
    <div className="px-5 pb-5 space-y-3">

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
                ? {
                    ...prev,
                    announcementMessages: [
                      ...prev.announcementMessages,
                      value,
                    ],
                  }
                : prev
            );
            setAnnouncementDraft("");
          }}
          className="px-4 py-2 rounded-xl bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800"
        >
          Add
        </button>
      </div>

      <div className="space-y-2">
        {settings.announcementMessages.map((msg, idx) => (
          <div
            key={`${msg}-${idx}`}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2"
          >
            <span className="text-xs text-gray-500 w-5">{idx + 1}.</span>
            <input
              className="flex-1 bg-transparent text-sm text-gray-800 focus:outline-none"
              value={msg}
              onChange={(e) => {
                const next = [...settings.announcementMessages];
                next[idx] = e.target.value;
                setSettings((prev) =>
                  prev ? { ...prev, announcementMessages: next } : prev
                );
              }}
            />
            <button
              type="button"
              onClick={() =>
                setSettings((prev) =>
                  prev
                    ? {
                        ...prev,
                        announcementMessages:
                          prev.announcementMessages.filter((_, i) => i !== idx),
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

    </div>
  )}
</section>

 <section className="bg-white rounded-2xl border border-gray-100">

  {/* HEADER */}
  <div
    onClick={() =>
      setActiveSection(activeSection === "hero" ? null : "hero")
    }
    className="cursor-pointer p-5 flex justify-between items-center"
  >
    <h2 className="font-semibold text-gray-900">Hero Slides</h2>
    <span>{activeSection === "hero" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
  </div>

  {/* CONTENT */}
  {activeSection === "hero" && (
    <div className="px-5 pb-5 space-y-4">

      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            setSettings((prev) => {
              if (!prev) return prev;
              const nextIndex = prev.heroSlides.length;
              setPendingFocusSlide(nextIndex);
              return {
                ...prev,
                heroSlides: [...prev.heroSlides, { ...emptySlide }],
              };
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
            <p className="text-sm font-semibold text-gray-800">
              Slide {index + 1}
            </p>
            <button
              onClick={() => {
                setHeroImageFiles((prev) => {
                  const next: Record<number, File | null> = {};
                  for (const [k, file] of Object.entries(prev)) {
                    const i = Number(k);
                    if (Number.isNaN(i)) continue;
                    if (i < index) next[i] = file;
                    else if (i > index) next[i - 1] = file;
                  }
                  return next;
                });
                setSettings((prev) =>
                  prev
                    ? {
                        ...prev,
                        heroSlides: prev.heroSlides.filter(
                          (_, i) => i !== index
                        ),
                      }
                    : prev
                );
              }}
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
            existingImages={
              heroImageFiles[index]
                ? []
                : slide.image
                ? [slide.image]
                : []
            }
            onChange={(files) =>
              setHeroImageFiles((prev) => ({
                ...prev,
                [index]: files[0] || null,
              }))
            }
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
                  next[index] = {
                    ...next[index],
                    image: '',
                    imagePublicId: undefined,
                  };
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
              onClick={() =>
                setHeroImageFiles((prev) => ({
                  ...prev,
                  [index]: null,
                }))
              }
            >
              Remove new selected image
            </button>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-500">Quick link:</span>
            <button onClick={() => updateSlide(index, 'ctaLink', '/shop')} className="px-2 py-1 bg-gray-100 rounded-md">Shop All</button>
            <button onClick={() => updateSlide(index, 'ctaLink', '/shop?sort=-createdAt')} className="px-2 py-1 bg-gray-100 rounded-md">New Arrivals</button>
            <button onClick={() => updateSlide(index, 'ctaLink', '/shop?isFeatured=true')} className="px-2 py-1 bg-gray-100 rounded-md">Featured</button>
          </div>

          <textarea
            rows={2}
            className={inputCls}
            value={slide.description || ''}
            onChange={(e) =>
              updateSlide(index, 'description', e.target.value)
            }
            placeholder="Slide description"
          />
        </div>
      ))}

    </div>
  )}
</section>

<section className="bg-white rounded-2xl border border-gray-100">

  {/* HEADER */}
  <div
    onClick={() =>
      setActiveSection(activeSection === "promo" ? null : "promo")
    }
    className="cursor-pointer p-5 flex justify-between items-center"
  >
    <h2 className="font-semibold text-gray-900">
      Mid Home Promo Banner
    </h2>
    <span>{activeSection === "promo" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
  </div>

  {/* CONTENT */}
  {activeSection === "promo" && (
    <div className="px-5 pb-5 space-y-3">

      <ImageUploader
        maxFiles={1}
        aspectRatio="16:9"
        maxSizeMB={5}
        existingImages={
          promoBgFile
            ? []
            : settings.promoBanner.backgroundImage
            ? [settings.promoBanner.backgroundImage]
            : []
        }
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
                      backgroundImage: "",
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
        <button type="button" onClick={() => applyPresetLink('promo', 'primaryButtonLink', '/shop')} className="px-2 py-1 bg-gray-100 rounded-md">Shop All</button>
        <button type="button" onClick={() => applyPresetLink('promo', 'primaryButtonLink', '/shop?sort=-createdAt')} className="px-2 py-1 bg-gray-100 rounded-md">New Arrivals</button>
        <button type="button" onClick={() => applyPresetLink('promo', 'primaryButtonLink', '/shop?isFeatured=true')} className="px-2 py-1 bg-gray-100 rounded-md">Featured</button>

        <select
          className="h-8 rounded-md border border-gray-200 px-2"
          onChange={(e) => {
            if (!e.target.value) return;
            applyPresetLink(
              "promo",
              "primaryButtonLink",
              `/shop?category=${encodeURIComponent(e.target.value)}`
            );
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
        className={inputCls}
        rows={2}
        value={settings.promoBanner.description || ""}
        onChange={(e) =>
          setSettings((p) =>
            p
              ? {
                  ...p,
                  promoBanner: {
                    ...p.promoBanner,
                    description: e.target.value,
                  },
                }
              : p
          )
        }
        placeholder="Promo description"
      />

      <input
        className={inputCls}
        value={(settings.promoBanner.perks || []).join(", ")}
        onChange={(e) =>
          setSettings((p) =>
            p
              ? {
                  ...p,
                  promoBanner: {
                    ...p.promoBanner,
                    perks: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  },
                }
              : p
          )
        }
        placeholder="Perks comma separated"
      />

    </div>
  )}
</section>

 <section className="bg-white rounded-2xl border border-gray-100">

  {/* HEADER */}
  <div
    onClick={() =>
      setActiveSection(activeSection === "blog" ? null : "blog")
    }
    className="cursor-pointer p-5 flex justify-between items-center"
  >
    <h2 className="font-semibold text-gray-900">
      Blog Banner
    </h2>
    <span>{activeSection === "blog" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
  </div>

  {/* CONTENT */}
  {activeSection === "blog" && (
    <div className="px-5 pb-5 space-y-4">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* MAIN IMAGE */}
        <div className="space-y-3">
          <ImageUploader
            maxFiles={1}
            aspectRatio="4:5"
            maxSizeMB={5}
            existingImages={
              blogMainFile
                ? []
                : settings.blogBanner?.mainImage
                ? [settings.blogBanner.mainImage]
                : []
            }
            onChange={(files) => setBlogMainFile(files[0] || null)}
            label="Main Image (Portrait)"
          />

          {settings.blogBanner?.mainImage && !blogMainFile && (
            <button
              type="button"
              className="text-xs text-red-600"
              onClick={() =>
                setSettings((p) =>
                  p
                    ? {
                        ...p,
                        blogBanner: {
                          ...p.blogBanner,
                          mainImage: "",
                          mainImagePublicId: undefined,
                        } as BlogBannerFields,
                      }
                    : p
                )
              }
            >
              Remove main image
            </button>
          )}
        </div>

        {/* SIDE IMAGE */}
        <div className="space-y-3">
          <ImageUploader
            maxFiles={1}
            aspectRatio="1:1"
            maxSizeMB={5}
            existingImages={
              blogSideFile
                ? []
                : settings.blogBanner?.sideImage
                ? [settings.blogBanner.sideImage]
                : []
            }
            onChange={(files) => setBlogSideFile(files[0] || null)}
            label="Side Floating Image (Square)"
          />

          {settings.blogBanner?.sideImage && !blogSideFile && (
            <button
              type="button"
              className="text-xs text-red-600"
              onClick={() =>
                setSettings((p) =>
                  p
                    ? {
                        ...p,
                        blogBanner: {
                          ...p.blogBanner,
                          sideImage: "",
                          sideImagePublicId: undefined,
                        } as BlogBannerFields,
                      }
                    : p
                )
              }
            >
              Remove side image
            </button>
          )}
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        <input className={inputCls} value={settings.blogBanner?.eyebrow || ''} onChange={(e) => setSettings((p) => p ? { ...p, blogBanner: { ...p.blogBanner, eyebrow: e.target.value } as BlogBannerFields } : p)} placeholder="Eyebrow text" />
        <input className={inputCls} value={settings.blogBanner?.title || ''} onChange={(e) => setSettings((p) => p ? { ...p, blogBanner: { ...p.blogBanner, title: e.target.value } as BlogBannerFields } : p)} placeholder="Title" />
        <input className={inputCls} value={settings.blogBanner?.buttonText || ''} onChange={(e) => setSettings((p) => p ? { ...p, blogBanner: { ...p.blogBanner, buttonText: e.target.value } as BlogBannerFields } : p)} placeholder="Button text" />
        <input className={inputCls} value={settings.blogBanner?.buttonLink || ''} onChange={(e) => setSettings((p) => p ? { ...p, blogBanner: { ...p.blogBanner, buttonLink: e.target.value } as BlogBannerFields } : p)} placeholder="Button link" />
      </div>

      <textarea
        className={inputCls}
        rows={2}
        value={settings.blogBanner?.description || ''}
        onChange={(e) =>
          setSettings((p) =>
            p
              ? {
                  ...p,
                  blogBanner: {
                    ...p.blogBanner,
                    description: e.target.value,
                  } as BlogBannerFields,
                }
              : p
          )
        }
        placeholder="Description"
      />

    </div>
  )}
</section>

<section className="bg-white rounded-2xl border border-gray-100">
  <div
    onClick={() =>
      setActiveSection(activeSection === "shopBanner" ? null : "shopBanner")
    }
    className="cursor-pointer p-5 flex justify-between items-center"
  >
    <h2 className="font-semibold text-gray-900">Shop Page Banner</h2>
    <span>{activeSection === "shopBanner" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
  </div>

  {activeSection === "shopBanner" && (
    <div className="px-5 pb-5 space-y-3">
      <p className="text-xs text-gray-500">
        Prefer single full-width banner image. If center image is present, it overrides side images.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          className={inputCls}
          value={settings.shopBanner?.title || ""}
          onChange={(e) =>
            setSettings((p) =>
              p
                ? {
                    ...p,
                    shopBanner: {
                      ...ensureShopBanner(p),
                      title: e.target.value,
                    },
                  }
                : p
            )
          }
          placeholder="Title (e.g. Sara Ali Khan Spotted)"
        />
        <input
          className={inputCls}
          value={settings.shopBanner?.subtitle || ""}
          onChange={(e) =>
            setSettings((p) =>
              p
                ? {
                    ...p,
                    shopBanner: {
                      ...ensureShopBanner(p),
                      subtitle: e.target.value,
                    },
                  }
                : p
            )
          }
          placeholder="Subtitle (e.g. Shop all celebrity styles)"
        />
      </div>
      <div className="space-y-2">
        <ImageUploader
          maxFiles={1}
          aspectRatio="5:1"
          maxSizeMB={5}
          existingImages={
            shopBannerCenterFile ? [] : settings.shopBanner?.centerImage ? [settings.shopBanner.centerImage] : []
          }
          onChange={(files) => setShopBannerCenterFile(files[0] || null)}
          label="Main full-width banner image (recommended)"
          hint="When set, this one image is used full-width on shop banner."
        />
        {settings.shopBanner?.centerImage && !shopBannerCenterFile && (
          <button
            type="button"
            className="text-xs text-red-600"
            onClick={() =>
              setSettings((p) =>
                p
                  ? {
                      ...p,
                      shopBanner: {
                        ...ensureShopBanner(p),
                        centerImage: "",
                        centerImagePublicId: undefined,
                      },
                    }
                  : p
              )
            }
          >
            Remove current main banner image
          </button>
        )}
        {shopBannerCenterFile && (
          <button
            type="button"
            className="text-xs text-red-600"
            onClick={() => setShopBannerCenterFile(null)}
          >
            Remove newly selected main banner image
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <ImageUploader
            maxFiles={1}
            aspectRatio="3:4"
            maxSizeMB={5}
            existingImages={
              shopBannerLeftFile ? [] : settings.shopBanner?.leftImage ? [settings.shopBanner.leftImage] : []
            }
            onChange={(files) => setShopBannerLeftFile(files[0] || null)}
            label="Left side image"
            hint="Used only when main full-width image is not set."
          />
          {settings.shopBanner?.leftImage && !shopBannerLeftFile && (
            <button
              type="button"
              className="text-xs text-red-600"
              onClick={() =>
                setSettings((p) =>
                  p
                    ? {
                        ...p,
                        shopBanner: {
                          ...ensureShopBanner(p),
                          leftImage: "",
                          leftImagePublicId: undefined,
                        },
                      }
                    : p
                )
              }
            >
              Remove current left image
            </button>
          )}
          {shopBannerLeftFile && (
            <button
              type="button"
              className="text-xs text-red-600"
              onClick={() => setShopBannerLeftFile(null)}
            >
              Remove newly selected left image
            </button>
          )}
        </div>
        <div className="space-y-2">
          <ImageUploader
            maxFiles={1}
            aspectRatio="3:4"
            maxSizeMB={5}
            existingImages={
              shopBannerRightFile ? [] : settings.shopBanner?.rightImage ? [settings.shopBanner.rightImage] : []
            }
            onChange={(files) => setShopBannerRightFile(files[0] || null)}
            label="Right side image"
            hint="Used only when main full-width image is not set."
          />
          {settings.shopBanner?.rightImage && !shopBannerRightFile && (
            <button
              type="button"
              className="text-xs text-red-600"
              onClick={() =>
                setSettings((p) =>
                  p
                    ? {
                        ...p,
                        shopBanner: {
                          ...ensureShopBanner(p),
                          rightImage: "",
                          rightImagePublicId: undefined,
                        },
                      }
                    : p
                )
              }
            >
              Remove current right image
            </button>
          )}
          {shopBannerRightFile && (
            <button
              type="button"
              className="text-xs text-red-600"
              onClick={() => setShopBannerRightFile(null)}
            >
              Remove newly selected right image
            </button>
          )}
        </div>
      </div>
      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={settings.shopBanner?.isActive !== false}
          onChange={(e) =>
            setSettings((p) =>
              p
                ? {
                    ...p,
                    shopBanner: {
                      ...ensureShopBanner(p),
                      isActive: e.target.checked,
                    },
                  }
                : p
            )
          }
        />
        Show this banner on shop page
      </label>
    </div>
  )}
</section>

<section className="bg-white rounded-2xl border border-gray-100">
  <div
    onClick={() =>
      setActiveSection(activeSection === "homeGift" ? null : "homeGift")
    }
    className="cursor-pointer p-5 flex justify-between items-center"
  >
    <div>
      <h2 className="font-semibold text-gray-900">Home — Gifting showcase</h2>
      <p className="text-xs text-gray-500 mt-0.5">
        Three cards above &quot;Why Choose Us&quot; (white background). Each card: shop link + gifting link.
      </p>
    </div>
    <span>
      {activeSection === "homeGift" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
    </span>
  </div>

  {activeSection === "homeGift" && settings && (
    <div className="px-5 pb-5 space-y-4">
      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={settings.homeGiftShowcase?.isActive !== false}
          onChange={(e) =>
            setSettings((p) =>
              p
                ? {
                    ...p,
                    homeGiftShowcase: {
                      ...p.homeGiftShowcase,
                      isActive: e.target.checked,
                      cards: padHomeGiftCards(p.homeGiftShowcase?.cards),
                    },
                  }
                : p
            )
          }
        />
        Show section on homepage
      </label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          className={inputCls}
          value={settings.homeGiftShowcase?.headlineLine1 || ''}
          onChange={(e) =>
            setSettings((p) =>
              p
                ? {
                    ...p,
                    homeGiftShowcase: {
                      ...p.homeGiftShowcase,
                      headlineLine1: e.target.value,
                      cards: padHomeGiftCards(p.homeGiftShowcase?.cards),
                    },
                  }
                : p
            )
          }
          placeholder="Headline line 1 (e.g. Our Gifting)"
        />
        <input
          className={inputCls}
          value={settings.homeGiftShowcase?.headlineLine2 || ''}
          onChange={(e) =>
            setSettings((p) =>
              p
                ? {
                    ...p,
                    homeGiftShowcase: {
                      ...p.homeGiftShowcase,
                      headlineLine2: e.target.value,
                      cards: padHomeGiftCards(p.homeGiftShowcase?.cards),
                    },
                  }
                : p
            )
          }
          placeholder="Headline line 2 (e.g. Collections)"
        />
      </div>
      <textarea
        className={inputCls}
        rows={3}
        value={settings.homeGiftShowcase?.description || ''}
        onChange={(e) =>
          setSettings((p) =>
            p
              ? {
                  ...p,
                  homeGiftShowcase: {
                    ...p.homeGiftShowcase,
                    description: e.target.value,
                    cards: padHomeGiftCards(p.homeGiftShowcase?.cards),
                  },
                }
              : p
          )
        }
        placeholder="Short description for the left column"
      />
      <input
        className={inputCls}
        value={settings.homeGiftShowcase?.socialHandle || ''}
        onChange={(e) =>
          setSettings((p) =>
            p
              ? {
                  ...p,
                  homeGiftShowcase: {
                    ...p.homeGiftShowcase,
                    socialHandle: e.target.value,
                    cards: padHomeGiftCards(p.homeGiftShowcase?.cards),
                  },
                }
              : p
          )
        }
        placeholder="Social handle (e.g. @thehouseofrani) — icons use Footer social URLs"
      />

      {padHomeGiftCards(settings.homeGiftShowcase?.cards).map((card, index) => (
        <div key={index} className="rounded-xl border border-gray-200 p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-800">Card {index + 1}</p>
          <ImageUploader
            maxFiles={1}
            aspectRatio="1:1"
            maxSizeMB={5}
            existingImages={
              homeGiftCardFiles[index] ? [] : card.image ? [card.image] : []
            }
            onRemoveExisting={() => {
              setSettings((p) => {
                if (!p) return p;
                const cards = padHomeGiftCards(p.homeGiftShowcase?.cards);
                cards[index] = {
                  ...cards[index],
                  image: '',
                  imagePublicId: undefined,
                };
                return {
                  ...p,
                  homeGiftShowcase: { ...p.homeGiftShowcase, cards },
                };
              });
              setHomeGiftCardFiles((prev) => ({ ...prev, [index]: null }));
            }}
            onChange={(files) =>
              setHomeGiftCardFiles((prev) => ({
                ...prev,
                [index]: files[0] || null,
              }))
            }
            label="Card image (1:1 — shown as circle on homepage)"
            hint="Hover the thumbnail → remove to upload a new image. Saving removes the old file from Cloudinary when replaced or cleared."
          />
          {card.image && !homeGiftCardFiles[index] && (
            <button
              type="button"
              className="text-xs font-medium text-red-600 hover:text-red-700"
              onClick={() => {
                setSettings((p) => {
                  if (!p) return p;
                  const cards = padHomeGiftCards(p.homeGiftShowcase?.cards);
                  cards[index] = {
                    ...cards[index],
                    image: '',
                    imagePublicId: undefined,
                  };
                  return {
                    ...p,
                    homeGiftShowcase: { ...p.homeGiftShowcase, cards },
                  };
                });
                setHomeGiftCardFiles((prev) => ({ ...prev, [index]: null }));
              }}
            >
              Remove current image (Cloudinary cleanup on Save)
            </button>
          )}
          {homeGiftCardFiles[index] && (
            <button
              type="button"
              className="text-xs text-gray-600 hover:text-gray-800"
              onClick={() =>
                setHomeGiftCardFiles((prev) => ({ ...prev, [index]: null }))
              }
            >
              Discard newly selected file
            </button>
          )}
          <input
            className={inputCls}
            value={card.title || ''}
            onChange={(e) =>
              setSettings((p) => {
                if (!p) return p;
                const cards = padHomeGiftCards(p.homeGiftShowcase?.cards);
                cards[index] = { ...cards[index], title: e.target.value };
                return {
                  ...p,
                  homeGiftShowcase: { ...p.homeGiftShowcase, cards },
                };
              })
            }
            placeholder="Title (e.g. Handmade Gifts)"
          />
          <textarea
            className={inputCls}
            rows={2}
            value={card.description || ''}
            onChange={(e) =>
              setSettings((p) => {
                if (!p) return p;
                const cards = padHomeGiftCards(p.homeGiftShowcase?.cards);
                cards[index] = { ...cards[index], description: e.target.value };
                return {
                  ...p,
                  homeGiftShowcase: { ...p.homeGiftShowcase, cards },
                };
              })
            }
            placeholder="Card description"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              className={inputCls}
              value={card.shopButtonText || ''}
              onChange={(e) =>
                setSettings((p) => {
                  if (!p) return p;
                  const cards = padHomeGiftCards(p.homeGiftShowcase?.cards);
                  cards[index] = { ...cards[index], shopButtonText: e.target.value };
                  return {
                    ...p,
                    homeGiftShowcase: { ...p.homeGiftShowcase, cards },
                  };
                })
              }
              placeholder="Primary button label (e.g. Browse gifts, Coming soon)"
            />
            <div>
              <label className="text-xs font-medium text-gray-600">Primary button target</label>
              <select
                className={`${inputCls} mt-1`}
                value={(card.shopLinkMode || 'custom') as HomeGiftShopLinkMode}
                onChange={(e) =>
                  setSettings((p) => {
                    if (!p) return p;
                    const cards = padHomeGiftCards(p.homeGiftShowcase?.cards);
                    const mode = e.target.value as HomeGiftShopLinkMode;
                    cards[index] = {
                      ...cards[index],
                      shopLinkMode: mode,
                      ...(mode === 'coming_soon' && {
                        shopButtonText: cards[index].shopButtonText || 'Coming soon',
                      }),
                    };
                    return {
                      ...p,
                      homeGiftShowcase: { ...p.homeGiftShowcase, cards },
                    };
                  })
                }
              >
                <option value="gifting">Gifting page (occasion / product category / search)</option>
                <option value="product">Product page (path)</option>
                <option value="coming_soon">Coming soon (no link)</option>
                <option value="custom">Custom URL</option>
              </select>
            </div>
            {(card.shopLinkMode || 'custom') === 'gifting' && (
              <>
                <select
                  className={inputCls}
                  value={card.giftingOccasion || ''}
                  onChange={(e) =>
                    setSettings((p) => {
                      if (!p) return p;
                      const cards = padHomeGiftCards(p.homeGiftShowcase?.cards);
                      cards[index] = {
                        ...cards[index],
                        giftingOccasion: e.target.value,
                      };
                      return {
                        ...p,
                        homeGiftShowcase: { ...p.homeGiftShowcase, cards },
                      };
                    })
                  }
                >
                  <option value="">Gift occasion (optional — same as gifting page chips)</option>
                  {giftOccasionCategories.map((c) => (
                    <option key={String(c._id)} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  className={inputCls}
                  value={card.giftingProductCategory || ''}
                  onChange={(e) =>
                    setSettings((p) => {
                      if (!p) return p;
                      const cards = padHomeGiftCards(p.homeGiftShowcase?.cards);
                      cards[index] = {
                        ...cards[index],
                        giftingProductCategory: e.target.value,
                      };
                      return {
                        ...p,
                        homeGiftShowcase: { ...p.homeGiftShowcase, cards },
                      };
                    })
                  }
                >
                  <option value="">Product category filter (optional)</option>
                  {productCategoryOptions.map((c) => (
                    <option key={String(c._id)} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  className={`${inputCls} sm:col-span-2`}
                  value={card.giftingSearch || ''}
                  onChange={(e) =>
                    setSettings((p) => {
                      if (!p) return p;
                      const cards = padHomeGiftCards(p.homeGiftShowcase?.cards);
                      cards[index] = { ...cards[index], giftingSearch: e.target.value };
                      return {
                        ...p,
                        homeGiftShowcase: { ...p.homeGiftShowcase, cards },
                      };
                    })
                  }
                  placeholder="Search on gifting page (optional)"
                />
              </>
            )}
            {(card.shopLinkMode || 'custom') === 'product' && (
              <input
                className={`${inputCls} sm:col-span-2`}
                value={card.directProductPath || ''}
                onChange={(e) =>
                  setSettings((p) => {
                    if (!p) return p;
                    const cards = padHomeGiftCards(p.homeGiftShowcase?.cards);
                    cards[index] = { ...cards[index], directProductPath: e.target.value };
                    return {
                      ...p,
                      homeGiftShowcase: { ...p.homeGiftShowcase, cards },
                    };
                  })
                }
                placeholder="Product path, e.g. /shop/your-product-slug"
              />
            )}
            {(card.shopLinkMode || 'custom') === 'custom' && (
              <input
                className={`${inputCls} sm:col-span-2`}
                value={card.shopButtonLink || ''}
                onChange={(e) =>
                  setSettings((p) => {
                    if (!p) return p;
                    const cards = padHomeGiftCards(p.homeGiftShowcase?.cards);
                    cards[index] = { ...cards[index], shopButtonLink: e.target.value };
                    return {
                      ...p,
                      homeGiftShowcase: { ...p.homeGiftShowcase, cards },
                    };
                  })
                }
                placeholder="Any path, e.g. /shop or https://…"
              />
            )}
            {(card.shopLinkMode || 'custom') === 'coming_soon' && (
              <p className="sm:col-span-2 text-xs text-gray-500">
                The primary button shows your label only (no navigation). Use the second button for Gifting or another link.
              </p>
            )}
            <input
              className={inputCls}
              value={card.giftButtonText || ''}
              onChange={(e) =>
                setSettings((p) => {
                  if (!p) return p;
                  const cards = padHomeGiftCards(p.homeGiftShowcase?.cards);
                  cards[index] = { ...cards[index], giftButtonText: e.target.value };
                  return {
                    ...p,
                    homeGiftShowcase: { ...p.homeGiftShowcase, cards },
                  };
                })
              }
              placeholder="Gifting button label"
            />
            <input
              className={inputCls}
              value={card.giftButtonLink || ''}
              onChange={(e) =>
                setSettings((p) => {
                  if (!p) return p;
                  const cards = padHomeGiftCards(p.homeGiftShowcase?.cards);
                  cards[index] = { ...cards[index], giftButtonLink: e.target.value };
                  return {
                    ...p,
                    homeGiftShowcase: { ...p.homeGiftShowcase, cards },
                  };
                })
              }
              placeholder="Gifting URL (e.g. /gifting)"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Pastel background</label>
            <select
              className={`${inputCls} mt-1`}
              value={card.accent || 'rose'}
              onChange={(e) =>
                setSettings((p) => {
                  if (!p) return p;
                  const cards = padHomeGiftCards(p.homeGiftShowcase?.cards);
                  cards[index] = {
                    ...cards[index],
                    accent: e.target.value as HomeGiftShowcaseCard['accent'],
                  };
                  return {
                    ...p,
                    homeGiftShowcase: { ...p.homeGiftShowcase, cards },
                  };
                })
              }
            >
              <option value="rose">Pink / rose</option>
              <option value="amber">Peach / amber</option>
              <option value="sage">Mint / sage</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  )}
</section>

<section className="bg-white rounded-2xl border border-gray-100">

  {/* HEADER */}
  <div
    onClick={() =>
      setActiveSection(activeSection === "gifting1" ? null : "gifting1")
    }
    className="cursor-pointer p-5 flex justify-between items-center"
  >
    <h2 className="font-semibold text-gray-900">
      Gifting Banner 1 (Slider)
    </h2>
    <span>{activeSection === "gifting1" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
  </div>

  {/* CONTENT */}
  {activeSection === "gifting1" && (
    <div className="px-5 pb-5 space-y-4">

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          You can add 4-5 banners here. This is the top rotating gifting banner.
        </p>

        <button
          type="button"
          onClick={() =>
            setSettings((prev) =>
              prev
                ? {
                    ...prev,
                    giftingHeroBanners: [
                      ...(prev.giftingHeroBanners || []),
                      {
                        title: "",
                        description: "",
                        backgroundImage: "",
                        ctaText: "Explore gifts",
                        ctaLink: "/gifting",
                        isActive: true,
                      },
                    ],
                  }
                : prev
            )
          }
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600"
        >
          <Plus className="h-4 w-4" /> Add banner
        </button>
      </div>

      {(settings.giftingHeroBanners || []).map((banner, index) => (
        <div
          key={index}
          className="rounded-xl border border-gray-200 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">
              Banner {index + 1}
            </p>

            <button
              type="button"
              onClick={() =>
                setSettings((prev) =>
                  prev
                    ? {
                        ...prev,
                        giftingHeroBanners: (
                          prev.giftingHeroBanners || []
                        ).filter((_, i) => i !== index),
                      }
                    : prev
                )
              }
              className="text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <ImageUploader
            maxFiles={1}
            aspectRatio="16:9"
            maxSizeMB={5}
            existingImages={
              giftingHeroFiles[index]
                ? []
                : banner.backgroundImage
                ? [banner.backgroundImage]
                : []
            }
            onChange={(files) =>
              setGiftingHeroFiles((prev) => ({
                ...prev,
                [index]: files[0] || null,
              }))
            }
            label="Gifting hero image"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className={inputCls}
              value={banner.title || ""}
              onChange={(e) =>
                setSettings((p) =>
                  p
                    ? {
                        ...p,
                        giftingHeroBanners: (
                          p.giftingHeroBanners || []
                        ).map((b, i) =>
                          i === index ? { ...b, title: e.target.value } : b
                        ),
                      }
                    : p
                )
              }
              placeholder="Title"
            />

            <input
              className={inputCls}
              value={banner.ctaText || ""}
              onChange={(e) =>
                setSettings((p) =>
                  p
                    ? {
                        ...p,
                        giftingHeroBanners: (
                          p.giftingHeroBanners || []
                        ).map((b, i) =>
                          i === index ? { ...b, ctaText: e.target.value } : b
                        ),
                      }
                    : p
                )
              }
              placeholder="Button text"
            />

            <input
              className={inputCls}
              value={banner.ctaLink || ""}
              onChange={(e) =>
                setSettings((p) =>
                  p
                    ? {
                        ...p,
                        giftingHeroBanners: (
                          p.giftingHeroBanners || []
                        ).map((b, i) =>
                          i === index ? { ...b, ctaLink: e.target.value } : b
                        ),
                      }
                    : p
                )
              }
              placeholder="Button link"
            />
          </div>

          <textarea
            className={inputCls}
            rows={2}
            value={banner.description || ""}
            onChange={(e) =>
              setSettings((p) =>
                p
                  ? {
                      ...p,
                      giftingHeroBanners: (
                        p.giftingHeroBanners || []
                      ).map((b, i) =>
                        i === index
                          ? { ...b, description: e.target.value }
                          : b
                      ),
                    }
                  : p
              )
            }
            placeholder="Description"
          />
        </div>
      ))}

    </div>
  )}
</section>

<section className="bg-white rounded-2xl border border-gray-100">

  {/* HEADER */}
  <div
    onClick={() =>
      setActiveSection(activeSection === "gifting2" ? null : "gifting2")
    }
    className="cursor-pointer p-5 flex justify-between items-center"
  >
    <h2 className="font-semibold text-gray-900">
      Gifting Banner 2 (Cards)
    </h2>
    <span>{activeSection === "gifting2" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
  </div>

  {/* CONTENT */}
  {activeSection === "gifting2" && (
    <div className="px-5 pb-5 space-y-4">

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          You can keep 1-2 cards here for the second gifting banner section.
        </p>

        <button
          type="button"
          onClick={() =>
            setSettings((prev) =>
              prev
                ? {
                    ...prev,
                    giftingSecondaryBanners: [
                      ...(prev.giftingSecondaryBanners || []),
                      {
                        eyebrow: "",
                        title: "",
                        image: "",
                        ctaText: "Shop now",
                        ctaLink: "/gifting",
                        isActive: true,
                      },
                    ],
                  }
                : prev
            )
          }
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600"
        >
          <Plus className="h-4 w-4" /> Add card
        </button>
      </div>

      {(settings.giftingSecondaryBanners || []).map((banner, index) => (
        <div
          key={index}
          className="rounded-xl border border-gray-200 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">
              Card {index + 1}
            </p>

            <button
              type="button"
              onClick={() =>
                setSettings((prev) =>
                  prev
                    ? {
                        ...prev,
                        giftingSecondaryBanners: (
                          prev.giftingSecondaryBanners || []
                        ).filter((_, i) => i !== index),
                      }
                    : prev
                )
              }
              className="text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <ImageUploader
            maxFiles={1}
            aspectRatio="16:9"
            maxSizeMB={5}
            existingImages={
              giftingSecondaryFiles[index]
                ? []
                : banner.image
                ? [banner.image]
                : []
            }
            onChange={(files) =>
              setGiftingSecondaryFiles((prev) => ({
                ...prev,
                [index]: files[0] || null,
              }))
            }
            label="Gifting secondary image"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className={inputCls}
              value={banner.eyebrow || ""}
              onChange={(e) =>
                setSettings((p) =>
                  p
                    ? {
                        ...p,
                        giftingSecondaryBanners: (
                          p.giftingSecondaryBanners || []
                        ).map((b, i) =>
                          i === index
                            ? { ...b, eyebrow: e.target.value }
                            : b
                        ),
                      }
                    : p
                )
              }
              placeholder="Eyebrow"
            />

            <input
              className={inputCls}
              value={banner.title || ""}
              onChange={(e) =>
                setSettings((p) =>
                  p
                    ? {
                        ...p,
                        giftingSecondaryBanners: (
                          p.giftingSecondaryBanners || []
                        ).map((b, i) =>
                          i === index
                            ? { ...b, title: e.target.value }
                            : b
                        ),
                      }
                    : p
                )
              }
              placeholder="Title"
            />

            <input
              className={inputCls}
              value={banner.ctaText || ""}
              onChange={(e) =>
                setSettings((p) =>
                  p
                    ? {
                        ...p,
                        giftingSecondaryBanners: (
                          p.giftingSecondaryBanners || []
                        ).map((b, i) =>
                          i === index
                            ? { ...b, ctaText: e.target.value }
                            : b
                        ),
                      }
                    : p
                )
              }
              placeholder="Button text"
            />

            <input
              className={inputCls}
              value={banner.ctaLink || ""}
              onChange={(e) =>
                setSettings((p) =>
                  p
                    ? {
                        ...p,
                        giftingSecondaryBanners: (
                          p.giftingSecondaryBanners || []
                        ).map((b, i) =>
                          i === index
                            ? { ...b, ctaLink: e.target.value }
                            : b
                        ),
                      }
                    : p
                )
              }
              placeholder="Button link"
            />
          </div>

        </div>
      ))}

    </div>
  )}
</section>

    <section className="bg-white rounded-2xl border border-gray-100">

  {/* HEADER */}
  <div
    onClick={() =>
      setActiveSection(activeSection === "footer" ? null : "footer")
    }
    className="cursor-pointer p-5 flex justify-between items-center"
  >
    <h2 className="font-semibold text-gray-900">
      Footer Settings
    </h2>
    <span>{activeSection === "footer" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
  </div>

  {/* CONTENT */}
  {activeSection === "footer" && (
    <div className="px-5 pb-5 space-y-3">

      <textarea
        className={inputCls}
        rows={2}
        value={settings.footer.description || ""}
        onChange={(e) =>
          setSettings((p) =>
            p
              ? {
                  ...p,
                  footer: {
                    ...p.footer,
                    description: e.target.value,
                  },
                }
              : p
          )
        }
        placeholder="Footer description"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          className={inputCls}
          value={settings.footer.contactAddress || ""}
          onChange={(e) =>
            setSettings((p) =>
              p
                ? {
                    ...p,
                    footer: {
                      ...p.footer,
                      contactAddress: e.target.value,
                    },
                  }
                : p
            )
          }
          placeholder="Contact address"
        />

        <input
          className={inputCls}
          value={settings.footer.contactPhone || ""}
          onChange={(e) =>
            setSettings((p) =>
              p
                ? {
                    ...p,
                    footer: {
                      ...p.footer,
                      contactPhone: e.target.value,
                    },
                  }
                : p
            )
          }
          placeholder="Contact phone"
        />

        <input
          className={inputCls}
          value={settings.footer.contactEmail || ""}
          onChange={(e) =>
            setSettings((p) =>
              p
                ? {
                    ...p,
                    footer: {
                      ...p.footer,
                      contactEmail: e.target.value,
                    },
                  }
                : p
            )
          }
          placeholder="Contact email"
        />

        <input
          className={inputCls}
          type="number"
          value={settings.footer.categoryLimit || 7}
          onChange={(e) =>
            setSettings((p) =>
              p
                ? {
                    ...p,
                    footer: {
                      ...p.footer,
                      categoryLimit: Number(e.target.value) || 7,
                    },
                  }
                : p
            )
          }
          placeholder="Category limit"
        />

        <input
          className={inputCls}
          value={settings.footer.facebookUrl || ""}
          onChange={(e) =>
            setSettings((p) =>
              p
                ? {
                    ...p,
                    footer: {
                      ...p.footer,
                      facebookUrl: e.target.value,
                    },
                  }
                : p
            )
          }
          placeholder="Facebook URL"
        />

        <input
          className={inputCls}
          value={settings.footer.instagramUrl || ""}
          onChange={(e) =>
            setSettings((p) =>
              p
                ? {
                    ...p,
                    footer: {
                      ...p.footer,
                      instagramUrl: e.target.value,
                    },
                  }
                : p
            )
          }
          placeholder="Instagram URL"
        />

        <input
          className={inputCls}
          value={settings.footer.twitterUrl || ""}
          onChange={(e) =>
            setSettings((p) =>
              p
                ? {
                    ...p,
                    footer: {
                      ...p.footer,
                      twitterUrl: e.target.value,
                    },
                  }
                : p
            )
          }
          placeholder="Twitter/X URL"
        />

        <input
          className={inputCls}
          value={settings.footer.youtubeUrl || ""}
          onChange={(e) =>
            setSettings((p) =>
              p
                ? {
                    ...p,
                    footer: {
                      ...p.footer,
                      youtubeUrl: e.target.value,
                    },
                  }
                : p
            )
          }
          placeholder="YouTube URL"
        />
      </div>

    </div>
  )}
</section>
    </div>
  );
}
