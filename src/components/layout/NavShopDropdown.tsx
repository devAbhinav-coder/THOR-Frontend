"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  navDropdownAccent,
  navDropdownShellClass,
  navLuxuryDropdownHeader,
  navLuxuryDropdownItem,
  navLuxuryDropdownNav,
  navLuxuryDropdownPanelClass,
} from "@/lib/navbarStyles";
import type { Category } from "@/types";
import { buildShopCategoryHref } from "@/lib/shopCategorySeo";

type Props = {
  isOpen: boolean;
  pathname: string;
  categories: Category[];
  onNavigate?: () => void;
};

export default function NavShopDropdown({
  isOpen,
  pathname,
  categories,
  onNavigate,
}: Props) {
  const searchParams = useSearchParams();

  return (
    <div className={navDropdownShellClass(isOpen)} aria-hidden={!isOpen}>
      <div className={navLuxuryDropdownPanelClass(isOpen)}>
        <div className={navDropdownAccent} aria-hidden />

        <div className={navLuxuryDropdownHeader}>
          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#c5a059]">
            Browse
          </p>
          <p className="mt-1 font-serif text-lg font-medium text-white/90">
            Collections
          </p>
        </div>

        <nav className={navLuxuryDropdownNav} aria-label="Shop categories">
          <Link
            href="/shop"
            onClick={onNavigate}
            className={navLuxuryDropdownItem(
              pathname === "/shop" && !searchParams.get("category"),
            )}
          >
            All Sarees
          </Link>
          {categories.map((cat) => {
            const catHref = buildShopCategoryHref(cat);
            return (
              <Link
                key={cat._id}
                href={catHref}
                onClick={onNavigate}
                className={navLuxuryDropdownItem(pathname.startsWith(catHref))}
              >
                {cat.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
