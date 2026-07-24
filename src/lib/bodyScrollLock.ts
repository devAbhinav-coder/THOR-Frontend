/**
 * Reference-counted body scroll lock.
 * Nested modals / popups must not restore overflow:hidden over each other
 * (classic “page frozen after closing login” on mobile).
 */

let lockCount = 0;
let savedScrollY = 0;
let usedFixedLock = false;

function isCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

export function lockBodyScroll(): void {
  if (typeof document === "undefined") return;
  lockCount += 1;
  if (lockCount !== 1) return;

  const html = document.documentElement;
  savedScrollY =
    window.scrollY || window.pageYOffset || html.scrollTop || 0;

  html.style.overflow = "hidden";
  document.body.style.overflow = "hidden";

  // iOS / mobile: overflow:hidden alone often fails — pin the body.
  usedFixedLock = isCoarsePointer();
  if (usedFixedLock) {
    document.body.style.position = "fixed";
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
  }
}

export function unlockBodyScroll(): void {
  if (typeof document === "undefined") return;
  if (lockCount === 0) return;
  lockCount -= 1;
  if (lockCount !== 0) return;

  releaseScrollStyles();
}

/** Emergency clear (e.g. auth modal dismissed while another lock raced). */
export function forceUnlockBodyScroll(): void {
  if (typeof document === "undefined") return;
  lockCount = 0;
  releaseScrollStyles();
}

function releaseScrollStyles(): void {
  const html = document.documentElement;
  html.style.removeProperty("overflow");
  document.body.style.removeProperty("overflow");

  if (usedFixedLock) {
    document.body.style.removeProperty("position");
    document.body.style.removeProperty("top");
    document.body.style.removeProperty("left");
    document.body.style.removeProperty("right");
    document.body.style.removeProperty("width");
    window.scrollTo(0, savedScrollY);
  }
  usedFixedLock = false;
}
