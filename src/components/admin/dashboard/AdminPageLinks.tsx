'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AdminQuickLink = { label: string; href: string; icon: LucideIcon };

export function AdminQuickActionsGrid({ links }: { links: AdminQuickLink[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2.5 sm:gap-3">
      {links.map(({ label, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="group rounded-2xl border border-gray-200/90 bg-white px-3 py-3 sm:px-4 sm:py-3.5 shadow-sm hover:border-brand-300/80 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-50 to-white border border-brand-100/80 text-brand-600 flex items-center justify-center group-hover:border-brand-200">
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-gray-800">{label}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function AdminCrossNav({
  items,
}: {
  items: { label: string; href: string; description: string; accent: string }[];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all group',
            item.accent,
          )}
        >
          <p className="text-sm font-bold text-gray-900 group-hover:text-brand-700">{item.label}</p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.description}</p>
          <span className="text-xs font-semibold text-brand-600 mt-2 inline-block">Open →</span>
        </Link>
      ))}
    </div>
  );
}
