'use client';

import type { LucideIcon } from 'lucide-react';

type Props = {
  title: string;
  description: string;
  icon: LucideIcon;
  children: React.ReactNode;
};

export default function StorefrontSectionPanel({
  title,
  description,
  icon: Icon,
  children,
}: Props) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-start gap-3 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/80 px-5 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
          <Icon className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <div className="min-w-0 pt-0.5">
          <h2 className="font-serif text-base font-bold text-navy-900 tracking-tight">
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="px-5 py-5 space-y-4">{children}</div>
    </div>
  );
}
