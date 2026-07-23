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
  AlertTriangle,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { navigationApi } from "@/lib/api";
import { MegaMenuCategory } from "@/types";
import { cn } from "@/lib/utils";
import { isShopCatalogCategory } from "@/lib/categoryFilters";
import { buildShopCategoryHref } from "@/lib/shopCategorySeo";
import { queryKeys } from "@/lib/queryKeys";
import NotificationBell from "@/components/layout/NotificationBell";
import NavProfileDropdown from "@/components/layout/NavProfileDropdown";
import MegaMenu from "@/components/layout/MegaMenu";
import MobileMegaMenu from "@/components/layout/MobileMegaMenu";
import BrowserNotificationPrompt from "@/components/layout/BrowserNotificationPrompt";
import StoreSearchAutocomplete from "@/components/search/StoreSearchAutocomplete";
import VoiceSearchOverlay from "@/components/search/VoiceSearchOverlay";
import {
  useStoreNavActive,
  type StoreNavActive,
} from "@/hooks/useStoreNavActive";
import { useAuthModal } from "@/hooks/useAuthModal";
import { useNavDropdown } from "@/hooks/useNavDropdown";
import { useMobileNavAutoHide } from "@/hooks/useMobileNavAutoHide";
import {
  isStoreProductDetailPath,
  isStoreShopListingPath,
} from "@/lib/storeRoutes";
import {
  mobileTabClass,
  mobileTabIconClass,
  navAvatarButton,
  navAvatarRing,
  navBadgeCount,
  navIconButton,
  navLinkClass,
  navSearchInputClass,
  navShellClass,
  navStickyShellClass,
  navUserMenuShellClass,
} from "@/lib/navbarStyles";

type MobileBottomItem = {
  id: string;
  label: string;
  Icon: LucideIcon;
  href: string;
  activeKey: keyof StoreNavActive;
  showCartBadge?: boolean;
};

type NavbarProps = {
  /** SSR snapshot for shop dropdown + mobile drawer categories. */
  initialNavCategories?: MegaMenuCategory[];
};

