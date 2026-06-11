/** Remap [[image:N]] and [[row:a,b]] indices after gallery reorder. */
export function remapImageMarkersInContent(
  content: string,
  remap: number[],
): string {
  let out = content.replace(/\[\[image:(\d+)\]\]/gi, (_, n) => {
    const old = Number(n);
    const neu = remap[old] ?? old;
    return `[[image:${neu}]]`;
  });
  out = out.replace(/\[\[row:([\d,\s]+)\]\]/gi, (_, nums) => {
    const indices = String(nums)
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n));
    return `[[row:${indices.map((i) => remap[i] ?? i).join(",")}]]`;
  });
  return out;
}

export function buildIndexRemap(
  length: number,
  from: number,
  to: number,
): number[] {
  const order = Array.from({ length }, (_, i) => i);
  const [item] = order.splice(from, 1);
  order.splice(to, 0, item);
  const remap = new Array<number>(length);
  order.forEach((oldIdx, newIdx) => {
    remap[oldIdx] = newIdx;
  });
  return remap;
}

export function insertMarkerAtCursor(
  content: string,
  marker: string,
  cursor: number,
): string {
  const before = content.slice(0, cursor);
  const after = content.slice(cursor);
  const pad = before.endsWith("\n") || before.length === 0 ? "" : "\n";
  return `${before}${pad}${marker}\n${after}`;
}

export function contentHasImageMarker(index: number, content: string): boolean {
  const rowRe = new RegExp(`\\[\\[row:[^\\]]*\\b${index}\\b`, "i");
  return (
    content.includes(`[[image:${index}]]`) || rowRe.test(content)
  );
}

function normalizeRowSignature(indices: number[]): string {
  return indices.slice().sort((a, b) => a - b).join(",");
}

export function contentHasRowMarker(indices: number[], content: string): boolean {
  const target = normalizeRowSignature(indices);
  const re = /\[\[row:([\d,\s]+)\]\]/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    const sig = match[1]
      .split(",")
      .map((s: string) => Number(s.trim()))
      .filter((n: number) => !Number.isNaN(n));
    if (normalizeRowSignature(sig) === target) return true;
  }
  return false;
}

/** Remove per-image markers superseded by a row marker. */
export function stripImageMarkersForIndices(
  content: string,
  indices: number[],
): string {
  let out = content;
  for (const idx of indices) {
    out = out.replace(new RegExp(`\\[\\[image:${idx}\\]\\]\\s*`, "gi"), "");
    out = out.replace(new RegExp(`\\s*\\[\\[image:${idx}\\]\\]`, "gi"), "");
  }
  return out;
}

export function insertUniqueMarker(
  content: string,
  marker: string,
  cursor: number,
): { content: string; added: boolean } {
  const rowMatch = marker.match(/^\[\[row:([\d,\s]+)\]\]$/i);
  if (rowMatch) {
    const indices = rowMatch[1]
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n));
    if (contentHasRowMarker(indices, content)) {
      return { content, added: false };
    }
    const cleaned = stripImageMarkersForIndices(content, indices);
    return {
      content: insertMarkerAtCursor(cleaned, marker, cursor),
      added: true,
    };
  }

  const imageMatch = marker.match(/^\[\[image:(\d+)\]\]$/i);
  if (imageMatch) {
    const idx = Number(imageMatch[1]);
    if (content.includes(`[[image:${idx}]]`)) {
      return { content, added: false };
    }
  }

  return { content: insertMarkerAtCursor(content, marker, cursor), added: true };
}
