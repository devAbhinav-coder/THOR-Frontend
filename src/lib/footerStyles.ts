export const footerShell =
  "relative overflow-hidden border-t border-navy-800/90 bg-navy-950 text-white pb-[calc(3.25rem+env(safe-area-inset-bottom,0px))] lg:pb-0";

/** Soft gold wash — atmosphere without flat navy slab */
export const footerAtmosphere =
  "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_12%_-10%,rgba(212,175,55,0.11),transparent_55%),radial-gradient(ellipse_60%_40%_at_95%_100%,rgba(212,175,55,0.06),transparent_50%)]";

export const footerAccentLine =
  "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-300/35 to-transparent";

export const footerContainer =
  "relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

/** Reference-style uppercase section labels */
export const footerSectionHeading =
  "text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-200/90 sm:text-xs";

export const footerBrandTitle =
  "font-serif text-lg font-medium tracking-tight text-white sm:text-xl";

export const footerBrandDescription =
  "text-sm leading-relaxed text-white/58";

export const footerLinkList = "space-y-2.5";

export const footerLink =
  "group relative block w-fit py-0.5 text-[13px] leading-snug text-white/58 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:text-gold-200 lg:inline-block after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-gold-300/50 after:transition-transform after:duration-300 hover:after:scale-x-100";

export const footerSocialButton =
  "inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/75 transition-all duration-200 hover:border-gold-300/40 hover:bg-gold-300/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300/40";

export const footerContactRow =
  "mt-5 flex flex-col gap-2.5 border-t border-white/[0.08] pt-5";

/** Icon + label on one horizontal row (never stacked) */
export const footerContactLink =
  "inline-flex max-w-full flex-row items-center gap-2.5 text-[13px] leading-none text-white/70 transition-colors duration-200 hover:text-gold-200 focus-visible:outline-none focus-visible:text-gold-200";

export const footerContactIcon =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-gold-300/90";

export const footerContactText =
  "min-w-0 truncate text-left leading-snug";

export const footerTrustIcon =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold-300/20 bg-gold-300/[0.06] text-gold-300/90";

export const footerTrustItem =
  "text-[11px] font-medium uppercase tracking-[0.16em] text-white/55 sm:text-xs sm:tracking-[0.18em]";

export const footerTrustStrip =
  "mt-10 border-y border-white/[0.06] bg-white/[0.02] py-5 sm:mt-12 sm:py-6";

export const footerBottomLink =
  "block w-full py-1 text-left text-[13px] text-white/58 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:text-gold-200 lg:inline-block lg:w-auto";

export const footerPolicyLink =
  "text-[12px] text-white/45 transition-colors duration-200 hover:text-white/80 focus-visible:outline-none focus-visible:text-gold-200";

export const footerCopyright =
  "text-[11px] leading-relaxed text-white/45 sm:text-xs";

export const footerMobileSectionShell =
  "border-b border-white/[0.06] lg:border-0";

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
