"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Store, Sparkles, Heart, User } from "lucide-react";
import BagIcon from "@/components/icons/BagIcon";
import { cn } from "@/lib/utils";

type DockItem = {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  Icon: LucideIcon;
  badge?: number;
};

type Props = {
  visible: boolean;
  wishlistCount: number;
  cartCount: number;
  accountHref: string;
  onWishlistClick: () => void;
};

function DockControl({
  item,
  index,
  visible,
}: {
  item: DockItem;
  index: number;
  visible: boolean;
}) {
  const iconClass = "h-[1.15rem] w-[1.15rem] shrink-0";
  const inner = (
    <>
      <span className="relative inline-flex">
        <item.Icon className={iconClass} strokeWidth={1.75} aria-hidden />
        {item.badge != null && item.badge > 0 ?
          <span className="absolute -right-1.5 -top-1 flex h-3.5 min-w-[14px] items-center justify-center bg-navy-900 px-0.5 text-[8px] font-bold leading-none text-white">
            {item.badge > 9 ? "9+" : item.badge}
          </span>
        : null}
      </span>
      <span className="sr-only">{item.label}</span>
    </>
  );

  const rowClass = cn(
    "flex h-11 w-11 items-center justify-center border-b border-gray-100 text-navy-900 transition-colors duration-200 last:border-b-0",
    "hover:bg-[#c5a059]/8 hover:text-[#c5a059]",
    "motion-safe:transition-all motion-safe:duration-300",
    visible ?
      "translate-x-0 opacity-100"
    : "-translate-x-2 opacity-0",
  );

  const style = visible ?
    { transitionDelay: `${index * 55}ms` }
  : { transitionDelay: "0ms" };

  if (item.onClick) {
    return (
      <button
        type="button"
        onClick={item.onClick}
        className={rowClass}
        style={style}
        aria-label={item.label}
      >
        {inner}
      </button>
    );
  }

  return (
    <Link
      href={item.href!}
      className={rowClass}
      style={style}
      aria-label={item.label}
    >
      {inner}
    </Link>
  );
}

/** Homepage: compact white vertical dock when the main header auto-hides on scroll. */
export default function HomeScrollSideDock({
  visible,
  wishlistCount,
  cartCount,
  accountHref,
  onWishlistClick,
}: Props) {
  const items: DockItem[] = [
    { id: "shop", label: "Shop", href: "/shop", Icon: Store },
    { id: "premium", label: "Premium", href: "/premium", Icon: Sparkles },
    {
      id: "wishlist",
      label: "Wishlist",
      onClick: onWishlistClick,
      Icon: Heart,
      badge: wishlistCount,
    },
    {
      id: "cart",
      label: "Cart",
      href: "/cart",
      Icon: BagIcon as LucideIcon,
      badge: cartCount,
    },
    { id: "account", label: "Account", href: accountHref, Icon: User },
  ];

  return (
    <nav
      aria-label="Quick navigation"
      aria-hidden={!visible}
      className={cn(
        "pointer-events-none fixed left-0 top-1/2 z-[85] hidden -translate-y-1/2 lg:block",
        "transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        visible ?
          "pointer-events-auto translate-x-0 opacity-100"
        : "-translate-x-full opacity-0",
      )}
    >
      <div className="border border-l-0 border-gray-200 bg-white shadow-[6px_0_28px_rgba(0,13,33,0.09)]">
        {items.map((item, index) => (
          <DockControl
            key={item.id}
            item={item}
            index={index}
            visible={visible}
          />
        ))}
      </div>
    </nav>
  );
}
