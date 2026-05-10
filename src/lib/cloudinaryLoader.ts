/**
 * Custom next/image loader → re-routes Cloudinary delivery URLs through
 * Cloudinary's own transformation pipeline so the browser receives AVIF/WebP
 * at the requested rendered width.
 *
 * Why this matters:
 * - `next.config.js` has `images.unoptimized: true` (Vercel image quota was
 *   returning 402). With that flag, next/image emits the raw `src` as-is,
 *   so Cloudinary delivers full-resolution originals → 1.9 MB Lighthouse
 *   "Improve image delivery" savings.
 * - Cloudinary already runs a global CDN + AVIF/WebP encoder; we just need
 *   to inject `f_auto,q_auto,w_<n>,c_limit` into the URL path.
 * - Any non-Cloudinary URL (Unsplash fallbacks, local public/ assets) is
 *   passed through untouched so we don't break unrelated images.
 *
 * Used per-image via `<Image loader={cloudinaryLoader} ... />` because we
 * can't safely set `images.loader: 'custom'` globally (it would also try to
 * transform local /public PNGs that don't go through Cloudinary).
 */

type LoaderArgs = { src: string; width: number; quality?: number };

export default function cloudinaryLoader({
  src,
  width,
  quality,
}: LoaderArgs): string {
  if (!src) return src;

  // Pass-through for relative / local assets and non-Cloudinary hosts.
  if (
    src.startsWith("/") ||
    src.startsWith("data:") ||
    src.startsWith("blob:")
  ) {
    return src;
  }

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return src;
  }

  if (url.hostname !== "res.cloudinary.com") return src;

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 2) return src;

  const cloud = segments[0]!;
  // Find image|video|raw segment to support both legacy and standard URLs.
  let resourceIdx = -1;
  for (let i = 1; i < segments.length; i++) {
    const s = segments[i]!;
    if (s === "image" || s === "video" || s === "raw") {
      resourceIdx = i;
      break;
    }
  }

  let restSegments: string[];
  let resourceType = "image";
  if (resourceIdx === -1) {
    restSegments = ["upload", ...segments.slice(1)];
  } else {
    resourceType = segments[resourceIdx]!;
    restSegments = segments.slice(resourceIdx + 1);
  }
  if (restSegments.length === 0) return src;

  const deliveryMode = restSegments[0]!;
  const after = restSegments.slice(1);
  if (after.length === 0) return src;

  // Build the auto-transform — width is from next/image's srcset generator.
  const w = Math.max(16, Math.round(width));
  const q = quality && quality > 0 && quality <= 100 ? `q_${quality}` : "q_auto";
  const autoTransform = `f_auto,${q},w_${w},c_limit,dpr_auto`;

  // Merge with any existing transformation block instead of clobbering it.
  const TRANSFORM_TOKEN_RE = /^[a-z]{1,3}_[^,/]+$/i;
  const firstAfter = after[0]!;
  const isTransform = firstAfter
    .split(",")
    .every((t) => TRANSFORM_TOKEN_RE.test(t));

  let newPath: string;
  if (isTransform) {
    const existing = new Map<string, string>();
    firstAfter.split(",").forEach((tok) => {
      const key = tok.split("_")[0]!.toLowerCase();
      existing.set(key, tok);
    });
    autoTransform.split(",").forEach((tok) => {
      const key = tok.split("_")[0]!.toLowerCase();
      // Width from next/image always wins (we sized for the slot).
      if (key === "w" || key === "c" || key === "dpr") {
        existing.set(key, tok);
      } else if (!existing.has(key)) {
        existing.set(key, tok);
      }
    });
    const merged = Array.from(existing.values()).join(",");
    newPath = `/${cloud}/${resourceType}/${deliveryMode}/${merged}/${after
      .slice(1)
      .join("/")}`;
  } else {
    newPath = `/${cloud}/${resourceType}/${deliveryMode}/${autoTransform}/${after.join("/")}`;
  }

  url.pathname = newPath.replace(/\/+/g, "/");
  return url.toString();
}
