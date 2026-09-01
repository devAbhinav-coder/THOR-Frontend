/** Parse public Instagram reel/post URLs into a shortcode for embeds. */
export function parseInstagramReelShortcode(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  try {
    const url =
      /^https?:\/\//i.test(raw) ? new URL(raw) : new URL(`https://${raw}`);
    if (!url.hostname.includes("instagram.com")) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) =>
      ["reel", "reels", "p"].includes(p.toLowerCase()),
    );
    if (idx >= 0 && parts[idx + 1]) {
      const code = parts[idx + 1].split("?")[0];
      return code && /^[\w-]+$/.test(code) ? code : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function isValidInstagramReelUrl(input: string): boolean {
  return parseInstagramReelShortcode(input) != null;
}

export function instagramReelEmbedUrl(shortcode: string): string {
  return `https://www.instagram.com/reel/${encodeURIComponent(shortcode)}/embed/?hidecaption=1&autoplay=1`;
}

export function instagramReelWatchUrl(shortcode: string): string {
  return `https://www.instagram.com/reel/${encodeURIComponent(shortcode)}/`;
}

export function normalizeInstagramReelUrl(input: string): string | null {
  const shortcode = parseInstagramReelShortcode(input);
  if (!shortcode) return null;
  return instagramReelWatchUrl(shortcode);
}

export type MotionMediaKind = "video" | "reel" | "poster" | "none";

export function resolvePdpMotionMedia(input: {
  videoUrl?: string;
  reelUrl?: string;
  posterUrl?: string;
}): {
  kind: MotionMediaKind;
  videoUrl: string;
  reelShortcode: string | null;
  reelWatchUrl: string | null;
  reelEmbedUrl: string | null;
  posterUrl: string;
} {
  const videoUrl = input.videoUrl?.trim() || "";
  const reelRaw = input.reelUrl?.trim() || "";
  const posterUrl = input.posterUrl?.trim() || "";
  const reelShortcode = parseInstagramReelShortcode(reelRaw);

  if (videoUrl) {
    return {
      kind: "video",
      videoUrl,
      reelShortcode,
      reelWatchUrl: reelShortcode ? instagramReelWatchUrl(reelShortcode) : null,
      reelEmbedUrl: null,
      posterUrl,
    };
  }

  if (reelShortcode) {
    return {
      kind: "reel",
      videoUrl: "",
      reelShortcode,
      reelWatchUrl: instagramReelWatchUrl(reelShortcode),
      reelEmbedUrl: instagramReelEmbedUrl(reelShortcode),
      posterUrl,
    };
  }

  if (posterUrl) {
    return {
      kind: "poster",
      videoUrl: "",
      reelShortcode: null,
      reelWatchUrl: null,
      reelEmbedUrl: null,
      posterUrl,
    };
  }

  return {
    kind: "none",
    videoUrl: "",
    reelShortcode: null,
    reelWatchUrl: null,
    reelEmbedUrl: null,
    posterUrl: "",
  };
}
