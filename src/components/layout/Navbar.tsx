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
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { categoryApi, storefrontApi } from "@/lib/api";
import { Category, StorefrontSettings } from "@/types";
import { cn } from "@/lib/utils";
import { queryKeys } from "@/lib/queryKeys";
import NotificationBell from "@/components/layout/NotificationBell";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
    const q = searchQuery.trim();
    if (q) {
      router.push(`/shop?search=${encodeURIComponent(q)}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

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

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 border-b border-navy-800 bg-navy-950",
          "transition-[box-shadow] duration-200 ease-out motion-reduce:transition-none",
          isScrolled ?
            "shadow-[0_8px_28px_-6px_rgba(0,0,0,0.5)]"
          : "shadow-[0_2px_12px_-2px_rgba(0,0,0,0.28)]",
        )}
      >
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative'>
          <div className='flex items-center justify-between h-16 gap-2'>
            {/* Logo — left on mobile, desktop flow */}
            <Link
              href='/'
              className='flex-shrink-0 flex items-center min-w-0 lg:flex-shrink-0'
            >
              <Image
                src='/logo.jpg'
                alt='The House of Rani'
                width={160}
                height={48}
                className='h-9 sm:h-12 w-auto max-w-[140px] sm:max-w-none object-contain object-left'
                priority
              />
            </Link>

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
                className='px-3 py-2 text-sm font-medium text-white/75 hover:text-white hover:bg-navy-800 rounded-md transition-colors'
              >
                New Arrivals
              </Link>

              <Link
                href='/shop?isFeatured=true'
                className='px-3 py-2 text-sm font-medium text-gold-400 hover:text-gold-300 hover:bg-navy-800 rounded-md transition-colors'
              >
                Gifting
              </Link>
              <Link
                href='/blog'
                className='px-3 py-2 text-sm font-medium text-white/75 hover:text-white hover:bg-navy-800 rounded-md transition-colors'
              >
                Blog
              </Link>
            </nav>

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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='Search sarees, lehengas, kurtis…'
                  autoComplete='off'
                  aria-label='Search store'
                  className='w-full rounded-xl border border-navy-600/80 bg-navy-800/90 py-2 pl-9 pr-24 text-sm text-white shadow-inner placeholder:text-white/40 focus:border-brand-500/60 focus:outline-none focus:ring-2 focus:ring-brand-600/35'
                />
                {searchQuery ?
                  <button
                    type='button'
                    onClick={() => setSearchQuery("")}
                    className='absolute right-[4.25rem] top-1/2 -translate-y-1/2 rounded-md p-1 text-white/45 hover:bg-navy-700 hover:text-white'
                    aria-label='Clear search'
                  >
                    <X className='h-3.5 w-3.5' />
                  </button>
                : null}
                <kbd className='pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 select-none rounded border border-navy-600 bg-navy-900/80 px-1.5 py-0.5 font-sans text-[10px] font-medium text-white/50 xl:inline'>
                  Ctrl+K
                </kbd>
              </div>
            </form>

            {/* Right actions — mobile: search on right; cart in header only on desktop (mobile: bottom nav) */}
            <div className='flex items-center justify-end gap-0.5 sm:gap-1 shrink-0'>
              {isAuthenticated && (
                <>
                  <NotificationBell />
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
                </>
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

              <button
                type='button'
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className='lg:hidden p-2 text-white/75 hover:text-white hover:bg-navy-800 rounded-md transition-colors'
                aria-label='Search'
                aria-expanded={isSearchOpen}
              >
                <Search className='h-5 w-5' />
              </button>

              {isAuthenticated ?
                <div className='relative'>
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
                          {user?.name.charAt(0).toUpperCase()}
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
                  className='flex items-center gap-1 px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-navy-800 rounded-md transition-colors'
                >
                  <User className='h-5 w-5' />
                  <span className='hidden sm:block'>Sign In</span>
                </Link>
              }
            </div>
          </div>

          {announcementMessages.length > 0 && (
            <div className='min-h-10 border-t border-navy-700 flex items-center justify-center px-3 py-1.5 text-center'>
              <p className='text-xs sm:text-sm text-gold-300 font-medium leading-snug max-w-4xl animate-fadeIn'>
                {announcementMessages[announcementIndex]}
              </p>
            </div>
          )}

          {/* Mobile / tablet search */}
          {isSearchOpen && (
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
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder='Search sarees, kalamkari, etc.'
                    autoComplete='off'
                    aria-label='Search store'
                    className='w-full rounded-xl border border-navy-600 bg-navy-800 py-2.5 pl-9 pr-10 text-sm text-white placeholder:text-white/40 focus:border-brand-500/60 focus:outline-none focus:ring-2 focus:ring-brand-600/35'
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
                  className='shrink-0 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700'
                >
                  Search
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
            className='fixed inset-0 bg-black/60 backdrop-blur-sm'
            onClick={() => setIsMenuOpen(false)}
          />
          <div className='fixed left-0 top-0 h-full w-[min(20rem,88vw)] max-h-[100dvh] bg-navy-900 shadow-2xl flex flex-col animate-fadeIn'>
            {/* Drawer header */}
            <div className='flex items-center justify-between p-4 border-b border-navy-700'>
              <Image
                src='/logo.jpg'
                alt='The House of Rani'
                width={130}
                height={40}
                className='h-10 w-auto object-contain'
              />
              <button
                onClick={() => setIsMenuOpen(false)}
                className='p-2 text-white/70 hover:text-white'
              >
                <X className='h-5 w-5' />
              </button>
            </div>

            <nav className='flex-1 overflow-y-auto p-4 space-y-1'>
              <Link
                href='/'
                className='block px-3 py-2 text-sm font-medium text-white hover:bg-navy-800 rounded-lg'
              >
                Home
              </Link>
              <Link
                href='/cart'
                className='flex items-center justify-between px-3 py-2 text-sm font-medium text-white hover:bg-navy-800 rounded-lg'
              >
                Cart
                {itemCount > 0 && (
                  <span className='text-xs bg-brand-600 px-2 py-0.5 rounded-full'>
                    {itemCount}
                  </span>
                )}
              </Link>
              <Link
                href='/shop'
                className='block px-3 py-2 text-sm font-medium text-white hover:bg-navy-800 rounded-lg'
              >
                All Products
              </Link>
              <Link
                href='/shop?sort=-createdAt'
                className='block px-3 py-2 text-sm font-medium text-white hover:bg-navy-800 rounded-lg'
              >
                New Arrivals
              </Link>
              <Link
                href='/shop?isFeatured=true'
                className='block px-3 py-2 text-sm font-medium text-gold-400 hover:bg-navy-800 rounded-lg'
              >
                Featured
              </Link>
              <Link
                href='/blog'
                className='block px-3 py-2 text-sm font-medium text-white hover:bg-navy-800 rounded-lg'
              >
                Blog
              </Link>

              {navCategories.length > 0 && (
                <>
                  <p className='px-3 pt-3 pb-1 text-xs font-semibold text-white/40 uppercase tracking-widest'>
                    Categories
                  </p>
                  {navCategories.map((cat) => (
                    <Link
                      key={cat._id}
                      href={`/shop?category=${encodeURIComponent(cat.name)}`}
                      className='block px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-navy-800 rounded-lg'
                    >
                      {cat.name}
                    </Link>
                  ))}
                </>
              )}

              {isAuthenticated ?
                <>
                  <p className='px-3 pt-3 pb-1 text-xs font-semibold text-white/40 uppercase tracking-widest'>
                    Account
                  </p>
                  <Link
                    href='/dashboard'
                    prefetch
                    className='block px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-navy-800 rounded-lg'
                  >
                    My Account
                  </Link>
                  <Link
                    href='/dashboard/orders'
                    prefetch
                    className='block px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-navy-800 rounded-lg'
                  >
                    My Orders
                  </Link>
                  <Link
                    href='/dashboard/wishlist'
                    prefetch
                    className='block px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-navy-800 rounded-lg'
                  >
                    Wishlist ({wishlistProducts.length})
                  </Link>
                  <button
                    onClick={handleLogout}
                    className='block w-full text-left px-3 py-2 text-sm text-brand-400 hover:bg-navy-800 rounded-lg'
                  >
                    Sign Out
                  </button>
                </>
              : <>
                  <div className='pt-3 space-y-2'>
                    <Link
                      href='/auth/login'
                      className='block px-3 py-2 text-sm font-medium text-white hover:bg-navy-800 rounded-lg text-center border border-navy-600'
                    >
                      Sign In
                    </Link>
                    <Link
                      href='/auth/signup'
                      className='block px-3 py-2 text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-center transition-colors'
                    >
                      Create Account
                    </Link>
                  </div>
                </>
              }
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
        <div className='grid w-full grid-cols-5 max-w-xl mx-auto px-0.5 min-h-[3.25rem]'>
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
          <button
            type='button'
            onClick={() => setIsMenuOpen((o) => !o)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-[3.25rem] min-w-0 text-[9px] sm:text-[10px] font-semibold tracking-wide transition-colors touch-manipulation",
              isMenuOpen ? "text-white" : "text-white/70 hover:text-white",
            )}
            aria-expanded={isMenuOpen}
            aria-label='Open menu'
          >
            {isMenuOpen ?
              <X
                className='h-[1.125rem] w-[1.125rem] sm:h-5 sm:w-5 shrink-0 text-brand-400'
                strokeWidth={2.5}
              />
            : <Menu
                className='h-[1.125rem] w-[1.125rem] sm:h-5 sm:w-5 shrink-0 text-white/75'
                strokeWidth={2}
              />
            }
            Menu
          </button>
        </div>
      </nav>
    </>
  );
}
