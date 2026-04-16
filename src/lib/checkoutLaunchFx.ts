/**
 * Pre-checkout transition for Buy Now / Cart checkout.
 * Shows a cart GIF modal, then keeps it visible until next page mounts.
 */
export async function playCheckoutLaunchAnimation(
  sourceEl?: HTMLElement | null,
  options?: { gifSrc?: string },
): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  void sourceEl;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const durationMs = prefersReducedMotion ? 180 : 520;

  const body = document.body;
  body.querySelectorAll("[data-checkout-launch-fx='1']").forEach((node) => {
    node.remove();
  });

  const root = document.createElement("div");
  root.setAttribute("data-checkout-launch-fx", "1");
  root.style.position = "fixed";
  root.style.inset = "0";
  root.style.pointerEvents = "none";
  root.style.zIndex = "10060";

  const veil = document.createElement("div");
  veil.style.position = "absolute";
  veil.style.inset = "0";
  veil.style.background = "rgba(15,23,42,0.55)";
  veil.style.backdropFilter = "blur(6px)";
  veil.style.setProperty("-webkit-backdrop-filter", "blur(6px)");
  veil.style.opacity = "0";

  const card = document.createElement("div");
  card.style.position = "fixed";
  card.style.left = "50%";
  card.style.top = "34%";
  card.style.transform = "translate(-50%, -50%) scale(0.96)";
  card.style.width = "min(92vw, 340px)";
  card.style.borderRadius = "22px";
  card.style.border = "1px solid rgba(255,255,255,0.38)";
  card.style.background =
    "linear-gradient(170deg, rgba(255,255,255,0.97), rgba(248,250,252,0.94))";
  card.style.padding = "16px 18px";
  card.style.boxShadow = "0 20px 60px -24px rgba(15,23,42,0.45)";
  card.style.opacity = "0";

  if (options?.gifSrc) {
    const gifWrap = document.createElement("div");
    gifWrap.style.width = "86px";
    gifWrap.style.height = "86px";
    gifWrap.style.margin = "0 auto 12px";
    gifWrap.style.borderRadius = "16px";
    gifWrap.style.overflow = "hidden";
    gifWrap.style.border = "1px solid rgba(226,232,240,0.95)";
    gifWrap.style.boxShadow = "0 10px 24px -18px rgba(15,23,42,0.5)";

    const gif = document.createElement("img");
    gif.src = options.gifSrc;
    gif.alt = "Opening checkout";
    gif.style.width = "100%";
    gif.style.height = "100%";
    gif.style.objectFit = "cover";
    gifWrap.appendChild(gif);
    card.appendChild(gifWrap);
  }

  const title = document.createElement("p");
  title.textContent = "Opening checkout";
  title.style.margin = "0";
  title.style.fontSize = "14px";
  title.style.fontWeight = "800";
  title.style.letterSpacing = "0.04em";
  title.style.textTransform = "uppercase";
  title.style.textAlign = "center";
  title.style.color = "#b02a37";

  const desc = document.createElement("p");
  desc.textContent = "Securing your cart and loading checkout...";
  desc.style.margin = "6px 0 0";
  desc.style.fontSize = "12px";
  desc.style.lineHeight = "1.35";
  desc.style.textAlign = "center";
  desc.style.color = "rgba(51,65,85,0.9)";

  const track = document.createElement("div");
  track.style.marginTop = "12px";
  track.style.height = "5px";
  track.style.width = "100%";
  track.style.borderRadius = "999px";
  track.style.overflow = "hidden";
  track.style.background = "rgba(148,163,184,0.24)";

  const bar = document.createElement("div");
  bar.style.height = "100%";
  bar.style.width = "0%";
  bar.style.borderRadius = "999px";
  bar.style.background = "linear-gradient(90deg,#b02a37,#ef4444,#10b981)";
  track.appendChild(bar);

  card.appendChild(title);
  card.appendChild(desc);
  card.appendChild(track);
  root.appendChild(veil);
  root.appendChild(card);
  body.appendChild(root);

  // Auto-clean stale modal if navigation fails.
  const staleTimer = window.setTimeout(() => {
    root.remove();
  }, 7000);
  root.setAttribute("data-stale-timer", String(staleTimer));

  try {
    veil.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: Math.max(130, durationMs - 100),
      easing: "ease-out",
      fill: "forwards",
    });
    card.animate(
      [
        { opacity: 0, transform: "translate(-50%, -50%) scale(0.96)" },
        { opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
      ],
      {
        duration: Math.max(160, durationMs),
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards",
      },
    );
    bar.animate([{ width: "0%" }, { width: "100%" }], {
      duration: Math.max(140, durationMs),
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "forwards",
    });
    await new Promise((resolve) => window.setTimeout(resolve, durationMs));
    // Intentionally keep modal mounted; checkout page will clear it on mount.
  } catch {
    root.remove();
  }
}

