/** Fixed store header height — nav overlays hero when home uses underNavOverlap. */
export const heroNavUnderlapRem = 4.25;

/** Shared hero layout tokens - keep HeroSection + skeleton in sync (no CLS). */
export const heroLayout = {
  section: "relative w-full bg-navy-950",
  /** Home: hero extends under fixed navbar (see heroNavUnderlapRem). */
  sectionUnderNav: "-mt-[4.25rem] pt-[4.25rem]",
  /** Small screens: 16:9 (56.25vw); large: cap at 100svh — full width, no side gaps */
  media:
    "relative w-full max-w-full overflow-hidden h-[min(56.25vw,100svh)] bg-navy-950",
  overlay:
    "pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(to_right,rgba(20,25,47,0.78)_0%,rgba(20,25,47,0.48)_36%,rgba(20,25,47,0.28)_52%,transparent_72%)]",
  bottomFade:
    "pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-navy-950/70 via-transparent to-transparent",
  content:
    "absolute inset-x-0 top-0 bottom-0 z-20 flex flex-col justify-end pb-[4.5rem] pt-2 sm:pb-[7.25rem] sm:pt-0",
  inner: "mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12",
  copyRow:
    "pointer-events-none flex w-full items-end justify-between gap-3 sm:gap-8 lg:gap-12",
  titleCol: "pointer-events-auto min-w-0 max-w-[52%] sm:max-w-md lg:max-w-xl",
  titleSlot: "min-h-[1.75rem] sm:min-h-[4.5rem] lg:min-h-[5.5rem]",
  rightCol:
    "pointer-events-auto flex min-w-0 max-w-[46%] flex-col items-end gap-1.5 text-right sm:max-w-xs sm:gap-2 lg:max-w-sm",
  descriptionSlot: "min-h-0 sm:min-h-[2.25rem] lg:min-h-[2.5rem]",
  ctaSlot: "flex items-center justify-end",
  bottomDock:
    "absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-navy-950/90 via-navy-950/55 to-transparent backdrop-blur-[1.5px]",
  offerStrip:
    "mx-auto hidden w-full max-w-7xl px-5 pt-2 pb-2 sm:block sm:px-8 lg:px-12",
  footer:
    "mx-auto w-full max-w-7xl border-t border-white/10 px-5 pb-2 pt-2 sm:px-8 sm:pb-5 sm:pt-3 lg:px-12",
  footerRow:
    "flex min-h-[1.25rem] flex-col gap-1.5 sm:min-h-[2.5rem] sm:flex-row sm:items-center sm:justify-between sm:gap-2.5",
} as const;

export const heroSlideImageClass = "object-cover object-center";
