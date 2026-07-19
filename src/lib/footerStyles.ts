export const footerShell =
  "relative border-t border-navy-800 bg-navy-950 text-white pb-[calc(3.25rem+env(safe-area-inset-bottom,0px))] lg:pb-0";

export const footerAccentLine =
  "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-300/25 to-transparent";

export const footerContainer =
  "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

/** Reference-style uppercase section labels */
export const footerSectionHeading =
  "text-[11px] font-semibold uppercase tracking-[0.22em] text-white/88 sm:text-xs";

export const footerBrandTitle =
  "font-serif text-lg font-medium tracking-tight text-white sm:text-xl";

export const footerBrandDescription =
  "text-sm leading-relaxed text-white/58";

export const footerLinkList = "space-y-3";

export const footerLink =
  "block py-0.5 text-[13px] leading-snug text-white/58 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:text-gold-200 lg:inline-block";

export const footerSocialButton =
  "inline-flex h-10 w-10 items-center justify-center rounded-full border border-navy-700 bg-navy-800/80 text-white/80 transition-colors duration-200 hover:border-brand-500/45 hover:bg-navy-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35";

export const footerContactIcon =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-navy-700 bg-navy-800/70 text-gold-300/90";

export const footerTrustIcon =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-navy-700/80 bg-navy-800/50 text-gold-300/90";

export const footerTrustItem =
  "text-[11px] font-medium uppercase tracking-[0.16em] text-white/55 sm:text-xs sm:tracking-[0.18em]";

export const footerBottomLink =
  "block w-full py-1 text-left text-[13px] text-white/58 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:text-gold-200 lg:inline-block lg:w-auto";

export const footerCopyright =
  "text-[11px] leading-relaxed text-white/45 sm:text-xs";

export const footerMobileSectionShell =
  "border-b border-navy-800/70 lg:border-0";

export const footerMobileSectionButton =
  "flex w-full items-center justify-between gap-4 py-4 text-left lg:pointer-events-none lg:cursor-default lg:py-0";

export const footerMobileSectionPanel =
  "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none lg:!grid-rows-[1fr]";

/** Clamp storefront categoryLimit to a sane range */
export function resolveFooterCategoryLimit(
  raw: number | undefined | null,
  maxAvailable: number,
): number {
  const n = Number(raw);
  const fallback = 5;
  const base = Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
  return Math.min(Math.max(base, 1), Math.max(maxAvailable, 1), 20);
}
