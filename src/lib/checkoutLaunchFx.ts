/**
 * Lightweight UI transition used before navigating to checkout.
 * Creates a small "flying orb" from source button to top-right.
 */
export async function playCheckoutLaunchAnimation(
  sourceEl?: HTMLElement | null,
): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const startRect = sourceEl?.getBoundingClientRect();
  const startX = startRect ? startRect.left + startRect.width / 2 : window.innerWidth / 2;
  const startY = startRect ? startRect.top + startRect.height / 2 : window.innerHeight * 0.75;
  const targetX = window.innerWidth - 24;
  const targetY = 24;

  const veil = document.createElement("div");
  veil.style.position = "fixed";
  veil.style.inset = "0";
  veil.style.pointerEvents = "none";
  veil.style.zIndex = "9999";
  veil.style.background =
    "radial-gradient(circle at 35% 80%, rgba(176,42,55,0.12), transparent 58%)";

  const orb = document.createElement("div");
  orb.style.position = "fixed";
  orb.style.left = `${startX - 8}px`;
  orb.style.top = `${startY - 8}px`;
  orb.style.width = "16px";
  orb.style.height = "16px";
  orb.style.borderRadius = "9999px";
  orb.style.background = "linear-gradient(135deg,#b02a37,#ef4444)";
  orb.style.boxShadow = "0 6px 20px rgba(176,42,55,0.45)";

  document.body.appendChild(veil);
  document.body.appendChild(orb);

  try {
    const orbAnim = orb.animate(
      [
        { transform: "translate(0,0) scale(1)", opacity: 1, offset: 0 },
        { transform: "translate(0,-12px) scale(1.1)", opacity: 1, offset: 0.2 },
        {
          transform: `translate(${targetX - startX}px, ${targetY - startY}px) scale(0.35)`,
          opacity: 0.85,
          offset: 1,
        },
      ],
      { duration: 520, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" },
    );
    const veilAnim = veil.animate(
      [
        { opacity: 0 },
        { opacity: 1, offset: 0.35 },
        { opacity: 0.15, offset: 1 },
      ],
      { duration: 520, easing: "ease-out", fill: "forwards" },
    );

    await Promise.all([orbAnim.finished, veilAnim.finished]);
  } catch {
    // no-op: transition is purely cosmetic
  } finally {
    orb.remove();
    veil.remove();
  }
}

