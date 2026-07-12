/** Shared color key for variant ↔ image matching (case-insensitive). */
export function normProductColor(value: string | undefined | null): string {
  return String(value ?? "").trim().toLowerCase();
}

export function colorsMatch(
  a: string | undefined | null,
  b: string | undefined | null,
): boolean {
  const ak = normProductColor(a);
  const bk = normProductColor(b);
  if (!ak || !bk) return false;
  return ak === bk;
}

/** Images belonging to a color group (for admin hydrate). */
export function imagesForProductColor(
  images: { color?: string; publicId?: string; url?: string }[],
  colorKey: string,
): typeof images {
  const key = normProductColor(colorKey);
  if (!key || colorKey === "Default") {
    return images.filter((img) => !normProductColor(img.color));
  }
  return images.filter((img) => colorsMatch(img.color, colorKey));
}

/**
 * Untagged images: single-color → attach to that group.
 * Multi-color → ALL untagged go to first group only (never spread to other colors).
 */
export function distributeUntaggedProductImages<
  T extends { existingImages: { publicId?: string; color?: string }[] },
>(groups: T[], untagged: T["existingImages"]): T[] {
  if (!untagged.length || !groups.length) return groups;

  const next = groups.map((g) => ({
    ...g,
    existingImages: [...g.existingImages],
  }));

  if (next.length === 1) {
    const seen = new Set(next[0].existingImages.map((i) => i.publicId));
    for (const img of untagged) {
      if (!seen.has(img.publicId)) next[0].existingImages.push(img);
    }
    return next;
  }

  const seen = new Set(next[0].existingImages.map((i) => i.publicId));
  for (const img of untagged) {
    if (!seen.has(img.publicId)) next[0].existingImages.push(img);
  }

  return next;
}

export function countUntaggedImages(
  images: { color?: string }[] | undefined,
): number {
  return (images ?? []).filter((img) => !normProductColor(img.color)).length;
}
