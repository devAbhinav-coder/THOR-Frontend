"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  Users,
  Star,
  LogOut,
  BarChart3,
  Sparkles,
  LayoutGrid,
  Store,
  Menu,
  X,
  Megaphone,
  FileText,
  Mail,
  Gift,
  RotateCcw,
  Shield,
  IndianRupee,
  ExternalLink,
  BadgeCheck,
  HandIcon,
  Receipt,
  Warehouse,
  Percent,
  Quote,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/layout/NotificationBell";
import BrowserNotificationPrompt from "@/components/layout/BrowserNotificationPrompt";

/** If persist never calls onRehydrateStorage (edge case), unblock admin shell */
function useAuthHydrationFallback() {
  useEffect(() => {
    const t = window.setTimeout(() => {
      const s = useAuthStore.getState();
      if (!s._hasHydrated) useAuthStore.setState({ _hasHydrated: true });
    }, 2000);
    return () => clearTimeout(t);
  }, []);
}

type NavItem = { label: string; href: string; icon: LucideIcon };
type NavSection = { title: string; items: NavItem[] };

/** Grouped nav — easier scanning for owners (sell / grow / manage). */
const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Business Assistant", href: "/admin/ai", icon: Sparkles },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      { label: "Revenue", href: "/admin/revenue", icon: IndianRupee },
      { label: "Operating costs", href: "/admin/expenses", icon: Receipt },
    ],
  },
  {
    title: "Catalog",
    items: [
      { label: "Categories", href: "/admin/categories", icon: LayoutGrid },
      { label: "Subcategories", href: "/admin/subcategories", icon: LayoutGrid },
      { label: "Products", href: "/admin/products", icon: Package },
      { label: "Inventory", href: "/admin/inventory", icon: Warehouse },
      { label: "Gifting", href: "/admin/gifting", icon: Gift },
      { label: "Storefront", href: "/admin/storefront", icon: Store },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
      {
        label: "Offline order",
        href: "/admin/orders/offline",
        icon: HandIcon,
      },
      {
        label: "B2B tax invoices",
        href: "/admin/invoices",
        icon: Receipt,
      },
      { label: "Returns", href: "/admin/returns", icon: RotateCcw },
      { label: "Coupons", href: "/admin/coupons", icon: Tag },
      { label: "Sale", href: "/admin/sales", icon: Percent },
    ],
  },
  {
    title: "Marketing & content",
    items: [
      { label: "Customer stories", href: "/admin/testimonials", icon: Quote },
      { label: "Email campaigns", href: "/admin/emails", icon: Megaphone },
      { label: "Journal subscribers", href: "/admin/newsletter", icon: Mail },
      { label: "Blogs", href: "/admin/blogs", icon: FileText },
      { label: "Blog calendar", href: "/admin/blogs/calendar", icon: FileText },
    ],
  },
  {
    title: "Customers & trust",
    items: [
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Product reviews", href: "/admin/reviews", icon: Star },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Security audit", href: "/admin/security/audit", icon: Shield },
    ],
  },
];

function navLinkActive(pathname: string, href: string) {
  const p =
    pathname.endsWith("/") && pathname.length > 1 ?
      pathname.slice(0, -1)
    : pathname;
  if (href === "/admin") return p === "/admin";
  return p === href || p.startsWith(`${href}/`);
}

function AdminSidebarNavLink({
  sidebarCollapsed,
  pathname,
  label,
  href,
  icon: Icon,
}: {
  sidebarCollapsed: boolean;
  pathname: string;
  label: string;
  href: string;
  icon: LucideIcon;
}) {
  const active = navLinkActive(pathname, href);
  return (
    <Link
      href={href}
      prefetch
      title={sidebarCollapsed ? label : undefined}
      className={cn(
        "group relative h-10 rounded-xl text-[13px] transition-all duration-300 flex items-center px-1.5 overflow-hidden",
        active ?
          "bg-white shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] text-navy-900 border border-gray-100"
        : "text-slate-600 hover:bg-black/5 hover:text-navy-900",
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-[10px] border transition-all duration-200",
          "h-9 w-9 shrink-0",
          active ?
            "border-brand-200 bg-brand-50 text-brand-600 shadow-sm"
          : "border-transparent bg-transparent text-slate-500 group-hover:bg-black/5 group-hover:text-navy-900",
        )}
      >
        <Icon className='h-[15px] w-[15px]' strokeWidth={2.25} />
      </span>
      <span
        className={cn(
          'flex min-h-9 items-center truncate text-left text-[13px] font-semibold leading-none tracking-tight transition-all duration-300 ease-in-out whitespace-nowrap',
          sidebarCollapsed ? 'opacity-0 max-w-0 ml-0 pointer-events-none' : 'opacity-100 max-w-[200px] ml-2 flex-1 min-w-0'
        )}
      >
        {label}
      </span>
    </Link>
  );
}

