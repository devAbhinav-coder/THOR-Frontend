'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import StorefrontAdminShell from '@/components/admin/storefront/StorefrontAdminShell';
import StorefrontSectionPanel from '@/components/admin/storefront/StorefrontSectionPanel';
import {
  getStorefrontSection,
  type StorefrontSectionId,
} from '@/components/admin/storefront/storefrontSections';
import { adminApi, categoryApi, giftingApi } from '@/lib/api';
import {
  Category,
  HeroSlide,
  HomeEditorialGalleryTile,
  HomeGiftShowcaseCard,
  HomeGiftShopLinkMode,
  StorefrontSettings,
} from '@/types';
import ImageUploader from '@/components/ui/ImageUploader';
import ExploreHouseShowcaseCard from '@/components/home/ExploreHouseShowcaseCard';
import {
  resolveGiftingCard,
  resolveGiftingCardImage,
  resolveSaleCard,
  resolveSaleCardImage,
} from '@/lib/shopSpecialCollections';
import { revalidateStorefrontCache } from '@/actions/revalidateStorefrontCache';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

/* ─── Shared styles & small form primitives ─────────────────── */

const inputCls =
  'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-400/60 focus:border-transparent transition-all placeholder:text-gray-400';

/** Labeled field — every input gets a visible label so the form stays readable after typing. */
function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-semibold text-gray-600">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] leading-relaxed text-gray-400">{hint}</p>}
    </div>
  );
}

/** Accessible on/off switch — clearer than a bare checkbox. */
function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-left transition hover:border-gray-300"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-gray-800">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-gray-500">{description}</span>
        )}
      </span>
      <span
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
          checked ? 'bg-brand-600' : 'bg-gray-300',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200',
            checked ? 'left-[calc(100%-1.375rem)]' : 'left-0.5',
          )}
        />
      </span>
    </button>
  );
}

/** Card wrapper for repeated list items (slides / banners / cards) with a clear header + delete. */
function ItemCard({
  title,
  badge,
  onDelete,
  deleteLabel,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  onDelete?: () => void;
  deleteLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/70 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-bold text-navy-900">{title}</p>
          {badge}
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleteLabel ?? 'Remove'}
          </button>
        )}
      </div>
      <div className="space-y-3 p-4">{children}</div>
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
    >
      <Plus className="h-4 w-4" /> {label}
    </button>
  );
}

function EmptyListHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/60 px-4 py-8 text-center text-sm text-gray-500">
      {children}
    </div>
  );
}

