/**
 * Pre-checkout transition for Buy Now / Cart checkout.
 * Heritage-styled modal; cleared when checkout page mounts.
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
  const durationMs = prefersReducedMotion ? 200 : 540;

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
  veil.style.background = "rgba(20, 25, 47, 0.62)";
  veil.style.backdropFilter = "blur(8px)";
  veil.style.setProperty("-webkit-backdrop-filter", "blur(8px)");
  veil.style.opacity = "0";

  const card = document.createElement("div");
  card.style.position = "fixed";
  card.style.left = "50%";
  card.style.top = "50%";
  card.style.transform = "translate(-50%, -50%) scale(0.97)";
  card.style.width = "min(92vw, 22rem)";
  card.style.border = "1px solid rgba(197, 160, 89, 0.28)";
  card.style.background = "#ffffff";
  card.style.padding = "0";
  card.style.boxShadow = "0 24px 48px rgba(3, 22, 50, 0.16)";
  card.style.opacity = "0";
  card.style.overflow = "hidden";

  const accent = document.createElement("div");
  accent.style.height = "3px";
  accent.style.background =
    "linear-gradient(90deg, #14192f, #c5a059, #14192f)";
  card.appendChild(accent);

  const inner = document.createElement("div");
  inner.style.padding = "1.5rem 1.35rem 1.35rem";

  if (options?.gifSrc) {
    const gifWrap = document.createElement("div");
    gifWrap.style.width = "4.5rem";
    gifWrap.style.height = "4.5rem";
    gifWrap.style.margin = "0 auto 0.85rem";
    gifWrap.style.overflow = "hidden";
    gifWrap.style.border = "1px solid rgba(197, 160, 89, 0.22)";

    const gif = document.createElement("img");
    gif.src = options.gifSrc;
    gif.alt = "Opening checkout";
    gif.style.width = "100%";
    gif.style.height = "100%";
    gif.style.objectFit = "cover";
    gifWrap.appendChild(gif);
    inner.appendChild(gifWrap);
  }

  const eyebrow = document.createElement("p");
  eyebrow.textContent = "The House of Rani";
  eyebrow.style.margin = "0 0 0.35rem";
  eyebrow.style.fontSize = "10px";
  eyebrow.style.fontWeight = "600";
  eyebrow.style.letterSpacing = "0.18em";
  eyebrow.style.textTransform = "uppercase";
  eyebrow.style.textAlign = "center";
  eyebrow.style.color = "#c5a059";

  const title = document.createElement("p");
  title.textContent = "Opening Checkout";
  title.style.margin = "0";
  title.style.fontFamily = "Georgia, 'Times New Roman', serif";
  title.style.fontSize = "1.2rem";
  title.style.fontWeight = "600";
  title.style.textAlign = "center";
  title.style.color = "#14192f";

  const desc = document.createElement("p");
  desc.textContent = "Securing your bag and loading checkout…";
  desc.style.margin = "0.5rem 0 0";
  desc.style.fontSize = "12px";
  desc.style.lineHeight = "1.45";
  desc.style.textAlign = "center";
  desc.style.color = "#6b7280";

  const track = document.createElement("div");
  track.style.marginTop = "1rem";
  track.style.height = "3px";
  track.style.width = "100%";
  track.style.overflow = "hidden";
  track.style.background = "#f3f4f6";

  const bar = document.createElement("div");
  bar.style.height = "100%";
  bar.style.width = "0%";
  bar.style.background = "linear-gradient(90deg, #14192f, #c5a059, #14192f)";
  track.appendChild(bar);

  inner.appendChild(eyebrow);
  inner.appendChild(title);
  inner.appendChild(desc);
  inner.appendChild(track);
  card.appendChild(inner);
  root.appendChild(veil);
  root.appendChild(card);
  body.appendChild(root);

  const staleTimer = window.setTimeout(() => {
    root.remove();
  }, 7000);
  root.setAttribute("data-stale-timer", String(staleTimer));

  try {
    veil.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: Math.max(140, durationMs - 90),
      easing: "ease-out",
      fill: "forwards",
    });
    card.animate(
      [
        { opacity: 0, transform: "translate(-50%, -50%) scale(0.97)" },
        { opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
      ],
      {
        duration: Math.max(170, durationMs),
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards",
      },
    );
    bar.animate([{ width: "0%" }, { width: "100%" }], {
      duration: Math.max(150, durationMs),
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "forwards",
    });
    await new Promise((resolve) => window.setTimeout(resolve, durationMs));
  } catch {
    root.remove();
  }
}
