/** Shared hero layout tokens — keep HeroSection + skeleton in sync (no CLS). */
export const heroLayout = {
  section: "relative w-full bg-navy-950",
  /** Mobile: 16:9 banner — desktop: tall viewport hero */
  media:
    "relative w-full overflow-hidden aspect-[16/9] sm:aspect-auto sm:h-[min(92svh,920px)]",
  overlay:
    "pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-navy-950/75 via-navy-950/30 to-transparent",
  content:
    "absolute inset-x-0 top-0 bottom-0 z-20 flex flex-col justify-end pb-[4.5rem] pt-2 sm:justify-center sm:pb-[7.25rem] sm:pt-0",
  inner: "mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12",
  copy: "max-w-2xl pointer-events-auto",
  badgeSlot: "mb-1 flex h-6 items-center sm:mb-3 sm:h-8",
  subtitleSlot: "mb-1 flex h-4 items-center sm:mb-3 sm:h-6",
  titleSlot: "mt-1.5 min-h-[1.75rem] sm:mt-4 sm:min-h-[4.5rem] lg:min-h-[5.5rem]",
  descriptionSlot:
    "mt-1 min-h-0 sm:mt-3 sm:min-h-[2.75rem] lg:min-h-[3rem]",
  ctaSlot: "mt-2 flex h-7 items-center sm:mt-6 sm:h-9",
  /** Transparent dock — sits over image bottom, does not crop image */
  bottomDock:
    "absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-navy-950/90 via-navy-950/55 to-transparent backdrop-blur-[1.5px]",
  offerStrip:
    "mx-auto hidden w-full max-w-7xl px-5 pt-2 pb-2 sm:block sm:px-8 lg:px-12",
  footer:
    "mx-auto w-full max-w-7xl border-t border-white/10 px-5 pb-2 pt-2 sm:px-8 sm:pb-5 sm:pt-3 lg:px-12",
  footerRow:
    "flex min-h-[1.75rem] flex-col gap-2 sm:min-h-[2.5rem] sm:flex-row sm:items-center sm:justify-between sm:gap-2.5",
} as const;
