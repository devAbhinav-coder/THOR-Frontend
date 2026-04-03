"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
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
import { queryKeys } from "@/lib/queryKeys";
import NotificationBell from "@/components/layout/NotificationBell";
import BrowserNotificationPrompt from "@/components/layout/BrowserNotificationPrompt";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchSubmitting, setIsSearchSubmitting] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const searchDesktopRef = useRef<HTMLInputElement>(null);
  const searchMobileRef = useRef<HTMLInputElement>(null);

  const { user, isAuthenticated, logout } = useAuthStore();
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
    () => categoriesData.slice(0, 7),
    [categoriesData],
  );

  const { data: storefrontSettings } = useQuery({
    queryKey: queryKeys.storefrontSettings,
    queryFn: async () => {
      const body = await storefrontApi.getSettings();
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
    setIsSearchSubmitting(false);
  }, [pathname]);

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

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim().slice(0, 30);
    if (q) {
      setIsSearchSubmitting(true);
      router.push(`/shop?search=${encodeURIComponent(q)}`);
      setIsSearchOpen(false);
    }
  };

  useEffect(() => {
    if (!isSearchSubmitting) return;
    const timer = window.setTimeout(() => {
      setIsSearchSubmitting(false);
      setSearchQuery("");
    }, 900);
    return () => window.clearTimeout(timer);
  }, [isSearchSubmitting]);

  const focusStoreSearch = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 1024px)").matches) {
      searchDesktopRef.current?.focus();
    } else {
      setIsSearchOpen(true);
      queueMicrotask(() => searchMobileRef.current?.focus());
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

  const ordersHref =
    isAuthenticated ? "/dashboard/orders" : (
      "/auth/login?redirect=/dashboard/orders"
    );

  const isShopActive = pathname === "/shop" || pathname.startsWith("/shop");
  const isOrdersActive = pathname.startsWith("/dashboard/orders");
  const isCartActive = pathname === "/cart" || pathname.startsWith("/cart");
  const isGiftingActive =
    pathname === "/gifting" || pathname.startsWith("/gifting");
  const showGlobalStoreSearch = !isGiftingActive;

  return (
    <>
      <BrowserNotificationPrompt />
      {announcementMessages.length > 0 && pathname === "/" && (
        <div className='bg-navy-950 min-h-8 border-b border-navy-700 flex items-center justify-center px-3 py-1.5 text-center relative z-40 group cursor-default'>
          <p className='text-xs sm:text-sm text-gold-300 font-medium leading-snug max-w-4xl animate-fadeIn'>
            {announcementMessages[announcementIndex]}
          </p>
        </div>
      )}

      <header
        className={cn(
          "sticky top-0 z-50 border-b border-navy-800 bg-navy-950",
          "transition-[box-shadow] duration-200 ease-out motion-reduce:transition-none",
          isScrolled ?
            "shadow-[0_8px_28px_-6px_rgba(0,0,0,0.5)]"
          : "shadow-[0_2px_12px_-2px_rgba(0,0,0,0.28)]",
        )}
      >
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative'>
          <div className='flex items-center justify-between h-16 gap-2'>
            <div className='flex items-center gap-1 sm:gap-2 lg:gap-0'>
              <button
                type='button'
                onClick={() => setIsMenuOpen((o) => !o)}
                className='lg:hidden p-1.5 -ml-1.5 text-white/75 hover:text-white rounded-md transition-colors'
                aria-label='Open menu'
              >
                <Menu className='h-6 w-6' strokeWidth={1.5} />
              </button>
              {/* Logo — left on mobile, desktop flow */}
              <Link
                href='/'
                className='flex-shrink-0 flex items-center min-w-0 lg:flex-shrink-0'
              >
                <Image
                  src='/logo.png'
                  alt='The House of Rani'
                  width={200}
                  height={58}
                  className='h-11 w-auto max-w-[168px] sm:max-w-none sm:h-[3.35rem] lg:h-[3.5rem] object-contain object-left'
                  priority
                />
              </Link>
            </div>

            {/* Desktop nav */}
            <nav className='hidden lg:flex items-center space-x-1 flex-1 justify-center mx-4'>
              <Link
                href='/'
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  pathname === "/" ?
                    "text-white bg-navy-700"
                  : "text-white/75 hover:text-white hover:bg-navy-800",
                )}
              >
                Home
              </Link>

              <div className='relative group'>
                <button className='flex items-center gap-1 px-3 py-2 text-sm font-medium text-white/75 hover:text-white rounded-md hover:bg-navy-800 transition-colors'>
                  Shop <ChevronDown className='h-4 w-4' />
                </button>
                <div className='absolute top-full left-0 bg-navy-900 border border-navy-700 shadow-2xl rounded-xl p-2 min-w-[200px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200'>
                  <Link
                    href='/shop'
                    className='block px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-navy-800 rounded-lg transition-colors'
                  >
                    All Products
                  </Link>
                  {navCategories.map((cat) => (
                    <Link
                      key={cat._id}
                      href={`/shop?category=${encodeURIComponent(cat.name)}`}
                      className='block px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-navy-800 rounded-lg transition-colors'
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>

              <Link
                href='/shop?sort=-createdAt'
                className='px-3 py-2 text-sm font-medium text-gold-400 hover:text-gold-300  hover:bg-navy-800 rounded-md transition-colors'
              >
                New Arrivals
              </Link>
              <Link
                href='/gifting'
                className='flex items-center gap-1 px-3 py-2 text-sm font-medium text-brand-300 hover:text-brand-200 hover:bg-navy-800 rounded-md transition-colors'
              >
                <Gift className='h-3.5 w-3.5' />
                Gifting
              </Link>
              <Link
                href='/blog'
                className='px-3 py-2 text-sm font-medium text-white/75 hover:text-white hover:bg-navy-800 rounded-md transition-colors'
              >
                Blog
              </Link>
            </nav>

            {showGlobalStoreSearch && (
              <form
                data-navbar-search
                onSubmit={handleSearch}
                className='hidden lg:block flex-1 min-w-0 max-w-xl mx-2'
              >
                <div className='relative'>
                  <Search
                    className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35'
                    aria-hidden
                  />
                  <input
                    ref={searchDesktopRef}
                    type='search'
                    value={searchQuery}
                    onChange={(e) =>
                      setSearchQuery(e.target.value.slice(0, 30))
                    }
                    placeholder='Search sarees, lehengas, kurtis…'
                    maxLength={30}
                    autoComplete='off'
                    aria-label='Search store'
                    className={cn(
                      "w-full rounded-xl border border-navy-600/80 bg-navy-800/90 py-2 pl-9 text-sm text-white shadow-inner placeholder:text-white/40 focus:border-brand-500/60 focus:outline-none focus:ring-2 focus:ring-brand-600/35 [appearance:textfield] [&::-webkit-search-decoration]:hidden [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden",
                      searchQuery ? "pr-9" : "pr-3",
                    )}
                  />
                  {searchQuery ?
                    <button
                      type='button'
                      onClick={() => setSearchQuery("")}
                      className='absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/45 hover:bg-navy-700 hover:text-white'
                      aria-label='Clear search'
                    >
                      <X className='h-3.5 w-3.5' />
                    </button>
                  : null}
                </div>
              </form>
            )}

            {/* Right actions — mobile: search on right; cart in header only on desktop (mobile: bottom nav) */}
            <div className='flex items-center justify-end gap-0.5 sm:gap-1 shrink-0'>
              {isAuthenticated && (
                <Link
                  href='/dashboard/wishlist'
                  className='relative p-2 text-white/75 hover:text-white hover:bg-navy-800 rounded-md transition-colors'
                  aria-label='Wishlist'
                >
                  <Heart className='h-5 w-5' />
                  {wishlistProducts.length > 0 && (
                    <span className='absolute -top-1 -right-1 bg-brand-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold'>
                      {wishlistProducts.length}
                    </span>
                  )}
                </Link>
              )}

              <Link
                href='/cart'
                className='relative hidden lg:flex p-2 text-white/75 hover:text-white hover:bg-navy-800 rounded-md transition-colors'
                aria-label='Cart'
              >
                <ShoppingBag className='h-5 w-5' />
                {itemCount > 0 && (
                  <span className='absolute -top-1 -right-1 bg-brand-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold'>
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </Link>

              {showGlobalStoreSearch && (
                <button
                  type='button'
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className='lg:hidden p-2 text-white/75 hover:text-white hover:bg-navy-800 rounded-md transition-colors'
                  aria-label='Search'
                  aria-expanded={isSearchOpen}
                >
                  <Search className='h-5 w-5' />
                </button>
              )}

              {isAuthenticated && <NotificationBell />}

              {isAuthenticated ?
                <div className='hidden lg:block relative'>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className='flex items-center gap-2 p-2 text-white/75 hover:text-white hover:bg-navy-800 rounded-md transition-colors'
                  >
                    <div className='h-8 w-8 rounded-full bg-navy-700 border-2 border-brand-600 flex items-center justify-center overflow-hidden'>
                      {user?.avatar ?
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className='h-full w-full object-cover'
                        />
                      : <span className='text-white font-semibold text-sm'>
                          {String(user?.name || "U").charAt(0).toUpperCase()}
                        </span>
                      }
                    </div>
                  </button>

                  {isUserMenuOpen && (
                    <div className='absolute right-0 top-full mt-1 bg-navy-900 border border-navy-700 shadow-2xl rounded-xl p-2 min-w-[200px] animate-fadeIn'>
                      <div className='px-3 py-2 border-b border-navy-700 mb-1'>
                        <p className='text-sm font-semibold text-white truncate'>
                          {user?.name}
                        </p>
                        <p className='text-xs text-white/50 truncate'>
                          {user?.email}
                        </p>
                      </div>
                      <Link
                        href='/dashboard'
                        prefetch
                        className='flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-navy-800 rounded-lg'
                      >
                        <LayoutDashboard className='h-4 w-4' /> My Account
                      </Link>
                      <Link
                        href='/dashboard/orders'
                        prefetch
                        className='flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-navy-800 rounded-lg'
                      >
                        <Package className='h-4 w-4' /> My Orders
                      </Link>
                      {user?.role === "admin" && (
                        <Link
                          href='/admin'
                          prefetch
                          className='flex items-center gap-2 px-3 py-2 text-sm text-gold-400 hover:text-gold-300 hover:bg-navy-800 rounded-lg font-medium'
                        >
                          <Shield className='h-4 w-4' /> Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className='flex items-center gap-2 w-full px-3 py-2 text-sm text-brand-400 hover:text-brand-300 hover:bg-navy-800 rounded-lg'
                      >
                        <LogOut className='h-4 w-4' /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              : <Link
                  href='/auth/login'
                  className='hidden lg:flex items-center gap-1 px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-navy-800 rounded-md transition-colors'
                >
                  <User className='h-5 w-5' />
                  <span className='hidden sm:block'>Sign In</span>
                </Link>
              }
            </div>
          </div>

          {/* Announcement Bar Removed from Header */}

          {/* Mobile / tablet search */}
          {showGlobalStoreSearch && isSearchOpen && (
            <div
              data-navbar-search
              className='border-t border-navy-700 pb-3 pt-3 animate-fadeIn lg:hidden'
            >
              <form
                onSubmit={handleSearch}
                className='flex flex-col gap-2 sm:flex-row sm:items-center'
              >
                <div className='relative flex-1'>
                  <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35' />
                  <input
                    ref={searchMobileRef}
                    type='search'
                    value={searchQuery}
                    onChange={(e) =>
                      setSearchQuery(e.target.value.slice(0, 30))
                    }
                    placeholder='Search kalamkari sarees , chiffon sarees, etc.'
                    maxLength={30}
                    autoComplete='off'
                    aria-label='Search store'
                    className='w-full rounded-xl border border-navy-600 bg-navy-800 py-2.5 pl-9 pr-10 text-sm text-white placeholder:text-white/40 focus:border-brand-500/60 focus:outline-none focus:ring-2 focus:ring-brand-600/35 [appearance:textfield] [&::-webkit-search-decoration]:hidden [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden'
                  />
                  {searchQuery ?
                    <button
                      type='button'
                      onClick={() => setSearchQuery("")}
                      className='absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/45 hover:bg-navy-700 hover:text-white'
                      aria-label='Clear search'
                    >
                      <X className='h-4 w-4' />
                    </button>
                  : null}
                </div>
                <button
                  type='submit'
                  disabled={isSearchSubmitting}
                  className='shrink-0 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700'
                >
                  {isSearchSubmitting ? "Searching..." : "Search"}
                </button>
              </form>
            </div>
          )}
        </div>
      </header>

      {/* Mobile drawer — above bottom tab bar */}
      {isMenuOpen && (
        <div className='fixed inset-0 z-[100] lg:hidden'>
          <div
            className='fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300'
            onClick={() => setIsMenuOpen(false)}
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
                onClick={() => setIsMenuOpen(false)}
                className='p-2 text-white/50 hover:text-white bg-navy-800/50 hover:bg-navy-800 rounded-xl transition-all'
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
                  All Products
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
                  className='flex items-center gap-3.5 px-3 py-3 text-sm font-bold text-white hover:bg-navy-800/80 rounded-2xl transition-all group'
                >
                  <div className='p-2 rounded-xl bg-white/5 text-brand-300 group-hover:bg-brand-500 group-hover:text-white transition-colors'>
                    <LayoutDashboard className='w-4 h-4' />
                  </div>
                  The Rani Blog
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
                        href={`/shop?category=${encodeURIComponent(cat.name)}`}
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
                {isAuthenticated ?
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
                      onClick={handleLogout}
                      className='w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/20 border border-transparent rounded-2xl transition-all'
                    >
                      <LogOut className='w-4 h-4' /> Sign Out
                    </button>
                  </div>
                : <div className='flex gap-2.5 mt-2'>
                    <Link
                      onClick={() => setIsMenuOpen(false)}
                      href='/auth/login'
                      className='flex-1 py-3 text-xs font-bold text-white bg-navy-800 border border-navy-700 hover:bg-navy-700 hover:border-navy-600 rounded-2xl text-center transition-all shadow-sm'
                    >
                      Sign In
                    </Link>
                    <Link
                      onClick={() => setIsMenuOpen(false)}
                      href='/auth/signup'
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
        className='lg:hidden fixed bottom-0 inset-x-0 z-[90] box-border border-t border-navy-700 bg-navy-950 pb-[env(safe-area-inset-bottom,0px)] text-white shadow-[0_-8px_32px_rgba(0,0,0,0.45)] [color-scheme:dark]'
        aria-label='Primary'
      >
        <div className='grid w-full grid-cols-6 max-w-xl mx-auto px-0.5 min-h-[3.25rem]'>
          <Link
            href='/'
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-[3.25rem] min-w-0 text-[9px] sm:text-[10px] font-semibold tracking-wide transition-colors touch-manipulation",
              pathname === "/" ? "text-white" : (
                "text-white/70 hover:text-white"
              ),
            )}
          >
            <Home
              className={cn(
                "h-[1.125rem] w-[1.125rem] sm:h-5 sm:w-5 shrink-0",
                pathname === "/" ? "text-brand-400" : "text-white/75",
              )}
              strokeWidth={pathname === "/" ? 2.5 : 2}
            />
            Home
          </Link>
          <Link
            href='/shop'
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-[3.25rem] min-w-0 text-[9px] sm:text-[10px] font-semibold tracking-wide transition-colors touch-manipulation",
              isShopActive ? "text-white" : "text-white/70 hover:text-white",
            )}
          >
            <Store
              className={cn(
                "h-[1.125rem] w-[1.125rem] sm:h-5 sm:w-5 shrink-0",
                isShopActive ? "text-brand-400" : "text-white/75",
              )}
              strokeWidth={isShopActive ? 2.5 : 2}
            />
            Shop
          </Link>
          <Link
            href='/gifting'
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-[3.25rem] min-w-0 text-[9px] sm:text-[10px] font-semibold tracking-wide transition-colors touch-manipulation",
              isGiftingActive ? "text-white" : "text-white/70 hover:text-white",
            )}
          >
            <Gift
              className={cn(
                "h-[1.125rem] w-[1.125rem] sm:h-5 sm:w-5 shrink-0",
                isGiftingActive ? "text-brand-400" : "text-white/75",
              )}
              strokeWidth={isGiftingActive ? 2.5 : 2}
            />
            <span>Gifting</span>
          </Link>
          <Link
            href='/cart'
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-[3.25rem] min-w-0 text-[9px] sm:text-[10px] font-semibold tracking-wide transition-colors touch-manipulation",
              isCartActive ? "text-white" : "text-white/70 hover:text-white",
            )}
          >
            <span className='relative inline-flex'>
              <ShoppingBag
                className={cn(
                  "h-[1.125rem] w-[1.125rem] sm:h-5 sm:w-5 shrink-0",
                  isCartActive ? "text-brand-400" : "text-white/75",
                )}
                strokeWidth={isCartActive ? 2.5 : 2}
              />
              {itemCount > 0 && (
                <span className='absolute -right-1.5 -top-1 min-w-[14px] h-3.5 px-0.5 bg-brand-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center leading-none border border-navy-900'>
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </span>
            Cart
          </Link>
          <Link
            href={ordersHref}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-[3.25rem] min-w-0 text-[9px] sm:text-[10px] font-semibold tracking-wide transition-colors touch-manipulation",
              isOrdersActive ? "text-white" : "text-white/70 hover:text-white",
            )}
          >
            <Package
              className={cn(
                "h-[1.125rem] w-[1.125rem] sm:h-5 sm:w-5 shrink-0",
                isOrdersActive ? "text-brand-400" : "text-white/75",
              )}
              strokeWidth={isOrdersActive ? 2.5 : 2}
            />
            Orders
          </Link>
          <Link
            href={isAuthenticated ? "/dashboard" : "/auth/login"}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-[3.25rem] min-w-0 text-[9px] sm:text-[10px] font-semibold tracking-wide transition-colors touch-manipulation",
              pathname === "/dashboard" || pathname === "/auth/login" ?
                "text-white"
              : "text-white/70 hover:text-white",
            )}
          >
            <User
              className={cn(
                "h-[1.125rem] w-[1.125rem] sm:h-5 sm:w-5 shrink-0",
                pathname === "/dashboard" || pathname === "/auth/login" ?
                  "text-brand-400"
                : "text-white/75",
              )}
              strokeWidth={
                pathname === "/dashboard" || pathname === "/auth/login" ?
                  2.5
                : 2
              }
            />
            Profile
          </Link>
        </div>
      </nav>
    </>
  );
}
