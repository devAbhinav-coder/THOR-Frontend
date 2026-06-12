"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Gift,
  Heart,
  User,
  MapPin,
  Lock,
  HelpCircle,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", href: "/dashboard?view=overview", icon: LayoutDashboard },
  { label: "My Orders", href: "/dashboard/orders", icon: Package },
  { label: "Custom Gifts", href: "/dashboard/gifting", icon: Gift },
  { label: "Wishlist", href: "/wishlist", icon: Heart },
];

const accountItems = [
  { label: "Profile", href: "/dashboard/profile", icon: User },
  { label: "Addresses", href: "/dashboard/addresses", icon: MapPin },
  { label: "Security", href: "/dashboard/security", icon: Lock },
  { label: "FAQ", href: "/faq", icon: HelpCircle },
];

function NavLink({
  label,
  href,
  icon: Icon,
  active,
}: {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-4 py-3 pl-6 md:pl-8 text-sm transition-all duration-200 border-l-2",
        active ?
          "text-account-primary font-semibold border-account-secondary bg-account-secondary-container/10"
        : "text-account-on-surface-variant border-transparent hover:bg-account-secondary-container/10 hover:text-account-secondary",
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

export default function AccountSidebar({ isMobileMenu }: { isMobileMenu?: boolean }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const firstName = user?.name?.split(" ")[0] || "Guest";

  const isActive = (href: string) => {
    if (isMobileMenu && href === "/dashboard?view=overview") return false;
    const baseHref = href.split('?')[0];
    return pathname === baseHref || (baseHref !== "/dashboard" && pathname.startsWith(baseHref));
  };

  return (
    <aside className="w-full md:w-64 shrink-0 md:bg-account-surface-container-lowest md:border md:border-account-outline-variant/30 md:py-8">
      <div className="px-6 md:px-8 mb-6 md:mb-8">
        <h2 className="font-serif text-xl md:text-2xl text-account-primary leading-tight">
          My Account
        </h2>
        <p className="text-sm text-account-on-surface-variant mt-1">
          Welcome back, {firstName}
        </p>
      </div>

      <nav className="flex flex-col">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(item.href)} />
        ))}

        <div className="h-px bg-account-outline-variant/30 my-3 mx-6 md:mx-8" />

        {accountItems.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(item.href)} />
        ))}
      </nav>
    </aside>
  );
}
