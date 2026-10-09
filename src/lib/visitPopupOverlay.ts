/** Storefront visit popup overlay copy, color & typography (admin-configurable). */

import type { CSSProperties } from 'react';

export const DEFAULT_VISIT_POPUP_TEXT_COLOR = '#ffffff';
export const DEFAULT_VISIT_POPUP_TEXT_STYLE = 'serif_luxury' as const;

export const VISIT_POPUP_TEXT_STYLES = [
  {
    id: 'sans_modern',
    label: 'Modern sans',
    hint: 'Clean UI — default storefront feel',
  },
  {
    id: 'serif_luxury',
    label: 'Luxury serif',
    hint: 'House of Rani serif — editorial',
  },
  {
    id: 'serif_display',
    label: 'Serif display',
    hint: 'Uppercase serif — sale headline',
  },
  {
    id: 'calibri_clean',
    label: 'Calibri / Segoe',
    hint: 'Office-clean sans (Calibri, Segoe UI)',
  },
  {
    id: 'classic_book',
    label: 'Classic book',
    hint: 'Georgia / Times — traditional',
  },
  {
    id: 'label_caps',
    label: 'Label caps',
    hint: 'Wide-spaced uppercase sans',
  },
  {
    id: 'mono_code',
    label: 'Mono accent',
    hint: 'Monospace — strong for codes',
  },
] as const;

export type VisitPopupTextStyleId = (typeof VISIT_POPUP_TEXT_STYLES)[number]['id'];

const STYLE_IDS = new Set<string>(VISIT_POPUP_TEXT_STYLES.map((s) => s.id));

export const VISIT_POPUP_TEXT_STYLE_IDS = VISIT_POPUP_TEXT_STYLES.map((s) => s.id);

const HEX_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export function isVisitPopupTextColor(value: string): boolean {
  return HEX_RE.test(value.trim());
}

/** Returns an error message for admin save, or null if OK. Empty hex is allowed (storefront default). */
export function visitPopupTextColorSaveError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || isVisitPopupTextColor(trimmed)) return null;
  return 'Visit popup text color must be a hex code like #ffffff';
}

export function isVisitPopupTextStyle(value: string): value is VisitPopupTextStyleId {
  return STYLE_IDS.has(value);
}

/** Safe color for inline styles; falls back to white. */
export function resolveVisitPopupTextColor(value?: string | null): string {
  const trimmed = (value || '').trim();
  if (trimmed && isVisitPopupTextColor(trimmed)) return trimmed;
  return DEFAULT_VISIT_POPUP_TEXT_COLOR;
}

export function resolveVisitPopupTextStyle(value?: string | null): VisitPopupTextStyleId {
  const trimmed = (value || '').trim();
  if (trimmed && isVisitPopupTextStyle(trimmed)) return trimmed;
  return DEFAULT_VISIT_POPUP_TEXT_STYLE;
}

export function visitPopupOverlayText(value?: string | null): string {
  return (value || '').trim();
}

export type VisitPopupTypography = {
  overlayClass: string;
  bodyClass: string;
  footerClass: string;
  codeClass: string;
  fontFamily?: string;
  overlayUppercase: boolean;
};

export function visitPopupTypography(styleId: VisitPopupTextStyleId): VisitPopupTypography {
  switch (styleId) {
    case 'sans_modern':
      return {
        overlayClass: 'text-[10px] font-semibold tracking-[0.08em] sm:text-[11px]',
        bodyClass: 'text-xs font-normal leading-relaxed sm:text-sm',
        footerClass: 'text-[11px] font-semibold tracking-[0.14em]',
        codeClass: 'font-mono text-lg font-bold tracking-widest sm:text-xl',
        fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
        overlayUppercase: false,
      };
    case 'serif_luxury':
      return {
        overlayClass: 'font-serif text-[10px] font-medium tracking-[0.12em] sm:text-[11px]',
        bodyClass: 'font-serif text-xs font-light leading-relaxed sm:text-sm',
        footerClass: 'font-serif text-[11px] font-medium tracking-[0.12em]',
        codeClass: 'font-serif text-lg font-semibold tracking-[0.2em] sm:text-xl',
        overlayUppercase: false,
      };
    case 'serif_display':
      return {
        overlayClass: 'font-serif text-[10px] font-semibold uppercase tracking-[0.22em] sm:text-[11px]',
        bodyClass: 'font-serif text-xs font-medium leading-snug sm:text-sm',
        footerClass: 'font-serif text-[11px] font-semibold uppercase tracking-[0.18em]',
        codeClass: 'font-serif text-lg font-bold uppercase tracking-[0.16em] sm:text-xl',
        overlayUppercase: true,
      };
    case 'calibri_clean':
      return {
        overlayClass: 'text-[10px] font-semibold tracking-[0.06em] sm:text-[11px]',
        bodyClass: 'text-xs font-normal leading-snug sm:text-sm',
        footerClass: 'text-[11px] font-semibold tracking-[0.1em]',
        codeClass: 'font-mono text-lg font-bold tracking-widest sm:text-xl',
        fontFamily: "Calibri, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        overlayUppercase: false,
      };
    case 'classic_book':
      return {
        overlayClass: 'text-[10px] font-semibold italic tracking-[0.04em] sm:text-[11px]',
        bodyClass: 'text-xs font-normal leading-relaxed sm:text-sm',
        footerClass: 'text-[11px] font-medium tracking-[0.08em]',
        codeClass: 'font-mono text-lg font-bold tracking-widest sm:text-xl',
        fontFamily: "Georgia, 'Times New Roman', Times, serif",
        overlayUppercase: false,
      };
    case 'label_caps':
      return {
        overlayClass: 'text-[9px] font-bold uppercase tracking-[0.28em] sm:text-[10px]',
        bodyClass: 'text-[11px] font-medium leading-relaxed sm:text-xs',
        footerClass: 'text-[10px] font-bold uppercase tracking-[0.2em]',
        codeClass: 'font-mono text-base font-bold tracking-[0.35em] sm:text-lg',
        fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
        overlayUppercase: true,
      };
    case 'mono_code':
      return {
        overlayClass: 'font-mono text-[9px] font-bold uppercase tracking-[0.2em] sm:text-[10px]',
        bodyClass: 'font-mono text-[11px] font-normal leading-relaxed sm:text-xs',
        footerClass: 'font-mono text-[10px] font-semibold uppercase tracking-[0.16em]',
        codeClass: 'font-mono text-lg font-bold tracking-[0.3em] sm:text-xl',
        overlayUppercase: true,
      };
    default:
      return visitPopupTypography(DEFAULT_VISIT_POPUP_TEXT_STYLE);
  }
}

export function visitPopupTextStyle(styleId: VisitPopupTextStyleId, color: string, opacity = 1): CSSProperties {
  const typo = visitPopupTypography(styleId);
  return {
    color,
    opacity,
    textShadow: '0 1px 16px rgba(0,0,0,0.65)',
    ...(typo.fontFamily ? { fontFamily: typo.fontFamily } : {}),
  };
}
