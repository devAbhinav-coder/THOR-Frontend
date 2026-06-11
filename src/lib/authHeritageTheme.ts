import { cn } from "@/lib/utils";

export const AUTH_HERO_IMAGE =
  "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&q=85";

export const authHeritageGold = "#c5a059";
export const authHeritageGoldHover = "#b8924d";

export const authBackdrop =
  "absolute inset-0 bg-[#14192f]/55 backdrop-blur-[14px]";

export const authModalShell =
  "relative z-10 flex w-full max-h-[96dvh] flex-col overflow-hidden rounded-none bg-[#faf9f7] shadow-[0_32px_80px_-12px_rgba(20,25,47,0.42)] animate-in fade-in zoom-in-95 duration-300 sm:max-h-[min(96dvh,720px)] sm:max-w-[440px] lg:max-h-[min(90dvh,720px)] lg:max-w-[920px] lg:flex-row";

export const authHeroPanel =
  "relative hidden min-h-0 w-[42%] shrink-0 overflow-hidden bg-navy-950 lg:block";

export const authFormPanel = "flex min-h-0 min-w-0 flex-1 flex-col";

export const authGoldRule = "mx-auto h-px w-12 bg-[#c5a059]";

export const authModalTitleDesktop =
  "font-serif text-[1.65rem] font-semibold tracking-tight text-navy-900";

export const authModalTitleMobile =
  "font-serif text-[1.75rem] font-semibold uppercase tracking-[0.12em] text-navy-900 sm:text-[2rem]";

export const authModalEyebrow =
  "text-[10px] font-semibold uppercase tracking-[0.28em] text-[#c5a059]";

export const authHeritageBtn =
  "rounded-none bg-navy-900 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-navy-800 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 h-auto min-h-[2.5rem]";

export const authHeritageBtnOutline =
  "rounded-none border border-gray-300 bg-transparent py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-navy-900 transition-colors hover:border-[#c5a059]/60 hover:bg-[#c5a059]/5 h-auto min-h-[2.75rem]";

export const authFieldLabel = (embedded?: boolean) =>
  embedded ?
    "text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500"
  : "text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55";

export const authFieldInput = (embedded?: boolean) =>
  cn(
    "flex h-9 w-full rounded-none border-0 border-b bg-transparent px-0 text-sm shadow-none transition-colors",
    "focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
    embedded ?
      "border-gray-300 text-navy-900 placeholder:text-gray-400 focus-visible:border-[#c5a059]"
    : "border-white/25 text-white placeholder:text-white/35 focus-visible:border-[#c5a059]",
  );

export const authLinkGold = (embedded?: boolean) =>
  embedded ?
    "text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c5a059] transition-colors hover:text-[#b8924d]"
  : "text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c5a059] transition-colors hover:text-[#d4b06a]";

export const authMutedCopy = (embedded?: boolean) =>
  embedded ? "text-sm text-gray-500" : "text-sm text-white/45";

export const authGhostLink = (embedded?: boolean) =>
  embedded ?
    "text-xs text-gray-500 transition-colors hover:text-navy-900"
  : "text-xs text-white/40 transition-colors hover:text-white/70";

export const authFooterLinks = [
  { label: "Craftsmanship", href: "/about" },
  { label: "Sustainability", href: "/about" },
  { label: "Bespoke", href: "/gifting" },
] as const;