function QuickLinkChips({
  onPick,
}: {
  onPick: (value: string) => void;
}) {
  const presets: Array<[string, string]> = [
    ['Shop All', '/shop'],
    ['New Arrivals', '/shop?sort=-createdAt'],
    ['Featured', '/shop?isFeatured=true'],
  ];
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className="text-gray-500">Quick fill:</span>
      {presets.map(([label, value]) => (
        <button
          key={value}
          type="button"
          onClick={() => onPick(value)}
          className="rounded-md bg-gray-100 px-2 py-1 font-medium text-gray-600 transition hover:bg-gray-200"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/* ─── Pure helpers ──────────────────────────────────────────── */

type BlogBannerFields = StorefrontSettings['blogBanner'];
type ShopBannerFields = NonNullable<StorefrontSettings['shopBanner']>;
type PromoBannerFields = StorefrontSettings['promoBanner'];
type FooterFields = StorefrontSettings['footer'];
type MiddleBannerFields = NonNullable<StorefrontSettings['homeMiddleBanner']>;
type GiftingHeroBannerItem = NonNullable<StorefrontSettings['giftingHeroBanners']>[number];
type GiftingSecondaryBannerItem = NonNullable<
  StorefrontSettings['giftingSecondaryBanners']
>[number];

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

function padHomeEditorialTiles(
  tiles: HomeEditorialGalleryTile[] | undefined,
): HomeEditorialGalleryTile[] {
  const base = [...(tiles || [])];
  while (base.length < 3) {
    base.push({ image: '', link: '', alt: '' });
  }
  return base.slice(0, 3);
}

function padHomeGiftCards(
  cards: HomeGiftShowcaseCard[] | undefined,
): HomeGiftShowcaseCard[] {
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
}

/**
 * After deleting a list item, shift the pending-file map so each selected
 * image stays attached to the same item (indexes above the removed one move down).
 */
function remapFilesAfterRemoval(
  prev: Record<number, File | null>,
  removedIndex: number,
): Record<number, File | null> {
  const next: Record<number, File | null> = {};
  for (const [k, file] of Object.entries(prev)) {
    const i = Number(k);
    if (Number.isNaN(i) || i === removedIndex) continue;
    next[i < removedIndex ? i : i - 1] = file;
  }
  return next;
}

/* ─── Page ──────────────────────────────────────────────────── */

export default function AdminStorefrontPage() {
  const [settings, setSettings] = useState<StorefrontSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [giftOccasionCategories, setGiftOccasionCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [announcementDraft, setAnnouncementDraft] = useState('');
  const [heroImageFiles, setHeroImageFiles] = useState<Record<number, File | null>>({});
  const [promoBgFile, setPromoBgFile] = useState<File | null>(null);
  const [blogMainFile, setBlogMainFile] = useState<File | null>(null);
  const [blogSideFile, setBlogSideFile] = useState<File | null>(null);
  const [shopBannerLeftFile, setShopBannerLeftFile] = useState<File | null>(null);
  const [shopBannerCenterFile, setShopBannerCenterFile] = useState<File | null>(null);
  const [shopBannerRightFile, setShopBannerRightFile] = useState<File | null>(null);
  const [homeMiddleBannerFile, setHomeMiddleBannerFile] = useState<File | null>(null);
  const [homeExploreHouseSaleFile, setHomeExploreHouseSaleFile] = useState<File | null>(null);
  const [homeExploreHouseGiftingFile, setHomeExploreHouseGiftingFile] = useState<File | null>(null);
  const [giftingHeroFiles, setGiftingHeroFiles] = useState<Record<number, File | null>>({});
  const [giftingSecondaryFiles, setGiftingSecondaryFiles] = useState<Record<number, File | null>>({});
  const [homeGiftCardFiles, setHomeGiftCardFiles] = useState<Record<number, File | null>>({});
  const [homeEditorialTileFiles, setHomeEditorialTileFiles] = useState<Record<number, File | null>>({});
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [pendingFocusSlide, setPendingFocusSlide] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<StorefrontSectionId>('announcement');
  const contentTopRef = useRef<HTMLDivElement>(null);

  /** Route all edits through this so the "Unsaved changes" state stays accurate. */
  const mutate = useCallback((fn: (s: StorefrontSettings) => StorefrontSettings) => {
    setSettings((p) => (p ? fn(p) : p));
    setIsDirty(true);
  }, []);

  const markDirty = useCallback(() => setIsDirty(true), []);

  useEffect(() => {
    contentTopRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, [activeSection]);

  useEffect(() => {
    if (pendingFocusSlide === null) return;
    const el = slideRefs.current[pendingFocusSlide];
    if (!el) return;
    el.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    const firstInput = el.querySelector('input');
    if (firstInput instanceof HTMLInputElement) firstInput.focus();
    setPendingFocusSlide(null);
  }, [pendingFocusSlide, settings?.heroSlides.length]);

  /* Warn before leaving the page with unsaved edits */
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const [homeExploreHouseSalePreview, setHomeExploreHouseSalePreview] = useState<string | null>(null);
  const [homeExploreHouseGiftingPreview, setHomeExploreHouseGiftingPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!homeExploreHouseSaleFile) {
      setHomeExploreHouseSalePreview(null);
      return;
    }
    const url = URL.createObjectURL(homeExploreHouseSaleFile);
    setHomeExploreHouseSalePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [homeExploreHouseSaleFile]);

  useEffect(() => {
    if (!homeExploreHouseGiftingFile) {
      setHomeExploreHouseGiftingPreview(null);
      return;
    }
    const url = URL.createObjectURL(homeExploreHouseGiftingFile);
    setHomeExploreHouseGiftingPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [homeExploreHouseGiftingFile]);

  const exploreHouseSalePreviewImage = useMemo(
    () => homeExploreHouseSalePreview || resolveSaleCardImage(settings?.homeExploreHouse),
    [homeExploreHouseSalePreview, settings?.homeExploreHouse],
  );

  const exploreHouseGiftingPreviewImage = useMemo(
    () =>
      homeExploreHouseGiftingPreview ||
      resolveGiftingCardImage(categories, settings?.homeExploreHouse),
    [homeExploreHouseGiftingPreview, categories, settings?.homeExploreHouse],
  );

  const exploreHouseSalePreviewCard = useMemo(
    () =>
      resolveSaleCard({
        ...settings?.homeExploreHouse,
        saleImage: exploreHouseSalePreviewImage,
      }),
    [settings?.homeExploreHouse, exploreHouseSalePreviewImage],
  );

  const exploreHouseGiftingPreviewCard = useMemo(
    () =>
      resolveGiftingCard(categories, {
        ...settings?.homeExploreHouse,
        giftingImage: exploreHouseGiftingPreviewImage,
      }),
    [categories, settings?.homeExploreHouse, exploreHouseGiftingPreviewImage],
  );

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

  /* ── Section-scoped patch helpers (all mark the form dirty) ── */

  const updateSlide = (index: number, patch: Partial<HeroSlide>) =>
    mutate((s) => {
      const next = [...s.heroSlides];
      next[index] = { ...next[index], ...patch };
      return { ...s, heroSlides: next };
    });

  const patchPromo = (patch: Partial<PromoBannerFields>) =>
    mutate((s) => ({ ...s, promoBanner: { ...s.promoBanner, ...patch } }));

  const patchBlog = (patch: Partial<BlogBannerFields>) =>
    mutate((s) => ({
      ...s,
      blogBanner: { ...s.blogBanner, ...patch } as BlogBannerFields,
    }));

  const patchFooter = (patch: Partial<FooterFields>) =>
    mutate((s) => ({ ...s, footer: { ...s.footer, ...patch } }));

  const patchMiddleBanner = (patch: Partial<MiddleBannerFields>) =>
    mutate((s) => ({
      ...s,
      homeMiddleBanner: { ...s.homeMiddleBanner, ...patch },
    }));

  const ensureShopBanner = (p: StorefrontSettings): ShopBannerFields => ({
    title: p.shopBanner?.title || '',
    subtitle: p.shopBanner?.subtitle || '',
    leftImage: p.shopBanner?.leftImage || '',
    leftImagePublicId: p.shopBanner?.leftImagePublicId,
    centerImage: p.shopBanner?.centerImage || '',
    centerImagePublicId: p.shopBanner?.centerImagePublicId,
    rightImage: p.shopBanner?.rightImage || '',
    rightImagePublicId: p.shopBanner?.rightImagePublicId,
    isActive: p.shopBanner?.isActive !== false,
  });

  const patchShopBanner = (patch: Partial<ShopBannerFields>) =>
    mutate((s) => ({ ...s, shopBanner: { ...ensureShopBanner(s), ...patch } }));

  const patchHomeExploreHouse = (
    patch: Partial<NonNullable<StorefrontSettings['homeExploreHouse']>>,
  ) =>
    mutate((s) => ({
      ...s,
      homeExploreHouse: { ...s.homeExploreHouse, ...patch },
    }));

  const patchShowcase = (
    patch: Partial<NonNullable<StorefrontSettings['homeGiftShowcase']>>,
  ) =>
    mutate((s) => ({
      ...s,
      homeGiftShowcase: {
        ...s.homeGiftShowcase,
        ...patch,
        cards: patch.cards ?? padHomeGiftCards(s.homeGiftShowcase?.cards),
      },
    }));

  const patchGiftCard = (index: number, patch: Partial<HomeGiftShowcaseCard>) =>
    mutate((s) => {
      const cards = padHomeGiftCards(s.homeGiftShowcase?.cards);
      cards[index] = { ...cards[index], ...patch };
      return { ...s, homeGiftShowcase: { ...s.homeGiftShowcase, cards } };
    });

  const patchEditorial = (
    patch: Partial<NonNullable<StorefrontSettings['homeEditorialGallery']>>,
  ) =>
    mutate((s) => ({
      ...s,
      homeEditorialGallery: {
        ...s.homeEditorialGallery,
        ...patch,
        tiles: patch.tiles ?? padHomeEditorialTiles(s.homeEditorialGallery?.tiles),
      },
    }));

  const patchEditorialTile = (index: number, patch: Partial<HomeEditorialGalleryTile>) =>
    mutate((s) => {
      const tiles = padHomeEditorialTiles(s.homeEditorialGallery?.tiles);
      tiles[index] = { ...tiles[index], ...patch };
      return { ...s, homeEditorialGallery: { ...s.homeEditorialGallery, tiles } };
    });

  const patchGiftingHero = (index: number, patch: Partial<GiftingHeroBannerItem>) =>
    mutate((s) => ({
      ...s,
      giftingHeroBanners: (s.giftingHeroBanners || []).map((b, i) =>
        i === index ? { ...b, ...patch } : b,
      ),
    }));

  const patchGiftingSecondary = (
    index: number,
    patch: Partial<GiftingSecondaryBannerItem>,
  ) =>
    mutate((s) => ({
      ...s,
      giftingSecondaryBanners: (s.giftingSecondaryBanners || []).map((b, i) =>
        i === index ? { ...b, ...patch } : b,
      ),
    }));

  /* ── Save ── */

  const serializeSettingsForSave = (s: StorefrontSettings) => {
    const sb = s.shopBanner;
    const editorialTiles = padHomeEditorialTiles(s.homeEditorialGallery?.tiles).map(
      (tile) => ({
        ...tile,
        imagePublicId: tile.imagePublicId ?? undefined,
      }),
    );
    return JSON.stringify({
      ...s,
      shopBanner: sb
        ? {
            ...sb,
            leftImagePublicId: sb.leftImagePublicId ?? undefined,
            centerImagePublicId: sb.centerImagePublicId ?? undefined,
            rightImagePublicId: sb.rightImagePublicId ?? undefined,
          }
        : sb,
      homeEditorialGallery: s.homeEditorialGallery
        ? { ...s.homeEditorialGallery, tiles: editorialTiles }
        : { isActive: true, tiles: editorialTiles },
      homeExploreHouse: s.homeExploreHouse
        ? {
            ...s.homeExploreHouse,
            saleImagePublicId: s.homeExploreHouse.saleImagePublicId ?? undefined,
            giftingImagePublicId:
              s.homeExploreHouse.giftingImagePublicId ?? undefined,
          }
        : s.homeExploreHouse,
    });
  };

  const save = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append('settings', serializeSettingsForSave(settings));
      Object.entries(heroImageFiles).forEach(([index, file]) => {
        if (file) fd.append(`heroImage_${index}`, file);
      });
      if (promoBgFile) fd.append('promoBackground', promoBgFile);
      if (blogMainFile) fd.append('blogMainImage', blogMainFile);
      if (blogSideFile) fd.append('blogSideImage', blogSideFile);
      if (shopBannerLeftFile) fd.append('shopBannerLeftImage', shopBannerLeftFile);
      if (shopBannerCenterFile) fd.append('shopBannerCenterImage', shopBannerCenterFile);
      if (shopBannerRightFile) fd.append('shopBannerRightImage', shopBannerRightFile);
      if (homeMiddleBannerFile) fd.append('homeMiddleBanner', homeMiddleBannerFile);
      if (homeExploreHouseSaleFile) {
        fd.append('homeExploreHouseSaleImage', homeExploreHouseSaleFile);
      }
      if (homeExploreHouseGiftingFile) {
        fd.append('homeExploreHouseGiftingImage', homeExploreHouseGiftingFile);
      }
      Object.entries(giftingHeroFiles).forEach(([index, file]) => {
        if (file) fd.append(`giftingHeroImage_${index}`, file);
      });
      Object.entries(giftingSecondaryFiles).forEach(([index, file]) => {
        if (file) fd.append(`giftingSecondaryImage_${index}`, file);
      });
      Object.entries(homeGiftCardFiles).forEach(([index, file]) => {
        if (file) fd.append(`homeGiftCardImage_${index}`, file);
      });
      Object.entries(homeEditorialTileFiles).forEach(([index, file]) => {
        if (file) fd.append(`homeEditorialTileImage_${index}`, file);
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
      setHomeMiddleBannerFile(null);
      setHomeExploreHouseSaleFile(null);
      setHomeExploreHouseGiftingFile(null);
      setGiftingHeroFiles({});
      setGiftingSecondaryFiles({});
      setHomeGiftCardFiles({});
      setHomeEditorialTileFiles({});
      setIsDirty(false);
      toast.success('Storefront settings updated');
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-16 text-center">
        <div className="h-10 w-10 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
        <p className="text-sm font-medium text-gray-500">Loading storefront settings…</p>
      </div>
    );
  }

  const addAnnouncement = () => {
    const value = announcementDraft.trim();
    if (!value) return;
    mutate((s) => ({
      ...s,
      announcementMessages: [...s.announcementMessages, value],
    }));
    setAnnouncementDraft('');
  };

  const productCategoriesForGiftCard = categories.filter((c) => !c.isGiftCategory);
  const productCategoryOptions =
    productCategoriesForGiftCard.length > 0 ? productCategoriesForGiftCard : categories;

  const sectionMeta = getStorefrontSection(activeSection);

  return (
    <StorefrontAdminShell
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      onSave={save}
      isSaving={isSaving}
      isDirty={isDirty}
    >
      <div ref={contentTopRef} />

      {/* ══ Announcements ══ */}
      {activeSection === 'announcement' && (
        <StorefrontSectionPanel
          title={sectionMeta.label}
          description={sectionMeta.description}
          icon={sectionMeta.icon}
        >
          <div className="space-y-4">
            <Field
              label="New announcement"
              hint="Press Enter or click Add. Messages rotate in the top bar of every page."
            >
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  className={inputCls}
                  value={announcementDraft}
                  onChange={(e) => setAnnouncementDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAnnouncement();
                    }
                  }}
                  placeholder="e.g. Use code WELCOME10 on first order"
                />
                <button
                  type="button"
                  onClick={addAnnouncement}
                  disabled={!announcementDraft.trim()}
                  className="shrink-0 rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            </Field>

            {settings.announcementMessages.length === 0 ? (
              <EmptyListHint>
                No announcements yet — add one above to show a message bar on the site.
              </EmptyListHint>
            ) : (
              <div className="space-y-2">
                {settings.announcementMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2"
                  >
                    <span className="w-5 shrink-0 text-xs font-semibold text-gray-400">
                      {idx + 1}.
                    </span>
                    <input
                      className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 focus:outline-none"
                      value={msg}
                      onChange={(e) =>
                        mutate((s) => {
                          const next = [...s.announcementMessages];
                          next[idx] = e.target.value;
                          return { ...s, announcementMessages: next };
                        })
                      }
                      aria-label={`Announcement ${idx + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        mutate((s) => ({
                          ...s,
                          announcementMessages: s.announcementMessages.filter(
                            (_, i) => i !== idx,
                          ),
                        }))
                      }
                      className="shrink-0 rounded-lg p-1.5 text-red-500 transition hover:bg-red-50"
                      aria-label={`Delete announcement ${idx + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </StorefrontSectionPanel>
      )}

      {/* ══ Hero carousel ══ */}
      {activeSection === 'hero' && (
        <StorefrontSectionPanel
          title={sectionMeta.label}
          description={`${sectionMeta.description} — ${settings.heroSlides.length} slide${settings.heroSlides.length !== 1 ? 's' : ''}`}
          icon={sectionMeta.icon}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-gray-500">
                Slides rotate automatically on the homepage. Inactive slides stay saved but hidden.
              </p>
              <AddButton
                label="Add slide"
                onClick={() => {
                  setPendingFocusSlide(settings.heroSlides.length);
                  mutate((s) => ({
                    ...s,
                    heroSlides: [...s.heroSlides, { ...emptySlide }],
                  }));
                }}
              />
            </div>

            {settings.heroSlides.length === 0 && (
              <EmptyListHint>
                No slides yet — click “Add slide” to create the first homepage hero slide.
              </EmptyListHint>
            )}

            {settings.heroSlides.map((slide, index) => (
              <div
                key={index}
                ref={(el) => {
                  slideRefs.current[index] = el;
                }}
              >
                <ItemCard
                  title={slide.title.trim() || `Slide ${index + 1}`}
                  badge={
                    slide.isActive === false ? (
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        Hidden
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                        Live
                      </span>
                    )
                  }
                  deleteLabel="Delete slide"
                  onDelete={() => {
                    setHeroImageFiles((prev) => remapFilesAfterRemoval(prev, index));
                    slideRefs.current.splice(index, 1);
                    mutate((s) => ({
                      ...s,
                      heroSlides: s.heroSlides.filter((_, i) => i !== index),
                    }));
                  }}
                >
                  <Toggle
                    checked={slide.isActive !== false}
                    onChange={(checked) => updateSlide(index, { isActive: checked })}
                    label="Show this slide on the homepage"
                  />

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Field label="Title">
                      <input
                        className={inputCls}
                        value={slide.title}
                        onChange={(e) => updateSlide(index, { title: e.target.value })}
                        placeholder="e.g. Elegance in Every Thread"
                      />
                    </Field>
                    <Field label="Subtitle">
                      <input
                        className={inputCls}
                        value={slide.subtitle || ''}
                        onChange={(e) => updateSlide(index, { subtitle: e.target.value })}
                        placeholder="e.g. New Silk Saree Collection"
                      />
                    </Field>
                    <Field label="Badge" hint="Small tag shown on the slide, e.g. “New Collection”.">
                      <input
                        className={inputCls}
                        value={slide.badge || ''}
                        onChange={(e) => updateSlide(index, { badge: e.target.value })}
                        placeholder="e.g. New Collection"
                      />
                    </Field>
                    <Field label="Primary button text">
                      <input
                        className={inputCls}
                        value={slide.ctaText || ''}
                        onChange={(e) => updateSlide(index, { ctaText: e.target.value })}
                        placeholder="e.g. Shop Sarees"
                      />
                    </Field>
                    <Field label="Primary button link">
                      <input
                        className={inputCls}
                        value={slide.ctaLink || ''}
                        onChange={(e) => updateSlide(index, { ctaLink: e.target.value })}
                        placeholder="e.g. /shop?category=Sarees"
                      />
                      <div className="mt-1.5">
                        <QuickLinkChips
                          onPick={(value) => updateSlide(index, { ctaLink: value })}
                        />
                      </div>
                    </Field>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:col-span-1">
                      <Field label="Secondary button text">
                        <input
                          className={inputCls}
                          value={slide.secondaryCtaText || ''}
                          onChange={(e) =>
                            updateSlide(index, { secondaryCtaText: e.target.value })
                          }
                          placeholder="e.g. View All"
                        />
                      </Field>
                      <Field label="Secondary button link">
                        <input
                          className={inputCls}
                          value={slide.secondaryCtaLink || ''}
                          onChange={(e) =>
                            updateSlide(index, { secondaryCtaLink: e.target.value })
                          }
                          placeholder="e.g. /shop"
                        />
                      </Field>
                    </div>
                  </div>

                  <Field label="Description">
                    <textarea
                      rows={2}
                      className={inputCls}
                      value={slide.description || ''}
                      onChange={(e) => updateSlide(index, { description: e.target.value })}
                      placeholder="Short supporting text under the title"
                    />
                  </Field>

                  <ImageUploader
                    maxFiles={1}
                    aspectRatio="16:9"
                    maxSizeMB={5}
                    existingImages={
                      heroImageFiles[index] ? []
                      : slide.image ? [slide.image]
                      : []
                    }
                    onRemoveExisting={() => {
                      updateSlide(index, { image: '', imagePublicId: undefined });
                      setHeroImageFiles((prev) => ({ ...prev, [index]: null }));
                    }}
                    onChange={(files) => {
                      setHeroImageFiles((prev) => ({
                        ...prev,
                        [index]: files[0] || null,
                      }));
                      markDirty();
                    }}
                    label="Slide background image"
                    hint="Uploads when you press Save. Tap the × on a thumbnail to remove it."
                  />
                </ItemCard>
              </div>
            ))}
          </div>
        </StorefrontSectionPanel>
      )}

      {/* ══ Explore our house ══ */}
      {activeSection === 'exploreHouse' && (
        <StorefrontSectionPanel
          title={sectionMeta.label}
          description={sectionMeta.description}
          icon={sectionMeta.icon}
        >
          <div className="space-y-5">
            <p className="text-xs text-gray-500">
              Upload portrait images (3:4) and edit card labels. Sale appears first; Gifting last.
              Links are fixed — Sale → shop offers, Gifting → gifting page.
            </p>

            <div className="grid gap-5 md:grid-cols-2">
              <ItemCard title="Sale card">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Title">
                    <input
                      className={inputCls}
                      value={settings.homeExploreHouse?.saleName ?? 'Sale'}
                      onChange={(e) => patchHomeExploreHouse({ saleName: e.target.value })}
                      placeholder="Sale"
                      maxLength={48}
                    />
                  </Field>
                  <Field label="Label">
                    <input
                      className={inputCls}
                      value={settings.homeExploreHouse?.saleSubtitle ?? 'ON OFFER'}
                      onChange={(e) =>
                        patchHomeExploreHouse({ saleSubtitle: e.target.value })
                      }
                      placeholder="ON OFFER"
                      maxLength={48}
                    />
                  </Field>
                </div>
                <ImageUploader
                  maxFiles={1}
                  aspectRatio="3:4"
                  maxSizeMB={5}
                  existingImages={
                    homeExploreHouseSaleFile ? []
                    : settings.homeExploreHouse?.saleImage ?
                      [settings.homeExploreHouse.saleImage]
                    : []
                  }
                  onRemoveExisting={() => {
                    patchHomeExploreHouse({ saleImage: '', saleImagePublicId: undefined });
                    setHomeExploreHouseSaleFile(null);
                  }}
                  onChange={(files) => {
                    setHomeExploreHouseSaleFile(files[0] || null);
                    markDirty();
                  }}
                  label="Sale image (first card)"
                  hint="Shown before category cards on homepage & shop."
                />
              </ItemCard>

              <ItemCard title="Gifting card">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Title">
                    <input
                      className={inputCls}
                      value={settings.homeExploreHouse?.giftingName ?? 'Gifting'}
                      onChange={(e) =>
                        patchHomeExploreHouse({ giftingName: e.target.value })
                      }
                      placeholder="Gifting"
                      maxLength={48}
                    />
                  </Field>
                  <Field label="Label">
                    <input
                      className={inputCls}
                      value={settings.homeExploreHouse?.giftingSubtitle ?? 'THE COLLECTION'}
                      onChange={(e) =>
                        patchHomeExploreHouse({ giftingSubtitle: e.target.value })
                      }
                      placeholder="THE COLLECTION"
                      maxLength={48}
                    />
                  </Field>
                </div>
                <ImageUploader
                  maxFiles={1}
                  aspectRatio="3:4"
                  maxSizeMB={5}
                  existingImages={
                    homeExploreHouseGiftingFile ? []
                    : settings.homeExploreHouse?.giftingImage ?
                      [settings.homeExploreHouse.giftingImage]
                    : []
                  }
                  onRemoveExisting={() => {
                    patchHomeExploreHouse({
                      giftingImage: '',
                      giftingImagePublicId: undefined,
                    });
                    setHomeExploreHouseGiftingFile(null);
                  }}
                  onChange={(files) => {
                    setHomeExploreHouseGiftingFile(files[0] || null);
                    markDirty();
                  }}
                  label="Gifting image (last card)"
                  hint="Links to /gifting on homepage & shop."
                />
              </ItemCard>
            </div>

            <div className="rounded-xl border border-dashed border-emerald-200 bg-[#f9f9f9] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                Homepage label preview
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Live preview of card title + label — updates as you type.
              </p>
              <div className="mt-4 flex flex-wrap items-end justify-center gap-4">
                <ExploreHouseShowcaseCard
                  disableLoader
                  className="!w-[112px] !min-w-0 !max-w-[112px] !flex-none sm:!w-[128px] sm:!max-w-[128px]"
                  card={exploreHouseSalePreviewCard}
                />
                <ExploreHouseShowcaseCard
                  disableLoader
                  className="!w-[112px] !min-w-0 !max-w-[112px] !flex-none sm:!w-[128px] sm:!max-w-[128px]"
                  card={exploreHouseGiftingPreviewCard}
                />
              </div>
            </div>
          </div>
        </StorefrontSectionPanel>
      )}

      {/* ══ Promo & editorial ══ */}
      {activeSection === 'promo' && (
        <StorefrontSectionPanel
          title={sectionMeta.label}
          description={sectionMeta.description}
          icon={sectionMeta.icon}
        >
          <div className="space-y-4">
            <ImageUploader
              maxFiles={1}
              aspectRatio="16:9"
              maxSizeMB={5}
              existingImages={
                promoBgFile ? []
                : settings.promoBanner.backgroundImage ?
                  [settings.promoBanner.backgroundImage]
                : []
              }
              onRemoveExisting={() => {
                patchPromo({ backgroundImage: '', backgroundImagePublicId: undefined });
                setPromoBgFile(null);
              }}
              onChange={(files) => {
                setPromoBgFile(files[0] || null);
                markDirty();
              }}
              label="Promo background image"
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Eyebrow text" hint="Small line above the title.">
                <input
                  className={inputCls}
                  value={settings.promoBanner.eyebrow || ''}
                  onChange={(e) => patchPromo({ eyebrow: e.target.value })}
                  placeholder="e.g. The House of Rani"
                />
              </Field>
              <Field label="Title">
                <input
                  className={inputCls}
                  value={settings.promoBanner.title || ''}
                  onChange={(e) => patchPromo({ title: e.target.value })}
                  placeholder="e.g. Festive-ready pieces"
                />
              </Field>
              <Field label="Primary button text">
                <input
                  className={inputCls}
                  value={settings.promoBanner.primaryButtonText || ''}
                  onChange={(e) => patchPromo({ primaryButtonText: e.target.value })}
                  placeholder="e.g. Shop New Arrivals"
                />
              </Field>
              <Field label="Primary button link">
                <input
                  className={inputCls}
                  value={settings.promoBanner.primaryButtonLink || ''}
                  onChange={(e) => patchPromo({ primaryButtonLink: e.target.value })}
                  placeholder="e.g. /shop?sort=-createdAt"
                />
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <QuickLinkChips
                    onPick={(value) => patchPromo({ primaryButtonLink: value })}
                  />
                  <select
                    className="h-7 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-600"
                    onChange={(e) => {
                      if (!e.target.value) return;
                      patchPromo({
                        primaryButtonLink: `/shop?category=${encodeURIComponent(e.target.value)}`,
                      });
                      e.target.value = '';
                    }}
                    defaultValue=""
                    aria-label="Fill link from category"
                  >
                    <option value="">Category…</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </Field>
              <Field label="Secondary button text">
                <input
                  className={inputCls}
                  value={settings.promoBanner.secondaryButtonText || ''}
                  onChange={(e) => patchPromo({ secondaryButtonText: e.target.value })}
                  placeholder="e.g. Browse All"
                />
              </Field>
              <Field label="Secondary button link">
                <input
                  className={inputCls}
                  value={settings.promoBanner.secondaryButtonLink || ''}
                  onChange={(e) => patchPromo({ secondaryButtonLink: e.target.value })}
                  placeholder="e.g. /shop"
                />
              </Field>
            </div>

            <Field label="Description">
              <textarea
                className={inputCls}
                rows={2}
                value={settings.promoBanner.description || ''}
                onChange={(e) => patchPromo({ description: e.target.value })}
                placeholder="Short promo description"
              />
            </Field>

            <Field
              label="Perks"
              hint="Comma separated — each perk shows as a small highlight, e.g. “Premium fabrics, Curated colors”."
            >
              <input
                className={inputCls}
                value={(settings.promoBanner.perks || []).join(', ')}
                onChange={(e) =>
                  patchPromo({
                    perks: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="Premium fabrics, Curated colors, Easy to shop"
              />
            </Field>

            {/* Editorial gallery */}
            <div className="mt-6 space-y-4 rounded-xl border border-rose-100 bg-rose-50/40 p-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">Editorial image grid</p>
                <p className="mt-1 text-xs text-gray-500">
                  Shown below the promo hero on the homepage. Upload only the images you want —
                  empty slots stay hidden. Each tile can link anywhere.
                </p>
              </div>

              <Toggle
                checked={settings.homeEditorialGallery?.isActive !== false}
                onChange={(checked) => patchEditorial({ isActive: checked })}
                label="Show editorial gallery on homepage"
              />

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="Eyebrow">
                  <input
                    className={inputCls}
                    value={settings.homeEditorialGallery?.eyebrow || ''}
                    onChange={(e) => patchEditorial({ eyebrow: e.target.value })}
                    placeholder="e.g. Editorial Edit"
                  />
                </Field>
                <Field label="Section title">
                  <input
                    className={inputCls}
                    value={settings.homeEditorialGallery?.title || ''}
                    onChange={(e) => patchEditorial({ title: e.target.value })}
                    placeholder="Section title"
                  />
                </Field>
                <Field label="Section subtitle (optional)">
                  <input
                    className={inputCls}
                    value={settings.homeEditorialGallery?.subtitle || ''}
                    onChange={(e) => patchEditorial({ subtitle: e.target.value })}
                    placeholder="Section subtitle"
                  />
                </Field>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Header link text">
                    <input
                      className={inputCls}
                      value={settings.homeEditorialGallery?.ctaText || ''}
                      onChange={(e) => patchEditorial({ ctaText: e.target.value })}
                      placeholder="e.g. Shop Now"
                    />
                  </Field>
                  <Field label="Header link URL">
                    <input
                      className={inputCls}
                      value={settings.homeEditorialGallery?.ctaLink || ''}
                      onChange={(e) => patchEditorial({ ctaLink: e.target.value })}
                      placeholder="e.g. /shop"
                    />
                  </Field>
                </div>
              </div>

              {padHomeEditorialTiles(settings.homeEditorialGallery?.tiles).map(
                (tile, index) => {
                  const tileLabels = [
                    'Large left image (desktop layout)',
                    'Top right image',
                    'Bottom right image',
                  ];
                  return (
                    <ItemCard key={index} title={tileLabels[index]!}>
                      <ImageUploader
                        maxFiles={1}
                        aspectRatio="3:4"
                        maxSizeMB={5}
                        existingImages={
                          homeEditorialTileFiles[index] ? []
                          : tile.image ? [tile.image]
                          : []
                        }
                        onRemoveExisting={() => {
                          patchEditorialTile(index, { image: '', imagePublicId: undefined });
                          setHomeEditorialTileFiles((prev) => ({ ...prev, [index]: null }));
                        }}
                        onChange={(files) => {
                          setHomeEditorialTileFiles((prev) => ({
                            ...prev,
                            [index]: files[0] || null,
                          }));
                          markDirty();
                        }}
                        label="Tile image (3:4)"
                        hint="Saved on Save. Removing clears the old file from Cloudinary on save."
                      />
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Field label="Tile link">
                          <input
                            className={inputCls}
                            value={tile.link || ''}
                            onChange={(e) => patchEditorialTile(index, { link: e.target.value })}
                            placeholder="e.g. /shop?category=Sarees"
                          />
                        </Field>
                        <Field label="Image alt text" hint="Describes the image for accessibility & SEO.">
                          <input
                            className={inputCls}
                            value={tile.alt || ''}
                            onChange={(e) => patchEditorialTile(index, { alt: e.target.value })}
                            placeholder="e.g. Model wearing red silk saree"
                          />
                        </Field>
                      </div>
                    </ItemCard>
                  );
                },
              )}
            </div>
          </div>
        </StorefrontSectionPanel>
      )}

      {/* ══ Blog banner ══ */}
      {activeSection === 'blog' && (
        <StorefrontSectionPanel
          title={sectionMeta.label}
          description={sectionMeta.description}
          icon={sectionMeta.icon}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <ImageUploader
                maxFiles={1}
                aspectRatio="4:5"
                maxSizeMB={5}
                existingImages={
                  blogMainFile ? []
                  : settings.blogBanner?.mainImage ? [settings.blogBanner.mainImage]
                  : []
                }
                onRemoveExisting={() => {
                  patchBlog({ mainImage: '', mainImagePublicId: undefined });
                  setBlogMainFile(null);
                }}
                onChange={(files) => {
                  setBlogMainFile(files[0] || null);
                  markDirty();
                }}
                label="Main image (portrait)"
              />

              <ImageUploader
                maxFiles={1}
                aspectRatio="1:1"
                maxSizeMB={5}
                existingImages={
                  blogSideFile ? []
                  : settings.blogBanner?.sideImage ? [settings.blogBanner.sideImage]
                  : []
                }
                onRemoveExisting={() => {
                  patchBlog({ sideImage: '', sideImagePublicId: undefined });
                  setBlogSideFile(null);
                }}
                onChange={(files) => {
                  setBlogSideFile(files[0] || null);
                  markDirty();
                }}
                label="Side floating image (square)"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Eyebrow text">
                <input
                  className={inputCls}
                  value={settings.blogBanner?.eyebrow || ''}
                  onChange={(e) => patchBlog({ eyebrow: e.target.value })}
                  placeholder="e.g. Journal & Stories"
                />
              </Field>
              <Field label="Title">
                <input
                  className={inputCls}
                  value={settings.blogBanner?.title || ''}
                  onChange={(e) => patchBlog({ title: e.target.value })}
                  placeholder="e.g. Discover the Art of Ethnic"
                />
              </Field>
              <Field label="Button text">
                <input
                  className={inputCls}
                  value={settings.blogBanner?.buttonText || ''}
                  onChange={(e) => patchBlog({ buttonText: e.target.value })}
                  placeholder="e.g. Visit Our Blog"
                />
              </Field>
              <Field label="Button link">
                <input
                  className={inputCls}
                  value={settings.blogBanner?.buttonLink || ''}
                  onChange={(e) => patchBlog({ buttonLink: e.target.value })}
                  placeholder="e.g. /blog"
                />
              </Field>
            </div>

            <Field label="Description">
              <textarea
                className={inputCls}
                rows={2}
                value={settings.blogBanner?.description || ''}
                onChange={(e) => patchBlog({ description: e.target.value })}
                placeholder="Short banner description"
              />
            </Field>
          </div>
        </StorefrontSectionPanel>
      )}

      {/* ══ Shop banner ══ */}
      {activeSection === 'shopBanner' && (
        <StorefrontSectionPanel
          title={sectionMeta.label}
          description={sectionMeta.description}
          icon={sectionMeta.icon}
        >
          <div className="space-y-4">
            <Toggle
              checked={settings.shopBanner?.isActive !== false}
              onChange={(checked) => patchShopBanner({ isActive: checked })}
              label="Show this banner on the shop page"
            />

            <p className="text-xs text-gray-500">
              Prefer one full-width banner image. If the main image is set, it overrides the two
              side images.
            </p>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Title">
                <input
                  className={inputCls}
                  value={settings.shopBanner?.title || ''}
                  onChange={(e) => patchShopBanner({ title: e.target.value })}
                  placeholder="e.g. Sara Ali Khan Spotted"
                />
              </Field>
              <Field label="Subtitle">
                <input
                  className={inputCls}
                  value={settings.shopBanner?.subtitle || ''}
                  onChange={(e) => patchShopBanner({ subtitle: e.target.value })}
                  placeholder="e.g. Shop all celebrity styles"
                />
              </Field>
            </div>

            <ImageUploader
              maxFiles={1}
              aspectRatio="5:1"
              maxSizeMB={5}
              existingImages={
                shopBannerCenterFile ? []
                : settings.shopBanner?.centerImage ? [settings.shopBanner.centerImage]
                : []
              }
              onRemoveExisting={() => {
                patchShopBanner({ centerImage: '', centerImagePublicId: undefined });
                setShopBannerCenterFile(null);
              }}
              onChange={(files) => {
                setShopBannerCenterFile(files[0] || null);
                markDirty();
              }}
              label="Main full-width banner image (recommended)"
              hint="When set, this one image is used full-width on the shop banner."
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ImageUploader
                maxFiles={1}
                aspectRatio="3:4"
                maxSizeMB={5}
                existingImages={
                  shopBannerLeftFile ? []
                  : settings.shopBanner?.leftImage ? [settings.shopBanner.leftImage]
                  : []
                }
                onRemoveExisting={() => {
                  patchShopBanner({ leftImage: '', leftImagePublicId: undefined });
                  setShopBannerLeftFile(null);
                }}
                onChange={(files) => {
                  setShopBannerLeftFile(files[0] || null);
                  markDirty();
                }}
                label="Left side image"
                hint="Used only when the main full-width image is not set."
              />
              <ImageUploader
                maxFiles={1}
                aspectRatio="3:4"
                maxSizeMB={5}
                existingImages={
                  shopBannerRightFile ? []
                  : settings.shopBanner?.rightImage ? [settings.shopBanner.rightImage]
                  : []
                }
                onRemoveExisting={() => {
                  patchShopBanner({ rightImage: '', rightImagePublicId: undefined });
                  setShopBannerRightFile(null);
                }}
                onChange={(files) => {
                  setShopBannerRightFile(files[0] || null);
                  markDirty();
                }}
                label="Right side image"
                hint="Used only when the main full-width image is not set."
              />
            </div>
          </div>
        </StorefrontSectionPanel>
      )}

      {/* ══ Middle banner ══ */}
      {activeSection === 'middleBanner' && (
        <StorefrontSectionPanel
          title={sectionMeta.label}
          description={sectionMeta.description}
          icon={sectionMeta.icon}
        >
          <div className="space-y-4">
            <Toggle
              checked={settings.homeMiddleBanner?.isActive !== false}
              onChange={(checked) => patchMiddleBanner({ isActive: checked })}
              label="Show middle banner on homepage"
            />

            <ImageUploader
              maxFiles={1}
              aspectRatio="16:9"
              maxSizeMB={5}
              existingImages={
                homeMiddleBannerFile ? []
                : settings.homeMiddleBanner?.image ? [settings.homeMiddleBanner.image]
                : []
              }
              onRemoveExisting={() => {
                patchMiddleBanner({ image: '', imagePublicId: undefined });
                setHomeMiddleBannerFile(null);
              }}
              onChange={(files) => {
                setHomeMiddleBannerFile(files[0] || null);
                markDirty();
              }}
              label="Middle banner background image"
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Banner title">
                <input
                  className={inputCls}
                  value={settings.homeMiddleBanner?.title || ''}
                  onChange={(e) => patchMiddleBanner({ title: e.target.value })}
                  placeholder="e.g. Timeless Craftsmanship"
                />
              </Field>
              <Field label="Banner subtitle">
                <input
                  className={inputCls}
                  value={settings.homeMiddleBanner?.subtitle || ''}
                  onChange={(e) => patchMiddleBanner({ subtitle: e.target.value })}
                  placeholder="e.g. A modern homage to our cultural legacy."
                />
              </Field>
              <Field label="Button text">
                <input
                  className={inputCls}
                  value={settings.homeMiddleBanner?.linkText || ''}
                  onChange={(e) => patchMiddleBanner({ linkText: e.target.value })}
                  placeholder="e.g. Discover the Story"
                />
              </Field>
              <Field label="Button link URL">
                <input
                  className={inputCls}
                  value={settings.homeMiddleBanner?.linkUrl || ''}
                  onChange={(e) => patchMiddleBanner({ linkUrl: e.target.value })}
                  placeholder="e.g. /about"
                />
              </Field>
              <Field label="Text alignment">
                <select
                  className={inputCls}
                  value={settings.homeMiddleBanner?.textAlignment || 'center'}
                  onChange={(e) =>
                    patchMiddleBanner({
                      textAlignment: e.target.value as MiddleBannerFields['textAlignment'],
                    })
                  }
                >
                  <option value="left">Left aligned</option>
                  <option value="center">Center aligned</option>
                  <option value="right">Right aligned</option>
                </select>
              </Field>
              <Field label="Text color" hint="Pick light text for dark images, dark text for light images.">
                <select
                  className={inputCls}
                  value={settings.homeMiddleBanner?.textColor || 'light'}
                  onChange={(e) =>
                    patchMiddleBanner({
                      textColor: e.target.value as MiddleBannerFields['textColor'],
                    })
                  }
                >
                  <option value="light">Light text (for dark images)</option>
                  <option value="dark">Dark text (for light images)</option>
                </select>
              </Field>
            </div>
          </div>
        </StorefrontSectionPanel>
      )}

      {/* ══ Gift showcase (home) ══ */}
      {activeSection === 'homeGift' && (
        <StorefrontSectionPanel
          title={sectionMeta.label}
          description={sectionMeta.description}
          icon={sectionMeta.icon}
        >
          <div className="space-y-4">
            <Toggle
              checked={settings.homeGiftShowcase?.isActive !== false}
              onChange={(checked) => patchShowcase({ isActive: checked })}
              label="Show gift showcase on homepage"
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Headline line 1">
                <input
                  className={inputCls}
                  value={settings.homeGiftShowcase?.headlineLine1 || ''}
                  onChange={(e) => patchShowcase({ headlineLine1: e.target.value })}
                  placeholder="e.g. Our Gifting"
                />
              </Field>
              <Field label="Headline line 2">
                <input
                  className={inputCls}
                  value={settings.homeGiftShowcase?.headlineLine2 || ''}
                  onChange={(e) => patchShowcase({ headlineLine2: e.target.value })}
                  placeholder="e.g. Collections"
                />
              </Field>
            </div>

            <Field
              label="Description"
              hint="Keep under 160 characters. Sarees lead homepage SEO — avoid opening with “corporate gifting”."
            >
              <textarea
                className={inputCls}
                rows={3}
                value={settings.homeGiftShowcase?.description || ''}
                onChange={(e) => patchShowcase({ description: e.target.value })}
                placeholder="Short gifting blurb"
              />
            </Field>

            <Field
              label="Social handle"
              hint="Shown near the section — social icons use the Footer social URLs."
            >
              <input
                className={inputCls}
                value={settings.homeGiftShowcase?.socialHandle || ''}
                onChange={(e) => patchShowcase({ socialHandle: e.target.value })}
                placeholder="e.g. @thehouseofrani"
              />
            </Field>

            {padHomeGiftCards(settings.homeGiftShowcase?.cards).map((card, index) => (
              <ItemCard key={index} title={card.title?.trim() || `Card ${index + 1}`}>
                <ImageUploader
                  maxFiles={1}
                  aspectRatio="1:1"
                  maxSizeMB={5}
                  existingImages={
                    homeGiftCardFiles[index] ? []
                    : card.image ? [card.image]
                    : []
                  }
                  onRemoveExisting={() => {
                    patchGiftCard(index, { image: '', imagePublicId: undefined });
                    setHomeGiftCardFiles((prev) => ({ ...prev, [index]: null }));
                  }}
                  onChange={(files) => {
                    setHomeGiftCardFiles((prev) => ({
                      ...prev,
                      [index]: files[0] || null,
                    }));
                    markDirty();
                  }}
                  label="Card image (1:1 — shown as a circle on the homepage)"
                  hint="Saving removes the old file from Cloudinary when replaced or cleared."
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Title">
                    <input
                      className={inputCls}
                      value={card.title || ''}
                      onChange={(e) => patchGiftCard(index, { title: e.target.value })}
                      placeholder="e.g. Handmade Gifts"
                    />
                  </Field>
                  <Field label="Pastel background">
                    <select
                      className={inputCls}
                      value={card.accent || 'rose'}
                      onChange={(e) =>
                        patchGiftCard(index, {
                          accent: e.target.value as HomeGiftShowcaseCard['accent'],
                        })
                      }
                    >
                      <option value="rose">Pink / rose</option>
                      <option value="amber">Peach / amber</option>
                      <option value="sage">Mint / sage</option>
                    </select>
                  </Field>
                </div>

                <Field label="Card description">
                  <textarea
                    className={inputCls}
                    rows={2}
                    value={card.description || ''}
                    onChange={(e) => patchGiftCard(index, { description: e.target.value })}
                    placeholder="Short card description"
                  />
                </Field>

                <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Primary button
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Button label">
                      <input
                        className={inputCls}
                        value={card.shopButtonText || ''}
                        onChange={(e) =>
                          patchGiftCard(index, { shopButtonText: e.target.value })
                        }
                        placeholder="e.g. Browse gifts / Coming soon"
                      />
                    </Field>
                    <Field label="Button target">
                      <select
                        className={inputCls}
                        value={(card.shopLinkMode || 'custom') as HomeGiftShopLinkMode}
                        onChange={(e) => {
                          const mode = e.target.value as HomeGiftShopLinkMode;
                          patchGiftCard(index, {
                            shopLinkMode: mode,
                            ...(mode === 'coming_soon' && {
                              shopButtonText: card.shopButtonText || 'Coming soon',
                            }),
                          });
                        }}
                      >
                        <option value="gifting">Gifting page (occasion / category / search)</option>
                        <option value="product">Product page (path)</option>
                        <option value="coming_soon">Coming soon (no link)</option>
                        <option value="custom">Custom URL</option>
                      </select>
                    </Field>

                    {(card.shopLinkMode || 'custom') === 'gifting' && (
                      <>
                        <Field label="Gift occasion (optional)" hint="Same as gifting page chips.">
                          <select
                            className={inputCls}
                            value={card.giftingOccasion || ''}
                            onChange={(e) =>
                              patchGiftCard(index, { giftingOccasion: e.target.value })
                            }
                          >
                            <option value="">Any occasion</option>
                            {giftOccasionCategories.map((c) => (
                              <option key={String(c._id)} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Product category filter (optional)">
                          <select
                            className={inputCls}
                            value={card.giftingProductCategory || ''}
                            onChange={(e) =>
                              patchGiftCard(index, {
                                giftingProductCategory: e.target.value,
                              })
                            }
                          >
                            <option value="">Any category</option>
                            {productCategoryOptions.map((c) => (
                              <option key={String(c._id)} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Search term (optional)" className="sm:col-span-2">
                          <input
                            className={inputCls}
                            value={card.giftingSearch || ''}
                            onChange={(e) =>
                              patchGiftCard(index, { giftingSearch: e.target.value })
                            }
                            placeholder="e.g. hamper"
                          />
                        </Field>
                      </>
                    )}
                    {(card.shopLinkMode || 'custom') === 'product' && (
                      <Field label="Product path" className="sm:col-span-2">
                        <input
                          className={inputCls}
                          value={card.directProductPath || ''}
                          onChange={(e) =>
                            patchGiftCard(index, { directProductPath: e.target.value })
                          }
                          placeholder="e.g. /shop/your-product-slug"
                        />
                      </Field>
                    )}
                    {(card.shopLinkMode || 'custom') === 'custom' && (
                      <Field label="Custom URL" className="sm:col-span-2">
                        <input
                          className={inputCls}
                          value={card.shopButtonLink || ''}
                          onChange={(e) =>
                            patchGiftCard(index, { shopButtonLink: e.target.value })
                          }
                          placeholder="Any path, e.g. /shop or https://…"
                        />
                      </Field>
                    )}
                    {(card.shopLinkMode || 'custom') === 'coming_soon' && (
                      <p className="text-xs text-gray-500 sm:col-span-2">
                        The primary button shows your label only (no navigation). Use the second
                        button for Gifting or another link.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Gifting button label">
                    <input
                      className={inputCls}
                      value={card.giftButtonText || ''}
                      onChange={(e) =>
                        patchGiftCard(index, { giftButtonText: e.target.value })
                      }
                      placeholder="e.g. Gifting"
                    />
                  </Field>
                  <Field label="Gifting button URL">
                    <input
                      className={inputCls}
                      value={card.giftButtonLink || ''}
                      onChange={(e) =>
                        patchGiftCard(index, { giftButtonLink: e.target.value })
                      }
                      placeholder="e.g. /gifting"
                    />
                  </Field>
                </div>
              </ItemCard>
            ))}
          </div>
        </StorefrontSectionPanel>
      )}

      {/* ══ Gifting hero banners ══ */}
      {activeSection === 'gifting1' && (
        <StorefrontSectionPanel
          title={sectionMeta.label}
          description={sectionMeta.description}
          icon={sectionMeta.icon}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-gray-500">
                Top rotating banner on the gifting page — 4-5 banners work best.
              </p>
              <AddButton
                label="Add banner"
                onClick={() =>
                  mutate((s) => ({
                    ...s,
                    giftingHeroBanners: [
                      ...(s.giftingHeroBanners || []),
                      {
                        title: '',
                        description: '',
                        backgroundImage: '',
                        ctaText: 'Explore gifts',
                        ctaLink: '/gifting',
                        isActive: true,
                      },
                    ],
                  }))
                }
              />
            </div>

            {(settings.giftingHeroBanners || []).length === 0 && (
              <EmptyListHint>
                No banners yet — click “Add banner” to create the first gifting hero banner.
              </EmptyListHint>
            )}

            {(settings.giftingHeroBanners || []).map((banner, index) => (
              <ItemCard
                key={index}
                title={banner.title?.trim() || `Banner ${index + 1}`}
                badge={
                  banner.isActive === false ? (
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                      Hidden
                    </span>
                  ) : undefined
                }
                deleteLabel="Delete banner"
                onDelete={() => {
                  setGiftingHeroFiles((prev) => remapFilesAfterRemoval(prev, index));
                  mutate((s) => ({
                    ...s,
                    giftingHeroBanners: (s.giftingHeroBanners || []).filter(
                      (_, i) => i !== index,
                    ),
                  }));
                }}
              >
                <Toggle
                  checked={banner.isActive !== false}
                  onChange={(checked) => patchGiftingHero(index, { isActive: checked })}
                  label="Show this banner on the gifting page"
                />

                <ImageUploader
                  maxFiles={1}
                  aspectRatio="16:9"
                  maxSizeMB={5}
                  existingImages={
                    giftingHeroFiles[index] ? []
                    : banner.backgroundImage ? [banner.backgroundImage]
                    : []
                  }
                  onRemoveExisting={() => {
                    patchGiftingHero(index, {
                      backgroundImage: '',
                      backgroundImagePublicId: undefined,
                    });
                    setGiftingHeroFiles((prev) => ({ ...prev, [index]: null }));
                  }}
                  onChange={(files) => {
                    setGiftingHeroFiles((prev) => ({
                      ...prev,
                      [index]: files[0] || null,
                    }));
                    markDirty();
                  }}
                  label="Gifting hero image"
                />

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Field label="Title">
                    <input
                      className={inputCls}
                      value={banner.title || ''}
                      onChange={(e) => patchGiftingHero(index, { title: e.target.value })}
                      placeholder="e.g. Smart gifting made easy"
                    />
                  </Field>
                  <Field label="Button text">
                    <input
                      className={inputCls}
                      value={banner.ctaText || ''}
                      onChange={(e) => patchGiftingHero(index, { ctaText: e.target.value })}
                      placeholder="e.g. Explore gifts"
                    />
                  </Field>
                  <Field label="Button link">
                    <input
                      className={inputCls}
                      value={banner.ctaLink || ''}
                      onChange={(e) => patchGiftingHero(index, { ctaLink: e.target.value })}
                      placeholder="e.g. /gifting"
                    />
                  </Field>
                </div>

                <Field label="Description">
                  <textarea
                    className={inputCls}
                    rows={2}
                    value={banner.description || ''}
                    onChange={(e) =>
                      patchGiftingHero(index, { description: e.target.value })
                    }
                    placeholder="Short supporting text"
                  />
                </Field>
              </ItemCard>
            ))}
          </div>
        </StorefrontSectionPanel>
      )}

      {/* ══ Gifting secondary banners ══ */}
      {activeSection === 'gifting2' && (
        <StorefrontSectionPanel
          title={sectionMeta.label}
          description={sectionMeta.description}
          icon={sectionMeta.icon}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-gray-500">
                Second showcase section on the gifting page — 1-2 cards work best.
              </p>
              <AddButton
                label="Add card"
                onClick={() =>
                  mutate((s) => ({
                    ...s,
                    giftingSecondaryBanners: [
                      ...(s.giftingSecondaryBanners || []),
                      {
                        eyebrow: '',
                        title: '',
                        image: '',
                        ctaText: 'Shop now',
                        ctaLink: '/gifting',
                        isActive: true,
                      },
                    ],
                  }))
                }
              />
            </div>

            {(settings.giftingSecondaryBanners || []).length === 0 && (
              <EmptyListHint>
                No cards yet — click “Add card” to create a gifting highlight card.
              </EmptyListHint>
            )}

            {(settings.giftingSecondaryBanners || []).map((banner, index) => (
              <ItemCard
                key={index}
                title={banner.title?.trim() || `Card ${index + 1}`}
                deleteLabel="Delete card"
                onDelete={() => {
                  setGiftingSecondaryFiles((prev) => remapFilesAfterRemoval(prev, index));
                  mutate((s) => ({
                    ...s,
                    giftingSecondaryBanners: (s.giftingSecondaryBanners || []).filter(
                      (_, i) => i !== index,
                    ),
                  }));
                }}
              >
                <ImageUploader
                  maxFiles={1}
                  aspectRatio="16:9"
                  maxSizeMB={5}
                  existingImages={
                    giftingSecondaryFiles[index] ? []
                    : banner.image ? [banner.image]
                    : []
                  }
                  onRemoveExisting={() => {
                    patchGiftingSecondary(index, { image: '', imagePublicId: undefined });
                    setGiftingSecondaryFiles((prev) => ({ ...prev, [index]: null }));
                  }}
                  onChange={(files) => {
                    setGiftingSecondaryFiles((prev) => ({
                      ...prev,
                      [index]: files[0] || null,
                    }));
                    markDirty();
                  }}
                  label="Card image"
                />

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Field label="Eyebrow text">
                    <input
                      className={inputCls}
                      value={banner.eyebrow || ''}
                      onChange={(e) =>
                        patchGiftingSecondary(index, { eyebrow: e.target.value })
                      }
                      placeholder="e.g. Gifting made premium"
                    />
                  </Field>
                  <Field label="Title">
                    <input
                      className={inputCls}
                      value={banner.title || ''}
                      onChange={(e) =>
                        patchGiftingSecondary(index, { title: e.target.value })
                      }
                      placeholder="e.g. Curated picks for every celebration"
                    />
                  </Field>
                  <Field label="Button text">
                    <input
                      className={inputCls}
                      value={banner.ctaText || ''}
                      onChange={(e) =>
                        patchGiftingSecondary(index, { ctaText: e.target.value })
                      }
                      placeholder="e.g. Shop now"
                    />
                  </Field>
                  <Field label="Button link">
                    <input
                      className={inputCls}
                      value={banner.ctaLink || ''}
                      onChange={(e) =>
                        patchGiftingSecondary(index, { ctaLink: e.target.value })
                      }
                      placeholder="e.g. /gifting"
                    />
                  </Field>
                </div>
              </ItemCard>
            ))}
          </div>
        </StorefrontSectionPanel>
      )}

      {/* ══ Footer & contact ══ */}
      {activeSection === 'footer' && (
        <StorefrontSectionPanel
          title={sectionMeta.label}
          description={sectionMeta.description}
          icon={sectionMeta.icon}
        >
          <div className="space-y-4">
            <Field label="Footer description">
              <textarea
                className={inputCls}
                rows={2}
                value={settings.footer.description || ''}
                onChange={(e) => patchFooter({ description: e.target.value })}
                placeholder="Short brand blurb shown in the footer"
              />
            </Field>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Contact address">
                <input
                  className={inputCls}
                  value={settings.footer.contactAddress || ''}
                  onChange={(e) => patchFooter({ contactAddress: e.target.value })}
                  placeholder="Street, city, state, PIN"
                />
              </Field>
              <Field label="Contact phone">
                <input
                  className={inputCls}
                  type="tel"
                  value={settings.footer.contactPhone || ''}
                  onChange={(e) => patchFooter({ contactPhone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </Field>
              <Field label="Contact email">
                <input
                  className={inputCls}
                  type="email"
                  value={settings.footer.contactEmail || ''}
                  onChange={(e) => patchFooter({ contactEmail: e.target.value })}
                  placeholder="hello@example.com"
                />
              </Field>
              <Field
                label="Category links to show"
                hint="How many category links appear in the footer list."
              >
                <input
                  className={inputCls}
                  type="number"
                  min={1}
                  max={12}
                  value={settings.footer.categoryLimit || 5}
                  onChange={(e) =>
                    patchFooter({ categoryLimit: Number(e.target.value) || 5 })
                  }
                />
              </Field>
            </div>

            <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                Social links
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="Facebook URL">
                  <input
                    className={inputCls}
                    value={settings.footer.facebookUrl || ''}
                    onChange={(e) => patchFooter({ facebookUrl: e.target.value })}
                    placeholder="https://facebook.com/…"
                  />
                </Field>
                <Field label="Instagram URL">
                  <input
                    className={inputCls}
                    value={settings.footer.instagramUrl || ''}
                    onChange={(e) => patchFooter({ instagramUrl: e.target.value })}
                    placeholder="https://instagram.com/…"
                  />
                </Field>
                <Field label="Twitter / X URL">
                  <input
                    className={inputCls}
                    value={settings.footer.twitterUrl || ''}
                    onChange={(e) => patchFooter({ twitterUrl: e.target.value })}
                    placeholder="https://x.com/…"
                  />
                </Field>
                <Field label="YouTube URL">
                  <input
                    className={inputCls}
                    value={settings.footer.youtubeUrl || ''}
                    onChange={(e) => patchFooter({ youtubeUrl: e.target.value })}
                    placeholder="https://youtube.com/…"
                  />
                </Field>
              </div>
            </div>
          </div>
        </StorefrontSectionPanel>
      )}
    </StorefrontAdminShell>
  );
}
