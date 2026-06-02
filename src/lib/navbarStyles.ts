import { cn } from "@/lib/utils";

export function navShellClass(scrolled: boolean) {
  return cn(
    "sticky top-0 z-50 border-b border-navy-800 bg-navy-950",
    "transition-[box-shadow,background-color] duration-300 ease-out motion-reduce:transition-none",
    scrolled && "shadow-[0_8px_32px_-8px_rgba(20,25,47,0.65)]",
  );
}

export function navLinkClass(active: boolean) {
  return cn(
    "relative px-3 py-2.5 text-[11px] font-medium uppercase tracking-[0.2em] transition-colors duration-200",
    active ?
      "text-white after:absolute after:inset-x-2 after:bottom-1 after:h-px after:bg-gradient-to-r after:from-transparent after:via-gold-300/90 after:to-transparent"
    : "text-white/75 hover:text-white",
  );
}

export const navIconButton =
  "inline-flex h-10 w-10 items-center justify-center rounded-full text-white/85 transition-colors duration-200 hover:bg-navy-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40";

export const navSearchInputClass =
  "rounded-full border-navy-700 bg-navy-900/60 py-2 text-[13px] tracking-wide placeholder:text-white/45 placeholder:tracking-wide focus:border-brand-500/50 focus:ring-brand-500/15";

export const navAnnouncementShell =
  "relative z-40 flex min-h-9 items-center justify-center border-b border-navy-800 bg-navy-950 px-3 py-2 text-center";

export const navAnnouncementText =
  "max-w-4xl text-[10px] font-medium uppercase tracking-[0.2em] text-gold-200/95 sm:text-[11px]";

export const navDropdownPanel =
  "absolute top-full left-0 mt-1 min-w-[220px] rounded-xl border border-navy-700 bg-navy-950 p-2 shadow-2xl opacity-0 invisible transition-all duration-200 group-hover:opacity-100 group-hover:visible";

export const navDropdownItem =
  "block rounded-lg px-3 py-2 text-sm text-white/80 transition-colors hover:bg-navy-800/80 hover:text-white";

export const navBadgeCount =
  "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-0.5 text-[9px] font-bold leading-none text-white ring-2 ring-navy-950";

export function mobileTabClass(active: boolean) {
  return cn(
    "flex min-h-[3.25rem] min-w-0 flex-col items-center justify-center gap-0.5 py-1.5 text-[9px] font-medium uppercase tracking-[0.14em] transition-colors touch-manipulation sm:text-[10px]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-md",
    active ? "text-white" : "text-white/70 hover:text-white",
  );
}

export function mobileTabIconClass(active: boolean) {
  return cn(
    "h-[1.125rem] w-[1.125rem] shrink-0 sm:h-5 sm:w-5",
    active ? "text-brand-400" : "text-white/80",
  );
}
