/**
 * Fix Cloudinary URLs missing `image/upload` (legacy / hand-edited DB values).
 * Without this, `next/image` fetch fails and the optimizer returns 0 B.
 */
export function normalizeCloudinaryDeliveryUrl(
  url: string | undefined | null,
): string {
  if (url == null) return "";
  const trimmed = String(url).trim();
  if (!trimmed) return "";
  try {
    const u = new URL(trimmed);
    if (u.hostname !== "res.cloudinary.com") return trimmed;
    const segments = u.pathname.split("/").filter(Boolean);
    if (segments.length < 2) return trimmed;
    const resource = segments[1];
    if (
      resource === "image" ||
      resource === "video" ||
      resource === "raw"
    ) {
      return trimmed;
    }
    const cloud = segments[0];
    const rest = segments.slice(1).join("/");
    u.pathname = `/${cloud}/image/upload/${rest}`;
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
