"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  Search,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  Shield,
  Package,
  Home,
  Store,
  Gift,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { categoryApi, storefrontApi } from "@/lib/api";
import { Category, StorefrontSettings } from "@/types";
import { cn } from "@/lib/utils";
import { isShopCatalogCategory } from "@/lib/categoryFilters";
import { buildShopCategoryHref } from "@/lib/shopCategorySeo";
import { queryKeys } from "@/lib/queryKeys";
import NotificationBell from "@/components/layout/NotificationBell";
import BrowserNotificationPrompt from "@/components/layout/BrowserNotificationPrompt";
import StoreSearchAutocomplete from "@/components/search/StoreSearchAutocomplete";
import {
  useStoreNavActive,
  type StoreNavActive,
} from "@/hooks/useStoreNavActive";
import { useAuthModal } from "@/hooks/useAuthModal";
import type { StorefrontSettingsApiEnvelope } from "@/lib/api-schemas";
import {
  mobileTabClass,
  mobileTabIconClass,
  navAnnouncementShell,
  navAnnouncementText,
  navBadgeCount,
  navDropdownItem,
  navDropdownPanel,
  navIconButton,
  navLinkClass,
  navSearchInputClass,
  navShellClass,
} from "@/lib/navbarStyles";

type MobileBottomItem = {
  id: string;
  label: string;
  Icon: LucideIcon;
  href: string;
  activeKey: keyof StoreNavActive;
  showCartBadge?: boolean;
};

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const { user, isAuthenticated, isLoading, hasSessionChecked, logout } =
    useAuthStore();
  const { itemCount } = useCartStore();
  const { products: wishlistProducts } = useWishlistStore();

  const { data: categoriesData = [] } = useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => {
      const body = await categoryApi.getAll();
      return (body.data.categories || []) as Category[];
    },
    staleTime: 5 * 60 * 1000,
  });
  const navCategories = useMemo(
    () => categoriesData.filter(isShopCatalogCategory).slice(0, 7),
    [categoriesData],
  );

  useEffect(() => {
    const id = window.setTimeout(() => {
      navCategories.forEach((cat) => {
        router.prefetch(buildShopCategoryHref(cat));
      });
    }, 250);
    return () => window.clearTimeout(id);
  }, [navCategories, router]);

  const { data: storefrontSettings } = useQuery({
    queryKey: queryKeys.storefrontSettings,
    queryFn: async () => {
      const body: StorefrontSettingsApiEnvelope =
        await storefrontApi.getSettings();
      return (body.data.settings ?? null) as StorefrontSettings | null;
    },
    staleTime: 5 * 60 * 1000,
  });
  const announcementMessages = storefrontSettings?.announcementMessages ?? [];

  useEffect(() => {
    let raf = 0;
    const on = 28;
    const off = 10;
    const scrollY = () =>
      window.scrollY ||
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      0;

    const handleScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = scrollY();
        setIsScrolled((prev) => {
          if (y <= off) return false;
          if (y >= on) return true;
          return prev;
        });
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  const urlSearchForNav = useMemo(() => {
    if (pathname.startsWith("/shop") || pathname.startsWith("/gifting")) {
      return (searchParams.get("search") || "").slice(0, 30);
    }
    return "";
  }, [pathname, searchParams]);

  useEffect(() => {
    setAnnouncementIndex(0);
  }, [announcementMessages.length]);

  useEffect(() => {
    if (announcementMessages.length <= 1) return;
    const timer = window.setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % announcementMessages.length);
    }, 3500);
    return () => window.clearInterval(timer);
  }, [announcementMessages.length]);

  const handleLogout = useCallback(async () => {
    await logout();
    setIsUserMenuOpen(false);
  }, [logout]);

  const focusStoreSearch = useCallback(() => {
    if (typeof document === "undefined") return;
    const el = document.querySelector<HTMLInputElement>(
      "[data-navbar-search-input]",
    );
    if (window.matchMedia("(min-width: 1024px)").matches) {
      el?.focus();
    } else {
      setIsSearchOpen(true);
      queueMicrotask(() => el?.focus());
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        const t = e.target as HTMLElement | null;
        if (t?.closest?.("input, textarea, select, [contenteditable=true]")) {
          if (!t.closest("[data-navbar-search]")) return;
        }
        e.preventDefault();
        focusStoreSearch();
      }
      if (e.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isSearchOpen, focusStoreSearch]);

  const isAuthedStable = hasSessionChecked && !isLoading && isAuthenticated;
  const { href: authHref } = useAuthModal();

  const ordersHref =
    isAuthedStable ? "/dashboard/orders" : authHref("login", "/dashboard/orders");

  const navActive = useStoreNavActive();

  const mobileBottomNavItems: MobileBottomItem[] = useMemo(
    () => [
      { id: "home", label: "Home", Icon: Home, href: "/", activeKey: "home" },
      {
        id: "shop",
        label: "Shop",
        Icon: Store,
        href: "/shop",
        activeKey: "shop",
      },
      {
        id: "gifting",
        label: "Gifting",
        Icon: Gift,
        href: "/gifting",
        activeKey: "gifting",
      },
      {
        id: "cart",
        label: "Cart",
        Icon: ShoppingBag,
        href: "/cart",
        activeKey: "cart",
        showCartBadge: true,
      },
      {
        id: "orders",
        label: "Orders",
        Icon: Package,
        href: ordersHref,
        activeKey: "orders",
      },
      {
        id: "profile",
        label: "Profile",
        Icon: User,
        href: isAuthedStable ? "/dashboard" : authHref("login"),
        activeKey: "userHub",
      },
    ],
    [ordersHref, isAuthedStable, authHref],
  );

  return (
    <>
      <BrowserNotificationPrompt />
      {announcementMessages.length > 0 && !navActive.home && (
        <div className={navAnnouncementShell}>
          <p className={navAnnouncementText}>
            {announcementMessages[announcementIndex]}
          </p>
        </div>
      )}

      <header className={navShellClass(isScrolled)}>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative'>
          <div className='flex items-center justify-between h-[4.25rem] gap-3'>
            <div className='flex items-center gap-1 sm:gap-2 lg:gap-0'>
              <button
                type='button'
                onClick={() => setIsMenuOpen((o) => !o)}
                className={cn(navIconButton, "lg:hidden -ml-1")}
                aria-label={
                  isMenuOpen ? "Close navigation menu" : "Open navigation menu"
                }
                aria-expanded={isMenuOpen}
                aria-controls='mobile-nav-drawer'
              >
                <Menu
                  className='h-6 w-6'
                  strokeWidth={1.5}
                  aria-hidden='true'
                />
              </button>
              {/* Logo — left on mobile, desktop flow */}
              <Link
                href='/'
                className='flex-shrink-0 flex items-center min-w-0 lg:flex-shrink-0'
                aria-label='The House of Rani — Home'
              >
                <Image
                  src='/logo.png'
                  alt='The House of Rani'
                  width={200}
                  height={58}
                  className='h-11 w-auto max-w-[168px] sm:max-w-none sm:h-[3.35rem] lg:h-[3.5rem] object-contain object-left'
                  priority
                  fetchPriority='high'
                />
              </Link>
            </div>

            <nav className='hidden lg:flex items-center gap-0.5 flex-1 justify-center mx-4'>
              <Link href='/' className={navLinkClass(navActive.home)}>
                Home
              </Link>

              <div className='relative group'>
                <button
                  type='button'
                  className={navLinkClass(navActive.shop)}
                  aria-label='Shop categories'
                  aria-haspopup='menu'
                >
                  <span className='inline-flex items-center gap-1'>
                    Shop <ChevronDown className='h-3.5 w-3.5 opacity-70' aria-hidden />
                  </span>
                </button>
                <div className={navDropdownPanel}>
                  <Link href='/shop' className={navDropdownItem}>
                    All Sarees
                  </Link>
                  {navCategories.map((cat) => (
                    <Link
                      key={cat._id}
                      href={buildShopCategoryHref(cat)}
                      className={navDropdownItem}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>

              <Link href='/gifting' className={navLinkClass(navActive.gifting)}>
                Gifting
              </Link>
              <Link
                href='/about'
                className={navLinkClass(pathname.startsWith("/about"))}
              >
                About
              </Link>
              <Link
                href='/blog'
                className={navLinkClass(pathname.startsWith("/blog"))}
              >
                Blog
              </Link>
            </nav>

            <div className='hidden lg:block flex-1 min-w-0 max-w-xl mx-2'>
              <StoreSearchAutocomplete
                scope={navActive.gifting ? "gifting" : "shop"}
                variant='nav-dark'
                urlSearch={urlSearchForNav}
                inputClassName={navSearchInputClass}
              />
            </div>

            {/* Right actions — mobile: search on right; cart in header only on desktop (mobile: bottom nav) */}
            <div className='flex items-center justify-end gap-0.5 sm:gap-1 shrink-0'>
              {isAuthedStable && (
                <Link
                  href='/dashboard/wishlist'
                  className={cn(navIconButton, "relative")}
                  aria-label='Wishlist'
                >
                  <Heart className='h-5 w-5' strokeWidth={1.75} />
                  {wishlistProducts.length > 0 && (
                    <span className={navBadgeCount}>
                      {wishlistProducts.length}
                    </span>
                  )}
                </Link>
              )}

              <Link
                href='/cart'
                className={cn(navIconButton, "relative hidden lg:inline-flex")}
                aria-label='Cart'
              >
                <ShoppingBag className='h-5 w-5' strokeWidth={1.75} />
                {itemCount > 0 && (
                  <span className={navBadgeCount}>
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </Link>

              <button
                type='button'
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={cn(navIconButton, "lg:hidden")}
                aria-label={isSearchOpen ? "Close search" : "Open search"}
                aria-expanded={isSearchOpen}
                aria-controls='mobile-search-panel'
              >
                <Search className='h-5 w-5' aria-hidden='true' />
              </button>

              {isAuthedStable && <NotificationBell />}

              {isAuthedStable ?
                <div className='hidden lg:block relative'>
                  <button
                    type='button'
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className='flex items-center gap-2 rounded-full p-1.5 text-white/85 transition-colors duration-200 hover:bg-navy-800 hover:text-white'
                    aria-label='Account menu'
                    aria-expanded={isUserMenuOpen}
                    aria-haspopup='menu'
                  >
                    <div className='h-8 w-8 rounded-full bg-navy-700 border-2 border-brand-600 flex items-center justify-center overflow-hidden'>
                      {user?.avatar ?
                        <Image
                          src={user.avatar}
                          alt=''
                          width={32}
                          height={32}
                          loading='lazy'
                          unoptimized
                          className='h-full w-full object-cover'
                        />
                      : <span
                          className='text-white font-semibold text-sm'
                          aria-hidden='true'
                        >
                          {String(user?.name || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      }
                    </div>
                  </button>

                  {isUserMenuOpen && (
                    <div className='absolute right-0 top-full mt-2 min-w-[220px] rounded-xl border border-navy-700 bg-navy-950 p-2 shadow-2xl animate-fadeIn'>
                      <div className='mb-1 border-b border-navy-800 px-3 py-2'>
                        <p className='truncate text-sm font-medium text-white'>
                          {user?.name}
                        </p>
                        <p className='truncate text-xs text-white/55'>
                          {user?.email}
                        </p>
                      </div>
                      <Link
                        href='/dashboard'
                        prefetch
                        className='flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/80 transition-colors hover:bg-navy-800/80 hover:text-white'
                      >
                        <LayoutDashboard className='h-4 w-4' /> My Account
                      </Link>
                      <Link
                        href='/dashboard/orders'
                        prefetch
                        className='flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/80 transition-colors hover:bg-navy-800/80 hover:text-white'
                      >
                        <Package className='h-4 w-4' /> My Orders
                      </Link>
                      {user?.role === "admin" && (
                        <Link
                          href='/admin'
                          prefetch
                          className='flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gold-300 transition-colors hover:bg-navy-800/80 hover:text-gold-200'
                        >
                          <Shield className='h-4 w-4' /> Admin Panel
                        </Link>
                      )}
                      <button
                        type='button'
                        onClick={handleLogout}
                        className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-brand-300 transition-colors hover:bg-navy-800/80 hover:text-brand-200'
                      >
                        <LogOut className='h-4 w-4' /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              : <Link
                  href={authHref("login")}
                  scroll={false}
                  className={cn(
                    navLinkClass(false),
                    "hidden lg:inline-flex items-center gap-1.5",
                  )}
                >
                  <User className='h-4 w-4' strokeWidth={1.75} />
                  <span>Sign In</span>
                </Link>
              }
            </div>
          </div>

          {/* Announcement Bar Removed from Header */}

          {/* Mobile / tablet search */}
          {isSearchOpen && (
            <div
              id='mobile-search-panel'
              className='border-t border-white/10 pb-3 pt-3 animate-fadeIn lg:hidden'
            >
              <StoreSearchAutocomplete
                scope={navActive.gifting ? "gifting" : "shop"}
                variant='nav-mobile'
                urlSearch={urlSearchForNav}
              />
            </div>
          )}
        </div>
      </header>

      {/* Mobile drawer — above bottom tab bar */}
      {isMenuOpen && (
        <div
          id='mobile-nav-drawer'
          role='dialog'
          aria-modal='true'
          aria-label='Site navigation'
          className='fixed inset-0 z-[100] lg:hidden'
        >
          <div
            className='fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300'
            onClick={() => setIsMenuOpen(false)}
            aria-hidden='true'
          />
          <div className='fixed left-0 top-0 h-full w-[min(21rem,88vw)] max-h-[100dvh] bg-navy-950 shadow-[20px_0_40px_rgba(0,0,0,0.5)] flex flex-col animate-in slide-in-from-left duration-300 ease-out'>
            {/* Drawer header */}
            <div className='flex items-center justify-between p-5 border-b border-navy-800 bg-navy-900/50'>
              <Image
                src='/logo.png'
                alt='The House of Rani'
                width={176}
                height={52}
                className='h-11 w-auto max-w-[200px] object-contain'
              />
              <button
                type='button'
                onClick={() => setIsMenuOpen(false)}
                className='p-2 text-white/50 hover:text-white bg-navy-800/50 hover:bg-navy-800 rounded-xl transition-all'
                aria-label='Close menu'
              >
                <X className='h-5 w-5' />
              </button>
            </div>

            <nav className='flex-1 overflow-y-auto no-scrollbar p-5 space-y-7'>
              {/* Main Nav */}
              <div className='space-y-1'>
                <Link
                  onClick={() => setIsMenuOpen(false)}
                  href='/'
                  className='flex items-center gap-3.5 px-3 py-3 text-sm font-bold text-white hover:bg-navy-800/80 rounded-2xl transition-all group'
                >
                  <div className='p-2 rounded-xl bg-white/5 text-brand-300 group-hover:bg-brand-500 group-hover:text-white transition-colors'>
                    <Home className='w-4 h-4' />
                  </div>
                  Home
                </Link>
                <Link
                  onClick={() => setIsMenuOpen(false)}
                  href='/shop'
                  className='flex items-center gap-3.5 px-3 py-3 text-sm font-bold text-white hover:bg-navy-800/80 rounded-2xl transition-all group'
                >
                  <div className='p-2 rounded-xl bg-white/5 text-brand-300 group-hover:bg-brand-500 group-hover:text-white transition-colors'>
                    <Store className='w-4 h-4' />
                  </div>
                  All Sarees
                </Link>
                <Link
                  onClick={() => setIsMenuOpen(false)}
                  href='/shop?sort=-createdAt'
                  className='flex items-center gap-3.5 px-3 py-3 text-sm font-bold text-white hover:bg-navy-800/80 rounded-2xl transition-all group'
                >
                  <div className='p-2 rounded-xl bg-gold-400/10 text-gold-400 group-hover:bg-gold-500 group-hover:text-white transition-colors'>
                    <Package className='w-4 h-4' />
                  </div>
                  New Arrivals
                </Link>
                <Link
                  onClick={() => setIsMenuOpen(false)}
                  href='/gifting'
                  className='flex items-center gap-3.5 px-3 py-3 text-sm font-bold text-white hover:bg-navy-800/80 rounded-2xl transition-all group'
                >
                  <div className='p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors'>
                    <Gift className='w-4 h-4' />
                  </div>
                  Bespoke Gifting
                </Link>
                <Link
                  onClick={() => setIsMenuOpen(false)}
                  href='/blog'
                  className={cn(
                    "flex items-center gap-3.5 px-3 py-3 text-sm font-bold text-white hover:bg-navy-800/80 rounded-2xl transition-all group",
                    pathname.startsWith("/blog") && "bg-navy-800/80",
                  )}
                >
                  <div className='p-2 rounded-xl bg-white/5 text-brand-300 group-hover:bg-brand-500 group-hover:text-white transition-colors'>
                    <LayoutDashboard className='w-4 h-4' />
                  </div>
                  The Rani Blog
                </Link>
                {/* about */}
                <Link
                  onClick={() => setIsMenuOpen(false)}
                  href='/about'
                  className='flex items-center gap-3.5 px-3 py-3 text-sm font-bold text-white hover:bg-navy-800/80 rounded-2xl transition-all group'
                >
                  <div className='p-2 rounded-xl bg-white/5 text-brand-300 group-hover:bg-brand-500 group-hover:text-white transition-colors'>
                    <Shield className='w-4 h-4' />
                  </div>
                  About
                </Link>
                <Link
                  onClick={() => setIsMenuOpen(false)}
                  href='/faq'
                  className='flex items-center gap-3.5 px-3 py-3 text-sm font-bold text-white hover:bg-navy-800/80 rounded-2xl transition-all group'
                >
                  <div className='p-2 rounded-xl bg-white/5 text-brand-300 group-hover:bg-brand-500 group-hover:text-white transition-colors'>
                    <Shield className='w-4 h-4' />
                  </div>
                  FAQ
                </Link>
              </div>

              {/* Categories */}
              {navCategories.length > 0 && (
                <div>
                  <p className='px-4 mb-3 text-[10px] font-black text-white/30 uppercase tracking-widest'>
                    Curated Collections
                  </p>
                  <div className='space-y-0.5'>
                    {navCategories.map((cat) => (
                      <Link
                        key={cat._id}
                        onClick={() => setIsMenuOpen(false)}
                        href={buildShopCategoryHref(cat)}
                        className='block px-4 py-2.5 text-sm font-medium text-white/70 hover:text-white hover:bg-navy-800/60 rounded-xl transition-colors'
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Account Section */}
              <div className='pb-6'>
                <p className='px-4 mb-3 text-[10px] font-black text-white/30 uppercase tracking-widest'>
                  Your Account
                </p>
                {isAuthedStable ?
                  <div className='space-y-1 bg-navy-900/50 p-2 rounded-3xl border border-navy-800/50'>
                    <Link
                      onClick={() => setIsMenuOpen(false)}
                      href='/dashboard'
                      className='flex items-center gap-3 px-3 py-3 text-sm font-medium text-white/80 hover:text-white hover:bg-navy-800 rounded-2xl transition-colors'
                    >
                      <User className='w-4 h-4 text-white/40' /> Dashboard
                    </Link>
                    <Link
                      onClick={() => setIsMenuOpen(false)}
                      href='/dashboard/orders'
                      className='flex items-center gap-3 px-3 py-3 text-sm font-medium text-white/80 hover:text-white hover:bg-navy-800 rounded-2xl transition-colors'
                    >
                      <Package className='w-4 h-4 text-white/40' /> My Orders
                    </Link>
                    <Link
                      onClick={() => setIsMenuOpen(false)}
                      href='/dashboard/gifting'
                      className='flex items-center gap-3 px-3 py-3 text-sm font-medium text-white/80 hover:text-white hover:bg-navy-800 rounded-2xl transition-colors'
                    >
                      <Gift className='w-4 h-4 text-white/40' /> Custom Gifting
                    </Link>

                    {user?.role === "admin" && (
                      <Link
                        onClick={() => setIsMenuOpen(false)}
                        href='/admin'
                        className='flex items-center gap-3 px-3 py-3 text-sm font-medium text-white/80 hover:text-white hover:bg-navy-800 rounded-2xl transition-colors'
                      >
                        <Shield className='w-4 h-4 text-white/40' /> Admin Panel
                      </Link>
                    )}
                    <Link
                      onClick={() => setIsMenuOpen(false)}
                      href='/dashboard/wishlist'
                      className='flex items-center justify-between px-3 py-3 text-sm font-medium text-white/80 hover:text-white hover:bg-navy-800 rounded-2xl transition-colors'
                    >
                      <span className='flex items-center gap-3'>
                        <Heart className='w-4 h-4 text-white/40' /> Wishlist
                      </span>
                      {wishlistProducts.length > 0 && (
                        <span className='bg-brand-500/20 text-brand-300 text-[10px] font-bold px-2 py-0.5 rounded-full'>
                          {wishlistProducts.length}
                        </span>
                      )}
                    </Link>
                    <button
                      type='button'
                      onClick={handleLogout}
                      className='w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/20 border border-transparent rounded-2xl transition-all'
                    >
                      <LogOut className='w-4 h-4' /> Sign Out
                    </button>
                  </div>
                : <div className='flex gap-2.5 mt-2'>
                    <Link
                      onClick={() => setIsMenuOpen(false)}
                      href={authHref("login")}
                      scroll={false}
                      className='flex-1 py-3 text-xs font-bold text-white bg-navy-800 border border-navy-700 hover:bg-navy-700 hover:border-navy-600 rounded-2xl text-center transition-all shadow-sm'
                    >
                      Sign In
                    </Link>
                    <Link
                      onClick={() => setIsMenuOpen(false)}
                      href={authHref("signup")}
                      scroll={false}
                      className='flex-1 py-3 text-xs font-bold bg-gradient-to-tr from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-2xl text-center shadow-lg shadow-brand-900/40 transition-all'
                    >
                      Create Account
                    </Link>
                  </div>
                }
              </div>
            </nav>
          </div>
        </div>
      )}

      {isUserMenuOpen && (
        <div
          className='fixed inset-0 z-30'
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}

      {/* Mobile bottom navigation — solid bg (no backdrop-blur / alpha bg: avoids “white bar” + invisible white icons on iOS/WebKit) */}
      <nav
        className='lg:hidden fixed bottom-0 inset-x-0 z-[90] box-border border-t border-navy-700 bg-navy-950 pb-[env(safe-area-inset-bottom,0px)] text-white shadow-[0_-8px_32px_rgba(20,25,47,0.55)] [color-scheme:dark]'
        aria-label='Primary'
      >
        <div className='mx-auto grid min-h-[3.25rem] w-full max-w-xl grid-cols-6 px-0.5'>
          {mobileBottomNavItems.map(
            ({ id, label, Icon, href, activeKey, showCartBadge }) => {
              const isOn = navActive[activeKey];
              const linkClass = mobileTabClass(isOn);
              const iconClass = mobileTabIconClass(isOn);
              const cartAriaSuffix =
                showCartBadge && itemCount > 0 ?
                  `, ${itemCount} item${itemCount === 1 ? "" : "s"} in cart`
                : "";
              return (
                <Link
                  key={id}
                  href={href}
                  className={linkClass}
                  aria-current={isOn ? "page" : undefined}
                  aria-label={`${label}${cartAriaSuffix}`}
                >
                  {showCartBadge ?
                    <span className='relative inline-flex' aria-hidden='true'>
                      <Icon
                        className={iconClass}
                        strokeWidth={isOn ? 2.5 : 2}
                      />
                      {itemCount > 0 && (
                        <span className='absolute -right-1.5 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full border border-navy-900 bg-brand-600 px-0.5 text-[8px] font-bold leading-none text-white'>
                          {itemCount > 9 ? "9+" : itemCount}
                        </span>
                      )}
                    </span>
                  : <Icon
                      className={iconClass}
                      strokeWidth={isOn ? 2.5 : 2}
                      aria-hidden='true'
                    />
                  }
                  <span aria-hidden='true'>{label}</span>
                </Link>
              );
            },
          )}
        </div>
      </nav>
    </>
  );
}
