'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  Users,
  Star,
  LogOut,
  ChevronRight,
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
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import AdminConcierge from '@/components/admin/AdminConcierge';
import NotificationBell from '@/components/layout/NotificationBell';
import BrowserNotificationPrompt from '@/components/layout/BrowserNotificationPrompt';

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
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      { label: 'Revenue', href: '/admin/revenue', icon: IndianRupee },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { label: 'Categories', href: '/admin/categories', icon: LayoutGrid },
      { label: 'Products', href: '/admin/products', icon: Package },
      { label: 'Gifting', href: '/admin/gifting', icon: Gift },
      { label: 'Storefront', href: '/admin/storefront', icon: Store },
    ],
  },
  {
    title: 'Sales',
    items: [
      { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
      { label: 'Returns', href: '/admin/returns', icon: RotateCcw },
      { label: 'Coupons', href: '/admin/coupons', icon: Tag },
    ],
  },
  {
    title: 'Marketing & content',
    items: [
      { label: 'Email campaigns', href: '/admin/emails', icon: Megaphone },
      { label: 'Blogs', href: '/admin/blogs', icon: FileText },
    ],
  },
  {
    title: 'Customers & trust',
    items: [
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Reviews', href: '/admin/reviews', icon: Star },
    ],
  },
  {
    title: 'System',
    items: [{ label: 'Security audit', href: '/admin/security/audit', icon: Shield }],
  },
];

function navLinkActive(pathname: string, href: string) {
  const p = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  if (href === '/admin') return p === '/admin';
  return p === href || p.startsWith(`${href}/`);
}

const mobileQuickLinks = [
  { label: 'Dash', href: '/admin' },
  { label: 'Orders', href: '/admin/orders' },
  { label: 'Returns', href: '/admin/returns' },
  { label: 'Revenue', href: '/admin/revenue' },
  { label: 'Analytics', href: '/admin/analytics' },
  { label: 'Emails', href: '/admin/emails' },
  { label: 'Store', href: '/admin/storefront' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const mainScrollRef = useRef<HTMLElement>(null);
  useAuthHydrationFallback();

  useEffect(() => {
    const el = mainScrollRef.current;
    if (el) el.scrollTop = 0;
  }, [pathname]);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/');
    }
  }, [isAuthenticated, user, router, _hasHydrated]);

  if (!_hasHydrated) {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center">
        <div className="h-9 w-9 rounded-full border-2 border-rose-600 border-t-transparent animate-spin" aria-hidden />
        <span className="sr-only">Loading admin…</span>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') return null;

  return (
    <div className="flex flex-col h-dvh max-h-dvh bg-gray-50 overflow-hidden overscroll-none">
      <BrowserNotificationPrompt />
      {/* Mobile top bar */}
      <div className="lg:hidden shrink-0 z-40 bg-gray-900 text-white border-b border-gray-800 sticky top-0">
        <div className="h-14 px-3.5 flex items-center justify-between">
          <h1 className="font-serif text-sm font-bold">
            <span className="text-gold-400">✦</span> Rani Admin
          </h1>
          <div className="flex items-center gap-1">
            <div className="theme-dark text-white">
              <NotificationBell />
            </div>
            <button
              onClick={() => setIsMenuOpen((v) => !v)}
              className="h-9 w-9 rounded-lg bg-gray-800 flex items-center justify-center"
              aria-label="Toggle admin menu"
            >
              {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="px-3 pb-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-1.5 min-w-max">
            {mobileQuickLinks.map((item) => {
              const active = navLinkActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors",
                    active ? "bg-rose-700 text-white" : "bg-gray-800 text-gray-200"
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
            className="px-3 pb-3 border-t border-gray-800 max-h-[min(70vh,520px)] overflow-y-auto overscroll-y-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {navSections.map((section, sIdx) => (
              <div key={section.title} className={cn(sIdx > 0 && 'mt-3 pt-3 border-t border-gray-800/80')}>
                <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.items.map(({ label, href, icon: Icon }) => {
                    const active = navLinkActive(pathname, href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        prefetch
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-xl py-2.5 pl-3 pr-3 text-[13px] transition-colors',
                          active
                            ? 'bg-white/[0.08] text-white shadow-[inset_3px_0_0_0_#d4a853]'
                            : 'text-slate-300 hover:bg-white/[0.06] hover:text-white',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                            active
                              ? 'border-gold-500/35 bg-gold-500/10 text-gold-200'
                              : 'border-white/10 bg-gray-800/80 text-slate-400',
                          )}
                        >
                          <Icon className="h-4 w-4" strokeWidth={2} />
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
              className="flex items-center gap-2 text-xs text-red-300 hover:text-red-200 transition-colors w-full px-3 py-2"
            >
              <LogOut className="h-3 w-3" /> Sign Out
            </button>
          </nav>
        )}
      </div>

      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
      <aside
        data-lenis-prevent
        className="hidden lg:flex w-[272px] min-w-[272px] max-w-[272px] flex-shrink-0 flex-col border-r border-white/[0.06] bg-gradient-to-b from-slate-900 via-gray-900 to-slate-950 min-h-0 h-full shadow-[inset_-1px_0_0_rgba(255,255,255,0.03)]"
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-gray-900/40 px-5 py-4 backdrop-blur-sm">
          <div className="min-w-0">
            <h1 className="font-serif text-base font-bold tracking-tight text-white">
              <span className="text-gold-400">✦</span> Rani Admin
            </h1>
            <p className="mt-1 truncate text-[11px] text-slate-400">{user?.name}</p>
          </div>
          <div className="theme-dark shrink-0 text-white">
            <NotificationBell align="left" />
          </div>
        </div>

        <nav className="flex-1 min-h-0 space-y-5 overflow-y-auto overscroll-y-contain px-3 py-5 [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.35)_transparent] touch-pan-y">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map(({ label, href, icon: Icon }) => {
                  const active = navLinkActive(pathname, href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      prefetch
                      className={cn(
                        'group relative flex items-center gap-3 rounded-xl py-2.5 pl-3 pr-3 text-[13px] transition-colors',
                        active
                          ? 'bg-white/[0.08] text-white shadow-[inset_3px_0_0_0_#d4a853]'
                          : 'text-slate-400 hover:bg-white/[0.04] hover:text-white',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors',
                          active
                            ? 'border-gold-500/35 bg-gold-500/10 text-gold-200'
                            : 'border-transparent bg-white/[0.04] text-slate-400 group-hover:border-white/10 group-hover:text-slate-200',
                        )}
                      >
                        <Icon className="h-4 w-4" strokeWidth={2} />
                      </span>
                      <span className="leading-snug">{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-2 border-t border-white/[0.06] bg-gray-950/30 px-4 py-4">
          <Link
            href="/"
            prefetch
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gold-500/80" /> View storefront
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-rose-300/90 transition-colors hover:bg-rose-950/40 hover:text-rose-200"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" /> Sign out
          </button>
        </div>
      </aside>

      <main
        ref={mainScrollRef}
        data-lenis-prevent
        className="flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain touch-pan-y"
      >
        {children}
      </main>
      </div>
      <AdminConcierge />
    </div>
  );
}