function adminInitials(name: string | undefined) {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function AdminAvatar({
  name,
  avatarUrl,
  sizeClass,
}: {
  name: string | undefined;
  avatarUrl: string | undefined;
  /** e.g. h-12 w-12 — used for both ring container and image */
  sizeClass: string;
}) {
  const initials = adminInitials(name);
  const alt = name?.trim() ? `${name} — profile` : "Admin profile";
  const initialsTextClass =
    sizeClass.includes("h-9") ? "text-[10px]" : "text-sm";
  if (avatarUrl) {
    return (
      <div
        className={`relative ${sizeClass} shrink-0 overflow-hidden rounded-2xl bg-gray-100 ring-2 ring-brand-200 shadow-sm`}
      >
        <Image
          src={avatarUrl}
          alt={alt}
          fill
          sizes='96px'
          className='object-cover'
        />
      </div>
    );
  }
  return (
    <div
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 ${initialsTextClass} font-bold tracking-tight text-slate-600 ring-2 ring-brand-200 shadow-sm`}
      aria-label={alt}
    >
      {initials}
    </div>
  );
}

/** Customer-facing site (/) — not admin Storefront settings */
const SHOP_SITE_CTA = "Go to website";

const mobileQuickLinks = [
  { label: "Dash", href: "/admin" },
  { label: "AI", href: "/admin/ai" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Returns", href: "/admin/returns" },
  { label: "Revenue", href: "/admin/revenue" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Emails", href: "/admin/emails" },
  { label: "Store", href: "/admin/storefront" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, logout, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  /** Desktop sidebar: narrow by default; expands on hover. */
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const mainScrollRef = useRef<HTMLElement>(null);
  useAuthHydrationFallback();

  const sidebarExpanded = sidebarHovered;
  const sidebarCollapsed = !sidebarExpanded;

  useEffect(() => {
    const el = mainScrollRef.current;
    if (el) el.scrollTop = 0;
  }, [pathname]);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || user?.role !== "admin") {
      router.push("/");
    }
  }, [isAuthenticated, user, router, _hasHydrated]);

  if (!_hasHydrated) {
    return (
      <div className='min-h-dvh bg-[#FAF9F6] flex items-center justify-center'>
        <div
          className='h-9 w-9 rounded-full border-2 border-brand-600 border-t-transparent animate-spin'
          aria-hidden
        />
        <span className='sr-only'>Loading admin…</span>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") return null;

  return (
    <div className='flex flex-col h-dvh max-h-dvh bg-[#FAF9F6] overflow-hidden overscroll-none'>
      <BrowserNotificationPrompt />
      {/* Mobile top bar */}
      <div className='lg:hidden shrink-0 z-40 border-b border-gray-100 bg-[#FAF9F6] text-navy-900 shadow-sm sticky top-0'>
        <div className='h-[3.25rem] px-3 flex items-center justify-between gap-2'>
          <div className='flex min-w-0 flex-1 items-center gap-2'>
            <Link
              href='/admin'
              className='relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-white/[0.08] ring-1 ring-white/15'
              aria-label='Admin home'
            >
              <Image
                src='/logo.png'
                alt=''
                width={32}
                height={32}
                className='h-full w-full object-contain p-0.5'
              />
            </Link>
            <AdminAvatar
              name={user?.name}
              avatarUrl={user?.avatar}
              sizeClass='h-9 w-9'
            />
            <div className='min-w-0'>
              <h1 className='font-serif text-sm font-bold leading-tight tracking-tight text-navy-900'>
                <span className='text-brand-600'>✦</span> Rani Admin
              </h1>
              <p className='truncate text-[10px] text-slate-500'>
                {user?.name}
              </p>
            </div>
          </div>
          <div className='flex shrink-0 items-center gap-2'>
            <Link
              href='/'
              prefetch
              className='flex h-9 w-9 items-center justify-center rounded-xl bg-white text-gray-700 ring-1 ring-gray-200 transition hover:bg-gray-50'
              aria-label={SHOP_SITE_CTA}
              title={SHOP_SITE_CTA}
            >
              <Store className='h-4 w-4' strokeWidth={2.25} />
            </Link>
            <NotificationBell variant="admin-mobile" />
            <button
              onClick={() => setIsMenuOpen(true)}
              className='flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 text-white shadow-sm ring-1 ring-navy-800 transition hover:bg-navy-800'
              aria-label='Toggle admin menu'
            >
              <Menu className='h-4 w-4' />
            </button>
          </div>
        </div>

      </div>
      
      {/* Slide-in Mobile Menu */}
      <div 
        className={cn(
            "fixed inset-0 z-[100] transition-all duration-300 lg:hidden", 
            isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-navy-900/40 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Drawer */}
          <div 
            className={cn(
              "absolute top-0 right-0 bottom-0 w-[280px] bg-[#FAF9F6] shadow-2xl flex flex-col transition-transform duration-300 ease-out",
              isMenuOpen ? "translate-x-0" : "translate-x-full"
            )}
          >
            {/* Header */}
            <div className='flex items-center justify-between p-4 border-b border-gray-100 bg-white'>
              <span className='font-serif text-sm font-bold text-navy-900'>Menu</span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className='flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition hover:bg-gray-200'
              >
                <X className='h-4 w-4' />
              </button>
            </div>

            {/* Nav Content */}
            <nav
              data-lenis-prevent
              className='flex-1 overflow-y-auto overscroll-contain px-3 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden touch-pan-y'
            >
              <Link
                href='/'
                prefetch
                onClick={() => setIsMenuOpen(false)}
                className='mb-4 flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 py-2.5 text-sm font-bold text-brand-700 shadow-sm transition-all hover:bg-brand-100 active:scale-95'
              >
                <Store
                  className='h-4 w-4 shrink-0 text-brand-600'
                  strokeWidth={2.25}
                />
                {SHOP_SITE_CTA}
                <ExternalLink
                  className='h-3.5 w-3.5 shrink-0 text-brand-400'
                  strokeWidth={2.25}
                />
              </Link>
              {navSections.map((section, sIdx) => (
                <div
                  key={section.title}
                  className={cn(
                    sIdx > 0 && "mt-3 pt-3 border-t border-gray-200/60",
                  )}
                >
                  <p className='px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400'>
                    {section.title}
                  </p>
                  <div className='space-y-1'>
                    {section.items.map(({ label, href, icon: Icon }) => {
                      const active = navLinkActive(pathname, href);
                      return (
                        <Link
                          key={href}
                          href={href}
                          prefetch
                          onClick={() => setIsMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl py-2.5 pl-3 pr-3 text-[13px] transition-colors",
                            active ?
                              "bg-white text-navy-900 shadow-sm border border-gray-100"
                            : "text-slate-600 hover:bg-black/5",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                              active ?
                                "border-brand-200 bg-brand-50 text-brand-600"
                              : "border-gray-100 bg-gray-50 text-slate-500",
                            )}
                          >
                            <Icon className='h-4 w-4' strokeWidth={2.25} />
                          </span>
                          <span className='font-semibold'>{label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
            
            {/* Footer */}
            <div className='p-3 border-t border-gray-100 bg-white'>
              <button
                onClick={logout}
                className='flex w-full items-center gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-100'
              >
                <LogOut className='h-4 w-4 shrink-0' /> Sign out
              </button>
            </div>
          </div>
        </div>

      <div className='flex flex-1 min-h-0 w-full overflow-hidden'>
        <aside
          data-lenis-prevent
          onMouseEnter={() => setSidebarHovered(true)}
          onMouseLeave={() => setSidebarHovered(false)}
          className={cn(
            "relative z-20 hidden min-h-0 h-full flex-shrink-0 flex-col overflow-hidden border-r border-white/[0.07] bg-[#FAF9F6] transition-[width,min-width,max-width] duration-300 ease-in-out lg:flex",
            sidebarCollapsed ?
              "w-[76px] min-w-[76px] max-w-[76px]"
            : "w-[272px] min-w-[272px] max-w-[272px]",
          )}
        >
          {/* Ambient depth — soft gold / rose glow */}
          <div
            className='pointer-events-none absolute -right-20 -top-28 h-56 w-56 rounded-full bg-brand-400/[0.12] blur-3xl'
            aria-hidden
          />
          <div
            className='pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-rose-500/[0.08] blur-3xl'
            aria-hidden
          />
          <div
            className='pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-brand-500/[0.04] to-transparent'
            aria-hidden
          />
          <div
            className='pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-brand-500/10 to-transparent'
            aria-hidden
          />

          <div className='relative z-[1] border-b border-white/[0.06] px-2 pb-2 pt-2'>
            {/*
            Same profile strip height collapsed vs expanded → no vertical jump on hover.
            Tighter padding + items-center on expanded: avatar lines up with name block without a big empty band.
          */}
            <div className='rounded-xl bg-white/[0.04] p-2 ring-1 ring-white/[0.08] backdrop-blur-sm'>
              <div className='flex min-h-[3.75rem] items-center gap-2.5'>
                <div className='relative shrink-0 self-center'>
                  <AdminAvatar
                    name={user?.name}
                    avatarUrl={user?.avatar}
                    sizeClass='h-10 w-10'
                  />
                  <div className="absolute -top-1.5 -right-1.5 pointer-events-auto">
                    <NotificationBell variant="admin-sidebar" align="right" />
                  </div>
                </div>
                <div className={cn(
                  'space-y-0.5 transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap',
                  sidebarCollapsed ? 'opacity-0 max-w-0 pointer-events-none' : 'opacity-100 max-w-[150px] flex-1'
                )}>
                  <div className='flex min-h-0 items-center gap-1'>
                    <p className='min-w-0 truncate text-sm font-bold leading-tight tracking-tight text-navy-900'>
                      {user?.name}
                    </p>
                    <BadgeCheck
                      className='h-3.5 w-3.5 shrink-0 text-blue-400'
                      strokeWidth={2.25}
                      aria-label='Admin account'
                    />
                  </div>
                  <p className='truncate text-[10px] leading-snug text-slate-500'>
                    {user?.email}
                  </p>
                </div>
              </div>

              <Link
                href='/'
                prefetch
                title={SHOP_SITE_CTA}
                className={cn(
                  "mt-1.5 flex h-9 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-sm font-bold text-brand-700 shadow-sm transition-all hover:bg-brand-100 active:scale-95 overflow-hidden duration-300",
                  sidebarCollapsed ? "mx-auto w-9 p-0" : "w-full min-w-0 px-2.5",
                )}
              >
                <Store
                  className='h-3.5 w-3.5 shrink-0 text-brand-600'
                  strokeWidth={2.25}
                />
                <span
                  className={cn(
                    'flex items-center text-[11px] font-bold tracking-widest text-navy-900/60 uppercase transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden',
                    sidebarCollapsed ? 'opacity-0 max-w-0 ml-0 pointer-events-none' : 'opacity-100 max-w-[150px] ml-2'
                  )}
                >
                  {SHOP_SITE_CTA}
                </span>
                <ExternalLink
                  className={cn(
                    'h-3 w-3 shrink-0 text-brand-400 transition-all duration-300',
                    sidebarCollapsed ? 'opacity-0 max-w-0 ml-0' : 'opacity-100 max-w-[12px] ml-1.5'
                  )}
                  strokeWidth={2.25}
                />
              </Link>
            </div>
          </div>

          <nav
            className="relative z-[1] flex-1 min-h-0 overflow-y-auto overscroll-y-contain py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden touch-pan-y px-2 space-y-2 transition-all duration-300"
          >
            {navSections.map((section, sIdx) => (
                <div key={section.title} className={cn(sIdx > 0 && "pt-0.5", "flex flex-col")}>
                  {/* Section Title - Fade and Collapse */}
                  <div className={cn(
                    'flex items-center px-2 transition-all duration-300 ease-in-out overflow-hidden',
                    sidebarCollapsed ? 'opacity-0 max-h-0 mb-0' : 'opacity-100 max-h-[20px] mb-1.5'
                  )}>
                    <span
                      className='h-4 w-0.5 shrink-0 rounded-full bg-gradient-to-b from-amber-400/90 to-gold-600/50'
                      aria-hidden
                    />
                    <span className='min-w-0 shrink text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 ml-2 whitespace-nowrap'>
                      {section.title}
                    </span>
                    <span className='h-px min-w-[0.75rem] flex-1 bg-gradient-to-r from-white/12 to-transparent ml-2' />
                  </div>
                  
                  <div className='flex flex-col gap-0.5 pl-1'>
                    {section.items.map((item) => (
                      <AdminSidebarNavLink
                        key={item.href}
                        sidebarCollapsed={sidebarCollapsed}
                        pathname={pathname}
                        label={item.label}
                        href={item.href}
                        icon={item.icon}
                      />
                    ))}
                  </div>
                </div>
              ))
            }
          </nav>

          <div className='relative z-[1] border-t border-gray-100 bg-white/40 px-2 py-2.5'>
            <button
              type='button'
              onClick={logout}
              title={sidebarCollapsed ? 'Sign out' : undefined}
              className="rounded-xl border border-gray-100 bg-white font-medium text-slate-600 transition-all duration-300 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 shadow-sm active:scale-95 flex h-10 w-full items-center px-1.5 text-left text-xs leading-none overflow-hidden"
            >
              <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-transparent text-slate-400'>
                <LogOut className='h-4 w-4' aria-hidden />
              </span>
              <span className={cn(
                'flex min-h-9 items-center truncate font-bold transition-all duration-300 ease-in-out whitespace-nowrap',
                sidebarCollapsed ? 'opacity-0 max-w-0 ml-0 pointer-events-none' : 'opacity-100 max-w-[200px] ml-2 flex-1 min-w-0'
              )}>
                Sign out
              </span>
            </button>
          </div>
        </aside>

        <main
          ref={mainScrollRef}
          data-lenis-prevent
          className='relative z-10 flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y'
        >
          {children}
        </main>
      </div>
    </div>
  );
}
