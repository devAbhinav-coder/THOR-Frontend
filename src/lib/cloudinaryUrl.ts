/**
 * Fix Cloudinary URLs missing `image/upload` (legacy / hand-edited DB values),
 * and inject `f_auto,q_auto` (and optional width / crop) so the browser receives
 * AVIF/WebP at the right size. Without this transformation, Cloudinary serves
 * the original (often 1–4 MB) bytes which destroys LCP and TBT.
 *
 * Lighthouse "Improve image delivery" was ~1.9 MB savings on the home page
 * because all hero / category / product images were delivered unoptimized.
 */

/** A Cloudinary transformation segment looks like `f_auto`, `q_auto:good`,
 *  `w_400`, `c_limit`, etc. — one or more comma-separated tokens, each
 *  containing `_`. We use this to detect whether a URL already has them. */
const TRANSFORM_SEGMENT_RE = /(^|,)([a-z]{1,3}_[^,/]+)(,|$)/i;

function isTransformationSegment(segment: string): boolean {
  if (!segment) return false;
  return segment.split(",").every((token) => TRANSFORM_SEGMENT_RE.test(token));
}

type CloudinaryOpts = {
  /** Target rendered width in CSS pixels (we add 1.5x DPR upscale). */
  width?: number;
  /** "limit" (default) keeps aspect; "fill" / "fit" / "scale" also supported. */
  crop?: "limit" | "fill" | "fit" | "scale";
  /** Override quality. Defaults to `auto` (Cloudinary picks). */
  quality?: number | "auto";
};

function buildAutoTransform(opts: CloudinaryOpts = {}): string {
  const parts: string[] = ["f_auto"];
  if (opts.quality === "auto" || opts.quality == null) {
    parts.push("q_auto");
  } else {
    parts.push(`q_${opts.quality}`);
  }
  if (opts.width && opts.width > 0) {
    // 1.5x upscale covers DPR ≈ 1.5–2 retina screens without doubling bytes.
    const w = Math.round(opts.width * 1.5);
    parts.push(`w_${w}`);
    parts.push(`c_${opts.crop || "limit"}`);
  }
  return parts.join(",");
}

export function normalizeCloudinaryDeliveryUrl(
  url: string | undefined | null,
  opts: CloudinaryOpts = {},
): string {
  if (url == null) return "";
  const trimmed = String(url).trim();
  if (!trimmed) return "";
  try {
    const u = new URL(trimmed);
    if (u.hostname !== "res.cloudinary.com") return trimmed;
    const segments = u.pathname.split("/").filter(Boolean);
    if (segments.length < 2) return trimmed;

    // Find `image|video|raw` resource segment so we work with both legacy
    // (no `image/upload` prefix) and standard Cloudinary URLs.
    const cloud = segments[0];
    let resourceIdx = -1;
    for (let i = 1; i < segments.length; i++) {
      const s = segments[i];
      if (s === "image" || s === "video" || s === "raw") {
        resourceIdx = i;
        break;
      }
    }

    let restSegments: string[];
    let resourceType = "image";
    if (resourceIdx === -1) {
      // Legacy: `<cloud>/<rest>` → coerce to `<cloud>/image/upload/<rest>`
      restSegments = ["upload", ...segments.slice(1)];
    } else {
      resourceType = segments[resourceIdx]!;
      restSegments = segments.slice(resourceIdx + 1);
    }

    if (restSegments.length === 0) return trimmed;

    // After `upload/`, check whether the next segment is already a
    // transformation block. If so, leave it alone (don't double-transform).
    const deliveryMode = restSegments[0]!; // "upload" | "fetch" | "private" | ...
    const after = restSegments.slice(1);

    if (after.length === 0) return trimmed;

    const firstAfter = after[0]!;
    const hasTransform = isTransformationSegment(firstAfter);

    const autoTransform = buildAutoTransform(opts);

    let newPath: string;
    if (hasTransform) {
      // Merge: only add tokens that aren't present yet so we never override
      // an explicit on-image transform an editor put in the URL.
      const existing = new Set(
        firstAfter.split(",").map((t) => t.split("_")[0]!.toLowerCase()),
      );
      const toAdd = autoTransform
        .split(",")
        .filter((t) => !existing.has(t.split("_")[0]!.toLowerCase()));
      const merged = toAdd.length
        ? `${firstAfter},${toAdd.join(",")}`
        : firstAfter;
      newPath = `/${cloud}/${resourceType}/${deliveryMode}/${merged}/${after
        .slice(1)
        .join("/")}`;
    } else {
      newPath = `/${cloud}/${resourceType}/${deliveryMode}/${autoTransform}/${after.join("/")}`;
    }

    u.pathname = newPath.replace(/\/+/g, "/");
    return u.toString();
  } catch {
    return trimmed;
  }
}

export function normalizeProductImages<T extends { url?: string }>(
  images: T[] | undefined,
): T[] {
  if (!images?.length) return images || [];
  return images.map((img) => ({
    ...img,
    url: normalizeCloudinaryDeliveryUrl(img.url) || img.url || "",
  }));
}

/** Convenience wrapper for components that know the rendered width. */
export function cloudinaryUrlAtWidth(
  url: string | undefined | null,
  width: number,
  crop: CloudinaryOpts["crop"] = "limit",
): string {
  return normalizeCloudinaryDeliveryUrl(url, { width, crop });
}