export default function Navbar({
  initialNavCategories = [],
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const shopMenu = useNavDropdown();
  const userMenu = useNavDropdown();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const { user, isAuthenticated, isLoading, hasSessionChecked, logout } =
    useAuthStore();
  const { itemCount } = useCartStore();
  const { products: wishlistProducts } = useWishlistStore();

  const { data: categoriesData } = useQuery({
    queryKey: queryKeys.megaMenu,
    queryFn: async () => {
      const body = await navigationApi.getMegaMenu();
      return (body.data.categories || []) as unknown as MegaMenuCategory[];
    },
    staleTime: 5 * 60 * 1000,
  });
  const navCategories = useMemo(() => {
    const pickShopCategories = (cats: MegaMenuCategory[]) =>
      cats.filter(isShopCatalogCategory).slice(0, 7);
    const live = categoriesData ?? [];
    if (live.length > 0) return pickShopCategories(live);
    return pickShopCategories(initialNavCategories);
  }, [categoriesData, initialNavCategories]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      navCategories.forEach((cat) => {
        router.prefetch(buildShopCategoryHref(cat));
      });
    }, 250);
    return () => window.clearTimeout(id);
  }, [navCategories, router]);

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
    shopMenu.close();
    userMenu.close();
  }, [pathname, shopMenu.close, userMenu.close]);

  const urlSearchForNav = useMemo(() => {
    if (pathname.startsWith("/shop") || pathname.startsWith("/gifting")) {
      return (searchParams.get("search") || "").slice(0, 30);
    }
    return "";
  }, [pathname, searchParams]);

  const handleLogout = useCallback(async () => {
    await logout();
    userMenu.close();
  }, [logout, userMenu.close]);

  const focusStoreSearch = useCallback(() => {
    if (typeof document === "undefined") return;
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (isDesktop) {
      document
        .querySelector<HTMLInputElement>(
          '[data-navbar-search-input][data-navbar-search-instance="desktop"]',
        )
        ?.focus({ preventScroll: true });
      return;
    }
    setIsSearchOpen(true);
    queueMicrotask(() => {
      document
        .querySelector<HTMLInputElement>(
          '#mobile-search-panel [data-navbar-search-input][data-navbar-search-instance="mobile"]',
        )
        ?.focus({ preventScroll: true });
    });
  }, []);

  const openMobileSearch = useCallback(() => {
    setIsSearchOpen(true);
    queueMicrotask(() => {
      document
        .querySelector<HTMLInputElement>(
          '#mobile-search-panel [data-navbar-search-input][data-navbar-search-instance="mobile"]',
        )
        ?.focus({ preventScroll: true });
    });
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
  const authModal = useAuthModal();
  const { href: authHref, open: openAuth } = authModal;

  const ordersHref =
    isAuthedStable ? "/dashboard/orders" : (
      authHref("login", "/dashboard/orders")
    );

  const navActive = useStoreNavActive();

  const isCheckoutFlow =
    pathname === "/cart" || pathname.startsWith("/checkout");
  const isProductDetailPage = isStoreProductDetailPath(pathname);
  const isShopListingPage = isStoreShopListingPath(pathname);
  /** Shop + PDP mobile: persistent search bar, cart/wishlist top-right (no search icon). */
  const showCommerceMobileShell = isProductDetailPage || isShopListingPage;
  const navAutoHideEnabled = !isCheckoutFlow && !isMenuOpen && !isSearchOpen;
  const navChromeVisible = useMobileNavAutoHide({
    enabled: navAutoHideEnabled,
  });
  const showMobileBottomNav =
    !isCheckoutFlow && !isProductDetailPage && !isShopListingPage;

  const handleWishlistPress = useCallback(() => {
    if (isAuthedStable) {
      router.push("/wishlist");
      return;
    }
    openAuth("login", "/wishlist");
  }, [isAuthedStable, router, openAuth]);

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
      <div
        className={navStickyShellClass(navChromeVisible)}
        data-store-sticky-nav
      >
        <header className={navShellClass(isScrolled)}>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative'>
            <div
              className={cn(
                "flex items-center justify-between gap-3",
                isCheckoutFlow ? "h-12 lg:h-[4.25rem]" : "h-[4.25rem]",
              )}
            >
              <div className='flex items-center gap-1 sm:gap-2 lg:gap-0'>
                <button
                  type='button'
                  onClick={() => setIsMenuOpen((o) => !o)}
                  className={cn(
                    navIconButton,
                    "lg:hidden -ml-1",
                    isCheckoutFlow && "hidden",
                  )}
                  aria-label={
                    isMenuOpen ?
                      "Close navigation menu"
                    : "Open navigation menu"
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
                {isCheckoutFlow && (
                  <button
                    type='button'
                    onClick={() => {
                      if (pathname.startsWith("/checkout")) {
                        setShowExitConfirm(true);
                      } else {
                        router.back();
                      }
                    }}
                    className='lg:hidden flex items-center gap-1.5 text-white/80 hover:text-white transition -ml-2 p-2'
                  >
                    <ChevronDown className='w-5 h-5 rotate-90' />
                    <span className='text-[11px] font-semibold uppercase tracking-wider'>
                      Back
                    </span>
                  </button>
                )}
                <Link
                  href='/'
                  className={cn(
                    "flex-shrink-0 flex items-center min-w-0 lg:flex-shrink-0",
                    isCheckoutFlow && "max-lg:hidden",
                  )}
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

                <div
                  ref={shopMenu.containerRef}
                  className='relative'
                  {...shopMenu.zoneProps}
                >
                  <button
                    type='button'
                    className={navLinkClass(navActive.shop)}
                    aria-label='Shop categories'
                    aria-haspopup='menu'
                    aria-expanded={shopMenu.isOpen}
                    onClick={shopMenu.handleTriggerClick}
                  >
                    <span className='inline-flex items-center gap-1'>
                      Shop{" "}
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 opacity-70 transition-transform duration-300 ease-out",
                          shopMenu.isOpen && "rotate-180",
                        )}
                        aria-hidden
                      />
                    </span>
                  </button>
                  <MegaMenu
                    isOpen={shopMenu.isOpen}
                    pathname={pathname}
                    categories={navCategories}
                    onNavigate={shopMenu.close}
                  />
                </div>

                <Link
                  href='/gifting'
                  className={navLinkClass(navActive.gifting)}
                >
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
                  searchInstance='desktop'
                  urlSearch={urlSearchForNav}
                  inputClassName={navSearchInputClass}
                />
              </div>

              {/* Right actions */}
              <div
                className={cn(
                  "flex items-center justify-end gap-0.5 sm:gap-1 shrink-0",
                  isCheckoutFlow && "max-lg:hidden",
                )}
              >
                {showCommerceMobileShell ?
                  <button
                    type='button'
                    onClick={handleWishlistPress}
                    className={cn(navIconButton, "relative lg:hidden")}
                    aria-label='Wishlist'
                  >
                    <Heart className='h-5 w-5' strokeWidth={1.75} />
                    {isAuthedStable && wishlistProducts.length > 0 && (
                      <span className={navBadgeCount}>
                        {wishlistProducts.length}
                      </span>
                    )}
                  </button>
                : null}

                {isAuthedStable ?
                  <Link
                    href='/wishlist'
                    className={cn(
                      navIconButton,
                      "relative",
                      showCommerceMobileShell && "hidden lg:inline-flex",
                    )}
                    aria-label='Wishlist'
                  >
                    <Heart className='h-5 w-5' strokeWidth={1.75} />
                    {wishlistProducts.length > 0 && (
                      <span className={navBadgeCount}>
                        {wishlistProducts.length}
                      </span>
                    )}
                  </Link>
                : null}

                <Link
                  href='/cart'
                  className={cn(
                    navIconButton,
                    "relative",
                    showCommerceMobileShell ? "inline-flex" : (
                      "hidden lg:inline-flex"
                    ),
                  )}
                  aria-label='Cart'
                >
                  <ShoppingBag className='h-5 w-5' strokeWidth={1.75} />
                  {itemCount > 0 && (
                    <span className={navBadgeCount}>
                      {itemCount > 9 ? "9+" : itemCount}
                    </span>
                  )}
                </Link>

                {!showCommerceMobileShell && (
                  <button
                    type='button'
                    onClick={() => {
                      if (isSearchOpen) setIsSearchOpen(false);
                      else openMobileSearch();
                    }}
                    className={cn(navIconButton, "lg:hidden")}
                    aria-label={isSearchOpen ? "Close search" : "Open search"}
                    aria-expanded={isSearchOpen}
                    aria-controls='mobile-search-panel'
                  >
                    <Search className='h-5 w-5' aria-hidden='true' />
                  </button>
                )}

                {isAuthedStable && <NotificationBell variant='navbar' />}

                {isAuthedStable ?
                  <div
                    ref={userMenu.containerRef}
                    className='relative hidden lg:block'
                    {...userMenu.zoneProps}
                  >
                    <button
                      type='button'
                      onClick={userMenu.handleTriggerClick}
                      className={navAvatarButton}
                      aria-label='Account menu'
                      aria-expanded={userMenu.isOpen}
                      aria-haspopup='menu'
                    >
                      <div className={navAvatarRing}>
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
                            className='text-sm font-semibold text-white'
                            aria-hidden='true'
                          >
                            {String(user?.name || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        }
                      </div>
                    </button>

                    <div
                      className={navUserMenuShellClass(userMenu.isOpen)}
                      aria-hidden={!userMenu.isOpen}
                    >
                      <NavProfileDropdown
                        isOpen={userMenu.isOpen}
                        pathname={pathname}
                        user={{
                          name: user?.name,
                          email: user?.email,
                          avatar: user?.avatar,
                          role: user?.role,
                        }}
                        onLogout={handleLogout}
                        onNavigate={userMenu.close}
                      />
                    </div>
                  </div>
                : <button
                    type='button'
                    onClick={() => openAuth("login")}
                    className={cn(
                      navLinkClass(false),
                      "hidden lg:inline-flex items-center gap-1.5",
                    )}
                  >
                    <User className='h-4 w-4' strokeWidth={1.75} />
                    <span>Sign In</span>
                  </button>
                }
              </div>

              {isCheckoutFlow && (
                <div className='lg:hidden flex items-center gap-1.5 text-[#c5a059] pr-1'>
                  <Shield className='w-4 h-4' />
                  <span className='text-xs font-bold uppercase tracking-wider'>
                    Secure
                  </span>
                </div>
              )}
            </div>

            {/* Mobile search — always open on shop/PDP; toggle elsewhere */}
            {!isCheckoutFlow && (showCommerceMobileShell || isSearchOpen) && (
              <div
                id='mobile-search-panel'
                className='border-t border-white/10 pb-3 pt-3 lg:hidden'
              >
                <StoreSearchAutocomplete
                  scope={navActive.gifting ? "gifting" : "shop"}
                  variant='nav-mobile'
                  searchInstance='mobile'
                  urlSearch={urlSearchForNav}
                  onNavigate={() => {
                    if (!showCommerceMobileShell) setIsSearchOpen(false);
                  }}
                />
              </div>
            )}
          </div>
        </header>
      </div>

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
                className='p-2 text-white/50 transition-colors hover:bg-navy-800 hover:text-white'
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
                  className='group flex items-center gap-3.5 border border-transparent px-3 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white transition-all hover:border-[#c5a059]/40 hover:bg-navy-900'
                >
                  <div className='flex h-9 w-9 items-center justify-center border border-[#c5a059]/30 bg-navy-900 text-[#c5a059] transition-colors group-hover:bg-[#c5a059] group-hover:text-white'>
                    <Home className='w-4 h-4' />
                  </div>
                  Home
                </Link>
                <Link
                  onClick={() => setIsMenuOpen(false)}
                  href='/shop/collections'
                  className='group flex items-center gap-3.5 border border-transparent px-3 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white transition-all hover:border-[#c5a059]/40 hover:bg-navy-900'
                >
                  <div className='flex h-9 w-9 items-center justify-center border border-[#c5a059]/30 bg-navy-900 text-[#c5a059] transition-colors group-hover:bg-[#c5a059] group-hover:text-white'>
                    <Store className='w-4 h-4' />
                  </div>
                  All Sarees
                </Link>
                <Link
                  onClick={() => setIsMenuOpen(false)}
                  href='/shop?sort=-createdAt'
                  className='group flex items-center gap-3.5 border border-transparent px-3 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white transition-all hover:border-[#c5a059]/40 hover:bg-navy-900'
                >
                  <div className='flex h-9 w-9 items-center justify-center border border-[#c5a059]/30 bg-navy-900 text-[#c5a059] transition-colors group-hover:bg-[#c5a059] group-hover:text-white'>
                    <Package className='w-4 h-4' />
                  </div>
                  New Arrivals
                </Link>
                <Link
                  onClick={() => setIsMenuOpen(false)}
                  href='/gifting'
                  className='group flex items-center gap-3.5 border border-transparent px-3 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white transition-all hover:border-[#c5a059]/40 hover:bg-navy-900'
                >
                  <div className='flex h-9 w-9 items-center justify-center border border-[#c5a059]/30 bg-navy-900 text-[#c5a059] transition-colors group-hover:bg-[#c5a059] group-hover:text-white'>
                    <Gift className='w-4 h-4' />
                  </div>
                  Bespoke Gifting
                </Link>
                <Link
                  onClick={() => setIsMenuOpen(false)}
                  href='/blog'
                  className={cn(
                    "group flex items-center gap-3.5 border px-3 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white transition-all hover:bg-navy-900",
                    pathname.startsWith("/blog") ?
                      "border-[#c5a059]/50 bg-navy-900"
                    : "border-transparent hover:border-[#c5a059]/40",
                  )}
                >
                  <div className='flex h-9 w-9 items-center justify-center border border-[#c5a059]/30 bg-navy-900 text-[#c5a059] transition-colors group-hover:bg-[#c5a059] group-hover:text-white'>
                    <LayoutDashboard className='w-4 h-4' />
                  </div>
                  The Rani Blog
                </Link>
                <Link
                  onClick={() => setIsMenuOpen(false)}
                  href='/about'
                  className='group flex items-center gap-3.5 border border-transparent px-3 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white transition-all hover:border-[#c5a059]/40 hover:bg-navy-900'
                >
                  <div className='flex h-9 w-9 items-center justify-center border border-[#c5a059]/30 bg-navy-900 text-[#c5a059] transition-colors group-hover:bg-[#c5a059] group-hover:text-white'>
                    <Shield className='w-4 h-4' />
                  </div>
                  About
                </Link>
                <Link
                  onClick={() => setIsMenuOpen(false)}
                  href='/faq'
                  className='group flex items-center gap-3.5 border border-transparent px-3 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white transition-all hover:border-[#c5a059]/40 hover:bg-navy-900'
                >
                  <div className='flex h-9 w-9 items-center justify-center border border-[#c5a059]/30 bg-navy-900 text-[#c5a059] transition-colors group-hover:bg-[#c5a059] group-hover:text-white'>
                    <Shield className='w-4 h-4' />
                  </div>
                  FAQ
                </Link>
              </div>

              {/* Categories */}
              {navCategories.length > 0 && (
                <MobileMegaMenu
                  categories={navCategories}
                  onClose={() => setIsMenuOpen(false)}
                />
              )}

              {/* Account Section */}
              <div className='pb-6'>
                <p className='mb-3 px-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c5a059]'>
                  Your Account
                </p>
                {isAuthedStable ?
                  <div className='space-y-0.5 border border-navy-800 bg-navy-900/50 p-1'>
                    <Link
                      onClick={() => setIsMenuOpen(false)}
                      href='/dashboard'
                      className='flex items-center gap-3 border-l-2 border-transparent px-3 py-3 text-[11px] font-medium uppercase tracking-[0.12em] text-white/80 transition-colors hover:border-[#c5a059] hover:bg-navy-900 hover:text-[#c5a059]'
                    >
                      <User className='w-4 h-4 shrink-0 text-[#c5a059]/70' />{" "}
                      Dashboard
                    </Link>
                    <Link
                      onClick={() => setIsMenuOpen(false)}
                      href='/dashboard/orders'
                      className='flex items-center gap-3 border-l-2 border-transparent px-3 py-3 text-[11px] font-medium uppercase tracking-[0.12em] text-white/80 transition-colors hover:border-[#c5a059] hover:bg-navy-900 hover:text-[#c5a059]'
                    >
                      <Package className='w-4 h-4 shrink-0 text-[#c5a059]/70' />{" "}
                      My Orders
                    </Link>
                    <Link
                      onClick={() => setIsMenuOpen(false)}
                      href='/cart'
                      className='flex items-center gap-3 border-l-2 border-transparent px-3 py-3 text-[11px] font-medium uppercase tracking-[0.12em] text-white/80 transition-colors hover:border-[#c5a059] hover:bg-navy-900 hover:text-[#c5a059]'
                    >
                      <ShoppingBag className='w-4 h-4 shrink-0 text-[#c5a059]/70' />{" "}
                      Cart
                    </Link>
                    <Link
                      onClick={() => setIsMenuOpen(false)}
                      href='/dashboard/gifting'
                      className='flex items-center gap-3 border-l-2 border-transparent px-3 py-3 text-[11px] font-medium uppercase tracking-[0.12em] text-white/80 transition-colors hover:border-[#c5a059] hover:bg-navy-900 hover:text-[#c5a059]'
                    >
                      <Gift className='w-4 h-4 shrink-0 text-[#c5a059]/70' />{" "}
                      Custom Gifting
                    </Link>

                    {user?.role === "admin" && (
                      <Link
                        onClick={() => setIsMenuOpen(false)}
                        href='/admin'
                        className='flex items-center gap-3 border-l-2 border-transparent px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#c5a059] transition-colors hover:border-[#c5a059] hover:bg-navy-900'
                      >
                        <Shield className='w-4 h-4 shrink-0' /> Admin Panel
                      </Link>
                    )}
                    <Link
                      onClick={() => setIsMenuOpen(false)}
                      href='/wishlist'
                      className='flex items-center justify-between border-l-2 border-transparent px-3 py-3 text-[11px] font-medium uppercase tracking-[0.12em] text-white/80 transition-colors hover:border-[#c5a059] hover:bg-navy-900 hover:text-[#c5a059]'
                    >
                      <span className='flex items-center gap-3'>
                        <Heart className='w-4 h-4 shrink-0 text-[#c5a059]/70' />{" "}
                        Wishlist
                      </span>
                      {wishlistProducts.length > 0 && (
                        <span className='bg-[#c5a059]/15 px-2 py-0.5 text-[10px] font-bold text-[#c5a059]'>
                          {wishlistProducts.length}
                        </span>
                      )}
                    </Link>
                    <button
                      type='button'
                      onClick={handleLogout}
                      className='flex w-full items-center gap-3 border-l-2 border-transparent px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[#c5a059] transition-colors hover:border-[#c5a059] hover:bg-navy-900'
                    >
                      <LogOut className='w-4 h-4 shrink-0' /> Sign Out
                    </button>
                  </div>
                : <div className='mt-2 flex gap-2.5'>
                    <button
                      type='button'
                      onClick={() => {
                        setIsMenuOpen(false);
                        openAuth("login");
                      }}
                      className='flex-1 border border-navy-700 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:border-[#c5a059]/50 hover:text-[#c5a059]'
                    >
                      Sign In
                    </button>
                    <button
                      type='button'
                      onClick={() => {
                        setIsMenuOpen(false);
                        openAuth("signup");
                      }}
                      className='flex-1 bg-[#c5a059] py-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#b8924d]'
                    >
                      Create Account
                    </button>
                  </div>
                }
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Mobile bottom navigation — solid bg (no backdrop-blur / alpha bg: avoids “white bar” + invisible white icons on iOS/WebKit) */}
      {showMobileBottomNav && (
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
      )}

      {/* Checkout Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className='fixed inset-0 z-[300] flex items-center justify-center bg-navy-900/40 p-4 backdrop-blur-sm'>
          <div className='w-full max-w-sm border border-gray-200 bg-white shadow-2xl'>
            <div className='border-b border-gray-100 p-5 text-center'>
              <div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#fff8eb] text-[#c5a059]'>
                <AlertTriangle className='h-6 w-6' />
              </div>
              <h3 className='font-serif text-xl font-medium text-navy-900'>
                Leave Checkout?
              </h3>
              <p className='mt-2 text-sm leading-relaxed text-gray-500'>
                Your progress will be saved, but you are almost done placing
                your order.
              </p>
            </div>
            <div className='flex flex-col gap-2 p-4'>
              <button
                type='button'
                onClick={() => setShowExitConfirm(false)}
                className='w-full bg-[#c5a059] py-3 text-[11px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#b8924d]'
              >
                Continue Checkout
              </button>
              <button
                type='button'
                onClick={() => {
                  setShowExitConfirm(false);
                  router.back();
                }}
                className='w-full border border-gray-200 bg-white py-3 text-[11px] font-bold uppercase tracking-widest text-gray-600 transition-colors hover:border-gray-300 hover:text-navy-900'
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
      <VoiceSearchOverlay />
    </>
  );
}
