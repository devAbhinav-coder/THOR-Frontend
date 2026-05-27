import { cn } from "@/lib/utils";

/** Standalone /auth pages — full dark card. */
export const AUTH_PAGE_SHELL =
  "bg-navy-900 rounded-2xl shadow-2xl border border-navy-700 p-5 sm:p-8 [&_label]:text-white/70 [&_input]:bg-navy-800 [&_input]:border-navy-600 [&_input]:text-white [&_input::placeholder]:text-white/30 [&_input:focus]:border-brand-600";

/** Modal — flat on cream panel, no nested card. */
export const AUTH_MODAL_FIELD =
  "[&_label]:text-gray-700 [&_input]:h-10 [&_input]:rounded-lg [&_input]:border-gray-200 [&_input]:bg-white [&_input]:text-navy-900 [&_input]:shadow-sm [&_input]:placeholder:text-gray-400 [&_input:focus-visible]:border-brand-500 [&_input:focus-visible]:ring-brand-500/25";

export function authFormWrap(embedded?: boolean) {
  return embedded ? "w-full" : "w-full max-w-md mx-auto";
}

export function authFormShell(embedded?: boolean) {
  return embedded ? cn("w-full", AUTH_MODAL_FIELD) : AUTH_PAGE_SHELL;
}

export const authMutedText = (embedded?: boolean) =>
  embedded ? "text-gray-500" : "text-white/50";

export const authLinkText = (embedded?: boolean) =>
  embedded ?
    "text-brand-600 hover:text-brand-700 font-medium"
  : "text-brand-400 hover:text-brand-300 font-medium";

export const authGhostBtn = (embedded?: boolean) =>
  embedded ?
    "text-sm text-gray-500 hover:text-navy-900 transition-colors"
  : "text-sm text-white/40 hover:text-white/70";
