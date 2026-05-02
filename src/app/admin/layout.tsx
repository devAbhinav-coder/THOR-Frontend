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
  LayoutGrid,
  Store,
  Menu,
  X,
  Megaphone,
  FileText,
  Gift,
  RotateCcw,
  Shield,
  IndianRupee,
  ExternalLink,
  BadgeCheck,
  HandIcon,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import AdminFloatingNotifications from "@/components/admin/AdminFloatingNotifications";
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
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      { label: "Revenue", href: "/admin/revenue", icon: IndianRupee },
    ],
  },
  {
    title: "Catalog",
    items: [
      { label: "Categories", href: "/admin/categories", icon: LayoutGrid },
      { label: "Products", href: "/admin/products", icon: Package },
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
      { label: "Returns", href: "/admin/returns", icon: RotateCcw },
      { label: "Coupons", href: "/admin/coupons", icon: Tag },
    ],
  },
  {
    title: "Marketing & content",
    items: [
      { label: "Email campaigns", href: "/admin/emails", icon: Megaphone },
      { label: "Blogs", href: "/admin/blogs", icon: FileText },
    ],
  },
  {
    title: "Customers & trust",
    items: [
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Reviews", href: "/admin/reviews", icon: Star },
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

/** Shared desktop sidebar row — collapsed rail uses one even stack (no section gaps). */
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
        "group relative h-10 rounded-xl text-[13px] transition-[color,background-color,padding] duration-300",
        sidebarCollapsed ?
          "flex w-full items-center justify-center px-1.5"
        : "flex w-full items-center gap-2 px-1.5",
        !sidebarCollapsed &&
          (active ?
            "bg-gradient-to-r from-white/[0.09] to-white/[0.02] text-white shadow-[inset_3px_0_0_0_#c9a227,0_0_24px_-12px_rgba(212,168,83,0.15)]"
          : "text-slate-300 hover:bg-white/[0.06] hover:text-white"),
        sidebarCollapsed &&
          (active ?
            "bg-white/[0.12] text-white shadow-[0_0_20px_-8px_rgba(212,168,83,0.35)]"
          : "text-slate-300 hover:bg-white/[0.08] hover:text-white"),
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-[10px] border transition-colors duration-200",
          "h-9 w-9 shrink-0",
          active ?
            "border-gold-400/40 bg-gold-500/15 text-gold-100 shadow-[0_0_16px_-4px_rgba(212,168,83,0.35)]"
          : "border-white/[0.08] bg-white/[0.04] text-slate-300 group-hover:border-white/15 group-hover:bg-white/[0.08] group-hover:text-white",
        )}
      >
        <Icon className='h-[15px] w-[15px]' strokeWidth={2} />
      </span>
      {!sidebarCollapsed && (
        <span className='flex min-h-9 min-w-0 flex-1 items-center truncate text-left text-[13px] leading-none tracking-tight'>
          {label}
        </span>
      )}
      {sidebarCollapsed && <span className='sr-only'>{label}</span>}
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
        className={`relative ${sizeClass} shrink-0 overflow-hidden rounded-2xl bg-slate-800 ring-2 ring-gold-500/35 shadow-lg`}
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
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 ${initialsTextClass} font-bold tracking-tight text-gold-200 ring-2 ring-gold-500/30 shadow-lg`}
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
      <div className='min-h-dvh bg-gray-50 flex items-center justify-center'>
        <div
          className='h-9 w-9 rounded-full border-2 border-rose-600 border-t-transparent animate-spin'
          aria-hidden
        />
        <span className='sr-only'>Loading admin…</span>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") return null;

  return (
    <div className='flex flex-col h-dvh max-h-dvh bg-gray-50 overflow-hidden overscroll-none'>
      <BrowserNotificationPrompt />
      {/* Mobile top bar */}
      <div className='lg:hidden shrink-0 z-40 border-b border-white/[0.08] bg-[#0c0f14] text-white shadow-[0_8px_32px_-12px_rgba(0,0,0,0.55)] sticky top-0'>
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
              <h1 className='font-serif text-sm font-bold leading-tight tracking-tight text-white'>
                <span className='text-gold-400'>✦</span> Rani Admin
              </h1>
              <p className='truncate text-[10px] text-slate-300'>
                {user?.name}
              </p>
            </div>
          </div>
          <div className='flex shrink-0 items-center gap-1'>
            <Link
              href='/'
              prefetch
              className='flex h-9 w-9 items-center justify-center rounded-lg bg-gold-500/15 text-gold-100 ring-1 ring-gold-500/35 transition hover:bg-gold-500/25 hover:text-white'
              aria-label={SHOP_SITE_CTA}
              title={SHOP_SITE_CTA}
            >
              <Store className='h-4 w-4' strokeWidth={2} />
            </Link>
            <div className='theme-dark text-white'>
              <NotificationBell />
            </div>
            <button
              onClick={() => setIsMenuOpen((v) => !v)}
              className='flex h-9 w-9 items-center justify-center rounded-lg bg-gray-800/90 ring-1 ring-white/10'
              aria-label='Toggle admin menu'
            >
              {isMenuOpen ?
                <X className='h-4 w-4' />
              : <Menu className='h-4 w-4' />}
            </button>
          </div>
        </div>
        <div className='px-3 pb-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
          <div className='flex items-center gap-1.5 min-w-max'>
            {mobileQuickLinks.map((item) => {
              const active = navLinkActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all",
                    active ?
                      "bg-gradient-to-r from-amber-600/95 to-gold-700/90 text-white shadow-[0_0_14px_-4px_rgba(212,168,83,0.45)]"
                    : "bg-white/[0.06] text-slate-300 ring-1 ring-white/[0.06] hover:bg-white/[0.1] hover:text-white",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
        {isMenuOpen && (
          <nav
            data-lenis-prevent
            className='px-3 pb-3 border-t border-gray-800 max-h-[min(70vh,520px)] overflow-y-auto overscroll-y-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          >
            <Link
              href='/'
              prefetch
              onClick={() => setIsMenuOpen(false)}
              className='mb-3 flex items-center justify-center gap-2 rounded-xl border border-gold-400/35 bg-gradient-to-r from-gold-500/20 to-amber-600/15 py-2.5 text-sm font-semibold text-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.4)] transition hover:border-gold-300/45 hover:from-gold-500/30 hover:to-amber-600/25'
            >
              <Store
                className='h-4 w-4 shrink-0 text-amber-100'
                strokeWidth={2}
              />
              {SHOP_SITE_CTA}
              <ExternalLink
                className='h-3.5 w-3.5 shrink-0 text-amber-100/90'
                strokeWidth={2}
              />
            </Link>
            {navSections.map((section, sIdx) => (
              <div
                key={section.title}
                className={cn(
                  sIdx > 0 && "mt-3 pt-3 border-t border-gray-800/80",
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
                            "bg-white/[0.08] text-white shadow-[inset_3px_0_0_0_#d4a853]"
                          : "text-slate-200 hover:bg-white/[0.06] hover:text-white",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                            active ?
                              "border-gold-500/35 bg-gold-500/10 text-gold-100"
                            : "border-white/10 bg-gray-800/90 text-slate-300",
                          )}
                        >
                          <Icon className='h-4 w-4' strokeWidth={2} />
                        </span>
                        {label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
            <button
              onClick={logout}
              className='flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium text-rose-200/95 transition hover:bg-rose-950/50 hover:text-rose-50'
            >
              <LogOut className='h-3.5 w-3.5 shrink-0' /> Sign out
            </button>
          </nav>
        )}
      </div>

      <div className='flex flex-1 min-h-0 w-full overflow-hidden'>
        <aside
          data-lenis-prevent
          onMouseEnter={() => setSidebarHovered(true)}
          onMouseLeave={() => setSidebarHovered(false)}
          className={cn(
            "relative z-20 hidden min-h-0 h-full flex-shrink-0 flex-col overflow-hidden border-r border-white/[0.07] bg-[#0c0f14] transition-[width,min-width,max-width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:flex",
            sidebarCollapsed ?
              "w-[76px] min-w-[76px] max-w-[76px]"
            : "w-[272px] min-w-[272px] max-w-[272px]",
          )}
        >
          {/* Ambient depth — soft gold / rose glow */}
          <div
            className='pointer-events-none absolute -right-20 -top-28 h-56 w-56 rounded-full bg-amber-400/[0.09] blur-3xl'
            aria-hidden
          />
          <div
            className='pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-rose-500/[0.06] blur-3xl'
            aria-hidden
          />
          <div
            className='pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#d4a853]/[0.06] to-transparent'
            aria-hidden
          />
          <div
            className='pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-gold-500/15 to-transparent'
            aria-hidden
          />

          <div className='relative z-[1] border-b border-white/[0.06] px-2 pb-2 pt-2'>
            {/*
            Same profile strip height collapsed vs expanded → no vertical jump on hover.
            Tighter padding + items-center on expanded: avatar lines up with name block without a big empty band.
          */}
            <div className='rounded-xl bg-white/[0.04] p-2 ring-1 ring-white/[0.08] backdrop-blur-sm'>
              {sidebarCollapsed ?
                <div className='flex min-h-[3.75rem] items-center justify-center'>
                  <AdminAvatar
                    name={user?.name}
                    avatarUrl={user?.avatar}
                    sizeClass='h-10 w-10'
                  />
                </div>
              : <div className='flex min-h-[3.75rem] items-center gap-2.5'>
                  <div className='shrink-0 self-center'>
                    <AdminAvatar
                      name={user?.name}
                      avatarUrl={user?.avatar}
                      sizeClass='h-10 w-10'
                    />
                  </div>
                  <div className='min-w-0 flex-1 space-y-0.5'>
                    <div className='flex min-h-0 items-center gap-1'>
                      <p className='min-w-0 truncate text-sm font-semibold leading-tight tracking-tight text-white'>
                        {user?.name}
                      </p>
                      <BadgeCheck
                        className='h-3.5 w-3.5 shrink-0 text-blue-400'
                        strokeWidth={2.25}
                        aria-label='Admin account'
                      />
                    </div>
                    <p className='truncate text-[10px] leading-snug text-slate-400'>
                      {user?.email}
                    </p>
                  </div>
                </div>
              }

              <Link
                href='/'
                prefetch
                title={SHOP_SITE_CTA}
                className={cn(
                  "mt-1.5 flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-amber-400/30 bg-gradient-to-r from-amber-600/30 via-gold-600/20 to-amber-700/25 text-sm font-semibold text-white shadow-sm transition-colors hover:border-amber-300/45 hover:from-amber-500/40 hover:via-gold-500/30",
                  sidebarCollapsed ? "mx-auto w-9 p-0" : (
                    "w-full min-w-0 px-2.5"
                  ),
                )}
              >
                <Store
                  className='h-3.5 w-3.5 shrink-0 text-amber-50'
                  strokeWidth={2}
                />
                {!sidebarCollapsed && (
                  <>
                    <span className='min-w-0 flex-1 truncate text-left'>
                      {SHOP_SITE_CTA}
                    </span>
                    <ExternalLink
                      className='h-3 w-3 shrink-0 text-amber-100/90'
                      strokeWidth={2}
                    />
                  </>
                )}
                {sidebarCollapsed && (
                  <span className='sr-only'>{SHOP_SITE_CTA}</span>
                )}
              </Link>
            </div>
          </div>

          <nav
            className={cn(
              "relative z-[1] flex-1 min-h-0 overflow-y-auto overscroll-y-contain py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden touch-pan-y px-2",
              !sidebarCollapsed && "space-y-4",
            )}
          >
            {sidebarCollapsed ?
              <div className='flex flex-col gap-1'>
                {navSections.flatMap((section) =>
                  section.items.map((item) => (
                    <AdminSidebarNavLink
                      key={item.href}
                      sidebarCollapsed
                      pathname={pathname}
                      label={item.label}
                      href={item.href}
                      icon={item.icon}
                    />
                  )),
                )}
              </div>
            : navSections.map((section, sIdx) => (
                <div key={section.title} className={cn(sIdx > 0 && "pt-0.5")}>
                  <div className='mb-1.5 flex items-center gap-2 pl-2 pr-1'>
                    <span
                      className='h-4 w-0.5 shrink-0 rounded-full bg-gradient-to-b from-amber-400/90 to-gold-600/50'
                      aria-hidden
                    />
                    <span className='min-w-0 shrink text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500'>
                      {section.title}
                    </span>
                    <span className='h-px min-w-[0.75rem] flex-1 bg-gradient-to-r from-white/12 to-transparent' />
                  </div>
                  <div className='flex flex-col gap-0.5 pl-1'>
                    {section.items.map((item) => (
                      <AdminSidebarNavLink
                        key={item.href}
                        sidebarCollapsed={false}
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

          <div className='relative z-[1] border-t border-white/[0.06] bg-gradient-to-t from-black/25 to-transparent px-2 py-2.5'>
            <button
              type='button'
              onClick={logout}
              title='Sign out'
              className={cn(
                "rounded-xl border border-white/[0.1] bg-white/[0.04] font-medium text-slate-200 transition hover:border-rose-500/30 hover:bg-rose-950/40 hover:text-rose-100",
                sidebarCollapsed ?
                  "mx-auto flex h-10 w-10 items-center justify-center p-0"
                : "flex h-10 w-full items-center gap-2 px-1.5 text-left text-xs leading-none",
              )}
            >
              {sidebarCollapsed ?
                <>
                  <LogOut className='h-4 w-4 shrink-0 opacity-90' aria-hidden />
                  <span className='sr-only'>Sign out</span>
                </>
              : <>
                  <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-transparent text-slate-300'>
                    <LogOut className='h-4 w-4 opacity-90' aria-hidden />
                  </span>
                  <span className='flex min-h-9 min-w-0 flex-1 items-center truncate'>
                    Sign out
                  </span>
                </>
              }
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
      <AdminFloatingNotifications />
    </div>
  );
}
