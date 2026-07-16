'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ExternalLink, Loader2, Save, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  STOREFRONT_SECTION_GROUPS,
  STOREFRONT_SECTIONS,
  type StorefrontSectionId,
} from './storefrontSections';

type Props = {
  activeSection: StorefrontSectionId;
  onSectionChange: (id: StorefrontSectionId) => void;
  onSave: () => void;
  isSaving: boolean;
  children: React.ReactNode;
};

export default function StorefrontAdminShell({
  activeSection,
  onSectionChange,
  onSave,
  isSaving,
  children,
}: Props) {
  const activeMeta = STOREFRONT_SECTIONS.find((s) => s.id === activeSection);

  return (
    <div className="min-h-full bg-[#FAF9F6] pb-10">
      <div className="max-w-[1200px] mx-auto p-4 sm:p-6 xl:p-8 space-y-5">
        {/* Hero header */}
        <div className="relative overflow-hidden rounded-[1.75rem] bg-navy-950 px-6 py-7 sm:px-8 sm:py-8 shadow-xl ring-1 ring-brand-500/15">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-400/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 left-8 h-36 w-36 rounded-full bg-amber-400/10 blur-2xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-300/90 mb-1.5">
                Storefront settings
              </p>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                Website appearance
              </h1>
              <p className="text-sm text-navy-200/90 mt-1.5 max-w-lg">
                Edit banners, homepage sections, gifting page, and site-wide content — all in one place.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link
                href="/"
                target="_blank"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
              >
                <Store className="h-4 w-4" />
                Preview site
                <ExternalLink className="h-3.5 w-3.5 opacity-60" />
              </Link>
              <button
                type="button"
                onClick={onSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-900/30 transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ?
                  <Loader2 className="h-4 w-4 animate-spin" />
                : <Save className="h-4 w-4" />}
                {isSaving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Sticky section navigator */}
        <div className="sticky top-0 z-30 -mx-1 px-1 bg-[#FAF9F6]/95 backdrop-blur-xl border-b border-gray-200/70 pb-px">
          <div className="space-y-3 py-2">
            {STOREFRONT_SECTION_GROUPS.map((group) => {
              const items = STOREFRONT_SECTIONS.filter((s) => s.group === group);
              return (
                <div key={group}>
                  <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                    {group}
                  </p>
                  <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-0.5">
                    {items.map((section) => (
                      <SectionTab
                        key={section.id}
                        label={section.label}
                        icon={section.icon}
                        isActive={activeSection === section.id}
                        onClick={() => onSectionChange(section.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active section hint */}
        {activeMeta && (
          <p className="text-xs text-gray-500 px-1">
            Editing:{' '}
            <span className="font-semibold text-navy-800">{activeMeta.label}</span>
            {' · '}
            {activeMeta.description}
          </p>
        )}

        {/* Section content — only one panel mounted at a time */}
        <div key={activeSection} className="animate-in fade-in duration-200">
          {children}
        </div>
      </div>
    </div>
  );
}

function SectionTab({
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-200 border',
        isActive ?
          'bg-white text-navy-900 border-brand-200 shadow-sm ring-1 ring-brand-100'
        : 'bg-white/60 text-gray-500 border-transparent hover:bg-white hover:text-navy-800 hover:border-gray-200',
      )}
    >
      <Icon
        className={cn('h-3.5 w-3.5', isActive ? 'text-brand-600' : 'text-gray-400')}
        strokeWidth={isActive ? 2.5 : 2}
      />
      {label}
    </button>
  );
}
