"use client";

import Link from "next/link";
import Image from "next/image";
import {
  navDropdownAccent,
  navDropdownShellClass,
  navLuxuryDropdownPanelClass,
} from "@/lib/navbarStyles";
import { buildShopCategoryHref } from "@/lib/shopCategorySeo";
import type { MegaMenuCategory } from "@/types";

type Props = {
  isOpen: boolean;
  pathname: string;
  categories: MegaMenuCategory[];
  onNavigate?: () => void;
};

export default function MegaMenu({
  isOpen,
  pathname,
  categories,
  onNavigate,
}: Props) {
  const featuredCategories = categories.slice(0, 3);

  return (
    <div className={navDropdownShellClass(isOpen)} aria-hidden={!isOpen}>
      <div
        className={`${navLuxuryDropdownPanelClass(isOpen)} !p-0 !max-w-4xl !w-[min(56rem,calc(100vw-3rem))]`}
      >
        <div className={navDropdownAccent} aria-hidden />

        <div className="flex bg-white">
          {/* Main categories — shop only, aligned under Shop trigger */}
          <div className="w-[11.5rem] shrink-0 bg-gray-50/50 py-6 pl-6 pr-4 border-r border-gray-100">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c5a059] mb-4">
              Shop
            </h3>
            <nav className="flex flex-col gap-2" aria-label="Shop categories">
              <Link
                href="/shop/collections"
                onClick={onNavigate}
                className="text-sm font-medium text-navy-900 hover:text-[#c5a059] transition-colors py-1"
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
                    className="text-sm font-medium text-navy-900 hover:text-[#c5a059] transition-colors py-1 flex items-center justify-between group"
                  >
                    {cat.name}
                    {cat.subcategories && cat.subcategories.length > 0 && (
                      <svg
                        className="w-4 h-4 text-gray-400 group-hover:text-[#c5a059]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Subcategories grid */}
          <div className="min-w-0 flex-1 p-6">
            {featuredCategories.length > 0 ? (
              <div className="grid grid-cols-3 gap-6">
                {featuredCategories.map((cat) => {
                  const catHref = buildShopCategoryHref(cat);
                  return (
                    <div key={cat._id} className="flex flex-col min-w-0">
                      <Link
                        href={catHref}
                        onClick={onNavigate}
                        className="font-serif text-lg text-navy-900 hover:text-[#c5a059] mb-4 border-b border-gray-100 pb-2 inline-block"
                      >
                        {cat.name}
                      </Link>
                      {cat.subcategories && cat.subcategories.length > 0 ? (
                        <ul className="flex flex-col gap-2">
                          {cat.subcategories.slice(0, 5).map((sub) => (
                            <li key={`${cat.slug}-${sub.slug}`}>
                              <Link
                                href={`${catHref}/${encodeURIComponent(sub.slug)}`}
                                onClick={onNavigate}
                                className="text-sm text-gray-600 hover:text-[#c5a059] transition-colors flex items-center group"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-200 mr-2 group-hover:bg-[#c5a059] transition-colors" />
                                {sub.name}
                              </Link>
                            </li>
                          ))}
                          {cat.subcategories.length > 5 && (
                            <li>
                              <Link
                                href={catHref}
                                onClick={onNavigate}
                                className="text-xs font-medium text-[#c5a059] hover:underline mt-2 inline-block"
                              >
                                View all {cat.name}
                              </Link>
                            </li>
                          )}
                        </ul>
                      ) : (
                        cat.image && (
                          <Link
                            href={catHref}
                            onClick={onNavigate}
                            className="relative w-full aspect-[4/3] rounded-lg overflow-hidden group mt-2 block"
                          >
                            <Image
                              src={cat.image}
                              alt={cat.name}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                          </Link>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Browse our full saree collection.
              </p>
            )}

            <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between gap-4">
              <p className="text-sm text-gray-500 font-medium tracking-wide">
                FREE SHIPPING ON ORDERS OVER ₹1,099
              </p>
              <Link
                href="/shop?sort=-createdAt"
                onClick={onNavigate}
                className="shrink-0 text-xs font-semibold uppercase tracking-widest text-[#c5a059] hover:text-navy-900 transition-colors"
              >
                New Arrivals →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
