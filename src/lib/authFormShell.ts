import { cn } from "@/lib/utils";
import {
  authGhostLink,
  authHeritageBtn,
  authLinkGold,
  authMutedCopy,
} from "@/lib/authHeritageTheme";

/** Standalone /auth pages — full dark heritage card. */
export const AUTH_PAGE_SHELL =
  "rounded-none border border-navy-700/80 bg-navy-900 p-5 shadow-2xl sm:p-8";

/** Modal — flat on cream panel; AuthField handles inputs. */
export const AUTH_MODAL_FIELD = "w-full";

export function authFormWrap(embedded?: boolean) {
  return embedded ? "w-full" : "w-full max-w-md mx-auto";
}

export function authFormShell(embedded?: boolean) {
  return embedded ? AUTH_MODAL_FIELD : AUTH_PAGE_SHELL;
}

export const authMutedText = authMutedCopy;

export const authLinkText = authLinkGold;

export const authGhostBtn = authGhostLink;

export const authPrimaryBtn = (className?: string) =>
  cn(authHeritageBtn, "w-full", className);

export { authHeritageBtn };
