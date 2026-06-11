"use client";

import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Heart,
  LogOut,
  MapPin,
  Package,
  Shield,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  navDropdownAccent,
  navLuxuryDropdownFooter,
  navLuxuryDropdownHeader,
  navLuxuryDropdownItem,
  navLuxuryDropdownNav,
  navLuxuryDropdownPanelClass,
} from "@/lib/navbarStyles";

type MenuItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  isActive: (pathname: string) => boolean;
  adminOnly?: boolean;
};

const PROFILE_MENU_ITEMS: MenuItem[] = [
  {
    href: "/dashboard/profile",
    label: "Account Settings",
    Icon: User,
    isActive: (pathname) =>
      pathname.startsWith("/dashboard/profile") || pathname === "/dashboard",
  },
  {
    href: "/dashboard/orders",
    label: "My Orders",
    Icon: Package,
    isActive: (pathname) => pathname.startsWith("/dashboard/orders"),
  },
  {
    href: "/wishlist",
    label: "Wishlist Archive",
    Icon: Heart,
    isActive: (pathname) => pathname.startsWith("/wishlist"),
  },
  {
    href: "/dashboard/addresses",
    label: "Saved Addresses",
    Icon: MapPin,
    isActive: (pathname) => pathname.startsWith("/dashboard/addresses"),
  },
  {
    href: "/dashboard/security",
    label: "Account Security",
    Icon: Shield,
    isActive: (pathname) => pathname.startsWith("/dashboard/security"),
  },
  {
    href: "/admin",
    label: "Admin Panel",
    Icon: Shield,
    isActive: (pathname) => pathname.startsWith("/admin"),
    adminOnly: true,
  },
];

function profileFirstName(name?: string | null): string {
  const trimmed = String(name || "").trim();
  if (!trimmed) return "Member";
  return trimmed.split(/\s+/)[0];
}

type Props = {
  isOpen: boolean;
  pathname: string;
  user: {
    name?: string | null;
    email?: string | null;
    avatar?: string | null;
    role?: string;
  };
  onLogout: () => void;
  onNavigate: () => void;
};

export default function NavProfileDropdown({
  isOpen,
  pathname,
  user,
  onLogout,
  onNavigate,
}: Props) {
  const displayName = profileFirstName(user.name);
  const items = PROFILE_MENU_ITEMS.filter(
    (item) => !item.adminOnly || user.role === "admin",
  );

  return (
    <div className={navLuxuryDropdownPanelClass(isOpen, "17.5rem")}>
      <div className={navDropdownAccent} aria-hidden />

      <div className={cn(navLuxuryDropdownHeader, "pb-6 pt-6")}>
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-[#c5a059] bg-navy-800">
          {user.avatar ?
            <Image
              src={user.avatar}
              alt=""
              width={64}
              height={64}
              loading="lazy"
              unoptimized
              className="h-full w-full object-cover"
            />
          : <span
              className="font-serif text-xl font-medium text-[#c5a059]"
              aria-hidden
            >
              {displayName.charAt(0).toUpperCase()}
            </span>
          }
        </div>
        <p className="font-serif text-lg font-medium uppercase tracking-[0.06em] text-[#c5a059]">
          {displayName}
        </p>
        {user.email ?
          <p className="mt-1 truncate text-[10px] font-medium uppercase tracking-[0.14em] text-white/50">
            {user.email}
          </p>
        : null}
      </div>

      <nav className={navLuxuryDropdownNav} aria-label="Account menu">
        {items.map(({ href, label, Icon, isActive }) => {
          const active = isActive(pathname);
          return (
            <Link
              key={href}
              href={href}
              prefetch
              onClick={onNavigate}
              className={cn(
                navLuxuryDropdownItem(active),
                "flex items-center gap-3",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 stroke-[1.5]",
                  active ? "text-[#c5a059]" : "text-[#1a2b48]/70",
                )}
                aria-hidden
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className={navLuxuryDropdownFooter}>
        <button
          type="button"
          onClick={() => {
            onNavigate();
            onLogout();
          }}
          className="mx-auto flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-gray-500 transition-colors hover:text-[#1a2b48]"
        >
          <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
          Sign Out
        </button>
      </div>
    </div>
  );
}
