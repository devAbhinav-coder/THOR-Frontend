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
  /** True when there are unsaved edits — shows a warning chip next to Save. */
  isDirty?: boolean;
  children: React.ReactNode;
};

export default function StorefrontAdminShell({
  activeSection,
  onSectionChange,
  onSave,
  isSaving,
  isDirty = false,
  children,
}: Props) {
  const activeMeta = STOREFRONT_SECTIONS.find((s) => s.id === activeSection);

  return (
    <div className="min-h-full bg-[#FAF9F6] pb-28 sm:pb-10">
      <div className="max-w-[1200px] mx-auto p-3 sm:p-6 xl:p-8 space-y-4">
        {/* Hero header */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-[1.75rem] bg-navy-950 px-5 py-5 sm:px-8 sm:py-7 shadow-xl ring-1 ring-brand-500/15">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-400/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 left-8 h-36 w-36 rounded-full bg-amber-400/10 blur-2xl" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-300/90 mb-1">
                Storefront settings
              </p>
              <h1 className="text-xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                Website appearance
              </h1>
              <p className="text-xs sm:text-sm text-navy-200/90 mt-1 max-w-lg">
                Edit banners, homepage sections, gifting page, and site-wide content — pick a section below, edit, then press Save.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/"
                target="_blank"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
              >
                <Store className="h-4 w-4" />
                Preview site
                <ExternalLink className="h-3.5 w-3.5 opacity-60" />
              </Link>
            </div>
          </div>
        </div>

        {/* Sticky toolbar: section tabs + save */}
        <div className="sticky top-0 z-30 -mx-3 px-3 sm:-mx-1 sm:px-1 bg-[#FAF9F6]/95 backdrop-blur-xl border-b border-gray-200/70">
          <div className="flex items-center gap-2 py-2">
            <div className="flex flex-1 min-w-0 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {STOREFRONT_SECTION_GROUPS.map((group, groupIdx) => {
                const items = STOREFRONT_SECTIONS.filter((s) => s.group === group);
                return (
                  <div key={group} className="flex shrink-0 items-center gap-1.5">
                    {groupIdx > 0 && (
                      <span className="mx-0.5 h-5 w-px shrink-0 bg-gray-200" aria-hidden />
                    )}
                    <span className="shrink-0 pl-0.5 pr-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400">
                      {group}
                    </span>
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
                );
              })}
            </div>

            {/* Save — always visible while scrolling (desktop / tablet) */}
            <div className="hidden sm:flex shrink-0 items-center gap-2 pl-1">
              {isDirty && !isSaving && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Unsaved
                </span>
              )}
              <SaveButton onSave={onSave} isSaving={isSaving} isDirty={isDirty} />
            </div>
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

      {/* Mobile save bar — fixed at bottom so Save is always one tap away */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-xl px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            {isDirty && !isSaving ? (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Unsaved changes
              </p>
            ) : (
              <p className="text-xs text-gray-400 truncate">
                {isSaving ? 'Saving your changes…' : 'All changes saved'}
              </p>
            )}
          </div>
          <SaveButton onSave={onSave} isSaving={isSaving} isDirty={isDirty} />
        </div>
      </div>
    </div>
  );
}

function SaveButton({
  onSave,
  isSaving,
  isDirty,
}: {
  onSave: () => void;
  isSaving: boolean;
  isDirty: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSave}
      disabled={isSaving}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60',
        isDirty ?
          'bg-brand-600 shadow-brand-900/30 hover:bg-brand-500'
        : 'bg-navy-900 shadow-navy-900/20 hover:bg-navy-800',
      )}
    >
      {isSaving ?
        <Loader2 className="h-4 w-4 animate-spin" />
      : <Save className="h-4 w-4" />}
      {isSaving ? 'Saving…' : 'Save changes'}
    </button>
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
        'inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-200 border whitespace-nowrap',
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
