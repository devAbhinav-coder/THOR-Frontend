export type PdpSizeGuideContent = {
  title: string;
  intro: string;
  rows: { size: string; detail: string }[];
  tips: string[];
};

export const PDP_SIZE_GUIDE_PRESETS: Record<
  string,
  { label: string; content: PdpSizeGuideContent }
> = {
  saree: {
    label: "Saree & drape",
    content: {
      title: "Saree & drape sizing",
      intro:
        "Most of our sarees are offered in free size with a standard drape length. Use the blouse measurements below if you plan tailoring.",
      rows: [
        { size: "Free Size", detail: "Saree length approx. 5.5 m · Blouse piece 0.8 m" },
        { size: "Blouse (typical)", detail: "Bust 32–42 in · Shoulder 14–16 in" },
        { size: "Petite frame", detail: "Prefer 5.25 m drape or pin pleats higher" },
        { size: "Tall frame", detail: "Standard 5.5 m works · extra fabric for pallu" },
      ],
      tips: [
        "Measure bust and shoulder for blouse tailoring.",
        "Between sizes for blouse? Choose the larger for comfort.",
        "Slight colour variation is normal for handloom weaves.",
      ],
    },
  },
  salwar: {
    label: "Salwar suit",
    content: {
      title: "Salwar suit sizing",
      intro:
        "Kurta and bottom measurements are in inches. Pick the size closest to your body measurements — local tailoring is common for a perfect fit.",
      rows: [
        { size: "S", detail: "Bust 32–34 · Waist 26–28 · Hip 34–36 · Kurta length 38 in" },
        { size: "M", detail: "Bust 34–36 · Waist 28–30 · Hip 36–38 · Kurta length 40 in" },
        { size: "L", detail: "Bust 36–38 · Waist 30–32 · Hip 38–40 · Kurta length 42 in" },
        { size: "XL", detail: "Bust 38–40 · Waist 32–34 · Hip 40–42 · Kurta length 42 in" },
        { size: "2XL", detail: "Bust 40–42 · Waist 34–36 · Hip 42–44 · Kurta length 44 in" },
      ],
      tips: [
        "Measure bust, waist, and hip over light innerwear.",
        "Salwar / palazzo length can be altered easily at a local tailor.",
        "Prefer a relaxed fit? Size up one.",
      ],
    },
  },
  fitted: {
    label: "Fitted (S–2XL)",
    content: {
      title: "Fitted garment sizing",
      intro: "Compare your body measurements with the chart below. Sizes are in inches.",
      rows: [
        { size: "S", detail: "Bust 32–34 · Waist 26–28" },
        { size: "M", detail: "Bust 34–36 · Waist 28–30" },
        { size: "L", detail: "Bust 36–38 · Waist 30–32" },
        { size: "XL", detail: "Bust 38–40 · Waist 32–34" },
        { size: "2XL", detail: "Bust 40–42 · Waist 34–36" },
      ],
      tips: [
        "Measure over light innerwear, tape parallel to the floor.",
        "If between two sizes, size up for a relaxed fit.",
      ],
    },
  },
  generic: {
    label: "Generic",
    content: {
      title: "Size guide",
      intro: "Compare your measurements with the chart below before ordering.",
      rows: [
        { size: "S", detail: "Bust 32–34 · Waist 26–28" },
        { size: "M", detail: "Bust 34–36 · Waist 28–30" },
        { size: "L", detail: "Bust 36–38 · Waist 30–32" },
        { size: "XL", detail: "Bust 38–40 · Waist 32–34" },
      ],
      tips: [
        "Compare your measurements with the size chart before ordering.",
        "Need help? Chat with us on the support page.",
      ],
    },
  },
};

export function sizeGuideRowsToText(rows: { size: string; detail: string }[]): string {
  return rows.map((r) => `${r.size} | ${r.detail}`).join("\n");
}

export function sizeGuideRowsFromText(text: string): { size: string; detail: string }[] {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const sep = line.indexOf("|");
      if (sep === -1) return { size: line, detail: "" };
      return {
        size: line.slice(0, sep).trim(),
        detail: line.slice(sep + 1).trim(),
      };
    })
    .filter((r) => r.size);
}
