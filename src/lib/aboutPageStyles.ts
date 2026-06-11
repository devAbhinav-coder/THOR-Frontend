/** About page — aligned with homepage heritage editorial (square, gold frames). */
export const aboutPageStyles = {
  ctaGold:
    "inline-flex items-center justify-center gap-2 bg-[#c5a059] px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition-colors hover:bg-[#b8924d] sm:px-10 sm:text-xs",
  ctaOutlineOnDark:
    "inline-flex items-center justify-center gap-2 border border-white/50 bg-white/10 px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:px-10 sm:text-xs",
  ctaNavy:
    "inline-flex items-center justify-center gap-2 bg-navy-900 px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition-colors hover:bg-navy-800 sm:px-10 sm:text-xs",
  ctaWhite:
    "inline-flex items-center justify-center gap-2 bg-white px-8 py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-navy-900 transition-colors hover:bg-brand-50 sm:px-10 sm:text-xs",
  ctaOutlineNavy:
    "inline-flex items-center justify-center gap-2 border-2 border-navy-900 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-900 transition-colors hover:bg-navy-900 hover:text-white sm:px-8 sm:text-xs",

  /** White / cream sections — gold border + white padding */
  frameLight:
    "border border-[#c5a059]/40 bg-white p-2 sm:p-2.5 lg:border-[#c5a059]/50",
  /** Navy sections — white padding only, no gold border */
  frameDark: "bg-white p-2 sm:p-2.5",

  eyebrow:
    "text-[11px] font-semibold uppercase tracking-[0.28em] text-[#c5a059] sm:text-xs",
  chapterLabel:
    "text-[11px] font-bold uppercase tracking-[0.3em] text-brand-600",
} as const;

export type AboutImageSurface = "light" | "dark";
