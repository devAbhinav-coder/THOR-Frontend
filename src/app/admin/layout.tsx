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
                <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {section.items.map(({ label, href, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      prefetch
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                        navLinkActive(pathname, href)
                          ? 'bg-rose-700 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0 opacity-90" />
                      {label}
                    </Link>
                  ))}
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
        className="hidden lg:flex w-[260px] min-w-[260px] max-w-[260px] bg-gray-900 flex-col flex-shrink-0 min-h-0 h-full"
      >
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-base font-bold text-white">
              <span className="text-gold-400">✦</span> Rani Admin
            </h1>
            <p className="text-gray-400 text-xs mt-0.5">{user?.name}</p>
          </div>
          <div className="theme-dark text-white">
            <NotificationBell align="left" />
          </div>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain py-4 px-3 space-y-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden touch-pan-y">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map(({ label, href, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    prefetch
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                      navLinkActive(pathname, href)
                        ? 'bg-rose-700 text-white shadow-sm'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0 opacity-90" />
                    <span className="leading-snug">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-2">
          <Link href="/" prefetch className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
            <ChevronRight className="h-3 w-3" /> View Storefront
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors w-full"
          >
            <LogOut className="h-3 w-3" /> Sign Out
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
