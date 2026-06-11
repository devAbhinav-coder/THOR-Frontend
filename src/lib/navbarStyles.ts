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
      "text-white after:absolute after:inset-x-2 after:bottom-1 after:h-px after:bg-gradient-to-r after:from-transparent after:via-[#c5a059]/90 after:to-transparent"
    : "text-white/75 hover:text-white",
  );
}

export const navIconButton =
  "inline-flex h-10 w-10 items-center justify-center text-white/85 transition-colors duration-200 hover:bg-navy-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c5a059]/40";

export const navSearchInputClass =
  "rounded-none border-navy-700 bg-navy-900/60 py-2 text-[13px] tracking-wide placeholder:text-white/45 placeholder:tracking-wide focus:border-[#c5a059]/60 focus:ring-[#c5a059]/20";

export const navAnnouncementShell =
  "relative z-40 flex min-h-9 items-center justify-center border-b border-navy-800 bg-navy-950 px-3 py-2 text-center";

export const navAnnouncementText =
  "max-w-4xl text-[10px] font-medium uppercase tracking-[0.2em] text-[#c5a059]/95 sm:text-[11px]";

/** Heritage dropdown shell — square, gold accent strip */
export const navDropdownAccent =
  "h-[2px] bg-gradient-to-r from-navy-900 via-[#c5a059] to-navy-900";

export function navDropdownShellClass(
  open: boolean,
  align: "left" | "right" = "left",
) {
  return cn(
    "absolute top-full z-50 pt-2",
    align === "right" ? "right-0" : "left-0",
    open ? "pointer-events-auto" : "pointer-events-none",
  );
}

const navLuxuryDropdownMotion =
  "overflow-hidden rounded-none border border-[#c5a059]/35 bg-white shadow-[0_12px_32px_rgba(26,43,72,0.14)] transition-[opacity,transform,visibility] duration-300 ease-out motion-reduce:transition-none";

export function navLuxuryDropdownPanelClass(
  open: boolean,
  minWidth: "15.5rem" | "17.5rem" = "15.5rem",
) {
  return cn(
    navLuxuryDropdownMotion,
    minWidth === "17.5rem" ? "min-w-[17.5rem]" : "min-w-[15.5rem]",
    open
      ? "visible translate-y-0 opacity-100"
      : "invisible -translate-y-1.5 opacity-0",
  );
}

export const navLuxuryDropdownHeader =
  "border-b border-[#c5a059]/20 bg-[#1a2b48] px-5 py-5 text-center";

export const navLuxuryDropdownNav = "bg-[#fcf9f8]";

export function navLuxuryDropdownItem(active = false) {
  return cn(
    "block w-full border-b border-[#c5a059]/15 px-5 py-3.5 text-left font-serif text-[14px] leading-snug text-[#1a2b48] transition-colors last:border-b-0",
    active
      ? "bg-white text-[#c5a059]"
      : "hover:bg-white hover:text-[#c5a059]",
  );
}

export const navLuxuryDropdownFooter =
  "border-t border-[#c5a059]/20 bg-white px-5 py-3.5";

export function navUserMenuShellClass(open: boolean) {
  return navDropdownShellClass(open, "right");
}

export const navAvatarButton =
  "flex items-center gap-2 p-1 text-white/85 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c5a059]/40";

export const navAvatarRing =
  "flex h-8 w-8 items-center justify-center overflow-hidden border-2 border-[#c5a059]/70 bg-navy-800";

export const navBadgeCount =
  "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center bg-[#c5a059] px-0.5 text-[9px] font-bold leading-none text-white ring-2 ring-navy-950";

export function mobileTabClass(active: boolean) {
  return cn(
    "flex min-h-[3.25rem] min-w-0 flex-col items-center justify-center gap-0.5 py-1.5 text-[9px] font-medium uppercase tracking-[0.14em] transition-colors touch-manipulation sm:text-[10px]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c5a059]/40",
    active ? "text-[#c5a059]" : "text-white/70 hover:text-white",
  );
}

export function mobileTabIconClass(active: boolean) {
  return cn(
    "h-[1.125rem] w-[1.125rem] shrink-0 sm:h-5 sm:w-5",
    active ? "text-[#c5a059]" : "text-white/80",
  );
}
