'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Package, Heart, MapPin, Lock, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { loginUrlWithRedirect } from '@/lib/safeRedirect';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Orders', href: '/dashboard/orders', icon: Package },
  { label: 'Wishlist', href: '/dashboard/wishlist', icon: Heart },
  { label: 'Profile', href: '/dashboard/profile', icon: User },
  { label: 'Addresses', href: '/dashboard/addresses', icon: MapPin },
  { label: 'Security', href: '/dashboard/security', icon: Lock },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isLoading && !isAuthenticated) {
      router.replace(loginUrlWithRedirect('/dashboard'));
    }
  }, [isAuthenticated, isLoading, router, _hasHydrated]);

  if (!_hasHydrated || isLoading || !isAuthenticated) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-[#faf9f7]">
        <div
          className="h-9 w-9 rounded-full border-2 border-brand-600 border-t-transparent animate-spin"
          aria-hidden
        />
        <span className="sr-only">Loading account…</span>
      </div>
    );
  }

  return (
    <div className="bg-[#faf9f7] min-h-screen">
      {/* Hero bar */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-brand-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30 flex-shrink-0">
            <span className="text-xl font-bold text-white">{user?.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="text-white/70 text-xs font-medium uppercase tracking-widest">Welcome back</p>
            <h1 className="text-xl sm:text-2xl font-serif font-bold leading-tight">{user?.name}</h1>
          </div>
        </div>

        {/* Mobile horizontal tabs */}
        <div className="sm:hidden overflow-x-auto scrollbar-hide">
          <div className="flex px-4 pb-0 gap-0 min-w-max">
            {navItems.map(({ label, href, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap',
                    active
                      ? 'border-white text-white'
                      : 'border-transparent text-white/60 hover:text-white/90'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden sm:block w-52 flex-shrink-0">
            <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-20">
              {navItems.map(({ label, href, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3.5 text-sm transition-all border-b border-gray-50 last:border-0',
                      active
                        ? 'bg-brand-50 text-brand-700 font-semibold border-l-[3px] border-l-brand-600 pl-[13px]'
                        : 'text-gray-600 hover:bg-gray-50/80 hover:text-gray-900'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', active ? 'text-brand-600' : 'text-gray-400')} />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
