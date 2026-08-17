import { getCurrentScrollY } from "@/lib/scrollRestoration";

export type WindowScrollFrame = {
  y: number;
  delta: number;
};

type ScrollListener = (frame: WindowScrollFrame) => void;

const scrollListeners = new Set<ScrollListener>();
let lastScrollY = 0;
let scrollRaf = 0;
let scrollBound = false;

function emitScroll() {
  const y = getCurrentScrollY();
  const frame: WindowScrollFrame = { y, delta: y - lastScrollY };
  lastScrollY = y;
  for (const listener of Array.from(scrollListeners)) {
    listener(frame);
  }
}

function onWindowScroll() {
  cancelAnimationFrame(scrollRaf);
  scrollRaf = requestAnimationFrame(emitScroll);
}

function bindScroll() {
  if (scrollBound) return;
  scrollBound = true;
  lastScrollY = getCurrentScrollY();
  window.addEventListener("scroll", onWindowScroll, { passive: true });
}

function unbindScroll() {
  if (!scrollBound || scrollListeners.size > 0) return;
  scrollBound = false;
  cancelAnimationFrame(scrollRaf);
  window.removeEventListener("scroll", onWindowScroll);
}

/** One shared window scroll listener — subscribers share a single RAF read per frame. */
export function subscribeWindowScroll(listener: ScrollListener): () => void {
  scrollListeners.add(listener);
  bindScroll();
  listener({ y: lastScrollY, delta: 0 });
  return () => {
    scrollListeners.delete(listener);
    if (scrollListeners.size === 0) unbindScroll();
  };
}

type WheelListener = () => void;

const wheelListeners = new Set<WheelListener>();
let wheelBound = false;

function emitWheel() {
  for (const listener of Array.from(wheelListeners)) {
    listener();
  }
}

function bindWheel() {
  if (wheelBound) return;
  wheelBound = true;
  window.addEventListener("wheel", emitWheel, { passive: true });
  window.addEventListener("touchmove", emitWheel, { passive: true });
}

function unbindWheel() {
  if (!wheelBound || wheelListeners.size > 0) return;
  wheelBound = false;
  window.removeEventListener("wheel", emitWheel);
  window.removeEventListener("touchmove", emitWheel);
}

/** One shared wheel/touchmove listener for hover-pause guards on product cards. */
export function subscribeWheelScroll(listener: WheelListener): () => void {
  wheelListeners.add(listener);
  bindWheel();
  return () => {
    wheelListeners.delete(listener);
    if (wheelListeners.size === 0) unbindWheel();
  };
}
