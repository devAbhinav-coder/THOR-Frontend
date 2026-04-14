/**
 * Premium pre-checkout transition used before navigation.
 * Works for both Buy Now and Proceed to Checkout triggers.
 */
export async function playCheckoutLaunchAnimation(
  sourceEl?: HTMLElement | null,
): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const durationMs = prefersReducedMotion ? 180 : 640;
  const body = document.body;
  const startRect =
    sourceEl && sourceEl.isConnected ? sourceEl.getBoundingClientRect() : null;
  const startX = startRect ?
      startRect.left + startRect.width / 2
    : window.innerWidth / 2;
  const startY = startRect ?
      startRect.top + startRect.height / 2
    : window.innerHeight * 0.72;

  const root = document.createElement("div");
  root.setAttribute("data-checkout-launch-fx", "1");
  root.style.position = "fixed";
  root.style.inset = "0";
  root.style.pointerEvents = "none";
  root.style.zIndex = "10060";

  const veil = document.createElement("div");
  veil.style.position = "absolute";
  veil.style.inset = "0";
  veil.style.background =
    "radial-gradient(130% 110% at 25% 90%, rgba(196,18,48,0.2), rgba(20,25,47,0.2) 42%, rgba(15,23,42,0.12) 65%, rgba(15,23,42,0.04) 100%)";
  veil.style.opacity = "0";

  const card = document.createElement("div");
  card.style.position = "fixed";
  card.style.left = "50%";
  card.style.top = "34%";
  card.style.transform = "translate(-50%, -50%) scale(0.94)";
  card.style.width = "min(92vw, 320px)";
  card.style.borderRadius = "20px";
  card.style.border = "1px solid rgba(255,255,255,0.5)";
  card.style.background =
    "linear-gradient(170deg, rgba(255,255,255,0.97), rgba(248,250,252,0.93))";
  card.style.backdropFilter = "blur(8px)";
  card.style.setProperty("-webkit-backdrop-filter", "blur(8px)");
  card.style.padding = "16px 18px";
  card.style.boxShadow = "0 20px 60px -24px rgba(15,23,42,0.45)";
  card.style.opacity = "0";

  const row = document.createElement("div");
  row.style.display = "flex";
  row.style.alignItems = "center";
  row.style.gap = "12px";

  const iconWrap = document.createElement("div");
  iconWrap.style.width = "34px";
  iconWrap.style.height = "34px";
  iconWrap.style.borderRadius = "999px";
  iconWrap.style.background =
    "linear-gradient(135deg, rgba(196,18,48,0.14), rgba(16,185,129,0.16))";
  iconWrap.style.display = "grid";
  iconWrap.style.placeItems = "center";
  iconWrap.style.flexShrink = "0";
  iconWrap.style.boxShadow = "inset 0 0 0 1px rgba(196,18,48,0.16)";

  const iconDot = document.createElement("div");
  iconDot.style.width = "12px";
  iconDot.style.height = "12px";
  iconDot.style.borderRadius = "999px";
  iconDot.style.background = "linear-gradient(135deg, #c41230, #ef4444)";
  iconDot.style.boxShadow = "0 0 0 0 rgba(196,18,48,0.42)";
  iconWrap.appendChild(iconDot);

  const textWrap = document.createElement("div");
  textWrap.style.minWidth = "0";

  const title = document.createElement("p");
  title.textContent = "Packing your order";
  title.style.margin = "0";
  title.style.fontSize = "14px";
  title.style.fontWeight = "700";
  title.style.lineHeight = "1.2";
  title.style.color = "#0f172a";

  const desc = document.createElement("p");
  desc.textContent = "Securing your bag and opening checkout...";
  desc.style.margin = "3px 0 0";
  desc.style.fontSize = "12px";
  desc.style.lineHeight = "1.35";
  desc.style.color = "rgba(51,65,85,0.9)";

  const track = document.createElement("div");
  track.style.marginTop = "12px";
  track.style.height = "4px";
  track.style.width = "100%";
  track.style.borderRadius = "999px";
  track.style.overflow = "hidden";
  track.style.background = "rgba(148,163,184,0.24)";

  const bar = document.createElement("div");
  bar.style.height = "100%";
  bar.style.width = "0%";
  bar.style.borderRadius = "999px";
  bar.style.background = "linear-gradient(90deg,#c41230,#ef4444,#10b981)";
  track.appendChild(bar);

  textWrap.appendChild(title);
  textWrap.appendChild(desc);
  row.appendChild(iconWrap);
  row.appendChild(textWrap);
  card.appendChild(row);

  const scene = document.createElement("div");
  scene.style.position = "relative";
  scene.style.marginTop = "12px";
  scene.style.height = "74px";
  scene.style.borderRadius = "14px";
  scene.style.overflow = "hidden";
  scene.style.background =
    "linear-gradient(180deg, rgba(248,250,252,0.9), rgba(241,245,249,0.85))";
  scene.style.border = "1px solid rgba(226,232,240,0.95)";

  const sceneGlow = document.createElement("div");
  sceneGlow.style.position = "absolute";
  sceneGlow.style.left = "50%";
  sceneGlow.style.bottom = "8px";
  sceneGlow.style.width = "90px";
  sceneGlow.style.height = "20px";
  sceneGlow.style.transform = "translateX(-50%)";
  sceneGlow.style.borderRadius = "999px";
  sceneGlow.style.background = "rgba(15,23,42,0.08)";
  sceneGlow.style.filter = "blur(8px)";

  const bag = document.createElement("div");
  bag.style.position = "absolute";
  bag.style.left = "50%";
  bag.style.bottom = "12px";
  bag.style.width = "44px";
  bag.style.height = "34px";
  bag.style.transform = "translateX(-50%)";
  bag.style.borderRadius = "10px 10px 12px 12px";
  bag.style.background = "linear-gradient(180deg, #f8fafc, #e2e8f0)";
  bag.style.border = "1.5px solid rgba(71,85,105,0.32)";
  bag.style.boxShadow = "0 7px 15px -10px rgba(15,23,42,0.4)";

  const bagHandle = document.createElement("div");
  bagHandle.style.position = "absolute";
  bagHandle.style.left = "50%";
  bagHandle.style.top = "-11px";
  bagHandle.style.width = "24px";
  bagHandle.style.height = "14px";
  bagHandle.style.transform = "translateX(-50%)";
  bagHandle.style.border = "2px solid rgba(71,85,105,0.42)";
  bagHandle.style.borderBottom = "0";
  bagHandle.style.borderRadius = "12px 12px 0 0";
  bagHandle.style.background = "transparent";

  const bagStripe = document.createElement("div");
  bagStripe.style.position = "absolute";
  bagStripe.style.left = "50%";
  bagStripe.style.top = "11px";
  bagStripe.style.width = "20px";
  bagStripe.style.height = "4px";
  bagStripe.style.transform = "translateX(-50%)";
  bagStripe.style.borderRadius = "999px";
  bagStripe.style.background = "linear-gradient(90deg, #c41230, #ef4444)";
  bagStripe.style.opacity = "0.8";

  const parcel = document.createElement("div");
  parcel.style.position = "absolute";
  parcel.style.left = "50%";
  parcel.style.top = "4px";
  parcel.style.width = "17px";
  parcel.style.height = "17px";
  parcel.style.transform = "translateX(-50%)";
  parcel.style.borderRadius = "4px";
  parcel.style.background = "linear-gradient(145deg, #f59e0b, #f97316)";
  parcel.style.border = "1px solid rgba(146,64,14,0.3)";
  parcel.style.boxShadow = "0 10px 20px -12px rgba(217,119,6,0.55)";

  const parcelSeal = document.createElement("div");
  parcelSeal.style.position = "absolute";
  parcelSeal.style.left = "50%";
  parcelSeal.style.top = "0";
  parcelSeal.style.width = "3px";
  parcelSeal.style.height = "100%";
  parcelSeal.style.transform = "translateX(-50%)";
  parcelSeal.style.background = "rgba(120,53,15,0.36)";
  parcel.appendChild(parcelSeal);

  const bagTick = document.createElement("div");
  bagTick.style.position = "absolute";
  bagTick.style.left = "50%";
  bagTick.style.top = "46%";
  bagTick.style.width = "16px";
  bagTick.style.height = "16px";
  bagTick.style.transform = "translate(-50%, -50%) scale(0.6)";
  bagTick.style.borderRadius = "999px";
  bagTick.style.background = "linear-gradient(135deg,#10b981,#22c55e)";
  bagTick.style.color = "#ffffff";
  bagTick.style.fontSize = "11px";
  bagTick.style.fontWeight = "700";
  bagTick.style.display = "grid";
  bagTick.style.placeItems = "center";
  bagTick.style.opacity = "0";
  bagTick.textContent = "✓";

  bag.appendChild(bagHandle);
  bag.appendChild(bagStripe);
  bag.appendChild(bagTick);
  scene.appendChild(sceneGlow);
  scene.appendChild(parcel);
  scene.appendChild(bag);
  card.appendChild(scene);
  card.appendChild(track);

  const orb = document.createElement("div");
  orb.style.position = "fixed";
  orb.style.left = `${startX - 8}px`;
  orb.style.top = `${startY - 8}px`;
  orb.style.width = "16px";
  orb.style.height = "16px";
  orb.style.borderRadius = "9999px";
  orb.style.background = "linear-gradient(135deg,#c41230,#ef4444)";
  orb.style.boxShadow = "0 8px 26px rgba(196,18,48,0.5)";
  orb.style.opacity = "0";

  root.appendChild(veil);
  root.appendChild(card);
  root.appendChild(orb);
  body.querySelectorAll("[data-checkout-launch-fx='1']").forEach((node) => {
    node.remove();
  });
  body.appendChild(root);

  const awaitAnim = async (anim: Animation | undefined, timeoutMs: number) => {
    if (!anim) return;
    await Promise.race([
      anim.finished.catch(() => undefined),
      new Promise((resolve) => window.setTimeout(resolve, timeoutMs)),
    ]);
  };

  let textSwapTimer: number | null = null;
  try {
    const bagRect = bag.getBoundingClientRect();
    const targetX = bagRect.left + bagRect.width / 2;
    const targetY = bagRect.top + 10;

    const veilAnim = veil.animate(
      [
        { opacity: 0 },
        { opacity: 1, offset: 0.22 },
        { opacity: 0.2, offset: 1 },
      ],
      { duration: durationMs, easing: "ease-out", fill: "forwards" },
    );
    const cardAnim = card.animate(
      [
        { opacity: 0, transform: "translate(-50%, -50%) scale(0.94)" },
        { opacity: 1, transform: "translate(-50%, -50%) scale(1.02)", offset: 0.55 },
        { opacity: 0.98, transform: "translate(-50%, -50%) scale(1)", offset: 1 },
      ],
      {
        duration: durationMs,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards",
      },
    );
    const barAnim = bar.animate(
      [{ width: "0%" }, { width: "100%" }],
      {
        duration: Math.max(120, durationMs - 40),
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards",
      },
    );

    let orbAnim: Animation | undefined;
    let pulseAnim: Animation | undefined;
    let parcelAnim: Animation | undefined;
    let bagBounceAnim: Animation | undefined;
    let bagHandleAnim: Animation | undefined;
    let sceneGlowAnim: Animation | undefined;
    let bagTickAnim: Animation | undefined;
    if (!prefersReducedMotion) {
      orbAnim = orb.animate(
        [
          { opacity: 0, transform: "translate(0,0) scale(0.8)", offset: 0 },
          { opacity: 1, transform: "translate(0,-12px) scale(1.08)", offset: 0.2 },
          {
            opacity: 0.88,
            transform: `translate(${targetX - startX}px, ${targetY - startY}px) scale(0.3)`,
            offset: 1,
          },
        ],
        {
          duration: Math.max(240, durationMs - 40),
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards",
        },
      );
      pulseAnim = iconDot.animate(
        [
          { boxShadow: "0 0 0 0 rgba(196,18,48,0.42)" },
          { boxShadow: "0 0 0 10px rgba(196,18,48,0.06)", offset: 0.55 },
          { boxShadow: "0 0 0 0 rgba(196,18,48,0)" },
        ],
        {
          duration: durationMs,
          easing: "ease-out",
          fill: "forwards",
        },
      );
      parcelAnim = parcel.animate(
        [
          { transform: "translateX(-50%) translateY(-10px) scale(0.95)", opacity: 0, offset: 0 },
          { transform: "translateX(-50%) translateY(0) scale(1)", opacity: 1, offset: 0.2 },
          { transform: "translateX(-50%) translateY(26px) scale(1)", opacity: 1, offset: 0.62 },
          { transform: "translateX(-50%) translateY(31px) scale(0.94)", opacity: 0, offset: 1 },
        ],
        {
          duration: Math.max(260, durationMs - 40),
          easing: "cubic-bezier(0.25, 0.9, 0.35, 1)",
          fill: "forwards",
        },
      );
      bagBounceAnim = bag.animate(
        [
          { transform: "translateX(-50%) translateY(0)", offset: 0 },
          { transform: "translateX(-50%) translateY(0)", offset: 0.57 },
          { transform: "translateX(-50%) translateY(5px)", offset: 0.71 },
          { transform: "translateX(-50%) translateY(-2px)", offset: 0.84 },
          { transform: "translateX(-50%) translateY(0)", offset: 1 },
        ],
        {
          duration: Math.max(280, durationMs),
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards",
        },
      );
      bagHandleAnim = bagHandle.animate(
        [
          { transform: "translateX(-50%) rotate(0deg)", offset: 0 },
          { transform: "translateX(-50%) rotate(0deg)", offset: 0.62 },
          { transform: "translateX(-50%) rotate(-10deg)", offset: 0.76 },
          { transform: "translateX(-50%) rotate(8deg)", offset: 0.88 },
          { transform: "translateX(-50%) rotate(0deg)", offset: 1 },
        ],
        {
          duration: Math.max(280, durationMs),
          easing: "ease-out",
          fill: "forwards",
        },
      );
      sceneGlowAnim = sceneGlow.animate(
        [
          { opacity: 0.45, transform: "translateX(-50%) scale(0.85)", offset: 0 },
          { opacity: 0.85, transform: "translateX(-50%) scale(1.12)", offset: 0.72 },
          { opacity: 0.52, transform: "translateX(-50%) scale(1)", offset: 1 },
        ],
        {
          duration: Math.max(280, durationMs),
          easing: "ease-out",
          fill: "forwards",
        },
      );
      bagTickAnim = bagTick.animate(
        [
          { opacity: 0, transform: "translate(-50%, -50%) scale(0.6)", offset: 0 },
          { opacity: 0, transform: "translate(-50%, -50%) scale(0.6)", offset: 0.63 },
          { opacity: 1, transform: "translate(-50%, -50%) scale(1.08)", offset: 0.84 },
          { opacity: 1, transform: "translate(-50%, -50%) scale(1)", offset: 1 },
        ],
        {
          duration: Math.max(280, durationMs),
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards",
        },
      );
    }

    textSwapTimer = window.setTimeout(() => {
      title.textContent = "Bag ready";
      desc.textContent = "Taking you to secure checkout...";
    }, Math.max(110, Math.floor(durationMs * 0.62)));

    await Promise.all([
      awaitAnim(veilAnim, durationMs + 160),
      awaitAnim(cardAnim, durationMs + 160),
      awaitAnim(barAnim, durationMs + 220),
      awaitAnim(orbAnim, durationMs + 160),
      awaitAnim(pulseAnim, durationMs + 160),
      awaitAnim(parcelAnim, durationMs + 180),
      awaitAnim(bagBounceAnim, durationMs + 180),
      awaitAnim(bagHandleAnim, durationMs + 180),
      awaitAnim(sceneGlowAnim, durationMs + 180),
      awaitAnim(bagTickAnim, durationMs + 180),
    ]);
  } catch {
    // cosmetic transition only
  } finally {
    if (textSwapTimer) window.clearTimeout(textSwapTimer);
    root.remove();
  }
}

