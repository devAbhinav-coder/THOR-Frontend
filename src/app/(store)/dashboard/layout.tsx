"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  User,
  Package,
  Heart,
  MapPin,
  Lock,
  LayoutDashboard,
  Gift,
  HelpCircle,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { loginUrlWithRedirect } from "@/lib/safeRedirect";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Orders", href: "/dashboard/orders", icon: Package },
  { label: "Custom Gifts", href: "/dashboard/gifting", icon: Gift },
  { label: "Wishlist", href: "/dashboard/wishlist", icon: Heart },
  { label: "Profile", href: "/dashboard/profile", icon: User },
  { label: "Addresses", href: "/dashboard/addresses", icon: MapPin },
  { label: "Security", href: "/dashboard/security", icon: Lock },
  { label: "FAQ", href: "/faq", icon: HelpCircle },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isLoading && !isAuthenticated) {
      router.replace(loginUrlWithRedirect("/dashboard"));
    }
  }, [isAuthenticated, isLoading, router, _hasHydrated]);

  if (!_hasHydrated || isLoading || !isAuthenticated) {
    return (
      <div className='min-h-[50vh] flex items-center justify-center bg-[#faf9f7]'>
        <div
          className='h-9 w-9 rounded-full border-2 border-brand-600 border-t-transparent animate-spin'
          aria-hidden
        />
        <span className='sr-only'>Loading account…</span>
      </div>
    );
  }

  return (
    <div className='bg-[#faf9f7] min-h-screen'>
      {/* Hero bar - Only show on root dashboard overview */}
      {pathname === "/dashboard" && (
        <div className='bg-gradient-to-r from-navy-900 via-navy-800 to-brand-700 text-white relative'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex items-center gap-4'>
            {user?.avatar ? (
              <div className='relative h-12 w-12 sm:h-14 sm:w-14 rounded-full overflow-hidden ring-2 ring-white/30 shadow-xl flex-shrink-0 bg-white/10'>
                <Image
                  src={user.avatar}
                  alt={user?.name || "User"}
                  fill
                  sizes='56px'
                  className='object-cover'
                />
              </div>
            ) : (
              <div className='h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center ring-2 ring-white/20 shadow-xl flex-shrink-0'>
                <span className='text-xl sm:text-2xl font-black text-white'>
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className='text-white/70 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-0.5'>
                Welcome back
              </p>
              <h1 className='text-lg sm:text-2xl font-serif font-bold leading-tight truncate'>
                {user?.name}
              </h1>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Back Button Context Header */}
      {pathname !== "/dashboard" && (
        <div className='sm:hidden bg-white border-b border-gray-100 flex items-center px-4 py-3 sticky top-14 z-40'>
          <button
            type='button'
            onClick={() => router.push("/dashboard")}
            className='flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-navy-900 transition-colors'
          >
            <div className='h-7 w-7 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm'>
              <svg
                className='h-4 w-4'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
                strokeWidth={3}
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M15 19l-7-7 7-7'
                />
              </svg>
            </div>
            Back to Dashboard
          </button>
        </div>
      )}

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
        <div className='flex flex-col sm:flex-row gap-6'>
          {/* Desktop sidebar */}
          <aside className='hidden sm:block w-52 flex-shrink-0'>
            <nav className='bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-20'>
              {navItems.map(({ label, href, icon: Icon }) => {
                const active =
                  pathname === href ||
                  (href !== "/dashboard" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 text-sm transition-all border-b border-gray-50 last:border-0",
                      active ?
                        "bg-brand-50 text-brand-700 font-semibold border-l-[3px] border-l-brand-600 pl-[13px]"
                      : "text-gray-600 hover:bg-gray-50/80 hover:text-gray-900",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        active ? "text-brand-600" : "text-gray-400",
                      )}
                    />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <main className='flex-1 min-w-0'>{children}</main>
        </div>
      </div>
    </div>
  );
}
